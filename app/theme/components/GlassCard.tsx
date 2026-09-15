/**
 * <GlassCard> — the frosted panel with the dual counter-
 * rotating teal/blue light-ring and subtle breathing scale,
 * used for the login card. Wrap any block of page content in
 * this to get the same "premium panel" look everywhere:
 * dashboard widgets, settings panels, modals, onboarding
 * steps, etc.
 *
 * Usage:
 *   <GlassCard style={{ maxWidth: 460 }}>
 *     <Text>Anything goes here</Text>
 *   </GlassCard>
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, GLASS } from "../theme";

export function GlassCard({
  children,
  style,
  topAccent = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  topAccent?: boolean;
}) {
  const breath = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringRotate2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: GLASS.breathDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: GLASS.breathDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const ring1 = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: GLASS.ringSpinDurationPrimary,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const ring2 = Animated.loop(
      Animated.timing(ringRotate2, {
        toValue: 1,
        duration: GLASS.ringSpinDurationSecondary,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    breathLoop.start();
    ring1.start();
    ring2.start();
    return () => {
      breathLoop.stop();
      ring1.stop();
      ring2.stop();
    };
  }, [breath, ringRotate, ringRotate2]);

  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.006] });
  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const spinReverse = ringRotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Animated.View
        pointerEvents="none"
        style={[styles.ringWrap2, { transform: [{ rotate: spinReverse }] }]}
      >
        <LinearGradient
          colors={[COLORS.accentBlue, "rgba(59,130,246,0)", COLORS.bull, "rgba(15,190,122,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ringGradient2}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[styles.ringWrap, { transform: [{ rotate: spin }] }]}
      >
        <LinearGradient
          colors={[COLORS.bull, "rgba(15,190,122,0)", COLORS.accentBlue, "rgba(59,130,246,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ringGradient}
        />
      </Animated.View>

      <View style={[styles.card, style]}>
        {topAccent && <View style={styles.topAccent} />}
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ringWrap: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: GLASS.cardRadius + 6,
    opacity: GLASS.ringGlowOpacityPrimary,
  },
  ringGradient: {
    flex: 1,
    borderRadius: GLASS.cardRadius + 6,
  },
  ringWrap2: {
    position: "absolute",
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: GLASS.cardRadius + 12,
    opacity: GLASS.ringGlowOpacitySecondary,
  },
  ringGradient2: {
    flex: 1,
    borderRadius: GLASS.cardRadius + 12,
  },
  card: {
    width: "100%",
    borderRadius: GLASS.cardRadius,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glassBg,
    paddingHorizontal: 32,
    paddingVertical: 32,
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0 24px 70px rgba(0,0,0,0.45)",
        backdropFilter: "blur(18px)" as any,
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.35,
        shadowRadius: 28,
        elevation: 10,
      },
    }),
  },
  topAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.bull,
  },
});
