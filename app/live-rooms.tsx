import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  cancelLiveRoom,
  createLiveRoom,
  endLiveRoom,
  getUserLiveRooms,
  startLiveRoom,
} from "../services/liveRooms/liveRoomService";

import { LiveRoom } from "../types/liveRoom";

const categories = [
  "TRADING",
  "MARKET ANALYSIS",
  "EDUCATION",
  "PORTFOLIO",
  "Q&A",
  "COMMENTARY",
];

export default function LiveRoomsScreen() {
  const {
    user,
    profile,
  } = useAuth();

  const [
    rooms,
    setRooms,
  ] = useState<LiveRoom[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState(
    "TRADING"
  );

  const [
    visibility,
    setVisibility,
  ] = useState<
    "PUBLIC" | "PRIVATE"
  >("PUBLIC");

  const loadRooms =
    async () => {
      if (!user) {
        setRooms([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const result =
          await getUserLiveRooms(
            user.uid
          );

        setRooms(result);
      } catch (error) {
        console.error(
          "Failed to load live rooms:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadRooms();
  }, [user?.uid]);

  const summary =
    useMemo(() => {
      return {
        total:
          rooms.length,

        live:
          rooms.filter(
            (room) =>
              room.status ===
              "LIVE"
          ).length,

        scheduled:
          rooms.filter(
            (room) =>
              room.status ===
              "SCHEDULED"
          ).length,

        viewers:
          rooms.reduce(
            (
              sum,
              room
            ) =>
              sum +
              room.participantCount,
            0
          ),
      };
    }, [rooms]);

  const resetForm =
    () => {
      setTitle("");
      setDescription("");
      setCategory(
        "TRADING"
      );
      setVisibility(
        "PUBLIC"
      );
    };

  const handleCreate =
    async () => {
      if (!user) {
        return;
      }

      if (!title.trim()) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        const roomId =
          await createLiveRoom({
            userId:
              user.uid,

            hostName:
              profile?.displayName ||
              user.displayName ||
              "Vault1 Host",

            title,

            description,

            category,

            visibility,

            maxParticipants:
              100,
          });

        resetForm();

        setModalVisible(
          false
        );

        await loadRooms();

        router.push({
          pathname:
            "/live-rooms/[roomId]",

          params: {
            roomId,
          },
        });
      } catch (error) {
        console.error(
          "Failed to create live room:",
          error
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const handleStart =
    async (
      room: LiveRoom
    ) => {
      if (!user) {
        return;
      }

      try {
        await startLiveRoom(
          room.id,
          user.uid
        );

        await loadRooms();

        router.push({
          pathname:
            "/live-rooms/[roomId]",

          params: {
            roomId:
              room.id,
          },
        });
      } catch (error) {
        console.error(
          "Failed to start live room:",
          error
        );
      }
    };

  const handleEnd =
    async (
      room: LiveRoom
    ) => {
      if (!user) {
        return;
      }

      try {
        await endLiveRoom(
          room.id,
          user.uid
        );

        await loadRooms();
      } catch (error) {
        console.error(
          "Failed to end live room:",
          error
        );
      }
    };

  const handleCancel =
    async (
      room: LiveRoom
    ) => {
      if (!user) {
        return;
      }

      try {
        await cancelLiveRoom(
          room.id,
          user.uid
        );

        await loadRooms();
      } catch (error) {
        console.error(
          "Failed to cancel live room:",
          error
        );
      }
    };

  return (
    <View
      style={
        styles.screen
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.header
          }
        >
          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              COMMUNITY / LIVE
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Live Rooms
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Host market sessions,
              analysis, education and
              real-time trader
              conversations.
            </Text>
          </View>

          <Pressable
            style={({
              pressed,
            }) => [
              styles.primaryButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={() =>
              setModalVisible(
                true
              )
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              + CREATE LIVE ROOM
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.metricsRow
          }
        >
          <Metric
            label="TOTAL ROOMS"
            value={summary.total.toString()}
          />

          <Metric
            label="LIVE NOW"
            value={summary.live.toString()}
            accent
          />

          <Metric
            label="SCHEDULED"
            value={summary.scheduled.toString()}
          />

          <Metric
            label="CURRENT VIEWERS"
            value={summary.viewers.toString()}
          />
        </View>

        <VaultSurface
          intensity="medium"
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Your Rooms
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Manage your live broadcasts
                and upcoming sessions.
              </Text>
            </View>
          </View>

          {loading ? (
            <View
              style={
                styles.loading
              }
            >
              <ActivityIndicator />
            </View>
          ) : rooms.length ===
            0 ? (
            <View
              style={
                styles.empty
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Text
                  style={
                    styles.emptyIconText
                  }
                >
                  ◉
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No live rooms yet
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Create your first room
                and start building your
                live trader presence.
              </Text>

              <Pressable
                style={({
                  pressed,
                }) => [
                  styles.secondaryButton,
                  pressed &&
                    styles.pressed,
                ]}
                onPress={() =>
                  setModalVisible(
                    true
                  )
                }
              >
                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  CREATE YOUR FIRST ROOM
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={
                styles.roomList
              }
            >
              {rooms.map(
                (room) => (
                  <RoomRow
                    key={
                      room.id
                    }
                    room={
                      room
                    }
                    onOpen={() =>
                      router.push(
                        {
                          pathname:
                            "/live-rooms/[roomId]",
                          params: {
                            roomId:
                              room.id,
                          },
                        }
                      )
                    }
                    onStart={() =>
                      handleStart(
                        room
                      )
                    }
                    onEnd={() =>
                      handleEnd(
                        room
                      )
                    }
                    onCancel={() =>
                      handleCancel(
                        room
                      )
                    }
                  />
                )
              )}
            </View>
          )}
        </VaultSurface>
      </ScrollView>

      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <VaultSurface
            intensity="strong"
            style={
              styles.modalCard
            }
          >
            <ScrollView
              contentContainerStyle={
                styles.modalContent
              }
            >
              <View
                style={
                  styles.modalHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.modalEyebrow
                    }
                  >
                    LIVE BROADCAST
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Create Live Room
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.close
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <Text
                style={
                  styles.inputLabel
                }
              >
                ROOM TITLE
              </Text>

              <TextInput
                value={
                  title
                }
                onChangeText={
                  setTitle
                }
                placeholder="e.g. NIFTY Opening Analysis"
                placeholderTextColor="#555"
                style={
                  styles.input
                }
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                DESCRIPTION
              </Text>

              <TextInput
                value={
                  description
                }
                onChangeText={
                  setDescription
                }
                placeholder="Tell viewers what this room is about..."
                placeholderTextColor="#555"
                multiline
                style={[
                  styles.input,
                  styles.descriptionInput,
                ]}
              />

              <Text
                style={
                  styles.inputLabel
                }
              >
                CATEGORY
              </Text>

              <View
                style={
                  styles.chips
                }
              >
                {categories.map(
                  (item) => (
                    <Pressable
                      key={
                        item
                      }
                      onPress={() =>
                        setCategory(
                          item
                        )
                      }
                      style={[
                        styles.chip,
                        category ===
                          item &&
                          styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          category ===
                            item &&
                            styles.chipTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Text
                style={
                  styles.inputLabel
                }
              >
                VISIBILITY
              </Text>

              <View
                style={
                  styles.visibilityRow
                }
              >
                {(
                  [
                    "PUBLIC",
                    "PRIVATE",
                  ] as const
                ).map(
                  (item) => (
                    <Pressable
                      key={
                        item
                      }
                      onPress={() =>
                        setVisibility(
                          item
                        )
                      }
                      style={[
                        styles.visibilityOption,
                        visibility ===
                          item &&
                          styles.visibilityActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.visibilityText,
                          visibility ===
                            item &&
                            styles.visibilityTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Pressable
                disabled={
                  actionLoading ||
                  !title.trim()
                }
                onPress={
                  handleCreate
                }
                style={({
                  pressed,
                }) => [
                  styles.createButton,

                  (!title.trim() ||
                    actionLoading) &&
                    styles.disabled,

                  pressed &&
                    styles.pressed,
                ]}
              >
                {actionLoading ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    CREATE & ENTER ROOM
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </VaultSurface>
        </View>
      </Modal>
    </View>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <VaultSurface
      intensity="subtle"
      style={
        styles.metric
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          accent &&
            styles.metricAccent,
        ]}
      >
        {value}
      </Text>
    </VaultSurface>
  );
}

function RoomRow({
  room,
  onOpen,
  onStart,
  onEnd,
  onCancel,
}: {
  room: LiveRoom;
  onOpen: () => void;
  onStart: () => void;
  onEnd: () => void;
  onCancel: () => void;
}) {
  const statusLabel =
    room.status ===
    "LIVE"
      ? "LIVE NOW"
      : room.status;

  return (
    <View
      style={
        styles.roomRow
      }
    >
      <View
        style={
          styles.roomMain
        }
      >
        <View
          style={
            styles.roomStatusRow
          }
        >
          <View
            style={[
              styles.statusDot,
              room.status ===
                "LIVE" &&
                styles.liveDot,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              room.status ===
                "LIVE" &&
                styles.liveText,
            ]}
          >
            {statusLabel}
          </Text>
        </View>

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
          {room.description ||
            "No description provided."}
        </Text>

        <View
          style={
            styles.roomMeta
          }
        >
          <Text
            style={
              styles.metaText
            }
          >
            {room.category}
          </Text>

          <Text
            style={
              styles.metaDivider
            }
          >
            •
          </Text>

          <Text
            style={
              styles.metaText
            }
          >
            {room.participantCount}{" "}
            viewers
          </Text>

          <Text
            style={
              styles.metaDivider
            }
          >
            •
          </Text>

          <Text
            style={
              styles.metaText
            }
          >
            {room.visibility}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.roomActions
        }
      >
        {room.status ===
          "SCHEDULED" && (
          <>
            <Pressable
              style={
                styles.actionButton
              }
              onPress={
                onStart
              }
            >
              <Text
                style={
                  styles.actionButtonText
                }
              >
                START
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.dangerButton
              }
              onPress={
                onCancel
              }
            >
              <Text
                style={
                  styles.dangerButtonText
                }
              >
                CANCEL
              </Text>
            </Pressable>
          </>
        )}

        {room.status ===
          "LIVE" && (
          <>
            <Pressable
              style={
                styles.actionButton
              }
              onPress={
                onOpen
              }
            >
              <Text
                style={
                  styles.actionButtonText
                }
              >
                ENTER
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.dangerButton
              }
              onPress={
                onEnd
              }
            >
              <Text
                style={
                  styles.dangerButtonText
                }
              >
                END
              </Text>
            </Pressable>
          </>
        )}

        {room.status ===
          "ENDED" && (
          <Pressable
            style={
              styles.actionButton
            }
            onPress={
              onOpen
            }
          >
            <Text
              style={
                styles.actionButtonText
              }
            >
              VIEW
            </Text>
          </Pressable>
        )}
      </View>
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

    content: {
      padding: 34,
      paddingBottom: 80,
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
      marginBottom: 30,
    },

    eyebrow: {
      color: "#777",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing: 2,
      marginBottom: 10,
    },

    title: {
      color: "#3F3F3B",
      fontSize: 44,
      fontWeight:
        "900",
      letterSpacing:
        -1.5,
    },

    subtitle: {
      color: "#777",
      fontSize: 15,
      marginTop: 10,
      maxWidth: 720,
      lineHeight: 22,
    },

    primaryButton: {
      backgroundColor:
        "#8B5CF6",
      paddingHorizontal: 22,
      paddingVertical: 15,
      borderRadius: 10,
    },

    primaryButtonText: {
      color: "#111111",
      fontSize: 11,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    metricsRow: {
      flexDirection:
        "row",
      gap: 14,
      marginBottom: 24,
    },

    metric: {
      flex: 1,
      minHeight: 125,
      padding: 20,
    },

    metricLabel: {
      color: "#666",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.5,
    },

    metricValue: {
      color: "#EEE",
      fontSize: 34,
      fontWeight:
        "900",
      marginTop: 25,
    },

    metricAccent: {
      color: "#A78BFA",
    },

    sectionHeader: {
      padding: 24,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#222",
    },

    sectionTitle: {
      color: "#3F3F3B",
      fontSize: 22,
      fontWeight:
        "800",
    },

    sectionSubtitle: {
      color: "#666",
      fontSize: 13,
      marginTop: 7,
    },

    loading: {
      minHeight: 300,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    empty: {
      alignItems:
        "center",
      justifyContent:
        "center",
      minHeight: 400,
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#111111",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 20,
    },

    emptyIconText: {
      color: "#A78BFA",
      fontSize: 25,
    },

    emptyTitle: {
      color: "#EEE",
      fontSize: 23,
      fontWeight:
        "800",
    },

    emptyText: {
      color: "#666",
      fontSize: 14,
      lineHeight: 22,
      textAlign:
        "center",
      maxWidth: 480,
      marginTop: 10,
      marginBottom: 22,
    },

    secondaryButton: {
      borderWidth: 1,
      borderColor:
        "#444",
      paddingHorizontal: 20,
      paddingVertical: 13,
      borderRadius: 9,
    },

    secondaryButtonText: {
      color: "#CCC",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    roomList: {
      padding: 10,
    },

    roomRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      padding: 22,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#202020",
      minHeight: 150,
    },

    roomMain: {
      flex: 1,
      paddingRight: 30,
    },

    roomStatusRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
    },

    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#555",
    },

    liveDot: {
      backgroundColor:
        "#A78BFA",
    },

    statusText: {
      color: "#666",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    liveText: {
      color: "#A78BFA",
    },

    roomTitle: {
      color: "#EEE",
      fontSize: 21,
      fontWeight:
        "800",
      marginTop: 10,
    },

    roomDescription: {
      color: "#666",
      fontSize: 13,
      marginTop: 7,
      lineHeight: 19,
    },

    roomMeta: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      marginTop: 14,
    },

    metaText: {
      color: "#555",
      fontSize: 10,
      fontWeight:
        "700",
    },

    metaDivider: {
      color: "#333",
    },

    roomActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    actionButton: {
      borderWidth: 1,
      borderColor:
        "#493477",
      backgroundColor:
        "#111111",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 8,
    },

    actionButtonText: {
      color: "#B99CFF",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    dangerButton: {
      borderWidth: 1,
      borderColor:
        "#3A2727",
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 8,
    },

    dangerButtonText: {
      color: "#9C6666",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing: 1,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.78)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    modalCard: {
      width: "100%",
      maxWidth: 720,
      maxHeight: "90%",
    },

    modalContent: {
      padding: 30,
    },

    modalHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom: 30,
    },

    modalEyebrow: {
      color: "#8B5CF6",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.5,
    },

    modalTitle: {
      color: "#3F3F3B",
      fontSize: 30,
      fontWeight:
        "900",
      marginTop: 8,
    },

    close: {
      color: "#777",
      fontSize: 30,
    },

    inputLabel: {
      color: "#666",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
      marginBottom: 8,
      marginTop: 18,
    },

    input: {
      backgroundColor:
        "#111111",
      borderWidth: 1,
      borderColor:
        "#292929",
      color: "#EEE",
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 14,
    },

    descriptionInput: {
      minHeight: 100,
      textAlignVertical:
        "top",
    },

    chips: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 8,
    },

    chip: {
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 7,
    },

    chipActive: {
      borderColor:
        "#8B5CF6",
      backgroundColor:
        "#111111",
    },

    chipText: {
      color: "#666",
      fontSize: 9,
      fontWeight:
        "800",
    },

    chipTextActive: {
      color: "#B99CFF",
    },

    visibilityRow: {
      flexDirection:
        "row",
      gap: 10,
    },

    visibilityOption: {
      flex: 1,
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingVertical: 13,
      alignItems:
        "center",
      borderRadius: 8,
    },

    visibilityActive: {
      borderColor:
        "#8B5CF6",
      backgroundColor:
        "#111111",
    },

    visibilityText: {
      color: "#666",
      fontSize: 10,
      fontWeight:
        "800",
    },

    visibilityTextActive: {
      color: "#B99CFF",
    },

    createButton: {
      backgroundColor:
        "#8B5CF6",
      paddingVertical: 16,
      alignItems:
        "center",
      borderRadius: 9,
      marginTop: 30,
    },

    createButtonText: {
      color: "#111111",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    disabled: {
      opacity: 0.35,
    },

    pressed: {
      opacity: 0.75,
      transform: [
        {
          translateY: 1,
        },
      ],
    },
  });