import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import {
  getDailyMeals,
  removeDailyMealItem,
  saveDailyMeal,
} from "../../utils/dailyMealsStorage";
import { formatDisplayName, groupMealsByType, MEAL_TYPES } from "./mealPlanUiHelpers";

const MEAL_ACCENTS = {
  breakfast: "#F59E0B",
  lunch: "#22C55E",
  dinner: "#3B82F6",
};

const RECIPE_IMAGE_FALLBACKS = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80",
];

const DAY_CHIP_WIDTH = 56;
const DAY_CHIP_GAP = 8;
const DAY_ROW_SIDE_PADDING = 2;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function toIsoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(left, right) {
  return toIsoDate(left) === toIsoDate(right);
}

function parseNumericCalories(value) {
  if (value == null || value === "") {
    return 0;
  }
  const parsed = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function extractCaloriesFromRecipe(raw) {
  const direct =
    raw?.calories ?? raw?.calorie_count ?? raw?.total_calories ?? raw?.energy_kcal ?? raw?.kcal;
  let parsed = parseNumericCalories(direct);
  if (parsed > 0) {
    return parsed;
  }

  const nutrition = raw?.nutrition;
  if (nutrition && typeof nutrition === "object" && !Array.isArray(nutrition)) {
    parsed = parseNumericCalories(
      nutrition.calories ?? nutrition.Calories ?? nutrition.kcal ?? nutrition.total_calories
    );
    if (parsed > 0) {
      return parsed;
    }
  }

  if (Array.isArray(nutrition)) {
    const caloriesEntry = nutrition.find((entry) =>
      String(entry?.name ?? entry?.label ?? "")
        .toLowerCase()
        .includes("cal")
    );
    if (caloriesEntry) {
      parsed = parseNumericCalories(caloriesEntry.value ?? caloriesEntry.amount);
      if (parsed > 0) {
        return parsed;
      }
    }
  }

  return 0;
}

function extractRecipeLibraryRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.recipes)) return response.recipes;
  if (Array.isArray(response?.data?.recipes)) return response.data.recipes;
  return [];
}

function mapRecipeLibraryRow(row, index) {
  const fallbackImage = RECIPE_IMAGE_FALLBACKS[index % RECIPE_IMAGE_FALLBACKS.length];
  const title = row?.display_name ?? row?.recipe_name ?? row?.dish_name ?? "Untitled Recipe";
  const sourceMealType = String(row?.meal_type ?? "").trim().toLowerCase();
  const normalizedMealType = MEAL_TYPES.includes(sourceMealType) ? sourceMealType : "other";

  return {
    id: `library-${row?.id ?? index}`,
    recipeId: Number(row?.id) || null,
    title,
    imageUrl: String(row?.image_url ?? "").trim() || fallbackImage,
    calories: extractCaloriesFromRecipe(row),
    mealType: normalizedMealType,
    cuisine: String(row?.cuisine_name_snapshot ?? row?.cuisine_name ?? "").trim(),
    timeMinutes:
      Number(row?.total_time_minutes ?? row?.prep_time_minutes ?? row?.cook_time_minutes ?? 0) || 0,
    servings: Number(row?.servings ?? 1) || 1,
    difficulty: String(row?.difficulty ?? "Easy"),
    ingredients: Array.isArray(row?.ingredients) ? row.ingredients : [],
    instructions: Array.isArray(row?.instructions) ? row.instructions : [],
    sourceType: "recipe_library",
    rawRecipe: row,
  };
}

function buildRecipeDetailPayload(meal) {
  const numericId = Number(meal?.recipeId ?? meal?.id);
  return {
    recipeId: Number.isInteger(numericId) && numericId > 0 ? numericId : undefined,
    recipe: {
      id: String(meal?.recipeId ?? meal?.id ?? ""),
      recipe_id: meal?.recipeId ?? null,
      title: meal?.title ?? "Untitled Recipe",
      recipe_name: meal?.title ?? "Untitled Recipe",
      image_url: meal?.imageUrl ?? "",
      calories: meal?.calories ?? 0,
      time_minutes: meal?.timeMinutes ?? 0,
      servings: meal?.servings ?? 1,
      difficulty: meal?.difficulty ?? "Easy",
      ingredients: Array.isArray(meal?.ingredients) ? meal.ingredients : [],
      instructions: Array.isArray(meal?.instructions) ? meal.instructions : [],
      source: meal?.sourceType ?? "recipe_library",
      sourceType: meal?.sourceType ?? "recipe_library",
      cuisine_name: meal?.cuisine ?? "",
      rawRecipe: meal?.rawRecipe ?? meal,
    },
  };
}

function EmptyMealCard({ mealType, onAdd }) {
  return (
    <View style={styles.slotCard}>
      <View style={styles.slotCardEmptyInner}>
        <Text style={styles.slotEmptyTitle}>No meal selected</Text>
        <Text style={styles.slotEmptySubtitle}>Choose a dish for {formatDisplayName(mealType)}</Text>
      </View>
      <Pressable style={styles.slotPrimaryButton} onPress={onAdd}>
        <Text style={styles.slotPrimaryButtonText}>+ Choose Meal</Text>
      </Pressable>
    </View>
  );
}

function FilledMealCard({ meal, accentColor, onViewDetail, onRemove }) {
  return (
    <View style={styles.slotCard}>
      <Pressable
        style={styles.removeMealBtn}
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel="Remove selected meal"
      >
        <Ionicons name="close" size={16} color="#64748B" />
      </Pressable>
      <View style={styles.filledRow}>
        <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} resizeMode="cover" />
        <View style={styles.mealInfo}>
          <Text style={styles.mealTitle} numberOfLines={2}>
            {meal.title}
          </Text>
          <Text style={[styles.mealCuisine, { color: accentColor }]} numberOfLines={1}>
            {meal.cuisine || "Recipe Library"}
          </Text>
          <Text style={styles.mealCalories}>{Math.round(meal.calories || 0)} kcal</Text>
        </View>
      </View>

      <View style={styles.slotActionRow}>
        <Pressable style={styles.slotOutlineButton} onPress={onViewDetail}>
          <Text style={styles.slotOutlineButtonText}>View detail</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function WeeklyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [status, setStatus] = useState("loading");
  const [groups, setGroups] = useState([]);
  const [draftMeals, setDraftMeals] = useState({});

  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMealType, setSheetMealType] = useState("breakfast");
  const [searchText, setSearchText] = useState("");
  const [savingMealType, setSavingMealType] = useState(null);

  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => ({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  }));
  const [dayViewportWidth, setDayViewportWidth] = useState(0);

  const dayScrollRef = useRef(null);

  const selectedDateIso = useMemo(() => toIsoDate(selectedDate), [selectedDate]);
  const today = useMemo(() => startOfDay(new Date()), []);

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`,
    [selectedDate]
  );

  const dayButtons = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const days = getDaysInMonth(year, month);
    return Array.from({ length: days }, (_, idx) => {
      const day = idx + 1;
      return new Date(year, month, day);
    });
  }, [selectedDate]);

  const groupsByType = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      map.set(group.mealType, group);
    });
    return map;
  }, [groups]);

  const centerSelectedDay = useCallback(
    (animated = true) => {
      if (!dayViewportWidth || dayButtons.length === 0) {
        return;
      }

      const selectedIndex = Math.max(
        0,
        Math.min(dayButtons.length - 1, selectedDate.getDate() - 1)
      );

      const contentWidth =
        dayButtons.length * DAY_CHIP_WIDTH +
        Math.max(0, dayButtons.length - 1) * DAY_CHIP_GAP +
        DAY_ROW_SIDE_PADDING * 2;

      const rawOffset =
        selectedIndex * (DAY_CHIP_WIDTH + DAY_CHIP_GAP) +
        DAY_ROW_SIDE_PADDING -
        (dayViewportWidth / 2 - DAY_CHIP_WIDTH / 2);

      const maxOffset = Math.max(0, contentWidth - dayViewportWidth);
      const clampedOffset = Math.max(0, Math.min(rawOffset, maxOffset));

      dayScrollRef.current?.scrollTo({ x: clampedOffset, y: 0, animated });
    },
    [dayButtons.length, dayViewportWidth, selectedDate]
  );

  const loadDailyPlan = useCallback(
    async (date) => {
      const dateIso = toIsoDate(date);
      setStatus("loading");

      try {
        const local = await getDailyMeals(dateIso);
        setDraftMeals(local || {});

        try {
          const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
          setGroups(
            groupMealsByType(
              response?.data?.items || response?.items || response?.mealPlans || [],
              dateIso
            )
          );
        } catch {
          setGroups(groupMealsByType([], dateIso));
        }

        setStatus("ready");
      } catch {
        setStatus("error");
      }
    },
    [user?.id]
  );

  const loadRecipeLibraryMeals = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const response = await recipeApi.getRecipeLibraryForAddMeal({
        limit: 500,
        cacheBust: true,
      });
      const mapped = extractRecipeLibraryRows(response).map((row, index) =>
        mapRecipeLibraryRow(row, index)
      );
      setAvailableRecipes(mapped);
    } catch (error) {
      setAvailableRecipes([]);
      if (__DEV__) {
        console.warn("[WeeklyPlan] getRecipeLibraryForAddMeal failed:", error?.message ?? error);
      }
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDailyPlan(selectedDate);
      loadRecipeLibraryMeals();
    }, [loadDailyPlan, loadRecipeLibraryMeals, selectedDate])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      centerSelectedDay(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [centerSelectedDay]);

  const openAddMeal = useCallback((mealType) => {
    setSheetMealType(mealType);
    setSearchText("");
    setSheetVisible(true);
  }, []);

  const visibleOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    const pool = availableRecipes.filter((item) => item.mealType === sheetMealType);

    if (!query) {
      return pool;
    }

    return pool.filter((item) => {
      const title = String(item?.title ?? "").toLowerCase();
      const cuisine = String(item?.cuisine ?? "").toLowerCase();
      return title.includes(query) || cuisine.includes(query);
    });
  }, [availableRecipes, sheetMealType, searchText]);

  const applyMonthCursor = useCallback(() => {
    const targetYear = monthCursor.year;
    const targetMonth = monthCursor.month;
    const maxDay = getDaysInMonth(targetYear, targetMonth);
    const nextDay = Math.min(selectedDate.getDate(), maxDay);
    const nextDate = new Date(targetYear, targetMonth, nextDay);
    setSelectedDate(startOfDay(nextDate));
    setMonthPickerVisible(false);
  }, [monthCursor, selectedDate]);

  const jumpMonth = useCallback((delta) => {
    setSelectedDate((previous) => {
      const y = previous.getFullYear();
      const m = previous.getMonth();
      const d = previous.getDate();
      const candidate = new Date(y, m + delta, 1);
      const maxDay = getDaysInMonth(candidate.getFullYear(), candidate.getMonth());
      return startOfDay(new Date(candidate.getFullYear(), candidate.getMonth(), Math.min(d, maxDay)));
    });
  }, []);

  const handleSelectMeal = useCallback(
    async (meal) => {
      const selected = {
        ...meal,
        _id: `${meal.recipeId || meal.id}-${Date.now()}`,
      };

      setSheetVisible(false);
      setSavingMealType(sheetMealType);
      setDraftMeals((prev) => ({
        ...prev,
        [sheetMealType]: [...(Array.isArray(prev?.[sheetMealType]) ? prev[sheetMealType] : []), selected],
      }));

      try {
        await saveDailyMeal(selectedDateIso, sheetMealType, selected);
      } catch {
        // ignore local persistence failures
      }

      try {
        await mealPlanApi.saveMealToDaily({
          meal_type: sheetMealType,
          day: selectedDateIso,
          name: meal?.title ?? "Recipe",
          description: meal?.cuisine ? `Cuisine: ${meal.cuisine}` : "Saved from recipe library",
          calories: Number(meal?.calories) || 0,
          proteins: Number(meal?.rawRecipe?.protein ?? 0) || 0,
          fats: Number(meal?.rawRecipe?.fat ?? 0) || 0,
          sodium: Number(meal?.rawRecipe?.sodium ?? 0) || 0,
          fiber: Number(meal?.rawRecipe?.fiber ?? 0) || 0,
          vitamins: Number(meal?.rawRecipe?.vitamin_a ?? 0) + Number(meal?.rawRecipe?.vitamin_c ?? 0),
          ingredients: Array.isArray(meal?.ingredients)
            ? meal.ingredients.map((item) =>
                typeof item === "string"
                  ? { item, amount: "" }
                  : {
                      item: String(item?.name ?? item?.ingredient ?? "Ingredient"),
                      amount: String(item?.quantity ?? item?.amount ?? ""),
                    }
              )
            : [],
        });
      } catch (error) {
        if (__DEV__) {
          console.warn("[WeeklyPlan] saveMealToDaily failed:", error?.message ?? error);
        }
      } finally {
        setSavingMealType(null);
      }
    },
    [selectedDateIso, sheetMealType, user?.id]
  );

  const handleRemoveMeal = useCallback(
    async (mealType, mealId, visibleMeals = []) => {
      const nextMeals = visibleMeals.filter(
        (item) => String(item?._id ?? item?.id ?? item?.recipeId) !== String(mealId)
      );

      setDraftMeals((previous) => ({
        ...previous,
        [mealType]: nextMeals,
      }));

      try {
        await removeDailyMealItem(selectedDateIso, mealType, mealId);
      } catch {
        // ignore local remove failures
      }
    },
    [selectedDateIso]
  );

  const handleOpenRecipeDetail = useCallback(
    (meal) => {
      const params = buildRecipeDetailPayload(meal);
      const parent = navigation.getParent();

      if (parent?.navigate) {
        parent.navigate("Recipes", {
          screen: "RecipeDetailScreen",
          params,
        });
        return;
      }

      navigation.navigate("RecipeDetailScreen", params);
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => jumpMonth(-1)} style={styles.monthArrowBtn}>
            <Ionicons name="chevron-back" size={18} color="#253B63" />
          </Pressable>
          <Pressable
            style={styles.monthLabelBtn}
            onPress={() => {
              setMonthCursor({
                month: selectedDate.getMonth(),
                year: selectedDate.getFullYear(),
              });
              setMonthPickerVisible(true);
            }}
          >
            <Text style={styles.monthLabelText}>{monthLabel}</Text>
            <Ionicons name="chevron-down" size={16} color="#253B63" />
          </Pressable>
          <Pressable onPress={() => jumpMonth(1)} style={styles.monthArrowBtn}>
            <Ionicons name="chevron-forward" size={18} color="#253B63" />
          </Pressable>
        </View>

        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => setDayViewportWidth(event.nativeEvent.layout.width)}
          contentContainerStyle={styles.dayRow}
        >
          {dayButtons.map((date) => {
            const active = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, today);
            return (
              <Pressable
                key={date.toISOString()}
                style={[
                  styles.dayChip,
                  active ? styles.dayChipActive : null,
                  isToday && !active ? styles.dayChipToday : null,
                ]}
                onPress={() => setSelectedDate(startOfDay(date))}
              >
                <Text style={[styles.dayNumber, active ? styles.dayNumberActive : null]}>
                  {date.getDate()}
                </Text>
                <Text style={[styles.dayWeek, active ? styles.dayWeekActive : null]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.pageTitle}>Meal Plan</Text>
        <Text style={styles.pageSubtitle}>Choose meals for each meal time from Recipe Library</Text>
        <Pressable
          style={styles.aiHeroCard}
          onPress={() => navigation.navigate("AIWeeklyPlanScreen")}
          android_ripple={{ color: "#A7F3D0" }}
        >
          <View style={styles.aiHeroIconWrap}>
            <Text style={styles.aiHeroIconEmoji}>✨</Text>
          </View>
          <View style={styles.aiHeroTextWrap}>
            <Text style={styles.aiHeroTitle}>AI 7-day meal plan</Text>
            <Text style={styles.aiHeroSubtitle}>Generate a personalised weekly plan</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#047857" />
        </Pressable>

        {status === "loading" ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2A78C5" />
            <Text style={styles.loadingText}>Loading meal plan...</Text>
          </View>
        ) : status === "error" ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Could not load your meal plan.</Text>
            <Pressable style={styles.retryBtn} onPress={() => loadDailyPlan(selectedDate)}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sectionWrap}>
            {MEAL_TYPES.map((mealType) => {
              const liveGroup = groupsByType.get(mealType);
              const liveMeals = liveGroup?.hasLiveData ? liveGroup?.recipes || [] : [];
              const hasLocalOverride = Object.prototype.hasOwnProperty.call(
                draftMeals ?? {},
                mealType
              );
              const localMeals = Array.isArray(draftMeals?.[mealType]) ? draftMeals[mealType] : [];
              const meals = hasLocalOverride ? localMeals : liveMeals;
              const accentColor = MEAL_ACCENTS[mealType] || "#2563EB";
              const saving = savingMealType === mealType;

              return (
                <View key={mealType} style={styles.slotSection}>
                  <View style={styles.slotHeader}>
                    <Text style={[styles.slotLabel, { color: accentColor }]}>
                      {formatDisplayName(mealType)}
                    </Text>
                    {saving ? <ActivityIndicator size="small" color={accentColor} /> : null}
                  </View>

                  {meals.length > 0 ? (
                    <>
                      <View style={styles.mealList}>
                        {meals.map((meal, index) => (
                          <FilledMealCard
                            key={`${mealType}-${String(meal?._id ?? meal?.id ?? meal?.recipeId ?? index)}`}
                            meal={meal}
                            accentColor={accentColor}
                            onViewDetail={() => handleOpenRecipeDetail(meal)}
                            onRemove={() =>
                              handleRemoveMeal(
                                mealType,
                                meal?._id ?? meal?.id ?? meal?.recipeId,
                                meals
                              )
                            }
                          />
                        ))}
                      </View>
                      <Pressable style={styles.slotPrimaryButton} onPress={() => openAddMeal(mealType)}>
                        <Text style={styles.slotPrimaryButtonText}>+ Add another meal</Text>
                      </Pressable>
                    </>
                  ) : (
                    <EmptyMealCard mealType={mealType} onAdd={() => openAddMeal(mealType)} />
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal transparent visible={sheetVisible} animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Choose {formatDisplayName(sheetMealType)}</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search recipe library..."
              placeholderTextColor="#98A2B3"
              value={searchText}
              onChangeText={setSearchText}
            />

            {recipesLoading ? (
              <View style={styles.sheetLoadingWrap}>
                <ActivityIndicator size="large" color="#2A78C5" />
                <Text style={styles.sheetLoadingText}>Loading recipes...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {visibleOptions.length === 0 ? (
                  <View style={styles.emptyResults}>
                    <Text style={styles.emptyResultsText}>No recipes found for this meal time.</Text>
                  </View>
                ) : (
                  visibleOptions.map((meal) => (
                    <View key={meal.id} style={styles.optionRow}>
                      <Image source={{ uri: meal.imageUrl }} style={styles.optionImage} resizeMode="cover" />
                      <View style={styles.optionInfo}>
                        <Text style={styles.optionTitle} numberOfLines={2}>
                          {meal.title}
                        </Text>
                        <Text style={styles.optionMeta} numberOfLines={1}>
                          {meal.cuisine || "Recipe Library"}
                        </Text>
                        <Text style={styles.optionCalories}>{Math.round(meal.calories || 0)} kcal</Text>
                      </View>
                      <Pressable style={styles.optionAddButton} onPress={() => handleSelectMeal(meal)}>
                        <Text style={styles.optionAddButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={monthPickerVisible}
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}
      >
        <View style={styles.pickerOverlay}>
          <Pressable style={styles.pickerBackdrop} onPress={() => setMonthPickerVisible(false)} />
          <View style={styles.pickerCard}>
            <View style={styles.pickerYearRow}>
              <Pressable
                style={styles.pickerYearArrow}
                onPress={() =>
                  setMonthCursor((prev) => ({
                    ...prev,
                    year: prev.year - 1,
                  }))
                }
              >
                <Ionicons name="chevron-back" size={18} color="#253B63" />
              </Pressable>
              <Text style={styles.pickerYearText}>{monthCursor.year}</Text>
              <Pressable
                style={styles.pickerYearArrow}
                onPress={() =>
                  setMonthCursor((prev) => ({
                    ...prev,
                    year: prev.year + 1,
                  }))
                }
              >
                <Ionicons name="chevron-forward" size={18} color="#253B63" />
              </Pressable>
            </View>

            <View style={styles.monthGrid}>
              {MONTH_NAMES.map((name, idx) => {
                const active = monthCursor.month === idx;
                return (
                  <Pressable
                    key={name}
                    style={[styles.monthCell, active ? styles.monthCellActive : null]}
                    onPress={() => setMonthCursor((prev) => ({ ...prev, month: idx }))}
                  >
                    <Text style={[styles.monthCellText, active ? styles.monthCellTextActive : null]}>
                      {name.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pickerActionRow}>
              <Pressable style={styles.pickerCancelBtn} onPress={() => setMonthPickerVisible(false)}>
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.pickerApplyBtn} onPress={applyMonthCursor}>
                <Text style={styles.pickerApplyText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },

  headerRow: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  monthLabelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
  },
  monthLabelText: { fontSize: 18, fontWeight: "700", color: "#253B63" },

  dayRow: {
    paddingBottom: 8,
    paddingHorizontal: DAY_ROW_SIDE_PADDING,
    gap: 8,
  },
  dayChip: {
    width: 56,
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  dayChipActive: {
    borderColor: "#2A78C5",
    backgroundColor: "#2A78C5",
  },
  dayChipToday: {
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
  },
  dayNumber: { fontSize: 16, fontWeight: "800", color: "#253B63" },
  dayNumberActive: { color: "#FFFFFF" },
  dayWeek: { marginTop: 2, fontSize: 11, color: "#6B7280" },
  dayWeekActive: { color: "#DBEAFE" },

  pageTitle: { marginTop: 6, fontSize: 28, fontWeight: "800", color: "#253B63" },
  pageSubtitle: { marginTop: 4, marginBottom: 14, fontSize: 14, color: "#667085" },
  aiHeroCard: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#86EFAC",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  aiHeroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1FAE5",
    marginRight: 10,
  },
  aiHeroIconEmoji: { fontSize: 22 },
  aiHeroTextWrap: { flex: 1, minWidth: 0 },
  aiHeroTitle: { fontSize: 15, fontWeight: "800", color: "#047857" },
  aiHeroSubtitle: { marginTop: 2, fontSize: 12, color: "#059669" },

  loadingBox: { paddingVertical: 40, alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#667085" },
  errorBox: { paddingVertical: 28, alignItems: "center" },
  errorText: { fontSize: 15, color: "#B91C1C", marginBottom: 12 },
  retryBtn: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "#2A78C5",
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  retryBtnText: { color: "#FFFFFF", fontWeight: "700" },

  sectionWrap: { gap: 14 },
  slotSection: { marginBottom: 2 },
  slotHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotLabel: { fontSize: 17, fontWeight: "700" },
  mealList: {
    gap: 10,
    marginBottom: 10,
  },

  slotCard: {
    position: "relative",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  removeMealBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  slotCardEmptyInner: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  slotEmptyTitle: { fontSize: 15, fontWeight: "700", color: "#253B63" },
  slotEmptySubtitle: { marginTop: 4, fontSize: 13, color: "#98A2B3", textAlign: "center" },

  filledRow: { flexDirection: "row", alignItems: "center" },
  mealImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: "#E5E7EB" },
  mealInfo: { marginLeft: 10, flex: 1, minWidth: 0 },
  mealTitle: { fontSize: 16, fontWeight: "700", color: "#253B63" },
  mealCuisine: { marginTop: 4, fontSize: 13, fontWeight: "600" },
  mealCalories: { marginTop: 4, fontSize: 13, color: "#667085" },

  slotActionRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  slotOutlineButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  slotOutlineButtonText: { fontSize: 14, fontWeight: "700", color: "#2A78C5" },
  slotPrimaryButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A78C5",
  },
  slotPrimaryButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  sheetBackdrop: { flex: 1 },
  sheetContainer: {
    maxHeight: "72%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#253B63", marginBottom: 10 },
  searchInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#253B63",
    marginBottom: 8,
  },
  sheetLoadingWrap: { alignItems: "center", paddingVertical: 28 },
  sheetLoadingText: { marginTop: 8, fontSize: 14, color: "#667085" },
  emptyResults: { alignItems: "center", paddingVertical: 30 },
  emptyResultsText: { fontSize: 14, color: "#98A2B3" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingVertical: 10,
    gap: 10,
  },
  optionImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  optionInfo: { flex: 1, minWidth: 0 },
  optionTitle: { fontSize: 15, fontWeight: "700", color: "#253B63" },
  optionMeta: { marginTop: 2, fontSize: 12, color: "#64748B" },
  optionCalories: { marginTop: 2, fontSize: 12, color: "#2A78C5", fontWeight: "600" },
  optionAddButton: {
    minHeight: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A78C5",
    paddingHorizontal: 12,
  },
  optionAddButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },

  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.32)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  pickerCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  pickerYearRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pickerYearArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  pickerYearText: { fontSize: 20, fontWeight: "800", color: "#253B63" },
  monthGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  monthCell: {
    width: "23%",
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  monthCellActive: {
    borderColor: "#2A78C5",
    backgroundColor: "#EFF6FF",
  },
  monthCellText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
  },
  monthCellTextActive: {
    color: "#1D4ED8",
  },
  pickerActionRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
  },
  pickerCancelBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pickerCancelText: { fontSize: 14, fontWeight: "700", color: "#475569" },
  pickerApplyBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A78C5",
  },
  pickerApplyText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
