import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import VaultSurface from "../../components/ui/VaultSurface";

import { useAuth } from "../../services/auth/AuthProvider";

import { FONT, COLORS } from "../theme/theme";

import {
  getCompetition,
  getCompetitionLeaderboard,
  joinCompetition,
  withdrawFromCompetition,
  subscribeToCompetitionParticipants,
} from "../../services/competitions/competitionService";

import {
  Competition,
  CompetitionLeaderboardRow,
  CompetitionParticipant,
} from "../../types/competition";

export default function CompetitionDetailScreen() {
  const params =
    useLocalSearchParams<{
      competitionId: string;
    }>();

  const competitionId =
    Array.isArray(
      params.competitionId
    )
      ? params.competitionId[0]
      : params.competitionId;

  const {
    user,
    profile,
  } = useAuth();

  const [
    competition,
    setCompetition,
  ] =
    useState<Competition | null>(
      null
    );

  const [
    participants,
    setParticipants,
  ] = useState<
    CompetitionParticipant[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  useEffect(() => {
    if (!competitionId) {
      return;
    }

    const load =
      async () => {
        try {
          const result =
            await getCompetition(
              competitionId
            );

          setCompetition(
            result
          );
        } catch (error) {
          console.error(
            error
          );
        } finally {
          setLoading(
            false
          );
        }
      };

    load();

    const unsubscribe =
      subscribeToCompetitionParticipants(
        competitionId,
        setParticipants
      );

    return () => {
      unsubscribe();
    };
  }, [
    competitionId,
  ]);

  const leaderboard =
    useMemo(
      () =>
        participants
          .filter(
            (
              participant
            ) =>
              participant.status !==
                "WITHDRAWN" &&
              participant.status !==
                "DISQUALIFIED"
          )
          .sort(
            (
              a,
              b
            ) =>
              b.score -
              a.score
          )
          .map(
            (
              participant,
              index
            ) => ({
              rank:
                index + 1,
              participant,
            })
          ),
      [participants]
    );

  const currentParticipant =
    participants.find(
      (participant) =>
        participant.userId ===
        user?.uid
    );

  const handleJoin =
    async () => {
      if (
        !user ||
        !competition
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await joinCompetition({
          competitionId:
            competition.id,

          userId:
            user.uid,

          displayName:
            profile?.displayName ||
            user.displayName ||
            "Vault1 User",
        });

        const refreshed =
          await getCompetition(
            competition.id
          );

        setCompetition(
          refreshed
        );
      } catch (error) {
        console.error(
          error
        );
      } finally {
        setActionLoading(
          false
        );
      }
    };

  const handleWithdraw =
    async () => {
      if (
        !user ||
        !competition
      ) {
        return;
      }

      try {
        setActionLoading(
          true
        );

        await withdrawFromCompetition(
          competition.id,
          user.uid
        );
      } catch (error) {
        console.error(
          error
        );
      } finally {
        setActionLoading(
          false
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

  if (!competition) {
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
          Competition not found.
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
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
          style={
            styles.backButton
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ← BACK TO COMPETITIONS
          </Text>
        </Pressable>

        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerMain
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
                  styles.status,
                  competition.status ===
                    "ACTIVE" &&
                    styles.activeStatus,
                ]}
              >
                {
                  competition.status
                }
              </Text>
            </View>

            <Text
              style={
                styles.title
              }
            >
              {
                competition.title
              }
            </Text>

            <Text
              style={
                styles.description
              }
            >
              {
                competition.description
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
              styles.headerActions
            }
          >
            {competition.status ===
              "ACTIVE" &&
              !currentParticipant && (
                <Pressable
                  disabled={
                    actionLoading
                  }
                  onPress={
                    handleJoin
                  }
                  style={
                    styles.joinButton
                  }
                >
                  {actionLoading ? (
                    <ActivityIndicator />
                  ) : (
                    <Text
                      style={
                        styles.joinText
                      }
                    >
                      JOIN COMPETITION
                    </Text>
                  )}
                </Pressable>
              )}

            {currentParticipant &&
              currentParticipant.status !==
                "WITHDRAWN" && (
                <Pressable
                  disabled={
                    actionLoading
                  }
                  onPress={
                    handleWithdraw
                  }
                  style={
                    styles.withdrawButton
                  }
                >
                  <Text
                    style={
                      styles.withdrawText
                    }
                  >
                    WITHDRAW
                  </Text>
                </Pressable>
              )}
          </View>
        </View>

        <View
          style={
            styles.metrics
          }
        >
          <Metric
            label="PARTICIPANTS"
            value={
              competition.participantCount.toString()
            }
          />

          <Metric
            label="RANKING"
            value={
              competition.metric
            }
          />

          <Metric
            label="ENTRY"
            value="FREE"
          />

          <Metric
            label="PRIZE"
            value={
              competition.prizeEnabled
                ? "ENABLED"
                : "NONE"
            }
          />
        </View>

        <View
          style={
            styles.columns
          }
        >
          <VaultSurface
            intensity="medium"
            style={
              styles.leaderboardCard
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
                  Leaderboard
                </Text>

                <Text
                  style={
                    styles.panelSubtitle
                  }
                >
                  Ranked by{" "}
                  {
                    competition.metric
                  }
                </Text>
              </View>
            </View>

            {leaderboard.length ===
            0 ? (
              <View
                style={
                  styles.empty
                }
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No participants yet
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Be the first trader to
                  join this competition.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.leaderboard
                }
              >
                {leaderboard.map(
                  ({
                    rank,
                    participant,
                  }) => (
                    <LeaderboardRow
                      key={
                        participant.id
                      }
                      rank={
                        rank
                      }
                      participant={
                        participant
                      }
                      highlighted={
                        participant.userId ===
                        user?.uid
                      }
                    />
                  )
                )}
              </View>
            )}
          </VaultSurface>

          <View
            style={
              styles.rightColumn
            }
          >
            <VaultSurface
              intensity="medium"
              style={
                styles.rulesCard
              }
            >
              <Text
                style={
                  styles.panelTitle
                }
              >
                Competition Rules
              </Text>

              <View
                style={
                  styles.rules
                }
              >
                {competition.rules.map(
                  (
                    rule,
                    index
                  ) => (
                    <View
                      key={
                        index
                      }
                      style={
                        styles.rule
                      }
                    >
                      <Text
                        style={
                          styles.ruleNumber
                        }
                      >
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </Text>

                      <Text
                        style={
                          styles.ruleText
                        }
                      >
                        {rule}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </VaultSurface>

            <VaultSurface
              intensity="medium"
              style={
                styles.noticeCard
              }
            >
              <Text
                style={
                  styles.noticeTitle
                }
              >
                COMPETITION STATUS
              </Text>

              <Text
                style={
                  styles.noticeText
                }
              >
                Vault1 currently supports
                free software-based
                competitions. Monetary
                entry fees, prize pools and
                money handling remain
                disabled pending applicable
                legal and regulatory review.
              </Text>
            </VaultSurface>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
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
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </VaultSurface>
  );
}

function LeaderboardRow({
  rank,
  participant,
  highlighted,
}: {
  rank: number;
  participant: CompetitionParticipant;
  highlighted: boolean;
}) {
  return (
    <View
      style={[
        styles.leaderboardRow,
        highlighted &&
          styles.highlightedRow,
      ]}
    >
      <View
        style={
          styles.rank
        }
      >
        <Text
          style={
            styles.rankText
          }
        >
          {rank}
        </Text>
      </View>

      <View
        style={
          styles.player
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
            styles.playerInfo
          }
        >
          <Text
            style={
              styles.playerName
            }
          >
            {
              participant.displayName
            }
          </Text>

          <Text
            style={
              styles.playerMeta
            }
          >
            {
              participant.totalTrades
            }{" "}
            trades
          </Text>
        </View>
      </View>

      <View
        style={
          styles.scoreBlock
        }
      >
        <Text
          style={
            styles.score
          }
        >
          {participant.score.toFixed(
            2
          )}
        </Text>

        <Text
          style={
            styles.returnText
          }
        >
          {participant.returnPercent >=
          0
            ? "+"
            : ""}
          {participant.returnPercent.toFixed(
            2
          )}
          %
        </Text>
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        COLORS.ink,
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        COLORS.ink,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    errorText: {
      color: "#AAA",
      fontSize: 16,
    },

    content: {
      padding: 34,
      paddingBottom: 80,
    },

    backButton: {
      marginBottom: 28,
    },

    backText: {
      color: "#666",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1.2,
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
      marginBottom: 28,
    },

    headerMain: {
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
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        "#555",
    },

    activeDot: {
      backgroundColor:
        "#A78BFA",
    },

    status: {
      color: "#666",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1.4,
    },

    activeStatus: {
      color: "#A78BFA",
    },

    title: {
      color: "#3F3F3B",
      fontSize: 42,
      fontFamily: FONT.black,
      letterSpacing:
        -1.4,
      marginTop: 10,
    },

    description: {
      color: "#777",
      fontSize: 15,
      lineHeight: 22,
      maxWidth: 760,
      marginTop: 10,
    },

    metaRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 9,
      marginTop: 15,
    },

    meta: {
      color: "#555",
      fontSize: 9,
      fontFamily: FONT.extraBold,
    },

    divider: {
      color: "#333",
    },

    headerActions: {
      alignItems:
        "flex-end",
    },

    joinButton: {
      backgroundColor:
        "#8B5CF6",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 9,
    },

    joinText: {
      color: COLORS.ink,
      fontSize: 10,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    withdrawButton: {
      borderWidth: 1,
      borderColor:
        "#3A2727",
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 9,
    },

    withdrawText: {
      color: "#986666",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    metrics: {
      flexDirection:
        "row",
      gap: 14,
      marginBottom: 24,
    },

    metric: {
      flex: 1,
      minHeight: 120,
      padding: 20,
    },

    metricLabel: {
      color: "#666",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1.3,
    },

    metricValue: {
      color: "#EEE",
      fontSize: 25,
      fontFamily: FONT.black,
      marginTop: 24,
    },

    columns: {
      flexDirection:
        "row",
      gap: 20,
    },

    leaderboardCard: {
      flex: 1,
      minHeight: 520,
    },

    rightColumn: {
      width: 400,
      gap: 20,
    },

    rulesCard: {
      minHeight: 320,
      padding: 22,
    },

    noticeCard: {
      padding: 22,
    },

    panelHeader: {
      padding: 22,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#202020",
    },

    panelTitle: {
      color: "#EEE",
      fontSize: 20,
      fontFamily: FONT.extraBold,
    },

    panelSubtitle: {
      color: "#555",
      fontSize: 10,
      marginTop: 5,
    },

    leaderboard: {
      padding: 10,
    },

    leaderboardRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      padding: 15,
      borderBottomWidth:
        1,
      borderBottomColor:
        COLORS.navyLine,
    },

    highlightedRow: {
      backgroundColor:
        COLORS.ink,
    },

    rank: {
      width: 48,
    },

    rankText: {
      color: "#777",
      fontSize: 18,
      fontFamily: FONT.black,
    },

    player: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.ink,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#B99CFF",
      fontSize: 12,
      fontFamily: FONT.black,
    },

    playerInfo: {
      flex: 1,
    },

    playerName: {
      color: "#CCC",
      fontSize: 13,
      fontFamily: FONT.extraBold,
    },

    playerMeta: {
      color: "#555",
      fontSize: 9,
      marginTop: 3,
    },

    scoreBlock: {
      width: 100,
      alignItems:
        "flex-end",
    },

    score: {
      color: "#EEE",
      fontSize: 15,
      fontFamily: FONT.black,
    },

    returnText: {
      color: "#A78BFA",
      fontSize: 9,
      fontFamily: FONT.extraBold,
      marginTop: 3,
    },

    empty: {
      minHeight: 350,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    emptyTitle: {
      color: "#DDD",
      fontSize: 20,
      fontFamily: FONT.extraBold,
    },

    emptyText: {
      color: "#555",
      fontSize: 13,
      marginTop: 8,
    },

    rules: {
      marginTop: 22,
    },

    rule: {
      flexDirection:
        "row",
      gap: 12,
      marginBottom: 18,
    },

    ruleNumber: {
      color: "#A78BFA",
      fontSize: 9,
      fontFamily: FONT.black,
      width: 25,
    },

    ruleText: {
      color: "#777",
      fontSize: 12,
      lineHeight: 19,
      flex: 1,
    },

    noticeTitle: {
      color: "#A78BFA",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1.2,
    },

    noticeText: {
      color: "#666",
      fontSize: 11,
      lineHeight: 18,
      marginTop: 9,
    },
  });