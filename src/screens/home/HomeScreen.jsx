import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getTodayIntake,
  getTodayIntakeLocal,
} from "../../api/waterIntakeApi";
import { useUser } from "../../context/UserContext";
import { getDailyMeals } from "../../utils/dailyMealsStorage";

const CALORIE_TARGET = 2000;
const WATER_TARGET = 8;
const MEAL_TARGET = 3;
const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);

const MEAL_ACCENTS_MAP = { breakfast: "#F59E0B", lunch: "#22C55E", dinner: "#3B82F6" };
const MEAL_LABELS_MAP = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(TODAY);
}

function clampProgress(value, max) {
  if (!max) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}


function StatCard({ icon, value, maxValue, unit, label, accent, onPress }) {
  const progress = clampProgress(value, maxValue);

  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>
        <Text style={[styles.statValueAccent, { color: accent }]}>{value}</Text>
        <Text style={styles.statValueMuted}>/{maxValue}</Text>
      </Text>
      <Text style={styles.statLabel}>{unit}</Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: accent },
          ]}
        />
      </View>
      <Text style={styles.statFooter}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({ icon, label, onPress, isLast = false, disabled = false }) {
  return (
    <Pressable
      style={[
        styles.actionButton,
        isLast ? styles.actionButtonLast : null,
        disabled ? styles.actionButtonDisabled : null,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

function MealItem({ item, onPress }) {
  return (
    <Pressable style={styles.mealItem} onPress={onPress}>
      <View style={[styles.mealAccent, { backgroundColor: item.accent }]} />
      <View style={styles.mealTextWrap}>
        <Text style={styles.mealTitle}>{item.title}</Text>
        <Text style={[styles.mealType, { color: item.accent }]}>{item.mealType}</Text>
      </View>
      <Text style={styles.mealCalories}>{item.calories} cal</Text>
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonStatCard}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonValue} />
      <View style={styles.skeletonLabel} />
      <View style={styles.skeletonTrack} />
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    calories: 0,
    water: 0,
    mealsCompleted: 0,
    meals: [],
  });

  const displayName = useMemo(
    () =>
      user?.full_name ||
      user?.name ||
      (user?.email ? user.email.split("@")[0] : "there"),
    [user]
  );

  const refreshHome = useCallback(async () => {
    try {
      setLoading(true);

      const [localMeals, remoteWater, localWater] = await Promise.all([
        getDailyMeals(TODAY_ISO),
        getTodayIntake(user?.id).catch(() => null),
        getTodayIntakeLocal(user?.id),
      ]);

      const meals = ["breakfast", "lunch", "dinner"].flatMap((type) => {
        const arr = Array.isArray(localMeals[type])
          ? localMeals[type]
          : localMeals[type]?.title
            ? [localMeals[type]]
            : [];
        return arr
          .filter((m) => m.title)
          .map((m, i) => ({
            id: m._id ?? `${type}-${i}`,
            title: m.title,
            mealType: MEAL_LABELS_MAP[type],
            calories: toNumber(m.calories),
            accent: MEAL_ACCENTS_MAP[type],
          }));
      });

      const calories = meals.reduce((total, meal) => total + meal.calories, 0);
      const water = remoteWater ?? localWater ?? 0;

      setSummary({ calories, water, mealsCompleted: meals.length, meals });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshHome();
    }, [refreshHome])
  );

  const hasMeals = summary.meals.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.statusSpacer} />
          <View style={styles.logoBlock}>
            <Text style={styles.logoText}>NutriHelp</Text>
          </View>
          <View style={styles.batteryBadge}>
            <Ionicons name="battery-charging-outline" size={18} color="#22C55E" />
          </View>
        </View>

        <View style={styles.heroRow}>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroGreeting}>
              <Text style={styles.heroSun}>☼ </Text>
              {getGreeting()}, {displayName}
            </Text>
            <Text style={styles.heroDate}>{getTodayLabel()}</Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => navigation.navigate("HealthNewsScreen")}
          >
            <Ionicons name="notifications-outline" size={24} color="#4B5563" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.statsRow}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              icon="🔥"
              value={summary.calories}
              maxValue={CALORIE_TARGET}
              unit="kcal"
              label="Energy"
              accent="#F59E0B"
              onPress={() => navigation.navigate("GoalDetailsScreen")}
            />
            <StatCard
              icon="💧"
              value={summary.water}
              maxValue={WATER_TARGET}
              unit="cups water"
              label="Hydration"
              accent="#2B78C5"
              onPress={() => navigation.navigate("WaterIntakeScreen")}
            />
            <StatCard
              icon="🍽️"
              value={summary.mealsCompleted}
              maxValue={MEAL_TARGET}
              unit="Meals"
              label="Completed"
              accent="#22C55E"
              onPress={() => navigation.navigate("Meals")}
            />
          </View>
        )}

        <View style={styles.actionsRow}>
          <ActionButton
            icon="silverware-fork-knife"
            label="Log Meal"
            onPress={() => navigation.navigate("Meals")}
          />
          <ActionButton
            icon="cup-outline"
            label="Add Water"
            onPress={() => navigation.navigate("WaterIntakeScreen")}
          />
          <ActionButton
            icon="chat-processing-outline"
            label="Ask AI"
            onPress={() => navigation.navigate("ChatScreen")}
            isLast
          />
        </View>

        <View style={styles.mealsCard}>
          <Text style={styles.mealsCardTitle}>Today's Meals</Text>

          {loading ? (
            <View style={styles.loadingBlock}>
              <View style={styles.loadingLineLong} />
              <View style={styles.loadingLineMid} />
              <View style={styles.loadingLineLong} />
              <View style={styles.loadingLineShort} />
            </View>
          ) : hasMeals ? (
            <>
              {summary.meals.map((meal) => (
                <MealItem
                  key={meal.id}
                  item={meal}
                  onPress={() => navigation.navigate("Meals")}
                />
              ))}

              <Pressable
                style={styles.linkButton}
                onPress={() => navigation.navigate("Meals")}
              >
                <Text style={styles.linkButtonText}>View Full Meal Plan →</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🍽️</Text>
              <Text style={styles.emptyStateTitle}>No meals planned yet</Text>
              <Text style={styles.emptyStateBody}>
                Get started by setting up your meals for today.
              </Text>
              <Pressable
                style={styles.emptyCta}
                onPress={() => navigation.navigate("Meals")}
              >
                <Text style={styles.emptyCtaText}>Set Up Today's Meals</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 32,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  statusSpacer: {
    width: 40,
  },

  logoBlock: {
    flex: 1,
    alignItems: "center",
  },

  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18233D",
  },

  batteryBadge: {
    width: 40,
    alignItems: "flex-end",
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  heroTextWrap: {
    flex: 1,
    paddingRight: 14,
  },

  heroGreeting: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: "800",
    color: "#22365D",
  },

  heroSun: {
    color: "#F4B000",
  },

  heroDate: {
    marginTop: 4,
    fontSize: 13,
    color: "#7A7F8E",
  },

  notificationButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  notificationDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4D4F",
  },

  statsRow: {
    flexDirection: "row",
    marginBottom: 14,
  },

  statCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },

  statIcon: {
    fontSize: 22,
    marginBottom: 6,
  },

  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  statValueAccent: {
    fontSize: 21,
    fontWeight: "800",
  },

  statValueMuted: {
    fontSize: 15,
    color: "#A0A8B6",
  },

  statLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#7A7F8E",
  },

  progressTrack: {
    marginTop: 10,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  statFooter: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "600",
    color: "#7A7F8E",
  },

  actionsRow: {
    flexDirection: "row",
    marginBottom: 16,
  },

  actionButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    paddingHorizontal: 6,
  },

  actionButtonLast: {
    marginRight: 0,
  },

  actionButtonDisabled: {
    opacity: 0.72,
  },

  actionLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  mealsCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  mealsCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#202633",
    marginBottom: 12,
  },

  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    overflow: "hidden",
  },

  mealAccent: {
    width: 4,
    alignSelf: "stretch",
  },

  mealTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  mealTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22365D",
  },

  mealType: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
  },

  mealCalories: {
    paddingRight: 12,
    fontSize: 12,
    color: "#9CA3AF",
  },

  linkButton: {
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: "center",
  },

  linkButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2B78C5",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 28,
  },

  emptyStateIcon: {
    fontSize: 34,
    marginBottom: 10,
  },

  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 8,
  },

  emptyStateBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 18,
  },

  emptyCta: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyCtaText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  skeletonStatCard: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },

  skeletonIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#EEF2F7",
    marginBottom: 10,
  },

  skeletonValue: {
    width: "68%",
    height: 20,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
    marginBottom: 8,
  },

  skeletonLabel: {
    width: "46%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F3F5F9",
    marginBottom: 12,
  },

  skeletonTrack: {
    width: "100%",
    height: 4,
    borderRadius: 999,
    backgroundColor: "#EEF2F7",
  },

  loadingBlock: {
    paddingVertical: 8,
  },

  loadingLineLong: {
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
    marginBottom: 14,
  },

  loadingLineMid: {
    width: "72%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "#F3F5F9",
    marginBottom: 14,
  },

  loadingLineShort: {
    width: "54%",
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EEF2F7",
  },
});
