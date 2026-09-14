export type NotificationType =
  | "SYSTEM"
  | "TRADE"
  | "PORTFOLIO"
  | "INVESTOR"
  | "PAYOUT"
  | "DOCUMENT"
  | "GROWTH_MISSION"
  | "RISK"
  | "PERFORMANCE"
  | "SECURITY"
  | "OTHER";

export type NotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type NotificationStatus =
  | "UNREAD"
  | "READ"
  | "ARCHIVED";

export type Vault1Notification = {
  id: string;
  userId: string;

  title: string;
  message: string;

  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;

  actionLabel?: string;
  actionRoute?: string;

  referenceType?: string;
  referenceId?: string;

  createdAt?: any;
  readAt?: any;
  archivedAt?: any;
};

export type NotificationSummary = {
  total: number;
  unread: number;
  read: number;
  archived: number;
  highPriority: number;
  critical: number;
};