export type ReportPeriod =
  | "ALL"
  | "TODAY"
  | "WEEK"
  | "MONTH"
  | "QUARTER"
  | "YEAR";

export type ReportTradeItem = {
  id: string;
  asset: string;
  strategy: string;
  side: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  value: number;
  pnl: number;
  fees: number;
  status: string;
  date: string;
};

export type ReportBreakdownItem = {
  name: string;
  value: number;
  percent: number;
  count: number;
};

export type ReportMonthlyItem = {
  month: string;
  trades: number;
  winningTrades: number;
  losingTrades: number;
  pnl: number;
  fees: number;
};

export type ReportSummary = {
  period: ReportPeriod;

  totalTrades: number;
  openTrades: number;
  closedTrades: number;

  winningTrades: number;
  losingTrades: number;
  winRate: number;

  grossProfit: number;
  grossLoss: number;
  realizedPnL: number;
  totalFees: number;
  netPnL: number;

  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;

  profitFactor: number;

  capitalBase: number;
  totalExposure: number;
  exposurePercent: number;

  deposits: number;
  withdrawals: number;
  investmentOutflow: number;
  netCashflow: number;

  topAsset: string;
  topAssetValue: number;

  topStrategy: string;
  topStrategyPnL: number;

  bestTrade: ReportTradeItem | null;
  worstTrade: ReportTradeItem | null;

  assetBreakdown: ReportBreakdownItem[];
  strategyBreakdown: ReportBreakdownItem[];
  monthlyBreakdown: ReportMonthlyItem[];
};