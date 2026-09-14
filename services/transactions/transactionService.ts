import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../../types/transaction";


const TRANSACTIONS_COLLECTION =
  "transactions";


/* =========================================================
   CREATE TRANSACTION
   ========================================================= */

export async function createTransaction({
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
  type: TransactionType;
  amount: number;
  currency?: string;
  description: string;
  status?: TransactionStatus;
  referenceType?: string;
  referenceId?: string;
}) {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount === 0
  ) {
    throw new Error(
      "Amount must be a valid non-zero number."
    );
  }

  if (!description.trim()) {
    throw new Error(
      "Description is required."
    );
  }

  const transaction = {
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

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const transactionRef =
    await addDoc(
      collection(
        db,
        TRANSACTIONS_COLLECTION
      ),
      transaction
    );

  return transactionRef.id;
}


/* =========================================================
   GET USER TRANSACTIONS
   ========================================================= */

export async function getUserTransactions(
  userId: string
): Promise<Transaction[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const transactionQuery =
    query(
      collection(
        db,
        TRANSACTIONS_COLLECTION
      ),
      where(
        "userId",
        "==",
        userId
      )
    );

  const snapshot =
    await getDocs(
      transactionQuery
    );

  const transactions =
    snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as Transaction[];

  transactions.sort(
    (
      a: Transaction,
      b: Transaction
    ) => {
      const aTime =
        a.createdAt?.toMillis?.() ??
        (
          a.createdAt instanceof Date
            ? a.createdAt.getTime()
            : 0
        );

      const bTime =
        b.createdAt?.toMillis?.() ??
        (
          b.createdAt instanceof Date
            ? b.createdAt.getTime()
            : 0
        );

      return bTime - aTime;
    }
  );

  return transactions;
}


/* =========================================================
   CASHFLOW ENGINE
   ========================================================= */

export function calculateCashflow(
  transactions: Transaction[]
) {
  const posted =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        "POSTED"
    );


  const deposits =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "DEPOSIT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const withdrawals =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "WITHDRAWAL"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const investmentOutflow =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "INVESTMENT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const tradingProfit =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "TRADE_PROFIT"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const tradingLoss =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "TRADE_LOSS"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const fees =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "FEE"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const interest =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "INTEREST"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const dividends =
    posted
      .filter(
        (transaction) =>
          transaction.type ===
          "DIVIDEND"
      )
      .reduce(
        (total, transaction) =>
          total +
          Math.abs(
            transaction.amount
          ),
        0
      );


  const totalInflows =
    posted.reduce(
      (total, transaction) =>
        transaction.amount > 0
          ? total +
            transaction.amount
          : total,
      0
    );


  const totalOutflows =
    posted.reduce(
      (total, transaction) =>
        transaction.amount < 0
          ? total +
            Math.abs(
              transaction.amount
            )
          : total,
      0
    );


  const netCashflow =
    posted.reduce(
      (total, transaction) =>
        total +
        transaction.amount,
      0
    );


  const netExternalCashflow =
    deposits -
    withdrawals;


  const netTradingCashflow =
    tradingProfit -
    tradingLoss -
    fees;


  const netIncome =
    interest +
    dividends;


  return {
    totalInflows,
    totalOutflows,

    netCashflow,

    netExternalCashflow,

    netTradingCashflow,

    netIncome,

    deposits,
    withdrawals,

    investmentOutflow,

    tradingProfit,
    tradingLoss,

    fees,

    interest,
    dividends,

    transactionCount:
      posted.length,
  };
}


/* =========================================================
   TRANSACTION LABEL
   ========================================================= */

export function getTransactionTypeLabel(
  type: TransactionType
) {
  switch (type) {
    case "DEPOSIT":
      return "Deposit";

    case "WITHDRAWAL":
      return "Withdrawal";

    case "INVESTMENT":
      return "Investment";

    case "TRADE_PROFIT":
      return "Trading Profit";

    case "TRADE_LOSS":
      return "Trading Loss";

    case "FEE":
      return "Fee";

    case "INTEREST":
      return "Interest";

    case "DIVIDEND":
      return "Dividend";

    case "OTHER":
      return "Other";

    default:
      return type;
  }
}


/* =========================================================
   TRANSACTION SIGN
   ========================================================= */

export function getTransactionDirection(
  transaction: Transaction
) {
  return transaction.amount >= 0
    ? "INFLOW"
    : "OUTFLOW";
}