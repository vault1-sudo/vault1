export type LedgerEntryType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "INVESTMENT"
  | "TRADE_PROFIT"
  | "TRADE_LOSS"
  | "FEE"
  | "INTEREST"
  | "DIVIDEND"
  | "OTHER";

export type LedgerEntryStatus =
  | "POSTED"
  | "PENDING"
  | "CANCELLED";

export type LedgerEntry = {
  id: string;
  userId: string;

  type: LedgerEntryType;

  // Positive = money added
  // Negative = money removed
  amount: number;

  currency: string;

  description: string;

  status: LedgerEntryStatus;

  referenceType?: string;
  referenceId?: string;

  createdAt?: any;
};