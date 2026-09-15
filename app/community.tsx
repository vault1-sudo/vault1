import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import { FONT, COLORS } from "./theme/theme";

import {
  getContentCategoryLabel,
  getPublicTraderProfiles,
  getUserTraderProfile,
  createTraderProfile,
  followTrader,
  unfollowTrader,
  isFollowingTrader,
  subscribeToTrader,
  cancelTraderSubscription,
  isSubscribedToTrader,
} from "../services/community/communityService";

import {
  TraderProfile,
} from "../types/community";

import {
  useAuth,
} from "../services/auth/AuthProvider";

const violet = "#8B5CF6";

export default function CommunityScreen() {
  const {
    user,
    profile: authProfile,
  } = useAuth();

  const [profiles, setProfiles] =
    useState<TraderProfile[]>([]);

  const [ownProfile, setOwnProfile] =
    useState<TraderProfile | null>(null);

  const [selectedProfile, setSelectedProfile] =
    useState<TraderProfile | null>(null);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [following, setFollowing] =
    useState(false);

  const [subscribed, setSubscribed] =
    useState(false);

  const [showCreate, setShowCreate] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [displayName, setDisplayName] =
    useState(
      authProfile?.displayName ||
      ""
    );

  const [bio, setBio] =
    useState("");

  const [category, setCategory] =
    useState<
      TraderProfile["contentCategory"]
    >("TRADING");

  const load = useCallback(
    async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          publicProfiles,
          profile,
        ] = await Promise.all([
          getPublicTraderProfiles(),
          getUserTraderProfile(
            user.uid
          ),
        ]);

        setProfiles(
          publicProfiles
        );

        setOwnProfile(profile);

        if (
          profile &&
          !selectedProfile
        ) {
          setSelectedProfile(
            profile
          );
        }
      } catch (err: any) {
        setError(
          err?.message ||
          "Unable to load community."
        );
      } finally {
        setLoading(false);
      }
    },
    [user, selectedProfile]
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredProfiles =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return profiles;
      }

      return profiles.filter(
        (item) =>
          item.displayName
            .toLowerCase()
            .includes(term) ||
          item.username
            .toLowerCase()
            .includes(term) ||
          item.specialties.some(
            (specialty) =>
              specialty
                .toLowerCase()
                .includes(term)
          )
      );
    }, [profiles, search]);

  const selectTrader =
    async (
      trader: TraderProfile
    ) => {
      setSelectedProfile(trader);
      setError("");
      setSuccess("");

      if (!user) {
        return;
      }

      try {
        const [
          followState,
          subscriptionState,
        ] = await Promise.all([
          isFollowingTrader({
            followerUserId:
              user.uid,
            traderProfileId:
              trader.id,
          }),
          isSubscribedToTrader({
            subscriberUserId:
              user.uid,
            traderProfileId:
              trader.id,
          }),
        ]);

        setFollowing(
          followState
        );

        setSubscribed(
          subscriptionState
        );
      } catch {
        setFollowing(false);
        setSubscribed(false);
      }
    };

  const handleFollow =
    async () => {
      if (
        !user ||
        !selectedProfile
      ) {
        return;
      }

      if (
        selectedProfile.userId ===
        user.uid
      ) {
        return;
      }

      try {
        setWorking(true);
        setError("");
        setSuccess("");

        if (following) {
          await unfollowTrader({
            followerUserId:
              user.uid,
            traderProfileId:
              selectedProfile.id,
          });

          setFollowing(false);

          setSelectedProfile({
            ...selectedProfile,
            followerCount:
              Math.max(
                0,
                selectedProfile.followerCount -
                  1
              ),
          });
        } else {
          await followTrader({
            followerUserId:
              user.uid,
            traderUserId:
              selectedProfile.userId,
            traderProfileId:
              selectedProfile.id,
          });

          setFollowing(true);

          setSelectedProfile({
            ...selectedProfile,
            followerCount:
              selectedProfile.followerCount +
              1,
          });
        }
      } catch (err: any) {
        setError(
          err?.message ||
          "Unable to update follow."
        );
      } finally {
        setWorking(false);
      }
    };

  const handleSubscribe =
    async () => {
      if (
        !user ||
        !selectedProfile
      ) {
        return;
      }

      if (
        selectedProfile.userId ===
        user.uid
      ) {
        return;
      }

      try {
        setWorking(true);
        setError("");
        setSuccess("");

        if (subscribed) {
          await cancelTraderSubscription(
            {
              subscriberUserId:
                user.uid,
              traderProfileId:
                selectedProfile.id,
            }
          );

          setSubscribed(false);

          setSelectedProfile({
            ...selectedProfile,
            subscriberCount:
              Math.max(
                0,
                selectedProfile.subscriberCount -
                  1
              ),
          });
        } else {
          await subscribeToTrader({
            subscriberUserId:
              user.uid,
            traderUserId:
              selectedProfile.userId,
            traderProfileId:
              selectedProfile.id,
          });

          setSubscribed(true);

          setSelectedProfile({
            ...selectedProfile,
            subscriberCount:
              selectedProfile.subscriberCount +
              1,
          });
        }
      } catch (err: any) {
        setError(
          err?.message ||
          "Unable to update subscription."
        );
      } finally {
        setWorking(false);
      }
    };

  const handleCreateProfile =
    async () => {
      if (!user) {
        return;
      }

      try {
        setWorking(true);
        setError("");
        setSuccess("");

        await createTraderProfile({
          userId: user.uid,
          username,
          displayName:
            displayName ||
            authProfile?.displayName ||
            "Vault1 Trader",
          bio,
          contentCategory:
            category,
        });

        setUsername("");
        setBio("");
        setShowCreate(false);

        setSuccess(
          "Your public trader profile is live."
        );

        await load();
      } catch (err: any) {
        setError(
          err?.message ||
          "Unable to create trader profile."
        );
      } finally {
        setWorking(false);
      }
    };

  return (
    <View style={styles.page}>
      <View style={styles.sidebar} pointerEvents="none">
        <View style={styles.brand}>
          <Text style={styles.brandMark}>
            V1
          </Text>

          <View>
            <Text style={styles.brandTitle}>
              VAULT1
            </Text>

            <Text style={styles.brandSub}>
              COMMUNITY
            </Text>
          </View>
        </View>

        <View style={styles.nav}>
          <Text style={styles.navSection}>
            COMMUNITY
          </Text>

          {[
            "Community",
            "Live Rooms",
            "Competitions",
            "Leaderboard",
            "Members",
          ].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                if (
                  item === "Competitions"
                ) {
                  router.push(
                    "/competitions"
                  );
                }
              }}
              style={({ pressed }) => [
                styles.navItem,
                item === "Community" &&
                  styles.navItemActive,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.navText,
                  item === "Community" &&
                    styles.navTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}

          <Text
            style={[
              styles.navSection,
              { marginTop: 28 },
            ]}
          >
            GROWTH
          </Text>

          {[
            "Dashboard",
            "Portfolio",
            "Trading",
            "Growth Missions",
          ].map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                const routes: Record<
                  string,
                  string
                > = {
                  Dashboard:
                    "/dashboard",
                  Portfolio:
                    "/portfolio",
                  Trading:
                    "/trading",
                  "Growth Missions":
                    "/growth-missions",
                };

                const route =
                  routes[item];

                if (route) {
                  router.push(
                    route as any
                  );
                }
              }}
              style={({ pressed }) => [
                styles.navItem,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.navText}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={
          styles.contentInner
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              VAULT1 NETWORK
            </Text>

            <Text style={styles.title}>
              Community
            </Text>

            <Text style={styles.subtitle}>
              Discover traders, follow their
              journeys and join the live
              trading floor.
            </Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() =>
                setShowCreate(true)
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.primaryButtonText}
              >
                CREATE TRADER PROFILE
              </Text>
            </Pressable>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Text
              style={styles.successText}
            >
              {success}
            </Text>
          </View>
        ) : null}

        <View style={styles.metricsRow}>
          <Metric
            label="PUBLIC TRADERS"
            value={profiles.length.toString()}
          />

          <Metric
            label="LIVE NOW"
            value={profiles
              .filter(
                (item) =>
                  item.liveNow
              )
              .length.toString()}
            accent
          />

          <Metric
            label="VERIFIED"
            value={profiles
              .filter(
                (item) =>
                  item.verified
              )
              .length.toString()}
          />

          <Metric
            label="NETWORK FOLLOWERS"
            value={profiles
              .reduce(
                (sum, item) =>
                  sum +
                  item.followerCount,
                0
              )
              .toLocaleString(
                "en-IN"
              )}
          />
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search traders, usernames or specialties..."
            placeholderTextColor="#555"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.traderList}>
            <View style={styles.sectionHeader}>
              <View>
                <Text
                  style={styles.sectionTitle}
                >
                  Discover Traders
                </Text>

                <Text
                  style={styles.sectionSub}
                >
                  Public Vault1 profiles
                </Text>
              </View>

              <Text
                style={styles.countText}
              >
                {filteredProfiles.length}
              </Text>
            </View>

            {loading ? (
              <VaultSurface
                intensity="medium"
                style={styles.emptyCard}
              >
                <ActivityIndicator
                  color={violet}
                />

                <Text
                  style={styles.emptyText}
                >
                  Loading community...
                </Text>
              </VaultSurface>
            ) : filteredProfiles.length ===
              0 ? (
              <VaultSurface
                intensity="medium"
                style={styles.emptyCard}
              >
                <Text
                  style={styles.emptyTitle}
                >
                  No traders found
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  Create the first public
                  trader profile.
                </Text>
              </VaultSurface>
            ) : (
              filteredProfiles.map(
                (trader) => (
                  <Pressable
                    key={trader.id}
                    onPress={() =>
                      selectTrader(
                        trader
                      )
                    }
                    style={({ pressed }) => [
                      styles.traderCard,
                      selectedProfile?.id ===
                        trader.id &&
                        styles.traderCardActive,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.avatar
                      }
                    >
                      <Text
                        style={
                          styles.avatarText
                        }
                      >
                        {trader.displayName
                          .slice(
                            0,
                            1
                          )
                          .toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.traderIdentity
                      }
                    >
                      <View
                        style={
                          styles.nameRow
                        }
                      >
                        <Text
                          style={
                            styles.traderName
                          }
                        >
                          {
                            trader.displayName
                          }
                        </Text>

                        {trader.verified ? (
                          <Text
                            style={
                              styles.verified
                            }
                          >
                            ✓
                          </Text>
                        ) : null}

                        {trader.liveNow ? (
                          <View
                            style={
                              styles.livePill
                            }
                          >
                            <View
                              style={
                                styles.liveDot
                              }
                            />

                            <Text
                              style={
                                styles.liveText
                              }
                            >
                              LIVE
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text
                        style={
                          styles.username
                        }
                      >
                        @{trader.username}
                      </Text>

                      <Text
                        numberOfLines={2}
                        style={
                          styles.traderBio
                        }
                      >
                        {trader.bio ||
                          "Vault1 trader"}
                      </Text>

                      <View
                        style={
                          styles.statsRow
                        }
                      >
                        <Stat
                          label="Followers"
                          value={trader.followerCount}
                        />

                        <Stat
                          label="Subscribers"
                          value={
                            trader.subscriberCount
                          }
                        />

                        <Stat
                          label="Views"
                          value={
                            trader.viewCount
                          }
                        />
                      </View>
                    </View>
                  </Pressable>
                )
              )
            )}
          </View>

          <View style={styles.detailColumn}>
            {selectedProfile ? (
              <VaultSurface
                intensity="strong"
                style={styles.profileHero}
              >
                <View
                  style={
                    styles.profileBanner
                  }
                />

                <View
                  style={
                    styles.profileBody
                  }
                >
                  <View
                    style={
                      styles.largeAvatar
                    }
                  >
                    <Text
                      style={
                        styles.largeAvatarText
                      }
                    >
                      {selectedProfile.displayName
                        .slice(
                          0,
                          1
                        )
                        .toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.profileTitleRow
                    }
                  >
                    <View>
                      <View
                        style={
                          styles.nameRow
                        }
                      >
                        <Text
                          style={
                            styles.profileName
                          }
                        >
                          {
                            selectedProfile.displayName
                          }
                        </Text>

                        {selectedProfile.verified ? (
                          <Text
                            style={
                              styles.verifiedLarge
                            }
                          >
                            ✓ VERIFIED
                          </Text>
                        ) : null}
                      </View>

                      <Text
                        style={
                          styles.profileUsername
                        }
                      >
                        @
                        {
                          selectedProfile.username
                        }
                      </Text>
                    </View>

                    {selectedProfile.liveNow ? (
                      <View
                        style={
                          styles.liveLarge
                        }
                      >
                        <View
                          style={
                            styles.liveDot
                          }
                        />

                        LIVE NOW
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={
                      styles.profileBio
                    }
                  >
                    {selectedProfile.bio ||
                      "This trader has not added a bio yet."}
                  </Text>

                  <Text
                    style={
                      styles.categoryText
                    }
                  >
                    {getContentCategoryLabel(
                      selectedProfile.contentCategory
                    ).toUpperCase()}
                  </Text>

                  <View
                    style={
                      styles.profileStats
                    }
                  >
                    <ProfileStat
                      value={
                        selectedProfile.followerCount
                      }
                      label="FOLLOWERS"
                    />

                    <ProfileStat
                      value={
                        selectedProfile.subscriberCount
                      }
                      label="SUBSCRIBERS"
                    />

                    <ProfileStat
                      value={
                        selectedProfile.viewCount
                      }
                      label="PROFILE VIEWS"
                    />
                  </View>

                  {selectedProfile.userId !==
                  user?.uid ? (
                    <View
                      style={
                        styles.actionRow
                      }
                    >
                      <Pressable
                        disabled={working}
                        onPress={
                          handleFollow
                        }
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          following &&
                            styles.activeButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={
                            styles.secondaryButtonText
                          }
                        >
                          {following
                            ? "FOLLOWING"
                            : "FOLLOW"}
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={working}
                        onPress={
                          handleSubscribe
                        }
                        style={({ pressed }) => [
                          styles.primaryButton,
                          pressed &&
                            styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={
                            styles.primaryButtonText
                          }
                        >
                          {subscribed
                            ? "SUBSCRIBED"
                            : "SUBSCRIBE"}
                        </Text>
                      </Pressable>

                      {selectedProfile.liveNow ? (
                        <Pressable
                          onPress={() =>
                            selectedProfile.currentRoomId
                              ? router.push(
                                  `/live-room/${selectedProfile.currentRoomId}` as any
                                )
                              : undefined
                          }
                          style={({ pressed }) => [
                            styles.liveButton,
                            pressed &&
                              styles.buttonPressed,
                          ]}
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
                  ) : (
                    <Pressable
                      onPress={() =>
                        setShowCreate(
                          true
                        )
                      }
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed &&
                          styles.buttonPressed,
                      ]}
                    >
                      <Text
                        style={
                          styles.secondaryButtonText
                        }
                      >
                        MANAGE PROFILE
                      </Text>
                    </Pressable>
                  )}
                </View>
              </VaultSurface>
            ) : (
              <VaultSurface
                intensity="strong"
                style={styles.emptyDetail}
              >
                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Select a trader
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Explore the Vault1
                  network and select a
                  trader to view their
                  public channel.
                </Text>
              </VaultSurface>
            )}
          </View>
        </View>
      </ScrollView>

      {showCreate ? (
        <View style={styles.modalOverlay}>
          <VaultSurface
            intensity="strong"
            style={styles.modal}
          >
            <View
              style={
                styles.modalHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalEyebrow
                  }
                >
                  CREATOR NETWORK
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Create Trader Profile
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowCreate(false)
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.closeText
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <Field
              label="USERNAME"
              value={username}
              onChangeText={setUsername}
              placeholder="rahultrades"
            />

            <Field
              label="DISPLAY NAME"
              value={displayName}
              onChangeText={
                setDisplayName
              }
              placeholder="Rahul Trades"
            />

            <Field
              label="BIO"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the Vault1 community about your trading..."
              multiline
            />

            <Text
              style={styles.fieldLabel}
            >
              CONTENT CATEGORY
            </Text>

            <View
              style={
                styles.categoryOptions
              }
            >
              {(
                [
                  "TRADING",
                  "EDUCATION",
                  "COMMENTARY",
                  "ENTERTAINMENT",
                  "JOURNAL",
                ] as const
              ).map(
                (item) => (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setCategory(
                        item
                      )
                    }
                    style={({ pressed }) => [
                      styles.categoryChip,
                      category ===
                        item &&
                        styles.categoryChipActive,
                      pressed &&
                        styles.buttonPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category ===
                          item &&
                          styles.categoryChipTextActive,
                      ]}
                    >
                      {getContentCategoryLabel(
                        item
                      ).toUpperCase()}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Pressable
              disabled={working}
              onPress={
                handleCreateProfile
              }
              style={({ pressed }) => [
                styles.primaryButton,
                styles.createButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              {working ? (
                <ActivityIndicator
                  color={COLORS.glassBg}
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  PUBLISH PROFILE
                </Text>
              )}
            </Pressable>
          </VaultSurface>
        </View>
      ) : null}
    </View>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <VaultSurface
      intensity="medium"
      style={styles.metric}
    >
      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.metricValue,
          accent &&
            styles.metricAccent,
        ]}
      >
        {value}
      </Text>
    </VaultSurface>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <View>
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

function ProfileStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <View style={styles.profileStat}>
      <Text
        style={
          styles.profileStatValue
        }
      >
        {value.toLocaleString(
          "en-IN"
        )}
      </Text>

      <Text
        style={
          styles.profileStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text
        style={styles.fieldLabel}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#555"
        multiline={multiline}
        style={[
          styles.input,
          multiline &&
            styles.textArea,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
  },

  sidebar: {
    display: "none",
    width: 238,
    backgroundColor: COLORS.glassBg,
    borderRightWidth: 1,
    borderRightColor: "#202020",
    paddingTop: 28,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 38,
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: violet,
    color: COLORS.ink,
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 15,
    fontFamily: FONT.black,
    marginRight: 12,
  },

  brandTitle: {
    color: COLORS.ink,
    fontSize: 18,
    fontFamily: FONT.black,
    letterSpacing: 2,
  },

  brandSub: {
    color: "#626262",
    fontSize: 8,
    fontFamily: FONT.extraBold,
    letterSpacing: 2,
    marginTop: 2,
  },

  nav: {
    paddingHorizontal: 12,
  },

  navSection: {
    color: COLORS.muted,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },

  navItem: {
    height: 44,
    borderRadius: 9,
    justifyContent: "center",
    paddingHorizontal: 12,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#2B1D42",
  },

  navText: {
    color: "#707070",
    fontSize: 13,
    fontFamily: FONT.bold,
  },

  navTextActive: {
    color: "#C6A8FF",
  },

  content: {
    flex: 1,
  },

  contentInner: {
    padding: 42,
    paddingBottom: 80,
    maxWidth: 1600,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 34,
  },

  eyebrow: {
    color: "#7654B5",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 2.5,
    marginBottom: 10,
  },

  title: {
    color: "#3F3F3B",
    fontSize: 46,
    fontFamily: FONT.black,
    letterSpacing: -1.5,
  },

  subtitle: {
    color: "#737373",
    fontSize: 15,
    marginTop: 8,
  },

  headerActions: {
    alignItems: "flex-end",
  },

  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 9,
    backgroundColor: violet,
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: COLORS.ink,
    fontSize: 11,
    fontFamily: FONT.black,
    letterSpacing: 1.1,
  },

  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#363636",
    backgroundColor: COLORS.glassBg,
    justifyContent: "center",
    alignItems: "center",
  },

  activeButton: {
    borderColor: "#7250A7",
    backgroundColor: COLORS.glassBg,
  },

  secondaryButtonText: {
    color: "#D1D1D1",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  liveButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#5A3030",
    backgroundColor: COLORS.glassBg,
    justifyContent: "center",
    alignItems: "center",
  },

  liveButtonText: {
    color: "#B24A57",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  errorBox: {
    borderWidth: 1,
    borderColor: "#5B2929",
    backgroundColor: COLORS.glassBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },

  errorText: {
    color: "#B24A57",
    fontSize: 13,
    fontFamily: FONT.bold,
  },

  successBox: {
    borderWidth: 1,
    borderColor: "#294A37",
    backgroundColor: COLORS.glassBg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },

  successText: {
    color: "#8CC9A3",
    fontSize: 13,
    fontFamily: FONT.bold,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 24,
  },

  metric: {
    flex: 1,
    minHeight: 126,
  },

  metricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
    padding: 20,
    paddingBottom: 0,
  },

  metricValue: {
    color: "#3F3F3B",
    fontSize: 32,
    fontFamily: FONT.black,
    padding: 20,
    paddingTop: 12,
  },

  metricAccent: {
    color: "#B993FF",
  },

  searchRow: {
    marginBottom: 26,
  },

  searchInput: {
    height: 52,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292929",
    borderRadius: 10,
    paddingHorizontal: 18,
    color: "#3F3F3B",
    fontSize: 14,
  },

  mainGrid: {
    flexDirection: "row",
    gap: 22,
  },

  traderList: {
    flex: 1.1,
  },

  detailColumn: {
    flex: 1,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#4A4A46",
    fontSize: 21,
    fontFamily: FONT.black,
  },

  sectionSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },

  countText: {
    color: "#8E69C7",
    fontSize: 14,
    fontFamily: FONT.black,
  },

  traderCard: {
    flexDirection: "row",
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.navyLine,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
  },

  traderCardActive: {
    borderColor: "#62449A",
    backgroundColor: COLORS.glassBg,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#3C2A55",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  avatarText: {
    color: "#B993FF",
    fontSize: 21,
    fontFamily: FONT.black,
  },

  traderIdentity: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  traderName: {
    color: "#4A4A46",
    fontSize: 16,
    fontFamily: FONT.black,
  },

  verified: {
    color: "#A982F0",
    fontSize: 12,
    fontFamily: FONT.black,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#4A2929",
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D56A6A",
    marginRight: 5,
  },

  liveText: {
    color: "#DB8B8B",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  username: {
    color: "#7654A8",
    fontSize: 11,
    fontFamily: FONT.bold,
    marginTop: 3,
  },

  traderBio: {
    color: "#777777",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },

  statsRow: {
    flexDirection: "row",
    gap: 22,
    marginTop: 13,
  },

  statValue: {
    color: "#D5D5D5",
    fontSize: 12,
    fontFamily: FONT.black,
  },

  statLabel: {
    color: "#4F4F4F",
    fontSize: 8,
    fontFamily: FONT.extraBold,
    marginTop: 3,
  },

  emptyCard: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  emptyDetail: {
    minHeight: 500,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },

  emptyTitle: {
    color: "#4A4A46",
    fontSize: 21,
    fontFamily: FONT.black,
    marginBottom: 8,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
  },

  profileHero: {
    minHeight: 500,
  },

  profileBanner: {
    height: 120,
    backgroundColor: COLORS.glassBg,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2038",
  },

  profileBody: {
    padding: 28,
    paddingTop: 0,
  },

  largeAvatar: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: COLORS.glassBg,
    borderWidth: 2,
    borderColor: "#5B4080",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -46,
    marginBottom: 18,
  },

  largeAvatarText: {
    color: "#C09AFF",
    fontSize: 34,
    fontFamily: FONT.black,
  },

  profileTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  profileName: {
    color: "#3F3F3B",
    fontSize: 27,
    fontFamily: FONT.black,
  },

  verifiedLarge: {
    color: "#A982F0",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1,
  },

  profileUsername: {
    color: "#7654A8",
    fontSize: 13,
    fontFamily: FONT.bold,
    marginTop: 3,
  },

  liveLarge: {
    color: "#DB8B8B",
    fontSize: 10,
    fontFamily: FONT.black,
    letterSpacing: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  profileBio: {
    color: "#A0A0A0",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 22,
  },

  categoryText: {
    color: "#6F55A0",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
    marginTop: 17,
  },

  profileStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.navyLine,
    marginTop: 25,
    paddingVertical: 18,
  },

  profileStat: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: COLORS.navyLine,
    paddingLeft: 16,
  },

  profileStatValue: {
    color: "#4A4A46",
    fontSize: 19,
    fontFamily: FONT.black,
  },

  profileStatLabel: {
    color: COLORS.muted,
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 1,
    marginTop: 4,
  },

  actionRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 24,
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  modal: {
    width: "100%",
    maxWidth: 620,
    padding: 28,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  modalEyebrow: {
    color: "#7654B5",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 2,
  },

  modalTitle: {
    color: "#3F3F3B",
    fontSize: 27,
    fontFamily: FONT.black,
    marginTop: 5,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#AAAAAA",
    fontSize: 25,
    lineHeight: 27,
  },

  field: {
    marginBottom: 17,
  },

  fieldLabel: {
    color: "#656565",
    fontSize: 9,
    fontFamily: FONT.black,
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  input: {
    minHeight: 48,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 9,
    color: "#4A4A46",
    paddingHorizontal: 14,
    fontSize: 14,
  },

  textArea: {
    minHeight: 100,
    paddingTop: 13,
    textAlignVertical: "top",
  },

  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 22,
  },

  categoryChip: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: "#292929",
  },

  categoryChipActive: {
    borderColor: "#6949A0",
    backgroundColor: COLORS.glassBg,
  },

  categoryChipText: {
    color: "#686868",
    fontSize: 8,
    fontFamily: FONT.black,
    letterSpacing: 0.8,
  },

  categoryChipTextActive: {
    color: "#B993FF",
  },

  createButton: {
    marginTop: 4,
  },
});