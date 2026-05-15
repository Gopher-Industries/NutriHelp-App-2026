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
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import WeeklyProgressChart from "../../components/charts/WeeklyProgressChart";
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
  snack: "#8B5CF6",
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
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState("loading");
  const [weeklyRawData, setWeeklyRawData] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMealType, setSheetMealType] = useState("breakfast");
  const [sheetDate, setSheetDate] = useState(new Date());
  const [searchText, setSearchText] = useState("");
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const loadPlan = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setStatus("loading");

      try {
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        const raw = response?.data?.items || response?.items || response?.mealPlans || [];
        setWeeklyRawData(raw);
      } catch {
        setWeeklyRawData([]);
      }

      setStatus("ready");
    } catch {
      setStatus("error");
    } finally {
      if (isRefresh) setRefreshing(false);
    }
  }, [user?.id]);

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

  const weekGridData = useMemo(() => {
    return weekDates.map((date) => {
      const groups = groupMealsByType(weeklyRawData, date);
      const groupMap = new Map();
      groups.forEach((g) => groupMap.set(g.mealType, g));
      return { date, groupMap };
    });
  }, [weekDates, weeklyRawData]);

  const chartData = useMemo(() => {
    return weekGridData.map(({ date, groupMap }) => {
      let dailyCalories = 0;
      MEAL_TYPES.forEach((type) => {
        const group = groupMap.get(type);
        if (group?.hasLiveData && group.recipes?.[0]) {
          dailyCalories += group.recipes[0].calories || 0;
        }
      });
      return {
        day: date.toLocaleDateString("en-AU", { weekday: "short" }),
        calories: Math.round(dailyCalories),
      };
    });
  }, [weekGridData]);

  const openSheet = useCallback((mealType, date) => {
    setSheetMealType(mealType);
    setSheetDate(date);
    setSearchText("");
    setSheetVisible(true);
  }, []);

  const handleAddDraft = useCallback(
    async (meal) => {
      const dateStr =
        sheetDate instanceof Date
          ? sheetDate.toISOString().slice(0, 10)
          : String(sheetDate).slice(0, 10);
      const entry = { ...meal, _id: meal.id || Date.now().toString() };
      
      setSheetVisible(false);
      await saveDailyMeal(sheetDate, sheetMealType, entry);
      try {
        await mealPlanApi.updateDailyPlan({
          recipe_ids: [meal.id],
          meal_type: sheetMealType,
          user_id: user?.id,
          date: dateStr,
        });
        loadPlan(false);
      } catch {
        // local save succeeded; backend sync failure is non-fatal
        loadPlan(false);
      }
    },
    [sheetMealType, sheetDate, user?.id, loadPlan]
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPlan(true)} />
        }
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

        {/* Weekly Progress Chart */}
        <View style={styles.chartContainer}>
          <WeeklyProgressChart data={chartData} />
        </View>

        <Text style={styles.sectionHeading}>This Week's Plan</Text>

        {/* 7-Column Grid */}
        {status === "loading" ? (
          <View style={styles.loadingWrapper}>
            <LoadingSpinner message="Loading your plan..." />
          </View>
        ) : status === "error" ? (
          <EmptyState
            icon="alert-circle-outline"
            title="Could not load your meal plan"
            message="There was an issue loading your data. Please try again."
            actionLabel="Retry"
            onAction={() => loadPlan(false)}
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gridOuter}
          >
            <View>
              {/* Header row (Days) */}
              <View style={styles.gridHeaderRow}>
                <View style={styles.gridCellMealLabel} />
                {weekGridData.map(({ date }) => (
                  <Pressable
                    key={date.toISOString()}
                    style={styles.gridCellHeader}
                    onPress={() =>
                      navigation.navigate("DailyPlanScreen", {
                        date:
                          date instanceof Date
                            ? date.toISOString().slice(0, 10)
                            : String(date).slice(0, 10),
                      })
                    }
                  >
                    <Text style={styles.gridCellHeaderText}>
                      {date.toLocaleDateString("en-AU", { weekday: "short" })}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Meal rows */}
              {MEAL_TYPES.map((mealType) => (
                <View key={mealType} style={styles.gridRow}>
                  <View style={styles.gridCellMealLabel}>
                    <Text style={styles.gridCellMealLabelText}>
                      {formatDisplayName(mealType)}
                    </Text>
                  </View>
                  {weekGridData.map(({ date, groupMap }) => {
                    const group = groupMap.get(mealType);
                    const recipe = group?.hasLiveData ? group.recipes[0] : null;

                    return (
                      <Pressable
                        key={`${date.toISOString()}-${mealType}`}
                        style={styles.gridCell}
                        onPress={() => {
                          if (recipe) {
                            navigation.navigate("DailyPlanScreen", {
                              date:
                                date instanceof Date
                                  ? date.toISOString().slice(0, 10)
                                  : String(date).slice(0, 10),
                            });
                          } else {
                            openSheet(mealType, date);
                          }
                        }}
                      >
                        {recipe ? (
                          <Text
                            style={[
                              styles.gridCellItem,
                              { backgroundColor: MEAL_ACCENTS[mealType] + "22", color: MEAL_ACCENTS[mealType] },
                            ]}
                            numberOfLines={2}
                          >
                            {recipe.title}
                          </Text>
                        ) : (
                          <View style={styles.gridCellEmpty}>
                            <Ionicons name="add" size={20} color="#D1D5DB" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
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

  chartContainer: { marginBottom: 24 },
  sectionHeading: { fontSize: 20, fontWeight: "700", color: "#253B63", marginBottom: 12 },

  loadingWrapper: { paddingVertical: 40 },

  gridOuter: { paddingBottom: 16, paddingRight: 10 },
  gridHeaderRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8 },
  gridCellMealLabel: { width: 68, marginRight: 8, justifyContent: "center" },
  gridCellMealLabelText: { fontSize: 13, fontWeight: "600", color: "#66758F", textAlign: "right" },
  gridCellHeader: {
    width: 68,
    alignItems: "center",
    marginHorizontal: 4,
  },
  gridCellHeaderText: { fontSize: 13, fontWeight: "700", color: "#253B63" },
  
  gridRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 8 },
  gridCell: {
    width: 68,
    minHeight: 56,
    marginHorizontal: 4,
  },
  gridCellItem: {
    flex: 1,
    borderRadius: 8,
    padding: 6,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    lineHeight: 12,
    overflow: "hidden",
  },
  gridCellEmpty: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },

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