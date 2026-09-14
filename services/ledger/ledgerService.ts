import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";
import {
  LedgerEntry,
  LedgerEntryStatus,
  LedgerEntryType,
} from "../../types/ledger";

const LEDGER_COLLECTION = "ledgerEntries";

/* ========================================================= */
/* CREATE LEDGER ENTRY */
/* ========================================================= */

export async function createLedgerEntry({
  userId,
  type,
  amount,
  currency = "INR",
  description,
  status = "POSTED",
  referenceType,
  referenceId,
}: {
  userId: string;
  type: LedgerEntryType;
  amount: number;
  currency?: string;
  description: string;
  status?: LedgerEntryStatus;
  referenceType?: string;
  referenceId?: string;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!Number.isFinite(amount) || amount === 0) {
    throw new Error("Amount must be a valid non-zero number.");
  }

  if (!description.trim()) {
    throw new Error("Description is required.");
  }

  const entry = {
    userId,
    type,
    amount,
    currency,
    description: description.trim(),
    status,
    ...(referenceType
      ? { referenceType }
      : {}),
    ...(referenceId
      ? { referenceId }
      : {}),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, LEDGER_COLLECTION),
    entry
  );

  return docRef.id;
}

/* ========================================================= */
/* GET USER LEDGER */
/* ========================================================= */

export async function getUserLedger(
  userId: string
): Promise<LedgerEntry[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const ledgerQuery = query(
    collection(db, LEDGER_COLLECTION),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(ledgerQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as LedgerEntry[];
}

/* ========================================================= */
/* CALCULATE CAPITAL */
/* ========================================================= */

export function calculateCapital(
  entries: LedgerEntry[]
) {
  const postedEntries = entries.filter(
    (entry) => entry.status === "POSTED"
  );

  const totalCapital = postedEntries.reduce(
    (total, entry) => total + entry.amount,
    0
  );

  const deposits = postedEntries
    .filter((entry) => entry.type === "DEPOSIT")
    .reduce((total, entry) => total + entry.amount, 0);

  const withdrawals = postedEntries
    .filter((entry) => entry.type === "WITHDRAWAL")
    .reduce(
      (total, entry) => total + Math.abs(entry.amount),
      0
    );

  const investments = postedEntries
    .filter((entry) => entry.type === "INVESTMENT")
    .reduce(
      (total, entry) => total + Math.abs(entry.amount),
      0
    );

  const tradingProfit = postedEntries
    .filter((entry) => entry.type === "TRADE_PROFIT")
    .reduce((total, entry) => total + entry.amount, 0);

  const tradingLoss = postedEntries
    .filter((entry) => entry.type === "TRADE_LOSS")
    .reduce(
      (total, entry) => total + Math.abs(entry.amount),
      0
    );

  const fees = postedEntries
    .filter((entry) => entry.type === "FEE")
    .reduce(
      (total, entry) => total + Math.abs(entry.amount),
      0
    );

  return {
    totalCapital,
    deposits,
    withdrawals,
    investments,
    tradingProfit,
    tradingLoss,
    fees,
  };
}