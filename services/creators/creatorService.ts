import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  CreatorAnalytics,
  CreatorChannel,
  CreatorContentCategory,
  CreatorContentStatus,
  CreatorContentType,
  CreatorPost,
  CreatorPostInput,
  CreatorProfile,
  CreatorProfileUpdate,
  CreatorStatus,
  CreatorSummary,
} from "../../types/creator";

const creatorsCollection = collection(
  db,
  "creatorProfiles"
);

const channelsCollection = collection(
  db,
  "creatorChannels"
);

const postsCollection = collection(
  db,
  "creatorPosts"
);

const likesCollection = collection(
  db,
  "creatorLikes"
);

const savesCollection = collection(
  db,
  "creatorSaves"
);

const commentsCollection = collection(
  db,
  "creatorComments"
);

/* -------------------------------------------------------------------------- */
/* NORMALIZERS                                                                */
/* -------------------------------------------------------------------------- */

function normalizeCreator(
  id: string,
  data: Record<string, any>
): CreatorProfile {
  return {
    id,

    userId:
      data.userId ?? "",

    traderProfileId:
      data.traderProfileId,

    username:
      data.username ?? "",

    displayName:
      data.displayName ??
      "Vault1 Creator",

    bio:
      data.bio ?? "",

    avatarUrl:
      data.avatarUrl,

    bannerUrl:
      data.bannerUrl,

    website:
      data.website,

    location:
      data.location,

    status:
      data.status ??
      "DRAFT",

    verified:
      data.verified ??
      false,

    followerCount:
      Number(
        data.followerCount ?? 0
      ),

    subscriberCount:
      Number(
        data.subscriberCount ?? 0
      ),

    postCount:
      Number(
        data.postCount ?? 0
      ),

    videoCount:
      Number(
        data.videoCount ?? 0
      ),

    shortCount:
      Number(
        data.shortCount ?? 0
      ),

    totalViews:
      Number(
        data.totalViews ?? 0
      ),

    publicChannelCount:
      Number(
        data.publicChannelCount ?? 0
      ),

    featured:
      data.featured ??
      false,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizeChannel(
  id: string,
  data: Record<string, any>
): CreatorChannel {
  return {
    id,

    userId:
      data.userId ?? "",

    creatorId:
      data.creatorId ?? "",

    name:
      data.name ?? "",

    slug:
      data.slug ?? "",

    description:
      data.description ?? "",

    category:
      data.category ??
      "OTHER",

    avatarUrl:
      data.avatarUrl,

    bannerUrl:
      data.bannerUrl,

    public:
      data.public ??
      false,

    active:
      data.active ??
      true,

    followerCount:
      Number(
        data.followerCount ?? 0
      ),

    subscriberCount:
      Number(
        data.subscriberCount ?? 0
      ),

    postCount:
      Number(
        data.postCount ?? 0
      ),

    videoCount:
      Number(
        data.videoCount ?? 0
      ),

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizePost(
  id: string,
  data: Record<string, any>
): CreatorPost {
  return {
    id,

    userId:
      data.userId ?? "",

    creatorId:
      data.creatorId ?? "",

    channelId:
      data.channelId,

    username:
      data.username ?? "",

    creatorName:
      data.creatorName ??
      "Vault1 Creator",

    title:
      data.title ?? "",

    excerpt:
      data.excerpt ?? "",

    body:
      data.body ?? "",

    type:
      data.type ??
      "POST",

    category:
      data.category ??
      "OTHER",

    visibility:
      data.visibility ??
      "PUBLIC",

    status:
      data.status ??
      "DRAFT",

    thumbnailUrl:
      data.thumbnailUrl,

    mediaUrl:
      data.mediaUrl,

    durationSeconds:
      data.durationSeconds,

    tags:
      Array.isArray(
        data.tags
      )
        ? data.tags
        : [],

    instrument:
      data.instrument,

    strategyName:
      data.strategyName,

    likesCount:
      Number(
        data.likesCount ?? 0
      ),

    commentsCount:
      Number(
        data.commentsCount ?? 0
      ),

    savesCount:
      Number(
        data.savesCount ?? 0
      ),

    viewsCount:
      Number(
        data.viewsCount ?? 0
      ),

    publishedAt:
      data.publishedAt,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* CREATOR PROFILE                                                            */
/* -------------------------------------------------------------------------- */

export async function createCreatorProfile(
  userId: string,
  data: {
    username: string;
    displayName: string;
    bio?: string;
    traderProfileId?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    website?: string;
    location?: string;
  }
) {
  if (!userId) {
    throw new Error(
      "Authentication is required."
    );
  }

  if (!data.username.trim()) {
    throw new Error(
      "Username is required."
    );
  }

  if (!data.displayName.trim()) {
    throw new Error(
      "Display name is required."
    );
  }

  const existingQuery =
    query(
      creatorsCollection,
      where(
        "username",
        "==",
        data.username
          .trim()
          .toLowerCase(),
      ),
      limit(1)
    );

  const existing =
    await getDocs(
      existingQuery
    );

  if (!existing.empty) {
    throw new Error(
      "That creator username is already in use."
    );
  }

  const creatorData = {
    userId,

    traderProfileId:
      data.traderProfileId ??
      null,

    username:
      data.username
        .trim()
        .toLowerCase(),

    displayName:
      data.displayName
        .trim(),

    bio:
      data.bio ??
      "",

    avatarUrl:
      data.avatarUrl ??
      null,

    bannerUrl:
      data.bannerUrl ??
      null,

    website:
      data.website ??
      null,

    location:
      data.location ??
      null,

    status:
      "DRAFT" as CreatorStatus,

    verified:
      false,

    followerCount:
      0,

    subscriberCount:
      0,

    postCount:
      0,

    videoCount:
      0,

    shortCount:
      0,

    totalViews:
      0,

    publicChannelCount:
      0,

    featured:
      false,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const reference =
    await addDoc(
      creatorsCollection,
      creatorData
    );

  return reference.id;
}

export async function getCreatorProfile(
  creatorId: string
): Promise<CreatorProfile | null> {
  const snapshot =
    await getDocs(
      query(
        creatorsCollection,
        where(
          "__name__",
          "==",
          creatorId
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    return null;
  }

  const item =
    snapshot.docs[0];

  return normalizeCreator(
    item.id,
    item.data()
  );
}

export async function getCreatorByUsername(
  username: string
): Promise<CreatorProfile | null> {
  const snapshot =
    await getDocs(
      query(
        creatorsCollection,
        where(
          "username",
          "==",
          username
            .trim()
            .toLowerCase()
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    return null;
  }

  const item =
    snapshot.docs[0];

  return normalizeCreator(
    item.id,
    item.data()
  );
}

export async function getUserCreatorProfile(
  userId: string
): Promise<CreatorProfile | null> {
  const snapshot =
    await getDocs(
      query(
        creatorsCollection,
        where(
          "userId",
          "==",
          userId
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    return null;
  }

  const item =
    snapshot.docs[0];

  return normalizeCreator(
    item.id,
    item.data()
  );
}

export async function getPublicCreators(): Promise<
  CreatorProfile[]
> {
  const snapshot =
    await getDocs(
      query(
        creatorsCollection,
        where(
          "status",
          "==",
          "PUBLIC"
        ),
        limit(500)
      )
    );

  return snapshot.docs
    .map((item) =>
      normalizeCreator(
        item.id,
        item.data()
      )
    )
    .filter(
      (creator) =>
        creator.status ===
          "PUBLIC" ||
        creator.status ===
          "VERIFIED"
    )
    .sort(
      (a, b) =>
        b.totalViews -
        a.totalViews
    );
}

export async function getFeaturedCreators(): Promise<
  CreatorProfile[]
> {
  const creators =
    await getPublicCreators();

  return creators
    .filter(
      (creator) =>
        creator.featured
    )
    .slice(0, 20);
}

export async function updateCreatorProfile(
  creatorId: string,
  userId: string,
  update: CreatorProfileUpdate
) {
  const creator =
    await getUserCreatorProfile(
      userId
    );

  if (
    !creator ||
    creator.id !== creatorId
  ) {
    throw new Error(
      "Creator profile not found."
    );
  }

  await updateDoc(
    doc(
      db,
      "creatorProfiles",
      creatorId
    ),
    {
      ...update,
      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function publishCreatorProfile(
  creatorId: string,
  userId: string
) {
  const creator =
    await getUserCreatorProfile(
      userId
    );

  if (
    !creator ||
    creator.id !== creatorId
  ) {
    throw new Error(
      "Creator profile not found."
    );
  }

  await updateDoc(
    doc(
      db,
      "creatorProfiles",
      creatorId
    ),
    {
      status:
        "PUBLIC",
      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function hideCreatorProfile(
  creatorId: string,
  userId: string
) {
  const creator =
    await getUserCreatorProfile(
      userId
    );

  if (
    !creator ||
    creator.id !== creatorId
  ) {
    throw new Error(
      "Creator profile not found."
    );
  }

  await updateDoc(
    doc(
      db,
      "creatorProfiles",
      creatorId
    ),
    {
      status:
        "DRAFT",
      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* CHANNELS                                                                   */
/* -------------------------------------------------------------------------- */

export async function createCreatorChannel(
  userId: string,
  creatorId: string,
  data: {
    name: string;
    slug: string;
    description?: string;
    category: CreatorContentCategory;
    avatarUrl?: string;
    bannerUrl?: string;
    public?: boolean;
  }
) {
  if (!data.name.trim()) {
    throw new Error(
      "Channel name is required."
    );
  }

  const channelData = {
    userId,

    creatorId,

    name:
      data.name.trim(),

    slug:
      data.slug
        .trim()
        .toLowerCase(),

    description:
      data.description ??
      "",

    category:
      data.category,

    avatarUrl:
      data.avatarUrl ??
      null,

    bannerUrl:
      data.bannerUrl ??
      null,

    public:
      data.public ??
      true,

    active:
      true,

    followerCount:
      0,

    subscriberCount:
      0,

    postCount:
      0,

    videoCount:
      0,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const reference =
    await addDoc(
      channelsCollection,
      channelData
    );

  return reference.id;
}

export async function getCreatorChannels(
  creatorId: string
): Promise<CreatorChannel[]> {
  const snapshot =
    await getDocs(
      query(
        channelsCollection,
        where(
          "creatorId",
          "==",
          creatorId
        ),
        limit(100)
      )
    );

  return snapshot.docs
    .map((item) =>
      normalizeChannel(
        item.id,
        item.data()
      )
    )
    .sort(
      (a, b) =>
        Number(b.active) -
        Number(a.active)
    );
}

export async function getPublicCreatorChannels(
  creatorId: string
): Promise<CreatorChannel[]> {
  const channels =
    await getCreatorChannels(
      creatorId
    );

  return channels.filter(
    (channel) =>
      channel.public &&
      channel.active
  );
}

/* -------------------------------------------------------------------------- */
/* POSTS                                                                      */
/* -------------------------------------------------------------------------- */

export async function createCreatorPost(
  userId: string,
  creator: CreatorProfile,
  input: CreatorPostInput
) {
  if (!input.title.trim()) {
    throw new Error(
      "Content title is required."
    );
  }

  if (!input.body.trim()) {
    throw new Error(
      "Content body is required."
    );
  }

  const postData = {
    userId,

    creatorId:
      creator.id,

    channelId:
      input.channelId ??
      null,

    username:
      creator.username,

    creatorName:
      creator.displayName,

    title:
      input.title.trim(),

    excerpt:
      input.excerpt?.trim() ??
      "",

    body:
      input.body,

    type:
      input.type,

    category:
      input.category,

    visibility:
      input.visibility,

    status:
      "DRAFT" as CreatorContentStatus,

    thumbnailUrl:
      input.thumbnailUrl ??
      null,

    mediaUrl:
      input.mediaUrl ??
      null,

    durationSeconds:
      input.durationSeconds ??
      null,

    tags:
      input.tags ??
      [],

    instrument:
      input.instrument ??
      null,

    strategyName:
      input.strategyName ??
      null,

    likesCount:
      0,

    commentsCount:
      0,

    savesCount:
      0,

    viewsCount:
      0,

    publishedAt:
      null,

    createdAt:
      serverTimestamp(),

    updatedAt:
      serverTimestamp(),
  };

  const reference =
    await addDoc(
      postsCollection,
      postData
    );

  return reference.id;
}

export async function publishCreatorPost(
  postId: string,
  userId: string
) {
  const snapshot =
    await getDocs(
      query(
        postsCollection,
        where(
          "__name__",
          "==",
          postId
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    throw new Error(
      "Content not found."
    );
  }

  const post =
    snapshot.docs[0].data();

  if (
    post.userId !==
    userId
  ) {
    throw new Error(
      "You do not own this content."
    );
  }

  await updateDoc(
    doc(
      db,
      "creatorPosts",
      postId
    ),
    {
      status:
        "PUBLISHED",

      publishedAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function archiveCreatorPost(
  postId: string,
  userId: string
) {
  const snapshot =
    await getDocs(
      query(
        postsCollection,
        where(
          "__name__",
          "==",
          postId
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    throw new Error(
      "Content not found."
    );
  }

  const post =
    snapshot.docs[0].data();

  if (
    post.userId !==
    userId
  ) {
    throw new Error(
      "You do not own this content."
    );
  }

  await updateDoc(
    doc(
      db,
      "creatorPosts",
      postId
    ),
    {
      status:
        "ARCHIVED",

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function getCreatorPosts(
  creatorId: string
): Promise<CreatorPost[]> {
  const snapshot =
    await getDocs(
      query(
        postsCollection,
        where(
          "creatorId",
          "==",
          creatorId
        ),
        limit(500)
      )
    );

  return snapshot.docs
    .map((item) =>
      normalizePost(
        item.id,
        item.data()
      )
    )
    .sort(
      (a, b) =>
        getTimestamp(
          b.publishedAt ??
            b.createdAt
        ) -
        getTimestamp(
          a.publishedAt ??
            a.createdAt
        )
    );
}

export async function getPublicCreatorPosts(): Promise<
  CreatorPost[]
> {
  const snapshot =
    await getDocs(
      query(
        postsCollection,
        where(
          "status",
          "==",
          "PUBLISHED"
        ),
        limit(500)
      )
    );

  return snapshot.docs
    .map((item) =>
      normalizePost(
        item.id,
        item.data()
      )
    )
    .filter(
      (post) =>
        post.status ===
          "PUBLISHED" &&
        post.visibility ===
          "PUBLIC"
    )
    .sort(
      (a, b) =>
        getTimestamp(
          b.publishedAt ??
            b.createdAt
        ) -
        getTimestamp(
          a.publishedAt ??
            a.createdAt
        )
    );
}

export async function getCreatorContentByType(
  type: CreatorContentType
): Promise<CreatorPost[]> {
  const posts =
    await getPublicCreatorPosts();

  return posts.filter(
    (post) =>
      post.type ===
      type
  );
}

export async function getCreatorContentByCategory(
  category: CreatorContentCategory
): Promise<CreatorPost[]> {
  const posts =
    await getPublicCreatorPosts();

  return posts.filter(
    (post) =>
      post.category ===
      category
  );
}

/* -------------------------------------------------------------------------- */
/* ENGAGEMENT                                                                 */
/* -------------------------------------------------------------------------- */

export async function likeCreatorPost(
  userId: string,
  postId: string
) {
  const existing =
    await getDocs(
      query(
        likesCollection,
        where(
          "userId",
          "==",
          userId
        ),
        limit(500)
      )
    );

  const alreadyLiked =
    existing.docs.some(
      (item) =>
        item.data().postId ===
        postId
    );

  if (alreadyLiked) {
    return;
  }

  await addDoc(
    likesCollection,
    {
      userId,
      postId,
      createdAt:
        serverTimestamp(),
    }
  );
}

export async function unlikeCreatorPost(
  userId: string,
  postId: string
) {
  const existing =
    await getDocs(
      query(
        likesCollection,
        where(
          "userId",
          "==",
          userId
        ),
        limit(500)
      )
    );

  const match =
    existing.docs.find(
      (item) =>
        item.data().postId ===
        postId
    );

  if (!match) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      "creatorLikes",
      match.id
    )
  );
}

export async function saveCreatorPost(
  userId: string,
  postId: string
) {
  const existing =
    await getDocs(
      query(
        savesCollection,
        where(
          "userId",
          "==",
          userId
        ),
        limit(500)
      )
    );

  const alreadySaved =
    existing.docs.some(
      (item) =>
        item.data().postId ===
        postId
    );

  if (alreadySaved) {
    return;
  }

  await addDoc(
    savesCollection,
    {
      userId,
      postId,
      createdAt:
        serverTimestamp(),
    }
  );
}

export async function unsaveCreatorPost(
  userId: string,
  postId: string
) {
  const existing =
    await getDocs(
      query(
        savesCollection,
        where(
          "userId",
          "==",
          userId
        ),
        limit(500)
      )
    );

  const match =
    existing.docs.find(
      (item) =>
        item.data().postId ===
        postId
    );

  if (!match) {
    return;
  }

  await deleteDoc(
    doc(
      db,
      "creatorSaves",
      match.id
    )
  );
}

export async function addCreatorComment(
  userId: string,
  postId: string,
  username: string,
  displayName: string,
  body: string
) {
  if (!body.trim()) {
    throw new Error(
      "Comment cannot be empty."
    );
  }

  const reference =
    await addDoc(
      commentsCollection,
      {
        userId,
        postId,

        username,
        displayName,

        body:
          body.trim(),

        likesCount:
          0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      }
    );

  return reference.id;
}

export async function getCreatorComments(
  postId: string
) {
  const snapshot =
    await getDocs(
      query(
        commentsCollection,
        where(
          "postId",
          "==",
          postId
        ),
        limit(500)
      )
    );

  return snapshot.docs
    .map((item) => ({
      id: item.id,
      ...item.data(),
    }))
    .sort(
      (a: any, b: any) =>
        getTimestamp(
          b.createdAt
        ) -
        getTimestamp(
          a.createdAt
        )
    );
}

/* -------------------------------------------------------------------------- */
/* VIEWS                                                                      */
/* -------------------------------------------------------------------------- */

export async function recordCreatorPostView(
  postId: string
) {
  const snapshot =
    await getDocs(
      query(
        postsCollection,
        where(
          "__name__",
          "==",
          postId
        ),
        limit(1)
      )
    );

  if (snapshot.empty) {
    return;
  }

  const current =
    normalizePost(
      snapshot.docs[0].id,
      snapshot.docs[0].data()
    );

  await updateDoc(
    doc(
      db,
      "creatorPosts",
      postId
    ),
    {
      viewsCount:
        current.viewsCount +
        1,

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* ANALYTICS                                                                  */
/* -------------------------------------------------------------------------- */

export async function getCreatorAnalytics(
  creatorId: string
): Promise<CreatorAnalytics> {
  const creator =
    await getCreatorProfile(
      creatorId
    );

  const posts =
    await getCreatorPosts(
      creatorId
    );

  const totalViews =
    posts.reduce(
      (sum, post) =>
        sum +
        post.viewsCount,
      0
    );

  const totalLikes =
    posts.reduce(
      (sum, post) =>
        sum +
        post.likesCount,
      0
    );

  const totalComments =
    posts.reduce(
      (sum, post) =>
        sum +
        post.commentsCount,
      0
    );

  const totalSaves =
    posts.reduce(
      (sum, post) =>
        sum +
        post.savesCount,
      0
    );

  const totalEngagement =
    totalLikes +
    totalComments +
    totalSaves;

  return {
    creatorId,

    totalPosts:
      posts.length,

    totalVideos:
      posts.filter(
        (post) =>
          post.type ===
            "VIDEO" ||
          post.type ===
            "STRATEGY"
      ).length,

    totalShorts:
      posts.filter(
        (post) =>
          post.type ===
          "SHORT"
      ).length,

    totalViews,

    totalLikes,

    totalComments,

    totalSaves,

    averageViews:
      posts.length > 0
        ? totalViews /
          posts.length
        : 0,

    averageEngagement:
      posts.length > 0
        ? totalEngagement /
          posts.length
        : 0,

    followerCount:
      creator?.followerCount ??
      0,

    subscriberCount:
      creator?.subscriberCount ??
      0,
  };
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getCreatorSummary(): Promise<
  CreatorSummary
> {
  const creators =
    await getPublicCreators();

  const posts =
    await getPublicCreatorPosts();

  return {
    creatorCount:
      creators.length,

    publicCreators:
      creators.filter(
        (creator) =>
          creator.status ===
          "PUBLIC"
      ).length,

    verifiedCreators:
      creators.filter(
        (creator) =>
          creator.verified
      ).length,

    totalPosts:
      posts.filter(
        (post) =>
          post.type ===
          "POST"
      ).length,

    totalVideos:
      posts.filter(
        (post) =>
          post.type ===
          "VIDEO"
      ).length,

    totalShorts:
      posts.filter(
        (post) =>
          post.type ===
          "SHORT"
      ).length,

    totalViews:
      posts.reduce(
        (sum, post) =>
          sum +
          post.viewsCount,
        0
      ),

    totalFollowers:
      creators.reduce(
        (sum, creator) =>
          sum +
          creator.followerCount,
        0
      ),

    totalSubscribers:
      creators.reduce(
        (sum, creator) =>
          sum +
          creator.subscriberCount,
        0
      ),
  };
}

/* -------------------------------------------------------------------------- */
/* LABELS                                                                     */
/* -------------------------------------------------------------------------- */

export function creatorStatusLabel(
  status: CreatorStatus
) {
  switch (status) {
    case "PUBLIC":
      return "Public";

    case "VERIFIED":
      return "Verified";

    case "SUSPENDED":
      return "Suspended";

    case "DRAFT":
    default:
      return "Draft";
  }
}

export function creatorContentTypeLabel(
  type: CreatorContentType
) {
  switch (type) {
    case "SHORT":
      return "Short";

    case "VIDEO":
      return "Video";

    case "JOURNAL":
      return "Journal";

    case "STRATEGY":
      return "Strategy";

    case "POST":
    default:
      return "Post";
  }
}

export function creatorCategoryLabel(
  category: CreatorContentCategory
) {
  switch (category) {
    case "TRADING":
      return "Trading";

    case "EDUCATION":
      return "Education";

    case "COMMENTARY":
      return "Commentary";

    case "JOURNAL":
      return "Journal";

    case "ENTERTAINMENT":
      return "Entertainment";

    case "MARKET":
      return "Market";

    case "STRATEGY":
      return "Strategy";

    case "OTHER":
    default:
      return "Other";
  }
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function getTimestamp(
  value: any
): number {
  if (!value) {
    return 0;
  }

  if (
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
    "string"
  ) {
    return new Date(
      value
    ).getTime();
  }

  if (
    typeof value.seconds ===
    "number"
  ) {
    return (
      value.seconds *
      1000
    );
  }

  return 0;
}