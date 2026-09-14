import React from "react";
import {
  Text,
  View,
  StyleSheet,
} from "react-native";

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

          <Text style={styles.change}>
            {change}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 138,
    backgroundColor: "#111114",
    borderWidth: 1,
    borderColor: "#27272C",
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
    color: "#77777F",
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3A3A42",
  },

  indicatorAccent: {
    backgroundColor: "#8B5CF6",
  },

  value: {
    color: "#F5F5F7",
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  change: {
    color: "#77777F",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
    marginTop: 6,
  },
});