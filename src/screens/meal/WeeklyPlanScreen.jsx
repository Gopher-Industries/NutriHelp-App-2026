import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
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
import { useUser } from "../../context/UserContext";
import { getDailyMeals, removeDailyMealItem, saveDailyMeal } from "../../utils/dailyMealsStorage";
import { formatDisplayName, getWeekDates, groupMealsByType, MEAL_TYPES } from "./mealPlanUiHelpers";

const SUGGESTED_MEALS = [
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

function NutrientChip({ label, value }) {
  return (
    <View style={styles.nutrientChip}>
      <Text style={styles.nutrientChipLabel}>{label}</Text>
      <Text style={styles.nutrientChipValue}>{value}</Text>
    </View>
  );
}

function MealItemCard({ recipe, accent, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail =
    recipe.proteins > 0 || recipe.fats > 0 || recipe.fiber > 0 || recipe.sodium > 0;
  const hasIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0;

  return (
    <View style={styles.filledCard}>
      <View style={[styles.mealAccentBar, { backgroundColor: accent }]} />
      <View style={styles.mealTextWrap}>
        <View style={styles.mealTitleRow}>
          <Text style={styles.mealTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.mealTitleActions}>
            <Text style={styles.mealCalText}>{Math.round(recipe.calories || 0)} cal</Text>
            <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {recipe.description ? (
          <Text style={styles.mealDesc} numberOfLines={3}>{recipe.description}</Text>
        ) : null}

        {hasDetail ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.nutrientScroll}
          >
            <View style={styles.nutrientRow}>
              {recipe.proteins > 0 ? (
                <NutrientChip label="Protein" value={`${recipe.proteins}g`} />
              ) : null}
              {recipe.fats > 0 ? (
                <NutrientChip label="Fat" value={`${recipe.fats}g`} />
              ) : null}
              {recipe.fiber > 0 ? (
                <NutrientChip label="Fiber" value={`${recipe.fiber}g`} />
              ) : null}
              {recipe.sodium > 0 ? (
                <NutrientChip label="Sodium" value={`${recipe.sodium}mg`} />
              ) : null}
            </View>
          </ScrollView>
        ) : null}

        {hasIngredients ? (
          <>
            <Pressable
              style={styles.ingredientsToggle}
              onPress={() => setExpanded((p) => !p)}
            >
              <Text style={styles.ingredientsToggleText}>
                {expanded ? "Hide ingredients" : "Show ingredients"}
              </Text>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={12}
                color="#6B7280"
              />
            </Pressable>
            {expanded ? (
              <View style={styles.ingredientsList}>
                {recipe.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientRow}>
                    <Text style={styles.ingredientDot}>•</Text>
                    <Text style={styles.ingredientItem}>{ing.item}</Text>
                    <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

function EmptyMealSlot({ mealType, onAdd }) {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyCardInner}>
        <Ionicons name="restaurant-outline" size={20} color="#D1D5DB" />
        <Text style={styles.emptyCardText}>Nothing planned yet</Text>
      </View>
      <Pressable
        style={styles.addSlotBtn}
        onPress={onAdd}
        android_ripple={{ color: "#DBEAFE" }}
      >
        <Ionicons name="add" size={16} color="#2A78C5" />
        <Text style={styles.addSlotBtnText}>Add {formatDisplayName(mealType)}</Text>
      </Pressable>
    </View>
  );
}

function MealSection({ mealType, group, draftMeals, onAdd, onDelete }) {
  const accent = MEAL_ACCENTS[mealType];
  const liveRecipe = group?.hasLiveData ? group?.recipes?.[0] : null;
  const meals =
    draftMeals?.length > 0
      ? draftMeals
      : liveRecipe
        ? [{ title: liveRecipe.title, calories: liveRecipe.calories, _id: "live" }]
        : [];

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealSectionHeader}>
        <View style={[styles.mealSectionDot, { backgroundColor: accent }]} />
        <Text style={[styles.mealSectionTitle, { color: accent }]}>
          {formatDisplayName(mealType)}
        </Text>
      </View>

      {meals.length > 0 ? (
        <>
          {meals.map((meal, index) => (
            <MealItemCard
              key={meal._id ?? index}
              recipe={meal}
              accent={accent}
              onDelete={() => onDelete(mealType, meal._id)}
            />
          ))}
          <Pressable
            style={styles.addMoreBtn}
            onPress={onAdd}
            android_ripple={{ color: "#DBEAFE" }}
          >
            <Ionicons name="add-circle-outline" size={15} color="#6B7280" />
            <Text style={styles.addMoreBtnText}>Add another</Text>
          </Pressable>
        </>
      ) : (
        <EmptyMealSlot mealType={mealType} onAdd={onAdd} />
      )}
    </View>
  );
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
      setStatus("ready");
    }
  }, [selectedDate, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

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
      const entry = { title: meal.title, calories: meal.calories, _id: Date.now().toString() };
      setDraftMeals((prev) => {
        const existing = Array.isArray(prev[sheetMealType]) ? prev[sheetMealType] : [];
        return { ...prev, [sheetMealType]: [...existing, entry] };
      });
      setSheetVisible(false);
      await saveDailyMeal(selectedDate, sheetMealType, entry);
    },
    [sheetMealType, selectedDate]
  );

  const handleDelete = useCallback(
    async (mealType, mealId) => {
      setDraftMeals((prev) => {
        const existing = Array.isArray(prev[mealType]) ? prev[mealType] : [];
        return { ...prev, [mealType]: existing.filter((m) => m._id !== mealId) };
      });
      await removeDailyMealItem(selectedDate, mealType, mealId);
    },
    [selectedDate]
  );

  const visibleOptions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return q
      ? SUGGESTED_MEALS.filter((m) => m.title.toLowerCase().includes(q))
      : SUGGESTED_MEALS;
  }, [searchText]);

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
                <Text style={[styles.dayChipNum, active && styles.dayChipNumActive]}>
                  {date.getDate()}
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
          <View style={styles.mealsContainer}>
            {MEAL_TYPES.map((mealType) => (
              <MealSection
                key={mealType}
                mealType={mealType}
                group={groupsByType.get(mealType)}
                draftMeals={draftMeals[mealType] || []}
                onAdd={() => openSheet(mealType)}
                onDelete={handleDelete}
              />
            ))}
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
                      <Text style={styles.optionCalories}>{meal.calories} cal</Text>
                    </View>
                    <View style={styles.optionAddBtn}>
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
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
    width: 58,
    height: 68,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  dayChipActive: { backgroundColor: "#2A78C5", borderColor: "#2A78C5" },
  dayChipLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", marginBottom: 4 },
  dayChipLabelActive: { color: "#DBEAFE" },
  dayChipNum: { fontSize: 20, fontWeight: "800", color: "#253B63" },
  dayChipNumActive: { color: "#FFFFFF" },

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

  mealsContainer: { gap: 12 },

  mealSection: {
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
  },
  mealSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mealSectionDot: { width: 8, height: 8, borderRadius: 4 },
  mealSectionTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },

  filledCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  mealAccentBar: { width: 4, alignSelf: "stretch" },
  mealTextWrap: { flex: 1, paddingHorizontal: 12, paddingVertical: 10 },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  mealTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#253B63" },
  mealTitleActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    marginTop: 1,
  },
  mealCalText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  mealMeta: { fontSize: 12, color: "#9CA3AF" },
  mealDesc: { fontSize: 12, color: "#6B7280", lineHeight: 17, marginBottom: 8 },
  nutrientScroll: { marginBottom: 8 },
  nutrientRow: { flexDirection: "row", gap: 6 },
  nutrientChip: {
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nutrientChipLabel: { fontSize: 10, color: "#6B7280", fontWeight: "600", marginBottom: 1 },
  nutrientChipValue: { fontSize: 11, color: "#1E40AF", fontWeight: "700" },
  ingredientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    minHeight: 28,
  },
  ingredientsToggleText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  ingredientsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    gap: 3,
    marginTop: 2,
  },
  ingredientRow: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  ingredientDot: { fontSize: 11, color: "#9CA3AF", lineHeight: 17 },
  ingredientItem: { flex: 1, fontSize: 12, color: "#374151", lineHeight: 17 },
  ingredientAmount: { fontSize: 12, color: "#6B7280", lineHeight: 17 },

  emptyCard: {
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  emptyCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyCardText: { fontSize: 13, color: "#9CA3AF" },

  addSlotBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    minHeight: 44,
  },
  addSlotBtnText: { fontSize: 13, fontWeight: "600", color: "#2A78C5" },

  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
  },
  addMoreBtnText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

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
