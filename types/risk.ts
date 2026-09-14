export type RiskLevel =
  | "CONTROLLED"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL";

export type RiskFlagType =
  | "CONCENTRATION"
  | "OPEN_TRADES"
  | "LOSS_STREAK"
  | "DRAWDOWN"
  | "EXPOSURE"
  | "DAILY_LOSS";

export type RiskFlag = {
  id: string;
  type: RiskFlagType;
  level: RiskLevel;
  title: string;
  description: string;
  value: number;
  threshold: number;
};

export type RiskBreakdownItem = {
  name: string;
  exposure: number;
  exposurePercent: number;
  tradeCount: number;
};

export type RiskSummary = {
  capitalBase: number;

  totalExposure: number;
  capitalAtRisk: number;
  exposurePercent: number;

  largestPosition: number;
  largestPositionName: string;
  concentrationPercent: number;

  openTrades: number;
  closedTrades: number;
  totalTrades: number;

  winningTrades: number;
  losingTrades: number;
  winRate: number;

  riskPerTrade: number;

  realizedPnL: number;
  grossProfit: number;
  grossLoss: number;

  maxDrawdown: number;
  maxDrawdownPercent: number;

  currentLossStreak: number;
  largestLoss: number;

  worstDayLoss: number;
  worstDayLossPercent: number;

  riskLevel: RiskLevel;

  flags: RiskFlag[];

  exposureByAsset: RiskBreakdownItem[];
  exposureByStrategy: RiskBreakdownItem[];
};