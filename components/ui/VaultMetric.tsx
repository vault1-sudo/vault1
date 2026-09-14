import React from "react";
import { Text, View, StyleSheet } from "react-native";

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

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E5E5E2",
    borderRadius: 8,
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
    color: "#858581",
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D0D0CC",
  },

  indicatorAccent: {
    backgroundColor: "#6D45D8",
  },

  value: {
    color: "#111111",
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  change: {
    color: "#858581",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 6,
  },
});
