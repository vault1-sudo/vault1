import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  Competition,
  CompetitionEntryType,
  CompetitionLeaderboardRow,
  CompetitionMetric,
  CompetitionParticipant,
  CompetitionParticipantStatus,
  CompetitionVisibility,
} from "../../types/competition";

const competitionsCollection = collection(
  db,
  "competitions"
);

function participantsCollection(
  competitionId: string
) {
  return collection(
    db,
    "competitions",
    competitionId,
    "participants"
  );
}

function normalizeCompetition(
  id: string,
  data: Record<string, any>
): Competition {
  return {
    id,

    userId:
      data.userId ?? "",

    hostUserId:
      data.hostUserId ??
      data.userId ??
      "",

    hostName:
      data.hostName ??
      "Vault1 Host",

    title:
      data.title ??
      "Untitled Competition",

    description:
      data.description ??
      "",

    category:
      data.category ??
      "TRADING",

    visibility:
      data.visibility ??
      "PUBLIC",

    status:
      data.status ??
      "DRAFT",

    metric:
      data.metric ??
      "RETURN_PERCENT",

    entryType:
      data.entryType ??
      "FREE",

    startsAt:
      data.startsAt,

    endsAt:
      data.endsAt,

    maxParticipants:
      data.maxParticipants ??
      100,

    participantCount:
      data.participantCount ??
      0,

    startingCapital:
      data.startingCapital ??
      0,

    currency:
      data.currency ??
      "INR",

    prizeEnabled:
      data.prizeEnabled ??
      false,

    prizeDescription:
      data.prizeDescription,

    rules:
      Array.isArray(data.rules)
        ? data.rules
        : [],

    channelId:
      data.channelId,

    traderProfileId:
      data.traderProfileId,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizeParticipant(
  id: string,
  data: Record<string, any>
): CompetitionParticipant {
  return {
    id,

    competitionId:
      data.competitionId ??
      "",

    userId:
      data.userId ??
      "",

    displayName:
      data.displayName ??
      "Vault1 User",

    username:
      data.username,

    status:
      data.status ??
      "REGISTERED",

    startingCapital:
      data.startingCapital ??
      0,

    currentCapital:
      data.currentCapital ??
      0,

    profit:
      data.profit ??
      0,

    returnPercent:
      data.returnPercent ??
      0,

    winRate:
      data.winRate ??
      0,

    totalTrades:
      data.totalTrades ??
      0,

    winningTrades:
      data.winningTrades ??
      0,

    losingTrades:
      data.losingTrades ??
      0,

    riskScore:
      data.riskScore ??
      0,

    score:
      data.score ??
      0,

    rank:
      data.rank ??
      0,

    joinedAt:
      data.joinedAt,

    updatedAt:
      data.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* CREATE                                                                     */
/* -------------------------------------------------------------------------- */

export async function createCompetition(params: {
  userId: string;
  hostName: string;

  title: string;
  description: string;

  category: string;

  visibility: CompetitionVisibility;

  metric: CompetitionMetric;

  entryType: CompetitionEntryType;

  startsAt?: Date | null;
  endsAt?: Date | null;

  maxParticipants?: number;

  startingCapital?: number;

  currency?: string;

  prizeEnabled?: boolean;
  prizeDescription?: string;

  rules?: string[];

  channelId?: string;
  traderProfileId?: string;
}) {
  if (!params.userId) {
    throw new Error(
      "Authentication is required."
    );
  }

  if (!params.title.trim()) {
    throw new Error(
      "Competition title is required."
    );
  }

  const startsAt =
    params.startsAt ?? null;

  const status =
    startsAt
      ? "SCHEDULED"
      : "ACTIVE";

  const competitionRef =
    await addDoc(
      competitionsCollection,
      {
        userId:
          params.userId,

        hostUserId:
          params.userId,

        hostName:
          params.hostName,

        title:
          params.title.trim(),

        description:
          params.description.trim(),

        category:
          params.category,

        visibility:
          params.visibility,

        status,

        metric:
          params.metric,

        entryType:
          params.entryType,

        startsAt,

        endsAt:
          params.endsAt ??
          null,

        maxParticipants:
          params.maxParticipants ??
          100,

        participantCount:
          0,

        startingCapital:
          params.startingCapital ??
          0,

        currency:
          params.currency ??
          "INR",

        prizeEnabled:
          params.prizeEnabled ??
          false,

        prizeDescription:
          params.prizeDescription ??
          null,

        rules:
          params.rules ??
          [],

        channelId:
          params.channelId ??
          null,

        traderProfileId:
          params.traderProfileId ??
          null,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );

  return competitionRef.id;
}

/* -------------------------------------------------------------------------- */
/* READ                                                                       */
/* -------------------------------------------------------------------------- */

export async function getCompetition(
  competitionId: string
): Promise<Competition | null> {
  const snapshot =
    await getDoc(
      doc(
        db,
        "competitions",
        competitionId
      )
    );

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeCompetition(
    snapshot.id,
    snapshot.data()
  );
}

export async function getUserCompetitions(
  userId: string
): Promise<Competition[]> {
  const competitionsQuery =
    query(
      competitionsCollection,
      where(
        "hostUserId",
        "==",
        userId
      ),
      limit(100)
    );

  const snapshot =
    await getDocs(
      competitionsQuery
    );

  return snapshot.docs
    .map((item) =>
      normalizeCompetition(
        item.id,
        item.data()
      )
    )
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ??
        0;

      const bTime =
        b.createdAt?.toMillis?.() ??
        0;

      return bTime - aTime;
    });
}

export async function getPublicCompetitions(): Promise<
  Competition[]
> {
  const competitionsQuery =
    query(
      competitionsCollection,
      where(
        "visibility",
        "==",
        "PUBLIC"
      ),
      limit(100)
    );

  const snapshot =
    await getDocs(
      competitionsQuery
    );

  return snapshot.docs
    .map((item) =>
      normalizeCompetition(
        item.id,
        item.data()
      )
    )
    .filter(
      (competition) =>
        competition.status ===
          "SCHEDULED" ||
        competition.status ===
          "ACTIVE"
    )
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ??
        0;

      const bTime =
        b.createdAt?.toMillis?.() ??
        0;

      return bTime - aTime;
    });
}

export function subscribeToCompetitions(
  callback: (
    competitions: Competition[]
  ) => void
) {
  const competitionsQuery =
    query(
      competitionsCollection,
      limit(100)
    );

  return onSnapshot(
    competitionsQuery,
    (snapshot) => {
      const competitions =
        snapshot.docs
          .map((item) =>
            normalizeCompetition(
              item.id,
              item.data()
            )
          )
          .filter(
            (competition) =>
              competition.status ===
                "SCHEDULED" ||
              competition.status ===
                "ACTIVE"
          )
          .sort((a, b) => {
            const aTime =
              a.createdAt?.toMillis?.() ??
              0;

            const bTime =
              b.createdAt?.toMillis?.() ??
              0;

            return bTime - aTime;
          });

      callback(
        competitions
      );
    }
  );
}

/* -------------------------------------------------------------------------- */
/* LIFECYCLE                                                                  */
/* -------------------------------------------------------------------------- */

export async function activateCompetition(
  competitionId: string,
  userId: string
) {
  const competition =
    await getCompetition(
      competitionId
    );

  if (!competition) {
    throw new Error(
      "Competition not found."
    );
  }

  if (
    competition.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the host can activate this competition."
    );
  }

  await updateDoc(
    doc(
      db,
      "competitions",
      competitionId
    ),
    {
      status:
        "ACTIVE",

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function completeCompetition(
  competitionId: string,
  userId: string
) {
  const competition =
    await getCompetition(
      competitionId
    );

  if (!competition) {
    throw new Error(
      "Competition not found."
    );
  }

  if (
    competition.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the host can complete this competition."
    );
  }

  await updateDoc(
    doc(
      db,
      "competitions",
      competitionId
    ),
    {
      status:
        "COMPLETED",

      updatedAt:
        serverTimestamp(),
    }
  );

  await recalculateCompetitionRanks(
    competitionId
  );
}

export async function cancelCompetition(
  competitionId: string,
  userId: string
) {
  const competition =
    await getCompetition(
      competitionId
    );

  if (!competition) {
    throw new Error(
      "Competition not found."
    );
  }

  if (
    competition.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the host can cancel this competition."
    );
  }

  await updateDoc(
    doc(
      db,
      "competitions",
      competitionId
    ),
    {
      status:
        "CANCELLED",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* PARTICIPANTS                                                               */
/* -------------------------------------------------------------------------- */

export async function joinCompetition(
  params: {
    competitionId: string;
    userId: string;
    displayName: string;
    username?: string;
  }
) {
  const competition =
    await getCompetition(
      params.competitionId
    );

  if (!competition) {
    throw new Error(
      "Competition not found."
    );
  }

  if (
    competition.status !==
      "ACTIVE" &&
    competition.status !==
      "SCHEDULED"
  ) {
    throw new Error(
      "This competition is not accepting participants."
    );
  }

  if (
    competition.participantCount >=
    competition.maxParticipants
  ) {
    throw new Error(
      "This competition is full."
    );
  }

  const participantRef =
    doc(
      db,
      "competitions",
      params.competitionId,
      "participants",
      params.userId
    );

  const existing =
    await getDoc(
      participantRef
    );

  if (
    existing.exists()
  ) {
    const existingData =
      existing.data();

    if (
      existingData.status ===
        "REGISTERED" ||
      existingData.status ===
        "ACTIVE"
    ) {
      return;
    }
  }

  const startingCapital =
    competition.startingCapital;

  await setDoc(
    participantRef,
    {
      competitionId:
        params.competitionId,

      userId:
        params.userId,

      displayName:
        params.displayName,

      username:
        params.username ??
        null,

      status:
        competition.status ===
        "ACTIVE"
          ? "ACTIVE"
          : "REGISTERED",

      startingCapital,

      currentCapital:
        startingCapital,

      profit:
        0,

      returnPercent:
        0,

      winRate:
        0,

      totalTrades:
        0,

      winningTrades:
        0,

      losingTrades:
        0,

      riskScore:
        0,

      score:
        0,

      rank:
        0,

      joinedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshCompetitionParticipantCount(
    params.competitionId
  );
}

export async function withdrawFromCompetition(
  competitionId: string,
  userId: string
) {
  const participantRef =
    doc(
      db,
      "competitions",
      competitionId,
      "participants",
      userId
    );

  const snapshot =
    await getDoc(
      participantRef
    );

  if (!snapshot.exists()) {
    return;
  }

  await updateDoc(
    participantRef,
    {
      status:
        "WITHDRAWN",

      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshCompetitionParticipantCount(
    competitionId
  );
}

async function refreshCompetitionParticipantCount(
  competitionId: string
) {
  const participantsQuery =
    query(
      participantsCollection(
        competitionId
      ),
      where(
        "status",
        "in",
        [
          "REGISTERED",
          "ACTIVE",
        ]
      )
    );

  const snapshot =
    await getDocs(
      participantsQuery
    );

  await updateDoc(
    doc(
      db,
      "competitions",
      competitionId
    ),
    {
      participantCount:
        snapshot.size,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function getCompetitionParticipants(
  competitionId: string
): Promise<
  CompetitionParticipant[]
> {
  const participantsQuery =
    query(
      participantsCollection(
        competitionId
      ),
      limit(500)
    );

  const snapshot =
    await getDocs(
      participantsQuery
    );

  return snapshot.docs
    .map((item) =>
      normalizeParticipant(
        item.id,
        item.data()
      )
    )
    .sort(
      (a, b) =>
        b.score - a.score
    );
}

export function subscribeToCompetitionParticipants(
  competitionId: string,
  callback: (
    participants: CompetitionParticipant[]
  ) => void
) {
  const participantsQuery =
    query(
      participantsCollection(
        competitionId
      ),
      limit(500)
    );

  return onSnapshot(
    participantsQuery,
    (snapshot) => {
      const participants =
        snapshot.docs
          .map((item) =>
            normalizeParticipant(
              item.id,
              item.data()
            )
          )
          .sort(
            (a, b) =>
              b.score - a.score
          );

      callback(
        participants
      );
    }
  );
}

/* -------------------------------------------------------------------------- */
/* PERFORMANCE                                                                */
/* -------------------------------------------------------------------------- */

export async function updateCompetitionPerformance(
  competitionId: string,
  userId: string,
  params: {
    currentCapital: number;
    profit: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    riskScore?: number;
  }
) {
  const competition =
    await getCompetition(
      competitionId
    );

  if (!competition) {
    throw new Error(
      "Competition not found."
    );
  }

  const participantRef =
    doc(
      db,
      "competitions",
      competitionId,
      "participants",
      userId
    );

  const participantSnapshot =
    await getDoc(
      participantRef
    );

  if (
    !participantSnapshot.exists()
  ) {
    throw new Error(
      "Participant not found."
    );
  }

  const participant =
    normalizeParticipant(
      participantSnapshot.id,
      participantSnapshot.data()
    );

  const startingCapital =
    participant.startingCapital;

  const currentCapital =
    Number(
      params.currentCapital
    );

  const profit =
    Number(
      params.profit
    );

  const returnPercent =
    startingCapital > 0
      ? (
          profit /
          startingCapital
        ) *
        100
      : 0;

  const totalTrades =
    Math.max(
      0,
      Number(
        params.totalTrades
      )
    );

  const winningTrades =
    Math.max(
      0,
      Number(
        params.winningTrades
      )
    );

  const losingTrades =
    Math.max(
      0,
      Number(
        params.losingTrades
      )
    );

  const winRate =
    totalTrades > 0
      ? (
          winningTrades /
          totalTrades
        ) *
        100
      : 0;

  const riskScore =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          params.riskScore ??
            0
        )
      )
    );

  const score =
    calculateCompetitionScore(
      competition.metric,
      returnPercent,
      profit,
      winRate,
      riskScore
    );

  await updateDoc(
    participantRef,
    {
      currentCapital,

      profit,

      returnPercent,

      totalTrades,

      winningTrades,

      losingTrades,

      winRate,

      riskScore,

      score,

      status:
        "ACTIVE",

      updatedAt:
        serverTimestamp(),
    }
  );

  await recalculateCompetitionRanks(
    competitionId
  );
}

function calculateCompetitionScore(
  metric: CompetitionMetric,
  returnPercent: number,
  profit: number,
  winRate: number,
  riskScore: number
) {
  switch (metric) {
    case "PROFIT":
      return profit;

    case "WIN_RATE":
      return winRate;

    case "RISK_ADJUSTED_RETURN":
      return (
        returnPercent *
        (1 -
          riskScore / 100)
      );

    case "RETURN_PERCENT":
    default:
      return returnPercent;
  }
}

export async function recalculateCompetitionRanks(
  competitionId: string
) {
  const participants =
    await getCompetitionParticipants(
      competitionId
    );

  const ranked =
    participants
      .filter(
        (participant) =>
          participant.status !==
            "WITHDRAWN" &&
          participant.status !==
            "DISQUALIFIED"
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );

  for (
    let index = 0;
    index <
    ranked.length;
    index++
  ) {
    const participant =
      ranked[index];

    await updateDoc(
      doc(
        db,
        "competitions",
        competitionId,
        "participants",
        participant.userId
      ),
      {
        rank:
          index + 1,

        updatedAt:
          serverTimestamp(),
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/* LEADERBOARD                                                                */
/* -------------------------------------------------------------------------- */

export async function getCompetitionLeaderboard(
  competitionId: string
): Promise<
  CompetitionLeaderboardRow[]
> {
  const participants =
    await getCompetitionParticipants(
      competitionId
    );

  return participants
    .filter(
      (participant) =>
        participant.status !==
          "WITHDRAWN" &&
        participant.status !==
          "DISQUALIFIED"
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .map(
      (
        participant,
        index
      ) => ({
        rank:
          index + 1,

        participantId:
          participant.id,

        userId:
          participant.userId,

        displayName:
          participant.displayName,

        username:
          participant.username,

        score:
          participant.score,

        returnPercent:
          participant.returnPercent,

        profit:
          participant.profit,

        winRate:
          participant.winRate,

        totalTrades:
          participant.totalTrades,

        status:
          participant.status,
      })
    );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCompetitionSummary(
  userId: string
) {
  const competitions =
    await getUserCompetitions(
      userId
    );

  return {
    total:
      competitions.length,

    scheduled:
      competitions.filter(
        (item) =>
          item.status ===
          "SCHEDULED"
      ).length,

    active:
      competitions.filter(
        (item) =>
          item.status ===
          "ACTIVE"
      ).length,

    completed:
      competitions.filter(
        (item) =>
          item.status ===
          "COMPLETED"
      ).length,

    participants:
      competitions.reduce(
        (
          sum,
          item
        ) =>
          sum +
          item.participantCount,
        0
      ),
  };
}