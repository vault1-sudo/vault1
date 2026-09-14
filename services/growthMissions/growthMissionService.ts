import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  GrowthMission,
  GrowthMissionDay,
  GrowthMissionTrade,
  GrowthMissionStatus,
  GrowthMissionTradeResult,
  GrowthMissionAssetClass,
  GrowthMissionBias,
  GrowthMissionPosition,
  GrowthMissionExitReason,
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

type RecordTradeInput = {
  missionId: string;
  missionDayId: string;
  userId: string;
  assetClass: GrowthMissionAssetClass;
  instrument: string;
  symbol?: string;
  exchange?: string;
  broker?: string;
  position: GrowthMissionPosition;
  bias: GrowthMissionBias;
  strategy?: string;
  setup?: string;
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

function calculateRequiredGrowth(start: number, target: number) {
  if (start <= 0) return 0;
  return ((target - start) / start) * 100;
}

function calculateAverageGrowth(start: number, target: number, days: number) {
  if (start <= 0 || target <= 0 || days <= 0) return 0;
  return (Math.pow(target / start, 1 / days) - 1) * 100;
}

function asDate(value: any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function calculateTradeMath(
  position: GrowthMissionPosition,
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  fees: number,
  stopLoss?: number,
  takeProfit?: number,
) {
  const grossBeforeFees =
    position === "LONG"
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;

  const netPnL = grossBeforeFees - fees;
  const grossProfit = Math.max(grossBeforeFees, 0);
  const grossLoss = Math.max(-grossBeforeFees, 0);
  const riskAmount =
    stopLoss !== undefined
      ? Math.abs(entryPrice - stopLoss) * quantity
      : undefined;
  const rewardAmount =
    takeProfit !== undefined
      ? Math.abs(takeProfit - entryPrice) * quantity
      : undefined;

  return {
    grossProfit,
    grossLoss,
    netPnL,
    returnPercent:
      positionSizeSafe(entryPrice, quantity) > 0
        ? (netPnL / positionSizeSafe(entryPrice, quantity)) * 100
        : 0,
    riskAmount,
    rewardAmount,
    riskRewardRatio:
      riskAmount && riskAmount > 0 && rewardAmount !== undefined
        ? rewardAmount / riskAmount
        : undefined,
  };
}

function positionSizeSafe(entryPrice: number, quantity: number) {
  return Math.max(0, entryPrice * quantity);
}

function resultFromPnL(pnl: number): GrowthMissionTradeResult {
  if (pnl > 0) return "WIN";
  if (pnl < 0) return "LOSS";
  return "BREAKEVEN";
}

function missionRef(id: string) {
  return doc(db, COLLECTION, id);
}

function daysCollection(missionId: string) {
  return collection(db, COLLECTION, missionId, "days");
}

function dayRef(missionId: string, dayId: string) {
  return doc(db, COLLECTION, missionId, "days", dayId);
}

function tradesCollection(missionId: string, dayId: string) {
  return collection(db, COLLECTION, missionId, "days", dayId, "trades");
}

function tradeRef(missionId: string, dayId: string, tradeId: string) {
  return doc(
    db,
    COLLECTION,
    missionId,
    "days",
    dayId,
    "trades",
    tradeId,
  );
}

export async function createGrowthMission(input: CreateGrowthMissionInput) {
  const {
    userId,
    name,
    description,
    startingCapital,
    targetCapital,
    durationDays,
    status = "DRAFT",
  } = input;

  if (!userId) throw new Error("User ID is required.");
  if (!name.trim()) throw new Error("Mission name is required.");
  if (!Number.isFinite(startingCapital) || startingCapital <= 0) {
    throw new Error("Starting capital must be greater than zero.");
  }
  if (!Number.isFinite(targetCapital) || targetCapital <= startingCapital) {
    throw new Error("Target capital must be greater than starting capital.");
  }
  if (!Number.isInteger(durationDays) || durationDays <= 0 || durationDays > 3650) {
    throw new Error("Duration must be between 1 and 3650 days.");
  }

  const targetReturnPercent = calculateRequiredGrowth(
    startingCapital,
    targetCapital,
  );
  const requiredAverageGrowthPercent = calculateAverageGrowth(
    startingCapital,
    targetCapital,
    durationDays,
  );

  const missionData = {
    userId,
    name: name.trim(),
    description: description.trim() || "Vault1 growth mission.",
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
    remainingCapital: Math.max(0, targetCapital - startingCapital),
    requiredGrowthPercent: targetReturnPercent,
    requiredAverageGrowthPercent,
    completedDays: 0,
    currentDayNumber: 0,
    missedDays: 0,
    targetDailyGrowthPercent: requiredAverageGrowthPercent,
    expectedCapitalToday: startingCapital,
    expectedCapitalTomorrow:
      durationDays > 0
        ? startingCapital *
          Math.pow(targetCapital / startingCapital, 1 / durationDays)
        : targetCapital,
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
    startDate: null,
    targetDate: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COLLECTION), missionData);
  return ref.id;
}

export async function getGrowthMissions(userId: string): Promise<GrowthMission[]> {
  if (!userId) throw new Error("User ID is required.");

  const snapshot = await getDocs(
    query(collection(db, COLLECTION), where("userId", "==", userId)),
  );

  const missions = snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as GrowthMission,
  );

  missions.sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? 0;
    return bTime - aTime;
  });

  return missions;
}

export async function getActiveGrowthMission(userId: string) {
  const missions = await getGrowthMissions(userId);
  return missions.find((m) => m.status === "ACTIVE") || null;
}

export async function getGrowthMission(missionId: string) {
  if (!missionId) throw new Error("Mission ID is required.");
  const snapshot = await getDoc(missionRef(missionId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as GrowthMission;
}

async function generateMissionDays(
  missionId: string,
  mission: GrowthMission,
  startDate: Date,
) {
  const existing = await getDocs(daysCollection(missionId));
  if (!existing.empty) return;

  const batch = writeBatch(db);

  for (let index = 0; index < mission.durationDays; index += 1) {
    const dayNumber = index + 1;
    const progress = dayNumber / mission.durationDays;
    const targetCapital =
      mission.startingCapital *
      Math.pow(
        mission.targetCapital / mission.startingCapital,
        progress,
      );
    const previousTarget =
      index === 0
        ? mission.startingCapital
        : mission.startingCapital *
          Math.pow(
            mission.targetCapital / mission.startingCapital,
            index / mission.durationDays,
          );

    const date = addDays(startDate, index);
    const id = `day-${String(dayNumber).padStart(4, "0")}`;

    const ref = dayRef(missionId, id);
    batch.set(ref, {
      missionId,
      userId: mission.userId,
      dayNumber,
      date,
      status: index === 0 ? "ACTIVE" : "UPCOMING",
      openingCapital: previousTarget,
      targetCapital,
      expectedGrowthAmount: targetCapital - previousTarget,
      expectedGrowthPercent:
        previousTarget > 0
          ? ((targetCapital - previousTarget) / previousTarget) * 100
          : 0,
      tradesCount: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakevenTrades: 0,
      grossProfit: 0,
      grossLoss: 0,
      fees: 0,
      netPnL: 0,
      returnPercent: 0,
      capitalDeployed: 0,
      maxDrawdown: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
}

export async function activateGrowthMission(missionId: string) {
  const ref = missionRef(missionId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Growth mission not found.");

  const mission = {
    id: snapshot.id,
    ...snapshot.data(),
  } as GrowthMission;

  if (mission.status === "ACTIVE") return;

  const startDate = asDate(mission.startDate) || new Date();
  const targetDate = addDays(startDate, mission.durationDays);

  await updateDoc(ref, {
    status: "ACTIVE",
    startDate,
    targetDate,
    currentDayNumber: 1,
    expectedCapitalToday: mission.startingCapital,
    expectedCapitalTomorrow:
      mission.startingCapital *
      Math.pow(
        mission.targetCapital / mission.startingCapital,
        1 / mission.durationDays,
      ),
    updatedAt: serverTimestamp(),
  });

  await generateMissionDays(missionId, mission, startDate);
}

export async function pauseGrowthMission(missionId: string) {
  await updateDoc(missionRef(missionId), {
    status: "PAUSED",
    updatedAt: serverTimestamp(),
  });
}

export async function resumeGrowthMission(missionId: string) {
  const ref = missionRef(missionId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Growth mission not found.");

  const mission = { id: snapshot.id, ...snapshot.data() } as GrowthMission;
  if (mission.status !== "PAUSED") return;

  await updateDoc(ref, {
    status: "ACTIVE",
    updatedAt: serverTimestamp(),
  });

  const days = await getGrowthMissionDays(missionId);
  if (days.length === 0) {
    const start = asDate(mission.startDate) || new Date();
    await generateMissionDays(missionId, mission, start);
  }
}

export async function getGrowthMissionDays(
  missionId: string,
): Promise<GrowthMissionDay[]> {
  const snapshot = await getDocs(daysCollection(missionId));
  const days = snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as GrowthMissionDay,
  );
  days.sort((a, b) => a.dayNumber - b.dayNumber);
  return days;
}

export async function getGrowthMissionTrades(
  missionId: string,
  missionDayId?: string,
): Promise<GrowthMissionTrade[]> {
  const days = missionDayId
    ? [missionDayId]
    : (await getGrowthMissionDays(missionId)).map((d) => d.id);

  const all: GrowthMissionTrade[] = [];

  for (const dayId of days) {
    const snapshot = await getDocs(tradesCollection(missionId, dayId));
    snapshot.docs.forEach((item) => {
      all.push({
        id: item.id,
        ...item.data(),
      } as GrowthMissionTrade);
    });
  }

  all.sort((a, b) => {
    if (a.tradeDate && b.tradeDate) {
      const ad = asDate(a.tradeDate)?.getTime() ?? 0;
      const bd = asDate(b.tradeDate)?.getTime() ?? 0;
      return bd - ad;
    }
    return b.tradeNumber - a.tradeNumber;
  });

  return all;
}

export async function recordGrowthMissionTrade(input: RecordTradeInput) {
  const {
    missionId,
    missionDayId,
    userId,
    assetClass,
    instrument,
    symbol,
    exchange,
    broker,
    position,
    bias,
    strategy,
    setup,
    entryPrice,
    quantity,
    positionSize,
    leverage,
    stopLoss,
    takeProfit,
    thesis,
    entryReason,
    notes,
  } = input;

  if (!missionId || !missionDayId || !userId) {
    throw new Error("Mission, day and user are required.");
  }
  if (!instrument.trim()) throw new Error("Instrument is required.");
  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    throw new Error("Entry price must be greater than zero.");
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }
  if (!Number.isFinite(positionSize) || positionSize <= 0) {
    throw new Error("Position size must be greater than zero.");
  }

  const missionSnap = await getDoc(missionRef(missionId));
  if (!missionSnap.exists()) throw new Error("Growth mission not found.");
  const mission = { id: missionSnap.id, ...missionSnap.data() } as GrowthMission;

  if (mission.status !== "ACTIVE") {
    throw new Error("Trades can only be recorded on an active mission.");
  }

  const daySnap = await getDoc(dayRef(missionId, missionDayId));
  if (!daySnap.exists()) throw new Error("Mission day not found.");
  const day = { id: daySnap.id, ...daySnap.data() } as GrowthMissionDay;

  const existing = await getDocs(tradesCollection(missionId, missionDayId));
  const tradeNumber =
    existing.docs.reduce(
      (max, item) => Math.max(max, Number(item.data().tradeNumber) || 0),
      0,
    ) + 1;

  const now = new Date();
  const tradeRefDoc = doc(tradesCollection(missionId, missionDayId));

  await (async () => {
    await (async () => {
      await updateDoc(dayRef(missionId, missionDayId), {
        status: day.status === "UPCOMING" ? "ACTIVE" : day.status,
        updatedAt: serverTimestamp(),
      });
    })();

    const batch = writeBatch(db);
    batch.set(tradeRefDoc, {
      missionId,
      missionDayId,
      userId,
      tradeNumber,
      tradeDate: now,
      status: "OPEN",
      assetClass,
      instrument: instrument.trim(),
      symbol: symbol?.trim() || "",
      exchange: exchange?.trim() || "",
      broker: broker?.trim() || "",
      position,
      bias,
      strategy: strategy?.trim() || "",
      setup: setup?.trim() || "",
      entryDate: now,
      entryTime: now.toISOString(),
      entryPrice,
      quantity,
      positionSize,
      leverage: leverage && leverage > 0 ? leverage : null,
      stopLoss: stopLoss !== undefined ? stopLoss : null,
      takeProfit: takeProfit !== undefined ? takeProfit : null,
      netPnL: 0,
      result: "OPEN",
      thesis: thesis?.trim() || "",
      entryReason: entryReason?.trim() || "",
      notes: notes?.trim() || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  })();

  await refreshMissionAggregates(missionId);
  return tradeRefDoc.id;
}

export async function closeGrowthMissionTrade({
  missionId,
  missionDayId,
  tradeId,
  exitPrice,
  fees = 0,
  exitReason = "MANUAL" as GrowthMissionExitReason,
  exitNotes = "",
}: {
  missionId: string;
  missionDayId: string;
  tradeId: string;
  exitPrice: number;
  fees?: number;
  exitReason?: GrowthMissionExitReason;
  exitNotes?: string;
}) {
  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    throw new Error("Exit price must be greater than zero.");
  }
  if (!Number.isFinite(fees) || fees < 0) {
    throw new Error("Fees must be zero or greater.");
  }

  const ref = tradeRef(missionId, missionDayId, tradeId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error("Trade not found.");

  const trade = { id: snapshot.id, ...snapshot.data() } as GrowthMissionTrade;
  if (trade.status !== "OPEN") throw new Error("This trade is already closed.");

  const math = calculateTradeMath(
    trade.position,
    trade.entryPrice,
    exitPrice,
    trade.quantity,
    fees,
    trade.stopLoss,
    trade.takeProfit,
  );

  const entryDate = asDate(trade.entryDate) || new Date();
  const exitDate = new Date();
  const holdingDurationMinutes = Math.max(
    0,
    Math.round((exitDate.getTime() - entryDate.getTime()) / 60000),
  );

  await updateDoc(ref, {
    status: "CLOSED",
    exitDate,
    exitTime: exitDate.toISOString(),
    exitPrice,
    exitReason,
    exitReasonNotes: exitNotes.trim(),
    holdingDurationMinutes,
    grossProfit: math.grossProfit,
    grossLoss: math.grossLoss,
    fees,
    netPnL: math.netPnL,
    returnPercent:
      trade.positionSize > 0
        ? (math.netPnL / trade.positionSize) * 100
        : math.returnPercent,
    riskAmount: math.riskAmount ?? null,
    rewardAmount: math.rewardAmount ?? null,
    riskRewardRatio: math.riskRewardRatio ?? null,
    result: resultFromPnL(math.netPnL),
    updatedAt: serverTimestamp(),
  });

  await refreshMissionAggregates(missionId);
}

export async function refreshMissionAggregates(missionId: string) {
  const missionSnap = await getDoc(missionRef(missionId));
  if (!missionSnap.exists()) throw new Error("Growth mission not found.");

  const mission = { id: missionSnap.id, ...missionSnap.data() } as GrowthMission;
  const days = await getGrowthMissionDays(missionId);

  let tradesCount = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let openTrades = 0;
  let realizedPnL = 0;
  let totalFees = 0;
  let totalCapitalDeployed = 0;
  let grossProfit = 0;
  let grossLoss = 0;
  let largestWin = 0;
  let largestLoss = 0;
  const closedPnLs: number[] = [];

  for (const day of days) {
    const trades = await getGrowthMissionTrades(missionId, day.id);
    let dayGrossProfit = 0;
    let dayGrossLoss = 0;
    let dayFees = 0;
    let dayNet = 0;
    let dayDeployed = 0;
    let dayWins = 0;
    let dayLosses = 0;
    let dayBreakevens = 0;
    let dayOpen = 0;

    for (const trade of trades) {
      tradesCount += 1;
      dayDeployed += trade.positionSize || 0;
      totalCapitalDeployed += trade.positionSize || 0;

      if (trade.status === "OPEN") {
        openTrades += 1;
        dayOpen += 1;
        continue;
      }

      const pnl = trade.netPnL || 0;
      realizedPnL += pnl;
      dayNet += pnl;
      totalFees += trade.fees || 0;
      dayFees += trade.fees || 0;

      dayGrossProfit += trade.grossProfit || 0;
      dayGrossLoss += trade.grossLoss || 0;
      grossProfit += trade.grossProfit || 0;
      grossLoss += trade.grossLoss || 0;

      if (trade.result === "WIN") {
        winningTrades += 1;
        dayWins += 1;
        largestWin = Math.max(largestWin, pnl);
      } else if (trade.result === "LOSS") {
        losingTrades += 1;
        dayLosses += 1;
        largestLoss = Math.min(largestLoss, pnl);
      } else if (trade.result === "BREAKEVEN") {
        breakevenTrades += 1;
        dayBreakevens += 1;
      }

      closedPnLs.push(pnl);
    }

    const closingCapital = day.openingCapital + dayNet;
    const actualGrowthAmount = dayNet;
    const actualGrowthPercent =
      day.openingCapital > 0
        ? (actualGrowthAmount / day.openingCapital) * 100
        : 0;
    const aheadBehindCapital = closingCapital - day.targetCapital;

    await updateDoc(dayRef(missionId, day.id), {
      status:
        dayNet !== 0 || trades.some((t) => t.status === "CLOSED")
          ? "COMPLETED"
          : day.status,
      closingCapital,
      actualGrowthAmount,
      actualGrowthPercent,
      aheadBehindCapital,
      aheadBehindPercent:
        day.targetCapital > 0
          ? (aheadBehindCapital / day.targetCapital) * 100
          : 0,
      tradesCount: trades.length,
      winningTrades: dayWins,
      losingTrades: dayLosses,
      breakevenTrades: dayBreakevens,
      grossProfit: dayGrossProfit,
      grossLoss: dayGrossLoss,
      fees: dayFees,
      netPnL: dayNet,
      returnPercent: actualGrowthPercent,
      capitalDeployed: dayDeployed,
      updatedAt: serverTimestamp(),
    });
  }

  const currentCapital = Math.max(0, mission.startingCapital + realizedPnL);
  const requiredGrowth = mission.targetCapital - mission.startingCapital;
  const progress =
    requiredGrowth > 0
      ? Math.max(0, Math.min(100, ((currentCapital - mission.startingCapital) / requiredGrowth) * 100))
      : 0;

  const completedDays = days.filter((d) => d.status === "COMPLETED").length;
  const activeDay = days.find((d) => d.status === "ACTIVE") || days.find((d) => d.status === "UPCOMING");

  const avgWin =
    winningTrades > 0
      ? closedPnLs.filter((p) => p > 0).reduce((a, b) => a + b, 0) / winningTrades
      : 0;
  const avgLoss =
    losingTrades > 0
      ? closedPnLs.filter((p) => p < 0).reduce((a, b) => a + b, 0) / losingTrades
      : 0;

  const updatedStatus =
    currentCapital >= mission.targetCapital
      ? "COMPLETED"
      : mission.status;

  await updateDoc(missionRef(missionId), {
    currentCapital,
    tradesCount,
    winningTrades,
    losingTrades,
    breakevenTrades,
    openTrades,
    realizedPnL,
    progressPercent: progress,
    remainingCapital: Math.max(0, mission.targetCapital - currentCapital),
    completedDays,
    currentDayNumber: activeDay?.dayNumber || mission.currentDayNumber || 0,
    totalCapitalDeployed,
    totalFees,
    largestWin,
    largestLoss,
    winRate: winningTrades + losingTrades > 0
      ? (winningTrades / (winningTrades + losingTrades)) * 100
      : 0,
    averageWin: avgWin,
    averageLoss: avgLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    status: updatedStatus,
    updatedAt: serverTimestamp(),
  });
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
  if (!Number.isFinite(currentCapital) || currentCapital < 0) {
    throw new Error("Current capital must be valid.");
  }

  const mission = await getGrowthMission(missionId);
  if (!mission) throw new Error("Growth mission not found.");

  const requiredGrowth = mission.targetCapital - mission.startingCapital;
  const progress =
    requiredGrowth > 0
      ? Math.max(0, Math.min(100, ((currentCapital - mission.startingCapital) / requiredGrowth) * 100))
      : 0;

  await updateDoc(missionRef(missionId), {
    currentCapital,
    tradesCount,
    winningTrades,
    losingTrades,
    realizedPnL,
    progressPercent: progress,
    remainingCapital: Math.max(0, mission.targetCapital - currentCapital),
    status:
      currentCapital >= mission.targetCapital
        ? "COMPLETED"
        : mission.status,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGrowthMission(missionId: string) {
  const mission = await getGrowthMission(missionId);
  if (!mission) throw new Error("Growth mission not found.");

  // Delete nested trades first, then days, then the mission.
  const days = await getGrowthMissionDays(missionId);

  for (const day of days) {
    const tradesSnap = await getDocs(tradesCollection(missionId, day.id));

    let batch = writeBatch(db);
    let count = 0;

    for (const trade of tradesSnap.docs) {
      batch.delete(trade.ref);
      count += 1;

      if (count === 450) {
        await batch.commit();
        batch = writeBatch(db);
        count = 0;
      }
    }

    if (count > 0) await batch.commit();
    await deleteDoc(dayRef(missionId, day.id));
  }

  await deleteDoc(missionRef(missionId));
}

export function calculateMissionProgress(mission: GrowthMission) {
  if (mission.targetCapital <= mission.startingCapital) return 0;
  return Math.max(
    0,
    Math.min(
      100,
      ((mission.currentCapital - mission.startingCapital) /
        (mission.targetCapital - mission.startingCapital)) *
        100,
    ),
  );
}

export function calculateMissionReturn(mission: GrowthMission) {
  if (mission.startingCapital <= 0) return 0;
  return ((mission.currentCapital - mission.startingCapital) / mission.startingCapital) * 100;
}

export function calculateMissionRemaining(mission: GrowthMission) {
  return Math.max(0, mission.targetCapital - mission.currentCapital);
}
