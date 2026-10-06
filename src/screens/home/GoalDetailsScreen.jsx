import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import { getTodayIntakeLocal } from "../../api/waterIntakeApi";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAccessibility } from "../../context/AccessibilityContext";
import { useUser } from "../../context/UserContext";
import { groupMealsByType } from "../meal/mealPlanUiHelpers";

import { colors } from "../../theme";
const CALORIE_TARGET = 2000;
const PROTEIN_TARGET = 80;
const WATER_TARGET = 8;

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function GoalDetailsScreen({ navigation }) {
  const { user } = useUser();
  const { fs, sh } = useAccessibility();
  const [loading, setLoading] = useState(true);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [water, setWater] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          setLoading(true);
          const today = new Date();

          const [mealResponse, localWater] = await Promise.all([
            mealPlanApi.getWeeklyPlan({ userId: user?.id }).catch(() => null),
            getTodayIntakeLocal(user?.id),
          ]);

          if (cancelled) return;

          const items =
            mealResponse?.data?.items ||
            mealResponse?.items ||
            mealResponse?.mealPlans ||
            [];

          const groups = groupMealsByType(Array.isArray(items) ? items : [], today);
          const todayRecipes = groups.flatMap((g) => (g.hasLiveData ? g.recipes : []));

          const totalCalories = todayRecipes.reduce((sum, r) => sum + toNumber(r.calories), 0);
          const totalProtein = todayRecipes.reduce((sum, r) => sum + toNumber(r.protein), 0);

          setCalories(Math.round(totalCalories));
          setProtein(Math.round(totalProtein));
          setWater(localWater ?? 0);
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [user?.id])
  );

  const calorieProgress = Math.min(calories / CALORIE_TARGET, 1);
  const caloriesRemaining = Math.max(CALORIE_TARGET - calories, 0);
  const progressPercent = Math.round(calorieProgress * 100);

  const metricItems = [
    { label: "Calories remaining", value: `${caloriesRemaining} kcal`, color: colors.facebookBlue },
    { label: "Protein consumed", value: `${protein} / ${PROTEIN_TARGET} g`, color: colors.successGithub },
    { label: "Water intake", value: `${water} / ${WATER_TARGET} glasses`, color: colors.accentCyan },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { minHeight: sh(44) }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={fs(22)} color={colors.textSecondaryAlt} />
          <Text style={[styles.backText, { fontSize: fs(15) }]}>Back</Text>
        </Pressable>
        <Text style={[styles.logoText, { fontSize: fs(14) }]}>NutriHelp</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs(30) }]}>Goal Progress</Text>
        <Text style={[styles.subtitle, { fontSize: fs(16), lineHeight: fs(23) }]}>
          {loading
            ? "Loading today's progress..."
            : progressPercent >= 80
              ? "Great work! You're close to your daily goal."
              : "Keep tracking your meals to reach your daily targets."}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner color={colors.facebookBlue} />
          </View>
        ) : (
          <>
            <View style={styles.heroCard}>
              <View style={styles.ring}>
                <View
                  style={[
                    styles.ringFill,
                    { transform: [{ rotate: `${55 + calorieProgress * 180}deg` }] },
                  ]}
                />
                <View style={styles.innerCircle}>
                  <Text style={[styles.ringValue, { fontSize: fs(34) }]}>{calories}</Text>
                  <Text style={[styles.ringUnit, { fontSize: fs(16) }]}>
                    of {CALORIE_TARGET} kcal
                  </Text>
                </View>
              </View>
              <Text style={[styles.heroHeadline, { fontSize: fs(20) }]}>
                {progressPercent}% of your daily goal reached
              </Text>
            </View>

            {metricItems.map((item) => (
              <View key={item.label} style={[styles.metricCard, { minHeight: sh(72) }]}>
                <View
                  style={[
                    styles.metricIconWrap,
                    { backgroundColor: item.color, width: sh(42), height: sh(42), borderRadius: sh(21) },
                  ]}
                >
                  <Ionicons name="flag-outline" size={fs(20)} color={colors.white} />
                </View>
                <View style={styles.metricBody}>
                  <Text style={[styles.metricLabel, { fontSize: fs(15) }]}>{item.label}</Text>
                  <Text style={[styles.metricValue, { fontSize: fs(22) }]}>{item.value}</Text>
                </View>
              </View>
            ))}

            <Pressable
              style={[styles.nutritionLink, { minHeight: sh(44) }]}
              onPress={() => navigation.navigate("NutritionSummaryScreen")}
            >
              <Text style={[styles.nutritionLinkText, { fontSize: fs(14) }]}>
                View Full Nutrition Summary →
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceGray,
  },
  backButton: { flexDirection: "row", alignItems: "center", width: 60 },
  backText: { marginLeft: 4, color: colors.textSecondaryAlt },
  logoText: { fontWeight: "700", color: colors.textPrimary },
  headerSpacer: { width: 60 },
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontWeight: "800", color: colors.textNearBlack, marginBottom: 8 },
  subtitle: { color: colors.textGray, marginBottom: 20 },
  loadingWrap: { alignItems: "center", paddingVertical: 60 },
  heroCard: {
    borderWidth: 1.5,
    borderColor: colors.textNearBlack,
    borderRadius: 34,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderColor: colors.c_d6d6d6,
    borderTopColor: colors.facebookBlue,
    borderLeftColor: colors.facebookBlue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    transform: [{ rotate: "-20deg" }],
  },
  ringFill: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderColor: "transparent",
    borderTopColor: colors.facebookBlue,
    borderRightColor: colors.facebookBlue,
  },
  innerCircle: { transform: [{ rotate: "20deg" }], alignItems: "center" },
  ringValue: { fontWeight: "800", color: colors.textNearBlack },
  ringUnit: { color: colors.textGray },
  heroHeadline: { fontWeight: "700", color: colors.textNearBlack, textAlign: "center" },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.textNearBlack,
    padding: 16,
    marginBottom: 14,
  },
  metricIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  metricBody: { flex: 1 },
  metricLabel: { color: colors.textGray, marginBottom: 4 },
  metricValue: { fontWeight: "800", color: colors.textNearBlack },
  nutritionLink: { alignItems: "center", paddingVertical: 12 },
  nutritionLinkText: { fontWeight: "700", color: colors.facebookBlue },
});
