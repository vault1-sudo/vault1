import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import VaultSurface from "../../components/ui/VaultSurface";

import { useAuth } from "../../services/auth/AuthProvider";

import {
  deleteLiveChatMessage,
  endLiveRoom,
  joinLiveRoom,
  leaveLiveRoom,
  muteParticipant,
  removeParticipant,
  sendLiveChatMessage,
  setScreenSharer,
  subscribeToLiveChat,
  subscribeToLiveRoom,
  subscribeToParticipants,
  updateParticipantMedia,
} from "../../services/liveRooms/liveRoomService";

import {
  LiveChatMessage,
  LiveParticipant,
  LiveRoom,
} from "../../types/liveRoom";

export default function LiveRoomScreen() {
  const params =
    useLocalSearchParams<{
      roomId: string;
    }>();

  const roomId =
    Array.isArray(
      params.roomId
    )
      ? params.roomId[0]
      : params.roomId;

  const {
    user,
    profile,
  } = useAuth();

  const [
    room,
    setRoom,
  ] = useState<
    LiveRoom | null
  >(null);

  const [
    participants,
    setParticipants,
  ] = useState<
    LiveParticipant[]
  >([]);

  const [
    messages,
    setMessages,
  ] = useState<
    LiveChatMessage[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    joined,
    setJoined,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    audioEnabled,
    setAudioEnabled,
  ] = useState(true);

  const [
    screenSharing,
    setScreenSharing,
  ] = useState(false);

  const chatRef =
    useRef<ScrollView>(
      null
    );

  const isHost =
    useMemo(() => {
      return !!(
        user &&
        room &&
        room.hostUserId ===
          user.uid
      );
    }, [
      user,
      room,
    ]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const unsubscribeRoom =
      subscribeToLiveRoom(
        roomId,
        (value) => {
          setRoom(value);
          setLoading(false);
        }
      );

    const unsubscribeParticipants =
      subscribeToParticipants(
        roomId,
        setParticipants
      );

    const unsubscribeChat =
      subscribeToLiveChat(
        roomId,
        setMessages
      );

    return () => {
      unsubscribeRoom();
      unsubscribeParticipants();
      unsubscribeChat();
    };
  }, [roomId]);

  useEffect(() => {
    if (
      !user ||
      !room ||
      joined
    ) {
      return;
    }

    const enterRoom =
      async () => {
        try {
          await joinLiveRoom(
            {
              roomId:
                room.id,

              userId:
                user.uid,

              displayName:
                profile?.displayName ||
                user.displayName ||
                "Vault1 User",

              role:
                room.hostUserId ===
                user.uid
                  ? "HOST"
                  : "VIEWER",
            }
          );

          setJoined(
            true
          );
        } catch (error) {
          console.error(
            "Failed to join live room:",
            error
          );
        }
      };

    enterRoom();
  }, [
    user?.uid,
    room?.id,
    profile?.displayName,
  ]);

  useEffect(() => {
    return () => {
      if (
        joined &&
        user &&
        roomId
      ) {
        leaveLiveRoom(
          roomId,
          user.uid
        ).catch(() => {});
      }
    };
  }, [
    joined,
    user?.uid,
    roomId,
  ]);

  useEffect(() => {
    if (
      messages.length ===
      0
    ) {
      return;
    }

    setTimeout(() => {
      chatRef.current?.scrollToEnd(
        {
          animated: true,
        }
      );
    }, 50);
  }, [
    messages.length,
  ]);

  const toggleAudio =
    async () => {
      if (
        !user ||
        !roomId
      ) {
        return;
      }

      const next =
        !audioEnabled;

      setAudioEnabled(
        next
      );

      try {
        await updateParticipantMedia(
          roomId,
          user.uid,
          {
            audioEnabled:
              next,
          }
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  const toggleScreenShare =
    async () => {
      if (
        !user ||
        !room
      ) {
        return;
      }

      if (
        Platform.OS ===
          "web" &&
        !screenSharing
      ) {
        const mediaDevices =
          typeof navigator !==
          "undefined"
            ? navigator.mediaDevices
            : undefined;

        if (
          !mediaDevices ||
          !mediaDevices.getDisplayMedia
        ) {
          console.warn(
            "Screen sharing is not supported in this browser."
          );

          return;
        }

        try {
          const stream =
            await mediaDevices.getDisplayMedia(
              {
                video: true,
                audio: true,
              }
            );

          stream
            .getVideoTracks()
            .forEach(
              (track) => {
                track.addEventListener(
                  "ended",
                  async () => {
                    setScreenSharing(
                      false
                    );

                    await setScreenSharer(
                      room.id,
                      user.uid,
                      profile?.displayName ||
                        user.displayName ||
                        "Vault1 User",
                      false
                    );
                  }
                );
              }
            );

          setScreenSharing(
            true
          );

          await setScreenSharer(
            room.id,
            user.uid,
            profile?.displayName ||
              user.displayName ||
              "Vault1 User",
            true
          );
        } catch (error) {
          console.error(
            "Screen share failed:",
            error
          );
        }

        return;
      }

      setScreenSharing(
        false
      );

      await setScreenSharer(
        room.id,
        user.uid,
        profile?.displayName ||
          user.displayName ||
          "Vault1 User",
        false
      );
    };

  const sendMessage =
    async () => {
      if (
        !user ||
        !roomId ||
        !message.trim() ||
        sending
      ) {
        return;
      }

      try {
        setSending(
          true
        );

        await sendLiveChatMessage(
          {
            roomId,

            userId:
              user.uid,

            displayName:
              profile?.displayName ||
              user.displayName ||
              "Vault1 User",

            message,
          }
        );

        setMessage("");
      } catch (error) {
        console.error(
          "Failed to send message:",
          error
        );
      } finally {
        setSending(
          false
        );
      }
    };

  const handleLeave =
    async () => {
      if (
        user &&
        roomId &&
        joined
      ) {
        try {
          await leaveLiveRoom(
            roomId,
            user.uid
          );
        } catch (error) {
          console.error(
            error
          );
        }
      }

      setJoined(
        false
      );

      router.back();
    };

  const handleEndRoom =
    async () => {
      if (
        !user ||
        !room
      ) {
        return;
      }

      try {
        await endLiveRoom(
          room.id,
          user.uid
        );
      } catch (error) {
        console.error(
          error
        );
      }
    };

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (!room) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          Live room not found.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      <View
        style={
          styles.topBar
        }
      >
        <Pressable
          onPress={
            handleLeave
          }
          style={({
            pressed,
          }) => [
            styles.backButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text
            style={
              styles.backText
            }
          >
            ← BACK
          </Text>
        </Pressable>

        <View
          style={
            styles.topCenter
          }
        >
          <View
            style={[
              styles.liveIndicator,
              room.status !==
                "LIVE" &&
                styles.offlineIndicator,
            ]}
          />

          <Text
            style={
              styles.liveLabel
            }
          >
            {room.status ===
            "LIVE"
              ? "LIVE"
              : room.status}
          </Text>
        </View>

        <View
          style={
            styles.topRight
          }
        >
          <Text
            style={
              styles.viewerCount
            }
          >
            {room.participantCount}{" "}
            VIEWERS
          </Text>
        </View>
      </View>

      <View
        style={
          styles.body
        }
      >
        <View
          style={
            styles.stageColumn
          }
        >
          <VaultSurface
            intensity="strong"
            style={
              styles.stage
            }
          >
            <View
              style={
                styles.stageInner
              }
            >
              {room.status ===
              "LIVE" ? (
                <>
                  <View
                    style={
                      styles.broadcastIcon
                    }
                  >
                    <Text
                      style={
                        styles.broadcastIconText
                      }
                    >
                      ◉
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.stageTitle
                    }
                  >
                    {room.title}
                  </Text>

                  <Text
                    style={
                      styles.stageSubtitle
                    }
                  >
                    {room.currentScreenSharerUserId
                      ? `${room.currentScreenSharerName} is sharing their screen`
                      : "Live broadcast is active"}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    style={
                      styles.stageTitle
                    }
                  >
                    {room.status}
                  </Text>

                  <Text
                    style={
                      styles.stageSubtitle
                    }
                  >
                    This room is not currently
                    live.
                  </Text>
                </>
              )}
            </View>
          </VaultSurface>

          <View
            style={
              styles.roomHeader
            }
          >
            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.category
                }
              >
                {room.category}
              </Text>

              <Text
                style={
                  styles.roomTitle
                }
              >
                {room.title}
              </Text>

              <Text
                style={
                  styles.roomDescription
                }
              >
                {room.description}
              </Text>
            </View>

            {isHost && (
              <Pressable
                onPress={
                  handleEndRoom
                }
                style={
                  styles.endButton
                }
              >
                <Text
                  style={
                    styles.endButtonText
                  }
                >
                  END ROOM
                </Text>
              </Pressable>
            )}
          </View>

          <VaultSurface
            intensity="medium"
            style={
              styles.controls
            }
          >
            <ControlButton
              label={
                audioEnabled
                  ? "MIC ON"
                  : "MIC OFF"
              }
              active={
                audioEnabled
              }
              onPress={
                toggleAudio
              }
            />

            <ControlButton
              label={
                screenSharing
                  ? "STOP SHARE"
                  : "SHARE SCREEN"
              }
              active={
                screenSharing
              }
              onPress={
                toggleScreenShare
              }
            />

            <ControlButton
              label="LEAVE"
              danger
              onPress={
                handleLeave
              }
            />
          </VaultSurface>
        </View>

        <View
          style={
            styles.sideColumn
          }
        >
          <VaultSurface
            intensity="medium"
            style={
              styles.participantsCard
            }
          >
            <View
              style={
                styles.panelHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.panelTitle
                  }
                >
                  Participants
                </Text>

                <Text
                  style={
                    styles.panelSubtitle
                  }
                >
                  {
                    participants.length
                  }{" "}
                  connected
                </Text>
              </View>
            </View>

            <ScrollView
              style={
                styles.participantList
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {participants.map(
                (
                  participant
                ) => (
                  <ParticipantRow
                    key={
                      participant.id
                    }
                    participant={
                      participant
                    }
                    host={
                      isHost
                    }
                    onMute={() =>
                      user &&
                      muteParticipant(
                        room.id,
                        user.uid,
                        participant.userId
                      )
                    }
                    onRemove={() =>
                      user &&
                      removeParticipant(
                        room.id,
                        user.uid,
                        participant.userId
                      )
                    }
                  />
                )
              )}
            </ScrollView>
          </VaultSurface>

          <VaultSurface
            intensity="medium"
            style={
              styles.chatCard
            }
          >
            <View
              style={
                styles.panelHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.panelTitle
                  }
                >
                  Live Chat
                </Text>

                <Text
                  style={
                    styles.panelSubtitle
                  }
                >
                  Real-time conversation
                </Text>
              </View>
            </View>

            <ScrollView
              ref={
                chatRef
              }
              style={
                styles.chatList
              }
              showsVerticalScrollIndicator={
                false
              }
            >
              {messages.length ===
              0 ? (
                <View
                  style={
                    styles.emptyChat
                  }
                >
                  <Text
                    style={
                      styles.emptyChatText
                    }
                  >
                    No messages yet.
                  </Text>
                </View>
              ) : (
                messages.map(
                  (
                    item
                  ) => (
                    <ChatMessage
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      canDelete={
                        !!user &&
                        (item.userId ===
                          user.uid ||
                          isHost)
                      }
                      onDelete={() =>
                        user &&
                        deleteLiveChatMessage(
                          room.id,
                          item.id,
                          user.uid
                        )
                      }
                    />
                  )
                )
              )}
            </ScrollView>

            {room.chatEnabled && (
              <View
                style={
                  styles.chatInputRow
                }
              >
                <TextInput
                  value={
                    message
                  }
                  onChangeText={
                    setMessage
                  }
                  placeholder="Write a message..."
                  placeholderTextColor="#555"
                  style={
                    styles.chatInput
                  }
                  onSubmitEditing={
                    sendMessage
                  }
                />

                <Pressable
                  onPress={
                    sendMessage
                  }
                  disabled={
                    sending ||
                    !message.trim()
                  }
                  style={[
                    styles.sendButton,
                    (!message.trim() ||
                      sending) &&
                      styles.sendDisabled,
                  ]}
                >
                  <Text
                    style={
                      styles.sendText
                    }
                  >
                    ↑
                  </Text>
                </Pressable>
              </View>
            )}
          </VaultSurface>
        </View>
      </View>
    </View>
  );
}

function ControlButton({
  label,
  active,
  danger,
  onPress,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.controlButton,

        active &&
          styles.controlActive,

        danger &&
          styles.controlDanger,

        pressed &&
          styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.controlText,

          active &&
            styles.controlActiveText,

          danger &&
            styles.controlDangerText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ParticipantRow({
  participant,
  host,
  onMute,
  onRemove,
}: {
  participant: LiveParticipant;
  host: boolean;
  onMute: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={
        styles.participantRow
      }
    >
      <View
        style={
          styles.avatar
        }
      >
        <Text
          style={
            styles.avatarText
          }
        >
          {participant.displayName
            .charAt(0)
            .toUpperCase()}
        </Text>
      </View>

      <View
        style={
          styles.participantInfo
        }
      >
        <Text
          style={
            styles.participantName
          }
          numberOfLines={
            1
          }
        >
          {
            participant.displayName
          }
        </Text>

        <Text
          style={
            styles.participantRole
          }
        >
          {
            participant.role
          }
        </Text>
      </View>

      <View
        style={
          styles.participantState
        }
      >
        <Text
          style={
            styles.mediaState
          }
        >
          {participant.audioEnabled
            ? "MIC"
            : "MUTE"}
        </Text>

        {participant.screenSharing && (
          <Text
            style={
              styles.shareState
            }
          >
            SHARE
          </Text>
        )}
      </View>

      {host &&
        participant.role !==
          "HOST" && (
          <View
            style={
              styles.moderation
            }
          >
            <Pressable
              onPress={
                onMute
              }
            >
              <Text
                style={
                  styles.moderationText
                }
              >
                MUTE
              </Text>
            </Pressable>

            <Pressable
              onPress={
                onRemove
              }
            >
              <Text
                style={
                  styles.removeText
                }
              >
                REMOVE
              </Text>
            </Pressable>
          </View>
        )}
    </View>
  );
}

function ChatMessage({
  item,
  canDelete,
  onDelete,
}: {
  item: LiveChatMessage;
  canDelete: boolean;
  onDelete: () => void;
}) {
  if (item.deleted) {
    return (
      <View
        style={
          styles.chatMessage
        }
      >
        <Text
          style={
            styles.deletedMessage
          }
        >
          Message deleted
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.chatMessage
      }
    >
      <View
        style={
          styles.chatMessageTop
        }
      >
        <Text
          style={
            styles.chatName
          }
        >
          {
            item.displayName
          }
        </Text>

        {canDelete && (
          <Pressable
            onPress={
              onDelete
            }
          >
            <Text
              style={
                styles.deleteChat
              }
            >
              ×
            </Text>
          </Pressable>
        )}
      </View>

      <Text
        style={
          styles.chatText
        }
      >
        {item.message}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#111111",
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        "#111111",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    errorText: {
      color: "#AAA",
      fontSize: 16,
    },

    topBar: {
      height: 64,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#1E1E1E",
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 24,
    },

    backButton: {
      width: 130,
    },

    backText: {
      color: "#777",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    topCenter: {
      flex: 1,
      alignItems:
        "center",
      flexDirection:
        "row",
      justifyContent:
        "center",
      gap: 8,
    },

    liveIndicator: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        "#A78BFA",
    },

    offlineIndicator: {
      backgroundColor:
        "#555",
    },

    liveLabel: {
      color: "#AAA",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1.3,
    },

    topRight: {
      width: 160,
      alignItems:
        "flex-end",
    },

    viewerCount: {
      color: "#666",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    body: {
      flex: 1,
      flexDirection:
        "row",
      padding: 22,
      gap: 20,
    },

    stageColumn: {
      flex: 1,
      minWidth: 500,
    },

    sideColumn: {
      width: 390,
      gap: 20,
    },

    stage: {
      minHeight: 470,
    },

    stageInner: {
      flex: 1,
      minHeight: 470,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 40,
      backgroundColor:
        "#111111",
    },

    broadcastIcon: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor:
        "#111111",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 22,
    },

    broadcastIconText: {
      color: "#A78BFA",
      fontSize: 30,
    },

    stageTitle: {
      color: "#EEE",
      fontSize: 30,
      fontWeight:
        "900",
      textAlign:
        "center",
    },

    stageSubtitle: {
      color: "#666",
      fontSize: 14,
      marginTop: 12,
      textAlign:
        "center",
    },

    roomHeader: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      paddingVertical: 20,
    },

    category: {
      color: "#A78BFA",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.5,
    },

    roomTitle: {
      color: "#EEE",
      fontSize: 27,
      fontWeight:
        "900",
      marginTop: 6,
    },

    roomDescription: {
      color: "#666",
      fontSize: 13,
      lineHeight: 20,
      marginTop: 8,
    },

    endButton: {
      borderWidth: 1,
      borderColor:
        "#482727",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 8,
    },

    endButtonText: {
      color: "#A66",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    controls: {
      flexDirection:
        "row",
      padding: 12,
      gap: 10,
    },

    controlButton: {
      flex: 1,
      paddingVertical: 13,
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 8,
      alignItems:
        "center",
    },

    controlActive: {
      borderColor:
        "#574184",
      backgroundColor:
        "#111111",
    },

    controlDanger: {
      borderColor:
        "#412727",
    },

    controlText: {
      color: "#777",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    controlActiveText: {
      color: "#B99CFF",
    },

    controlDangerText: {
      color: "#A66",
    },

    participantsCard: {
      height: 280,
    },

    chatCard: {
      flex: 1,
      minHeight: 330,
    },

    panelHeader: {
      padding: 18,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#202020",
    },

    panelTitle: {
      color: "#EEE",
      fontSize: 17,
      fontWeight:
        "800",
    },

    panelSubtitle: {
      color: "#555",
      fontSize: 10,
      marginTop: 4,
    },

    participantList: {
      flex: 1,
    },

    participantRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#171717",
      gap: 10,
    },

    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor:
        "#111111",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#B99CFF",
      fontSize: 11,
      fontWeight:
        "900",
    },

    participantInfo: {
      flex: 1,
    },

    participantName: {
      color: "#CCC",
      fontSize: 12,
      fontWeight:
        "700",
    },

    participantRole: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "800",
      letterSpacing:
        0.8,
      marginTop: 3,
    },

    participantState: {
      alignItems:
        "flex-end",
    },

    mediaState: {
      color: "#555",
      fontSize: 7,
      fontWeight:
        "900",
    },

    shareState: {
      color: "#A78BFA",
      fontSize: 7,
      fontWeight:
        "900",
      marginTop: 3,
    },

    moderation: {
      gap: 5,
    },

    moderationText: {
      color: "#777",
      fontSize: 7,
      fontWeight:
        "900",
    },

    removeText: {
      color: "#8C5F5F",
      fontSize: 7,
      fontWeight:
        "900",
    },

    chatList: {
      flex: 1,
      paddingHorizontal: 15,
    },

    emptyChat: {
      flex: 1,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingVertical: 60,
    },

    emptyChatText: {
      color: "#444",
      fontSize: 12,
    },

    chatMessage: {
      paddingVertical: 10,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#171717",
    },

    chatMessageTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
    },

    chatName: {
      color: "#A78BFA",
      fontSize: 10,
      fontWeight:
        "800",
    },

    deleteChat: {
      color: "#777",
      fontSize: 16,
    },

    chatText: {
      color: "#AAA",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },

    deletedMessage: {
      color: "#444",
      fontSize: 11,
      fontStyle:
        "italic",
    },

    chatInputRow: {
      flexDirection:
        "row",
      padding: 12,
      gap: 8,
      borderTopWidth:
        1,
      borderTopColor:
        "#202020",
    },

    chatInput: {
      flex: 1,
      height: 40,
      backgroundColor:
        "#111111",
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 7,
      paddingHorizontal: 11,
      color: "#DDD",
      fontSize: 11,
    },

    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 7,
      backgroundColor:
        "#8B5CF6",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    sendDisabled: {
      opacity: 0.3,
    },

    sendText: {
      color: "#111111",
      fontSize: 18,
      fontWeight:
        "800",
    },

    pressed: {
      opacity: 0.7,
    },
  });