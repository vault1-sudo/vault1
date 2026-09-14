import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  GrowthMission,
  GrowthMissionStatus,
} from "../../types/growthMission";

const COLLECTION = "growthMissions";

type CreateGrowthMissionInput = {
  userId: string;

  name: string;
  description: string;

  startingCapital: number;
  targetCapital: number;

  durationDays: number;

  status?: GrowthMissionStatus;
};

function calculateRequiredGrowth(
  startingCapital: number,
  targetCapital: number
) {
  if (startingCapital <= 0) {
    return 0;
  }

  return (
    ((targetCapital - startingCapital) /
      startingCapital) *
    100
  );
}

function calculateAverageGrowth(
  startingCapital: number,
  targetCapital: number,
  durationDays: number
) {
  if (
    startingCapital <= 0 ||
    targetCapital <= 0 ||
    durationDays <= 0
  ) {
    return 0;
  }

  return (
    (Math.pow(
      targetCapital / startingCapital,
      1 / durationDays
    ) -
      1) *
    100
  );
}

export async function createGrowthMission({
  userId,
  name,
  description,
  startingCapital,
  targetCapital,
  durationDays,
  status = "DRAFT",
}: CreateGrowthMissionInput) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!name.trim()) {
    throw new Error("Mission name is required.");
  }

  if (!Number.isFinite(startingCapital) ||
      startingCapital <= 0) {
    throw new Error(
      "Starting capital must be greater than zero."
    );
  }

  if (!Number.isFinite(targetCapital) ||
      targetCapital <= startingCapital) {
    throw new Error(
      "Target capital must be greater than starting capital."
    );
  }

  if (!Number.isInteger(durationDays) ||
      durationDays <= 0) {
    throw new Error(
      "Duration must be at least one day."
    );
  }

  const targetReturnPercent =
    calculateRequiredGrowth(
      startingCapital,
      targetCapital
    );

  const requiredAverageGrowthPercent =
    calculateAverageGrowth(
      startingCapital,
      targetCapital,
      durationDays
    );

  const missionData = {
    userId,

    name: name.trim(),

    description:
      description.trim() ||
      "Vault1 growth mission.",

    startingCapital,
    targetCapital,

    currentCapital: startingCapital,

    targetReturnPercent,

    durationDays,

    status,

    tradesCount: 0,
    winningTrades: 0,
    losingTrades: 0,

    realizedPnL: 0,

    progressPercent: 0,

    remainingCapital:
      targetCapital - startingCapital,

    requiredGrowthPercent:
      targetReturnPercent,

    requiredAverageGrowthPercent,

    startDate:
      status === "ACTIVE"
        ? serverTimestamp()
        : null,

    targetDate: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const missionRef = await addDoc(
    collection(db, COLLECTION),
    missionData
  );

  return missionRef.id;
}

export async function getGrowthMissions(
  userId: string
): Promise<GrowthMission[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const missionsQuery = query(
    collection(db, COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(
    missionsQuery
  );

  const missions =
    snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as GrowthMission[];

  missions.sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis?.() ?? 0;

    const bTime =
      b.createdAt?.toMillis?.() ?? 0;

    return bTime - aTime;
  });

  return missions;
}

export async function getActiveGrowthMission(
  userId: string
): Promise<GrowthMission | null> {
  const missions =
    await getGrowthMissions(userId);

  return (
    missions.find(
      (mission) =>
        mission.status === "ACTIVE"
    ) || null
  );
}

export async function getGrowthMission(
  missionId: string
): Promise<GrowthMission | null> {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const missionRef = doc(
    db,
    COLLECTION,
    missionId
  );

  const snapshot =
    await getDoc(missionRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as GrowthMission;
}

export async function activateGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const missionRef = doc(
    db,
    COLLECTION,
    missionId
  );

  const snapshot =
    await getDoc(missionRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Growth mission not found."
    );
  }

  const mission =
    snapshot.data() as GrowthMission;

  const startDate =
    new Date();

  const targetDate =
    new Date(
      startDate.getTime() +
        mission.durationDays *
          24 *
          60 *
          60 *
          1000
    );

  await updateDoc(
    missionRef,
    {
      status: "ACTIVE",

      startDate:
        serverTimestamp(),

      targetDate,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function pauseGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  await updateDoc(
    doc(db, COLLECTION, missionId),
    {
      status: "PAUSED",
      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function cancelGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  await updateDoc(
    doc(db, COLLECTION, missionId),
    {
      status: "CANCELLED",
      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function updateGrowthMissionProgress({
  missionId,
  currentCapital,
  tradesCount,
  winningTrades,
  losingTrades,
  realizedPnL,
}: {
  missionId: string;
  currentCapital: number;
  tradesCount: number;
  winningTrades: number;
  losingTrades: number;
  realizedPnL: number;
}) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  if (
    !Number.isFinite(currentCapital) ||
    currentCapital < 0
  ) {
    throw new Error(
      "Current capital must be valid."
    );
  }

  const missionRef = doc(
    db,
    COLLECTION,
    missionId
  );

  const snapshot =
    await getDoc(missionRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Growth mission not found."
    );
  }

  const mission =
    snapshot.data() as GrowthMission;

  const capitalGrowth =
    currentCapital -
    mission.startingCapital;

  const requiredGrowth =
    mission.targetCapital -
    mission.startingCapital;

  let progressPercent = 0;

  if (requiredGrowth > 0) {
    progressPercent =
      (capitalGrowth / requiredGrowth) *
      100;
  }

  progressPercent = Math.max(
    0,
    Math.min(100, progressPercent)
  );

  const remainingCapital =
    Math.max(
      0,
      mission.targetCapital -
        currentCapital
    );

  let status =
    mission.status;

  if (
    currentCapital >=
    mission.targetCapital
  ) {
    status = "COMPLETED";
  }

  await updateDoc(
    missionRef,
    {
      currentCapital,

      tradesCount,
      winningTrades,
      losingTrades,

      realizedPnL,

      progressPercent,

      remainingCapital,

      status,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export function calculateMissionProgress(
  mission: GrowthMission
) {
  if (
    mission.targetCapital <=
    mission.startingCapital
  ) {
    return 0;
  }

  const progress =
    ((mission.currentCapital -
      mission.startingCapital) /
      (mission.targetCapital -
        mission.startingCapital)) *
    100;

  return Math.max(
    0,
    Math.min(100, progress)
  );
}

export function calculateMissionReturn(
  mission: GrowthMission
) {
  if (
    mission.startingCapital <= 0
  ) {
    return 0;
  }

  return (
    ((mission.currentCapital -
      mission.startingCapital) /
      mission.startingCapital) *
    100
  );
}

export function calculateMissionRemaining(
  mission: GrowthMission
) {
  return Math.max(
    0,
    mission.targetCapital -
      mission.currentCapital
  );
}