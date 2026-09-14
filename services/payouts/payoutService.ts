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
  PayoutRequest,
  PayoutRequestStatus,
} from "../../types/payout";

const PAYOUT_COLLECTION =
  "payoutRequests";

function validateAmount(
  amount: number
) {
  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Payout amount must be greater than zero."
    );
  }
}

export async function createPayoutRequest({
  userId,
  investorId,
  investorCode,
  investorName,
  investorEmail,
  requestedAmount,
  availableValue,
  portfolioValue,
  currency = "INR",
  reason = "",
}: {
  userId: string;
  investorId: string;
  investorCode: string;
  investorName: string;
  investorEmail: string;
  requestedAmount: number;
  availableValue: number;
  portfolioValue: number;
  currency?: string;
  reason?: string;
}) {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (!investorId) {
    throw new Error(
      "Investor ID is required."
    );
  }

  if (!investorName.trim()) {
    throw new Error(
      "Investor name is required."
    );
  }

  validateAmount(requestedAmount);

  if (
    !Number.isFinite(availableValue) ||
    availableValue < 0
  ) {
    throw new Error(
      "Available value is invalid."
    );
  }

  if (
    !Number.isFinite(portfolioValue) ||
    portfolioValue < 0
  ) {
    throw new Error(
      "Portfolio value is invalid."
    );
  }

  if (
    requestedAmount > availableValue
  ) {
    throw new Error(
      "Payout request cannot exceed available value."
    );
  }

  const payoutData = {
    userId,

    investorId,
    investorCode:
      investorCode.trim(),
    investorName:
      investorName.trim(),
    investorEmail:
      investorEmail.trim().toLowerCase(),

    requestedAmount,
    availableValue,
    portfolioValue,

    currency:
      currency.trim().toUpperCase(),

    status:
      "PENDING" as PayoutRequestStatus,

    ...(reason.trim()
      ? {
          reason: reason.trim(),
        }
      : {}),

    requestedAt:
      serverTimestamp(),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const payoutRef = await addDoc(
    collection(
      db,
      PAYOUT_COLLECTION
    ),
    payoutData
  );

  return payoutRef.id;
}

export async function getPayoutRequests(
  userId: string
): Promise<PayoutRequest[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const payoutQuery = query(
    collection(
      db,
      PAYOUT_COLLECTION
    ),
    where(
      "userId",
      "==",
      userId
    )
  );

  const snapshot =
    await getDocs(payoutQuery);

  const payouts =
    snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as PayoutRequest[];

  payouts.sort((a, b) => {
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

  return payouts;
}

export async function getPayoutRequest(
  payoutId: string
): Promise<PayoutRequest | null> {
  if (!payoutId) {
    throw new Error(
      "Payout ID is required."
    );
  }

  const payoutQuery = query(
    collection(
      db,
      PAYOUT_COLLECTION
    ),
    where(
      "__name__",
      "==",
      payoutId
    )
  );

  const snapshot =
    await getDocs(payoutQuery);

  if (snapshot.empty) {
    return null;
  }

  const document =
    snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as PayoutRequest;
}

export async function updatePayoutStatus({
  payoutId,
  status,
  adminNotes,
  rejectionReason,
  transactionReference,
}: {
  payoutId: string;
  status: PayoutRequestStatus;
  adminNotes?: string;
  rejectionReason?: string;
  transactionReference?: string;
}) {
  if (!payoutId) {
    throw new Error(
      "Payout ID is required."
    );
  }

  const allowedStatuses: PayoutRequestStatus[] =
    [
      "PENDING",
      "APPROVED",
      "REJECTED",
      "PROCESSING",
      "PROCESSED",
      "CANCELLED",
    ];

  if (
    !allowedStatuses.includes(status)
  ) {
    throw new Error(
      "Invalid payout status."
    );
  }

  const payoutRef = doc(
    db,
    PAYOUT_COLLECTION,
    payoutId
  );

  const updateData: Record<
    string,
    any
  > = {
    status,
    updatedAt:
      serverTimestamp(),
  };

  if (
    adminNotes !== undefined
  ) {
    updateData.adminNotes =
      adminNotes.trim();
  }

  if (
    rejectionReason !== undefined
  ) {
    updateData.rejectionReason =
      rejectionReason.trim();
  }

  if (
    transactionReference !==
    undefined
  ) {
    updateData.transactionReference =
      transactionReference.trim();
  }

  if (
    status === "APPROVED" ||
    status === "REJECTED"
  ) {
    updateData.reviewedAt =
      serverTimestamp();
  }

  if (
    status === "PROCESSED"
  ) {
    updateData.processedAt =
      serverTimestamp();
  }

  await updateDoc(
    payoutRef,
    updateData
  );
}

export async function approvePayout(
  payoutId: string,
  adminNotes = ""
) {
  await updatePayoutStatus({
    payoutId,
    status: "APPROVED",
    adminNotes,
  });
}

export async function rejectPayout(
  payoutId: string,
  rejectionReason: string,
  adminNotes = ""
) {
  if (!rejectionReason.trim()) {
    throw new Error(
      "Rejection reason is required."
    );
  }

  await updatePayoutStatus({
    payoutId,
    status: "REJECTED",
    rejectionReason,
    adminNotes,
  });
}

export async function startPayoutProcessing(
  payoutId: string,
  adminNotes = ""
) {
  await updatePayoutStatus({
    payoutId,
    status: "PROCESSING",
    adminNotes,
  });
}

export async function markPayoutProcessed({
  payoutId,
  transactionReference,
  adminNotes = "",
}: {
  payoutId: string;
  transactionReference: string;
  adminNotes?: string;
}) {
  if (
    !transactionReference.trim()
  ) {
    throw new Error(
      "Transaction reference is required."
    );
  }

  await updatePayoutStatus({
    payoutId,
    status: "PROCESSED",
    transactionReference,
    adminNotes,
  });
}

export function getPayoutStatusLabel(
  status: PayoutRequestStatus
): string {
  switch (status) {
    case "PENDING":
      return "PENDING REVIEW";

    case "APPROVED":
      return "APPROVED";

    case "REJECTED":
      return "REJECTED";

    case "PROCESSING":
      return "PROCESSING";

    case "PROCESSED":
      return "PROCESSED";

    case "CANCELLED":
      return "CANCELLED";

    default:
      return status;
  }
}

export function getPayoutStatusDescription(
  status: PayoutRequestStatus
): string {
  switch (status) {
    case "PENDING":
      return "Awaiting administrative review.";

    case "APPROVED":
      return "Request approved and ready for processing.";

    case "REJECTED":
      return "Request has been rejected.";

    case "PROCESSING":
      return "Request is currently being processed.";

    case "PROCESSED":
      return "Request has been marked as processed.";

    case "CANCELLED":
      return "Request has been cancelled.";

    default:
      return "";
  }
}

export function calculatePayoutSummary(
  payouts: PayoutRequest[]
) {
  const pending = payouts.filter(
    (payout) =>
      payout.status === "PENDING"
  );

  const approved = payouts.filter(
    (payout) =>
      payout.status === "APPROVED"
  );

  const processing = payouts.filter(
    (payout) =>
      payout.status === "PROCESSING"
  );

  const processed = payouts.filter(
    (payout) =>
      payout.status === "PROCESSED"
  );

  const rejected = payouts.filter(
    (payout) =>
      payout.status === "REJECTED"
  );

  const pendingAmount =
    pending.reduce(
      (total, payout) =>
        total +
        payout.requestedAmount,
      0
    );

  const approvedAmount =
    approved.reduce(
      (total, payout) =>
        total +
        payout.requestedAmount,
      0
    );

  const processingAmount =
    processing.reduce(
      (total, payout) =>
        total +
        payout.requestedAmount,
      0
    );

  const processedAmount =
    processed.reduce(
      (total, payout) =>
        total +
        payout.requestedAmount,
      0
    );

  const rejectedAmount =
    rejected.reduce(
      (total, payout) =>
        total +
        payout.requestedAmount,
      0
    );

  return {
    totalRequests:
      payouts.length,

    pendingCount:
      pending.length,

    approvedCount:
      approved.length,

    processingCount:
      processing.length,

    processedCount:
      processed.length,

    rejectedCount:
      rejected.length,

    pendingAmount,

    approvedAmount,

    processingAmount,

    processedAmount,

    rejectedAmount,

    totalRequestedAmount:
      payouts.reduce(
        (total, payout) =>
          total +
          payout.requestedAmount,
        0
      ),
  };
}