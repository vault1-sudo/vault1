export type StrategyRiskLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY HIGH";

export type StrategyStatus =
  | "ACTIVE"
  | "INACTIVE";

export type Strategy = {
  id: string;

  userId: string;

  name: string;
  code: string;
  description: string;

  assetClasses: string[];

  riskLevel: StrategyRiskLevel;

  targetReturnPercent?: number;
  maxDrawdownPercent?: number;
  maxCapitalAllocationPercent?: number;

  minimumCapital?: number;

  status: StrategyStatus;

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;

  realizedPnL: number;
  totalFees: number;

  createdAt?: any;
  updatedAt?: any;
};