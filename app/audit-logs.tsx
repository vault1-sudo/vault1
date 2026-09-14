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
  getUserAuditLogs,
  getAuditActionLabel,
  getAuditEntityLabel,
  getAuditSeverityLabel,
  calculateAuditSummary,
} from "../services/audit/auditService";

import {
  AuditAction,
  AuditEntity,
  AuditLog,
  AuditSeverity,
} from "../types/auditLog";


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


const actionOptions: Array<
  AuditAction | "ALL"
> = [
  "ALL",
  "CREATE",
  "UPDATE",
  "LOGIN",
  "LOGOUT",
  "ACTIVATE",
  "PAUSE",
  "CANCEL",
  "CLOSE",
  "ISSUE",
  "ACCEPT",
  "REVOKE",
  "APPROVE",
  "REJECT",
  "EXPORT",
  "VIEW",
  "OTHER",
];


const severityOptions: Array<
  AuditSeverity | "ALL"
> = [
  "ALL",
  "INFO",
  "WARNING",
  "CRITICAL",
];


function formatDate(value: any) {
  if (!value) {
    return "—";
  }

  const date =
    value?.toDate?.() ??
    (value instanceof Date
      ? value
      : new Date(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function formatShortDate(value: any) {
  if (!value) {
    return "—";
  }

  const date =
    value?.toDate?.() ??
    (value instanceof Date
      ? value
      : new Date(value));

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function severityStyle(
  severity: AuditSeverity
) {
  if (severity === "CRITICAL") {
    return {
      backgroundColor: "#321414",
      borderColor: "#703232",
      textColor: "#F08A8A",
    };
  }

  if (severity === "WARNING") {
    return {
      backgroundColor: "#302814",
      borderColor: "#655322",
      textColor: "#D8BC6C",
    };
  }

  return {
    backgroundColor: "#17142B",
    borderColor: "#39305F",
    textColor: "#A89AEF",
  };
}


export default function AuditLogsScreen() {
  const router = useRouter();

  const { user, profile } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [actionFilter, setActionFilter] =
    useState<AuditAction | "ALL">("ALL");

  const [severityFilter, setSeverityFilter] =
    useState<AuditSeverity | "ALL">("ALL");

  const [selectedLog, setSelectedLog] =
    useState<AuditLog | null>(null);

  const [error, setError] = useState("");


  const loadLogs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await getUserAuditLogs(
        user.uid
      );

      setLogs(data);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadLogs();
  }, [user?.uid]);


  const summary = useMemo(
    () => calculateAuditSummary(logs),
    [logs]
  );


  const filteredLogs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesAction =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      const matchesSeverity =
        severityFilter === "ALL" ||
        log.severity === severityFilter;

      const searchable = [
        log.description,
        log.entityName,
        log.entity,
        log.action,
        log.entityId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchable.includes(normalizedSearch);

      return (
        matchesAction &&
        matchesSeverity &&
        matchesSearch
      );
    });
  }, [
    logs,
    search,
    actionFilter,
    severityFilter,
  ]);


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


  return (
    <View style={styles.page}>

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <View style={styles.sidebar}>

        <View style={styles.brandBlock}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>
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
              <Text style={styles.sectionLabel}>
                {section.section}
              </Text>

              {section.items.map((item) => {
                const active =
                  item === "Audit Logs";

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
            {profile?.role ||
              "VIEWER"}
          </Text>
        </View>
      </View>


      {/* ======================================================
          MAIN
      ====================================================== */}

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
              CONTROL CENTER
            </Text>

            <Text style={styles.pageTitle}>
              Audit Logs
            </Text>

            <Text style={styles.pageSubtitle}>
              Immutable activity history across
              the Vault1 operating system.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={loadLogs}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text style={styles.refreshText}>
                REFRESH
              </Text>
            </Pressable>
          </View>

        </View>


        {/* ====================================================
            HERO / SECURITY STRIP
        ==================================================== */}

        <VaultSurface
          intensity="strong"
          style={styles.securityCard}
        >
          <View style={styles.securityLeft}>

            <View style={styles.securityIcon}>
              <Text
                style={styles.securityIconText}
              >
                ✓
              </Text>
            </View>

            <View>
              <Text style={styles.securityTitle}>
                IMMUTABLE EVENT REGISTER
              </Text>

              <Text style={styles.securityText}>
                Audit records are append-only.
                Client-side modification and
                deletion are disabled.
              </Text>
            </View>

          </View>

          <View style={styles.securityStatus}>
            <View
              style={styles.liveDot}
            />

            <Text style={styles.liveText}>
              AUDIT ACTIVE
            </Text>
          </View>
        </VaultSurface>


        {/* ====================================================
            METRICS
        ==================================================== */}

        <View style={styles.metricsGrid}>

          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              TOTAL EVENTS
            </Text>

            <Text style={styles.metricValue}>
              {summary.totalEvents}
            </Text>

            <Text style={styles.metricHint}>
              Recorded activity
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              TODAY
            </Text>

            <Text style={styles.metricValue}>
              {summary.todayCount}
            </Text>

            <Text style={styles.metricHint}>
              Events today
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              CHANGES
            </Text>

            <Text style={styles.metricValue}>
              {summary.createCount +
                summary.updateCount}
            </Text>

            <Text style={styles.metricHint}>
              Create + update events
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              WARNINGS
            </Text>

            <Text
              style={[
                styles.metricValue,
                summary.warningCount > 0 &&
                  styles.warningMetric,
              ]}
            >
              {summary.warningCount}
            </Text>

            <Text style={styles.metricHint}>
              Elevated events
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              CRITICAL
            </Text>

            <Text
              style={[
                styles.metricValue,
                summary.criticalCount > 0 &&
                  styles.criticalMetric,
              ]}
            >
              {summary.criticalCount}
            </Text>

            <Text style={styles.metricHint}>
              Critical events
            </Text>
          </VaultSurface>

        </View>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <VaultSurface
          intensity="medium"
          style={styles.filterCard}
        >

          <View style={styles.filterTop}>

            <View>
              <Text style={styles.filterTitle}>
                EVENT REGISTER
              </Text>

              <Text style={styles.filterSubtitle}>
                Search and inspect recorded
                Vault1 activity.
              </Text>
            </View>

            <Text style={styles.resultCount}>
              {filteredLogs.length} EVENTS
            </Text>

          </View>


          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search description, entity, ID..."
            placeholderTextColor="#555555"
            style={styles.searchInput}
          />


          <View style={styles.filterRows}>

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>
                ACTION
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterOptions
                }
              >
                {actionOptions.map(
                  (option) => {
                    const active =
                      actionFilter === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() =>
                          setActionFilter(
                            option
                          )
                        }
                        style={({ pressed }) => [
                          styles.filterChip,
                          active &&
                            styles.filterChipActive,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {option === "ALL"
                            ? "ALL"
                            : getAuditActionLabel(
                                option
                              ).toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>


            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>
                SEVERITY
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.filterOptions
                }
              >
                {severityOptions.map(
                  (option) => {
                    const active =
                      severityFilter === option;

                    return (
                      <Pressable
                        key={option}
                        onPress={() =>
                          setSeverityFilter(
                            option
                          )
                        }
                        style={({ pressed }) => [
                          styles.filterChip,
                          active &&
                            styles.filterChipActive,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active &&
                              styles.filterChipTextActive,
                          ]}
                        >
                          {option === "ALL"
                            ? "ALL"
                            : getAuditSeverityLabel(
                                option
                              ).toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </ScrollView>
            </View>

          </View>

        </VaultSurface>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {error ? (
          <VaultSurface
            intensity="medium"
            style={styles.errorCard}
          >
            <Text style={styles.errorTitle}>
              AUDIT LOAD ERROR
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </VaultSurface>
        ) : null}


        {/* ====================================================
            LOG REGISTER
        ==================================================== */}

        <VaultSurface
          intensity="medium"
          style={styles.registerCard}
        >

          <View style={styles.registerHeader}>
            <View>
              <Text style={styles.registerTitle}>
                ACTIVITY REGISTER
              </Text>

              <Text
                style={styles.registerSubtitle}
              >
                Every recorded event belongs
                to the authenticated Vault1 user.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator />
            ) : null}
          </View>


          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator />

              <Text style={styles.loadingText}>
                Loading audit history...
              </Text>
            </View>
          ) : filteredLogs.length === 0 ? (
            <View style={styles.emptyState}>

              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>
                  ∅
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                NO AUDIT EVENTS
              </Text>

              <Text style={styles.emptyText}>
                Activity generated by Vault1
                modules will appear here.
              </Text>

            </View>
          ) : (
            <View style={styles.table}>

              <View style={styles.tableHeader}>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colDate,
                  ]}
                >
                  DATE
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colAction,
                  ]}
                >
                  ACTION
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colEntity,
                  ]}
                >
                  ENTITY
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colDescription,
                  ]}
                >
                  EVENT
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colSeverity,
                  ]}
                >
                  SEVERITY
                </Text>

              </View>


              {filteredLogs.map(
                (log, index) => {
                  const severity =
                    severityStyle(
                      log.severity
                    );

                  return (
                    <Pressable
                      key={log.id}
                      onPress={() =>
                        setSelectedLog(log)
                      }
                      style={({ pressed }) => [
                        styles.tableRow,
                        index ===
                          filteredLogs.length - 1 &&
                          styles.tableRowLast,
                        pressed &&
                          styles.tableRowPressed,
                      ]}
                    >

                      <View
                        style={styles.colDate}
                      >
                        <Text
                          style={
                            styles.dateText
                          }
                        >
                          {formatShortDate(
                            log.createdAt
                          )}
                        </Text>

                        <Text
                          style={
                            styles.timeText
                          }
                        >
                          {formatDate(
                            log.createdAt
                          )
                            .split(", ")
                            .slice(1)
                            .join(", ")}
                        </Text>
                      </View>


                      <View
                        style={styles.colAction}
                      >
                        <Text
                          style={
                            styles.actionText
                          }
                        >
                          {getAuditActionLabel(
                            log.action
                          )}
                        </Text>
                      </View>


                      <View
                        style={styles.colEntity}
                      >
                        <Text
                          style={
                            styles.entityText
                          }
                        >
                          {getAuditEntityLabel(
                            log.entity
                          )}
                        </Text>

                        {log.entityName ? (
                          <Text
                            style={
                              styles.entityName
                            }
                            numberOfLines={1}
                          >
                            {log.entityName}
                          </Text>
                        ) : null}
                      </View>


                      <View
                        style={
                          styles.colDescription
                        }
                      >
                        <Text
                          style={
                            styles.descriptionText
                          }
                          numberOfLines={2}
                        >
                          {log.description}
                        </Text>

                        {log.entityId ? (
                          <Text
                            style={styles.idText}
                            numberOfLines={1}
                          >
                            ID · {log.entityId}
                          </Text>
                        ) : null}
                      </View>


                      <View
                        style={styles.colSeverity}
                      >
                        <View
                          style={[
                            styles.severityBadge,
                            {
                              backgroundColor:
                                severity.backgroundColor,
                              borderColor:
                                severity.borderColor,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityText,
                              {
                                color:
                                  severity.textColor,
                              },
                            ]}
                          >
                            {getAuditSeverityLabel(
                              log.severity
                            ).toUpperCase()}
                          </Text>
                        </View>
                      </View>

                    </Pressable>
                  );
                }
              )}

            </View>
          )}

        </VaultSurface>


        {/* ====================================================
            SELECTED EVENT
        ==================================================== */}

        {selectedLog ? (
          <VaultSurface
            intensity="strong"
            style={styles.detailCard}
          >

            <View style={styles.detailHeader}>

              <View>
                <Text
                  style={styles.detailEyebrow}
                >
                  EVENT DETAIL
                </Text>

                <Text
                  style={styles.detailTitle}
                >
                  {getAuditActionLabel(
                    selectedLog.action
                  )} ·{" "}
                  {getAuditEntityLabel(
                    selectedLog.entity
                  )}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setSelectedLog(null)
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={styles.closeButtonText}
                >
                  CLOSE
                </Text>
              </Pressable>

            </View>


            <View style={styles.detailGrid}>

              <View style={styles.detailItem}>
                <Text
                  style={styles.detailLabel}
                >
                  ACTION
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {getAuditActionLabel(
                    selectedLog.action
                  )}
                </Text>
              </View>


              <View style={styles.detailItem}>
                <Text
                  style={styles.detailLabel}
                >
                  ENTITY
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {getAuditEntityLabel(
                    selectedLog.entity
                  )}
                </Text>
              </View>


              <View style={styles.detailItem}>
                <Text
                  style={styles.detailLabel}
                >
                  SEVERITY
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {getAuditSeverityLabel(
                    selectedLog.severity
                  )}
                </Text>
              </View>


              <View style={styles.detailItem}>
                <Text
                  style={styles.detailLabel}
                >
                  TIMESTAMP
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {formatDate(
                    selectedLog.createdAt
                  )}
                </Text>
              </View>


              {selectedLog.entityId ? (
                <View
                  style={styles.detailItem}
                >
                  <Text
                    style={styles.detailLabel}
                  >
                    ENTITY ID
                  </Text>

                  <Text
                    style={styles.detailValue}
                    numberOfLines={1}
                  >
                    {selectedLog.entityId}
                  </Text>
                </View>
              ) : null}


              {selectedLog.entityName ? (
                <View
                  style={styles.detailItem}
                >
                  <Text
                    style={styles.detailLabel}
                  >
                    ENTITY NAME
                  </Text>

                  <Text
                    style={styles.detailValue}
                  >
                    {selectedLog.entityName}
                  </Text>
                </View>
              ) : null}

            </View>


            <View
              style={styles.detailDescription}
            >
              <Text
                style={styles.detailLabel}
              >
                DESCRIPTION
              </Text>

              <Text
                style={styles.detailDescriptionText}
              >
                {selectedLog.description}
              </Text>
            </View>


            {selectedLog.metadata ? (
              <View
                style={styles.metadataBox}
              >
                <Text
                  style={styles.detailLabel}
                >
                  METADATA
                </Text>

                <Text
                  style={styles.metadataText}
                >
                  {JSON.stringify(
                    selectedLog.metadata,
                    null,
                    2
                  )}
                </Text>
              </View>
            ) : null}

          </VaultSurface>
        ) : null}


        {/* ====================================================
            ARCHITECTURE NOTE
        ==================================================== */}

        <VaultSurface
          intensity="subtle"
          style={styles.noteCard}
        >
          <View style={styles.noteAccent} />

          <View>
            <Text style={styles.noteTitle}>
              AUDIT ARCHITECTURE
            </Text>

            <Text style={styles.noteText}>
              Vault1 treats audit history as an
              immutable operational record.
              Future server-side Cloud Functions
              can automatically generate trusted
              audit events for sensitive actions,
              preventing client-side tampering.
            </Text>
          </View>
        </VaultSurface>

      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({

  page: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#060606",
  },


  /* ==========================================================
     SIDEBAR
  ========================================================== */

  sidebar: {
    width: 250,
    backgroundColor: "#080808",
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
    backgroundColor: "#16121F",
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
    color: "#F2F2F2",
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
    backgroundColor: "#121019",
    borderLeftColor: "#8B6FE8",
  },

  navItemPressed: {
    opacity: 0.72,
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#343434",
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
    color: "#E5DFFF",
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


  /* ==========================================================
     MAIN
  ========================================================== */

  mainScroll: {
    flex: 1,
  },

  mainContent: {
    paddingHorizontal: 42,
    paddingTop: 38,
    paddingBottom: 70,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 30,
  },

  eyebrow: {
    color: "#7661B8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 9,
  },

  pageTitle: {
    color: "#F4F4F4",
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

  refreshButton: {
    minHeight: 42,
    paddingHorizontal: 19,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#302A43",
    backgroundColor: "#100E16",
    justifyContent: "center",
    alignItems: "center",
  },

  refreshText: {
    color: "#A28BEA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  buttonPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },


  /* ==========================================================
     SECURITY CARD
  ========================================================== */

  securityCard: {
    minHeight: 86,
    marginBottom: 18,
  },

  securityLeft: {
    flex: 1,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#17122A",
    borderWidth: 1,
    borderColor: "#493A76",
    alignItems: "center",
    justifyContent: "center",
  },

  securityIconText: {
    color: "#B39AFB",
    fontSize: 19,
    fontWeight: "900",
  },

  securityTitle: {
    color: "#C8B9F2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  securityText: {
    color: "#66606F",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },

  securityStatus: {
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9075E7",
  },

  liveText: {
    color: "#7661B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },


  /* ==========================================================
     METRICS
  ========================================================== */

  metricsGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },

  metricCard: {
    flex: 1,
    minHeight: 132,
    padding: 20,
  },

  metricLabel: {
    color: "#5C5C5C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricValue: {
    color: "#F2F2F2",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 15,
  },

  metricHint: {
    color: "#4C4C4C",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },

  warningMetric: {
    color: "#D8BC6C",
  },

  criticalMetric: {
    color: "#F08A8A",
  },


  /* ==========================================================
     FILTERS
  ========================================================== */

  filterCard: {
    padding: 22,
    marginBottom: 18,
  },

  filterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  filterTitle: {
    color: "#E2E2E2",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  filterSubtitle: {
    color: "#555555",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  resultCount: {
    color: "#66549A",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  searchInput: {
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#272727",
    backgroundColor: "#0B0B0B",
    color: "#EDEDED",
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 20,
  },

  filterRows: {
    marginTop: 18,
    gap: 16,
  },

  filterGroup: {
    gap: 8,
  },

  filterLabel: {
    color: "#424242",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  filterOptions: {
    gap: 7,
  },

  filterChip: {
    paddingHorizontal: 12,
    minHeight: 32,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#272727",
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
  },

  filterChipActive: {
    backgroundColor: "#18132A",
    borderColor: "#4B3A78",
  },

  filterChipText: {
    color: "#565656",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  filterChipTextActive: {
    color: "#AE99EF",
  },


  /* ==========================================================
     ERROR
  ========================================================== */

  errorCard: {
    padding: 20,
    marginBottom: 18,
    borderColor: "#502A2A",
  },

  errorTitle: {
    color: "#E47D7D",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  errorText: {
    color: "#7B5D5D",
    fontSize: 12,
    marginTop: 7,
  },


  /* ==========================================================
     REGISTER
  ========================================================== */

  registerCard: {
    marginBottom: 18,
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

  registerTitle: {
    color: "#E4E4E4",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  registerSubtitle: {
    color: "#555555",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 5,
  },

  table: {
    width: "100%",
  },

  tableHeader: {
    minHeight: 42,
    paddingHorizontal: 22,
    backgroundColor: "#0D0D0D",
    borderBottomWidth: 1,
    borderBottomColor: "#1D1D1D",
    flexDirection: "row",
    alignItems: "center",
  },

  tableHeaderText: {
    color: "#404040",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  tableRow: {
    minHeight: 86,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#181818",
    flexDirection: "row",
    alignItems: "center",
  },

  tableRowLast: {
    borderBottomWidth: 0,
  },

  tableRowPressed: {
    backgroundColor: "#111015",
  },

  colDate: {
    width: 135,
    paddingRight: 15,
  },

  colAction: {
    width: 120,
    paddingRight: 15,
  },

  colEntity: {
    width: 145,
    paddingRight: 15,
  },

  colDescription: {
    flex: 1,
    paddingRight: 20,
  },

  colSeverity: {
    width: 105,
  },

  dateText: {
    color: "#BDBDBD",
    fontSize: 11,
    fontWeight: "700",
  },

  timeText: {
    color: "#474747",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4,
  },

  actionText: {
    color: "#A38BE8",
    fontSize: 11,
    fontWeight: "800",
  },

  entityText: {
    color: "#D1D1D1",
    fontSize: 11,
    fontWeight: "800",
  },

  entityName: {
    color: "#4E4E4E",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 4,
  },

  descriptionText: {
    color: "#9B9B9B",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 17,
  },

  idText: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "600",
    marginTop: 5,
  },

  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    minHeight: 25,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
  },

  severityText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
  },


  /* ==========================================================
     LOADING / EMPTY
  ========================================================== */

  loadingState: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#555555",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#252525",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyIconText: {
    color: "#555555",
    fontSize: 22,
    fontWeight: "800",
  },

  emptyTitle: {
    color: "#858585",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  emptyText: {
    color: "#4C4C4C",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 7,
    maxWidth: 430,
  },


  /* ==========================================================
     DETAIL
  ========================================================== */

  detailCard: {
    padding: 24,
    marginBottom: 18,
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },

  detailEyebrow: {
    color: "#765FB8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  detailTitle: {
    color: "#EEEEEE",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 7,
  },

  closeButton: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#0D0D0D",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#666666",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 1,
  },

  detailItem: {
    width: "25%",
    minHeight: 75,
    paddingRight: 20,
  },

  detailLabel: {
    color: "#484848",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  detailValue: {
    color: "#BEBEBE",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
  },

  detailDescription: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#202020",
  },

  detailDescriptionText: {
    color: "#9C9C9C",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 21,
    marginTop: 8,
  },

  metadataBox: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    backgroundColor: "#090909",
    borderWidth: 1,
    borderColor: "#1D1D1D",
  },

  metadataText: {
    color: "#706A80",
    fontFamily: "monospace",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 9,
  },


  /* ==========================================================
     NOTE
  ========================================================== */

  noteCard: {
    minHeight: 100,
    padding: 20,
    flexDirection: "row",
    gap: 16,
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
    maxWidth: 900,
  },
});