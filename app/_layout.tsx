import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";

import { AuthProvider, useAuth } from "../services/auth/AuthProvider";
import { canAccessModule } from "../services/auth/permissions";

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

function RouteAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const isAuthRoute =
    pathname === "/login" || pathname === "/register";

  if (!user) {
    return isAuthRoute ? <>{children}</> : <Redirect href="/login" />;
  }

  if (isAuthRoute) {
    return <Redirect href="/dashboard" />;
  }

  const requiredModule = routeModuleMap[pathname];

  // Unknown authenticated routes are denied by default rather than exposed.
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteAccessGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "none",
            contentStyle: {
              backgroundColor: "#FFFFFF",
            },
          }}
        />
      </RouteAccessGuard>
    </AuthProvider>
  );
}
