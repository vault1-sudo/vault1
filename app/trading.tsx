import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../services/auth/AuthProvider";

import {
  calculateTradePnL,
  calculateTradeSummary,
  calculateTradeValue,
  closeTrade,
  createTrade,
  getUserTrades,
} from "../services/trading/tradeService";

import {
  Trade,
  TradeSide,
} from "../types/trade";


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


function formatINR(value: number): string {
  return `₹${Math.abs(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}


function formatSignedINR(value: number): string {
  if (value === 0) {
    return "₹0";
  }

  return `${value > 0 ? "+" : "-"}₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}


function formatDate(value: any): string {
  if (!value) {
    return "—";
  }

  try {
    if (typeof value.toDate === "function") {
      return value
        .toDate()
        .toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
    }

    if (value instanceof Date) {
      return value.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    return "—";
  } catch {
    return "—";
  }
}


export default function TradingScreen() {
  const { profile } = useAuth();

  const userId = profile?.uid;

  const [trades, setTrades] = useState<Trade[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [asset, setAsset] = useState("");
  const [side, setSide] =
    useState<TradeSide>("BUY");

  const [quantity, setQuantity] =
    useState("");

  const [entryPrice, setEntryPrice] =
    useState("");

  const [fees, setFees] =
    useState("");

  const [strategy, setStrategy] =
    useState("");


  const [closingTradeId, setClosingTradeId] =
    useState<string | null>(null);

  const [exitPrice, setExitPrice] =
    useState("");


  const loadTrades = useCallback(
    async (showLoader = true) => {
      if (!userId) {
        setTrades([]);
        setLoading(false);
        return;
      }

      try {
        if (showLoader) {
          setLoading(true);
        }

        const result =
          await getUserTrades(userId);

        setTrades(result);
      } catch (error: any) {
        console.error(
          "Failed to load trades:",
          error
        );

        Alert.alert(
          "Unable to load trades",
          error?.message ||
            "Something went wrong while loading your trades."
        );
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );


  useEffect(() => {
    loadTrades();
  }, [loadTrades]);


  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadTrades(false);
    } finally {
      setRefreshing(false);
    }
  };


  const summary = useMemo(
    () => calculateTradeSummary(trades),
    [trades]
  );


  const openExposure = useMemo(() => {
    return trades
      .filter(
        (trade: Trade) =>
          trade.status === "OPEN"
      )
      .reduce(
        (total: number, trade: Trade) =>
          total + calculateTradeValue(trade),
        0
      );
  }, [trades]);


  const handleRecordTrade = async () => {
    if (!userId) {
      Alert.alert(
        "Authentication required",
        "Please sign in again."
      );
      return;
    }

    const cleanAsset = asset.trim();
    const cleanStrategy = strategy.trim();

    const numericQuantity =
      Number(quantity);

    const numericEntryPrice =
      Number(entryPrice);

    const numericFees =
      fees.trim() === ""
        ? 0
        : Number(fees);


    if (!cleanAsset) {
      Alert.alert(
        "Asset required",
        "Enter the asset or symbol."
      );
      return;
    }

    if (
      !Number.isFinite(numericQuantity) ||
      numericQuantity <= 0
    ) {
      Alert.alert(
        "Invalid quantity",
        "Enter a quantity greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(numericEntryPrice) ||
      numericEntryPrice <= 0
    ) {
      Alert.alert(
        "Invalid entry price",
        "Enter an entry price greater than zero."
      );
      return;
    }

    if (
      !Number.isFinite(numericFees) ||
      numericFees < 0
    ) {
      Alert.alert(
        "Invalid fees",
        "Fees cannot be negative."
      );
      return;
    }

    if (!cleanStrategy) {
      Alert.alert(
        "Strategy required",
        "Enter the strategy used for this trade."
      );
      return;
    }


    try {
      setSaving(true);

      await createTrade({
        userId,
        asset: cleanAsset,
        side,
        quantity: numericQuantity,
        entryPrice: numericEntryPrice,
        fees: numericFees,
        strategy: cleanStrategy,
        status: "OPEN",
      });


      setAsset("");
      setQuantity("");
      setEntryPrice("");
      setFees("");
      setStrategy("");

      await loadTrades(false);

      Alert.alert(
        "Trade recorded",
        `${cleanAsset.toUpperCase()} has been added to your trading book.`
      );
    } catch (error: any) {
      console.error(
        "Failed to create trade:",
        error
      );

      Alert.alert(
        "Trade failed",
        error?.message ||
          "Unable to record the trade."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleCloseTrade = async () => {
    if (!closingTradeId) {
      return;
    }

    const numericExitPrice =
      Number(exitPrice);

    if (
      !Number.isFinite(numericExitPrice) ||
      numericExitPrice <= 0
    ) {
      Alert.alert(
        "Invalid exit price",
        "Enter an exit price greater than zero."
      );
      return;
    }


    try {
      setSaving(true);

      await closeTrade({
        tradeId: closingTradeId,
        exitPrice: numericExitPrice,
      });

      setClosingTradeId(null);
      setExitPrice("");

      await loadTrades(false);

      Alert.alert(
        "Trade closed",
        "The trade has been marked as closed."
      );
    } catch (error: any) {
      console.error(
        "Failed to close trade:",
        error
      );

      Alert.alert(
        "Unable to close trade",
        error?.message ||
          "Something went wrong while closing the trade."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleNavigation = (
    item: string
  ) => {
    switch (item) {
      case "Dashboard":
        router.replace("/dashboard");
        break;

      case "Portfolio":
        router.push("/portfolio");
        break;

      case "Trading":
        router.push("/trading");
        break;

      case "Capital":
        router.push("/capital");
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

      <View style={styles.sidebar}>

        <View style={styles.brandBlock}>
          <Text style={styles.brand}>
            VAULT1
          </Text>

          <Text style={styles.brandSub}>
            WEALTH OPERATING SYSTEM
          </Text>
        </View>


        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.sidebarScroll
          }
        >
          {navigation.map(
            (group) => (
              <View
                key={group.section}
                style={styles.navGroup}
              >
                <Text
                  style={styles.navSection}
                >
                  {group.section}
                </Text>

                {group.items.map(
                  (item) => {
                    const active =
                      item === "Trading";

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          handleNavigation(item)
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


        <View style={styles.sidebarFooter}>
          <Text style={styles.sidebarFooterTitle}>
            TRADING ENGINE
          </Text>

          <Text style={styles.sidebarFooterText}>
            Firestore connected
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
            onRefresh={handleRefresh}
            tintColor="#A78BFA"
          />
        }
      >

        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              VAULT1 / GROWTH / TRADING
            </Text>

            <Text style={styles.title}>
              Trading
            </Text>

            <Text style={styles.subtitle}>
              Execute, record and control
              every trade inside your
              investment ledger.
            </Text>
          </View>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              LIVE LEDGER
            </Text>
          </View>
        </View>


        {/* =================================================
            METRICS
        ================================================= */}

        <View style={styles.metricsRow}>

          <MetricCard
            label="OPEN TRADES"
            value={summary.openTrades.toString()}
            caption={`${formatINR(
              openExposure
            )} exposure`}
            accent
          />

          <MetricCard
            label="CLOSED TRADES"
            value={summary.closedTrades.toString()}
            caption={`${summary.winningTrades} winners`}
          />

          <MetricCard
            label="REALIZED P&L"
            value={formatSignedINR(
              summary.realizedPnL
            )}
            caption={`${summary.winRate.toFixed(
              1
            )}% win rate`}
            positive={
              summary.realizedPnL > 0
            }
            negative={
              summary.realizedPnL < 0
            }
          />

          <MetricCard
            label="TOTAL FEES"
            value={formatINR(
              summary.totalFees
            )}
            caption={`${summary.totalTrades} total trades`}
          />

        </View>


        {/* =================================================
            TRADE ENTRY
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Record Trade
            </Text>

            <Text style={styles.sectionSubtitle}>
              Add a new position to the
              permanent trading book.
            </Text>
          </View>
        </View>


        <View style={styles.tradeForm}>

          <View style={styles.formTop}>

            <View style={styles.fieldWide}>
              <Text style={styles.fieldLabel}>
                ASSET / SYMBOL
              </Text>

              <TextInput
                value={asset}
                onChangeText={setAsset}
                placeholder="e.g. RELIANCE"
                placeholderTextColor="#55505F"
                style={styles.input}
                autoCapitalize="characters"
              />
            </View>


            <View style={styles.sideField}>
              <Text style={styles.fieldLabel}>
                SIDE
              </Text>

              <View style={styles.sideRow}>

                <Pressable
                  onPress={() =>
                    setSide("BUY")
                  }
                  style={[
                    styles.sideButton,
                    side === "BUY" &&
                      styles.sideButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.sideButtonText,
                      side === "BUY" &&
                        styles.sideButtonTextActive,
                    ]}
                  >
                    BUY
                  </Text>
                </Pressable>


                <Pressable
                  onPress={() =>
                    setSide("SELL")
                  }
                  style={[
                    styles.sideButton,
                    side === "SELL" &&
                      styles.sideButtonActiveSell,
                  ]}
                >
                  <Text
                    style={[
                      styles.sideButtonText,
                      side === "SELL" &&
                        styles.sideButtonTextActiveSell,
                    ]}
                  >
                    SELL
                  </Text>
                </Pressable>

              </View>
            </View>

          </View>


          <View style={styles.formGrid}>

            <FormField
              label="QUANTITY"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              keyboardType="numeric"
            />

            <FormField
              label="ENTRY PRICE"
              value={entryPrice}
              onChangeText={setEntryPrice}
              placeholder="₹0.00"
              keyboardType="numeric"
            />

            <FormField
              label="FEES"
              value={fees}
              onChangeText={setFees}
              placeholder="₹0.00"
              keyboardType="numeric"
            />

            <FormField
              label="STRATEGY"
              value={strategy}
              onChangeText={setStrategy}
              placeholder="e.g. Momentum"
            />

          </View>


          <View style={styles.formBottom}>

            <View style={styles.formHint}>
              <Text style={styles.formHintTitle}>
                OPEN POSITION
              </Text>

              <Text style={styles.formHintText}>
                This trade will be stored in
                Firestore and immediately become
                available to the Portfolio engine.
              </Text>
            </View>


            <Pressable
              onPress={handleRecordTrade}
              disabled={saving}
              style={[
                styles.primaryButton,
                saving &&
                  styles.primaryButtonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.primaryButtonText}>
                  RECORD TRADE
                </Text>
              )}
            </Pressable>

          </View>

        </View>


        {/* =================================================
            TRADE BOOK
        ================================================= */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Trade Book
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your permanent execution history.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {trades.length} RECORDS
            </Text>
          </View>
        </View>


        <View style={styles.tradeBook}>

          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                size="large"
                color="#A78BFA"
              />

              <Text style={styles.loadingText}>
                Loading trading ledger...
              </Text>
            </View>
          ) : trades.length === 0 ? (
            <View style={styles.emptyState}>

              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>
                  +
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                No trades recorded
              </Text>

              <Text style={styles.emptyText}>
                Your first recorded trade will
                appear here permanently and
                flow into Portfolio analytics.
              </Text>

            </View>
          ) : (
            <View>

              <View style={styles.tableHeader}>

                <Text style={[
                  styles.tableHeaderText,
                  styles.assetColumn,
                ]}>
                  ASSET
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.sideColumn,
                ]}>
                  SIDE
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.numberColumn,
                ]}>
                  QTY
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.numberColumn,
                ]}>
                  ENTRY
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.numberColumn,
                ]}>
                  EXIT
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.numberColumn,
                ]}>
                  P&L
                </Text>

                <Text style={[
                  styles.tableHeaderText,
                  styles.statusColumn,
                ]}>
                  STATUS
                </Text>

              </View>


              {trades.map(
                (trade: Trade) => {
                  const pnl =
                    calculateTradePnL(trade);

                  const isClosing =
                    closingTradeId ===
                    trade.id;

                  return (
                    <View
                      key={trade.id}
                      style={styles.tableRow}
                    >

                      <View
                        style={styles.assetColumn}
                      >
                        <Text style={styles.assetName}>
                          {trade.asset}
                        </Text>

                        <Text style={styles.assetMeta}>
                          {trade.strategy}
                        </Text>

                        <Text style={styles.assetDate}>
                          {formatDate(
                            trade.createdAt
                          )}
                        </Text>
                      </View>


                      <View
                        style={styles.sideColumn}
                      >
                        <Text
                          style={[
                            styles.sideValue,
                            trade.side === "BUY"
                              ? styles.buyText
                              : styles.sellText,
                          ]}
                        >
                          {trade.side}
                        </Text>
                      </View>


                      <Text
                        style={[
                          styles.tableValue,
                          styles.numberColumn,
                        ]}
                      >
                        {trade.quantity}
                      </Text>


                      <Text
                        style={[
                          styles.tableValue,
                          styles.numberColumn,
                        ]}
                      >
                        {formatINR(
                          trade.entryPrice
                        )}
                      </Text>


                      <View
                        style={[
                          styles.numberColumn,
                          styles.exitCell,
                        ]}
                      >
                        {trade.status ===
                          "CLOSED" ? (
                          <Text
                            style={
                              styles.tableValue
                            }
                          >
                            {formatINR(
                              trade.exitPrice || 0
                            )}
                          </Text>
                        ) : (
                          <Text
                            style={
                              styles.mutedValue
                            }
                          >
                            —
                          </Text>
                        )}
                      </View>


                      <Text
                        style={[
                          styles.tableValue,
                          styles.numberColumn,
                          pnl > 0 &&
                            styles.positiveText,
                          pnl < 0 &&
                            styles.negativeText,
                        ]}
                      >
                        {trade.status ===
                        "CLOSED"
                          ? formatSignedINR(pnl)
                          : "—"}
                      </Text>


                      <View
                        style={styles.statusColumn}
                      >
                        {trade.status ===
                        "OPEN" ? (
                          <Pressable
                            onPress={() => {
                              setClosingTradeId(
                                trade.id
                              );
                              setExitPrice("");
                            }}
                            style={
                              styles.openBadge
                            }
                          >
                            <Text
                              style={
                                styles.openBadgeText
                              }
                            >
                              CLOSE
                            </Text>
                          </Pressable>
                        ) : (
                          <View
                            style={
                              styles.closedBadge
                            }
                          >
                            <Text
                              style={
                                styles.closedBadgeText
                              }
                            >
                              CLOSED
                            </Text>
                          </View>
                        )}
                      </View>


                      {isClosing && (
                        <View
                          style={
                            styles.closePanel
                          }
                        >
                          <Text
                            style={
                              styles.closePanelTitle
                            }
                          >
                            EXIT PRICE
                          </Text>

                          <TextInput
                            value={exitPrice}
                            onChangeText={
                              setExitPrice
                            }
                            placeholder="₹0.00"
                            placeholderTextColor="#55505F"
                            keyboardType="numeric"
                            style={
                              styles.closeInput
                            }
                          />

                          <Pressable
                            onPress={
                              handleCloseTrade
                            }
                            disabled={saving}
                            style={
                              styles.closeConfirm
                            }
                          >
                            {saving ? (
                              <ActivityIndicator
                                color="#FFFFFF"
                              />
                            ) : (
                              <Text
                                style={
                                  styles.closeConfirmText
                                }
                              >
                                CONFIRM CLOSE
                              </Text>
                            )}
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setClosingTradeId(
                                null
                              );
                              setExitPrice("");
                            }}
                            style={
                              styles.cancelButton
                            }
                          >
                            <Text
                              style={
                                styles.cancelButtonText
                              }
                            >
                              CANCEL
                            </Text>
                          </Pressable>
                        </View>
                      )}

                    </View>
                  );
                }
              )}

            </View>
          )}

        </View>


        {/* =================================================
            ENGINE NOTE
        ================================================= */}

        <View style={styles.engineNote}>

          <View style={styles.engineNoteAccent} />

          <View style={styles.engineNoteContent}>
            <Text style={styles.engineNoteTitle}>
              POSITION ENGINE CONNECTED
            </Text>

            <Text style={styles.engineNoteText}>
              Every trade recorded here is stored
              against your authenticated Vault1
              account. Portfolio reads the same
              trading ledger to calculate open
              positions, invested capital and
              unrealized performance.
            </Text>
          </View>

        </View>


        <View style={styles.footer}>
          <Text style={styles.footerText}>
            VAULT1
          </Text>

          <Text style={styles.footerText}>
            PRIVATE WEALTH INFRASTRUCTURE
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}


/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  caption,
  accent = false,
  positive = false,
  negative = false,
}: {
  label: string;
  value: string;
  caption: string;
  accent?: boolean;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        accent && styles.metricCardAccent,
      ]}
    >
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>
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

      <Text style={styles.metricCaption}>
        {caption}
      </Text>
    </View>
  );
}


/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#55505F"
        keyboardType={keyboardType}
        style={styles.input}
      />
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
    backgroundColor: "#07060A",
  },

  sidebar: {
    width: 250,
    backgroundColor: "#0A090E",
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
    color: "#F7F4FF",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 3,
  },

  brandSub: {
    color: "#746B83",
    fontSize: 8,
    fontWeight: "800",
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
    fontWeight: "900",
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
    backgroundColor: "#171021",
    borderWidth: 1,
    borderColor: "#35234D",
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#443B4D",
    marginRight: 13,
  },

  navDotActive: {
    backgroundColor: "#A78BFA",
  },

  navText: {
    color: "#81788D",
    fontSize: 14,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#EDE8F7",
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
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  sidebarFooterText: {
    color: "#61596B",
    fontSize: 11,
    marginTop: 7,
  },

  main: {
    flex: 1,
    backgroundColor: "#07060A",
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
    marginBottom: 38,
  },

  eyebrow: {
    color: "#9B7DCE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#F8F5FF",
    fontSize: 45,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  subtitle: {
    color: "#81788D",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
    maxWidth: 620,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#110D18",
    borderWidth: 1,
    borderColor: "#2B203A",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A78BFA",
    marginRight: 9,
  },

  statusText: {
    color: "#B8A9D0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },

  metricCard: {
    flex: 1,
    minHeight: 158,
    backgroundColor: "#111016",
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
    borderColor: "#3A2852",
    backgroundColor: "#120D1A",
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  metricLabel: {
    color: "#726A7C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#403845",
  },

  metricIndicatorAccent: {
    backgroundColor: "#A78BFA",
  },

  metricValue: {
    color: "#F4F0FA",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 27,
  },

  metricCaption: {
    color: "#696170",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 7,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#F0EBF7",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  sectionSubtitle: {
    color: "#706878",
    fontSize: 12,
    marginTop: 5,
  },

  tradeForm: {
    backgroundColor: "#101016",
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    padding: 26,
    marginBottom: 48,
    ...Platform.select({
      web: {
        boxShadow:
          "0 22px 55px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.035)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 16,
        },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },

  formTop: {
    flexDirection: "row",
    gap: 22,
    marginBottom: 22,
  },

  fieldWide: {
    flex: 2,
  },

  sideField: {
    flex: 1,
  },

  fieldLabel: {
    color: "#746B80",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  input: {
    height: 50,
    backgroundColor: "#0B0A0F",
    borderWidth: 1,
    borderColor: "#2B2632",
    borderRadius: 9,
    color: "#F5F1FA",
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: "700",
  },

  sideRow: {
    flexDirection: "row",
    gap: 8,
  },

  sideButton: {
    flex: 1,
    height: 50,
    borderRadius: 9,
    backgroundColor: "#0B0A0F",
    borderWidth: 1,
    borderColor: "#2B2632",
    alignItems: "center",
    justifyContent: "center",
  },

  sideButtonActive: {
    backgroundColor: "#21162F",
    borderColor: "#704DA0",
  },

  sideButtonActiveSell: {
    backgroundColor: "#251519",
    borderColor: "#754A52",
  },

  sideButtonText: {
    color: "#756C80",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sideButtonTextActive: {
    color: "#CDB8F0",
  },

  sideButtonTextActiveSell: {
    color: "#E0B9C0",
  },

  formGrid: {
    flexDirection: "row",
    gap: 16,
  },

  formField: {
    flex: 1,
  },

  formBottom: {
    marginTop: 25,
    paddingTop: 21,
    borderTopWidth: 1,
    borderTopColor: "#24202B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
  },

  formHint: {
    flex: 1,
  },

  formHintTitle: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  formHintText: {
    color: "#68616F",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 650,
  },

  primaryButton: {
    minWidth: 180,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 9,
    backgroundColor: "#744DB0",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow:
          "0 10px 25px rgba(116,77,176,0.28)",
      },
      default: {
        elevation: 7,
      },
    }),
  },

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  countBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#110E17",
    borderWidth: 1,
    borderColor: "#292231",
  },

  countBadgeText: {
    color: "#81768F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  tradeBook: {
    backgroundColor: "#101016",
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
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
    backgroundColor: "#0C0B10",
    borderBottomWidth: 1,
    borderBottomColor: "#292431",
    paddingHorizontal: 22,
  },

  tableHeaderText: {
    color: "#686070",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  tableRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#211E27",
    position: "relative",
  },

  assetColumn: {
    flex: 2,
  },

  sideColumn: {
    flex: 0.8,
  },

  numberColumn: {
    flex: 1,
    textAlign: "right",
  },

  statusColumn: {
    flex: 1,
    alignItems: "flex-end",
  },

  assetName: {
    color: "#F1ECF7",
    fontSize: 14,
    fontWeight: "900",
  },

  assetMeta: {
    color: "#817687",
    fontSize: 11,
    marginTop: 4,
  },

  assetDate: {
    color: "#514A58",
    fontSize: 9,
    marginTop: 5,
  },

  sideValue: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  buyText: {
    color: "#A78BFA",
  },

  sellText: {
    color: "#D29BA4",
  },

  tableValue: {
    color: "#DAD3E2",
    fontSize: 12,
    fontWeight: "700",
  },

  mutedValue: {
    color: "#514B57",
    fontSize: 13,
    fontWeight: "700",
  },

  positiveText: {
    color: "#A78BFA",
  },

  negativeText: {
    color: "#D58F9B",
  },

  openBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: "#1B1425",
    borderWidth: 1,
    borderColor: "#4A3265",
  },

  openBadgeText: {
    color: "#B99BDE",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  closedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: "#121116",
    borderWidth: 1,
    borderColor: "#302B35",
  },

  closedBadgeText: {
    color: "#77707D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  exitCell: {
    justifyContent: "center",
  },

  closePanel: {
    position: "absolute",
    right: 20,
    top: 72,
    zIndex: 10,
    width: 330,
    padding: 18,
    backgroundColor: "#15121B",
    borderWidth: 1,
    borderColor: "#46305D",
    borderRadius: 12,
    ...Platform.select({
      web: {
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.65)",
      },
      default: {
        elevation: 15,
      },
    }),
  },

  closePanelTitle: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 8,
  },

  closeInput: {
    height: 45,
    backgroundColor: "#0B0A0F",
    borderWidth: 1,
    borderColor: "#302938",
    borderRadius: 8,
    color: "#F5F1FA",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "700",
  },

  closeConfirm: {
    height: 44,
    backgroundColor: "#704BA8",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  closeConfirmText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  cancelButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  cancelButtonText: {
    color: "#726978",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  loadingState: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#6F6877",
    fontSize: 12,
    marginTop: 14,
  },

  emptyState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#16111F",
    borderWidth: 1,
    borderColor: "#38264D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyIconText: {
    color: "#A78BFA",
    fontSize: 28,
    fontWeight: "300",
  },

  emptyTitle: {
    color: "#EDE8F4",
    fontSize: 20,
    fontWeight: "900",
  },

  emptyText: {
    color: "#68616F",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 460,
    marginTop: 8,
  },

  engineNote: {
    flexDirection: "row",
    backgroundColor: "#0F0C15",
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
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  engineNoteText: {
    color: "#69616F",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 850,
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
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});