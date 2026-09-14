import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import {
  Asset,
  AssetClass,
  AssetMarket,
} from "../types/asset";

import {
  createAsset,
  getAssets,
} from "../services/assets/assetService";


const navigation = [
  {
    section: "COMMAND",
    items: ["Dashboard"],
  },
  {
    section: "GROWTH",
    items: [
      "Portfolio",
      "Trading",
      "Growth Missions",
      "Trade Journal",
    ],
  },
  {
    section: "MONEY",
    items: [
      "Capital",
      "Cashflow",
      "Transactions",
    ],
  },
  {
    section: "ANALYTICS",
    items: [
      "Performance",
      "Risk",
      "Reports",
    ],
  },
  {
    section: "INVESTORS",
    items: [
      "Investors",
      "Payouts",
      "Documents",
    ],
  },
];


const assetClasses: AssetClass[] = [
  "EQUITY",
  "ETF",
  "MUTUAL FUND",
  "CRYPTO",
  "GOLD",
  "FOREX",
  "COMMODITY",
  "FIXED INCOME",
  "CASH",
  "OTHER",
];


const markets: AssetMarket[] = [
  "INDIA",
  "US",
  "GLOBAL",
  "CRYPTO",
  "OTHER",
];


function formatINR(
  value?: number
): string {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return `₹${value.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}


export default function AssetsScreen() {

  const [
    assets,
    setAssets,
  ] = useState<Asset[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    selectedClass,
    setSelectedClass,
  ] = useState<
    AssetClass | "ALL"
  >("ALL");


  const [
    showForm,
    setShowForm,
  ] = useState(false);


  const [
    symbol,
    setSymbol,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    assetClass,
    setAssetClass,
  ] = useState<AssetClass>(
    "EQUITY"
  );

  const [
    exchange,
    setExchange,
  ] = useState("");

  const [
    currency,
    setCurrency,
  ] = useState("INR");

  const [
    market,
    setMarket,
  ] = useState<AssetMarket>(
    "INDIA"
  );

  const [
    country,
    setCountry,
  ] = useState("India");

  const [
    sector,
    setSector,
  ] = useState("");

  const [
    currentPrice,
    setCurrentPrice,
  ] = useState("");


  const loadAssets =
    useCallback(
      async (
        showLoader = true
      ) => {
        try {
          if (showLoader) {
            setLoading(true);
          }

          const result =
            await getAssets();

          setAssets(result);
        } catch (error: any) {
          console.error(
            "Failed to load assets:",
            error
          );

          Alert.alert(
            "Unable to load assets",
            error?.message ||
              "Something went wrong while loading assets."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadAssets();
  }, [loadAssets]);


  const handleRefresh =
    async () => {
      setRefreshing(true);

      try {
        await loadAssets(false);
      } finally {
        setRefreshing(false);
      }
    };


  const filteredAssets =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();


      return assets.filter(
        (asset: Asset) => {
          const matchesSearch =
            !query ||
            asset.symbol
              .toLowerCase()
              .includes(query) ||
            asset.name
              .toLowerCase()
              .includes(query) ||
            asset.exchange
              ?.toLowerCase()
              .includes(query);


          const matchesClass =
            selectedClass ===
              "ALL" ||
            asset.assetClass ===
              selectedClass;


          return (
            matchesSearch &&
            matchesClass
          );
        }
      );
    }, [
      assets,
      search,
      selectedClass,
    ]);


  const activeCount =
    assets.filter(
      (asset: Asset) =>
        asset.status === "ACTIVE"
    ).length;


  const tradableCount =
    assets.filter(
      (asset: Asset) =>
        asset.tradable
    ).length;


  const classCount =
    new Set(
      assets.map(
        (asset: Asset) =>
          asset.assetClass
      )
    ).size;


  const resetForm = () => {
    setSymbol("");
    setName("");
    setAssetClass(
      "EQUITY"
    );
    setExchange("");
    setCurrency("INR");
    setMarket("INDIA");
    setCountry("India");
    setSector("");
    setCurrentPrice("");
  };


  const handleCreateAsset =
    async () => {
      const cleanSymbol =
        symbol.trim();

      const cleanName =
        name.trim();

      const numericPrice =
        currentPrice.trim() ===
        ""
          ? undefined
          : Number(
              currentPrice
            );


      if (!cleanSymbol) {
        Alert.alert(
          "Symbol required",
          "Enter an asset symbol."
        );
        return;
      }


      if (!cleanName) {
        Alert.alert(
          "Name required",
          "Enter the asset name."
        );
        return;
      }


      if (
        numericPrice !==
          undefined &&
        (
          !Number.isFinite(
            numericPrice
          ) ||
          numericPrice < 0
        )
      ) {
        Alert.alert(
          "Invalid price",
          "Enter a valid current price."
        );
        return;
      }


      try {
        setSaving(true);

        await createAsset({
          symbol:
            cleanSymbol,

          name:
            cleanName,

          assetClass,

          exchange:
            exchange.trim(),

          currency:
            currency.trim(),

          market,

          country:
            country.trim(),

          sector:
            sector.trim(),

          currentPrice:
            numericPrice,

          priceSource:
            numericPrice !==
            undefined
              ? "MANUAL"
              : undefined,

          tradable: true,

          status: "ACTIVE",
        });


        resetForm();

        setShowForm(
          false
        );

        await loadAssets(
          false
        );

      } catch (error: any) {
        console.error(
          "Failed to create asset:",
          error
        );

        Alert.alert(
          "Unable to create asset",
          error?.message ||
            "Something went wrong while creating the asset."
        );
      } finally {
        setSaving(false);
      }
    };


  const handleNavigation =
    (item: string) => {
      switch (item) {
        case "Dashboard":
          router.replace(
            "/dashboard"
          );
          break;

        case "Portfolio":
          router.push(
            "/portfolio"
          );
          break;

        case "Trading":
          router.push(
            "/trading"
          );
          break;

        case "Capital":
          router.push(
            "/capital"
          );
          break;

        default:
          break;
      }
    };


  return (
    <View
      style={styles.screen}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <View
        style={styles.sidebar}
      >

        <View
          style={styles.brandBlock}
        >
          <Text
            style={styles.brand}
          >
            VAULT1
          </Text>

          <Text
            style={styles.brandSub}
          >
            WEALTH OPERATING SYSTEM
          </Text>
        </View>


        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.sidebarScroll
          }
        >
          {navigation.map(
            (group) => (
              <View
                key={
                  group.section
                }
                style={
                  styles.navGroup
                }
              >
                <Text
                  style={
                    styles.navSection
                  }
                >
                  {group.section}
                </Text>

                {group.items.map(
                  (item) => {
                    const active =
                      item ===
                      "Assets";

                    return (
                      <Pressable
                        key={item}
                        onPress={() =>
                          handleNavigation(
                            item
                          )
                        }
                        style={[
                          styles.navItem,
                          active &&
                            styles.navItemActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.navDot,
                            active &&
                              styles.navDotActive,
                          ]}
                        />

                        <Text
                          style={[
                            styles.navText,
                            active &&
                              styles.navTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  }
                )}
              </View>
            )
          )}

          {/* ASSET MANAGEMENT */}

          <View
            style={
              styles.navGroup
            }
          >
            <Text
              style={
                styles.navSection
              }
            >
              MANAGEMENT
            </Text>

            <Pressable
              style={[
                styles.navItem,
                styles.navItemActive,
              ]}
            >
              <View
                style={[
                  styles.navDot,
                  styles.navDotActive,
                ]}
              />

              <Text
                style={[
                  styles.navText,
                  styles.navTextActive,
                ]}
              >
                Assets
              </Text>
            </Pressable>
          </View>

        </ScrollView>


        <View
          style={
            styles.sidebarFooter
          }
        >
          <Text
            style={
              styles.sidebarFooterTitle
            }
          >
            ASSET MASTER
          </Text>

          <Text
            style={
              styles.sidebarFooterText
            }
          >
            Structured market universe
          </Text>
        </View>

      </View>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={
              handleRefresh
            }
            tintColor="#A78BFA"
          />
        }
      >

        {/* HEADER */}

        <View
          style={styles.header}
        >
          <View>
            <Text
              style={
                styles.eyebrow
              }
            >
              VAULT1 / MANAGEMENT / ASSETS
            </Text>

            <Text
              style={styles.title}
            >
              Assets
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              The master universe of
              securities and instruments
              available across Vault1.
            </Text>
          </View>


          <Pressable
            onPress={() =>
              setShowForm(
                (value: boolean) =>
                  !value
              )
            }
            style={
              styles.primaryButton
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {showForm
                ? "CLOSE FORM"
                : "ADD ASSET"}
            </Text>
          </Pressable>
        </View>


        {/* =================================================
            METRICS
        ================================================= */}

        <View
          style={
            styles.metricsRow
          }
        >

          <MetricCard
            label="TOTAL ASSETS"
            value={
              assets.length.toString()
            }
            caption="Master universe"
            accent
          />

          <MetricCard
            label="ACTIVE"
            value={
              activeCount.toString()
            }
            caption="Available assets"
          />

          <MetricCard
            label="TRADABLE"
            value={
              tradableCount.toString()
            }
            caption="Eligible for trading"
          />

          <MetricCard
            label="ASSET CLASSES"
            value={
              classCount.toString()
            }
            caption="Current universe"
          />

        </View>


        {/* =================================================
            ADD ASSET
        ================================================= */}

        {showForm && (
          <View
            style={
              styles.formCard
            }
          >

            <View
              style={
                styles.formHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.formTitle
                  }
                >
                  Add Asset
                </Text>

                <Text
                  style={
                    styles.formSubtitle
                  }
                >
                  Create a structured
                  instrument in the
                  Vault1 master universe.
                </Text>
              </View>
            </View>


            <View
              style={
                styles.formGrid
              }
            >

              <FormField
                label="SYMBOL"
                value={symbol}
                onChangeText={
                  setSymbol
                }
                placeholder="RELIANCE"
              />

              <FormField
                label="NAME"
                value={name}
                onChangeText={
                  setName
                }
                placeholder="Reliance Industries"
              />

              <FormField
                label="EXCHANGE"
                value={exchange}
                onChangeText={
                  setExchange
                }
                placeholder="NSE"
              />

              <FormField
                label="CURRENCY"
                value={currency}
                onChangeText={
                  setCurrency
                }
                placeholder="INR"
              />

              <FormField
                label="COUNTRY"
                value={country}
                onChangeText={
                  setCountry
                }
                placeholder="India"
              />

              <FormField
                label="SECTOR"
                value={sector}
                onChangeText={
                  setSector
                }
                placeholder="Financials"
              />

              <FormField
                label="CURRENT PRICE"
                value={
                  currentPrice
                }
                onChangeText={
                  setCurrentPrice
                }
                placeholder="Optional"
                keyboardType="numeric"
              />

            </View>


            <Text
              style={
                styles.selectorLabel
              }
            >
              ASSET CLASS
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.selectorRow
              }
            >
              {assetClasses.map(
                (
                  item: AssetClass
                ) => (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setAssetClass(
                        item
                      )
                    }
                    style={[
                      styles.selector,
                      assetClass ===
                        item &&
                        styles.selectorActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        assetClass ===
                          item &&
                          styles.selectorTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </ScrollView>


            <Text
              style={
                styles.selectorLabel
              }
            >
              MARKET
            </Text>

            <View
              style={
                styles.marketRow
              }
            >
              {markets.map(
                (
                  item: AssetMarket
                ) => (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setMarket(
                        item
                      )
                    }
                    style={[
                      styles.selector,
                      market ===
                        item &&
                        styles.selectorActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorText,
                        market ===
                          item &&
                          styles.selectorTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </View>


            <View
              style={
                styles.formFooter
              }
            >
              <Text
                style={
                  styles.formHint
                }
              >
                Price can later be replaced
                by the live market-data
                provider.
              </Text>

              <Pressable
                onPress={
                  handleCreateAsset
                }
                disabled={saving}
                style={[
                  styles.saveButton,
                  saving &&
                    styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    CREATE ASSET
                  </Text>
                )}
              </Pressable>
            </View>

          </View>
        )}


        {/* =================================================
            ASSET UNIVERSE
        ================================================= */}

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
              Asset Universe
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Search and manage the
              structured Vault1 instrument
              universe.
            </Text>
          </View>

          <View
            style={
              styles.countBadge
            }
          >
            <Text
              style={
                styles.countBadgeText
              }
            >
              {
                filteredAssets.length
              }{" "}
              RESULTS
            </Text>
          </View>
        </View>


        <View
          style={
            styles.assetCard
          }
        >

          {/* SEARCH */}

          <View
            style={
              styles.searchRow
            }
          >
            <TextInput
              value={search}
              onChangeText={
                setSearch
              }
              placeholder="Search symbol, name or exchange..."
              placeholderTextColor="#55505F"
              style={
                styles.searchInput
              }
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.filterRow
              }
            >

              <Pressable
                onPress={() =>
                  setSelectedClass(
                    "ALL"
                  )
                }
                style={[
                  styles.filterButton,
                  selectedClass ===
                    "ALL" &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedClass ===
                      "ALL" &&
                      styles.filterTextActive,
                  ]}
                >
                  ALL
                </Text>
              </Pressable>

              {assetClasses.map(
                (
                  item: AssetClass
                ) => (
                  <Pressable
                    key={item}
                    onPress={() =>
                      setSelectedClass(
                        item
                      )
                    }
                    style={[
                      styles.filterButton,
                      selectedClass ===
                        item &&
                        styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        selectedClass ===
                          item &&
                          styles.filterTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}

            </ScrollView>
          </View>


          {/* TABLE */}

          {loading ? (
            <View
              style={
                styles.loadingState
              }
            >
              <ActivityIndicator
                size="large"
                color="#A78BFA"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading asset universe...
              </Text>
            </View>
          ) : filteredAssets.length ===
            0 ? (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <Text
                  style={
                    styles.emptyIconText
                  }
                >
                  ◇
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No assets found
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Add an asset or change
                your search/filter.
              </Text>
            </View>
          ) : (
            <View>

              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.assetColumn,
                  ]}
                >
                  ASSET
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.classColumn,
                  ]}
                >
                  CLASS
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.exchangeColumn,
                  ]}
                >
                  MARKET
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.priceColumn,
                  ]}
                >
                  PRICE
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.statusColumn,
                  ]}
                >
                  STATUS
                </Text>
              </View>


              {filteredAssets.map(
                (
                  asset: Asset
                ) => (
                  <View
                    key={
                      asset.id
                    }
                    style={
                      styles.tableRow
                    }
                  >

                    <View
                      style={
                        styles.assetColumn
                      }
                    >
                      <Text
                        style={
                          styles.assetSymbol
                        }
                      >
                        {
                          asset.symbol
                        }
                      </Text>

                      <Text
                        style={
                          styles.assetName
                        }
                      >
                        {
                          asset.name
                        }
                      </Text>

                      {asset.sector && (
                        <Text
                          style={
                            styles.assetMeta
                          }
                        >
                          {
                            asset.sector
                          }
                        </Text>
                      )}
                    </View>


                    <View
                      style={
                        styles.classColumn
                      }
                    >
                      <Text
                        style={
                          styles.classText
                        }
                      >
                        {
                          asset.assetClass
                        }
                      </Text>
                    </View>


                    <View
                      style={
                        styles.exchangeColumn
                      }
                    >
                      <Text
                        style={
                          styles.exchangeText
                        }
                      >
                        {
                          asset.exchange ||
                          "—"
                        }
                      </Text>

                      <Text
                        style={
                          styles.marketText
                        }
                      >
                        {
                          asset.market
                        }
                      </Text>
                    </View>


                    <Text
                      style={[
                        styles.priceColumn,
                        styles.priceText,
                      ]}
                    >
                      {formatINR(
                        asset.currentPrice
                      )}
                    </Text>


                    <View
                      style={
                        styles.statusColumn
                      }
                    >
                      <View
                        style={[
                          styles.statusBadge,
                          asset.status ===
                            "ACTIVE" &&
                            styles.statusActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            asset.status ===
                              "ACTIVE" &&
                              styles.statusActiveText,
                          ]}
                        >
                          {
                            asset.status
                          }
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.tradableText
                        }
                      >
                        {asset.tradable
                          ? "TRADABLE"
                          : "READ ONLY"}
                      </Text>
                    </View>

                  </View>
                )
              )}

            </View>
          )}

        </View>


        {/* =================================================
            ENGINE NOTE
        ================================================= */}

        <View
          style={
            styles.engineNote
          }
        >

          <View
            style={
              styles.engineNoteAccent
            }
          />

          <View
            style={
              styles.engineNoteContent
            }
          >
            <Text
              style={
                styles.engineNoteTitle
              }
            >
              MASTER DATA FOUNDATION
            </Text>

            <Text
              style={
                styles.engineNoteText
              }
            >
              Assets are maintained as
              structured master records rather
              than being embedded directly into
              trading screens. This gives
              Trading, Portfolio, Performance
              and Risk a common instrument
              vocabulary and leaves a clean
              integration point for future
              market-data providers.
            </Text>
          </View>

        </View>


        <View
          style={styles.footer}
        >
          <Text
            style={styles.footerText}
          >
            VAULT1
          </Text>

          <Text
            style={styles.footerText}
          >
            PRIVATE WEALTH INFRASTRUCTURE
          </Text>
        </View>

      </ScrollView>

    </View>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function MetricCard({
  label,
  value,
  caption,
  accent = false,
}: {
  label: string;
  value: string;
  caption: string;
  accent?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        accent &&
          styles.metricCardAccent,
      ]}
    >
      <View
        style={
          styles.metricTop
        }
      >
        <Text
          style={
            styles.metricLabel
          }
        >
          {label}
        </Text>

        <View
          style={[
            styles.metricIndicator,
            accent &&
              styles.metricIndicatorAccent,
          ]}
        />
      </View>

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.metricCaption
        }
      >
        {caption}
      </Text>
    </View>
  );
}


function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder: string;
  keyboardType?:
    | "default"
    | "numeric";
}) {
  return (
    <View
      style={styles.formField}
    >
      <Text
        style={
          styles.fieldLabel
        }
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
        placeholderTextColor="#55505F"
        keyboardType={
          keyboardType
        }
        style={
          styles.input
        }
      />
    </View>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },

  sidebar: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#211A2D",
    paddingTop: 34,
    paddingBottom: 24,
  },

  brandBlock: {
    paddingHorizontal: 26,
    marginBottom: 38,
  },

  brand: {
    color: "#3F3F3B",
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: 3,
  },

  brandSub: {
    color: "#746B83",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginTop: 7,
  },

  sidebarScroll: {
    paddingHorizontal: 14,
    paddingBottom: 20,
  },

  navGroup: {
    marginBottom: 27,
  },

  navSection: {
    color: "#62596E",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.8,
    paddingHorizontal: 12,
    marginBottom: 9,
  },

  navItem: {
    minHeight: 45,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#35234D",
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 13,
  },

  navDotActive: {
    backgroundColor: "#A78BFA",
  },

  navText: {
    color: "#81788D",
    fontSize: 14,
    fontWeight: "700",
  },

  navTextActive: {
    color: "#4A4A46",
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#211A2D",
    paddingHorizontal: 26,
    paddingTop: 20,
  },

  sidebarFooterTitle: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  sidebarFooterText: {
    color: "#61596B",
    fontSize: 11,
    marginTop: 7,
  },

  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mainContent: {
    padding: 44,
    paddingBottom: 70,
    maxWidth: 1700,
    width: "100%",
    alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 34,
  },

  eyebrow: {
    color: "#9B7DCE",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10,
  },

  title: {
    color: "#3F3F3B",
    fontSize: 45,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  subtitle: {
    color: "#81788D",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
    maxWidth: 650,
  },

  primaryButton: {
    minWidth: 145,
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 9,
    backgroundColor: "#744DB0",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow:
          "0 10px 25px rgba(116,77,176,0.28)",
      },
      default: {
        elevation: 7,
      },
    }),
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  metricsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },

  metricCard: {
    flex: 1,
    minHeight: 150,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 14,
    padding: 22,
    ...Platform.select({
      web: {
        boxShadow:
          "0 18px 45px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.035)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.42,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
  },

  metricCardAccent: {
    backgroundColor: "#FFFFFF",
    borderColor: "#3A2852",
  },

  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metricLabel: {
    color: "#726A7C",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  metricIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  metricIndicatorAccent: {
    backgroundColor: "#A78BFA",
  },

  metricValue: {
    color: "#3F3F3B",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: 28,
  },

  metricCaption: {
    color: "#696170",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#39284D",
    borderRadius: 16,
    padding: 26,
    marginBottom: 45,
    ...Platform.select({
      web: {
        boxShadow:
          "0 22px 55px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.035)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 16,
        },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 12,
      },
    }),
  },

  formHeader: {
    marginBottom: 24,
  },

  formTitle: {
    color: "#4A4A46",
    fontSize: 21,
    fontWeight: "900",
  },

  formSubtitle: {
    color: "#706878",
    fontSize: 12,
    marginTop: 5,
  },

  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  formField: {
    width: "31.8%",
  },

  fieldLabel: {
    color: "#746B80",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 9,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2B2632",
    borderRadius: 9,
    color: "#3F3F3B",
    paddingHorizontal: 15,
    fontSize: 14,
    fontWeight: "700",
  },

  selectorLabel: {
    color: "#746B80",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 25,
    marginBottom: 10,
  },

  selectorRow: {
    gap: 8,
    paddingBottom: 2,
  },

  selector: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2B2632",
    alignItems: "center",
    justifyContent: "center",
  },

  selectorActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#68458D",
  },

  selectorText: {
    color: "#746C7D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  selectorTextActive: {
    color: "#C9B4E2",
  },

  marketRow: {
    flexDirection: "row",
    gap: 8,
  },

  formFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    paddingTop: 21,
    borderTopWidth: 1,
    borderTopColor: "#24202B",
    gap: 20,
  },

  formHint: {
    flex: 1,
    color: "#625A68",
    fontSize: 11,
    lineHeight: 17,
  },

  saveButton: {
    minWidth: 170,
    height: 48,
    borderRadius: 9,
    backgroundColor: "#744DB0",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  disabledButton: {
    opacity: 0.55,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    color: "#4A4A46",
    fontSize: 21,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: "#706878",
    fontSize: 12,
    marginTop: 5,
  },

  countBadge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#292231",
  },

  countBadgeText: {
    color: "#81768F",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
  },

  assetCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#292431",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 35,
    ...Platform.select({
      web: {
        boxShadow:
          "0 20px 50px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.03)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 14,
        },
        shadowOpacity: 0.42,
        shadowRadius: 22,
        elevation: 10,
      },
    }),
  },

  searchRow: {
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#292431",
    gap: 14,
  },

  searchInput: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2B2632",
    borderRadius: 9,
    color: "#3F3F3B",
    paddingHorizontal: 15,
    fontSize: 13,
    fontWeight: "600",
  },

  filterRow: {
    gap: 7,
  },

  filterButton: {
    paddingHorizontal: 11,
    height: 34,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#28232E",
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#68458D",
  },

  filterText: {
    color: "#6E6676",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  filterTextActive: {
    color: "#C9B4E2",
  },

  tableHeader: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#292431",
  },

  tableHeaderText: {
    color: "#686070",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  tableRow: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#211E27",
  },

  assetColumn: {
    flex: 2.2,
  },

  classColumn: {
    flex: 1.3,
  },

  exchangeColumn: {
    flex: 1.2,
  },

  priceColumn: {
    flex: 1,
    textAlign: "right",
  },

  statusColumn: {
    flex: 1.1,
    alignItems: "flex-end",
  },

  assetSymbol: {
    color: "#3F3F3B",
    fontSize: 14,
    fontWeight: "900",
  },

  assetName: {
    color: "#817687",
    fontSize: 11,
    marginTop: 4,
  },

  assetMeta: {
    color: "#514A58",
    fontSize: 9,
    marginTop: 4,
  },

  classText: {
    color: "#B5A9C0",
    fontSize: 10,
    fontWeight: "800",
  },

  exchangeText: {
    color: "#D2CADB",
    fontSize: 11,
    fontWeight: "800",
  },

  marketText: {
    color: "#625A68",
    fontSize: 9,
    marginTop: 4,
  },

  priceText: {
    color: "#DDD5E6",
    fontSize: 12,
    fontWeight: "800",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#302B35",
  },

  statusActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#4D3467",
  },

  statusBadgeText: {
    color: "#77707D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  statusActiveText: {
    color: "#B99BDE",
  },

  tradableText: {
    color: "#554E5B",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 5,
  },

  loadingState: {
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#6F6877",
    fontSize: 12,
    marginTop: 14,
  },

  emptyState: {
    minHeight: 350,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#38264D",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyIconText: {
    color: "#A78BFA",
    fontSize: 25,
  },

  emptyTitle: {
    color: "#4A4A46",
    fontSize: 20,
    fontWeight: "900",
  },

  emptyText: {
    color: "#68616F",
    fontSize: 13,
    marginTop: 8,
  },

  engineNote: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#292030",
    borderRadius: 13,
    padding: 22,
    marginBottom: 45,
  },

  engineNoteAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#A78BFA",
    marginRight: 17,
  },

  engineNoteContent: {
    flex: 1,
  },

  engineNoteTitle: {
    color: "#BFA9DB",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  engineNoteText: {
    color: "#69616F",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
    maxWidth: 900,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1C24",
  },

  footerText: {
    color: "#47414D",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
});