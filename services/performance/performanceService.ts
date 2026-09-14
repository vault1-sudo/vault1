import {
  getUserTrades,
} from "../trading/tradeService";

import {
  calculateTradePnL,
  calculateTradeValue,
} from "../trading/tradeService";

import {
  Trade,
} from "../../types/trade";

import {
  PerformanceEvent,
  PerformanceSummary,
} from "../../types/performance";


/* =========================================================
   PERFORMANCE SUMMARY
   ========================================================= */

export async function getPerformanceSummary(
  userId: string
): Promise<PerformanceSummary> {

  const trades =
    await getUserTrades(
      userId
    );


  const openTrades =
    trades.filter(
      (trade) =>
        trade.status === "OPEN"
    );


  const closedTrades =
    trades.filter(
      (trade) =>
        trade.status === "CLOSED"
    );


  const pnlValues =
    closedTrades.map(
      (trade) =>
        calculateTradePnL(
          trade
        )
    );


  const winningPnLs =
    pnlValues.filter(
      (value) =>
        value > 0
    );


  const losingPnLs =
    pnlValues.filter(
      (value) =>
        value < 0
    );


  const realizedPnL =
    pnlValues.reduce(
      (total, value) =>
        total + value,
      0
    );


  const grossProfit =
    winningPnLs.reduce(
      (total, value) =>
        total + value,
      0
    );


  const grossLoss =
    losingPnLs.reduce(
      (total, value) =>
        total + Math.abs(value),
      0
    );


  const totalFees =
    trades.reduce(
      (total, trade) =>
        total + trade.fees,
      0
    );


  const averageWin =
    winningPnLs.length > 0
      ? grossProfit /
        winningPnLs.length
      : 0;


  const averageLoss =
    losingPnLs.length > 0
      ? grossLoss /
        losingPnLs.length
      : 0;


  const largestWin =
    winningPnLs.length > 0
      ? Math.max(
          ...winningPnLs
        )
      : 0;


  const largestLoss =
    losingPnLs.length > 0
      ? Math.min(
          ...losingPnLs
        )
      : 0;


  const profitFactor =
    grossLoss > 0
      ? grossProfit /
        grossLoss
      : grossProfit > 0
      ? Infinity
      : 0;


  const winRate =
    closedTrades.length > 0
      ? (
          winningPnLs.length /
          closedTrades.length
        ) * 100
      : 0;


  const exposure =
    openTrades.reduce(
      (total, trade) =>
        total +
        calculateTradeValue(
          trade
        ),
      0
    );


  return {
    totalPnL:
      realizedPnL,

    realizedPnL,

    unrealizedPnL:
      0,

    returnPercent:
      0,

    totalTrades:
      trades.length,

    openTrades:
      openTrades.length,

    closedTrades:
      closedTrades.length,

    winningTrades:
      winningPnLs.length,

    losingTrades:
      losingPnLs.length,

    winRate,

    averageWin,

    averageLoss,

    largestWin,

    largestLoss,

    grossProfit,

    grossLoss,

    profitFactor,

    totalFees,

    exposure,
  };
}


/* =========================================================
   PERFORMANCE EVENTS
   ========================================================= */

export async function getPerformanceEvents(
  userId: string
): Promise<PerformanceEvent[]> {

  const trades =
    await getUserTrades(
      userId
    );


  const events =
    trades
      .filter(
        (trade) =>
          trade.status ===
          "CLOSED"
      )
      .map(
        (
          trade: Trade
        ) => {

          const pnl =
            calculateTradePnL(
              trade
            );


          let type:
            | "PROFIT"
            | "LOSS"
            | "FEE"
            | "NEUTRAL";


          if (pnl > 0) {
            type = "PROFIT";
          } else if (
            pnl < 0
          ) {
            type = "LOSS";
          } else {
            type = "NEUTRAL";
          }


          const date =
            trade.createdAt?.toDate
              ? trade.createdAt
                  .toDate()
                  .toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  )
              : "RECENT";


          return {
            id:
              trade.id,

            date,

            label:
              `${trade.side} ${trade.asset}`,

            value:
              pnl,

            type,
          };
        }
      );


  return events;
}


/* =========================================================
   PERIOD FILTER
   ========================================================= */

export function filterPerformanceEvents(
  events: PerformanceEvent[],
  period:
    | "ALL"
    | "TODAY"
    | "WEEK"
    | "MONTH"
    | "YEAR"
) {

  if (
    period === "ALL"
  ) {
    return events;
  }


  const now =
    new Date();


  const start =
    new Date();


  if (
    period === "TODAY"
  ) {
    start.setHours(
      0,
      0,
      0,
      0
    );
  }


  if (
    period === "WEEK"
  ) {
    start.setDate(
      now.getDate() - 7
    );
  }


  if (
    period === "MONTH"
  ) {
    start.setMonth(
      now.getMonth() - 1
    );
  }


  if (
    period === "YEAR"
  ) {
    start.setFullYear(
      now.getFullYear() - 1
    );
  }


  return events.filter(
    (event) => {

      const eventDate =
        new Date(
          event.date
        );

      return (
        eventDate >= start
      );
    }
  );
}


/* =========================================================
   FORMAT PROFIT FACTOR
   ========================================================= */

export function formatProfitFactor(
  value: number
) {

  if (
    value === Infinity
  ) {
    return "∞";
  }


  return value.toFixed(
    2
  );
}