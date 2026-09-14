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
  View,
} from "react-native";

import { useRouter } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { useAuth } from "../services/auth/AuthProvider";

import {
  getUserNotifications,
  markNotificationRead,
  markNotificationUnread,
  archiveNotification,
  markAllNotificationsRead,
  calculateNotificationSummary,
  getNotificationTypeLabel,
  getNotificationPriorityLabel,
} from "../services/notifications/notificationService";

import {
  NotificationPriority,
  NotificationType,
  Vault1Notification,
} from "../types/notification";


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


type Filter =
  | "ALL"
  | "UNREAD"
  | "HIGH"
  | "CRITICAL"
  | NotificationType;


const filters: Filter[] = [
  "ALL",
  "UNREAD",
  "HIGH",
  "CRITICAL",
  "TRADE",
  "PORTFOLIO",
  "INVESTOR",
  "PAYOUT",
  "DOCUMENT",
  "GROWTH_MISSION",
  "RISK",
  "PERFORMANCE",
  "SECURITY",
  "SYSTEM",
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


function priorityStyles(
  priority: NotificationPriority
) {
  switch (priority) {
    case "CRITICAL":
      return {
        backgroundColor: "#321515",
        borderColor: "#703232",
        textColor: "#F28D8D",
      };

    case "HIGH":
      return {
        backgroundColor: "#302814",
        borderColor: "#655322",
        textColor: "#D9BD6D",
      };

    case "LOW":
      return {
        backgroundColor: "#101010",
        borderColor: "#272727",
        textColor: "#696969",
      };

    default:
      return {
        backgroundColor: "#17132A",
        borderColor: "#3D3262",
        textColor: "#A792ED",
      };
  }
}


function typeInitial(
  type: NotificationType
) {
  switch (type) {
    case "TRADE":
      return "T";

    case "PORTFOLIO":
      return "P";

    case "INVESTOR":
      return "I";

    case "PAYOUT":
      return "$";

    case "DOCUMENT":
      return "D";

    case "GROWTH_MISSION":
      return "G";

    case "RISK":
      return "!";

    case "PERFORMANCE":
      return "↗";

    case "SECURITY":
      return "S";

    default:
      return "V";
  }
}


export default function NotificationsScreen() {
  const router = useRouter();

  const { user, profile } = useAuth();

  const [notifications, setNotifications] =
    useState<Vault1Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedNotification, setSelectedNotification] =
    useState<Vault1Notification | null>(
      null
    );


  const loadNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getUserNotifications(
          user.uid
        );

      setNotifications(data);
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadNotifications();
  }, [user?.uid]);


  const summary = useMemo(
    () =>
      calculateNotificationSummary(
        notifications
      ),
    [notifications]
  );


  const filteredNotifications =
    useMemo(() => {
      return notifications.filter(
        (notification) => {
          if (filter === "ALL") {
            return (
              notification.status !==
              "ARCHIVED"
            );
          }

          if (filter === "UNREAD") {
            return (
              notification.status ===
              "UNREAD"
            );
          }

          if (filter === "HIGH") {
            return (
              notification.priority ===
              "HIGH"
            );
          }

          if (filter === "CRITICAL") {
            return (
              notification.priority ===
              "CRITICAL"
            );
          }

          return (
            notification.type === filter &&
            notification.status !==
              "ARCHIVED"
          );
        }
      );
    }, [notifications, filter]);


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


  const openNotification = async (
    notification: Vault1Notification
  ) => {
    setSelectedNotification(
      notification
    );

    if (
      notification.status === "UNREAD"
    ) {
      try {
        await markNotificationRead(
          notification.id
        );

        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  status: "READ",
                }
              : item
          )
        );

        setSelectedNotification(
          (current) =>
            current?.id === notification.id
              ? {
                  ...current,
                  status: "READ",
                }
              : current
        );
      } catch (err) {
        console.error(err);
      }
    }
  };


  const handleUnread = async (
    notification: Vault1Notification
  ) => {
    try {
      await markNotificationUnread(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                status: "UNREAD",
              }
            : item
        )
      );

      setSelectedNotification(
        (current) =>
          current?.id === notification.id
            ? {
                ...current,
                status: "UNREAD",
              }
            : current
      );
    } catch (err) {
      console.error(err);
    }
  };


  const handleArchive = async (
    notification: Vault1Notification
  ) => {
    try {
      await archiveNotification(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                status: "ARCHIVED",
              }
            : item
        )
      );

      if (
        selectedNotification?.id ===
        notification.id
      ) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error(err);
    }
  };


  const handleMarkAllRead = async () => {
    if (summary.unread === 0) {
      return;
    }

    try {
      await markAllNotificationsRead(
        notifications
      );

      setNotifications((current) =>
        current.map((item) =>
          item.status === "UNREAD"
            ? {
                ...item,
                status: "READ",
              }
            : item
        )
      );

      setSelectedNotification(
        (current) =>
          current?.status === "UNREAD"
            ? {
                ...current,
                status: "READ",
              }
            : current
      );
    } catch (err) {
      console.error(err);
    }
  };


  const handleAction = (
    notification: Vault1Notification
  ) => {
    if (!notification.actionRoute) {
      return;
    }

    router.push(
      notification.actionRoute as any
    );
  };


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
                  item === "Notifications";

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
              CONTROL CENTER
            </Text>

            <Text style={styles.pageTitle}>
              Notifications
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              The operational signal layer
              for your Vault1 system.
            </Text>
          </View>


          <View style={styles.headerActions}>

            <Pressable
              onPress={handleMarkAllRead}
              disabled={summary.unread === 0}
              style={({ pressed }) => [
                styles.actionButton,
                summary.unread === 0 &&
                  styles.actionButtonDisabled,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.actionButtonText}
              >
                MARK ALL READ
              </Text>
            </Pressable>


            <Pressable
              onPress={loadNotifications}
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


        <VaultSurface
          intensity="strong"
          style={styles.heroCard}
        >
          <View style={styles.heroLeft}>

            <View style={styles.heroIcon}>
              <Text
                style={styles.heroIconText}
              >
                !
              </Text>
            </View>

            <View>
              <Text style={styles.heroLabel}>
                ATTENTION CENTER
              </Text>

              <Text style={styles.heroValue}>
                {summary.unread}
              </Text>

              <Text
                style={styles.heroDescription}
              >
                unread notifications require
                your attention.
              </Text>
            </View>

          </View>


          <View style={styles.heroRight}>

            <View style={styles.heroMini}>
              <Text
                style={styles.heroMiniLabel}
              >
                HIGH PRIORITY
              </Text>

              <Text
                style={styles.heroMiniValue}
              >
                {summary.highPriority}
              </Text>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroMini}>
              <Text
                style={styles.heroMiniLabel}
              >
                CRITICAL
              </Text>

              <Text
                style={[
                  styles.heroMiniValue,
                  summary.critical > 0 &&
                    styles.criticalText,
                ]}
              >
                {summary.critical}
              </Text>
            </View>

          </View>
        </VaultSurface>


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
              All notifications
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              UNREAD
            </Text>

            <Text
              style={[
                styles.metricValue,
                summary.unread > 0 &&
                  styles.unreadMetric,
              ]}
            >
              {summary.unread}
            </Text>

            <Text style={styles.metricHint}>
              Awaiting attention
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              READ
            </Text>

            <Text style={styles.metricValue}>
              {summary.read}
            </Text>

            <Text style={styles.metricHint}>
              Already reviewed
            </Text>
          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.metricCard}
          >
            <Text style={styles.metricLabel}>
              ARCHIVED
            </Text>

            <Text style={styles.metricValue}>
              {summary.archived}
            </Text>

            <Text style={styles.metricHint}>
              Stored history
            </Text>
          </VaultSurface>

        </View>


        {error ? (
          <VaultSurface
            intensity="medium"
            style={styles.errorCard}
          >
            <Text style={styles.errorTitle}>
              NOTIFICATION ERROR
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>
          </VaultSurface>
        ) : null}


        <VaultSurface
          intensity="medium"
          style={styles.filterCard}
        >

          <View style={styles.filterHeader}>

            <View>
              <Text
                style={styles.filterTitle}
              >
                SIGNAL FILTER
              </Text>

              <Text
                style={styles.filterSubtitle}
              >
                Focus the command center on
                what matters.
              </Text>
            </View>

            <Text style={styles.resultCount}>
              {filteredNotifications.length}{" "}
              SHOWN
            </Text>

          </View>


          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={
              styles.filterOptions
            }
          >
            {filters.map((item: Filter) => {
              const active =
                filter === item;

              let label: string = item;

              if (item === "ALL") {
                label = "ALL";
              } else if (
                item === "UNREAD"
              ) {
                label = "UNREAD";
              } else if (
                item === "HIGH"
              ) {
                label = "HIGH";
              } else if (
                item === "CRITICAL"
              ) {
                label = "CRITICAL";
              } else {
                label =
                  getNotificationTypeLabel(
                    item as NotificationType
                  ).toUpperCase();
              }

              return (
                <Pressable
                  key={item}
                  onPress={() =>
                    setFilter(item)
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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

        </VaultSurface>


        <VaultSurface
          intensity="medium"
          style={styles.registerCard}
        >

          <View style={styles.registerHeader}>

            <View>
              <Text
                style={styles.registerTitle}
              >
                NOTIFICATION REGISTER
              </Text>

              <Text
                style={styles.registerSubtitle}
              >
                Operational events and alerts
                generated by Vault1.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator />
            ) : null}

          </View>


          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator />

              <Text
                style={styles.loadingText}
              >
                Loading notifications...
              </Text>
            </View>
          ) : filteredNotifications.length ===
            0 ? (
            <View style={styles.emptyState}>

              <View style={styles.emptyIcon}>
                <Text
                  style={styles.emptyIconText}
                >
                  ✓
                </Text>
              </View>

              <Text
                style={styles.emptyTitle}
              >
                ALL CLEAR
              </Text>

              <Text
                style={styles.emptyText}
              >
                There are no notifications matching
                the current filter.
              </Text>

            </View>
          ) : (
            <View>
              {filteredNotifications.map(
                (
                  notification,
                  index
                ) => {
                  const priority =
                    priorityStyles(
                      notification.priority
                    );

                  const unread =
                    notification.status ===
                    "UNREAD";

                  return (
                    <Pressable
                      key={notification.id}
                      onPress={() =>
                        openNotification(
                          notification
                        )
                      }
                      style={({ pressed }) => [
                        styles.notificationRow,
                        unread &&
                          styles.notificationUnread,
                        index ===
                          filteredNotifications.length -
                            1 &&
                          styles.notificationLast,
                        pressed &&
                          styles.notificationPressed,
                      ]}
                    >

                      <View
                        style={[
                          styles.typeIcon,
                          unread &&
                            styles.typeIconUnread,
                        ]}
                      >
                        <Text
                          style={
                            styles.typeIconText
                          }
                        >
                          {typeInitial(
                            notification.type
                          )}
                        </Text>
                      </View>


                      <View
                        style={styles.notificationBody}
                      >

                        <View
                          style={
                            styles.notificationTop
                          }>

                          <View
                            style={
                              styles.titleLine
                            }
                          >
                            {unread ? (
                              <View
                                style={
                                  styles.unreadDot
                                }
                              />
                            ) : null}

                            <Text
                              style={[
                                styles.notificationTitle,
                                unread &&
                                  styles.notificationTitleUnread,
                              ]}
                              numberOfLines={1}
                            >
                              {
                                notification.title
                              }
                            </Text>
                          </View>


                          <View
                            style={[
                              styles.priorityBadge,
                              {
                                backgroundColor:
                                  priority.backgroundColor,
                                borderColor:
                                  priority.borderColor,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.priorityText,
                                {
                                  color:
                                    priority.textColor,
                                },
                              ]}
                            >
                              {getNotificationPriorityLabel(
                                notification.priority
                              ).toUpperCase()}
                            </Text>
                          </View>

                        </View>


                        <Text
                          style={
                            styles.notificationMessage
                          }
                          numberOfLines={2}
                        >
                          {
                            notification.message
                          }
                        </Text>


                        <View
                          style={
                            styles.notificationMeta
                          }
                        >
                          <Text
                            style={
                              styles.metaText
                            }
                          >
                            {getNotificationTypeLabel(
                              notification.type
                            ).toUpperCase()}
                          </Text>

                          <View
                            style={
                              styles.metaDivider
                            }
                          />

                          <Text
                            style={
                              styles.metaText
                            }
                          >
                            {formatDate(
                              notification.createdAt
                            )}
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


        {selectedNotification ? (
          <VaultSurface
            intensity="strong"
            style={styles.detailCard}
          >

            <View style={styles.detailHeader}>

              <View>
                <Text
                  style={styles.detailEyebrow}
                >
                  NOTIFICATION DETAIL
                </Text>

                <Text
                  style={styles.detailTitle}
                >
                  {selectedNotification.title}
                </Text>
              </View>


              <Pressable
                onPress={() =>
                  setSelectedNotification(
                    null
                  )
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  CLOSE
                </Text>
              </Pressable>

            </View>


            <Text
              style={styles.detailMessage}
            >
              {selectedNotification.message}
            </Text>


            <View style={styles.detailMetaGrid}>

              <View style={styles.detailMetaItem}>
                <Text
                  style={styles.detailLabel}
                >
                  TYPE
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {getNotificationTypeLabel(
                    selectedNotification.type
                  )}
                </Text>
              </View>


              <View style={styles.detailMetaItem}>
                <Text
                  style={styles.detailLabel}
                >
                  PRIORITY
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {getNotificationPriorityLabel(
                    selectedNotification.priority
                  )}
                </Text>
              </View>


              <View style={styles.detailMetaItem}>
                <Text
                  style={styles.detailLabel}
                >
                  STATUS
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {selectedNotification.status}
                </Text>
              </View>


              <View style={styles.detailMetaItem}>
                <Text
                  style={styles.detailLabel}
                >
                  CREATED
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {formatDate(
                    selectedNotification.createdAt
                  )}
                </Text>
              </View>

            </View>


            <View style={styles.detailActions}>

              {selectedNotification.status ===
              "UNREAD" ? (
                <Pressable
                  onPress={async () => {
                    try {
                      await markNotificationRead(
                        selectedNotification.id
                      );

                      setNotifications(
                        (current) =>
                          current.map(
                            (item) =>
                              item.id ===
                              selectedNotification.id
                                ? {
                                    ...item,
                                    status:
                                      "READ",
                                  }
                                : item
                          )
                      );

                      setSelectedNotification(
                        (current) =>
                          current
                            ? {
                                ...current,
                                status:
                                  "READ",
                              }
                            : null
                      );
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.detailActionButton,
                    styles.detailActionPrimary,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.detailActionPrimaryText
                    }
                  >
                    MARK AS READ
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    handleUnread(
                      selectedNotification
                    )
                  }
                  style={({ pressed }) => [
                    styles.detailActionButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.detailActionText
                    }
                  >
                    MARK UNREAD
                  </Text>
                </Pressable>
              )}


              <Pressable
                onPress={() =>
                  handleArchive(
                    selectedNotification
                  )
                }
                style={({ pressed }) => [
                  styles.detailActionButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.detailActionText
                  }
                >
                  ARCHIVE
                </Text>
              </Pressable>


              {selectedNotification.actionRoute &&
              selectedNotification.actionLabel ? (
                <Pressable
                  onPress={() =>
                    handleAction(
                      selectedNotification
                    )
                  }
                  style={({ pressed }) => [
                    styles.detailActionButton,
                    styles.detailActionPrimary,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={
                      styles.detailActionPrimaryText
                    }
                  >
                    {
                      selectedNotification.actionLabel
                    }
                  </Text>
                </Pressable>
              ) : null}

            </View>

          </VaultSurface>
        ) : null}


        <VaultSurface
          intensity="subtle"
          style={styles.noteCard}
        >
          <View style={styles.noteAccent} />

          <View>
            <Text style={styles.noteTitle}>
              NOTIFICATION ARCHITECTURE
            </Text>

            <Text style={styles.noteText}>
              Vault1 notifications are designed as
              an operational signal layer. Later,
              Cloud Functions can generate trusted
              alerts automatically from trades,
              investor events, payouts, risk
              thresholds, documents and performance
              changes.
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

  actionButton: {
    minHeight: 42,
    paddingHorizontal: 17,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#493B6D",
    backgroundColor: "#161127",
    justifyContent: "center",
    alignItems: "center",
  },

  actionButtonDisabled: {
    opacity: 0.35,
  },

  actionButtonText: {
    color: "#A993EA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
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


  heroCard: {
    minHeight: 170,
    marginBottom: 18,
    padding: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  heroIcon: {
    width: 66,
    height: 66,
    borderRadius: 17,
    backgroundColor: "#17122A",
    borderWidth: 1,
    borderColor: "#4A3A78",
    alignItems: "center",
    justifyContent: "center",
  },

  heroIconText: {
    color: "#B39AF8",
    fontSize: 28,
    fontWeight: "900",
  },

  heroLabel: {
    color: "#7460B4",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  heroValue: {
    color: "#F4F4F4",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 5,
  },

  heroDescription: {
    color: "#64606D",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },

  heroRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },

  heroMini: {
    minWidth: 130,
  },

  heroMiniLabel: {
    color: "#4B4B4B",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  heroMiniValue: {
    color: "#BEBEBE",
    fontSize: 25,
    fontWeight: "900",
    marginTop: 9,
  },

  heroDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#292929",
    marginHorizontal: 25,
  },

  criticalText: {
    color: "#F18A8A",
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
    color: "#F2F2F2",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 15,
  },

  unreadMetric: {
    color: "#AA94ED",
  },

  metricHint: {
    color: "#4C4C4C",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },


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


  filterCard: {
    padding: 22,
    marginBottom: 18,
  },

  filterHeader: {
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
    letterSpacing: 1.3,
  },

  filterOptions: {
    gap: 7,
    marginTop: 18,
  },

  filterChip: {
    paddingHorizontal: 12,
    minHeight: 33,
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


  notificationRow: {
    minHeight: 112,
    paddingHorizontal: 22,
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#181818",
    flexDirection: "row",
    gap: 15,
  },

  notificationUnread: {
    backgroundColor: "#0D0B12",
  },

  notificationLast: {
    borderBottomWidth: 0,
  },

  notificationPressed: {
    backgroundColor: "#121016",
  },

  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: "#101010",
    borderWidth: 1,
    borderColor: "#282828",
    alignItems: "center",
    justifyContent: "center",
  },

  typeIconUnread: {
    backgroundColor: "#17122A",
    borderColor: "#493A76",
  },

  typeIconText: {
    color: "#8D7DB9",
    fontSize: 13,
    fontWeight: "900",
  },

  notificationBody: {
    flex: 1,
  },

  notificationTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
  },

  titleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A58CF0",
  },

  notificationTitle: {
    color: "#A0A0A0",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  notificationTitleUnread: {
    color: "#E3DDF2",
    fontWeight: "800",
  },

  notificationMessage: {
    color: "#626262",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 8,
    maxWidth: 900,
  },

  priorityBadge: {
    paddingHorizontal: 9,
    minHeight: 24,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: "center",
  },

  priorityText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  notificationMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 10,
  },

  metaText: {
    color: "#464646",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#303030",
  },


  loadingState: {
    minHeight: 240,
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
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#272727",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyIconText: {
    color: "#7661B8",
    fontSize: 22,
    fontWeight: "900",
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
  },


  detailCard: {
    padding: 24,
    marginBottom: 18,
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  detailMessage: {
    color: "#A7A7A7",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    marginTop: 24,
    maxWidth: 1000,
  },

  detailMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#202020",
    paddingTop: 20,
  },

  detailMetaItem: {
    width: "25%",
    minHeight: 65,
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

  detailActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 20,
  },

  detailActionButton: {
    minHeight: 38,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },

  detailActionPrimary: {
    backgroundColor: "#17122A",
    borderColor: "#493A76",
  },

  detailActionText: {
    color: "#777777",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  detailActionPrimaryText: {
    color: "#AA95EC",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },


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
    maxWidth: 950,
  },
});