export type PerformancePeriod =
  | "ALL"
  | "TODAY"
  | "WEEK"
  | "MONTH"
  | "YEAR";

export type PerformanceSnapshot = {
  id: string;
  userId: string;

  date: string;

  capital: number;
  portfolioValue: number;

  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;

  returnPercent: number;

  tradeCount: number;
  winningTrades: number;
  losingTrades: number;

  winRate: number;

  fees: number;

  createdAt?: any;
};


export type PerformanceSummary = {
  totalPnL: number;
  realizedPnL: number;
  unrealizedPnL: number;

  returnPercent: number;

  totalTrades: number;
  openTrades: number;
  closedTrades: number;

  winningTrades: number;
  losingTrades: number;

  winRate: number;

  averageWin: number;
  averageLoss: number;

  largestWin: number;
  largestLoss: number;

  grossProfit: number;
  grossLoss: number;

  profitFactor: number;

  totalFees: number;

  exposure: number;
};


export type PerformanceEvent = {
  id: string;

  date: string;

  label: string;

  value: number;

  type:
    | "PROFIT"
    | "LOSS"
    | "FEE"
    | "NEUTRAL";
};