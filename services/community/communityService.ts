import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  CommunityFollow,
  CommunitySubscription,
  CommunitySummary,
  TraderChannel,
  TraderProfile,
  TraderProfileUpdate,
} from "../../types/community";

const PROFILE_COLLECTION = "traderProfiles";
const CHANNEL_COLLECTION = "traderChannels";
const FOLLOW_COLLECTION = "communityFollows";
const SUBSCRIPTION_COLLECTION = "communitySubscriptions";

function normalizeUsername(username: string) {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

function validateUsername(username: string) {
  if (!username) {
    throw new Error("Username is required.");
  }

  if (username.length < 3) {
    throw new Error(
      "Username must contain at least 3 characters."
    );
  }

  if (username.length > 30) {
    throw new Error(
      "Username cannot exceed 30 characters."
    );
  }
}

export async function createTraderProfile({
  userId,
  username,
  displayName,
  bio = "",
  primaryMarkets = [],
  specialties = [],
  contentCategory = "TRADING",
}: {
  userId: string;
  username: string;
  displayName: string;
  bio?: string;
  primaryMarkets?: string[];
  specialties?: string[];
  contentCategory?: TraderProfile["contentCategory"];
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!displayName.trim()) {
    throw new Error("Display name is required.");
  }

  const normalizedUsername =
    normalizeUsername(username);

  validateUsername(normalizedUsername);

  const usernameQuery = query(
    collection(db, PROFILE_COLLECTION),
    where("username", "==", normalizedUsername)
  );

  const usernameSnapshot =
    await getDocs(usernameQuery);

  if (!usernameSnapshot.empty) {
    throw new Error(
      "That username is already taken."
    );
  }

  const profileData = {
    userId,

    username: normalizedUsername,
    displayName: displayName.trim(),
    bio: bio.trim(),

    primaryMarkets,
    specialties,

    contentCategory,

    status: "PUBLIC",
    visibility: "PUBLIC",

    verified: false,

    followerCount: 0,
    subscriberCount: 0,
    viewCount: 0,

    liveNow: false,

    publicChannelEnabled: true,
    subscriptionsEnabled: true,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const profileRef = await addDoc(
    collection(db, PROFILE_COLLECTION),
    profileData
  );

  return profileRef.id;
}

export async function getTraderProfile(
  profileId: string
): Promise<TraderProfile | null> {
  if (!profileId) {
    throw new Error("Profile ID is required.");
  }

  const profileRef = doc(
    db,
    PROFILE_COLLECTION,
    profileId
  );

  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as TraderProfile;
}

export async function getTraderProfileByUsername(
  username: string
): Promise<TraderProfile | null> {
  const normalizedUsername =
    normalizeUsername(username);

  if (!normalizedUsername) {
    return null;
  }

  const profileQuery = query(
    collection(db, PROFILE_COLLECTION),
    where(
      "username",
      "==",
      normalizedUsername
    )
  );

  const snapshot =
    await getDocs(profileQuery);

  if (snapshot.empty) {
    return null;
  }

  const profile = snapshot.docs[0];

  return {
    id: profile.id,
    ...profile.data(),
  } as TraderProfile;
}

export async function getUserTraderProfile(
  userId: string
): Promise<TraderProfile | null> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  const profileQuery = query(
    collection(db, PROFILE_COLLECTION),
    where("userId", "==", userId)
  );

  const snapshot =
    await getDocs(profileQuery);

  if (snapshot.empty) {
    return null;
  }

  const profile = snapshot.docs[0];

  return {
    id: profile.id,
    ...profile.data(),
  } as TraderProfile;
}

export async function getPublicTraderProfiles(): Promise<
  TraderProfile[]
> {
  const profileQuery = query(
    collection(db, PROFILE_COLLECTION),
    where("status", "==", "PUBLIC")
  );

  const snapshot =
    await getDocs(profileQuery);

  return snapshot.docs
    .map((profile) => ({
      id: profile.id,
      ...profile.data(),
    }) as TraderProfile)
    .sort(
      (a, b) =>
        (b.followerCount || 0) -
        (a.followerCount || 0)
    );
}

export async function updateTraderProfile(
  profileId: string,
  updates: TraderProfileUpdate
) {
  if (!profileId) {
    throw new Error("Profile ID is required.");
  }

  if (
    updates.username !== undefined
  ) {
    const normalizedUsername =
      normalizeUsername(updates.username);

    validateUsername(normalizedUsername);

    const current =
      await getTraderProfile(profileId);

    if (!current) {
      throw new Error("Trader profile not found.");
    }

    if (
      normalizedUsername !==
      current.username
    ) {
      const usernameQuery = query(
        collection(db, PROFILE_COLLECTION),
        where(
          "username",
          "==",
          normalizedUsername
        )
      );

      const snapshot =
        await getDocs(usernameQuery);

      const duplicate =
        snapshot.docs.find(
          (item) => item.id !== profileId
        );

      if (duplicate) {
        throw new Error(
          "That username is already taken."
        );
      }
    }

    updates = {
      ...updates,
      username: normalizedUsername,
    };
  }

  await updateDoc(
    doc(
      db,
      PROFILE_COLLECTION,
      profileId
    ),
    {
      ...updates,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function setTraderLiveStatus({
  profileId,
  liveNow,
  roomId,
}: {
  profileId: string;
  liveNow: boolean;
  roomId?: string;
}) {
  if (!profileId) {
    throw new Error("Profile ID is required.");
  }

  await updateDoc(
    doc(
      db,
      PROFILE_COLLECTION,
      profileId
    ),
    {
      liveNow,
      ...(liveNow && roomId
        ? { currentRoomId: roomId }
        : { currentRoomId: null }),
      updatedAt: serverTimestamp(),
    }
  );
}

export async function incrementTraderViews(
  profileId: string
) {
  if (!profileId) {
    return;
  }

  const profile =
    await getTraderProfile(profileId);

  if (!profile) {
    return;
  }

  await updateDoc(
    doc(
      db,
      PROFILE_COLLECTION,
      profileId
    ),
    {
      viewCount:
        (profile.viewCount || 0) + 1,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function createTraderChannel({
  userId,
  traderProfileId,
  username,
  name,
  description = "",
  category = "TRADING",
}: {
  userId: string;
  traderProfileId: string;
  username: string;
  name: string;
  description?: string;
  category?: TraderChannel["category"];
}) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!traderProfileId) {
    throw new Error(
      "Trader profile ID is required."
    );
  }

  if (!name.trim()) {
    throw new Error(
      "Channel name is required."
    );
  }

  const channelData = {
    userId,
    traderProfileId,

    username:
      normalizeUsername(username),

    name: name.trim(),
    description:
      description.trim(),

    category,

    public: true,
    active: true,

    followerCount: 0,
    subscriberCount: 0,
    postCount: 0,
    videoCount: 0,
    liveRoomCount: 0,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const channelRef =
    await addDoc(
      collection(
        db,
        CHANNEL_COLLECTION
      ),
      channelData
    );

  return channelRef.id;
}

export async function getTraderChannels(
  traderProfileId: string
): Promise<TraderChannel[]> {
  const channelQuery = query(
    collection(
      db,
      CHANNEL_COLLECTION
    ),
    where(
      "traderProfileId",
      "==",
      traderProfileId
    )
  );

  const snapshot =
    await getDocs(channelQuery);

  return snapshot.docs.map(
    (channel) =>
      ({
        id: channel.id,
        ...channel.data(),
      }) as TraderChannel
  );
}

export async function followTrader({
  followerUserId,
  traderUserId,
  traderProfileId,
}: {
  followerUserId: string;
  traderUserId: string;
  traderProfileId: string;
}) {
  if (!followerUserId) {
    throw new Error(
      "Follower user ID is required."
    );
  }

  if (!traderUserId) {
    throw new Error(
      "Trader user ID is required."
    );
  }

  if (
    followerUserId === traderUserId
  ) {
    throw new Error(
      "You cannot follow yourself."
    );
  }

  const existingQuery = query(
    collection(
      db,
      FOLLOW_COLLECTION
    ),
    where(
      "followerUserId",
      "==",
      followerUserId
    ),
    where(
      "traderProfileId",
      "==",
      traderProfileId
    )
  );

  const existingSnapshot =
    await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    return existingSnapshot.docs[0].id;
  }

  const followData = {
    followerUserId,
    traderUserId,
    traderProfileId,
    createdAt: serverTimestamp(),
  };

  const followRef =
    await addDoc(
      collection(
        db,
        FOLLOW_COLLECTION
      ),
      followData
    );

  const profile =
    await getTraderProfile(
      traderProfileId
    );

  if (profile) {
    await updateDoc(
      doc(
        db,
        PROFILE_COLLECTION,
        traderProfileId
      ),
      {
        followerCount:
          (profile.followerCount || 0) +
          1,
        updatedAt: serverTimestamp(),
      }
    );
  }

  return followRef.id;
}

export async function unfollowTrader({
  followerUserId,
  traderProfileId,
}: {
  followerUserId: string;
  traderProfileId: string;
}) {
  const followQuery = query(
    collection(
      db,
      FOLLOW_COLLECTION
    ),
    where(
      "followerUserId",
      "==",
      followerUserId
    ),
    where(
      "traderProfileId",
      "==",
      traderProfileId
    )
  );

  const snapshot =
    await getDocs(followQuery);

  if (snapshot.empty) {
    return;
  }

  await Promise.all(
    snapshot.docs.map((item) =>
      deleteDoc(item.ref)
    )
  );

  const profile =
    await getTraderProfile(
      traderProfileId
    );

  if (profile) {
    await updateDoc(
      doc(
        db,
        PROFILE_COLLECTION,
        traderProfileId
      ),
      {
        followerCount: Math.max(
          0,
          (profile.followerCount || 0) - 1
        ),
        updatedAt: serverTimestamp(),
      }
    );
  }
}

export async function isFollowingTrader({
  followerUserId,
  traderProfileId,
}: {
  followerUserId: string;
  traderProfileId: string;
}) {
  if (!followerUserId) {
    return false;
  }

  const followQuery = query(
    collection(
      db,
      FOLLOW_COLLECTION
    ),
    where(
      "followerUserId",
      "==",
      followerUserId
    ),
    where(
      "traderProfileId",
      "==",
      traderProfileId
    )
  );

  const snapshot =
    await getDocs(followQuery);

  return !snapshot.empty;
}

export async function subscribeToTrader({
  subscriberUserId,
  traderUserId,
  traderProfileId,
}: {
  subscriberUserId: string;
  traderUserId: string;
  traderProfileId: string;
}) {
  if (!subscriberUserId) {
    throw new Error(
      "Subscriber user ID is required."
    );
  }

  if (
    subscriberUserId === traderUserId
  ) {
    throw new Error(
      "You cannot subscribe to yourself."
    );
  }

  const existingQuery = query(
    collection(
      db,
      SUBSCRIPTION_COLLECTION
    ),
    where(
      "subscriberUserId",
      "==",
      subscriberUserId
    ),
    where(
      "traderProfileId",
      "==",
      traderProfileId
    )
  );

  const existingSnapshot =
    await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    const existing =
      existingSnapshot.docs[0];

    await updateDoc(existing.ref, {
      status: "ACTIVE",
      cancelledAt: null,
    });

    return existing.id;
  }

  const subscriptionData = {
    subscriberUserId,
    traderUserId,
    traderProfileId,
    status: "ACTIVE",
    createdAt: serverTimestamp(),
  };

  const subscriptionRef =
    await addDoc(
      collection(
        db,
        SUBSCRIPTION_COLLECTION
      ),
      subscriptionData
    );

  const profile =
    await getTraderProfile(
      traderProfileId
    );

  if (profile) {
    await updateDoc(
      doc(
        db,
        PROFILE_COLLECTION,
        traderProfileId
      ),
      {
        subscriberCount:
          (profile.subscriberCount || 0) +
          1,
        updatedAt: serverTimestamp(),
      }
    );
  }

  return subscriptionRef.id;
}

export async function cancelTraderSubscription({
  subscriberUserId,
  traderProfileId,
}: {
  subscriberUserId: string;
  traderProfileId: string;
}) {
  const subscriptionQuery =
    query(
      collection(
        db,
        SUBSCRIPTION_COLLECTION
      ),
      where(
        "subscriberUserId",
        "==",
        subscriberUserId
      ),
      where(
        "traderProfileId",
        "==",
        traderProfileId
      ),
      where(
        "status",
        "==",
        "ACTIVE"
      )
    );

  const snapshot =
    await getDocs(subscriptionQuery);

  if (snapshot.empty) {
    return;
  }

  await Promise.all(
    snapshot.docs.map((item) =>
      updateDoc(item.ref, {
        status: "CANCELLED",
        cancelledAt:
          serverTimestamp(),
      })
    )
  );

  const profile =
    await getTraderProfile(
      traderProfileId
    );

  if (profile) {
    await updateDoc(
      doc(
        db,
        PROFILE_COLLECTION,
        traderProfileId
      ),
      {
        subscriberCount:
          Math.max(
            0,
            (profile.subscriberCount || 0) -
              snapshot.size
          ),
        updatedAt:
          serverTimestamp(),
      }
    );
  }
}

export async function isSubscribedToTrader({
  subscriberUserId,
  traderProfileId,
}: {
  subscriberUserId: string;
  traderProfileId: string;
}) {
  if (!subscriberUserId) {
    return false;
  }

  const subscriptionQuery =
    query(
      collection(
        db,
        SUBSCRIPTION_COLLECTION
      ),
      where(
        "subscriberUserId",
        "==",
        subscriberUserId
      ),
      where(
        "traderProfileId",
        "==",
        traderProfileId
      ),
      where(
        "status",
        "==",
        "ACTIVE"
      )
    );

  const snapshot =
    await getDocs(subscriptionQuery);

  return !snapshot.empty;
}

export async function getCommunitySummary(
  userId: string
): Promise<CommunitySummary> {
  const profiles =
    await getPublicTraderProfiles();

  const ownProfiles =
    profiles.filter(
      (profile) =>
        profile.userId === userId
    );

  return {
    profileCount: ownProfiles.length,
    publicProfiles: profiles.length,
    verifiedProfiles:
      profiles.filter(
        (profile) =>
          profile.verified
      ).length,
    liveTraders:
      profiles.filter(
        (profile) =>
          profile.liveNow
      ).length,
    totalFollowers:
      profiles.reduce(
        (sum, profile) =>
          sum +
          (profile.followerCount || 0),
        0
      ),
    totalSubscribers:
      profiles.reduce(
        (sum, profile) =>
          sum +
          (profile.subscriberCount || 0),
        0
      ),
  };
}

export function getContentCategoryLabel(
  category: TraderProfile["contentCategory"]
) {
  switch (category) {
    case "TRADING":
      return "Trading";

    case "EDUCATION":
      return "Education";

    case "COMMENTARY":
      return "Commentary";

    case "ENTERTAINMENT":
      return "Entertainment";

    case "JOURNAL":
      return "Trading Journal";

    default:
      return "Other";
  }
}