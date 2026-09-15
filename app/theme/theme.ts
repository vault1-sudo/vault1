/**
 * VAULT1 — SHARED THEME
 * ---------------------------------------------------------
 * One source of truth for colors, fonts and glass tokens.
 */

import {
  useFonts,
  Inter_100Thin,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

export const COLORS = {
  bull: "#0FBE7A",
  bear: "#E5455C",
  accentBlue: "#3B82F6",

  navyDeep: "#080D18",
  navyMid: "#0E1626",
  navyLine: "#1D2A44",

  ink: "#F8FAFC",
  muted: "#8592A6",

  glassBg: "rgba(17,26,46,0.55)",
  glassBgSoft: "rgba(255,255,255,0.035)",
  glassBorder: "rgba(255,255,255,0.09)",
  glowTeal: "rgba(15,190,122,0.45)",
  glowBlue: "rgba(59,130,246,0.35)",
};

export const FONT = {
  thin: "Inter_100Thin",
  extraLight: "Inter_200ExtraLight",
  light: "Inter_300Light",
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
};

export function useAppFonts() {
  const [loaded] = useFonts({
    Inter_100Thin,
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });
  return loaded;
}

export const GLASS = {
  cardRadius: 18,
  ringGlowOpacityPrimary: 0.55,
  ringGlowOpacitySecondary: 0.28,
  breathDuration: 3400,
  ringSpinDurationPrimary: 9000,
  ringSpinDurationSecondary: 14000,
  shimmerDuration: 1600,
  shimmerPause: 2200,
};
