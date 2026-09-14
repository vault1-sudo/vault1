import React from "react";
import {
  Text,
  View,
  StyleSheet,
  Platform,
} from "react-native";

import VaultSurface from "./VaultSurface";

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
    <VaultSurface
      intensity="medium"
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.label}>
            {label}
          </Text>

          <View
            style={[
              styles.indicator,
              accent && styles.indicatorAccent,
            ]}
          />
        </View>

        <View>
          <Text style={styles.value}>
            {value}
          </Text>

          <Text style={styles.change}>
            {change}
          </Text>
        </View>
      </View>
    </VaultSurface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 145,
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
    color: "#766489",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4C3B59",
  },

  indicatorAccent: {
    backgroundColor: "#B891E6",

    ...Platform.select({
      web: {
        boxShadow: "0 0 12px rgba(184,145,230,0.65)",
      },
      default: {},
    }),
  },

  value: {
    color: "#F5EFF9",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  change: {
    color: "#76687F",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 6,
  },
});