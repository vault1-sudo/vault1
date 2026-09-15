import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../services/auth/AuthProvider";

import { FONT, COLORS } from "./theme/theme";

import {
  getUserPortfolio,
} from "../services/portfolio/portfolioService";

import {
  ClosedPosition,
  PortfolioData,
  Position,
} from "../types/position";


const navigation = [
  {
    section: "COMMAND",
    items: ["Dashboard"],
  },
  {
    section: "GROWTH",
    items: [
      "Portfolio",
      "Trading",
      "Growth Missions",
      "Trade Journal",
    ],
  },
  {
    section: "MONEY",
    items: [
      "Capital",
      "Cashflow",
      "Transactions",
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      "Performance",
      "Risk",
      "Reports",
    ],
  },
  {
    section: "INVESTORS",
    items: [
      "Investors",
      "Payouts",
      "Documents",
    ],
  },
];


function formatINR(
  value: number
): string {
  const absolute =
    Math.abs(value);

  return `₹${absolute.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatSignedINR(
  value: number
): string {
  if (value === 0) {
    return "₹0";
  }

  return `${
    value > 0 ? "+" : "-"
  }₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}


function formatPercent(
  value: number
): string {
  return `${
    value >= 0 ? "+" : ""
  }${value.toFixed(2)}%`;
}


function formatDate(
  value: any
): string {
  if (!value) {
    return "—";
  }

  try {
    if (
      typeof value.toDate ===
      "function"
    ) {
      return value
        .toDate()
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        );
    }

    if (value instanceof Date) {
      return value.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    }

    return "—";
  } catch {
    return "—";
  }
}


export default function PortfolioScreen() {
  const { profile } =
    useAuth();

  const userId =
    profile?.uid;


  const [portfolio, setPortfolio] =
    useState<PortfolioData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);


  const loadPortfolio =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (!userId) {
          setPortfolio(null);
          setLoading(false);
          return;
        }

        try {
          if (showLoader) {
            setLoading(true);
          }

          const result =
            await getUserPortfolio(
              userId
            );

          setPortfolio(result);
        } catch (error) {
          console.error(
            "Failed to load portfolio:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [userId]
    );


  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);


  const handleRefresh =
    async () => {
      setRefreshing(true);

      try {
        await loadPortfolio(false);
      } finally {
        setRefreshing(false);
      }
    };


  const summary =
    portfolio?.summary;


  const openPositions =
    portfolio?.openPositions ??
    [];


  const closedPositions =
    portfolio?.closedPositions ??
    [];


  const allocation =
    useMemo(() => {
      if (!openPositions.length) {
        return [];
      }

      const total =
        openPositions.reduce(
          (
            sum: number,
            position: Position
          ) =>
            sum +
            position.currentValue,
          0
        );

      if (total <= 0) {
        return [];
      }

      return openPositions.map(
        (
          position: Position
        ) => ({
          ...position,
          allocation:
            (
              position.currentValue /
              total
            ) *
            100,
        })
      );
    }, [openPositions]);


  const handleNavigation =
    (item: string) => {
      switch (item) {
        case "Dashboard":
          router.replace(
            "/dashboard"
          );
          break;

        case "Portfolio":
          router.push(
            "/portfolio"
          );
          break;

        case "Trading":
          router.push(
            "/trading"
          );
          break;

        case "Capital":
          router.push(
            "/capital"
          );
          break;

        default:
          break;
      }
    };


  return (
    <View style={styles.screen}>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <View style={styles.sidebar} pointerEvents="none">

        <View style={styles.brandBlock}>
          <Text style={styles.brand}>
            VAULT1
          </Text>

          <Text style={styles.brandSub}>
            WEALTH OPERATING SYSTEM
          </Text>
        </View>


        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.sidebarScroll
          }
        >
          {navigation.map(
            (group) => (
              <View
                key={
                  group.section
                }
                style={
                  styles.navGroup
                }
              >
                <Text
                  style={
                    styles.navSection
                  }
                >
                  {group.section}
                </Text>

                {group.items.map(
                  (item) => {
                    const active =
                      item ===
                      "Portfolio";

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          handleNavigation(
                            item
                          )
                        }
                        style={[
                          styles.navItem,
                          active &&
                            styles.navItemActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.navDot,
                            active &&
                              styles.navDotActive,
                          ]}
                        />

                        <Text
                          style={[
                            styles.navText,
                            active &&
                              styles.navTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            )
          )}
        </ScrollView>


        <View
          style={
            styles.sidebarFooter
          }
        >
          <Text
            style={
              styles.sidebarFooterTitle
            }
          >
            POSITION ENGINE
          </Text>

          <Text
            style={
              styles.sidebarFooterText
            }
          >
            Derived from trade ledger
          </Text>
        </View>

      </View>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            tintColor="#A78BFA"
          />
        }
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              VAULT1 / GROWTH / PORTFOLIO
            </Text>

            <Text
              style={styles.title}
            >
              Portfolio
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              One live view of your
              capital, positions,
              exposure and investment
              performance.
            </Text>
          </View>


          <View
            style={
              styles.enginePill
            }
          >
            <View
              style={
                styles.engineDot
              }
            />

            <Text
              style={
                styles.engineText
              }
            >
              POSITION ENGINE
            </Text>
          </View>

        </View>


        {/* =================================================
            HERO
        ================================================= */}

        <View
          style={styles.heroCard}
        >

          <View
            style={
              styles.heroGlow
            }
          />

          <Text
            style={
              styles.heroLabel
            }
          >
            CURRENT PORTFOLIO VALUE
          </Text>

          <Text
            style={
              styles.heroValue
            }
          >
            {loading
              ? "—"
              : formatINR(
                  summary
                    ?.currentValue ??
                    0
                )}
          </Text>

          <View
            style={
              styles.heroBottom
            }
          >

            <View>
              <Text
                style={
                  styles.heroMetaLabel
                }
              >
                TOTAL P&L
              </Text>

              <Text
                style={[
                  styles.heroMetaValue,
                  (
                    summary
                      ?.totalPnL ??
                    0
                  ) > 0 &&
                    styles.positiveText,
                  (
                    summary
                      ?.totalPnL ??
                    0
                  ) < 0 &&
                    styles.negativeText,
                ]}
              >
                {formatSignedINR(
                  summary
                    ?.totalPnL ??
                    0
                )}
              </Text>
            </View>


            <View>
              <Text
                style={
                  styles.heroMetaLabel
                }
              >
                RETURN
              </Text>

              <Text
                style={[
                  styles.heroMetaValue,
                  (
                    summary
                      ?.returnPercent ??
                    0
                  ) > 0 &&
                    styles.positiveText,
                  (
                    summary
                      ?.returnPercent ??
                    0
                  ) < 0 &&
                    styles.negativeText,
                ]}
              >
                {formatPercent(
                  summary
                    ?.returnPercent ??
                    0
                )}
              </Text>
            </View>


            <View>
              <Text
                style={
                  styles.heroMetaLabel
                }
              >
                EXPOSURE
              </Text>

              <Text
                style={
                  styles.heroMetaValue
                }
              >
                {formatINR(
                  summary
                    ?.totalExposure ??
                    0
                )}
              </Text>
            </View>

          </View>

        </View>


        {/* =================================================
            KPI GRID
        ================================================= */}

        <View
          style={
            styles.metricsRow
          }
        >

          <MetricCard
            label="INVESTED"
            value={formatINR(
              summary
                ?.investedCapital ??
                0
            )}
          />

          <MetricCard
            label="CURRENT VALUE"
            value={formatINR(
              summary
                ?.currentValue ??
                0
            )}
            accent
          />

          <MetricCard
            label="REALIZED P&L"
            value={formatSignedINR(
              summary
                ?.realizedPnL ??
                0
            )}
            positive={
              (
                summary
                  ?.realizedPnL ??
                0
              ) > 0
            }
            negative={
              (
                summary
                  ?.realizedPnL ??
                0
              ) < 0
            }
          />

          <MetricCard
            label="UNREALIZED P&L"
            value={formatSignedINR(
              summary
                ?.unrealizedPnL ??
                0
            )}
            positive={
              (
                summary
                  ?.unrealizedPnL ??
                0
              ) > 0
            }
            negative={
              (
                summary
                  ?.unrealizedPnL ??
                0
              ) < 0
            }
          />

        </View>


        {/* =================================================
            POSITION BOOK
        ================================================= */}

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
              Open Positions
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Current holdings derived
              from the trading ledger.
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countBadgeText
              }
            >
              {
                summary
                  ?.openPositionCount ??
                0
              }{" "}
              OPEN
            </Text>
          </View>
        </View>


        <View
          style={styles.positionBook}
        >

          {loading ? (
            <LoadingState />
          ) : openPositions.length ===
            0 ? (
            <EmptyState
              title="No open positions"
              text="Record a trade in Trading and the position engine will build your portfolio automatically."
              action="GO TO TRADING"
              onPress={() =>
                router.push(
                  "/trading"
                )
              }
            />
          ) : (
            <View>

              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.assetColumn,
                  ]}
                >
                  ASSET
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  QTY
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  AVG COST
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  CURRENT
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  VALUE
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  P&L
                </Text>
              </View>


              {openPositions.map(
                (
                  position: Position
                ) => (
                  <View
                    key={
                      position.id
                    }
                    style={
                      styles.positionRow
                    }
                  >

                    <View
                      style={
                        styles.assetColumn
                      }
                    >
                      <Text
                        style={
                          styles.assetName
                        }
                      >
                        {
                          position.symbol
                        }
                      </Text>

                      <Text
                        style={
                          styles.assetMeta
                        }
                      >
                        {
                          position.assetClass
                        }
                      </Text>
                    </View>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {
                        position.quantity
                      }
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {formatINR(
                        position.averagePrice
                      )}
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {formatINR(
                        position.currentPrice
                      )}
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {formatINR(
                        position.currentValue
                      )}
                    </Text>


                    <View
                      style={[
                        styles.numberColumn,
                        styles.pnlCell,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pnlValue,
                          position.unrealizedPnL >
                            0 &&
                            styles.positiveText,
                          position.unrealizedPnL <
                            0 &&
                            styles.negativeText,
                        ]}
                      >
                        {formatSignedINR(
                          position.unrealizedPnL
                        )}
                      </Text>

                      <Text
                        style={
                          styles.pnlPercent
                        }
                      >
                        {formatPercent(
                          position.unrealizedPnLPercent
                        )}
                      </Text>
                    </View>

                  </View>
                )
              )}

            </View>
          )}

        </View>


        {/* =================================================
            PORTFOLIO SPLIT
        ================================================= */}

        <View
          style={
            styles.twoColumn
          }
        >

          <View
            style={
              styles.surfaceCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Allocation
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Current portfolio
              concentration.
            </Text>


            {allocation.length ===
            0 ? (
              <Text
                style={
                  styles.emptyMini
                }
              >
                No allocation data yet.
              </Text>
            ) : (
              <View
                style={
                  styles.allocationList
                }
              >
                {allocation.map(
                  (
                    position: Position & {
                      allocation: number;
                    }
                  ) => (
                    <View
                      key={
                        position.id
                      }
                      style={
                        styles.allocationRow
                      }
                    >

                      <View
                        style={
                          styles.allocationInfo
                        }
                      >
                        <Text
                          style={
                            styles.allocationSymbol
                          }
                        >
                          {
                            position.symbol
                          }
                        </Text>

                        <Text
                          style={
                            styles.allocationValue
                          }
                        >
                          {formatINR(
                            position.currentValue
                          )}
                        </Text>
                      </View>


                      <View
                        style={
                          styles.allocationTrack
                        }
                      >
                        <View
                          style={[
                            styles.allocationFill,
                            {
                              width: `${Math.min(
                                100,
                                position.allocation
                              )}%`,
                            },
                          ]}
                        />
                      </View>


                      <Text
                        style={
                          styles.allocationPercent
                        }
                      >
                        {position.allocation.toFixed(
                          1
                        )}
                        %
                      </Text>

                    </View>
                  )
                )}
              </View>
            )}

          </View>


          <View
            style={
              styles.surfaceCard
            }
          >
            <Text
              style={
                styles.cardTitle
              }
            >
              Portfolio Statistics
            </Text>

            <Text
              style={
                styles.cardSubtitle
              }
            >
              Performance snapshot
              across the position
              engine.
            </Text>


            <StatRow
              label="Open positions"
              value={
                (
                  summary
                    ?.openPositionCount ??
                  0
                ).toString()
              }
            />

            <StatRow
              label="Closed positions"
              value={
                (
                  summary
                    ?.closedPositionCount ??
                  0
                ).toString()
              }
            />

            <StatRow
              label="Winning positions"
              value={
                (
                  summary
                    ?.winningPositions ??
                  0
                ).toString()
              }
            />

            <StatRow
              label="Losing positions"
              value={
                (
                  summary
                    ?.losingPositions ??
                  0
                ).toString()
              }
            />

            <StatRow
              label="Win rate"
              value={`${(
                summary
                  ?.winRate ??
                0
              ).toFixed(1)}%`}
            />

            <StatRow
              label="Total fees"
              value={formatINR(
                summary
                  ?.totalFees ??
                  0
              )}
              last
            />

          </View>

        </View>


        {/* =================================================
            CLOSED POSITIONS
        ================================================= */}

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
              Closed Positions
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Realized performance remains
              part of the portfolio history.
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countBadgeText
              }
            >
              {
                summary
                  ?.closedPositionCount ??
                0
              }{" "}
              CLOSED
            </Text>
          </View>
        </View>


        <View
          style={styles.closedBook}
        >

          {closedPositions.length ===
          0 ? (
            <View
              style={
                styles.closedEmpty
              }
            >
              <Text
                style={
                  styles.closedEmptyTitle
                }
              >
                No closed positions yet
              </Text>

              <Text
                style={
                  styles.closedEmptyText
                }
              >
                Realized results will appear
                here once positions are
                fully closed.
              </Text>
            </View>
          ) : (
            <View>

              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.assetColumn,
                  ]}
                >
                  ASSET
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  QTY
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  AVG ENTRY
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  AVG EXIT
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  REALIZED
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.numberColumn,
                  ]}
                >
                  RETURN
                </Text>
              </View>


              {closedPositions.map(
                (
                  position: ClosedPosition
                ) => (
                  <View
                    key={
                      position.id
                    }
                    style={
                      styles.positionRow
                    }
                  >

                    <View
                      style={
                        styles.assetColumn
                      }
                    >
                      <Text
                        style={
                          styles.assetName
                        }
                      >
                        {
                          position.symbol
                        }
                      </Text>

                      <Text
                        style={
                          styles.assetMeta
                        }
                      >
                        CLOSED{" "}
                        {formatDate(
                          position.closedAt
                        )}
                      </Text>
                    </View>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {
                        position.quantity
                      }
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {formatINR(
                        position.averageEntryPrice
                      )}
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                      ]}
                    >
                      {formatINR(
                        position.averageExitPrice
                      )}
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                        position.realizedPnL >
                          0 &&
                          styles.positiveText,
                        position.realizedPnL <
                          0 &&
                          styles.negativeText,
                      ]}
                    >
                      {formatSignedINR(
                        position.realizedPnL
                      )}
                    </Text>


                    <Text
                      style={[
                        styles.tableValue,
                        styles.numberColumn,
                        position.realizedPnL >
                          0 &&
                          styles.positiveText,
                        position.realizedPnL <
                          0 &&
                          styles.negativeText,
                      ]}
                    >
                      {formatPercent(
                        position.realizedPnLPercent
                      )}
                    </Text>

                  </View>
                )
              )}

            </View>
          )}

        </View>


        {/* =================================================
            ENGINE NOTE
        ================================================= */}

        <View
          style={
            styles.engineNote
          }
        >

          <View
            style={
              styles.engineNoteAccent
            }
          />

          <View
            style={
              styles.engineNoteContent
            }
          >
            <Text
              style={
                styles.engineNoteTitle
              }
            >
              PORTFOLIO SOURCE OF TRUTH
            </Text>

            <Text
              style={
                styles.engineNoteText
              }
            >
              Portfolio positions are derived
              from the authenticated user's
              trading ledger. Open holdings,
              realized performance and closed
              positions are calculated from
              execution history rather than
              maintained as a second manual
              source of truth.
            </Text>
          </View>

        </View>


        <View
          style={styles.footer}
        >
          <Text
            style={styles.footerText}
          >
            VAULT1
          </Text>

          <Text
            style={styles.footerText}
          >
            PRIVATE WEALTH INFRASTRUCTURE
          </Text>
        </View>

      </ScrollView>

    </View>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function MetricCard({
  label,
  value,
  accent = false,
  positive = false,
  negative = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        accent &&
          styles.metricCardAccent,
      ]}
    >
      <View
        style={
          styles.metricTop
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
          style={[
            styles.metricIndicator,
            accent &&
              styles.metricIndicatorAccent,
          ]}
        />
      </View>

      <Text
        style={[
          styles.metricValue,
          positive &&
            styles.positiveText,
          negative &&
            styles.negativeText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}


function LoadingState() {
  return (
    <View
      style={
        styles.loadingState
      }
    >
      <ActivityIndicator
        size="large"
        color="#A78BFA"
      />

      <Text
        style={
          styles.loadingText
        }
      >
        Calculating portfolio...
      </Text>
    </View>
  );
}


function EmptyState({
  title,
  text,
  action,
  onPress,
}: {
  title: string;
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View
      style={
        styles.emptyState
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
          +
        </Text>
      </View>

      <Text
        style={
          styles.emptyTitle
        }
      >
        {title}
      </Text>

      <Text
        style={
          styles.emptyText
        }
      >
        {text}
      </Text>

      <Pressable
        onPress={onPress}
        style={
          styles.emptyButton
        }
      >
        <Text
          style={
            styles.emptyButtonText
          }
        >
          {action}
        </Text>
      </Pressable>
    </View>
  );
}


function StatRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.statRow,
        last &&
          styles.statRowLast,
      ]}
    >
      <Text
        style={
          styles.statLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.statValue
        }
      >
        {value}
      </Text>
    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
  },

  sidebar: {
    display: "none",
    width: 250,
    backgroundColor: COLORS.glassBg,
    borderRightWidth: 1,
    borderRightColor: "#211A2D",
    paddingTop: 34,
    paddingBottom: 24,
  },

  brandBlock: {
    paddingHorizontal: 26,
    marginBottom: 38,
  },

  brand: {
    color: "#3F3F3B",
    fontSize: 27,
    fontFamily: FONT.black,
    letterSpacing: 3,
  },

  brandSub: {
    color: "#746B83",
    fontSize: 8,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.7,
    marginTop: 7,
  },

  sidebarScroll: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },

  navGroup: {
    marginBottom: 27,
  },

  navSection: {
    color: "#62596E",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.8,
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  navItem: {
    minHeight: 45,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#35234D",
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
    marginRight: 13,
  },

  navDotActive: {
    backgroundColor: "#A78BFA",
  },

  navText: {
    color: "#81788D",
    fontSize: 14,
    fontFamily: FONT.bold,
  },

  navTextActive: {
    color: "#4A4A46",
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#211A2D",
    paddingHorizontal: 26,
    paddingTop: 20,
  },

  sidebarFooterTitle: {
    color: "#A78BFA",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  sidebarFooterText: {
    color: "#61596B",
    fontSize: 11,
    marginTop: 7,
  },

  main: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
  },

  mainContent: {
    padding: 44,
    paddingBottom: 70,
    maxWidth: 1700,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 34,
  },

  eyebrow: {
    color: "#9B7DCE",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#3F3F3B",
    fontSize: 45,
    fontFamily: FONT.black,
    letterSpacing: -1.5,
  },

  subtitle: {
    color: "#81788D",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
    maxWidth: 620,
  },

  enginePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#2B203A",
  },

  engineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A78BFA",
    marginRight: 9,
  },

  engineText: {
    color: "#B8A9D0",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  heroCard: {
    minHeight: 285,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#38264E",
    borderRadius: 18,
    padding: 30,
    marginBottom: 18,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow:
          "0 28px 65px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.045)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 18,
        },
        shadowOpacity: 0.5,
        shadowRadius: 28,
        elevation: 15,
      },
    }),
  },

  heroGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    right: -130,
    top: -180,
    borderRadius: 180,
    backgroundColor: COLORS.glassBg,
    opacity: 0.35,
  },

  heroLabel: {
    color: "#81718F",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1.8,
  },

  heroValue: {
    color: "#3F3F3B",
    fontSize: 52,
    fontFamily: FONT.black,
    letterSpacing: -2,
    marginTop: 10,
  },

  heroBottom: {
    flexDirection: "row",
    gap: 60,
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#2A2034",
  },

  heroMetaLabel: {
    color: "#6D6277",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  heroMetaValue: {
    color: "#DDD5E7",
    fontSize: 17,
    fontFamily: FONT.black,
    marginTop: 5,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },

  metricCard: {
    flex: 1,
    minHeight: 145,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 14,
    padding: 22,
    ...Platform.select({
      web: {
        boxShadow:
          "0 18px 45px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.035)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.42,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },

  metricCardAccent: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#3A2852",
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#726A7C",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  metricIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
  },

  metricIndicatorAccent: {
    backgroundColor: "#A78BFA",
  },

  metricValue: {
    color: "#3F3F3B",
    fontSize: 31,
    fontFamily: FONT.black,
    letterSpacing: -0.8,
    marginTop: 30,
  },

  positiveText: {
    color: "#A78BFA",
  },

  negativeText: {
    color: "#D58F9B",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#4A4A46",
    fontSize: 21,
    fontFamily: FONT.black,
  },

  sectionSubtitle: {
    color: "#706878",
    fontSize: 12,
    marginTop: 5,
  },

  countBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292231",
  },

  countBadgeText: {
    color: "#81768F",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.3,
  },

  positionBook: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 42,
    ...Platform.select({
      web: {
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.42,
        shadowRadius: 22,
        elevation: 10,
      },
    }),
  },

  tableHeader: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: "#292431",
    paddingHorizontal: 22,
  },

  tableHeaderText: {
    color: "#686070",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  positionRow: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#211E27",
  },

  assetColumn: {
    flex: 2,
  },

  numberColumn: {
    flex: 1,
    textAlign: "right",
  },

  assetName: {
    color: "#3F3F3B",
    fontSize: 14,
    fontFamily: FONT.black,
  },

  assetMeta: {
    color: "#817687",
    fontSize: 10,
    marginTop: 5,
  },

  tableValue: {
    color: "#DAD3E2",
    fontSize: 12,
    fontFamily: FONT.bold,
  },

  pnlCell: {
    alignItems: "flex-end",
  },

  pnlValue: {
    color: "#DAD3E2",
    fontSize: 12,
    fontFamily: FONT.black,
  },

  pnlPercent: {
    color: "#686070",
    fontSize: 9,
    marginTop: 4,
  },

  twoColumn: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 45,
  },

  surfaceCard: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    padding: 25,
    minHeight: 310,
    ...Platform.select({
      web: {
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.4,
        shadowRadius: 22,
        elevation: 10,
      },
    }),
  },

  cardTitle: {
    color: "#4A4A46",
    fontSize: 20,
    fontFamily: FONT.black,
  },

  cardSubtitle: {
    color: "#6F6777",
    fontSize: 12,
    marginTop: 5,
    marginBottom: 26,
  },

  allocationList: {
    gap: 18,
  },

  allocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  allocationInfo: {
    width: 105,
  },

  allocationSymbol: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONT.black,
  },

  allocationValue: {
    color: "#665E6D",
    fontSize: 9,
    marginTop: 3,
  },

  allocationTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
    overflow: "hidden",
  },

  allocationFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8E67BC",
  },

  allocationPercent: {
    width: 45,
    color: "#A99BB5",
    fontSize: 10,
    fontFamily: FONT.extraBold,
    textAlign: "right",
  },

  emptyMini: {
    color: "#625A69",
    fontSize: 12,
    marginTop: 30,
  },

  statRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#211E27",
  },

  statRowLast: {
    borderBottomWidth: 0,
  },

  statLabel: {
    color: "#77707E",
    fontSize: 12,
  },

  statValue: {
    color: "#DDD6E5",
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },

  closedBook: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 35,
  },

  closedEmpty: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  closedEmptyTitle: {
    color: "#D8D1E0",
    fontSize: 17,
    fontFamily: FONT.black,
  },

  closedEmptyText: {
    color: "#69616F",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },

  loadingState: {
    minHeight: 310,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#6F6877",
    fontSize: 12,
    marginTop: 14,
  },

  emptyState: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#38264D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyIconText: {
    color: "#A78BFA",
    fontSize: 28,
    fontFamily: FONT.light,
  },

  emptyTitle: {
    color: "#4A4A46",
    fontSize: 20,
    fontFamily: FONT.black,
  },

  emptyText: {
    color: "#68616F",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 480,
    marginTop: 8,
  },

  emptyButton: {
    height: 44,
    paddingHorizontal: 20,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#52376F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  emptyButtonText: {
    color: "#C5AEE2",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  engineNote: {
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292030",
    borderRadius: 13,
    padding: 22,
    marginBottom: 45,
  },

  engineNoteAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#A78BFA",
    marginRight: 17,
  },

  engineNoteContent: {
    flex: 1,
  },

  engineNoteTitle: {
    color: "#BFA9DB",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  engineNoteText: {
    color: "#69616F",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 900,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1C24",
  },

  footerText: {
    color: "#47414D",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },
});