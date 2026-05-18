import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
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
import mealPlanApi from "../../api/mealPlanApi";
import { useUser } from "../../context/UserContext";
import { getDailyMeals } from "../../utils/dailyMealsStorage";
import { groupMealsByType, MEAL_TYPES } from "../meal/mealPlanUiHelpers";

const CALORIE_TARGET = 2000;
const WATER_TARGET = 8;
const MEAL_TARGET = 3;

const MEAL_ACCENTS_MAP = { breakfast: "#F59E0B", lunch: "#22C55E", dinner: "#3B82F6" };
const MEAL_LABELS_MAP = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
const FALLBACK_MEAL_IMAGES = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80",
];

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
  }).format(new Date());
}

function clampProgress(value, max) {
  if (!max) return 0;
  return Math.min(Math.max(value / max, 0), 1);
}

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function pickMealImageUrl(meal, index) {
  const candidates = [
    meal?.imageUrl,
    meal?.image_url,
    meal?.thumbnail_url,
    meal?.recipe_image_url,
    meal?.rawRecipe?.imageUrl,
    meal?.rawRecipe?.image_url,
    meal?.rawRecipe?.thumbnail_url,
  ];
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value) {
      return value;
    }
  }
  return FALLBACK_MEAL_IMAGES[index % FALLBACK_MEAL_IMAGES.length];
}


function StatCard({ icon, value, maxValue, unit, label, accent, onPress }) {
  const progress = clampProgress(value, maxValue);

  return (
    <Pressable style={styles.statCard} onPress={onPress}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.78}
      >
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
    <Pressable style={styles.mealCardHorizontal} onPress={onPress}>
      <Image source={{ uri: item.imageUrl }} style={styles.mealThumb} resizeMode="cover" />
      <View style={styles.mealCardBody}>
        <Text style={styles.mealTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.mealType, { color: item.accent }]}>{item.mealType}</Text>
        <Text style={styles.mealCalories}>{item.calories} kcal</Text>
      </View>
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
    mealSections: [],
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
      const todayIso = toIsoDate(new Date());

      const [localMeals, weeklyPlan, remoteWater, localWater] = await Promise.all([
        getDailyMeals(todayIso),
        mealPlanApi.getWeeklyPlan({ userId: user?.id }).catch(() => null),
        getTodayIntake(user?.id).catch(() => null),
        getTodayIntakeLocal(user?.id),
      ]);

      const liveGroups = groupMealsByType(
        weeklyPlan?.data?.items || weeklyPlan?.items || weeklyPlan?.mealPlans || [],
        todayIso
      );
      const liveByType = new Map(liveGroups.map((group) => [group.mealType, group]));

      const mealSections = MEAL_TYPES.map((type) => {
        const source = localMeals || {};
        const hasLocalOverride = Object.prototype.hasOwnProperty.call(source, type);
        const localArr = Array.isArray(source[type])
          ? source[type]
          : source[type]?.title
            ? [source[type]]
            : [];

        const localMealsMapped = localArr
          .filter((m) => m.title)
          .map((m, i) => ({
            id: m._id ?? `${type}-local-${i}`,
            title: m.title,
            mealType: MEAL_LABELS_MAP[type],
            calories: toNumber(m.calories),
            accent: MEAL_ACCENTS_MAP[type],
            imageUrl: pickMealImageUrl(m, i),
          }));

        const liveGroup = liveByType.get(type);
        const liveMeals = (liveGroup?.hasLiveData ? liveGroup.recipes || [] : []).map((m, i) => ({
          id: m.id ?? `${type}-live-${i}`,
          title: m.title ?? "Untitled Meal",
          mealType: MEAL_LABELS_MAP[type],
          calories: toNumber(m.calories),
          accent: MEAL_ACCENTS_MAP[type],
          imageUrl: pickMealImageUrl(m, i),
        }));
        const meals = hasLocalOverride ? localMealsMapped : liveMeals;

        return {
          type,
          label: MEAL_LABELS_MAP[type],
          accent: MEAL_ACCENTS_MAP[type],
          meals,
        };
      });
      const meals = mealSections.flatMap((section) => section.meals);

      const calories = meals.reduce((total, meal) => total + meal.calories, 0);
      const water = remoteWater ?? localWater ?? 0;

      setSummary({ calories, water, mealsCompleted: meals.length, meals, mealSections });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshHome();
    }, [refreshHome])
  );

  const hasMeals = summary.mealsCompleted > 0;

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
              {summary.mealSections
                .filter((section) => section.meals.length > 0)
                .map((section) => (
                  <View key={section.type} style={styles.mealSection}>
                    <View style={styles.mealSectionHeader}>
                      <Text style={[styles.mealSectionTitle, { color: section.accent }]}>
                        {section.label}
                      </Text>
                      <Text style={styles.mealSectionCount}>{section.meals.length} items</Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.mealHorizontalContent}
                    >
                      {section.meals.map((meal) => (
                        <MealItem
                          key={meal.id}
                          item={meal}
                          onPress={() => navigation.navigate("Meals")}
                        />
                      ))}
                    </ScrollView>
                  </View>
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
    flexShrink: 1,
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

  mealSection: {
    marginBottom: 12,
  },

  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  mealSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  mealSectionCount: {
    fontSize: 12,
    color: "#8A94A6",
    fontWeight: "600",
  },

  mealHorizontalContent: {
    paddingRight: 4,
  },

  mealCardHorizontal: {
    width: 188,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginRight: 10,
    overflow: "hidden",
  },

  mealThumb: {
    width: "100%",
    height: 96,
    backgroundColor: "#E2E8F0",
  },

  mealCardBody: {
    paddingHorizontal: 10,
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
    marginTop: 4,
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "600",
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
