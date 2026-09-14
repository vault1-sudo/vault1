import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
  LeaderboardSummary,
} from "../../types/leaderboard";

const leaderboardCollection = collection(
  db,
  "leaderboardEntries"
);

function normalizeEntry(
  id: string,
  data: Record<string, any>
): LeaderboardEntry {
  return {
    id,

    userId:
      data.userId ?? "",

    username:
      data.username ?? "",

    displayName:
      data.displayName ??
      "Vault1 Trader",

    avatarUrl:
      data.avatarUrl,

    traderProfileId:
      data.traderProfileId,

    period:
      data.period ??
      "ALL_TIME",

    status:
      data.status ??
      "DRAFT",

    verified:
      data.verified ??
      false,

    rank:
      data.rank ??
      0,

    previousRank:
      data.previousRank ??
      0,

    returnPercent:
      Number(
        data.returnPercent ?? 0
      ),

    profit:
      Number(
        data.profit ?? 0
      ),

    winRate:
      Number(
        data.winRate ?? 0
      ),

    profitFactor:
      Number(
        data.profitFactor ?? 0
      ),

    riskAdjustedReturn:
      Number(
        data.riskAdjustedReturn ?? 0
      ),

    consistencyScore:
      Number(
        data.consistencyScore ?? 0
      ),

    competitionScore:
      Number(
        data.competitionScore ?? 0
      ),

    totalTrades:
      Number(
        data.totalTrades ?? 0
      ),

    winningTrades:
      Number(
        data.winningTrades ?? 0
      ),

    losingTrades:
      Number(
        data.losingTrades ?? 0
      ),

    largestWin:
      Number(
        data.largestWin ?? 0
      ),

    largestLoss:
      Number(
        data.largestLoss ?? 0
      ),

    maxDrawdown:
      Number(
        data.maxDrawdown ?? 0
      ),

    score:
      Number(
        data.score ?? 0
      ),

    updatedAt:
      data.updatedAt,

    createdAt:
      data.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/* SCORE ENGINE                                                               */
/* -------------------------------------------------------------------------- */

export function calculateLeaderboardScore(
  metric: LeaderboardMetric,
  entry: {
    returnPercent: number;
    profit: number;
    winRate: number;
    profitFactor: number;
    riskAdjustedReturn: number;
    consistencyScore: number;
    competitionScore: number;
  }
): number {
  switch (metric) {
    case "PROFIT":
      return entry.profit;

    case "WIN_RATE":
      return entry.winRate;

    case "PROFIT_FACTOR":
      return entry.profitFactor;

    case "RISK_ADJUSTED":
      return entry.riskAdjustedReturn;

    case "CONSISTENCY":
      return entry.consistencyScore;

    case "COMPETITION_SCORE":
      return entry.competitionScore;

    case "RETURN_PERCENT":
    default:
      return entry.returnPercent;
  }
}

/* -------------------------------------------------------------------------- */
/* CREATE / UPSERT                                                            */
/* -------------------------------------------------------------------------- */

export async function createLeaderboardEntry(
  params: {
    userId: string;

    username: string;
    displayName: string;

    avatarUrl?: string;

    traderProfileId?: string;

    period: LeaderboardPeriod;

    returnPercent?: number;
    profit?: number;

    winRate?: number;
    profitFactor?: number;

    riskAdjustedReturn?: number;
    consistencyScore?: number;

    competitionScore?: number;

    totalTrades?: number;
    winningTrades?: number;
    losingTrades?: number;

    largestWin?: number;
    largestLoss?: number;

    maxDrawdown?: number;
  }
) {
  if (!params.userId) {
    throw new Error(
      "Authentication is required."
    );
  }

  if (!params.displayName.trim()) {
    throw new Error(
      "Display name is required."
    );
  }

  const existingQuery =
    query(
      leaderboardCollection,
      where(
        "userId",
        "==",
        params.userId
      ),
      where(
        "period",
        "==",
        params.period
      ),
      limit(1)
    );

  const existingSnapshot =
    await getDocs(
      existingQuery
    );

  const entryData = {
    userId:
      params.userId,

    username:
      params.username,

    displayName:
      params.displayName,

    avatarUrl:
      params.avatarUrl ??
      null,

    traderProfileId:
      params.traderProfileId ??
      null,

    period:
      params.period,

    status:
      "DRAFT",

    verified:
      false,

    rank:
      0,

    previousRank:
      0,

    returnPercent:
      Number(
        params.returnPercent ?? 0
      ),

    profit:
      Number(
        params.profit ?? 0
      ),

    winRate:
      Number(
        params.winRate ?? 0
      ),

    profitFactor:
      Number(
        params.profitFactor ?? 0
      ),

    riskAdjustedReturn:
      Number(
        params.riskAdjustedReturn ??
          0
      ),

    consistencyScore:
      Number(
        params.consistencyScore ?? 0
      ),

    competitionScore:
      Number(
        params.competitionScore ??
          0
      ),

    totalTrades:
      Number(
        params.totalTrades ?? 0
      ),

    winningTrades:
      Number(
        params.winningTrades ?? 0
      ),

    losingTrades:
      Number(
        params.losingTrades ?? 0
      ),

    largestWin:
      Number(
        params.largestWin ?? 0
      ),

    largestLoss:
      Number(
        params.largestLoss ?? 0
      ),

    maxDrawdown:
      Number(
        params.maxDrawdown ?? 0
      ),

    score:
      Number(
        params.returnPercent ?? 0
      ),

    updatedAt:
      serverTimestamp(),

    createdAt:
      serverTimestamp(),
  };

  if (
    !existingSnapshot.empty
  ) {
    const existing =
      existingSnapshot.docs[0];

    await updateDoc(
      doc(
        db,
        "leaderboardEntries",
        existing.id
      ),
      {
        ...entryData,

        createdAt:
          existing.data()
            .createdAt ??
          serverTimestamp(),
      }
    );

    return existing.id;
  }

  const reference =
    await addDoc(
      leaderboardCollection,
      entryData
    );

  return reference.id;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC LEADERBOARD                                                         */
/* -------------------------------------------------------------------------- */

export async function getLeaderboard(
  period: LeaderboardPeriod,
  metric: LeaderboardMetric
): Promise<LeaderboardEntry[]> {
  const leaderboardQuery =
    query(
      leaderboardCollection,
      where(
        "period",
        "==",
        period
      ),
      where(
        "status",
        "==",
        "PUBLIC"
      ),
      limit(500)
    );

  const snapshot =
    await getDocs(
      leaderboardQuery
    );

  return snapshot.docs
    .map((item) =>
      normalizeEntry(
        item.id,
        item.data()
      )
    )
    .filter(
      (entry) =>
        entry.status ===
        "PUBLIC"
    )
    .sort(
      (a, b) =>
        calculateLeaderboardScore(
          metric,
          b
        ) -
        calculateLeaderboardScore(
          metric,
          a
        )
    )
    .map(
      (
        entry,
        index
      ) => ({
        ...entry,
        rank:
          index + 1,
      })
    );
}

export function subscribeToLeaderboard(
  period: LeaderboardPeriod,
  metric: LeaderboardMetric,
  callback: (
    entries: LeaderboardEntry[]
  ) => void
) {
  const leaderboardQuery =
    query(
      leaderboardCollection,
      where(
        "period",
        "==",
        period
      ),
      where(
        "status",
        "==",
        "PUBLIC"
      ),
      limit(500)
    );

  return onSnapshot(
    leaderboardQuery,
    (snapshot) => {
      const entries =
        snapshot.docs
          .map((item) =>
            normalizeEntry(
              item.id,
              item.data()
            )
          )
          .filter(
            (entry) =>
              entry.status ===
              "PUBLIC"
          )
          .sort(
            (a, b) =>
              calculateLeaderboardScore(
                metric,
                b
              ) -
              calculateLeaderboardScore(
                metric,
                a
              )
          )
          .map(
            (
              entry,
              index
            ) => ({
              ...entry,
              rank:
                index + 1,
            })
          );

      callback(
        entries
      );
    }
  );
}

/* -------------------------------------------------------------------------- */
/* USER ENTRIES                                                               */
/* -------------------------------------------------------------------------- */

export async function getUserLeaderboardEntries(
  userId: string
): Promise<LeaderboardEntry[]> {
  const userQuery =
    query(
      leaderboardCollection,
      where(
        "userId",
        "==",
        userId
      ),
      limit(20)
    );

  const snapshot =
    await getDocs(
      userQuery
    );

  return snapshot.docs
    .map((item) =>
      normalizeEntry(
        item.id,
        item.data()
      )
    )
    .sort(
      (a, b) =>
        a.period.localeCompare(
          b.period
        )
    );
}

/* -------------------------------------------------------------------------- */
/* PUBLIC PROFILE                                                               */
/* -------------------------------------------------------------------------- */

export async function publishLeaderboardEntry(
  entryId: string,
  userId: string
) {
  const entries =
    await getUserLeaderboardEntries(
      userId
    );

  const entry =
    entries.find(
      (item) =>
        item.id === entryId
    );

  if (!entry) {
    throw new Error(
      "Leaderboard entry not found."
    );
  }

  await updateDoc(
    doc(
      db,
      "leaderboardEntries",
      entryId
    ),
    {
      status:
        "PUBLIC",

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function hideLeaderboardEntry(
  entryId: string,
  userId: string
) {
  const entries =
    await getUserLeaderboardEntries(
      userId
    );

  const entry =
    entries.find(
      (item) =>
        item.id === entryId
    );

  if (!entry) {
    throw new Error(
      "Leaderboard entry not found."
    );
  }

  await updateDoc(
    doc(
      db,
      "leaderboardEntries",
      entryId
    ),
    {
      status:
        "DRAFT",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getLeaderboardSummary(
  period: LeaderboardPeriod
): Promise<LeaderboardSummary> {
  const entries =
    await getLeaderboard(
      period,
      "RETURN_PERCENT"
    );

  if (
    entries.length ===
    0
  ) {
    return {
      totalTraders: 0,
      verifiedTraders: 0,
      topReturn: 0,
      topProfit: 0,
      topWinRate: 0,
      averageReturn: 0,
      averageWinRate: 0,
    };
  }

  const totalReturn =
    entries.reduce(
      (sum, entry) =>
        sum +
        entry.returnPercent,
      0
    );

  const totalWinRate =
    entries.reduce(
      (sum, entry) =>
        sum +
        entry.winRate,
      0
    );

  return {
    totalTraders:
      entries.length,

    verifiedTraders:
      entries.filter(
        (entry) =>
          entry.verified
      ).length,

    topReturn:
      Math.max(
        ...entries.map(
          (entry) =>
            entry.returnPercent
        )
      ),

    topProfit:
      Math.max(
        ...entries.map(
          (entry) =>
            entry.profit
        )
      ),

    topWinRate:
      Math.max(
        ...entries.map(
          (entry) =>
            entry.winRate
        )
      ),

    averageReturn:
      totalReturn /
      entries.length,

    averageWinRate:
      totalWinRate /
      entries.length,
  };
}