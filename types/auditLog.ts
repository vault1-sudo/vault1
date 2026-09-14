export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "ACTIVATE"
  | "PAUSE"
  | "CANCEL"
  | "CLOSE"
  | "ISSUE"
  | "ACCEPT"
  | "REVOKE"
  | "APPROVE"
  | "REJECT"
  | "EXPORT"
  | "VIEW"
  | "OTHER";

export type AuditEntity =
  | "USER"
  | "TRADE"
  | "PORTFOLIO"
  | "ASSET"
  | "STRATEGY"
  | "GROWTH_MISSION"
  | "TRANSACTION"
  | "LEDGER"
  | "INVESTOR"
  | "PAYOUT"
  | "DOCUMENT"
  | "PERFORMANCE"
  | "RISK"
  | "REPORT"
  | "FEE"
  | "TAX"
  | "NOTIFICATION"
  | "SETTINGS"
  | "OTHER";

export type AuditSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL";

export type AuditLog = {
  id: string;
  userId: string;

  action: AuditAction;
  entity: AuditEntity;

  entityId?: string;
  entityName?: string;

  description: string;

  severity: AuditSeverity;

  metadata?: Record<string, any>;

  createdAt?: any;
};