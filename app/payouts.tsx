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

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import { FONT, COLORS } from "./theme/theme";

import {
  approvePayout,
  calculatePayoutSummary,
  getPayoutStatusLabel,
  getPayoutRequests,
  markPayoutProcessed,
  rejectPayout,
  startPayoutProcessing,
} from "../services/payouts/payoutService";

import {
  PayoutRequest,
  PayoutRequestStatus,
} from "../types/payout";

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

const filters: Array<
  "ALL" | PayoutRequestStatus
> = [
  "ALL",
  "PENDING",
  "APPROVED",
  "PROCESSING",
  "PROCESSED",
  "REJECTED",
];

function formatINR(
  value: number
): string {
  return `₹${Math.abs(
    value
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function getRoute(
  item: string
): string | undefined {
  const routes: Record<
    string,
    string
  > = {
    Dashboard: "/dashboard",
    Portfolio: "/portfolio",
    Trading: "/trading",
    Assets: "/assets",
    Strategies: "/strategies",
    "Growth Missions":
      "/growth-missions",
    "Trade Journal":
      "/trade-journal",
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
      <View
        style={styles.metricContent}
      >
        <View
          style={styles.metricTop}
        >
          <Text
            style={styles.metricLabel}
          >
            {label}
          </Text>

          <View
            style={styles.metricDot}
          />
        </View>

        <View>
          <Text
            style={styles.metricValue}
          >
            {value}
          </Text>

          <Text
            style={styles.metricCaption}
          >
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
  status: PayoutRequestStatus;
}) {
  const positive =
    status === "APPROVED" ||
    status === "PROCESSED";

  const active =
    status === "PROCESSING";

  const negative =
    status === "REJECTED" ||
    status === "CANCELLED";

  return (
    <View
      style={[
        styles.statusBadge,
        positive &&
          styles.statusPositive,
        active &&
          styles.statusActive,
        negative &&
          styles.statusNegative,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          positive &&
            styles.statusDotPositive,
          active &&
            styles.statusDotActive,
          negative &&
            styles.statusDotNegative,
        ]}
      />

      <Text
        style={[
          styles.statusText,
          positive &&
            styles.statusTextPositive,
          active &&
            styles.statusTextActive,
          negative &&
            styles.statusTextNegative,
        ]}
      >
        {getPayoutStatusLabel(
          status
        )}
      </Text>
    </View>
  );
}

export default function PayoutsScreen() {
  const { profile } = useAuth();

  const [payouts, setPayouts] =
    useState<PayoutRequest[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<string | null>(
      null
    );

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "ALL" | PayoutRequestStatus
    >("ALL");

  const [activeNav, setActiveNav] =
    useState("Payouts");

  const [selectedPayout, setSelectedPayout] =
    useState<PayoutRequest | null>(
      null
    );

  const [adminNotes, setAdminNotes] =
    useState("");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [transactionReference, setTransactionReference] =
    useState("");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadPayouts(profile.uid);
  }, [profile?.uid]);

  async function loadPayouts(
    userId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPayoutRequests(
          userId
        );

      setPayouts(data);
    } catch (err: any) {
      console.error(
        "Payout loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load payout requests."
      );
    } finally {
      setLoading(false);
    }
  }

  function openPayout(
    payout: PayoutRequest
  ) {
    setSelectedPayout(payout);

    setAdminNotes(
      payout.adminNotes || ""
    );

    setRejectionReason(
      payout.rejectionReason || ""
    );

    setTransactionReference(
      payout.transactionReference ||
        ""
    );

    setError("");
    setSuccess("");
  }

  function closePayout() {
    setSelectedPayout(null);
    setAdminNotes("");
    setRejectionReason("");
    setTransactionReference("");
  }

  async function handleApprove() {
    if (!selectedPayout) {
      return;
    }

    try {
      setProcessingId(
        selectedPayout.id
      );
      setError("");

      await approvePayout(
        selectedPayout.id,
        adminNotes
      );

      setSuccess(
        "Payout request approved."
      );

      closePayout();

      if (profile?.uid) {
        await loadPayouts(
          profile.uid
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to approve payout."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject() {
    if (!selectedPayout) {
      return;
    }

    if (!rejectionReason.trim()) {
      setError(
        "Please enter a rejection reason."
      );
      return;
    }

    try {
      setProcessingId(
        selectedPayout.id
      );
      setError("");

      await rejectPayout(
        selectedPayout.id,
        rejectionReason,
        adminNotes
      );

      setSuccess(
        "Payout request rejected."
      );

      closePayout();

      if (profile?.uid) {
        await loadPayouts(
          profile.uid
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to reject payout."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleProcessing() {
    if (!selectedPayout) {
      return;
    }

    try {
      setProcessingId(
        selectedPayout.id
      );
      setError("");

      await startPayoutProcessing(
        selectedPayout.id,
        adminNotes
      );

      setSuccess(
        "Payout moved to processing."
      );

      closePayout();

      if (profile?.uid) {
        await loadPayouts(
          profile.uid
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to start payout processing."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleProcessed() {
    if (!selectedPayout) {
      return;
    }

    if (
      !transactionReference.trim()
    ) {
      setError(
        "Transaction reference is required before marking a payout processed."
      );
      return;
    }

    try {
      setProcessingId(
        selectedPayout.id
      );
      setError("");

      await markPayoutProcessed({
        payoutId:
          selectedPayout.id,
        transactionReference,
        adminNotes,
      });

      setSuccess(
        "Payout marked as processed."
      );

      closePayout();

      if (profile?.uid) {
        await loadPayouts(
          profile.uid
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to mark payout processed."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function handleNavigation(
    item: string
  ) {
    setActiveNav(item);

    const route =
      getRoute(item);

    if (route) {
      router.push(route as any);
    }
  }

  const summary =
    useMemo(
      () =>
        calculatePayoutSummary(
          payouts
        ),
      [payouts]
    );

  const filteredPayouts =
    useMemo(() => {
      const queryText =
        search
          .trim()
          .toLowerCase();

      return payouts.filter(
        (payout) => {
          const matchesSearch =
            !queryText ||
            payout.investorName
              .toLowerCase()
              .includes(queryText) ||
            payout.investorCode
              .toLowerCase()
              .includes(queryText) ||
            payout.investorEmail
              .toLowerCase()
              .includes(queryText) ||
            payout.id
              .toLowerCase()
              .includes(queryText);

          const matchesFilter =
            filter === "ALL" ||
            payout.status ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      payouts,
      search,
      filter,
    ]);

  if (loading) {
    return (
      <View
        style={
          styles.loadingScreen
        }
      >
        <View
          style={styles.loadingMark}
        >
          <Text
            style={
              styles.loadingMarkText
            }
          >
            V1
          </Text>
        </View>

        <ActivityIndicator
          color="#9A7BFF"
          size="small"
        />

        <Text
          style={styles.loadingText}
        >
          LOADING PAYOUT COMMAND CENTER
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.sidebar} pointerEvents="none">
        <View style={styles.brand}>
          <View
            style={styles.brandMark}
          >
            <Text
              style={
                styles.brandMarkText
              }
            >
              1
            </Text>
          </View>

          <View>
            <Text
              style={styles.brandName}
            >
              VAULT1
            </Text>

            <Text
              style={
                styles.brandSubtitle
              }
            >
              WEALTH OPERATING SYSTEM
            </Text>
          </View>
        </View>

        <View
          style={styles.sidebarDivider}
        />

        <ScrollView
          style={styles.navScroll}
          showsVerticalScrollIndicator={
            false
          }
        >
          {navigation.map(
            (group) => (
              <View
                key={
                  group.section
                }
                style={
                  styles.navGroup
                }
              >
                <Text
                  style={
                    styles.navSection
                  }
                >
                  {group.section}
                </Text>

                {group.items.map(
                  (item) => {
                    const active =
                      activeNav ===
                      item;

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          handleNavigation(
                            item
                          )
                        }
                        style={({
                          pressed,
                        }) => [
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
                            style={
                              styles.navArrow
                            }
                          >
                            ›
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  }
                )}
              </View>
            )
          )}
        </ScrollView>

        <View
          style={
            styles.sidebarFooter
          }
        >
          <View
            style={styles.profileMark}
          >
            <Text
              style={
                styles.profileMarkText
              }
            >
              {(
                profile?.displayName ||
                "V"
              )
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={styles.profileInfo}
          >
            <Text
              style={
                styles.profileName
              }
              numberOfLines={1}
            >
              {profile?.displayName ||
                "Vault1 User"}
            </Text>

            <Text
              style={
                styles.profileRole
              }
            >
              {profile?.role ||
                "VIEWER"}
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
          showsVerticalScrollIndicator={
            false
          }
        >
          <View style={styles.header}>
            <View
              style={
                styles.headerCopy
              }
            >
              <Text
                style={styles.eyebrow}
              >
                INVESTOR OPERATIONS
              </Text>

              <Text
                style={styles.title}
              >
                Payouts
              </Text>

              <Text
                style={styles.subtitle}
              >
                Review, control and
                maintain the complete
                investor withdrawal
                request lifecycle.
              </Text>
            </View>

            <View
              style={
                styles.headerBadge
              }
            >
              <View
                style={
                  styles.headerBadgeDot
                }
              />

              <Text
                style={
                  styles.headerBadgeText
                }
              >
                CONTROLLED WORKFLOW
              </Text>
            </View>
          </View>

          {success ? (
            <VaultSurface
              intensity="subtle"
              style={
                styles.successCard
              }
            >
              <View
                style={
                  styles.successDot
                }
              />

              <Text
                style={
                  styles.successText
                }
              >
                {success}
              </Text>
            </VaultSurface>
          ) : null}

          {error ? (
            <VaultSurface
              intensity="subtle"
              style={
                styles.errorCard
              }
            >
              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </VaultSurface>
          ) : null}

          <View
            style={styles.metricGrid}
          >
            <MetricCard
              label="TOTAL REQUESTS"
              value={String(
                summary.totalRequests
              )}
              caption="All payout requests"
            />

            <MetricCard
              label="PENDING REVIEW"
              value={String(
                summary.pendingCount
              )}
              caption={formatINR(
                summary.pendingAmount
              )}
            />

            <MetricCard
              label="APPROVED"
              value={String(
                summary.approvedCount
              )}
              caption={formatINR(
                summary.approvedAmount
              )}
            />

            <MetricCard
              label="PROCESSING"
              value={String(
                summary.processingCount
              )}
              caption={formatINR(
                summary.processingAmount
              )}
            />

            <MetricCard
              label="PROCESSED"
              value={String(
                summary.processedCount
              )}
              caption={formatINR(
                summary.processedAmount
              )}
            />

            <MetricCard
              label="TOTAL REQUESTED"
              value={formatINR(
                summary.totalRequestedAmount
              )}
              caption="Across all requests"
            />
          </View>

          <VaultSurface
            intensity="medium"
            style={
              styles.registryCard
            }
          >
            <View
              style={
                styles.registryHeader
              }
            >
              <View
                style={
                  styles.registryTitleBlock
                }
              >
                <Text
                  style={
                    styles.registryEyebrow
                  }
                >
                  PAYOUT REGISTER
                </Text>

                <Text
                  style={
                    styles.registryTitle
                  }
                >
                  Withdrawal requests
                </Text>

                <Text
                  style={
                    styles.registryDescription
                  }
                >
                  Every request remains
                  visible from
                  submission through
                  final processing.
                </Text>
              </View>

              <View
                style={
                  styles.registryControls
                }
              >
                <TextInput
                  value={search}
                  onChangeText={
                    setSearch
                  }
                  placeholder="Search investor or request..."
                  placeholderTextColor={COLORS.muted}
                  style={
                    styles.searchInput
                  }
                />

                <View
                  style={
                    styles.filterRow
                  }
                >
                  {filters.map(
                    (item) => {
                      const active =
                        filter ===
                        item;

                      return (
                        <Pressable
                          key={item}
                          onPress={() =>
                            setFilter(
                              item
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.filterButton,
                            active &&
                              styles.filterButtonActive,
                            pressed &&
                              styles.filterButtonPressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.filterText,
                              active &&
                                styles.filterTextActive,
                            ]}
                          >
                            {item ===
                            "PENDING"
                              ? "PENDING"
                              : item}
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
              <View
                style={styles.table}
              >
                <View
                  style={
                    styles.tableHeader
                  }
                >
                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    INVESTOR
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    REQUEST
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    AVAILABLE
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    PORTFOLIO
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    STATUS
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    ACTION
                  </Text>
                </View>

                {filteredPayouts.length ===
                0 ? (
                  <View
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
                        $
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No payout requests
                    </Text>

                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      Payout requests
                      will appear here
                      once an investor
                      submits a withdrawal
                      request.
                    </Text>
                  </View>
                ) : (
                  filteredPayouts.map(
                    (payout) => (
                      <View
                        key={
                          payout.id
                        }
                        style={
                          styles.payoutRow
                        }
                      >
                        <View
                          style={
                            styles.investorCell
                          }
                        >
                          <View
                            style={
                              styles.avatar
                            }
                          >
                            <Text
                              style={
                                styles.avatarText
                              }
                            >
                              {payout.investorName
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.identity
                            }
                          >
                            <Text
                              style={
                                styles.investorName
                              }
                            >
                              {
                                payout.investorName
                              }
                            </Text>

                            <Text
                              style={
                                styles.investorCode
                              }
                            >
                              {
                                payout.investorCode
                              }
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.amountCell
                          }
                        >
                          <Text
                            style={
                              styles.amountValue
                            }
                          >
                            {formatINR(
                              payout.requestedAmount
                            )}
                          </Text>

                          <Text
                            style={
                              styles.cellCaption
                            }
                          >
                            REQUESTED
                          </Text>
                        </View>

                        <View
                          style={
                            styles.amountCell
                          }
                        >
                          <Text
                            style={
                              styles.amountValue
                            }
                          >
                            {formatINR(
                              payout.availableValue
                            )}
                          </Text>

                          <Text
                            style={
                              styles.cellCaption
                            }
                          >
                            AVAILABLE
                          </Text>
                        </View>

                        <View
                          style={
                            styles.amountCell
                          }
                        >
                          <Text
                            style={
                              styles.amountValue
                            }
                          >
                            {formatINR(
                              payout.portfolioValue
                            )}
                          </Text>

                          <Text
                            style={
                              styles.cellCaption
                            }
                          >
                            PORTFOLIO VALUE
                          </Text>
                        </View>

                        <View
                          style={
                            styles.statusCell
                          }
                        >
                          <StatusBadge
                            status={
                              payout.status
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.actionCell
                          }
                        >
                          <Pressable
                            onPress={() =>
                              openPayout(
                                payout
                              )
                            }
                            style={({
                              pressed,
                            }) => [
                              styles.reviewButton,
                              pressed &&
                                styles.buttonPressed,
                            ]}
                          >
                            <Text
                              style={
                                styles.reviewButtonText
                              }
                            >
                              REVIEW
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    )
                  )
                )}
              </View>
            </ScrollView>
          </VaultSurface>

          <View
            style={
              styles.controlGrid
            }
          >
            <VaultSurface
              intensity="subtle"
              style={
                styles.controlCard
              }
            >
              <Text
                style={
                  styles.controlEyebrow
                }
              >
                LIFECYCLE
              </Text>

              <Text
                style={
                  styles.controlTitle
                }
              >
                Payout workflow
              </Text>

              <Text
                style={
                  styles.controlText
                }
              >
                REQUEST → REVIEW →
                APPROVE / REJECT →
                PROCESSING →
                PROCESSED
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={
                styles.controlCard
              }
            >
              <Text
                style={
                  styles.controlEyebrow
                }
              >
                CONTROL
              </Text>

              <Text
                style={
                  styles.controlTitle
                }
              >
                Transaction traceability
              </Text>

              <Text
                style={
                  styles.controlText
                }
              >
                Every processed payout
                requires an explicit
                transaction reference
                so the operational
                record can be traced.
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={
                styles.controlCard
              }
            >
              <Text
                style={
                  styles.controlEyebrow
                }
              >
                COMPLIANCE GATE
              </Text>

              <Text
                style={
                  styles.controlTitle
                }
              >
                External movement disabled
              </Text>

              <Text
                style={
                  styles.controlText
                }
              >
                This layer records and
                controls payout
                workflows. Actual
                external investor-fund
                movement requires the
                appropriate legal,
                custody and payment
                structure.
              </Text>
            </VaultSurface>
          </View>

          <View
            style={styles.footer}
          >
            <Text
              style={styles.footerText}
            >
              VAULT1 / PAYOUT COMMAND CENTER
            </Text>

            <Text
              style={
                styles.footerVersion
              }
            >
              PAYOUT ENGINE 1.0
            </Text>
          </View>
        </ScrollView>
      </View>

      {selectedPayout ? (
        <View
          style={
            styles.modalOverlay
          }
        >
          <Pressable
            style={
              styles.modalBackdrop
            }
            onPress={
              closePayout
            }
          />

          <VaultSurface
            intensity="strong"
            style={
              styles.modalCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalEyebrow
                  }
                >
                  PAYOUT REVIEW
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedPayout.investorName
                  }
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {
                    selectedPayout.investorCode
                  }
                </Text>
              </View>

              <Pressable
                onPress={
                  closePayout
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

            <View
              style={
                styles.reviewMetrics
              }
            >
              <View
                style={
                  styles.reviewMetric
                }
              >
                <Text
                  style={
                    styles.reviewLabel
                  }
                >
                  REQUESTED
                </Text>

                <Text
                  style={
                    styles.reviewValue
                  }
                >
                  {formatINR(
                    selectedPayout.requestedAmount
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.reviewMetric
                }
              >
                <Text
                  style={
                    styles.reviewLabel
                  }
                >
                  AVAILABLE
                </Text>

                <Text
                  style={
                    styles.reviewValue
                  }
                >
                  {formatINR(
                    selectedPayout.availableValue
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.reviewMetric
                }
              >
                <Text
                  style={
                    styles.reviewLabel
                  }
                >
                  PORTFOLIO
                </Text>

                <Text
                  style={
                    styles.reviewValue
                  }
                >
                  {formatINR(
                    selectedPayout.portfolioValue
                  )}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.currentStatus
              }
            >
              <Text
                style={
                  styles.currentStatusLabel
                }
              >
                CURRENT STATUS
              </Text>

              <StatusBadge
                status={
                  selectedPayout.status
                }
              />
            </View>

            {selectedPayout.reason ? (
              <View
                style={
                  styles.reasonBox
                }
              >
                <Text
                  style={
                    styles.reasonLabel
                  }
                >
                  INVESTOR REASON
                </Text>

                <Text
                  style={
                    styles.reasonText
                  }
                >
                  {
                    selectedPayout.reason
                  }
                </Text>
              </View>
            ) : null}

            <View
              style={
                styles.modalInputGroup
              }
            >
              <Text
                style={
                  styles.modalInputLabel
                }
              >
                ADMIN NOTES
              </Text>

              <TextInput
                value={adminNotes}
                onChangeText={
                  setAdminNotes
                }
                placeholder="Internal review notes"
                placeholderTextColor={COLORS.muted}
                multiline
                style={
                  styles.modalInput
                }
              />
            </View>

            {selectedPayout.status ===
              "PENDING" ? (
              <View
                style={
                  styles.modalInputGroup
                }
              >
                <Text
                  style={
                    styles.modalInputLabel
                  }
                >
                  REJECTION REASON
                </Text>

                <TextInput
                  value={
                    rejectionReason
                  }
                  onChangeText={
                    setRejectionReason
                  }
                  placeholder="Required only when rejecting"
                  placeholderTextColor={COLORS.muted}
                  multiline
                  style={
                    styles.modalInput
                  }
                />
              </View>
            ) : null}

            {selectedPayout.status ===
                "APPROVED" ||
            selectedPayout.status ===
              "PROCESSING" ? (
              <View
                style={
                  styles.modalInputGroup
                }
              >
                <Text
                  style={
                    styles.modalInputLabel
                  }
                >
                  TRANSACTION REFERENCE
                </Text>

                <TextInput
                  value={
                    transactionReference
                  }
                  onChangeText={
                    setTransactionReference
                  }
                  placeholder="Bank / transaction reference"
                  placeholderTextColor={COLORS.muted}
                  style={
                    styles.modalInput
                  }
                />
              </View>
            ) : null}

            <View
              style={
                styles.modalActions
              }
            >
              {selectedPayout.status ===
                "PENDING" ? (
                <>
                  <Pressable
                    disabled={
                      processingId ===
                      selectedPayout.id
                    }
                    onPress={
                      handleReject
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.rejectButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.rejectButtonText
                      }
                    >
                      REJECT
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={
                      processingId ===
                      selectedPayout.id
                    }
                    onPress={
                      handleApprove
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.approveButton,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <LinearGradient
                      colors={[
                        "#6F4CB8",
                        "#9979EE",
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
                        styles.approveGradient
                      }
                    >
                      <Text
                        style={
                          styles.approveButtonText
                        }
                      >
                        {processingId ===
                        selectedPayout.id
                          ? "WORKING..."
                          : "APPROVE"}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </>
              ) : null}

              {selectedPayout.status ===
                "APPROVED" ? (
                <Pressable
                  disabled={
                    processingId ===
                    selectedPayout.id
                  }
                  onPress={
                    handleProcessing
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.approveButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.approveButtonText
                    }
                  >
                    {processingId ===
                    selectedPayout.id
                      ? "WORKING..."
                      : "START PROCESSING"}
                  </Text>
                </Pressable>
              ) : null}

              {selectedPayout.status ===
                "PROCESSING" ? (
                <Pressable
                  disabled={
                    processingId ===
                    selectedPayout.id
                  }
                  onPress={
                    handleProcessed
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.approveButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.approveButtonText
                    }
                  >
                    {processingId ===
                    selectedPayout.id
                      ? "WORKING..."
                      : "MARK PROCESSED"}
                  </Text>
                </Pressable>
              ) : null}

              {selectedPayout.status ===
              "PROCESSED" ? (
                <View
                  style={
                    styles.completedBox
                  }
                >
                  <Text
                    style={
                      styles.completedText
                    }
                  >
                    PAYOUT COMPLETED
                  </Text>

                  {selectedPayout.transactionReference ? (
                    <Text
                      style={
                        styles.completedReference
                      }
                    >
                      REF:{" "}
                      {
                        selectedPayout.transactionReference
                      }
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </View>
          </VaultSurface>
        </View>
      ) : null}
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

  headerBadge: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#302641",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 5,
  },

  headerBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#9879EA",
  },

  headerBadgeText: {
    color: "#77678F",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
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

  registryDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  registryControls: {
    alignItems: "flex-end",
    gap: 10,
  },

  searchInput: {
    width: 260,
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
    minWidth: 1120,
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

  headerCell: {
    width: 185,
    color: "#414141",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  payoutRow: {
    minHeight: 84,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
    flexDirection: "row",
    alignItems: "center",
  },

  investorCell: {
    width: 185,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  identity: {
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

  amountCell: {
    width: 185,
  },

  amountValue: {
    color: "#BEBEBE",
    fontSize: 11,
    fontFamily: FONT.extraBold,
  },

  cellCaption: {
    color: COLORS.muted,
    fontSize: 6,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
    marginTop: 3,
  },

  statusCell: {
    width: 185,
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

  statusPositive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#302644",
  },

  statusActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#493660",
  },

  statusNegative: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#39242A",
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
  },

  statusDotPositive: {
    backgroundColor: "#9879EA",
  },

  statusDotActive: {
    backgroundColor: "#B098F4",
  },

  statusDotNegative: {
    backgroundColor: "#A66A79",
  },

  statusText: {
    color: "#575757",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 0.7,
  },

  statusTextPositive: {
    color: "#A68BEC",
  },

  statusTextActive: {
    color: "#B09AE7",
  },

  statusTextNegative: {
    color: "#B77C8A",
  },

  actionCell: {
    width: 185,
  },

  reviewButton: {
    alignSelf: "flex-start",
    minHeight: 31,
    paddingHorizontal: 13,
    borderRadius: 7,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#342746",
    alignItems: "center",
    justifyContent: "center",
  },

  reviewButtonText: {
    color: "#9B80DF",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  buttonPressed: {
    opacity: 0.7,
  },

  emptyState: {
    minHeight: 320,
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
    fontSize: 18,
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

  controlGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },

  controlCard: {
    flex: 1,
    minHeight: 165,
    padding: 20,
  },

  controlEyebrow: {
    color: "#62516F",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  controlTitle: {
    color: "#BDBDBD",
    fontSize: 16,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  controlText: {
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

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalCard: {
    width: 620,
    maxWidth: "92%",
    maxHeight: "88%",
    padding: 26,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  modalEyebrow: {
    color: "#7658BD",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.7,
  },

  modalTitle: {
    color: COLORS.muted,
    fontSize: 25,
    fontFamily: FONT.black,
    marginTop: 6,
  },

  modalSubtitle: {
    color: "#55505B",
    fontSize: 9,
    fontFamily: FONT.extraBold,
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#282328",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#777777",
    fontSize: 22,
    fontFamily: FONT.light,
    marginTop: -2,
  },

  reviewMetrics: {
    flexDirection: "row",
    gap: 10,
    marginTop: 23,
  },

  reviewMetric: {
    flex: 1,
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },

  reviewLabel: {
    color: "#484848",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  reviewValue: {
    color: "#D1D1D1",
    fontSize: 17,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  currentStatus: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  currentStatusLabel: {
    color: "#494949",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  reasonBox: {
    marginTop: 15,
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },

  reasonLabel: {
    color: "#4E4E4E",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  reasonText: {
    color: "#969696",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
  },

  modalInputGroup: {
    marginTop: 15,
  },

  modalInputLabel: {
    color: "#514B58",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginBottom: 7,
  },

  modalInput: {
    minHeight: 45,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#242124",
    backgroundColor: COLORS.glassBg,
    color: "#D1D1D1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 10,
  },

  modalActions: {
    marginTop: 21,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
  },

  rejectButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3C252B",
    alignItems: "center",
    justifyContent: "center",
  },

  rejectButtonText: {
    color: "#B77C8A",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  approveButton: {
    minHeight: 42,
    minWidth: 125,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#4A3768",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  approveGradient: {
    minHeight: 42,
    minWidth: 125,
    alignItems: "center",
    justifyContent: "center",
  },

  approveButtonText: {
    color: "#3F3F3B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  completedBox: {
    flex: 1,
    minHeight: 55,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#33284A",
    alignItems: "center",
    justifyContent: "center",
  },

  completedText: {
    color: "#9F86DE",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  completedReference: {
    color: "#57505F",
    fontSize: 8,
    marginTop: 4,
  },
});