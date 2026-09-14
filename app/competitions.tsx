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
  activateCompetition,
  cancelCompetition,
  completeCompetition,
  createCompetition,
  getUserCompetitions,
} from "../services/competitions/competitionService";

import {
  Competition,
  CompetitionMetric,
} from "../types/competition";

const categories = [
  "TRADING",
  "MARKET ANALYSIS",
  "PORTFOLIO",
  "EDUCATION",
  "JOURNAL",
];

const metrics: {
  label: string;
  value: CompetitionMetric;
}[] = [
  {
    label: "RETURN %",
    value: "RETURN_PERCENT",
  },
  {
    label: "PROFIT",
    value: "PROFIT",
  },
  {
    label: "WIN RATE",
    value: "WIN_RATE",
  },
  {
    label: "RISK ADJUSTED",
    value: "RISK_ADJUSTED_RETURN",
  },
];

export default function CompetitionsScreen() {
  const {
    user,
    profile,
  } = useAuth();

  const [
    competitions,
    setCompetitions,
  ] = useState<
    Competition[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    modalVisible,
    setModalVisible,
  ] = useState(false);

  const [
    creating,
    setCreating,
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
    metric,
    setMetric,
  ] = useState<CompetitionMetric>(
    "RETURN_PERCENT"
  );

  const [
    visibility,
    setVisibility,
  ] = useState<
    "PUBLIC" | "PRIVATE"
  >("PUBLIC");

  const loadCompetitions =
    async () => {
      if (!user) {
        setCompetitions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const result =
          await getUserCompetitions(
            user.uid
          );

        setCompetitions(
          result
        );
      } catch (error) {
        console.error(
          "Failed to load competitions:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadCompetitions();
  }, [user?.uid]);

  const summary =
    useMemo(
      () => ({
        total:
          competitions.length,

        scheduled:
          competitions.filter(
            (item) =>
              item.status ===
              "SCHEDULED"
          ).length,

        active:
          competitions.filter(
            (item) =>
              item.status ===
              "ACTIVE"
          ).length,

        participants:
          competitions.reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.participantCount,
            0
          ),
      }),
      [competitions]
    );

  const resetForm =
    () => {
      setTitle("");
      setDescription("");
      setCategory(
        "TRADING"
      );
      setMetric(
        "RETURN_PERCENT"
      );
      setVisibility(
        "PUBLIC"
      );
    };

  const handleCreate =
    async () => {
      if (
        !user ||
        !title.trim()
      ) {
        return;
      }

      try {
        setCreating(true);

        const competitionId =
          await createCompetition(
            {
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

              metric,

              entryType:
                "FREE",

              maxParticipants:
                100,

              startingCapital:
                0,

              currency:
                "INR",

              prizeEnabled:
                false,

              rules: [
                "Participants must use truthful performance data.",
                "Leaderboard rankings are calculated by the selected metric.",
                "Manipulation or fraudulent activity may result in disqualification.",
                "Competition mechanics are subject to Vault1 rules and applicable regulations.",
              ],
            }
          );

        resetForm();

        setModalVisible(
          false
        );

        await loadCompetitions();

        router.push({
          pathname:
            "/competitions/[competitionId]",

          params: {
            competitionId,
          },
        });
      } catch (error) {
        console.error(
          "Failed to create competition:",
          error
        );
      } finally {
        setCreating(
          false
        );
      }
    };

  const handleActivate =
    async (
      competition: Competition
    ) => {
      if (!user) return;

      try {
        await activateCompetition(
          competition.id,
          user.uid
        );

        await loadCompetitions();
      } catch (error) {
        console.error(
          error
        );
      }
    };

  const handleComplete =
    async (
      competition: Competition
    ) => {
      if (!user) return;

      try {
        await completeCompetition(
          competition.id,
          user.uid
        );

        await loadCompetitions();
      } catch (error) {
        console.error(
          error
        );
      }
    };

  const handleCancel =
    async (
      competition: Competition
    ) => {
      if (!user) return;

      try {
        await cancelCompetition(
          competition.id,
          user.uid
        );

        await loadCompetitions();
      } catch (error) {
        console.error(
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
              COMMUNITY / COMPETITIONS
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Competitions
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Structured trader challenges,
              transparent rankings and
              performance-based competition.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              setModalVisible(
                true
              )
            }
            style={({
              pressed,
            }) => [
              styles.primaryButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              + CREATE COMPETITION
            </Text>
          </Pressable>
        </View>

        <View
          style={
            styles.metricsRow
          }
        >
          <Metric
            label="TOTAL"
            value={summary.total}
          />

          <Metric
            label="ACTIVE"
            value={summary.active}
            accent
          />

          <Metric
            label="SCHEDULED"
            value={
              summary.scheduled
            }
          />

          <Metric
            label="PARTICIPANTS"
            value={
              summary.participants
            }
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
                Your Competitions
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                Build structured challenges for
                your Vault1 community.
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
          ) : competitions.length ===
            0 ? (
            <EmptyState
              onCreate={() =>
                setModalVisible(
                  true
                )
              }
            />
          ) : (
            <View
              style={
                styles.list
              }
            >
              {competitions.map(
                (
                  competition
                ) => (
                  <CompetitionRow
                    key={
                      competition.id
                    }
                    competition={
                      competition
                    }
                    onOpen={() =>
                      router.push({
                        pathname:
                          "/competitions/[competitionId]",
                        params: {
                          competitionId:
                            competition.id,
                        },
                      })
                    }
                    onActivate={() =>
                      handleActivate(
                        competition
                      )
                    }
                    onComplete={() =>
                      handleComplete(
                        competition
                      )
                    }
                    onCancel={() =>
                      handleCancel(
                        competition
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
                    COMPETITION ENGINE
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Create Competition
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
                TITLE
              </Text>

              <TextInput
                value={
                  title
                }
                onChangeText={
                  setTitle
                }
                placeholder="e.g. Vault1 Monthly Trader Challenge"
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
                placeholder="Describe the competition..."
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
                  (
                    item
                  ) => (
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
                RANKING METRIC
              </Text>

              <View
                style={
                  styles.chips
                }
              >
                {metrics.map(
                  (
                    item
                  ) => (
                    <Pressable
                      key={
                        item.value
                      }
                      onPress={() =>
                        setMetric(
                          item.value
                        )
                      }
                      style={[
                        styles.chip,
                        metric ===
                          item.value &&
                          styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          metric ===
                            item.value &&
                            styles.chipTextActive,
                        ]}
                      >
                        {
                          item.label
                        }
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
                  (
                    item
                  ) => (
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

              <View
                style={
                  styles.gateNotice
                }
              >
                <Text
                  style={
                    styles.gateNoticeTitle
                  }
                >
                  REWARDS / ENTRY FEES
                </Text>

                <Text
                  style={
                    styles.gateNoticeText
                  }
                >
                  This competition is created as
                  a free software challenge. Paid
                  entry, monetary prizes and money
                  handling are intentionally disabled
                  until the applicable legal and
                  regulatory structure is reviewed.
                </Text>
              </View>

              <Pressable
                disabled={
                  creating ||
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
                    creating) &&
                    styles.disabled,

                  pressed &&
                    styles.pressed,
                ]}
              >
                {creating ? (
                  <ActivityIndicator />
                ) : (
                  <Text
                    style={
                      styles.createButtonText
                    }
                  >
                    CREATE COMPETITION
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
  accent,
}: {
  label: string;
  value: number;
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

function EmptyState({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
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
          #
        </Text>
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        No competitions yet
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        Create structured trader challenges
        and give your community a transparent
        performance leaderboard.
      </Text>

      <Pressable
        onPress={
          onCreate
        }
        style={
          styles.secondaryButton
        }
      >
        <Text
          style={
            styles.secondaryButtonText
          }
        >
          CREATE FIRST COMPETITION
        </Text>
      </Pressable>
    </View>
  );
}

function CompetitionRow({
  competition,
  onOpen,
  onActivate,
  onComplete,
  onCancel,
}: {
  competition: Competition;
  onOpen: () => void;
  onActivate: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const statusClass =
    competition.status ===
    "ACTIVE"
      ? styles.activeStatus
      : undefined;

  return (
    <View
      style={
        styles.row
      }
    >
      <View
        style={
          styles.rowMain
        }
      >
        <View
          style={
            styles.statusRow
          }
        >
          <View
            style={[
              styles.statusDot,
              competition.status ===
                "ACTIVE" &&
                styles.activeDot,
            ]}
          />

          <Text
            style={[
              styles.statusText,
              statusClass,
            ]}
          >
            {
              competition.status
            }
          </Text>
        </View>

        <Text
          style={
            styles.rowTitle
          }
        >
          {
            competition.title
          }
        </Text>

        <Text
          style={
            styles.rowDescription
          }
        >
          {
            competition.description ||
            "No description provided."
          }
        </Text>

        <View
          style={
            styles.metaRow
          }
        >
          <Text
            style={
              styles.meta
            }
          >
            {
              competition.category
            }
          </Text>

          <Text
            style={
              styles.divider
            }
          >
            •
          </Text>

          <Text
            style={
              styles.meta
            }
          >
            {
              competition.metric
            }
          </Text>

          <Text
            style={
              styles.divider
            }
          >
            •
          </Text>

          <Text
            style={
              styles.meta
            }
          >
            {
              competition.participantCount
            }{" "}
            participants
          </Text>
        </View>
      </View>

      <View
        style={
          styles.actions
        }
      >
        {competition.status ===
          "SCHEDULED" && (
          <Pressable
            onPress={
              onActivate
            }
            style={
              styles.actionButton
            }
          >
            <Text
              style={
                styles.actionText
              }
            >
              ACTIVATE
            </Text>
          </Pressable>
        )}

        {competition.status ===
          "ACTIVE" && (
          <Pressable
            onPress={
              onComplete
            }
            style={
              styles.actionButton
            }
          >
            <Text
              style={
                styles.actionText
              }
            >
              COMPLETE
            </Text>
          </Pressable>
        )}

        {(competition.status ===
          "SCHEDULED" ||
          competition.status ===
            "ACTIVE") && (
          <Pressable
            onPress={
              onCancel
            }
            style={
              styles.cancelButton
            }
          >
            <Text
              style={
                styles.cancelText
              }
            >
              CANCEL
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={
            onOpen
          }
          style={
            styles.viewButton
          }
        >
          <Text
            style={
              styles.viewText
            }
          >
            OPEN
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        "#060606",
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
      color: "#F4F4F4",
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
      maxWidth: 760,
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
      color: "#FFF",
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
      color: "#F1F1F1",
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

    list: {
      padding: 10,
    },

    row: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      padding: 22,
      minHeight: 155,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#202020",
    },

    rowMain: {
      flex: 1,
      paddingRight: 30,
    },

    statusRow: {
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

    activeDot: {
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

    activeStatus: {
      color: "#A78BFA",
    },

    rowTitle: {
      color: "#EEE",
      fontSize: 21,
      fontWeight:
        "800",
      marginTop: 10,
    },

    rowDescription: {
      color: "#666",
      fontSize: 13,
      lineHeight: 19,
      marginTop: 7,
    },

    metaRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      marginTop: 14,
    },

    meta: {
      color: "#555",
      fontSize: 9,
      fontWeight:
        "800",
    },

    divider: {
      color: "#333",
    },

    actions: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 8,
    },

    actionButton: {
      borderWidth: 1,
      borderColor:
        "#4C3772",
      backgroundColor:
        "#17121F",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },

    actionText: {
      color: "#B99CFF",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
    },

    cancelButton: {
      borderWidth: 1,
      borderColor:
        "#3A2727",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },

    cancelText: {
      color: "#956565",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
    },

    viewButton: {
      borderWidth: 1,
      borderColor:
        "#333",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },

    viewText: {
      color: "#AAA",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
    },

    empty: {
      minHeight: 400,
      alignItems:
        "center",
      justifyContent:
        "center",
      paddingHorizontal: 30,
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#17131F",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 20,
    },

    emptyIconText: {
      color: "#A78BFA",
      fontSize: 30,
      fontWeight:
        "900",
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
      maxWidth: 520,
      textAlign:
        "center",
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
      letterSpacing:
        1,
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
      maxWidth: 760,
      maxHeight: "92%",
    },

    modalContent: {
      padding: 30,
    },

    modalHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginBottom: 28,
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
      color: "#F2F2F2",
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
        "#0B0B0B",
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
        "#181121",
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
        "#181121",
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

    gateNotice: {
      borderWidth: 1,
      borderColor:
        "#3A3150",
      backgroundColor:
        "#100D16",
      padding: 15,
      marginTop: 25,
      borderRadius: 8,
    },

    gateNoticeTitle: {
      color: "#A78BFA",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    gateNoticeText: {
      color: "#777",
      fontSize: 11,
      lineHeight: 18,
      marginTop: 7,
    },

    createButton: {
      backgroundColor:
        "#8B5CF6",
      paddingVertical: 16,
      alignItems:
        "center",
      borderRadius: 9,
      marginTop: 24,
    },

    createButtonText: {
      color: "#FFF",
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
      opacity: 0.72,
      transform: [
        {
          translateY: 1,
        },
      ],
    },
  });