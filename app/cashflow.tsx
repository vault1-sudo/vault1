import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  calculateCashflow,
  getUserTransactions,
} from "../services/transactions/transactionService";

import { Transaction } from "../types/transaction";


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
      {active && (
        <View style={styles.activeRail} />
      )}

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


function FlowMetric({
  label,
  value,
  description,
  positive,
  negative,
}: {
  label: string;
  value: string;
  description: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <VaultSurface
      intensity="medium"
      style={styles.metricCard}
    >
      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          positive && styles.positiveText,
          negative && styles.negativeText,
        ]}
      >
        {value}
      </Text>

      <Text style={styles.metricDescription}>
        {description}
      </Text>
    </VaultSurface>
  );
}


function formatCurrency(
  value: number
) {
  return `₹${Math.abs(value).toLocaleString(
    "en-IN"
  )}`;
}


function getDate(
  transaction: Transaction
) {
  if (transaction.createdAt?.toDate) {
    return transaction.createdAt
      .toDate()
      .toLocaleDateString("en-IN");
  }

  return "RECENT";
}


export default function CashflowScreen() {
  const router = useRouter();

  const {
    profile,
    logout,
  } = useAuth();

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);


  const loadData = async () => {
    if (!profile?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data =
        await getUserTransactions(
          profile.uid
        );

      setTransactions(data);
    } catch (error) {
      console.error(
        "Failed to load cashflow:",
        error
      );

      Alert.alert(
        "Unable to load cashflow",
        "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadData();
  }, [profile?.uid]);


  const cashflow = useMemo(
    () =>
      calculateCashflow(
        transactions
      ),
    [transactions]
  );


  const recentTransactions =
    transactions.slice(0, 8);


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

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <View style={styles.sidebar}>

        <View style={styles.sidebarTop}>

          <View style={styles.brandRow}>

            <LinearGradient
              colors={[
                "#8C5CFF",
                "#5A2DCE",
                "#30136F",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
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
                    item === "Cashflow"
                  }
                  onPress={() =>
                    handleNavigation(
                      item
                    )
                  }
                />
              ))}
            </View>
          ))}
        </ScrollView>


        <View
          style={styles.sidebarBottom}
        >
          <View style={styles.userCard}>

            <View style={styles.userAvatar}>
              <Text
                style={styles.userAvatarText}
              >
                {(
                  profile?.displayName ||
                  "V"
                )[0].toUpperCase()}
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

              <Text
                style={styles.userRole}
              >
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
              <Text
                style={styles.logoutText}
              >
                ↗
              </Text>
            </Pressable>

          </View>
        </View>

      </View>


      {/* =====================================================
          MAIN
          ===================================================== */}

      <View style={styles.main}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.contentContainer
          }
        >

          {/* =================================================
              HEADER
              ================================================= */}

          <View style={styles.header}>

            <View>

              <Text style={styles.eyebrow}>
                MONEY CONTROL
              </Text>

              <Text style={styles.pageTitle}>
                Cashflow
              </Text>

              <Text
                style={styles.pageSubtitle}
              >
                Understand where capital enters,
                moves and leaves Vault1.
              </Text>

            </View>


            <Pressable
              onPress={() =>
                router.push(
                  "/transactions" as any
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
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={
                  styles.primaryGradient
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  VIEW TRANSACTIONS
                </Text>

                <Text
                  style={
                    styles.primaryButtonArrow
                  }
                >
                  →
                </Text>
              </LinearGradient>
            </Pressable>

          </View>


          {/* =================================================
              HERO CASHFLOW
              ================================================= */}

          <VaultSurface
            intensity="strong"
            style={styles.heroCard}
          >

            <LinearGradient
              colors={[
                "rgba(123,72,255,0.16)",
                "rgba(72,34,155,0.05)",
                "rgba(10,10,10,0)",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.heroGlow}
            />

            <View
              style={styles.heroContent}
            >

              <View>

                <Text
                  style={
                    styles.heroEyebrow
                  }
                >
                  NET CASHFLOW
                </Text>

                <Text
                  style={[
                    styles.heroValue,
                    cashflow.netCashflow >
                      0 &&
                      styles.positiveText,
                    cashflow.netCashflow <
                      0 &&
                      styles.negativeText,
                  ]}
                >
                  {cashflow.netCashflow >=
                  0
                    ? "+"
                    : "−"}
                  {formatCurrency(
                    cashflow.netCashflow
                  )}
                </Text>

                <Text
                  style={
                    styles.heroDescription
                  }
                >
                  Total recorded inflows minus
                  recorded outflows.
                </Text>

              </View>


              <View
                style={styles.heroSide}
              >

                <Text
                  style={
                    styles.heroSideLabel
                  }
                >
                  EXTERNAL CAPITAL
                </Text>

                <Text
                  style={[
                    styles.heroSideValue,
                    cashflow.netExternalCashflow >=
                      0
                      ? styles.positiveText
                      : styles.negativeText,
                  ]}
                >
                  {cashflow.netExternalCashflow >=
                  0
                    ? "+"
                    : "−"}
                  {formatCurrency(
                    cashflow.netExternalCashflow
                  )}
                </Text>

                <Text
                  style={
                    styles.heroSideDescription
                  }
                >
                  Deposits and withdrawals
                  excluding trading activity.
                </Text>

              </View>

            </View>

          </VaultSurface>


          {/* =================================================
              CORE METRICS
              ================================================= */}

          <View style={styles.metricGrid}>

            <FlowMetric
              label="TOTAL INFLOWS"
              value={`+${formatCurrency(
                cashflow.totalInflows
              )}`}
              description="Capital and income entering"
              positive
            />

            <FlowMetric
              label="TOTAL OUTFLOWS"
              value={`−${formatCurrency(
                cashflow.totalOutflows
              )}`}
              description="Capital and costs leaving"
              negative
            />

            <FlowMetric
              label="TRADING CASHFLOW"
              value={`${
                cashflow.netTradingCashflow >=
                0
                  ? "+"
                  : "−"
              }${formatCurrency(
                cashflow.netTradingCashflow
              )}`}
              description="Trading profit, losses and fees"
              positive={
                cashflow.netTradingCashflow >
                0
              }
              negative={
                cashflow.netTradingCashflow <
                0
              }
            />

            <FlowMetric
              label="INCOME"
              value={`+${formatCurrency(
                cashflow.netIncome
              )}`}
              description="Interest and dividends"
              positive
            />

          </View>


          {/* =================================================
              FLOW BREAKDOWN HEADER
              ================================================= */}

          <View
            style={styles.sectionHeader}
          >

            <View>

              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                FLOW BREAKDOWN
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Capital Movement
              </Text>

            </View>

            <Text
              style={styles.sectionMeta}
            >
              POSTED ACTIVITY
            </Text>

          </View>


          {/* =================================================
              BREAKDOWN CARDS
              ================================================= */}

          <View
            style={styles.breakdownGrid}
          >

            <VaultSurface
              intensity="medium"
              style={
                styles.breakdownCard
              }
            >

              <Text
                style={
                  styles.breakdownLabel
                }
              >
                DEPOSITS
              </Text>

              <Text
                style={[
                  styles.breakdownValue,
                  styles.positiveText,
                ]}
              >
                +{formatCurrency(
                  cashflow.deposits
                )}
              </Text>

              <View
                style={
                  styles.breakdownLine
                }
              />

              <Text
                style={
                  styles.breakdownDescription
                }
              >
                External capital added
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.breakdownCard
              }
            >

              <Text
                style={
                  styles.breakdownLabel
                }
              >
                WITHDRAWALS
              </Text>

              <Text
                style={[
                  styles.breakdownValue,
                  styles.negativeText,
                ]}
              >
                −{formatCurrency(
                  cashflow.withdrawals
                )}
              </Text>

              <View
                style={
                  styles.breakdownLine
                }
              />

              <Text
                style={
                  styles.breakdownDescription
                }
              >
                Capital removed
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.breakdownCard
              }
            >

              <Text
                style={
                  styles.breakdownLabel
                }
              >
                INVESTMENTS
              </Text>

              <Text
                style={
                  styles.breakdownValue
                }
              >
                −{formatCurrency(
                  cashflow.investmentOutflow
                )}
              </Text>

              <View
                style={
                  styles.breakdownLine
                }
              />

              <Text
                style={
                  styles.breakdownDescription
                }
              >
                Capital deployed into investments
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.breakdownCard
              }
            >

              <Text
                style={
                  styles.breakdownLabel
                }
              >
                FEES
              </Text>

              <Text
                style={[
                  styles.breakdownValue,
                  styles.negativeText,
                ]}
              >
                −{formatCurrency(
                  cashflow.fees
                )}
              </Text>

              <View
                style={
                  styles.breakdownLine
                }
              />

              <Text
                style={
                  styles.breakdownDescription
                }
              >
                Recorded costs
              </Text>

            </VaultSurface>

          </View>


          {/* =================================================
              INCOME BREAKDOWN
              ================================================= */}

          <View
            style={styles.incomeGrid}
          >

            <VaultSurface
              intensity="medium"
              style={
                styles.incomeCard
              }
            >

              <View
                style={
                  styles.incomeTop
                }
              >

                <Text
                  style={
                    styles.incomeLabel
                  }
                >
                  TRADING PROFIT
                </Text>

                <Text
                  style={
                    styles.incomeBadge
                  }
                >
                  TRADING
                </Text>

              </View>

              <Text
                style={[
                  styles.incomeValue,
                  styles.positiveText,
                ]}
              >
                +{formatCurrency(
                  cashflow.tradingProfit
                )}
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.incomeCard
              }
            >

              <View
                style={
                  styles.incomeTop
                }>

                <Text
                  style={
                    styles.incomeLabel
                  }
                >
                  TRADING LOSS
                </Text>

                <Text
                  style={
                    styles.lossBadge
                  }
                >
                  TRADING
                </Text>

              </View>

              <Text
                style={[
                  styles.incomeValue,
                  styles.negativeText,
                ]}
              >
                −{formatCurrency(
                  cashflow.tradingLoss
                )}
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.incomeCard
              }
            >

              <View
                style={
                  styles.incomeTop
                }>

                <Text
                  style={
                    styles.incomeLabel
                  }
                >
                  INTEREST
                </Text>

                <Text
                  style={
                    styles.incomeBadge
                  }
                >
                  INCOME
                </Text>

              </View>

              <Text
                style={[
                  styles.incomeValue,
                  styles.positiveText,
                ]}
              >
                +{formatCurrency(
                  cashflow.interest
                )}
              </Text>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={
                styles.incomeCard
              }
            >

              <View
                style={
                  styles.incomeTop
                }>

                <Text
                  style={
                    styles.incomeLabel
                  }
                >
                  DIVIDENDS
                </Text>

                <Text
                  style={
                    styles.incomeBadge
                  }
                >
                  INCOME
                </Text>

              </View>

              <Text
                style={[
                  styles.incomeValue,
                  styles.positiveText,
                ]}
              >
                +{formatCurrency(
                  cashflow.dividends
                )}
              </Text>

            </VaultSurface>

          </View>


          {/* =================================================
              RECENT ACTIVITY
              ================================================= */}

          <View
            style={styles.sectionHeader}
          >

            <View>

              <Text
                style={
                  styles.sectionEyebrow
                }
              >
                RECENT ACTIVITY
              </Text>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Latest Cashflow Events
              </Text>

            </View>


            <Pressable
              onPress={() =>
                router.push(
                  "/transactions" as any
                )
              }
              style={({ pressed }) => [
                styles.linkButton,
                pressed &&
                  styles.linkButtonPressed,
              ]}
            >
              <Text
                style={styles.linkText}
              >
                ALL TRANSACTIONS →
              </Text>
            </Pressable>

          </View>


          {loading ? (

            <VaultSurface
              intensity="medium"
              style={
                styles.emptyState
              }
            >
              <ActivityIndicator
                size="large"
                color="#9B72FF"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading cashflow
              </Text>
            </VaultSurface>

          ) : recentTransactions.length ===
            0 ? (

            <VaultSurface
              intensity="medium"
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
                  ₹
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No cashflow yet
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Once transactions are recorded,
                Vault1 will show the movement of
                capital through this command center.
              </Text>

              <Pressable
                onPress={() =>
                  router.push(
                    "/transactions" as any
                  )
                }
                style={({ pressed }) => [
                  styles.emptyButton,
                  pressed &&
                    styles.emptyButtonPressed,
                ]}
              >
                <Text
                  style={
                    styles.emptyButtonText
                  }
                >
                  RECORD TRANSACTION
                </Text>
              </Pressable>

            </VaultSurface>

          ) : (

            <VaultSurface
              intensity="medium"
              style={
                styles.recentCard
              }
            >

              {recentTransactions.map(
                (transaction) => {

                  const positive =
                    transaction.amount >
                    0;

                  return (
                    <View
                      key={
                        transaction.id
                      }
                      style={
                        styles.recentRow
                      }
                    >

                      <View
                        style={
                          styles.recentLeft
                        }
                      >

                        <View
                          style={[
                            styles.recentIndicator,
                            positive
                              ? styles.recentIndicatorPositive
                              : styles.recentIndicatorNegative,
                          ]}
                        />

                        <View>
                          <Text
                            style={
                              styles.recentType
                            }
                          >
                            {transaction.type.replace(
                              "_",
                              " "
                            )}
                          </Text>

                          <Text
                            style={
                              styles.recentDescription
                            }
                            numberOfLines={1}
                          >
                            {
                              transaction.description
                            }
                          </Text>

                          <Text
                            style={
                              styles.recentDate
                            }
                          >
                            {getDate(
                              transaction
                            )}
                          </Text>
                        </View>

                      </View>


                      <View
                        style={
                          styles.recentRight
                        }
                      >

                        <Text
                          style={[
                            styles.recentAmount,
                            positive
                              ? styles.positiveText
                              : styles.negativeText,
                          ]}
                        >
                          {positive
                            ? "+"
                            : "−"}
                          ₹
                          {Math.abs(
                            transaction.amount
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </Text>

                        <Text
                          style={
                            styles.recentStatus
                          }
                        >
                          {
                            transaction.status
                          }
                        </Text>

                      </View>

                    </View>
                  );
                }
              )}

            </VaultSurface>

          )}


          {/* =================================================
              FOUNDATION
              ================================================= */}

          <VaultSurface
            intensity="subtle"
            style={
              styles.foundationCard
            }
          >

            <View
              style={
                styles.foundationIcon
              }
            >
              <Text
                style={
                  styles.foundationIconText
                }
              >
                ◈
              </Text>
            </View>


            <View
              style={
                styles.foundationContent
              }
            >

              <Text
                style={
                  styles.foundationTitle
                }
              >
                Cashflow Intelligence
              </Text>

              <Text
                style={
                  styles.foundationDescription
                }
              >
                This layer will eventually power
                liquidity forecasting, capital
                deployment analysis, fee analysis,
                tax reporting and performance
                attribution.
              </Text>

            </View>

          </VaultSurface>


          {/* =================================================
              FOOTER
              ================================================= */}

          <View
            style={styles.footer}
          >

            <Text
              style={
                styles.footerText
              }
            >
              VAULT1 WEALTH OPERATING SYSTEM
            </Text>

            <Text
              style={
                styles.footerDivider
              }
            >
              •
            </Text>

            <Text
              style={
                styles.footerText
              }
            >
              CASHFLOW CONTROL
            </Text>

            <Text
              style={
                styles.footerVersion
              }
            >
              V1.0
            </Text>

          </View>

        </ScrollView>

      </View>

    </View>
  );
}


const styles = StyleSheet.create({

  /* ========================================================
     ROOT
     ======================================================== */

  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#070707",
  },

  /* ========================================================
     SIDEBAR
     ======================================================== */

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
    borderColor:
      "rgba(255,255,255,0.12)",
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

  /* ========================================================
     MAIN
     ======================================================== */

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

  /* ========================================================
     HEADER
     ======================================================== */

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

  primaryButton: {
    height: 46,
    borderRadius: 9,
    overflow: "hidden",
  },

  primaryButtonPressed: {
    opacity: 0.78,
    transform: [
      {
        translateY: 1,
      },
    ],
  },

  primaryGradient: {
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
    marginLeft: 10,
  },

  /* ========================================================
     HERO
     ======================================================== */

  heroCard: {
    minHeight: 235,
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
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "900",
    letterSpacing: -1.6,
  },

  heroDescription: {
    color: "#5C5C5C",
    fontSize: 11,
    marginTop: 9,
  },

  heroSide: {
    width: 280,
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
    fontSize: 23,
    fontWeight: "900",
    marginTop: 9,
  },

  heroSideDescription: {
    color: "#5E5E5E",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  /* ========================================================
     COLORS
     ======================================================== */

  positiveText: {
    color: "#8FC79E",
  },

  negativeText: {
    color: "#C98282",
  },

  /* ========================================================
     METRICS
     ======================================================== */

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
    fontSize: 29,
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

  /* ========================================================
     SECTION HEADERS
     ======================================================== */

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

  /* ========================================================
     BREAKDOWN
     ======================================================== */

  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 16,
  },

  breakdownCard: {
    width: "48%",
    minHeight: 165,
    padding: 21,
  },

  breakdownLabel: {
    color: "#4E4E4E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  breakdownValue: {
    color: "#E8E8E8",
    fontSize: 27,
    fontWeight: "900",
    marginTop: 18,
  },

  breakdownLine: {
    height: 1,
    backgroundColor: "#252525",
    marginTop: 18,
  },

  breakdownDescription: {
    color: "#575757",
    fontSize: 10,
    marginTop: 9,
  },

  /* ========================================================
     INCOME
     ======================================================== */

  incomeGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 38,
  },

  incomeCard: {
    flex: 1,
    minHeight: 125,
    padding: 20,
  },

  incomeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  incomeLabel: {
    color: "#4E4E4E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  incomeBadge: {
    color: "#8063B2",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  lossBadge: {
    color: "#9B6464",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  incomeValue: {
    color: "#E8E8E8",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 20,
  },

  /* ========================================================
     LINKS
     ======================================================== */

  linkButton: {
    padding: 6,
  },

  linkButtonPressed: {
    opacity: 0.65,
  },

  linkText: {
    color: "#8D62DD",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* ========================================================
     RECENT ACTIVITY
     ======================================================== */

  recentCard: {
    marginBottom: 38,
    overflow: "hidden",
  },

  recentRow: {
    minHeight: 76,
    paddingHorizontal: 21,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  recentIndicator: {
    width: 6,
    height: 32,
    borderRadius: 3,
    marginRight: 15,
  },

  recentIndicatorPositive: {
    backgroundColor: "#5B9A6B",
  },

  recentIndicatorNegative: {
    backgroundColor: "#A45E5E",
  },

  recentType: {
    color: "#DCDCDC",
    fontSize: 11,
    fontWeight: "900",
  },

  recentDescription: {
    color: "#5B5B5B",
    fontSize: 10,
    marginTop: 4,
    maxWidth: 600,
  },

  recentDate: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 5,
  },

  recentRight: {
    alignItems: "flex-end",
    marginLeft: 20,
  },

  recentAmount: {
    fontSize: 14,
    fontWeight: "900",
  },

  recentStatus: {
    color: "#4D4D4D",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 5,
  },

  /* ========================================================
     EMPTY / LOADING
     ======================================================== */

  emptyState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginBottom: 38,
  },

  loadingText: {
    color: "#5A5A5A",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 15,
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
    fontSize: 21,
    fontWeight: "800",
  },

  emptyTitle: {
    color: "#DCDCDC",
    fontSize: 18,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 500,
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

  /* ========================================================
     FOUNDATION
     ======================================================== */

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

  /* ========================================================
     FOOTER
     ======================================================== */

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