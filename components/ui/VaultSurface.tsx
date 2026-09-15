import React from "react";
import { Platform, View, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../app/theme/theme";

type VaultSurfaceProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "subtle" | "medium" | "strong";
};

export default function VaultSurface({
  children,
  style,
  intensity = "medium",
}: VaultSurfaceProps) {
  return (
    <View style={[styles.surface, INTENSITY_STYLES[intensity], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
    overflow: "hidden",
  },
  subtle: {
    backgroundColor: COLORS.glassBgSoft,
  },
  medium: {
    backgroundColor: COLORS.glassBg,
  },
  strong: {
    backgroundColor: COLORS.glassBg,
    ...Platform.select({
      web: {
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        backdropFilter: "blur(14px)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 22,
        elevation: 8,
      },
    }),
  },
});

const INTENSITY_STYLES: Record<string, ViewStyle> = {
  subtle: styles.subtle,
  medium: styles.medium,
  strong: styles.strong,
};