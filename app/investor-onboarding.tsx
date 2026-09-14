import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useRouter } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  createInvestorOnboarding,
  getInvestorOnboardingRecords,
  completeProfile,
  updateKycStatus,
  completeRiskProfile,
  completeDocuments,
  updateAgreementStatus,
  assignStrategy,
  updateCapitalStatus,
  activateInvestor,
  getOnboardingStatusLabel,
  getKycStatusLabel,
  getRiskLevelLabel,
  getAgreementStatusLabel,
  getCapitalStatusLabel,
  calculateOnboardingSummary,
} from "../services/investors/investorOnboardingService";

import {
  InvestorOnboarding,
  InvestorOnboardingStatus,
  InvestorKycStatus,
  InvestorRiskLevel,
  InvestorAgreementStatus,
  InvestorCapitalStatus,
} from "../types/investorOnboarding";


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
  {
    section: "CONTROL",
    items: [
      "Audit Logs",
      "Notifications",
      "Settings",
    ],
  },
];


function statusTone(
  status: InvestorOnboardingStatus
) {
  switch (status) {
    case "ACTIVE":
      return {
        bg: "#122017",
        border: "#31543B",
        text: "#83C493",
      };

    case "READY":
      return {
        bg: "#18132A",
        border: "#4C3A7A",
        text: "#AE99EF",
      };

    case "ON_HOLD":
    case "REJECTED":
      return {
        bg: "#291515",
        border: "#633030",
        text: "#E48686",
      };

    case "INVITED":
      return {
        bg: "#151515",
        border: "#303030",
        text: "#858585",
      };

    default:
      return {
        bg: "#17132A",
        border: "#3D3262",
        text: "#9D89D9",
      };
  }
}


function Step({
  number,
  label,
  complete,
  active,
}: {
  number: string;
  label: string;
  complete: boolean;
  active: boolean;
}) {
  return (
    <View style={styles.step}>

      <View
        style={[
          styles.stepCircle,
          complete &&
            styles.stepCircleComplete,
          active &&
            styles.stepCircleActive,
        ]}
      >
        <Text
          style={[
            styles.stepNumber,
            complete &&
              styles.stepNumberComplete,
            active &&
              styles.stepNumberActive,
          ]}
        >
          {complete ? "✓" : number}
        </Text>
      </View>

      <Text
        style={[
          styles.stepLabel,
          active && styles.stepLabelActive,
          complete &&
            styles.stepLabelComplete,
        ]}
      >
        {label}
      </Text>

    </View>
  );
}


function ActionButton({
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionButton,
        primary &&
          styles.actionButtonPrimary,
        disabled &&
          styles.actionButtonDisabled,
        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          primary &&
            styles.actionButtonPrimaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


export default function InvestorOnboardingScreen() {
  const router = useRouter();

  const { user, profile } =
    useAuth();

  const [records, setRecords] =
    useState<InvestorOnboarding[]>([]);

  const [selected, setSelected] =
    useState<InvestorOnboarding | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [investorId, setInvestorId] =
    useState("");

  const [investorCode, setInvestorCode] =
    useState("");

  const [investorName, setInvestorName] =
    useState("");

  const [investorEmail, setInvestorEmail] =
    useState("");

  const [committedCapital, setCommittedCapital] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [strategyName, setStrategyName] =
    useState("");

  const [capitalInput, setCapitalInput] =
    useState("");


  const loadRecords = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getInvestorOnboardingRecords(
          user.uid
        );

      setRecords(data);

      setSelected((current) => {
        if (!current) {
          return data[0] || null;
        }

        return (
          data.find(
            (item) =>
              item.id === current.id
          ) || null
        );
      });
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load investor onboarding."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadRecords();
  }, [user?.uid]);


  const summary = useMemo(
    () =>
      calculateOnboardingSummary(
        records
      ),
    [records]
  );


  const filteredRecords =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      if (!term) {
        return records;
      }

      return records.filter(
        (item) =>
          item.investorName
            .toLowerCase()
            .includes(term) ||
          item.investorCode
            .toLowerCase()
            .includes(term) ||
          item.investorEmail
            .toLowerCase()
            .includes(term) ||
          item.status
            .toLowerCase()
            .includes(term)
      );
    }, [records, search]);


  const handleNavigation = (
    item: string
  ) => {
    switch (item) {
      case "Dashboard":
        router.push("/dashboard");
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
        router.push("/strategies");
        break;

      case "Growth Missions":
        router.push("/growth-missions");
        break;

      case "Capital":
        router.push("/capital");
        break;

      case "Cashflow":
      case "Transactions":
        router.push("/transactions");
        break;

      case "Performance":
        router.push("/performance");
        break;

      case "Risk":
        router.push("/risk");
        break;

      case "Reports":
        router.push("/reports");
        break;

      case "Investors":
        router.push("/investors");
        break;

      case "Payouts":
        router.push("/payouts");
        break;

      case "Documents":
        router.push("/documents");
        break;

      case "Audit Logs":
        router.push("/audit-logs");
        break;

      case "Notifications":
        router.push("/notifications");
        break;

      case "Settings":
        router.push("/settings");
        break;

      default:
        break;
    }
  };


  const resetForm = () => {
    setInvestorId("");
    setInvestorCode("");
    setInvestorName("");
    setInvestorEmail("");
    setCommittedCapital("");
    setNotes("");
  };


  const handleCreate = async () => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createInvestorOnboarding({
        userId: user.uid,
        investorId,
        investorCode,
        investorName,
        investorEmail,
        committedCapital:
          Number(committedCapital) || 0,
        notes,
      });

      resetForm();
      setShowCreate(false);

      setSuccess(
        "Investor onboarding created."
      );

      await loadRecords();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to create onboarding."
      );
    } finally {
      setSaving(false);
    }
  };


  const refreshSelected =
    async () => {
      await loadRecords();
    };


  const performAction = async (
    action: () => Promise<void>,
    message: string
  ) => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await action();

      setSuccess(message);

      await loadRecords();
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to update onboarding."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleProfileComplete =
    () => {
      if (!selected) return;

      performAction(
        () =>
          completeProfile(
            selected.id
          ),
        "Investor profile completed."
      );
    };


  const handleKyc = (
    status: InvestorKycStatus
  ) => {
    if (!selected) return;

    performAction(
      () =>
        updateKycStatus(
          selected.id,
          status
        ),
      `KYC status updated to ${getKycStatusLabel(
        status
      )}.`
    );
  };


  const handleRisk = (
    level: InvestorRiskLevel
  ) => {
    if (!selected) return;

    performAction(
      () =>
        completeRiskProfile(
          selected.id,
          level
        ),
      "Risk profile completed."
    );
  };


  const handleDocuments =
    () => {
      if (!selected) return;

      performAction(
        () =>
          completeDocuments(
            selected.id
          ),
        "Investor documents completed."
      );
    };


  const handleAgreement = (
    status: InvestorAgreementStatus
  ) => {
    if (!selected) return;

    performAction(
      () =>
        updateAgreementStatus(
          selected.id,
          status
        ),
      `Agreement status updated to ${getAgreementStatusLabel(
        status
      )}.`
    );
  };


  const handleStrategy = () => {
    if (!selected) return;

    performAction(
      () =>
        assignStrategy(
          selected.id,
          strategyName
        ),
      "Strategy assigned."
    );

    setStrategyName("");
  };


  const handleCapital = (
    status: InvestorCapitalStatus
  ) => {
    if (!selected) return;

    performAction(
      () =>
        updateCapitalStatus(
          selected.id,
          status,
          capitalInput.trim()
            ? Number(capitalInput)
            : undefined
        ),
      `Capital status updated to ${getCapitalStatusLabel(
        status
      )}.`
    );
  };


  const handleActivate =
    () => {
      if (!selected) return;

      performAction(
        () =>
          activateInvestor(
            selected.id
          ),
        "Investor activated."
      );
    };


  const currentStep = selected
    ? selected.status === "INVITED"
      ? 1
      : selected.status ===
          "ACCOUNT_CREATED" ||
        selected.status ===
          "PROFILE_PENDING"
      ? 2
      : selected.status ===
          "KYC_PENDING"
      ? 3
      : selected.status ===
          "RISK_PROFILE_PENDING"
      ? 4
      : selected.status ===
          "DOCUMENTS_PENDING"
      ? 5
      : selected.status ===
          "AGREEMENT_PENDING"
      ? 6
      : selected.status ===
          "STRATEGY_PENDING"
      ? 7
      : selected.status ===
          "CAPITAL_PENDING"
      ? 8
      : 9
    : 1;


  return (
    <View style={styles.page}>

      <View style={styles.sidebar}>

        <View style={styles.brandBlock}>

          <View style={styles.brandMark}>
            <Text
              style={styles.brandMarkText}
            >
              V1
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


        <ScrollView
          style={styles.sidebarScroll}
          showsVerticalScrollIndicator={false}
        >
          {navigation.map((section) => (
            <View
              key={section.section}
              style={styles.navSection}
            >
              <Text
                style={styles.sectionLabel}
              >
                {section.section}
              </Text>

              {section.items.map((item) => {
                const active =
                  item === "Investors";

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
        </ScrollView>


        <View style={styles.sidebarFooter}>

          <Text style={styles.footerLabel}>
            SESSION
          </Text>

          <Text style={styles.footerUser}>
            {profile?.displayName ||
              user?.email ||
              "Vault1 User"}
          </Text>

          <Text style={styles.footerRole}>
            {profile?.role || "VIEWER"}
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
              INVESTOR CONTROL
            </Text>

            <Text style={styles.pageTitle}>
              Investor Onboarding
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Structured investor readiness from
              invitation through activation.
            </Text>
          </View>


          <View style={styles.headerActions}>

            <ActionButton
              label="REFRESH"
              onPress={refreshSelected}
            />

            <ActionButton
              label="NEW INVESTOR"
              primary
              onPress={() =>
                setShowCreate(true)
              }
            />

          </View>

        </View>


        {error ? (
          <VaultSurface
            intensity="medium"
            style={styles.errorCard}
          >
            <Text style={styles.errorTitle}>
              ONBOARDING ERROR
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </VaultSurface>
        ) : null}


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


        <View style={styles.metricsGrid}>

          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              TOTAL
            </Text>

            <Text style={styles.metricValue}>
              {summary.total}
            </Text>

            <Text style={styles.metricHint}>
              Onboarding records
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              IN PROGRESS
            </Text>

            <Text style={styles.metricValue}>
              {summary.inProgress}
            </Text>

            <Text style={styles.metricHint}>
              Active onboarding pipeline
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              READY
            </Text>

            <Text style={styles.metricValue}>
              {summary.ready}
            </Text>

            <Text style={styles.metricHint}>
              Activation eligible
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              ACTIVE
            </Text>

            <Text
              style={[
                styles.metricValue,
                styles.activeMetric,
              ]}
            >
              {summary.active}
            </Text>

            <Text style={styles.metricHint}>
              Activated investors
            </Text>
          </VaultSurface>

        </View>


        <VaultSurface
          intensity="medium"
          style={styles.pipelineCard}
        >

          <View style={styles.pipelineHeader}>

            <View>
              <Text style={styles.cardEyebrow}>
                ONBOARDING PIPELINE
              </Text>

              <Text style={styles.cardTitle}>
                Investor Readiness
              </Text>

              <Text
                style={styles.cardDescription}
              >
                Every investor progresses through
                controlled operational checkpoints.
              </Text>
            </View>

          </View>


          <View style={styles.steps}>

            <Step
              number="01"
              label="INVITE"
              complete={currentStep > 1}
              active={currentStep === 1}
            />

            <View style={styles.stepLine} />

            <Step
              number="02"
              label="PROFILE"
              complete={currentStep > 2}
              active={currentStep === 2}
            />

            <View style={styles.stepLine} />

            <Step
              number="03"
              label="KYC"
              complete={currentStep > 3}
              active={currentStep === 3}
            />

            <View style={styles.stepLine} />

            <Step
              number="04"
              label="RISK"
              complete={currentStep > 4}
              active={currentStep === 4}
            />

            <View style={styles.stepLine} />

            <Step
              number="05"
              label="DOCS"
              complete={currentStep > 5}
              active={currentStep === 5}
            />

            <View style={styles.stepLine} />

            <Step
              number="06"
              label="AGREEMENT"
              complete={currentStep > 6}
              active={currentStep === 6}
            />

            <View style={styles.stepLine} />

            <Step
              number="07"
              label="STRATEGY"
              complete={currentStep > 7}
              active={currentStep === 7}
            />

            <View style={styles.stepLine} />

            <Step
              number="08"
              label="CAPITAL"
              complete={currentStep > 8}
              active={currentStep === 8}
            />

            <View style={styles.stepLine} />

            <Step
              number="09"
              label="ACTIVE"
              complete={currentStep >= 9}
              active={currentStep >= 9}
            />

          </View>

        </VaultSurface>


        <View style={styles.workspace}>

          <VaultSurface
            intensity="medium"
            style={styles.registerCard}
          >

            <View style={styles.registerHeader}>

              <View>
                <Text style={styles.cardEyebrow}>
                  INVESTOR REGISTER
                </Text>

                <Text style={styles.cardTitle}>
                  Onboarding Queue
                </Text>
              </View>

              {loading ? (
                <ActivityIndicator />
              ) : null}

            </View>


            <View style={styles.searchBox}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search investor, code, email or status..."
                placeholderTextColor="#494949"
                style={styles.searchInput}
              />
            </View>


            {loading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator />

                <Text style={styles.emptyText}>
                  Loading onboarding records...
                </Text>
              </View>
            ) : filteredRecords.length ===
              0 ? (
              <View style={styles.emptyState}>

                <View style={styles.emptyIcon}>
                  <Text
                    style={styles.emptyIconText}
                  >
                    I
                  </Text>
                </View>

                <Text style={styles.emptyTitle}>
                  NO ONBOARDING RECORDS
                </Text>

                <Text style={styles.emptyText}>
                  Create an investor onboarding
                  record to begin the pipeline.
                </Text>

              </View>
            ) : (
              <View>
                {filteredRecords.map(
                  (item) => {
                    const tone =
                      statusTone(
                        item.status
                      );

                    const active =
                      selected?.id ===
                      item.id;

                    return (
                      <Pressable
                        key={item.id}
                        onPress={() =>
                          setSelected(item)
                        }
                        style={({ pressed }) => [
                          styles.investorRow,
                          active &&
                            styles.investorRowActive,
                          pressed &&
                            styles.rowPressed,
                        ]}
                      >

                        <View
                          style={
                            styles.investorIdentity
                          }
                        >
                          <View
                            style={
                              styles.investorInitial
                            }
                          >
                            <Text
                              style={
                                styles.investorInitialText
                              }
                            >
                              {item.investorName
                                .charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.investorCopy
                            }
                          >
                            <Text
                              style={
                                styles.investorName
                              }
                            >
                              {item.investorName}
                            </Text>

                            <Text
                              style={
                                styles.investorCode
                              }
                            >
                              {item.investorCode}
                              {"  •  "}
                              {item.investorEmail}
                            </Text>
                          </View>
                        </View>


                        <View
                          style={
                            styles.rowRight
                          }
                        >
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  tone.bg,
                                borderColor:
                                  tone.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color:
                                    tone.text,
                                },
                              ]}
                            >
                              {getOnboardingStatusLabel(
                                item.status
                              )}
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.capitalValue
                            }
                          >
                            ₹
                            {item.committedCapital.toLocaleString(
                              "en-IN"
                            )}
                          </Text>
                        </View>

                      </Pressable>
                    );
                  }
                )}
              </View>
            )}

          </VaultSurface>


          {selected ? (
            <VaultSurface
              intensity="strong"
              style={styles.detailCard}
            >

              <View style={styles.detailHeader}>

                <View>
                  <Text
                    style={styles.cardEyebrow}
                  >
                    INVESTOR WORKFLOW
                  </Text>

                  <Text
                    style={styles.detailTitle}
                  >
                    {selected.investorName}
                  </Text>

                  <Text
                    style={styles.detailSubtitle}
                  >
                    {selected.investorCode}
                    {"  •  "}
                    {selected.investorEmail}
                  </Text>
                </View>


                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        statusTone(
                          selected.status
                        ).bg,
                      borderColor:
                        statusTone(
                          selected.status
                        ).border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          statusTone(
                            selected.status
                          ).text,
                      },
                    ]}
                  >
                    {getOnboardingStatusLabel(
                      selected.status
                    )}
                  </Text>
                </View>

              </View>


              <View style={styles.checkGrid}>

                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    PROFILE
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.profileComplete &&
                        styles.checkComplete,
                    ]}
                  >
                    {selected.profileComplete
                      ? "COMPLETE"
                      : "PENDING"}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    KYC
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.kycStatus ===
                        "VERIFIED" &&
                        styles.checkComplete,
                    ]}
                  >
                    {getKycStatusLabel(
                      selected.kycStatus
                    )}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    RISK
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.riskProfileComplete &&
                        styles.checkComplete,
                    ]}
                  >
                    {getRiskLevelLabel(
                      selected.riskLevel
                    )}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    DOCUMENTS
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.documentsComplete &&
                        styles.checkComplete,
                    ]}
                  >
                    {selected.documentsComplete
                      ? "COMPLETE"
                      : "PENDING"}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    AGREEMENT
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.agreementStatus ===
                        "SIGNED" &&
                        styles.checkComplete,
                    ]}
                  >
                    {getAgreementStatusLabel(
                      selected.agreementStatus
                    )}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    STRATEGY
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.strategyAssigned &&
                        styles.checkComplete,
                    ]}
                  >
                    {selected.strategyAssigned
                      ? selected.strategyName ||
                        "ASSIGNED"
                      : "PENDING"}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    CAPITAL
                  </Text>

                  <Text
                    style={[
                      styles.checkValue,
                      selected.capitalStatus ===
                        "CONFIRMED" &&
                        styles.checkComplete,
                    ]}
                  >
                    {getCapitalStatusLabel(
                      selected.capitalStatus
                    )}
                  </Text>
                </View>


                <View style={styles.checkItem}>
                  <Text style={styles.checkLabel}>
                    COMMITTED
                  </Text>

                  <Text
                    style={styles.checkValue}
                  >
                    ₹
                    {selected.committedCapital.toLocaleString(
                      "en-IN"
                    )}
                  </Text>
                </View>

              </View>


              <View style={styles.workflowSection}>

                <Text
                  style={styles.workflowTitle}
                >
                  WORKFLOW ACTIONS
                </Text>


                {!selected.profileComplete ? (
                  <ActionButton
                    label="COMPLETE PROFILE"
                    primary
                    disabled={saving}
                    onPress={
                      handleProfileComplete
                    }
                  />
                ) : null}


                {selected.kycStatus !==
                  "VERIFIED" && (
                  <View style={styles.actionGroup}>

                    <Text
                      style={styles.actionLabel}
                    >
                      KYC
                    </Text>

                    <View
                      style={styles.actionRow}
                    >
                      <ActionButton
                        label="SUBMITTED"
                        disabled={saving}
                        onPress={() =>
                          handleKyc(
                            "SUBMITTED"
                          )
                        }
                      />

                      <ActionButton
                        label="VERIFY KYC"
                        primary
                        disabled={saving}
                        onPress={() =>
                          handleKyc(
                            "VERIFIED"
                          )
                        }
                      />

                      <ActionButton
                        label="REJECT"
                        disabled={saving}
                        onPress={() =>
                          handleKyc(
                            "REJECTED"
                          )
                        }
                      />
                    </View>

                  </View>
                )}


                {!selected.riskProfileComplete &&
                selected.kycStatus ===
                  "VERIFIED" ? (
                  <View style={styles.actionGroup}>

                    <Text
                      style={styles.actionLabel}
                    >
                      RISK PROFILE
                    </Text>

                    <View
                      style={styles.actionRow}
                    >
                      <ActionButton
                        label="LOW"
                        disabled={saving}
                        onPress={() =>
                          handleRisk("LOW")
                        }
                      />

                      <ActionButton
                        label="MODERATE"
                        disabled={saving}
                        onPress={() =>
                          handleRisk(
                            "MODERATE"
                          )
                        }
                      />

                      <ActionButton
                        label="HIGH"
                        primary
                        disabled={saving}
                        onPress={() =>
                          handleRisk("HIGH")
                        }
                      />

                      <ActionButton
                        label="VERY HIGH"
                        disabled={saving}
                        onPress={() =>
                          handleRisk(
                            "VERY_HIGH"
                          )
                        }
                      />
                    </View>

                  </View>
                ) : null}


                {!selected.documentsComplete &&
                selected.riskProfileComplete ? (
                  <ActionButton
                    label="MARK DOCUMENTS COMPLETE"
                    primary
                    disabled={saving}
                    onPress={
                      handleDocuments
                    }
                  />
                ) : null}


                {selected.documentsComplete &&
                selected.agreementStatus !==
                  "SIGNED" ? (
                  <View style={styles.actionGroup}>

                    <Text
                      style={styles.actionLabel}
                    >
                      AGREEMENT
                    </Text>

                    <View
                      style={styles.actionRow}
                    >
                      <ActionButton
                        label="SENT"
                        disabled={saving}
                        onPress={() =>
                          handleAgreement(
                            "SENT"
                          )
                        }
                      />

                      <ActionButton
                        label="MARK SIGNED"
                        primary
                        disabled={saving}
                        onPress={() =>
                          handleAgreement(
                            "SIGNED"
                          )
                        }
                      />

                      <ActionButton
                        label="REJECT"
                        disabled={saving}
                        onPress={() =>
                          handleAgreement(
                            "REJECTED"
                          )
                        }
                      />
                    </View>

                  </View>
                ) : null}


                {selected.agreementStatus ===
                  "SIGNED" &&
                !selected.strategyAssigned ? (
                  <View style={styles.actionGroup}>

                    <Text
                      style={styles.actionLabel}
                    >
                      STRATEGY
                    </Text>

                    <View
                      style={styles.inputRow}
                    >
                      <TextInput
                        value={strategyName}
                        onChangeText={
                          setStrategyName
                        }
                        placeholder="Assigned strategy name"
                        placeholderTextColor="#494949"
                        style={styles.actionInput}
                      />

                      <ActionButton
                        label="ASSIGN"
                        primary
                        disabled={saving}
                        onPress={
                          handleStrategy
                        }
                      />
                    </View>

                  </View>
                ) : null}


                {selected.strategyAssigned &&
                selected.capitalStatus !==
                  "CONFIRMED" ? (
                  <View style={styles.actionGroup}>

                    <Text
                      style={styles.actionLabel}
                    >
                      CAPITAL
                    </Text>

                    <View
                      style={styles.inputRow}
                    >
                      <TextInput
                        value={capitalInput}
                        onChangeText={
                          setCapitalInput
                        }
                        keyboardType="numeric"
                        placeholder="Confirmed capital"
                        placeholderTextColor="#494949"
                        style={styles.actionInput}
                      />

                      <ActionButton
                        label="RECEIVED"
                        disabled={saving}
                        onPress={() =>
                          handleCapital(
                            "RECEIVED"
                          )
                        }
                      />

                      <ActionButton
                        label="CONFIRM CAPITAL"
                        primary
                        disabled={saving}
                        onPress={() =>
                          handleCapital(
                            "CONFIRMED"
                          )
                        }
                      />
                    </View>

                  </View>
                ) : null}


                {selected.status ===
                  "READY" ? (
                  <View style={styles.activateBlock}>

                    <Text
                      style={styles.activateTitle}
                    >
                      READY FOR ACTIVATION
                    </Text>

                    <Text
                      style={styles.activateText}
                    >
                      All required onboarding
                      checkpoints have been completed.
                    </Text>

                    <ActionButton
                      label="ACTIVATE INVESTOR"
                      primary
                      disabled={saving}
                      onPress={
                        handleActivate
                      }
                    />

                  </View>
                ) : null}

              </View>

            </VaultSurface>
          ) : null}

        </View>


        <VaultSurface
          intensity="subtle"
          style={styles.noteCard}
        >
          <View style={styles.noteAccent} />

          <View>
            <Text style={styles.noteTitle}>
              INVESTOR ACTIVATION CONTROL
            </Text>

            <Text style={styles.noteText}>
              Vault1 treats investor activation as a
              controlled operational state. Profile,
              KYC, risk profile, documents, agreement,
              strategy and capital confirmation must
              be completed before activation is allowed.
              Actual external-money management and
              custody workflows remain subject to the
              appropriate legal and regulatory structure.
            </Text>
          </View>
        </VaultSurface>


        {showCreate ? (
          <View style={styles.modalOverlay}>

            <VaultSurface
              intensity="strong"
              style={styles.modalCard}
            >

              <View style={styles.modalHeader}>

                <View>
                  <Text
                    style={styles.cardEyebrow}
                  >
                    INVESTOR CONTROL
                  </Text>

                  <Text
                    style={styles.modalTitle}
                  >
                    New Investor
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowCreate(false)
                  }
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={styles.closeText}
                  >
                    CLOSE
                  </Text>
                </Pressable>

              </View>


              <Text style={styles.modalDescription}>
                Create the operational onboarding
                record. Account invitation and
                external-money execution can be
                connected later through the approved
                infrastructure.
              </Text>


              <View style={styles.formGrid}>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    INVESTOR ID
                  </Text>

                  <TextInput
                    value={investorId}
                    onChangeText={
                      setInvestorId
                    }
                    placeholder="INV-001"
                    placeholderTextColor="#484848"
                    style={styles.formInput}
                  />
                </View>


                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    INVESTOR CODE
                  </Text>

                  <TextInput
                    value={investorCode}
                    onChangeText={
                      setInvestorCode
                    }
                    placeholder="V1-INV-001"
                    placeholderTextColor="#484848"
                    style={styles.formInput}
                  />
                </View>


                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    FULL NAME
                  </Text>

                  <TextInput
                    value={investorName}
                    onChangeText={
                      setInvestorName
                    }
                    placeholder="Investor name"
                    placeholderTextColor="#484848"
                    style={styles.formInput}
                  />
                </View>


                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    EMAIL
                  </Text>

                  <TextInput
                    value={investorEmail}
                    onChangeText={
                      setInvestorEmail
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="investor@example.com"
                    placeholderTextColor="#484848"
                    style={styles.formInput}
                  />
                </View>


                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    COMMITTED CAPITAL
                  </Text>

                  <TextInput
                    value={committedCapital}
                    onChangeText={
                      setCommittedCapital
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#484848"
                    style={styles.formInput}
                  />
                </View>


                <View
                  style={[
                    styles.formField,
                    styles.formFieldWide,
                  ]}
                >
                  <Text style={styles.formLabel}>
                    NOTES
                  </Text>

                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    placeholder="Internal onboarding notes..."
                    placeholderTextColor="#484848"
                    style={[
                      styles.formInput,
                      styles.notesInput,
                    ]}
                  />
                </View>

              </View>


              <View style={styles.modalActions}>

                <ActionButton
                  label="CANCEL"
                  disabled={saving}
                  onPress={() =>
                    setShowCreate(false)
                  }
                />

                <ActionButton
                  label={
                    saving
                      ? "CREATING..."
                      : "CREATE ONBOARDING"
                  }
                  primary
                  disabled={saving}
                  onPress={handleCreate}
                />

              </View>

            </VaultSurface>

          </View>
        ) : null}

      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({

  page: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },

  sidebar: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#1B1B1B",
    paddingTop: 28,
    paddingBottom: 22,
  },

  brandBlock: {
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3B2B68",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: "#B49AFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  brand: {
    color: "#3F3F3B",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 3,
  },

  brandSub: {
    color: "#505050",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 3,
  },

  sidebarScroll: {
    flex: 1,
  },

  navSection: {
    marginBottom: 25,
  },

  sectionLabel: {
    color: "#3E3E3E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    paddingHorizontal: 22,
    marginBottom: 8,
  },

  navItem: {
    minHeight: 42,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderLeftWidth: 2,
    borderLeftColor: "transparent",
  },

  navItemActive: {
    backgroundColor: "#FFFFFF",
    borderLeftColor: "#8B6FE8",
  },

  navItemPressed: {
    opacity: 0.72,
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  navDotActive: {
    backgroundColor: "#9C82F4",
  },

  navText: {
    color: "#696969",
    fontSize: 13,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#5F5F5B",
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#171717",
    paddingHorizontal: 22,
    paddingTop: 18,
  },

  footerLabel: {
    color: "#393939",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  footerUser: {
    color: "#A0A0A0",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 7,
  },

  footerRole: {
    color: "#66549A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 3,
  },


  mainScroll: {
    flex: 1,
  },

  mainContent: {
    paddingHorizontal: 42,
    paddingTop: 38,
    paddingBottom: 80,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 28,
  },

  eyebrow: {
    color: "#7661B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 9,
  },

  pageTitle: {
    color: "#3F3F3B",
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  pageSubtitle: {
    color: "#626262",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 9,
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  errorCard: {
    padding: 20,
    marginBottom: 18,
    borderColor: "#502A2A",
  },

  errorTitle: {
    color: "#B24A57",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  errorText: {
    color: "#7B5D5D",
    fontSize: 12,
    marginTop: 7,
  },

  successCard: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    borderColor: "#332A4E",
  },

  successDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A18BEA",
  },

  successText: {
    color: "#8877B7",
    fontSize: 11,
    fontWeight: "700",
  },


  metricsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },

  metricCard: {
    flex: 1,
    minHeight: 130,
    padding: 20,
  },

  metricLabel: {
    color: "#5C5C5C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricValue: {
    color: "#3F3F3B",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 15,
  },

  activeMetric: {
    color: "#A58EEB",
  },

  metricHint: {
    color: "#4C4C4C",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },


  pipelineCard: {
    padding: 25,
    marginBottom: 18,
  },

  pipelineHeader: {
    marginBottom: 28,
  },

  cardEyebrow: {
    color: "#735DB2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  cardTitle: {
    color: "#4A4A46",
    fontSize: 23,
    fontWeight: "900",
    marginTop: 7,
  },

  cardDescription: {
    color: "#5D5D5D",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 850,
  },

  steps: {
    flexDirection: "row",
    alignItems: "center",
  },

  step: {
    alignItems: "center",
    minWidth: 65,
  },

  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#5A458C",
  },

  stepCircleComplete: {
    backgroundColor: "#FFFFFF",
    borderColor: "#35543D",
  },

  stepNumber: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "900",
  },

  stepNumberActive: {
    color: "#AD97EF",
  },

  stepNumberComplete: {
    color: "#83C493",
  },

  stepLabel: {
    color: "#444444",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 8,
    textAlign: "center",
  },

  stepLabelActive: {
    color: "#9B85D5",
  },

  stepLabelComplete: {
    color: "#679874",
  },

  stepLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 4,
    marginBottom: 23,
  },


  workspace: {
    flexDirection: "row",
    gap: 18,
    alignItems: "flex-start",
  },

  registerCard: {
    flex: 1,
    overflow: "hidden",
  },

  registerHeader: {
    padding: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  searchBox: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1B1B1B",
  },

  searchInput: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#272727",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: "#D9D9D9",
    fontSize: 11,
    fontWeight: "600",
  },

  investorRow: {
    minHeight: 88,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#181818",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 15,
  },

  investorRowActive: {
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 2,
    borderLeftColor: "#765FB8",
  },

  rowPressed: {
    opacity: 0.72,
  },

  investorIdentity: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },

  investorInitial: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#392D5E",
    alignItems: "center",
    justifyContent: "center",
  },

  investorInitialText: {
    color: "#A38EE5",
    fontSize: 13,
    fontWeight: "900",
  },

  investorCopy: {
    flex: 1,
  },

  investorName: {
    color: "#D7D7D7",
    fontSize: 13,
    fontWeight: "800",
  },

  investorCode: {
    color: "#505050",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 5,
  },

  rowRight: {
    alignItems: "flex-end",
    gap: 7,
  },

  statusBadge: {
    paddingHorizontal: 9,
    minHeight: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  statusText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  capitalValue: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "700",
  },


  detailCard: {
    flex: 1.2,
    padding: 25,
    minWidth: 0,
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },

  detailTitle: {
    color: "#4A4A46",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 7,
  },

  detailSubtitle: {
    color: "#555555",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },

  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 27,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#202020",
  },

  checkItem: {
    width: "23%",
    minHeight: 76,
    padding: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#242424",
  },

  checkLabel: {
    color: "#464646",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  checkValue: {
    color: "#777777",
    fontSize: 9,
    fontWeight: "900",
    marginTop: 11,
  },

  checkComplete: {
    color: "#80B98E",
  },

  workflowSection: {
    marginTop: 25,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: "#202020",
    gap: 12,
  },

  workflowTitle: {
    color: "#735DB2",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 3,
  },

  actionGroup: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#202020",
    gap: 11,
  },

  actionLabel: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  actionButton: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  actionButtonPrimary: {
    backgroundColor: "#FFFFFF",
    borderColor: "#4B3977",
  },

  actionButtonDisabled: {
    opacity: 0.4,
  },

  actionButtonText: {
    color: "#777777",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  actionButtonPrimaryText: {
    color: "#AA95EC",
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  inputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  actionInput: {
    flex: 1,
    minWidth: 180,
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#FFFFFF",
    color: "#D9D9D9",
    fontSize: 11,
    fontWeight: "600",
  },

  activateBlock: {
    padding: 18,
    borderWidth: 1,
    borderColor: "#3D3262",
    backgroundColor: "#FFFFFF",
    gap: 9,
  },

  activateTitle: {
    color: "#A993E8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  activateText: {
    color: "#665F73",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 17,
  },


  emptyState: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    gap: 10,
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#282828",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconText: {
    color: "#806BC3",
    fontSize: 17,
    fontWeight: "900",
  },

  emptyTitle: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  emptyText: {
    color: "#4D4D4D",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },


  noteCard: {
    minHeight: 100,
    padding: 20,
    flexDirection: "row",
    gap: 16,
    marginTop: 18,
  },

  noteAccent: {
    width: 2,
    backgroundColor: "#765FB8",
    borderRadius: 2,
  },

  noteTitle: {
    color: "#8B78B9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  noteText: {
    color: "#55505E",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 1050,
  },


  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  modalCard: {
    width: "100%",
    maxWidth: 850,
    padding: 28,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  modalTitle: {
    color: "#4A4A46",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 7,
  },

  closeButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    color: "#666666",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  modalDescription: {
    color: "#606060",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 12,
    maxWidth: 720,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 24,
  },

  formField: {
    width: "48%",
  },

  formFieldWide: {
    width: "100%",
  },

  formLabel: {
    color: "#4C4C4C",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  formInput: {
    minHeight: 43,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#FFFFFF",
    color: "#D9D9D9",
    fontSize: 12,
    fontWeight: "600",
  },

  notesInput: {
    minHeight: 85,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#202020",
  },
});