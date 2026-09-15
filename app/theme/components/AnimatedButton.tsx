/**
 * <AnimatedButton> — the primary teal gradient button with a
 * looping shimmer sweep, press-in scale spring, and a spinner
 * state for loading. Use this for every primary action across
 * the site: sign in, submit, confirm trade, save changes, etc.
 *
 * Usage:
 *   <AnimatedButton label="ENTER VAULT1" loading={loading} onPress={handleLogin} />
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONT, GLASS } from "../theme";

export function AnimatedButton({
  label,
  loadingLabel,
  loading = false,
  disabled = false,
  onPress,
}: {
  label: string;
  loadingLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const buttonScale = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const shimmerLoop = () => {
      shimmerX.setValue(-1);
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: GLASS.shimmerDuration,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setTimeout(shimmerLoop, GLASS.shimmerPause);
      });
    };
    shimmerLoop();
  }, [shimmerX, spin]);

  const shimmerTranslate = shimmerX.interpolate({ inputRange: [-1, 1], outputRange: [-220, 220] });
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.985,
      useNativeDriver: true,
      speed: 30,
      bounciness: 3,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        style={styles.outer}
      >
        <LinearGradient
          colors={[COLORS.bull, "#0A9A63"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }, { rotate: "20deg" }] },
            ]}
          />
          <Text style={styles.text}>{loading ? loadingLabel ?? "PLEASE WAIT..." : label}</Text>
          {loading ? (
            <Animated.View style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]} />
          ) : (
            <Text style={styles.arrow}>→</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 10,
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0 14px 32px rgba(15,190,122,0.35)" },
      default: {
        shadowColor: COLORS.bull,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  button: {
    height: 56,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 14,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: -20,
    bottom: -20,
    width: 60,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  text: {
    color: COLORS.glassBg,
    fontSize: 11,
    fontFamily: FONT.black,
    letterSpacing: 1.6,
  },
  arrow: {
    color: COLORS.glassBg,
    fontSize: 18,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
    borderTopColor: COLORS.glassBg,
  },
});
