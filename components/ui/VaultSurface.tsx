import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";

type VaultSurfaceProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "subtle" | "medium" | "strong";
};

export default function VaultSurface({
  children,
  style,
}: VaultSurfaceProps) {
  return (
    <View style={[styles.surface, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E2",
    borderRadius: 8,
    overflow: "hidden",
  },
});
