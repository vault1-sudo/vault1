export type RewardCategory =
  | "TRADING"
  | "CREATOR"
  | "COMMUNITY"
  | "COMPETITION"
  | "LEARNING"
  | "MILESTONE"
  | "STREAK"
  | "SPECIAL";

export type RewardType =
  | "XP"
  | "POINTS"
  | "BADGE"
  | "ACHIEVEMENT"
  | "RECOGNITION"
  | "MONETARY";

export type RewardStatus =
  | "ACTIVE"
  | "LOCKED"
  | "CLAIMED"
  | "EXPIRED"
  | "REVOKED";

export type RewardDefinition = {
  id: string;

  code: string;
  name: string;
  description: string;

  category: RewardCategory;
  type: RewardType;

  icon: string;

  points: number;
  xp: number;

  requirement: string;
  requirementValue?: number;

  monetaryValue: number;
  monetaryEnabled: boolean;

  active: boolean;

  createdAt?: any;
  updatedAt?: any;
};

export type UserReward = {
  id: string;

  userId: string;
  rewardId: string;

  rewardCode: string;
  rewardName: string;

  category: RewardCategory;
  type: RewardType;

  status: RewardStatus;

  pointsAwarded: number;
  xpAwarded: number;

  monetaryValue: number;
  monetaryEnabled: boolean;

  sourceType?: string;
  sourceId?: string;

  earnedAt?: any;
  claimedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};

export type RewardLedgerEntry = {
  id: string;

  userId: string;

  type:
    | "EARN"
    | "ADJUST"
    | "REDEEM"
    | "EXPIRE"
    | "REVOKE";

  points: number;
  xp: number;

  description: string;

  referenceType?: string;
  referenceId?: string;

  createdAt?: any;
};

export type UserRewardProfile = {
  id: string;

  userId: string;

  points: number;
  lifetimePoints: number;

  xp: number;
  level: number;

  nextLevelXp: number;
  levelProgressPercent: number;

  achievementCount: number;
  badgeCount: number;

  currentStreak: number;
  longestStreak: number;

  creatorScore: number;
  communityScore: number;
  tradingScore: number;
  competitionScore: number;

  updatedAt?: any;
  createdAt?: any;
};

export type RewardSummary = {
  totalPoints: number;
  lifetimePoints: number;

  xp: number;
  level: number;

  achievementCount: number;
  badgeCount: number;

  currentStreak: number;
  longestStreak: number;

  availableRewards: number;
  claimedRewards: number;

  monetaryRewardsEnabled: boolean;
};