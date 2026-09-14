import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";
import { useAuth } from "../services/auth/AuthProvider";

import {
  calculateJournalSummary,
  createTradeJournalEntry,
  deleteTradeJournalEntry,
  getUserTradeJournal,
} from "../services/tradeJournal/tradeJournalService";

import {
  TradeJournal,
  TradeJournalEmotion,
  TradeJournalOutcome,
} from "../types/tradeJournal";


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


const routeMap: Record<string, string> = {
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


const outcomes: TradeJournalOutcome[] = [
  "WIN",
  "LOSS",
  "BREAKEVEN",
  "OPEN",
  "CANCELLED",
];


const emotions: TradeJournalEmotion[] = [
  "CALM",
  "CONFIDENT",
  "FOCUSED",
  "UNCERTAIN",
  "FEARFUL",
  "GREEDY",
  "FRUSTRATED",
  "IMPULSIVE",
  "DISCIPLINED",
  "OTHER",
];


function SidebarItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sidebarItem,
        active && styles.sidebarItemActive,
        pressed && styles.sidebarItemPressed,
      ]}
    >
      {active && <View style={styles.activeRail} />}

      <View
        style={[
          styles.sidebarDot,
          active && styles.sidebarDotActive,
        ]}
      />

      <Text
        style={[
          styles.sidebarItemText,
          active && styles.sidebarItemTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


function FieldLabel({
  children,
}: {
  children: string;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
    </Text>
  );
}


function JournalCard({
  entry,
  onDelete,
}: {
  entry: TradeJournal;
  onDelete: () => void;
}) {
  const outcomeStyle =
    entry.outcome === "WIN"
      ? styles.outcomeWin
      : entry.outcome === "LOSS"
      ? styles.outcomeLoss
      : entry.outcome === "BREAKEVEN"
      ? styles.outcomeBreakeven
      : styles.outcomeOpen;

  const pnlPositive =
    (entry.actualPnL ?? 0) > 0;

  const pnlNegative =
    (entry.actualPnL ?? 0) < 0;

  return (
    <VaultSurface
      intensity="medium"
      style={styles.journalCard}
    >
      <View style={styles.journalCardHeader}>

        <View style={styles.journalIdentity}>

          <View style={styles.assetBadge}>
            <Text style={styles.assetBadgeText}>
              {entry.asset.slice(0, 2)}
            </Text>
          </View>

          <View>
            <Text style={styles.journalAsset}>
              {entry.asset}
            </Text>

            <Text style={styles.journalStrategy}>
              {entry.strategy}
            </Text>
          </View>

        </View>

        <View
          style={[
            styles.outcomeBadge,
            outcomeStyle,
          ]}
        >
          <Text style={styles.outcomeText}>
            {entry.outcome}
          </Text>
        </View>

      </View>


      <View style={styles.journalDivider} />


      <View style={styles.journalBody}>

        <View style={styles.journalColumn}>

          <Text style={styles.journalLabel}>
            SETUP
          </Text>

          <Text style={styles.journalValue}>
            {entry.setup}
          </Text>

        </View>

        <View style={styles.journalColumn}>

          <Text style={styles.journalLabel}>
            CONFIDENCE
          </Text>

          <Text style={styles.journalValue}>
            {entry.confidence}/10
          </Text>

        </View>

        <View style={styles.journalColumn}>

          <Text style={styles.journalLabel}>
            RATING
          </Text>

          <Text style={styles.journalValue}>
            {entry.rating}/5
          </Text>

        </View>

        <View style={styles.journalColumn}>

          <Text style={styles.journalLabel}>
            P&L
          </Text>

          <Text
            style={[
              styles.journalValue,
              pnlPositive &&
                styles.pnlPositive,
              pnlNegative &&
                styles.pnlNegative,
            ]}
          >
            {entry.actualPnL !== undefined
              ? `₹${entry.actualPnL.toLocaleString(
                  "en-IN"
                )}`
              : "—"}
          </Text>

        </View>

      </View>


      <View style={styles.journalTextBlock}>

        <Text style={styles.journalLabel}>
          THESIS
        </Text>

        <Text
          style={styles.journalText}
          numberOfLines={3}
        >
          {entry.thesis}
        </Text>

      </View>


      <View style={styles.journalTextBlock}>

        <Text style={styles.journalLabel}>
          LESSON
        </Text>

        <Text
          style={styles.journalText}
          numberOfLines={3}
        >
          {entry.lessons}
        </Text>

      </View>


      {entry.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {entry.tags.map((tag) => (
            <View
              key={tag}
              style={styles.tag}
            >
              <Text style={styles.tagText}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}


      <View style={styles.journalFooter}>

        <Text style={styles.journalDate}>
          {entry.createdAt?.toDate
            ? entry.createdAt
                .toDate()
                .toLocaleDateString("en-IN")
            : "RECENT ENTRY"}
        </Text>

        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed &&
              styles.deleteButtonPressed,
          ]}
        >
          <Text style={styles.deleteButtonText}>
            DELETE
          </Text>
        </Pressable>

      </View>

    </VaultSurface>
  );
}


export default function TradeJournalScreen() {
  const router = useRouter();

  const { profile, logout } = useAuth();

  const [entries, setEntries] =
    useState<TradeJournal[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [asset, setAsset] =
    useState("");

  const [strategy, setStrategy] =
    useState("");

  const [tradeId, setTradeId] =
    useState("");

  const [setup, setSetup] =
    useState("");

  const [thesis, setThesis] =
    useState("");

  const [entryReasoning, setEntryReasoning] =
    useState("");

  const [riskPlan, setRiskPlan] =
    useState("");

  const [plannedStop, setPlannedStop] =
    useState("");

  const [plannedTarget, setPlannedTarget] =
    useState("");

  const [exitReasoning, setExitReasoning] =
    useState("");

  const [outcome, setOutcome] =
    useState<TradeJournalOutcome>("OPEN");

  const [emotionsBefore, setEmotionsBefore] =
    useState<TradeJournalEmotion>("CALM");

  const [emotionsAfter, setEmotionsAfter] =
    useState<TradeJournalEmotion>("CALM");

  const [mistakes, setMistakes] =
    useState("");

  const [lessons, setLessons] =
    useState("");

  const [tags, setTags] =
    useState("");

  const [confidence, setConfidence] =
    useState("5");

  const [rating, setRating] =
    useState("3");

  const [actualPnL, setActualPnL] =
    useState("");


  const loadEntries = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data =
        await getUserTradeJournal(
          profile.uid
        );

      setEntries(data);
    } catch (error) {
      console.error(
        "Failed to load trade journal:",
        error
      );

      Alert.alert(
        "Unable to load journal",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadEntries();
  }, [profile?.uid]);


  const summary = useMemo(
    () =>
      calculateJournalSummary(entries),
    [entries]
  );


  const filteredEntries =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return entries;
      }

      return entries.filter((entry) => {
        return (
          entry.asset
            .toLowerCase()
            .includes(term) ||
          entry.strategy
            .toLowerCase()
            .includes(term) ||
          entry.setup
            .toLowerCase()
            .includes(term) ||
          entry.thesis
            .toLowerCase()
            .includes(term) ||
          entry.tags.some((tag) =>
            tag.toLowerCase().includes(term)
          )
        );
      });
    }, [entries, search]);


  const resetForm = () => {
    setAsset("");
    setStrategy("");
    setTradeId("");
    setSetup("");
    setThesis("");
    setEntryReasoning("");
    setRiskPlan("");
    setPlannedStop("");
    setPlannedTarget("");
    setExitReasoning("");
    setOutcome("OPEN");
    setEmotionsBefore("CALM");
    setEmotionsAfter("CALM");
    setMistakes("");
    setLessons("");
    setTags("");
    setConfidence("5");
    setRating("3");
    setActualPnL("");
  };


  const handleSave = async () => {
    if (!profile?.uid) {
      Alert.alert(
        "Authentication required",
        "Please sign in again."
      );
      return;
    }

    try {
      setSaving(true);

      const parsedStop =
        plannedStop.trim()
          ? Number(plannedStop)
          : undefined;

      const parsedTarget =
        plannedTarget.trim()
          ? Number(plannedTarget)
          : undefined;

      const parsedPnL =
        actualPnL.trim()
          ? Number(actualPnL)
          : undefined;

      const parsedConfidence =
        Number(confidence);

      const parsedRating =
        Number(rating);

      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await createTradeJournalEntry({
        userId: profile.uid,

        tradeId:
          tradeId.trim() || undefined,

        asset,

        strategy,

        setup,

        thesis,

        entryReasoning,

        riskPlan,

        plannedStop: parsedStop,

        plannedTarget: parsedTarget,

        exitReasoning,

        outcome,

        emotionsBefore,

        emotionsAfter,

        mistakes,

        lessons,

        tags: parsedTags,

        confidence:
          parsedConfidence,

        rating:
          parsedRating,

        actualPnL: parsedPnL,
      });

      resetForm();

      setShowForm(false);

      await loadEntries();

    } catch (error) {
      console.error(
        "Failed to save trade journal:",
        error
      );

      Alert.alert(
        "Unable to save entry",
        error instanceof Error
          ? error.message
          : "Please check your fields and try again."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = (
    journalId: string
  ) => {
    Alert.alert(
      "Delete journal entry",
      "This journal entry will be permanently deleted.",
      [
        {
          text: "CANCEL",
          style: "cancel",
        },
        {
          text: "DELETE",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTradeJournalEntry(
                journalId
              );

              setEntries((current) =>
                current.filter(
                  (entry) =>
                    entry.id !== journalId
                )
              );
            } catch (error) {
              Alert.alert(
                "Delete failed",
                "Unable to delete this journal entry."
              );
            }
          },
        },
      ]
    );
  };


  const handleNavigation = (
    label: string
  ) => {
    const route =
      routeMap[label];

    if (route) {
      router.push(route as any);
    }
  };


  return (
    <View style={styles.root}>

      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <View style={styles.sidebar}>

        <View style={styles.sidebarTop}>

          <View style={styles.brandRow}>

            <LinearGradient
              colors={[
                "#8C5CFF",
                "#5A2DCE",
                "#30136F",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandMark}
            >
              <Text style={styles.brandMarkText}>
                V1
              </Text>
            </LinearGradient>

            <View>

              <Text style={styles.brandName}>
                VAULT1
              </Text>

              <Text style={styles.brandSubtitle}>
                WEALTH OS
              </Text>

            </View>

          </View>

          <View style={styles.systemStatus}>

            <View
              style={styles.systemStatusDot}
            />

            <Text
              style={styles.systemStatusText}
            >
              SYSTEM OPERATIONAL
            </Text>

          </View>

        </View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.sidebarNavigation
          }
        >

          {navigation.map((group) => (
            <View
              key={group.section}
              style={styles.navGroup}
            >

              <Text
                style={styles.sectionLabel}
              >
                {group.section}
              </Text>

              {group.items.map((item) => (
                <SidebarItem
                  key={item}
                  label={item}
                  active={
                    item === "Trade Journal"
                  }
                  onPress={() =>
                    handleNavigation(item)
                  }
                />
              ))}

            </View>
          ))}

        </ScrollView>


        <View style={styles.sidebarBottom}>

          <View style={styles.userCard}>

            <View style={styles.userAvatar}>

              <Text
                style={styles.userAvatarText}
              >
                {(profile?.displayName ||
                  "V")[0].toUpperCase()}
              </Text>

            </View>

            <View style={styles.userInfo}>

              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {profile?.displayName ||
                  "Vault1 User"}
              </Text>

              <Text style={styles.userRole}>
                {profile?.role ||
                  "VIEWER"}
              </Text>

            </View>

            <Pressable
              onPress={logout}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed &&
                  styles.logoutButtonPressed,
              ]}
            >
              <Text style={styles.logoutText}>
                ↗
              </Text>
            </Pressable>

          </View>

        </View>

      </View>


      {/* ======================================================
          MAIN
          ====================================================== */}

      <View style={styles.main}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.contentContainer
          }
        >

          {/* ==================================================
              HEADER
              ================================================== */}

          <View style={styles.header}>

            <View>

              <Text style={styles.eyebrow}>
                DECISION INTELLIGENCE
              </Text>

              <Text style={styles.pageTitle}>
                Trade Journal
              </Text>

              <Text style={styles.pageSubtitle}>
                Capture the thinking behind every trade.
              </Text>

            </View>


            <Pressable
              onPress={() =>
                setShowForm(
                  (current) => !current
                )
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.primaryButtonPressed,
              ]}
            >

              <LinearGradient
                colors={[
                  "#9A6BFF",
                  "#6C3BE6",
                  "#4B22A7",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={
                  styles.primaryButtonGradient
                }
              >

                <Text
                  style={styles.primaryButtonText}
                >
                  {showForm
                    ? "CLOSE FORM"
                    : "NEW JOURNAL ENTRY"}
                </Text>

                <Text
                  style={styles.primaryButtonArrow}
                >
                  {showForm ? "×" : "+"}
                </Text>

              </LinearGradient>

            </Pressable>

          </View>


          {/* ==================================================
              METRICS
              ================================================== */}

          <View style={styles.metricGrid}>

            <VaultSurface
              intensity="medium"
              style={styles.metricCard}
            >
              <Text style={styles.metricLabel}>
                JOURNAL ENTRIES
              </Text>

              <Text style={styles.metricValue}>
                {summary.totalEntries}
              </Text>

              <Text style={styles.metricDescription}>
                Recorded decisions
              </Text>
            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.metricCard}
            >
              <Text style={styles.metricLabel}>
                WIN RATE
              </Text>

              <Text style={styles.metricValue}>
                {summary.winRate.toFixed(1)}%
              </Text>

              <Text style={styles.metricDescription}>
                Across closed journaled trades
              </Text>
            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.metricCard}
            >
              <Text style={styles.metricLabel}>
                TOTAL JOURNALED P&L
              </Text>

              <Text
                style={[
                  styles.metricValue,
                  summary.totalPnL > 0 &&
                    styles.pnlPositive,
                  summary.totalPnL < 0 &&
                    styles.pnlNegative,
                ]}
              >
                ₹
                {summary.totalPnL.toLocaleString(
                  "en-IN"
                )}
              </Text>

              <Text style={styles.metricDescription}>
                Recorded actual outcomes
              </Text>
            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.metricCard}
            >
              <Text style={styles.metricLabel}>
                AVG CONFIDENCE
              </Text>

              <Text style={styles.metricValue}>
                {summary.averageConfidence.toFixed(1)}
                /10
              </Text>

              <Text style={styles.metricDescription}>
                Decision confidence
              </Text>
            </VaultSurface>

          </View>


          {/* ==================================================
              NEW ENTRY FORM
              ================================================== */}

          {showForm && (
            <VaultSurface
              intensity="strong"
              style={styles.formCard}
            >

              <View style={styles.formHeader}>

                <View>

                  <Text style={styles.formEyebrow}>
                    NEW RECORD
                  </Text>

                  <Text style={styles.formTitle}>
                    Journal the Decision
                  </Text>

                  <Text style={styles.formSubtitle}>
                    Record what you knew, why you acted
                    and what you learned.
                  </Text>

                </View>

              </View>


              <View style={styles.formBody}>

                {/* ------------------------------------------
                    TRADE CONTEXT
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  TRADE CONTEXT
                </Text>

                <View style={styles.formRow}>

                  <View style={styles.formField}>
                    <FieldLabel>
                      ASSET *
                    </FieldLabel>

                    <TextInput
                      value={asset}
                      onChangeText={setAsset}
                      placeholder="e.g. NIFTY, RELIANCE, BTC"
                      placeholderTextColor="#454545"
                      style={styles.input}
                    />
                  </View>


                  <View style={styles.formField}>
                    <FieldLabel>
                      STRATEGY *
                    </FieldLabel>

                    <TextInput
                      value={strategy}
                      onChangeText={setStrategy}
                      placeholder="e.g. Breakout"
                      placeholderTextColor="#454545"
                      style={styles.input}
                    />
                  </View>


                  <View style={styles.formField}>
                    <FieldLabel>
                      TRADE ID
                    </FieldLabel>

                    <TextInput
                      value={tradeId}
                      onChangeText={setTradeId}
                      placeholder="Optional linked trade ID"
                      placeholderTextColor="#454545"
                      style={styles.input}
                    />
                  </View>

                </View>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    SETUP *
                  </FieldLabel>

                  <TextInput
                    value={setup}
                    onChangeText={setSetup}
                    placeholder="Describe the setup you identified"
                    placeholderTextColor="#454545"
                    style={styles.input}
                  />

                </View>


                {/* ------------------------------------------
                    THESIS
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  THESIS & DECISION
                </Text>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    TRADING THESIS *
                  </FieldLabel>

                  <TextInput
                    value={thesis}
                    onChangeText={setThesis}
                    placeholder="Why did you believe this trade had an edge?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    ENTRY REASONING *
                  </FieldLabel>

                  <TextInput
                    value={entryReasoning}
                    onChangeText={
                      setEntryReasoning
                    }
                    placeholder="What specifically triggered the entry?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                {/* ------------------------------------------
                    RISK
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  RISK PLAN
                </Text>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    RISK PLAN *
                  </FieldLabel>

                  <TextInput
                    value={riskPlan}
                    onChangeText={setRiskPlan}
                    placeholder="What was the maximum acceptable risk and why?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                <View style={styles.formRow}>

                  <View style={styles.formField}>
                    <FieldLabel>
                      PLANNED STOP
                    </FieldLabel>

                    <TextInput
                      value={plannedStop}
                      onChangeText={setPlannedStop}
                      placeholder="Optional"
                      placeholderTextColor="#454545"
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>


                  <View style={styles.formField}>
                    <FieldLabel>
                      PLANNED TARGET
                    </FieldLabel>

                    <TextInput
                      value={plannedTarget}
                      onChangeText={
                        setPlannedTarget
                      }
                      placeholder="Optional"
                      placeholderTextColor="#454545"
                      keyboardType="numeric"
                      style={styles.input}
                    />
                  </View>

                </View>


                {/* ------------------------------------------
                    OUTCOME
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  OUTCOME
                </Text>


                <View style={styles.selectorGrid}>

                  {outcomes.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() =>
                        setOutcome(value)
                      }
                      style={({ pressed }) => [
                        styles.selector,
                        outcome === value &&
                          styles.selectorActive,
                        pressed &&
                          styles.selectorPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectorText,
                          outcome === value &&
                            styles.selectorTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}

                </View>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    EXIT REASONING *
                  </FieldLabel>

                  <TextInput
                    value={exitReasoning}
                    onChangeText={
                      setExitReasoning
                    }
                    placeholder="Why did you exit, remain open, or cancel?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                <View style={styles.formRow}>

                  <View style={styles.formField}>

                    <FieldLabel>
                      ACTUAL P&L
                    </FieldLabel>

                    <TextInput
                      value={actualPnL}
                      onChangeText={setActualPnL}
                      placeholder="Optional"
                      placeholderTextColor="#454545"
                      keyboardType="numeric"
                      style={styles.input}
                    />

                  </View>


                  <View style={styles.formField}>

                    <FieldLabel>
                      CONFIDENCE 1–10
                    </FieldLabel>

                    <TextInput
                      value={confidence}
                      onChangeText={setConfidence}
                      placeholder="5"
                      placeholderTextColor="#454545"
                      keyboardType="numeric"
                      style={styles.input}
                    />

                  </View>


                  <View style={styles.formField}>

                    <FieldLabel>
                      TRADE RATING 1–5
                    </FieldLabel>

                    <TextInput
                      value={rating}
                      onChangeText={setRating}
                      placeholder="3"
                      placeholderTextColor="#454545"
                      keyboardType="numeric"
                      style={styles.input}
                    />

                  </View>

                </View>


                {/* ------------------------------------------
                    EMOTIONS
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  MENTAL STATE
                </Text>


                <Text style={styles.subLabel}>
                  BEFORE TRADE
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.horizontalSelectors
                  }
                >
                  {emotions.map((value) => (
                    <Pressable
                      key={`before-${value}`}
                      onPress={() =>
                        setEmotionsBefore(value)
                      }
                      style={({ pressed }) => [
                        styles.emotionSelector,
                        emotionsBefore === value &&
                          styles.emotionSelectorActive,
                        pressed &&
                          styles.selectorPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.emotionText,
                          emotionsBefore === value &&
                            styles.emotionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>


                <Text
                  style={[
                    styles.subLabel,
                    styles.afterLabel,
                  ]}
                >
                  AFTER TRADE
                </Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.horizontalSelectors
                  }
                >
                  {emotions.map((value) => (
                    <Pressable
                      key={`after-${value}`}
                      onPress={() =>
                        setEmotionsAfter(value)
                      }
                      style={({ pressed }) => [
                        styles.emotionSelector,
                        emotionsAfter === value &&
                          styles.emotionSelectorActive,
                        pressed &&
                          styles.selectorPressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.emotionText,
                          emotionsAfter === value &&
                            styles.emotionTextActive,
                        ]}
                      >
                        {value}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>


                {/* ------------------------------------------
                    REVIEW
                    ------------------------------------------ */}

                <Text style={styles.formSectionTitle}>
                  POST-TRADE REVIEW
                </Text>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    MISTAKES *
                  </FieldLabel>

                  <TextInput
                    value={mistakes}
                    onChangeText={setMistakes}
                    placeholder="What did you do wrong or what would you change?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    LESSONS *
                  </FieldLabel>

                  <TextInput
                    value={lessons}
                    onChangeText={setLessons}
                    placeholder="What should you remember for the next trade?"
                    placeholderTextColor="#454545"
                    style={[
                      styles.input,
                      styles.textarea,
                    ]}
                    multiline
                    textAlignVertical="top"
                  />

                </View>


                <View style={styles.formFieldFull}>

                  <FieldLabel>
                    TAGS
                  </FieldLabel>

                  <TextInput
                    value={tags}
                    onChangeText={setTags}
                    placeholder="breakout, momentum, disciplined"
                    placeholderTextColor="#454545"
                    style={styles.input}
                  />

                  <Text style={styles.helperText}>
                    Separate multiple tags with commas.
                  </Text>

                </View>


                <View style={styles.formActions}>

                  <Pressable
                    onPress={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed &&
                        styles.cancelButtonPressed,
                    ]}
                  >
                    <Text style={styles.cancelButtonText}>
                      CANCEL
                    </Text>
                  </Pressable>


                  <Pressable
                    onPress={handleSave}
                    disabled={saving}
                    style={({ pressed }) => [
                      styles.saveButton,
                      saving &&
                        styles.saveButtonDisabled,
                      pressed &&
                        styles.saveButtonPressed,
                    ]}
                  >

                    <LinearGradient
                      colors={[
                        "#9A6BFF",
                        "#6C3BE6",
                        "#4B22A7",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.saveGradient}
                    >

                      {saving ? (
                        <ActivityIndicator
                          color="#FFFFFF"
                        />
                      ) : (
                        <Text
                          style={
                            styles.saveButtonText
                          }
                        >
                          SAVE JOURNAL ENTRY
                        </Text>
                      )}

                    </LinearGradient>

                  </Pressable>

                </View>

              </View>

            </VaultSurface>
          )}


          {/* ==================================================
              JOURNAL BOOK
              ================================================== */}

          <View style={styles.bookHeader}>

            <View>

              <Text style={styles.bookEyebrow}>
                JOURNAL BOOK
              </Text>

              <Text style={styles.bookTitle}>
                Decision History
              </Text>

            </View>


            <View style={styles.searchBox}>

              <Text style={styles.searchIcon}>
                ⌕
              </Text>

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search journal..."
                placeholderTextColor="#4C4C4C"
                style={styles.searchInput}
              />

            </View>

          </View>


          {/* ==================================================
              SUMMARY STRIP
              ================================================== */}

          <VaultSurface
            intensity="subtle"
            style={styles.summaryStrip}
          >

            <View style={styles.summaryItem}>

              <Text style={styles.summaryLabel}>
                WINS
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  styles.pnlPositive,
                ]}
              >
                {summary.winningEntries}
              </Text>

            </View>


            <View style={styles.summaryItem}>

              <Text style={styles.summaryLabel}>
                LOSSES
              </Text>

              <Text
                style={[
                  styles.summaryValue,
                  styles.pnlNegative,
                ]}
              >
                {summary.losingEntries}
              </Text>

            </View>


            <View style={styles.summaryItem}>

              <Text style={styles.summaryLabel}>
                BREAKEVEN
              </Text>

              <Text style={styles.summaryValue}>
                {summary.breakevenEntries}
              </Text>

            </View>


            <View style={styles.summaryItem}>

              <Text style={styles.summaryLabel}>
                AVG RATING
              </Text>

              <Text style={styles.summaryValue}>
                {summary.averageRating.toFixed(1)}/5
              </Text>

            </View>

          </VaultSurface>


          {/* ==================================================
              LOADING
              ================================================== */}

          {loading ? (
            <VaultSurface
              intensity="medium"
              style={styles.emptyState}
            >

              <ActivityIndicator
                size="large"
                color="#9B72FF"
              />

              <Text style={styles.emptyTitle}>
                Loading journal
              </Text>

              <Text style={styles.emptyDescription}>
                Retrieving your decision history.
              </Text>

            </VaultSurface>
          ) : filteredEntries.length === 0 ? (
            <VaultSurface
              intensity="medium"
              style={styles.emptyState}
            >

              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>
                  ◇
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                {search
                  ? "No matching entries"
                  : "Your journal is empty"}
              </Text>

              <Text style={styles.emptyDescription}>
                {search
                  ? "Try a different asset, strategy, setup or tag."
                  : "Start recording your trading decisions. The quality of your journal becomes the quality of your future review."}
              </Text>

              {!search && (
                <Pressable
                  onPress={() =>
                    setShowForm(true)
                  }
                  style={({ pressed }) => [
                    styles.emptyButton,
                    pressed &&
                      styles.emptyButtonPressed,
                  ]}
                >
                  <Text
                    style={styles.emptyButtonText}
                  >
                    CREATE FIRST ENTRY
                  </Text>
                </Pressable>
              )}

            </VaultSurface>
          ) : (
            <View style={styles.entriesGrid}>

              {filteredEntries.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  onDelete={() =>
                    handleDelete(entry.id)
                  }
                />
              ))}

            </View>
          )}


          {/* ==================================================
              FOUNDATION
              ================================================== */}

          <VaultSurface
            intensity="subtle"
            style={styles.foundationCard}
          >

            <View style={styles.foundationIcon}>
              <Text style={styles.foundationIconText}>
                ◈
              </Text>
            </View>

            <View style={styles.foundationContent}>

              <Text style={styles.foundationTitle}>
                Decision Intelligence Layer
              </Text>

              <Text style={styles.foundationDescription}>
                Trade Journal is the behavioral data
                layer of Vault1. Future analytics can
                compare strategies, setups, confidence,
                emotional state, mistakes and actual
                outcomes to reveal where your process
                creates or destroys edge.
              </Text>

            </View>

          </VaultSurface>


          {/* ==================================================
              FOOTER
              ================================================== */}

          <View style={styles.footer}>

            <Text style={styles.footerText}>
              VAULT1 WEALTH OPERATING SYSTEM
            </Text>

            <Text style={styles.footerDivider}>
              •
            </Text>

            <Text style={styles.footerText}>
              DECISION INTELLIGENCE
            </Text>

            <Text style={styles.footerVersion}>
              V1.0
            </Text>

          </View>

        </ScrollView>

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  /* ==========================================================
     ROOT
     ========================================================== */

  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#070707",
  },


  /* ==========================================================
     SIDEBAR
     ========================================================== */

  sidebar: {
    width: 260,
    backgroundColor: "#0A0A0A",
    borderRightWidth: 1,
    borderRightColor: "#202020",
    paddingTop: 26,
    paddingBottom: 18,
  },

  sidebarTop: {
    paddingHorizontal: 22,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  brandName: {
    color: "#F5F5F5",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandSubtitle: {
    color: "#5D5D5D",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginTop: 3,
  },

  systemStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 7,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#1C1C1C",
  },

  systemStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8F63FF",
    marginRight: 8,
  },

  systemStatusText: {
    color: "#686868",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  sidebarNavigation: {
    paddingTop: 28,
    paddingBottom: 20,
  },

  navGroup: {
    marginBottom: 22,
  },

  sectionLabel: {
    color: "#444444",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    paddingHorizontal: 22,
    marginBottom: 8,
  },

  sidebarItem: {
    height: 42,
    marginHorizontal: 10,
    paddingHorizontal: 13,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  sidebarItemActive: {
    backgroundColor: "#15111E",
    borderWidth: 1,
    borderColor: "#292038",
  },

  sidebarItemPressed: {
    opacity: 0.72,
  },

  activeRail: {
    position: "absolute",
    left: -1,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: "#8D5CFF",
    borderRadius: 2,
  },

  sidebarDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#343434",
    marginRight: 11,
  },

  sidebarDotActive: {
    backgroundColor: "#966AFF",
  },

  sidebarItemText: {
    color: "#696969",
    fontSize: 13,
    fontWeight: "600",
  },

  sidebarItemTextActive: {
    color: "#F0ECFF",
    fontWeight: "800",
  },

  sidebarBottom: {
    paddingHorizontal: 14,
  },

  userCard: {
    minHeight: 62,
    borderRadius: 10,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },

  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#201934",
    borderWidth: 1,
    borderColor: "#38285B",
    alignItems: "center",
    justifyContent: "center",
  },

  userAvatarText: {
    color: "#B08FFF",
    fontSize: 12,
    fontWeight: "900",
  },

  userInfo: {
    flex: 1,
    marginLeft: 9,
  },

  userName: {
    color: "#D7D7D7",
    fontSize: 11,
    fontWeight: "800",
  },

  userRole: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 3,
  },

  logoutButton: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#181818",
  },

  logoutButtonPressed: {
    opacity: 0.65,
  },

  logoutText: {
    color: "#777777",
    fontSize: 15,
    fontWeight: "700",
  },


  /* ==========================================================
     MAIN
     ========================================================== */

  main: {
    flex: 1,
    backgroundColor: "#080808",
  },

  contentContainer: {
    paddingHorizontal: 38,
    paddingTop: 34,
    paddingBottom: 50,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },


  /* ==========================================================
     HEADER
     ========================================================== */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
  },

  eyebrow: {
    color: "#7550C7",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
    marginBottom: 8,
  },

  pageTitle: {
    color: "#F5F5F5",
    fontSize: 44,
    lineHeight: 50,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  pageSubtitle: {
    color: "#696969",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 7,
  },


  /* ==========================================================
     BUTTONS
     ========================================================== */

  primaryButton: {
    height: 46,
    borderRadius: 9,
    overflow: "hidden",
  },

  primaryButtonPressed: {
    opacity: 0.78,
    transform: [{ translateY: 1 }],
  },

  primaryButtonGradient: {
    height: "100%",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  primaryButtonArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },


  /* ==========================================================
     METRICS
     ========================================================== */

  metricGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 38,
  },

  metricCard: {
    flex: 1,
    minHeight: 145,
    padding: 20,
  },

  metricLabel: {
    color: "#5B5B5B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricValue: {
    color: "#F3F3F3",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: -0.7,
  },

  metricDescription: {
    color: "#555555",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },


  /* ==========================================================
     FORM
     ========================================================== */

  formCard: {
    marginBottom: 38,
  },

  formHeader: {
    padding: 26,
    borderBottomWidth: 1,
    borderBottomColor: "#252525",
  },

  formEyebrow: {
    color: "#8D62DD",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  formTitle: {
    color: "#EEEEEE",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 7,
  },

  formSubtitle: {
    color: "#5C5C5C",
    fontSize: 12,
    marginTop: 7,
  },

  formBody: {
    padding: 26,
  },

  formSectionTitle: {
    color: "#8060C1",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginTop: 14,
    marginBottom: 15,
  },

  formRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 14,
  },

  formField: {
    flex: 1,
  },

  formFieldFull: {
    width: "100%",
    marginBottom: 14,
  },

  fieldLabel: {
    color: "#575757",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 8,
  },

  input: {
    minHeight: 46,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 8,
    color: "#E8E8E8",
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: "600",
  },

  textarea: {
    minHeight: 105,
    paddingTop: 13,
    paddingBottom: 13,
  },

  helperText: {
    color: "#454545",
    fontSize: 9,
    marginTop: 6,
  },

  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 15,
  },

  selector: {
    minWidth: 105,
    height: 39,
    paddingHorizontal: 13,
    borderRadius: 7,
    backgroundColor: "#0E0E0E",
    borderWidth: 1,
    borderColor: "#272727",
    alignItems: "center",
    justifyContent: "center",
  },

  selectorActive: {
    backgroundColor: "#1C142C",
    borderColor: "#6D49A9",
  },

  selectorPressed: {
    opacity: 0.68,
  },

  selectorText: {
    color: "#626262",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  selectorTextActive: {
    color: "#B494F5",
  },

  horizontalSelectors: {
    gap: 8,
    paddingBottom: 3,
  },

  emotionSelector: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
  },

  emotionSelectorActive: {
    backgroundColor: "#19132A",
    borderColor: "#6747A1",
  },

  emotionText: {
    color: "#595959",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  emotionTextActive: {
    color: "#AC8AEF",
  },

  subLabel: {
    color: "#444444",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 9,
  },

  afterLabel: {
    marginTop: 18,
  },

  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#242424",
  },

  cancelButton: {
    height: 43,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonPressed: {
    opacity: 0.65,
  },

  cancelButtonText: {
    color: "#666666",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  saveButton: {
    height: 43,
    minWidth: 190,
    borderRadius: 8,
    overflow: "hidden",
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonPressed: {
    opacity: 0.78,
  },

  saveGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },


  /* ==========================================================
     JOURNAL HEADER
     ========================================================== */

  bookHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  bookEyebrow: {
    color: "#7050B7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  bookTitle: {
    color: "#EEEEEE",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  searchBox: {
    width: 260,
    height: 42,
    borderRadius: 8,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#252525",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    color: "#666666",
    fontSize: 18,
    marginRight: 7,
  },

  searchInput: {
    flex: 1,
    color: "#D7D7D7",
    fontSize: 11,
  },


  /* ==========================================================
     SUMMARY
     ========================================================== */

  summaryStrip: {
    flexDirection: "row",
    minHeight: 92,
    marginBottom: 16,
    paddingVertical: 4,
  },

  summaryItem: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#222222",
  },

  summaryLabel: {
    color: "#4C4C4C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  summaryValue: {
    color: "#E8E8E8",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 7,
  },


  /* ==========================================================
     JOURNAL CARDS
     ========================================================== */

  entriesGrid: {
    gap: 14,
    marginBottom: 38,
  },

  journalCard: {
    padding: 21,
  },

  journalCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  journalIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },

  assetBadge: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#19132A",
    borderWidth: 1,
    borderColor: "#35245A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  assetBadgeText: {
    color: "#A17CEB",
    fontSize: 10,
    fontWeight: "900",
  },

  journalAsset: {
    color: "#ECECEC",
    fontSize: 18,
    fontWeight: "900",
  },

  journalStrategy: {
    color: "#6D6D6D",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },

  outcomeBadge: {
    paddingHorizontal: 11,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  outcomeWin: {
    backgroundColor: "#102017",
    borderColor: "#244E32",
  },

  outcomeLoss: {
    backgroundColor: "#211313",
    borderColor: "#552828",
  },

  outcomeBreakeven: {
    backgroundColor: "#171717",
    borderColor: "#303030",
  },

  outcomeOpen: {
    backgroundColor: "#18132A",
    borderColor: "#38285B",
  },

  outcomeText: {
    color: "#B6B6B6",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  journalDivider: {
    height: 1,
    backgroundColor: "#242424",
    marginVertical: 17,
  },

  journalBody: {
    flexDirection: "row",
    marginBottom: 17,
  },

  journalColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#242424",
    paddingRight: 15,
    marginRight: 15,
  },

  journalLabel: {
    color: "#484848",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  journalValue: {
    color: "#D4D4D4",
    fontSize: 13,
    fontWeight: "800",
  },

  journalTextBlock: {
    marginBottom: 16,
  },

  journalText: {
    color: "#777777",
    fontSize: 11,
    lineHeight: 18,
    maxWidth: 1000,
  },

  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 15,
  },

  tag: {
    height: 25,
    paddingHorizontal: 9,
    borderRadius: 5,
    backgroundColor: "#15121B",
    borderWidth: 1,
    borderColor: "#282035",
    justifyContent: "center",
  },

  tagText: {
    color: "#8065AC",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  journalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#202020",
  },

  journalDate: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  deleteButton: {
    height: 27,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: "#151010",
    borderWidth: 1,
    borderColor: "#342020",
    alignItems: "center",
    justifyContent: "center",
  },

  deleteButtonPressed: {
    opacity: 0.6,
  },

  deleteButtonText: {
    color: "#865858",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
  },


  /* ==========================================================
     P&L
     ========================================================== */

  pnlPositive: {
    color: "#8FC79E",
  },

  pnlNegative: {
    color: "#C98282",
  },


  /* ==========================================================
     EMPTY STATE
     ========================================================== */

  emptyState: {
    minHeight: 310,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginBottom: 38,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#171220",
    borderWidth: 1,
    borderColor: "#2C2144",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    color: "#9B70F7",
    fontSize: 23,
  },

  emptyTitle: {
    color: "#DCDCDC",
    fontSize: 18,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 520,
    color: "#5A5A5A",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },

  emptyButton: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#17111F",
    borderWidth: 1,
    borderColor: "#35254F",
    justifyContent: "center",
    marginTop: 18,
  },

  emptyButtonPressed: {
    opacity: 0.68,
  },

  emptyButtonText: {
    color: "#9B78D9",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },


  /* ==========================================================
     FOUNDATION
     ========================================================== */

  foundationCard: {
    minHeight: 125,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 42,
  },

  foundationIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#17121F",
    borderWidth: 1,
    borderColor: "#302243",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  foundationIconText: {
    color: "#936BD6",
    fontSize: 21,
  },

  foundationContent: {
    flex: 1,
  },

  foundationTitle: {
    color: "#D8D8D8",
    fontSize: 16,
    fontWeight: "900",
  },

  foundationDescription: {
    color: "#595959",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 900,
  },


  /* ==========================================================
     FOOTER
     ========================================================== */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#191919",
  },

  footerText: {
    color: "#3E3E3E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  footerDivider: {
    color: "#343434",
    fontSize: 8,
    marginHorizontal: 9,
  },

  footerVersion: {
    marginLeft: "auto",
    color: "#454545",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

});