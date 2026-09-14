import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import {
  getUserTrades,
  calculateTradePnL,
  calculateTradeValue,
} from "../trading/tradeService";
import { getUserTransactions } from "../transactions/transactionService";

import {
  RiskBreakdownItem,
  RiskFlag,
  RiskLevel,
  RiskSummary,
} from "../../types/risk";

import { Trade } from "../../types/trade";

const STRATEGIES_COLLECTION = "strategies";

type StrategyRecord = {
  id: string;
  userId: string;
  name: string;
  code?: string;
  description?: string;
  assetClasses?: string[];
  riskLevel?: string;
  status?: string;
};

function getTradeTimestamp(trade: Trade): number {
  const timestamp = trade.createdAt;

  if (
    timestamp &&
    typeof timestamp.toMillis === "function"
  ) {
    return timestamp.toMillis();
  }

  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }

  if (
    typeof timestamp === "string" ||
    typeof timestamp === "number"
  ) {
    const parsed = new Date(timestamp).getTime();

    return Number.isFinite(parsed)
      ? parsed
      : 0;
  }

  return 0;
}

function getTradeDateKey(trade: Trade): string {
  const timestamp = getTradeTimestamp(trade);

  if (!timestamp) {
    return "UNKNOWN";
  }

  const date = new Date(timestamp);

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function getUserStrategies(
  userId: string
): Promise<StrategyRecord[]> {
  const strategiesQuery = query(
    collection(
      db,
      STRATEGIES_COLLECTION
    ),
    where(
      "userId",
      "==",
      userId
    )
  );

  const snapshot = await getDocs(
    strategiesQuery
  );

  return snapshot.docs.map(
    (document) => ({
      id: document.id,
      ...document.data(),
    })
  ) as StrategyRecord[];
}

function buildBreakdown(
  trades: Trade[],
  keyGetter: (
    trade: Trade
  ) => string
): RiskBreakdownItem[] {
  const buckets = new Map<
    string,
    {
      exposure: number;
      tradeCount: number;
    }
  >();

  trades
    .filter(
      (trade) =>
        trade.status === "OPEN"
    )
    .forEach((trade) => {
      const rawName =
        keyGetter(trade);

      const name =
        rawName?.trim() ||
        "UNASSIGNED";

      const existing =
        buckets.get(name);

      if (existing) {
        existing.exposure +=
          calculateTradeValue(
            trade
          );

        existing.tradeCount += 1;
      } else {
        buckets.set(name, {
          exposure:
            calculateTradeValue(
              trade
            ),
          tradeCount: 1,
        });
      }
    });

  const totalExposure =
    Array.from(
      buckets.values()
    ).reduce(
      (total, item) =>
        total + item.exposure,
      0
    );

  return Array.from(
    buckets.entries()
  )
    .map(
      ([name, item]) => ({
        name,
        exposure: item.exposure,
        exposurePercent:
          totalExposure > 0
            ? (item.exposure /
                totalExposure) *
              100
            : 0,
        tradeCount:
          item.tradeCount,
      })
    )
    .sort(
      (a, b) =>
        b.exposure -
        a.exposure
    );
}

function calculateMaxDrawdown(
  trades: Trade[]
): number {
  const closedTrades = trades
    .filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    )
    .sort(
      (a, b) =>
        getTradeTimestamp(a) -
        getTradeTimestamp(b)
    );

  let cumulativePnL = 0;
  let peak = 0;
  let maximumDrawdown = 0;

  for (const trade of closedTrades) {
    cumulativePnL +=
      calculateTradePnL(trade);

    if (cumulativePnL > peak) {
      peak = cumulativePnL;
    }

    const drawdown =
      peak - cumulativePnL;

    if (
      drawdown >
      maximumDrawdown
    ) {
      maximumDrawdown =
        drawdown;
    }
  }

  return maximumDrawdown;
}

function calculateCurrentLossStreak(
  trades: Trade[]
): number {
  const closedTrades = trades
    .filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    )
    .sort(
      (a, b) =>
        getTradeTimestamp(b) -
        getTradeTimestamp(a)
    );

  let streak = 0;

  for (const trade of closedTrades) {
    const pnl =
      calculateTradePnL(trade);

    if (pnl < 0) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function calculateWorstDay(
  trades: Trade[]
): number {
  const dailyPnL =
    new Map<string, number>();

  trades
    .filter(
      (trade) =>
        trade.status ===
        "CLOSED"
    )
    .forEach((trade) => {
      const dateKey =
        getTradeDateKey(
          trade
        );

      const existing =
        dailyPnL.get(
          dateKey
        ) || 0;

      dailyPnL.set(
        dateKey,
        existing +
          calculateTradePnL(
            trade
          )
      );
    });

  let worstDayLoss = 0;

  dailyPnL.forEach(
    (value) => {
      if (
        value <
        worstDayLoss
      ) {
        worstDayLoss = value;
      }
    }
  );

  return Math.abs(
    worstDayLoss
  );
}

function buildFlags({
  concentrationPercent,
  openTrades,
  currentLossStreak,
  maxDrawdownPercent,
  exposurePercent,
  worstDayLossPercent,
}: {
  concentrationPercent: number;
  openTrades: number;
  currentLossStreak: number;
  maxDrawdownPercent: number;
  exposurePercent: number;
  worstDayLossPercent: number;
}): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (
    concentrationPercent >=
    60
  ) {
    flags.push({
      id: "concentration-critical",
      type: "CONCENTRATION",
      level: "CRITICAL",
      title:
        "Extreme concentration",
      description:
        "A single position represents more than 60% of total open exposure.",
      value:
        concentrationPercent,
      threshold: 60,
    });
  } else if (
    concentrationPercent >=
    40
  ) {
    flags.push({
      id: "concentration-high",
      type: "CONCENTRATION",
      level: "HIGH",
      title:
        "High concentration",
      description:
        "A single position represents more than 40% of total open exposure.",
      value:
        concentrationPercent,
      threshold: 40,
    });
  } else if (
    concentrationPercent >=
    30
  ) {
    flags.push({
      id: "concentration-moderate",
      type: "CONCENTRATION",
      level: "MODERATE",
      title:
        "Position concentration",
      description:
        "One position is becoming a meaningful portion of portfolio exposure.",
      value:
        concentrationPercent,
      threshold: 30,
    });
  }

  if (openTrades >= 20) {
    flags.push({
      id: "open-trades-critical",
      type: "OPEN_TRADES",
      level: "CRITICAL",
      title:
        "Excessive open positions",
      description:
        "The number of open trades is above the conservative risk threshold.",
      value: openTrades,
      threshold: 20,
    });
  } else if (openTrades >= 10) {
    flags.push({
      id: "open-trades-high",
      type: "OPEN_TRADES",
      level: "HIGH",
      title:
        "High open trade count",
      description:
        "A large number of simultaneous positions can increase execution and monitoring risk.",
      value: openTrades,
      threshold: 10,
    });
  }

  if (
    currentLossStreak >=
    5
  ) {
    flags.push({
      id: "loss-streak-critical",
      type: "LOSS_STREAK",
      level: "CRITICAL",
      title:
        "Extended loss streak",
      description:
        "Five or more consecutive closed trades are currently losing.",
      value:
        currentLossStreak,
      threshold: 5,
    });
  } else if (
    currentLossStreak >=
    3
  ) {
    flags.push({
      id: "loss-streak-high",
      type: "LOSS_STREAK",
      level: "HIGH",
      title:
        "Loss streak",
      description:
        "Three or more consecutive closed trades are currently losing.",
      value:
        currentLossStreak,
      threshold: 3,
    });
  }

  if (
    maxDrawdownPercent >=
    20
  ) {
    flags.push({
      id: "drawdown-critical",
      type: "DRAWDOWN",
      level: "CRITICAL",
      title:
        "Severe drawdown",
      description:
        "Realized performance has experienced a drawdown of 20% or more from its prior peak.",
      value:
        maxDrawdownPercent,
      threshold: 20,
    });
  } else if (
    maxDrawdownPercent >=
    10
  ) {
    flags.push({
      id: "drawdown-high",
      type: "DRAWDOWN",
      level: "HIGH",
      title:
        "Elevated drawdown",
      description:
        "Realized performance has experienced a drawdown above 10% from its prior peak.",
      value:
        maxDrawdownPercent,
      threshold: 10,
    });
  }

  if (
    exposurePercent >=
    100
  ) {
    flags.push({
      id: "exposure-critical",
      type: "EXPOSURE",
      level: "CRITICAL",
      title:
        "Exposure exceeds capital base",
      description:
        "Open trade exposure is at or above the available external capital base.",
      value:
        exposurePercent,
      threshold: 100,
    });
  } else if (
    exposurePercent >=
    75
  ) {
    flags.push({
      id: "exposure-high",
      type: "EXPOSURE",
      level: "HIGH",
      title:
        "High capital utilization",
      description:
        "Open trade exposure is using a large portion of the capital base.",
      value:
        exposurePercent,
      threshold: 75,
    });
  }

  if (
    worstDayLossPercent >=
    10
  ) {
    flags.push({
      id: "daily-loss-critical",
      type: "DAILY_LOSS",
      level: "CRITICAL",
      title:
        "Large daily loss",
      description:
        "The worst realized trading day exceeded 10% of the capital base.",
      value:
        worstDayLossPercent,
      threshold: 10,
    });
  } else if (
    worstDayLossPercent >=
    5
  ) {
    flags.push({
      id: "daily-loss-high",
      type: "DAILY_LOSS",
      level: "HIGH",
      title:
        "Elevated daily loss",
      description:
        "The worst realized trading day exceeded 5% of the capital base.",
      value:
        worstDayLossPercent,
      threshold: 5,
    });
  }

  return flags;
}

function determineRiskLevel(
  flags: RiskFlag[]
): RiskLevel {
  if (
    flags.some(
      (flag) =>
        flag.level ===
        "CRITICAL"
    )
  ) {
    return "CRITICAL";
  }

  if (
    flags.some(
      (flag) =>
        flag.level ===
        "HIGH"
    )
  ) {
    return "HIGH";
  }

  if (
    flags.some(
      (flag) =>
        flag.level ===
        "MODERATE"
    )
  ) {
    return "MODERATE";
  }

  return "CONTROLLED";
}

export async function getRiskSummary(
  userId: string
): Promise<RiskSummary> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const [
    trades,
    transactions,
  ] = await Promise.all([
    getUserTrades(userId),
    getUserTransactions(
      userId
    ),
  ]);

  /*
   * Strategies are optional for
   * the current Risk Engine.
   *
   * We load them so the service
   * is ready for future strategy
   * risk classification, but risk
   * calculations do not depend on
   * them being available.
   */
  try {
    await getUserStrategies(
      userId
    );
  } catch (error) {
    console.warn(
      "Risk Engine: strategy data could not be loaded.",
      error
    );
  }

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

  /*
   * Capital base:
   *
   * External deposits minus
   * external withdrawals.
   *
   * We intentionally do not treat
   * investments, fees or trading
   * P&L as fresh capital here.
   */
  const capitalBase =
    transactions
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

  /*
   * Open exposure is calculated
   * from entry value.
   *
   * Until live market prices
   * and stop-loss data are
   * connected, this is treated
   * conservatively as capital at
   * risk.
   */
  const totalExposure =
    openTrades.reduce(
      (total, trade) =>
        total +
        calculateTradeValue(
          trade
        ),
      0
    );

  const capitalAtRisk =
    totalExposure;

  const exposurePercent =
    capitalBase > 0
      ? (totalExposure /
          capitalBase) *
        100
      : 0;

  const realizedPnL =
    closedTrades.reduce(
      (total, trade) =>
        total +
        calculateTradePnL(
          trade
        ),
      0
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

  const winRate =
    closedTrades.length > 0
      ? (winningTrades.length /
          closedTrades.length) *
        100
      : 0;

  const largestPositionTrade =
    openTrades.reduce<Trade | null>(
      (largest, trade) => {
        if (!largest) {
          return trade;
        }

        return calculateTradeValue(
          trade
        ) >
          calculateTradeValue(
            largest
          )
          ? trade
          : largest;
      },
      null
    );

  const largestPosition =
    largestPositionTrade
      ? calculateTradeValue(
          largestPositionTrade
        )
      : 0;

  const largestPositionName =
    largestPositionTrade?.asset ||
    "—";

  const concentrationPercent =
    totalExposure > 0
      ? (largestPosition /
          totalExposure) *
        100
      : 0;

  const maxDrawdown =
    calculateMaxDrawdown(
      trades
    );

  const maxDrawdownPercent =
    capitalBase > 0
      ? (maxDrawdown /
          capitalBase) *
        100
      : 0;

  const currentLossStreak =
    calculateCurrentLossStreak(
      trades
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

  const riskPerTrade =
    capitalBase > 0
      ? (largestLoss /
          capitalBase) *
        100
      : 0;

  const worstDayLoss =
    calculateWorstDay(
      trades
    );

  const worstDayLossPercent =
    capitalBase > 0
      ? (worstDayLoss /
          capitalBase) *
        100
      : 0;

  const exposureByAsset =
    buildBreakdown(
      trades,
      (trade) =>
        trade.asset
    );

  const exposureByStrategy =
    buildBreakdown(
      trades,
      (trade) =>
        trade.strategy
    );

  const flags =
    buildFlags({
      concentrationPercent,
      openTrades:
        openTrades.length,
      currentLossStreak,
      maxDrawdownPercent,
      exposurePercent,
      worstDayLossPercent,
    });

  const riskLevel =
    determineRiskLevel(
      flags
    );

  return {
    capitalBase,

    totalExposure,

    capitalAtRisk,

    exposurePercent,

    largestPosition,

    largestPositionName,

    concentrationPercent,

    openTrades:
      openTrades.length,

    closedTrades:
      closedTrades.length,

    totalTrades:
      trades.length,

    winningTrades:
      winningTrades.length,

    losingTrades:
      losingTrades.length,

    winRate,

    riskPerTrade,

    realizedPnL,

    grossProfit,

    grossLoss,

    maxDrawdown,

    maxDrawdownPercent,

    currentLossStreak,

    largestLoss,

    worstDayLoss,

    worstDayLossPercent,

    riskLevel,

    flags,

    exposureByAsset,

    exposureByStrategy,
  };
}

export function getRiskLevelLabel(
  level: RiskLevel
): string {
  switch (level) {
    case "CONTROLLED":
      return "CONTROLLED";

    case "MODERATE":
      return "MODERATE";

    case "HIGH":
      return "HIGH";

    case "CRITICAL":
      return "CRITICAL";

    default:
      return "CONTROLLED";
  }
}

export function getRiskLevelDescription(
  level: RiskLevel
): string {
  switch (level) {
    case "CONTROLLED":
      return "Current observed risk remains within conservative operating ranges.";

    case "MODERATE":
      return "Some risk indicators are elevated and should be monitored closely.";

    case "HIGH":
      return "Multiple risk indicators require active attention before increasing exposure.";

    case "CRITICAL":
      return "Observed risk is materially elevated. New exposure should be reviewed carefully.";

    default:
      return "Risk status is currently unavailable.";
  }
}