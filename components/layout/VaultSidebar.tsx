import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePathname, useRouter } from "expo-router";

import { useAuth } from "../../services/auth/AuthProvider";
import { canAccessModule } from "../../services/auth/permissions";

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
          <Image
            source={require("../../assets/vault1.png")}
            style={styles.brandIcon}
            resizeMode="contain"
          />

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
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#E5E5E2",
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

  brandIcon: {
    width: 42,
    height: 42,
  },

  brandCopy: {
    marginLeft: 12,
  },

  brandName: {
    color: "#111111",
    fontFamily: "Inter",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  brandSubtitle: {
    color: "#858581",
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "600",
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
    backgroundColor: "#21864B",
    marginRight: 8,
  },

  systemStatusText: {
    color: "#858581",
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.7,
  },

  divider: {
    height: 1,
    backgroundColor: "#EAEAE7",
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
    color: "#A0A09B",
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
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
    backgroundColor: "#F3F0FB",
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
    backgroundColor: "#6D45D8",
  },

  sidebarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9C9C5",
    marginRight: 11,
  },

  sidebarDotActive: {
    backgroundColor: "#6D45D8",
  },

  sidebarItemText: {
    flex: 1,
    color: "#5F5F5B",
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "500",
    letterSpacing: 0.05,
  },

  sidebarItemTextActive: {
    color: "#4E2AA8",
    fontWeight: "700",
  },

  activeArrow: {
    color: "#6D45D8",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 20,
    marginLeft: 5,
  },

  sidebarBottom: {
    borderTopWidth: 1,
    borderTopColor: "#EAEAE7",
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
    backgroundColor: "#F0EBFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDD4F2",
  },

  userAvatarText: {
    color: "#5A35B5",
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
  },

  userInfo: {
    flex: 1,
    marginLeft: 10,
  },

  userName: {
    color: "#222222",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
  },

  userRole: {
    color: "#8A8A85",
    fontFamily: "Inter",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.6,
    marginTop: 2,
  },

  logoutButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: "#E5E5E2",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAF9",
  },

  logoutButtonPressed: {
    backgroundColor: "#F3F3F1",
  },

  logoutText: {
    color: "#666662",
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
