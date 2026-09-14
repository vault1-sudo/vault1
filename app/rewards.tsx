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

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  getRewardDefinitions,
  getRewardSummary,
  getUserRewards,
  claimReward,
} from "../services/rewards/rewardService";

import {
  RewardDefinition,
  RewardSummary,
  UserReward,
} from "../types/reward";

const filters = [
  "ALL",
  "TRADING",
  "CREATOR",
  "COMMUNITY",
  "COMPETITION",
  "LEARNING",
  "MILESTONE",
  "STREAK",
];

export default function RewardsScreen() {
  const { user } = useAuth();

  const [summary, setSummary] =
    useState<RewardSummary | null>(
      null
    );

  const [definitions, setDefinitions] =
    useState<RewardDefinition[]>(
      []
    );

  const [userRewards, setUserRewards] =
    useState<UserReward[]>(
      []
    );

  const [filter, setFilter] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [claiming, setClaiming] =
    useState<string | null>(
      null
    );

  async function load() {
    if (!user) {
      return;
    }

    try {
      setLoading(true);

      const [
        rewardSummary,
        rewardDefinitions,
        earnedRewards,
      ] =
        await Promise.all([
          getRewardSummary(
            user.uid
          ),
          getRewardDefinitions(),
          getUserRewards(
            user.uid
          ),
        ]);

      setSummary(
        rewardSummary
      );

      setDefinitions(
        rewardDefinitions
      );

      setUserRewards(
        earnedRewards
      );
    } catch (error) {
      console.error(
        "Rewards load failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.uid]);

  const visibleDefinitions =
    useMemo(() => {
      if (
        filter ===
        "ALL"
      ) {
        return definitions;
      }

      return definitions.filter(
        (reward) =>
          reward.category ===
          filter
      );
    }, [
      definitions,
      filter,
    ]);

  const recentRewards =
    userRewards.slice(
      0,
      8
    );

  async function handleClaim(
    rewardId: string
  ) {
    if (!user) {
      return;
    }

    try {
      setClaiming(
        rewardId
      );

      await claimReward(
        rewardId,
        user.uid
      );

      await load();
    } catch (error) {
      console.error(
        "Claim failed:",
        error
      );
    } finally {
      setClaiming(null);
    }
  }

  return (
    <View
      style={
        styles.screen
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
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
              VAULT1 / RECOGNITION SYSTEM
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Rewards
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Build reputation through meaningful
              participation across the Vault1 ecosystem.
            </Text>
          </View>

          <View
            style={
              styles.levelBlock
            }
          >
            <Text
              style={
                styles.levelLabel
              }
            >
              CURRENT LEVEL
            </Text>

            <Text
              style={
                styles.levelValue
              }
            >
              {summary?.level ??
                1}
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

            <Text
              style={
                styles.loadingText
              }
            >
              Loading reward system...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={
                styles.metrics
              }
            >
              <Metric
                label="AVAILABLE POINTS"
                value={formatNumber(
                  summary?.totalPoints ??
                    0
                )}
                suffix="PTS"
              />

              <Metric
                label="LIFETIME POINTS"
                value={formatNumber(
                  summary?.lifetimePoints ??
                    0
                )}
                suffix="PTS"
              />

              <Metric
                label="XP"
                value={formatNumber(
                  summary?.xp ??
                    0
                )}
                suffix="XP"
              />

              <Metric
                label="CURRENT STREAK"
                value={String(
                  summary?.currentStreak ??
                    0
                )}
                suffix="DAYS"
              />
            </View>

            <View
              style={
                styles.progressSection
              }
            >
              <VaultSurface
                intensity="medium"
              >
                <View
                  style={
                    styles.progressInner
                  }
                >
                  <View
                    style={
                      styles.progressHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.progressEyebrow
                        }
                      >
                        LEVEL PROGRESSION
                      </Text>

                      <Text
                        style={
                          styles.progressTitle
                        }
                      >
                        Level{" "}
                        {
                          summary?.level
                        }
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.progressPercent
                      }
                    >
                      {Math.round(
                        getProgress(
                          summary
                        )
                      )}
                      %
                    </Text>
                  </View>

                  <View
                    style={
                      styles.progressTrack
                    }
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${getProgress(
                            summary
                          )}%`,
                        },
                      ]}
                    />
                  </View>

                  <View
                    style={
                      styles.progressFooter
                    }
                  >
                    <Text
                      style={
                        styles.progressHint
                      }
                    >
                      {
                        summary?.xp ??
                        0
                      }{" "}
                      XP
                    </Text>

                    <Text
                      style={
                        styles.progressHint
                      }
                    >
                      NEXT LEVEL{" "}
                      {
                        summary?.level ??
                        1
                      }
                    </Text>
                  </View>
                </View>
              </VaultSurface>
            </View>

            <View
              style={
                styles.split
              }
            >
              <VaultSurface
                intensity="subtle"
                style={
                  styles.scoreCard
                }
              >
                <Text
                  style={
                    styles.cardEyebrow
                  }
                >
                  REPUTATION
                </Text>

                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Ecosystem Scores
                </Text>

                <ScoreRow
                  label="Creator"
                  value={
                    summary
                      ? "Active"
                      : "—"
                  }
                />

                <ScoreRow
                  label="Community"
                  value={
                    summary
                      ? "Active"
                      : "—"
                  }
                />

                <ScoreRow
                  label="Trading"
                  value={
                    summary
                      ? "Tracked"
                      : "—"
                  }
                />

                <ScoreRow
                  label="Competition"
                  value={
                    summary
                      ? "Tracked"
                      : "—"
                  }
                />
              </VaultSurface>

              <VaultSurface
                intensity="subtle"
                style={
                  styles.scoreCard
                }
              >
                <Text
                  style={
                    styles.cardEyebrow
                  }
                >
                  ACHIEVEMENTS
                </Text>

                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  Recognition
                </Text>

                <View
                  style={
                    styles.achievementStats
                  }
                >
                  <View>
                    <Text
                      style={
                        styles.achievementNumber
                      }
                    >
                      {
                        summary?.achievementCount ??
                        0
                      }
                    </Text>

                    <Text
                      style={
                        styles.achievementLabel
                      }
                    >
                      ACHIEVEMENTS
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.achievementNumber
                      }
                    >
                      {
                        summary?.badgeCount ??
                        0
                      }
                    </Text>

                    <Text
                      style={
                        styles.achievementLabel
                      }
                    >
                      BADGES
                    </Text>
                  </View>

                  <View>
                    <Text
                      style={
                        styles.achievementNumber
                      }
                    >
                      {
                        summary?.longestStreak ??
                        0
                      }
                    </Text>

                    <Text
                      style={
                        styles.achievementLabel
                      }
                    >
                      BEST STREAK
                    </Text>
                  </View>
                </View>
              </VaultSurface>
            </View>

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
                  Reward Catalog
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Milestones and recognition available
                  across Vault1.
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filterRow
              }
            >
              {filters.map(
                (item) => (
                  <Pressable
                    key={
                      item
                    }
                    onPress={() =>
                      setFilter(
                        item
                      )
                    }
                    style={[
                      styles.filter,
                      filter ===
                        item &&
                        styles.filterActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        filter ===
                          item &&
                          styles.filterTextActive,
                      ]}
                    >
                      {
                        item
                      }
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>

            <View
              style={
                styles.rewardGrid
              }
            >
              {visibleDefinitions.map(
                (reward) => (
                  <RewardCard
                    key={
                      reward.id
                    }
                    reward={
                      reward
                    }
                  />
                )
              )}

              {visibleDefinitions.length ===
                0 && (
                <VaultSurface
                  style={
                    styles.empty
                  }
                >
                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No rewards in this category
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    New recognition milestones will appear
                    here as the Vault1 ecosystem grows.
                  </Text>
                </VaultSurface>
              )}
            </View>

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
                  Your Rewards
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Recognition already earned by this account.
                </Text>
              </View>
            </View>

            {recentRewards.length ===
            0 ? (
              <VaultSurface>
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
                    Your reward history starts here
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Participate in Vault1 to build XP,
                    points, achievements and reputation.
                  </Text>
                </View>
              </VaultSurface>
            ) : (
              <View
                style={
                  styles.earnedList
                }
              >
                {recentRewards.map(
                  (
                    reward
                  ) => (
                    <VaultSurface
                      key={
                        reward.id
                      }
                      intensity="subtle"
                      style={
                        styles.earnedCard
                      }
                    >
                      <View
                        style={
                          styles.rewardIcon
                        }
                      >
                        <Text
                          style={
                            styles.rewardIconText
                          }
                        >
                          ★
                        </Text>
                      </View>

                      <View
                        style={
                          styles.earnedMain
                        }
                      >
                        <Text
                          style={
                            styles.earnedName
                          }
                        >
                          {
                            reward.rewardName
                          }
                        </Text>

                        <Text
                          style={
                            styles.earnedMeta
                          }
                        >
                          {
                            reward.category
                          }{" "}
                          · +
                          {
                            reward.pointsAwarded
                          }{" "}
                          points · +
                          {
                            reward.xpAwarded
                          }{" "}
                          XP
                        </Text>
                      </View>

                      <View
                        style={
                          styles.statusPill
                        }
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {
                            reward.status
                          }
                        </Text>
                      </View>
                    </VaultSurface>
                  )
                )}
              </View>
            )}

            <VaultSurface
              intensity="subtle"
              style={
                styles.legalCard
              }
            >
              <Text
                style={
                  styles.legalTitle
                }
              >
                REWARD SYSTEM STATUS
              </Text>

              <Text
                style={
                  styles.legalText
                }
              >
                Vault1 points, XP, achievements and
                recognition are currently non-cash
                platform rewards. Monetary reward and
                prize mechanics remain disabled pending
                applicable legal and regulatory review.
              </Text>
            </VaultSurface>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
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

      <View
        style={
          styles.metricValueRow
        }
      >
        <Text
          style={
            styles.metricValue
          }
        >
          {value}
        </Text>

        <Text
          style={
            styles.metricSuffix
          }
        >
          {suffix}
        </Text>
      </View>
    </VaultSurface>
  );
}

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.scoreRow
      }
    >
      <Text
        style={
          styles.scoreLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.scoreValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function RewardCard({
  reward,
}: {
  reward: RewardDefinition;
}) {
  return (
    <VaultSurface
      intensity="subtle"
      style={
        styles.rewardCard
      }
    >
      <View
        style={
          styles.rewardCardTop
        }
      >
        <View
          style={
            styles.rewardIconLarge
          }
        >
          <Text
            style={
              styles.rewardIconLargeText
            }
          >
            {reward.icon}
          </Text>
        </View>

        <View
          style={
            styles.rewardType
          }
        >
          <Text
            style={
              styles.rewardTypeText
            }
          >
            {reward.type}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.rewardName
        }
      >
        {reward.name}
      </Text>

      <Text
        style={
          styles.rewardDescription
        }
        numberOfLines={
          3
        }
      >
        {
          reward.description
        }
      </Text>

      <View
        style={
          styles.rewardBottom
        }
      >
        <View>
          <Text
            style={
              styles.rewardPoints
            }
          >
            +{reward.points}
          </Text>

          <Text
            style={
              styles.rewardPointsLabel
            }
          >
            POINTS
          </Text>
        </View>

        <View
          style={
            styles.xpBlock
          }
        >
          <Text
            style={
              styles.rewardXp
            }
          >
            +{reward.xp}
          </Text>

          <Text
            style={
              styles.rewardPointsLabel
            }
          >
            XP
          </Text>
        </View>
      </View>
    </VaultSurface>
  );
}

function getProgress(
  summary: RewardSummary | null
) {
  if (!summary) {
    return 0;
  }

  const level =
    summary.level;

  const previous =
    level <= 1
      ? 0
      : level === 2
      ? 100
      : level === 3
      ? 250
      : level === 4
      ? 500
      : level === 5
      ? 1000
      : level === 6
      ? 1750
      : level === 7
      ? 2750
      : level === 8
      ? 4000
      : level === 9
      ? 5500
      : 7500 +
        (level - 10) *
          2500;

  const next =
    level === 1
      ? 100
      : level === 2
      ? 250
      : level === 3
      ? 500
      : level === 4
      ? 1000
      : level === 5
      ? 1750
      : level === 6
      ? 2750
      : level === 7
      ? 4000
      : level === 8
      ? 5500
      : level === 9
      ? 7500
      : 7500 +
        (level - 9) *
          2500;

  if (
    next <=
    previous
  ) {
    return 100;
  }

  return Math.max(
    0,
    Math.min(
      100,
      ((summary.xp -
        previous) /
        (next -
          previous)) *
        100
    )
  );
}

function formatNumber(
  value: number
) {
  if (
    value >=
    1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(1)}M`;
  }

  if (
    value >=
    1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(1)}K`;
  }

  return String(
    Math.round(value)
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
      paddingBottom: 100,
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

    eyebrow: {
      color: "#75618F",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        2,
      marginBottom: 9,
    },

    title: {
      color: "#3F3F3B",
      fontSize: 45,
      fontWeight:
        "900",
      letterSpacing:
        -1.5,
    },

    subtitle: {
      color: "#707070",
      fontSize: 14,
      lineHeight: 21,
      marginTop: 8,
      maxWidth: 650,
    },

    levelBlock: {
      alignItems:
        "flex-end",
    },

    levelLabel: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
    },

    levelValue: {
      color: "#B99BEF",
      fontSize: 45,
      fontWeight:
        "900",
      marginTop: 4,
    },

    metrics: {
      flexDirection:
        "row",
      gap: 12,
      marginBottom: 18,
    },

    metric: {
      flex: 1,
      minHeight: 120,
      padding: 20,
    },

    metricLabel: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.2,
    },

    metricValueRow: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      marginTop: 22,
      gap: 7,
    },

    metricValue: {
      color: "#ECECEC",
      fontSize: 29,
      fontWeight:
        "900",
    },

    metricSuffix: {
      color: "#666",
      fontSize: 8,
      fontWeight:
        "900",
      marginBottom: 5,
    },

    progressSection: {
      marginBottom: 18,
    },

    progressInner: {
      padding: 23,
    },

    progressHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
    },

    progressEyebrow: {
      color: "#625176",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
    },

    progressTitle: {
      color: "#5F5F5B",
      fontSize: 23,
      fontWeight:
        "800",
      marginTop: 6,
    },

    progressPercent: {
      color: "#B89BEF",
      fontSize: 27,
      fontWeight:
        "900",
    },

    progressTrack: {
      height: 7,
      backgroundColor:
        "#111111",
      borderRadius: 4,
      marginTop: 20,
      overflow:
        "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor:
        "#7951A9",
    },

    progressFooter: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginTop: 9,
    },

    progressHint: {
      color: "#505050",
      fontSize: 8,
      fontWeight:
        "800",
      letterSpacing:
        0.8,
    },

    split: {
      flexDirection:
        "row",
      gap: 14,
      marginBottom: 35,
    },

    scoreCard: {
      flex: 1,
      padding: 22,
      minHeight: 190,
    },

    cardEyebrow: {
      color: "#5B476F",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
    },

    cardTitle: {
      color: "#5F5F5B",
      fontSize: 21,
      fontWeight:
        "800",
      marginTop: 7,
      marginBottom: 17,
    },

    scoreRow: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor:
        "#202020",
    },

    scoreLabel: {
      color: "#666",
      fontSize: 11,
    },

    scoreValue: {
      color: "#B49ADA",
      fontSize: 10,
      fontWeight:
        "800",
    },

    achievementStats: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      marginTop: 14,
    },

    achievementNumber: {
      color: "#4A4A46",
      fontSize: 28,
      fontWeight:
        "900",
    },

    achievementLabel: {
      color: "#555",
      fontSize: 7,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
      marginTop: 5,
    },

    sectionHeader: {
      marginBottom: 15,
    },

    sectionTitle: {
      color: "#EAEAEA",
      fontSize: 23,
      fontWeight:
        "800",
    },

    sectionSubtitle: {
      color: "#555",
      fontSize: 11,
      marginTop: 5,
    },

    filterRow: {
      gap: 7,
      marginBottom: 17,
    },

    filter: {
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 6,
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    filterActive: {
      backgroundColor:
        "#111111",
      borderColor:
        "#684999",
    },

    filterText: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        0.9,
    },

    filterTextActive: {
      color: "#B89AEF",
    },

    rewardGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 13,
      marginBottom: 36,
    },

    rewardCard: {
      width:
        "32.35%" as any,
      minHeight: 245,
      padding: 20,
    },

    rewardCardTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    rewardIconLarge: {
      width: 48,
      height: 48,
      borderRadius: 9,
      backgroundColor:
        "#111111",
      borderWidth: 1,
      borderColor:
        "#392A4C",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    rewardIconLargeText: {
      color: "#B99BEF",
      fontSize: 21,
      fontWeight:
        "900",
    },

    rewardType: {
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 5,
    },

    rewardTypeText: {
      color: "#656565",
      fontSize: 7,
      fontWeight:
        "900",
    },

    rewardName: {
      color: "#5F5F5B",
      fontSize: 18,
      fontWeight:
        "800",
      marginTop: 19,
    },

    rewardDescription: {
      color: "#696969",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 8,
      minHeight: 51,
    },

    rewardBottom: {
      flexDirection:
        "row",
      alignItems:
        "flex-end",
      gap: 25,
      marginTop: 21,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor:
        "#222",
    },

    xpBlock: {
      alignItems: "flex-start",
    },

    rewardPoints: {
      color: "#C0A5EF",
      fontSize: 19,
      fontWeight:
        "900",
    },

    rewardXp: {
      color: "#858585",
      fontSize: 19,
      fontWeight:
        "900",
    },

    rewardPointsLabel: {
      color: "#4F4F4F",
      fontSize: 7,
      fontWeight:
        "900",
      letterSpacing:
        0.8,
      marginTop: 2,
    },

    earnedList: {
      gap: 10,
      marginBottom: 30,
    },

    earnedCard: {
      padding: 16,
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    rewardIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor:
        "#111111",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginRight: 13,
    },

    rewardIconText: {
      color: "#AD91D9",
      fontSize: 16,
    },

    earnedMain: {
      flex: 1,
    },

    earnedName: {
      color: "#DADADA",
      fontSize: 13,
      fontWeight:
        "800",
    },

    earnedMeta: {
      color: "#555",
      fontSize: 9,
      marginTop: 4,
    },

    statusPill: {
      borderWidth: 1,
      borderColor:
        "#3B3047",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 5,
    },

    statusText: {
      color: "#8F79A8",
      fontSize: 7,
      fontWeight:
        "900",
    },

    legalCard: {
      padding: 19,
      marginTop: 20,
    },

    legalTitle: {
      color: "#6D557E",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.3,
    },

    legalText: {
      color: "#555",
      fontSize: 10,
      lineHeight: 17,
      marginTop: 7,
      maxWidth: 900,
    },

    empty: {
      width:
        "100%" as any,
      minHeight: 180,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    emptyTitle: {
      color: "#DADADA",
      fontSize: 18,
      fontWeight:
        "800",
    },

    emptyText: {
      color: "#555",
      fontSize: 11,
      lineHeight: 18,
      textAlign:
        "center",
      maxWidth: 500,
      marginTop: 7,
    },

    loading: {
      minHeight: 500,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color: "#555",
      fontSize: 11,
      marginTop: 9,
    },
  });