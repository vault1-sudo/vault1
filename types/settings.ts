export type ThemeMode =
  | "OBSIDIAN"
  | "SYSTEM";

export type DefaultCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP";

export type DateFormat =
  | "DD MMM YYYY"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY-MM-DD";

export type NumberFormat =
  | "INDIAN"
  | "INTERNATIONAL";

export type UserSettings = {
  id: string;
  userId: string;

  theme: ThemeMode;
  defaultCurrency: DefaultCurrency;
  dateFormat: DateFormat;
  numberFormat: NumberFormat;

  notificationsEnabled: boolean;
  highPriorityAlerts: boolean;
  criticalAlerts: boolean;

  compactTables: boolean;
  showPortfolioValues: boolean;
  showPnLPercentages: boolean;

  createdAt?: any;
  updatedAt?: any;
};

export type SettingsUpdate = Partial<
  Omit<
    UserSettings,
    "id" | "userId" | "createdAt" | "updatedAt"
  >
>;