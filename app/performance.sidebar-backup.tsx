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
  getPerformanceEvents,
  getPerformanceSummary,
} from "../services/performance/performanceService";
import {
  PerformanceEvent,
  PerformancePeriod,
  PerformanceSummary,
} from "../types/performance";

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
  value: PerformancePeriod;
}[] = [
  { label: "ALL", value: "ALL" },
  { label: "TODAY", value: "TODAY" },
  { label: "WEEK", value: "WEEK" },
  { label: "MONTH", value: "MONTH" },
  { label: "YEAR", value: "YEAR" },
];

function formatINR(value: number, decimals = 0) {
  const absolute = Math.abs(value);

  return `₹${absolute.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatSignedINR(value: number, decimals = 0) {
  if (value === 0) {
    return "₹0";
  }

  return `${value > 0 ? "+" : "-"}₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  )}`;
}

function formatPercent(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

function formatProfitFactor(value: number) {
  if (!Number.isFinite(value)) {
    return "∞";
  }

  return value.toFixed(2);
}

function getEventTimestamp(event: PerformanceEvent) {
  const parsed = new Date(event.date).getTime();

  return Number.isFinite(parsed) ? parsed : 0;
}

function isEventInPeriod(
  event: PerformanceEvent,
  period: PerformancePeriod
) {
  if (period === "ALL") {
    return true;
  }

  const timestamp = getEventTimestamp(event);

  if (!timestamp) {
    return true;
  }

  const eventDate = new Date(timestamp);
  const now = new Date();

  if (period === "TODAY") {
    return (
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getDate() === now.getDate()
    );
  }

  if (period === "WEEK") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    return eventDate >= weekAgo;
  }

  if (period === "MONTH") {
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    return eventDate >= monthAgo;
  }

  if (period === "YEAR") {
    const yearAgo = new Date(now);
    yearAgo.setDate(now.getDate() - 365);

    return eventDate >= yearAgo;
  }

  return true;
}

function getNavigationRoute(item: string) {
  const routes: Record<string, string> = {
    Dashboard: "/dashboard",
    Portfolio: "/portfolio",
    Trading: "/trading",
    Assets: "/assets",
    Strategies: "/strategies",
    "Growth Missions": "/growth-missions",
    "Trade Journal": "/trade-journal",
    Capital: "/capital",
    Cashflow: "/cashflow",
    Transactions: "/transactions",
    Performance: "/performance",
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
    <VaultSurface intensity="medium" style={styles.metricCard}>
      <View style={styles.metricCardInner}>
        <View style={styles.metricTopRow}>
          <Text style={styles.metricLabel}>{label}</Text>

          <View
            style={[
              styles.metricDot,
              positive && styles.metricDotPositive,
              negative && styles.metricDotNegative,
            ]}
          />
        </View>

        <View>
          <Text
            style={[
              styles.metricValue,
              positive && styles.positiveText,
              negative && styles.negativeText,
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

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>
        {label}
      </Text>

      <Text style={styles.miniStatValue}>
        {value}
      </Text>
    </View>
  );
}

function ProgressBar({
  value,
  positive = false,
}: {
  value: number;
  positive?: boolean;
}) {
  const width = Math.min(Math.max(value, 0), 100);

  return (
    <View style={styles.progressTrack}>
      <LinearGradient
        colors={
          positive
            ? ["#7B5CFF", "#B59AFF"]
            : ["#333333", "#666666"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.progressFill,
          {
            width: `${width}%`,
          },
        ]}
      />
    </View>
  );
}

function EventRow({
  event,
}: {
  event: PerformanceEvent;
}) {
  const positive = event.value > 0;
  const negative = event.value < 0;

  return (
    <View style={styles.eventRow}>
      <View style={styles.eventLeft}>
        <View
          style={[
            styles.eventIndicator,
            positive && styles.eventIndicatorPositive,
            negative && styles.eventIndicatorNegative,
          ]}
        />

        <View>
          <Text style={styles.eventLabel}>
            {event.label}
          </Text>

          <Text style={styles.eventDate}>
            {event.date}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.eventValue,
          positive && styles.positiveText,
          negative && styles.negativeText,
        ]}
      >
        {formatSignedINR(event.value)}
      </Text>
    </View>
  );
}

export default function PerformanceScreen() {
  const { profile } = useAuth();

  const [summary, setSummary] =
    useState<PerformanceSummary | null>(null);

  const [events, setEvents] =
    useState<PerformanceEvent[]>([]);

  const [period, setPeriod] =
    useState<PerformancePeriod>("ALL");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeNav, setActiveNav] =
    useState("Performance");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadPerformance(profile.uid);
  }, [profile?.uid]);

  async function loadPerformance(userId: string) {
    try {
      setLoading(true);
      setError("");

      const [summaryData, eventData] =
        await Promise.all([
          getPerformanceSummary(userId),
          getPerformanceEvents(userId),
        ]);

      setSummary(summaryData);
      setEvents(eventData);
    } catch (err: any) {
      console.error("Performance loading error:", err);

      setError(
        err?.message ||
          "Unable to load performance data."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        isEventInPeriod(event, period)
      )
      .sort(
        (a, b) =>
          getEventTimestamp(b) -
          getEventTimestamp(a)
      );
  }, [events, period]);

  const periodPnL = useMemo(() => {
    return filteredEvents.reduce(
      (total, event) => total + event.value,
      0
    );
  }, [filteredEvents]);

  const periodProfit = useMemo(() => {
    return filteredEvents
      .filter((event) => event.value > 0)
      .reduce(
        (total, event) => total + event.value,
        0
      );
  }, [filteredEvents]);

  const periodLoss = useMemo(() => {
    return filteredEvents
      .filter((event) => event.value < 0)
      .reduce(
        (total, event) =>
          total + Math.abs(event.value),
        0
      );
  }, [filteredEvents]);

  const strongestTrade = useMemo(() => {
    if (!events.length) {
      return 0;
    }

    return Math.max(
      ...events.map((event) => event.value)
    );
  }, [events]);

  const weakestTrade = useMemo(() => {
    if (!events.length) {
      return 0;
    }

    return Math.min(
      ...events.map((event) => event.value)
    );
  }, [events]);

  const performanceQuality = useMemo(() => {
    if (!summary) {
      return "—";
    }

    if (
      summary.closedTrades === 0
    ) {
      return "BUILDING";
    }

    if (
      summary.winRate >= 60 &&
      summary.profitFactor >= 1.5
    ) {
      return "STRONG";
    }

    if (
      summary.winRate >= 50 &&
      summary.profitFactor >= 1
    ) {
      return "STABLE";
    }

    if (
      summary.profitFactor >= 0.75
    ) {
      return "WATCH";
    }

    return "WEAK";
  }, [summary]);

  function handleNavigation(item: string) {
    setActiveNav(item);

    const route = getNavigationRoute(item);

    if (route) {
      router.push(route as any);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>
            V1
          </Text>
        </View>

        <ActivityIndicator
          size="small"
          color="#9A7BFF"
        />

        <Text style={styles.loadingText}>
          LOADING PERFORMANCE ENGINE
        </Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View style={styles.screen}>
        <Sidebar
          activeNav={activeNav}
          onNavigate={handleNavigation}
          profile={profile}
        />

        <View style={styles.emptyStateContainer}>
          <VaultSurface
            intensity="strong"
            style={styles.emptyState}
          >
            <Text style={styles.emptyEyebrow}>
              PERFORMANCE ENGINE
            </Text>

            <Text style={styles.emptyTitle}>
              Performance data unavailable
            </Text>

            <Text style={styles.emptyDescription}>
              {error ||
                "Create trades and close positions to begin building your performance history."}
            </Text>
          </VaultSurface>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Sidebar
        activeNav={activeNav}
        onNavigate={handleNavigation}
        profile={profile}
      />

      <View style={styles.main}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                ANALYTICS / PERFORMANCE
              </Text>

              <Text style={styles.title}>
                Performance
              </Text>

              <Text style={styles.subtitle}>
                Measure the quality, consistency and
                efficiency of your capital decisions.
              </Text>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />

                <Text style={styles.liveText}>
                  LIVE ENGINE
                </Text>
              </View>

              <Text style={styles.headerUser}>
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
              <Text style={styles.errorText}>
                {error}
              </Text>
            </VaultSurface>
          ) : null}

          <View style={styles.heroGrid}>
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
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroGlow} />

                <Text style={styles.heroEyebrow}>
                  NET REALIZED PERFORMANCE
                </Text>

                <Text
                  style={[
                    styles.heroValue,
                    summary.totalPnL > 0 &&
                      styles.positiveText,
                    summary.totalPnL < 0 &&
                      styles.negativeText,
                  ]}
                >
                  {formatSignedINR(
                    summary.totalPnL
                  )}
                </Text>

                <View style={styles.heroBottom}>
                  <View>
                    <Text style={styles.heroSmallLabel}>
                      RETURN
                    </Text>

                    <Text
                      style={[
                        styles.heroSmallValue,
                        summary.returnPercent > 0 &&
                          styles.positiveText,
                        summary.returnPercent < 0 &&
                          styles.negativeText,
                      ]}
                    >
                      {formatPercent(
                        summary.returnPercent
                      )}
                    </Text>
                  </View>

                  <View style={styles.heroDivider} />

                  <View>
                    <Text style={styles.heroSmallLabel}>
                      QUALITY
                    </Text>

                    <Text style={styles.heroSmallValue}>
                      {performanceQuality}
                    </Text>
                  </View>

                  <View style={styles.heroDivider} />

                  <View>
                    <Text style={styles.heroSmallLabel}>
                      EXPOSURE
                    </Text>

                    <Text style={styles.heroSmallValue}>
                      {formatINR(
                        summary.exposure
                      )}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </VaultSurface>

            <VaultSurface
              intensity="medium"
              style={styles.qualityCard}
            >
              <View style={styles.qualityHeader}>
                <Text style={styles.cardEyebrow}>
                  TRADE QUALITY
                </Text>

                <Text style={styles.qualityStatus}>
                  {performanceQuality}
                </Text>
              </View>

              <View style={styles.qualityMain}>
                <Text style={styles.qualityNumber}>
                  {formatPercent(
                    summary.winRate
                  )}
                </Text>

                <Text style={styles.qualityLabel}>
                  WIN RATE
                </Text>
              </View>

              <View style={styles.qualityStats}>
                <MiniStat
                  label="WINS"
                  value={String(
                    summary.winningTrades
                  )}
                />

                <MiniStat
                  label="LOSSES"
                  value={String(
                    summary.losingTrades
                  )}
                />

                <MiniStat
                  label="CLOSED"
                  value={String(
                    summary.closedTrades
                  )}
                />
              </View>
            </VaultSurface>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard
              label="TOTAL TRADES"
              value={String(
                summary.totalTrades
              )}
              caption={`${summary.openTrades} currently open`}
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
              label="PROFIT FACTOR"
              value={formatProfitFactor(
                summary.profitFactor
              )}
              caption="Gross profit / gross loss"
              positive={
                summary.profitFactor >= 1
              }
              negative={
                summary.profitFactor > 0 &&
                summary.profitFactor < 1
              }
            />

            <MetricCard
              label="LARGEST WIN"
              value={formatINR(
                summary.largestWin
              )}
              caption="Best realized trade"
              positive
            />

            <MetricCard
              label="LARGEST LOSS"
              value={formatINR(
                summary.largestLoss
              )}
              caption="Worst realized trade"
              negative
            />

            <MetricCard
              label="GROSS PROFIT"
              value={formatINR(
                summary.grossProfit
              )}
              caption="Before losses and fees"
              positive
            />

            <MetricCard
              label="TOTAL FEES"
              value={formatINR(
                summary.totalFees
              )}
              caption="Trading cost drag"
              negative
            />
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>
                PERFORMANCE FLOW
              </Text>

              <Text style={styles.sectionTitle}>
                Performance trajectory
              </Text>
            </View>

            <View style={styles.periodSelector}>
              {periodOptions.map((option) => {
                const selected =
                  period === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() =>
                      setPeriod(
                        option.value
                      )
                    }
                    style={({ pressed }) => [
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
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.flowGrid}>
            <VaultSurface
              intensity="medium"
              style={styles.flowCard}
            >
              <View style={styles.flowHeader}>
                <View>
                  <Text style={styles.cardEyebrow}>
                    SELECTED PERIOD
                  </Text>

                  <Text
                    style={[
                      styles.flowValue,
                      periodPnL > 0 &&
                        styles.positiveText,
                      periodPnL < 0 &&
                        styles.negativeText,
                    ]}
                  >
                    {formatSignedINR(
                      periodPnL
                    )}
                  </Text>
                </View>

                <Text style={styles.flowCount}>
                  {filteredEvents.length} EVENTS
                </Text>
              </View>

              <View style={styles.flowBars}>
                <View style={styles.flowBarRow}>
                  <View style={styles.flowBarLabelRow}>
                    <Text style={styles.flowBarLabel}>
                      PROFIT
                    </Text>

                    <Text
                      style={[
                        styles.flowBarValue,
                        styles.positiveText,
                      ]}
                    >
                      {formatINR(
                        periodProfit
                      )}
                    </Text>
                  </View>

                  <ProgressBar
                    value={
                      periodProfit +
                        periodLoss >
                      0
                        ? (periodProfit /
                            (periodProfit +
                              periodLoss)) *
                          100
                        : 0
                    }
                    positive
                  />
                </View>

                <View style={styles.flowBarRow}>
                  <View style={styles.flowBarLabelRow}>
                    <Text style={styles.flowBarLabel}>
                      LOSS
                    </Text>

                    <Text
                      style={[
                        styles.flowBarValue,
                        styles.negativeText,
                      ]}
                    >
                      {formatINR(
                        periodLoss
                      )}
                    </Text>
                  </View>

                  <ProgressBar
                    value={
                      periodProfit +
                        periodLoss >
                      0
                        ? (periodLoss /
                            (periodProfit +
                              periodLoss)) *
                          100
                        : 0
                    }
                  />
                </View>
              </View>

              <View style={styles.flowFooter}>
                <View>
                  <Text style={styles.flowFooterLabel}>
                    BEST EVENT
                  </Text>

                  <Text
                    style={[
                      styles.flowFooterValue,
                      styles.positiveText,
                    ]}
                  >
                    {formatSignedINR(
                      strongestTrade
                    )}
                  </Text>
                </View>

                <View>
                  <Text style={styles.flowFooterLabel}>
                    WORST EVENT
                  </Text>

                  <Text
                    style={[
                      styles.flowFooterValue,
                      styles.negativeText,
                    ]}
                  >
                    {formatSignedINR(
                      weakestTrade
                    )}
                  </Text>
                </View>
              </View>
            </VaultSurface>

            <VaultSurface
              intensity="medium"
              style={styles.engineCard}
            >
              <Text style={styles.cardEyebrow}>
                PERFORMANCE ENGINE
              </Text>

              <Text style={styles.engineTitle}>
                Where the result comes from
              </Text>

              <View style={styles.engineRows}>
                <EngineRow
                  label="REALIZED P&L"
                  value={formatSignedINR(
                    summary.realizedPnL
                  )}
                  positive={
                    summary.realizedPnL > 0
                  }
                  negative={
                    summary.realizedPnL < 0
                  }
                />

                <EngineRow
                  label="UNREALIZED P&L"
                  value={formatSignedINR(
                    summary.unrealizedPnL
                  )}
                  positive={
                    summary.unrealizedPnL > 0
                  }
                  negative={
                    summary.unrealizedPnL < 0
                  }
                />

                <EngineRow
                  label="GROSS PROFIT"
                  value={formatINR(
                    summary.grossProfit
                  )}
                  positive
                />

                <EngineRow
                  label="GROSS LOSS"
                  value={formatINR(
                    summary.grossLoss
                  )}
                  negative
                />

                <EngineRow
                  label="FEES"
                  value={formatINR(
                    summary.totalFees
                  )}
                  negative
                />
              </View>
            </VaultSurface>
          </View>

          <View style={styles.sectionHeaderSingle}>
            <View>
              <Text style={styles.sectionEyebrow}>
                TRADE HISTORY
              </Text>

              <Text style={styles.sectionTitle}>
                Performance events
              </Text>
            </View>
          </View>

          <VaultSurface
            intensity="medium"
            style={styles.eventsCard}
          >
            <View style={styles.eventsHeader}>
              <Text style={styles.tableHeader}>
                EVENT
              </Text>

              <Text style={styles.tableHeader}>
                RESULT
              </Text>
            </View>

            {filteredEvents.length === 0 ? (
              <View style={styles.noEvents}>
                <Text style={styles.noEventsTitle}>
                  No events in this period
                </Text>

                <Text style={styles.noEventsText}>
                  Choose another period or close
                  additional trades.
                </Text>
              </View>
            ) : (
              filteredEvents
                .slice(0, 12)
                .map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                  />
                ))
            )}

            {filteredEvents.length > 12 ? (
              <View style={styles.moreEvents}>
                <Text style={styles.moreEventsText}>
                  Showing latest 12 events
                </Text>
              </View>
            ) : null}
          </VaultSurface>

          <View style={styles.qualityGrid}>
            <VaultSurface
              intensity="medium"
              style={styles.qualityDetailCard}
            >
              <Text style={styles.cardEyebrow}>
                TRADE DISTRIBUTION
              </Text>

              <Text style={styles.detailTitle}>
                Winning vs losing
              </Text>

              <View style={styles.distribution}>
                <View style={styles.distributionBlock}>
                  <Text
                    style={[
                      styles.distributionNumber,
                      styles.positiveText,
                    ]}
                  >
                    {summary.winningTrades}
                  </Text>

                  <Text style={styles.distributionLabel}>
                    WINNING
                  </Text>

                  <ProgressBar
                    value={
                      summary.closedTrades > 0
                        ? (summary.winningTrades /
                            summary.closedTrades) *
                          100
                        : 0
                    }
                    positive
                  />
                </View>

                <View style={styles.distributionBlock}>
                  <Text
                    style={[
                      styles.distributionNumber,
                      styles.negativeText,
                    ]}
                  >
                    {summary.losingTrades}
                  </Text>

                  <Text style={styles.distributionLabel}>
                    LOSING
                  </Text>

                  <ProgressBar
                    value={
                      summary.closedTrades > 0
                        ? (summary.losingTrades /
                            summary.closedTrades) *
                          100
                        : 0
                    }
                  />
                </View>
              </View>
            </VaultSurface>

            <VaultSurface
              intensity="medium"
              style={styles.qualityDetailCard}
            >
              <Text style={styles.cardEyebrow}>
                CAPITAL EFFICIENCY
              </Text>

              <Text style={styles.detailTitle}>
                Exposure & return
              </Text>

              <View style={styles.capitalStats}>
                <MiniStat
                  label="EXPOSURE"
                  value={formatINR(
                    summary.exposure
                  )}
                />

                <MiniStat
                  label="RETURN"
                  value={formatPercent(
                    summary.returnPercent
                  )}
                />

                <MiniStat
                  label="TOTAL P&L"
                  value={formatSignedINR(
                    summary.totalPnL
                  )}
                />
              </View>
            </VaultSurface>
          </View>

          <VaultSurface
            intensity="subtle"
            style={styles.engineNote}
          >
            <View style={styles.noteMark}>
              <Text style={styles.noteMarkText}>
                V1
              </Text>
            </View>

            <View style={styles.noteContent}>
              <Text style={styles.noteTitle}>
                PERFORMANCE ENGINE NOTE
              </Text>

              <Text style={styles.noteText}>
                Performance is currently derived from
                Vault1 trade records. Realized P&L,
                win rate, profit factor, fees and
                exposure update from the trading
                ledger. Live market pricing and
                portfolio-level unrealized performance
                will be connected as the market-data
                layer is introduced.
              </Text>
            </View>
          </VaultSurface>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              VAULT1 / PERFORMANCE COMMAND CENTER
            </Text>

            <Text style={styles.footerVersion}>
              PERFORMANCE ENGINE 1.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function EngineRow({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={styles.engineRow}>
      <Text style={styles.engineRowLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.engineRowValue,
          positive && styles.positiveText,
          negative && styles.negativeText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Sidebar({
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
      <View style={styles.brandArea}>
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

            {group.items.map((item) => {
              const selected =
                activeNav === item;

              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    onNavigate(item)
                  }
                  style={({ pressed }) => [
                    styles.navItem,
                    selected &&
                      styles.navItemActive,
                    pressed &&
                      styles.navItemPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.navIndicator,
                      selected &&
                        styles.navIndicatorActive,
                    ]}
                  />

                  <Text
                    style={[
                      styles.navText,
                      selected &&
                        styles.navTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                  {selected ? (
                    <Text style={styles.navArrow}>
                      ›
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.profileMark}>
          <Text style={styles.profileMarkText}>
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
    borderWidth: 1,
    borderColor: "#3A3155",
    backgroundColor: "#FFFFFF",
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

  brandArea: {
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 9,
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

  liveBadge: {
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

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#A787FF",
  },

  liveText: {
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
    marginBottom: 18,
    padding: 15,
  },

  errorText: {
    color: "#B88787",
    fontSize: 11,
    fontWeight: "700",
  },

  heroGrid: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 18,
  },

  heroCard: {
    flex: 1.65,
    minHeight: 255,
  },

  heroGradient: {
    flex: 1,
    minHeight: 253,
    padding: 27,
    position: "relative",
    overflow: "hidden",
  },

  heroGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(117, 76, 214, 0.08)",
    right: -80,
    top: -110,
  },

  heroEyebrow: {
    color: "#71677F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  heroValue: {
    color: "#3F3F3B",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1.8,
    marginTop: 16,
  },

  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 29,
    gap: 24,
  },

  heroSmallLabel: {
    color: "#4C4654",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  heroSmallValue: {
    color: "#B8B3C0",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 5,
  },

  heroDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#FFFFFF",
  },

  qualityCard: {
    flex: 1,
    minHeight: 255,
    padding: 24,
  },

  qualityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardEyebrow: {
    color: "#59545F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  qualityStatus: {
    color: "#9B7CF0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  qualityMain: {
    marginTop: 31,
  },

  qualityNumber: {
    color: "#4A4A46",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  qualityLabel: {
    color: "#514D56",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 4,
  },

  qualityStats: {
    flexDirection: "row",
    marginTop: 31,
    gap: 28,
  },

  miniStat: {
    minWidth: 65,
  },

  miniStatLabel: {
    color: "#4D4D4D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  miniStatValue: {
    color: "#D3D3D3",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 39,
  },

  metricCard: {
    width: "23.7%",
    minHeight: 138,
  },

  metricCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },

  metricTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#595959",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.35,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },

  sectionHeaderSingle: {
    marginBottom: 15,
    marginTop: 38,
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

  periodSelector: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#1D1D1D",
  },

  periodButton: {
    paddingHorizontal: 13,
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

  flowGrid: {
    flexDirection: "row",
    gap: 18,
  },

  flowCard: {
    flex: 1.45,
    minHeight: 320,
    padding: 24,
  },

  flowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  flowValue: {
    color: "#5F5F5B",
    fontSize: 31,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.8,
  },

  flowCount: {
    color: "#4C4C4C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 3,
  },

  flowBars: {
    marginTop: 32,
  },

  flowBarRow: {
    marginBottom: 21,
  },

  flowBarLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  flowBarLabel: {
    color: "#5B5B5B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  flowBarValue: {
    fontSize: 10,
    fontWeight: "800",
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
  },

  flowFooter: {
    flexDirection: "row",
    gap: 55,
    borderTopWidth: 1,
    borderTopColor: "#1B1B1B",
    paddingTop: 20,
    marginTop: 2,
  },

  flowFooterLabel: {
    color: "#454545",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  flowFooterValue: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 5,
  },

  engineCard: {
    flex: 1,
    minHeight: 320,
    padding: 24,
  },

  engineTitle: {
    color: "#D5D5D5",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: -0.4,
  },

  engineRows: {
    marginTop: 23,
  },

  engineRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#171717",
  },

  engineRowLabel: {
    color: "#575757",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  engineRowValue: {
    color: "#C9C9C9",
    fontSize: 12,
    fontWeight: "800",
  },

  eventsCard: {
    overflow: "hidden",
  },

  eventsHeader: {
    height: 47,
    paddingHorizontal: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1C",
  },

  tableHeader: {
    color: "#454545",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  eventRow: {
    minHeight: 68,
    paddingHorizontal: 21,
    borderBottomWidth: 1,
    borderBottomColor: "#151515",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eventLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  eventIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },

  eventIndicatorPositive: {
    backgroundColor: "#8C70DB",
  },

  eventIndicatorNegative: {
    backgroundColor: "#8A5967",
  },

  eventLabel: {
    color: "#C9C9C9",
    fontSize: 12,
    fontWeight: "800",
  },

  eventDate: {
    color: "#4B4B4B",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4,
  },

  eventValue: {
    color: "#C7C7C7",
    fontSize: 13,
    fontWeight: "900",
  },

  noEvents: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  noEventsTitle: {
    color: "#A5A5A5",
    fontSize: 14,
    fontWeight: "800",
  },

  noEventsText: {
    color: "#4D4D4D",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 7,
  },

  moreEvents: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#171717",
  },

  moreEventsText: {
    color: "#4A4A4A",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },

  qualityGrid: {
    flexDirection: "row",
    gap: 18,
    marginTop: 18,
  },

  qualityDetailCard: {
    flex: 1,
    minHeight: 220,
    padding: 24,
  },

  detailTitle: {
    color: "#D5D5D5",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 7,
  },

  distribution: {
    flexDirection: "row",
    gap: 42,
    marginTop: 30,
  },

  distributionBlock: {
    flex: 1,
  },

  distributionNumber: {
    color: "#DADADA",
    fontSize: 31,
    fontWeight: "900",
  },

  distributionLabel: {
    color: "#505050",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginTop: 3,
    marginBottom: 11,
  },

  capitalStats: {
    flexDirection: "row",
    gap: 38,
    marginTop: 30,
  },

  engineNote: {
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
    fontWeight: "600",
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

  emptyStateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyState: {
    width: "100%",
    maxWidth: 650,
    padding: 35,
  },

  emptyEyebrow: {
    color: "#8061D4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  emptyTitle: {
    color: "#5F5F5B",
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
});