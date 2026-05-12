import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import { getTodayIntake, getTodayIntakeLocal } from "../../api/waterIntakeApi";
import { useUser } from "../../context/UserContext";
import { groupMealsByType } from "../meal/mealPlanUiHelpers";

const CALORIE_TARGET = 2000;
const PROTEIN_TARGET = 80;
const WATER_TARGET = 8;

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function GoalDetailsScreen({ navigation }) {
  const { user } = useUser();
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

          const [mealResponse, remoteWater, localWater] = await Promise.all([
            mealPlanApi.getWeeklyPlan({ userId: user?.id }).catch(() => null),
            getTodayIntake(user?.id).catch(() => null),
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
          setWater(remoteWater ?? localWater ?? 0);
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
    { label: "Calories remaining", value: `${caloriesRemaining} kcal`, color: "#1877F2" },
    { label: "Protein consumed", value: `${protein} / ${PROTEIN_TARGET} g`, color: "#39D353" },
    { label: "Water intake", value: `${water} / ${WATER_TARGET} glasses`, color: "#13B5EA" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#667085" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.logoText}>NutriHelp</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Goal Progress</Text>
        <Text style={styles.subtitle}>
          {loading
            ? "Loading today's progress..."
            : progressPercent >= 80
              ? "Great work! You're close to your daily goal."
              : "Keep tracking your meals to reach your daily targets."}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1877F2" />
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
                  <Text style={styles.ringValue}>{calories}</Text>
                  <Text style={styles.ringUnit}>of {CALORIE_TARGET} kcal</Text>
                </View>
              </View>
              <Text style={styles.heroHeadline}>{progressPercent}% of your daily goal reached</Text>
            </View>

            {metricItems.map((item) => (
              <View key={item.label} style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: item.color }]}>
                  <Ionicons name="flag-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.metricBody}>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                </View>
              </View>
            ))}

            <Pressable
              style={styles.nutritionLink}
              onPress={() => navigation.navigate("NutritionSummaryScreen")}
            >
              <Text style={styles.nutritionLinkText}>View Full Nutrition Summary →</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { flexDirection: "row", alignItems: "center", width: 60 },
  backText: { marginLeft: 4, fontSize: 15, color: "#667085" },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },
  headerSpacer: { width: 60 },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: "800", color: "#111111", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: "#555555", marginBottom: 20 },
  loadingWrap: { alignItems: "center", paddingVertical: 60 },
  heroCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
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
    borderColor: "#D6D6D6",
    borderTopColor: "#1877F2",
    borderLeftColor: "#1877F2",
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
    borderTopColor: "#1877F2",
    borderRightColor: "#1877F2",
  },
  innerCircle: { transform: [{ rotate: "20deg" }], alignItems: "center" },
  ringValue: { fontSize: 34, fontWeight: "800", color: "#111111" },
  ringUnit: { fontSize: 16, color: "#555555" },
  heroHeadline: { fontSize: 20, fontWeight: "700", color: "#111111", textAlign: "center" },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#111111",
    padding: 16,
    marginBottom: 14,
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  metricBody: { flex: 1 },
  metricLabel: { fontSize: 15, color: "#555555", marginBottom: 4 },
  metricValue: { fontSize: 22, fontWeight: "800", color: "#111111" },
  nutritionLink: { alignItems: "center", paddingVertical: 12 },
  nutritionLinkText: { fontSize: 14, fontWeight: "700", color: "#1877F2" },
});
