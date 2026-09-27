import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAccessibility } from "../../context/AccessibilityContext";
import { useUser } from "../../context/UserContext";
import { formatDisplayName, groupMealsByType, MEAL_TYPES, normalizeRecipe } from "./mealPlanUiHelpers";

import { colors } from "../../theme";
const FALLBACK_MEALS = [
  { id: "oatmeal", title: "Oatmeal", calories: 320 },
  { id: "greek-yogurt-bowl", title: "Greek Yogurt Bowl", calories: 280 },
  { id: "fruit-smoothie", title: "Fruit Smoothie", calories: 300 },
  { id: "veggie-wrap", title: "Veggie Wrap", calories: 390 },
  { id: "chicken-stir-fry", title: "Chicken Stir Fry", calories: 510 },
];

const MEAL_ACCENTS = {
  breakfast: colors.warning,
  lunch: colors.successBright,
  dinner: colors.info,
};

function formatLongDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function EmptyMealCard({ mealType, onAdd, fs, sh }) {
  return (
    <>
      <View style={[styles.emptyCard, { minHeight: sh(98) }]}>
        <Text style={[styles.emptyTitle, { fontSize: fs(16) }]}>Nothing planned yet</Text>
        <Text style={[styles.emptySubtitle, { fontSize: fs(14) }]}>
          Add a meal for {formatDisplayName(mealType)}
        </Text>
      </View>
      <Button
        label={`+ Add ${formatDisplayName(mealType)}`}
        onPress={onAdd}
        style={[styles.outlineAddButton, { minHeight: sh(48), height: undefined }]}
        textStyle={[styles.outlineAddButtonText, { fontSize: fs(15) }]}
      />
    </>
  );
}

function FilledMealCard({ recipe, accent, mealType, fs, sh }) {
  return (
    <View style={[styles.filledCard, { minHeight: sh(78) }]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.recipeTextWrap}>
        <Text style={[styles.recipeTitle, { fontSize: fs(15) }]} numberOfLines={1}>{recipe.title}</Text>
        <Text style={[styles.recipeTypeLabel, { color: accent, fontSize: fs(13) }]}>
          {formatDisplayName(mealType)}
        </Text>
      </View>
      <Text style={[styles.recipeCal, { fontSize: fs(14) }]}>{Math.round(recipe.calories || 0)} cal</Text>
    </View>
  );
}

export default function DailyPlanScreen({ navigation, route }) {
  const { user } = useUser();
  const { fs, sh } = useAccessibility();
  const selectedDate = route?.params?.date || new Date().toISOString().slice(0, 10);
  const [groups, setGroups] = useState([]);
  const [draftMeals, setDraftMeals] = useState({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMealType, setSheetMealType] = useState("breakfast");
  const [searchText, setSearchText] = useState("");
  const [savingMealType, setSavingMealType] = useState(null);
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  const openAddMeal = useCallback((mealType) => {
    setSheetMealType(mealType);
    setSearchText("");
    setSheetVisible(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadMeals() {
        try {
          const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
          if (!cancelled) {
            setGroups(
              groupMealsByType(
                response?.data?.items || response?.items || response?.mealPlans || [],
                selectedDate
              )
            );
          }
        } catch {
          if (!cancelled) {
            setGroups(groupMealsByType([], selectedDate));
          }
        }
      }

      loadMeals();

      if (route?.params?.openAddMeal) {
        openAddMeal("breakfast");
      }

      return () => {
        cancelled = true;
      };
    }, [openAddMeal, route?.params?.openAddMeal, selectedDate, user?.id])
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
          if (list.length > 0) {
            const normalized = list.slice(0, 30).map((r, i) => normalizeRecipe(r, sheetMealType, i));
            setAvailableRecipes(normalized);
          } else {
            setAvailableRecipes(FALLBACK_MEALS.map((m) => ({ ...m })));
          }
        }
      } catch {
        if (!cancelled) {
          setAvailableRecipes(FALLBACK_MEALS.map((m) => ({ ...m })));
        }
      } finally {
        if (!cancelled) setRecipesLoading(false);
      }
    }

    loadRecipes();
    return () => { cancelled = true; };
  }, [sheetVisible, sheetMealType, user?.id]);

  const visibleOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return availableRecipes;
    return availableRecipes.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  }, [searchText, availableRecipes]);

  const groupsByType = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      map.set(group.mealType, group);
    });
    return map;
  }, [groups]);

  const handleAddMeal = async (meal) => {
    setDraftMeals((previous) => ({
      ...previous,
      [sheetMealType]: { ...meal },
    }));
    setSheetVisible(false);

    const mealType = sheetMealType;
    setSavingMealType(mealType);

    try {
      await mealPlanApi.updateDailyPlan({
        recipe_ids: [meal.id],
        meal_type: mealType,
        user_id: user?.id,
        date: selectedDate,
      });

      const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
      setGroups(
        groupMealsByType(
          response?.data?.items || response?.items || response?.mealPlans || [],
          selectedDate
        )
      );
    } catch (error) {
      Alert.alert(
        "Could not save",
        error?.message || "Meal was added locally but could not be saved to your account.",
        [{ text: "OK" }]
      );
    } finally {
      setSavingMealType(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={[styles.backButton, { minHeight: sh(44) }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={fs(22)} color={colors.textSecondaryAlt} />
            <Text style={[styles.backText, { fontSize: fs(16) }]}>Back</Text>
          </Pressable>
          <Text style={[styles.logoText, { fontSize: fs(14) }]}>NutriHelp</Text>
        </View>

        <Text style={[styles.dayTitle, { fontSize: fs(34) }]}>
          {new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(selectedDate))}
        </Text>
        <Text style={[styles.dayDate, { fontSize: fs(16) }]}>{formatLongDate(selectedDate)}</Text>

        {MEAL_TYPES.map((mealType) => {
          const group = groupsByType.get(mealType);
          const liveRecipe = group?.hasLiveData ? group?.recipes?.[0] : null;
          const draftRecipe = draftMeals[mealType];
          const recipe = draftRecipe || liveRecipe;
          const accent = MEAL_ACCENTS[mealType];
          const isSaving = savingMealType === mealType;

          return (
            <View key={mealType} style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: accent, fontSize: fs(18) }]}>
                  {formatDisplayName(mealType)}
                </Text>
                {isSaving && (
                  <LoadingSpinner
                    size="small"
                    color={accent}
                    style={styles.sectionSpinner}
                  />
                )}
              </View>

              {recipe ? (
                <>
                  <FilledMealCard recipe={recipe} accent={accent} mealType={mealType} fs={fs} sh={sh} />
                  <Button
                    label={`+ Add ${formatDisplayName(mealType)}`}
                    onPress={() => openAddMeal(mealType)}
                    disabled={isSaving}
                    style={[styles.solidAddButton, { minHeight: sh(48), height: undefined }]}
                    textStyle={[styles.solidAddButtonText, { fontSize: fs(15) }]}
                  />
                </>
              ) : (
                <EmptyMealCard
                  mealType={mealType}
                  onAdd={() => openAddMeal(mealType)}
                  fs={fs}
                  sh={sh}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        transparent
        visible={sheetVisible}
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetVisible(false)} />
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { fontSize: fs(18) }]}>
              Add {formatDisplayName(sheetMealType)}
            </Text>

            <TextInput
              style={[styles.searchInput, { fontSize: fs(16), minHeight: sh(48), height: undefined }]}
              placeholder="Search meals"
              placeholderTextColor={colors.textMutedAlt}
              value={searchText}
              onChangeText={setSearchText}
            />

            {recipesLoading ? (
              <LoadingSpinner
                message="Loading meals..."
                color={colors.primaryMuted}
                style={styles.sheetLoading}
                textStyle={[styles.sheetLoadingText, { fontSize: fs(14) }]}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {visibleOptions.length === 0 ? (
                  <EmptyState message="No meals found" style={styles.emptyResults} />
                ) : (
                  visibleOptions.map((meal) => (
                    <View key={meal.id} style={[styles.optionRow, { minHeight: sh(68) }]}>
                      <View style={styles.optionInfo}>
                        <Text style={[styles.optionTitle, { fontSize: fs(16) }]}>{meal.title}</Text>
                        <Text style={[styles.optionCalories, { fontSize: fs(14) }]}>
                          {Math.round(meal.calories || 0)} Cal
                        </Text>
                      </View>
                      <Pressable
                        style={[
                          styles.optionAddButton,
                          { width: sh(32), height: sh(32), borderRadius: sh(16) },
                        ]}
                        onPress={() => handleAddMeal(meal)}
                      >
                        <Ionicons name="add" size={fs(18)} color={colors.white} />
                      </Pressable>
                    </View>
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
  safeArea: { flex: 1, backgroundColor: colors.white },
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: colors.textSecondaryAlt,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  dayTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.textNavy,
    marginBottom: 6,
  },
  dayDate: {
    fontSize: 16,
    color: colors.textSecondaryAlt,
    marginBottom: 18,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "500",
  },
  sectionSpinner: {
    marginLeft: 8,
  },
  filledCard: {
    minHeight: 78,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSlate,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
    borderRadius: 0,
    marginRight: 14,
  },
  recipeTextWrap: {
    flex: 1,
    paddingVertical: 14,
  },
  recipeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textNavy,
    marginBottom: 4,
  },
  recipeTypeLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  recipeCal: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 14,
  },
  emptyCard: {
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSlate,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textNavy,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMutedAlt,
    textAlign: "center",
  },
  solidAddButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  solidAddButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  outlineAddButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineAddButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.24)",
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContainer: {
    maxHeight: "62%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.c_d0d5dd,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.warningOrange,
    marginBottom: 14,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSlate,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.textNavy,
    marginBottom: 10,
  },
  sheetLoading: {
    alignItems: "center",
    paddingVertical: 32,
  },
  sheetLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textMutedAlt,
  },
  emptyResults: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyResultsText: {
    fontSize: 14,
    color: colors.textMutedAlt,
  },
  optionRow: {
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  optionInfo: {
    flex: 1,
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textNavy,
    marginBottom: 4,
  },
  optionCalories: {
    fontSize: 14,
    color: colors.textMutedAlt,
  },
  optionAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});
