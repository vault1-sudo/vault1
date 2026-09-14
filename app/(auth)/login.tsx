import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useAuth } from "../../services/auth/AuthProvider";

/* ========================================================= */
/* ANIMATED MARKET LINE */
/* ========================================================= */

function MarketLine() {
  const opacity = useRef(new Animated.Value(0.25)).current;
  const translateX = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.48,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),

        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 80,
            duration: 5200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -80,
            duration: 5200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity, translateX]);

  return (
    <View pointerEvents="none" style={styles.marketGraphic}>
      {/* Main trajectory */}
      <View style={styles.marketLineBase} />

      <View style={styles.marketSegmentOne} />
      <View style={styles.marketSegmentTwo} />
      <View style={styles.marketSegmentThree} />
      <View style={styles.marketSegmentFour} />
      <View style={styles.marketSegmentFive} />

      {/* Moving light */}
      <Animated.View
        style={[
          styles.marketPulse,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Data points */}
      <View style={styles.marketPointOne} />
      <View style={styles.marketPointTwo} />
      <View style={styles.marketPointThree} />
      <View style={styles.marketPointFour} />
    </View>
  );
}

/* ========================================================= */
/* SUBTLE BACKGROUND LINES */
/* ========================================================= */

function BackgroundLines() {
  return (
    <View pointerEvents="none" style={styles.backgroundLines}>
      <View style={styles.backgroundHorizontalOne} />
      <View style={styles.backgroundHorizontalTwo} />
      <View style={styles.backgroundHorizontalThree} />

      <View style={styles.backgroundVerticalOne} />
      <View style={styles.backgroundVerticalTwo} />
    </View>
  );
}

/* ========================================================= */
/* LOGIN SCREEN */
/* ========================================================= */

export default function Login() {
  const { login } = useAuth();
  const { width } = useWindowDimensions();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const isCompact = width < 950;

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err?.message
          ?.replace("Firebase:", "")
          ?.replace(/\(auth\/.*?\)\.?/, "")
          ?.trim() ||
          "Unable to sign in. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

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
    <View style={styles.root}>
      {/* =================================================== */}
      {/* BACKGROUND */}
      {/* =================================================== */}

      <LinearGradient
        colors={[
          "#090710",
          "#0B0714",
          "#08060F",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Very subtle violet atmosphere */}
      <View pointerEvents="none" style={styles.violetAtmosphere}>
        <LinearGradient
          colors={[
            "rgba(111, 70, 165, 0.18)",
            "rgba(79, 48, 122, 0.07)",
            "rgba(0,0,0,0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {!isCompact && (
        <View style={styles.desktopLayout}>
          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}

          <View style={styles.leftPanel}>
            <BackgroundLines />
            <MarketLine />

            <View style={styles.leftContent}>
              {/* BRAND */}
              <View style={styles.brandBlock}>
                <View style={styles.brandMark}>
                  <LinearGradient
                    colors={[
                      "#8C5DC1",
                      "#5B397F",
                      "#241532",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  <Text style={styles.brandMarkText}>
                    V
                  </Text>
                </View>

                <View>
                  <Text style={styles.brand}>
                    VAULT1
                  </Text>

                  <Text style={styles.brandSub}>
                    WEALTH OPERATING SYSTEM
                  </Text>
                </View>
              </View>

              {/* HERO */}
              <View style={styles.leftHero}>
                <Text style={styles.leftEyebrow}>
                  PRIVATE CAPITAL
                </Text>

                <Text style={styles.leftTitle}>
                  Your capital.
                </Text>

                <Text style={styles.leftTitleAccent}>
                  Your command center.
                </Text>

                <Text style={styles.leftDescription}>
                  A single intelligent system to manage your
                  capital, investments, trading and wealth.
                </Text>
              </View>

              {/* FEATURES */}
              <View style={styles.featureSection}>
                <Feature
                  number="01"
                  title="SEE EVERYTHING"
                  description="Know exactly where your capital is and how it is performing."
                />

                <Feature
                  number="02"
                  title="MOVE WITH PURPOSE"
                  description="Track investments and trading against clear objectives."
                />

                <Feature
                  number="03"
                  title="STAY IN CONTROL"
                  description="Keep your financial activity organised around one source of truth."
                />
              </View>

              {/* FOOTER */}
              <View style={styles.leftFooter}>
                <View style={styles.footerRule} />

                <View style={styles.footerRow}>
                  <Text style={styles.footerText}>
                    VAULT1
                  </Text>

                  <Text style={styles.footerText}>
                    PRIVATE CAPITAL PLATFORM
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* =================================================== */}
      {/* RIGHT SIDE */}
      {/* =================================================== */}

      <View
        style={[
          styles.rightPanel,
          isCompact && styles.rightPanelCompact,
        ]}
      >
        {/* Ambient light behind login */}
        <View pointerEvents="none" style={styles.loginAmbient}>
          <LinearGradient
            colors={[
              "rgba(118, 72, 168, 0.16)",
              "rgba(80, 45, 119, 0.06)",
              "rgba(0,0,0,0)",
            ]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View
          style={[
            styles.loginShell,
            isCompact && styles.loginShellCompact,
          ]}
        >
          {/* LOGIN CARD */}
          <LinearGradient
            colors={[
              "#18111F",
              "#110C17",
              "#0D0912",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginCard}
          >
            {/* Fine top highlight */}
            <View style={styles.loginTopHighlight} />

            {/* MOBILE BRAND */}
            {isCompact && (
              <View style={styles.mobileBrandBlock}>
                <View style={styles.mobileBrandMark}>
                  <Text style={styles.mobileBrandMarkText}>
                    V
                  </Text>
                </View>

                <Text style={styles.mobileBrand}>
                  VAULT1
                </Text>
              </View>
            )}

            {/* HEADER */}
            <View style={styles.loginHeader}>
              <Text style={styles.loginEyebrow}>
                SECURE ACCESS
              </Text>

              <Text style={styles.loginTitle}>
                Welcome back.
              </Text>

              <Text style={styles.loginSubtitle}>
                Sign in to access your Vault1 command center.
              </Text>
            </View>

            {/* EMAIL */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                EMAIL ADDRESS
              </Text>

              <View style={styles.inputShell}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor="#65586D"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>
            </View>

            {/* PASSWORD */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                PASSWORD
              </Text>

              <View style={styles.inputShell}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#65586D"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            {/* ERROR */}
            {error ? (
              <View style={styles.errorBox}>
                <View style={styles.errorIndicator} />

                <Text style={styles.errorText}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* BUTTON */}
            <Animated.View
              style={{
                transform: [{ scale: buttonScale }],
              }}
            >
              <Pressable
                onPress={handleLogin}
                onPressIn={pressIn}
                onPressOut={pressOut}
                disabled={loading}
                style={styles.loginButtonOuter}
              >
                <LinearGradient
                  colors={[
                    "#F6F1F9",
                    "#E1D7E8",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>
                    {loading
                      ? "AUTHENTICATING..."
                      : "ENTER VAULT1"}
                  </Text>

                  {!loading && (
                    <Text style={styles.loginArrow}>
                      →
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* REGISTER */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                New to Vault1?
              </Text>

              <Pressable
                onPress={() => router.push("/register")}
              >
                <Text style={styles.registerLink}>
                  Create account
                </Text>
              </Pressable>
            </View>

            {/* BOTTOM */}
            <View style={styles.loginBottom}>
              <Text style={styles.bottomText}>
                VAULT1
              </Text>

              <Text style={styles.bottomText}>
                PRIVATE ACCESS
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>
    </View>
  );
}

/* ========================================================= */
/* FEATURE */
/* ========================================================= */

function Feature({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.feature}>
      <Text style={styles.featureNumber}>
        {number}
      </Text>

      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>
          {title}
        </Text>

        <Text style={styles.featureDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

/* ========================================================= */
/* STYLES */
/* ========================================================= */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#090710",
    minHeight:
      Platform.OS === "web"
        ? ("100vh" as any)
        : undefined,
    overflow: "hidden",
  },

  violetAtmosphere: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "65%",
    height: "100%",
  },

  desktopLayout: {
    flex: 1.35,
  },

  /* ======================================================= */
  /* LEFT */
  /* ======================================================= */

  leftPanel: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    borderRightWidth: 1,
    borderRightColor: "#241A31",
  },

  leftContent: {
    flex: 1,
    paddingHorizontal: 70,
    paddingTop: 54,
    paddingBottom: 38,
    justifyContent: "space-between",
    zIndex: 5,
  },

  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#684782",
    marginRight: 15,

    ...Platform.select({
      web: {
        boxShadow:
          "0 12px 30px rgba(82,45,113,0.35)",
      },
      default: {
        shadowColor: "#70469C",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },

  brandMarkText: {
    color: "#F8F2FB",
    fontSize: 23,
    fontWeight: "900",
  },

  brand: {
    color: "#F8F3FA",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 5,
  },

  brandSub: {
    color: "#79638B",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 4,
  },

  leftHero: {
    maxWidth: 760,
    marginTop: 40,
  },

  leftEyebrow: {
    color: "#9673B4",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.5,
    marginBottom: 18,
  },

  leftTitle: {
    color: "#F7F2FA",
    fontSize: 62,
    lineHeight: 67,
    fontWeight: "800",
    letterSpacing: -2.5,
  },

  leftTitleAccent: {
    color: "#B18AD9",
    fontSize: 62,
    lineHeight: 67,
    fontWeight: "800",
    letterSpacing: -2.5,
  },

  leftDescription: {
    color: "#887A91",
    fontSize: 17,
    lineHeight: 27,
    maxWidth: 650,
    marginTop: 24,
  },

  /* ======================================================= */
  /* FEATURES */
  /* ======================================================= */

  featureSection: {
    flexDirection: "row",
    gap: 48,
    marginTop: 45,
  },

  feature: {
    flex: 1,
    maxWidth: 220,
  },

  featureNumber: {
    color: "#8D69A8",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 13,
  },

  featureCopy: {
    paddingRight: 10,
  },

  featureTitle: {
    color: "#D4C7DC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  featureDescription: {
    color: "#71647A",
    fontSize: 11,
    lineHeight: 17,
  },

  /* ======================================================= */
  /* BACKGROUND */
  /* ======================================================= */

  backgroundLines: {
    position: "absolute",
    top: 90,
    left: 40,
    right: 40,
    bottom: 55,
    opacity: 0.22,
  },

  backgroundHorizontalOne: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "22%",
    height: 1,
    backgroundColor: "#5A406E",
  },

  backgroundHorizontalTwo: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "53%",
    height: 1,
    backgroundColor: "#4B365C",
  },

  backgroundHorizontalThree: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "79%",
    height: 1,
    backgroundColor: "#392B48",
  },

  backgroundVerticalOne: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "38%",
    width: 1,
    backgroundColor: "#3C2D4A",
  },

  backgroundVerticalTwo: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "72%",
    width: 1,
    backgroundColor: "#3C2D4A",
  },

  marketGraphic: {
    position: "absolute",
    left: "7%",
    right: "-5%",
    top: "48%",
    height: 260,
    opacity: 0.75,
    transform: [
      {
        rotate: "-5deg",
      },
    ],
  },

  marketLineBase: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 160,
    height: 1,
    backgroundColor: "#372645",
  },

  marketSegmentOne: {
    position: "absolute",
    left: "2%",
    top: 160,
    width: "15%",
    height: 1,
    backgroundColor: "#63417B",
    transform: [{ rotate: "12deg" }],
  },

  marketSegmentTwo: {
    position: "absolute",
    left: "16%",
    top: 128,
    width: "15%",
    height: 1,
    backgroundColor: "#75508F",
    transform: [{ rotate: "-22deg" }],
  },

  marketSegmentThree: {
    position: "absolute",
    left: "30%",
    top: 75,
    width: "19%",
    height: 1,
    backgroundColor: "#80569B",
    transform: [{ rotate: "17deg" }],
  },

  marketSegmentFour: {
    position: "absolute",
    left: "48%",
    top: 130,
    width: "17%",
    height: 1,
    backgroundColor: "#68447D",
    transform: [{ rotate: "-13deg" }],
  },

  marketSegmentFive: {
    position: "absolute",
    left: "64%",
    top: 93,
    width: "25%",
    height: 1,
    backgroundColor: "#79509A",
    transform: [{ rotate: "-18deg" }],
  },

  marketPulse: {
    position: "absolute",
    left: "40%",
    top: 99,
    width: 90,
    height: 2,
    backgroundColor: "#A47ACA",
  },

  marketPointOne: {
    position: "absolute",
    left: "16%",
    top: 125,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#72518D",
  },

  marketPointTwo: {
    position: "absolute",
    left: "31%",
    top: 72,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9A6DC0",
  },

  marketPointThree: {
    position: "absolute",
    left: "49%",
    top: 127,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#76528D",
  },

  marketPointFour: {
    position: "absolute",
    right: "10%",
    top: 88,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#A17AC3",
  },

  /* ======================================================= */
  /* LEFT FOOTER */
  /* ======================================================= */

  leftFooter: {
    marginTop: 35,
  },

  footerRule: {
    height: 1,
    backgroundColor: "#261B31",
    marginBottom: 14,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  footerText: {
    color: "#56485F",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },

  /* ======================================================= */
  /* RIGHT */
  /* ======================================================= */

  rightPanel: {
    flex: 0.85,
    minWidth: 500,
    maxWidth: 680,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 60,
    paddingVertical: 50,
    backgroundColor: "rgba(5,4,9,0.55)",
  },

  rightPanelCompact: {
    flex: 1,
    minWidth: 0,
    maxWidth: undefined,
    paddingHorizontal: 24,
  },

  loginAmbient: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    top: "50%",
    left: "50%",
    marginLeft: -300,
    marginTop: -300,
  },

  loginShell: {
    width: "100%",
    maxWidth: 510,
  },

  loginShellCompact: {
    maxWidth: 520,
  },

  loginCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#3C2850",
    paddingHorizontal: 48,
    paddingTop: 50,
    paddingBottom: 34,
    overflow: "hidden",

    ...Platform.select({
      web: {
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.68), 0 12px 35px rgba(67,39,91,0.25), inset 0 1px 0 rgba(196,157,224,0.08)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 26,
        },
        shadowOpacity: 0.58,
        shadowRadius: 32,
        elevation: 18,
      },
    }),
  },

  loginTopHighlight: {
    position: "absolute",
    top: 0,
    left: 38,
    right: 38,
    height: 1,
    backgroundColor: "#9B6AC4",
    opacity: 0.75,
  },

  mobileBrandBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },

  mobileBrandMark: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#291A39",
    borderWidth: 1,
    borderColor: "#593A70",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  mobileBrandMarkText: {
    color: "#E8DDF0",
    fontSize: 18,
    fontWeight: "900",
  },

  mobileBrand: {
    color: "#F5EFF9",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 4,
  },

  loginHeader: {
    marginBottom: 38,
  },

  loginEyebrow: {
    color: "#9671AF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 12,
  },

  loginTitle: {
    color: "#F6F1F8",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    letterSpacing: -1,
  },

  loginSubtitle: {
    color: "#817486",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 390,
  },

  /* ======================================================= */
  /* INPUTS */
  /* ======================================================= */

  field: {
    marginBottom: 22,
  },

  fieldLabel: {
    color: "#92789F",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  inputShell: {
    height: 62,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#392642",
    backgroundColor: "#0B0810",
    justifyContent: "center",

    ...Platform.select({
      web: {
        boxShadow:
          "inset 0 2px 10px rgba(0,0,0,0.40), 0 4px 14px rgba(0,0,0,0.12)",
      },
      default: {},
    }),
  },

  input: {
    flex: 1,
    color: "#EAE2EF",
    fontSize: 16,
    paddingHorizontal: 18,
    outlineStyle: "none" as any,
  },

  /* ======================================================= */
  /* ERROR */
  /* ======================================================= */

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4C2D40",
    backgroundColor: "#1B0E17",
    marginBottom: 18,
  },

  errorIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C786A7",
    marginRight: 10,
  },

  errorText: {
    flex: 1,
    color: "#C092A8",
    fontSize: 11,
    lineHeight: 16,
  },

  /* ======================================================= */
  /* BUTTON */
  /* ======================================================= */

  loginButtonOuter: {
    borderRadius: 10,
    overflow: "hidden",

    ...Platform.select({
      web: {
        boxShadow:
          "0 14px 32px rgba(0,0,0,0.38), 0 5px 16px rgba(113,70,149,0.20)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 10,
        },
        shadowOpacity: 0.38,
        shadowRadius: 14,
        elevation: 8,
      },
    }),
  },

  loginButton: {
    height: 62,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 17,
    borderWidth: 1,
    borderColor: "#F8F2FB",
  },

  loginButtonText: {
    color: "#160E1D",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.7,
  },

  loginArrow: {
    color: "#594263",
    fontSize: 20,
  },

  /* ======================================================= */
  /* REGISTER */
  /* ======================================================= */

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  registerText: {
    color: "#6D6074",
    fontSize: 12,
  },

  registerLink: {
    color: "#B28ACF",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },

  /* ======================================================= */
  /* LOGIN FOOTER */
  /* ======================================================= */

  loginBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#21172A",
  },

  bottomText: {
    color: "#514356",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
});