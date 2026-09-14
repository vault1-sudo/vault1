export type PositionAssetClass =
  | "EQUITY"
  | "ETF"
  | "MUTUAL FUND"
  | "CRYPTO"
  | "GOLD"
  | "FOREX"
  | "COMMODITY"
  | "FIXED INCOME"
  | "CASH"
  | "OTHER";

export type PositionStatus =
  | "OPEN"
  | "CLOSED";

export type Position = {
  id: string;
  userId: string;

  symbol: string;
  name: string;
  assetClass: PositionAssetClass;

  quantity: number;

  averagePrice: number;
  currentPrice: number;

  investedValue: number;
  currentValue: number;

  unrealizedPnL: number;
  unrealizedPnLPercent: number;

  realizedPnL: number;

  totalFees: number;

  status: PositionStatus;

  openedAt?: any;
  closedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};


export type ClosedPosition = {
  id: string;
  userId: string;

  symbol: string;
  name: string;
  assetClass: PositionAssetClass;

  quantity: number;

  averageEntryPrice: number;
  averageExitPrice: number;

  investedValue: number;
  exitValue: number;

  realizedPnL: number;
  realizedPnLPercent: number;

  totalFees: number;

  status: "CLOSED";

  openedAt?: any;
  closedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};


export type PortfolioSummary = {
  investedCapital: number;
  currentValue: number;

  realizedPnL: number;
  unrealizedPnL: number;

  totalPnL: number;

  totalFees: number;

  returnPercent: number;

  positionCount: number;
  openPositionCount: number;
  closedPositionCount: number;

  totalExposure: number;

  winningPositions: number;
  losingPositions: number;

  winRate: number;
};


export type PortfolioData = {
  openPositions: Position[];
  closedPositions: ClosedPosition[];
  summary: PortfolioSummary;
};