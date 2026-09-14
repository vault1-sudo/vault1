import {
  getUserTrades,
  calculateTradePnL,
  calculateTradeValue,
} from "../trading/tradeService";

import { getUserTransactions } from "../transactions/transactionService";

import {
  ReportBreakdownItem,
  ReportMonthlyItem,
  ReportPeriod,
  ReportSummary,
  ReportTradeItem,
} from "../../types/report";

import { Trade } from "../../types/trade";
import { Transaction } from "../../types/transaction";

function getTimestamp(value: any): number {
  if (
    value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    const parsed =
      new Date(value).getTime();

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function getTradeTimestamp(
  trade: Trade
): number {
  return getTimestamp(
    trade.createdAt
  );
}

function getTransactionTimestamp(
  transaction: Transaction
): number {
  return getTimestamp(
    transaction.createdAt
  );
}

function getPeriodStart(
  period: ReportPeriod
): number {
  const now = new Date();

  if (period === "ALL") {
    return 0;
  }

  if (period === "TODAY") {
    const start = new Date(now);

    start.setHours(
      0,
      0,
      0,
      0
    );

    return start.getTime();
  }

  if (period === "WEEK") {
    const start = new Date(now);

    start.setDate(
      now.getDate() - 7
    );

    return start.getTime();
  }

  if (period === "MONTH") {
    const start = new Date(now);

    start.setDate(
      now.getDate() - 30
    );

    return start.getTime();
  }

  if (period === "QUARTER") {
    const start = new Date(now);

    start.setDate(
      now.getDate() - 90
    );

    return start.getTime();
  }

  if (period === "YEAR") {
    const start = new Date(now);

    start.setDate(
      now.getDate() - 365
    );

    return start.getTime();
  }

  return 0;
}

function isWithinPeriod(
  timestamp: number,
  period: ReportPeriod
): boolean {
  if (period === "ALL") {
    return true;
  }

  const start =
    getPeriodStart(period);

  if (!timestamp) {
    return true;
  }

  return timestamp >= start;
}

function formatDate(
  timestamp: number
): string {
  if (!timestamp) {
    return "Unknown";
  }

  const date = new Date(
    timestamp
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getMonthKey(
  timestamp: number
): string {
  if (!timestamp) {
    return "Unknown";
  }

  const date = new Date(
    timestamp
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "numeric",
    }
  );
}

function buildTradeItem(
  trade: Trade
): ReportTradeItem {
  return {
    id: trade.id,
    asset: trade.asset,
    strategy: trade.strategy,
    side: trade.side,
    quantity: trade.quantity,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    value:
      calculateTradeValue(
        trade
      ),
    pnl:
      calculateTradePnL(
        trade
      ),
    fees: trade.fees,
    status: trade.status,
    date: formatDate(
      getTradeTimestamp(
        trade
      )
    ),
  };
}

function buildBreakdown(
  trades: Trade[],
  keyGetter: (
    trade: Trade
  ) => string,
  valueGetter: (
    trade: Trade
  ) => number
): ReportBreakdownItem[] {
  const buckets = new Map<
    string,
    {
      value: number;
      count: number;
    }
  >();

  trades.forEach((trade) => {
    const name =
      keyGetter(trade).trim() ||
      "UNASSIGNED";

    const current =
      buckets.get(name);

    const value =
      valueGetter(trade);

    if (current) {
      current.value += value;
      current.count += 1;
    } else {
      buckets.set(name, {
        value,
        count: 1,
      });
    }
  });

  const totalValue =
    Array.from(
      buckets.values()
    ).reduce(
      (total, item) =>
        total + Math.abs(
          item.value
        ),
      0
    );

  return Array.from(
    buckets.entries()
  )
    .map(
      ([name, item]) => ({
        name,
        value: item.value,
        percent:
          totalValue > 0
            ? (Math.abs(
                item.value
              ) /
                totalValue) *
              100
            : 0,
        count: item.count,
      })
    )
    .sort(
      (a, b) =>
        Math.abs(b.value) -
        Math.abs(a.value)
    );
}

function buildExposureBreakdown(
  trades: Trade[]
): ReportBreakdownItem[] {
  return buildBreakdown(
    trades.filter(
      (trade) =>
        trade.status === "OPEN"
    ),
    (trade) => trade.asset,
    (trade) =>
      calculateTradeValue(
        trade
      )
  );
}

function buildStrategyBreakdown(
  trades: Trade[]
): ReportBreakdownItem[] {
  return buildBreakdown(
    trades.filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    ),
    (trade) => trade.strategy,
    (trade) =>
      calculateTradePnL(
        trade
      )
  );
}

function buildMonthlyBreakdown(
  trades: Trade[]
): ReportMonthlyItem[] {
  const buckets = new Map<
    string,
    ReportMonthlyItem
  >();

  trades
    .filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    )
    .forEach((trade) => {
      const month =
        getMonthKey(
          getTradeTimestamp(
            trade
          )
        );

      const existing =
        buckets.get(month);

      const pnl =
        calculateTradePnL(
          trade
        );

      if (existing) {
        existing.trades += 1;

        if (pnl > 0) {
          existing.winningTrades +=
            1;
        }

        if (pnl < 0) {
          existing.losingTrades +=
            1;
        }

        existing.pnl += pnl;
        existing.fees +=
          trade.fees;
      } else {
        buckets.set(month, {
          month,
          trades: 1,
          winningTrades:
            pnl > 0 ? 1 : 0,
          losingTrades:
            pnl < 0 ? 1 : 0,
          pnl,
          fees: trade.fees,
        });
      }
    });

  return Array.from(
    buckets.values()
  ).sort(
    (a, b) => {
      const aDate =
        new Date(
          `1 ${a.month}`
        ).getTime();

      const bDate =
        new Date(
          `1 ${b.month}`
        ).getTime();

      return (
        aDate - bDate
      );
    }
  );
}

function getCapitalBase(
  transactions: Transaction[]
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.status ===
        "POSTED"
    )
    .reduce(
      (total, transaction) => {
        if (
          transaction.type ===
          "DEPOSIT"
        ) {
          return (
            total +
            Math.abs(
              transaction.amount
            )
          );
        }

        if (
          transaction.type ===
          "WITHDRAWAL"
        ) {
          return (
            total -
            Math.abs(
              transaction.amount
            )
          );
        }

        return total;
      },
      0
    );
}

export async function getReportSummary(
  userId: string,
  period: ReportPeriod = "ALL"
): Promise<ReportSummary> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const [
    allTrades,
    allTransactions,
  ] = await Promise.all([
    getUserTrades(userId),
    getUserTransactions(
      userId
    ),
  ]);

  const trades =
    allTrades.filter(
      (trade) =>
        isWithinPeriod(
          getTradeTimestamp(
            trade
          ),
          period
        )
    );

  const transactions =
    allTransactions.filter(
      (transaction) =>
        isWithinPeriod(
          getTransactionTimestamp(
            transaction
          ),
          period
        )
    );

  const openTrades =
    trades.filter(
      (trade) =>
        trade.status ===
        "OPEN"
    );

  const closedTrades =
    trades.filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    );

  const winningTrades =
    closedTrades.filter(
      (trade) =>
        calculateTradePnL(
          trade
        ) > 0
    );

  const losingTrades =
    closedTrades.filter(
      (trade) =>
        calculateTradePnL(
          trade
        ) < 0
    );

  const grossProfit =
    winningTrades.reduce(
      (total, trade) =>
        total +
        calculateTradePnL(
          trade
        ),
      0
    );

  const grossLoss =
    losingTrades.reduce(
      (total, trade) =>
        total +
        Math.abs(
          calculateTradePnL(
            trade
          )
        ),
      0
    );

  const totalFees =
    trades.reduce(
      (total, trade) =>
        total +
        Math.abs(
          trade.fees
        ),
      0
    );

  const realizedPnL =
    closedTrades.reduce(
      (total, trade) =>
        total +
        calculateTradePnL(
          trade
        ),
      0
    );

  const netPnL =
    realizedPnL;

  const winRate =
    closedTrades.length > 0
      ? (winningTrades.length /
          closedTrades.length) *
        100
      : 0;

  const averageWin =
    winningTrades.length >
    0
      ? grossProfit /
        winningTrades.length
      : 0;

  const averageLoss =
    losingTrades.length >
    0
      ? grossLoss /
        losingTrades.length
      : 0;

  const largestWin =
    winningTrades.reduce(
      (largest, trade) =>
        Math.max(
          largest,
          calculateTradePnL(
            trade
          )
        ),
      0
    );

  const largestLoss =
    losingTrades.reduce(
      (largest, trade) =>
        Math.max(
          largest,
          Math.abs(
            calculateTradePnL(
              trade
            )
          )
        ),
      0
    );

  const profitFactor =
    grossLoss > 0
      ? grossProfit /
        grossLoss
      : grossProfit > 0
      ? Infinity
      : 0;

  const totalExposure =
    openTrades.reduce(
      (total, trade) =>
        total +
        calculateTradeValue(
          trade
        ),
      0
    );

  const capitalBase =
    getCapitalBase(
      allTransactions
    );

  const exposurePercent =
    capitalBase > 0
      ? (totalExposure /
          capitalBase) *
        100
      : 0;

  const deposits =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
            "DEPOSIT" &&
          transaction.status ===
            "POSTED"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );

  const withdrawals =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
            "WITHDRAWAL" &&
          transaction.status ===
            "POSTED"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );

  const investmentOutflow =
    transactions
      .filter(
        (transaction) =>
          transaction.type ===
            "INVESTMENT" &&
          transaction.status ===
            "POSTED"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );

  const netCashflow =
    deposits -
    withdrawals -
    investmentOutflow;

  const assetBreakdown =
    buildExposureBreakdown(
      trades
    );

  const strategyBreakdown =
    buildStrategyBreakdown(
      trades
    );

  const monthlyBreakdown =
    buildMonthlyBreakdown(
      trades
    );

  const topAsset =
    assetBreakdown[0];

  const topStrategy =
    strategyBreakdown[0];

  const reportTrades =
    closedTrades.map(
      buildTradeItem
    );

  const bestTrade =
    reportTrades.length > 0
      ? reportTrades.reduce(
          (best, trade) =>
            trade.pnl >
            best.pnl
              ? trade
              : best
        )
      : null;

  const worstTrade =
    reportTrades.length > 0
      ? reportTrades.reduce(
          (worst, trade) =>
            trade.pnl <
            worst.pnl
              ? trade
              : worst
        )
      : null;

  return {
    period,

    totalTrades:
      trades.length,

    openTrades:
      openTrades.length,

    closedTrades:
      closedTrades.length,

    winningTrades:
      winningTrades.length,

    losingTrades:
      losingTrades.length,

    winRate,

    grossProfit,

    grossLoss,

    realizedPnL,

    totalFees,

    netPnL,

    averageWin,

    averageLoss,

    largestWin,

    largestLoss,

    profitFactor,

    capitalBase,

    totalExposure,

    exposurePercent,

    deposits,

    withdrawals,

    investmentOutflow,

    netCashflow,

    topAsset:
      topAsset?.name ||
      "—",

    topAssetValue:
      topAsset?.value ||
      0,

    topStrategy:
      topStrategy?.name ||
      "—",

    topStrategyPnL:
      topStrategy?.value ||
      0,

    bestTrade,

    worstTrade,

    assetBreakdown,

    strategyBreakdown,

    monthlyBreakdown,
  };
}

export function getReportPeriodLabel(
  period: ReportPeriod
): string {
  switch (period) {
    case "ALL":
      return "ALL TIME";

    case "TODAY":
      return "TODAY";

    case "WEEK":
      return "LAST 7 DAYS";

    case "MONTH":
      return "LAST 30 DAYS";

    case "QUARTER":
      return "LAST 90 DAYS";

    case "YEAR":
      return "LAST 365 DAYS";

    default:
      return "ALL TIME";
  }
}

export function formatReportProfitFactor(
  value: number
): string {
  if (!Number.isFinite(value)) {
    return "∞";
  }

  return value.toFixed(2);
}