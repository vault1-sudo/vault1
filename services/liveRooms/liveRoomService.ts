import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  LiveChatMessage,
  LiveParticipant,
  LiveParticipantRole,
  LiveRoom,
  LiveRoomVisibility,
} from "../../types/liveRoom";

const liveRoomsCollection = collection(
  db,
  "liveRooms"
);

const roomMessagesCollection = (
  roomId: string
) =>
  collection(
    db,
    "liveRooms",
    roomId,
    "messages"
  );

const roomParticipantsCollection = (
  roomId: string
) =>
  collection(
    db,
    "liveRooms",
    roomId,
    "participants"
  );

function normalizeRoom(
  id: string,
  data: Record<string, any>
): LiveRoom {
  return {
    id,

    userId:
      data.userId ?? "",

    hostUserId:
      data.hostUserId ??
      data.userId ??
      "",

    hostName:
      data.hostName ??
      "Vault1 Host",

    hostUsername:
      data.hostUsername,

    title:
      data.title ??
      "Untitled Live Room",

    description:
      data.description ??
      "",

    category:
      data.category ??
      "TRADING",

    visibility:
      data.visibility ??
      "PUBLIC",

    status:
      data.status ??
      "SCHEDULED",

    scheduledAt:
      data.scheduledAt,

    startedAt:
      data.startedAt,

    endedAt:
      data.endedAt,

    maxParticipants:
      data.maxParticipants ??
      100,

    participantCount:
      data.participantCount ??
      0,

    peakParticipantCount:
      data.peakParticipantCount ??
      0,

    chatEnabled:
      data.chatEnabled ??
      true,

    screenShareEnabled:
      data.screenShareEnabled ??
      true,

    recordingEnabled:
      data.recordingEnabled ??
      false,

    currentScreenSharerUserId:
      data.currentScreenSharerUserId,

    currentScreenSharerName:
      data.currentScreenSharerName,

    thumbnailUrl:
      data.thumbnailUrl,

    channelId:
      data.channelId,

    traderProfileId:
      data.traderProfileId,

    createdAt:
      data.createdAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizeParticipant(
  id: string,
  data: Record<string, any>
): LiveParticipant {
  return {
    id,

    roomId:
      data.roomId ??
      "",

    userId:
      data.userId ??
      "",

    displayName:
      data.displayName ??
      "Vault1 User",

    username:
      data.username,

    role:
      data.role ??
      "VIEWER",

    status:
      data.status ??
      "JOINED",

    audioEnabled:
      data.audioEnabled ??
      true,

    videoEnabled:
      data.videoEnabled ??
      false,

    screenSharing:
      data.screenSharing ??
      false,

    joinedAt:
      data.joinedAt,

    leftAt:
      data.leftAt,

    updatedAt:
      data.updatedAt,
  };
}

function normalizeMessage(
  id: string,
  data: Record<string, any>
): LiveChatMessage {
  return {
    id,

    roomId:
      data.roomId ??
      "",

    userId:
      data.userId ??
      "",

    displayName:
      data.displayName ??
      "Vault1 User",

    username:
      data.username,

    message:
      data.message ??
      "",

    deleted:
      data.deleted ??
      false,

    createdAt:
      data.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/* ROOM CREATION                                                              */
/* -------------------------------------------------------------------------- */

export async function createLiveRoom(params: {
  userId: string;
  hostName: string;
  hostUsername?: string;

  title: string;
  description: string;
  category: string;

  visibility: LiveRoomVisibility;

  scheduledAt?: Date | null;

  maxParticipants?: number;

  channelId?: string;
  traderProfileId?: string;
}) {
  if (!params.userId) {
    throw new Error(
      "User authentication is required."
    );
  }

  if (!params.title.trim()) {
    throw new Error(
      "Live room title is required."
    );
  }

  const roomRef = await addDoc(
    liveRoomsCollection,
    {
      userId:
        params.userId,

      hostUserId:
        params.userId,

      hostName:
        params.hostName,

      hostUsername:
        params.hostUsername ??
        null,

      title:
        params.title.trim(),

      description:
        params.description.trim(),

      category:
        params.category,

      visibility:
        params.visibility,

      status:
        params.scheduledAt
          ? "SCHEDULED"
          : "LIVE",

      scheduledAt:
        params.scheduledAt ??
        null,

      startedAt:
        params.scheduledAt
          ? null
          : serverTimestamp(),

      endedAt:
        null,

      maxParticipants:
        params.maxParticipants ??
        100,

      participantCount:
        0,

      peakParticipantCount:
        0,

      chatEnabled:
        true,

      screenShareEnabled:
        true,

      recordingEnabled:
        false,

      currentScreenSharerUserId:
        null,

      currentScreenSharerName:
        null,

      channelId:
        params.channelId ??
        null,

      traderProfileId:
        params.traderProfileId ??
        null,

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp(),
    }
  );

  return roomRef.id;
}

/* -------------------------------------------------------------------------- */
/* ROOM READ                                                                  */
/* -------------------------------------------------------------------------- */

export async function getLiveRoom(
  roomId: string
): Promise<LiveRoom | null> {
  if (!roomId) {
    return null;
  }

  const roomSnapshot = await getDoc(
    doc(
      db,
      "liveRooms",
      roomId
    )
  );

  if (!roomSnapshot.exists()) {
    return null;
  }

  return normalizeRoom(
    roomSnapshot.id,
    roomSnapshot.data()
  );
}

export async function getUserLiveRooms(
  userId: string
): Promise<LiveRoom[]> {
  const roomsQuery = query(
    liveRoomsCollection,
    where(
      "hostUserId",
      "==",
      userId
    ),
    limit(100)
  );

  const snapshot =
    await getDocs(roomsQuery);

  return snapshot.docs
    .map((item) =>
      normalizeRoom(
        item.id,
        item.data()
      )
    )
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ??
        0;

      const bTime =
        b.createdAt?.toMillis?.() ??
        0;

      return bTime - aTime;
    });
}

export async function getPublicLiveRooms(): Promise<
  LiveRoom[]
> {
  const roomsQuery = query(
    liveRoomsCollection,
    where(
      "visibility",
      "==",
      "PUBLIC"
    ),
    limit(100)
  );

  const snapshot =
    await getDocs(roomsQuery);

  return snapshot.docs
    .map((item) =>
      normalizeRoom(
        item.id,
        item.data()
      )
    )
    .filter(
      (room) =>
        room.status === "LIVE" ||
        room.status === "SCHEDULED"
    )
    .sort((a, b) => {
      const aTime =
        a.createdAt?.toMillis?.() ??
        0;

      const bTime =
        b.createdAt?.toMillis?.() ??
        0;

      return bTime - aTime;
    });
}

/* -------------------------------------------------------------------------- */
/* REALTIME ROOM LISTENERS                                                    */
/* -------------------------------------------------------------------------- */

export function subscribeToLiveRoom(
  roomId: string,
  callback: (
    room: LiveRoom | null
  ) => void
) {
  return onSnapshot(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(
        normalizeRoom(
          snapshot.id,
          snapshot.data()
        )
      );
    }
  );
}

export function subscribeToLiveRooms(
  callback: (
    rooms: LiveRoom[]
  ) => void
) {
  const roomsQuery = query(
    liveRoomsCollection,
    limit(100)
  );

  return onSnapshot(
    roomsQuery,
    (snapshot) => {
      const rooms =
        snapshot.docs
          .map((item) =>
            normalizeRoom(
              item.id,
              item.data()
            )
          )
          .filter(
            (room) =>
              room.status ===
                "LIVE" ||
              room.status ===
                "SCHEDULED"
          )
          .sort((a, b) => {
            const aTime =
              a.createdAt?.toMillis?.() ??
              0;

            const bTime =
              b.createdAt?.toMillis?.() ??
              0;

            return bTime - aTime;
          });

      callback(rooms);
    }
  );
}

/* -------------------------------------------------------------------------- */
/* ROOM LIFECYCLE                                                             */
/* -------------------------------------------------------------------------- */

export async function startLiveRoom(
  roomId: string,
  userId: string
) {
  const room =
    await getLiveRoom(roomId);

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the room host can start this room."
    );
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    {
      status: "LIVE",

      startedAt:
        serverTimestamp(),

      endedAt:
        null,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function endLiveRoom(
  roomId: string,
  userId: string
) {
  const room =
    await getLiveRoom(roomId);

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the room host can end this room."
    );
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    {
      status: "ENDED",

      endedAt:
        serverTimestamp(),

      currentScreenSharerUserId:
        null,

      currentScreenSharerName:
        null,

      updatedAt:
        serverTimestamp(),
    }
  );
}

export async function cancelLiveRoom(
  roomId: string,
  userId: string
) {
  const room =
    await getLiveRoom(roomId);

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.hostUserId !==
    userId
  ) {
    throw new Error(
      "Only the room host can cancel this room."
    );
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    {
      status:
        "CANCELLED",

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* PARTICIPANTS                                                               */
/* -------------------------------------------------------------------------- */

export async function joinLiveRoom(params: {
  roomId: string;
  userId: string;
  displayName: string;
  username?: string;
  role?: LiveParticipantRole;
}) {
  const room =
    await getLiveRoom(
      params.roomId
    );

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.status !==
      "LIVE" &&
    room.status !==
      "SCHEDULED"
  ) {
    throw new Error(
      "This live room is no longer available."
    );
  }

  const participantRef =
    doc(
      db,
      "liveRooms",
      params.roomId,
      "participants",
      params.userId
    );

  const existing =
    await getDoc(
      participantRef
    );

  await setDoc(
    participantRef,
    {
      roomId:
        params.roomId,

      userId:
        params.userId,

      displayName:
        params.displayName,

      username:
        params.username ??
        null,

      role:
        params.role ??
        (
          params.userId ===
          room.hostUserId
            ? "HOST"
            : "VIEWER"
        ),

      status:
        "JOINED",

      audioEnabled:
        true,

      videoEnabled:
        false,

      screenSharing:
        false,

      joinedAt:
        existing.exists()
          ? existing.data()
              .joinedAt
          : serverTimestamp(),

      leftAt:
        null,

      updatedAt:
        serverTimestamp(),
    },
    {
      merge: true,
    }
  );

  await refreshParticipantCount(
    params.roomId
  );
}

export async function leaveLiveRoom(
  roomId: string,
  userId: string
) {
  const participantRef =
    doc(
      db,
      "liveRooms",
      roomId,
      "participants",
      userId
    );

  const participant =
    await getDoc(
      participantRef
    );

  if (!participant.exists()) {
    return;
  }

  await updateDoc(
    participantRef,
    {
      status:
        "LEFT",

      leftAt:
        serverTimestamp(),

      screenSharing:
        false,

      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshParticipantCount(
    roomId
  );
}

async function refreshParticipantCount(
  roomId: string
) {
  const participantsQuery =
    query(
      roomParticipantsCollection(
        roomId
      ),
      where(
        "status",
        "==",
        "JOINED"
      )
    );

  const snapshot =
    await getDocs(
      participantsQuery
    );

  const participantCount =
    snapshot.size;

  const room =
    await getLiveRoom(
      roomId
    );

  if (!room) {
    return;
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    {
      participantCount,

      peakParticipantCount:
        Math.max(
          room.peakParticipantCount,
          participantCount
        ),

      updatedAt:
        serverTimestamp(),
    }
  );
}

export function subscribeToParticipants(
  roomId: string,
  callback: (
    participants: LiveParticipant[]
  ) => void
) {
  const participantsQuery =
    query(
      roomParticipantsCollection(
        roomId
      ),
      where(
        "status",
        "==",
        "JOINED"
      )
    );

  return onSnapshot(
    participantsQuery,
    (snapshot) => {
      const participants =
        snapshot.docs
          .map((item) =>
            normalizeParticipant(
              item.id,
              item.data()
            )
          )
          .sort((a, b) => {
            if (
              a.role ===
              "HOST"
            ) {
              return -1;
            }

            if (
              b.role ===
              "HOST"
            ) {
              return 1;
            }

            return a.displayName.localeCompare(
              b.displayName
            );
          });

      callback(participants);
    }
  );
}

export async function updateParticipantMedia(
  roomId: string,
  userId: string,
  changes: {
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    screenSharing?: boolean;
  }
) {
  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId,
      "participants",
      userId
    ),
    {
      ...changes,

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* SCREEN SHARING                                                             */
/* -------------------------------------------------------------------------- */

export async function setScreenSharer(
  roomId: string,
  userId: string,
  displayName: string,
  active: boolean
) {
  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId
    ),
    {
      currentScreenSharerUserId:
        active
          ? userId
          : null,

      currentScreenSharerName:
        active
          ? displayName
          : null,

      updatedAt:
        serverTimestamp(),
    }
  );

  await updateParticipantMedia(
    roomId,
    userId,
    {
      screenSharing:
        active,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* HOST MODERATION                                                            */
/* -------------------------------------------------------------------------- */

export async function removeParticipant(
  roomId: string,
  hostUserId: string,
  participantUserId: string
) {
  const room =
    await getLiveRoom(
      roomId
    );

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.hostUserId !==
    hostUserId
  ) {
    throw new Error(
      "Only the host can remove participants."
    );
  }

  if (
    participantUserId ===
    room.hostUserId
  ) {
    throw new Error(
      "The host cannot remove themselves."
    );
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId,
      "participants",
      participantUserId
    ),
    {
      status:
        "REMOVED",

      audioEnabled:
        false,

      videoEnabled:
        false,

      screenSharing:
        false,

      updatedAt:
        serverTimestamp(),
    }
  );

  await refreshParticipantCount(
    roomId
  );
}

export async function muteParticipant(
  roomId: string,
  hostUserId: string,
  participantUserId: string
) {
  const room =
    await getLiveRoom(
      roomId
    );

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    room.hostUserId !==
    hostUserId
  ) {
    throw new Error(
      "Only the host can mute participants."
    );
  }

  await updateDoc(
    doc(
      db,
      "liveRooms",
      roomId,
      "participants",
      participantUserId
    ),
    {
      status:
        "MUTED",

      audioEnabled:
        false,

      updatedAt:
        serverTimestamp(),
    }
  );
}

/* -------------------------------------------------------------------------- */
/* LIVE CHAT                                                                  */
/* -------------------------------------------------------------------------- */

export async function sendLiveChatMessage(
  params: {
    roomId: string;
    userId: string;
    displayName: string;
    username?: string;
    message: string;
  }
) {
  const message =
    params.message.trim();

  if (!message) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  if (
    message.length >
    1000
  ) {
    throw new Error(
      "Message cannot exceed 1000 characters."
    );
  }

  const room =
    await getLiveRoom(
      params.roomId
    );

  if (!room) {
    throw new Error(
      "Live room not found."
    );
  }

  if (
    !room.chatEnabled
  ) {
    throw new Error(
      "Chat is disabled for this room."
    );
  }

  await addDoc(
    roomMessagesCollection(
      params.roomId
    ),
    {
      roomId:
        params.roomId,

      userId:
        params.userId,

      displayName:
        params.displayName,

      username:
        params.username ??
        null,

      message,

      deleted:
        false,

      createdAt:
        serverTimestamp(),
    }
  );
}

export function subscribeToLiveChat(
  roomId: string,
  callback: (
    messages: LiveChatMessage[]
  ) => void
) {
  const messagesQuery =
    query(
      roomMessagesCollection(
        roomId
      ),
      orderBy(
        "createdAt",
        "asc"
      ),
      limit(200)
    );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map(
          (item) =>
            normalizeMessage(
              item.id,
              item.data()
            )
        )
      );
    }
  );
}

export async function deleteLiveChatMessage(
  roomId: string,
  messageId: string,
  userId: string
) {
  const messageRef =
    doc(
      db,
      "liveRooms",
      roomId,
      "messages",
      messageId
    );

  const messageSnapshot =
    await getDoc(
      messageRef
    );

  if (
    !messageSnapshot.exists()
  ) {
    return;
  }

  const data =
    messageSnapshot.data();

  const room =
    await getLiveRoom(
      roomId
    );

  const canDelete =
    data.userId ===
      userId ||
    room?.hostUserId ===
      userId;

  if (!canDelete) {
    throw new Error(
      "You do not have permission to delete this message."
    );
  }

  await updateDoc(
    messageRef,
    {
      deleted:
        true,
    }
  );
}

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

export async function getLiveRoomSummary(
  userId: string
) {
  const rooms =
    await getUserLiveRooms(
      userId
    );

  return {
    totalRooms:
      rooms.length,

    scheduledRooms:
      rooms.filter(
        (room) =>
          room.status ===
          "SCHEDULED"
      ).length,

    liveRooms:
      rooms.filter(
        (room) =>
          room.status ===
          "LIVE"
      ).length,

    endedRooms:
      rooms.filter(
        (room) =>
          room.status ===
          "ENDED"
      ).length,

    totalParticipants:
      rooms.reduce(
        (sum, room) =>
          sum +
          room.participantCount,
        0
      ),
  };
}