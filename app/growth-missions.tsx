import React, { useEffect, useMemo, useState } from "react";
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

import { useAuth } from "../services/auth/AuthProvider";
import { FONT, COLORS } from "./theme/theme";

import {
  createGrowthMission,
  getGrowthMissions,
  activateGrowthMission,
  pauseGrowthMission,
  resumeGrowthMission,
  calculateMissionProgress,
  calculateMissionReturn,
  getGrowthMissionDays,
  getGrowthMissionTrades,
  recordGrowthMissionTrade,
  closeGrowthMissionTrade,
  refreshMissionAggregates,
  deleteGrowthMission,
} from "../services/growthMissions/growthMissionService";

import {
  GrowthMission,
  GrowthMissionDay,
  GrowthMissionTrade,
  GrowthMissionAssetClass,
  GrowthMissionBias,
  GrowthMissionPosition,
} from "../types/growthMission";

const navigation = [
  { section: "COMMAND", items: ["Dashboard"] },
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
  { section: "MONEY", items: ["Capital", "Cashflow", "Transactions"] },
  { section: "ANALYTICS", items: ["Performance", "Risk", "Reports"] },
  { section: "INVESTORS", items: ["Investors", "Payouts", "Documents"] },
];

function formatCurrency(value: number) {
  return `₹${Math.abs(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatPreciseCurrency(value: number) {
  return `₹${Math.abs(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedCurrency(value: number) {
  if (!value) return "₹0";
  return value > 0
    ? `+₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : `-₹${Math.abs(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: any) {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: any) {
  if (!value) return "";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GrowthMissionsScreen() {
  const { profile } = useAuth();
  const userId = profile?.uid;

  const [missions, setMissions] = useState<GrowthMission[]>([]);
  const [days, setDays] = useState<GrowthMissionDay[]>([]);
  const [trades, setTrades] = useState<GrowthMissionTrade[]>([]);
  const [selectedDayId, setSelectedDayId] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [createVisible, setCreateVisible] = useState(false);
  const [tradeVisible, setTradeVisible] = useState(false);
  const [closeVisible, setCloseVisible] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startingCapital, setStartingCapital] = useState("");
  const [targetCapital, setTargetCapital] = useState("");
  const [durationDays, setDurationDays] = useState("30");

  const [assetClass, setAssetClass] = useState<GrowthMissionAssetClass>("STOCK");
  const [instrument, setInstrument] = useState("");
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState("");
  const [broker, setBroker] = useState("");
  const [position, setPosition] = useState<GrowthMissionPosition>("LONG");
  const [bias, setBias] = useState<GrowthMissionBias>("BULLISH");
  const [strategy, setStrategy] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [leverage, setLeverage] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [thesis, setThesis] = useState("");
  const [entryReason, setEntryReason] = useState("");
  const [tradeNotes, setTradeNotes] = useState("");

  const [closingTrade, setClosingTrade] = useState<GrowthMissionTrade | null>(null);
  const [exitPrice, setExitPrice] = useState("");
  const [fees, setFees] = useState("");
  const [exitReason, setExitReason] = useState("MANUAL");
  const [exitNotes, setExitNotes] = useState("");

  const activeMission = useMemo(
    () => missions.find((mission) => mission.status === "ACTIVE") || null,
    [missions]
  );

  const selectedDay = useMemo(
    () => days.find((day) => day.id === selectedDayId) || days[0] || null,
    [days, selectedDayId]
  );

  const completedMissions = missions.filter((m) => m.status === "COMPLETED").length;
  const totalTargetCapital = missions.reduce((sum, m) => sum + m.targetCapital, 0);

  async function loadMissions() {
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMissions(await getGrowthMissions(userId));
    } catch (err: any) {
      setError(err?.message || "Unable to load growth missions.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMissionDetails(missionId: string) {
    try {
      setDetailsLoading(true);
      const missionDays = await getGrowthMissionDays(missionId);
      setDays(missionDays);
      const firstDay = missionDays.find((d) => d.status === "ACTIVE") || missionDays[0];
      setSelectedDayId(firstDay?.id || "");
      if (firstDay) {
        setTrades(await getGrowthMissionTrades(missionId, firstDay.id));
      } else {
        setTrades([]);
      }
    } catch (err: any) {
      setError(err?.message || "Unable to load the mission target map.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function selectDay(day: GrowthMissionDay) {
    if (!activeMission) return;
    setSelectedDayId(day.id);
    try {
      setDetailsLoading(true);
      setTrades(await getGrowthMissionTrades(activeMission.id, day.id));
    } catch (err: any) {
      setError(err?.message || "Unable to load trades.");
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, [userId]);

  useEffect(() => {
    if (activeMission) {
      loadMissionDetails(activeMission.id);
    } else {
      setDays([]);
      setTrades([]);
      setSelectedDayId("");
    }
  }, [activeMission?.id]);

  function resetCreateForm() {
    setName("");
    setDescription("");
    setStartingCapital("");
    setTargetCapital("");
    setDurationDays("30");
    setError("");
  }

  function resetTradeForm() {
    setAssetClass("STOCK");
    setInstrument("");
    setSymbol("");
    setExchange("");
    setBroker("");
    setPosition("LONG");
    setBias("BULLISH");
    setStrategy("");
    setEntryPrice("");
    setQuantity("");
    setPositionSize("");
    setLeverage("");
    setStopLoss("");
    setTakeProfit("");
    setThesis("");
    setEntryReason("");
    setTradeNotes("");
  }

  async function handleCreateMission() {
    if (!userId) {
      setError("You must be logged in.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await createGrowthMission({
        userId,
        name,
        description,
        startingCapital: Number(startingCapital),
        targetCapital: Number(targetCapital),
        durationDays: Number(durationDays),
        status: "DRAFT",
      });
      setCreateVisible(false);
      resetCreateForm();
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to create mission.");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      setSaving(true);
      setError("");
      await activateGrowthMission(id);
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to activate mission.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePause(id: string) {
    try {
      setSaving(true);
      await pauseGrowthMission(id);
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to pause mission.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResume(id: string) {
    try {
      setSaving(true);
      await resumeGrowthMission(id);
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to resume mission.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMission(mission: GrowthMission) {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(
            `Delete "${mission.name}"? This will permanently remove the mission, its target map and recorded trades.`
          );

    if (!confirmed) return;

    try {
      setSaving(true);
      setError("");
      await deleteGrowthMission(mission.id);
      if (activeMission?.id === mission.id) {
        setDays([]);
        setTrades([]);
        setSelectedDayId("");
      }
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to delete mission.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRecordTrade() {
    if (!activeMission || !selectedDay || !userId) return;
    try {
      setSaving(true);
      setError("");
      await recordGrowthMissionTrade({
        missionId: activeMission.id,
        missionDayId: selectedDay.id,
        userId,
        assetClass,
        instrument,
        symbol,
        exchange,
        broker,
        position,
        bias,
        strategy,
        entryPrice: Number(entryPrice),
        quantity: Number(quantity),
        positionSize: Number(positionSize),
        leverage: leverage ? Number(leverage) : undefined,
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
        thesis,
        entryReason,
        notes: tradeNotes,
      });
      setTradeVisible(false);
      resetTradeForm();
      await refreshMissionAggregates(activeMission.id);
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to record trade.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseTrade() {
    if (!closingTrade || !activeMission || !selectedDay) return;
    try {
      setSaving(true);
      setError("");
      await closeGrowthMissionTrade({
        tradeId: closingTrade.id,
        missionId: activeMission.id,
        missionDayId: selectedDay.id,
        exitPrice: Number(exitPrice),
        fees: fees ? Number(fees) : 0,
        exitReason: exitReason as any,
        exitNotes: exitNotes,
      });
      setCloseVisible(false);
      setClosingTrade(null);
      setExitPrice("");
      setFees("");
      setExitNotes("");
      await loadMissionDetails(activeMission.id);
      await loadMissions();
    } catch (err: any) {
      setError(err?.message || "Unable to close trade.");
    } finally {
      setSaving(false);
    }
  }

  function handleNavigation(item: string) {
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
    const route = routes[item];
    if (route) router.push(route as any);
  }

  const progress = activeMission ? calculateMissionProgress(activeMission) : 0;
  const missionReturn = activeMission ? calculateMissionReturn(activeMission) : 0;

  return (
    <View style={styles.root}>
      <View style={styles.sidebar} pointerEvents="none">
        <Pressable style={styles.brandContainer} onPress={() => router.replace("/dashboard")}>
          <Text style={styles.brand}>VAULT1</Text>
          <View style={styles.brandRow}>
            <View style={styles.brandAccent} />
            <Text style={styles.brandSub}>WEALTH OS</Text>
          </View>
        </Pressable>

        <View style={styles.sidebarDivider} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.navContent}>
          {navigation.map((group) => (
            <View key={group.section} style={styles.navGroup}>
              <Text style={styles.navSection}>{group.section}</Text>
              {group.items.map((item) => {
                const active = item === "Growth Missions";
                return (
                  <Pressable
                    key={item}
                    onPress={() => handleNavigation(item)}
                    style={[styles.navItem, active && styles.navItemActive]}
                  >
                    <View style={[styles.navDot, active && styles.navDotActive]} />
                    <Text style={[styles.navText, active && styles.navTextActive]}>{item}</Text>
                    {active && <Text style={styles.navArrow}>›</Text>}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={styles.sidebarBottom}>
          <Text style={styles.sidebarFooterLabel}>GROWTH ENGINE</Text>
          <Text style={styles.sidebarFooterText}>
            Target-based capital growth with measurable trajectory.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.commandLabel}>
              <View style={styles.commandLine} />
              <Text style={styles.breadcrumb}>VAULT1 / GROWTH</Text>
            </View>
            <Text style={styles.pageTitle}>Growth Missions</Text>
            <Text style={styles.pageSubtitle}>
              Turn capital targets into measurable operating missions.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              resetCreateForm();
              setCreateVisible(true);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>+ NEW MISSION</Text>
          </Pressable>
        </View>

        <View style={styles.kpiGrid}>
          <MetricCard label="TOTAL MISSIONS" value={String(missions.length)} detail="Created in Vault1" />
          <MetricCard
            label="ACTIVE MISSION"
            value={activeMission ? "1" : "0"}
            detail={activeMission?.name || "No active mission"}
            accent
          />
          <MetricCard label="COMPLETED" value={String(completedMissions)} detail="Targets achieved" />
          <MetricCard
            label="TARGET CAPITAL"
            value={formatCurrency(totalTargetCapital)}
            detail="Across all missions"
            accent
          />
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {activeMission ? (
          <>
            <View style={styles.activeMissionCard}>
              <View style={styles.activeMissionGlow} />
              <View style={styles.activeMissionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardEyebrow}>ACTIVE GROWTH MISSION</Text>
                  <Text style={styles.activeMissionTitle}>{activeMission.name}</Text>
                  <Text style={styles.activeMissionDescription}>
                    {activeMission.description}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <View style={styles.activeBadgeDot} />
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.activeMissionNumbers}>
                <MissionNumber label="STARTING CAPITAL" value={formatCurrency(activeMission.startingCapital)} />
                <MissionNumber label="CURRENT CAPITAL" value={formatCurrency(activeMission.currentCapital)} accent />
                <MissionNumber label="TARGET CAPITAL" value={formatCurrency(activeMission.targetCapital)} />
                <MissionNumber label="REMAINING" value={formatCurrency(activeMission.remainingCapital)} />
              </View>

              <View style={styles.activeProgressSection}>
                <View style={styles.activeProgressHeader}>
                  <View>
                    <Text style={styles.progressLabel}>MISSION PROGRESS</Text>
                    <Text style={styles.progressSub}>
                      {formatCurrency(activeMission.currentCapital)} of {formatCurrency(activeMission.targetCapital)}
                    </Text>
                  </View>
                  <Text style={styles.activeProgressPercent}>{progress.toFixed(1)}%</Text>
                </View>
                <View style={styles.progressTrackLarge}>
                  <View style={[styles.progressFillLarge, { width: `${progress}%` }]} />
                </View>
              </View>

              <View style={styles.activeStats}>
                <MissionStat label="REQUIRED RETURN" value={`${activeMission.targetReturnPercent.toFixed(2)}%`} />
                <MissionStat label="DAILY COMPOUNDED TARGET" value={`${activeMission.requiredAverageGrowthPercent.toFixed(3)}%`} />
                <MissionStat
                  label="REALIZED P&L"
                  value={formatSignedCurrency(activeMission.realizedPnL)}
                  accent={activeMission.realizedPnL > 0}
                />
                <MissionStat label="RETURN" value={`${missionReturn.toFixed(2)}%`} accent={missionReturn > 0} />
                <MissionStat label="TRADES" value={String(activeMission.tradesCount)} />
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => setTradeVisible(true)}
                  style={styles.tradeButton}
                >
                  <Text style={styles.tradeButtonText}>+ RECORD TRADE</Text>
                </Pressable>
                <Pressable
                  onPress={() => handlePause(activeMission.id)}
                  style={styles.pauseButton}
                  disabled={saving}
                >
                  <Text style={styles.pauseButtonText}>PAUSE MISSION</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.targetMapHeader}>
              <View>
                <Text style={styles.sectionTitle}>Target Map</Text>
                <Text style={styles.sectionSubtitle}>
                  The capital trajectory Vault1 expects you to follow.
                </Text>
              </View>
              <Text style={styles.sectionCount}>{days.length} DAYS</Text>
            </View>

            <View style={styles.dayStrip}>
              {detailsLoading && days.length === 0 ? (
                <ActivityIndicator color={COLORS.bull} />
              ) : (
                days.map((day) => {
                  const selected = day.id === selectedDay?.id;
                  const dayActual = day.closingCapital || day.openingCapital;
                  const dayDelta = dayActual - day.targetCapital;
                  return (
                    <Pressable
                      key={day.id}
                      onPress={() => selectDay(day)}
                      style={[styles.dayCard, selected && styles.dayCardSelected]}
                    >
                      <View style={styles.dayTop}>
                        <Text style={styles.dayNumber}>DAY {day.dayNumber}</Text>
                        <View style={[styles.dayStatusDot, day.status === "COMPLETED" && styles.dayStatusDone]} />
                      </View>
                      <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                      <Text style={styles.dayTarget}>{formatCurrency(day.targetCapital)}</Text>
                      <Text style={[styles.dayDelta, dayDelta >= 0 && styles.positiveText]}>
                        {day.status === "UPCOMING"
                          ? "UPCOMING"
                          : `${dayDelta >= 0 ? "+" : "-"}${formatCurrency(Math.abs(dayDelta))} vs target`}
                      </Text>
                      <View style={styles.dayMiniTrack}>
                        <View
                          style={[
                            styles.dayMiniFill,
                            {
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  day.targetCapital > 0
                                    ? (dayActual / day.targetCapital) * 100
                                    : 0
                                )
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            {selectedDay ? (
              <View style={styles.dayDetailCard}>
                <View style={styles.dayDetailHeader}>
                  <View>
                    <Text style={styles.cardEyebrow}>MISSION DAY {selectedDay.dayNumber}</Text>
                    <Text style={styles.dayDetailTitle}>{formatDate(selectedDay.date)}</Text>
                    <Text style={styles.dayDetailSubtitle}>
                      Opening {formatCurrency(selectedDay.openingCapital)} → Target {formatCurrency(selectedDay.targetCapital)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setTradeVisible(true)} style={styles.smallPrimaryButton}>
                    <Text style={styles.smallPrimaryText}>+ TRADE</Text>
                  </Pressable>
                </View>

                <View style={styles.dayMetrics}>
                  <MissionStat label="EXPECTED GROWTH" value={`${selectedDay.expectedGrowthPercent.toFixed(2)}%`} />
                  <MissionStat label="ACTUAL GROWTH" value={`${(selectedDay.actualGrowthPercent || 0).toFixed(2)}%`} />
                  <MissionStat label="NET P&L" value={formatSignedCurrency(selectedDay.netPnL || 0)} accent={(selectedDay.netPnL || 0) > 0} />
                  <MissionStat label="TRADES" value={String(selectedDay.tradesCount)} />
                  <MissionStat label="FEES" value={formatCurrency(selectedDay.fees || 0)} />
                </View>

                <View style={styles.tradeHeader}>
                  <Text style={styles.subsectionTitle}>Trade Ledger</Text>
                  <Text style={styles.sectionCount}>{trades.length} TRADES</Text>
                </View>

                {detailsLoading ? (
                  <ActivityIndicator color={COLORS.bull} />
                ) : trades.length === 0 ? (
                  <View style={styles.tradeEmpty}>
                    <Text style={styles.tradeEmptyTitle}>No trades recorded</Text>
                    <Text style={styles.tradeEmptyText}>
                      Record the first trade for this mission day. Every trade rolls into the day result and mission capital.
                    </Text>
                    <Pressable onPress={() => setTradeVisible(true)} style={styles.secondaryButton}>
                      <Text style={styles.secondaryButtonText}>RECORD FIRST TRADE</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.tradeTable}>
                    {trades.map((trade) => (
                      <View key={trade.id} style={styles.tradeRow}>
                        <View style={styles.tradeIdentity}>
                          <Text style={styles.tradeNumber}>#{trade.tradeNumber}</Text>
                          <View>
                            <Text style={styles.tradeInstrument}>{trade.instrument}</Text>
                            <Text style={styles.tradeMeta}>
                              {trade.symbol || trade.assetClass} · {trade.position} · {trade.strategy || "No strategy"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.tradeCell}>
                          <Text style={styles.tableLabel}>ENTRY</Text>
                          <Text style={styles.tableValue}>{formatPreciseCurrency(trade.entryPrice)}</Text>
                        </View>
                        <View style={styles.tradeCell}>
                          <Text style={styles.tableLabel}>SIZE</Text>
                          <Text style={styles.tableValue}>{formatCurrency(trade.positionSize)}</Text>
                        </View>
                        <View style={styles.tradeCell}>
                          <Text style={styles.tableLabel}>RESULT</Text>
                          <Text
                            style={[
                              styles.tableValue,
                              trade.result === "WIN" && styles.positiveText,
                              trade.result === "LOSS" && styles.negativeText,
                            ]}
                          >
                            {trade.status === "OPEN" ? "OPEN" : formatSignedCurrency(trade.netPnL)}
                          </Text>
                        </View>
                        {trade.status === "OPEN" && (
                          <Pressable
                            onPress={() => {
                              setClosingTrade(trade);
                              setExitPrice("");
                              setFees("");
                              setExitNotes("");
                              setCloseVisible(true);
                            }}
                            style={styles.closeTradeButton}
                          >
                            <Text style={styles.closeTradeText}>CLOSE</Text>
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Mission Book</Text>
            <Text style={styles.sectionSubtitle}>Every growth objective defined inside Vault1.</Text>
          </View>
          <Text style={styles.sectionCount}>{missions.length} MISSIONS</Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={COLORS.bull} />
            <Text style={styles.emptyTitle}>Loading missions</Text>
            <Text style={styles.emptyText}>Retrieving your growth mission book.</Text>
          </View>
        ) : missions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View>
            <Text style={styles.emptyTitle}>No growth missions</Text>
            <Text style={styles.emptyText}>
              Create a capital target such as ₹500 → ₹19,000 and Vault1 will calculate the required trajectory.
            </Text>
            <Pressable onPress={() => setCreateVisible(true)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>CREATE FIRST MISSION</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.missionGrid}>
            {missions.map((mission) => {
              const missionProgress = calculateMissionProgress(mission);
              const returnPercent = calculateMissionReturn(mission);
              return (
                <View key={mission.id} style={styles.missionCard}>
                  <View style={styles.missionCardHeader}>
                    <View style={styles.missionCardTitleBlock}>
                      <Text style={styles.missionCardTitle}>{mission.name}</Text>
                      <Text style={styles.missionCardDescription} numberOfLines={2}>{mission.description}</Text>
                    </View>
                    <View style={styles.missionCardActions}>
                      <StatusBadge status={mission.status} />
                      <Pressable
                        onPress={() => handleDeleteMission(mission)}
                        style={styles.deleteIconButton}
                      >
                        <Text style={styles.deleteIconButtonText}>DELETE</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.targetRow}>
                    <View>
                      <Text style={styles.targetLabel}>START</Text>
                      <Text style={styles.targetValue}>{formatCurrency(mission.startingCapital)}</Text>
                    </View>
                    <Text style={styles.targetArrow}>→</Text>
                    <View style={styles.targetRight}>
                      <Text style={styles.targetLabel}>TARGET</Text>
                      <Text style={styles.targetValueTarget}>{formatCurrency(mission.targetCapital)}</Text>
                    </View>
                  </View>

                  <View style={styles.smallProgressHeader}>
                    <Text style={styles.smallProgressLabel}>PROGRESS</Text>
                    <Text style={styles.smallProgressPercent}>{missionProgress.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.smallProgressTrack}>
                    <View style={[styles.smallProgressFill, { width: `${missionProgress}%` }]} />
                  </View>

                  <View style={styles.missionMetrics}>
                    <MissionMetric label="CURRENT" value={formatCurrency(mission.currentCapital)} />
                    <MissionMetric label="RETURN" value={`${returnPercent.toFixed(2)}%`} />
                    <MissionMetric label="DURATION" value={`${mission.durationDays}D`} />
                    <MissionMetric label="TRADES" value={String(mission.tradesCount)} />
                  </View>

                  {mission.status === "DRAFT" && !activeMission && (
                    <Pressable onPress={() => handleActivate(mission.id)} style={styles.activateButton}>
                      <Text style={styles.activateButtonText}>ACTIVATE + BUILD TARGET MAP</Text>
                      <Text style={styles.activateArrow}>→</Text>
                    </Pressable>
                  )}

                  {mission.status === "PAUSED" && !activeMission && (
                    <Pressable onPress={() => handleResume(mission.id)} style={styles.activateButton}>
                      <Text style={styles.activateButtonText}>RESUME MISSION</Text>
                      <Text style={styles.activateArrow}>→</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.foundationCard}>
          <View style={styles.foundationAccent} />
          <View style={styles.foundationContent}>
            <Text style={styles.foundationEyebrow}>GROWTH MISSION ENGINE</Text>
            <Text style={styles.foundationTitle}>Target → trajectory → execution → result.</Text>
            <Text style={styles.foundationText}>
              Vault1 now creates a day-by-day target map when a mission is activated. Individual trades are recorded against a mission day, and closed-trade P&L rolls upward into day performance, mission capital, progress, win rate, profit factor and drawdown.
            </Text>
            <View style={styles.foundationPoints}>
              <FoundationPoint title="TARGET" text="Define exactly where capital needs to reach." />
              <FoundationPoint title="TRAJECTORY" text="Know the compounded growth required each day." />
              <FoundationPoint title="EXECUTION" text="Record every trade and measure it against the mission." />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>VAULT1 · PRIVATE CAPITAL OPERATING SYSTEM</Text>
          <Text style={styles.footerText}>{profile?.role || "VIEWER"}</Text>
        </View>
      </ScrollView>

      <Modal visible={createVisible} animationType="fade" transparent onRequestClose={() => setCreateVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ModalHeader eyebrow="GROWTH ENGINE" title="New Mission" subtitle="Define the capital destination." onClose={() => setCreateVisible(false)} />
              <Input label="MISSION NAME" value={name} onChangeText={setName} placeholder="e.g. ₹500 → ₹19K Challenge" />
              <Input label="DESCRIPTION" value={description} onChangeText={setDescription} placeholder="What are you trying to achieve?" multiline />
              <View style={styles.twoColumn}>
                <View style={styles.column}>
                  <Input label="STARTING CAPITAL" value={startingCapital} onChangeText={setStartingCapital} placeholder="500" keyboardType="numeric" />
                </View>
                <View style={styles.column}>
                  <Input label="TARGET CAPITAL" value={targetCapital} onChangeText={setTargetCapital} placeholder="19000" keyboardType="numeric" />
                </View>
              </View>
              <Input label="DURATION IN DAYS" value={durationDays} onChangeText={setDurationDays} placeholder="30" keyboardType="numeric" />

              {Number(startingCapital) > 0 && Number(targetCapital) > Number(startingCapital) && Number(durationDays) > 0 ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewEyebrow}>MISSION PREVIEW</Text>
                  <View style={styles.previewRow}>
                    <PreviewMetric
                      label="REQUIRED RETURN"
                      value={`${(((Number(targetCapital) - Number(startingCapital)) / Number(startingCapital)) * 100).toFixed(2)}%`}
                    />
                    <PreviewMetric
                      label="COMPOUNDED DAILY TARGET"
                      value={`${((Math.pow(Number(targetCapital) / Number(startingCapital), 1 / Number(durationDays)) - 1) * 100).toFixed(3)}%`}
                    />
                    <PreviewMetric
                      label="CAPITAL GAIN"
                      value={formatCurrency(Number(targetCapital) - Number(startingCapital))}
                    />
                  </View>
                </View>
              ) : null}

              {error ? <View style={styles.modalError}><Text style={styles.modalErrorText}>{error}</Text></View> : null}

              <Pressable onPress={handleCreateMission} disabled={saving} style={[styles.modalPrimaryButton, saving && styles.disabledButton]}>
                {saving ? <ActivityIndicator color={COLORS.glassBg} /> : <Text style={styles.modalPrimaryText}>CREATE MISSION</Text>}
              </Pressable>
              <Pressable onPress={() => setCreateVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={tradeVisible} animationType="fade" transparent onRequestClose={() => setTradeVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.tradeModalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ModalHeader
                eyebrow={`DAY ${selectedDay?.dayNumber || "—"} · TRADE ENTRY`}
                title="Record Trade"
                subtitle={selectedDay ? `Target: ${formatCurrency(selectedDay.targetCapital)}` : "Select a mission day."}
                onClose={() => setTradeVisible(false)}
              />

              <View style={styles.choiceRow}>
                <Choice label="LONG" selected={position === "LONG"} onPress={() => setPosition("LONG")} />
                <Choice label="SHORT" selected={position === "SHORT"} onPress={() => setPosition("SHORT")} />
                <Choice label="BULLISH" selected={bias === "BULLISH"} onPress={() => setBias("BULLISH")} />
                <Choice label="BEARISH" selected={bias === "BEARISH"} onPress={() => setBias("BEARISH")} />
              </View>

              <Input label="ASSET CLASS" value={assetClass} onChangeText={(v) => setAssetClass(v.toUpperCase() as GrowthMissionAssetClass)} placeholder="STOCK" />
              <Input label="INSTRUMENT / COIN / PAIR" value={instrument} onChangeText={setInstrument} placeholder="e.g. RELIANCE" />

              <View style={styles.twoColumn}>
                <View style={styles.column}><Input label="SYMBOL" value={symbol} onChangeText={setSymbol} placeholder="RELIANCE" /></View>
                <View style={styles.column}><Input label="EXCHANGE" value={exchange} onChangeText={setExchange} placeholder="NSE" /></View>
              </View>

              <View style={styles.twoColumn}>
                <View style={styles.column}><Input label="BROKER" value={broker} onChangeText={setBroker} placeholder="Broker" /></View>
                <View style={styles.column}><Input label="STRATEGY / SETUP" value={strategy} onChangeText={setStrategy} placeholder="Breakout" /></View>
              </View>

              <View style={styles.twoColumn}>
                <View style={styles.column}><Input label="ENTRY PRICE" value={entryPrice} onChangeText={setEntryPrice} placeholder="100" keyboardType="numeric" /></View>
                <View style={styles.column}><Input label="QUANTITY" value={quantity} onChangeText={setQuantity} placeholder="10" keyboardType="numeric" /></View>
              </View>

              <View style={styles.twoColumn}>
                <View style={styles.column}><Input label="POSITION SIZE" value={positionSize} onChangeText={setPositionSize} placeholder="1000" keyboardType="numeric" /></View>
                <View style={styles.column}><Input label="LEVERAGE" value={leverage} onChangeText={setLeverage} placeholder="1" keyboardType="numeric" /></View>
              </View>

              <View style={styles.twoColumn}>
                <View style={styles.column}><Input label="STOP LOSS" value={stopLoss} onChangeText={setStopLoss} placeholder="95" keyboardType="numeric" /></View>
                <View style={styles.column}><Input label="TAKE PROFIT" value={takeProfit} onChangeText={setTakeProfit} placeholder="115" keyboardType="numeric" /></View>
              </View>

              <Input label="TRADE THESIS" value={thesis} onChangeText={setThesis} placeholder="Why does this trade exist?" multiline />
              <Input label="ENTRY REASON" value={entryReason} onChangeText={setEntryReason} placeholder="What triggered the entry?" multiline />
              <Input label="NOTES" value={tradeNotes} onChangeText={setTradeNotes} placeholder="Anything else..." multiline />

              {error ? <View style={styles.modalError}><Text style={styles.modalErrorText}>{error}</Text></View> : null}

              <Pressable onPress={handleRecordTrade} disabled={saving} style={[styles.modalPrimaryButton, saving && styles.disabledButton]}>
                {saving ? <ActivityIndicator color={COLORS.glassBg} /> : <Text style={styles.modalPrimaryText}>RECORD OPEN TRADE</Text>}
              </Pressable>
              <Pressable onPress={() => setTradeVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={closeVisible} animationType="fade" transparent onRequestClose={() => setCloseVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <ModalHeader
                eyebrow="TRADE EXIT"
                title={`Close #${closingTrade?.tradeNumber || "—"}`}
                subtitle={closingTrade?.instrument || "Close trade"}
                onClose={() => setCloseVisible(false)}
              />
              <Input label="EXIT PRICE" value={exitPrice} onChangeText={setExitPrice} placeholder="110" keyboardType="numeric" />
              <Input label="FEES" value={fees} onChangeText={setFees} placeholder="0" keyboardType="numeric" />
              <Input label="EXIT REASON" value={exitReason} onChangeText={setExitReason} placeholder="MANUAL / TARGET_HIT / STOP_LOSS" />
              <Input label="EXIT NOTES" value={exitNotes} onChangeText={setExitNotes} placeholder="Why did you exit?" multiline />
              {closingTrade && exitPrice ? (
                <View style={styles.previewCard}>
                  <Text style={styles.previewEyebrow}>ESTIMATED NET RESULT</Text>
                  <Text style={styles.exitEstimate}>
                    {formatSignedCurrency(
                      (closingTrade.position === "LONG"
                        ? (Number(exitPrice) - closingTrade.entryPrice) * closingTrade.quantity
                        : (closingTrade.entryPrice - Number(exitPrice)) * closingTrade.quantity) -
                        Number(fees || 0)
                    )}
                  </Text>
                </View>
              ) : null}
              <Pressable onPress={handleCloseTrade} disabled={saving} style={[styles.modalPrimaryButton, saving && styles.disabledButton]}>
                {saving ? <ActivityIndicator color={COLORS.glassBg} /> : <Text style={styles.modalPrimaryText}>CLOSE & CALCULATE P&L</Text>}
              </Pressable>
              <Pressable onPress={() => setCloseVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ModalHeader({ eyebrow, title, subtitle, onClose }: { eyebrow: string; title: string; subtitle: string; onClose: () => void }) {
  return (
    <View style={styles.modalHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.modalEyebrow}>{eyebrow}</Text>
        <Text style={styles.modalTitle}>{title}</Text>
        <Text style={styles.modalSubtitle}>{subtitle}</Text>
      </View>
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>×</Text>
      </Pressable>
    </View>
  );
}

function Input({ label, value, onChangeText, placeholder, keyboardType = "default", multiline = false }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8580"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function MetricCard({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return (
    <View style={[styles.metricCard, accent && styles.metricCardAccent]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <View style={[styles.metricDot, accent && styles.metricDotAccent]} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function MissionNumber({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.missionNumber}>
      <Text style={styles.missionNumberLabel}>{label}</Text>
      <Text style={[styles.missionNumberValue, accent && styles.missionNumberAccent]}>{value}</Text>
    </View>
  );
}

function MissionStat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.missionStat}>
      <Text style={styles.missionStatLabel}>{label}</Text>
      <Text style={[styles.missionStatValue, accent && styles.missionStatValueAccent]}>{value}</Text>
    </View>
  );
}

function MissionMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.missionMetric}>
      <Text style={styles.missionMetricLabel}>{label}</Text>
      <Text style={styles.missionMetricValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "ACTIVE";
  const completed = status === "COMPLETED";
  return (
    <View style={[styles.statusBadge, active && styles.statusBadgeActive, completed && styles.statusBadgeCompleted]}>
      <View style={[styles.statusDot, active && styles.statusDotActive, completed && styles.statusDotCompleted]} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewMetric}>
      <Text style={styles.previewMetricLabel}>{label}</Text>
      <Text style={styles.previewMetricValue}>{value}</Text>
    </View>
  );
}

function FoundationPoint({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.foundationPoint}>
      <View style={styles.foundationPointDot} />
      <View style={{ flex: 1 }}>
        <Text style={styles.foundationPointTitle}>{title}</Text>
        <Text style={styles.foundationPointText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  missionCardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteIconButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E7CACA",
    borderRadius: 6,
    backgroundColor: "#FFF7F7",
  },
  deleteIconButtonText: {
    color: "#C43B3B",
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  root: { flex: 1, flexDirection: "row", backgroundColor: COLORS.glassBg },
  sidebar: {
    display: "none", width: 270, backgroundColor: COLORS.glassBg, borderRightWidth: 1, borderRightColor: COLORS.glassBorder, paddingTop: 32, paddingBottom: 26, paddingHorizontal: 22, justifyContent: "space-between" },
  brandContainer: { paddingHorizontal: 8 },
  brand: { color: COLORS.ink, fontSize: 29, fontFamily: FONT.black, letterSpacing: 4.5 },
  brandRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  brandAccent: { width: 20, height: 2, backgroundColor: COLORS.bull, marginRight: 8, borderRadius: 2 },
  brandSub: { color: COLORS.muted, fontSize: 10, fontFamily: FONT.bold, letterSpacing: 2.8 },
  sidebarDivider: { height: 1, backgroundColor: COLORS.glassBorder, marginTop: 30, marginBottom: 28 },
  navContent: { paddingBottom: 30 },
  navGroup: { marginBottom: 28 },
  navSection: { color: COLORS.muted, fontSize: 11, fontFamily: FONT.extraBold, letterSpacing: 2, marginBottom: 10, paddingHorizontal: 10 },
  navItem: { height: 46, borderRadius: 8, flexDirection: "row", alignItems: "center", paddingHorizontal: 11, marginBottom: 3 },
  navItemActive: { backgroundColor: "#F5F2FC", borderWidth: 1, borderColor: "#E3DDF5" },
  navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.navyLine, marginRight: 13 },
  navDotActive: { backgroundColor: COLORS.bull },
  navText: { flex: 1, color: COLORS.muted, fontSize: 14, fontFamily: FONT.semiBold, },
  navTextActive: { color: COLORS.ink, fontFamily: FONT.bold, },
  navArrow: { color: COLORS.bull, fontSize: 22, lineHeight: 22 },
  sidebarBottom: { borderTopWidth: 1, borderTopColor: COLORS.glassBorder, paddingTop: 20 },
  sidebarFooterLabel: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.5 },
  sidebarFooterText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  main: { flex: 1 },
  mainContent: { paddingHorizontal: 46, paddingTop: 30, paddingBottom: 70, maxWidth: 1750, width: "100%", alignSelf: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 34 },
  commandLabel: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  commandLine: { width: 22, height: 2, backgroundColor: COLORS.bull, marginRight: 10, borderRadius: 2 },
  breadcrumb: { color: COLORS.muted, fontSize: 11, fontFamily: FONT.extraBold, letterSpacing: 2.2 },
  pageTitle: { color: COLORS.ink, fontSize: 44, lineHeight: 52, fontFamily: FONT.black, letterSpacing: -1.5 },
  pageSubtitle: { color: COLORS.muted, fontSize: 16, marginTop: 9 },
  primaryButton: { height: 48, minWidth: 165, borderRadius: 8, backgroundColor: COLORS.bull, alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: COLORS.ink, fontSize: 11, fontFamily: FONT.black, letterSpacing: 1.1 },
  kpiGrid: { flexDirection: "row", gap: 14, marginBottom: 22 },
  metricCard: { flex: 1, minWidth: 200, minHeight: 150, borderRadius: 10, padding: 21, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, justifyContent: "space-between" },
  metricCardAccent: { borderColor: "#DCD4F1" },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metricLabel: { color: COLORS.muted, fontSize: 10, fontFamily: FONT.black, letterSpacing: 1.5 },
  metricDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.navyLine },
  metricDotAccent: { backgroundColor: COLORS.bull },
  metricValue: { color: COLORS.ink, fontSize: 34, fontFamily: FONT.black, letterSpacing: -0.8 },
  metricDetail: { color: COLORS.muted, fontSize: 11, fontFamily: FONT.semiBold, },
  errorBanner: { backgroundColor: "#FFF7F7", borderWidth: 1, borderColor: "#E8B9B9", borderRadius: 8, padding: 13, marginBottom: 18 },
  errorBannerText: { color: "#B52E2E", fontSize: 12 },
  activeMissionCard: { position: "relative", overflow: "hidden", backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: "#DCD4F1", borderRadius: 12, padding: 28, marginBottom: 30 },
  activeMissionGlow: { position: "absolute", top: -100, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: COLORS.bull, opacity: 0.045 },
  activeMissionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardEyebrow: { color: COLORS.bull, fontSize: 10, fontFamily: FONT.black, letterSpacing: 1.7, marginBottom: 7 },
  activeMissionTitle: { color: COLORS.ink, fontSize: 29, fontFamily: FONT.black, letterSpacing: -0.5 },
  activeMissionDescription: { color: COLORS.muted, fontSize: 13, lineHeight: 20, marginTop: 7 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: "#F5F2FC", borderWidth: 1, borderColor: "#DCD4F1", borderRadius: 7 },
  activeBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bull },
  activeBadgeText: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2 },
  activeMissionNumbers: { flexDirection: "row", gap: 15, marginTop: 30 },
  missionNumber: { flex: 1, minHeight: 100, padding: 17, backgroundColor: "#FAFAF8", borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 9, justifyContent: "space-between" },
  missionNumberLabel: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2 },
  missionNumberValue: { color: COLORS.ink, fontSize: 23, fontFamily: FONT.black, letterSpacing: -0.5 },
  missionNumberAccent: { color: COLORS.bull },
  activeProgressSection: { marginTop: 25 },
  activeProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 9 },
  progressLabel: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.3 },
  progressSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  activeProgressPercent: { color: COLORS.bull, fontSize: 24, fontFamily: FONT.black, },
  progressTrackLarge: { height: 9, backgroundColor: "#ECECE8", borderRadius: 5, overflow: "hidden" },
  progressFillLarge: { height: 9, backgroundColor: COLORS.bull, borderRadius: 5 },
  activeStats: { flexDirection: "row", flexWrap: "wrap", gap: 28, marginTop: 25, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  missionStat: { minWidth: 125 },
  missionStatLabel: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2 },
  missionStatValue: { color: "#33332F", fontSize: 16, fontFamily: FONT.extraBold, marginTop: 6 },
  missionStatValueAccent: { color: COLORS.bull },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 23 },
  tradeButton: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: COLORS.bull },
  tradeButtonText: { color: COLORS.ink, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2 },
  pauseButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#DADAD5", backgroundColor: COLORS.glassBg },
  pauseButtonText: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2 },
  targetMapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 15 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 36, marginBottom: 17 },
  sectionTitle: { color: COLORS.ink, fontSize: 22, fontFamily: FONT.black, letterSpacing: -0.4 },
  sectionSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5 },
  sectionCount: { color: COLORS.muted, fontSize: 10, fontFamily: FONT.black, letterSpacing: 1.4 },
  dayStrip: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  dayCard: { width: 145, minHeight: 125, padding: 13, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 9 },
  dayCardSelected: { borderColor: COLORS.bull, backgroundColor: "#FAF8FF" },
  dayTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayNumber: { color: COLORS.ink, fontSize: 10, fontFamily: FONT.black, letterSpacing: 1 },
  dayStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#C9C9C4" },
  dayStatusDone: { backgroundColor: COLORS.bull },
  dayDate: { color: COLORS.muted, fontSize: 10, marginTop: 5 },
  dayTarget: { color: COLORS.bull, fontSize: 18, fontFamily: FONT.black, marginTop: 12 },
  dayDelta: { color: COLORS.muted, fontSize: 9, marginTop: 5 },
  positiveText: { color: COLORS.bull },
  negativeText: { color: "#D93636" },
  dayMiniTrack: { height: 4, backgroundColor: "#ECECE8", borderRadius: 2, overflow: "hidden", marginTop: 10 },
  dayMiniFill: { height: 4, backgroundColor: COLORS.bull, borderRadius: 2 },
  dayDetailCard: { backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, padding: 23, marginBottom: 10 },
  dayDetailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dayDetailTitle: { color: COLORS.ink, fontSize: 24, fontFamily: FONT.black, },
  dayDetailSubtitle: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  smallPrimaryButton: { backgroundColor: COLORS.bull, borderRadius: 7, paddingHorizontal: 14, paddingVertical: 9 },
  smallPrimaryText: { color: COLORS.ink, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1 },
  dayMetrics: { flexDirection: "row", flexWrap: "wrap", gap: 28, paddingVertical: 20, marginTop: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.glassBorder },
  tradeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 21, marginBottom: 10 },
  subsectionTitle: { color: COLORS.ink, fontSize: 16, fontFamily: FONT.black, },
  tradeEmpty: { alignItems: "center", paddingVertical: 34 },
  tradeEmptyTitle: { color: COLORS.ink, fontSize: 17, fontFamily: FONT.extraBold, },
  tradeEmptyText: { color: COLORS.muted, fontSize: 12, lineHeight: 19, maxWidth: 600, textAlign: "center", marginTop: 6 },
  secondaryButton: { marginTop: 18, paddingHorizontal: 18, height: 42, borderRadius: 7, borderWidth: 1, borderColor: "#DCD4F1", backgroundColor: "#FAF8FF", alignItems: "center", justifyContent: "center" },
  secondaryButtonText: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1 },
  tradeTable: { borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 8, overflow: "hidden" },
  tradeRow: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 18, borderBottomWidth: 1, borderBottomColor: "#EEEEEA" },
  tradeIdentity: { flex: 2, flexDirection: "row", alignItems: "center", gap: 12 },
  tradeNumber: { color: COLORS.bull, fontSize: 11, fontFamily: FONT.black, },
  tradeInstrument: { color: COLORS.ink, fontSize: 13, fontFamily: FONT.extraBold, },
  tradeMeta: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  tradeCell: { minWidth: 90 },
  tableLabel: { color: COLORS.muted, fontSize: 7, fontFamily: FONT.black, letterSpacing: 1 },
  tableValue: { color: "#33332F", fontSize: 12, fontFamily: FONT.extraBold, marginTop: 4 },
  closeTradeButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1, borderColor: "#DADAD5" },
  closeTradeText: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1 },
  missionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  missionCard: { width: "calc(50% - 8px)" as any, minHeight: 330, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, padding: 23 },
  missionCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  missionCardTitleBlock: { flex: 1, paddingRight: 15 },
  missionCardTitle: { color: COLORS.ink, fontSize: 21, fontFamily: FONT.black, },
  missionCardDescription: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 7, backgroundColor: "#F7F7F4", borderWidth: 1, borderColor: COLORS.glassBorder },
  statusBadgeActive: { backgroundColor: "#F5F2FC", borderColor: "#DCD4F1" },
  statusBadgeCompleted: { backgroundColor: "#F2F8F4", borderColor: "#CDE3D5" },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#BEBEB9" },
  statusDotActive: { backgroundColor: COLORS.bull },
  statusDotCompleted: { backgroundColor: COLORS.bull },
  statusText: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 0.9 },
  targetRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 27, paddingBottom: 19, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder },
  targetLabel: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1.2, marginBottom: 5 },
  targetValue: { color: "#33332F", fontSize: 20, fontFamily: FONT.extraBold, },
  targetArrow: { color: COLORS.bull, fontSize: 21, marginHorizontal: 20, marginBottom: 1 },
  targetRight: { alignItems: "flex-end", marginLeft: "auto" },
  targetValueTarget: { color: COLORS.bull, fontSize: 20, fontFamily: FONT.black, },
  smallProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 19, marginBottom: 8 },
  smallProgressLabel: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1.1 },
  smallProgressPercent: { color: COLORS.bull, fontSize: 10, fontFamily: FONT.black, },
  smallProgressTrack: { height: 5, backgroundColor: "#ECECE8", borderRadius: 3, overflow: "hidden" },
  smallProgressFill: { height: 5, backgroundColor: COLORS.bull, borderRadius: 3 },
  missionMetrics: { flexDirection: "row", gap: 12, marginTop: 21 },
  missionMetric: { flex: 1 },
  missionMetricLabel: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1 },
  missionMetricValue: { color: "#33332F", fontSize: 13, fontFamily: FONT.extraBold, marginTop: 5 },
  activateButton: { height: 42, marginTop: 22, borderRadius: 7, backgroundColor: "#FAF8FF", borderWidth: 1, borderColor: "#DCD4F1", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  activateButtonText: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.1 },
  activateArrow: { color: COLORS.bull, fontSize: 15 },
  emptyState: { minHeight: 360, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, backgroundColor: COLORS.glassBg, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyIcon: { width: 60, height: 60, borderRadius: 15, backgroundColor: "#FAF8FF", borderWidth: 1, borderColor: "#DCD4F1", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  emptyIconText: { color: COLORS.bull, fontSize: 28, fontFamily: FONT.black, },
  emptyTitle: { color: COLORS.ink, fontSize: 22, fontFamily: FONT.black, },
  emptyText: { color: COLORS.muted, fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 600, marginTop: 8 },
  foundationCard: { marginTop: 26, minHeight: 250, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder, borderRadius: 10, overflow: "hidden", flexDirection: "row" },
  foundationAccent: { width: 4, backgroundColor: COLORS.bull },
  foundationContent: { flex: 1, padding: 27 },
  foundationEyebrow: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.5 },
  foundationTitle: { color: COLORS.ink, fontSize: 25, fontFamily: FONT.black, marginTop: 8 },
  foundationText: { color: COLORS.muted, fontSize: 14, lineHeight: 22, marginTop: 8, maxWidth: 1000 },
  foundationPoints: { flexDirection: "row", gap: 30, marginTop: 22 },
  foundationPoint: { flex: 1, flexDirection: "row", gap: 9 },
  foundationPointDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bull, marginTop: 6 },
  foundationPointTitle: { color: "#33332F", fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.1 },
  foundationPointText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  footerText: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.extraBold, letterSpacing: 1.3 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "min(720px, 100%)" as any, maxHeight: "92%", borderRadius: 14, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  tradeModalCard: { width: "min(850px, 100%)" as any, maxHeight: "94%", borderRadius: 14, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalContent: { padding: 30 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 27 },
  modalEyebrow: { color: COLORS.bull, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.5 },
  modalTitle: { color: COLORS.ink, fontSize: 30, fontFamily: FONT.black, marginTop: 5 },
  modalSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5 },
  closeButton: { width: 38, height: 38, borderRadius: 9, backgroundColor: "#FAFAF8", borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: "center", justifyContent: "center" },
  closeButtonText: { color: COLORS.muted, fontSize: 25, lineHeight: 28 },
  inputGroup: { marginBottom: 17 },
  inputLabel: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 1.2, marginBottom: 8 },
  input: { height: 48, borderRadius: 8, backgroundColor: COLORS.glassBg, borderWidth: 1, borderColor: "#DCDCD7", color: COLORS.ink, fontSize: 14, paddingHorizontal: 14, outlineStyle: "none" } as any,
  multilineInput: { height: 82, paddingTop: 13, textAlignVertical: "top" },
  twoColumn: { flexDirection: "row", gap: 14 },
  column: { flex: 1 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  choice: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 7, borderWidth: 1, borderColor: "#DCDCD7", backgroundColor: "#FAFAF8" },
  choiceSelected: { backgroundColor: "#F5F2FC", borderColor: "#CFC3ED" },
  choiceText: { color: COLORS.muted, fontSize: 9, fontFamily: FONT.black, letterSpacing: 0.8 },
  choiceTextSelected: { color: COLORS.bull },
  previewCard: { backgroundColor: "#FAF8FF", borderWidth: 1, borderColor: "#DCD4F1", borderRadius: 9, padding: 16, marginBottom: 18 },
  previewEyebrow: { color: COLORS.bull, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1.3, marginBottom: 13 },
  previewRow: { flexDirection: "row", flexWrap: "wrap", gap: 25 },
  previewMetric: { flex: 1, minWidth: 120 },
  previewMetricLabel: { color: COLORS.muted, fontSize: 8, fontFamily: FONT.black, letterSpacing: 1 },
  previewMetricValue: { color: COLORS.bull, fontSize: 20, fontFamily: FONT.black, marginTop: 5 },
  exitEstimate: { color: COLORS.ink, fontSize: 28, fontFamily: FONT.black, },
  modalError: { backgroundColor: "#FFF7F7", borderWidth: 1, borderColor: "#E8B9B9", borderRadius: 8, padding: 12, marginBottom: 14 },
  modalErrorText: { color: "#B52E2E", fontSize: 12, lineHeight: 18 },
  modalPrimaryButton: { height: 50, borderRadius: 9, backgroundColor: COLORS.bull, alignItems: "center", justifyContent: "center" },
  disabledButton: { opacity: 0.55 },
  modalPrimaryText: { color: COLORS.ink, fontSize: 11, fontFamily: FONT.black, letterSpacing: 1 },
  cancelButton: { height: 46, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { color: COLORS.muted, fontSize: 10, fontFamily: FONT.black, letterSpacing: 1 },
});
