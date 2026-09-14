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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useAuth } from "../services/auth/AuthProvider";
import {
  calculateCapital,
  createLedgerEntry,
  getUserLedger,
} from "../services/ledger/ledgerService";
import { LedgerEntry } from "../types/ledger";

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

export default function Capital() {
  const { profile, logout } = useAuth();

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const userId = profile?.uid;

  const loadLedger = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getUserLedger(userId);

      setEntries(data);
    } catch (error) {
      console.error("Failed to load capital:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, [userId]);

  const capital = useMemo(
    () => calculateCapital(entries),
    [entries]
  );

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  };

  const handleAddCapital = async () => {
    if (!userId) return;

    const numericAmount = Number(
      amount.replace(/,/g, "")
    );

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return;
    }

    if (!description.trim()) {
      return;
    }

    try {
      setSaving(true);

      await createLedgerEntry({
        userId,
        type: "DEPOSIT",
        amount: numericAmount,
        currency: "INR",
        description: description.trim(),
        status: "POSTED",
      });

      setAmount("");
      setDescription("");
      setModalVisible(false);

      await loadLedger();
    } catch (error) {
      console.error(
        "Failed to add capital:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  const handleNavigation = (item: string) => {
    switch (item) {
      case "Dashboard":
        router.replace("/dashboard");
        break;

      case "Capital":
        router.replace("/capital");
        break;

      case "Trading":
        router.push("/trading");
        break;

      default:
        break;
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.root}>
      {/* SIDEBAR */}

      <View style={styles.sidebar}>
        <View>
          <Pressable
            onPress={() =>
              router.replace("/dashboard")
            }
            style={styles.brandContainer}
          >
            <Text style={styles.brand}>
              VAULT1
            </Text>

            <View style={styles.brandRow}>
              <View style={styles.brandAccent} />

              <Text style={styles.brandSub}>
                WEALTH OS
              </Text>
            </View>
          </Pressable>

          <View style={styles.sidebarDivider} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.navContent}
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
                  const active =
                    item === "Capital";

                  return (
                    <Pressable
                      key={item}
                      onPress={() =>
                        handleNavigation(item)
                      }
                      style={({ pressed }) => [
                        styles.navItem,
                        active &&
                          styles.navItemActive,
                        pressed &&
                          styles.pressed,
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

                      {active && (
                        <Text
                          style={styles.navArrow}
                        >
                          ›
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sidebarBottom}>
          <View style={styles.userMini}>
            <LinearGradient
              colors={[
                "#7C3AED",
                "#4C1D95",
              ]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {(profile?.displayName ||
                  "V")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.userInfo}>
              <Text
                style={styles.userName}
                numberOfLines={1}
              >
                {profile?.displayName ||
                  "Vault1 User"}
              </Text>

              <Text style={styles.userRole}>
                {profile?.role || "VIEWER"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>
              SIGN OUT
            </Text>
          </Pressable>
        </View>
      </View>

      {/* MAIN */}

      <ScrollView
        style={styles.main}
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.commandLabel}>
            <View style={styles.commandLine} />

            <Text style={styles.breadcrumb}>
              MONEY / CAPITAL
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={styles.statusDotOuter}>
              <View style={styles.statusDot} />
            </View>

            <Text style={styles.statusText}>
              LEDGER ONLINE
            </Text>
          </View>
        </View>

        {/* HERO */}

        <View style={styles.hero}>
          <View>
            <Text style={styles.eyebrow}>
              CAPITAL MANAGEMENT
            </Text>

            <Text style={styles.heroTitle}>
              Capital
            </Text>

            <Text style={styles.heroSubtitle}>
              Your financial source of truth.
            </Text>
          </View>

          <Pressable
            onPress={() =>
              setModalVisible(true)
            }
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              + ADD CAPITAL
            </Text>
          </Pressable>
        </View>

        {/* CAPITAL HERO */}

        <View style={styles.capitalHero}>
          <LinearGradient
            colors={[
              "#181121",
              "#100D15",
              "#0B0B0F",
            ]}
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
            style={styles.capitalHeroInner}
          >
            <View style={styles.capitalGlow} />

            <View style={styles.capitalHeroTop}>
              <View>
                <Text style={styles.capitalLabel}>
                  TOTAL CAPITAL
                </Text>

                <Text style={styles.capitalValue}>
                  {formatCurrency(
                    capital.totalCapital
                  )}
                </Text>

                <View
                  style={styles.sourceIndicator}
                >
                  <View
                    style={
                      styles.sourceIndicatorDot
                    }
                  />

                  <Text
                    style={
                      styles.sourceIndicatorText
                    }
                  >
                    POSTED LEDGER BALANCE
                  </Text>
                </View>
              </View>

              <View style={styles.capitalMark}>
                <Text
                  style={styles.capitalMarkText}
                >
                  V1
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* METRICS */}

        <View style={styles.metricsGrid}>
          <MetricCard
            label="DEPOSITS"
            value={formatCurrency(
              capital.deposits
            )}
            accent
          />

          <MetricCard
            label="WITHDRAWALS"
            value={formatCurrency(
              capital.withdrawals
            )}
          />

          <MetricCard
            label="INVESTMENTS"
            value={formatCurrency(
              capital.investments
            )}
          />

          <MetricCard
            label="TRADING PROFIT"
            value={formatCurrency(
              capital.tradingProfit
            )}
            accent
          />

          <MetricCard
            label="TRADING LOSS"
            value={formatCurrency(
              capital.tradingLoss
            )}
          />

          <MetricCard
            label="FEES"
            value={formatCurrency(
              capital.fees
            )}
          />
        </View>

        {/* LEDGER + BREAKDOWN */}

        <View style={styles.contentGrid}>
          <View style={styles.ledgerCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>
                  SOURCE OF TRUTH
                </Text>

                <Text style={styles.cardTitle}>
                  Capital ledger
                </Text>
              </View>

              <View style={styles.recordBadge}>
                <Text
                  style={styles.recordBadgeText}
                >
                  {entries.length} RECORDS
                </Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingState}>
                <ActivityIndicator
                  color="#9B72F5"
                />

                <Text style={styles.loadingText}>
                  Loading ledger...
                </Text>
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Text style={styles.emptyIconText}>
                    +
                  </Text>
                </View>

                <Text style={styles.emptyTitle}>
                  No capital recorded
                </Text>

                <Text style={styles.emptyText}>
                  Add your first capital entry to
                  establish the Vault1 ledger.
                </Text>

                <Pressable
                  onPress={() =>
                    setModalVisible(true)
                  }
                  style={styles.emptyButton}
                >
                  <Text
                    style={
                      styles.emptyButtonText
                    }
                  >
                    ADD FIRST ENTRY
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text
                    style={[
                      styles.tableHeaderText,
                      { flex: 1.3 },
                    ]}
                  >
                    TYPE
                  </Text>

                  <Text
                    style={[
                      styles.tableHeaderText,
                      { flex: 1 },
                    ]}
                  >
                    DESCRIPTION
                  </Text>

                  <Text
                    style={[
                      styles.tableHeaderText,
                      { width: 140 },
                    ]}
                  >
                    AMOUNT
                  </Text>
                </View>

                {entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={styles.tableRow}
                  >
                    <View
                      style={[
                        styles.typeCell,
                        { flex: 1.3 },
                      ]}
                    >
                      <View
                        style={[
                          styles.typeDot,
                          entry.type ===
                            "DEPOSIT" &&
                            styles.typeDotAccent,
                        ]}
                      />

                      <Text style={styles.typeText}>
                        {entry.type.replace(
                          "_",
                          " "
                        )}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.descriptionText,
                        { flex: 1 },
                      ]}
                      numberOfLines={1}
                    >
                      {entry.description}
                    </Text>

                    <Text
                      style={[
                        styles.amountText,
                        { width: 140 },
                      ]}
                    >
                      {formatCurrency(
                        entry.amount
                      )}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* BREAKDOWN */}

          <View style={styles.breakdownCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardEyebrow}>
                  CAPITAL FLOW
                </Text>

                <Text style={styles.cardTitle}>
                  Breakdown
                </Text>
              </View>
            </View>

            <BreakdownRow
              label="Deposits"
              amount={formatCurrency(
                capital.deposits
              )}
              accent
            />

            <BreakdownRow
              label="Withdrawals"
              amount={formatCurrency(
                capital.withdrawals
              )}
            />

            <BreakdownRow
              label="Investments"
              amount={formatCurrency(
                capital.investments
              )}
            />

            <BreakdownRow
              label="Trading profit"
              amount={formatCurrency(
                capital.tradingProfit
              )}
              accent
            />

            <BreakdownRow
              label="Trading loss"
              amount={formatCurrency(
                capital.tradingLoss
              )}
            />

            <BreakdownRow
              label="Fees"
              amount={formatCurrency(
                capital.fees
              )}
            />

            <View style={styles.breakdownTotal}>
              <Text
                style={styles.breakdownTotalLabel}
              >
                NET CAPITAL
              </Text>

              <Text
                style={styles.breakdownTotalValue}
              >
                {formatCurrency(
                  capital.totalCapital
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.footerAccent} />

            <Text style={styles.footerText}>
              VAULT1 · LEDGER
            </Text>
          </View>

          <Text style={styles.footerText}>
            {profile?.role || "VIEWER"}
          </Text>
        </View>
      </ScrollView>

      {/* MODAL */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalWrapper}>
            <LinearGradient
              colors={[
                "#17121F",
                "#0D0D11",
                "#09090C",
              ]}
              style={styles.modal}
            >
              <View style={styles.modalAccent} />

              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalEyebrow}>
                    CAPITAL
                  </Text>

                  <Text style={styles.modalTitle}>
                    Add capital
                  </Text>

                  <Text
                    style={styles.modalSubtitle}
                  >
                    Create a posted ledger entry.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalVisible(false)
                  }
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>
                    ×
                  </Text>
                </Pressable>
              </View>

              <View style={styles.form}>
                <Text style={styles.inputLabel}>
                  AMOUNT
                </Text>

                <View style={styles.inputWrapper}>
                  <Text
                    style={styles.currencyPrefix}
                  >
                    ₹
                  </Text>

                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    placeholderTextColor="#4E4856"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <Text
                  style={[
                    styles.inputLabel,
                    { marginTop: 20 },
                  ]}
                >
                  DESCRIPTION
                </Text>

                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g. Initial capital"
                  placeholderTextColor="#4E4856"
                  style={[
                    styles.input,
                    styles.descriptionInput,
                  ]}
                />

                <Pressable
                  onPress={handleAddCapital}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    pressed && styles.pressed,
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={styles.saveButtonText}
                    >
                      POST CAPITAL
                    </Text>
                  )}
                </Pressable>

                <Text style={styles.modalNote}>
                  This entry will be permanently
                  recorded in the Vault1 ledger.
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <LinearGradient
      colors={
        accent
          ? [
              "#161020",
              "#0E0D13",
              "#0A0A0E",
            ]
          : [
              "#121216",
              "#0D0D10",
              "#0A0A0D",
            ]
      }
      style={styles.metricCard}
    >
      <View
        style={[
          styles.metricLine,
          accent && styles.metricLineAccent,
        ]}
      />

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <View style={styles.metricBottom}>
        <View
          style={[
            styles.metricDot,
            accent &&
              styles.metricDotAccent,
          ]}
        />

        <Text style={styles.metricCaption}>
          POSTED
        </Text>
      </View>
    </LinearGradient>
  );
}

function BreakdownRow({
  label,
  amount,
  accent = false,
}: {
  label: string;
  amount: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownName}>
        <View
          style={[
            styles.breakdownDot,
            accent &&
              styles.breakdownDotAccent,
          ]}
        />

        <Text style={styles.breakdownLabel}>
          {label}
        </Text>
      </View>

      <Text
        style={[
          styles.breakdownAmount,
          accent &&
            styles.breakdownAmountAccent,
        ]}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#060609",
  },

  sidebar: {
    width: 270,
    backgroundColor: "#09090C",
    borderRightWidth: 1,
    borderRightColor: "#1B1822",
    paddingTop: 32,
    paddingBottom: 26,
    paddingHorizontal: 22,
    justifyContent: "space-between",
  },

  brandContainer: {
    paddingHorizontal: 8,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: 4.5,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  brandAccent: {
    width: 20,
    height: 2,
    backgroundColor: "#8B5CF6",
    marginRight: 8,
  },

  brandSub: {
    color: "#696373",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.8,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#1A1820",
    marginTop: 30,
    marginBottom: 28,
  },

  navContent: {
    paddingBottom: 30,
  },

  navGroup: {
    marginBottom: 28,
  },

  navSection: {
    color: "#5B5664",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 10,
    paddingHorizontal: 10,
  },

  navItem: {
    height: 46,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: "#15101D",
    borderWidth: 1,
    borderColor: "#302342",
  },

  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3A3740",
    marginRight: 13,
  },

  navDotActive: {
    backgroundColor: "#9B72F5",
  },

  navText: {
    flex: 1,
    color: "#77727F",
    fontSize: 14,
    fontWeight: "600",
  },

  navTextActive: {
    color: "#F1ECFF",
    fontWeight: "700",
  },

  navArrow: {
    color: "#9B72F5",
    fontSize: 22,
  },

  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor: "#1A1820",
    paddingTop: 20,
  },

  userMini: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7546C8",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  userInfo: {
    flex: 1,
    marginLeft: 11,
  },

  userName: {
    color: "#D8D4DE",
    fontSize: 13,
    fontWeight: "700",
  },

  userRole: {
    color: "#655F6D",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.1,
    marginTop: 4,
  },

  logoutButton: {
    height: 40,
    borderWidth: 1,
    borderColor: "#29242F",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D0C10",
  },

  logoutText: {
    color: "#817B89",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  main: {
    flex: 1,
  },

  mainContent: {
    paddingHorizontal: 46,
    paddingTop: 30,
    paddingBottom: 55,
    maxWidth: 1750,
    width: "100%",
    alignSelf: "center",
  },

  topBar: {
    height: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  commandLabel: {
    flexDirection: "row",
    alignItems: "center",
  },

  commandLine: {
    width: 22,
    height: 2,
    backgroundColor: "#8B5CF6",
    marginRight: 10,
  },

  breadcrumb: {
    color: "#716B7B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.2,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  statusDotOuter: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#3C285C",
    alignItems: "center",
    justifyContent: "center",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9B72F5",
  },

  statusText: {
    color: "#716B7B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  hero: {
    marginTop: 42,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  eyebrow: {
    color: "#756D82",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2.2,
    marginBottom: 11,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 44,
    fontWeight: "800",
    letterSpacing: -1.3,
  },

  heroSubtitle: {
    color: "#817B88",
    fontSize: 17,
    marginTop: 9,
  },

  primaryButton: {
    backgroundColor: "#6D28D9",
    borderWidth: 1,
    borderColor: "#9B72F5",
    borderRadius: 9,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 7,
    },
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  capitalHero: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#342449",
    backgroundColor: "#09090C",
    shadowColor: "#000000",
    shadowOpacity: 0.55,
    shadowRadius: 26,
    shadowOffset: {
      width: 0,
      height: 15,
    },
    marginBottom: 16,
  },

  capitalHeroInner: {
    minHeight: 235,
    borderRadius: 12,
    padding: 32,
    overflow: "hidden",
    justifyContent: "center",
  },

  capitalGlow: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#7C3AED",
    opacity: 0.055,
    right: -100,
    top: -120,
  },

  capitalHeroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  capitalLabel: {
    color: "#756D82",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },

  capitalValue: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "800",
    letterSpacing: -1.8,
    marginTop: 10,
  },

  sourceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  sourceIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8B5CF6",
    marginRight: 8,
  },

  sourceIndicatorText: {
    color: "#756C82",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  capitalMark: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: "#45315D",
    backgroundColor: "#100C15",
    alignItems: "center",
    justifyContent: "center",
  },

  capitalMarkText: {
    color: "#8B5CF6",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 16,
  },

  metricCard: {
    flex: 1,
    minWidth: 210,
    minHeight: 155,
    borderWidth: 1,
    borderColor: "#211C29",
    borderRadius: 11,
    padding: 22,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12,
    },
  },

  metricLine: {
    position: "absolute",
    top: 0,
    left: 15,
    right: 15,
    height: 1,
    backgroundColor: "#292631",
  },

  metricLineAccent: {
    backgroundColor: "#7047A5",
  },

  metricLabel: {
    color: "#716C79",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  metricValue: {
    color: "#F2EDF8",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 20,
  },

  metricBottom: {
    flexDirection: "row",
    alignItems: "center",
  },

  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#45404B",
    marginRight: 7,
  },

  metricDotAccent: {
    backgroundColor: "#8B5CF6",
  },

  metricCaption: {
    color: "#514B59",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  contentGrid: {
    flexDirection: "row",
    gap: 16,
  },

  ledgerCard: {
    flex: 1.7,
    minHeight: 430,
    backgroundColor: "#0D0D11",
    borderWidth: 1,
    borderColor: "#211C29",
    borderRadius: 12,
    padding: 27,
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
  },

  breakdownCard: {
    flex: 1,
    minHeight: 430,
    backgroundColor: "#0D0D11",
    borderWidth: 1,
    borderColor: "#211C29",
    borderRadius: 12,
    padding: 27,
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  cardEyebrow: {
    color: "#686171",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 8,
  },

  cardTitle: {
    color: "#E5E0EA",
    fontSize: 21,
    fontWeight: "700",
  },

  recordBadge: {
    borderWidth: 1,
    borderColor: "#30233F",
    backgroundColor: "#130F19",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },

  recordBadgeText: {
    color: "#806B98",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  loadingState: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#5E5766",
    fontSize: 13,
    marginTop: 12,
  },

  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#17111F",
    borderWidth: 1,
    borderColor: "#39284A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  emptyIconText: {
    color: "#9B72F5",
    fontSize: 25,
  },

  emptyTitle: {
    color: "#AAA3B2",
    fontSize: 17,
    fontWeight: "700",
  },

  emptyText: {
    color: "#5C5663",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 400,
    marginTop: 8,
  },

  emptyButton: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#45305D",
    backgroundColor: "#15101D",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  emptyButtonText: {
    color: "#A88BC7",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  table: {
    marginTop: 28,
  },

  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#201C25",
    paddingBottom: 12,
  },

  tableHeaderText: {
    color: "#504A58",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: "#18161D",
  },

  typeCell: {
    flexDirection: "row",
    alignItems: "center",
  },

  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#514B59",
    marginRight: 9,
  },

  typeDotAccent: {
    backgroundColor: "#8B5CF6",
  },

  typeText: {
    color: "#9A939F",
    fontSize: 11,
    fontWeight: "700",
  },

  descriptionText: {
    color: "#6E6875",
    fontSize: 12,
  },

  amountText: {
    color: "#C8C1D0",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },

  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#19161E",
  },

  breakdownName: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#48434E",
    marginRight: 10,
  },

  breakdownDotAccent: {
    backgroundColor: "#8B5CF6",
  },

  breakdownLabel: {
    color: "#85808B",
    fontSize: 13,
  },

  breakdownAmount: {
    color: "#A49DAA",
    fontSize: 13,
    fontWeight: "700",
  },

  breakdownAmountAccent: {
    color: "#A990C9",
  },

  breakdownTotal: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#30223F",
  },

  breakdownTotalLabel: {
    color: "#645C6E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  breakdownTotalValue: {
    color: "#F0EAF7",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 8,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#17151B",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerAccent: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#7C3AED",
    marginRight: 7,
  },

  footerText: {
    color: "#45404C",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  modalWrapper: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3B2850",
    shadowColor: "#000000",
    shadowOpacity: 0.7,
    shadowRadius: 35,
    shadowOffset: {
      width: 0,
      height: 20,
    },
  },

  modal: {
    borderRadius: 13,
    padding: 30,
    overflow: "hidden",
  },

  modalAccent: {
    position: "absolute",
    top: 0,
    left: 30,
    right: 30,
    height: 2,
    backgroundColor: "#8B5CF6",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalEyebrow: {
    color: "#806B98",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
  },

  modalTitle: {
    color: "#F3EEF8",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 7,
  },

  modalSubtitle: {
    color: "#68616F",
    fontSize: 13,
    marginTop: 6,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#151219",
    borderWidth: 1,
    borderColor: "#2A2331",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#918899",
    fontSize: 25,
    fontWeight: "300",
  },

  form: {
    marginTop: 30,
  },

  inputLabel: {
    color: "#716A7A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  inputWrapper: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#09090C",
    borderWidth: 1,
    borderColor: "#2A2332",
    borderRadius: 9,
  },

  currencyPrefix: {
    color: "#8B5CF6",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 17,
  },

  input: {
    flex: 1,
    height: 58,
    color: "#F1ECF7",
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 14,
  },

  descriptionInput: {
    backgroundColor: "#09090C",
    borderWidth: 1,
    borderColor: "#2A2332",
    borderRadius: 9,
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: 16,
  },

  saveButton: {
    height: 54,
    marginTop: 25,
    backgroundColor: "#6D28D9",
    borderWidth: 1,
    borderColor: "#9B72F5",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  modalNote: {
    color: "#514B59",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 15,
  },

  pressed: {
    opacity: 0.6,
  },
});