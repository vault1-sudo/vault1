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
                  colors={[
                    "#9A6BFF",
                    "#6C3BE6",
                    "#4B22A7",
                  ]}
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
              colors={[
                "rgba(123,72,255,0.18)",
                "rgba(72,34,155,0.06)",
                "rgba(10,10,10,0)",
              ]}
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
    backgroundColor: "#FFFFFF",
  },


  /* ==========================================================
     MAIN
     ========================================================== */

  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  marketStatus: {
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
  },

  marketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8D5CFF",
    marginRight: 8,
  },

  marketStatusText: {
    color: "#505050",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginRight: 9,
  },

  marketStatusValue: {
    color: "#B49AFF",
    fontSize: 9,
    fontWeight: "900",
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
    color: "#111111",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  primaryButtonArrow: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
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
    color: "#666666",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 9,
  },

  heroValue: {
    color: "#111111",
    fontSize: 48,
    lineHeight: 55,
    fontWeight: "900",
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
    backgroundColor: "#7047C4",
    marginRight: 8,
  },

  heroChangeText: {
    color: "#666666",
    fontSize: 11,
    fontWeight: "600",
  },

  heroSide: {
    width: 260,
    paddingLeft: 28,
    borderLeftWidth: 1,
    borderLeftColor: "#252525",
  },

  heroSideLabel: {
    color: "#4D4D4D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  heroSideValue: {
    color: "#AA8CFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
    marginTop: 9,
  },

  heroSideDescription: {
    color: "#5E5E5E",
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
    color: "#7050B7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  sectionTitle: {
    color: "#EEEEEE",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sectionMeta: {
    color: "#454545",
    fontSize: 8,
    fontWeight: "900",
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
    borderRightColor: "#242424",
  },

  miniStatLabel: {
    color: "#4D4D4D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  miniStatValue: {
    color: "#F0F0F0",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 16,
    letterSpacing: -0.8,
  },

  miniStatDescription: {
    color: "#555555",
    fontSize: 10,
    fontWeight: "600",
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
    borderBottomColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  panelEyebrow: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  panelTitle: {
    color: "#E8E8E8",
    fontSize: 19,
    fontWeight: "900",
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
    color: "#8F69DE",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  textButtonArrow: {
    color: "#8F69DE",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2C2144",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    color: "#9B70F7",
    fontSize: 22,
    fontWeight: "700",
  },

  emptyTitle: {
    color: "#DCDCDC",
    fontSize: 17,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 380,
    color: "#5A5A5A",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#30224A",
    justifyContent: "center",
  },

  secondaryButtonPressed: {
    opacity: 0.7,
  },

  secondaryButtonText: {
    color: "#9E7AE8",
    fontSize: 8,
    fontWeight: "900",
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
    color: "#CFCFCF",
    fontSize: 18,
    fontWeight: "900",
  },

  activityEmptyDescription: {
    color: "#5A5A5A",
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
    color: "#4D4D4D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  moduleTitle: {
    color: "#EAEAEA",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 22,
  },

  moduleDescription: {
    color: "#5B5B5B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 280,
  },

  moduleArrow: {
    color: "#8D62DD",
    fontSize: 19,
    fontWeight: "500",
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
