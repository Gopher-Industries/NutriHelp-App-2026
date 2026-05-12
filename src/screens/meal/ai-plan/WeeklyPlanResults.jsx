import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError, toErrorMessage } from "../../../api/baseApi";
import { saveMealToDaily } from "../../../api/mealPlanApi";
import { useUser } from "../../../context/UserContext";
import { saveDailyMeal } from "../../../utils/dailyMealsStorage";
import FeedbackCard from "./FeedbackCard";

const TODAY = new Date().toISOString().slice(0, 10);

const DAY_COLORS = [
  "#005BBB",
  "#2E7D32",
  "#c05c00",
  "#7B1FA2",
  "#00838F",
  "#B71C1C",
  "#1565C0",
];

function parseNutrient(value) {
  const n = parseFloat(String(value ?? 0).replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function NutrientBadge({ label, value, highSodium }) {
  return (
    <View style={[styles.badge, highSodium && styles.badgeSodium]}>
      <Text style={[styles.badgeLabel, highSodium && styles.badgeLabelSodium]}>
        {label}
      </Text>
      <Text style={[styles.badgeValue, highSodium && styles.badgeValueSodium]}>
        {value}
      </Text>
    </View>
  );
}

function MealCard({ meal, mealType, day, isAuthenticated, onNotAuthenticated }) {
  const [expanded, setExpanded] = useState(false);
  const [saveState, setSaveState] = useState("idle");
  const [saveError, setSaveError] = useState("");

  const sodiumVal = parseNutrient(meal.sodium);

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      onNotAuthenticated();
      return;
    }
    setSaveState("saving");
    setSaveError("");

    const localEntry = {
      title: meal.name,
      description: meal.description ?? "",
      calories: parseNutrient(meal.calories),
      proteins: parseNutrient(meal.proteins),
      fats: parseNutrient(meal.fats),
      fiber: parseNutrient(meal.fiber),
      sodium: parseNutrient(meal.sodium),
      ingredients: meal.ingredients ?? [],
    };

    try {
      await saveMealToDaily({
        meal_type: mealType.toLowerCase(),
        day,
        name: meal.name,
        description: meal.description ?? "",
        calories: parseNutrient(meal.calories),
        proteins: parseNutrient(meal.proteins),
        fats: parseNutrient(meal.fats),
        sodium: parseNutrient(meal.sodium),
        fiber: parseNutrient(meal.fiber),
        ingredients: meal.ingredients ?? [],
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onNotAuthenticated();
        return;
      }
      if (err instanceof ApiError && err.status === 429) {
        setSaveError("Too many requests. Please try again later.");
        setSaveState("error");
        return;
      }
      // Non-fatal: still persist locally even if backend save fails.
    }

    // Always write to local storage so WeeklyPlanScreen shows it immediately.
    await saveDailyMeal(TODAY, mealType.toLowerCase(), localEntry);
    setSaveState("saved");
  }, [isAuthenticated, onNotAuthenticated, mealType, day, meal]);

  return (
    <View style={styles.mealCard}>
      <Text style={styles.mealTypeLabel}>{mealType.toUpperCase()}</Text>
      <Text style={styles.mealName}>{meal.name}</Text>
      {meal.description ? (
        <Text style={styles.mealDesc}>{meal.description}</Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
        <View style={styles.badgesRow}>
          <NutrientBadge label="Cal" value={meal.calories ?? "—"} />
          <NutrientBadge label="Protein" value={meal.proteins ?? "—"} />
          <NutrientBadge label="Fat" value={meal.fats ?? "—"} />
          <NutrientBadge label="Fiber" value={meal.fiber ?? "—"} />
          <NutrientBadge
            label="Sodium"
            value={meal.sodium ?? "—"}
            highSodium={sodiumVal > 600}
          />
        </View>
      </ScrollView>

      {meal.ingredients?.length > 0 ? (
        <>
          <Pressable
            style={styles.ingredientsToggle}
            onPress={() => setExpanded((prev) => !prev)}
          >
            <Text style={styles.ingredientsToggleText}>
              {expanded ? "Hide ingredients" : "Show ingredients"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={13}
              color="#047857"
            />
          </Pressable>
          {expanded ? (
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ing, i) => (
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

      {saveState === "saved" ? (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={15} color="#047857" />
          <Text style={styles.savedBadgeText}>Added to Daily Plan</Text>
        </View>
      ) : (
        <Pressable
          style={[
            styles.saveBtn,
            saveState === "saving" && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saveState === "saving"}
        >
          {saveState === "saving" ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>
              {isAuthenticated ? "Add to Daily Plan" : "Log in to save"}
            </Text>
          )}
        </Pressable>
      )}

      {saveState === "error" && saveError ? (
        <Text style={styles.saveError}>{saveError}</Text>
      ) : null}
    </View>
  );
}

function DayCard({ dayData, dayIndex, isAuthenticated, onNotAuthenticated }) {
  const borderColor = DAY_COLORS[dayIndex % DAY_COLORS.length];

  const renderMeal = (meal, mealType) => {
    if (!meal) return null;
    return (
      <MealCard
        key={mealType}
        meal={meal}
        mealType={mealType}
        day={dayData.day}
        isAuthenticated={isAuthenticated}
        onNotAuthenticated={onNotAuthenticated}
      />
    );
  };

  return (
    <View style={[styles.dayCard, { borderLeftColor: borderColor }]}>
      <Text style={[styles.dayTitle, { color: borderColor }]}>{dayData.day}</Text>
      {renderMeal(dayData.breakfast, "Breakfast")}
      {renderMeal(dayData.lunch, "Lunch")}
      {renderMeal(dayData.dinner, "Dinner")}
    </View>
  );
}

export default function WeeklyPlanResults({
  mealPlan,
  planId,
  error,
  navigation,
  onRegenerate,
  onBack,
}) {
  const { isAuthenticated, logout } = useUser();

  const handleNotAuthenticated = useCallback(() => {
    logout();
  }, [logout]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMsg}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={onRegenerate}>
          <Text style={styles.retryBtnText}>Try Again</Text>
        </Pressable>
        <Pressable style={styles.editBtn} onPress={onBack}>
          <Text style={styles.editBtnText}>Edit Preferences</Text>
        </Pressable>
      </View>
    );
  }

  if (!mealPlan || mealPlan.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="restaurant-outline" size={52} color="#9CA3AF" />
        <Text style={styles.errorTitle}>No plan returned</Text>
        <Text style={styles.errorMsg}>
          The server did not return a meal plan. Please try again.
        </Text>
        <Pressable style={styles.retryBtn} onPress={onRegenerate}>
          <Text style={styles.retryBtnText}>Regenerate</Text>
        </Pressable>
        <Pressable style={styles.editBtn} onPress={onBack}>
          <Text style={styles.editBtnText}>Edit Preferences</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.topBarBack} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={18} color="#374151" />
          <Text style={styles.topBarBackText}>Edit</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Your 7-Day Plan</Text>
        <Pressable style={styles.regenBtn} onPress={onRegenerate}>
          <Ionicons name="refresh" size={14} color="#FFFFFF" />
          <Text style={styles.regenBtnText}>Regenerate</Text>
        </Pressable>
      </View>

      {mealPlan.map((dayData, i) => (
        <DayCard
          key={dayData.day ?? i}
          dayData={dayData}
          dayIndex={i}
          isAuthenticated={isAuthenticated}
          onNotAuthenticated={handleNotAuthenticated}
        />
      ))}

      <FeedbackCard planId={planId} mealPlan={mealPlan} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  topBarBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 60,
    minHeight: 44,
  },
  topBarBackText: { fontSize: 14, color: "#374151", fontWeight: "500" },
  topBarTitle: { fontSize: 15, fontWeight: "700", color: "#253B63" },
  regenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#047857",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 36,
  },
  regenBtnText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  dayCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    borderLeftWidth: 5,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  dayTitle: {
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },

  mealCard: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mealTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 1,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  mealDesc: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  badgesScroll: { marginBottom: 10 },
  badgesRow: { flexDirection: "row", gap: 6 },
  badge: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 54,
  },
  badgeSodium: { backgroundColor: "#FEE2E2" },
  badgeLabel: { fontSize: 10, color: "#6B7280", fontWeight: "600", marginBottom: 1 },
  badgeLabelSodium: { color: "#DC2626" },
  badgeValue: { fontSize: 12, color: "#111827", fontWeight: "600" },
  badgeValueSodium: { color: "#B91C1C" },

  ingredientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    minHeight: 28,
  },
  ingredientsToggleText: {
    fontSize: 12,
    color: "#047857",
    fontWeight: "600",
  },
  ingredientsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 4,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  ingredientDot: { fontSize: 12, color: "#9CA3AF", lineHeight: 18 },
  ingredientItem: { flex: 1, fontSize: 12, color: "#374151", lineHeight: 18 },
  ingredientAmount: { fontSize: 12, color: "#6B7280", lineHeight: 18 },

  saveBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
  },
  savedBadgeText: { fontSize: 13, color: "#047857", fontWeight: "600" },
  saveError: { fontSize: 12, color: "#EF4444", marginTop: 4 },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#253B63",
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: "#047857",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  editBtn: {
    height: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
});
