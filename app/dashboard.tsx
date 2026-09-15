import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import { useAuth } from "../services/auth/AuthProvider";
import VaultSurface from "../components/ui/VaultSurface";
import VaultMetric from "../components/ui/VaultMetric";

import { FONT, COLORS } from "./theme/theme";
import { AmbientGlow } from "./theme/components/GlassBackground";

function MiniStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>
        {label}
      </Text>

      <Text style={styles.miniStatValue}>
        {value}
      </Text>

      <Text style={styles.miniStatDescription}>
        {description}
      </Text>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  return (
    <View style={styles.root}>

      <AmbientGlow />

      {/* ======================================================
          MAIN
          ====================================================== */}

      <View style={styles.main}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >

          {/* ==================================================
              HEADER
              ================================================== */}

          <View style={styles.header}>

            <View>

              <Text style={styles.eyebrow}>
                COMMAND CENTER
              </Text>

              <Text style={styles.pageTitle}>
                Dashboard
              </Text>

              <Text style={styles.pageSubtitle}>
                Your complete view of capital,
                positions and growth.
              </Text>

            </View>

            <View style={styles.headerActions}>

              <View style={styles.marketStatus}>

                <View style={styles.marketStatusDot} />

                <Text style={styles.marketStatusText}>
                  MARKETS
                </Text>

                <Text style={styles.marketStatusValue}>
                  READY
                </Text>

              </View>

              <Pressable
                onPress={() =>
                  router.push("/growth-missions" as any)
                }
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <LinearGradient
                  colors={[COLORS.bull, "#0A9A63"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    CREATE MISSION
                  </Text>

                  <Text style={styles.primaryButtonArrow}>
                    →
                  </Text>
                </LinearGradient>
              </Pressable>

            </View>

          </View>


          {/* ==================================================
              HERO
              ================================================== */}

          <VaultSurface
            intensity="strong"
            style={styles.heroCard}
          >

            <LinearGradient
              colors={[COLORS.glowTeal, COLORS.glowBlue, "rgba(8,13,24,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGlow}
            />

            <View style={styles.heroContent}>

              <View>

                <Text style={styles.heroEyebrow}>
                  TOTAL WEALTH
                </Text>

                <Text style={styles.heroValue}>
                  ₹0
                </Text>

                <View style={styles.heroChangeRow}>

                  <View style={styles.heroChangeDot} />

                  <Text style={styles.heroChangeText}>
                    No performance data yet
                  </Text>

                </View>

              </View>

              <View style={styles.heroSide}>

                <Text style={styles.heroSideLabel}>
                  VAULT1 STATUS
                </Text>

                <Text style={styles.heroSideValue}>
                  READY
                </Text>

                <Text style={styles.heroSideDescription}>
                  Your wealth infrastructure is
                  ready for live data.
                </Text>

              </View>

            </View>

          </VaultSurface>


          {/* ==================================================
              PRIMARY METRICS
              ================================================== */}

          <View style={styles.metricGrid}>

            <VaultMetric
              label="INVESTED CAPITAL"
              value="₹0"
              change="No capital recorded"
            />

            <VaultMetric
              label="CURRENT VALUE"
              value="₹0"
              change="No positions recorded"
              accent
            />

            <VaultMetric
              label="TOTAL P&L"
              value="₹0"
              change="Awaiting portfolio activity"
            />

            <VaultMetric
              label="RETURN"
              value="0.00%"
              change="No return calculated"
              accent
            />

          </View>


          {/* ==================================================
              OPERATING SNAPSHOT
              ================================================== */}

          <View style={styles.sectionHeader}>

            <View>

              <Text style={styles.sectionEyebrow}>
                OPERATING SNAPSHOT
              </Text>

              <Text style={styles.sectionTitle}>
                Wealth Engine
              </Text>

            </View>

            <Text style={styles.sectionMeta}>
              LIVE SYSTEM VIEW
            </Text>

          </View>


          <VaultSurface
            intensity="medium"
            style={styles.snapshotCard}
          >

            <View style={styles.snapshotGrid}>

              <MiniStat
                label="OPEN POSITIONS"
                value="0"
                description="No active holdings"
              />

              <MiniStat
                label="ACTIVE STRATEGIES"
                value="0"
                description="No strategies activated"
              />

              <MiniStat
                label="ACTIVE MISSIONS"
                value="0"
                description="No growth mission running"
              />

              <MiniStat
                label="TRADES"
                value="0"
                description="No trades recorded"
              />

            </View>

          </VaultSurface>


          {/* ==================================================
              GROWTH + ACTIVITY
              ================================================== */}

          <View style={styles.twoColumn}>

            {/* Growth Missions */}

            <VaultSurface
              intensity="medium"
              style={styles.largePanel}
            >

              <View style={styles.panelHeader}>

                <View>

                  <Text style={styles.panelEyebrow}>
                    GROWTH
                  </Text>

                  <Text style={styles.panelTitle}>
                    Growth Missions
                  </Text>

                </View>

                <Pressable
                  onPress={() =>
                    router.push("/growth-missions" as any)
                  }
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.textButtonPressed,
                  ]}
                >
                  <Text style={styles.textButtonText}>
                    OPEN
                  </Text>

                  <Text style={styles.textButtonArrow}>
                    →
                  </Text>
                </Pressable>

              </View>

              <View style={styles.emptyPanel}>

                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>
                    ↗
                  </Text>
                </View>

                <Text style={styles.emptyTitle}>
                  No active mission
                </Text>

                <Text style={styles.emptyDescription}>
                  Create a Growth Mission to
                  define a capital target, time
                  horizon and required growth path.
                </Text>

                <Pressable
                  onPress={() =>
                    router.push("/growth-missions" as any)
                  }
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.secondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    CREATE FIRST MISSION
                  </Text>
                </Pressable>

              </View>

            </VaultSurface>


            {/* Recent Activity */}

            <VaultSurface
              intensity="medium"
              style={styles.largePanel}
            >

              <View style={styles.panelHeader}>

                <View>

                  <Text style={styles.panelEyebrow}>
                    ACTIVITY
                  </Text>

                  <Text style={styles.panelTitle}>
                    Recent Activity
                  </Text>

                </View>

                <Pressable
                  onPress={() =>
                    router.push("/trading" as any)
                  }
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.textButtonPressed,
                  ]}
                >
                  <Text style={styles.textButtonText}>
                    TRADING
                  </Text>

                  <Text style={styles.textButtonArrow}>
                    →
                  </Text>
                </Pressable>

              </View>

              <View style={styles.activityEmpty}>

                <Text style={styles.activityEmptyTitle}>
                  No activity yet
                </Text>

                <Text style={styles.activityEmptyDescription}>
                  Your trades, capital movements,
                  positions and mission events will
                  appear here.
                </Text>

              </View>

            </VaultSurface>

          </View>


          {/* ==================================================
              SYSTEM MODULES
              ================================================== */}

          <View style={styles.sectionHeader}>

            <View>

              <Text style={styles.sectionEyebrow}>
                SYSTEM
              </Text>

              <Text style={styles.sectionTitle}>
                Wealth Infrastructure
              </Text>

            </View>

            <Text style={styles.sectionMeta}>
              VAULT1 CORE
            </Text>

          </View>


          <View style={styles.moduleGrid}>

            {/* Portfolio */}

            <Pressable
              onPress={() =>
                router.push("/portfolio" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  01
                </Text>

                <Text style={styles.moduleTitle}>
                  Portfolio
                </Text>

                <Text style={styles.moduleDescription}>
                  Positions, exposure, allocation
                  and portfolio performance.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>


            {/* Trading */}

            <Pressable
              onPress={() =>
                router.push("/trading" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  02
                </Text>

                <Text style={styles.moduleTitle}>
                  Trading
                </Text>

                <Text style={styles.moduleDescription}>
                  Execution records, open trades,
                  closed trades and P&L.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>


            {/* Assets */}

            <Pressable
              onPress={() =>
                router.push("/assets" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  03
                </Text>

                <Text style={styles.moduleTitle}>
                  Assets
                </Text>

                <Text style={styles.moduleDescription}>
                  Master asset universe, markets,
                  instruments and pricing.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>


            {/* Strategies */}

            <Pressable
              onPress={() =>
                router.push("/strategies" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  04
                </Text>

                <Text style={styles.moduleTitle}>
                  Strategies
                </Text>

                <Text style={styles.moduleDescription}>
                  Strategy definitions, risk levels
                  and trading frameworks.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>


            {/* Trade Journal */}

            <Pressable
              onPress={() =>
                router.push("/trade-journal" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  05
                </Text>

                <Text style={styles.moduleTitle}>
                  Trade Journal
                </Text>

                <Text style={styles.moduleDescription}>
                  Trading thesis, setups, decisions,
                  outcomes and lessons.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>


            {/* Capital */}

            <Pressable
              onPress={() =>
                router.push("/capital" as any)
              }
              style={({ pressed }) => [
                styles.modulePressable,
                pressed && styles.modulePressablePressed,
              ]}
            >
              <VaultSurface
                intensity="subtle"
                style={styles.moduleCard}
              >

                <Text style={styles.moduleNumber}>
                  06
                </Text>

                <Text style={styles.moduleTitle}>
                  Capital
                </Text>

                <Text style={styles.moduleDescription}>
                  Capital ledger, deposits,
                  withdrawals, fees and movements.
                </Text>

                <Text style={styles.moduleArrow}>
                  →
                </Text>

              </VaultSurface>
            </Pressable>

          </View>


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
              PRIVATE CAPITAL INFRASTRUCTURE
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
    backgroundColor: COLORS.navyDeep,
  },


  /* ==========================================================
     MAIN
     ========================================================== */

  main: {
    flex: 1,
    backgroundColor: "transparent",
  },

  contentContainer: {
    paddingHorizontal: 38,
    paddingTop: 34,
    paddingBottom: 50,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
  },

  eyebrow: {
    color: COLORS.bull,
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2.2,
    marginBottom: 8,
  },

  pageTitle: {
    color: COLORS.ink,
    fontSize: 44,
    lineHeight: 50,
    fontFamily: FONT.black,
    letterSpacing: -1.4,
  },

  pageSubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontFamily: FONT.medium,
    marginTop: 7,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  marketStatus: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    flexDirection: "row",
    alignItems: "center",
  },

  marketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bull,
    marginRight: 8,
  },

  marketStatusText: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
    marginRight: 9,
  },

  marketStatusValue: {
    color: COLORS.bull,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },


  /* ==========================================================
     PRIMARY BUTTON
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
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: COLORS.glassBg,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  primaryButtonArrow: {
    color: COLORS.glassBg,
    fontSize: 16,
    fontFamily: FONT.semiBold,
    marginLeft: 10,
  },


  /* ==========================================================
     HERO
     ========================================================== */

  heroCard: {
    minHeight: 240,
    marginBottom: 16,
  },

  heroGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },

  heroContent: {
    flex: 1,
    padding: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  heroEyebrow: {
    color: COLORS.muted,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.8,
    marginBottom: 9,
  },

  heroValue: {
    color: COLORS.ink,
    fontSize: 48,
    lineHeight: 55,
    fontFamily: FONT.black,
    letterSpacing: -1.8,
  },

  heroChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 11,
  },

  heroChangeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.bull,
    marginRight: 8,
  },

  heroChangeText: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },

  heroSide: {
    width: 260,
    paddingLeft: 28,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.navyLine,
  },

  heroSideLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  heroSideValue: {
    color: COLORS.accentBlue,
    fontSize: 20,
    fontFamily: FONT.black,
    letterSpacing: 0.3,
    marginTop: 9,
  },

  heroSideDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },


  /* ==========================================================
     METRICS
     ========================================================== */

  metricGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 38,
  },


  /* ==========================================================
     SECTION HEADERS
     ========================================================== */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  sectionEyebrow: {
    color: COLORS.bull,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  sectionTitle: {
    color: COLORS.ink,
    fontSize: 23,
    fontFamily: FONT.black,
    letterSpacing: -0.4,
  },

  sectionMeta: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.3,
  },


  /* ==========================================================
     SNAPSHOT
     ========================================================== */

  snapshotCard: {
    marginBottom: 38,
  },

  snapshotGrid: {
    flexDirection: "row",
    padding: 4,
  },

  miniStat: {
    flex: 1,
    minHeight: 125,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRightWidth: 1,
    borderRightColor: COLORS.navyLine,
  },

  miniStatLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  miniStatValue: {
    color: COLORS.ink,
    fontSize: 32,
    fontFamily: FONT.black,
    marginTop: 16,
    letterSpacing: -0.8,
  },

  miniStatDescription: {
    color: COLORS.muted,
    fontSize: 10,
    fontFamily: FONT.semiBold,
    marginTop: 5,
  },


  /* ==========================================================
     TWO COLUMN PANELS
     ========================================================== */

  twoColumn: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 38,
  },

  largePanel: {
    flex: 1,
    minHeight: 340,
  },

  panelHeader: {
    minHeight: 76,
    paddingHorizontal: 21,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.navyLine,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  panelEyebrow: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  panelTitle: {
    color: COLORS.ink,
    fontSize: 19,
    fontFamily: FONT.black,
  },

  textButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },

  textButtonPressed: {
    opacity: 0.65,
  },

  textButtonText: {
    color: COLORS.bull,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  textButtonArrow: {
    color: COLORS.bull,
    fontSize: 13,
    marginLeft: 7,
  },


  /* ==========================================================
     EMPTY GROWTH STATE
     ========================================================== */

  emptyPanel: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    color: COLORS.bull,
    fontSize: 22,
    fontFamily: FONT.bold,
  },

  emptyTitle: {
    color: COLORS.ink,
    fontSize: 17,
    fontFamily: FONT.black,
  },

  emptyDescription: {
    maxWidth: 380,
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 8,
  },

  secondaryButton: {
    marginTop: 18,
    height: 39,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    justifyContent: "center",
  },

  secondaryButtonPressed: {
    opacity: 0.7,
  },

  secondaryButtonText: {
    color: COLORS.bull,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },


  /* ==========================================================
     ACTIVITY
     ========================================================== */

  activityEmpty: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },

  activityEmptyTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontFamily: FONT.black,
  },

  activityEmptyDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
    maxWidth: 390,
    marginTop: 9,
  },


  /* ==========================================================
     SYSTEM MODULES
     ========================================================== */

  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 45,
  },

  modulePressable: {
    width: "32%",
    minWidth: 240,
  },

  modulePressablePressed: {
    opacity: 0.78,
    transform: [{ translateY: 1 }],
  },

  moduleCard: {
    minHeight: 190,
    padding: 22,
  },

  moduleNumber: {
    color: COLORS.muted,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  moduleTitle: {
    color: COLORS.ink,
    fontSize: 21,
    fontFamily: FONT.black,
    marginTop: 22,
  },

  moduleDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 280,
  },

  moduleArrow: {
    color: COLORS.bull,
    fontSize: 19,
    fontFamily: FONT.medium,
    marginTop: 18,
  },


  /* ==========================================================
     FOOTER
     ========================================================== */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLine,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.3,
  },

  footerDivider: {
    color: COLORS.muted,
    fontSize: 8,
    marginHorizontal: 9,
  },

  footerVersion: {
    marginLeft: "auto",
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

});