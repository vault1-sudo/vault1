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
  TextInput,
  View,
} from "react-native";

import {
  router,
} from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import {
  getLeaderboard,
} from "../services/leaderboard/leaderboardService";

import {
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
} from "../types/leaderboard";

const periods: {
  label: string;
  value: LeaderboardPeriod;
}[] = [
  {
    label: "7 DAYS",
    value: "WEEK",
  },
  {
    label: "30 DAYS",
    value: "MONTH",
  },
  {
    label: "1 YEAR",
    value: "YEAR",
  },
  {
    label: "ALL TIME",
    value: "ALL_TIME",
  },
];

const metrics: {
  label: string;
  value: LeaderboardMetric;
}[] = [
  {
    label: "RETURN %",
    value: "RETURN_PERCENT",
  },
  {
    label: "P&L",
    value: "PROFIT",
  },
  {
    label: "WIN RATE",
    value: "WIN_RATE",
  },
  {
    label: "PROFIT FACTOR",
    value: "PROFIT_FACTOR",
  },
  {
    label: "RISK ADJUSTED",
    value: "RISK_ADJUSTED",
  },
  {
    label: "CONSISTENCY",
    value: "CONSISTENCY",
  },
];

export default function LeaderboardScreen() {
  const [
    period,
    setPeriod,
  ] =
    useState<LeaderboardPeriod>(
      "ALL_TIME"
    );

  const [
    metric,
    setMetric,
  ] =
    useState<LeaderboardMetric>(
      "RETURN_PERCENT"
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    entries,
    setEntries,
  ] = useState<
    LeaderboardEntry[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const load =
    async () => {
      try {
        setLoading(true);

        const result =
          await getLeaderboard(
            period,
            metric
          );

        setEntries(
          result
        );
      } catch (error) {
        console.error(
          "Failed to load leaderboard:",
          error
        );

        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, [
    period,
    metric,
  ]);

  const filteredEntries =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return entries;
      }

      return entries.filter(
        (entry) =>
          entry.displayName
            .toLowerCase()
            .includes(query) ||
          entry.username
            .toLowerCase()
            .includes(query)
      );
    }, [
      entries,
      search,
    ]);

  const topThree =
    filteredEntries.slice(
      0,
      3
    );

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
              COMMUNITY / GLOBAL RANKINGS
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Leaderboard
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Discover public trader performance
              across the Vault1 community.
            </Text>
          </View>

          <View
            style={
              styles.searchContainer
            }
          >
            <Text
              style={
                styles.searchIcon
              }
            >
              /
            </Text>

            <TextInput
              value={
                search
              }
              onChangeText={
                setSearch
              }
              placeholder="Search traders..."
              placeholderTextColor="#555"
              style={
                styles.searchInput
              }
            />
          </View>
        </View>

        <View
          style={
            styles.filterSection
          }
        >
          <View>
            <Text
              style={
                styles.filterLabel
              }
            >
              PERIOD
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {periods.map(
                (
                  item
                ) => (
                  <Pressable
                    key={
                      item.value
                    }
                    onPress={() =>
                      setPeriod(
                        item.value
                      )
                    }
                    style={[
                      styles.chip,
                      period ===
                        item.value &&
                        styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        period ===
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
          </View>

          <View
            style={
              styles.metricFilter
            }
          >
            <Text
              style={
                styles.filterLabel
              }
            >
              RANK BY
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
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
            </ScrollView>
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
              Loading rankings...
            </Text>
          </View>
        ) : (
          <>
            {topThree.length >
              0 && (
              <View
                style={
                  styles.podium
                }
              >
                {topThree.map(
                  (
                    entry,
                    index
                  ) => (
                    <PodiumCard
                      key={
                        entry.id
                      }
                      entry={
                        entry
                      }
                      position={
                        index
                      }
                      onPress={() => {
                        if (
                          entry.username
                        ) {
                          router.push({
                            pathname:
                              "/trader/[username]",
                            params: {
                              username:
                                entry.username,
                            },
                          });
                        }
                      }}
                    />
                  )
                )}
              </View>
            )}

            <VaultSurface
              intensity="medium"
            >
              <View
                style={
                  styles.tableHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Global Rankings
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    {
                      filteredEntries.length
                    }{" "}
                    public traders
                  </Text>
                </View>

                <View
                  style={
                    styles.liveBadge
                  }
                >
                  <View
                    style={
                      styles.liveDot
                    }
                  />

                  <Text
                    style={
                      styles.liveText
                    }
                  >
                    PUBLIC DATA
                  </Text>
                </View>
              </View>

              {filteredEntries.length ===
              0 ? (
                <EmptyState />
              ) : (
                <View
                  style={
                    styles.table
                  }
                >
                  {filteredEntries.map(
                    (
                      entry,
                      index
                    ) => (
                      <LeaderboardRow
                        key={
                          entry.id
                        }
                        entry={
                          entry
                        }
                        rank={
                          index + 1
                        }
                        metric={
                          metric
                        }
                        onPress={() => {
                          if (
                            entry.username
                          ) {
                            router.push({
                              pathname:
                                "/trader/[username]",
                              params: {
                                username:
                                  entry.username,
                              },
                            });
                          }
                        }}
                      />
                    )
                  )}
                </View>
              )}
            </VaultSurface>

            <View
              style={
                styles.disclaimer
              }
            >
              <Text
                style={
                  styles.disclaimerTitle
                }
              >
                PERFORMANCE DATA
              </Text>

              <Text
                style={
                  styles.disclaimerText
                }
              >
                Leaderboard performance is displayed
                from public Vault1 community profiles.
                Unverified figures are self-reported and
                should not be treated as audited results,
                investment advice or a guarantee of future
                performance.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function PodiumCard({
  entry,
  position,
  onPress,
}: {
  entry: LeaderboardEntry;
  position: number;
  onPress: () => void;
}) {
  const medals = [
    "01",
    "02",
    "03",
  ];

  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.podiumCard,
        position === 0 &&
          styles.podiumWinner,
        pressed &&
          styles.pressed,
      ]}
    >
      <Text
        style={
          styles.podiumRank
        }
      >
        {medals[position]}
      </Text>

      <View
        style={
          styles.podiumAvatar
        }
      >
        <Text
          style={
            styles.podiumAvatarText
          }
        >
          {entry.displayName
            .charAt(0)
            .toUpperCase()}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={
          styles.podiumName
        }
      >
        {
          entry.displayName
        }
      </Text>

      <Text
        style={
          styles.podiumReturn
        }
      >
        {entry.returnPercent >=
        0
          ? "+"
          : ""}
        {entry.returnPercent.toFixed(
          2
        )}
        %
      </Text>

      <View
        style={
          styles.verifiedRow
        }
      >
        <View
          style={[
            styles.verifiedDot,
            entry.verified &&
              styles.verifiedActive,
          ]}
        />

        <Text
          style={
            styles.verifiedText
          }
        >
          {entry.verified
            ? "VERIFIED"
            : "UNVERIFIED"}
        </Text>
      </View>
    </Pressable>
  );
}

function LeaderboardRow({
  entry,
  rank,
  metric,
  onPress,
}: {
  entry: LeaderboardEntry;
  rank: number;
  metric: LeaderboardMetric;
  onPress: () => void;
}) {
  const movement =
    entry.previousRank > 0
      ? entry.previousRank -
        rank
      : 0;

  const metricValue =
    getMetricValue(
      entry,
      metric
    );

  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.row,
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.rankColumn
        }
      >
        <Text
          style={
            styles.rank
          }
        >
          {rank}
        </Text>

        {movement !==
          0 && (
          <Text
            style={[
              styles.movement,
              movement >
                0 &&
                styles.movementUp,
              movement <
                0 &&
                styles.movementDown,
            ]}
          >
            {movement >
            0
              ? `↑${movement}`
              : `↓${Math.abs(
                  movement
                )}`}
          </Text>
        )}
      </View>

      <View
        style={
          styles.trader
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
            {entry.displayName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={
            styles.traderInfo
          }
        >
          <View
            style={
              styles.nameRow
            }
          >
            <Text
              style={
                styles.name
              }
            >
              {
                entry.displayName
              }
            </Text>

            {entry.verified && (
              <View
                style={
                  styles.check
                }
              >
                <Text
                  style={
                    styles.checkText
                  }
                >
                  ✓
                </Text>
              </View>
            )}
          </View>

          <Text
            style={
              styles.username
            }
          >
            @{entry.username}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.stat
        }
      >
        <Text
          style={
            styles.statLabel
          }
        >
          RETURN
        </Text>

        <Text
          style={[
            styles.statValue,
            entry.returnPercent >=
              0 &&
              styles.positive,
          ]}
        >
          {entry.returnPercent >=
          0
            ? "+"
            : ""}
          {entry.returnPercent.toFixed(
            2
          )}
          %
        </Text>
      </View>

      <View
        style={
          styles.stat
        }
      >
        <Text
          style={
            styles.statLabel
          }
        >
          WIN RATE
        </Text>

        <Text
          style={
            styles.statValue
          }
        >
          {entry.winRate.toFixed(
            1
          )}
          %
        </Text>
      </View>

      <View
        style={
          styles.scoreColumn
        }
      >
        <Text
          style={
            styles.statLabel
          }
        >
          SCORE
        </Text>

        <Text
          style={
            styles.scoreValue
          }
        >
          {metricValue.toFixed(
            2
          )}
        </Text>
      </View>
    </Pressable>
  );
}

function getMetricValue(
  entry: LeaderboardEntry,
  metric: LeaderboardMetric
) {
  switch (metric) {
    case "PROFIT":
      return entry.profit;

    case "WIN_RATE":
      return entry.winRate;

    case "PROFIT_FACTOR":
      return entry.profitFactor;

    case "RISK_ADJUSTED":
      return entry.riskAdjustedReturn;

    case "CONSISTENCY":
      return entry.consistencyScore;

    case "COMPETITION_SCORE":
      return entry.competitionScore;

    case "RETURN_PERCENT":
    default:
      return entry.returnPercent;
  }
}

function EmptyState() {
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
        No public rankings yet
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        Public trader performance will appear
        here as community profiles publish
        leaderboard data.
      </Text>
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
      paddingBottom: 90,
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
      color: "#777",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        2,
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
      lineHeight: 22,
      marginTop: 9,
    },

    searchContainer: {
      width: 300,
      height: 46,
      flexDirection:
        "row",
      alignItems:
        "center",
      backgroundColor:
        "#101010",
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 9,
      paddingHorizontal: 14,
    },

    searchIcon: {
      color: "#777",
      fontSize: 18,
      fontWeight:
        "800",
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      color: "#EEE",
      fontSize: 13,
    },

    filterSection: {
      flexDirection:
        "row",
      gap: 40,
      marginBottom: 24,
    },

    filterLabel: {
      color: "#555",
      fontSize: 9,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
      marginBottom: 9,
    },

    metricFilter: {
      flex: 1,
    },

    chips: {
      flexDirection:
        "row",
      gap: 8,
    },

    chip: {
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingHorizontal: 13,
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
        "900",
    },

    chipTextActive: {
      color: "#B99CFF",
    },

    podium: {
      flexDirection:
        "row",
      gap: 14,
      marginBottom: 24,
    },

    podiumCard: {
      flex: 1,
      minHeight: 205,
      backgroundColor:
        "#111111",
      borderWidth: 1,
      borderColor:
        "#282828",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 22,
      borderRadius: 12,
    },

    podiumWinner: {
      borderColor:
        "#59418A",
      backgroundColor:
        "#120E18",
    },

    podiumRank: {
      color: "#777",
      fontSize: 10,
      fontWeight:
        "900",
      letterSpacing:
        1,
      marginBottom: 12,
    },

    podiumAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor:
        "#1B1523",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 11,
    },

    podiumAvatarText: {
      color: "#B99CFF",
      fontSize: 17,
      fontWeight:
        "900",
    },

    podiumName: {
      color: "#DDD",
      fontSize: 14,
      fontWeight:
        "800",
      maxWidth: 180,
    },

    podiumReturn: {
      color: "#A78BFA",
      fontSize: 22,
      fontWeight:
        "900",
      marginTop: 8,
    },

    verifiedRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
      marginTop: 9,
    },

    verifiedDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        "#444",
    },

    verifiedActive: {
      backgroundColor:
        "#A78BFA",
    },

    verifiedText: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    tableHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      padding: 23,
      borderBottomWidth:
        1,
      borderBottomColor:
        "#222",
    },

    sectionTitle: {
      color: "#EEE",
      fontSize: 22,
      fontWeight:
        "800",
    },

    sectionSubtitle: {
      color: "#555",
      fontSize: 11,
      marginTop: 5,
    },

    liveBadge: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 7,
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 6,
    },

    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        "#8B5CF6",
    },

    liveText: {
      color: "#666",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1,
    },

    table: {
      paddingHorizontal: 10,
    },

    row: {
      minHeight: 88,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderBottomWidth:
        1,
      borderBottomColor:
        "#191919",
      paddingHorizontal: 12,
    },

    rankColumn: {
      width: 62,
    },

    rank: {
      color: "#DDD",
      fontSize: 18,
      fontWeight:
        "900",
    },

    movement: {
      fontSize: 8,
      fontWeight:
        "900",
      marginTop: 3,
    },

    movementUp: {
      color: "#9B83CC",
    },

    movementDown: {
      color: "#806060",
    },

    trader: {
      flex: 1,
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 12,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor:
        "#19131F",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    avatarText: {
      color: "#B99CFF",
      fontSize: 13,
      fontWeight:
        "900",
    },

    traderInfo: {
      minWidth: 170,
    },

    nameRow: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 6,
    },

    name: {
      color: "#D8D8D8",
      fontSize: 14,
      fontWeight:
        "800",
    },

    username: {
      color: "#555",
      fontSize: 9,
      marginTop: 4,
    },

    check: {
      width: 15,
      height: 15,
      borderRadius: 8,
      backgroundColor:
        "#4B3670",
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    checkText: {
      color: "#D4C4FF",
      fontSize: 9,
      fontWeight:
        "900",
    },

    stat: {
      width: 130,
    },

    statLabel: {
      color: "#555",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1,
      marginBottom: 5,
    },

    statValue: {
      color: "#CCC",
      fontSize: 13,
      fontWeight:
        "800",
    },

    positive: {
      color: "#A78BFA",
    },

    scoreColumn: {
      width: 120,
      alignItems:
        "flex-end",
    },

    scoreValue: {
      color: "#EEE",
      fontSize: 15,
      fontWeight:
        "900",
    },

    empty: {
      minHeight: 350,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 40,
    },

    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        "#17131F",
      alignItems:
        "center",
      justifyContent:
        "center",
      marginBottom: 17,
    },

    emptyIconText: {
      color: "#A78BFA",
      fontSize: 26,
      fontWeight:
        "900",
    },

    emptyTitle: {
      color: "#DDD",
      fontSize: 21,
      fontWeight:
        "800",
    },

    emptyText: {
      color: "#5D5D5D",
      fontSize: 13,
      lineHeight: 20,
      maxWidth: 520,
      textAlign:
        "center",
      marginTop: 9,
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
      marginTop: 10,
    },

    disclaimer: {
      borderWidth: 1,
      borderColor:
        "#292929",
      backgroundColor:
        "#0C0C0C",
      padding: 18,
      marginTop: 20,
      borderRadius: 8,
    },

    disclaimerTitle: {
      color: "#777",
      fontSize: 8,
      fontWeight:
        "900",
      letterSpacing:
        1.4,
    },

    disclaimerText: {
      color: "#555",
      fontSize: 10,
      lineHeight: 17,
      marginTop: 7,
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