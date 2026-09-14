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
  InvestorOnboarding,
  InvestorOnboardingStatus,
  InvestorOnboardingUpdate,
  InvestorKycStatus,
  InvestorRiskLevel,
  InvestorAgreementStatus,
  InvestorCapitalStatus,
} from "../../types/investorOnboarding";

const COLLECTION =
  "investorOnboarding";


function clean(value: string) {
  return value.trim();
}


function onboardingRef(id: string) {
  return doc(db, COLLECTION, id);
}


export async function createInvestorOnboarding({
  userId,
  investorId,
  investorCode,
  investorName,
  investorEmail,
  committedCapital = 0,
  notes = "",
}: {
  userId: string;
  investorId: string;
  investorCode: string;
  investorName: string;
  investorEmail: string;
  committedCapital?: number;
  notes?: string;
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!clean(investorId)) {
    throw new Error("Investor ID is required.");
  }

  if (!clean(investorCode)) {
    throw new Error("Investor code is required.");
  }

  if (!clean(investorName)) {
    throw new Error("Investor name is required.");
  }

  if (!clean(investorEmail)) {
    throw new Error("Investor email is required.");
  }

  if (
    !Number.isFinite(committedCapital) ||
    committedCapital < 0
  ) {
    throw new Error(
      "Committed capital cannot be negative."
    );
  }

  const existingQuery = query(
    collection(db, COLLECTION),
    where("userId", "==", userId),
  );

  const existingSnapshot =
    await getDocs(existingQuery);

  const duplicate =
    existingSnapshot.docs.some(
      (item) =>
        item.data().investorId ===
        investorId
    );

  if (duplicate) {
    throw new Error(
      "An onboarding record already exists for this investor."
    );
  }

  const onboarding = {
    userId,

    investorId: clean(investorId),
    investorCode: clean(investorCode)
      .toUpperCase(),

    investorName: clean(investorName),
    investorEmail: clean(investorEmail)
      .toLowerCase(),

    status:
      "INVITED" as InvestorOnboardingStatus,

    profileComplete: false,

    kycStatus:
      "NOT_STARTED" as InvestorKycStatus,

    riskLevel:
      "NOT_ASSESSED" as InvestorRiskLevel,

    riskProfileComplete: false,

    documentsComplete: false,

    agreementStatus:
      "NOT_REQUIRED" as InvestorAgreementStatus,

    strategyAssigned: false,

    capitalStatus:
      "NOT_REQUIRED" as InvestorCapitalStatus,

    committedCapital,

    invitationSentAt:
      serverTimestamp(),

    notes: clean(notes),

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const ref = await addDoc(
    collection(db, COLLECTION),
    onboarding
  );

  return ref.id;
}


export async function getInvestorOnboardingRecords(
  userId: string
): Promise<InvestorOnboarding[]> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const onboardingQuery = query(
    collection(db, COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot =
    await getDocs(onboardingQuery);

  const records =
    snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as InvestorOnboarding[];

  records.sort((a, b) => {
    const aTime =
      a.createdAt?.toMillis?.() ??
      0;

    const bTime =
      b.createdAt?.toMillis?.() ??
      0;

    return bTime - aTime;
  });

  return records;
}


export async function getInvestorOnboarding(
  id: string
): Promise<InvestorOnboarding | null> {
  if (!id) {
    throw new Error(
      "Onboarding ID is required."
    );
  }

  const snapshot =
    await getDoc(onboardingRef(id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as InvestorOnboarding;
}


export async function updateInvestorOnboarding(
  id: string,
  updates: InvestorOnboardingUpdate
) {
  if (!id) {
    throw new Error(
      "Onboarding ID is required."
    );
  }

  if (
    Object.keys(updates).length === 0
  ) {
    return;
  }

  await updateDoc(
    onboardingRef(id),
    {
      ...updates,
      updatedAt:
        serverTimestamp(),
    }
  );
}


export async function updateOnboardingStatus(
  id: string,
  status: InvestorOnboardingStatus
) {
  await updateInvestorOnboarding(
    id,
    { status }
  );
}


export async function completeProfile(
  id: string
) {
  await updateInvestorOnboarding(
    id,
    {
      profileComplete: true,
      status: "KYC_PENDING",
      profileCompletedAt:
        serverTimestamp(),
    }
  );
}


export async function updateKycStatus(
  id: string,
  kycStatus: InvestorKycStatus
) {
  const updates: InvestorOnboardingUpdate = {
    kycStatus,
  };

  if (kycStatus === "VERIFIED") {
    updates.status =
      "RISK_PROFILE_PENDING";

    updates.kycCompletedAt =
      serverTimestamp();
  }

  if (kycStatus === "REJECTED") {
    updates.status = "ON_HOLD";
  }

  await updateInvestorOnboarding(
    id,
    updates
  );
}


export async function completeRiskProfile(
  id: string,
  riskLevel: InvestorRiskLevel
) {
  if (riskLevel === "NOT_ASSESSED") {
    throw new Error(
      "A valid risk level is required."
    );
  }

  await updateInvestorOnboarding(
    id,
    {
      riskLevel,
      riskProfileComplete: true,
      status: "DOCUMENTS_PENDING",
      riskProfileCompletedAt:
        serverTimestamp(),
    }
  );
}


export async function completeDocuments(
  id: string
) {
  await updateInvestorOnboarding(
    id,
    {
      documentsComplete: true,
      status: "AGREEMENT_PENDING",
      documentsCompletedAt:
        serverTimestamp(),
    }
  );
}


export async function updateAgreementStatus(
  id: string,
  agreementStatus: InvestorAgreementStatus
) {
  const updates: InvestorOnboardingUpdate = {
    agreementStatus,
  };

  if (agreementStatus === "SIGNED") {
    updates.status =
      "STRATEGY_PENDING";

    updates.agreementCompletedAt =
      serverTimestamp();
  }

  if (agreementStatus === "REJECTED") {
    updates.status = "ON_HOLD";
  }

  await updateInvestorOnboarding(
    id,
    updates
  );
}


export async function assignStrategy(
  id: string,
  strategyName: string
) {
  if (!clean(strategyName)) {
    throw new Error(
      "Strategy name is required."
    );
  }

  await updateInvestorOnboarding(
    id,
    {
      strategyAssigned: true,
      strategyName: clean(strategyName),
      status: "CAPITAL_PENDING",
      strategyAssignedAt:
        serverTimestamp(),
    }
  );
}


export async function updateCapitalStatus(
  id: string,
  capitalStatus: InvestorCapitalStatus,
  committedCapital?: number
) {
  const updates: InvestorOnboardingUpdate = {
    capitalStatus,
  };

  if (
    committedCapital !== undefined
  ) {
    if (
      !Number.isFinite(
        committedCapital
      ) ||
      committedCapital < 0
    ) {
      throw new Error(
        "Committed capital cannot be negative."
      );
    }

    updates.committedCapital =
      committedCapital;
  }

  if (
    capitalStatus === "CONFIRMED"
  ) {
    updates.status = "READY";

    updates.capitalConfirmedAt =
      serverTimestamp();
  }

  await updateInvestorOnboarding(
    id,
    updates
  );
}


export async function activateInvestor(
  id: string
) {
  const record =
    await getInvestorOnboarding(id);

  if (!record) {
    throw new Error(
      "Investor onboarding record not found."
    );
  }

  if (!record.profileComplete) {
    throw new Error(
      "Investor profile is not complete."
    );
  }

  if (
    record.kycStatus !==
    "VERIFIED"
  ) {
    throw new Error(
      "Investor KYC must be verified."
    );
  }

  if (!record.riskProfileComplete) {
    throw new Error(
      "Investor risk profile is incomplete."
    );
  }

  if (!record.documentsComplete) {
    throw new Error(
      "Investor documents are incomplete."
    );
  }

  if (
    record.agreementStatus !==
    "SIGNED"
  ) {
    throw new Error(
      "Investor agreement must be signed."
    );
  }

  if (!record.strategyAssigned) {
    throw new Error(
      "A strategy must be assigned."
    );
  }

  if (
    record.capitalStatus !==
    "CONFIRMED"
  ) {
    throw new Error(
      "Investor capital must be confirmed."
    );
  }

  await updateInvestorOnboarding(
    id,
    {
      status: "ACTIVE",
      activatedAt:
        serverTimestamp(),
    }
  );
}


export function getOnboardingStatusLabel(
  status: InvestorOnboardingStatus
) {
  return status
    .replaceAll("_", " ")
    .toUpperCase();
}


export function getKycStatusLabel(
  status: InvestorKycStatus
) {
  return status
    .replaceAll("_", " ")
    .toUpperCase();
}


export function getRiskLevelLabel(
  level: InvestorRiskLevel
) {
  return level
    .replaceAll("_", " ")
    .toUpperCase();
}


export function getAgreementStatusLabel(
  status: InvestorAgreementStatus
) {
  return status
    .replaceAll("_", " ")
    .toUpperCase();
}


export function getCapitalStatusLabel(
  status: InvestorCapitalStatus
) {
  return status
    .replaceAll("_", " ")
    .toUpperCase();
}


export function calculateOnboardingSummary(
  records: InvestorOnboarding[]
) {
  return {
    total: records.length,

    invited: records.filter(
      (item) =>
        item.status === "INVITED"
    ).length,

    inProgress: records.filter(
      (item) =>
        ![
          "INVITED",
          "ACTIVE",
          "REJECTED",
        ].includes(item.status)
    ).length,

    ready: records.filter(
      (item) =>
        item.status === "READY"
    ).length,

    active: records.filter(
      (item) =>
        item.status === "ACTIVE"
    ).length,

    onHold: records.filter(
      (item) =>
        item.status === "ON_HOLD"
    ).length,

    kycVerified: records.filter(
      (item) =>
        item.kycStatus === "VERIFIED"
    ).length,

    agreementsSigned: records.filter(
      (item) =>
        item.agreementStatus === "SIGNED"
    ).length,
  };
}