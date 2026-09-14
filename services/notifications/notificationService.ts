import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  Vault1Notification,
  NotificationSummary,
} from "../../types/notification";

const NOTIFICATIONS_COLLECTION =
  "notifications";


export async function createNotification({
  userId,
  title,
  message,
  type = "SYSTEM",
  priority = "NORMAL",
  actionLabel,
  actionRoute,
  referenceType,
  referenceId,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  actionLabel?: string;
  actionRoute?: string;
  referenceType?: string;
  referenceId?: string;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!title.trim()) {
    throw new Error("Notification title is required.");
  }

  if (!message.trim()) {
    throw new Error("Notification message is required.");
  }

  const notificationData = {
    userId,
    title: title.trim(),
    message: message.trim(),
    type,
    priority,
    status: "UNREAD" as NotificationStatus,
    ...(actionLabel
      ? { actionLabel: actionLabel.trim() }
      : {}),
    ...(actionRoute
      ? { actionRoute: actionRoute.trim() }
      : {}),
    ...(referenceType
      ? { referenceType }
      : {}),
    ...(referenceId
      ? { referenceId }
      : {}),
    createdAt: serverTimestamp(),
  };

  const notificationRef = await addDoc(
    collection(
      db,
      NOTIFICATIONS_COLLECTION
    ),
    notificationData
  );

  return notificationRef.id;
}


export async function getUserNotifications(
  userId: string
): Promise<Vault1Notification[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const notificationQuery = query(
    collection(
      db,
      NOTIFICATIONS_COLLECTION
    ),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(
    notificationQuery
  );

  const notifications =
    snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as Vault1Notification[];

  notifications.sort(
    (
      a: Vault1Notification,
      b: Vault1Notification
    ) => {
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
    }
  );

  return notifications;
}


export async function markNotificationRead(
  notificationId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    ),
    {
      status: "READ",
      readAt: serverTimestamp(),
    }
  );
}


export async function markNotificationUnread(
  notificationId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    ),
    {
      status: "UNREAD",
      readAt: null,
    }
  );
}


export async function archiveNotification(
  notificationId: string
) {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required."
    );
  }

  await updateDoc(
    doc(
      db,
      NOTIFICATIONS_COLLECTION,
      notificationId
    ),
    {
      status: "ARCHIVED",
      archivedAt: serverTimestamp(),
    }
  );
}


export async function markAllNotificationsRead(
  notifications: Vault1Notification[]
) {
  const unread = notifications.filter(
    (notification) =>
      notification.status === "UNREAD"
  );

  await Promise.all(
    unread.map((notification) =>
      markNotificationRead(
        notification.id
      )
    )
  );
}


export function getNotificationTypeLabel(
  type: NotificationType
) {
  switch (type) {
    case "SYSTEM":
      return "System";

    case "TRADE":
      return "Trade";

    case "PORTFOLIO":
      return "Portfolio";

    case "INVESTOR":
      return "Investor";

    case "PAYOUT":
      return "Payout";

    case "DOCUMENT":
      return "Document";

    case "GROWTH_MISSION":
      return "Growth Mission";

    case "RISK":
      return "Risk";

    case "PERFORMANCE":
      return "Performance";

    case "SECURITY":
      return "Security";

    default:
      return "Other";
  }
}


export function getNotificationPriorityLabel(
  priority: NotificationPriority
) {
  switch (priority) {
    case "CRITICAL":
      return "Critical";

    case "HIGH":
      return "High";

    case "LOW":
      return "Low";

    default:
      return "Normal";
  }
}


export function calculateNotificationSummary(
  notifications: Vault1Notification[]
): NotificationSummary {
  return {
    total: notifications.length,

    unread: notifications.filter(
      (notification) =>
        notification.status === "UNREAD"
    ).length,

    read: notifications.filter(
      (notification) =>
        notification.status === "READ"
    ).length,

    archived: notifications.filter(
      (notification) =>
        notification.status === "ARCHIVED"
    ).length,

    highPriority: notifications.filter(
      (notification) =>
        notification.priority === "HIGH"
    ).length,

    critical: notifications.filter(
      (notification) =>
        notification.priority === "CRITICAL"
    ).length,
  };
}