import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
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
import { formatDisplayName, groupMealsByType, MEAL_TYPES } from "./mealPlanUiHelpers";

const SUGGESTED_MEALS = [
  { id: "oatmeal", title: "Oatmeal", calories: 320 },
  { id: "greek-yogurt-bowl", title: "Greek Yogurt Bowl", calories: 280 },
  { id: "fruit-smoothie", title: "Fruit Smoothie", calories: 300 },
  { id: "veggie-wrap", title: "Veggie Wrap", calories: 390 },
  { id: "chicken-stir-fry", title: "Chicken Stir Fry", calories: 510 },
];

const MEAL_ACCENTS = {
  breakfast: "#F59E0B",
  lunch: "#22C55E",
  dinner: "#3B82F6",
};

function formatLongDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function EmptyMealCard({ mealType, onAdd }) {
  return (
    <>
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>Nothing planned yet</Text>
        <Text style={styles.emptySubtitle}>
          Add a meal for {formatDisplayName(mealType)}
        </Text>
      </View>
      <Pressable style={styles.outlineAddButton} onPress={onAdd}>
        <Text style={styles.outlineAddButtonText}>
          + Add {formatDisplayName(mealType)}
        </Text>
      </Pressable>
    </>
  );
}

function FilledMealCard({ recipe, accent }) {
  return (
    <View style={styles.filledCard}>
      <View style={[styles.recipeThumb, { backgroundColor: accent }]} />
      <View style={styles.recipeTextWrap}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <Text style={styles.recipeMeta}>
          {Math.round(recipe.calories || 0)} Cal · 10 min · 1 serving
        </Text>
      </View>
    </View>
  );
}

export default function DailyPlanScreen({ navigation, route }) {
  const { user } = useUser();
  const selectedDate = route?.params?.date || new Date().toISOString().slice(0, 10);
  const [groups, setGroups] = useState([]);
  const [draftMeals, setDraftMeals] = useState({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetMealType, setSheetMealType] = useState("breakfast");
  const [searchText, setSearchText] = useState("");

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
        } catch (_error) {
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

  const visibleOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return SUGGESTED_MEALS;
    }
    return SUGGESTED_MEALS.filter((item) =>
      item.title.toLowerCase().includes(query)
    );
  }, [searchText]);

  const groupsByType = useMemo(() => {
    const map = new Map();
    groups.forEach((group) => {
      map.set(group.mealType, group);
    });
    return map;
  }, [groups]);

  const handleAddDraftMeal = (meal) => {
    setDraftMeals((previous) => ({
      ...previous,
      [sheetMealType]: {
        ...meal,
        title: meal.title,
        calories: meal.calories,
      },
    }));
    setSheetVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#667085" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
        </View>

        <Text style={styles.dayTitle}>
          {new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(selectedDate))}
        </Text>
        <Text style={styles.dayDate}>{formatLongDate(selectedDate)}</Text>

        {MEAL_TYPES.map((mealType) => {
          const group = groupsByType.get(mealType);
          const liveRecipe = group?.hasLiveData ? group?.recipes?.[0] : null;
          const draftRecipe = draftMeals[mealType];
          const recipe = draftRecipe || liveRecipe;
          const accent = MEAL_ACCENTS[mealType];

          return (
            <View key={mealType} style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: accent }]}>
                {formatDisplayName(mealType)}
              </Text>

              {recipe ? (
                <>
                  <FilledMealCard recipe={recipe} accent={accent} />
                  <Pressable
                    style={styles.solidAddButton}
                    onPress={() => openAddMeal(mealType)}
                  >
                    <Text style={styles.solidAddButtonText}>
                      + Add {formatDisplayName(mealType)}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <EmptyMealCard
                  mealType={mealType}
                  onAdd={() => openAddMeal(mealType)}
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
            <Text style={styles.sheetTitle}>
              Add {formatDisplayName(sheetMealType)}
            </Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search meals"
              placeholderTextColor="#98A2B3"
              value={searchText}
              onChangeText={setSearchText}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
              {visibleOptions.map((meal) => (
                <View key={meal.id} style={styles.optionRow}>
                  <View>
                    <Text style={styles.optionTitle}>{meal.title}</Text>
                    <Text style={styles.optionCalories}>{meal.calories} Cal</Text>
                  </View>
                  <Pressable
                    style={styles.optionAddButton}
                    onPress={() => handleAddDraftMeal(meal)}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
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
    color: "#667085",
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18233D",
  },
  dayTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: "#253B63",
    marginBottom: 6,
  },
  dayDate: {
    fontSize: 16,
    color: "#667085",
    marginBottom: 18,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 10,
  },
  filledCard: {
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  recipeThumb: {
    width: 54,
    height: 54,
    borderRadius: 12,
    marginRight: 16,
  },
  recipeTextWrap: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 6,
  },
  recipeMeta: {
    fontSize: 14,
    color: "#98A2B3",
  },
  emptyCard: {
    minHeight: 98,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#98A2B3",
    textAlign: "center",
  },
  solidAddButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    minWidth: 180,
  },
  solidAddButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  outlineAddButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#2A78C5",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    alignSelf: "flex-start",
    minWidth: 180,
  },
  outlineAddButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2A78C5",
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#D0D5DD",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#E17A00",
    marginBottom: 14,
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#253B63",
    marginBottom: 10,
  },
  optionRow: {
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#253B63",
    marginBottom: 4,
  },
  optionCalories: {
    fontSize: 14,
    color: "#98A2B3",
  },
  optionAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
});
