import React, { useEffect, useRef, useState } from "react";
import {
  Image,
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
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from "@expo-google-fonts/inter";

import { useAuth } from "../../services/auth/AuthProvider";

import { COLORS } from "../theme/theme";

/* ========================================================= */
/* COLOR SYSTEM — matches reference (deep navy / teal / blue)  */
/* ========================================================= */

const BULL = "#0FBE7A"; // teal-green — gains / primary brand
const BEAR = "#E5455C"; // red — losses
const ACCENT_BLUE = "#3B82F6"; // electric blue — secondary glow

const NAVY_DEEP = "#080D18";
const NAVY_MID = "#0E1626";
const NAVY_LINE = "#1D2A44";

const INK = "#F8FAFC";
const MUTED = "#8592A6";

const GLASS_BG = "rgba(17,26,46,0.55)";
const GLASS_BG_SOFT = "rgba(255,255,255,0.035)";
const GLASS_BORDER = "rgba(255,255,255,0.09)";
const GLOW_TEAL = "rgba(15,190,122,0.45)";
const GLOW_BLUE = "rgba(59,130,246,0.35)";

/* ========================================================= */
/* FONT SYSTEM — Inter, everywhere                             */
/* ========================================================= */

const FONT = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
};

/* ========================================================= */
/* AMBIENT ANIMATED BACKGROUND — soft floating glow blobs      */
/* ========================================================= */

function AmbientGlow() {
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
            backgroundColor: GLOW_TEAL,
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
            backgroundColor: GLOW_BLUE,
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
            backgroundColor: GLOW_TEAL,
            transform: [{ translateX: t3 }, { translateY: t1 }],
          },
        ]}
      />
    </View>
  );
}

/* ========================================================= */
/* FLOATING PARTICLES — slow drifting embers for depth         */
/* ========================================================= */

function FloatingParticles({ count = 16 }: { count?: number }) {
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
                backgroundColor: p.blue ? ACCENT_BLUE : BULL,
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

/* ========================================================= */
/* FULL-WIDTH TICKER HEADER (right -> left scroll)             */
/* ========================================================= */

const TICKER_ITEMS = [
  { sym: "BTC/USD", chg: "+2.41%", up: true },
  { sym: "ETH/USD", chg: "-1.12%", up: false },
  { sym: "EUR/USD", chg: "+0.34%", up: true },
  { sym: "XAU/USD", chg: "-0.58%", up: false },
  { sym: "AAPL", chg: "+1.86%", up: true },
  { sym: "TSLA", chg: "-3.24%", up: false },
  { sym: "NIFTY 50", chg: "+0.92%", up: true },
  { sym: "WTI CRUDE", chg: "-1.75%", up: false },
  { sym: "S&P 500", chg: "+0.61%", up: true },
  { sym: "GBP/USD", chg: "-0.22%", up: false },
];

function TickerRow() {
  return (
    <View style={styles.tickerRow}>
      {TICKER_ITEMS.map((item, i) => (
        <View key={i} style={styles.tickerItem}>
          <Text style={styles.tickerSymbol}>{item.sym}</Text>
          <Text
            style={[styles.tickerChange, { color: item.up ? BULL : BEAR }]}
          >
            {item.chg}
          </Text>
          <View style={styles.tickerDot} />
        </View>
      ))}
    </View>
  );
}

function TickerHeader() {
  const translateX = useRef(new Animated.Value(0)).current;
  const ROW_WIDTH = 1600;

  useEffect(() => {
    const loop = () => {
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: -ROW_WIDTH,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) loop();
      });
    };
    loop();
  }, [translateX]);

  return (
    <View style={styles.tickerHeaderShell}>
      <Animated.View
        style={[styles.tickerTrack, { transform: [{ translateX }] }]}
      >
        <TickerRow />
        <TickerRow />
      </Animated.View>
      {/* fade edges so the scroll looks infinite, not clipped */}
      <LinearGradient
        colors={[NAVY_DEEP, "rgba(8,13,24,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tickerFadeLeft}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(8,13,24,0)", NAVY_DEEP]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tickerFadeRight}
        pointerEvents="none"
      />
    </View>
  );
}

/* ========================================================= */
/* SIMPLE LIVE MARKETS CARD (glass, glowing, animated)         */
/* ========================================================= */

const SPARK_HEIGHTS = [14, 20, 17, 26, 22, 30, 27, 36, 33, 42, 38, 48];

function Sparkline() {
  const bars = useRef(SPARK_HEIGHTS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      45,
      bars.map((b) =>
        Animated.timing(b, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [bars]);

  return (
    <View style={styles.sparkRow}>
      {SPARK_HEIGHTS.map((h, i) => {
        const prev = i === 0 ? h : SPARK_HEIGHTS[i - 1];
        const up = h >= prev;
        const animatedHeight = bars[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, h],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.sparkBar,
              {
                height: animatedHeight,
                backgroundColor: up ? BULL : BEAR,
                shadowColor: up ? BULL : BEAR,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function LiveMarketsCard() {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const glow = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const dotAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: 0.15,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ])
    );
    dotAnim.start();
    glowAnim.start();
    return () => {
      dotAnim.stop();
      glowAnim.stop();
    };
  }, [pulse, glow]);

  return (
    <Animated.View
      style={[
        styles.marketsCard,
        Platform.OS === "web"
          ? ({
              // @ts-ignore web-only dynamic glow
              boxShadow: glow.interpolate({
                inputRange: [0.15, 0.4],
                outputRange: [
                  "0 0 0px rgba(15,190,122,0)",
                  "0 0 34px rgba(15,190,122,0.25)",
                ],
              }),
            } as any)
          : null,
      ]}
    >
      <View style={styles.marketsCardHeader}>
        <View style={styles.liveRow}>
          <Animated.View style={[styles.liveDot, { opacity: pulse }]} />
          <Text style={styles.liveLabel}>LIVE MARKETS</Text>
        </View>
        <Text style={styles.liveSub}>Updated just now</Text>
      </View>

      <Sparkline />

      <View style={styles.marketsList}>
        <MarketRow name="S&P 500" value="6,481.2" chg="+0.61%" up />
        <MarketRow name="Bitcoin" value="$68,240" chg="+2.41%" up />
        <MarketRow name="EUR/USD" value="1.0862" chg="-0.22%" up={false} />
      </View>
    </Animated.View>
  );
}

function MarketRow({
  name,
  value,
  chg,
  up,
}: {
  name: string;
  value: string;
  chg: string;
  up: boolean;
}) {
  return (
    <View style={styles.marketRow}>
      <Text style={styles.marketName}>{name}</Text>
      <Text style={styles.marketValue}>{value}</Text>
      <Text style={[styles.marketChg, { color: up ? BULL : BEAR }]}>
        {chg}
      </Text>
    </View>
  );
}

/* ========================================================= */
/* ASSET CLASS CHIPS — staggered fade/slide entrance            */
/* ========================================================= */

const ASSET_CLASSES = ["Crypto", "Forex", "Equities", "Commodities"];

function AssetChips() {
  const anims = useRef(ASSET_CLASSES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      90,
      anims.map((a) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        })
      )
    ).start();
  }, [anims]);

  return (
    <View style={styles.chipRow}>
      {ASSET_CLASSES.map((label, i) => {
        const opacity = anims[i];
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        });
        return (
          <Animated.View
            key={label}
            style={[styles.chip, { opacity, transform: [{ translateY }] }]}
          >
            <View style={styles.chipDot} />
            <Text style={styles.chipText}>{label}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* ========================================================= */
/* BRAND MARK — bigger logo, pulsing halo, rotating ring        */
/* ========================================================= */

function BrandMark({ tilt }: { tilt: Animated.AnimatedInterpolation<string> }) {
  const halo = useRef(new Animated.Value(0)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const haloLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const spinLoop = Animated.loop(
      Animated.timing(ringSpin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    haloLoop.start();
    spinLoop.start();
    return () => {
      haloLoop.stop();
      spinLoop.stop();
    };
  }, [halo, ringSpin]);

  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const spin = ringSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.brandMarkWrap}>
      <Animated.View
        style={[
          styles.brandHalo,
          { transform: [{ scale: haloScale }], opacity: haloOpacity },
        ]}
      />
      <Animated.View style={[styles.brandRing, { transform: [{ rotate: spin }] }]}>
        <LinearGradient
          colors={[BULL, "rgba(15,190,122,0)", ACCENT_BLUE, "rgba(59,130,246,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandRingGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.brandMark, { transform: [{ rotate: tilt }] }]}>
        <LinearGradient
          colors={[BULL, "#0A2E22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Image
          source={require("../../assets/vault1.png")}
          style={styles.loginBrandIcon}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

/* ========================================================= */
/* FLOATING-LABEL ANIMATED INPUT — with focus glow underline    */
/* ========================================================= */

function AnimatedField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: any;
  onSubmitEditing?: () => void;
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
  const labelColor = focused ? BULL : MUTED;
  const underlineWidth = underline.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.field}>
      <View style={[styles.inputShell, focused && styles.inputShellFocused]}>
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
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          onSubmitEditing={onSubmitEditing}
        />
        <Animated.View style={[styles.focusUnderline, { width: underlineWidth }]} />
      </View>
    </View>
  );
}

/* ========================================================= */
/* LOGIN SCREEN */
/* ========================================================= */

export default function Login() {
  const { login } = useAuth();
  const { width } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const cardBreath = useRef(new Animated.Value(0)).current;
  const brandTilt = useRef(new Animated.Value(0)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ringRotate2 = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  // entrance animations
  const brandEntrance = useRef(new Animated.Value(0)).current;
  const heroEntrance = useRef(new Animated.Value(0)).current;
  const cardEntrance = useRef(new Animated.Value(0)).current;

  const isCompact = width < 950;

  useEffect(() => {
    Animated.stagger(140, [
      Animated.timing(brandEntrance, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroEntrance, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardEntrance, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(cardBreath, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(cardBreath, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(brandTilt, {
          toValue: 1,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(brandTilt, {
          toValue: 0,
          duration: 3800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // slow rotating gradient rings behind the login card (two layers, opposite direction)
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ringRotate2, {
        toValue: 1,
        duration: 14000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // continuous spinner driver (used only while authenticating)
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // shimmer sweep across the button, repeats every few seconds
    const shimmerLoop = () => {
      shimmerX.setValue(-1);
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 1600,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setTimeout(shimmerLoop, 2200);
      });
    };
    shimmerLoop();
  }, [
    cardBreath,
    brandTilt,
    ringRotate,
    ringRotate2,
    shimmerX,
    spin,
    brandEntrance,
    heroEntrance,
    cardEntrance,
  ]);

  const cardScale = cardBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.006],
  });

  const brandRotate = brandTilt.interpolate({
    inputRange: [0, 1],
    outputRange: ["-4deg", "4deg"],
  });

  const ringSpin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const ringSpinReverse = ringRotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const shimmerTranslate = shimmerX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-220, 220],
  });

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const brandStyle = {
    opacity: brandEntrance,
    transform: [
      {
        translateY: brandEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [-14, 0],
        }),
      },
    ],
  };

  const heroStyle = {
    opacity: heroEntrance,
    transform: [
      {
        translateY: heroEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  const cardEntranceStyle = {
    opacity: cardEntrance,
    transform: [
      {
        translateY: cardEntrance.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
      { scale: cardScale },
    ],
  };

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
          ?.trim() || "Unable to sign in. Please check your details."
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

  if (!fontsLoaded) {
    return <View style={styles.fontLoader} />;
  }

  return (
    <View style={styles.root}>
      {/* FULL-WIDTH TICKER HEADER — spans entire top, right to left */}
      <TickerHeader />

      <View style={styles.mainRow}>
        {/* =================================================== */}
        {/* LEFT SIDE                                             */}
        {/* =================================================== */}

        {!isCompact && (
          <View style={styles.leftPanel}>
            <LinearGradient
              colors={[NAVY_DEEP, NAVY_MID, NAVY_DEEP]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <AmbientGlow />
            <FloatingParticles />

            <View style={styles.leftContent}>
              {/* BRAND */}
              <Animated.View style={[styles.brandBlock, brandStyle]}>
                <BrandMark tilt={brandRotate} />

                <View>
                  <Text style={styles.brand}>VAULT1</Text>
                  <Text style={styles.brandSub}>WEALTH OPERATING SYSTEM</Text>
                </View>
              </Animated.View>

              {/* HERO */}
              <Animated.View style={[styles.leftHero, heroStyle]}>
                <Text style={styles.leftEyebrow}>PRIVATE CAPITAL</Text>
                <Text style={styles.leftTitle}>Your capital.</Text>
                <Text style={styles.leftTitleAccent}>
                  Your command center.
                </Text>
                <Text style={styles.leftDescription}>
                  One platform for capital, trading and community — built
                  for investors who move across every market.
                </Text>

                <AssetChips />
              </Animated.View>

              {/* LIVE MARKETS CARD */}
              <Animated.View style={heroStyle}>
                <LiveMarketsCard />
              </Animated.View>

              {/* FOOTER */}
              <View style={styles.leftFooter}>
                <View style={styles.footerRule} />
                <Text style={styles.footerText}>
                  VAULT1 · PRIVATE CAPITAL PLATFORM
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* =================================================== */}
        {/* RIGHT SIDE — dark glass form                          */}
        {/* =================================================== */}

        <View
          style={[styles.rightPanel, isCompact && styles.rightPanelCompact]}
        >
          <LinearGradient
            colors={[NAVY_MID, NAVY_DEEP]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <AmbientGlow />

          <View
            style={[styles.loginShell, isCompact && styles.loginShellCompact]}
          >
            <Animated.View style={cardEntranceStyle}>
              {/* two counter-rotating gradient light-rings behind the card */}
              <Animated.View
                pointerEvents="none"
                style={[styles.ringWrap2, { transform: [{ rotate: ringSpinReverse }] }]}
              >
                <LinearGradient
                  colors={[ACCENT_BLUE, "rgba(59,130,246,0)", BULL, "rgba(15,190,122,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ringGradient2}
                />
              </Animated.View>

              <Animated.View
                pointerEvents="none"
                style={[styles.ringWrap, { transform: [{ rotate: ringSpin }] }]}
              >
                <LinearGradient
                  colors={[BULL, "rgba(15,190,122,0)", ACCENT_BLUE, "rgba(59,130,246,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ringGradient}
                />
              </Animated.View>

              <View style={styles.loginCard}>
                <View style={styles.loginTopAccent} />

                {/* MOBILE BRAND */}
                {isCompact && (
                  <View style={styles.mobileBrandBlock}>
                    <View style={styles.mobileBrandMark}>
                      <Image
                        source={require("../../assets/vault1.png")}
                        style={styles.mobileBrandIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.mobileBrand}>VAULT1</Text>
                  </View>
                )}

                {/* HEADER */}
                <View style={styles.loginHeader}>
                  <Text style={styles.loginEyebrow}>SECURE ACCESS</Text>
                  <Text style={styles.loginTitle}>Welcome back.</Text>
                  <Text style={styles.loginSubtitle}>
                    Sign in to access your Vault1 command center.
                  </Text>
                </View>

                {/* EMAIL */}
                <AnimatedField
                  label="EMAIL ADDRESS"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />

                {/* PASSWORD */}
                <AnimatedField
                  label="PASSWORD"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  onSubmitEditing={handleLogin}
                />

                {/* ERROR */}
                {error ? (
                  <View style={styles.errorBox}>
                    <View style={styles.errorIndicator} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* BUTTON */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <Pressable
                    onPress={handleLogin}
                    onPressIn={pressIn}
                    onPressOut={pressOut}
                    disabled={loading}
                    style={styles.loginButtonOuter}
                  >
                    <LinearGradient
                      colors={[BULL, "#0A9A63"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.loginButton}
                    >
                      {/* shimmer sweep */}
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          styles.shimmer,
                          { transform: [{ translateX: shimmerTranslate }, { rotate: "20deg" }] },
                        ]}
                      />
                      <Text style={styles.loginButtonText}>
                        {loading ? "AUTHENTICATING..." : "ENTER VAULT1"}
                      </Text>
                      {loading ? (
                        <Animated.View
                          style={[styles.spinner, { transform: [{ rotate: spinDeg }] }]}
                        />
                      ) : (
                        <Text style={styles.loginArrow}>→</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </Animated.View>

                {/* BOTTOM */}
                <View style={styles.loginBottom}>
                  <Text style={styles.bottomText}>VAULT1</Text>
                  <Text style={styles.bottomText}>PRIVATE ACCESS</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
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
    flexDirection: "column",
    backgroundColor: NAVY_DEEP,
    minHeight: Platform.OS === "web" ? ("100vh" as any) : undefined,
    overflow: "hidden",
  },

  fontLoader: {
    flex: 1,
    backgroundColor: NAVY_DEEP,
  },

  mainRow: {
    flex: 1,
    flexDirection: "row",
  },

  /* AMBIENT GLOW */

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

  /* ======================================================= */
  /* TICKER HEADER                                             */
  /* ======================================================= */

  tickerHeaderShell: {
    width: "100%",
    height: 38,
    backgroundColor: NAVY_DEEP,
    borderBottomWidth: 1,
    borderBottomColor: NAVY_LINE,
    overflow: "hidden",
    justifyContent: "center",
  },

  tickerTrack: {
    flexDirection: "row",
  },

  tickerRow: {
    flexDirection: "row",
  },

  tickerFadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
  },

  tickerFadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
  },

  tickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  tickerSymbol: {
    color: "#9CA8BC",
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
    marginRight: 8,
  },

  tickerChange: {
    fontSize: 10,
    fontFamily: FONT.black,
  },

  tickerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#2B364E",
    marginLeft: 18,
  },

  /* ======================================================= */
  /* LEFT PANEL                                                */
  /* ======================================================= */

  leftPanel: {
    flex: 1.2,
    position: "relative",
    overflow: "hidden",
  },

  leftContent: {
    flex: 1,
    paddingHorizontal: 64,
    paddingTop: 46,
    paddingBottom: 36,
    justifyContent: "space-between",
    zIndex: 2,
  },

  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
  },

  /* BRAND MARK — enlarged, with halo + rotating ring */

  brandMarkWrap: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  brandHalo: {
    position: "absolute",
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: GLOW_TEAL,
  },

  brandRing: {
    position: "absolute",
    width: 78,
    height: 78,
    borderRadius: 39,
    padding: 2,
  },

  brandRingGradient: {
    flex: 1,
    borderRadius: 39,
  },

  brandMark: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: `0 0 28px ${GLOW_TEAL}` as any },
      default: {
        shadowColor: BULL,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
    }),
  },

  loginBrandIcon: {
    width: 46,
    height: 46,
  },

  mobileBrandIcon: {
    width: 40,
    height: 40,
  },

  brand: {
    color: "#F8FAFC",
    fontSize: 20,
    fontFamily: FONT.black,
    letterSpacing: 4.5,
  },

  brandSub: {
    color: "#64748B",
    fontSize: 8,
    fontFamily: FONT.extraBold,
    letterSpacing: 2,
    marginTop: 4,
  },

  leftHero: {
    maxWidth: 560,
    marginTop: 36,
  },

  leftEyebrow: {
    color: BULL,
    fontSize: 11,
    fontFamily: FONT.black,
    letterSpacing: 2.5,
    marginBottom: 16,
  },

  leftTitle: {
    color: "#F8FAFC",
    fontSize: 50,
    lineHeight: 55,
    fontFamily: FONT.extraBold,
    letterSpacing: -1.8,
  },

  leftTitleAccent: {
    color: "#94A3B8",
    fontSize: 50,
    lineHeight: 55,
    fontFamily: FONT.extraBold,
    letterSpacing: -1.8,
  },

  leftDescription: {
    color: "#8592A6",
    fontSize: 15,
    lineHeight: 23,
    fontFamily: FONT.regular,
    maxWidth: 480,
    marginTop: 18,
  },

  /* ASSET CHIPS */

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 22,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: NAVY_LINE,
    backgroundColor: GLASS_BG_SOFT,
  },

  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: BULL,
    marginRight: 7,
  },

  chipText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.4,
  },

  /* LIVE MARKETS CARD */

  marketsCard: {
    marginTop: 30,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NAVY_LINE,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 22,
    paddingVertical: 20,
    maxWidth: 420,
  },

  marketsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  liveRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BULL,
    marginRight: 7,
  },

  liveLabel: {
    color: "#E2E8F0",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1.4,
  },

  liveSub: {
    color: "#5B6678",
    fontSize: 9,
    fontFamily: FONT.semiBold,
  },

  sparkRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    height: 48,
    marginBottom: 18,
  },

  sparkBar: {
    width: 6,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  marketsList: {
    gap: 10,
  },

  marketRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  marketName: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 12,
    fontFamily: FONT.bold,
  },

  marketValue: {
    color: "#94A3B8",
    fontSize: 12,
    fontFamily: FONT.semiBold,
    marginRight: 14,
  },

  marketChg: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    minWidth: 56,
    textAlign: "right",
  },

  /* FOOTER */

  leftFooter: {
    marginTop: 24,
  },

  footerRule: {
    height: 1,
    backgroundColor: NAVY_LINE,
    marginBottom: 12,
  },

  footerText: {
    color: "#4B5768",
    fontSize: 9,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.6,
  },

  /* ======================================================= */
  /* RIGHT PANEL — dark glass form                             */
  /* ======================================================= */

  rightPanel: {
    flex: 0.85,
    minWidth: 460,
    maxWidth: 640,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 56,
    paddingVertical: 40,
    position: "relative",
    overflow: "hidden",
  },

  rightPanelCompact: {
    flex: 1,
    minWidth: 0,
    maxWidth: undefined,
    paddingHorizontal: 24,
  },

  loginShell: {
    width: "100%",
    maxWidth: 460,
    zIndex: 2,
  },

  loginShellCompact: {
    maxWidth: 480,
  },

  /* rotating gradient rings behind the card */
  ringWrap: {
    position: "absolute",
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 24,
    opacity: 0.55,
  },

  ringGradient: {
    flex: 1,
    borderRadius: 24,
  },

  ringWrap2: {
    position: "absolute",
    top: -16,
    left: -16,
    right: -16,
    bottom: -16,
    borderRadius: 30,
    opacity: 0.28,
  },

  ringGradient2: {
    flex: 1,
    borderRadius: 30,
  },

  loginCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    backgroundColor: GLASS_BG,
    paddingHorizontal: 44,
    paddingTop: 44,
    paddingBottom: 32,
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

  loginTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: BULL,
  },

  mobileBrandBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 34,
  },

  mobileBrandMark: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: GLASS_BG_SOFT,
    borderWidth: 1,
    borderColor: GLASS_BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  mobileBrand: {
    color: INK,
    fontSize: 18,
    fontFamily: FONT.black,
    letterSpacing: 3.5,
  },

  loginHeader: {
    marginBottom: 32,
  },

  loginEyebrow: {
    color: BULL,
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2,
    marginBottom: 10,
  },

  loginTitle: {
    color: INK,
    fontSize: 32,
    lineHeight: 38,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.8,
  },

  loginSubtitle: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FONT.regular,
    marginTop: 8,
    maxWidth: 360,
  },

  /* INPUTS — floating label, dark glass, focus-glow underline */

  field: {
    marginBottom: 18,
  },

  inputShell: {
    height: 58,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GLASS_BORDER,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  inputShellFocused: {
    borderColor: BULL,
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
    color: INK,
    fontSize: 15,
    fontFamily: FONT.regular,
    paddingTop: 14,
    outlineStyle: "none" as any,
  },

  focusUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: 2,
    backgroundColor: BULL,
    borderRadius: 1,
  },

  /* ERROR */

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(229,69,92,0.35)",
    backgroundColor: "rgba(229,69,92,0.08)",
    marginBottom: 16,
  },

  errorIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BEAR,
    marginRight: 10,
  },

  errorText: {
    flex: 1,
    color: "#FF8A98",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FONT.medium,
  },

  /* BUTTON */

  loginButtonOuter: {
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 6,

    ...Platform.select({
      web: {
        boxShadow: "0 14px 32px rgba(15,190,122,0.35)",
      },
      default: {
        shadowColor: BULL,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },

  loginButton: {
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

  loginButtonText: {
    color: COLORS.glassBg,
    fontSize: 11,
    fontFamily: FONT.black,
    letterSpacing: 1.6,
  },

  loginArrow: {
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

  /* BOTTOM */

  loginBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS_BORDER,
  },

  bottomText: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.4,
  },
});