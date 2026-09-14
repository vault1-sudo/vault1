import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

import {
  router,
} from "expo-router";

import VaultSurface from "../components/ui/VaultSurface";

import {
  useAuth,
} from "../services/auth/AuthProvider";

import {
  createTransaction,
  getTransactionTypeLabel,
  getUserTransactions,
} from "../services/transactions/transactionService";

import {
  Transaction,
  TransactionType,
} from "../types/transaction";


/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = [
  {
    section: "COMMAND",
    items: [
      "Dashboard",
    ],
  },

  {
    section: "GROWTH",
    items: [
      "Portfolio",
      "Trading",
      "Assets",
      "Strategies",
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


const routeMap: Record<
  string,
  string
> = {
  Dashboard: "/dashboard",

  Portfolio: "/portfolio",
  Trading: "/trading",
  Assets: "/assets",
  Strategies: "/strategies",
  "Growth Missions":
    "/growth-missions",
  "Trade Journal":
    "/trade-journal",

  Capital: "/capital",
  Cashflow: "/cashflow",
  Transactions: "/transactions",

  Performance: "/performance",
  Risk: "/risk",
  Reports: "/reports",

  Investors: "/investors",
  Payouts: "/payouts",
  Documents: "/documents",
};


/* =========================================================
   TRANSACTION TYPES
   ========================================================= */

const transactionTypes: {
  value: TransactionType;
  label: string;
  description: string;
}[] = [
  {
    value: "DEPOSIT",
    label: "Deposit",
    description:
      "Capital entering Vault1",
  },

  {
    value: "WITHDRAWAL",
    label: "Withdrawal",
    description:
      "Capital leaving Vault1",
  },

  {
    value: "INVESTMENT",
    label: "Investment",
    description:
      "Capital deployed into an investment",
  },

  {
    value: "TRADE_PROFIT",
    label: "Trading Profit",
    description:
      "Realized profit from trading",
  },

  {
    value: "TRADE_LOSS",
    label: "Trading Loss",
    description:
      "Realized loss from trading",
  },

  {
    value: "FEE",
    label: "Fee",
    description:
      "Brokerage or other costs",
  },

  {
    value: "INTEREST",
    label: "Interest",
    description:
      "Interest income",
  },

  {
    value: "DIVIDEND",
    label: "Dividend",
    description:
      "Dividend income",
  },

  {
    value: "OTHER",
    label: "Other",
    description:
      "Other financial movement",
  },
];


/* =========================================================
   HELPERS
   ========================================================= */

function formatCurrency(
  value: number
) {
  return `₹${Math.abs(value).toLocaleString(
    "en-IN"
  )}`;
}


function getTransactionDate(
  transaction: Transaction
) {
  if (transaction.createdAt?.toDate) {
    return transaction.createdAt
      .toDate()
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
  }

  return "RECENT";
}


/* =========================================================
   SIDEBAR ITEM
   ========================================================= */

function SidebarItem({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.navItem,
        active &&
          styles.navItemActive,
        pressed &&
          styles.navItemPressed,
      ]}
    >
      {active && (
        <View
          style={styles.navRail}
        />
      )}

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
        {label}
      </Text>

      {active && (
        <Text
          style={styles.navArrow}
        >
          ›
        </Text>
      )}
    </Pressable>
  );
}


/* =========================================================
   INPUT
   ========================================================= */

function VaultInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (
    value: string
  ) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
}) {
  return (
    <View
      style={styles.inputGroup}
    >
      <Text
        style={styles.inputLabel}
      >
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#444444"
        keyboardType={keyboardType}
        multiline={multiline}
        style={[
          styles.input,
          multiline &&
            styles.textarea,
        ]}
      />
    </View>
  );
}


/* =========================================================
   TRANSACTION ROW
   ========================================================= */

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const inflow =
    transaction.amount > 0;

  return (
    <View
      style={styles.transactionRow}
    >

      <View
        style={styles.transactionMain}
      >

        <View
          style={[
            styles.transactionMarker,
            inflow
              ? styles.transactionMarkerIn
              : styles.transactionMarkerOut,
          ]}
        />

        <View
          style={
            styles.transactionInfo
          }
        >

          <Text
            style={
              styles.transactionType
            }
          >
            {getTransactionTypeLabel(
              transaction.type
            )}
          </Text>

          <Text
            style={
              styles.transactionDescription
            }
            numberOfLines={1}
          >
            {transaction.description}
          </Text>

          <View
            style={
              styles.transactionMeta
            }
          >
            <Text
              style={
                styles.transactionDate
              }
            >
              {getTransactionDate(
                transaction
              )}
            </Text>

            <View
              style={
                styles.metaDivider
              }
            />

            <Text
              style={
                styles.transactionStatus
              }
            >
              {transaction.status}
            </Text>
          </View>

        </View>

      </View>


      <View
        style={
          styles.transactionAmountBlock
        }
      >

        <Text
          style={[
            styles.transactionAmount,
            inflow
              ? styles.amountPositive
              : styles.amountNegative,
          ]}
        >
          {inflow
            ? "+"
            : "−"}
          ₹
          {Math.abs(
            transaction.amount
          ).toLocaleString(
            "en-IN"
          )}
        </Text>

        <Text
          style={
            styles.transactionCurrency
          }
        >
          {transaction.currency}
        </Text>

      </View>

    </View>
  );
}


/* =========================================================
   MAIN SCREEN
   ========================================================= */

export default function TransactionsScreen() {
  const {
    profile,
    logout,
  } = useAuth();

  const [
    transactions,
    setTransactions,
  ] = useState<Transaction[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    selectedType,
    setSelectedType,
  ] = useState<TransactionType>(
    "DEPOSIT"
  );

  const [
    amount,
    setAmount,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    reference,
    setReference,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<
    "ALL" | "INFLOW" | "OUTFLOW"
  >("ALL");


  /* =======================================================
     LOAD
     ======================================================= */

  const loadTransactions =
    async () => {
      if (!profile?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const data =
          await getUserTransactions(
            profile.uid
          );

        setTransactions(data);
      } catch (error) {
        console.error(
          "TRANSACTIONS_LOAD_ERROR",
          error
        );

        Alert.alert(
          "Unable to load transactions",
          "Please try again."
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadTransactions();
  }, [profile?.uid]);


  /* =======================================================
     FILTER
     ======================================================= */

  const filteredTransactions =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {

          const matchesSearch =
            !normalizedSearch ||
            transaction.description
              .toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            transaction.type
              .toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesDirection =
            filter === "ALL"
              ? true
              : filter === "INFLOW"
              ? transaction.amount > 0
              : transaction.amount < 0;

          return (
            matchesSearch &&
            matchesDirection
          );
        }
      );
    }, [
      transactions,
      search,
      filter,
    ]);


  /* =======================================================
     SUMMARY
     ======================================================= */

  const summary =
    useMemo(() => {

      const posted =
        transactions.filter(
          (transaction) =>
            transaction.status ===
            "POSTED"
        );

      const inflows =
        posted.reduce(
          (total, transaction) =>
            transaction.amount > 0
              ? total +
                transaction.amount
              : total,
          0
        );

      const outflows =
        posted.reduce(
          (total, transaction) =>
            transaction.amount < 0
              ? total +
                Math.abs(
                  transaction.amount
                )
              : total,
          0
        );

      const net =
        inflows -
        outflows;

      return {
        count: posted.length,
        inflows,
        outflows,
        net,
      };
    }, [transactions]);


  /* =======================================================
     NAVIGATION
     ======================================================= */

  const handleNavigation =
    (item: string) => {
      const route =
        routeMap[item];

      if (route) {
        router.push(
          route as any
        );
      }
    };


  /* =======================================================
     RESET FORM
     ======================================================= */

  const resetForm = () => {
    setSelectedType(
      "DEPOSIT"
    );

    setAmount("");
    setDescription("");
    setReference("");
  };


  /* =======================================================
     CREATE
     ======================================================= */

  const handleCreate =
    async () => {

      if (!profile?.uid) {
        Alert.alert(
          "Authentication required",
          "Please sign in again."
        );

        return;
      }

      const numericAmount =
        Number(
          amount.replace(
            /,/g,
            ""
          )
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <= 0
      ) {
        Alert.alert(
          "Invalid amount",
          "Enter an amount greater than zero."
        );

        return;
      }

      if (
        !description.trim()
      ) {
        Alert.alert(
          "Description required",
          "Enter a description for this transaction."
        );

        return;
      }


      let signedAmount =
        numericAmount;

      if (
        [
          "WITHDRAWAL",
          "INVESTMENT",
          "TRADE_LOSS",
          "FEE",
        ].includes(
          selectedType
        )
      ) {
        signedAmount =
          -numericAmount;
      }


      try {
        setSaving(true);

        await createTransaction({
          userId:
            profile.uid,

          type:
            selectedType,

          amount:
            signedAmount,

          currency:
            "INR",

          description:
            description.trim(),

          status:
            "POSTED",

          ...(reference.trim()
            ? {
                referenceType:
                  "MANUAL",
                referenceId:
                  reference.trim(),
              }
            : {}),
        });


        resetForm();

        setShowForm(false);

        await loadTransactions();

        Alert.alert(
          "Transaction recorded",
          "The transaction has been added to Vault1."
        );

      } catch (error) {
        console.error(
          "TRANSACTION_CREATE_ERROR",
          error
        );

        Alert.alert(
          "Unable to record transaction",
          "Please check the details and try again."
        );
      } finally {
        setSaving(false);
      }
    };


  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <View
      style={styles.root}
    >

      {/* =================================================
          SIDEBAR
          ================================================= */}

      <View
        style={styles.sidebar}
      >

        <View>

          <Pressable
            onPress={() =>
              router.replace(
                "/dashboard"
              )
            }
            style={
              styles.brandContainer
            }
          >

            <Text
              style={styles.brand}
            >
              VAULT1
            </Text>

            <View
              style={styles.brandRow}
            >
              <View
                style={
                  styles.brandAccent
                }
              />

              <Text
                style={
                  styles.brandSub
                }
              >
                WEALTH OS
              </Text>
            </View>

          </Pressable>


          <View
            style={
              styles.sidebarDivider
            }
          />


          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.navContent
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
                    (item) => (
                      <SidebarItem
                        key={item}
                        label={item}
                        active={
                          item ===
                          "Transactions"
                        }
                        onPress={() =>
                          handleNavigation(
                            item
                          )
                        }
                      />
                    )
                  )}

                </View>
              )
            )}

          </ScrollView>

        </View>


        <View
          style={
            styles.sidebarBottom
          }
        >

          <View
            style={
              styles.userMini
            }
          >

            <LinearGradient
              colors={[
                "#7C3AED",
                "#4C1D95",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.avatar}
            >

              <Text
                style={
                  styles.avatarText
                }
              >
                {(
                  profile?.displayName ||
                  "V"
                )
                  .charAt(0)
                  .toUpperCase()}
              </Text>

            </LinearGradient>


            <View
              style={
                styles.userInfo
              }
            >

              <Text
                style={
                  styles.userName
                }
                numberOfLines={1}
              >
                {profile?.displayName ||
                  "Vault1 User"}
              </Text>

              <Text
                style={
                  styles.userRole
                }
              >
                {profile?.role ||
                  "VIEWER"}
              </Text>

            </View>

          </View>


          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed &&
                styles.pressed,
            ]}
            onPress={async () => {
              await logout();
              router.replace(
                "/login"
              );
            }}
          >
            <Text
              style={
                styles.logoutText
              }
            >
              SIGN OUT
            </Text>
          </Pressable>

        </View>

      </View>


      {/* =================================================
          MAIN
          ================================================= */}

      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* TOP BAR */}

        <View
          style={styles.topBar}
        >

          <View>

            <Text
              style={
                styles.breadcrumb
              }
            >
              MONEY / TRANSACTIONS
            </Text>

            <Text
              style={
                styles.pageTitle
              }
            >
              Transactions
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              The financial event register behind
              your Vault1 cashflow.
            </Text>

          </View>


          <Pressable
            onPress={() =>
              setShowForm(
                !showForm
              )
            }
            style={({ pressed }) => [
              styles.createButton,
              pressed &&
                styles.pressed,
            ]}
          >

            <LinearGradient
              colors={[
                "#9366FF",
                "#5E31C8",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.createButtonGradient
              }
            >

              <Text
                style={
                  styles.createButtonText
                }
              >
                {showForm
                  ? "CLOSE"
                  : "NEW TRANSACTION"}
              </Text>

              <Text
                style={
                  styles.createButtonArrow
                }
              >
                {showForm
                  ? "×"
                  : "+"}
              </Text>

            </LinearGradient>

          </Pressable>

        </View>


        {/* SUMMARY */}

        <View
          style={styles.summaryGrid}
        >

          <VaultSurface
            intensity="medium"
            style={
              styles.summaryCard
            }
          >

            <Text
              style={
                styles.summaryLabel
              }
            >
              POSTED TRANSACTIONS
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {summary.count}
            </Text>

            <Text
              style={
                styles.summaryDescription
              }
            >
              Source events recorded
            </Text>

          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={
              styles.summaryCard
            }
          >

            <Text
              style={
                styles.summaryLabel
              }
            >
              TOTAL INFLOWS
            </Text>

            <Text
              style={[
                styles.summaryValue,
                styles.amountPositive,
              ]}
            >
              +{formatCurrency(
                summary.inflows
              )}
            </Text>

            <Text
              style={
                styles.summaryDescription
              }
            >
              Capital and income entering
            </Text>

          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={
              styles.summaryCard
            }
          >

            <Text
              style={
                styles.summaryLabel
              }
            >
              TOTAL OUTFLOWS
            </Text>

            <Text
              style={[
                styles.summaryValue,
                styles.amountNegative,
              ]}
            >
              −{formatCurrency(
                summary.outflows
              )}
            </Text>

            <Text
              style={
                styles.summaryDescription
              }
            >
              Capital and costs leaving
            </Text>

          </VaultSurface>


          <VaultSurface
            intensity="medium"
            style={
              styles.summaryCard
            }
          >

            <Text
              style={
                styles.summaryLabel
              }
            >
              NET MOVEMENT
            </Text>

            <Text
              style={[
                styles.summaryValue,
                summary.net >= 0
                  ? styles.amountPositive
                  : styles.amountNegative,
              ]}
            >
              {summary.net >= 0
                ? "+"
                : "−"}
              {formatCurrency(
                summary.net
              )}
            </Text>

            <Text
              style={
                styles.summaryDescription
              }
            >
              Current posted movement
            </Text>

          </VaultSurface>

        </View>


        {/* CREATE FORM */}

        {showForm && (
          <VaultSurface
            intensity="strong"
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
                    styles.formEyebrow
                  }
                >
                  RECORD EVENT
                </Text>

                <Text
                  style={
                    styles.formTitle
                  }
                >
                  New Transaction
                </Text>

              </View>

              <Text
                style={
                  styles.formHint
                }
              >
                POSTED TO FIRESTORE
              </Text>

            </View>


            <Text
              style={
                styles.fieldLabel
              }
            >
              TRANSACTION TYPE
            </Text>


            <View
              style={
                styles.typeGrid
              }
            >

              {transactionTypes.map(
                (type) => {

                  const active =
                    selectedType ===
                    type.value;

                  return (
                    <Pressable
                      key={
                        type.value
                      }
                      onPress={() =>
                        setSelectedType(
                          type.value
                        )
                      }
                      style={[
                        styles.typeOption,
                        active &&
                          styles.typeOptionActive,
                      ]}
                    >

                      <View
                        style={[
                          styles.typeDot,
                          active &&
                            styles.typeDotActive,
                        ]}
                      />

                      <View
                        style={
                          styles.typeCopy
                        }
                      >

                        <Text
                          style={[
                            styles.typeTitle,
                            active &&
                              styles.typeTitleActive,
                          ]}
                        >
                          {type.label}
                        </Text>

                        <Text
                          style={
                            styles.typeDescription
                          }
                        >
                          {
                            type.description
                          }
                        </Text>

                      </View>

                    </Pressable>
                  );
                }
              )}

            </View>


            <View
              style={
                styles.formTwoColumn
              }
            >

              <VaultInput
                label="AMOUNT"
                value={amount}
                onChangeText={
                  setAmount
                }
                placeholder="0"
                keyboardType="numeric"
              />

              <VaultInput
                label="REFERENCE"
                value={reference}
                onChangeText={
                  setReference
                }
                placeholder="Optional reference"
              />

            </View>


            <VaultInput
              label="DESCRIPTION"
              value={description}
              onChangeText={
                setDescription
              }
              placeholder="What was this transaction for?"
            />


            <View
              style={
                styles.formFooter
              }
            >

              <Text
                style={
                  styles.signHint
                }
              >
                {[
                  "WITHDRAWAL",
                  "INVESTMENT",
                  "TRADE_LOSS",
                  "FEE",
                ].includes(
                  selectedType
                )
                  ? "This transaction will be recorded as an OUTFLOW."
                  : "This transaction will be recorded as an INFLOW."}
              </Text>


              <Pressable
                onPress={
                  handleCreate
                }
                disabled={saving}
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed &&
                    styles.pressed,
                  saving &&
                    styles.saveButtonDisabled,
                ]}
              >

                {saving ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Text
                      style={
                        styles.saveButtonText
                      }
                    >
                      RECORD TRANSACTION
                    </Text>

                    <Text
                      style={
                        styles.saveButtonArrow
                      }
                    >
                      →
                    </Text>
                  </>
                )}

              </Pressable>

            </View>

          </VaultSurface>
        )}


        {/* HISTORY */}

        <View
          style={
            styles.historyHeader
          }
        >

          <View>

            <Text
              style={
                styles.historyEyebrow
              }
            >
              TRANSACTION REGISTER
            </Text>

            <Text
              style={
                styles.historyTitle
              }
            >
              Financial Events
            </Text>

          </View>

          <Text
            style={
              styles.historyCount
            }
          >
            {filteredTransactions.length} EVENTS
          </Text>

        </View>


        {/* SEARCH + FILTER */}

        <View
          style={
            styles.controlsRow
          }
        >

          <View
            style={
              styles.searchBox
            }
          >

            <Text
              style={
                styles.searchIcon
              }
            >
              ⌕
            </Text>

            <TextInput
              value={search}
              onChangeText={
                setSearch
              }
              placeholder="Search transactions..."
              placeholderTextColor="#444444"
              style={
                styles.searchInput
              }
            />

          </View>


          <View
            style={
              styles.filterGroup
            }
          >

            {(
              [
                "ALL",
                "INFLOW",
                "OUTFLOW",
              ] as const
            ).map(
              (item) => (

                <Pressable
                  key={item}
                  onPress={() =>
                    setFilter(
                      item
                    )
                  }
                  style={[
                    styles.filterButton,
                    filter === item &&
                      styles.filterButtonActive,
                  ]}
                >

                  <Text
                    style={[
                      styles.filterText,
                      filter === item &&
                        styles.filterTextActive,
                    ]}
                  >
                    {item}
                  </Text>

                </Pressable>
              )
            )}

          </View>

        </View>


        {/* REGISTER */}

        {loading ? (

          <VaultSurface
            intensity="medium"
            style={
              styles.loadingCard
            }
          >

            <ActivityIndicator
              size="large"
              color="#966AFF"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              Loading transaction register
            </Text>

          </VaultSurface>

        ) : filteredTransactions.length ===
          0 ? (

          <VaultSurface
            intensity="medium"
            style={
              styles.emptyCard
            }
          >

            <LinearGradient
              colors={[
                "#1D142B",
                "#0F0C14",
              ]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={
                styles.emptyIcon
              }
            >

              <Text
                style={
                  styles.emptyIconText
                }
              >
                ₹
              </Text>

            </LinearGradient>


            <Text
              style={
                styles.emptyTitle
              }
            >
              No transactions found
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Record your first financial event
              and Vault1 will begin building the
              transaction history.
            </Text>

            <Pressable
              onPress={() =>
                setShowForm(
                  true
                )
              }
              style={
                styles.emptyButton
              }
            >

              <Text
                style={
                  styles.emptyButtonText
                }
              >
                RECORD FIRST TRANSACTION
              </Text>

            </Pressable>

          </VaultSurface>

        ) : (

          <VaultSurface
            intensity="medium"
            style={
              styles.registerCard
            }
          >

            <View
              style={
                styles.registerHeader
              }
            >

              <Text
                style={
                  styles.registerHeaderText
                }
              >
                EVENT
              </Text>

              <Text
                style={
                  styles.registerHeaderText
                }
              >
                MOVEMENT
              </Text>

            </View>


            {filteredTransactions.map(
              (transaction) => (
                <TransactionRow
                  key={
                    transaction.id
                  }
                  transaction={
                    transaction
                  }
                />
              )
            )}

          </VaultSurface>

        )}


        {/* SOURCE OF TRUTH */}

        <VaultSurface
          intensity="subtle"
          style={
            styles.sourceCard
          }
        >

          <View
            style={
              styles.sourceIcon
            }
          >
            <Text
              style={
                styles.sourceIconText
              }
            >
              ◈
            </Text>
          </View>


          <View
            style={
              styles.sourceCopy
            }
          >

            <Text
              style={
                styles.sourceTitle
              }
            >
              Transaction Ledger
            </Text>

            <Text
              style={
                styles.sourceDescription
              }
            >
              Every capital movement recorded here
              becomes available to Cashflow,
              Capital, Performance, Analytics and
              future reporting layers.
            </Text>

          </View>

          <Text
            style={
              styles.sourceStatus
            }
          >
            SOURCE OF TRUTH
          </Text>

        </VaultSurface>


        {/* FOOTER */}

        <View
          style={styles.footer}
        >

          <Text
            style={
              styles.footerText
            }
          >
            VAULT1 · PRIVATE CAPITAL OPERATING SYSTEM
          </Text>

          <Text
            style={
              styles.footerText
            }
          >
            TRANSACTION CONTROL
          </Text>

          <Text
            style={
              styles.footerVersion
            }
          >
            V1.0
          </Text>

        </View>

      </ScrollView>

    </View>
  );
}


/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({

  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },

  /* SIDEBAR */

  sidebar: {
    width: 250,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#251A38",
    paddingTop: 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },

  brandContainer: {
    paddingHorizontal: 8,
  },

  brand: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 4,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  brandAccent: {
    width: 14,
    height: 1,
    backgroundColor: "#8559D8",
    marginRight: 6,
  },

  brandSub: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 2.5,
  },

  sidebarDivider: {
    height: 1,
    backgroundColor: "#FFFFFF",
    marginTop: 28,
    marginBottom: 25,
  },

  navContent: {
    paddingBottom: 30,
  },

  navGroup: {
    marginBottom: 25,
  },

  navSection: {
    color: "#4F4F4F",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 8,
    paddingHorizontal: 9,
  },

  navItem: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 3,
  },

  navItemActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2B2040",
  },

  navItemPressed: {
    opacity: 0.65,
  },

  navRail: {
    position: "absolute",
    left: -1,
    top: 8,
    bottom: 8,
    width: 2,
    backgroundColor: "#9365F3",
  },

  navDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 11,
  },

  navDotActive: {
    backgroundColor: "#9568F7",
  },

  navText: {
    color: "#696969",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  navTextActive: {
    color: "#4A4A46",
    fontWeight: "800",
  },

  navArrow: {
    color: "#9466F4",
    fontSize: 19,
    fontWeight: "500",
  },

  sidebarBottom: {
    marginTop: 20,
  },

  userMini: {
    flexDirection: "row",
    alignItems: "center",
    padding: 9,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#211A2D",
  },

  avatar: {
    width: 33,
    height: 33,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  userInfo: {
    flex: 1,
    marginLeft: 9,
  },

  userName: {
    color: "#D8D8D8",
    fontSize: 11,
    fontWeight: "800",
  },

  userRole: {
    color: "#555555",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 3,
  },

  logoutButton: {
    height: 36,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#211A2D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },

  logoutText: {
    color: "#626262",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  pressed: {
    opacity: 0.65,
  },

  /* MAIN */

  main: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mainContent: {
    paddingHorizontal: 38,
    paddingTop: 35,
    paddingBottom: 55,
    maxWidth: 1500,
    width: "100%",
    alignSelf: "center",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  breadcrumb: {
    color: "#7552B8",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
  },

  pageTitle: {
    color: "#3F3F3B",
    fontSize: 44,
    lineHeight: 51,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  pageSubtitle: {
    color: "#646464",
    fontSize: 13,
    marginTop: 7,
  },

  createButton: {
    height: 46,
    borderRadius: 9,
    overflow: "hidden",
  },

  createButtonGradient: {
    height: "100%",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  createButtonArrow: {
    color: "#FFFFFF",
    fontSize: 19,
    marginLeft: 12,
    fontWeight: "500",
  },

  /* SUMMARY */

  summaryGrid: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },

  summaryCard: {
    flex: 1,
    minHeight: 145,
    padding: 20,
  },

  summaryLabel: {
    color: "#565656",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.5,
  },

  summaryValue: {
    color: "#4A4A46",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: -0.7,
  },

  summaryDescription: {
    color: "#505050",
    fontSize: 10,
    marginTop: 6,
  },

  amountPositive: {
    color: "#8DBE9A",
  },

  amountNegative: {
    color: "#C57E7E",
  },

  /* FORM */

  formCard: {
    padding: 26,
    marginBottom: 38,
  },

  formHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 23,
  },

  formEyebrow: {
    color: "#8055D4",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  formTitle: {
    color: "#4A4A46",
    fontSize: 23,
    fontWeight: "900",
  },

  formHint: {
    color: "#484848",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  fieldLabel: {
    color: "#5A5A5A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 10,
  },

  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 20,
  },

  typeOption: {
    width: "31.8%",
    minHeight: 66,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#222222",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  typeOptionActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#513A78",
  },

  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginRight: 10,
  },

  typeDotActive: {
    backgroundColor: "#966AFF",
  },

  typeCopy: {
    flex: 1,
  },

  typeTitle: {
    color: "#777777",
    fontSize: 10,
    fontWeight: "800",
  },

  typeTitleActive: {
    color: "#E9E1FF",
  },

  typeDescription: {
    color: "#484848",
    fontSize: 8,
    marginTop: 4,
  },

  formTwoColumn: {
    flexDirection: "row",
    gap: 14,
  },

  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },

  inputLabel: {
    color: "#5A5A5A",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 8,
  },

  input: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#252525",
    backgroundColor: "#FFFFFF",
    color: "#5F5F5B",
    paddingHorizontal: 13,
    fontSize: 13,
    fontWeight: "600",
  },

  textarea: {
    minHeight: 75,
    paddingTop: 12,
    textAlignVertical: "top",
  },

  formFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
  },

  signHint: {
    color: "#505050",
    fontSize: 9,
    fontWeight: "700",
  },

  saveButton: {
    minWidth: 210,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4A316B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
  },

  saveButtonDisabled: {
    opacity: 0.5,
  },

  saveButtonText: {
    color: "#B999F4",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  saveButtonArrow: {
    color: "#B999F4",
    fontSize: 17,
    marginLeft: 10,
  },

  /* HISTORY */

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 15,
  },

  historyEyebrow: {
    color: "#7650B9",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.7,
    marginBottom: 6,
  },

  historyTitle: {
    color: "#EAEAEA",
    fontSize: 23,
    fontWeight: "900",
  },

  historyCount: {
    color: "#494949",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  controlsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },

  searchBox: {
    flex: 1,
    height: 43,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#222222",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  searchIcon: {
    color: "#666666",
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: "#DCDCDC",
    fontSize: 11,
    height: "100%",
  },

  filterGroup: {
    flexDirection: "row",
    gap: 5,
    padding: 4,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#202020",
  },

  filterButton: {
    minWidth: 72,
    height: 33,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3D2A59",
  },

  filterText: {
    color: "#505050",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  filterTextActive: {
    color: "#B99CF0",
  },

  /* REGISTER */

  registerCard: {
    overflow: "hidden",
    marginBottom: 38,
  },

  registerHeader: {
    height: 42,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#202020",
    paddingHorizontal: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  registerHeaderText: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  transactionRow: {
    minHeight: 82,
    paddingHorizontal: 21,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1D1D1D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  transactionMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  transactionMarker: {
    width: 5,
    height: 35,
    borderRadius: 3,
    marginRight: 15,
  },

  transactionMarkerIn: {
    backgroundColor: "#5F9C6E",
  },

  transactionMarkerOut: {
    backgroundColor: "#A25D5D",
  },

  transactionInfo: {
    flex: 1,
  },

  transactionType: {
    color: "#DADADA",
    fontSize: 11,
    fontWeight: "900",
  },

  transactionDescription: {
    color: "#595959",
    fontSize: 10,
    marginTop: 4,
    maxWidth: 700,
  },

  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  transactionDate: {
    color: "#414141",
    fontSize: 8,
    fontWeight: "700",
  },

  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 7,
  },

  transactionStatus: {
    color: "#4D4D4D",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
  },

  transactionAmountBlock: {
    alignItems: "flex-end",
    marginLeft: 20,
  },

  transactionAmount: {
    fontSize: 15,
    fontWeight: "900",
  },

  transactionCurrency: {
    color: "#454545",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 4,
  },

  /* EMPTY */

  loadingCard: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 38,
  },

  loadingText: {
    color: "#555555",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 14,
  },

  emptyCard: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginBottom: 38,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#382650",
  },

  emptyIconText: {
    color: "#A071F4",
    fontSize: 22,
    fontWeight: "900",
  },

  emptyTitle: {
    color: "#DDDDDD",
    fontSize: 19,
    fontWeight: "900",
  },

  emptyDescription: {
    maxWidth: 520,
    textAlign: "center",
    color: "#575757",
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },

  emptyButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#382550",
    justifyContent: "center",
    marginTop: 18,
  },

  emptyButtonText: {
    color: "#9A72D6",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* SOURCE */

  sourceCard: {
    minHeight: 110,
    padding: 21,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },

  sourceIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#2E2140",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  sourceIconText: {
    color: "#9366D7",
    fontSize: 19,
  },

  sourceCopy: {
    flex: 1,
  },

  sourceTitle: {
    color: "#D8D8D8",
    fontSize: 15,
    fontWeight: "900",
  },

  sourceDescription: {
    color: "#555555",
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
    maxWidth: 850,
  },

  sourceStatus: {
    color: "#7252A8",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginLeft: 20,
  },

  /* FOOTER */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#191919",
  },

  footerText: {
    color: "#3E3E3E",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  footerVersion: {
    marginLeft: "auto",
    color: "#444444",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },

});