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
  Investor,
  InvestorAccountStatus,
  InvestorAgreementStatus,
  InvestorKycStatus,
  InvestorRiskProfile,
  InvestorStatus,
} from "../../types/investor";

const INVESTORS_COLLECTION =
  "investors";

function normalizeText(
  value: string
): string {
  return value.trim();
}

function generateInvestorCode(): string {
  const timestamp =
    Date.now().toString(36).toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

  return `V1-${timestamp}-${random}`;
}

function calculateOnboardingProgress(
  investor: Partial<Investor>
): number {
  let completed = 0;

  const steps = [
    Boolean(investor.fullName),
    Boolean(investor.email),
    Boolean(investor.phone),
    investor.kycStatus === "VERIFIED",
    investor.agreementStatus === "SIGNED",
    investor.riskProfile !== "NOT_SET",
    Boolean(investor.strategyName),
    investor.accountStatus === "ACTIVE",
  ];

  steps.forEach((step) => {
    if (step) {
      completed += 1;
    }
  });

  return Math.round(
    (completed / steps.length) * 100
  );
}

export async function createInvestor({
  userId,
  fullName,
  email,
  phone,
  riskProfile = "NOT_SET",
  strategyName = "",
  notes = "",
}: {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  riskProfile?: InvestorRiskProfile;
  strategyName?: string;
  notes?: string;
}): Promise<string> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const normalizedName =
    normalizeText(fullName);

  const normalizedEmail =
    normalizeText(email).toLowerCase();

  const normalizedPhone =
    normalizeText(phone);

  if (!normalizedName) {
    throw new Error(
      "Investor name is required."
    );
  }

  if (!normalizedEmail) {
    throw new Error(
      "Investor email is required."
    );
  }

  if (!normalizedPhone) {
    throw new Error(
      "Investor phone number is required."
    );
  }

  const existingQuery = query(
    collection(
      db,
      INVESTORS_COLLECTION
    ),
    where(
      "userId",
      "==",
      userId
    )
  );

  const existingSnapshot =
    await getDocs(existingQuery);

  const duplicate =
    existingSnapshot.docs.some(
      (document) => {
        const data =
          document.data();

        return (
          typeof data.email ===
            "string" &&
          data.email
            .trim()
            .toLowerCase() ===
            normalizedEmail
        );
      }
    );

  if (duplicate) {
    throw new Error(
      "An investor with this email already exists."
    );
  }

  const investorCode =
    generateInvestorCode();

  const investorData = {
    userId,

    investorCode,

    fullName:
      normalizedName,

    email:
      normalizedEmail,

    phone:
      normalizedPhone,

    status:
      "INVITED" as InvestorStatus,

    riskProfile,

    kycStatus:
      "NOT_STARTED" as InvestorKycStatus,

    agreementStatus:
      "NOT_STARTED" as InvestorAgreementStatus,

    accountStatus:
      "PENDING" as InvestorAccountStatus,

    contributedCapital: 0,

    currentValue: 0,

    realizedPnL: 0,

    unrealizedPnL: 0,

    totalPnL: 0,

    returnPercent: 0,

    availableCash: 0,

    investedCapital: 0,

    totalFees: 0,

    payoutAmount: 0,

    strategyName:
      normalizeText(
        strategyName
      ),

    onboardingProgress:
      calculateOnboardingProgress({
        fullName:
          normalizedName,
        email:
          normalizedEmail,
        phone:
          normalizedPhone,
        riskProfile,
        strategyName:
          normalizeText(
            strategyName
          ),
        kycStatus:
          "NOT_STARTED",
        agreementStatus:
          "NOT_STARTED",
        accountStatus:
          "PENDING",
      }),

    notes:
      normalizeText(notes),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const investorRef =
    await addDoc(
      collection(
        db,
        INVESTORS_COLLECTION
      ),
      investorData
    );

  return investorRef.id;
}

export async function getInvestors(
  userId: string
): Promise<Investor[]> {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  const investorsQuery =
    query(
      collection(
        db,
        INVESTORS_COLLECTION
      ),
      where(
        "userId",
        "==",
        userId
      )
    );

  const snapshot =
    await getDocs(
      investorsQuery
    );

  const investors =
    snapshot.docs.map(
      (document) => ({
        id: document.id,
        ...document.data(),
      })
    ) as Investor[];

  investors.sort(
    (a, b) => {
      const aTime =
        getTimestamp(
          a.createdAt
        );

      const bTime =
        getTimestamp(
          b.createdAt
        );

      return (
        bTime - aTime
      );
    }
  );

  return investors;
}

export async function getInvestor(
  investorId: string
): Promise<Investor | null> {
  if (!investorId) {
    throw new Error(
      "Investor ID is required."
    );
  }

  const investorRef =
    doc(
      db,
      INVESTORS_COLLECTION,
      investorId
    );

  const snapshot =
    await getDoc(
      investorRef
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Investor;
}

export async function updateInvestor(
  investorId: string,
  updates: Partial<
    Omit<
      Investor,
      "id" |
      "userId" |
      "createdAt"
    >
  >
): Promise<void> {
  if (!investorId) {
    throw new Error(
      "Investor ID is required."
    );
  }

  const investorRef =
    doc(
      db,
      INVESTORS_COLLECTION,
      investorId
    );

  const cleanUpdates: Record<
    string,
    any
  > = {
    ...updates,
    updatedAt:
      serverTimestamp(),
  };

  delete cleanUpdates.id;
  delete cleanUpdates.userId;
  delete cleanUpdates.createdAt;

  await updateDoc(
    investorRef,
    cleanUpdates
  );
}

export async function updateInvestorStatus(
  investorId: string,
  status: InvestorStatus
): Promise<void> {
  await updateInvestor(
    investorId,
    {
      status,
    }
  );
}

export async function updateInvestorKycStatus(
  investorId: string,
  kycStatus: InvestorKycStatus
): Promise<void> {
  await updateInvestor(
    investorId,
    {
      kycStatus,
    }
  );
}

export async function updateInvestorAgreementStatus(
  investorId: string,
  agreementStatus: InvestorAgreementStatus
): Promise<void> {
  await updateInvestor(
    investorId,
    {
      agreementStatus,
    }
  );
}

export async function updateInvestorRiskProfile(
  investorId: string,
  riskProfile: InvestorRiskProfile
): Promise<void> {
  await updateInvestor(
    investorId,
    {
      riskProfile,
    }
  );
}

export async function activateInvestorAccount(
  investorId: string
): Promise<void> {
  const investor =
    await getInvestor(
      investorId
    );

  if (!investor) {
    throw new Error(
      "Investor not found."
    );
  }

  if (
    investor.kycStatus !==
    "VERIFIED"
  ) {
    throw new Error(
      "Investor KYC must be verified before account activation."
    );
  }

  if (
    investor.agreementStatus !==
    "SIGNED"
  ) {
    throw new Error(
      "Investor agreement must be signed before account activation."
    );
  }

  if (
    investor.riskProfile ===
    "NOT_SET"
  ) {
    throw new Error(
      "Investor risk profile must be completed before account activation."
    );
  }

  await updateInvestor(
    investorId,
    {
      status: "ACTIVE",
      accountStatus:
        "ACTIVE",
      onboardingProgress: 100,
    }
  );
}

export function calculateInvestorReturn(
  contributedCapital: number,
  currentValue: number
): number {
  if (
    contributedCapital <= 0
  ) {
    return 0;
  }

  return (
    ((currentValue -
      contributedCapital) /
      contributedCapital) *
    100
  );
}

export function calculateInvestorPnL(
  contributedCapital: number,
  currentValue: number
): number {
  return (
    currentValue -
    contributedCapital
  );
}

export function getInvestorStatusLabel(
  status: InvestorStatus
): string {
  switch (status) {
    case "INVITED":
      return "INVITED";

    case "ONBOARDING":
      return "ONBOARDING";

    case "PENDING_REVIEW":
      return "PENDING REVIEW";

    case "ACTIVE":
      return "ACTIVE";

    case "SUSPENDED":
      return "SUSPENDED";

    case "CLOSED":
      return "CLOSED";

    default:
      return "UNKNOWN";
  }
}

export function getInvestorStatusDescription(
  status: InvestorStatus
): string {
  switch (status) {
    case "INVITED":
      return "Investor invitation has been created.";

    case "ONBOARDING":
      return "Investor onboarding is currently in progress.";

    case "PENDING_REVIEW":
      return "Investor information is waiting for internal review.";

    case "ACTIVE":
      return "Investor account is active.";

    case "SUSPENDED":
      return "Investor account is temporarily suspended.";

    case "CLOSED":
      return "Investor account has been closed.";

    default:
      return "Investor status is unavailable.";
  }
}

export function getInvestorRiskLabel(
  riskProfile: InvestorRiskProfile
): string {
  switch (riskProfile) {
    case "CONSERVATIVE":
      return "CONSERVATIVE";

    case "MODERATE":
      return "MODERATE";

    case "BALANCED":
      return "BALANCED";

    case "AGGRESSIVE":
      return "AGGRESSIVE";

    case "NOT_SET":
      return "NOT SET";

    default:
      return "NOT SET";
  }
}

function getTimestamp(
  value: any
): number {
  if (
    value &&
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
      "string" ||
    typeof value ===
      "number"
  ) {
    const parsed =
      new Date(
        value
      ).getTime();

    return Number.isFinite(
      parsed
    )
      ? parsed
      : 0;
  }

  return 0;
}