import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  TradeJournal,
  TradeJournalEmotion,
  TradeJournalOutcome,
} from "../../types/tradeJournal";

const JOURNAL_COLLECTION = "tradeJournal";


function cleanText(value: string) {
  return value.trim();
}


function cleanTags(tags: string[]) {
  return tags
    .map((tag) => tag.trim().toUpperCase())
    .filter(Boolean);
}


/*
============================================================
CREATE JOURNAL ENTRY
============================================================
*/

export async function createTradeJournalEntry({
  userId,
  tradeId,
  asset,
  strategy,
  setup,
  thesis,
  entryReasoning,
  riskPlan,
  plannedStop,
  plannedTarget,
  exitReasoning,
  outcome,
  emotionsBefore,
  emotionsAfter,
  mistakes,
  lessons,
  tags,
  confidence,
  rating,
  actualPnL,
}: {
  userId: string;
  tradeId?: string;

  asset: string;
  strategy: string;

  setup: string;
  thesis: string;
  entryReasoning: string;
  riskPlan: string;

  plannedStop?: number;
  plannedTarget?: number;

  exitReasoning: string;

  outcome: TradeJournalOutcome;

  emotionsBefore: TradeJournalEmotion;
  emotionsAfter: TradeJournalEmotion;

  mistakes: string;
  lessons: string;

  tags: string[];

  confidence: number;
  rating: number;

  actualPnL?: number;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!cleanText(asset)) {
    throw new Error("Asset is required.");
  }

  if (!cleanText(strategy)) {
    throw new Error("Strategy is required.");
  }

  if (!cleanText(setup)) {
    throw new Error("Setup is required.");
  }

  if (!cleanText(thesis)) {
    throw new Error("Trading thesis is required.");
  }

  if (!cleanText(entryReasoning)) {
    throw new Error("Entry reasoning is required.");
  }

  if (!cleanText(riskPlan)) {
    throw new Error("Risk plan is required.");
  }

  if (!cleanText(exitReasoning)) {
    throw new Error("Exit reasoning is required.");
  }

  if (!cleanText(mistakes)) {
    throw new Error("Mistakes field is required.");
  }

  if (!cleanText(lessons)) {
    throw new Error("Lessons field is required.");
  }

  if (
    plannedStop !== undefined &&
    (!Number.isFinite(plannedStop) || plannedStop <= 0)
  ) {
    throw new Error("Planned stop must be greater than zero.");
  }

  if (
    plannedTarget !== undefined &&
    (!Number.isFinite(plannedTarget) || plannedTarget <= 0)
  ) {
    throw new Error("Planned target must be greater than zero.");
  }

  if (
    !Number.isFinite(confidence) ||
    confidence < 1 ||
    confidence > 10
  ) {
    throw new Error("Confidence must be between 1 and 10.");
  }

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error("Rating must be between 1 and 5.");
  }

  if (
    actualPnL !== undefined &&
    !Number.isFinite(actualPnL)
  ) {
    throw new Error("Actual P&L must be a valid number.");
  }

  const journalData = {
    userId,

    ...(tradeId?.trim()
      ? { tradeId: tradeId.trim() }
      : {}),

    asset: cleanText(asset).toUpperCase(),

    strategy: cleanText(strategy),

    setup: cleanText(setup),

    thesis: cleanText(thesis),

    entryReasoning: cleanText(entryReasoning),

    riskPlan: cleanText(riskPlan),

    ...(plannedStop !== undefined
      ? { plannedStop }
      : {}),

    ...(plannedTarget !== undefined
      ? { plannedTarget }
      : {}),

    exitReasoning: cleanText(exitReasoning),

    outcome,

    emotionsBefore,

    emotionsAfter,

    mistakes: cleanText(mistakes),

    lessons: cleanText(lessons),

    tags: cleanTags(tags),

    confidence,

    rating,

    ...(actualPnL !== undefined
      ? { actualPnL }
      : {}),

    createdAt: serverTimestamp(),

    updatedAt: serverTimestamp(),
  };

  const journalRef = await addDoc(
    collection(db, JOURNAL_COLLECTION),
    journalData
  );

  return journalRef.id;
}


/*
============================================================
GET ALL USER JOURNAL ENTRIES
============================================================
*/

export async function getUserTradeJournal(
  userId: string
): Promise<TradeJournal[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const journalQuery = query(
    collection(db, JOURNAL_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(journalQuery);

  const entries = snapshot.docs.map(
    (document) =>
      ({
        id: document.id,
        ...document.data(),
      }) as TradeJournal
  );

  entries.sort((a, b) => {
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

  return entries;
}


/*
============================================================
GET SINGLE JOURNAL ENTRY
============================================================
*/

export async function getTradeJournalEntry(
  journalId: string
): Promise<TradeJournal | null> {
  if (!journalId) {
    throw new Error("Journal ID is required.");
  }

  const journalQuery = query(
    collection(db, JOURNAL_COLLECTION),
    where("__name__", "==", journalId)
  );

  const snapshot = await getDocs(journalQuery);

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];

  return {
    id: document.id,
    ...document.data(),
  } as TradeJournal;
}


/*
============================================================
UPDATE JOURNAL ENTRY
============================================================
*/

export async function updateTradeJournalEntry({
  journalId,

  tradeId,

  asset,
  strategy,

  setup,
  thesis,
  entryReasoning,
  riskPlan,

  plannedStop,
  plannedTarget,

  exitReasoning,

  outcome,

  emotionsBefore,
  emotionsAfter,

  mistakes,
  lessons,

  tags,

  confidence,
  rating,

  actualPnL,
}: {
  journalId: string;

  tradeId?: string;

  asset: string;
  strategy: string;

  setup: string;
  thesis: string;
  entryReasoning: string;
  riskPlan: string;

  plannedStop?: number;
  plannedTarget?: number;

  exitReasoning: string;

  outcome: TradeJournalOutcome;

  emotionsBefore: TradeJournalEmotion;
  emotionsAfter: TradeJournalEmotion;

  mistakes: string;
  lessons: string;

  tags: string[];

  confidence: number;
  rating: number;

  actualPnL?: number;
}) {
  if (!journalId) {
    throw new Error("Journal ID is required.");
  }

  if (!cleanText(asset)) {
    throw new Error("Asset is required.");
  }

  if (!cleanText(strategy)) {
    throw new Error("Strategy is required.");
  }

  if (!cleanText(setup)) {
    throw new Error("Setup is required.");
  }

  if (!cleanText(thesis)) {
    throw new Error("Trading thesis is required.");
  }

  if (!cleanText(entryReasoning)) {
    throw new Error("Entry reasoning is required.");
  }

  if (!cleanText(riskPlan)) {
    throw new Error("Risk plan is required.");
  }

  if (!cleanText(exitReasoning)) {
    throw new Error("Exit reasoning is required.");
  }

  if (!cleanText(mistakes)) {
    throw new Error("Mistakes field is required.");
  }

  if (!cleanText(lessons)) {
    throw new Error("Lessons field is required.");
  }

  if (
    plannedStop !== undefined &&
    (!Number.isFinite(plannedStop) || plannedStop <= 0)
  ) {
    throw new Error("Planned stop must be greater than zero.");
  }

  if (
    plannedTarget !== undefined &&
    (!Number.isFinite(plannedTarget) || plannedTarget <= 0)
  ) {
    throw new Error("Planned target must be greater than zero.");
  }

  if (
    !Number.isFinite(confidence) ||
    confidence < 1 ||
    confidence > 10
  ) {
    throw new Error("Confidence must be between 1 and 10.");
  }

  if (
    !Number.isFinite(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const journalRef = doc(
    db,
    JOURNAL_COLLECTION,
    journalId
  );

  const updateData = {
    ...(tradeId?.trim()
      ? { tradeId: tradeId.trim() }
      : {}),

    asset: cleanText(asset).toUpperCase(),

    strategy: cleanText(strategy),

    setup: cleanText(setup),

    thesis: cleanText(thesis),

    entryReasoning: cleanText(entryReasoning),

    riskPlan: cleanText(riskPlan),

    ...(plannedStop !== undefined
      ? { plannedStop }
      : {}),

    ...(plannedTarget !== undefined
      ? { plannedTarget }
      : {}),

    exitReasoning: cleanText(exitReasoning),

    outcome,

    emotionsBefore,

    emotionsAfter,

    mistakes: cleanText(mistakes),

    lessons: cleanText(lessons),

    tags: cleanTags(tags),

    confidence,

    rating,

    ...(actualPnL !== undefined
      ? { actualPnL }
      : {}),

    updatedAt: serverTimestamp(),
  };

  await updateDoc(
    journalRef,
    updateData
  );
}


/*
============================================================
DELETE JOURNAL ENTRY
============================================================
*/

export async function deleteTradeJournalEntry(
  journalId: string
) {
  if (!journalId) {
    throw new Error("Journal ID is required.");
  }

  await deleteDoc(
    doc(
      db,
      JOURNAL_COLLECTION,
      journalId
    )
  );
}


/*
============================================================
JOURNAL ANALYTICS
============================================================
*/

export function calculateJournalSummary(
  entries: TradeJournal[]
) {
  const totalEntries = entries.length;

  const winningEntries = entries.filter(
    (entry) => entry.outcome === "WIN"
  );

  const losingEntries = entries.filter(
    (entry) => entry.outcome === "LOSS"
  );

  const breakevenEntries = entries.filter(
    (entry) => entry.outcome === "BREAKEVEN"
  );

  const closedEntries = entries.filter(
    (entry) =>
      entry.outcome === "WIN" ||
      entry.outcome === "LOSS" ||
      entry.outcome === "BREAKEVEN"
  );

  const totalPnL = entries.reduce(
    (total, entry) =>
      total + (entry.actualPnL ?? 0),
    0
  );

  const averageConfidence =
    totalEntries > 0
      ? entries.reduce(
          (total, entry) =>
            total + entry.confidence,
          0
        ) / totalEntries
      : 0;

  const averageRating =
    totalEntries > 0
      ? entries.reduce(
          (total, entry) =>
            total + entry.rating,
          0
        ) / totalEntries
      : 0;

  const winRate =
    closedEntries.length > 0
      ? (winningEntries.length /
          closedEntries.length) *
        100
      : 0;

  return {
    totalEntries,

    winningEntries:
      winningEntries.length,

    losingEntries:
      losingEntries.length,

    breakevenEntries:
      breakevenEntries.length,

    closedEntries:
      closedEntries.length,

    totalPnL,

    averageConfidence,

    averageRating,

    winRate,
  };
}