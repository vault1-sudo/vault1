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
  Strategy,
  StrategyRiskLevel,
  StrategyStatus,
} from "../../types/strategy";

const STRATEGIES_COLLECTION = "strategies";

type CreateStrategyInput = {
  userId: string;
  name: string;
  code: string;
  description: string;
  assetClasses: string[];
  riskLevel: StrategyRiskLevel;
  targetReturnPercent?: number;
  maxDrawdownPercent?: number;
  maxCapitalAllocationPercent?: number;
  minimumCapital?: number;
  status?: StrategyStatus;
};

export async function createStrategy({
  userId,
  name,
  code,
  description,
  assetClasses,
  riskLevel,
  targetReturnPercent,
  maxDrawdownPercent,
  maxCapitalAllocationPercent,
  minimumCapital,
  status = "ACTIVE",
}: CreateStrategyInput) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!name.trim()) {
    throw new Error("Strategy name is required.");
  }

  if (!code.trim()) {
    throw new Error("Strategy code is required.");
  }

  if (!description.trim()) {
    throw new Error("Strategy description is required.");
  }

  if (!assetClasses.length) {
    throw new Error("At least one asset class is required.");
  }

  if (
    targetReturnPercent !== undefined &&
    (!Number.isFinite(targetReturnPercent) ||
      targetReturnPercent < 0)
  ) {
    throw new Error("Target return must be a valid positive number.");
  }

  if (
    maxDrawdownPercent !== undefined &&
    (!Number.isFinite(maxDrawdownPercent) ||
      maxDrawdownPercent < 0)
  ) {
    throw new Error("Maximum drawdown must be a valid positive number.");
  }

  if (
    maxCapitalAllocationPercent !== undefined &&
    (!Number.isFinite(maxCapitalAllocationPercent) ||
      maxCapitalAllocationPercent <= 0 ||
      maxCapitalAllocationPercent > 100)
  ) {
    throw new Error(
      "Capital allocation must be between 0 and 100."
    );
  }

  if (
    minimumCapital !== undefined &&
    (!Number.isFinite(minimumCapital) ||
      minimumCapital < 0)
  ) {
    throw new Error("Minimum capital must be a valid number.");
  }

  const normalizedCode = code.trim().toUpperCase();

  const duplicateQuery = query(
    collection(db, STRATEGIES_COLLECTION),
    where("userId", "==", userId),
    where("code", "==", normalizedCode)
  );

  const duplicateSnapshot = await getDocs(duplicateQuery);

  if (!duplicateSnapshot.empty) {
    throw new Error(
      "A strategy with this code already exists."
    );
  }

  const strategyData = {
    userId,

    name: name.trim(),
    code: normalizedCode,
    description: description.trim(),

    assetClasses: assetClasses.map((item) =>
      item.trim().toUpperCase()
    ),

    riskLevel,

    ...(targetReturnPercent !== undefined
      ? { targetReturnPercent }
      : {}),

    ...(maxDrawdownPercent !== undefined
      ? { maxDrawdownPercent }
      : {}),

    ...(maxCapitalAllocationPercent !== undefined
      ? { maxCapitalAllocationPercent }
      : {}),

    ...(minimumCapital !== undefined
      ? { minimumCapital }
      : {}),

    status,

    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,

    realizedPnL: 0,
    totalFees: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const strategyRef = await addDoc(
    collection(db, STRATEGIES_COLLECTION),
    strategyData
  );

  return strategyRef.id;
}

export async function getStrategies(
  userId: string
): Promise<Strategy[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const strategiesQuery = query(
    collection(db, STRATEGIES_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(strategiesQuery);

  const strategies = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Strategy[];

  strategies.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return strategies;
}

export async function getActiveStrategies(
  userId: string
): Promise<Strategy[]> {
  const strategies = await getStrategies(userId);

  return strategies.filter(
    (strategy) => strategy.status === "ACTIVE"
  );
}

export async function getStrategy(
  strategyId: string
): Promise<Strategy | null> {
  if (!strategyId) {
    throw new Error("Strategy ID is required.");
  }

  const strategyRef = doc(
    db,
    STRATEGIES_COLLECTION,
    strategyId
  );

  const snapshot = await getDoc(strategyRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Strategy;
}

export async function updateStrategy({
  strategyId,
  name,
  code,
  description,
  assetClasses,
  riskLevel,
  targetReturnPercent,
  maxDrawdownPercent,
  maxCapitalAllocationPercent,
  minimumCapital,
  status,
}: {
  strategyId: string;
  name: string;
  code: string;
  description: string;
  assetClasses: string[];
  riskLevel: StrategyRiskLevel;
  targetReturnPercent?: number;
  maxDrawdownPercent?: number;
  maxCapitalAllocationPercent?: number;
  minimumCapital?: number;
  status: StrategyStatus;
}) {
  if (!strategyId) {
    throw new Error("Strategy ID is required.");
  }

  if (!name.trim()) {
    throw new Error("Strategy name is required.");
  }

  if (!code.trim()) {
    throw new Error("Strategy code is required.");
  }

  if (!description.trim()) {
    throw new Error("Strategy description is required.");
  }

  if (!assetClasses.length) {
    throw new Error("At least one asset class is required.");
  }

  const strategyRef = doc(
    db,
    STRATEGIES_COLLECTION,
    strategyId
  );

  await updateDoc(strategyRef, {
    name: name.trim(),
    code: code.trim().toUpperCase(),
    description: description.trim(),

    assetClasses: assetClasses.map((item) =>
      item.trim().toUpperCase()
    ),

    riskLevel,

    ...(targetReturnPercent !== undefined
      ? { targetReturnPercent }
      : {}),

    ...(maxDrawdownPercent !== undefined
      ? { maxDrawdownPercent }
      : {}),

    ...(maxCapitalAllocationPercent !== undefined
      ? { maxCapitalAllocationPercent }
      : {}),

    ...(minimumCapital !== undefined
      ? { minimumCapital }
      : {}),

    status,

    updatedAt: serverTimestamp(),
  });
}

export async function updateStrategyMetrics({
  strategyId,
  totalTrades,
  winningTrades,
  losingTrades,
  realizedPnL,
  totalFees,
}: {
  strategyId: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  realizedPnL: number;
  totalFees: number;
}) {
  if (!strategyId) {
    throw new Error("Strategy ID is required.");
  }

  const strategyRef = doc(
    db,
    STRATEGIES_COLLECTION,
    strategyId
  );

  await updateDoc(strategyRef, {
    totalTrades,
    winningTrades,
    losingTrades,
    realizedPnL,
    totalFees,
    updatedAt: serverTimestamp(),
  });
}

export function calculateStrategyWinRate(
  strategy: Strategy
) {
  if (strategy.totalTrades <= 0) {
    return 0;
  }

  return (
    (strategy.winningTrades /
      strategy.totalTrades) *
    100
  );
}

export function calculateStrategyLossRate(
  strategy: Strategy
) {
  if (strategy.totalTrades <= 0) {
    return 0;
  }

  return (
    (strategy.losingTrades /
      strategy.totalTrades) *
    100
  );
}