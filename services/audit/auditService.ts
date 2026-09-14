import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  AuditAction,
  AuditEntity,
  AuditLog,
  AuditSeverity,
} from "../../types/auditLog";

const AUDIT_COLLECTION = "auditLogs";

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  entityName,
  description,
  severity = "INFO",
  metadata,
}: {
  userId: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  entityName?: string;
  description: string;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!description.trim()) {
    throw new Error("Audit description is required.");
  }

  const auditData = {
    userId,
    action,
    entity,
    ...(entityId ? { entityId } : {}),
    ...(entityName ? { entityName } : {}),
    description: description.trim(),
    severity,
    ...(metadata ? { metadata } : {}),
    createdAt: serverTimestamp(),
  };

  const auditRef = await addDoc(
    collection(db, AUDIT_COLLECTION),
    auditData
  );

  return auditRef.id;
}


/**
 * Fetch all audit logs belonging to the current user.
 *
 * We intentionally query only by userId and sort locally.
 * This avoids requiring a composite Firestore index.
 */
export async function getUserAuditLogs(
  userId: string
): Promise<AuditLog[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const auditQuery = query(
    collection(db, AUDIT_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(auditQuery);

  const logs = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as AuditLog[];

  logs.sort((a: AuditLog, b: AuditLog) => {
    const aTime =
      a.createdAt?.toMillis?.() ??
      (a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : 0);

    const bTime =
      b.createdAt?.toMillis?.() ??
      (b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : 0);

    return bTime - aTime;
  });

  return logs;
}


export function getAuditActionLabel(
  action: AuditAction
): string {
  switch (action) {
    case "CREATE":
      return "Created";

    case "UPDATE":
      return "Updated";

    case "DELETE":
      return "Deleted";

    case "LOGIN":
      return "Logged In";

    case "LOGOUT":
      return "Logged Out";

    case "ACTIVATE":
      return "Activated";

    case "PAUSE":
      return "Paused";

    case "CANCEL":
      return "Cancelled";

    case "CLOSE":
      return "Closed";

    case "ISSUE":
      return "Issued";

    case "ACCEPT":
      return "Accepted";

    case "REVOKE":
      return "Revoked";

    case "APPROVE":
      return "Approved";

    case "REJECT":
      return "Rejected";

    case "EXPORT":
      return "Exported";

    case "VIEW":
      return "Viewed";

    default:
      return "Other";
  }
}


export function getAuditEntityLabel(
  entity: AuditEntity
): string {
  switch (entity) {
    case "GROWTH_MISSION":
      return "Growth Mission";

    case "TRADE":
      return "Trade";

    case "PORTFOLIO":
      return "Portfolio";

    case "ASSET":
      return "Asset";

    case "STRATEGY":
      return "Strategy";

    case "TRANSACTION":
      return "Transaction";

    case "LEDGER":
      return "Ledger";

    case "INVESTOR":
      return "Investor";

    case "PAYOUT":
      return "Payout";

    case "DOCUMENT":
      return "Document";

    case "PERFORMANCE":
      return "Performance";

    case "RISK":
      return "Risk";

    case "REPORT":
      return "Report";

    case "FEE":
      return "Fee";

    case "TAX":
      return "Tax";

    case "NOTIFICATION":
      return "Notification";

    case "SETTINGS":
      return "Settings";

    case "USER":
      return "User";

    default:
      return "Other";
  }
}


export function getAuditSeverityLabel(
  severity: AuditSeverity
): string {
  switch (severity) {
    case "CRITICAL":
      return "Critical";

    case "WARNING":
      return "Warning";

    default:
      return "Information";
  }
}


export function calculateAuditSummary(
  logs: AuditLog[]
) {
  const createCount = logs.filter(
    (log) => log.action === "CREATE"
  ).length;

  const updateCount = logs.filter(
    (log) => log.action === "UPDATE"
  ).length;

  const loginCount = logs.filter(
    (log) => log.action === "LOGIN"
  ).length;

  const warningCount = logs.filter(
    (log) => log.severity === "WARNING"
  ).length;

  const criticalCount = logs.filter(
    (log) => log.severity === "CRITICAL"
  ).length;

  const todayKey = new Date()
    .toISOString()
    .slice(0, 10);

  const todayCount = logs.filter((log) => {
    const timestamp = log.createdAt;

    if (!timestamp) {
      return false;
    }

    const date =
      timestamp?.toDate?.() ??
      (timestamp instanceof Date
        ? timestamp
        : new Date(timestamp));

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    return date.toISOString().slice(0, 10) === todayKey;
  }).length;

  return {
    totalEvents: logs.length,
    createCount,
    updateCount,
    loginCount,
    warningCount,
    criticalCount,
    todayCount,
  };
}