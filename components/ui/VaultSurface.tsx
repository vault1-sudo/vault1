import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";

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
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "#27272C",
    borderRadius: 8,
    overflow: "hidden",
  },
});