import React, {
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

import {
  createCreatorPost,
  createCreatorProfile,
  getCreatorAnalytics,
  getPublicCreators,
  getPublicCreatorPosts,
  getUserCreatorProfile,
  publishCreatorPost,
  publishCreatorProfile,
} from "../services/creators/creatorService";

import { useAuth } from "../services/auth/AuthProvider";

import { FONT, COLORS } from "./theme/theme";

import {
  CreatorContentCategory,
  CreatorContentType,
  CreatorPost,
  CreatorProfile,
} from "../types/creator";

const categories: {
  label: string;
  value:
    | "ALL"
    | CreatorContentCategory;
}[] = [
  {
    label: "ALL",
    value: "ALL",
  },
  {
    label: "TRADING",
    value: "TRADING",
  },
  {
    label: "EDUCATION",
    value: "EDUCATION",
  },
  {
    label: "MARKET",
    value: "MARKET",
  },
  {
    label: "JOURNAL",
    value: "JOURNAL",
  },
  {
    label: "STRATEGY",
    value: "STRATEGY",
  },
];

export default function CreatorsScreen() {
  const { user } =
    useAuth();

  const [
    creators,
    setCreators,
  ] = useState<
    CreatorProfile[]
  >([]);

  const [
    posts,
    setPosts,
  ] = useState<
    CreatorPost[]
  >([]);

  const [
    myCreator,
    setMyCreator,
  ] =
    useState<CreatorProfile | null>(
      null
    );

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    category,
    setCategory,
  ] =
    useState<
      "ALL" |
      CreatorContentCategory
    >("ALL");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    showCreate,
    setShowCreate,
  ] = useState(false);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    displayName,
    setDisplayName,
  ] = useState("");

  const [
    bio,
    setBio,
  ] = useState("");

  const [
    newPostTitle,
    setNewPostTitle,
  ] = useState("");

  const [
    newPostBody,
    setNewPostBody,
  ] = useState("");

  const [
    newPostCategory,
    setNewPostCategory,
  ] =
    useState<CreatorContentCategory>(
      "TRADING"
    );

  const [
    newPostType,
    setNewPostType,
  ] =
    useState<CreatorContentType>(
      "POST"
    );

  const [
    showComposer,
    setShowComposer,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const load =
    async () => {
      try {
        setLoading(true);

        const [
          publicCreators,
          publicPosts,
        ] =
          await Promise.all([
            getPublicCreators(),
            getPublicCreatorPosts(),
          ]);

        setCreators(
          publicCreators
        );

        setPosts(
          publicPosts
        );

        if (user) {
          const mine =
            await getUserCreatorProfile(
              user.uid
            );

          setMyCreator(
            mine
          );
        }
      } catch (error) {
        console.error(
          "Creator load failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    load();
  }, [user?.uid]);

  const filteredCreators =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return creators;
      }

      return creators.filter(
        (creator) =>
          creator.displayName
            .toLowerCase()
            .includes(q) ||
          creator.username
            .toLowerCase()
            .includes(q) ||
          creator.bio
            .toLowerCase()
            .includes(q)
      );
    }, [
      creators,
      search,
    ]);

  const filteredPosts =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return posts.filter(
        (post) => {
          const matchesCategory =
            category ===
              "ALL" ||
            post.category ===
              category;

          const matchesSearch =
            !q ||
            post.title
              .toLowerCase()
              .includes(q) ||
            post.creatorName
              .toLowerCase()
              .includes(q) ||
            post.username
              .toLowerCase()
              .includes(q) ||
            post.tags.some(
              (tag) =>
                tag
                  .toLowerCase()
                  .includes(q)
            );

          return (
            matchesCategory &&
            matchesSearch
          );
        }
      );
    }, [
      posts,
      category,
      search,
    ]);

  const handleCreateCreator =
    async () => {
      if (!user) {
        return;
      }

      try {
        setCreating(true);

        const creatorId =
          await createCreatorProfile(
            user.uid,
            {
              username,
              displayName,
              bio,
            }
          );

        await publishCreatorProfile(
          creatorId,
          user.uid
        );

        setShowCreate(
          false
        );

        setUsername("");
        setDisplayName("");
        setBio("");

        await load();
      } catch (error: any) {
        console.error(
          error
        );
      } finally {
        setCreating(false);
      }
    };

  const handlePublishPost =
    async () => {
      if (
        !user ||
        !myCreator
      ) {
        return;
      }

      try {
        setPublishing(true);

        const postId =
          await createCreatorPost(
            user.uid,
            myCreator,
            {
              title:
                newPostTitle,
              excerpt:
                newPostBody.slice(
                  0,
                  150
                ),
              body:
                newPostBody,
              type:
                newPostType,
              category:
                newPostCategory,
              visibility:
                "PUBLIC",
            }
          );

        await publishCreatorPost(
          postId,
          user.uid
        );

        setNewPostTitle("");
        setNewPostBody("");

        setShowComposer(
          false
        );

        await load();
      } catch (error) {
        console.error(
          "Publish failed:",
          error
        );
      } finally {
        setPublishing(
          false
        );
      }
    };

  return (
    <View
      style={
        styles.screen
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.header
          }
        >
          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              COMMUNITY / CREATOR NETWORK
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Creators
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Discover traders, educators and market
              voices shaping the Vault1 community.
            </Text>
          </View>

          <View
            style={
              styles.headerActions
            }
          >
            {myCreator ? (
              <Pressable
                onPress={() =>
                  setShowComposer(
                    true
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.primaryButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  + CREATE CONTENT
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  setShowCreate(
                    true
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.primaryButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  BECOME A CREATOR
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View
          style={
            styles.metrics
          }
        >
          <Metric
            label="CREATORS"
            value={
              creators.length
            }
          />

          <Metric
            label="PUBLIC POSTS"
            value={
              posts.length
            }
          />

          <Metric
            label="TOTAL VIEWS"
            value={formatNumber(
              posts.reduce(
                (sum, post) =>
                  sum +
                  post.viewsCount,
                0
              )
            )}
          />

          <Metric
            label="CREATOR FOLLOWERS"
            value={formatNumber(
              creators.reduce(
                (
                  sum,
                  creator
                ) =>
                  sum +
                  creator.followerCount,
                0
              )
            )}
          />
        </View>

        <View
          style={
            styles.toolbar
          }
        >
          <View
            style={
              styles.search
            }
          >
            <Text
              style={
                styles.searchPrefix
              }
            >
              /
            </Text>

            <TextInput
              value={
                search
              }
              onChangeText={
                setSearch
              }
              placeholder="Search creators or content..."
              placeholderTextColor={COLORS.muted}
              style={
                styles.searchInput
              }
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.categoryList
            }
          >
            {categories.map(
              (item) => (
                <Pressable
                  key={
                    item.value
                  }
                  onPress={() =>
                    setCategory(
                      item.value
                    )
                  }
                  style={[
                    styles.categoryChip,
                    category ===
                      item.value &&
                      styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category ===
                        item.value &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {
                      item.label
                    }
                  </Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </View>

        {loading ? (
          <View
            style={
              styles.loading
            }
          >
            <ActivityIndicator />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading creator network...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Featured Creators
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Public voices worth discovering
                </Text>
              </View>
            </View>

            {filteredCreators.length ===
            0 ? (
              <VaultSurface>
                <View
                  style={
                    styles.empty
                  }
                >
                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No creators found
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Public creator profiles will
                    appear here as the network grows.
                  </Text>
                </View>
              </VaultSurface>
            ) : (
              <View
                style={
                  styles.creatorGrid
                }
              >
                {filteredCreators
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      creator
                    ) => (
                      <CreatorCard
                        key={
                          creator.id
                        }
                        creator={
                          creator
                        }
                        onPress={() =>
                          router.push({
                            pathname:
                              "/trader/[username]",
                            params: {
                              username:
                                creator.username,
                            },
                          })
                        }
                      />
                    )
                  )}
              </View>
            )}

            <View
              style={
                styles.sectionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Creator Feed
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  Latest public creator content
                </Text>
              </View>

              <Text
                style={
                  styles.feedCount
                }
              >
                {
                  filteredPosts.length
                }{" "}
                ITEMS
              </Text>
            </View>

            {filteredPosts.length ===
            0 ? (
              <VaultSurface>
                <View
                  style={
                    styles.empty
                  }
                >
                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    The feed is quiet
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Creator posts, journals, strategies
                    and videos will appear here.
                  </Text>
                </View>
              </VaultSurface>
            ) : (
              <View
                style={
                  styles.feed
                }
              >
                {filteredPosts.map(
                  (
                    post
                  ) => (
                    <PostCard
                      key={
                        post.id
                      }
                      post={
                        post
                      }
                      onCreatorPress={() =>
                        router.push({
                          pathname:
                            "/trader/[username]",
                          params: {
                            username:
                              post.username,
                          },
                        })
                      }
                    />
                  )
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {showCreate && (
        <Overlay>
          <VaultSurface
            intensity="strong"
            style={
              styles.modal
            }
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
                  CREATOR PROFILE
                </Text>

                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Start creating
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setShowCreate(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.close
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <Field
              label="USERNAME"
              value={
                username
              }
              onChangeText={
                setUsername
              }
              placeholder="yourusername"
            />

            <Field
              label="DISPLAY NAME"
              value={
                displayName
              }
              onChangeText={
                setDisplayName
              }
              placeholder="Your public name"
            />

            <Field
              label="BIO"
              value={
                bio
              }
              onChangeText={
                setBio
              }
              placeholder="Tell the community what you create..."
              multiline
            />

            <Pressable
              onPress={
                handleCreateCreator
              }
              disabled={
                creating
              }
              style={
                styles.modalButton
              }
            >
              <Text
                style={
                  styles.modalButtonText
                }
              >
                {creating
                  ? "CREATING..."
                  : "CREATE CREATOR PROFILE"}
              </Text>
            </Pressable>
          </VaultSurface>
        </Overlay>
      )}

      {showComposer &&
        myCreator && (
          <Overlay>
            <VaultSurface
              intensity="strong"
              style={
                styles.modal
              }
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
                    PUBLISH
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    Create content
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setShowComposer(
                      false
                    )
                  }
                >
                  <Text
                    style={
                      styles.close
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <Field
                label="TITLE"
                value={
                  newPostTitle
                }
                onChangeText={
                  setNewPostTitle
                }
                placeholder="What do you want to share?"
              />

              <Text
                style={
                  styles.fieldLabel
                }
              >
                CONTENT TYPE
              </Text>

              <View
                style={
                  styles.typeRow
                }
              >
                {[
                  "POST",
                  "SHORT",
                  "VIDEO",
                  "JOURNAL",
                  "STRATEGY",
                ].map(
                  (
                    type
                  ) => (
                    <Pressable
                      key={
                        type
                      }
                      onPress={() =>
                        setNewPostType(
                          type as CreatorContentType
                        )
                      }
                      style={[
                        styles.typeChip,
                        newPostType ===
                          type &&
                          styles.typeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          newPostType ===
                            type &&
                            styles.typeTextActive,
                        ]}
                      >
                        {
                          type
                        }
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Text
                style={
                  styles.fieldLabel
                }
              >
                CATEGORY
              </Text>

              <View
                style={
                  styles.typeRow
                }
              >
                {[
                  "TRADING",
                  "EDUCATION",
                  "COMMENTARY",
                  "JOURNAL",
                  "MARKET",
                  "STRATEGY",
                ].map(
                  (
                    value
                  ) => (
                    <Pressable
                      key={
                        value
                      }
                      onPress={() =>
                        setNewPostCategory(
                          value as CreatorContentCategory
                        )
                      }
                      style={[
                        styles.typeChip,
                        newPostCategory ===
                          value &&
                          styles.typeChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeText,
                          newPostCategory ===
                            value &&
                            styles.typeTextActive,
                        ]}
                      >
                        {
                          value
                        }
                      </Text>
                    </Pressable>
                  )
                )}
              </View>

              <Field
                label="CONTENT"
                value={
                  newPostBody
                }
                onChangeText={
                  setNewPostBody
                }
                placeholder="Write your content..."
                multiline
                large
              />

              <Pressable
                onPress={
                  handlePublishPost
                }
                disabled={
                  publishing
                }
                style={
                  styles.modalButton
                }
              >
                <Text
                  style={
                    styles.modalButtonText
                  }
                >
                  {publishing
                    ? "PUBLISHING..."
                    : "PUBLISH TO COMMUNITY"}
                </Text>
              </Pressable>
            </VaultSurface>
          </Overlay>
        )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* COMPONENTS                                                                 */
/* -------------------------------------------------------------------------- */

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <VaultSurface
      intensity="subtle"
      style={
        styles.metric
      }
    >
      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>
    </VaultSurface>
  );
}

function CreatorCard({
  creator,
  onPress,
}: {
  creator: CreatorProfile;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.creatorCard,
        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.creatorTop
        }
      >
        <View
          style={
            styles.creatorAvatar
          }
        >
          <Text
            style={
              styles.creatorAvatarText
            }
          >
            {creator.displayName
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        {creator.verified && (
          <View
            style={
              styles.verified
            }
          >
            <Text
              style={
                styles.verifiedText
              }
            >
              ✓ VERIFIED
            </Text>
          </View>
        )}
      </View>

      <Text
        style={
          styles.creatorName
        }
        numberOfLines={
          1
        }
      >
        {
          creator.displayName
        }
      </Text>

      <Text
        style={
          styles.creatorUsername
        }
      >
        @{creator.username}
      </Text>

      <Text
        style={
          styles.creatorBio
        }
        numberOfLines={
          2
        }
      >
        {creator.bio ||
          "Vault1 community creator"}
      </Text>

      <View
        style={
          styles.creatorStats
        }
      >
        <MiniStat
          label="FOLLOWERS"
          value={formatNumber(
            creator.followerCount
          )}
        />

        <MiniStat
          label="POSTS"
          value={formatNumber(
            creator.postCount
          )}
        />

        <MiniStat
          label="VIEWS"
          value={formatNumber(
            creator.totalViews
          )}
        />
      </View>
    </Pressable>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text
        style={
          styles.miniLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.miniValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function PostCard({
  post,
  onCreatorPress,
}: {
  post: CreatorPost;
  onCreatorPress: () => void;
}) {
  return (
    <VaultSurface
      intensity="subtle"
      style={
        styles.postCard
      }
    >
      <View
        style={
          styles.postHeader
        }
      >
        <Pressable
          onPress={
            onCreatorPress
          }
          style={
            styles.postCreator
          }
        >
          <View
            style={
              styles.postAvatar
            }
          >
            <Text
              style={
                styles.postAvatarText
              }
            >
              {post.creatorName
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View>
            <Text
              style={
                styles.postCreatorName
              }
            >
              {
                post.creatorName
              }
            </Text>

            <Text
              style={
                styles.postCreatorUsername
              }
            >
              @{post.username}
            </Text>
          </View>
        </Pressable>

        <View
          style={
            styles.postMeta
          }
        >
          <Text
            style={
              styles.postType
            }
          >
            {post.type}
          </Text>

          <Text
            style={
              styles.postCategory
            }
          >
            {post.category}
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.postTitle
        }
      >
        {post.title}
      </Text>

      <Text
        style={
          styles.postExcerpt
        }
        numberOfLines={
          3
        }
      >
        {post.excerpt ||
          post.body}
      </Text>

      {post.tags.length >
        0 && (
        <View
          style={
            styles.tags
          }
        >
          {post.tags
            .slice(
              0,
              5
            )
            .map(
              (tag) => (
                <View
                  key={
                    tag
                  }
                  style={
                    styles.tag
                  }
                >
                  <Text
                    style={
                      styles.tagText
                    }
                  >
                    #
                    {tag}
                  </Text>
                </View>
              )
            )}
        </View>
      )}

      <View
        style={
          styles.engagement
        }
      >
        <Text
          style={
            styles.engagementText
          }
        >
          ♥{" "}
          {
            post.likesCount
          }
        </Text>

        <Text
          style={
            styles.engagementText
          }
        >
          ◌{" "}
          {
            post.commentsCount
          }
        </Text>

        <Text
          style={
            styles.engagementText
          }
        >
          □{" "}
          {
            post.savesCount
          }
        </Text>

        <Text
          style={
            styles.engagementText
          }
        >
          ◉{" "}
          {
            post.viewsCount
          }
        </Text>
      </View>
    </VaultSurface>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  large,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  multiline?: boolean;
  large?: boolean;
}) {
  return (
    <View
      style={
        styles.field
      }
    >
      <Text
        style={
          styles.fieldLabel
        }
      >
        {label}
      </Text>

      <TextInput
        value={
          value
        }
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={COLORS.muted}
        multiline={
          multiline
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
          large &&
            styles.largeInput,
        ]}
      />
    </View>
  );
}

function Overlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <View
      style={
        styles.overlay
      }
    >
      {children}
    </View>
  );
}

function formatNumber(
  value: number
) {
  if (
    value >=
    1_000_000
  ) {
    return `${(
      value /
      1_000_000
    ).toFixed(1)}M`;
  }

  if (
    value >=
    1_000
  ) {
    return `${(
      value /
      1_000
    ).toFixed(1)}K`;
  }

  return String(
    Math.round(
      value
    )
  );
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles =
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor:
        COLORS.ink,
    },

    content: {
      padding: 34,
      paddingBottom: 90,
    },

    header: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
      marginBottom: 28,
    },

    eyebrow: {
      color: "#777",
      fontSize: 10,
      fontFamily: FONT.black,
      letterSpacing:
        2,
      marginBottom: 10,
    },

    title: {
      color: "#3F3F3B",
      fontSize: 44,
      fontFamily: FONT.black,
      letterSpacing:
        -1.5,
    },

    subtitle: {
      color: "#777",
      fontSize: 15,
      lineHeight: 22,
      marginTop: 9,
      maxWidth: 650,
    },

    headerActions: {
      flexDirection:
        "row",
      alignItems:
        "center",
    },

    primaryButton: {
      backgroundColor:
        COLORS.ink,
      borderWidth: 1,
      borderColor:
        "#7150A6",
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 7,
    },

    primaryButtonText: {
      color: "#C9B5F3",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    metrics: {
      flexDirection:
        "row",
      gap: 12,
      marginBottom: 25,
    },

    metric: {
      flex: 1,
      minHeight: 115,
      padding: 19,
    },

    metricLabel: {
      color: "#5B5B5B",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1.4,
    },

    metricValue: {
      color: "#4A4A46",
      fontSize: 29,
      fontFamily: FONT.black,
      marginTop: 22,
    },

    toolbar: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 16,
      marginBottom: 32,
    },

    search: {
      width: 320,
      height: 45,
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#292929",
      backgroundColor:
        COLORS.ink,
      borderRadius: 8,
      paddingHorizontal: 13,
    },

    searchPrefix: {
      color: "#8B5CF6",
      fontSize: 17,
      fontFamily: FONT.black,
      marginRight: 8,
    },

    searchInput: {
      flex: 1,
      color: COLORS.muted,
      fontSize: 13,
    },

    categoryList: {
      gap: 7,
    },

    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 7,
    },

    categoryChipActive: {
      backgroundColor:
        COLORS.ink,
      borderColor:
        "#6947A1",
    },

    categoryText: {
      color: "#5C5C5C",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    categoryTextActive: {
      color: "#B79BEF",
    },

    sectionHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-end",
      marginBottom: 15,
      marginTop: 10,
    },

    sectionTitle: {
      color: "#4A4A46",
      fontSize: 22,
      fontFamily: FONT.extraBold,
    },

    sectionSubtitle: {
      color: "#555",
      fontSize: 11,
      marginTop: 5,
    },

    feedCount: {
      color: "#555",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1.3,
    },

    creatorGrid: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 13,
      marginBottom: 34,
    },

    creatorCard: {
      width:
        "32.35%" as any,
      minHeight: 245,
      backgroundColor:
        COLORS.ink,
      borderWidth: 1,
      borderColor:
        "#292929",
      borderRadius: 11,
      padding: 19,
    },

    creatorTop: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 14,
    },

    creatorAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        COLORS.ink,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    creatorAvatarText: {
      color: "#B79BEF",
      fontSize: 17,
      fontFamily: FONT.black,
    },

    verified: {
      borderWidth: 1,
      borderColor:
        "#4D386D",
      paddingHorizontal: 7,
      paddingVertical: 5,
      borderRadius: 5,
    },

    verifiedText: {
      color: "#9275C3",
      fontSize: 7,
      fontFamily: FONT.black,
      letterSpacing:
        0.7,
    },

    creatorName: {
      color: COLORS.muted,
      fontSize: 16,
      fontFamily: FONT.extraBold,
    },

    creatorUsername: {
      color: "#555",
      fontSize: 9,
      marginTop: 4,
    },

    creatorBio: {
      color: "#6B6B6B",
      fontSize: 11,
      lineHeight: 17,
      marginTop: 13,
      minHeight: 36,
    },

    creatorStats: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      borderTopWidth: 1,
      borderTopColor:
        "#202020",
      paddingTop: 14,
      marginTop: 15,
    },

    miniLabel: {
      color: "#4F4F4F",
      fontSize: 7,
      fontFamily: FONT.black,
      letterSpacing:
        0.8,
    },

    miniValue: {
      color: "#C9C9C9",
      fontSize: 12,
      fontFamily: FONT.extraBold,
      marginTop: 4,
    },

    feed: {
      gap: 13,
    },

    postCard: {
      padding: 22,
    },

    postHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "center",
      marginBottom: 18,
    },

    postCreator: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap: 10,
    },

    postAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor:
        COLORS.ink,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    postAvatarText: {
      color: "#B79BEF",
      fontSize: 13,
      fontFamily: FONT.black,
    },

    postCreatorName: {
      color: "#D7D7D7",
      fontSize: 12,
      fontFamily: FONT.extraBold,
    },

    postCreatorUsername: {
      color: "#555",
      fontSize: 8,
      marginTop: 3,
    },

    postMeta: {
      alignItems:
        "flex-end",
    },

    postType: {
      color: "#9B7BCD",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    postCategory: {
      color: "#555",
      fontSize: 8,
      fontFamily: FONT.extraBold,
      marginTop: 4,
    },

    postTitle: {
      color: COLORS.muted,
      fontSize: 23,
      lineHeight: 29,
      fontFamily: FONT.extraBold,
      letterSpacing:
        -0.4,
    },

    postExcerpt: {
      color: "#777",
      fontSize: 13,
      lineHeight: 21,
      marginTop: 10,
      maxWidth: 900,
    },

    tags: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 6,
      marginTop: 15,
    },

    tag: {
      backgroundColor:
        COLORS.ink,
      borderWidth: 1,
      borderColor:
        "#29202F",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 5,
    },

    tagText: {
      color: "#8067A5",
      fontSize: 8,
      fontFamily: FONT.extraBold,
    },

    engagement: {
      flexDirection:
        "row",
      gap: 22,
      borderTopWidth: 1,
      borderTopColor:
        "#202020",
      marginTop: 20,
      paddingTop: 14,
    },

    engagementText: {
      color: "#555",
      fontSize: 10,
      fontFamily: FONT.bold,
    },

    loading: {
      minHeight: 450,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    loadingText: {
      color: "#555",
      fontSize: 11,
      marginTop: 10,
    },

    empty: {
      minHeight: 240,
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    emptyTitle: {
      color: "#D8D8D8",
      fontSize: 20,
      fontFamily: FONT.extraBold,
    },

    emptyText: {
      color: "#555",
      fontSize: 12,
      lineHeight: 19,
      textAlign:
        "center",
      maxWidth: 500,
      marginTop: 8,
    },

    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor:
        "rgba(0,0,0,0.78)",
      alignItems:
        "center",
      justifyContent:
        "center",
      padding: 30,
    },

    modal: {
      width: 620,
      maxWidth:
        "100%" as any,
      maxHeight:
        "90%" as any,
    },

    modalHeader: {
      flexDirection:
        "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      padding: 23,
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.navyLine,
    },

    modalEyebrow: {
      color: "#8065A7",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1.5,
      marginBottom: 6,
    },

    modalTitle: {
      color: "#4A4A46",
      fontSize: 25,
      fontFamily: FONT.black,
    },

    close: {
      color: "#777",
      fontSize: 28,
      lineHeight: 28,
    },

    field: {
      paddingHorizontal: 23,
      paddingTop: 15,
    },

    fieldLabel: {
      color: "#555",
      fontSize: 8,
      fontFamily: FONT.black,
      letterSpacing:
        1.2,
      marginBottom: 7,
    },

    input: {
      height: 44,
      borderWidth: 1,
      borderColor:
        "#292929",
      backgroundColor:
        COLORS.ink,
      color: COLORS.muted,
      borderRadius: 7,
      paddingHorizontal: 12,
      fontSize: 12,
    },

    multilineInput: {
      height: 88,
      textAlignVertical:
        "top",
      paddingTop: 11,
    },

    largeInput: {
      height: 150,
    },

    typeRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 7,
      paddingHorizontal: 23,
      marginBottom: 4,
    },

    typeChip: {
      borderWidth: 1,
      borderColor:
        "#292929",
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 6,
    },

    typeChipActive: {
      borderColor:
        "#6B4A9A",
      backgroundColor:
        COLORS.ink,
    },

    typeText: {
      color: "#555",
      fontSize: 8,
      fontFamily: FONT.black,
    },

    typeTextActive: {
      color: "#B89DEB",
    },

    modalButton: {
      margin: 23,
      marginTop: 20,
      height: 47,
      backgroundColor:
        COLORS.ink,
      borderWidth: 1,
      borderColor:
        "#7654AA",
      borderRadius: 7,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    modalButtonText: {
      color: "#CDB8F4",
      fontSize: 9,
      fontFamily: FONT.black,
      letterSpacing:
        1,
    },

    pressed: {
      opacity: 0.7,
      transform: [
        {
          translateY: 1,
        },
      ],
    },
  });