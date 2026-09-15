import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { COLORS, FONT } from "../../app/theme/theme";

type VaultMetricProps = {
  label: string;
  value: string;
  change: string;
  accent?: boolean;
};

export default function VaultMetric({
  label,
  value,
  change,
  accent = false,
}: VaultMetricProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label}>{label}</Text>

          <View
            style={[
              styles.indicator,
              accent && styles.indicatorAccent,
            ]}
          />
        </View>

        <View>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.change}>{change}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 138,

    backgroundColor: COLORS.glassBg,

    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 12,
  },

  content: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    color: COLORS.muted,
    fontFamily: FONT.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.navyLine,
  },

  indicatorAccent: {
    backgroundColor: COLORS.bull,
  },

  value: {
    color: COLORS.ink,
    fontFamily: FONT.bold,
    fontSize: 32,
    letterSpacing: -0.8,
  },

  change: {
    color: COLORS.muted,
    fontFamily: FONT.regular,
    fontSize: 12,
    marginTop: 6,
  },
});