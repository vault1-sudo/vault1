export type DocumentType =
  | "TERMS"
  | "RISK_DISCLOSURE"
  | "AGREEMENT"
  | "KYC"
  | "STRATEGY_DISCLOSURE"
  | "FEE_SCHEDULE"
  | "STATEMENT"
  | "TRANSACTION_HISTORY"
  | "OTHER";

export type DocumentStatus =
  | "DRAFT"
  | "ISSUED"
  | "ACCEPTED"
  | "EXPIRED"
  | "REVOKED";

export type DocumentAcceptanceStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "ACCEPTED"
  | "DECLINED";

export type Vault1Document = {
  id: string;
  userId: string;

  investorId: string;
  investorCode: string;
  investorName: string;
  investorEmail: string;

  title: string;
  description: string;

  type: DocumentType;
  status: DocumentStatus;

  version: string;

  documentUrl?: string;
  storagePath?: string;

  issueDate?: string;
  expiryDate?: string;

  acceptanceStatus: DocumentAcceptanceStatus;
  acceptedAt?: any;

  issuedBy?: string;
  notes?: string;

  createdAt?: any;
  updatedAt?: any;
};