import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../services/auth/AuthProvider";

import {
  createGrowthMission,
  getGrowthMissions,
  activateGrowthMission,
  pauseGrowthMission,
  calculateMissionProgress,
  calculateMissionReturn,
} from "../services/growthMissions/growthMissionService";

import {
  GrowthMission,
} from "../types/growthMission";

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

function formatCurrency(
  value: number
) {
  return `₹${Math.abs(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatSignedCurrency(
  value: number
) {
  if (value === 0) {
    return "₹0";
  }

  return value > 0
    ? `+₹${value.toLocaleString(
        "en-IN",
        {
          maximumFractionDigits: 0,
        }
      )}`
    : `-₹${Math.abs(
        value
      ).toLocaleString("en-IN", {
        maximumFractionDigits: 0,
      })}`;
}

export default function GrowthMissionsScreen() {
  const { profile } = useAuth();

  const [missions, setMissions] =
    useState<GrowthMission[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [startingCapital, setStartingCapital] =
    useState("");

  const [targetCapital, setTargetCapital] =
    useState("");

  const [durationDays, setDurationDays] =
    useState("30");

  const userId = profile?.uid;

  async function loadMissions() {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data =
        await getGrowthMissions(
          userId
        );

      setMissions(data);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to load growth missions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMissions();
  }, [userId]);

  function resetForm() {
    setName("");
    setDescription("");
    setStartingCapital("");
    setTargetCapital("");
    setDurationDays("30");
    setError("");
  }

  async function handleCreateMission() {
    if (!userId) {
      setError(
        "You must be logged in."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const start =
        Number(startingCapital);

      const target =
        Number(targetCapital);

      const duration =
        Number(durationDays);

      await createGrowthMission({
        userId,

        name,

        description,

        startingCapital: start,

        targetCapital: target,

        durationDays: duration,

        status: "DRAFT",
      });

      await loadMissions();

      resetForm();

      setModalVisible(false);
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create mission."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(
    missionId: string
  ) {
    try {
      await activateGrowthMission(
        missionId
      );

      await loadMissions();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to activate mission."
      );
    }
  }

  async function handlePause(
    missionId: string
  ) {
    try {
      await pauseGrowthMission(
        missionId
      );

      await loadMissions();
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to pause mission."
      );
    }
  }

  const activeMission =
    useMemo(
      () =>
        missions.find(
          (mission) =>
            mission.status ===
            "ACTIVE"
        ) || null,
      [missions]
    );

  const completedMissions =
    missions.filter(
      (mission) =>
        mission.status ===
        "COMPLETED"
    ).length;

  const totalTargetCapital =
    missions.reduce(
      (total, mission) =>
        total +
        mission.targetCapital,
      0
    );

  function handleNavigation(
    item: string
  ) {
    switch (item) {
      case "Dashboard":
        router.replace(
          "/dashboard"
        );
        break;

      case "Portfolio":
        router.push("/portfolio");
        break;

      case "Trading":
        router.push("/trading");
        break;

      case "Assets":
        router.push("/assets");
        break;

      case "Strategies":
        router.push("/strategies");
        break;

      case "Growth Missions":
        router.replace(
          "/growth-missions"
        );
        break;

      case "Capital":
        router.push("/capital");
        break;

      default:
        break;
    }
  }

  return (
    <View style={styles.root}>
      {/* ================= SIDEBAR ================= */}

      <View style={styles.sidebar}>
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
            <Text style={styles.brand}>
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
                    {
                      group.section
                    }
                  </Text>

                  {group.items.map(
                    (item) => {
                      const active =
                        item ===
                        "Growth Missions";

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

                          {active && (
                            <Text
                              style={
                                styles.navArrow
                              }
                            >
                              ›
                            </Text>
                          )}
                        </Pressable>
                      );
                    }
                  )}
                </View>
              )
            )}
          </ScrollView>
        </View>

        <View
          style={styles.sidebarBottom}
        >
          <Text
            style={
              styles.sidebarFooterLabel
            }
          >
            GROWTH ENGINE
          </Text>

          <Text
            style={
              styles.sidebarFooterText
            }
          >
            Target-based capital
            growth with measurable
            trajectory.
          </Text>
        </View>
      </View>

      {/* ================= MAIN ================= */}

      <ScrollView
        style={styles.main}
        contentContainerStyle={
          styles.mainContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* HEADER */}

        <View
          style={styles.headerRow}
        >
          <View>
            <View
              style={
                styles.commandLabel
              }
            >
              <View
                style={
                  styles.commandLine
                }
              />

              <Text
                style={
                  styles.breadcrumb
                }
              >
                VAULT1 / GROWTH
              </Text>
            </View>

            <Text
              style={styles.pageTitle}
            >
              Growth Missions
            </Text>

            <Text
              style={
                styles.pageSubtitle
              }
            >
              Turn capital targets into
              measurable operating
              missions.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              resetForm();
              setModalVisible(
                true
              );
            }}
            style={
              styles.primaryButton
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              + NEW MISSION
            </Text>
          </Pressable>
        </View>

        {/* KPI */}

        <View
          style={styles.kpiGrid}
        >
          <MetricCard
            label="TOTAL MISSIONS"
            value={String(
              missions.length
            )}
            detail="Created in Vault1"
          />

          <MetricCard
            label="ACTIVE MISSION"
            value={
              activeMission
                ? "1"
                : "0"
            }
            detail={
              activeMission
                ? activeMission.name
                : "No active mission"
            }
            accent
          />

          <MetricCard
            label="COMPLETED"
            value={String(
              completedMissions
            )}
            detail="Targets achieved"
          />

          <MetricCard
            label="TARGET CAPITAL"
            value={formatCurrency(
              totalTargetCapital
            )}
            detail="Across all missions"
            accent
          />
        </View>

        {error ? (
          <View
            style={styles.errorBanner}
          >
            <Text
              style={
                styles.errorBannerText
              }
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* ACTIVE MISSION */}

        {activeMission && (
          <View
            style={
              styles.activeMissionCard
            }
          >
            <View
              style={
                styles.activeMissionGlow
              }
            />

            <View
              style={
                styles.activeMissionHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.cardEyebrow
                  }
                >
                  ACTIVE GROWTH MISSION
                </Text>

                <Text
                  style={
                    styles.activeMissionTitle
                  }
                >
                  {
                    activeMission.name
                  }
                </Text>

                <Text
                  style={
                    styles.activeMissionDescription
                  }
                >
                  {
                    activeMission.description
                  }
                </Text>
              </View>

              <View
                style={
                  styles.activeBadge
                }
              >
                <View
                  style={
                    styles.activeBadgeDot
                  }
                />

                <Text
                  style={
                    styles.activeBadgeText
                  }
                >
                  ACTIVE
                </Text>
              </View>
            </View>

            <View
              style={
                styles.activeMissionNumbers
              }
            >
              <MissionNumber
                label="STARTING CAPITAL"
                value={formatCurrency(
                  activeMission.startingCapital
                )}
              />

              <MissionNumber
                label="CURRENT CAPITAL"
                value={formatCurrency(
                  activeMission.currentCapital
                )}
                accent
              />

              <MissionNumber
                label="TARGET CAPITAL"
                value={formatCurrency(
                  activeMission.targetCapital
                )}
              />

              <MissionNumber
                label="REMAINING"
                value={formatCurrency(
                  Math.max(
                    0,
                    activeMission.targetCapital -
                      activeMission.currentCapital
                  )
                )}
              />
            </View>

            <View
              style={
                styles.activeProgressSection
              }
            >
              <View
                style={
                  styles.activeProgressHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.progressLabel
                    }
                  >
                    MISSION PROGRESS
                  </Text>

                  <Text
                    style={
                      styles.progressSub
                    }
                  >
                    {
                      activeMission.currentCapital
                        .toLocaleString(
                          "en-IN"
                        )
                    }{" "}
                    of{" "}
                    {
                      activeMission.targetCapital
                        .toLocaleString(
                          "en-IN"
                        )
                    }
                  </Text>
                </View>

                <Text
                  style={
                    styles.activeProgressPercent
                  }
                >
                  {calculateMissionProgress(
                    activeMission
                  ).toFixed(1)}
                  %
                </Text>
              </View>

              <View
                style={
                  styles.progressTrackLarge
                }
              >
                <View
                  style={[
                    styles.progressFillLarge,
                    {
                      width: `${calculateMissionProgress(
                        activeMission
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View
              style={
                styles.activeStats
              }
            >
              <MissionStat
                label="REQUIRED RETURN"
                value={`${activeMission.targetReturnPercent.toFixed(
                  2
                )}%`}
              />

              <MissionStat
                label="AVERAGE DAILY GROWTH"
                value={`${activeMission.requiredAverageGrowthPercent.toFixed(
                  3
                )}%`}
              />

              <MissionStat
                label="REALIZED P&L"
                value={formatSignedCurrency(
                  activeMission.realizedPnL
                )}
                accent={
                  activeMission.realizedPnL >
                  0
                }
              />

              <MissionStat
                label="TRADES"
                value={String(
                  activeMission.tradesCount
                )}
              />
            </View>

            <Pressable
              onPress={() =>
                handlePause(
                  activeMission.id
                )
              }
              style={
                styles.pauseButton
              }
            >
              <Text
                style={
                  styles.pauseButtonText
                }
              >
                PAUSE MISSION
              </Text>
            </Pressable>
          </View>
        )}

        {/* MISSION LIST */}

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
              Mission Book
            </Text>

            <Text
              style={
                styles.sectionSubtitle
              }
            >
              Every growth objective
              defined inside Vault1.
            </Text>
          </View>

          <Text
            style={styles.sectionCount}
          >
            {missions.length} MISSIONS
          </Text>
        </View>

        {loading ? (
          <View
            style={styles.emptyState}
          >
            <ActivityIndicator
              size="large"
              color="#9B72F5"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              Loading missions
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Retrieving your growth
              mission book.
            </Text>
          </View>
        ) : missions.length ===
          0 ? (
          <View
            style={styles.emptyState}
          >
            <View
              style={styles.emptyIcon}
            >
              <Text
                style={
                  styles.emptyIconText
                }
              >
                ↗
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No growth missions
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Create a capital target
              such as ₹500 → ₹19,000
              and Vault1 will calculate
              the required trajectory.
            </Text>

            <Pressable
              onPress={() => {
                resetForm();
                setModalVisible(
                  true
                );
              }}
              style={
                styles.secondaryButton
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                CREATE FIRST MISSION
              </Text>
            </Pressable>
          </View>
        ) : (
          <View
            style={styles.missionGrid}
          >
            {missions.map(
              (mission) => {
                const progress =
                  calculateMissionProgress(
                    mission
                  );

                const returnPercent =
                  calculateMissionReturn(
                    mission
                  );

                return (
                  <View
                    key={
                      mission.id
                    }
                    style={
                      styles.missionCard
                    }
                  >
                    <View
                      style={
                        styles.missionCardHeader
                      }
                    >
                      <View
                        style={
                          styles.missionCardTitleBlock
                        }
                      >
                        <Text
                          style={
                            styles.missionCardTitle
                          }
                        >
                          {
                            mission.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.missionCardDescription
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            mission.description
                          }
                        </Text>
                      </View>

                      <StatusBadge
                        status={
                          mission.status
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.targetRow
                      }
                    >
                      <View>
                        <Text
                          style={
                            styles.targetLabel
                          }
                        >
                          START
                        </Text>

                        <Text
                          style={
                            styles.targetValue
                          }
                        >
                          {formatCurrency(
                            mission.startingCapital
                          )}
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.targetArrow
                        }
                      >
                        →
                      </Text>

                      <View
                        style={
                          styles.targetRight
                        }
                      >
                        <Text
                          style={
                            styles.targetLabel
                          }
                        >
                          TARGET
                        </Text>

                        <Text
                          style={
                            styles.targetValueTarget
                          }
                        >
                          {formatCurrency(
                            mission.targetCapital
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.smallProgressHeader
                      }
                    >
                      <Text
                        style={
                          styles.smallProgressLabel
                        }
                      >
                        PROGRESS
                      </Text>

                      <Text
                        style={
                          styles.smallProgressPercent
                        }
                      >
                        {progress.toFixed(
                          1
                        )}
                        %
                      </Text>
                    </View>

                    <View
                      style={
                        styles.smallProgressTrack
                      }
                    >
                      <View
                        style={[
                          styles.smallProgressFill,
                          {
                            width: `${progress}%`,
                          },
                        ]}
                      />
                    </View>

                    <View
                      style={
                        styles.missionMetrics
                      }
                    >
                      <MissionMetric
                        label="CURRENT"
                        value={formatCurrency(
                          mission.currentCapital
                        )}
                      />

                      <MissionMetric
                        label="RETURN"
                        value={`${returnPercent.toFixed(
                          2
                        )}%`}
                      />

                      <MissionMetric
                        label="DURATION"
                        value={`${mission.durationDays}D`}
                      />

                      <MissionMetric
                        label="TRADES"
                        value={String(
                          mission.tradesCount
                        )}
                      />
                    </View>

                    {!activeMission &&
                      mission.status ===
                        "DRAFT" && (
                        <Pressable
                          onPress={() =>
                            handleActivate(
                              mission.id
                            )
                          }
                          style={
                            styles.activateButton
                          }
                        >
                          <Text
                            style={
                              styles.activateButtonText
                            }
                          >
                            ACTIVATE MISSION
                          </Text>

                          <Text
                            style={
                              styles.activateArrow
                            }
                          >
                            →
                          </Text>
                        </Pressable>
                      )}
                  </View>
                );
              }
            )}
          </View>
        )}

        {/* FOUNDATION */}

        <View
          style={
            styles.foundationCard
          }
        >
          <View
            style={
              styles.foundationAccent
            }
          />

          <View
            style={
              styles.foundationContent
            }
          >
            <Text
              style={
                styles.foundationEyebrow
              }
            >
              GROWTH MISSION ENGINE
            </Text>

            <Text
              style={
                styles.foundationTitle
              }
            >
              Every target becomes a
              measurable trajectory.
            </Text>

            <Text
              style={
                styles.foundationText
              }
            >
              Vault1 calculates the
              required return, average
              growth rate, capital
              remaining and mission
              progress. The next layer
              will connect actual trades
              to these missions
              automatically.
            </Text>

            <View
              style={
                styles.foundationPoints
              }
            >
              <FoundationPoint
                title="TARGET"
                text="Define exactly where the capital needs to reach."
              />

              <FoundationPoint
                title="TRAJECTORY"
                text="Know the growth required to stay on plan."
              />

              <FoundationPoint
                title="EXECUTION"
                text="Measure actual trading performance against the mission."
              />
            </View>
          </View>
        </View>

        {/* FOOTER */}

        <View
          style={styles.footer}
        >
          <Text
            style={styles.footerText}
          >
            VAULT1 · PRIVATE CAPITAL
            OPERATING SYSTEM
          </Text>

          <Text
            style={styles.footerText}
          >
            {profile?.role ||
              "VIEWER"}
          </Text>
        </View>
      </ScrollView>

      {/* ================= CREATE MODAL ================= */}

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() =>
          setModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.modalBackdrop
          }
        >
          <View
            style={styles.modalCard}
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.modalContent
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
                    GROWTH ENGINE
                  </Text>

                  <Text
                    style={
                      styles.modalTitle
                    }
                  >
                    New Mission
                  </Text>

                  <Text
                    style={
                      styles.modalSubtitle
                    }
                  >
                    Define the capital
                    destination.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setModalVisible(
                      false
                    )
                  }
                  style={
                    styles.closeButton
                  }
                >
                  <Text
                    style={
                      styles.closeButtonText
                    }
                  >
                    ×
                  </Text>
                </Pressable>
              </View>

              <Input
                label="MISSION NAME"
                value={name}
                onChangeText={setName}
                placeholder="e.g. ₹500 → ₹19K Challenge"
              />

              <Input
                label="DESCRIPTION"
                value={description}
                onChangeText={
                  setDescription
                }
                placeholder="What are you trying to achieve?"
                multiline
              />

              <View
                style={
                  styles.twoColumn
                }
              >
                <View
                  style={
                    styles.column
                  }
                >
                  <Input
                    label="STARTING CAPITAL"
                    value={
                      startingCapital
                    }
                    onChangeText={
                      setStartingCapital
                    }
                    placeholder="500"
                    keyboardType="numeric"
                  />
                </View>

                <View
                  style={
                    styles.column
                  }
                >
                  <Input
                    label="TARGET CAPITAL"
                    value={
                      targetCapital
                    }
                    onChangeText={
                      setTargetCapital
                    }
                    placeholder="19000"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label="DURATION IN DAYS"
                value={durationDays}
                onChangeText={
                  setDurationDays
                }
                placeholder="30"
                keyboardType="numeric"
              />

              {startingCapital &&
                targetCapital &&
                Number(
                  targetCapital
                ) >
                  Number(
                    startingCapital
                  ) && (
                  <View
                    style={
                      styles.previewCard
                    }
                  >
                    <Text
                      style={
                        styles.previewEyebrow
                      }
                    >
                      MISSION PREVIEW
                    </Text>

                    <View
                      style={
                        styles.previewRow
                      }
                    >
                      <PreviewMetric
                        label="REQUIRED RETURN"
                        value={`${(
                          ((Number(
                            targetCapital
                          ) -
                            Number(
                              startingCapital
                            )) /
                            Number(
                              startingCapital
                            )) *
                          100
                        ).toFixed(
                          2
                        )}%`}
                      />

                      <PreviewMetric
                        label="CAPITAL GAIN"
                        value={formatCurrency(
                          Number(
                            targetCapital
                          ) -
                            Number(
                              startingCapital
                            )
                        )}
                      />
                    </View>
                  </View>
                )}

              {error ? (
                <View
                  style={
                    styles.modalError
                  }
                >
                  <Text
                    style={
                      styles.modalErrorText
                    }
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={
                  handleCreateMission
                }
                disabled={saving}
                style={[
                  styles.modalPrimaryButton,
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
                      styles.modalPrimaryText
                    }
                  >
                    CREATE MISSION
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  setModalVisible(
                    false
                  )
                }
                style={
                  styles.cancelButton
                }
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  CANCEL
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
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
  placeholder: string;
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
        multiline={
          multiline
        }
        style={[
          styles.input,
          multiline &&
            styles.multilineInput,
        ]}
      />
    </View>
  );
}

/* =========================================================
   METRIC CARD
========================================================= */

function MetricCard({
  label,
  value,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  detail: string;
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
          styles.metricHeader
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
            styles.metricDot,
            accent &&
              styles.metricDotAccent,
          ]}
        />
      </View>

      <Text
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        style={styles.metricDetail}
      >
        {detail}
      </Text>
    </View>
  );
}

/* =========================================================
   MISSION NUMBER
========================================================= */

function MissionNumber({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={styles.missionNumber}
    >
      <Text
        style={
          styles.missionNumberLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.missionNumberValue,
          accent &&
            styles.missionNumberAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   MISSION STAT
========================================================= */

function MissionStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      style={styles.missionStat}
    >
      <Text
        style={
          styles.missionStatLabel
        }
      >
        {label}
      </Text>

      <Text
        style={[
          styles.missionStatValue,
          accent &&
            styles.missionStatValueAccent,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   MISSION METRIC
========================================================= */

function MissionMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.missionMetric}
    >
      <Text
        style={
          styles.missionMetricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.missionMetricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const active =
    status === "ACTIVE";

  const completed =
    status === "COMPLETED";

  return (
    <View
      style={[
        styles.statusBadge,
        active &&
          styles.statusBadgeActive,
        completed &&
          styles.statusBadgeCompleted,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          active &&
            styles.statusDotActive,
          completed &&
            styles.statusDotCompleted,
        ]}
      />

      <Text
        style={styles.statusText}
      >
        {status}
      </Text>
    </View>
  );
}

/* =========================================================
   PREVIEW
========================================================= */

function PreviewMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.previewMetric}
    >
      <Text
        style={
          styles.previewMetricLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.previewMetricValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   FOUNDATION
========================================================= */

function FoundationPoint({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <View
      style={styles.foundationPoint}
    >
      <View
        style={
          styles.foundationPointDot
        }
      />

      <View
        style={{ flex: 1 }}
      >
        <Text
          style={
            styles.foundationPointTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.foundationPointText
          }
        >
          {text}
        </Text>
      </View>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: "row",
      backgroundColor: "#FFFFFF",
    },

    sidebar: {
      width: 270,
      backgroundColor: "#FFFFFF",
      borderRightWidth: 1,
      borderRightColor: "#1B1822",
      paddingTop: 32,
      paddingBottom: 26,
      paddingHorizontal: 22,
      justifyContent:
        "space-between",
    },

    brandContainer: {
      paddingHorizontal: 8,
    },

    brand: {
      color: "#FFFFFF",
      fontSize: 29,
      fontWeight: "900",
      letterSpacing: 4.5,
    },

    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
    },

    brandAccent: {
      width: 20,
      height: 2,
      backgroundColor:
        "#8B5CF6",
      marginRight: 8,
      borderRadius: 2,
    },

    brandSub: {
      color: "#696373",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 2.8,
    },

    sidebarDivider: {
      height: 1,
      backgroundColor: "#FFFFFF",
      marginTop: 30,
      marginBottom: 28,
    },

    navContent: {
      paddingBottom: 30,
    },

    navGroup: {
      marginBottom: 28,
    },

    navSection: {
      color: "#5B5664",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: 10,
      paddingHorizontal: 10,
    },

    navItem: {
      height: 46,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 11,
      marginBottom: 3,
    },

    navItemActive: {
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#302342",
    },

    navDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FFFFFF",
      marginRight: 13,
    },

    navDotActive: {
      backgroundColor: "#9B72F5",
      shadowColor: "#8B5CF6",
      shadowOpacity: 0.8,
      shadowRadius: 7,
    },

    navText: {
      flex: 1,
      color: "#77727F",
      fontSize: 14,
      fontWeight: "600",
    },

    navTextActive: {
      color: "#3F3F3B",
      fontWeight: "700",
    },

    navArrow: {
      color: "#9B72F5",
      fontSize: 22,
      lineHeight: 22,
    },

    sidebarBottom: {
      borderTopWidth: 1,
      borderTopColor: "#1A1820",
      paddingTop: 20,
    },

    sidebarFooterLabel: {
      color: "#8B5CF6",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    sidebarFooterText: {
      color: "#5D5767",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 7,
    },

    main: {
      flex: 1,
    },

    mainContent: {
      paddingHorizontal: 46,
      paddingTop: 30,
      paddingBottom: 70,
      maxWidth: 1750,
      width: "100%",
      alignSelf: "center",
    },

    headerRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
      marginBottom: 34,
    },

    commandLabel: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },

    commandLine: {
      width: 22,
      height: 2,
      backgroundColor:
        "#8B5CF6",
      marginRight: 10,
      borderRadius: 2,
    },

    breadcrumb: {
      color: "#716B7B",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 2.2,
    },

    pageTitle: {
      color: "#FFFFFF",
      fontSize: 44,
      lineHeight: 52,
      fontWeight: "900",
      letterSpacing: -1.5,
    },

    pageSubtitle: {
      color: "#817B88",
      fontSize: 16,
      marginTop: 9,
    },

    primaryButton: {
      height: 48,
      minWidth: 165,
      borderRadius: 9,
      backgroundColor:
        "#8B5CF6",
      borderWidth: 1,
      borderColor:
        "#B69AFF",
      alignItems: "center",
      justifyContent:
        "center",
      shadowColor:
        "#8B5CF6",
      shadowOpacity: 0.28,
      shadowRadius: 18,
      elevation: 10,
    },

    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    kpiGrid: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 22,
    },

    metricCard: {
      flex: 1,
      minWidth: 200,
      minHeight: 150,
      borderRadius: 13,
      padding: 21,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#24202C",
      justifyContent:
        "space-between",
      shadowColor: "#000",
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 9,
    },

    metricCardAccent: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#34264A",
    },

    metricHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
    },

    metricLabel: {
      color: "#716A7A",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    metricDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#FFFFFF",
    },

    metricDotAccent: {
      backgroundColor:
        "#A77CFF",
      shadowColor:
        "#A77CFF",
      shadowOpacity: 0.8,
      shadowRadius: 8,
    },

    metricValue: {
      color: "#3F3F3B",
      fontSize: 34,
      fontWeight: "900",
      letterSpacing: -0.8,
    },

    metricDetail: {
      color: "#625B6D",
      fontSize: 11,
      fontWeight: "600",
    },

    errorBanner: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#57303D",
      borderRadius: 9,
      padding: 13,
      marginBottom: 18,
    },

    errorBannerText: {
      color: "#B24A57",
      fontSize: 12,
    },

    activeMissionCard: {
      position: "relative",
      overflow: "hidden",
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#493363",
      borderRadius: 15,
      padding: 28,
      marginBottom: 34,
      shadowColor:
        "#6D28D9",
      shadowOpacity: 0.14,
      shadowRadius: 28,
      elevation: 12,
    },

    activeMissionGlow: {
      position: "absolute",
      top: -100,
      right: -60,
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        "#7C3AED",
      opacity: 0.055,
    },

    activeMissionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    cardEyebrow: {
      color: "#8E68E8",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.7,
      marginBottom: 7,
    },

    activeMissionTitle: {
      color: "#3F3F3B",
      fontSize: 29,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    activeMissionDescription: {
      color: "#746C80",
      fontSize: 13,
      lineHeight: 20,
      marginTop: 7,
    },

    activeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 11,
      paddingVertical: 7,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#4C3970",
      borderRadius: 7,
    },

    activeBadgeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#A77CFF",
    },

    activeBadgeText: {
      color: "#BDA8E6",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    activeMissionNumbers: {
      flexDirection: "row",
      gap: 15,
      marginTop: 30,
    },

    missionNumber: {
      flex: 1,
      minHeight: 100,
      padding: 17,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#292230",
      borderRadius: 10,
      justifyContent:
        "space-between",
    },

    missionNumberLabel: {
      color: "#625A6D",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    missionNumberValue: {
      color: "#DDD6E7",
      fontSize: 23,
      fontWeight: "900",
      letterSpacing: -0.5,
    },

    missionNumberAccent: {
      color: "#B596FF",
    },

    activeProgressSection: {
      marginTop: 25,
    },

    activeProgressHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
      marginBottom: 9,
    },

    progressLabel: {
      color: "#625A6D",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.3,
    },

    progressSub: {
      color: "#71697A",
      fontSize: 11,
      marginTop: 4,
    },

    activeProgressPercent: {
      color: "#B596FF",
      fontSize: 24,
      fontWeight: "900",
    },

    progressTrackLarge: {
      height: 9,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 5,
      overflow: "hidden",
    },

    progressFillLarge: {
      height: 9,
      backgroundColor:
        "#8B5CF6",
      borderRadius: 5,
      shadowColor:
        "#8B5CF6",
      shadowOpacity: 0.7,
      shadowRadius: 10,
    },

    activeStats: {
      flexDirection: "row",
      gap: 34,
      marginTop: 25,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor:
        "#241E2B",
    },

    missionStat: {
      minWidth: 130,
    },

    missionStatLabel: {
      color: "#5E5768",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    missionStatValue: {
      color: "#AAA1B7",
      fontSize: 16,
      fontWeight: "800",
      marginTop: 6,
    },

    missionStatValueAccent: {
      color: "#A78BFA",
    },

    pauseButton: {
      alignSelf:
        "flex-start",
      marginTop: 23,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        "#342B40",
      backgroundColor:
        "#FFFFFF",
    },

    pauseButtonText: {
      color: "#807687",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-end",
      marginBottom: 17,
    },

    sectionTitle: {
      color: "#4A4A46",
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: -0.4,
    },

    sectionSubtitle: {
      color: "#6D6577",
      fontSize: 13,
      marginTop: 5,
    },

    sectionCount: {
      color: "#6F667D",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.4,
    },

    missionGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },

    missionCard: {
      width: "calc(50% - 8px)" as any,
      minHeight: 330,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#28232F",
      borderRadius: 14,
      padding: 23,
      shadowColor: "#000",
      shadowOpacity: 0.43,
      shadowRadius: 23,
      elevation: 10,
    },

    missionCardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
    },

    missionCardTitleBlock: {
      flex: 1,
      paddingRight: 15,
    },

    missionCardTitle: {
      color: "#4A4A46",
      fontSize: 21,
      fontWeight: "900",
    },

    missionCardDescription: {
      color: "#6D6575",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 7,
    },

    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 7,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#302A37",
    },

    statusBadgeActive: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#493665",
    },

    statusBadgeCompleted: {
      backgroundColor:
        "#FFFFFF",
      borderColor:
        "#2D4839",
    },

    statusDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor:
        "#FFFFFF",
    },

    statusDotActive: {
      backgroundColor:
        "#A77CFF",
    },

    statusDotCompleted: {
      backgroundColor:
        "#73C99A",
    },

    statusText: {
      color: "#777080",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 0.9,
    },

    targetRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginTop: 27,
      paddingBottom: 19,
      borderBottomWidth: 1,
      borderBottomColor:
        "#211D27",
    },

    targetLabel: {
      color: "#5C5565",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.2,
      marginBottom: 5,
    },

    targetValue: {
      color: "#A9A1B0",
      fontSize: 20,
      fontWeight: "800",
    },

    targetArrow: {
      color: "#8B5CF6",
      fontSize: 21,
      marginHorizontal: 20,
      marginBottom: 1,
    },

    targetRight: {
      alignItems: "flex-end",
      marginLeft: "auto",
    },

    targetValueTarget: {
      color: "#B596FF",
      fontSize: 20,
      fontWeight: "900",
    },

    smallProgressHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginTop: 19,
      marginBottom: 8,
    },

    smallProgressLabel: {
      color: "#5E5768",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    smallProgressPercent: {
      color: "#9D82D0",
      fontSize: 10,
      fontWeight: "900",
    },

    smallProgressTrack: {
      height: 5,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 3,
      overflow: "hidden",
    },

    smallProgressFill: {
      height: 5,
      backgroundColor:
        "#8B5CF6",
      borderRadius: 3,
    },

    missionMetrics: {
      flexDirection: "row",
      gap: 12,
      marginTop: 21,
    },

    missionMetric: {
      flex: 1,
    },

    missionMetricLabel: {
      color: "#56505F",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
    },

    missionMetricValue: {
      color: "#9E96A8",
      fontSize: 13,
      fontWeight: "800",
      marginTop: 5,
    },

    activateButton: {
      height: 42,
      marginTop: 22,
      borderRadius: 8,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#493665",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 10,
    },

    activateButtonText: {
      color: "#B596FF",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    activateArrow: {
      color: "#9B72F5",
      fontSize: 15,
    },

    emptyState: {
      minHeight: 360,
      borderWidth: 1,
      borderColor:
        "#28232F",
      borderRadius: 14,
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 40,
    },

    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: 16,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#403058",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 18,
    },

    emptyIconText: {
      color: "#A77CFF",
      fontSize: 28,
      fontWeight: "900",
    },

    emptyTitle: {
      color: "#4A4A46",
      fontSize: 22,
      fontWeight: "900",
    },

    emptyText: {
      color: "#6D6677",
      fontSize: 14,
      lineHeight: 22,
      textAlign: "center",
      maxWidth: 600,
      marginTop: 8,
    },

    secondaryButton: {
      marginTop: 22,
      paddingHorizontal: 18,
      height: 44,
      borderRadius: 8,
      borderWidth: 1,
      borderColor:
        "#493665",
      backgroundColor:
        "#FFFFFF",
      alignItems: "center",
      justifyContent:
        "center",
    },

    secondaryButtonText: {
      color: "#B596FF",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
    },

    foundationCard: {
      marginTop: 26,
      minHeight: 250,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#2B2533",
      borderRadius: 14,
      overflow: "hidden",
      flexDirection: "row",
    },

    foundationAccent: {
      width: 4,
      backgroundColor:
        "#8B5CF6",
    },

    foundationContent: {
      flex: 1,
      padding: 27,
    },

    foundationEyebrow: {
      color: "#8B5CF6",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    foundationTitle: {
      color: "#4A4A46",
      fontSize: 25,
      fontWeight: "900",
      marginTop: 8,
    },

    foundationText: {
      color: "#716A7B",
      fontSize: 14,
      lineHeight: 22,
      marginTop: 8,
      maxWidth: 900,
    },

    foundationPoints: {
      flexDirection: "row",
      gap: 30,
      marginTop: 22,
    },

    foundationPoint: {
      flex: 1,
      flexDirection: "row",
      gap: 9,
    },

    foundationPointDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor:
        "#A77CFF",
      marginTop: 6,
    },

    foundationPointTitle: {
      color: "#D5CDDF",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.1,
    },

    foundationPointText: {
      color: "#655E6E",
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    footer: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      marginTop: 30,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor:
        "#17151B",
    },

    footerText: {
      color: "#45404C",
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 1.3,
    },

    /* MODAL */

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        "rgba(0,0,0,0.80)",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 30,
    },

    modalCard: {
      width:
        "min(720px, 100%)" as any,
      maxHeight: "92%",
      borderRadius: 17,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#3A3146",
      shadowColor: "#000",
      shadowOpacity: 0.65,
      shadowRadius: 40,
      elevation: 20,
    },

    modalContent: {
      padding: 30,
    },

    modalHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      marginBottom: 27,
    },

    modalEyebrow: {
      color: "#9671F5",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.5,
    },

    modalTitle: {
      color: "#3F3F3B",
      fontSize: 30,
      fontWeight: "900",
      marginTop: 5,
    },

    modalSubtitle: {
      color: "#706978",
      fontSize: 13,
      marginTop: 5,
    },

    closeButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#302A38",
      alignItems: "center",
      justifyContent:
        "center",
    },

    closeButtonText: {
      color: "#A69EAF",
      fontSize: 25,
      lineHeight: 28,
    },

    inputGroup: {
      marginBottom: 18,
    },

    inputLabel: {
      color: "#6F6878",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 1.2,
      marginBottom: 8,
    },

    input: {
      height: 48,
      borderRadius: 9,
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#2E2837",
      color: "#4A4A46",
      fontSize: 14,
      paddingHorizontal: 14,
      outlineStyle:
        "none",
    } as any,

    multilineInput: {
      height: 88,
      paddingTop: 13,
      textAlignVertical:
        "top",
    },

    twoColumn: {
      flexDirection: "row",
      gap: 14,
    },

    column: {
      flex: 1,
    },

    previewCard: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#39294D",
      borderRadius: 10,
      padding: 16,
      marginBottom: 18,
    },

    previewEyebrow: {
      color: "#8062C9",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1.3,
      marginBottom: 13,
    },

    previewRow: {
      flexDirection: "row",
      gap: 25,
    },

    previewMetric: {
      flex: 1,
    },

    previewMetricLabel: {
      color: "#655D70",
      fontSize: 8,
      fontWeight: "900",
      letterSpacing: 1,
    },

    previewMetricValue: {
      color: "#B99AFF",
      fontSize: 20,
      fontWeight: "900",
      marginTop: 5,
    },

    modalError: {
      backgroundColor:
        "#FFFFFF",
      borderWidth: 1,
      borderColor:
        "#57303D",
      borderRadius: 9,
      padding: 12,
      marginBottom: 14,
    },

    modalErrorText: {
      color: "#B24A57",
      fontSize: 12,
      lineHeight: 18,
    },

    modalPrimaryButton: {
      height: 50,
      borderRadius: 10,
      backgroundColor:
        "#8B5CF6",
      borderWidth: 1,
      borderColor:
        "#B69AFF",
      alignItems: "center",
      justifyContent:
        "center",
      shadowColor:
        "#8B5CF6",
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 8,
    },

    disabledButton: {
      opacity: 0.55,
    },

    modalPrimaryText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1,
    },

    cancelButton: {
      height: 46,
      alignItems: "center",
      justifyContent:
        "center",
    },

    cancelButtonText: {
      color: "#756D80",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1,
    },
  });