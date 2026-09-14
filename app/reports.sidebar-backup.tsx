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
  LinearGradient,
} from "expo-linear-gradient";

import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  formatReportProfitFactor,
  getReportPeriodLabel,
  getReportSummary,
} from "../services/reports/reportService";

import {
  ReportBreakdownItem,
  ReportPeriod,
  ReportSummary,
} from "../types/report";

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
      "Assets",
      "Strategies",
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

const periodOptions: {
  label: string;
  value: ReportPeriod;
}[] = [
  {
    label: "ALL",
    value: "ALL",
  },
  {
    label: "7D",
    value: "WEEK",
  },
  {
    label: "30D",
    value: "MONTH",
  },
  {
    label: "90D",
    value: "QUARTER",
  },
  {
    label: "1Y",
    value: "YEAR",
  },
];

function formatINR(
  value: number
): string {
  return `₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatSignedINR(
  value: number
): string {
  if (value === 0) {
    return "₹0";
  }

  return `${
    value > 0 ? "+" : "-"
  }₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(
  value: number
): string {
  return `${value.toFixed(
    1
  )}%`;
}

function getRoute(
  item: string
): string | undefined {
  const routes: Record<
    string,
    string
  > = {
    Dashboard: "/dashboard",
    Portfolio: "/portfolio",
    Trading: "/trading",
    Assets: "/assets",
    Strategies: "/strategies",
    "Growth Missions":
      "/growth-missions",
    "Trade Journal":
      "/trade-journal",
    Capital: "/capital",
    Cashflow: "/cashflow",
    Transactions:
      "/transactions",
    Performance:
      "/performance",
    Risk: "/risk",
    Reports: "/reports",
    Investors: "/investors",
    Payouts: "/payouts",
    Documents: "/documents",
  };

  return routes[item];
}

function MetricCard({
  label,
  value,
  caption,
  positive,
  negative,
}: {
  label: string;
  value: string;
  caption: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <VaultSurface
      intensity="medium"
      style={styles.metricCard}
    >
      <View
        style={
          styles.metricInner
        }
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
              styles.metricDot,
              positive &&
                styles.metricDotPositive,
              negative &&
                styles.metricDotNegative,
            ]}
          />
        </View>

        <View>
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

          <Text
            style={
              styles.metricCaption
            }
          >
            {caption}
          </Text>
        </View>
      </View>
    </VaultSurface>
  );
}

function BreakdownCard({
  title,
  eyebrow,
  items,
  valueMode,
}: {
  title: string;
  eyebrow: string;
  items: ReportBreakdownItem[];
  valueMode: "exposure" | "pnl";
}) {
  const maxValue =
    items.length > 0
      ? Math.max(
          ...items.map(
            (item) =>
              Math.abs(
                item.value
              )
          )
        )
      : 0;

  return (
    <VaultSurface
      intensity="medium"
      style={styles.breakdownCard}
    >
      <Text
        style={
          styles.cardEyebrow
        }
      >
        {eyebrow}
      </Text>

      <Text
        style={
          styles.cardTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.breakdownList
        }
      >
        {items.length === 0 ? (
          <View
            style={
              styles.emptyBreakdown
            }
          >
            <Text
              style={
                styles.emptyBreakdownText
              }
            >
              No data available
            </Text>
          </View>
        ) : (
          items
            .slice(0, 6)
            .map((item) => {
              const width =
                maxValue > 0
                  ? (Math.abs(
                      item.value
                    ) /
                      maxValue) *
                    100
                  : 0;

              const positive =
                item.value > 0;

              return (
                <View
                  key={
                    item.name
                  }
                  style={
                    styles.breakdownItem
                  }
                >
                  <View
                    style={
                      styles.breakdownHeader
                    }
                  >
                    <View
                      style={
                        styles.breakdownNameWrap
                      }
                    >
                      <Text
                        style={
                          styles.breakdownName
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {item.name}
                      </Text>

                      <Text
                        style={
                          styles.breakdownCount
                        }
                      >
                        {item.count}{" "}
                        RECORD
                        {item.count ===
                        1
                          ? ""
                          : "S"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.breakdownRight
                      }
                    >
                      <Text
                        style={[
                          styles.breakdownValue,
                          valueMode ===
                            "pnl" &&
                            positive &&
                            styles.positiveText,
                          valueMode ===
                            "pnl" &&
                            !positive &&
                            styles.negativeText,
                        ]}
                      >
                        {valueMode ===
                        "pnl"
                          ? formatSignedINR(
                              item.value
                            )
                          : formatINR(
                              item.value
                            )}
                      </Text>

                      <Text
                        style={
                          styles.breakdownPercent
                        }
                      >
                        {formatPercent(
                          item.percent
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.breakdownTrack
                    }
                  >
                    <LinearGradient
                      colors={[
                        "#6649A7",
                        "#9A7BFF",
                      ]}
                      start={{
                        x: 0,
                        y: 0,
                      }}
                      end={{
                        x: 1,
                        y: 0,
                      }}
                      style={[
                        styles.breakdownFill,
                        {
                          width: `${width}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })
        )}
      </View>
    </VaultSurface>
  );
}

function MonthlyRow({
  month,
  trades,
  wins,
  losses,
  pnl,
  fees,
}: {
  month: string;
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
  fees: number;
}) {
  return (
    <View
      style={
        styles.monthlyRow
      }
    >
      <View
        style={
          styles.monthCell
        }
      >
        <Text
          style={
            styles.monthName
          }
        >
          {month}
        </Text>

        <Text
          style={
            styles.monthSub
          }
        >
          {trades} TRADES
        </Text>
      </View>

      <Text
        style={
          styles.monthStat
        }
      >
        {wins}
      </Text>

      <Text
        style={
          styles.monthStat
        }
      >
        {losses}
      </Text>

      <Text
        style={[
          styles.monthPnL,
          pnl > 0 &&
            styles.positiveText,
          pnl < 0 &&
            styles.negativeText,
        ]}
      >
        {formatSignedINR(
          pnl
        )}
      </Text>

      <Text
        style={
          styles.monthFees
        }
      >
        {formatINR(
          fees
        )}
      </Text>
    </View>
  );
}

function ReportInsight({
  title,
  value,
  description,
  positive,
}: {
  title: string;
  value: string;
  description: string;
  positive?: boolean;
}) {
  return (
    <VaultSurface
      intensity="subtle"
      style={styles.insightCard}
    >
      <Text
        style={
          styles.insightEyebrow
        }
      >
        {title}
      </Text>

      <Text
        style={[
          styles.insightValue,
          positive &&
            styles.positiveText,
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.insightDescription
        }
      >
        {description}
      </Text>
    </VaultSurface>
  );
}

export default function ReportsScreen() {
  const { profile } =
    useAuth();

  const [period, setPeriod] =
    useState<ReportPeriod>(
      "ALL"
    );

  const [summary, setSummary] =
    useState<ReportSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeNav, setActiveNav] =
    useState("Reports");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadReport(
      profile.uid,
      period
    );
  }, [
    profile?.uid,
    period,
  ]);

  async function loadReport(
    userId: string,
    selectedPeriod: ReportPeriod
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await getReportSummary(
          userId,
          selectedPeriod
        );

      setSummary(data);
    } catch (err: any) {
      console.error(
        "Reports error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load reports."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNavigation(
    item: string
  ) {
    setActiveNav(item);

    const route =
      getRoute(item);

    if (route) {
      router.push(
        route as any
      );
    }
  }

  const reportStatus =
    useMemo(() => {
      if (!summary) {
        return "BUILDING";
      }

      if (
        summary.netPnL > 0 &&
        summary.profitFactor >=
          1.5
      ) {
        return "STRONG";
      }

      if (
        summary.netPnL >= 0
      ) {
        return "STABLE";
      }

      return "WATCH";
    }, [summary]);

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <View
          style={
            styles.loadingMark
          }
        >
          <Text
            style={
              styles.loadingMarkText
            }
          >
            V1
          </Text>
        </View>

        <ActivityIndicator
          size="small"
          color="#9A7BFF"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          BUILDING REPORT
        </Text>
      </View>
    );
  }

  return (
    <View
      style={styles.screen}
    >
      <View
        style={styles.sidebar}
      >
        <View
          style={styles.brand}
        >
          <View
            style={
              styles.brandMark
            }
          >
            <Text
              style={
                styles.brandMarkText
              }
            >
              1
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.brandName
              }
            >
              VAULT1
            </Text>

            <Text
              style={
                styles.brandSubtitle
              }
            >
              WEALTH OPERATING SYSTEM
            </Text>
          </View>
        </View>

        <View
          style={
            styles.sidebarDivider
          }
        />

        <ScrollView
          style={
            styles.navScroll
          }
          showsVerticalScrollIndicator={
            false
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
                  {
                    group.section
                  }
                </Text>

                {group.items.map(
                  (item) => {
                    const active =
                      activeNav ===
                      item;

                    return (
                      <Pressable
                        key={
                          item
                        }
                        onPress={() =>
                          handleNavigation(
                            item
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.navItem,
                          active &&
                            styles.navItemActive,
                          pressed &&
                            styles.navItemPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.navIndicator,
                            active &&
                              styles.navIndicatorActive,
                          ]}
                        />

                        <Text
                          style={[
                            styles.navText,
                            active &&
                              styles.navTextActive,
                          ]}
                        >
                          {
                            item
                          }
                        </Text>

                        {active ? (
                          <Text
                            style={
                              styles.navArrow
                            }
                          >
                            ›
                          </Text>
                        ) : null}
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
          <View
            style={
              styles.profileMark
            }
          >
            <Text
              style={
                styles.profileMarkText
              }
            >
              {(
                profile?.displayName ||
                "V"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={
              styles.profileInfo
            }
          >
            <Text
              style={
                styles.profileName
              }
              numberOfLines={
                1
              }
            >
              {profile?.displayName ||
                "Vault1 User"}
            </Text>

            <Text
              style={
                styles.profileRole
              }
            >
              {profile?.role ||
                "VIEWER"}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={styles.main}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={styles.header}
          >
            <View>
              <Text
                style={
                  styles.eyebrow
                }
              >
                ANALYTICS / REPORTING
              </Text>

              <Text
                style={styles.title}
              >
                Reports
              </Text>

              <Text
                style={
                  styles.subtitle
                }
              >
                A consolidated view of
                capital, trading,
                performance and
                operating results.
              </Text>
            </View>

            <View
              style={
                styles.headerRight
              }
            >
              <View
                style={
                  styles.reportBadge
                }
              >
                <View
                  style={
                    styles.reportDot
                  }
                />

                <Text
                  style={
                    styles.reportBadgeText
                  }
                >
                  REPORT ENGINE
                </Text>
              </View>

              <Text
                style={
                  styles.headerUser
                }
              >
                {getReportPeriodLabel(
                  period
                )}
              </Text>
            </View>
          </View>

          {error ? (
            <VaultSurface
              intensity="subtle"
              style={
                styles.errorCard
              }
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </VaultSurface>
          ) : null}

          <View
            style={
              styles.periodRow
            }
          >
            <View>
              <Text
                style={
                  styles.periodEyebrow
                }
              >
                REPORT PERIOD
              </Text>

              <Text
                style={
                  styles.periodTitle
                }
              >
                {getReportPeriodLabel(
                  period
                )}
              </Text>
            </View>

            <View
              style={
                styles.periodSelector
              }
            >
              {periodOptions.map(
                (option) => {
                  const selected =
                    period ===
                    option.value;

                  return (
                    <Pressable
                      key={
                        option.value
                      }
                      onPress={() =>
                        setPeriod(
                          option.value
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.periodButton,
                        selected &&
                          styles.periodButtonActive,
                        pressed &&
                          styles.periodButtonPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodText,
                          selected &&
                            styles.periodTextActive,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          {summary ? (
            <>
              <View
                style={
                  styles.heroGrid
                }
              >
                <VaultSurface
                  intensity="strong"
                  style={
                    styles.heroCard
                  }
                >
                  <LinearGradient
                    colors={[
                      "#17131F",
                      "#100E15",
                      "#0B0B0B",
                    ]}
                    start={{
                      x: 0,
                      y: 0,
                    }}
                    end={{
                      x: 1,
                      y: 1,
                    }}
                    style={
                      styles.heroGradient
                    }
                  >
                    <View
                      style={
                        styles.heroGlow
                      }
                    />

                    <Text
                      style={
                        styles.heroEyebrow
                      }
                    >
                      EXECUTIVE NET RESULT
                    </Text>

                    <Text
                      style={[
                        styles.heroValue,
                        summary.netPnL >
                          0 &&
                          styles.positiveText,
                        summary.netPnL <
                          0 &&
                          styles.negativeText,
                      ]}
                    >
                      {formatSignedINR(
                        summary.netPnL
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
                            styles.heroLabel
                          }
                        >
                          STATUS
                        </Text>

                        <Text
                          style={
                            styles.heroSmallValue
                          }
                        >
                          {
                            reportStatus
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.heroDivider
                        }
                      />

                      <View>
                        <Text
                          style={
                            styles.heroLabel
                          }
                        >
                          WIN RATE
                        </Text>

                        <Text
                          style={
                            styles.heroSmallValue
                          }
                        >
                          {formatPercent(
                            summary.winRate
                          )}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.heroDivider
                        }
                      />

                      <View>
                        <Text
                          style={
                            styles.heroLabel
                          }
                        >
                          PROFIT FACTOR
                        </Text>

                        <Text
                          style={
                            styles.heroSmallValue
                          }
                        >
                          {formatReportProfitFactor(
                            summary.profitFactor
                          )}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.executiveCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    EXECUTIVE SNAPSHOT
                  </Text>

                  <Text
                    style={
                      styles.executiveTitle
                    }
                  >
                    Capital & activity
                  </Text>

                  <View
                    style={
                      styles.executiveRows
                    }
                  >
                    <View
                      style={
                        styles.executiveRow
                      }
                    >
                      <Text
                        style={
                          styles.executiveLabel
                        }
                      >
                        CAPITAL BASE
                      </Text>

                      <Text
                        style={
                          styles.executiveValue
                        }
                      >
                        {formatINR(
                          summary.capitalBase
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.executiveRow
                      }
                    >
                      <Text
                        style={
                          styles.executiveLabel
                        }
                      >
                        EXPOSURE
                      </Text>

                      <Text
                        style={
                          styles.executiveValue
                        }
                      >
                        {formatINR(
                          summary.totalExposure
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.executiveRow
                      }
                    >
                      <Text
                        style={
                          styles.executiveLabel
                        }
                      >
                        CAPITAL UTILIZATION
                      </Text>

                      <Text
                        style={
                          styles.executiveValue
                        }
                      >
                        {formatPercent(
                          summary.exposurePercent
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.executiveRow
                      }
                    >
                      <Text
                        style={
                          styles.executiveLabel
                        }
                      >
                        TRADES
                      </Text>

                      <Text
                        style={
                          styles.executiveValue
                        }
                      >
                        {
                          summary.totalTrades
                        }
                      </Text>
                    </View>
                  </View>
                </VaultSurface>
              </View>

              <View
                style={
                  styles.metricGrid
                }
              >
                <MetricCard
                  label="NET P&L"
                  value={formatSignedINR(
                    summary.netPnL
                  )}
                  caption="Realized result"
                  positive={
                    summary.netPnL >
                    0
                  }
                  negative={
                    summary.netPnL <
                    0
                  }
                />

                <MetricCard
                  label="GROSS PROFIT"
                  value={formatINR(
                    summary.grossProfit
                  )}
                  caption="Winning trades"
                  positive
                />

                <MetricCard
                  label="GROSS LOSS"
                  value={formatINR(
                    summary.grossLoss
                  )}
                  caption="Losing trades"
                  negative
                />

                <MetricCard
                  label="FEES"
                  value={formatINR(
                    summary.totalFees
                  )}
                  caption="Trading cost"
                  negative
                />

                <MetricCard
                  label="AVERAGE WIN"
                  value={formatINR(
                    summary.averageWin
                  )}
                  caption="Per winning trade"
                  positive
                />

                <MetricCard
                  label="AVERAGE LOSS"
                  value={formatINR(
                    summary.averageLoss
                  )}
                  caption="Per losing trade"
                  negative
                />

                <MetricCard
                  label="BEST TRADE"
                  value={formatINR(
                    summary.largestWin
                  )}
                  caption="Largest winner"
                  positive
                />

                <MetricCard
                  label="WORST TRADE"
                  value={formatINR(
                    summary.largestLoss
                  )}
                  caption="Largest loser"
                  negative
                />
              </View>

              <View
                style={
                  styles.sectionHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionEyebrow
                    }
                  >
                    CAPITAL REPORT
                  </Text>

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Money movement
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.cashflowGrid
                }
              >
                <ReportInsight
                  title="DEPOSITS"
                  value={formatINR(
                    summary.deposits
                  )}
                  description="External capital added during the selected period."
                  positive
                />

                <ReportInsight
                  title="WITHDRAWALS"
                  value={formatINR(
                    summary.withdrawals
                  )}
                  description="External capital removed during the selected period."
                />

                <ReportInsight
                  title="INVESTMENT OUTFLOW"
                  value={formatINR(
                    summary.investmentOutflow
                  )}
                  description="Capital recorded as investment deployment."
                />

                <ReportInsight
                  title="NET CASHFLOW"
                  value={formatSignedINR(
                    summary.netCashflow
                  )}
                  description="Deposits less withdrawals and investment outflow."
                  positive={
                    summary.netCashflow >
                    0
                  }
                />
              </View>

              <View
                style={
                  styles.sectionHeaderSingle
                }
              >
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  EXPOSURE & STRATEGY
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Where capital is working
                </Text>
              </View>

              <View
                style={
                  styles.breakdownGrid
                }
              >
                <BreakdownCard
                  eyebrow="OPEN EXPOSURE"
                  title="By asset"
                  items={
                    summary.assetBreakdown
                  }
                  valueMode="exposure"
                />

                <BreakdownCard
                  eyebrow="REALIZED PERFORMANCE"
                  title="By strategy"
                  items={
                    summary.strategyBreakdown
                  }
                  valueMode="pnl"
                />
              </View>

              <View
                style={
                  styles.sectionHeaderSingle
                }
              >
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  OPERATING HISTORY
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Monthly performance
                </Text>
              </View>

              <VaultSurface
                intensity="medium"
                style={
                  styles.monthlyCard
                }
              >
                <View
                  style={
                    styles.monthlyHeader
                  }
                >
                  <Text
                    style={
                      styles.tableHeader
                    }
                  >
                    PERIOD
                  </Text>

                  <Text
                    style={
                      styles.tableHeader
                    }
                  >
                    WINS
                  </Text>

                  <Text
                    style={
                      styles.tableHeader
                    }
                  >
                    LOSSES
                  </Text>

                  <Text
                    style={
                      styles.tableHeader
                    }
                  >
                    P&L
                  </Text>

                  <Text
                    style={
                      styles.tableHeader
                    }
                  >
                    FEES
                  </Text>
                </View>

                {summary.monthlyBreakdown.length ===
                0 ? (
                  <View
                    style={
                      styles.emptyMonthly
                    }
                  >
                    <Text
                      style={
                        styles.emptyMonthlyTitle
                      }
                    >
                      No monthly trading
                      history
                    </Text>

                    <Text
                      style={
                        styles.emptyMonthlyText
                      }
                    >
                      Closed trades will
                      appear here as the
                      reporting history
                      develops.
                    </Text>
                  </View>
                ) : (
                  summary.monthlyBreakdown
                    .slice(-12)
                    .reverse()
                    .map(
                      (item) => (
                        <MonthlyRow
                          key={
                            item.month
                          }
                          month={
                            item.month
                          }
                          trades={
                            item.trades
                          }
                          wins={
                            item.winningTrades
                          }
                          losses={
                            item.losingTrades
                          }
                          pnl={
                            item.pnl
                          }
                          fees={
                            item.fees
                          }
                        />
                      )
                    )
                )}
              </VaultSurface>

              <View
                style={
                  styles.sectionHeaderSingle
                }
              >
                <Text
                  style={
                    styles.sectionEyebrow
                  }
                >
                  KEY OUTCOMES
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Report highlights
                </Text>
              </View>

              <View
                style={
                  styles.highlightGrid
                }
              >
                <VaultSurface
                  intensity="medium"
                  style={
                    styles.highlightCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    TOP ASSET
                  </Text>

                  <Text
                    style={
                      styles.highlightTitle
                    }
                  >
                    {summary.topAsset}
                  </Text>

                  <Text
                    style={
                      styles.highlightValue
                    }
                  >
                    {formatINR(
                      summary.topAssetValue
                    )}
                  </Text>

                  <Text
                    style={
                      styles.highlightDescription
                    }
                  >
                    Largest current open
                    exposure by asset.
                  </Text>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.highlightCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    TOP STRATEGY
                  </Text>

                  <Text
                    style={
                      styles.highlightTitle
                    }
                  >
                    {summary.topStrategy}
                  </Text>

                  <Text
                    style={[
                      styles.highlightValue,
                      summary.topStrategyPnL >
                        0 &&
                        styles.positiveText,
                      summary.topStrategyPnL <
                        0 &&
                        styles.negativeText,
                    ]}
                  >
                    {formatSignedINR(
                      summary.topStrategyPnL
                    )}
                  </Text>

                  <Text
                    style={
                      styles.highlightDescription
                    }
                  >
                    Highest realized P&L
                    contribution by
                    strategy.
                  </Text>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.highlightCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    BEST TRADE
                  </Text>

                  <Text
                    style={
                      styles.highlightTitle
                    }
                  >
                    {summary.bestTrade
                      ?.asset ||
                      "—"}
                  </Text>

                  <Text
                    style={[
                      styles.highlightValue,
                      styles.positiveText,
                    ]}
                  >
                    {summary.bestTrade
                      ? formatSignedINR(
                          summary
                            .bestTrade
                            .pnl
                        )
                      : "₹0"}
                  </Text>

                  <Text
                    style={
                      styles.highlightDescription
                    }
                  >
                    Strongest realized
                    trade in this
                    reporting period.
                  </Text>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.highlightCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    WORST TRADE
                  </Text>

                  <Text
                    style={
                      styles.highlightTitle
                    }
                  >
                    {summary.worstTrade
                      ?.asset ||
                      "—"}
                  </Text>

                  <Text
                    style={[
                      styles.highlightValue,
                      styles.negativeText,
                    ]}
                  >
                    {summary.worstTrade
                      ? formatSignedINR(
                          summary
                            .worstTrade
                            .pnl
                        )
                      : "₹0"}
                  </Text>

                  <Text
                    style={
                      styles.highlightDescription
                    }
                  >
                    Weakest realized
                    trade in this
                    reporting period.
                  </Text>
                </VaultSurface>
              </View>

              <VaultSurface
                intensity="subtle"
                style={
                  styles.noteCard
                }
              >
                <View
                  style={
                    styles.noteMark
                  }
                >
                  <Text
                    style={
                      styles.noteMarkText
                    }
                  >
                    V1
                  </Text>
                </View>

                <View
                  style={
                    styles.noteContent
                  }
                >
                  <Text
                    style={
                      styles.noteTitle
                    }
                  >
                    REPORT ENGINE FOUNDATION
                  </Text>

                  <Text
                    style={
                      styles.noteText
                    }
                  >
                    Vault1 reports are
                    generated directly from
                    the trading and
                    transaction records.
                    This keeps reporting
                    tied to the underlying
                    source-of-truth data.
                    Future versions can
                    extend this foundation
                    into downloadable
                    statements, scheduled
                    reports, investor
                    reporting, tax reports
                    and formal portfolio
                    reporting packs.
                  </Text>
                </View>
              </VaultSurface>
            </>
          ) : null}

          <View
            style={styles.footer}
          >
            <Text
              style={
                styles.footerText
              }
            >
              VAULT1 / REPORTING COMMAND
              CENTER
            </Text>

            <Text
              style={
                styles.footerVersion
              }
            >
              REPORT ENGINE 1.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3A3155",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingMarkText: {
    color: "#B39AFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },

  loadingText: {
    color: "#55505F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  sidebar: {
    width: 246,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#191919",
    paddingTop: 26,
    paddingBottom: 18,
  },

  brand: {
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  brandMark: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3A3150",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: "#A989FF",
    fontSize: 18,
    fontWeight: "900",
  },

  brandName: {
    color: "#3F3F3B",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 2.5,
  },

  brandSubtitle: {
    color: "#484848",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 3,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 25,
    marginHorizontal: 18,
  },

  navScroll: {
    flex: 1,
    marginTop: 16,
  },

  navGroup: {
    marginBottom: 18,
  },

  navSection: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.8,
    paddingHorizontal: 22,
    marginBottom: 6,
  },

  navItem: {
    height: 40,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  navItemActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#282038",
  },

  navItemPressed: {
    opacity: 0.72,
  },

  navIndicator: {
    width: 3,
    height: 15,
    borderRadius: 2,
    backgroundColor:
      "transparent",
    marginRight: 11,
  },

  navIndicatorActive: {
    backgroundColor: "#9875FF",
  },

  navText: {
    flex: 1,
    color: "#656565",
    fontSize: 13,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#5F5F5B",
  },

  navArrow: {
    color: "#9675F5",
    fontSize: 19,
    fontWeight: "400",
    marginTop: -2,
  },

  sidebarFooter: {
    marginHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#181818",
    flexDirection: "row",
    alignItems: "center",
  },

  profileMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#302B39",
    alignItems: "center",
    justifyContent: "center",
  },

  profileMarkText: {
    color: "#A890DD",
    fontSize: 12,
    fontWeight: "900",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },

  profileName: {
    color: "#C7C7C7",
    fontSize: 11,
    fontWeight: "800",
  },

  profileRole: {
    color: "#454545",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 2,
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 42,
    paddingTop: 38,
    paddingBottom: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },

  eyebrow: {
    color: "#8665E2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#3F3F3B",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  subtitle: {
    color: "#696969",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 9,
    maxWidth: 680,
    lineHeight: 21,
  },

  headerRight: {
    alignItems: "flex-end",
    paddingTop: 5,
  },

  reportBadge: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29232F",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  reportDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9A7BFF",
  },

  reportBadgeText: {
    color: "#82769A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  headerUser: {
    color: "#4B4B4B",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 9,
    letterSpacing: 0.8,
  },

  errorCard: {
    padding: 15,
    marginBottom: 18,
  },

  errorText: {
    color: "#B88787",
    fontSize: 11,
    fontWeight: "700",
  },

  periodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
  },

  periodEyebrow: {
    color: "#55505F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  periodTitle: {
    color: "#D5D5D5",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 5,
  },

  periodSelector: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1D1D1D",
  },

  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
  },

  periodButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#302443",
  },

  periodButtonPressed: {
    opacity: 0.7,
  },

  periodText: {
    color: "#4F4F4F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  periodTextActive: {
    color: "#A98CF5",
  },

  heroGrid: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 18,
  },

  heroCard: {
    flex: 1.55,
    minHeight: 270,
  },

  heroGradient: {
    flex: 1,
    minHeight: 268,
    padding: 28,
    position: "relative",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor:
      "rgba(117, 76, 214, 0.08)",
    right: -100,
    top: -130,
  },

  heroEyebrow: {
    color: "#71677F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  heroValue: {
    color: "#4A4A46",
    fontSize: 47,
    fontWeight: "900",
    letterSpacing: -1.6,
    marginTop: 16,
  },

  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
    marginTop: 30,
  },

  heroLabel: {
    color: "#4C4654",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroSmallValue: {
    color: "#BDB8C4",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 5,
  },

  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#FFFFFF",
  },

  executiveCard: {
    flex: 1,
    minHeight: 270,
    padding: 25,
  },

  cardEyebrow: {
    color: "#59545F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  executiveTitle: {
    color: "#D5D5D5",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },

  executiveRows: {
    marginTop: 18,
  },

  executiveRow: {
    minHeight: 43,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#181818",
  },

  executiveLabel: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  executiveValue: {
    color: "#C7C7C7",
    fontSize: 12,
    fontWeight: "800",
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 38,
  },

  metricCard: {
    width: "23.7%",
    minHeight: 137,
  },

  metricInner: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#595959",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.25,
  },

  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  metricDotPositive: {
    backgroundColor: "#8065B7",
  },

  metricDotNegative: {
    backgroundColor: "#714D58",
  },

  metricValue: {
    color: "#5F5F5B",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  metricCaption: {
    color: "#4E4E4E",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 5,
  },

  positiveText: {
    color: "#B49AFF",
  },

  negativeText: {
    color: "#B77C8A",
  },

  sectionHeader: {
    marginBottom: 15,
  },

  sectionHeaderSingle: {
    marginTop: 38,
    marginBottom: 15,
  },

  sectionEyebrow: {
    color: "#6E55B8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 6,
  },

  sectionTitle: {
    color: "#DDDDDD",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  cashflowGrid: {
    flexDirection: "row",
    gap: 14,
  },

  insightCard: {
    flex: 1,
    minHeight: 160,
    padding: 20,
  },

  insightEyebrow: {
    color: "#55505F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  insightValue: {
    color: "#D8D5DD",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 18,
  },

  insightDescription: {
    color: "#4D4D4D",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 9,
  },

  breakdownGrid: {
    flexDirection: "row",
    gap: 18,
  },

  breakdownCard: {
    flex: 1,
    minHeight: 360,
    padding: 24,
  },

  cardTitle: {
    color: "#D5D5D5",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 7,
  },

  breakdownList: {
    marginTop: 23,
  },

  breakdownItem: {
    marginBottom: 19,
  },

  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  breakdownNameWrap: {
    flex: 1,
    paddingRight: 12,
  },

  breakdownName: {
    color: "#C5C5C5",
    fontSize: 11,
    fontWeight: "800",
  },

  breakdownCount: {
    color: "#464646",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 3,
  },

  breakdownRight: {
    alignItems: "flex-end",
  },

  breakdownValue: {
    color: "#BEBEBE",
    fontSize: 11,
    fontWeight: "800",
  },

  breakdownPercent: {
    color: "#59525F",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 2,
  },

  breakdownTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  breakdownFill: {
    height: "100%",
    borderRadius: 3,
  },

  emptyBreakdown: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBreakdownText: {
    color: "#4D4D4D",
    fontSize: 10,
    fontWeight: "700",
  },

  monthlyCard: {
    overflow: "hidden",
  },

  monthlyHeader: {
    height: 48,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1C",
    flexDirection: "row",
    alignItems: "center",
  },

  tableHeader: {
    flex: 1,
    color: "#454545",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    textAlign: "right",
  },

  monthCell: {
    flex: 1,
  },

  monthlyRow: {
    minHeight: 65,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
    flexDirection: "row",
    alignItems: "center",
  },

  monthName: {
    color: "#C7C7C7",
    fontSize: 11,
    fontWeight: "800",
  },

  monthSub: {
    color: "#484848",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 3,
  },

  monthStat: {
    flex: 1,
    color: "#BEBEBE",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
  },

  monthPnL: {
    flex: 1,
    color: "#C4C4C4",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "right",
  },

  monthFees: {
    flex: 1,
    color: "#666666",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right",
  },

  emptyMonthly: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyMonthlyTitle: {
    color: "#A4A4A4",
    fontSize: 13,
    fontWeight: "800",
  },

  emptyMonthlyText: {
    color: "#4D4D4D",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
    textAlign: "center",
  },

  highlightGrid: {
    flexDirection: "row",
    gap: 14,
  },

  highlightCard: {
    flex: 1,
    minHeight: 205,
    padding: 21,
  },

  highlightTitle: {
    color: "#D2D2D2",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 17,
  },

  highlightValue: {
    color: "#BEBEBE",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 7,
  },

  highlightDescription: {
    color: "#4D4D4D",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 11,
  },

  noteCard: {
    marginTop: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  noteMark: {
    width: 35,
    height: 35,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2B2538",
    alignItems: "center",
    justifyContent: "center",
  },

  noteMarkText: {
    color: "#8B6DE1",
    fontSize: 10,
    fontWeight: "900",
  },

  noteContent: {
    flex: 1,
  },

  noteTitle: {
    color: "#716D76",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  noteText: {
    color: "#4F4F4F",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
    maxWidth: 1000,
  },

  footer: {
    alignItems: "center",
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#191919",
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  footerText: {
    color: "#3E3E3E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  footerVersion: {
    color: "#444444",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
});