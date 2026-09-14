import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  GrowthMission,
  GrowthMissionDay,
  GrowthMissionDayStatus,
  GrowthMissionExitReason,
  GrowthMissionTrade,
  GrowthMissionTradeResult,
  GrowthMissionTradeStatus,
  GrowthMissionPosition,
  GrowthMissionBias,
  GrowthMissionAssetClass,
} from "../../types/growthMission";

const COLLECTION = "growthMissions";

type CreateGrowthMissionInput = {
  userId: string;

  name: string;
  description: string;

  startingCapital: number;
  targetCapital: number;

  durationDays: number;

  status?: GrowthMission["status"];
};

type RecordGrowthMissionTradeInput = {
  missionId: string;
  missionDayId: string;
  userId: string;

  tradeNumber?: number;

  tradeDate?: Date | Timestamp;

  assetClass: GrowthMissionAssetClass;
  instrument: string;
  symbol?: string;
  exchange?: string;
  broker?: string;

  position: GrowthMissionPosition;
  bias?: GrowthMissionBias;

  strategy?: string;
  setup?: string;

  entryDate?: Date | Timestamp;
  entryTime?: string;

  entryPrice: number;
  quantity: number;
  positionSize: number;

  leverage?: number;

  stopLoss?: number;
  takeProfit?: number;

  thesis?: string;
  entryReason?: string;

  notes?: string;
};

type CloseGrowthMissionTradeInput = {
  tradeId: string;
  missionId: string;
  missionDayId: string;

  exitDate?: Date | Timestamp;
  exitTime?: string;

  exitPrice: number;

  exitReason?: GrowthMissionExitReason;
  exitReasonNotes?: string;

  whatWentRight?: string;
  whatWentWrong?: string;
  notes?: string;
  fees?: number;
};

function toDate(value: Date | Timestamp | undefined): Date {
  if (!value) {
    return new Date();
  }

  if (value instanceof Date) {
    return value;
  }

  return value.toDate();
}

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

/**
 * Calculates the expected capital for a specific mission day.
 *
 * Uses compound growth so that:
 *
 * Day 0 = starting capital
 * Day durationDays = target capital
 */
export function calculateMissionDayTarget(
  mission: GrowthMission,
  dayNumber: number
) {
  if (
    mission.startingCapital <= 0 ||
    mission.targetCapital <= 0 ||
    mission.durationDays <= 0
  ) {
    return mission.startingCapital;
  }

  const safeDay = Math.max(
    0,
    Math.min(
      mission.durationDays,
      Math.floor(dayNumber)
    )
  );

  const growthFactor =
    Math.pow(
      mission.targetCapital /
        mission.startingCapital,
      1 / mission.durationDays
    );

  return (
    mission.startingCapital *
    Math.pow(growthFactor, safeDay)
  );
}

/**
 * Creates a complete day-by-day target map.
 */
export function buildMissionTargetMap(
  mission: GrowthMission,
  startDate: Date
): Omit<
  GrowthMissionDay,
  "id"
>[] {
  const days: Omit<
    GrowthMissionDay,
    "id"
  >[] = [];

  let previousTarget =
    mission.startingCapital;

  for (
    let dayNumber = 1;
    dayNumber <= mission.durationDays;
    dayNumber += 1
  ) {
    const targetCapital =
      calculateMissionDayTarget(
        mission,
        dayNumber
      );

    const expectedGrowthAmount =
      targetCapital -
      previousTarget;

    const expectedGrowthPercent =
      previousTarget > 0
        ? (expectedGrowthAmount /
            previousTarget) *
          100
        : 0;

    const date = new Date(startDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(
      date.getDate() + dayNumber - 1
    );

    days.push({
      missionId: mission.id,
      userId: mission.userId,

      dayNumber,

      date: Timestamp.fromDate(date),

      status:
        dayNumber === 1
          ? "ACTIVE"
          : "UPCOMING",

      openingCapital:
        previousTarget,

      targetCapital,

      expectedGrowthAmount,

      expectedGrowthPercent,

      tradesCount: 0,
      winningTrades: 0,
      losingTrades: 0,

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    previousTarget = targetCapital;
  }

  return days;
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

  if (
    !Number.isFinite(startingCapital) ||
    startingCapital <= 0
  ) {
    throw new Error(
      "Starting capital must be greater than zero."
    );
  }

  if (
    !Number.isFinite(targetCapital) ||
    targetCapital <= startingCapital
  ) {
    throw new Error(
      "Target capital must be greater than starting capital."
    );
  }

  if (
    !Number.isInteger(durationDays) ||
    durationDays <= 0
  ) {
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
    breakevenTrades: 0,
    openTrades: 0,

    realizedPnL: 0,
    unrealizedPnL: 0,

    progressPercent: 0,

    remainingCapital:
      targetCapital - startingCapital,

    requiredGrowthPercent:
      targetReturnPercent,

    requiredAverageGrowthPercent,

    completedDays: 0,
    currentDayNumber:
      status === "ACTIVE" ? 1 : 0,

    missedDays: 0,

    targetDailyGrowthPercent:
      requiredAverageGrowthPercent,

    expectedCapitalToday:
      startingCapital,

    expectedCapitalTomorrow:
      calculateMissionDayTarget(
        {
          id: "",
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
        },
        1
      ),

    aheadBehindCapital: 0,
    aheadBehindPercent: 0,

    totalCapitalDeployed: 0,
    totalFees: 0,

    largestWin: 0,
    largestLoss: 0,

    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0,

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

/**
 * Creates the entire target map when a mission becomes active.
 */
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
    {
      id: snapshot.id,
      ...snapshot.data(),
    } as GrowthMission;

  if (
    mission.status === "COMPLETED"
  ) {
    throw new Error(
      "A completed mission cannot be activated."
    );
  }

  if (
    mission.status === "CANCELLED"
  ) {
    throw new Error(
      "A cancelled mission cannot be activated."
    );
  }

  const existingActiveMission =
    await getActiveGrowthMission(
      mission.userId
    );

  if (
    existingActiveMission &&
    existingActiveMission.id !== missionId
  ) {
    throw new Error(
      "Another growth mission is already active."
    );
  }

  const startDate = new Date();

  const targetDate =
    new Date(startDate);

  targetDate.setDate(
    targetDate.getDate() +
      mission.durationDays
  );

  const targetMap =
    buildMissionTargetMap(
      mission,
      startDate
    );

  const batch = writeBatch(db);

  batch.update(missionRef, {
    status: "ACTIVE",

    startDate:
      Timestamp.fromDate(startDate),

    targetDate:
      Timestamp.fromDate(targetDate),

    currentDayNumber: 1,

    expectedCapitalToday:
      calculateMissionDayTarget(
        mission,
        1
      ),

    expectedCapitalTomorrow:
      calculateMissionDayTarget(
        mission,
        Math.min(
          2,
          mission.durationDays
        )
      ),

    updatedAt:
      serverTimestamp(),
  });

  const daysCollection =
    collection(
      missionRef,
      "days"
    );

  targetMap.forEach((day) => {
    const dayRef = doc(
      daysCollection
    );

    batch.set(dayRef, day);
  });

  await batch.commit();
}

/**
 * Fetches all target-map days for a mission.
 */
export async function getGrowthMissionDays(
  missionId: string
): Promise<GrowthMissionDay[]> {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const daysSnapshot =
    await getDocs(
      collection(
        db,
        COLLECTION,
        missionId,
        "days"
      )
    );

  const days =
    daysSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as GrowthMissionDay[];

  days.sort(
    (a, b) =>
      a.dayNumber - b.dayNumber
  );

  return days;
}

/**
 * Fetches one mission day.
 */
export async function getGrowthMissionDay(
  missionId: string,
  dayId: string
): Promise<GrowthMissionDay | null> {
  if (!missionId || !dayId) {
    throw new Error(
      "Mission ID and day ID are required."
    );
  }

  const dayRef = doc(
    db,
    COLLECTION,
    missionId,
    "days",
    dayId
  );

  const snapshot =
    await getDoc(dayRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as GrowthMissionDay;
}

/**
 * Returns trades belonging to a mission day.
 */
export async function getGrowthMissionTrades(
  missionId: string,
  missionDayId: string
): Promise<GrowthMissionTrade[]> {
  if (!missionId || !missionDayId) {
    throw new Error(
      "Mission ID and mission day ID are required."
    );
  }

  const tradesSnapshot =
    await getDocs(
      collection(
        db,
        COLLECTION,
        missionId,
        "days",
        missionDayId,
        "trades"
      )
    );

  const trades =
    tradesSnapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as GrowthMissionTrade[];

  trades.sort(
    (a, b) =>
      a.tradeNumber -
      b.tradeNumber
  );

  return trades;
}

/**
 * Returns every trade across every day in a mission.
 */
export async function getAllGrowthMissionTrades(
  missionId: string
): Promise<GrowthMissionTrade[]> {
  const days =
    await getGrowthMissionDays(
      missionId
    );

  const allTrades: GrowthMissionTrade[] =
    [];

  for (const day of days) {
    const trades =
      await getGrowthMissionTrades(
        missionId,
        day.id
      );

    allTrades.push(
      ...trades
    );
  }

  allTrades.sort((a, b) => {
    if (
      a.tradeDate?.toMillis &&
      b.tradeDate?.toMillis
    ) {
      return (
        a.tradeDate.toMillis() -
        b.tradeDate.toMillis()
      );
    }

    return (
      a.tradeNumber -
      b.tradeNumber
    );
  });

  return allTrades;
}

/**
 * Calculates trade P&L.
 */
export function calculateTradePnL({
  position,
  entryPrice,
  exitPrice,
  quantity,
}: {
  position: GrowthMissionPosition;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
}) {
  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(exitPrice) ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return 0;
  }

  if (position === "LONG") {
    return (
      (exitPrice - entryPrice) *
      quantity
    );
  }

  return (
    (entryPrice - exitPrice) *
    quantity
  );
}

function calculateTradeResult(
  netPnL: number
): GrowthMissionTradeResult {
  if (netPnL > 0) {
    return "WIN";
  }

  if (netPnL < 0) {
    return "LOSS";
  }

  return "BREAKEVEN";
}

function calculateHoldingDuration(
  entryDate: Date | undefined,
  exitDate: Date
) {
  if (!entryDate) {
    return undefined;
  }

  return Math.max(
    0,
    Math.round(
      (exitDate.getTime() -
        entryDate.getTime()) /
        60000
    )
  );
}

function calculateRiskRewardRatio(
  entryPrice: number,
  stopLoss: number | undefined,
  takeProfit: number | undefined,
  position: GrowthMissionPosition
) {
  if (
    stopLoss === undefined ||
    takeProfit === undefined
  ) {
    return undefined;
  }

  const risk =
    position === "LONG"
      ? entryPrice - stopLoss
      : stopLoss - entryPrice;

  const reward =
    position === "LONG"
      ? takeProfit - entryPrice
      : entryPrice - takeProfit;

  if (risk <= 0 || reward <= 0) {
    return undefined;
  }

  return reward / risk;
}

/**
 * Records a new trade.
 *
 * New trades start OPEN.
 */
export async function recordGrowthMissionTrade({
  missionId,
  missionDayId,
  userId,

  tradeNumber,

  tradeDate,

  assetClass,
  instrument,
  symbol,
  exchange,
  broker,

  position,
  bias = "NEUTRAL",

  strategy,
  setup,

  entryDate,
  entryTime,

  entryPrice,
  quantity,
  positionSize,

  leverage,

  stopLoss,
  takeProfit,

  thesis,
  entryReason,

  notes,
}: RecordGrowthMissionTradeInput) {
  if (
    !missionId ||
    !missionDayId ||
    !userId
  ) {
    throw new Error(
      "Mission, mission day and user are required."
    );
  }

  if (!instrument.trim()) {
    throw new Error(
      "Instrument is required."
    );
  }

  if (
    !Number.isFinite(entryPrice) ||
    entryPrice <= 0
  ) {
    throw new Error(
      "Entry price must be greater than zero."
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  if (
    !Number.isFinite(positionSize) ||
    positionSize <= 0
  ) {
    throw new Error(
      "Position size must be greater than zero."
    );
  }

  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  if (
    mission.status !== "ACTIVE"
  ) {
    throw new Error(
      "Trades can only be recorded on an active mission."
    );
  }

  const day =
    await getGrowthMissionDay(
      missionId,
      missionDayId
    );

  if (!day) {
    throw new Error(
      "Growth mission day not found."
    );
  }

  const existingTrades =
    await getGrowthMissionTrades(
      missionId,
      missionDayId
    );

  const nextTradeNumber =
    tradeNumber ??
    (existingTrades.length > 0
      ? Math.max(
          ...existingTrades.map(
            (trade) =>
              trade.tradeNumber
          )
        ) + 1
      : 1);

  const tradeData: Omit<
    GrowthMissionTrade,
    "id"
  > = {
    missionId,
    missionDayId,
    userId,

    tradeNumber:
      nextTradeNumber,

    tradeDate:
      tradeDate
        ? toDate(tradeDate)
        : new Date(),

    status: "OPEN",

    assetClass,

    instrument:
      instrument.trim(),

    symbol:
      symbol?.trim() || undefined,

    exchange:
      exchange?.trim() || undefined,

    broker:
      broker?.trim() || undefined,

    position,

    bias,

    strategy:
      strategy?.trim() || undefined,

    setup:
      setup?.trim() || undefined,

    entryDate:
      entryDate
        ? toDate(entryDate)
        : new Date(),

    entryTime,

    entryPrice,

    quantity,

    positionSize,

    leverage,

    stopLoss,

    takeProfit,

    netPnL: 0,

    result: "OPEN",

    thesis:
      thesis?.trim() || undefined,

    entryReason:
      entryReason?.trim() ||
      undefined,

    notes:
      notes?.trim() || undefined,

    riskAmount:
      stopLoss !== undefined
        ? Math.abs(
            entryPrice -
              stopLoss
          ) * quantity
        : undefined,

    rewardAmount:
      takeProfit !== undefined
        ? Math.abs(
            takeProfit -
              entryPrice
          ) * quantity
        : undefined,

    riskRewardRatio:
      calculateRiskRewardRatio(
        entryPrice,
        stopLoss,
        takeProfit,
        position
      ),

    createdAt:
      Timestamp.now(),

    updatedAt:
      Timestamp.now(),
  };

  const tradesCollection =
    collection(
      db,
      COLLECTION,
      missionId,
      "days",
      missionDayId,
      "trades"
    );

  const tradeRef =
    await addDoc(
      tradesCollection,
      tradeData
    );

  await refreshMissionAggregates(
    missionId
  );

  return tradeRef.id;
}

/**
 * Closes an OPEN trade and calculates:
 *
 * Gross P&L
 * Fees
 * Net P&L
 * Return %
 * Win/Loss
 * Holding duration
 * Risk/Reward
 */
export async function closeGrowthMissionTrade({
  tradeId,
  missionId,
  missionDayId,

  exitDate,
  exitTime,

  exitPrice,

  exitReason = "MANUAL",
  exitReasonNotes,

  whatWentRight,
  whatWentWrong,
  notes,
  fees = 0,
}: CloseGrowthMissionTradeInput) {
  if (
    !tradeId ||
    !missionId ||
    !missionDayId
  ) {
    throw new Error(
      "Trade, mission and mission day are required."
    );
  }

  if (
    !Number.isFinite(exitPrice) ||
    exitPrice <= 0
  ) {
    throw new Error(
      "Exit price must be greater than zero."
    );
  }

  if (
    !Number.isFinite(fees) ||
    fees < 0
  ) {
    throw new Error(
      "Fees cannot be negative."
    );
  }

  const tradeRef = doc(
    db,
    COLLECTION,
    missionId,
    "days",
    missionDayId,
    "trades",
    tradeId
  );

  const snapshot =
    await getDoc(tradeRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Growth mission trade not found."
    );
  }

  const existingTrade =
    {
      id: snapshot.id,
      ...snapshot.data(),
    } as GrowthMissionTrade;

  if (
    existingTrade.status !== "OPEN"
  ) {
    throw new Error(
      "Only open trades can be closed."
    );
  }

  const finalExitDate =
    exitDate
      ? toDate(exitDate)
      : new Date();

  const entryDate =
    existingTrade.entryDate
      ? toDate(
          existingTrade.entryDate
        )
      : undefined;

  const grossPnL =
    calculateTradePnL({
      position:
        existingTrade.position,
      entryPrice:
        existingTrade.entryPrice,
      exitPrice,
      quantity:
        existingTrade.quantity,
    });

  const netPnL =
    grossPnL - fees;

  const result =
    calculateTradeResult(
      netPnL
    );

  const grossProfit =
    grossPnL > 0
      ? grossPnL
      : 0;

  const grossLoss =
    grossPnL < 0
      ? Math.abs(grossPnL)
      : 0;

  const returnPercent =
    existingTrade.positionSize >
    0
      ? (netPnL /
          existingTrade.positionSize) *
        100
      : 0;

  const holdingDurationMinutes =
    calculateHoldingDuration(
      entryDate,
      finalExitDate
    );

  const updatedTrade = {
    status:
      "CLOSED" as GrowthMissionTradeStatus,

    exitDate:
      finalExitDate,

    exitTime,

    exitPrice,

    exitReason,

    exitReasonNotes:
      exitReasonNotes?.trim() ||
      undefined,

    holdingDurationMinutes,

    grossProfit,

    grossLoss,

    fees,

    netPnL,

    returnPercent,

    result,

    whatWentRight:
      whatWentRight?.trim() ||
      undefined,

    whatWentWrong:
      whatWentWrong?.trim() ||
      undefined,

    notes:
      notes?.trim() ||
      existingTrade.notes ||
      undefined,

    updatedAt:
      serverTimestamp(),
  };

  await updateDoc(
    tradeRef,
    updatedTrade
  );

  await refreshMissionAggregates(
    missionId
  );

  return {
    tradeId,
    netPnL,
    result,
  };
}

/**
 * Cancels an open trade without treating it as a win/loss.
 */
export async function cancelGrowthMissionTrade({
  tradeId,
  missionId,
  missionDayId,
  notes,
}: {
  tradeId: string;
  missionId: string;
  missionDayId: string;
  notes?: string;
}) {
  const tradeRef = doc(
    db,
    COLLECTION,
    missionId,
    "days",
    missionDayId,
    "trades",
    tradeId
  );

  const snapshot =
    await getDoc(tradeRef);

  if (!snapshot.exists()) {
    throw new Error(
      "Growth mission trade not found."
    );
  }

  const trade =
    snapshot.data() as GrowthMissionTrade;

  if (
    trade.status !== "OPEN"
  ) {
    throw new Error(
      "Only open trades can be cancelled."
    );
  }

  await updateDoc(
    tradeRef,
    {
      status: "CANCELLED",
      result: "BREAKEVEN",
      netPnL: 0,
      notes:
        notes?.trim() ||
        trade.notes ||
        undefined,
      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshMissionAggregates(
    missionId
  );
}

/**
 * Rebuilds mission statistics from actual trades.
 *
 * This is the important bridge:
 *
 * Trades
 *   ↓
 * Mission statistics
 *   ↓
 * Mission capital
 */
export async function refreshMissionAggregates(
  missionId: string
) {
  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  const days =
    await getGrowthMissionDays(
      missionId
    );

  let tradesCount = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let openTrades = 0;

  let realizedPnL = 0;
  let totalFees = 0;
  let totalCapitalDeployed = 0;

  let largestWin = 0;
  let largestLoss = 0;

  const closedPnLs: number[] = [];

  for (const day of days) {
    const trades =
      await getGrowthMissionTrades(
        missionId,
        day.id
      );

    for (const trade of trades) {
      if (
        trade.status === "CANCELLED"
      ) {
        continue;
      }

      tradesCount += 1;

      if (
        trade.status === "OPEN"
      ) {
        openTrades += 1;

        continue;
      }

      const pnl =
        trade.netPnL || 0;

      realizedPnL += pnl;

      totalFees +=
        trade.fees || 0;

      totalCapitalDeployed +=
        trade.positionSize || 0;

      closedPnLs.push(pnl);

      if (
        trade.result === "WIN"
      ) {
        winningTrades += 1;

        largestWin =
          Math.max(
            largestWin,
            pnl
          );
      } else if (
        trade.result === "LOSS"
      ) {
        losingTrades += 1;

        largestLoss =
          Math.max(
            largestLoss,
            Math.abs(pnl)
          );
      } else if (
        trade.result ===
        "BREAKEVEN"
      ) {
        breakevenTrades += 1;
      }
    }
  }

  const currentCapital =
    Math.max(
      0,
      mission.startingCapital +
        realizedPnL
    );

  const progressPercent =
    mission.targetCapital >
    mission.startingCapital
      ? Math.max(
          0,
          Math.min(
            100,
            ((currentCapital -
              mission.startingCapital) /
              (mission.targetCapital -
                mission.startingCapital)) *
              100
          )
        )
      : 0;

  const remainingCapital =
    Math.max(
      0,
      mission.targetCapital -
        currentCapital
    );

  const totalClosedTrades =
    winningTrades +
    losingTrades +
    breakevenTrades;

  const winRate =
    totalClosedTrades > 0
      ? (winningTrades /
          totalClosedTrades) *
        100
      : 0;

  const averageWin =
    winningTrades > 0
      ? closedPnLs
          .filter(
            (pnl) => pnl > 0
          )
          .reduce(
            (sum, pnl) =>
              sum + pnl,
            0
          ) /
        winningTrades
      : 0;

  const averageLoss =
    losingTrades > 0
      ? Math.abs(
          closedPnLs
            .filter(
              (pnl) => pnl < 0
            )
            .reduce(
              (sum, pnl) =>
                sum + pnl,
              0
            ) /
            losingTrades
        )
      : 0;

  const totalProfit =
    closedPnLs
      .filter(
        (pnl) => pnl > 0
      )
      .reduce(
        (sum, pnl) =>
          sum + pnl,
        0
      );

  const totalLoss =
    Math.abs(
      closedPnLs
        .filter(
          (pnl) => pnl < 0
        )
        .reduce(
          (sum, pnl) =>
            sum + pnl,
          0
        )
    );

  const profitFactor =
    totalLoss > 0
      ? totalProfit /
        totalLoss
      : totalProfit > 0
        ? Infinity
        : 0;

  let peakCapital =
    mission.startingCapital;

  let maxDrawdown = 0;

  let runningCapital =
    mission.startingCapital;

  for (const pnl of closedPnLs) {
    runningCapital += pnl;

    peakCapital =
      Math.max(
        peakCapital,
        runningCapital
      );

    const drawdown =
      peakCapital -
      runningCapital;

    maxDrawdown =
      Math.max(
        maxDrawdown,
        drawdown
      );
  }

  const completedDays =
    days.filter(
      (day) =>
        day.status ===
        "COMPLETED"
    ).length;

  const missedDays =
    days.filter(
      (day) =>
        day.status === "MISSED"
    ).length;

  const now = new Date();

  let currentDayNumber =
    mission.currentDayNumber || 0;

  if (
    mission.startDate
  ) {
    const startDate =
      toDate(
        mission.startDate
      );

    const elapsed =
      Math.floor(
        (now.getTime() -
          startDate.getTime()) /
          (24 *
            60 *
            60 *
            1000)
      );

    currentDayNumber =
      Math.max(
        1,
        Math.min(
          mission.durationDays,
          elapsed + 1
        )
      );
  }

  const expectedCapitalToday =
    calculateMissionDayTarget(
      mission,
      currentDayNumber
    );

  const expectedCapitalTomorrow =
    calculateMissionDayTarget(
      mission,
      Math.min(
        mission.durationDays,
        currentDayNumber + 1
      )
    );

  const aheadBehindCapital =
    currentCapital -
    expectedCapitalToday;

  const aheadBehindPercent =
    expectedCapitalToday > 0
      ? (aheadBehindCapital /
          expectedCapitalToday) *
        100
      : 0;

  let status =
    mission.status;

  if (
    currentCapital >=
    mission.targetCapital
  ) {
    status = "COMPLETED";
  }

  await updateDoc(
    doc(
      db,
      COLLECTION,
      missionId
    ),
    {
      currentCapital,

      tradesCount,
      winningTrades,
      losingTrades,
      breakevenTrades,
      openTrades,

      realizedPnL,

      progressPercent,

      remainingCapital,

      completedDays,
      currentDayNumber,
      missedDays,

      expectedCapitalToday,
      expectedCapitalTomorrow,

      aheadBehindCapital,
      aheadBehindPercent,

      totalCapitalDeployed,
      totalFees,

      largestWin,
      largestLoss,

      winRate,
      averageWin,
      averageLoss,
      profitFactor,

      maxDrawdown,

      status,

      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshMissionDayAggregates(
    missionId
  );
}

/**
 * Rebuilds every day's statistics from its actual trades.
 */
export async function refreshMissionDayAggregates(
  missionId: string
) {
  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  const days =
    await getGrowthMissionDays(
      missionId
    );

  const batch = writeBatch(db);

  for (const day of days) {
    const trades =
      await getGrowthMissionTrades(
        missionId,
        day.id
      );

    let tradesCount = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let breakevenTrades = 0;

    let grossProfit = 0;
    let grossLoss = 0;
    let fees = 0;
    let netPnL = 0;
    let capitalDeployed = 0;

    for (const trade of trades) {
      if (
        trade.status === "CANCELLED"
      ) {
        continue;
      }

      tradesCount += 1;

      if (
        trade.status === "OPEN"
      ) {
        capitalDeployed +=
          trade.positionSize || 0;

        continue;
      }

      if (
        trade.result === "WIN"
      ) {
        winningTrades += 1;
      } else if (
        trade.result === "LOSS"
      ) {
        losingTrades += 1;
      } else {
        breakevenTrades += 1;
      }

      grossProfit +=
        trade.grossProfit || 0;

      grossLoss +=
        trade.grossLoss || 0;

      fees +=
        trade.fees || 0;

      netPnL +=
        trade.netPnL || 0;

      capitalDeployed +=
        trade.positionSize || 0;
    }

    const closingCapital =
      day.openingCapital +
      netPnL;

    const actualGrowthAmount =
      netPnL;

    const actualGrowthPercent =
      day.openingCapital > 0
        ? (actualGrowthAmount /
            day.openingCapital) *
          100
        : 0;

    const aheadBehindCapital =
      closingCapital -
      day.targetCapital;

    const aheadBehindPercent =
      day.targetCapital > 0
        ? (aheadBehindCapital /
            day.targetCapital) *
          100
        : 0;

    let status:
      GrowthMissionDayStatus =
      day.status;

    if (
      tradesCount === 0 &&
      day.status === "ACTIVE"
    ) {
      status = "ACTIVE";
    }

    if (
      tradesCount > 0
    ) {
      status =
        "COMPLETED";
    }

    if (
      closingCapital >=
      day.targetCapital
    ) {
      status =
        "COMPLETED";
    }

    batch.update(
      doc(
        db,
        COLLECTION,
        missionId,
        "days",
        day.id
      ),
      {
        status,

        closingCapital,

        actualGrowthAmount,

        actualGrowthPercent,

        aheadBehindCapital,

        aheadBehindPercent,

        tradesCount,
        winningTrades,
        losingTrades,
        breakevenTrades,

        grossProfit,
        grossLoss,
        fees,
        netPnL,

        returnPercent:
          actualGrowthPercent,

        capitalDeployed,

        updatedAt:
          serverTimestamp(),
      }
    );
  }

  await batch.commit();
}

/**
 * Pauses an active mission.
 */
export async function pauseGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  if (
    mission.status !== "ACTIVE"
  ) {
    throw new Error(
      "Only an active mission can be paused."
    );
  }

  await updateDoc(
    doc(
      db,
      COLLECTION,
      missionId
    ),
    {
      status: "PAUSED",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/**
 * Resumes a paused mission.
 */
export async function resumeGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  if (
    mission.status !== "PAUSED"
  ) {
    throw new Error(
      "Only a paused mission can be resumed."
    );
  }

  await updateDoc(
    doc(
      db,
      COLLECTION,
      missionId
    ),
    {
      status: "ACTIVE",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/**
 * Cancels/closes a mission.
 *
 * We intentionally do not delete its financial history.
 */
export async function cancelGrowthMission(
  missionId: string
) {
  if (!missionId) {
    throw new Error(
      "Mission ID is required."
    );
  }

  const mission =
    await getGrowthMission(
      missionId
    );

  if (!mission) {
    throw new Error(
      "Growth mission not found."
    );
  }

  if (
    mission.status ===
    "COMPLETED"
  ) {
    throw new Error(
      "A completed mission cannot be cancelled."
    );
  }

  await updateDoc(
    doc(
      db,
      COLLECTION,
      missionId
    ),
    {
      status: "CANCELLED",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/**
 * Alias for explicit "close mission" UI language.
 */
export async function closeGrowthMission(
  missionId: string
) {
  return cancelGrowthMission(
    missionId
  );
}

/**
 * Recalculates mission progress from a supplied capital value.
 *
 * Kept for compatibility with the existing UI.
 */
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
      (capitalGrowth /
        requiredGrowth) *
      100;
  }

  progressPercent = Math.max(
    0,
    Math.min(
      100,
      progressPercent
    )
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
    Math.min(
      100,
      progress
    )
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