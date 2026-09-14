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
import {
  createStrategy,
  getStrategies,
  calculateStrategyWinRate,
} from "../services/strategies/strategyService";

import {
  Strategy,
  StrategyRiskLevel,
} from "../types/strategy";

const NAVIGATION = [
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

const ASSET_CLASSES = [
  "EQUITY",
  "ETF",
  "MUTUAL FUND",
  "CRYPTO",
  "GOLD",
  "FOREX",
  "COMMODITY",
  "FIXED INCOME",
  "CASH",
  "OTHER",
];

const RISK_LEVELS: StrategyRiskLevel[] = [
  "LOW",
  "MODERATE",
  "HIGH",
  "VERY HIGH",
];

function formatCurrency(value: number) {
  return `₹${Math.abs(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatSignedCurrency(value: number) {
  if (value === 0) {
    return "₹0";
  }

  return value > 0
    ? `+₹${value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`
    : `-₹${Math.abs(value).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#55515F"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
        ]}
      />
    </View>
  );
}

export default function StrategiesScreen() {
  const { profile } = useAuth();

  const [strategies, setStrategies] = useState<Strategy[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] =
    useState("");

  const [riskLevel, setRiskLevel] =
    useState<StrategyRiskLevel>("MODERATE");

  const [selectedAssetClasses, setSelectedAssetClasses] =
    useState<string[]>(["EQUITY"]);

  const [targetReturn, setTargetReturn] =
    useState("");

  const [maxDrawdown, setMaxDrawdown] =
    useState("");

  const [maxAllocation, setMaxAllocation] =
    useState("");

  const [minimumCapital, setMinimumCapital] =
    useState("");

  const [error, setError] = useState("");

  const userId = profile?.uid;

  async function loadStrategies() {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const data = await getStrategies(userId);

      setStrategies(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load strategies."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStrategies();
  }, [userId]);

  function resetForm() {
    setName("");
    setCode("");
    setDescription("");

    setRiskLevel("MODERATE");

    setSelectedAssetClasses(["EQUITY"]);

    setTargetReturn("");
    setMaxDrawdown("");
    setMaxAllocation("");
    setMinimumCapital("");

    setError("");
  }

  function toggleAssetClass(assetClass: string) {
    setSelectedAssetClasses((current) => {
      if (current.includes(assetClass)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter(
          (item) => item !== assetClass
        );
      }

      return [...current, assetClass];
    });
  }

  async function handleCreateStrategy() {
    if (!userId) {
      setError("You must be logged in.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await createStrategy({
        userId,

        name,
        code,
        description,

        assetClasses:
          selectedAssetClasses,

        riskLevel,

        targetReturnPercent:
          targetReturn.trim()
            ? Number(targetReturn)
            : undefined,

        maxDrawdownPercent:
          maxDrawdown.trim()
            ? Number(maxDrawdown)
            : undefined,

        maxCapitalAllocationPercent:
          maxAllocation.trim()
            ? Number(maxAllocation)
            : undefined,

        minimumCapital:
          minimumCapital.trim()
            ? Number(minimumCapital)
            : undefined,

        status: "ACTIVE",
      });

      await loadStrategies();

      resetForm();

      setModalVisible(false);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create strategy."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredStrategies = useMemo(() => {
    const queryText =
      search.trim().toLowerCase();

    if (!queryText) {
      return strategies;
    }

    return strategies.filter((strategy) => {
      return (
        strategy.name
          .toLowerCase()
          .includes(queryText) ||
        strategy.code
          .toLowerCase()
          .includes(queryText) ||
        strategy.description
          .toLowerCase()
          .includes(queryText) ||
        strategy.assetClasses.some((asset) =>
          asset
            .toLowerCase()
            .includes(queryText)
        )
      );
    });
  }, [strategies, search]);

  const activeCount = strategies.filter(
    (strategy) =>
      strategy.status === "ACTIVE"
  ).length;

  const highRiskCount = strategies.filter(
    (strategy) =>
      strategy.riskLevel === "HIGH" ||
      strategy.riskLevel === "VERY HIGH"
  ).length;

  const totalTrades = strategies.reduce(
    (total, strategy) =>
      total + strategy.totalTrades,
    0
  );

  const totalPnL = strategies.reduce(
    (total, strategy) =>
      total + strategy.realizedPnL,
    0
  );

  function handleNavigation(item: string) {
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

      case "Assets":
        router.push("/assets");
        break;

      case "Strategies":
        router.replace("/strategies");
        break;

      case "Capital":
        router.push("/capital");
        break;

      default:
        break;
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <View>
          <View style={styles.brandBlock}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>
                V
              </Text>
            </View>

            <View>
              <Text style={styles.brand}>
                VAULT1
              </Text>

              <Text style={styles.brandSub}>
                WEALTH OPERATING SYSTEM
              </Text>
            </View>
          </View>

          <View style={styles.sidebarLine} />

          {NAVIGATION.map((group) => (
            <View
              key={group.section}
              style={styles.navGroup}
            >
              <Text style={styles.navSection}>
                {group.section}
              </Text>

              {group.items.map((item) => {
                const active =
                  item === "Strategies";

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
              })}
            </View>
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <Text style={styles.footerLabel}>
            STRATEGY ENGINE
          </Text>

          <Text style={styles.footerText}>
            Rule-driven capital allocation
            and performance intelligence.
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={
          styles.mainContent
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>
              VAULT1 / GROWTH / STRATEGIES
            </Text>

            <Text style={styles.pageTitle}>
              Strategy Engine
            </Text>

            <Text style={styles.pageSubtitle}>
              Define, control and measure the
              strategies behind your capital.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              + NEW STRATEGY
            </Text>
          </Pressable>
        </View>

        <View style={styles.metricsGrid}>
          <Metric
            label="TOTAL STRATEGIES"
            value={String(strategies.length)}
            detail="Defined in Vault1"
          />

          <Metric
            label="ACTIVE"
            value={String(activeCount)}
            detail="Currently available"
            accent
          />

          <Metric
            label="HIGH RISK"
            value={String(highRiskCount)}
            detail="High / very high risk"
          />

          <Metric
            label="REALIZED P&L"
            value={formatSignedCurrency(totalPnL)}
            detail={`${totalTrades} trades tracked`}
            accent={totalPnL > 0}
          />
        </View>

        <View style={styles.controlRow}>
          <View style={styles.searchBox}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search strategies, codes or asset classes..."
              placeholderTextColor="#56515F"
              style={styles.searchInput}
            />
          </View>

          <View style={styles.engineBadge}>
            <View style={styles.engineDot} />

            <Text style={styles.engineBadgeText}>
              STRATEGY ENGINE ACTIVE
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Strategy Universe
            </Text>

            <Text style={styles.sectionSubtitle}>
              Your approved playbook for capital
              deployment.
            </Text>
          </View>

          <Text style={styles.countText}>
            {filteredStrategies.length} STRATEGIES
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator
              size="large"
              color="#9B7CFF"
            />

            <Text style={styles.emptyTitle}>
              Loading strategy engine
            </Text>

            <Text style={styles.emptyText}>
              Retrieving your strategy universe.
            </Text>
          </View>
        ) : filteredStrategies.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>
                S
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              No strategies defined
            </Text>

            <Text style={styles.emptyText}>
              Create your first strategy to
              establish the rules behind your
              capital deployment.
            </Text>

            <Pressable
              onPress={() => {
                resetForm();
                setModalVisible(true);
              }}
              style={styles.secondaryButton}
            >
              <Text
                style={styles.secondaryButtonText}
              >
                CREATE FIRST STRATEGY
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.strategyGrid}>
            {filteredStrategies.map(
              (strategy) => {
                const winRate =
                  calculateStrategyWinRate(
                    strategy
                  );

                return (
                  <View
                    key={strategy.id}
                    style={styles.strategyCard}
                  >
                    <View
                      style={
                        styles.strategyTop
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.strategyCode
                          }
                        >
                          {strategy.code}
                        </Text>

                        <Text
                          style={
                            styles.strategyName
                          }
                        >
                          {strategy.name}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          strategy.status ===
                            "ACTIVE" &&
                            styles.statusBadgeActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            strategy.status ===
                              "ACTIVE" &&
                              styles.statusDotActive,
                          ]}
                        />

                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {strategy.status}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.strategyDescription
                      }
                      numberOfLines={3}
                    >
                      {strategy.description}
                    </Text>

                    <View
                      style={
                        styles.strategyDivider
                      }
                    />

                    <View
                      style={
                        styles.strategyMetaGrid
                      }
                    >
                      <StrategyMeta
                        label="RISK"
                        value={
                          strategy.riskLevel
                        }
                      />

                      <StrategyMeta
                        label="WIN RATE"
                        value={`${winRate.toFixed(
                          1
                        )}%`}
                      />

                      <StrategyMeta
                        label="TRADES"
                        value={String(
                          strategy.totalTrades
                        )}
                      />

                      <StrategyMeta
                        label="REALIZED"
                        value={formatSignedCurrency(
                          strategy.realizedPnL
                        )}
                      />
                    </View>

                    <View
                      style={
                        styles.assetRow
                      }
                    >
                      {strategy.assetClasses
                        .slice(0, 4)
                        .map((asset) => (
                          <View
                            key={asset}
                            style={
                              styles.assetChip
                            }
                          >
                            <Text
                              style={
                                styles.assetChipText
                              }
                            >
                              {asset}
                            </Text>
                          </View>
                        ))}
                    </View>

                    <View
                      style={
                        styles.strategyFooter
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.limitLabel
                          }
                        >
                          CAPITAL LIMIT
                        </Text>

                        <Text
                          style={
                            styles.limitValue
                          }
                        >
                          {strategy.maxCapitalAllocationPercent !==
                          undefined
                            ? `${strategy.maxCapitalAllocationPercent}%`
                            : "UNLIMITED"}
                        </Text>
                      </View>

                      <View
                        style={
                          styles.footerMetric
                        }
                      >
                        <Text
                          style={
                            styles.limitLabel
                          }
                        >
                          TARGET
                        </Text>

                        <Text
                          style={
                            styles.limitValue
                          }
                        >
                          {strategy.targetReturnPercent !==
                          undefined
                            ? `${strategy.targetReturnPercent}%`
                            : "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        <View style={styles.foundationCard}>
          <View style={styles.foundationAccent} />

          <View style={styles.foundationContent}>
            <Text style={styles.foundationEyebrow}>
              STRATEGY INTELLIGENCE
            </Text>

            <Text style={styles.foundationTitle}>
              One source of truth for every
              trading philosophy.
            </Text>

            <Text
              style={styles.foundationText}
            >
              Vault1 strategies will become the
              connection layer between trading,
              portfolio construction, risk,
              performance analytics and future
              Growth Missions.
            </Text>

            <View
              style={styles.foundationPoints}
            >
              <FoundationPoint
                title="RULES"
                text="Define the boundaries before capital is deployed."
              />

              <FoundationPoint
                title="ALLOCATION"
                text="Control how much capital each strategy can consume."
              />

              <FoundationPoint
                title="PERFORMANCE"
                text="Measure every strategy independently."
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalContent
              }
            >
              <View
                style={styles.modalHeader}
              >
                <View>
                  <Text
                    style={
                      styles.modalEyebrow
                    }
                  >
                    STRATEGY ENGINE
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    New Strategy
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalVisible(false)
                  }
                  style={
                    styles.closeButton
                  }
                >
                  <Text
                    style={
                      styles.closeButtonText
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <Input
                label="STRATEGY NAME"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Momentum Alpha"
              />

              <Input
                label="STRATEGY CODE"
                value={code}
                onChangeText={setCode}
                placeholder="e.g. MOM_ALPHA"
              />

              <Input
                label="DESCRIPTION"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the strategy..."
                multiline
              />

              <Text
                style={styles.inputLabel}
              >
                RISK LEVEL
              </Text>

              <View
                style={styles.optionRow}
              >
                {RISK_LEVELS.map((risk) => {
                  const active =
                    riskLevel === risk;

                  return (
                    <Pressable
                      key={risk}
                      onPress={() =>
                        setRiskLevel(risk)
                      }
                      style={[
                        styles.optionButton,
                        active &&
                          styles.optionButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          active &&
                            styles.optionTextActive,
                        ]}
                      >
                        {risk}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.inputLabel,
                  { marginTop: 24 },
                ]}
              >
                ASSET CLASSES
              </Text>

              <View
                style={styles.assetSelector}
              >
                {ASSET_CLASSES.map(
                  (assetClass) => {
                    const selected =
                      selectedAssetClasses.includes(
                        assetClass
                      );

                    return (
                      <Pressable
                        key={assetClass}
                        onPress={() =>
                          toggleAssetClass(
                            assetClass
                          )
                        }
                        style={[
                          styles.assetSelectorItem,
                          selected &&
                            styles.assetSelectorItemActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.assetSelectorText,
                            selected &&
                              styles.assetSelectorTextActive,
                          ]}
                        >
                          {assetClass}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>

              <View
                style={styles.twoColumn}
              >
                <View
                  style={
                    styles.columnField
                  }
                >
                  <Input
                    label="TARGET RETURN %"
                    value={targetReturn}
                    onChangeText={
                      setTargetReturn
                    }
                    placeholder="25"
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.columnField
                  }
                >
                  <Input
                    label="MAX DRAWDOWN %"
                    value={maxDrawdown}
                    onChangeText={
                      setMaxDrawdown
                    }
                    placeholder="10"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View
                style={styles.twoColumn}
              >
                <View
                  style={
                    styles.columnField
                  }
                >
                  <Input
                    label="MAX ALLOCATION %"
                    value={maxAllocation}
                    onChangeText={
                      setMaxAllocation
                    }
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.columnField
                  }
                >
                  <Input
                    label="MINIMUM CAPITAL"
                    value={minimumCapital}
                    onChangeText={
                      setMinimumCapital
                    }
                    placeholder="5000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {error ? (
                <View
                  style={styles.errorBox}
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={
                  handleCreateStrategy
                }
                disabled={saving}
                style={[
                  styles.modalPrimaryButton,
                  saving &&
                    styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.modalPrimaryText
                    }
                  >
                    CREATE STRATEGY
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  setModalVisible(false)
                }
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
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Metric({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Text style={styles.metricLabel}>
          {label}
        </Text>

        <View
          style={[
            styles.metricDot,
            accent &&
              styles.metricDotAccent,
          ]}
        />
      </View>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricDetail}>
        {detail}
      </Text>
    </View>
  );
}

function StrategyMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>
        {label}
      </Text>

      <Text style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

function FoundationPoint({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View style={styles.foundationPoint}>
      <View style={styles.foundationPointDot} />

      <View style={{ flex: 1 }}>
        <Text
          style={
            styles.foundationPointTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.foundationPointText
          }
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#08070B",
  },

  sidebar: {
    width: 270,
    backgroundColor: "#0B0A0F",
    borderRightWidth: 1,
    borderRightColor: "#211D2A",
    paddingHorizontal: 24,
    paddingVertical: 28,
    justifyContent: "space-between",
  },

  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#14111D",
    borderWidth: 1,
    borderColor: "#3A3150",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  brandMarkText: {
    color: "#B08CFF",
    fontSize: 20,
    fontWeight: "900",
  },

  brand: {
    color: "#F7F4FF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandSub: {
    color: "#6D6678",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 3,
  },

  sidebarLine: {
    height: 1,
    backgroundColor: "#211D2A",
    marginVertical: 28,
  },

  navGroup: {
    marginBottom: 24,
  },

  navSection: {
    color: "#514B5D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 9,
  },

  navItem: {
    height: 43,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 4,
  },

  navItemActive: {
    backgroundColor: "#171321",
    borderWidth: 1,
    borderColor: "#332850",
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#403A48",
  },

  navDotActive: {
    width: 6,
    height: 6,
    backgroundColor: "#A77CFF",
    shadowColor: "#9B6DFF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },

  navText: {
    color: "#8C8697",
    fontSize: 14,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#EEE9FF",
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#211D2A",
    paddingTop: 18,
  },

  footerLabel: {
    color: "#8D6CFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  footerText: {
    color: "#625C6C",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    paddingHorizontal: 44,
    paddingVertical: 42,
    paddingBottom: 80,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 34,
  },

  eyebrow: {
    color: "#8D6CFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 10,
  },

  pageTitle: {
    color: "#F8F5FF",
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  pageSubtitle: {
    color: "#81798D",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
  },

  primaryButton: {
    minWidth: 170,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#8E68E8",
    borderWidth: 1,
    borderColor: "#B69AFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8E68E8",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  metricsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },

  metricCard: {
    flex: 1,
    minHeight: 148,
    backgroundColor: "#111016",
    borderWidth: 1,
    borderColor: "#272230",
    borderRadius: 14,
    padding: 21,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 10,
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metricLabel: {
    color: "#6C6577",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  metricDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#39333F",
  },

  metricDotAccent: {
    backgroundColor: "#A77CFF",
    shadowColor: "#9B6DFF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },

  metricValue: {
    color: "#F5F0FF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  metricDetail: {
    color: "#625B6C",
    fontSize: 11,
    fontWeight: "600",
  },

  controlRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 38,
  },

  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: "#100E14",
    borderWidth: 1,
    borderColor: "#292331",
    borderRadius: 11,
    justifyContent: "center",
  },

  searchInput: {
    color: "#EEE9F8",
    fontSize: 14,
    paddingHorizontal: 17,
    outlineStyle: "none",
  } as any,

  engineBadge: {
    minWidth: 210,
    height: 52,
    borderRadius: 11,
    backgroundColor: "#110F16",
    borderWidth: 1,
    borderColor: "#292331",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  engineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A77CFF",
    shadowColor: "#A77CFF",
    shadowOpacity: 0.8,
    shadowRadius: 9,
  },

  engineBadgeText: {
    color: "#8C8398",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 17,
  },

  sectionTitle: {
    color: "#F2EDF9",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  sectionSubtitle: {
    color: "#6D6676",
    fontSize: 13,
    marginTop: 5,
  },

  countText: {
    color: "#746A82",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  strategyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  strategyCard: {
    width: "calc(50% - 8px)" as any,
    minHeight: 340,
    backgroundColor: "#111016",
    borderWidth: 1,
    borderColor: "#292330",
    borderRadius: 15,
    padding: 23,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 25,
    elevation: 12,
  },

  strategyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  strategyCode: {
    color: "#A77CFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 6,
  },

  strategyName: {
    color: "#F6F1FF",
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#15131A",
    borderWidth: 1,
    borderColor: "#2C2733",
  },

  statusBadgeActive: {
    borderColor: "#41335D",
    backgroundColor: "#181422",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#514B58",
  },

  statusDotActive: {
    backgroundColor: "#A77CFF",
  },

  statusText: {
    color: "#77707F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  strategyDescription: {
    color: "#7C7487",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 18,
    minHeight: 60,
  },

  strategyDivider: {
    height: 1,
    backgroundColor: "#24202B",
    marginVertical: 18,
  },

  strategyMetaGrid: {
    flexDirection: "row",
    gap: 10,
  },

  metaItem: {
    flex: 1,
  },

  metaLabel: {
    color: "#595361",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  metaValue: {
    color: "#DDD6E9",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 6,
  },

  assetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 18,
  },

  assetChip: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#17141D",
    borderWidth: 1,
    borderColor: "#2A2532",
  },

  assetChipText: {
    color: "#81788E",
    fontSize: 9,
    fontWeight: "800",
  },

  strategyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#24202B",
    marginTop: 18,
    paddingTop: 16,
  },

  footerMetric: {
    alignItems: "flex-end",
  },

  limitLabel: {
    color: "#595361",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  limitValue: {
    color: "#D8D0E5",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
  },

  emptyState: {
    minHeight: 380,
    borderWidth: 1,
    borderColor: "#28232F",
    borderRadius: 15,
    backgroundColor: "#0F0D13",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#171321",
    borderWidth: 1,
    borderColor: "#3A2E50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyIconText: {
    color: "#A77CFF",
    fontSize: 24,
    fontWeight: "900",
  },

  emptyTitle: {
    color: "#EDE7F7",
    fontSize: 22,
    fontWeight: "900",
  },

  emptyText: {
    color: "#6F6879",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 560,
    marginTop: 9,
  },

  secondaryButton: {
    marginTop: 22,
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#4A3B66",
    backgroundColor: "#171321",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#B79AFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  foundationCard: {
    marginTop: 26,
    minHeight: 260,
    borderRadius: 15,
    backgroundColor: "#100E14",
    borderWidth: 1,
    borderColor: "#2C2636",
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },

  foundationAccent: {
    width: 4,
    backgroundColor: "#8E68E8",
  },

  foundationContent: {
    flex: 1,
    padding: 27,
  },

  foundationEyebrow: {
    color: "#8E68E8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  foundationTitle: {
    color: "#F0EBF8",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 8,
    maxWidth: 700,
  },

  foundationText: {
    color: "#756E7F",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 820,
  },

  foundationPoints: {
    flexDirection: "row",
    gap: 28,
    marginTop: 23,
  },

  foundationPoint: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },

  foundationPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A77CFF",
    marginTop: 6,
  },

  foundationPointTitle: {
    color: "#D9D1E4",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  foundationPointText: {
    color: "#676070",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  modalCard: {
    width: "min(760px, 100%)" as any,
    maxHeight: "92%",
    borderRadius: 18,
    backgroundColor: "#0E0C12",
    borderWidth: 1,
    borderColor: "#393145",
    shadowColor: "#000",
    shadowOpacity: 0.65,
    shadowRadius: 40,
    elevation: 20,
  },

  modalContent: {
    padding: 30,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 26,
  },

  modalEyebrow: {
    color: "#9270F4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  modalTitle: {
    color: "#F3EDF9",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 5,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#17141C",
    borderWidth: 1,
    borderColor: "#2F2937",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#A69EAF",
    fontSize: 25,
    lineHeight: 28,
  },

  inputGroup: {
    marginBottom: 18,
    flex: 1,
  },

  inputLabel: {
    color: "#6F6878",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  input: {
    height: 48,
    borderRadius: 9,
    backgroundColor: "#141118",
    borderWidth: 1,
    borderColor: "#2E2837",
    color: "#F0EAF8",
    fontSize: 14,
    paddingHorizontal: 14,
    outlineStyle: "none",
  } as any,

  multilineInput: {
    height: 92,
    paddingTop: 13,
    textAlignVertical: "top",
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },

  optionButton: {
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#141118",
    borderWidth: 1,
    borderColor: "#2D2735",
    alignItems: "center",
    justifyContent: "center",
  },

  optionButtonActive: {
    backgroundColor: "#211832",
    borderColor: "#684DA1",
  },

  optionText: {
    color: "#777080",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  optionTextActive: {
    color: "#C1A9FF",
  },

  assetSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 24,
  },

  assetSelectorItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: "#141118",
    borderWidth: 1,
    borderColor: "#2D2735",
  },

  assetSelectorItemActive: {
    backgroundColor: "#211832",
    borderColor: "#684DA1",
  },

  assetSelectorText: {
    color: "#706979",
    fontSize: 9,
    fontWeight: "800",
  },

  assetSelectorTextActive: {
    color: "#C1A9FF",
  },

  twoColumn: {
    flexDirection: "row",
    gap: 14,
  },

  columnField: {
    flex: 1,
  },

  errorBox: {
    backgroundColor: "#24151B",
    borderWidth: 1,
    borderColor: "#57303D",
    borderRadius: 9,
    padding: 12,
    marginBottom: 14,
  },

  errorText: {
    color: "#E29AAA",
    fontSize: 12,
    lineHeight: 18,
  },

  modalPrimaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: "#8E68E8",
    borderWidth: 1,
    borderColor: "#B69AFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    shadowColor: "#8E68E8",
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },

  disabledButton: {
    opacity: 0.55,
  },

  modalPrimaryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },

  cancelButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  cancelButtonText: {
    color: "#756D80",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
});