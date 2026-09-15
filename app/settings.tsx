import React, {
  useEffect,
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

import {
  useRouter,
} from "expo-router";

import {
  updateProfile,
} from "firebase/auth";

import VaultSurface from "../components/ui/VaultSurface";

import { FONT, COLORS } from "./theme/theme";

import {
  useAuth,
} from "../services/auth/AuthProvider";

import {
  auth,
} from "../services/firebase/auth";

import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
} from "../services/settings/settingsService";

import {
  UserSettings,
  ThemeMode,
  DefaultCurrency,
  DateFormat,
  NumberFormat,
} from "../types/settings";


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


function OptionButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionButton,
        active && styles.optionButtonActive,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.optionText,
          active && styles.optionTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}


function ToggleRow({
  label,
  description,
  value,
  onPress,
}: {
  label: string;
  description: string;
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleRow,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>
          {label}
        </Text>

        <Text style={styles.toggleDescription}>
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.toggle,
          value && styles.toggleActive,
        ]}
      >
        <View
          style={[
            styles.toggleKnob,
            value && styles.toggleKnobActive,
          ]}
        />
      </View>
    </Pressable>
  );
}


export default function SettingsScreen() {
  const router = useRouter();

  const {
    user,
    profile,
    logout,
  } = useAuth();

  const [settings, setSettings] =
    useState<UserSettings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [resetting, setResetting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [nameSaving, setNameSaving] =
    useState(false);


  const loadSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getUserSettings(user.uid);

      setSettings(data);

      setDisplayName(
        profile?.displayName ||
          user.displayName ||
          ""
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadSettings();
  }, [user?.uid]);


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


  const saveSetting = async (
    updates: Partial<UserSettings>
  ) => {
    if (!user || !settings) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await updateUserSettings(
        user.uid,
        updates
      );

      setSettings((current) =>
        current
          ? {
              ...current,
              ...updates,
            }
          : current
      );

      setSuccess("Settings saved.");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDisplayNameSave =
    async () => {
      const cleanName =
        displayName.trim();

      if (!user) {
        return;
      }

      if (!cleanName) {
        setError(
          "Display name cannot be empty."
        );
        return;
      }

      try {
        setNameSaving(true);
        setError("");
        setSuccess("");

        await updateProfile(
          user,
          {
            displayName: cleanName,
          }
        );

        await updateUserSettings(
          user.uid,
          {}
        );

        setSuccess(
          "Profile name updated."
        );
      } catch (err: any) {
        console.error(err);

        setError(
          err?.message ||
            "Unable to update profile."
        );
      } finally {
        setNameSaving(false);
      }
    };


  const handleReset = async () => {
    if (!user) {
      return;
    }

    try {
      setResetting(true);
      setError("");
      setSuccess("");

      await resetUserSettings(
        user.uid
      );

      const data =
        await getUserSettings(
          user.uid
        );

      setSettings(data);

      setSuccess(
        "Settings restored to defaults."
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to reset settings."
      );
    } finally {
      setResetting(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.message ||
          "Unable to sign out."
      );
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator />

        <Text style={styles.loadingPageText}>
          Loading Vault1 settings...
        </Text>
      </View>
    );
  }


  return (
    <View style={styles.page}>

      <View style={styles.sidebar} pointerEvents="none">

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
                  item === "Settings";

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
              Settings
            </Text>

            <Text
              style={styles.pageSubtitle}
            >
              Configure your Vault1 operating
              environment and access posture.
            </Text>
          </View>


          <View style={styles.headerActions}>

            <Pressable
              onPress={loadSettings}
              style={({ pressed }) => [
                styles.headerButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.headerButtonText}
              >
                REFRESH
              </Text>
            </Pressable>

          </View>

        </View>


        {error ? (
          <VaultSurface
            intensity="medium"
            style={styles.errorCard}
          >
            <Text style={styles.errorTitle}>
              SETTINGS ERROR
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
            <View
              style={styles.successDot}
            />

            <Text style={styles.successText}>
              {success}
            </Text>
          </VaultSurface>
        ) : null}


        <View style={styles.topGrid}>

          <VaultSurface
            intensity="strong"
            style={styles.identityCard}
          >

            <Text style={styles.cardEyebrow}>
              ACCOUNT IDENTITY
            </Text>

            <Text style={styles.cardTitle}>
              Profile
            </Text>

            <Text style={styles.cardDescription}>
              Your Vault1 account identity and
              authenticated session details.
            </Text>


            <View style={styles.fieldBlock}>

              <Text style={styles.fieldLabel}>
                DISPLAY NAME
              </Text>

              <View style={styles.inputRow}>

                <TextInput
                  value={displayName}
                  onChangeText={
                    setDisplayName
                  }
                  placeholder="Your name"
                  placeholderTextColor="#484848"
                  style={styles.input}
                />

                <Pressable
                  onPress={
                    handleDisplayNameSave
                  }
                  disabled={nameSaving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    nameSaving &&
                      styles.disabledButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  {nameSaving ? (
                    <ActivityIndicator
                      size="small"
                    />
                  ) : (
                    <Text
                      style={styles.saveButtonText}
                    >
                      SAVE
                    </Text>
                  )}
                </Pressable>

              </View>

            </View>


            <View style={styles.identityMeta}>

              <View style={styles.identityMetaItem}>
                <Text
                  style={styles.identityLabel}
                >
                  EMAIL
                </Text>

                <Text
                  style={styles.identityValue}
                  numberOfLines={1}
                >
                  {user?.email || "—"}
                </Text>
              </View>


              <View style={styles.identityMetaItem}>
                <Text
                  style={styles.identityLabel}
                >
                  ROLE
                </Text>

                <Text
                  style={styles.roleValue}
                >
                  {profile?.role || "VIEWER"}
                </Text>
              </View>

            </View>

          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={styles.accessCard}
          >

            <Text style={styles.cardEyebrow}>
              ACCESS POSTURE
            </Text>

            <Text style={styles.cardTitle}>
              Permissions
            </Text>

            <Text style={styles.cardDescription}>
              Vault1 access is role-driven. Your
              current role is shown below.
            </Text>


            <View style={styles.permissionRow}>
              <View>
                <Text style={styles.permissionTitle}>
                  CURRENT ROLE
                </Text>

                <Text style={styles.permissionValue}>
                  {profile?.role || "VIEWER"}
                </Text>
              </View>

              <View style={styles.accessBadge}>
                <Text style={styles.accessBadgeText}>
                  ACTIVE
                </Text>
              </View>
            </View>


            <View style={styles.permissionList}>

              <Text style={styles.permissionItem}>
                • Authenticated Vault1 session
              </Text>

              <Text style={styles.permissionItem}>
                • Personal data isolation
              </Text>

              <Text style={styles.permissionItem}>
                • Role-controlled application access
              </Text>

              <Text style={styles.permissionItem}>
                • Immutable audit history
              </Text>

            </View>

          </VaultSurface>

        </View>


        {settings ? (
          <>
            <VaultSurface
              intensity="medium"
              style={styles.sectionCard}
            >

              <View style={styles.sectionHeader}>

                <View>
                  <Text style={styles.cardEyebrow}>
                    DISPLAY
                  </Text>

                  <Text style={styles.cardTitle}>
                    Operating Preferences
                  </Text>

                  <Text
                    style={styles.cardDescription}
                  >
                    Configure how Vault1 presents
                    financial information.
                  </Text>
                </View>

                {saving ? (
                  <ActivityIndicator />
                ) : null}

              </View>


              <View style={styles.optionSection}>

                <Text style={styles.optionLabel}>
                  THEME
                </Text>

                <View style={styles.optionGroup}>
                  {(
                    [
                      "OBSIDIAN",
                      "SYSTEM",
                    ] as ThemeMode[]
                  ).map((item) => (
                    <OptionButton
                      key={item}
                      label={item}
                      active={
                        settings.theme === item
                      }
                      onPress={() =>
                        saveSetting({
                          theme: item,
                        })
                      }
                    />
                  ))}
                </View>

              </View>


              <View style={styles.optionSection}>

                <Text style={styles.optionLabel}>
                  DEFAULT CURRENCY
                </Text>

                <View style={styles.optionGroup}>
                  {(
                    [
                      "INR",
                      "USD",
                      "EUR",
                      "GBP",
                    ] as DefaultCurrency[]
                  ).map((item) => (
                    <OptionButton
                      key={item}
                      label={item}
                      active={
                        settings.defaultCurrency ===
                        item
                      }
                      onPress={() =>
                        saveSetting({
                          defaultCurrency:
                            item,
                        })
                      }
                    />
                  ))}
                </View>

              </View>


              <View style={styles.optionSection}>

                <Text style={styles.optionLabel}>
                  DATE FORMAT
                </Text>

                <View style={styles.optionGroup}>
                  {(
                    [
                      "DD MMM YYYY",
                      "DD/MM/YYYY",
                      "MM/DD/YYYY",
                      "YYYY-MM-DD",
                    ] as DateFormat[]
                  ).map((item) => (
                    <OptionButton
                      key={item}
                      label={item}
                      active={
                        settings.dateFormat ===
                        item
                      }
                      onPress={() =>
                        saveSetting({
                          dateFormat: item,
                        })
                      }
                    />
                  ))}
                </View>

              </View>


              <View style={styles.optionSection}>

                <Text style={styles.optionLabel}>
                  NUMBER FORMAT
                </Text>

                <View style={styles.optionGroup}>
                  {(
                    [
                      "INDIAN",
                      "INTERNATIONAL",
                    ] as NumberFormat[]
                  ).map((item) => (
                    <OptionButton
                      key={item}
                      label={item}
                      active={
                        settings.numberFormat ===
                        item
                      }
                      onPress={() =>
                        saveSetting({
                          numberFormat: item,
                        })
                      }
                    />
                  ))}
                </View>

              </View>

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.sectionCard}
            >

              <View style={styles.sectionHeader}>

                <View>
                  <Text style={styles.cardEyebrow}>
                    SIGNALS
                  </Text>

                  <Text style={styles.cardTitle}>
                    Notification Controls
                  </Text>

                  <Text
                    style={styles.cardDescription}
                  >
                    Decide which operational signals
                    reach your Vault1 attention layer.
                  </Text>
                </View>

              </View>


              <ToggleRow
                label="NOTIFICATIONS"
                description="Enable Vault1 operational notifications."
                value={
                  settings.notificationsEnabled
                }
                onPress={() =>
                  saveSetting({
                    notificationsEnabled:
                      !settings.notificationsEnabled,
                  })
                }
              />

              <ToggleRow
                label="HIGH PRIORITY ALERTS"
                description="Surface important portfolio, risk and investor events."
                value={
                  settings.highPriorityAlerts
                }
                onPress={() =>
                  saveSetting({
                    highPriorityAlerts:
                      !settings.highPriorityAlerts,
                  })
                }
              />

              <ToggleRow
                label="CRITICAL ALERTS"
                description="Surface critical security and operational events."
                value={
                  settings.criticalAlerts
                }
                onPress={() =>
                  saveSetting({
                    criticalAlerts:
                      !settings.criticalAlerts,
                  })
                }
              />

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.sectionCard}
            >

              <View style={styles.sectionHeader}>

                <View>
                  <Text style={styles.cardEyebrow}>
                    DATA DISPLAY
                  </Text>

                  <Text style={styles.cardTitle}>
                    Financial Visibility
                  </Text>

                  <Text
                    style={styles.cardDescription}
                  >
                    Control presentation of sensitive
                    portfolio information inside the UI.
                  </Text>
                </View>

              </View>


              <ToggleRow
                label="COMPACT TABLES"
                description="Use tighter table presentation across register screens."
                value={
                  settings.compactTables
                }
                onPress={() =>
                  saveSetting({
                    compactTables:
                      !settings.compactTables,
                  })
                }
              />

              <ToggleRow
                label="SHOW PORTFOLIO VALUES"
                description="Display current portfolio values throughout Vault1."
                value={
                  settings.showPortfolioValues
                }
                onPress={() =>
                  saveSetting({
                    showPortfolioValues:
                      !settings.showPortfolioValues,
                  })
                }
              />

              <ToggleRow
                label="SHOW P&L PERCENTAGES"
                description="Display percentage returns beside monetary P&L."
                value={
                  settings.showPnLPercentages
                }
                onPress={() =>
                  saveSetting({
                    showPnLPercentages:
                      !settings.showPnLPercentages,
                  })
                }
              />

            </VaultSurface>


            <VaultSurface
              intensity="medium"
              style={styles.securityCard}
            >

              <Text style={styles.cardEyebrow}>
                SECURITY
              </Text>

              <Text style={styles.cardTitle}>
                Session Control
              </Text>

              <Text style={styles.cardDescription}>
                Manage the current authenticated
                Vault1 session.
              </Text>


              <View style={styles.securityGrid}>

                <View style={styles.securityItem}>
                  <Text
                    style={styles.securityLabel}
                  >
                    AUTHENTICATION
                  </Text>

                  <Text
                    style={styles.securityValue}
                  >
                    FIREBASE AUTH
                  </Text>
                </View>


                <View style={styles.securityItem}>
                  <Text
                    style={styles.securityLabel}
                  >
                    SESSION
                  </Text>

                  <Text
                    style={styles.securityValue}
                  >
                    ACTIVE
                  </Text>
                </View>


                <View style={styles.securityItem}>
                  <Text
                    style={styles.securityLabel}
                  >
                    DATA ISOLATION
                  </Text>

                  <Text
                    style={styles.securityValue}
                  >
                    USER SCOPED
                  </Text>
                </View>

              </View>


              <View style={styles.securityActions}>

                <Pressable
                  onPress={handleReset}
                  disabled={resetting}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    resetting &&
                      styles.disabledButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  {resetting ? (
                    <ActivityIndicator
                      size="small"
                    />
                  ) : (
                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      RESET PREFERENCES
                    </Text>
                  )}
                </Pressable>


                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed &&
                      styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={styles.logoutButtonText}
                  >
                    SIGN OUT
                  </Text>
                </Pressable>

              </View>

            </VaultSurface>


            <VaultSurface
              intensity="subtle"
              style={styles.noteCard}
            >
              <View style={styles.noteAccent} />

              <View>
                <Text style={styles.noteTitle}>
                  VAULT1 CONTROL ARCHITECTURE
                </Text>

                <Text style={styles.noteText}>
                  Settings are intentionally separated
                  from authorization. Preferences control
                  the user experience; permissions remain
                  governed by the authenticated Vault1
                  role and Firestore security rules.
                </Text>
              </View>
            </VaultSurface>
          </>
        ) : null}

      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({

  page: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
  },

  loadingPage: {
    flex: 1,
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingPageText: {
    color: COLORS.muted,
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },


  sidebar: {
    display: "none",
    width: 250,
    backgroundColor: COLORS.glassBg,
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
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3B2B68",
    alignItems: "center",
    justifyContent: "center",
  },

  brandMarkText: {
    color: COLORS.bull,
    fontSize: 13,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  brand: {
    color: "#3F3F3B",
    fontSize: 17,
    fontFamily: FONT.black,
    letterSpacing: 3,
  },

  brandSub: {
    color: COLORS.muted,
    fontSize: 7,
    fontFamily: FONT.extraBold,
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
    color: COLORS.muted,
    fontSize: 9,
    fontFamily: FONT.black,
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
    backgroundColor: COLORS.glassBg,
    borderLeftColor: "#8B6FE8",
  },

  navItemPressed: {
    opacity: 0.72,
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.glassBg,
  },

  navDotActive: {
    backgroundColor: "#9C82F4",
  },

  navText: {
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: FONT.bold,
  },

  navTextActive: {
    color: COLORS.muted,
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
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  footerUser: {
    color: "#A0A0A0",
    fontSize: 11,
    fontFamily: FONT.bold,
    marginTop: 7,
  },

  footerRole: {
    color: "#66549A",
    fontSize: 8,
    fontFamily: FONT.black,
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
    fontFamily: FONT.black,
    letterSpacing: 2.5,
    marginBottom: 9,
  },

  pageTitle: {
    color: "#3F3F3B",
    fontSize: 44,
    fontFamily: FONT.black,
    letterSpacing: -1.5,
  },

  pageSubtitle: {
    color: "#626262",
    fontSize: 14,
    fontFamily: FONT.semiBold,
    marginTop: 9,
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
  },

  headerButton: {
    minHeight: 42,
    paddingHorizontal: 19,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#302A43",
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonText: {
    color: "#A28BEA",
    fontSize: 10,
    fontFamily: FONT.black,
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


  errorCard: {
    padding: 20,
    marginBottom: 18,
    borderColor: "#502A2A",
  },

  errorTitle: {
    color: "#B24A57",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  errorText: {
    color: "#8A6666",
    fontSize: 12,
    fontFamily: FONT.semiBold,
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
    fontFamily: FONT.bold,
  },


  topGrid: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 18,
  },

  identityCard: {
    flex: 1.25,
    minHeight: 330,
    padding: 25,
  },

  accessCard: {
    flex: 0.75,
    minHeight: 330,
    padding: 25,
  },

  cardEyebrow: {
    color: "#735DB2",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.8,
  },

  cardTitle: {
    color: "#4A4A46",
    fontSize: 23,
    fontFamily: FONT.black,
    marginTop: 7,
  },

  cardDescription: {
    color: "#5D5D5D",
    fontSize: 12,
    fontFamily: FONT.semiBold,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 720,
  },


  fieldBlock: {
    marginTop: 28,
  },

  fieldLabel: {
    color: "#4E4E4E",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  inputRow: {
    flexDirection: "row",
    gap: 9,
  },

  input: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#282828",
    backgroundColor: COLORS.glassBg,
    color: COLORS.muted,
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },

  saveButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#4A3976",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#AB96ED",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  disabledButton: {
    opacity: 0.45,
  },


  identityMeta: {
    flexDirection: "row",
    gap: 40,
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#202020",
  },

  identityMetaItem: {
    flex: 1,
  },

  identityLabel: {
    color: "#484848",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.3,
  },

  identityValue: {
    color: "#A6A6A6",
    fontSize: 12,
    fontFamily: FONT.bold,
    marginTop: 7,
  },

  roleValue: {
    color: "#A48FE7",
    fontSize: 12,
    fontFamily: FONT.black,
    letterSpacing: 0.7,
    marginTop: 7,
  },


  permissionRow: {
    marginTop: 28,
    padding: 17,
    borderWidth: 1,
    borderColor: "#292929",
    backgroundColor: COLORS.glassBg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  permissionTitle: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.3,
  },

  permissionValue: {
    color: "#D7D0E9",
    fontSize: 15,
    fontFamily: FONT.black,
    marginTop: 6,
  },

  accessBadge: {
    paddingHorizontal: 9,
    minHeight: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3C3260",
    backgroundColor: COLORS.glassBg,
    justifyContent: "center",
  },

  accessBadgeText: {
    color: "#9B87D7",
    fontSize: 7,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  permissionList: {
    marginTop: 21,
    gap: 10,
  },

  permissionItem: {
    color: "#606060",
    fontSize: 11,
    fontFamily: FONT.semiBold,
    lineHeight: 17,
  },


  sectionCard: {
    padding: 25,
    marginBottom: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },

  optionSection: {
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
    paddingTop: 19,
    marginTop: 18,
  },

  optionLabel: {
    color: "#4B4B4B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  optionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  optionButton: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#282828",
    backgroundColor: COLORS.glassBg,
    justifyContent: "center",
    alignItems: "center",
  },

  optionButtonActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#4B3A78",
  },

  optionText: {
    color: "#5B5B5B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
  },

  optionTextActive: {
    color: "#AE99EF",
  },


  toggleRow: {
    minHeight: 76,
    borderTopWidth: 1,
    borderTopColor: "#1E1E1E",
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 25,
  },

  rowPressed: {
    opacity: 0.72,
  },

  toggleCopy: {
    flex: 1,
  },

  toggleLabel: {
    color: "#C8C8C8",
    fontSize: 12,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.4,
  },

  toggleDescription: {
    color: COLORS.muted,
    fontSize: 11,
    fontFamily: FONT.semiBold,
    lineHeight: 17,
    marginTop: 5,
  },

  toggle: {
    width: 46,
    height: 25,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: COLORS.glassBg,
    padding: 3,
    justifyContent: "center",
  },

  toggleActive: {
    backgroundColor: COLORS.glassBg,
    borderColor: "#514080",
  },

  toggleKnob: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: COLORS.glassBg,
  },

  toggleKnobActive: {
    backgroundColor: "#A58CF0",
    alignSelf: "flex-end",
  },


  securityCard: {
    padding: 25,
    marginBottom: 18,
  },

  securityGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 25,
  },

  securityItem: {
    flex: 1,
    minHeight: 80,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.navyLine,
    backgroundColor: COLORS.glassBg,
  },

  securityLabel: {
    color: "#484848",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.2,
  },

  securityValue: {
    color: "#A58DE8",
    fontSize: 11,
    fontFamily: FONT.black,
    marginTop: 10,
  },

  securityActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  secondaryButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#302A43",
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#8E7ABF",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  logoutButton: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#502A2A",
    backgroundColor: COLORS.glassBg,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutButtonText: {
    color: "#D47E7E",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
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
    fontFamily: FONT.black,
    letterSpacing: 1.5,
  },

  noteText: {
    color: "#55505E",
    fontSize: 11,
    fontFamily: FONT.semiBold,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 950,
  },
});