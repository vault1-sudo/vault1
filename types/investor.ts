export type InvestorStatus =
  | "INVITED"
  | "ONBOARDING"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSED";

export type InvestorRiskProfile =
  | "CONSERVATIVE"
  | "MODERATE"
  | "BALANCED"
  | "AGGRESSIVE"
  | "NOT_SET";

export type InvestorKycStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED";

export type InvestorAgreementStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "SIGNED"
  | "EXPIRED";

export type InvestorAccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "SUSPENDED"
  | "CLOSED";

export type Investor = {
  id: string;
  userId: string;

  investorCode: string;

  fullName: string;
  email: string;
  phone: string;

  status: InvestorStatus;

  riskProfile: InvestorRiskProfile;

  kycStatus: InvestorKycStatus;

  agreementStatus: InvestorAgreementStatus;

  accountStatus: InvestorAccountStatus;

  contributedCapital: number;

  currentValue: number;

  realizedPnL: number;

  unrealizedPnL: number;

  totalPnL: number;

  returnPercent: number;

  availableCash: number;

  investedCapital: number;

  totalFees: number;

  payoutAmount: number;

  strategyName: string;

  onboardingProgress: number;

  notes?: string;

  createdAt?: any;
  updatedAt?: any;
};