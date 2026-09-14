export type CreatorStatus =
  | "DRAFT"
  | "PUBLIC"
  | "VERIFIED"
  | "SUSPENDED";

export type CreatorContentType =
  | "POST"
  | "SHORT"
  | "VIDEO"
  | "JOURNAL"
  | "STRATEGY";

export type CreatorContentCategory =
  | "TRADING"
  | "EDUCATION"
  | "COMMENTARY"
  | "JOURNAL"
  | "ENTERTAINMENT"
  | "MARKET"
  | "STRATEGY"
  | "OTHER";

export type CreatorVisibility =
  | "PUBLIC"
  | "FOLLOWERS"
  | "SUBSCRIBERS"
  | "PRIVATE";

export type CreatorContentStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED"
  | "REMOVED";

export type CreatorProfile = {
  id: string;

  userId: string;

  traderProfileId?: string;

  username: string;
  displayName: string;

  bio: string;

  avatarUrl?: string;
  bannerUrl?: string;

  website?: string;

  location?: string;

  status: CreatorStatus;

  verified: boolean;

  followerCount: number;
  subscriberCount: number;

  postCount: number;
  videoCount: number;
  shortCount: number;

  totalViews: number;

  publicChannelCount: number;

  featured: boolean;

  createdAt?: any;
  updatedAt?: any;
};

export type CreatorProfileUpdate = Partial<
  Omit<
    CreatorProfile,
    | "id"
    | "userId"
    | "createdAt"
    | "updatedAt"
  >
>;

export type CreatorChannel = {
  id: string;

  userId: string;

  creatorId: string;

  name: string;

  slug: string;

  description: string;

  category: CreatorContentCategory;

  avatarUrl?: string;
  bannerUrl?: string;

  public: boolean;
  active: boolean;

  followerCount: number;
  subscriberCount: number;

  postCount: number;
  videoCount: number;

  createdAt?: any;
  updatedAt?: any;
};

export type CreatorPost = {
  id: string;

  userId: string;

  creatorId: string;

  channelId?: string;

  username: string;
  creatorName: string;

  title: string;

  excerpt: string;

  body: string;

  type: CreatorContentType;

  category: CreatorContentCategory;

  visibility: CreatorVisibility;

  status: CreatorContentStatus;

  thumbnailUrl?: string;

  mediaUrl?: string;

  durationSeconds?: number;

  tags: string[];

  instrument?: string;

  strategyName?: string;

  likesCount: number;
  commentsCount: number;
  savesCount: number;
  viewsCount: number;

  publishedAt?: any;

  createdAt?: any;
  updatedAt?: any;
};

export type CreatorPostInput = {
  title: string;

  excerpt: string;

  body: string;

  type: CreatorContentType;

  category: CreatorContentCategory;

  visibility: CreatorVisibility;

  channelId?: string;

  thumbnailUrl?: string;

  mediaUrl?: string;

  durationSeconds?: number;

  tags?: string[];

  instrument?: string;

  strategyName?: string;
};

export type CreatorLike = {
  id: string;

  userId: string;
  postId: string;

  createdAt?: any;
};

export type CreatorSave = {
  id: string;

  userId: string;
  postId: string;

  createdAt?: any;
};

export type CreatorComment = {
  id: string;

  userId: string;
  postId: string;

  username: string;
  displayName: string;

  body: string;

  likesCount: number;

  createdAt?: any;
  updatedAt?: any;
};

export type CreatorAnalytics = {
  creatorId: string;

  totalPosts: number;
  totalVideos: number;
  totalShorts: number;

  totalViews: number;

  totalLikes: number;
  totalComments: number;
  totalSaves: number;

  averageViews: number;
  averageEngagement: number;

  followerCount: number;
  subscriberCount: number;
};

export type CreatorSummary = {
  creatorCount: number;

  publicCreators: number;
  verifiedCreators: number;

  totalPosts: number;
  totalVideos: number;
  totalShorts: number;

  totalViews: number;
  totalFollowers: number;
  totalSubscribers: number;
};