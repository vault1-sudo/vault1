import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";
import { useAuth } from "../services/auth/AuthProvider";
import {
  getRiskLevelDescription,
  getRiskLevelLabel,
  getRiskSummary,
} from "../services/risk/riskService";
import {
  RiskBreakdownItem,
  RiskFlag,
  RiskLevel,
  RiskSummary,
} from "../types/risk";

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

function formatINR(value: number) {
  return `₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatSignedINR(value: number) {
  if (value === 0) {
    return "₹0";
  }

  return `${value > 0 ? "+" : "-"}₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPercent(
  value: number,
  decimals = 1
) {
  return `${value.toFixed(decimals)}%`;
}

function getRiskColor(level: RiskLevel) {
  switch (level) {
    case "CONTROLLED":
      return "#9A7BFF";

    case "MODERATE":
      return "#9A8CBA";

    case "HIGH":
      return "#B88A9A";

    case "CRITICAL":
      return "#C46F83";

    default:
      return "#777777";
  }
}

function getFlagColor(level: RiskLevel) {
  switch (level) {
    case "CRITICAL":
      return "#C46F83";

    case "HIGH":
      return "#A97989";

    case "MODERATE":
      return "#8979A5";

    default:
      return "#7560AA";
  }
}

function RiskMetric({
  label,
  value,
  caption,
  danger,
}: {
  label: string;
  value: string;
  caption: string;
  danger?: boolean;
}) {
  return (
    <VaultSurface
      intensity="medium"
      style={styles.metricCard}
    >
      <View style={styles.metricInner}>
        <View style={styles.metricHeader}>
          <Text style={styles.metricLabel}>
            {label}
          </Text>

          <View
            style={[
              styles.metricDot,
              danger &&
                styles.metricDotDanger,
            ]}
          />
        </View>

        <View>
          <Text
            style={[
              styles.metricValue,
              danger &&
                styles.metricDangerValue,
            ]}
          >
            {value}
          </Text>

          <Text style={styles.metricCaption}>
            {caption}
          </Text>
        </View>
      </View>
    </VaultSurface>
  );
}

function BreakdownRow({
  item,
  maxExposure,
}: {
  item: RiskBreakdownItem;
  maxExposure: number;
}) {
  const barWidth =
    maxExposure > 0
      ? Math.min(
          (item.exposure /
            maxExposure) *
            100,
          100
        )
      : 0;

  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownTop}>
        <View style={styles.breakdownNameWrap}>
          <Text
            style={styles.breakdownName}
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <Text style={styles.breakdownTrades}>
            {item.tradeCount} OPEN
          </Text>
        </View>

        <View style={styles.breakdownValueWrap}>
          <Text style={styles.breakdownValue}>
            {formatINR(item.exposure)}
          </Text>

          <Text style={styles.breakdownPercent}>
            {formatPercent(
              item.exposurePercent
            )}
          </Text>
        </View>
      </View>

      <View style={styles.breakdownTrack}>
        <LinearGradient
          colors={[
            "#6F51B7",
            "#9A7BFF",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.breakdownFill,
            {
              width: `${barWidth}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function FlagRow({
  flag,
}: {
  flag: RiskFlag;
}) {
  const color = getFlagColor(
    flag.level
  );

  return (
    <View style={styles.flagRow}>
      <View
        style={[
          styles.flagIcon,
          {
            borderColor: color,
          },
        ]}
      >
        <Text
          style={[
            styles.flagIconText,
            {
              color,
            },
          ]}
        >
          !
        </Text>
      </View>

      <View style={styles.flagContent}>
        <View style={styles.flagTitleRow}>
          <Text style={styles.flagTitle}>
            {flag.title}
          </Text>

          <Text
            style={[
              styles.flagLevel,
              {
                color,
              },
            ]}
          >
            {flag.level}
          </Text>
        </View>

        <Text style={styles.flagDescription}>
          {flag.description}
        </Text>
      </View>
    </View>
  );
}

function RiskGauge({
  level,
}: {
  level: RiskLevel;
}) {
  const levels: RiskLevel[] = [
    "CONTROLLED",
    "MODERATE",
    "HIGH",
    "CRITICAL",
  ];

  const activeIndex =
    levels.indexOf(level);

  return (
    <View style={styles.gauge}>
      {levels.map(
        (gaugeLevel, index) => {
          const active =
            index <= activeIndex;

          return (
            <View
              key={gaugeLevel}
              style={styles.gaugeSegmentWrap}
            >
              <View
                style={[
                  styles.gaugeSegment,
                  active &&
                    styles.gaugeSegmentActive,
                  active &&
                    index ===
                      activeIndex && {
                      backgroundColor:
                        getRiskColor(
                          level
                        ),
                    },
                ]}
              />

              <Text
                style={[
                  styles.gaugeLabel,
                  active &&
                    styles.gaugeLabelActive,
                ]}
              >
                {gaugeLevel}
              </Text>
            </View>
          );
        }
      )}
    </View>
  );
}

function NavigationSidebar({
  activeNav,
  onNavigate,
  profile,
}: {
  activeNav: string;
  onNavigate: (item: string) => void;
  profile: any;
}) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brand}>
        <View style={styles.brandMark}>
          <Text style={styles.brandMarkText}>
            1
          </Text>
        </View>

        <View>
          <Text style={styles.brandName}>
            VAULT1
          </Text>

          <Text style={styles.brandSubtitle}>
            WEALTH OPERATING SYSTEM
          </Text>
        </View>
      </View>

      <View style={styles.sidebarDivider} />

      <ScrollView
        style={styles.navScroll}
        showsVerticalScrollIndicator={false}
      >
        {navigation.map((group) => (
          <View
            key={group.section}
            style={styles.navGroup}
          >
            <Text style={styles.navSection}>
              {group.section}
            </Text>

            {group.items.map(
              (item) => {
                const active =
                  activeNav === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() =>
                      onNavigate(
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
                      {item}
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
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.profileMark}>
          <Text
            style={styles.profileMarkText}
          >
            {(
              profile?.displayName ||
              "V"
            )
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.profileInfo}>
          <Text
            style={styles.profileName}
            numberOfLines={1}
          >
            {profile?.displayName ||
              "Vault1 User"}
          </Text>

          <Text style={styles.profileRole}>
            {profile?.role ||
              "VIEWER"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function RiskScreen() {
  const { profile } = useAuth();

  const [summary, setSummary] =
    useState<RiskSummary | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeNav, setActiveNav] =
    useState("Risk");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadRisk(profile.uid);
  }, [profile?.uid]);

  async function loadRisk(
    userId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await getRiskSummary(
          userId
        );

      setSummary(data);
    } catch (err: any) {
      console.error(
        "Risk engine error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load risk analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNavigation(
    item: string
  ) {
    setActiveNav(item);

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

    const route = routes[item];

    if (route) {
      router.push(route as any);
    }
  }

  const topAssetExposure =
    useMemo(() => {
      if (
        !summary ||
        !summary.exposureByAsset.length
      ) {
        return 0;
      }

      return Math.max(
        ...summary.exposureByAsset.map(
          (item) =>
            item.exposure
        )
      );
    }, [summary]);

  const topStrategyExposure =
    useMemo(() => {
      if (
        !summary ||
        !summary.exposureByStrategy
          .length
      ) {
        return 0;
      }

      return Math.max(
        ...summary.exposureByStrategy.map(
          (item) =>
            item.exposure
        )
      );
    }, [summary]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <Text
            style={styles.loadingMarkText}
          >
            V1
          </Text>
        </View>

        <ActivityIndicator
          size="small"
          color="#9A7BFF"
        />

        <Text style={styles.loadingText}>
          LOADING RISK ENGINE
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NavigationSidebar
        activeNav={activeNav}
        onNavigate={
          handleNavigation
        }
        profile={profile}
      />

      <View style={styles.main}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          <View style={styles.header}>
            <View>
              <Text
                style={styles.eyebrow}
              >
                ANALYTICS / RISK
              </Text>

              <Text style={styles.title}>
                Risk
              </Text>

              <Text
                style={styles.subtitle}
              >
                Understand exposure,
                concentration and
                downside before it
                becomes a problem.
              </Text>
            </View>

            <View
              style={styles.headerRight}
            >
              <View
                style={styles.engineBadge}
              >
                <View
                  style={styles.engineDot}
                />

                <Text
                  style={
                    styles.engineBadgeText
                  }
                >
                  RISK ENGINE
                </Text>
              </View>

              <Text
                style={styles.headerUser}
              >
                {profile?.displayName ||
                  "Vault1 User"}
              </Text>
            </View>
          </View>

          {error ? (
            <VaultSurface
              intensity="subtle"
              style={styles.errorCard}
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </VaultSurface>
          ) : null}

          {!summary ? (
            <VaultSurface
              intensity="strong"
              style={styles.emptyCard}
            >
              <Text
                style={styles.emptyEyebrow}
              >
                RISK ENGINE
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                No risk data yet
              </Text>

              <Text
                style={styles.emptyDescription}
              >
                Once Vault1 has trading
                and capital activity,
                this dashboard will
                calculate exposure,
                concentration and
                downside risk.
              </Text>
            </VaultSurface>
          ) : (
            <>
              <View
                style={styles.heroGrid}
              >
                <VaultSurface
                  intensity="strong"
                  style={styles.heroCard}
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
                      RISK POSTURE
                    </Text>

                    <View
                      style={
                        styles.heroStatusRow
                      }
                    >
                      <Text
                        style={[
                          styles.heroStatus,
                          {
                            color:
                              getRiskColor(
                                summary.riskLevel
                              ),
                          },
                        ]}
                      >
                        {getRiskLevelLabel(
                          summary.riskLevel
                        )}
                      </Text>

                      <View
                        style={[
                          styles.heroStatusDot,
                          {
                            backgroundColor:
                              getRiskColor(
                                summary.riskLevel
                              ),
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={
                        styles.heroDescription
                      }
                    >
                      {getRiskLevelDescription(
                        summary.riskLevel
                      )}
                    </Text>

                    <RiskGauge
                      level={
                        summary.riskLevel
                      }
                    />
                  </LinearGradient>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.capitalRiskCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    CAPITAL UTILIZATION
                  </Text>

                  <Text
                    style={
                      styles.capitalRiskValue
                    }
                  >
                    {formatPercent(
                      summary.exposurePercent
                    )}
                  </Text>

                  <Text
                    style={
                      styles.capitalRiskCaption
                    }
                  >
                    OF CAPITAL BASE
                  </Text>

                  <View
                    style={
                      styles.capitalRiskNumbers
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.smallLabel
                        }
                      >
                        EXPOSURE
                      </Text>

                      <Text
                        style={
                          styles.smallValue
                        }
                      >
                        {formatINR(
                          summary.totalExposure
                        )}
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={
                          styles.smallLabel
                        }
                      >
                        CAPITAL
                      </Text>

                      <Text
                        style={
                          styles.smallValue
                        }
                      >
                        {formatINR(
                          summary.capitalBase
                        )}
                      </Text>
                    </View>
                  </View>
                </VaultSurface>
              </View>

              <View
                style={styles.metricGrid}
              >
                <RiskMetric
                  label="TOTAL EXPOSURE"
                  value={formatINR(
                    summary.totalExposure
                  )}
                  caption={`${summary.openTrades} open positions`}
                  danger={
                    summary.exposurePercent >=
                    75
                  }
                />

                <RiskMetric
                  label="CAPITAL AT RISK"
                  value={formatINR(
                    summary.capitalAtRisk
                  )}
                  caption="Conservative open exposure"
                  danger={
                    summary.capitalAtRisk >
                    summary.capitalBase
                  }
                />

                <RiskMetric
                  label="CONCENTRATION"
                  value={formatPercent(
                    summary.concentrationPercent
                  )}
                  caption={`Largest: ${summary.largestPositionName}`}
                  danger={
                    summary.concentrationPercent >=
                    40
                  }
                />

                <RiskMetric
                  label="RISK / TRADE"
                  value={formatPercent(
                    summary.riskPerTrade
                  )}
                  caption="Largest realized loss / capital"
                  danger={
                    summary.riskPerTrade >=
                    5
                  }
                />

                <RiskMetric
                  label="MAX DRAWDOWN"
                  value={formatINR(
                    summary.maxDrawdown
                  )}
                  caption={formatPercent(
                    summary.maxDrawdownPercent
                  )}
                  danger={
                    summary.maxDrawdownPercent >=
                    10
                  }
                />

                <RiskMetric
                  label="LOSS STREAK"
                  value={String(
                    summary.currentLossStreak
                  )}
                  caption="Consecutive losing trades"
                  danger={
                    summary.currentLossStreak >=
                    3
                  }
                />

                <RiskMetric
                  label="WORST DAY"
                  value={formatINR(
                    summary.worstDayLoss
                  )}
                  caption={formatPercent(
                    summary.worstDayLossPercent
                  )}
                  danger={
                    summary.worstDayLossPercent >=
                    5
                  }
                />

                <RiskMetric
                  label="OPEN TRADES"
                  value={String(
                    summary.openTrades
                  )}
                  caption={`${summary.totalTrades} total trades`}
                  danger={
                    summary.openTrades >=
                    10
                  }
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
                    RISK ALERTS
                  </Text>

                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Active risk flags
                  </Text>
                </View>

                <View
                  style={
                    styles.flagCount
                  }
                >
                  <Text
                    style={
                      styles.flagCountNumber
                    }
                  >
                    {summary.flags.length}
                  </Text>

                  <Text
                    style={
                      styles.flagCountLabel
                    }
                  >
                    FLAGS
                  </Text>
                </View>
              </View>

              <VaultSurface
                intensity="medium"
                style={styles.flagsCard}
              >
                {summary.flags.length ===
                0 ? (
                  <View
                    style={
                      styles.noFlags
                    }
                  >
                    <View
                      style={
                        styles.noFlagsIcon
                      }
                    >
                      <Text
                        style={
                          styles.noFlagsIconText
                        }
                      >
                        ✓
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={
                          styles.noFlagsTitle
                        }
                      >
                        No active risk
                        flags
                      </Text>

                      <Text
                        style={
                          styles.noFlagsDescription
                        }
                      >
                        Current observed
                        exposure and
                        performance
                        conditions are
                        within the
                        engine's
                        conservative
                        thresholds.
                      </Text>
                    </View>
                  </View>
                ) : (
                  summary.flags.map(
                    (flag) => (
                      <FlagRow
                        key={flag.id}
                        flag={flag}
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
                  EXPOSURE MAP
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Where the risk sits
                </Text>
              </View>

              <View
                style={styles.breakdownGrid}
              >
                <VaultSurface
                  intensity="medium"
                  style={
                    styles.breakdownCard
                  }
                >
                  <View
                    style={
                      styles.breakdownHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.cardEyebrow
                        }
                      >
                        BY ASSET
                      </Text>

                      <Text
                        style={
                          styles.breakdownTitle
                        }
                      >
                        Position exposure
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.breakdownTotal
                      }
                    >
                      {formatINR(
                        summary.totalExposure
                      )}
                    </Text>
                  </View>

                  {summary
                    .exposureByAsset
                    .length ===
                  0 ? (
                    <View
                      style={
                        styles.breakdownEmpty
                      }
                    >
                      <Text
                        style={
                          styles.breakdownEmptyText
                        }
                      >
                        No open asset
                        exposure.
                      </Text>
                    </View>
                  ) : (
                    summary.exposureByAsset
                      .slice(0, 8)
                      .map(
                        (item) => (
                          <BreakdownRow
                            key={
                              item.name
                            }
                            item={item}
                            maxExposure={
                              topAssetExposure
                            }
                          />
                        )
                      )
                  )}
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.breakdownCard
                  }
                >
                  <View
                    style={
                      styles.breakdownHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.cardEyebrow
                        }
                      >
                        BY STRATEGY
                      </Text>

                      <Text
                        style={
                          styles.breakdownTitle
                        }
                      >
                        Strategy exposure
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.breakdownTotal
                      }
                    >
                      {formatINR(
                        summary.totalExposure
                      )}
                    </Text>
                  </View>

                  {summary
                    .exposureByStrategy
                    .length ===
                  0 ? (
                    <View
                      style={
                        styles.breakdownEmpty
                      }
                    >
                      <Text
                        style={
                          styles.breakdownEmptyText
                        }
                      >
                        No open strategy
                        exposure.
                      </Text>
                    </View>
                  ) : (
                    summary
                      .exposureByStrategy
                      .slice(0, 8)
                      .map(
                        (item) => (
                          <BreakdownRow
                            key={
                              item.name
                            }
                            item={item}
                            maxExposure={
                              topStrategyExposure
                            }
                          />
                        )
                      )
                  )}
                </VaultSurface>
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
                  DOWNSIDE PROFILE
                </Text>

                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Loss & drawdown analysis
                </Text>
              </View>

              <View
                style={styles.downsideGrid}
              >
                <VaultSurface
                  intensity="medium"
                  style={
                    styles.downsideCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    DRAWDOWN
                  </Text>

                  <Text
                    style={
                      styles.downsideValue
                    }
                  >
                    {formatINR(
                      summary.maxDrawdown
                    )}
                  </Text>

                  <Text
                    style={
                      styles.downsidePercent
                    }
                  >
                    {formatPercent(
                      summary.maxDrawdownPercent
                    )}{" "}
                    OF CAPITAL
                  </Text>

                  <View
                    style={
                      styles.downsideDivider
                    }
                  />

                  <Text
                    style={
                      styles.downsideDescription
                    }
                  >
                    Maximum decline in
                    cumulative realized
                    performance from
                    a previous peak.
                  </Text>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.downsideCard
                  }
                >
                  <Text
                    style={
                      styles.cardEyebrow
                    }
                  >
                    LOSS STREAK
                  </Text>

                  <Text
                    style={
                      styles.downsideValue
                    }
                  >
                    {summary.currentLossStreak}
                  </Text>

                  <Text
                    style={
                      styles.downsidePercent
                    }
                  >
                    CONSECUTIVE LOSSES
                  </Text>

                  <View
                    style={
                      styles.downsideDivider
                    }
                  />

                  <Text
                    style={
                      styles.downsideDescription
                    }
                  >
                    Current consecutive
                    losing-trade sequence,
                    calculated from the
                    latest closed trades.
                  </Text>
                </VaultSurface>

                <VaultSurface
                  intensity="medium"
                  style={
                    styles.downsideCard
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
                    style={[
                      styles.downsideValue,
                      styles.lossText,
                    ]}
                  >
                    {formatSignedINR(
                      -summary.largestLoss
                    )}
                  </Text>

                  <Text
                    style={
                      styles.downsidePercent
                    }
                  >
                    SINGLE TRADE
                  </Text>

                  <View
                    style={
                      styles.downsideDivider
                    }
                  />

                  <Text
                    style={
                      styles.downsideDescription
                    }
                  >
                    Largest realized loss
                    currently recorded in
                    the trade book.
                  </Text>
                </VaultSurface>
              </View>

              <VaultSurface
                intensity="subtle"
                style={styles.noteCard}
              >
                <View
                  style={styles.noteMark}
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
                  style={styles.noteContent}
                >
                  <Text
                    style={
                      styles.noteTitle
                    }
                  >
                    RISK ENGINE FOUNDATION
                  </Text>

                  <Text
                    style={
                      styles.noteText
                    }
                  >
                    Current risk analytics
                    are intentionally
                    conservative. Open trade
                    value is treated as
                    capital at risk because
                    planned stop-loss,
                    portfolio volatility,
                    correlation and live
                    market prices are not yet
                    connected. As Vault1
                    expands, this engine will
                    evolve into configurable
                    risk limits, scenario
                    analysis, drawdown
                    controls and pre-trade
                    risk checks.
                  </Text>
                </View>
              </VaultSurface>

              <View
                style={styles.footer}
              >
                <Text
                  style={styles.footerText}
                >
                  VAULT1 / RISK COMMAND
                  CENTER
                </Text>

                <Text
                  style={
                    styles.footerVersion
                  }
                >
                  RISK ENGINE 1.0
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#060606",
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#060606",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#100D16",
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
    backgroundColor: "#080808",
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
    backgroundColor: "#111111",
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
    color: "#F4F4F4",
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
    backgroundColor: "#181818",
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
    backgroundColor: "#14101C",
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
    backgroundColor: "transparent",
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
    color: "#E8E2F6",
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
    backgroundColor: "#141217",
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
    marginBottom: 34,
  },

  eyebrow: {
    color: "#8665E2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#F3F3F3",
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

  engineBadge: {
    height: 30,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#29232F",
    backgroundColor: "#0E0D10",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  engineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9A7BFF",
  },

  engineBadgeText: {
    color: "#82769A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  headerUser: {
    color: "#4B4B4B",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 9,
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

  emptyCard: {
    padding: 35,
    maxWidth: 700,
  },

  emptyEyebrow: {
    color: "#8061D4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  emptyTitle: {
    color: "#E7E7E7",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 10,
  },

  emptyDescription: {
    color: "#5A5A5A",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
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

  heroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },

  heroStatus: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
  },

  heroStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  heroDescription: {
    color: "#6A6471",
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 610,
    marginTop: 8,
  },

  gauge: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
  },

  gaugeSegmentWrap: {
    flex: 1,
  },

  gaugeSegment: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#222222",
  },

  gaugeSegmentActive: {
    backgroundColor: "#6C559F",
  },

  gaugeLabel: {
    color: "#3F3F3F",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginTop: 7,
  },

  gaugeLabelActive: {
    color: "#70617F",
  },

  capitalRiskCard: {
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

  capitalRiskValue: {
    color: "#E5E1EC",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.4,
    marginTop: 22,
  },

  capitalRiskCaption: {
    color: "#504A58",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginTop: 3,
  },

  capitalRiskNumbers: {
    flexDirection: "row",
    gap: 45,
    borderTopWidth: 1,
    borderTopColor: "#1E1B22",
    marginTop: 28,
    paddingTop: 18,
  },

  smallLabel: {
    color: "#48454B",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  smallValue: {
    color: "#BEBABE",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
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

  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: "#62547E",
  },

  metricDotDanger: {
    backgroundColor: "#9A6574",
  },

  metricValue: {
    color: "#E2E2E2",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.7,
  },

  metricDangerValue: {
    color: "#B98290",
  },

  metricCaption: {
    color: "#4E4E4E",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
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

  flagCount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },

  flagCountNumber: {
    color: "#A98CF5",
    fontSize: 20,
    fontWeight: "900",
  },

  flagCountLabel: {
    color: "#484848",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  flagsCard: {
    overflow: "hidden",
  },

  flagRow: {
    minHeight: 85,
    paddingHorizontal: 21,
    paddingVertical: 17,
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  flagIcon: {
    width: 27,
    height: 27,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  flagIconText: {
    fontSize: 12,
    fontWeight: "900",
  },

  flagContent: {
    flex: 1,
  },

  flagTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  flagTitle: {
    color: "#CFCFCF",
    fontSize: 12,
    fontWeight: "800",
  },

  flagLevel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  flagDescription: {
    color: "#505050",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
    maxWidth: 850,
  },

  noFlags: {
    minHeight: 120,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  noFlagsIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#15101E",
    borderWidth: 1,
    borderColor: "#34284B",
    alignItems: "center",
    justifyContent: "center",
  },

  noFlagsIconText: {
    color: "#9A7BFF",
    fontSize: 14,
    fontWeight: "900",
  },

  noFlagsTitle: {
    color: "#C6C6C6",
    fontSize: 13,
    fontWeight: "800",
  },

  noFlagsDescription: {
    color: "#505050",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  breakdownGrid: {
    flexDirection: "row",
    gap: 18,
  },

  breakdownCard: {
    flex: 1,
    padding: 24,
    minHeight: 390,
  },

  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  breakdownTitle: {
    color: "#D5D5D5",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 7,
  },

  breakdownTotal: {
    color: "#A98CF5",
    fontSize: 13,
    fontWeight: "800",
  },

  breakdownRow: {
    marginBottom: 19,
  },

  breakdownTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  breakdownNameWrap: {
    flex: 1,
    paddingRight: 15,
  },

  breakdownName: {
    color: "#C5C5C5",
    fontSize: 11,
    fontWeight: "800",
  },

  breakdownTrades: {
    color: "#464646",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
    marginTop: 3,
  },

  breakdownValueWrap: {
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
    backgroundColor: "#181818",
    overflow: "hidden",
  },

  breakdownFill: {
    height: "100%",
    borderRadius: 3,
  },

  breakdownEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  breakdownEmptyText: {
    color: "#4D4D4D",
    fontSize: 10,
    fontWeight: "700",
  },

  downsideGrid: {
    flexDirection: "row",
    gap: 18,
  },

  downsideCard: {
    flex: 1,
    minHeight: 230,
    padding: 24,
  },

  downsideValue: {
    color: "#DADADA",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginTop: 22,
  },

  lossText: {
    color: "#B77C8A",
  },

  downsidePercent: {
    color: "#55505B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 5,
  },

  downsideDivider: {
    height: 1,
    backgroundColor: "#1C1C1C",
    marginTop: 25,
    marginBottom: 13,
  },

  downsideDescription: {
    color: "#4E4E4E",
    fontSize: 10,
    lineHeight: 16,
    maxWidth: 320,
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
    backgroundColor: "#111111",
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