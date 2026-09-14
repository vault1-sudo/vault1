import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firestore";

import {
  UserSettings,
  SettingsUpdate,
} from "../../types/settings";

const SETTINGS_COLLECTION = "userSettings";

function getSettingsRef(userId: string) {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  return doc(
    db,
    SETTINGS_COLLECTION,
    userId
  );
}

const defaultSettings: Omit<
  UserSettings,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  theme: "OBSIDIAN",
  defaultCurrency: "INR",
  dateFormat: "DD MMM YYYY",
  numberFormat: "INDIAN",

  notificationsEnabled: true,
  highPriorityAlerts: true,
  criticalAlerts: true,

  compactTables: false,
  showPortfolioValues: true,
  showPnLPercentages: true,
};

export async function getUserSettings(
  userId: string
): Promise<UserSettings> {
  const settingsRef = getSettingsRef(userId);

  const snapshot = await getDoc(settingsRef);

  if (snapshot.exists()) {
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as UserSettings;
  }

  const newSettings = {
    userId,
    ...defaultSettings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(settingsRef, newSettings);

  return {
    id: userId,
    userId,
    ...defaultSettings,
  };
}

export async function updateUserSettings(
  userId: string,
  updates: SettingsUpdate
): Promise<void> {
  const settingsRef = getSettingsRef(userId);

  if (Object.keys(updates).length === 0) {
    return;
  }

  await setDoc(
    settingsRef,
    {
      userId,
      ...updates,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export async function resetUserSettings(
  userId: string
): Promise<void> {
  const settingsRef = getSettingsRef(userId);

  await setDoc(
    settingsRef,
    {
      userId,
      ...defaultSettings,
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}

export function getThemeLabel(
  theme: UserSettings["theme"]
) {
  switch (theme) {
    case "OBSIDIAN":
      return "Obsidian";

    case "SYSTEM":
      return "System";

    default:
      return theme;
  }
}

export function getCurrencyLabel(
  currency: UserSettings["defaultCurrency"]
) {
  switch (currency) {
    case "INR":
      return "Indian Rupee";

    case "USD":
      return "US Dollar";

    case "EUR":
      return "Euro";

    case "GBP":
      return "British Pound";

    default:
      return currency;
  }
}