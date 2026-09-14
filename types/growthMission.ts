export type GrowthMissionStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED";

export type GrowthMissionTradeStatus =
  | "OPEN"
  | "CLOSED"
  | "CANCELLED";

export type GrowthMissionPosition =
  | "LONG"
  | "SHORT";

export type GrowthMissionBias =
  | "BULLISH"
  | "BEARISH"
  | "NEUTRAL";

export type GrowthMissionAssetClass =
  | "STOCK"
  | "ETF"
  | "MUTUAL_FUND"
  | "CRYPTO"
  | "FOREX"
  | "COMMODITY"
  | "FIXED_INCOME"
  | "GOLD"
  | "FOREIGN_ASSET"
  | "CASH"
  | "OTHER";

export type GrowthMissionExitReason =
  | "TARGET_HIT"
  | "STOP_LOSS"
  | "MANUAL"
  | "TIME_EXIT"
  | "TRAILING_STOP"
  | "OTHER";

export type GrowthMissionDayStatus =
  | "UPCOMING"
  | "ACTIVE"
  | "COMPLETED"
  | "MISSED"
  | "SKIPPED";

export type GrowthMissionTradeResult =
  | "WIN"
  | "LOSS"
  | "BREAKEVEN"
  | "OPEN";

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

  /*
   * Mission-level trade statistics.
   */
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades?: number;
  openTrades?: number;

  realizedPnL: number;
  unrealizedPnL?: number;

  progressPercent: number;
  remainingCapital: number;

  requiredGrowthPercent: number;
  requiredAverageGrowthPercent: number;

  /*
   * Target-map statistics.
   */
  completedDays?: number;
  currentDayNumber?: number;
  missedDays?: number;

  targetDailyGrowthPercent?: number;

  expectedCapitalToday?: number;
  expectedCapitalTomorrow?: number;

  aheadBehindCapital?: number;
  aheadBehindPercent?: number;

  /*
   * Risk / execution summary.
   */
  totalCapitalDeployed?: number;
  totalFees?: number;

  largestWin?: number;
  largestLoss?: number;

  winRate?: number;
  averageWin?: number;
  averageLoss?: number;

  profitFactor?: number;
  maxDrawdown?: number;

  /*
   * Audit timestamps.
   */
  createdAt?: any;
  updatedAt?: any;
};

/*
 * =========================================================
 * GROWTH MISSION DAY
 * =========================================================
 *
 * A mission is divided into individual operating days.
 *
 * Example:
 *
 * Day 1
 * Target: ₹650
 * Actual: ₹670
 * Result: +₹170
 *
 * Day 2
 * Target: ₹845
 * Actual: ₹820
 * Result: -₹30
 *
 * These records form the mission's target map.
 */

export type GrowthMissionDay = {
  id: string;

  missionId: string;
  userId: string;

  dayNumber: number;

  date: any;

  status: GrowthMissionDayStatus;

  /*
   * Capital trajectory.
   */
  openingCapital: number;

  targetCapital: number;

  closingCapital?: number;

  /*
   * Expected vs actual.
   */
  expectedGrowthAmount: number;
  actualGrowthAmount?: number;

  expectedGrowthPercent: number;
  actualGrowthPercent?: number;

  aheadBehindCapital?: number;
  aheadBehindPercent?: number;

  /*
   * Day-level trading results.
   */
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades?: number;

  grossProfit?: number;
  grossLoss?: number;

  fees?: number;
  netPnL?: number;

  returnPercent?: number;

  /*
   * Risk / execution.
   */
  capitalDeployed?: number;
  maxDrawdown?: number;

  /*
   * Day completion.
   */
  completedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};

/*
 * =========================================================
 * GROWTH MISSION TRADE
 * =========================================================
 *
 * This is the individual trade record.
 *
 * Every trade belongs to:
 *
 * User
 *   ↓
 * Growth Mission
 *   ↓
 * Mission Day
 *   ↓
 * Trade
 */

export type GrowthMissionTrade = {
  id: string;

  missionId: string;
  missionDayId: string;

  userId: string;

  /*
   * Identification.
   */
  tradeNumber: number;

  tradeDate: any;

  status: GrowthMissionTradeStatus;

  /*
   * Market.
   */
  assetClass: GrowthMissionAssetClass;

  instrument: string;

  symbol?: string;

  exchange?: string;

  broker?: string;

  position: GrowthMissionPosition;

  bias: GrowthMissionBias;

  strategy?: string;

  setup?: string;

  /*
   * Entry.
   */
  entryDate?: any;
  entryTime?: string;

  entryPrice: number;

  quantity: number;

  positionSize: number;

  leverage?: number;

  stopLoss?: number;

  takeProfit?: number;

  /*
   * Exit.
   */
  exitDate?: any;
  exitTime?: string;

  exitPrice?: number;

  exitReason?: GrowthMissionExitReason;

  holdingDurationMinutes?: number;

  /*
   * Result.
   */
  grossProfit?: number;

  grossLoss?: number;

  fees?: number;

  netPnL: number;

  returnPercent?: number;

  riskAmount?: number;

  rewardAmount?: number;

  riskRewardRatio?: number;

  result: GrowthMissionTradeResult;

  /*
   * Journal.
   */
  thesis?: string;

  entryReason?: string;

  exitReasonNotes?: string;

  whatWentRight?: string;

  whatWentWrong?: string;

  notes?: string;

  /*
   * Future media support.
   */
  chartImageUrl?: string;

  attachmentUrls?: string[];

  /*
   * Audit.
   */
  createdAt?: any;
  updatedAt?: any;
};