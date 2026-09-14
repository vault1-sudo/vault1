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
import { Trade, TradeSide, TradeStatus } from "../../types/trade";

const TRADES_COLLECTION = "trades";

/**
 * Create a new trade.
 */
export async function createTrade({
  userId,
  asset,
  side,
  quantity,
  entryPrice,
  fees = 0,
  strategy,
  status = "OPEN",
}: {
  userId: string;
  asset: string;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  fees?: number;
  strategy: string;
  status?: TradeStatus;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!asset.trim()) {
    throw new Error("Asset is required.");
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be greater than zero.");
  }

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    throw new Error("Entry price must be greater than zero.");
  }

  if (!Number.isFinite(fees) || fees < 0) {
    throw new Error("Fees cannot be negative.");
  }

  if (!strategy.trim()) {
    throw new Error("Strategy is required.");
  }

  const tradeData = {
    userId,
    asset: asset.trim().toUpperCase(),
    side,
    quantity,
    entryPrice,
    fees,
    strategy: strategy.trim(),
    status,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const tradeRef = await addDoc(
    collection(db, TRADES_COLLECTION),
    tradeData
  );

  return tradeRef.id;
}


/**
 * Get all trades belonging to a user.
 *
 * We intentionally query only by userId and sort locally.
 * This avoids requiring another Firestore composite index.
 */
export async function getUserTrades(
  userId: string
): Promise<Trade[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const tradesQuery = query(
    collection(db, TRADES_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(tradesQuery);

  const trades = snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data(),
  })) as Trade[];

  trades.sort((a: Trade, b: Trade) => {
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

  return trades;
}


/**
 * Close an existing trade.
 */
export async function closeTrade({
  tradeId,
  exitPrice,
}: {
  tradeId: string;
  exitPrice: number;
}) {
  if (!tradeId) {
    throw new Error("Trade ID is required.");
  }

  if (!Number.isFinite(exitPrice) || exitPrice <= 0) {
    throw new Error("Exit price must be greater than zero.");
  }

  const tradeRef = doc(
    db,
    TRADES_COLLECTION,
    tradeId
  );

  await updateDoc(tradeRef, {
    exitPrice,
    status: "CLOSED",
    updatedAt: serverTimestamp(),
  });
}


/**
 * Calculate realized P&L for a trade.
 *
 * BUY:
 *   P&L = (Exit - Entry) × Quantity - Fees
 *
 * SELL:
 *   P&L = (Entry - Exit) × Quantity - Fees
 */
export function calculateTradePnL(
  trade: Trade
): number {
  if (
    trade.status !== "CLOSED" ||
    trade.exitPrice === undefined
  ) {
    return 0;
  }

  const priceDifference =
    trade.side === "BUY"
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;

  return (
    priceDifference * trade.quantity -
    trade.fees
  );
}


/**
 * Calculate trade notional value.
 */
export function calculateTradeValue(
  trade: Trade
): number {
  return trade.quantity * trade.entryPrice;
}


/**
 * Calculate summary statistics.
 */
export function calculateTradeSummary(
  trades: Trade[]
) {
  const openTrades = trades.filter(
    (trade: Trade) => trade.status === "OPEN"
  );

  const closedTrades = trades.filter(
    (trade: Trade) => trade.status === "CLOSED"
  );

  const realizedPnL = closedTrades.reduce(
    (total: number, trade: Trade) =>
      total + calculateTradePnL(trade),
    0
  );

  const totalFees = trades.reduce(
    (total: number, trade: Trade) =>
      total + trade.fees,
    0
  );

  const winningTrades = closedTrades.filter(
    (trade: Trade) =>
      calculateTradePnL(trade) > 0
  );

  const losingTrades = closedTrades.filter(
    (trade: Trade) =>
      calculateTradePnL(trade) < 0
  );

  const winRate =
    closedTrades.length > 0
      ? (winningTrades.length / closedTrades.length) *
        100
      : 0;

  return {
    totalTrades: trades.length,
    openTrades: openTrades.length,
    closedTrades: closedTrades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    realizedPnL,
    totalFees,
    winRate,
  };
}