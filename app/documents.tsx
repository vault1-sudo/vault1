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
  calculateDocumentSummary,
  createDocument,
  getDocumentStatusLabel,
  getDocumentTypeLabel,
  getDocuments,
} from "../services/documents/documentService";

import {
  DocumentAcceptanceStatus,
  DocumentStatus,
  DocumentType,
  Vault1Document,
} from "../types/document";

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

const documentTypes: DocumentType[] = [
  "TERMS",
  "RISK_DISCLOSURE",
  "AGREEMENT",
  "KYC",
  "STRATEGY_DISCLOSURE",
  "FEE_SCHEDULE",
  "STATEMENT",
  "TRANSACTION_HISTORY",
  "OTHER",
];

const statusFilters: Array<
  "ALL" | DocumentStatus
> = [
  "ALL",
  "DRAFT",
  "ISSUED",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
];

function formatDate(
  value?: string
) {
  if (!value) {
    return "—";
  }

  const parsed =
    new Date(value);

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return value;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
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
  status: DocumentStatus;
}) {
  const positive =
    status === "ACCEPTED";

  const active =
    status === "ISSUED";

  const negative =
    status === "EXPIRED" ||
    status === "REVOKED";

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
        {getDocumentStatusLabel(
          status
        )}
      </Text>
    </View>
  );
}

function AcceptanceBadge({
  status,
}: {
  status: DocumentAcceptanceStatus;
}) {
  return (
    <View
      style={
        styles.acceptanceBadge
      }
    >
      <Text
        style={
          styles.acceptanceText
        }
      >
        {status === "NOT_REQUIRED"
          ? "NO CONSENT"
          : status}
      </Text>
    </View>
  );
}

export default function DocumentsScreen() {
  const { profile } = useAuth();

  const [documents, setDocuments] =
    useState<Vault1Document[]>(
      []
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [activeNav, setActiveNav] =
    useState("Documents");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<
      "ALL" | DocumentStatus
    >("ALL");

  const [showCreate, setShowCreate] =
    useState(false);

  const [selectedDocument, setSelectedDocument] =
    useState<Vault1Document | null>(
      null
    );

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [investorId, setInvestorId] =
    useState("");

  const [investorCode, setInvestorCode] =
    useState("");

  const [investorName, setInvestorName] =
    useState("");

  const [investorEmail, setInvestorEmail] =
    useState("");

  const [type, setType] =
    useState<DocumentType>(
      "AGREEMENT"
    );

  const [version, setVersion] =
    useState("1.0");

  const [issueDate, setIssueDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

  const [expiryDate, setExpiryDate] =
    useState("");

  const [documentUrl, setDocumentUrl] =
    useState("");

  const [acceptanceStatus, setAcceptanceStatus] =
    useState<DocumentAcceptanceStatus>(
      "PENDING"
    );

  const [notes, setNotes] =
    useState("");

  useEffect(() => {
    if (!profile?.uid) {
      return;
    }

    loadDocuments(
      profile.uid
    );
  }, [profile?.uid]);

  async function loadDocuments(
    userId: string
  ) {
    try {
      setLoading(true);
      setError("");

      const data =
        await getDocuments(
          userId
        );

      setDocuments(data);
    } catch (err: any) {
      console.error(
        "Document loading error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load documents."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setInvestorId("");
    setInvestorCode("");
    setInvestorName("");
    setInvestorEmail("");
    setType("AGREEMENT");
    setVersion("1.0");

    setIssueDate(
      new Date()
        .toISOString()
        .slice(0, 10)
    );

    setExpiryDate("");
    setDocumentUrl("");
    setAcceptanceStatus(
      "PENDING"
    );
    setNotes("");
  }

  function openCreate() {
    resetForm();
    setSelectedDocument(null);
    setShowCreate(true);
    setError("");
    setSuccess("");
  }

  function openDocument(
    document: Vault1Document
  ) {
    setSelectedDocument(
      document
    );
    setShowCreate(false);
    setError("");
    setSuccess("");
  }

  function closePanels() {
    setShowCreate(false);
    setSelectedDocument(null);
    setError("");
  }

  async function handleCreate() {
    if (!profile?.uid) {
      setError(
        "You must be signed in."
      );
      return;
    }

    if (!investorId.trim()) {
      setError(
        "Investor ID is required."
      );
      return;
    }

    if (!investorCode.trim()) {
      setError(
        "Investor code is required."
      );
      return;
    }

    if (!investorName.trim()) {
      setError(
        "Investor name is required."
      );
      return;
    }

    if (!investorEmail.trim()) {
      setError(
        "Investor email is required."
      );
      return;
    }

    if (!title.trim()) {
      setError(
        "Document title is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await createDocument({
        userId: profile.uid,
        investorId,
        investorCode,
        investorName,
        investorEmail,
        title,
        description,
        type,
        status:
          acceptanceStatus ===
          "ACCEPTED"
            ? "ACCEPTED"
            : "ISSUED",
        version,
        documentUrl,
        issueDate,
        expiryDate,
        acceptanceStatus,
        issuedBy:
          profile.displayName ||
          "Vault1 Admin",
        notes,
      });

      setSuccess(
        "Document registered successfully."
      );

      setShowCreate(false);
      resetForm();

      await loadDocuments(
        profile.uid
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create document."
      );
    } finally {
      setSaving(false);
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
        calculateDocumentSummary(
          documents
        ),
      [documents]
    );

  const filteredDocuments =
    useMemo(() => {
      const queryText =
        search
          .trim()
          .toLowerCase();

      return documents.filter(
        (document) => {
          const matchesSearch =
            !queryText ||
            document.title
              .toLowerCase()
              .includes(queryText) ||
            document.investorName
              .toLowerCase()
              .includes(queryText) ||
            document.investorCode
              .toLowerCase()
              .includes(queryText) ||
            document.type
              .toLowerCase()
              .includes(queryText);

          const matchesFilter =
            filter === "ALL" ||
            document.status ===
              filter;

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      documents,
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
          LOADING DOCUMENT CENTER
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
                Documents
              </Text>

              <Text
                style={styles.subtitle}
              >
                A controlled document
                center for agreements,
                disclosures, KYC,
                statements and investor
                records.
              </Text>
            </View>

            <Pressable
              onPress={openCreate}
              style={({
                pressed,
              }) => [
                styles.createButton,
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
                  styles.createGradient
                }
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  + REGISTER DOCUMENT
                </Text>
              </LinearGradient>
            </Pressable>
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
              label="TOTAL DOCUMENTS"
              value={String(
                summary.total
              )}
              caption="Registered records"
            />

            <MetricCard
              label="ISSUED"
              value={String(
                summary.issued
              )}
              caption="Currently issued"
            />

            <MetricCard
              label="ACCEPTED"
              value={String(
                summary.accepted
              )}
              caption="Consent recorded"
            />

            <MetricCard
              label="PENDING"
              value={String(
                summary.pending
              )}
              caption="Awaiting acceptance"
            />

            <MetricCard
              label="AGREEMENTS"
              value={String(
                summary.agreements
              )}
              caption="Agreement records"
            />

            <MetricCard
              label="KYC"
              value={String(
                summary.kyc
              )}
              caption="KYC documents"
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
                  DOCUMENT REGISTER
                </Text>

                <Text
                  style={
                    styles.registryTitle
                  }
                >
                  Investor document vault
                </Text>

                <Text
                  style={
                    styles.registryDescription
                  }
                >
                  Versioned records with
                  controlled status and
                  acceptance tracking.
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
                  placeholder="Search documents or investors..."
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
                  {statusFilters.map(
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
                            {item}
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
                    DOCUMENT
                  </Text>

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
                    VERSION
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    ISSUE DATE
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
                    CONSENT
                  </Text>

                  <Text
                    style={
                      styles.headerCell
                    }
                  >
                    ACTION
                  </Text>
                </View>

                {filteredDocuments.length ===
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
                        D
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.emptyTitle
                      }
                    >
                      No documents registered
                    </Text>

                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      Create the first
                      investor document
                      record to begin
                      building the document
                      center.
                    </Text>
                  </View>
                ) : (
                  filteredDocuments.map(
                    (document) => (
                      <View
                        key={
                          document.id
                        }
                        style={
                          styles.documentRow
                        }
                      >
                        <View
                          style={
                            styles.documentCell
                          }
                        >
                          <View
                            style={
                              styles.documentIcon
                            }
                          >
                            <Text
                              style={
                                styles.documentIconText
                              }
                            >
                              D
                            </Text>
                          </View>

                          <View
                            style={
                              styles.documentIdentity
                            }
                          >
                            <Text
                              style={
                                styles.documentTitle
                              }
                              numberOfLines={
                                1
                              }
                            >
                              {
                                document.title
                              }
                            </Text>

                            <Text
                              style={
                                styles.documentType
                              }
                            >
                              {getDocumentTypeLabel(
                                document.type
                              )}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.investorCell
                          }
                        >
                          <Text
                            style={
                              styles.investorName
                            }
                          >
                            {
                              document.investorName
                            }
                          </Text>

                          <Text
                            style={
                              styles.investorCode
                            }
                          >
                            {
                              document.investorCode
                            }
                          </Text>
                        </View>

                        <View
                          style={
                            styles.versionCell
                          }
                        >
                          <Text
                            style={
                              styles.versionText
                            }
                          >
                            v
                            {
                              document.version
                            }
                          </Text>
                        </View>

                        <View
                          style={
                            styles.dateCell
                          }
                        >
                          <Text
                            style={
                              styles.dateText
                            }
                          >
                            {formatDate(
                              document.issueDate
                            )}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.statusCell
                          }
                        >
                          <StatusBadge
                            status={
                              document.status
                            }
                          />
                        </View>

                        <View
                          style={
                            styles.consentCell
                          }
                        >
                          <AcceptanceBadge
                            status={
                              document.acceptanceStatus
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
                              openDocument(
                                document
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
                              VIEW
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
              styles.bottomGrid
            }
          >
            <VaultSurface
              intensity="subtle"
              style={
                styles.bottomCard
              }
            >
              <Text
                style={
                  styles.bottomEyebrow
                }
              >
                VERSION CONTROL
              </Text>

              <Text
                style={
                  styles.bottomTitle
                }
              >
                Every document has a version
              </Text>

              <Text
                style={
                  styles.bottomText
                }
              >
                Vault1 records document
                versions, issue dates and
                acceptance state so the
                investor record remains
                traceable over time.
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={
                styles.bottomCard
              }
            >
              <Text
                style={
                  styles.bottomEyebrow
                }
              >
                CONSENT
              </Text>

              <Text
                style={
                  styles.bottomTitle
                }
              >
                Acceptance is explicit
              </Text>

              <Text
                style={
                  styles.bottomText
                }
              >
                Agreements and disclosure
                records can remain pending
                until the required investor
                acceptance is recorded.
              </Text>
            </VaultSurface>

            <VaultSurface
              intensity="subtle"
              style={
                styles.bottomCard
              }
            >
              <Text
                style={
                  styles.bottomEyebrow
                }
              >
                STORAGE
              </Text>

              <Text
                style={
                  styles.bottomTitle
                }
              >
                Storage-ready architecture
              </Text>

              <Text
                style={
                  styles.bottomText
                }
              >
                Document URL and Storage
                path fields are already
                supported. Firebase Storage
                upload automation can be
                connected next.
              </Text>
            </VaultSurface>
          </View>

          <View
            style={styles.footer}
          >
            <Text
              style={styles.footerText}
            >
              VAULT1 / DOCUMENT CENTER
            </Text>

            <Text
              style={
                styles.footerVersion
              }
            >
              DOCUMENT ENGINE 1.0
            </Text>
          </View>
        </ScrollView>
      </View>

      {showCreate ? (
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
              closePanels
            }
          />

          <VaultSurface
            intensity="strong"
            style={
              styles.modalCard
            }
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
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
                    DOCUMENT CENTER
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Register document
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Create a controlled
                    investor document
                    record.
                  </Text>
                </View>

                <Pressable
                  onPress={
                    closePanels
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
                  styles.formGrid
                }
              >
                <View
                  style={
                    styles.formFieldWide
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    DOCUMENT TITLE
                  </Text>

                  <TextInput
                    value={title}
                    onChangeText={
                      setTitle
                    }
                    placeholder="e.g. Vault1 Investment Agreement"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    DOCUMENT TYPE
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                  >
                    <View
                      style={
                        styles.optionRow
                      }
                    >
                      {documentTypes.map(
                        (item) => {
                          const active =
                            type ===
                            item;

                          return (
                            <Pressable
                              key={
                                item
                              }
                              onPress={() =>
                                setType(
                                  item
                                )
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
                                {getDocumentTypeLabel(
                                  item
                                )}
                              </Text>
                            </Pressable>
                          );
                        }
                      )}
                    </View>
                  </ScrollView>
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    INVESTOR ID
                  </Text>

                  <TextInput
                    value={
                      investorId
                    }
                    onChangeText={
                      setInvestorId
                    }
                    placeholder="Investor document ID"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    INVESTOR CODE
                  </Text>

                  <TextInput
                    value={
                      investorCode
                    }
                    onChangeText={
                      setInvestorCode
                    }
                    placeholder="e.g. INV-001"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    INVESTOR NAME
                  </Text>

                  <TextInput
                    value={
                      investorName
                    }
                    onChangeText={
                      setInvestorName
                    }
                    placeholder="Investor full name"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    INVESTOR EMAIL
                  </Text>

                  <TextInput
                    value={
                      investorEmail
                    }
                    onChangeText={
                      setInvestorEmail
                    }
                    placeholder="Investor email"
                    placeholderTextColor={COLORS.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    VERSION
                  </Text>

                  <TextInput
                    value={version}
                    onChangeText={
                      setVersion
                    }
                    placeholder="1.0"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    ISSUE DATE
                  </Text>

                  <TextInput
                    value={
                      issueDate
                    }
                    onChangeText={
                      setIssueDate
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formField
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    EXPIRY DATE
                  </Text>

                  <TextInput
                    value={
                      expiryDate
                    }
                    onChangeText={
                      setExpiryDate
                    }
                    placeholder="Optional YYYY-MM-DD"
                    placeholderTextColor={COLORS.muted}
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formFieldWide
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    DOCUMENT URL
                  </Text>

                  <TextInput
                    value={
                      documentUrl
                    }
                    onChangeText={
                      setDocumentUrl
                    }
                    placeholder="Firebase Storage / secure document URL"
                    placeholderTextColor={COLORS.muted}
                    autoCapitalize="none"
                    style={
                      styles.formInput
                    }
                  />
                </View>

                <View
                  style={
                    styles.formFieldWide
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    DESCRIPTION
                  </Text>

                  <TextInput
                    value={
                      description
                    }
                    onChangeText={
                      setDescription
                    }
                    placeholder="Describe what this document represents..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                    style={
                      styles.formTextarea
                    }
                  />
                </View>

                <View
                  style={
                    styles.formFieldWide
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    ACCEPTANCE
                  </Text>

                  <View
                    style={
                      styles.optionRow
                    }
                  >
                    {(
                      [
                        "NOT_REQUIRED",
                        "PENDING",
                        "ACCEPTED",
                        "DECLINED",
                      ] as DocumentAcceptanceStatus[]
                    ).map(
                      (item) => {
                        const active =
                          acceptanceStatus ===
                          item;

                        return (
                          <Pressable
                            key={
                              item
                            }
                            onPress={() =>
                              setAcceptanceStatus(
                                item
                              )
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
                              {item.replace(
                                "_",
                                " "
                              )}
                            </Text>
                          </Pressable>
                        );
                      }
                    )}
                  </View>
                </View>

                <View
                  style={
                    styles.formFieldWide
                  }
                >
                  <Text
                    style={
                      styles.formLabel
                    }
                  >
                    NOTES
                  </Text>

                  <TextInput
                    value={notes}
                    onChangeText={
                      setNotes
                    }
                    placeholder="Internal notes..."
                    placeholderTextColor={COLORS.muted}
                    multiline
                    style={
                      styles.formTextarea
                    }
                  />
                </View>
              </View>

              <View
                style={
                  styles.modalActions
                }
              >
                <Pressable
                  onPress={
                    closePanels
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.cancelButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    CANCEL
                  </Text>
                </Pressable>

                <Pressable
                  disabled={saving}
                  onPress={
                    handleCreate
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.saveButton,
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
                      styles.saveGradient
                    }
                  >
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      {saving
                        ? "REGISTERING..."
                        : "REGISTER DOCUMENT"}
                    </Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </ScrollView>
          </VaultSurface>
        </View>
      ) : null}

      {selectedDocument ? (
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
              closePanels
            }
          />

          <VaultSurface
            intensity="strong"
            style={
              styles.detailCard
            }
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View
                style={
                  styles.detailHeaderCopy
                }
              >
                <Text
                  style={
                    styles.modalEyebrow
                  }
                >
                  DOCUMENT RECORD
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedDocument.title
                  }
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {getDocumentTypeLabel(
                    selectedDocument.type
                  )}{" "}
                  · v
                  {
                    selectedDocument.version
                  }
                </Text>
              </View>

              <Pressable
                onPress={
                  closePanels
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
                styles.detailStatusRow
              }
            >
              <StatusBadge
                status={
                  selectedDocument.status
                }
              />

              <AcceptanceBadge
                status={
                  selectedDocument.acceptanceStatus
                }
              />
            </View>

            <View
              style={
                styles.detailGrid
              }
            >
              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  INVESTOR
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {
                    selectedDocument.investorName
                  }
                </Text>

                <Text
                  style={
                    styles.detailSecondary
                  }
                >
                  {
                    selectedDocument.investorCode
                  }
                </Text>
              </View>

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  EMAIL
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {
                    selectedDocument.investorEmail
                  }
                </Text>
              </View>

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  ISSUE DATE
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {formatDate(
                    selectedDocument.issueDate
                  )}
                </Text>
              </View>

              <View
                style={
                  styles.detailItem
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  EXPIRY DATE
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {formatDate(
                    selectedDocument.expiryDate
                  )}
                </Text>
              </View>
            </View>

            {selectedDocument.description ? (
              <View
                style={
                  styles.detailDescription
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  DESCRIPTION
                </Text>

                <Text
                  style={
                    styles.detailDescriptionText
                  }
                >
                  {
                    selectedDocument.description
                  }
                </Text>
              </View>
            ) : null}

            {selectedDocument.notes ? (
              <View
                style={
                  styles.detailDescription
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  NOTES
                </Text>

                <Text
                  style={
                    styles.detailDescriptionText
                  }
                >
                  {
                    selectedDocument.notes
                  }
                </Text>
              </View>
            ) : null}

            {selectedDocument.documentUrl ? (
              <View
                style={
                  styles.urlBox
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  DOCUMENT LOCATION
                </Text>

                <Text
                  style={
                    styles.urlText
                  }
                  numberOfLines={2}
                >
                  {
                    selectedDocument.documentUrl
                  }
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.urlBox
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  DOCUMENT LOCATION
                </Text>

                <Text
                  style={
                    styles.noUrlText
                  }
                >
                  No document file URL
                  attached yet.
                </Text>
              </View>
            )}

            <View
              style={
                styles.detailFooter
              }
            >
              <Text
                style={
                  styles.detailFooterText
                }
              >
                RECORD ID:{" "}
                {
                  selectedDocument.id
                }
              </Text>

              <Text
                style={
                  styles.detailFooterText
                }
              >
                ISSUED BY:{" "}
                {
                  selectedDocument.issuedBy ||
                  "—"
                }
              </Text>
            </View>

            <View
              style={
                styles.detailActions
              }
            >
              {selectedDocument.documentUrl ? (
                <Pressable
                  onPress={() => {
                    if (
                      selectedDocument.documentUrl
                    ) {
                      window.open(
                        selectedDocument.documentUrl,
                        "_blank"
                      );
                    }
                  }}
                  style={({
                    pressed,
                  }) => [
                    styles.openButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.openButtonText
                    }
                  >
                    OPEN DOCUMENT
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={
                  closePanels
                }
                style={({
                  pressed,
                }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  CLOSE
                </Text>
              </Pressable>
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

  createButton: {
    minHeight: 44,
    minWidth: 185,
    borderRadius: 9,
    overflow: "hidden",
    marginTop: 5,
  },

  createGradient: {
    flex: 1,
    paddingHorizontal: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    color: "#3F3F3B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
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
    width: 280,
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
    minWidth: 1320,
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
    width: 188,
    color: "#414141",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  documentRow: {
    minHeight: 82,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
    flexDirection: "row",
    alignItems: "center",
  },

  documentCell: {
    width: 188,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  documentIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#322743",
    alignItems: "center",
    justifyContent: "center",
  },

  documentIconText: {
    color: "#A58BE9",
    fontSize: 11,
    fontFamily: FONT.black,
  },

  documentIdentity: {
    flex: 1,
  },

  documentTitle: {
    color: "#C9C9C9",
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },

  documentType: {
    color: "#4D4754",
    fontSize: 7,
    fontFamily: FONT.extraBold,
    marginTop: 4,
  },

  investorCell: {
    width: 188,
  },

  investorName: {
    color: "#BEBEBE",
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },

  investorCode: {
    color: "#49434F",
    fontSize: 7,
    fontFamily: FONT.black,
    marginTop: 3,
    letterSpacing: 0.6,
  },

  versionCell: {
    width: 188,
  },

  versionText: {
    color: "#9C8CB9",
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },

  dateCell: {
    width: 188,
  },

  dateText: {
    color: "#777777",
    fontSize: 9,
    fontFamily: FONT.bold,
  },

  statusCell: {
    width: 188,
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

  acceptanceCell: {
    width: 188,
  },

  consentCell: {
    width: 188,
  },

  acceptanceBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.navyLine,
    alignItems: "center",
    justifyContent: "center",
  },

  acceptanceText: {
    color: "#69616F",
    fontSize: 6.5,
    fontFamily: FONT.black,
    letterSpacing: 0.6,
  },

  actionCell: {
    width: 188,
  },

  reviewButton: {
    alignSelf: "flex-start",
    minHeight: 31,
    paddingHorizontal: 14,
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

  bottomGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 18,
  },

  bottomCard: {
    flex: 1,
    minHeight: 160,
    padding: 20,
  },

  bottomEyebrow: {
    color: "#62516F",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  bottomTitle: {
    color: "#BDBDBD",
    fontSize: 16,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  bottomText: {
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

  buttonPressed: {
    opacity: 0.7,
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
    width: 780,
    maxWidth: "92%",
    maxHeight: "90%",
    padding: 27,
  },

  detailCard: {
    width: 650,
    maxWidth: "92%",
    maxHeight: "88%",
    padding: 27,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  detailHeaderCopy: {
    flex: 1,
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
    marginTop: 4,
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

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  formField: {
    width: "48%",
  },

  formFieldWide: {
    width: "100%",
  },

  formLabel: {
    color: "#514B58",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginBottom: 7,
  },

  formInput: {
    height: 43,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#242124",
    backgroundColor: COLORS.glassBg,
    color: "#D1D1D1",
    paddingHorizontal: 12,
    fontSize: 10,
  },

  formTextarea: {
    minHeight: 78,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#242124",
    backgroundColor: COLORS.glassBg,
    color: "#D1D1D1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 10,
  },

  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  optionButton: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 7,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.navyLine,
    alignItems: "center",
    justifyContent: "center",
  },

  optionButtonActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#493663",
  },

  optionText: {
    color: COLORS.muted,
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 0.4,
  },

  optionTextActive: {
    color: "#A88EE8",
  },

  modalActions: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
  },

  cancelButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292929",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    color: "#686868",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  saveButton: {
    minHeight: 42,
    minWidth: 165,
    borderRadius: 8,
    overflow: "hidden",
  },

  saveGradient: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
  },

  saveButtonText: {
    color: "#3F3F3B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  detailStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  detailItem: {
    width: "48%",
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },

  detailLabel: {
    color: "#484848",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  detailValue: {
    color: "#C8C8C8",
    fontSize: 10,
    fontFamily: FONT.extraBold,
    marginTop: 7,
  },

  detailSecondary: {
    color: "#4F4857",
    fontSize: 7,
    fontFamily: FONT.extraBold,
    marginTop: 3,
  },

  detailDescription: {
    marginTop: 14,
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },

  detailDescriptionText: {
    color: "#858585",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },

  urlBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#302641",
  },

  urlText: {
    color: "#8F78C1",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 7,
  },

  noUrlText: {
    color: "#55505A",
    fontSize: 9,
    marginTop: 7,
  },

  detailFooter: {
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#1A1A1A",
    gap: 5,
  },

  detailFooterText: {
    color: "#49434F",
    fontSize: 7,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },

  detailActions: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
  },

  openButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#493663",
    alignItems: "center",
    justifyContent: "center",
  },

  openButtonText: {
    color: "#A88EE8",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },
});