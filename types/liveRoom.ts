export type LiveRoomStatus =
  | "SCHEDULED"
  | "LIVE"
  | "ENDED"
  | "CANCELLED";

export type LiveRoomVisibility =
  | "PUBLIC"
  | "PRIVATE"
  | "FOLLOWERS"
  | "SUBSCRIBERS";

export type LiveParticipantRole =
  | "HOST"
  | "CO_HOST"
  | "SPEAKER"
  | "VIEWER";

export type LiveParticipantStatus =
  | "JOINED"
  | "LEFT"
  | "REMOVED"
  | "MUTED";

export type LiveRoom = {
  id: string;
  userId: string;
  hostUserId: string;
  hostName: string;
  hostUsername?: string;

  title: string;
  description: string;
  category: string;
  visibility: LiveRoomVisibility;
  status: LiveRoomStatus;

  scheduledAt?: any;
  startedAt?: any;
  endedAt?: any;

  maxParticipants: number;
  participantCount: number;
  peakParticipantCount: number;

  chatEnabled: boolean;
  screenShareEnabled: boolean;
  recordingEnabled: boolean;

  currentScreenSharerUserId?: string;
  currentScreenSharerName?: string;

  thumbnailUrl?: string;
  channelId?: string;
  traderProfileId?: string;

  createdAt?: any;
  updatedAt?: any;
};

export type LiveParticipant = {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  username?: string;

  role: LiveParticipantRole;
  status: LiveParticipantStatus;

  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing: boolean;

  joinedAt?: any;
  leftAt?: any;
  updatedAt?: any;
};

export type LiveChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  username?: string;

  message: string;
  deleted: boolean;

  createdAt?: any;
};

export type LiveRoomSummary = {
  totalRooms: number;
  scheduledRooms: number;
  liveRooms: number;
  endedRooms: number;
  totalParticipants: number;
};