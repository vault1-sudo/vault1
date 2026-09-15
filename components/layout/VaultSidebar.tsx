import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePathname, useRouter } from "expo-router";

import { useAuth } from "../../services/auth/AuthProvider";
import { canAccessModule } from "../../services/auth/permissions";
import { COLORS, FONT } from "../../app/theme/theme";

type NavigationGroup = {
  section: string;
  items: string[];
};

const navigation: NavigationGroup[] = [
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
      "Investor Onboarding",
      "Payouts",
      "Documents",
    ],
  },
  {
    section: "COMMUNITY",
    items: [
      "Community Hub",
      "Live Rooms",
      "Competitions",
      "Leaderboard",
      "Creators",
      "Rewards",
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
  "Investor Onboarding": "/investor-onboarding",
  Payouts: "/payouts",
  Documents: "/documents",

  "Community Hub": "/community",
  "Live Rooms": "/live-rooms",
  Competitions: "/competitions",
  Leaderboard: "/leaderboard",
  Creators: "/creators",
  Rewards: "/rewards",

  "Audit Logs": "/audit-logs",
  Notifications: "/notifications",
  Settings: "/settings",
};

function SidebarItem({
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
        styles.sidebarItem,
        active && styles.sidebarItemActive,
        pressed && styles.sidebarItemPressed,
      ]}
    >
      {active && <View style={styles.activeRail} />}

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
        numberOfLines={1}
      >
        {label}
      </Text>

      {active && (
        <Text style={styles.activeArrow}>
          ›
        </Text>
      )}
    </Pressable>
  );
}

export default function VaultSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, logout } = useAuth();

  const visibleNavigation = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canAccessModule(
          profile?.role,
          item,
          profile?.permissions
        )
      ),
    }))
    .filter((group) => group.items.length > 0);

  const handleNavigation = (label: string) => {
    const route = routeMap[label];

    if (!route) {
      return;
    }

    if (route === pathname) {
      return;
    }

    router.push(route as any);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Vault1 logout failed:", error);
    }
  };

  const displayName =
    profile?.displayName || "Vault1 User";

  const firstName =
    displayName.split(" ")[0] || "V";

  return (
    <View style={styles.sidebar}>
      {/* BRAND */}
      <Pressable
        onPress={() => router.replace("/dashboard")}
        style={styles.brandContainer}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrap}>
            <Image
              source={require("../../assets/vault1.png")}
              style={styles.brandIcon}
              resizeMode="contain"
            />
          </View>

          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>
              VAULT1
            </Text>

            <Text style={styles.brandSubtitle}>
              WEALTH OS
            </Text>
          </View>
        </View>

        <View style={styles.systemStatus}>
          <View style={styles.systemStatusDot} />

          <Text style={styles.systemStatusText}>
            SYSTEM OPERATIONAL
          </Text>
        </View>
      </Pressable>

      <View style={styles.divider} />

      {/* NAVIGATION */}
      <ScrollView
        style={styles.navigationScroll}
        contentContainerStyle={styles.navigationContent}
        showsVerticalScrollIndicator={false}
      >
        {visibleNavigation.map((group) => (
          <View
            key={group.section}
            style={styles.navGroup}
          >
            <Text style={styles.sectionLabel}>
              {group.section}
            </Text>

            {group.items.map((item) => {
              const route = routeMap[item];

              const active =
                pathname === route ||
                (route !== "/dashboard" &&
                  pathname.startsWith(`${route}/`));

              return (
                <SidebarItem
                  key={item}
                  label={item}
                  active={active}
                  onPress={() =>
                    handleNavigation(item)
                  }
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* USER */}
      <View style={styles.sidebarBottom}>
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <Text
              style={styles.userName}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <Text style={styles.userRole}>
              {profile?.role || "VIEWER"}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Text style={styles.logoutText}>
            SIGN OUT
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 270,
    height: "100%",
    backgroundColor: COLORS.navyMid,
    borderRightWidth: 1,
    borderRightColor: COLORS.navyLine,
    flexShrink: 0,
  },

  brandContainer: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.glassBgSoft,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...Platform.select({
      web: { boxShadow: `0 0 16px ${COLORS.glowTeal}` as any },
      default: {
        shadowColor: COLORS.bull,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },

  brandIcon: {
    width: 32,
    height: 32,
  },

  brandCopy: {
    marginLeft: 12,
  },

  brandName: {
    color: COLORS.ink,
    fontFamily: FONT.extraBold,
    fontSize: 19,
    letterSpacing: 1.2,
  },

  brandSubtitle: {
    color: COLORS.muted,
    fontFamily: FONT.semiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginTop: 2,
  },

  systemStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },

  systemStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.bull,
    marginRight: 8,
  },

  systemStatusText: {
    color: COLORS.muted,
    fontFamily: FONT.semiBold,
    fontSize: 10,
    letterSpacing: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.navyLine,
    marginHorizontal: 18,
  },

  navigationScroll: {
    flex: 1,
  },

  navigationContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 20,
  },

  navGroup: {
    marginBottom: 21,
  },

  sectionLabel: {
    color: COLORS.muted,
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    marginLeft: 11,
    marginBottom: 7,
  },

  sidebarItem: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    borderRadius: 7,
    position: "relative",
    marginBottom: 2,
  },

  sidebarItemActive: {
    backgroundColor: "rgba(15,190,122,0.10)",
  },

  sidebarItemPressed: {
    opacity: 0.65,
  },

  activeRail: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: COLORS.bull,
  },

  sidebarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.navyLine,
    marginRight: 11,
  },

  sidebarDotActive: {
    backgroundColor: COLORS.bull,
  },

  sidebarItemText: {
    flex: 1,
    color: COLORS.muted,
    fontFamily: FONT.medium,
    fontSize: 13,
    letterSpacing: 0.05,
  },

  sidebarItemTextActive: {
    color: COLORS.ink,
    fontFamily: FONT.bold,
  },

  activeArrow: {
    color: COLORS.bull,
    fontFamily: FONT.medium,
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 5,
  },

  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor: COLORS.navyLine,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 17,
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(15,190,122,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },

  userAvatarText: {
    color: COLORS.bull,
    fontFamily: FONT.extraBold,
    fontSize: 13,
  },

  userInfo: {
    flex: 1,
    marginLeft: 10,
  },

  userName: {
    color: COLORS.ink,
    fontFamily: FONT.bold,
    fontSize: 12,
  },

  userRole: {
    color: COLORS.muted,
    fontFamily: FONT.semiBold,
    fontSize: 9,
    letterSpacing: 0.6,
    marginTop: 2,
  },

  logoutButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.glassBgSoft,
  },

  logoutButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  logoutText: {
    color: COLORS.muted,
    fontFamily: FONT.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
});