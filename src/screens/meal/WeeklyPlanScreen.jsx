import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";
import { getDailyMeals, saveDailyMeal } from "../../utils/dailyMealsStorage";
import { formatDisplayName, getWeekDates, groupMealsByType, MEAL_TYPES, normalizeRecipe } from "./mealPlanUiHelpers";

const FALLBACK_MEALS = [
  { id: "oatmeal", title: "Oatmeal", calories: 320 },
  { id: "greek-yogurt-bowl", title: "Greek Yogurt Bowl", calories: 280 },
  { id: "fruit-smoothie", title: "Fruit Smoothie", calories: 300 },
  { id: "veggie-wrap", title: "Veggie Wrap", calories: 390 },
  { id: "chicken-stir-fry", title: "Chicken Stir Fry", calories: 510 },
  { id: "salmon-salad", title: "Salmon Salad", calories: 420 },
  { id: "pasta-primavera", title: "Pasta Primavera", calories: 480 },
];

const MEAL_ACCENTS = {
  breakfast: "#F59E0B",
  lunch: "#22C55E",
  dinner: "#3B82F6",
};

function sameCalendarDay(left, right) {
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

function formatScreenDate(date) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}


export default function WeeklyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState("loading");
  const [groups, setGroups] = useState([]);
  const [draftMeals, setDraftMeals] = useState({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMealType, setSheetMealType] = useState("breakfast");
  const [searchText, setSearchText] = useState("");
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const loadPlan = useCallback(async () => {
    try {
      setStatus("loading");

      // Always load locally-saved meals first (AI plan saves + bottom-sheet adds).
      const local = await getDailyMeals(selectedDate);
      setDraftMeals(local);

      // Best-effort backend fetch — failures show empty sections, not an error screen.
      try {
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        setGroups(
          groupMealsByType(
            response?.data?.items || response?.items || response?.mealPlans || [],
            selectedDate
          )
        );
      } catch {
        setGroups(groupMealsByType([], selectedDate));
      }

      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [selectedDate, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  useEffect(() => {
    if (!sheetVisible) return;
    let cancelled = false;

    async function loadRecipes() {
      setRecipesLoading(true);
      try {
        const response = await recipeApi.getRecipes({ userId: user?.id });
        if (!cancelled) {
          const raw = response?.data?.recipes || response?.recipes || response?.data || [];
          const list = Array.isArray(raw) ? raw : [];
          setAvailableRecipes(
            list.length > 0
              ? list.slice(0, 30).map((r, i) => normalizeRecipe(r, sheetMealType, i))
              : FALLBACK_MEALS.map((m) => ({ ...m }))
          );
        }
      } catch {
        if (!cancelled) setAvailableRecipes(FALLBACK_MEALS.map((m) => ({ ...m })));
      } finally {
        if (!cancelled) setRecipesLoading(false);
      }
    }

    loadRecipes();
    return () => { cancelled = true; };
  }, [sheetVisible, sheetMealType, user?.id]);

  const groupsByType = useMemo(() => {
    const map = new Map();
    groups.forEach((g) => map.set(g.mealType, g));
    return map;
  }, [groups]);

  const openSheet = useCallback((mealType) => {
    setSheetMealType(mealType);
    setSearchText("");
    setSheetVisible(true);
  }, []);

  const handleAddDraft = useCallback(
    async (meal) => {
      const dateStr =
        selectedDate instanceof Date
          ? selectedDate.toISOString().slice(0, 10)
          : String(selectedDate).slice(0, 10);
      const entry = { ...meal, _id: meal.id || Date.now().toString() };
      setDraftMeals((prev) => {
        const existing = Array.isArray(prev[sheetMealType]) ? prev[sheetMealType] : [];
        return { ...prev, [sheetMealType]: [...existing, entry] };
      });
      setSheetVisible(false);
      await saveDailyMeal(selectedDate, sheetMealType, entry);
      try {
        await mealPlanApi.updateDailyPlan({
          recipe_ids: [meal.id],
          meal_type: sheetMealType,
          user_id: user?.id,
          date: dateStr,
        });
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        setGroups(
          groupMealsByType(
            response?.data?.items || response?.items || response?.mealPlans || [],
            selectedDate
          )
        );
      } catch {
        // local save succeeded; backend sync failure is non-fatal
      }
    },
    [sheetMealType, selectedDate, user?.id]
  );

  const visibleOptions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return q
      ? availableRecipes.filter((m) => m.title.toLowerCase().includes(q))
      : availableRecipes;
  }, [searchText, availableRecipes]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <View style={styles.topRowSpacer} />
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.topRowSpacer} />
        </View>

        <Text style={styles.pageTitle}>Meal Plan</Text>
        <Text style={styles.pageSubtitle}>Plan and track your daily meals</Text>

        {/* AI Meal Plan hero card */}
        <Pressable
          style={styles.aiHeroCard}
          onPress={() => navigation.navigate("AIWeeklyPlanScreen")}
          android_ripple={{ color: "#065F46" }}
        >
          <View style={styles.aiHeroIconWrap}>
            <Text style={styles.aiHeroIconEmoji}>✨</Text>
          </View>
          <View style={styles.aiHeroText}>
            <Text style={styles.aiHeroTitle}>AI Meal Plan</Text>
            <Text style={styles.aiHeroSub}>Get a personalised 7-day nutrition plan</Text>
          </View>
          <View style={styles.aiHeroChevron}>
            <Ionicons name="chevron-forward" size={18} color="#047857" />
          </View>
        </Pressable>

        {/* Week day selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayChipRow}
        >
          {weekDates.map((date) => {
            const active = sameCalendarDay(date, selectedDate);
            return (
              <Pressable
                key={date.toISOString()}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => {
                  setSelectedDate(date);
                  setDraftMeals({});
                }}
                android_ripple={{ color: "#93C5FD", borderless: true }}
              >
                <Text style={[styles.dayChipLabel, active && styles.dayChipLabelActive]}>
                  {date.toLocaleDateString("en-AU", { weekday: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected date heading */}
        <Text style={styles.selectedDateLabel}>{formatScreenDate(selectedDate)}</Text>

        {/* Daily meal sections */}
        {status === "loading" ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A78C5" />
            <Text style={styles.loadingText}>Loading your plan...</Text>
          </View>
        ) : status === "error" ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
            <Text style={styles.errorTitle}>Could not load your meal plan</Text>
            <Pressable style={styles.retryBtn} onPress={loadPlan}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.dailyCard}>
            {MEAL_TYPES.map((mealType) => {
              const accent = MEAL_ACCENTS[mealType];
              const group = groupsByType.get(mealType);
              const liveRecipe = group?.hasLiveData ? group?.recipes?.[0] : null;
              const drafts = Array.isArray(draftMeals[mealType]) ? draftMeals[mealType] : [];
              const displayName = drafts[0]?.title || liveRecipe?.title || null;
              return (
                <View key={mealType} style={styles.mealSummaryRow}>
                  <View style={[styles.mealRowBar, { backgroundColor: accent }]} />
                  <View style={styles.mealSummaryText}>
                    <Text style={[styles.mealSummaryType, { color: accent }]}>
                      {formatDisplayName(mealType)}
                    </Text>
                    {displayName ? (
                      <Text style={styles.mealSummaryTitle} numberOfLines={1}>{displayName}</Text>
                    ) : (
                      <Text style={styles.mealSummaryEmpty}>Nothing planned yet</Text>
                    )}
                  </View>
                </View>
              );
            })}
            <View style={styles.dailyCardActions}>
              <Pressable
                style={styles.viewDetailsBtn}
                onPress={() => navigation.navigate("DailyPlanScreen", {
                  date: selectedDate instanceof Date
                    ? selectedDate.toISOString().slice(0, 10)
                    : String(selectedDate).slice(0, 10),
                })}
              >
                <Text style={styles.viewDetailsBtnText}>View Details</Text>
              </Pressable>
              <Pressable
                style={styles.addMealsBtn}
                onPress={() => openSheet("breakfast")}
              >
                <Text style={styles.addMealsBtnText}>+ Add Meals</Text>
              </Pressable>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Add meal bottom sheet */}
      <Modal
        transparent
        visible={sheetVisible}
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setSheetVisible(false)}
          />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              Add {formatDisplayName(sheetMealType)}
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search meals..."
              placeholderTextColor="#98A2B3"
              value={searchText}
              onChangeText={setSearchText}
            />

            {recipesLoading ? (
              <View style={styles.sheetLoading}>
                <ActivityIndicator size="large" color="#2A78C5" />
                <Text style={styles.sheetLoadingText}>Loading meals...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {visibleOptions.length === 0 ? (
                  <Text style={styles.noResults}>No meals found</Text>
                ) : (
                  visibleOptions.map((meal) => (
                    <Pressable
                      key={meal.id}
                      style={styles.optionRow}
                      onPress={() => handleAddDraft(meal)}
                      android_ripple={{ color: "#EFF6FF" }}
                    >
                      <View>
                        <Text style={styles.optionTitle}>{meal.title}</Text>
                        <Text style={styles.optionCalories}>{Math.round(meal.calories || 0)} cal</Text>
                      </View>
                      <View style={styles.optionAddBtn}>
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  topRowSpacer: { width: 40 },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },

  pageTitle: { fontSize: 32, fontWeight: "800", color: "#253B63", marginBottom: 6 },
  pageSubtitle: { fontSize: 15, color: "#66758F", marginBottom: 22 },

  dayChipRow: { gap: 8, paddingBottom: 4 },
  dayChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  dayChipActive: { backgroundColor: "#2A78C5", borderColor: "#2A78C5" },
  dayChipLabel: { fontSize: 11, fontWeight: "700", color: "#6B7280" },
  dayChipLabelActive: { color: "#FFFFFF" },

  selectedDateLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#253B63",
    marginTop: 16,
    marginBottom: 16,
  },

  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#9CA3AF" },

  errorContainer: {
    paddingVertical: 48,
    alignItems: "center",
    gap: 12,
  },
  errorTitle: { fontSize: 16, fontWeight: "600", color: "#374151", textAlign: "center" },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#2A78C5",
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  dailyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    paddingVertical: 4,
  },
  mealSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  mealRowBar: { width: 4, height: 36, borderRadius: 2 },
  mealSummaryText: { flex: 1 },
  mealSummaryType: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
  mealSummaryTitle: { fontSize: 14, fontWeight: "600", color: "#253B63" },
  mealSummaryEmpty: { fontSize: 13, color: "#9CA3AF" },
  dailyCardActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 4,
  },
  viewDetailsBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsBtnText: { fontSize: 14, fontWeight: "700", color: "#2A78C5" },
  addMealsBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
  addMealsBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  aiHeroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  aiHeroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  aiHeroIconEmoji: { fontSize: 26 },
  aiHeroText: { flex: 1 },
  aiHeroTitle: { fontSize: 16, fontWeight: "800", color: "#047857", marginBottom: 3 },
  aiHeroSub: { fontSize: 12, color: "#059669", lineHeight: 16 },
  aiHeroChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  sheetLoading: { alignItems: "center", paddingVertical: 32 },
  sheetLoadingText: { marginTop: 10, fontSize: 14, color: "#98A2B3" },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15,23,42,0.30)",
  },
  sheetBackdrop: { flex: 1 },
  sheetContainer: {
    maxHeight: "65%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D0D5DD",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#253B63",
    marginBottom: 14,
  },
  searchInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#253B63",
    marginBottom: 8,
    backgroundColor: "#F9FAFB",
  },
  noResults: { textAlign: "center", color: "#9CA3AF", paddingVertical: 24, fontSize: 14 },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    minHeight: 60,
  },
  optionTitle: { fontSize: 15, fontWeight: "600", color: "#253B63", marginBottom: 3 },
  optionCalories: { fontSize: 13, color: "#98A2B3" },
  optionAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
});
