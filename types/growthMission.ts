export type GrowthMissionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type GrowthMission = {
  id: string;

  userId: string;

  name: string;
  description: string;

  startingCapital: number;
  targetCapital: number;

  currentCapital: number;

  targetReturnPercent: number;

  durationDays: number;

  startDate?: any;
  targetDate?: any;

  status: GrowthMissionStatus;

  tradesCount: number;
  winningTrades: number;
  losingTrades: number;

  realizedPnL: number;

  progressPercent: number;
  remainingCapital: number;

  requiredGrowthPercent: number;
  requiredAverageGrowthPercent: number;

  createdAt?: any;
  updatedAt?: any;
};