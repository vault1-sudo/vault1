/**
 * <AmbientGlow /> and <FloatingParticles /> — drop these two
 * into any screen's outer wrapper to get the same moving
 * teal/blue glow + drifting embers used on the login page.
 *
 * Usage:
 *   <View style={{ flex: 1, backgroundColor: COLORS.navyDeep }}>
 *     <AmbientGlow />
 *     <FloatingParticles />
 *     ...your actual page content on top...
 *   </View>
 */

import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { COLORS } from "../theme";

export function AmbientGlow() {
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const l1 = makeLoop(float1, 7000);
    const l2 = makeLoop(float2, 9000);
    const l3 = makeLoop(float3, 11000);
    l1.start();
    l2.start();
    l3.start();
    return () => {
      l1.stop();
      l2.stop();
      l3.stop();
    };
  }, [float1, float2, float3]);

  const t1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const t2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, -55] });
  const t3 = float3.interpolate({ inputRange: [0, 1], outputRange: [-30, 20] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.glowBlob,
          {
            top: -120,
            left: -100,
            backgroundColor: COLORS.glowTeal,
            transform: [{ translateX: t1 }, { translateY: t2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowBlob,
          {
            bottom: -160,
            right: -120,
            backgroundColor: COLORS.glowBlue,
            transform: [{ translateX: t2 }, { translateY: t3 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowBlobSmall,
          {
            top: "40%",
            left: "38%",
            backgroundColor: COLORS.glowTeal,
            transform: [{ translateX: t3 }, { translateY: t1 }],
          },
        ]}
      />
    </View>
  );
}

export function FloatingParticles({ count = 16 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }).map(() => ({
      anim: new Animated.Value(0),
      left: Math.random() * 100,
      size: 2 + Math.random() * 3,
      duration: 5000 + Math.random() * 5000,
      delay: Math.random() * 4000,
      blue: Math.random() > 0.6,
    }))
  ).current;

  useEffect(() => {
    const loops = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [particles]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [60, -460],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.12, 0.85, 1],
          outputRange: [0, 0.8, 0.4, 0],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${p.left}%`,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.blue ? COLORS.accentBlue : COLORS.bull,
                transform: [{ translateY }],
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  glowBlob: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    opacity: 0.5,
    ...Platform.select({
      web: { filter: "blur(90px)" as any },
      default: {},
    }),
  },
  glowBlobSmall: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.18,
    ...Platform.select({
      web: { filter: "blur(70px)" as any },
      default: {},
    }),
  },
  particle: {
    position: "absolute",
    bottom: 0,
  },
});
