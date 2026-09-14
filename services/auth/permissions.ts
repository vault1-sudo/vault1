import type { Vault1Role } from "./AuthProvider";

export type Vault1Module =
  | "Dashboard"
  | "Portfolio"
  | "Trading"
  | "Assets"
  | "Strategies"
  | "Growth Missions"
  | "Trade Journal"
  | "Capital"
  | "Cashflow"
  | "Transactions"
  | "Performance"
  | "Risk"
  | "Reports"
  | "Investors"
  | "Investor Onboarding"
  | "Payouts"
  | "Documents"
  | "Community Hub"
  | "Live Rooms"
  | "Competitions"
  | "Leaderboard"
  | "Creators"
  | "Rewards"
  | "Audit Logs"
  | "Notifications"
  | "Settings";

export const ALL_VAULT1_MODULES: Vault1Module[] = [
  "Dashboard",
  "Portfolio",
  "Trading",
  "Assets",
  "Strategies",
  "Growth Missions",
  "Trade Journal",
  "Capital",
  "Cashflow",
  "Transactions",
  "Performance",
  "Risk",
  "Reports",
  "Investors",
  "Investor Onboarding",
  "Payouts",
  "Documents",
  "Community Hub",
  "Live Rooms",
  "Competitions",
  "Leaderboard",
  "Creators",
  "Rewards",
  "Audit Logs",
  "Notifications",
  "Settings",
];

/**
 * Safe default access for the five Vault1 roles.
 * Individual users can later carry a `permissions` array in their users/{uid}
 * document. When present, that explicit list overrides the role default.
 */
export const ROLE_PERMISSIONS: Record<Vault1Role, Vault1Module[]> = {
  SUPER_ADMIN: ALL_VAULT1_MODULES,

  ADMIN: [
    "Dashboard",
    "Portfolio",
    "Trading",
    "Assets",
    "Strategies",
    "Growth Missions",
    "Trade Journal",
    "Capital",
    "Cashflow",
    "Transactions",
    "Performance",
    "Risk",
    "Reports",
    "Investors",
    "Documents",
    "Community Hub",
    "Live Rooms",
    "Competitions",
    "Leaderboard",
    "Creators",
    "Rewards",
    "Notifications",
  ],

  MANAGER: [
    "Dashboard",
    "Portfolio",
    "Trading",
    "Assets",
    "Strategies",
    "Growth Missions",
    "Trade Journal",
    "Capital",
    "Cashflow",
    "Transactions",
    "Performance",
    "Risk",
    "Reports",
    "Community Hub",
    "Live Rooms",
    "Leaderboard",
    "Creators",
    "Notifications",
  ],

  VIEWER: [
    "Dashboard",
    "Portfolio",
    "Assets",
    "Strategies",
    "Performance",
    "Risk",
    "Reports",
    "Community Hub",
    "Leaderboard",
    "Creators",
    "Notifications",
  ],

  // Investor-specific portal routing will be enabled when the investor UI is
  // activated. Never expose internal management modules to investors.
  INVESTOR: [],
};

export function canAccessModule(
  role: Vault1Role | undefined | null,
  module: string,
  explicitPermissions?: string[]
): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;

  if (Array.isArray(explicitPermissions)) {
    return explicitPermissions.includes(module);
  }

  return ROLE_PERMISSIONS[role].includes(module as Vault1Module);
}

export function getAccessibleModules(
  role: Vault1Role | undefined | null,
  explicitPermissions?: string[]
): Vault1Module[] {
  if (!role) return [];
  if (role === "SUPER_ADMIN") return [...ALL_VAULT1_MODULES];
  if (Array.isArray(explicitPermissions)) {
    return ALL_VAULT1_MODULES.filter((module) =>
      explicitPermissions.includes(module)
    );
  }
  return [...ROLE_PERMISSIONS[role]];
}
