/**
 * <AnimatedField> — the floating-label glass input with the
 * focus-glow underline, used for every text field across the
 * site (login, signup, settings, KYC forms, search, etc).
 *
 * Usage:
 *   <AnimatedField label="EMAIL ADDRESS" value={email} onChangeText={setEmail} />
 */

import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, TextInput, View } from "react-native";
import { COLORS, FONT } from "../theme";

export function AnimatedField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  onSubmitEditing,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  onSubmitEditing?: () => void;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const underline = useRef(new Animated.Value(0)).current;
  const active = focused || value.length > 0;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, anim]);

  useEffect(() => {
    Animated.timing(underline, {
      toValue: focused ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [focused, underline]);

  const labelTop = anim.interpolate({ inputRange: [0, 1], outputRange: [18, 8] });
  const labelSize = anim.interpolate({ inputRange: [0, 1], outputRange: [14, 10] });
  const labelColor = focused ? COLORS.bull : COLORS.muted;
  const underlineWidth = underline.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.field}>
      <View
        style={[
          styles.inputShell,
          multiline && styles.inputShellMultiline,
          focused && styles.inputShellFocused,
        ]}
      >
        <Animated.Text
          style={[
            styles.floatingLabel,
            { top: labelTop, fontSize: labelSize, color: labelColor },
          ]}
        >
          {label}
        </Animated.Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, multiline && styles.inputMultiline]}
          onSubmitEditing={onSubmitEditing}
        />
        <Animated.View style={[styles.focusUnderline, { width: underlineWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 18,
  },
  inputShell: {
    height: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  inputShellMultiline: {
    height: 120,
    paddingTop: 18,
    justifyContent: "flex-start",
  },
  inputShellFocused: {
    borderColor: COLORS.bull,
    backgroundColor: "rgba(15,190,122,0.05)",
  },
  floatingLabel: {
    position: "absolute",
    left: 16,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.2,
  },
  input: {
    flex: 1,
    color: COLORS.ink,
    fontSize: 15,
    fontFamily: FONT.regular,
    paddingTop: 14,
    outlineStyle: "none" as any,
  },
  inputMultiline: {
    paddingTop: 20,
    textAlignVertical: "top",
  },
  focusUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: COLORS.bull,
    borderRadius: 1,
  },
});
