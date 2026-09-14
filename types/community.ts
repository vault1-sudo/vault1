export type TraderProfileStatus =
  | "DRAFT"
  | "PUBLIC"
  | "SUSPENDED"
  | "VERIFIED";

export type TraderVisibility =
  | "PUBLIC"
  | "PRIVATE";

export type TraderContentCategory =
  | "TRADING"
  | "EDUCATION"
  | "COMMENTARY"
  | "ENTERTAINMENT"
  | "JOURNAL"
  | "OTHER";

export type TraderProfile = {
  id: string;
  userId: string;

  username: string;
  displayName: string;
  bio: string;

  avatarUrl?: string;
  bannerUrl?: string;

  location?: string;
  website?: string;

  primaryMarkets: string[];
  specialties: string[];

  contentCategory: TraderContentCategory;

  status: TraderProfileStatus;
  visibility: TraderVisibility;

  verified: boolean;

  followerCount: number;
  subscriberCount: number;
  viewCount: number;

  liveNow: boolean;
  currentRoomId?: string;

  publicChannelEnabled: boolean;
  subscriptionsEnabled: boolean;

  createdAt?: any;
  updatedAt?: any;
};

export type TraderProfileUpdate = Partial<
  Omit<
    TraderProfile,
    "id" |
    "userId" |
    "createdAt" |
    "updatedAt"
  >
>;

export type TraderChannel = {
  id: string;
  userId: string;
  traderProfileId: string;

  username: string;
  name: string;
  description: string;

  category: TraderContentCategory;

  avatarUrl?: string;
  bannerUrl?: string;

  public: boolean;
  active: boolean;

  followerCount: number;
  subscriberCount: number;
  postCount: number;
  videoCount: number;
  liveRoomCount: number;

  createdAt?: any;
  updatedAt?: any;
};

export type CommunityFollow = {
  id: string;
  followerUserId: string;
  traderUserId: string;
  traderProfileId: string;

  createdAt?: any;
};

export type CommunitySubscription = {
  id: string;
  subscriberUserId: string;
  traderUserId: string;
  traderProfileId: string;

  status: "ACTIVE" | "CANCELLED";

  createdAt?: any;
  cancelledAt?: any;
};

export type CommunitySummary = {
  profileCount: number;
  publicProfiles: number;
  verifiedProfiles: number;
  liveTraders: number;
  totalFollowers: number;
  totalSubscribers: number;
};