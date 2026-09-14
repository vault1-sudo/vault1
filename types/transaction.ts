export type TransactionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "INVESTMENT"
  | "TRADE_PROFIT"
  | "TRADE_LOSS"
  | "FEE"
  | "INTEREST"
  | "DIVIDEND"
  | "OTHER";

export type TransactionStatus =
  | "POSTED"
  | "PENDING"
  | "CANCELLED";

export type Transaction = {
  id: string;
  userId: string;

  type: TransactionType;

  amount: number;
  currency: string;

  description: string;

  status: TransactionStatus;

  referenceType?: string;
  referenceId?: string;

  createdAt?: any;
  updatedAt?: any;
};