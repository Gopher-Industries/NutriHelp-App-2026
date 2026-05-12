import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import { useUser } from "../../context/UserContext";
import { buildNutritionSummary, groupMealsByType } from "../meal/mealPlanUiHelpers";

export default function NutritionSummaryScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function load() {
        try {
          setLoading(true);
          const today = new Date();
          const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id }).catch(() => null);

          if (cancelled) return;

          const items =
            response?.data?.items || response?.items || response?.mealPlans || [];

          const groups = groupMealsByType(Array.isArray(items) ? items : [], today);
          const todayRecipes = groups.flatMap((g) => (g.hasLiveData ? g.recipes : []));

          const summary = buildNutritionSummary(todayRecipes);
          const calories = todayRecipes.reduce((sum, r) => sum + (Number(r.calories) || 0), 0);

          setRows(summary);
          setTotalCalories(Math.round(calories));
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      load();
      return () => { cancelled = true; };
    }, [user?.id])
  );

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
        <Text style={styles.title}>Nutrition Summary</Text>
        <Text style={styles.subtitle}>
          {loading
            ? "Loading today's nutrition data..."
            : `Today's total: ${totalCalories} kcal consumed`}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1877F2" />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={styles.emptyTitle}>No meal data for today</Text>
            <Text style={styles.emptyBody}>
              Add meals to your plan to see nutrition breakdown here.
            </Text>
            <Pressable
              style={styles.planButton}
              onPress={() => navigation.navigate("MealPlanOverviewScreen")}
            >
              <Text style={styles.planButtonText}>Go to Meal Plan</Text>
            </Pressable>
          </View>
        ) : (
          rows.map((item) => (
            <View key={item.label} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={[styles.rowTitle, { color: item.color }]}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${item.progress * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.rowProgress}>{Math.round(item.progress * 100)}% of daily target</Text>
            </View>
          ))
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
  rowCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  rowTitle: { fontSize: 22, fontWeight: "800" },
  rowValue: { fontSize: 16, color: "#111111" },
  track: { height: 14, borderRadius: 99, backgroundColor: "#D9D9D9", overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  rowProgress: { marginTop: 8, fontSize: 12, color: "#888888" },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151", marginBottom: 8 },
  emptyBody: { fontSize: 14, color: "#9CA3AF", textAlign: "center", lineHeight: 21, marginBottom: 20 },
  planButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#2B78C5",
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  planButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
