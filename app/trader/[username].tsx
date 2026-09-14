import React, {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useLocalSearchParams,
  router,
} from "expo-router";

import VaultSurface from "../../components/ui/VaultSurface";

import {
  getTraderProfileByUsername,
} from "../../services/community/communityService";

import {
  TraderProfile,
} from "../../types/community";

export default function PublicTraderPage() {
  const {
    username,
  } =
    useLocalSearchParams<{
      username: string;
    }>();

  const [trader, setTrader] =
    useState<TraderProfile | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result =
          await getTraderProfileByUsername(
            username || ""
          );

        setTrader(result);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [username]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          color="#8B5CF6"
          size="large"
        />
      </View>
    );
  }

  if (!trader) {
    return (
      <View style={styles.loading}>
        <Text style={styles.notFoundTitle}>
          Trader not found
        </Text>

        <Text style={styles.notFoundText}>
          This Vault1 trader profile does
          not exist or is not currently
          public.
        </Text>

        <Pressable
          onPress={() =>
            router.push(
              "/community"
            )
          }
          style={styles.button}
        >
          <Text
            style={styles.buttonText}
          >
            EXPLORE VAULT1
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={
        styles.container
      }
    >
      <View style={styles.brandRow}>
        <Text style={styles.brand}>
          VAULT1
        </Text>

        <Text style={styles.brandDivider}>
          /
        </Text>

        <Text style={styles.brandSection}>
          TRADER NETWORK
        </Text>
      </View>

      <VaultSurface
        intensity="strong"
        style={styles.profile}
      >
        <View
          style={styles.banner}
        />

        <View style={styles.body}>
          <View
            style={styles.avatar}
          >
            <Text
              style={styles.avatarText}
            >
              {trader.displayName
                .slice(0, 1)
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.titleRow}>
            <View>
              <View
                style={styles.nameRow}
              >
                <Text
                  style={styles.name}
                >
                  {trader.displayName}
                </Text>

                {trader.verified ? (
                  <Text
                    style={styles.verified}
                  >
                    ✓ VERIFIED
                  </Text>
                ) : null}
              </View>

              <Text
                style={styles.username}
              >
                @{trader.username}
              </Text>
            </View>

            {trader.liveNow ? (
              <View
                style={styles.live}
              >
                <View
                  style={styles.liveDot}
                />

                LIVE NOW
              </View>
            ) : null}
          </View>

          <Text style={styles.bio}>
            {trader.bio ||
              "Vault1 trader and community member."}
          </Text>

          <View
            style={styles.stats}
          >
            <Stat
              value={
                trader.followerCount
              }
              label="FOLLOWERS"
            />

            <Stat
              value={
                trader.subscriberCount
              }
              label="SUBSCRIBERS"
            />

            <Stat
              value={
                trader.viewCount
              }
              label="PROFILE VIEWS"
            />
          </View>

          <View
            style={styles.actions}
          >
            <Pressable
              onPress={() =>
                router.push(
                  "/login"
                )
              }
              style={styles.button}
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                FOLLOW TRADER
              </Text>
            </Pressable>

            {trader.liveNow ? (
              <Pressable
                onPress={() =>
                  trader.currentRoomId
                    ? router.push(
                        `/live-room/${trader.currentRoomId}` as any
                      )
                    : undefined
                }
                style={
                  styles.liveButton
                }
              >
                <Text
                  style={
                    styles.liveButtonText
                  }
                >
                  WATCH LIVE
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </VaultSurface>

      <View
        style={styles.contentGrid}
      >
        <VaultSurface
          intensity="medium"
          style={styles.contentCard}
        >
          <Text
            style={styles.cardEyebrow}
          >
            CHANNEL
          </Text>

          <Text
            style={styles.cardTitle}
          >
            {trader.displayName}'s
            Vault1 Channel
          </Text>

          <Text
            style={styles.cardText}
          >
            Live sessions, trading videos,
            community posts and future
            competitions will appear here.
          </Text>
        </VaultSurface>

        <VaultSurface
          intensity="medium"
          style={styles.contentCard}
        >
          <Text
            style={styles.cardEyebrow}
          >
            LIVE TRADING
          </Text>

          <Text
            style={styles.cardTitle}
          >
            {trader.liveNow
              ? "Trading live now"
              : "Currently offline"}
          </Text>

          <Text
            style={styles.cardText}
          >
            {trader.liveNow
              ? "Join the live room and watch the trader's session."
              : "Follow this trader to receive future live-room notifications."}
          </Text>
        </VaultSurface>
      </View>

      <Text
        style={styles.footer}
      >
        VAULT1 • TRADING COMMUNITY
      </Text>
    </ScrollView>
  );
}

function Stat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={styles.statValue}
      >
        {value.toLocaleString(
          "en-IN"
        )}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#060606",
  },

  container: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
    padding: 34,
    paddingBottom: 80,
  },

  loading: {
    flex: 1,
    backgroundColor: "#060606",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  notFoundTitle: {
    color: "#F2F2F2",
    fontSize: 30,
    fontWeight: "900",
  },

  notFoundText: {
    color: "#666666",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 25,
    textAlign: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },

  brandDivider: {
    color: "#4A4A4A",
    marginHorizontal: 10,
  },

  brandSection: {
    color: "#6A6A6A",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  profile: {
    minHeight: 470,
  },

  banner: {
    height: 170,
    backgroundColor: "#17121F",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2038",
  },

  body: {
    padding: 36,
    paddingTop: 0,
  },

  avatar: {
    width: 108,
    height: 108,
    borderRadius: 28,
    backgroundColor: "#211A2C",
    borderWidth: 2,
    borderColor: "#60458A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -54,
    marginBottom: 22,
  },

  avatarText: {
    color: "#C29EFF",
    fontSize: 40,
    fontWeight: "900",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  name: {
    color: "#F5F5F5",
    fontSize: 34,
    fontWeight: "900",
  },

  verified: {
    color: "#AD8BE9",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  username: {
    color: "#7654A8",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
  },

  live: {
    flexDirection: "row",
    alignItems: "center",
    color: "#DB8B8B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D56A6A",
    marginRight: 6,
  },

  bio: {
    color: "#9C9C9C",
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 800,
    marginTop: 24,
  },

  stats: {
    flexDirection: "row",
    marginTop: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#292929",
    paddingVertical: 20,
  },

  stat: {
    minWidth: 150,
    paddingRight: 30,
    marginRight: 30,
    borderRightWidth: 1,
    borderRightColor: "#292929",
  },

  statValue: {
    color: "#F0F0F0",
    fontSize: 24,
    fontWeight: "900",
  },

  statLabel: {
    color: "#565656",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 26,
  },

  button: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 9,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  liveButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    borderRadius: 9,
    backgroundColor: "#241313",
    borderWidth: 1,
    borderColor: "#573030",
    alignItems: "center",
    justifyContent: "center",
  },

  liveButtonText: {
    color: "#E29393",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  contentGrid: {
    flexDirection: "row",
    gap: 18,
    marginTop: 20,
  },

  contentCard: {
    flex: 1,
    minHeight: 190,
    padding: 25,
  },

  cardEyebrow: {
    color: "#7654B5",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
  },

  cardTitle: {
    color: "#EEEEEE",
    fontSize: 21,
    fontWeight: "900",
    marginTop: 10,
  },

  cardText: {
    color: "#707070",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },

  footer: {
    color: "#3F3F3F",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 50,
  },
});