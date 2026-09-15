import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";
import { useAuth } from "../services/auth/AuthProvider";

import { FONT, COLORS } from "./theme/theme";

import {
  createInvestor,
  getInvestorRiskLabel,
  getInvestorStatusLabel,
  getInvestors,
} from "../services/investors/investorService";

import {
  Investor,
  InvestorRiskProfile,
  InvestorStatus,
} from "../types/investor";

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

const riskOptions: {
  label: string;
  value: InvestorRiskProfile;
}[] = [
  {
    label: "CONSERVATIVE",
    value: "CONSERVATIVE",
  },
  {
    label: "MODERATE",
    value: "MODERATE",
  },
  {
    label: "BALANCED",
    value: "BALANCED",
  },
  {
    label: "AGGRESSIVE",
    value: "AGGRESSIVE",
  },
  {
    label: "NOT SET",
    value: "NOT_SET",
  },
];

const statusFilters: Array<
  "ALL" | InvestorStatus
> = [
  "ALL",
  "INVITED",
  "ONBOARDING",
  "PENDING_REVIEW",
  "ACTIVE",
  "SUSPENDED",
  "CLOSED",
];

function formatINR(value: number): string {
  return `₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatSignedINR(value: number): string {
  if (value === 0) {
    return "₹0";
  }

  return `${value > 0 ? "+" : "-"}₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getRoute(
  item: string
): string | undefined {
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
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <VaultSurface
      intensity="medium"
      style={styles.metricCard}
    >
      <View style={styles.metricContent}>
        <View style={styles.metricTop}>
          <Text style={styles.metricLabel}>
            {label}
          </Text>

          <View style={styles.metricDot} />
        </View>

        <View>
          <Text style={styles.metricValue}>
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

function StatusBadge({
  status,
}: {
  status: InvestorStatus;
}) {
  const active = status === "ACTIVE";

  const pending =
    status === "ONBOARDING" ||
    status === "PENDING_REVIEW";

  return (
    <View
      style={[
        styles.statusBadge,
        active && styles.statusBadgeActive,
        pending && styles.statusBadgePending,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          active && styles.statusDotActive,
          pending && styles.statusDotPending,
        ]}
      />

      <Text
        style={[
          styles.statusText,
          active && styles.statusTextActive,
          pending && styles.statusTextPending,
        ]}
      >
        {getInvestorStatusLabel(status)}
      </Text>
    </View>
  );
}

function InvestorRow({
  investor,
}: {
  investor: Investor;
}) {
  return (
    <View style={styles.investorRow}>
      <View style={styles.investorIdentity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {investor.fullName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.investorName}>
            {investor.fullName}
          </Text>

          <Text style={styles.investorCode}>
            {investor.investorCode}
          </Text>
        </View>
      </View>

      <View style={styles.contactCell}>
        <Text
          style={styles.emailText}
          numberOfLines={1}
        >
          {investor.email}
        </Text>

        <Text style={styles.phoneText}>
          {investor.phone}
        </Text>
      </View>

      <View style={styles.statusCell}>
        <StatusBadge status={investor.status} />
      </View>

      <View style={styles.capitalCell}>
        <Text style={styles.cellValue}>
          {formatINR(
            investor.contributedCapital
          )}
        </Text>

        <Text style={styles.cellCaption}>
          CONTRIBUTED
        </Text>
      </View>

      <View style={styles.valueCell}>
        <Text style={styles.cellValue}>
          {formatINR(investor.currentValue)}
        </Text>

        <Text style={styles.cellCaption}>
          CURRENT VALUE
        </Text>
      </View>

      <View style={styles.returnCell}>
        <Text
          style={[
            styles.returnValue,
            investor.totalPnL > 0 &&
              styles.positiveText,
            investor.totalPnL < 0 &&
              styles.negativeText,
          ]}
        >
          {formatSignedINR(investor.totalPnL)}
        </Text>

        <Text style={styles.cellCaption}>
          {investor.returnPercent.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.riskCell}>
        <Text style={styles.riskValue}>
          {getInvestorRiskLabel(
            investor.riskProfile
          )}
        </Text>

        <Text style={styles.cellCaption}>
          RISK PROFILE
        </Text>
      </View>

      <View style={styles.progressCell}>
        <Text style={styles.progressValue}>
          {investor.onboardingProgress}%
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  investor.onboardingProgress,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function InvestorsScreen() {
  const { profile } = useAuth();

  const [investors, setInvestors] = useState<
    Investor[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | InvestorStatus>("ALL");

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] = useState("");

  const [phone, setPhone] = useState("");

  const [riskProfile, setRiskProfile] =
    useState<InvestorRiskProfile>(
      "NOT_SET"
    );

  const [strategyName, setStrategyName] =
    useState("");

  const [notes, setNotes] = useState("");

  const [activeNav, setActiveNav] =
    useState("Investors");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadInvestors(profile.uid);
  }, [profile?.uid]);

  async function loadInvestors(
    userId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const data = await getInvestors(
        userId
      );

      setInvestors(data);
    } catch (err: any) {
      console.error(
        "Investor loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load investors."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvestor() {
    if (!profile?.uid) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createInvestor({
        userId: profile.uid,
        fullName,
        email,
        phone,
        riskProfile,
        strategyName,
        notes,
      });

      setFullName("");
      setEmail("");
      setPhone("");
      setRiskProfile("NOT_SET");
      setStrategyName("");
      setNotes("");

      setShowCreateForm(false);

      setSuccess(
        "Investor record created successfully."
      );

      await loadInvestors(profile.uid);
    } catch (err: any) {
      console.error(
        "Investor creation error:",
        err
      );

      setError(
        err?.message ||
          "Unable to create investor."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleNavigation(item: string) {
    setActiveNav(item);

    const route = getRoute(item);

    if (route) {
      router.push(route as any);
    }
  }

  const filteredInvestors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return investors.filter((investor) => {
      const matchesSearch =
        !query ||
        investor.fullName
          .toLowerCase()
          .includes(query) ||
        investor.email
          .toLowerCase()
          .includes(query) ||
        investor.investorCode
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        investor.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    investors,
    search,
    statusFilter,
  ]);

  const activeCount = investors.filter(
    (investor) =>
      investor.status === "ACTIVE"
  ).length;

  const onboardingCount =
    investors.filter(
      (investor) =>
        investor.status === "INVITED" ||
        investor.status === "ONBOARDING" ||
        investor.status === "PENDING_REVIEW"
    ).length;

  const contributedCapital =
    investors.reduce(
      (total, investor) =>
        total +
        investor.contributedCapital,
      0
    );

  const currentValue = investors.reduce(
    (total, investor) =>
      total + investor.currentValue,
    0
  );

  const totalPnL = investors.reduce(
    (total, investor) =>
      total + investor.totalPnL,
    0
  );

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.loadingMark}>
          <Text style={styles.loadingMarkText}>
            V1
          </Text>
        </View>

        <ActivityIndicator
          color="#9A7BFF"
          size="small"
        />

        <Text style={styles.loadingText}>
          LOADING INVESTOR COMMAND CENTER
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.sidebar} pointerEvents="none">
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

              {group.items.map((item) => {
                const active =
                  activeNav === item;

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
                        style={styles.navArrow}
                      >
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
              {(profile?.displayName || "V")
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
              {profile?.role || "VIEWER"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.main}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>
                INVESTOR OPERATIONS
              </Text>

              <Text style={styles.title}>
                Investors
              </Text>

              <Text style={styles.subtitle}>
                The central registry for
                investor relationships,
                onboarding, capital,
                performance and account
                status.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setSuccess("");
                setError("");
                setShowCreateForm(
                  !showCreateForm
                );
              }}
              style={({ pressed }) => [
                styles.createButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={[
                  "#7655C5",
                  "#9A7BFF",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={styles.createGradient}
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  {showCreateForm
                    ? "CLOSE"
                    : "ADD INVESTOR"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {success ? (
            <VaultSurface
              intensity="subtle"
              style={styles.successCard}
            >
              <View style={styles.successDot} />

              <Text style={styles.successText}>
                {success}
              </Text>
            </VaultSurface>
          ) : null}

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

          {showCreateForm ? (
            <VaultSurface
              intensity="strong"
              style={styles.formCard}
            >
              <Text style={styles.formEyebrow}>
                INVESTOR REGISTRATION
              </Text>

              <Text style={styles.formTitle}>
                Create investor record
              </Text>

              <Text
                style={styles.formDescription}
              >
                Establish the investor master
                record first. Verification,
                agreement, account activation
                and capital operations are
                handled in later layers.
              </Text>

              <View style={styles.formGrid}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    FULL NAME
                  </Text>

                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Investor full name"
                    placeholderTextColor={COLORS.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    EMAIL
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="investor@email.com"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    PHONE
                  </Text>

                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    STRATEGY
                  </Text>

                  <TextInput
                    value={strategyName}
                    onChangeText={
                      setStrategyName
                    }
                    placeholder="Assigned strategy"
                    placeholderTextColor={COLORS.muted}
                    style={styles.input}
                  />
                </View>

                <View
                  style={styles.inputGroupFull}
                >
                  <Text style={styles.inputLabel}>
                    RISK PROFILE
                  </Text>

                  <View
                    style={styles.riskSelector}
                  >
                    {riskOptions.map(
                      (option) => {
                        const selected =
                          riskProfile ===
                          option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() =>
                              setRiskProfile(
                                option.value
                              )
                            }
                            style={({
                              pressed,
                            }) => [
                              styles.riskButton,
                              selected &&
                                styles.riskButtonActive,
                              pressed &&
                                styles.riskButtonPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.riskButtonText,
                                selected &&
                                  styles.riskButtonTextActive,
                              ]}
                            >
                              {
                                option.label
                              }
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>

                <View
                  style={styles.inputGroupFull}
                >
                  <Text style={styles.inputLabel}>
                    INTERNAL NOTES
                  </Text>

                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Internal operational notes"
                    placeholderTextColor={COLORS.muted}
                    multiline
                    numberOfLines={4}
                    style={[
                      styles.input,
                      styles.notesInput,
                    ]}
                  />
                </View>
              </View>

              <View style={styles.formFooter}>
                <Text
                  style={
                    styles.formFooterText
                  }
                >
                  ACCOUNT ACTIVATION REQUIRES
                  COMPLETED ONBOARDING
                </Text>

                <Pressable
                  disabled={saving}
                  onPress={
                    handleCreateInvestor
                  }
                  style={({ pressed }) => [
                    styles.saveButton,
                    saving &&
                      styles.saveButtonDisabled,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    {saving
                      ? "CREATING..."
                      : "CREATE INVESTOR"}
                  </Text>
                </Pressable>
              </View>
            </VaultSurface>
          ) : null}

          <View style={styles.metricGrid}>
            <MetricCard
              label="TOTAL INVESTORS"
              value={String(
                investors.length
              )}
              caption="Investor master records"
            />

            <MetricCard
              label="ACTIVE"
              value={String(activeCount)}
              caption="Active investor accounts"
            />

            <MetricCard
              label="ONBOARDING"
              value={String(
                onboardingCount
              )}
              caption="Invited or under review"
            />

            <MetricCard
              label="CONTRIBUTED CAPITAL"
              value={formatINR(
                contributedCapital
              )}
              caption="Recorded investor capital"
            />

            <MetricCard
              label="CURRENT VALUE"
              value={formatINR(
                currentValue
              )}
              caption="Current investor value"
            />

            <MetricCard
              label="TOTAL P&L"
              value={formatSignedINR(
                totalPnL
              )}
              caption="Combined investor result"
            />
          </View>

          <VaultSurface
            intensity="medium"
            style={styles.registryCard}
          >
            <View style={styles.registryHeader}>
              <View style={styles.registryTitleBlock}>
                <Text
                  style={
                    styles.registryEyebrow
                  }
                >
                  INVESTOR REGISTRY
                </Text>

                <Text
                  style={styles.registryTitle}
                >
                  Investor book
                </Text>
              </View>

              <View
                style={styles.registryControls}
              >
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search investors..."
                  placeholderTextColor={COLORS.muted}
                  style={styles.searchInput}
                />

                <View style={styles.filterRow}>
                  {statusFilters.map(
                    (status) => {
                      const selected =
                        statusFilter ===
                        status;

                      return (
                        <Pressable
                          key={status}
                          onPress={() =>
                            setStatusFilter(
                              status
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.filterButton,
                            selected &&
                              styles.filterButtonActive,
                            pressed &&
                              styles.filterButtonPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterText,
                              selected &&
                                styles.filterTextActive,
                            ]}
                          >
                            {status ===
                            "PENDING_REVIEW"
                              ? "REVIEW"
                              : status}
                          </Text>
                        </Pressable>
                      );
                    }
                  )}
                </View>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
            >
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    INVESTOR
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    CONTACT
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    STATUS
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    CAPITAL
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    VALUE
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    P&L
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    RISK
                  </Text>

                  <Text
                    style={
                      styles.tableHeaderText
                    }
                  >
                    ONBOARDING
                  </Text>
                </View>

                {filteredInvestors.length ===
                0 ? (
                  <View
                    style={styles.emptyState}
                  >
                    <View
                      style={styles.emptyIcon}
                    >
                      <Text
                        style={
                          styles.emptyIconText
                        }
                      >
                        V1
                      </Text>
                    </View>

                    <Text
                      style={styles.emptyTitle}
                    >
                      No investors found
                    </Text>

                    <Text
                      style={styles.emptyText}
                    >
                      Create the first investor
                      record to begin building
                      the investor operating
                      layer.
                    </Text>

                    <Pressable
                      onPress={() =>
                        setShowCreateForm(
                          true
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.emptyButton,
                        pressed &&
                          styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={
                          styles.emptyButtonText
                        }
                      >
                        ADD FIRST INVESTOR
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredInvestors.map(
                    (investor) => (
                      <InvestorRow
                        key={investor.id}
                        investor={investor}
                      />
                    )
                  )
                )}
              </View>
            </ScrollView>
          </VaultSurface>

          <View style={styles.foundationGrid}>
            <VaultSurface
              intensity="subtle"
              style={styles.foundationCard}
            >
              <Text
                style={
                  styles.foundationEyebrow
                }
              >
                ONBOARDING
              </Text>

              <Text
                style={styles.foundationTitle}
              >
                Investor lifecycle
              </Text>

              <Text
                style={styles.foundationText}
              >
                INVITED → ONBOARDING → KYC →
                RISK PROFILE → AGREEMENT →
                STRATEGY → CAPITAL → ACTIVE
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={styles.foundationCard}
            >
              <Text
                style={
                  styles.foundationEyebrow
                }
              >
                ACCOUNTING
              </Text>

              <Text
                style={styles.foundationTitle}
              >
                Investor economics
              </Text>

              <Text
                style={styles.foundationText}
              >
                Contributed capital, invested
                capital, current value,
                realized P&L, unrealized P&L,
                fees, available cash and
                payouts remain separate
                concepts.
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={styles.foundationCard}
            >
              <Text
                style={
                  styles.foundationEyebrow
                }
              >
                CONTROL
              </Text>

              <Text
                style={styles.foundationTitle}
              >
                Activation gate
              </Text>

              <Text
                style={styles.foundationText}
              >
                Investor activation remains
                behind KYC, signed agreement
                and completed risk profiling.
                Real-money custody and
                execution remain outside this
                software foundation until the
                appropriate legal structure is
                in place.
              </Text>
            </VaultSurface>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              VAULT1 / INVESTOR COMMAND CENTER
            </Text>

            <Text style={styles.footerVersion}>
              INVESTOR ENGINE 1.0
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingMark: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3A3155",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingMarkText: {
    color: "#B39AFF",
    fontSize: 18,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  loadingText: {
    color: "#55505F",
    fontSize: 9,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.8,
  },

  sidebar: {
    display: "none",
    width: 246,
    backgroundColor: COLORS.glassBg,
    borderRightWidth: 1,
    borderRightColor: COLORS.navyLine,
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
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3A3150",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: "#A989FF",
    fontSize: 18,
    fontFamily: FONT.black,
  },

  brandName: {
    color: "#3F3F3B",
    fontSize: 17,
    fontFamily: FONT.black,
    letterSpacing: 2.5,
  },

  brandSubtitle: {
    color: "#484848",
    fontSize: 7,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.1,
    marginTop: 3,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: COLORS.glassBg,
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
    fontFamily: FONT.black,
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
    backgroundColor: COLORS.glassBg,
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
    fontFamily: FONT.bold,
  },

  navTextActive: {
    color: COLORS.muted,
  },

  navArrow: {
    color: "#9675F5",
    fontSize: 19,
    fontFamily: FONT.regular,
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
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#302B39",
    alignItems: "center",
    justifyContent: "center",
  },

  profileMarkText: {
    color: "#A890DD",
    fontSize: 12,
    fontFamily: FONT.black,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 10,
  },

  profileName: {
    color: "#C7C7C7",
    fontSize: 11,
    fontFamily: FONT.extraBold,
  },

  profileRole: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
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
    marginBottom: 30,
    gap: 30,
  },

  headerCopy: {
    flex: 1,
  },

  eyebrow: {
    color: "#8665E2",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#3F3F3B",
    fontSize: 44,
    fontFamily: FONT.black,
    letterSpacing: -1.4,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    fontFamily: FONT.medium,
    marginTop: 9,
    maxWidth: 720,
    lineHeight: 21,
  },

  createButton: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
  },

  createGradient: {
    minHeight: 44,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    color: COLORS.ink,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  buttonPressed: {
    opacity: 0.72,
  },

  successCard: {
    padding: 14,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  successDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9678E8",
  },

  successText: {
    color: "#9C91AD",
    fontSize: 10,
    fontFamily: FONT.bold,
  },

  errorCard: {
    padding: 14,
    marginBottom: 15,
  },

  errorText: {
    color: "#B77C8A",
    fontSize: 10,
    fontFamily: FONT.bold,
  },

  formCard: {
    padding: 26,
    marginBottom: 22,
  },

  formEyebrow: {
    color: "#775AC1",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.7,
  },

  formTitle: {
    color: COLORS.muted,
    fontSize: 23,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  formDescription: {
    color: "#565656",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
    maxWidth: 760,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 24,
  },

  inputGroup: {
    width: "32.2%",
  },

  inputGroupFull: {
    width: "100%",
  },

  inputLabel: {
    color: "#5B5661",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  input: {
    height: 45,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#242124",
    backgroundColor: COLORS.glassBg,
    color: "#D8D8D8",
    paddingHorizontal: 13,
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },

  notesInput: {
    minHeight: 90,
    height: 90,
    paddingTop: 13,
    textAlignVertical: "top",
  },

  riskSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  riskButton: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#242124",
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
  },

  riskButtonActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#443363",
  },

  riskButtonPressed: {
    opacity: 0.7,
  },

  riskButtonText: {
    color: "#55505B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
  },

  riskButtonTextActive: {
    color: "#A98CF5",
  },

  formFooter: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#1B1B1B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  formFooterText: {
    flex: 1,
    color: "#4B4850",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  saveButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#473366",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: "#A98CF5",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 28,
  },

  metricCard: {
    width: "15.8%",
    minHeight: 137,
  },

  metricContent: {
    flex: 1,
    padding: 17,
    justifyContent: "space-between",
  },

  metricTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  metricLabel: {
    color: "#595959",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  metricDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
  },

  metricValue: {
    color: COLORS.muted,
    fontSize: 24,
    fontFamily: FONT.black,
    letterSpacing: -0.6,
  },

  metricCaption: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.semiBold,
    marginTop: 5,
    lineHeight: 12,
  },

  registryCard: {
    overflow: "hidden",
  },

  registryHeader: {
    padding: 23,
    borderBottomWidth: 1,
    borderBottomColor: "#1B1B1B",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },

  registryTitleBlock: {
    flex: 1,
  },

  registryEyebrow: {
    color: "#6D53B4",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.7,
  },

  registryTitle: {
    color: "#DDDDDD",
    fontSize: 21,
    fontFamily: FONT.black,
    marginTop: 6,
  },

  registryControls: {
    alignItems: "flex-end",
    gap: 10,
  },

  searchInput: {
    width: 240,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#232323",
    backgroundColor: COLORS.glassBg,
    color: COLORS.ink,
    paddingHorizontal: 12,
    fontSize: 10,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 5,
    maxWidth: 600,
  },

  filterButton: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#202020",
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#3C2D56",
  },

  filterButtonPressed: {
    opacity: 0.7,
  },

  filterText: {
    color: "#4C4C4C",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 0.7,
  },

  filterTextActive: {
    color: "#9D82E4",
  },

  table: {
    minWidth: 1240,
  },

  tableHeader: {
    height: 47,
    paddingHorizontal: 18,
    backgroundColor: COLORS.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    flexDirection: "row",
    alignItems: "center",
  },

  tableHeaderText: {
    color: "#414141",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
    width: 145,
  },

  investorRow: {
    minHeight: 84,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
    flexDirection: "row",
    alignItems: "center",
  },

  investorIdentity: {
    width: 145,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#322743",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#A58BE9",
    fontSize: 11,
    fontFamily: FONT.black,
  },

  identityText: {
    flex: 1,
  },

  investorName: {
    color: "#C9C9C9",
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },

  investorCode: {
    color: "#49434F",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 0.6,
    marginTop: 3,
  },

  contactCell: {
    width: 145,
  },

  emailText: {
    color: "#A9A9A9",
    fontSize: 9,
    fontFamily: FONT.bold,
  },

  phoneText: {
    color: COLORS.muted,
    fontSize: 8,
    marginTop: 3,
  },

  statusCell: {
    width: 145,
  },

  statusBadge: {
    alignSelf: "flex-start",
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.navyLine,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  statusBadgeActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#302644",
  },

  statusBadgePending: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#292629",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
  },

  statusDotActive: {
    backgroundColor: "#9879EA",
  },

  statusDotPending: {
    backgroundColor: "#77716C",
  },

  statusText: {
    color: "#575757",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 0.7,
  },

  statusTextActive: {
    color: "#A68BEC",
  },

  statusTextPending: {
    color: "#8B8580",
  },

  capitalCell: {
    width: 145,
  },

  valueCell: {
    width: 145,
  },

  returnCell: {
    width: 145,
  },

  riskCell: {
    width: 145,
  },

  progressCell: {
    width: 145,
  },

  cellValue: {
    color: "#BEBEBE",
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },

  cellCaption: {
    color: COLORS.muted,
    fontSize: 6,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
    marginTop: 3,
  },

  returnValue: {
    color: "#BDBDBD",
    fontSize: 10,
    fontFamily: FONT.black,
  },

  positiveText: {
    color: "#B299F4",
  },

  negativeText: {
    color: "#B77C8A",
  },

  riskValue: {
    color: "#9A9A9A",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 0.4,
  },

  progressValue: {
    color: "#9A84D5",
    fontSize: 9,
    fontFamily: FONT.black,
    marginBottom: 6,
  },

  progressTrack: {
    width: 90,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBg,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#8064C5",
  },

  emptyState: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#30263D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  emptyIconText: {
    color: "#8F73D5",
    fontSize: 12,
    fontFamily: FONT.black,
  },

  emptyTitle: {
    color: "#BDBDBD",
    fontSize: 15,
    fontFamily: FONT.black,
  },

  emptyText: {
    color: "#4E4E4E",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 430,
    marginTop: 7,
  },

  emptyButton: {
    marginTop: 18,
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3A2C51",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyButtonText: {
    color: "#9D82E4",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  foundationGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },

  foundationCard: {
    flex: 1,
    minHeight: 175,
    padding: 20,
  },

  foundationEyebrow: {
    color: "#62516F",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  foundationTitle: {
    color: "#BDBDBD",
    fontSize: 16,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  foundationText: {
    color: "#4F4F4F",
    fontSize: 9,
    lineHeight: 15,
    marginTop: 10,
  },

  footer: {
    marginTop: 30,
    paddingTop: 23,
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLine,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  footerText: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  footerVersion: {
    color: "#444444",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },
});