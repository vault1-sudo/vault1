export type TradeJournalOutcome =
  | "WIN"
  | "LOSS"
  | "BREAKEVEN"
  | "OPEN"
  | "CANCELLED";

export type TradeJournalEmotion =
  | "CALM"
  | "CONFIDENT"
  | "FOCUSED"
  | "UNCERTAIN"
  | "FEARFUL"
  | "GREEDY"
  | "FRUSTRATED"
  | "IMPULSIVE"
  | "DISCIPLINED"
  | "OTHER";

export type TradeJournal = {
  id: string;

  userId: string;

  tradeId?: string;

  asset: string;

  strategy: string;

  setup: string;

  thesis: string;

  entryReasoning: string;

  riskPlan: string;

  plannedStop?: number;

  plannedTarget?: number;

  exitReasoning: string;

  outcome: TradeJournalOutcome;

  emotionsBefore: TradeJournalEmotion;

  emotionsAfter: TradeJournalEmotion;

  mistakes: string;

  lessons: string;

  tags: string[];

  confidence: number;

  rating: number;

  actualPnL?: number;

  screenshotUrls?: string[];

  createdAt?: any;

  updatedAt?: any;
};