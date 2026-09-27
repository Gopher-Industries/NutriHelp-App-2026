import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError } from "../../../api/baseApi";
import { saveMealToDaily } from "../../../api/mealPlanApi";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import { useAccessibility } from "../../../context/AccessibilityContext";
import { useUser } from "../../../context/UserContext";
import { saveDailyMeal } from "../../../utils/dailyMealsStorage";
import FeedbackCard from "./FeedbackCard";

import { colors } from "../../../theme";
const TODAY = new Date().toISOString().slice(0, 10);

const DAY_COLORS = [
  colors.accentBlue,
  colors.successForest,
  colors.warningOrangeDark,
  colors.accentPurple,
  colors.accentTeal,
  colors.dangerDarker,
  colors.primaryStrong,
];

function parseNutrient(value) {
  const n = parseFloat(String(value ?? 0).replace(/[^0-9.]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function NutrientBadge({ label, value, highSodium, fs }) {
  return (
    <View style={[styles.badge, highSodium && styles.badgeSodium]}>
      <Text style={[styles.badgeLabel, highSodium && styles.badgeLabelSodium, { fontSize: fs(10) }]}>
        {label}
      </Text>
      <Text style={[styles.badgeValue, highSodium && styles.badgeValueSodium, { fontSize: fs(12) }]}>
        {value}
      </Text>
    </View>
  );
}

function MealCard({ meal, mealType, day, isAuthenticated, onNotAuthenticated, fs, sh }) {
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
      <Text style={[styles.mealTypeLabel, { fontSize: fs(10) }]}>{mealType.toUpperCase()}</Text>
      <Text style={[styles.mealName, { fontSize: fs(15) }]}>{meal.name}</Text>
      {meal.description ? (
        <Text style={[styles.mealDesc, { fontSize: fs(13), lineHeight: fs(18) }]}>
          {meal.description}
        </Text>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
        <View style={styles.badgesRow}>
          <NutrientBadge label="Cal" value={meal.calories ?? "—"} fs={fs} />
          <NutrientBadge label="Protein" value={meal.proteins ?? "—"} fs={fs} />
          <NutrientBadge label="Fat" value={meal.fats ?? "—"} fs={fs} />
          <NutrientBadge label="Fiber" value={meal.fiber ?? "—"} fs={fs} />
          <NutrientBadge
            label="Sodium"
            value={meal.sodium ?? "—"}
            highSodium={sodiumVal > 600}
            fs={fs}
          />
        </View>
      </ScrollView>

      {meal.ingredients?.length > 0 ? (
        <>
          <Pressable
            style={[styles.ingredientsToggle, { minHeight: sh(28) }]}
            onPress={() => setExpanded((prev) => !prev)}
          >
            <Text style={[styles.ingredientsToggleText, { fontSize: fs(12) }]}>
              {expanded ? "Hide ingredients" : "Show ingredients"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={fs(13)}
              color={colors.success}
            />
          </Pressable>
          {expanded ? (
            <View style={styles.ingredientsList}>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <Text style={[styles.ingredientDot, { fontSize: fs(12), lineHeight: fs(18) }]}>
                    •
                  </Text>
                  <Text style={[styles.ingredientItem, { fontSize: fs(12), lineHeight: fs(18) }]}>
                    {ing.item}
                  </Text>
                  <Text style={[styles.ingredientAmount, { fontSize: fs(12), lineHeight: fs(18) }]}>
                    {ing.amount}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {saveState === "saved" ? (
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={fs(15)} color={colors.success} />
          <Text style={[styles.savedBadgeText, { fontSize: fs(13) }]}>Added to Daily Plan</Text>
        </View>
      ) : (
        <Button
          label={isAuthenticated ? "Add to Daily Plan" : "Log in to save"}
          onPress={handleSave}
          loading={saveState === "saving"}
          style={[styles.saveBtn, { minHeight: sh(40), height: undefined }]}
          textStyle={[styles.saveBtnText, { fontSize: fs(13) }]}
        />
      )}

      {saveState === "error" && saveError ? (
        <Text style={[styles.saveError, { fontSize: fs(12) }]}>{saveError}</Text>
      ) : null}
    </View>
  );
}

function DayCard({ dayData, dayIndex, isAuthenticated, onNotAuthenticated, fs, sh }) {
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
        fs={fs}
        sh={sh}
      />
    );
  };

  return (
    <View style={[styles.dayCard, { borderLeftColor: borderColor }]}>
      <Text style={[styles.dayTitle, { color: borderColor, fontSize: fs(17) }]}>{dayData.day}</Text>
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
  const { fs, sh } = useAccessibility();

  const handleNotAuthenticated = useCallback(() => {
    logout();
  }, [logout]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={fs(52)} color={colors.danger} />
        <Text style={[styles.errorTitle, { fontSize: fs(20) }]}>Something went wrong</Text>
        <Text style={[styles.errorMsg, { fontSize: fs(14), lineHeight: fs(20) }]}>{error}</Text>
        <Button
          label="Try Again"
          onPress={onRegenerate}
          variant="success"
          style={[styles.retryBtn, { minHeight: sh(48), height: undefined }]}
          textStyle={[styles.retryBtnText, { fontSize: fs(15) }]}
        />
        <Pressable style={[styles.editBtn, { minHeight: sh(44) }]} onPress={onBack}>
          <Text style={[styles.editBtnText, { fontSize: fs(14) }]}>Edit Preferences</Text>
        </Pressable>
      </View>
    );
  }

  if (!mealPlan || mealPlan.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          message="No plan returned. The server did not return a meal plan. Please try again."
          icon="restaurant-outline"
        />
        <Button
          label="Regenerate"
          onPress={onRegenerate}
          variant="success"
          style={[styles.retryBtn, { minHeight: sh(48), height: undefined }]}
          textStyle={[styles.retryBtnText, { fontSize: fs(15) }]}
        />
        <Pressable style={[styles.editBtn, { minHeight: sh(44) }]} onPress={onBack}>
          <Text style={[styles.editBtnText, { fontSize: fs(14) }]}>Edit Preferences</Text>
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
        <Pressable style={[styles.topBarBack, { minHeight: sh(44) }]} onPress={onBack} hitSlop={8}>
          <Ionicons name="arrow-back" size={fs(18)} color={colors.textGray700} />
          <Text style={[styles.topBarBackText, { fontSize: fs(14) }]}>Edit</Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { fontSize: fs(15) }]}>Your 7-Day Plan</Text>
        <Button
          label="Regenerate"
          onPress={onRegenerate}
          variant="success"
          style={[styles.regenBtn, { minHeight: sh(36), height: undefined }]}
          textStyle={[styles.regenBtnText, { fontSize: fs(13) }]}
        />
      </View>

      {mealPlan.map((dayData, i) => (
        <DayCard
          key={dayData.day ?? i}
          dayData={dayData}
          dayIndex={i}
          isAuthenticated={isAuthenticated}
          onNotAuthenticated={handleNotAuthenticated}
          fs={fs}
          sh={sh}
        />
      ))}

      <FeedbackCard planId={planId} mealPlan={mealPlan} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.surface },
  scrollContent: { paddingBottom: 40 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 60,
    minHeight: 44,
  },
  topBarBackText: { fontSize: 14, color: colors.textGray700, fontWeight: "500" },
  topBarTitle: { fontSize: 15, fontWeight: "700", color: colors.textNavy },
  regenBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 20,
    minWidth: 0,
  },
  regenBtnText: { fontSize: 13, fontWeight: "600", color: colors.white },

  dayCard: {
    marginHorizontal: 14,
    marginTop: 14,
    borderRadius: 16,
    borderLeftWidth: 5,
    backgroundColor: colors.white,
    shadowColor: colors.black,
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
    borderTopColor: colors.surfaceGray,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mealTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textGray900,
    marginBottom: 4,
  },
  mealDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  badgesScroll: { marginBottom: 10 },
  badgesRow: { flexDirection: "row", gap: 6 },
  badge: {
    alignItems: "center",
    backgroundColor: colors.surfaceGray,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minWidth: 54,
  },
  badgeSodium: { backgroundColor: colors.surfaceRedSoft },
  badgeLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: "600", marginBottom: 1 },
  badgeLabelSodium: { color: colors.dangerStrong },
  badgeValue: { fontSize: 12, color: colors.textGray900, fontWeight: "600" },
  badgeValueSodium: { color: colors.dangerDark },

  ingredientsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
    minHeight: 28,
  },
  ingredientsToggleText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  ingredientsList: {
    backgroundColor: colors.surfaceSoft,
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
  ingredientDot: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  ingredientItem: { flex: 1, fontSize: 12, color: colors.textGray700, lineHeight: 18 },
  ingredientAmount: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },

  saveBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 13, fontWeight: "700", color: colors.white },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
  },
  savedBadgeText: { fontSize: 13, color: colors.success, fontWeight: "600" },
  saveError: { fontSize: 12, color: colors.danger, marginTop: 4 },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: colors.white,
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textNavy,
    textAlign: "center",
  },
  errorMsg: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  retryBtnText: { fontSize: 15, fontWeight: "700", color: colors.white },
  editBtn: {
    height: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
});
