import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  RewardDefinition,
  RewardLedgerEntry,
  RewardSummary,
  UserReward,
  UserRewardProfile,
} from "../../types/reward";

const rewardsCollection = collection(
  db,
  "rewardDefinitions"
);

const userRewardsCollection = collection(
  db,
  "userRewards"
);

const rewardLedgerCollection = collection(
  db,
  "rewardLedger"
);

const rewardProfilesCollection = collection(
  db,
  "rewardProfiles"
);

function normalizeReward(
  id: string,
  data: Record<string, any>
): RewardDefinition {
  return {
    id,
    code: data.code ?? "",
    name: data.name ?? "",
    description: data.description ?? "",
    category: data.category ?? "MILESTONE",
    type: data.type ?? "POINTS",
    icon: data.icon ?? "★",
    points: Number(data.points ?? 0),
    xp: Number(data.xp ?? 0),
    requirement: data.requirement ?? "",
    requirementValue:
      data.requirementValue != null
        ? Number(data.requirementValue)
        : undefined,
    monetaryValue: Number(data.monetaryValue ?? 0),
    monetaryEnabled:
      data.monetaryEnabled ?? false,
    active: data.active ?? true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function normalizeUserReward(
  id: string,
  data: Record<string, any>
): UserReward {
  return {
    id,
    userId: data.userId ?? "",
    rewardId: data.rewardId ?? "",
    rewardCode: data.rewardCode ?? "",
    rewardName: data.rewardName ?? "",
    category: data.category ?? "MILESTONE",
    type: data.type ?? "POINTS",
    status: data.status ?? "ACTIVE",
    pointsAwarded: Number(
      data.pointsAwarded ?? 0
    ),
    xpAwarded: Number(
      data.xpAwarded ?? 0
    ),
    monetaryValue: Number(
      data.monetaryValue ?? 0
    ),
    monetaryEnabled:
      data.monetaryEnabled ?? false,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    earnedAt: data.earnedAt,
    claimedAt: data.claimedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

function normalizeProfile(
  id: string,
  data: Record<string, any>
): UserRewardProfile {
  return {
    id,
    userId: data.userId ?? "",
    points: Number(data.points ?? 0),
    lifetimePoints: Number(
      data.lifetimePoints ?? 0
    ),
    xp: Number(data.xp ?? 0),
    level: Number(data.level ?? 1),
    nextLevelXp: Number(
      data.nextLevelXp ?? 100
    ),
    levelProgressPercent: Number(
      data.levelProgressPercent ?? 0
    ),
    achievementCount: Number(
      data.achievementCount ?? 0
    ),
    badgeCount: Number(
      data.badgeCount ?? 0
    ),
    currentStreak: Number(
      data.currentStreak ?? 0
    ),
    longestStreak: Number(
      data.longestStreak ?? 0
    ),
    creatorScore: Number(
      data.creatorScore ?? 0
    ),
    communityScore: Number(
      data.communityScore ?? 0
    ),
    tradingScore: Number(
      data.tradingScore ?? 0
    ),
    competitionScore: Number(
      data.competitionScore ?? 0
    ),
    updatedAt: data.updatedAt,
    createdAt: data.createdAt,
  };
}

function calculateLevel(xp: number) {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 1000) return 4;
  if (xp < 1750) return 5;
  if (xp < 2750) return 6;
  if (xp < 4000) return 7;
  if (xp < 5500) return 8;
  if (xp < 7500) return 9;
  return 10 + Math.floor((xp - 7500) / 2500);
}

function calculateNextLevelXp(
  level: number
) {
  if (level === 1) return 100;
  if (level === 2) return 250;
  if (level === 3) return 500;
  if (level === 4) return 1000;
  if (level === 5) return 1750;
  if (level === 6) return 2750;
  if (level === 7) return 4000;
  if (level === 8) return 5500;
  if (level === 9) return 7500;

  return (
    7500 +
    (level - 9) * 2500
  );
}

function calculateProgress(
  xp: number,
  level: number
) {
  const previous =
    level <= 1
      ? 0
      : calculateNextLevelXp(level - 1);

  const next =
    calculateNextLevelXp(level);

  if (next <= previous) {
    return 100;
  }

  return Math.min(
    100,
    Math.max(
      0,
      ((xp - previous) /
        (next - previous)) *
        100
    )
  );
}

/* -------------------------------------------------------------------------- */
/* REWARD DEFINITIONS                                                         */
/* -------------------------------------------------------------------------- */

export async function createRewardDefinition(
  data: Omit<
    RewardDefinition,
    "id" | "createdAt" | "updatedAt"
  >
) {
  const existing = await getDocs(
    query(
      rewardsCollection,
      where("code", "==", data.code),
      limit(1)
    )
  );

  if (!existing.empty) {
    throw new Error(
      "A reward with this code already exists."
    );
  }

  const ref = await addDoc(
    rewardsCollection,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return ref.id;
}

export async function getRewardDefinitions() {
  const snapshot = await getDocs(
    query(
      rewardsCollection,
      limit(500)
    )
  );

  return snapshot.docs
    .map((item) =>
      normalizeReward(
        item.id,
        item.data()
      )
    )
    .filter(
      (reward) => reward.active
    )
    .sort(
      (a, b) =>
        b.points - a.points
    );
}

/* -------------------------------------------------------------------------- */
/* USER REWARD PROFILE                                                        */
/* -------------------------------------------------------------------------- */

export async function getUserRewardProfile(
  userId: string
): Promise<UserRewardProfile | null> {
  const snapshot = await getDocs(
    query(
      rewardProfilesCollection,
      where(
        "userId",
        "==",
        userId
      ),
      limit(1)
    )
  );

  if (snapshot.empty) {
    return null;
  }

  const item = snapshot.docs[0];

  return normalizeProfile(
    item.id,
    item.data()
  );
}

export async function createUserRewardProfile(
  userId: string
) {
  const existing =
    await getUserRewardProfile(
      userId
    );

  if (existing) {
    return existing.id;
  }

  const data = {
    userId,

    points: 0,
    lifetimePoints: 0,

    xp: 0,

    level: 1,
    nextLevelXp: 100,
    levelProgressPercent: 0,

    achievementCount: 0,
    badgeCount: 0,

    currentStreak: 0,
    longestStreak: 0,

    creatorScore: 0,
    communityScore: 0,
    tradingScore: 0,
    competitionScore: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(
    rewardProfilesCollection,
    data
  );

  return ref.id;
}

/* -------------------------------------------------------------------------- */
/* AWARD REWARD                                                               */
/* -------------------------------------------------------------------------- */

export async function awardReward(
  userId: string,
  rewardId: string,
  sourceType?: string,
  sourceId?: string
) {
  const rewardSnapshot =
    await getDocs(
      query(
        rewardsCollection,
        where(
          "__name__",
          "==",
          rewardId
        ),
        limit(1)
      )
    );

  if (rewardSnapshot.empty) {
    throw new Error(
      "Reward definition not found."
    );
  }

  const reward =
    normalizeReward(
      rewardSnapshot.docs[0].id,
      rewardSnapshot.docs[0].data()
    );

  if (!reward.active) {
    throw new Error(
      "This reward is not active."
    );
  }

  const existing =
    await getDocs(
      query(
        userRewardsCollection,
        where(
          "userId",
          "==",
          userId
        ),
        where(
          "rewardId",
          "==",
          rewardId
        ),
        limit(1)
      )
    );

  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const userReward = {
    userId,

    rewardId:
      reward.id,

    rewardCode:
      reward.code,

    rewardName:
      reward.name,

    category:
      reward.category,

    type:
      reward.type,

    status:
      "ACTIVE",

    pointsAwarded:
      reward.points,

    xpAwarded:
      reward.xp,

    monetaryValue:
      reward.monetaryValue,

    monetaryEnabled:
      false,

    sourceType:
      sourceType ?? null,

    sourceId:
      sourceId ?? null,

    earnedAt:
      serverTimestamp(),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const rewardRef =
    await addDoc(
      userRewardsCollection,
      userReward
    );

  await addRewardLedgerEntry(
    userId,
    "EARN",
    reward.points,
    reward.xp,
    `Earned ${reward.name}`,
    sourceType,
    sourceId
  );

  await updateRewardProfile(
    userId,
    reward.points,
    reward.xp,
    reward.category
  );

  return rewardRef.id;
}

/* -------------------------------------------------------------------------- */
/* REWARD PROFILE UPDATE                                                      */
/* -------------------------------------------------------------------------- */

async function updateRewardProfile(
  userId: string,
  points: number,
  xp: number,
  category: string
) {
  let profile =
    await getUserRewardProfile(
      userId
    );

  if (!profile) {
    const id =
      await createUserRewardProfile(
        userId
      );

    profile =
      await getUserRewardProfile(
        userId
      );

    if (!profile) {
      throw new Error(
        `Unable to initialize reward profile ${id}.`
      );
    }
  }

  const newPoints =
    profile.points +
    points;

  const newLifetimePoints =
    profile.lifetimePoints +
    points;

  const newXp =
    profile.xp +
    xp;

  const newLevel =
    calculateLevel(newXp);

  const nextLevelXp =
    calculateNextLevelXp(
      newLevel
    );

  const progress =
    calculateProgress(
      newXp,
      newLevel
    );

  const scoreField =
    category === "CREATOR"
      ? "creatorScore"
      : category === "COMMUNITY"
      ? "communityScore"
      : category === "TRADING"
      ? "tradingScore"
      : category === "COMPETITION"
      ? "competitionScore"
      : null;

  const updateData: Record<
    string,
    any
  > = {
    points:
      newPoints,

    lifetimePoints:
      newLifetimePoints,

    xp:
      newXp,

    level:
      newLevel,

    nextLevelXp:
      nextLevelXp,

    levelProgressPercent:
      progress,

    updatedAt:
      serverTimestamp(),
  };

  if (scoreField) {
    updateData[
      scoreField
    ] =
      (profile as any)[
        scoreField
      ] + points;
  }

  await updateDoc(
    doc(
      db,
      "rewardProfiles",
      profile.id
    ),
    updateData
  );
}

/* -------------------------------------------------------------------------- */
/* USER REWARDS                                                               */
/* -------------------------------------------------------------------------- */

export async function getUserRewards(
  userId: string
): Promise<UserReward[]> {
  const snapshot = await getDocs(
    query(
      userRewardsCollection,
      where(
        "userId",
        "==",
        userId
      ),
      limit(500)
    )
  );

  return snapshot.docs
    .map((item) =>
      normalizeUserReward(
        item.id,
        item.data()
      )
    )
    .sort(
      (a, b) =>
        getTimestamp(
          b.earnedAt
        ) -
        getTimestamp(
          a.earnedAt
        )
    );
}

export async function claimReward(
  rewardId: string,
  userId: string
) {
  const snapshot = await getDocs(
    query(
      userRewardsCollection,
      where(
        "__name__",
        "==",
        rewardId
      ),
      limit(1)
    )
  );

  if (snapshot.empty) {
    throw new Error(
      "Reward not found."
    );
  }

  const reward =
    normalizeUserReward(
      snapshot.docs[0].id,
      snapshot.docs[0].data()
    );

  if (
    reward.userId !==
    userId
  ) {
    throw new Error(
      "You do not own this reward."
    );
  }

  if (
    reward.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "This reward cannot be claimed."
    );
  }

  await updateDoc(
    doc(
      db,
      "userRewards",
      reward.id
    ),
    {
      status:
        "CLAIMED",

      claimedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* REWARD LEDGER                                                              */
/* -------------------------------------------------------------------------- */

export async function addRewardLedgerEntry(
  userId: string,
  type: RewardLedgerEntry["type"],
  points: number,
  xp: number,
  description: string,
  referenceType?: string,
  referenceId?: string
) {
  await addDoc(
    rewardLedgerCollection,
    {
      userId,
      type,
      points,
      xp,
      description,
      referenceType:
        referenceType ?? null,
      referenceId:
        referenceId ?? null,
      createdAt:
        serverTimestamp(),
    }
  );
}

export async function getRewardLedger(
  userId: string
): Promise<RewardLedgerEntry[]> {
  const snapshot = await getDocs(
    query(
      rewardLedgerCollection,
      where(
        "userId",
        "==",
        userId
      ),
      limit(500)
    )
  );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    })) as RewardLedgerEntry[];
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getRewardSummary(
  userId: string
): Promise<RewardSummary> {
  const profile =
    await getUserRewardProfile(
      userId
    );

  const rewards =
    await getUserRewards(
      userId
    );

  const active =
    rewards.filter(
      (reward) =>
        reward.status ===
        "ACTIVE"
    );

  const claimed =
    rewards.filter(
      (reward) =>
        reward.status ===
        "CLAIMED"
    );

  return {
    totalPoints:
      profile?.points ?? 0,

    lifetimePoints:
      profile?.lifetimePoints ?? 0,

    xp:
      profile?.xp ?? 0,

    level:
      profile?.level ?? 1,

    achievementCount:
      profile?.achievementCount ??
      rewards.filter(
        (reward) =>
          reward.type ===
          "ACHIEVEMENT"
      ).length,

    badgeCount:
      profile?.badgeCount ??
      rewards.filter(
        (reward) =>
          reward.type ===
          "BADGE"
      ).length,

    currentStreak:
      profile?.currentStreak ??
      0,

    longestStreak:
      profile?.longestStreak ??
      0,

    availableRewards:
      active.length,

    claimedRewards:
      claimed.length,

    monetaryRewardsEnabled:
      false,
  };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getTimestamp(
  value: any
) {
  if (!value) {
    return 0;
  }

  if (
    typeof value.toMillis ===
    "function"
  ) {
    return value.toMillis();
  }

  if (
    value instanceof Date
  ) {
    return value.getTime();
  }

  if (
    typeof value ===
    "string"
  ) {
    return new Date(
      value
    ).getTime();
  }

  if (
    typeof value.seconds ===
    "number"
  ) {
    return value.seconds * 1000;
  }

  return 0;
}

export function rewardCategoryLabel(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

export function rewardStatusLabel(
  value: string
) {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}