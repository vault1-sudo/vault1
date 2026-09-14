export type InvestorOnboardingStatus =
  | "INVITED"
  | "ACCOUNT_CREATED"
  | "PROFILE_PENDING"
  | "KYC_PENDING"
  | "RISK_PROFILE_PENDING"
  | "DOCUMENTS_PENDING"
  | "AGREEMENT_PENDING"
  | "STRATEGY_PENDING"
  | "CAPITAL_PENDING"
  | "READY"
  | "ACTIVE"
  | "ON_HOLD"
  | "REJECTED";

export type InvestorKycStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED";

export type InvestorRiskLevel =
  | "NOT_ASSESSED"
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "VERY_HIGH";

export type InvestorAgreementStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "SENT"
  | "SIGNED"
  | "REJECTED";

export type InvestorCapitalStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "RECEIVED"
  | "CONFIRMED";

export type InvestorOnboarding = {
  id: string;
  userId: string;

  investorId: string;
  investorCode: string;

  investorName: string;
  investorEmail: string;

  status: InvestorOnboardingStatus;

  profileComplete: boolean;

  kycStatus: InvestorKycStatus;

  riskLevel: InvestorRiskLevel;
  riskProfileComplete: boolean;

  documentsComplete: boolean;

  agreementStatus: InvestorAgreementStatus;

  strategyAssigned: boolean;
  strategyName?: string;

  capitalStatus: InvestorCapitalStatus;
  committedCapital: number;

  invitationSentAt?: any;
  accountCreatedAt?: any;
  profileCompletedAt?: any;
  kycCompletedAt?: any;
  riskProfileCompletedAt?: any;
  documentsCompletedAt?: any;
  agreementCompletedAt?: any;
  strategyAssignedAt?: any;
  capitalConfirmedAt?: any;
  activatedAt?: any;

  notes?: string;

  createdAt?: any;
  updatedAt?: any;
};

export type InvestorOnboardingUpdate =
  Partial<
    Omit<
      InvestorOnboarding,
      "id" |
      "userId" |
      "investorId" |
      "createdAt" |
      "updatedAt"
    >
  >;