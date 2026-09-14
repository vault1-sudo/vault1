import React from "react";
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  const shadow =
    intensity === "subtle"
      ? styles.shadowSubtle
      : intensity === "strong"
      ? styles.shadowStrong
      : styles.shadowMedium;

  return (
    <View style={[styles.wrapper, shadow, style]}>
      <LinearGradient
        colors={[
          "#1A1227",
          "#100C18",
          "#0C0912",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.surface}
      >
        <LinearGradient
          colors={[
            "rgba(145, 100, 194, 0.10)",
            "rgba(0, 0, 0, 0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ambientHighlight}
        />

        <View style={styles.topHighlight} />
        <View style={styles.innerShadow} pointerEvents="none" />

        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#39274F",

    ...Platform.select({
      web: {
        boxShadow:
          "0 22px 55px rgba(0,0,0,0.50), 0 5px 15px rgba(74,42,105,0.16)",
      },

      default: {
        shadowColor: "#000000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.5,
        shadowRadius: 22,
        elevation: 12,
      },
    }),
  },

  shadowSubtle: {
    ...Platform.select({
      web: {
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.34), 0 3px 9px rgba(74,42,105,0.10)",
      },

      default: {
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 7,
      },
    }),
  },

  shadowMedium: {
    ...Platform.select({
      web: {
        boxShadow:
          "0 22px 55px rgba(0,0,0,0.50), 0 5px 15px rgba(74,42,105,0.16)",
      },

      default: {
        shadowOpacity: 0.5,
        shadowRadius: 22,
        elevation: 12,
      },
    }),
  },

  shadowStrong: {
    ...Platform.select({
      web: {
        boxShadow:
          "0 30px 70px rgba(0,0,0,0.60), 0 8px 22px rgba(91,55,133,0.20)",
      },

      default: {
        shadowOpacity: 0.6,
        shadowRadius: 30,
        elevation: 18,
      },
    }),
  },

  surface: {
    minHeight: 100,
    borderRadius: 13,
    overflow: "hidden",
    position: "relative",
  },

  ambientHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "65%",
    height: "100%",
  },

  topHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "#735195",
    opacity: 0.65,
  },

  innerShadow: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.32)",
    pointerEvents: "none",
  },
});