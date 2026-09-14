export type LeaderboardPeriod =
  | "WEEK"
  | "MONTH"
  | "YEAR"
  | "ALL_TIME";

export type LeaderboardMetric =
  | "RETURN_PERCENT"
  | "PROFIT"
  | "WIN_RATE"
  | "PROFIT_FACTOR"
  | "RISK_ADJUSTED"
  | "CONSISTENCY"
  | "COMPETITION_SCORE";

export type LeaderboardEntryStatus =
  | "DRAFT"
  | "PUBLIC"
  | "SUSPENDED";

export type LeaderboardEntry = {
  id: string;

  userId: string;

  username: string;
  displayName: string;

  avatarUrl?: string;

  traderProfileId?: string;

  period: LeaderboardPeriod;

  status: LeaderboardEntryStatus;

  verified: boolean;

  rank: number;
  previousRank: number;

  returnPercent: number;
  profit: number;

  winRate: number;
  profitFactor: number;

  riskAdjustedReturn: number;
  consistencyScore: number;

  competitionScore: number;

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;

  largestWin: number;
  largestLoss: number;

  maxDrawdown: number;

  score: number;

  updatedAt?: any;
  createdAt?: any;
};

export type LeaderboardSummary = {
  totalTraders: number;
  verifiedTraders: number;

  topReturn: number;
  topProfit: number;
  topWinRate: number;

  averageReturn: number;
  averageWinRate: number;
};

export type LeaderboardFilters = {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  verifiedOnly: boolean;
  search: string;
};