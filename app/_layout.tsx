import React from "react";
import {
  ActivityIndicator,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Redirect,
  Stack,
  usePathname,
} from "expo-router";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { canAccessModule } from "../services/auth/permissions";
import VaultSidebar from "../components/layout/VaultSidebar";

import "../styles/vault1.css";

const routeModuleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/portfolio": "Portfolio",
  "/trading": "Trading",
  "/assets": "Assets",
  "/strategies": "Strategies",
  "/growth-missions": "Growth Missions",
  "/trade-journal": "Trade Journal",

  "/capital": "Capital",
  "/cashflow": "Cashflow",
  "/transactions": "Transactions",

  "/performance": "Performance",
  "/risk": "Risk",
  "/reports": "Reports",

  "/investors": "Investors",
  "/investor-onboarding": "Investor Onboarding",
  "/payouts": "Payouts",
  "/documents": "Documents",

  "/community": "Community Hub",
  "/live-rooms": "Live Rooms",
  "/competitions": "Competitions",
  "/leaderboard": "Leaderboard",
  "/creators": "Creators",
  "/rewards": "Rewards",

  "/audit-logs": "Audit Logs",
  "/notifications": "Notifications",
  "/settings": "Settings",
};

function RouteAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const isAuthRoute =
    pathname === "/login" || pathname === "/register";

  if (!user) {
    return isAuthRoute ? (
      <>{children}</>
    ) : (
      <Redirect href="/login" />
    );
  }

  if (isAuthRoute) {
    return <Redirect href="/dashboard" />;
  }

  const requiredModule = routeModuleMap[pathname];

  if (
    requiredModule &&
    !canAccessModule(
      profile?.role,
      requiredModule,
      profile?.permissions
    )
  ) {
    return <Redirect href="/dashboard" />;
  }

  if (!requiredModule && pathname !== "/") {
    return <Redirect href="/dashboard" />;
  }

  return <>{children}</>;
}

function AppShell() {
  const { user } = useAuth();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  const isAuthRoute =
    pathname === "/login" || pathname === "/register";

  /*
   * Desktop/tablet shell.
   *
   * Sidebar is intentionally hidden on narrow screens so the
   * application remains usable on mobile.
   */
  const showSidebar =
    !!user &&
    !isAuthRoute &&
    width >= 1000;

  return (
    <View style={styles.appContainer}>
      {showSidebar && <VaultSidebar />}

      <View style={styles.pageContainer}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "#FFFFFF",
            },
          }}
        />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteAccessGuard>
        <AppShell />
      </RouteAccessGuard>
    </AuthProvider>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },

  appContainer: {
    flex: 1,
    flexDirection: "row" as const,
    backgroundColor: "#FFFFFF",
    minHeight: "100%" as any,
  },

  pageContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#FFFFFF",
  },
};