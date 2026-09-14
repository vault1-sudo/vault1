export type CompetitionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type CompetitionVisibility =
  | "PUBLIC"
  | "PRIVATE"
  | "INVITE_ONLY";

export type CompetitionMetric =
  | "RETURN_PERCENT"
  | "PROFIT"
  | "WIN_RATE"
  | "RISK_ADJUSTED_RETURN";

export type CompetitionEntryType =
  | "FREE"
  | "RESTRICTED";

export type CompetitionParticipantStatus =
  | "REGISTERED"
  | "ACTIVE"
  | "DISQUALIFIED"
  | "WITHDRAWN"
  | "COMPLETED";

export type Competition = {
  id: string;

  userId: string;
  hostUserId: string;
  hostName: string;

  title: string;
  description: string;

  category: string;

  visibility: CompetitionVisibility;
  status: CompetitionStatus;

  metric: CompetitionMetric;
  entryType: CompetitionEntryType;

  startsAt?: any;
  endsAt?: any;

  maxParticipants: number;
  participantCount: number;

  startingCapital: number;
  currency: string;

  prizeEnabled: boolean;
  prizeDescription?: string;

  rules: string[];

  channelId?: string;
  traderProfileId?: string;

  createdAt?: any;
  updatedAt?: any;
};

export type CompetitionParticipant = {
  id: string;

  competitionId: string;

  userId: string;
  displayName: string;
  username?: string;

  status: CompetitionParticipantStatus;

  startingCapital: number;
  currentCapital: number;

  profit: number;
  returnPercent: number;

  winRate: number;

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;

  riskScore: number;
  score: number;

  rank: number;

  joinedAt?: any;
  updatedAt?: any;
};

export type CompetitionSummary = {
  total: number;
  scheduled: number;
  active: number;
  completed: number;
  participants: number;
};

export type CompetitionLeaderboardRow = {
  rank: number;
  participantId: string;
  userId: string;
  displayName: string;
  username?: string;

  score: number;
  returnPercent: number;
  profit: number;
  winRate: number;
  totalTrades: number;

  status: CompetitionParticipantStatus;
};