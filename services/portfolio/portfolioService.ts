import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  ClosedPosition,
  PortfolioData,
  PortfolioSummary,
  Position,
  PositionAssetClass,
} from "../../types/position";

import { Trade } from "../../types/trade";


type PositionAccumulator = {
  userId: string;

  symbol: string;
  name: string;

  quantity: number;

  totalCost: number;
  totalEntryQuantity: number;

  currentPrice: number;

  realizedPnL: number;
  totalFees: number;

  openedAt?: any;
  closedAt?: any;

  createdAt?: any;
  updatedAt?: any;

  closedQuantity: number;
  closedEntryValue: number;
  closedExitValue: number;
};


const TRADES_COLLECTION = "trades";


/* =========================================================
   HELPERS
========================================================= */

function getTradeTimestamp(
  value: any
): number {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value.seconds === "number"
  ) {
    return value.seconds * 1000;
  }

  return 0;
}


function normalizeSymbol(
  asset: string
): string {
  return asset.trim().toUpperCase();
}


function inferAssetClass(
  symbol: string
): PositionAssetClass {
  const value = symbol.toUpperCase();

  if (
    value.includes("BTC") ||
    value.includes("ETH") ||
    value.includes("USDT") ||
    value.includes("SOL")
  ) {
    return "CRYPTO";
  }

  if (
    value.includes("GOLD") ||
    value.includes("XAU")
  ) {
    return "GOLD";
  }

  if (
    value.includes("USD") ||
    value.includes("EUR") ||
    value.includes("GBP") ||
    value.includes("JPY")
  ) {
    return "FOREX";
  }

  if (
    value.includes("ETF")
  ) {
    return "ETF";
  }

  return "EQUITY";
}


function sortTradesChronologically(
  trades: Trade[]
): Trade[] {
  return [...trades].sort(
    (a: Trade, b: Trade) =>
      getTradeTimestamp(a.createdAt) -
      getTradeTimestamp(b.createdAt)
  );
}


/* =========================================================
   FIRESTORE
========================================================= */

export async function getUserTrades(
  userId: string
): Promise<Trade[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const tradesQuery = query(
    collection(db, TRADES_COLLECTION),
    where(
      "userId",
      "==",
      userId
    )
  );

  const snapshot =
    await getDocs(tradesQuery);

  const trades =
    snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as Trade
    );

  return trades.sort(
    (a: Trade, b: Trade) =>
      getTradeTimestamp(
        b.createdAt
      ) -
      getTradeTimestamp(
        a.createdAt
      )
  );
}


/* =========================================================
   POSITION ENGINE
========================================================= */

export function calculatePortfolioData(
  trades: Trade[]
): PortfolioData {
  const chronologicalTrades =
    sortTradesChronologically(trades);

  const accumulators =
    new Map<
      string,
      PositionAccumulator
    >();


  for (const trade of chronologicalTrades) {
    const symbol =
      normalizeSymbol(trade.asset);

    if (!symbol) {
      continue;
    }


    if (!accumulators.has(symbol)) {
      accumulators.set(symbol, {
        userId: trade.userId,

        symbol,
        name: symbol,

        quantity: 0,

        totalCost: 0,
        totalEntryQuantity: 0,

        currentPrice:
          trade.exitPrice ??
          trade.entryPrice,

        realizedPnL: 0,
        totalFees: 0,

        openedAt:
          trade.createdAt,

        closedAt:
          undefined,

        createdAt:
          trade.createdAt,

        updatedAt:
          trade.updatedAt ??
          trade.createdAt,

        closedQuantity: 0,
        closedEntryValue: 0,
        closedExitValue: 0,
      });
    }


    const position =
      accumulators.get(symbol)!;

    position.updatedAt =
      trade.updatedAt ??
      trade.createdAt;


    const quantity =
      Number(trade.quantity) || 0;

    const entryPrice =
      Number(trade.entryPrice) || 0;

    const fees =
      Number(trade.fees) || 0;


    position.totalFees += fees;


    /*
     * BUY
     *
     * Adds inventory to the position.
     */
    if (trade.side === "BUY") {
      position.quantity += quantity;

      position.totalCost +=
        quantity * entryPrice;

      position.totalEntryQuantity +=
        quantity;

      position.currentPrice =
        trade.exitPrice ??
        entryPrice;

      if (!position.openedAt) {
        position.openedAt =
          trade.createdAt;
      }

      continue;
    }


    /*
     * SELL
     *
     * Reduces the existing long position.
     */
    if (trade.side === "SELL") {
      if (
        position.quantity <= 0
      ) {
        continue;
      }


      const sellQuantity =
        Math.min(
          quantity,
          position.quantity
        );


      const averageCost =
        position.totalEntryQuantity >
        0
          ? position.totalCost /
            position.totalEntryQuantity
          : 0;


      const exitPrice =
        trade.exitPrice ??
        entryPrice;


      const grossRealizedPnL =
        (
          exitPrice -
          averageCost
        ) * sellQuantity;


      /*
       * Allocate fees to the SELL.
       *
       * The fee is charged against realized
       * P&L for the execution.
       */
      const realizedPnL =
        grossRealizedPnL -
        fees;


      position.realizedPnL +=
        realizedPnL;


      position.closedQuantity +=
        sellQuantity;

      position.closedEntryValue +=
        averageCost *
        sellQuantity;

      position.closedExitValue +=
        exitPrice *
        sellQuantity;


      position.quantity -=
        sellQuantity;


      position.totalCost -=
        averageCost *
        sellQuantity;


      position.totalEntryQuantity -=
        sellQuantity;


      position.currentPrice =
        exitPrice;


      if (
        position.quantity <=
        0.00000001
      ) {
        position.quantity = 0;

        position.totalCost = 0;

        position.totalEntryQuantity =
          0;

        position.closedAt =
          trade.createdAt;
      }
    }
  }


  const openPositions: Position[] =
    [];

  const closedPositions:
    ClosedPosition[] = [];


  for (const position of accumulators.values()) {
    const symbol =
      position.symbol;

    const assetClass =
      inferAssetClass(symbol);


    /*
     * OPEN POSITION
     */
    if (position.quantity > 0) {
      const averagePrice =
        position.totalEntryQuantity >
        0
          ? position.totalCost /
            position.totalEntryQuantity
          : 0;


      const investedValue =
        position.totalCost;


      const currentValue =
        position.quantity *
        position.currentPrice;


      const unrealizedPnL =
        currentValue -
        investedValue;


      const unrealizedPnLPercent =
        investedValue > 0
          ? (
              unrealizedPnL /
              investedValue
            ) * 100
          : 0;


      openPositions.push({
        id: symbol,

        userId:
          position.userId,

        symbol,

        name:
          position.name,

        assetClass,

        quantity:
          position.quantity,

        averagePrice,

        currentPrice:
          position.currentPrice,

        investedValue,

        currentValue,

        unrealizedPnL,

        unrealizedPnLPercent,

        realizedPnL:
          position.realizedPnL,

        totalFees:
          position.totalFees,

        status: "OPEN",

        openedAt:
          position.openedAt,

        closedAt:
          position.closedAt,

        createdAt:
          position.createdAt,

        updatedAt:
          position.updatedAt,
      });
    }


    /*
     * CLOSED POSITION
     *
     * A symbol can have both realized P&L
     * and no remaining quantity.
     */
    if (
      position.quantity <= 0 &&
      position.closedQuantity > 0
    ) {
      const averageEntryPrice =
        position.closedQuantity >
        0
          ? position.closedEntryValue /
            position.closedQuantity
          : 0;


      const averageExitPrice =
        position.closedQuantity >
        0
          ? position.closedExitValue /
            position.closedQuantity
          : 0;


      const investedValue =
        position.closedEntryValue;


      const exitValue =
        position.closedExitValue;


      const realizedPnL =
        position.realizedPnL;


      const realizedPnLPercent =
        investedValue > 0
          ? (
              realizedPnL /
              investedValue
            ) * 100
          : 0;


      closedPositions.push({
        id: symbol,

        userId:
          position.userId,

        symbol,

        name:
          position.name,

        assetClass,

        quantity:
          position.closedQuantity,

        averageEntryPrice,

        averageExitPrice,

        investedValue,

        exitValue,

        realizedPnL,

        realizedPnLPercent,

        totalFees:
          position.totalFees,

        status: "CLOSED",

        openedAt:
          position.openedAt,

        closedAt:
          position.closedAt,

        createdAt:
          position.createdAt,

        updatedAt:
          position.updatedAt,
      });
    }
  }


  openPositions.sort(
    (
      a: Position,
      b: Position
    ) =>
      b.currentValue -
      a.currentValue
  );


  closedPositions.sort(
    (
      a: ClosedPosition,
      b: ClosedPosition
    ) =>
      getTradeTimestamp(
        b.closedAt
      ) -
      getTradeTimestamp(
        a.closedAt
      )
  );


  const summary =
    calculatePortfolioSummary(
      openPositions,
      closedPositions
    );


  return {
    openPositions,
    closedPositions,
    summary,
  };
}


/* =========================================================
   USER PORTFOLIO
========================================================= */

export async function getUserPortfolio(
  userId: string
): Promise<PortfolioData> {
  const trades =
    await getUserTrades(userId);

  return calculatePortfolioData(
    trades
  );
}


/* =========================================================
   SUMMARY
========================================================= */

export function calculatePortfolioSummary(
  openPositions: Position[],
  closedPositions: ClosedPosition[]
): PortfolioSummary {
  const investedCapital =
    openPositions.reduce(
      (
        total: number,
        position: Position
      ) =>
        total +
        position.investedValue,
      0
    );


  const currentValue =
    openPositions.reduce(
      (
        total: number,
        position: Position
      ) =>
        total +
        position.currentValue,
      0
    );


  const realizedPnL =
    closedPositions.reduce(
      (
        total: number,
        position: ClosedPosition
      ) =>
        total +
        position.realizedPnL,
      0
    );


  /*
   * If a symbol was partially sold and still
   * remains open, its realized P&L is stored
   * on the open position.
   */
  const partialRealizedPnL =
    openPositions.reduce(
      (
        total: number,
        position: Position
      ) =>
        total +
        position.realizedPnL,
      0
    );


  const unrealizedPnL =
    openPositions.reduce(
      (
        total: number,
        position: Position
      ) =>
        total +
        position.unrealizedPnL,
      0
    );


  const totalFees =
    openPositions.reduce(
      (
        total: number,
        position: Position
      ) =>
        total +
        position.totalFees,
      0
    ) +
    closedPositions.reduce(
      (
        total: number,
        position: ClosedPosition
      ) =>
        total +
        position.totalFees,
      0
    );


  const completeRealizedPnL =
    realizedPnL +
    partialRealizedPnL;


  const totalPnL =
    completeRealizedPnL +
    unrealizedPnL;


  const returnBase =
    investedCapital;


  const returnPercent =
    returnBase > 0
      ? (
          totalPnL /
          returnBase
        ) * 100
      : 0;


  const totalExposure =
    currentValue;


  const winningOpenPositions =
    openPositions.filter(
      (position: Position) =>
        position.unrealizedPnL > 0
    ).length;


  const winningClosedPositions =
    closedPositions.filter(
      (
        position: ClosedPosition
      ) =>
        position.realizedPnL > 0
    ).length;


  const losingOpenPositions =
    openPositions.filter(
      (position: Position) =>
        position.unrealizedPnL < 0
    ).length;


  const losingClosedPositions =
    closedPositions.filter(
      (
        position: ClosedPosition
      ) =>
        position.realizedPnL < 0
    ).length;


  const winningPositions =
    winningOpenPositions +
    winningClosedPositions;


  const losingPositions =
    losingOpenPositions +
    losingClosedPositions;


  const completedPositions =
    winningPositions +
    losingPositions;


  const winRate =
    completedPositions > 0
      ? (
          winningPositions /
          completedPositions
        ) * 100
      : 0;


  return {
    investedCapital,

    currentValue,

    realizedPnL:
      completeRealizedPnL,

    unrealizedPnL,

    totalPnL,

    totalFees,

    returnPercent,

    positionCount:
      openPositions.length +
      closedPositions.length,

    openPositionCount:
      openPositions.length,

    closedPositionCount:
      closedPositions.length,

    totalExposure,

    winningPositions,

    losingPositions,

    winRate,
  };
}


/* =========================================================
   COMPATIBILITY HELPERS
========================================================= */

export function getUserPositions(
  userId: string
): Promise<Position[]> {
  return getUserPortfolio(userId).then(
    (portfolio) =>
      portfolio.openPositions
  );
}


export function calculatePositions(
  trades: Trade[]
): Position[] {
  return calculatePortfolioData(
    trades
  ).openPositions;
}