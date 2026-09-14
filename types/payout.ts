export type PayoutRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "PROCESSING"
  | "PROCESSED"
  | "CANCELLED";

export type PayoutRequest = {
  id: string;
  userId: string;

  investorId: string;
  investorCode: string;
  investorName: string;
  investorEmail: string;

  requestedAmount: number;
  availableValue: number;
  portfolioValue: number;

  currency: string;

  status: PayoutRequestStatus;

  reason?: string;
  adminNotes?: string;
  rejectionReason?: string;

  transactionReference?: string;

  requestedAt?: any;
  reviewedAt?: any;
  processedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};