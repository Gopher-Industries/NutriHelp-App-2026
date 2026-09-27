import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useUser } from "../../context/UserContext";
import { buildNutritionSummary, groupMealsByType } from "../meal/mealPlanUiHelpers";

import { colors } from "../../theme";
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
        <Pressable
          style={[styles.backButton, { minHeight: 44 }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textSecondaryAlt} />
          <Text style={[styles.backText, { fontSize: 15 }]}>Back</Text>
        </Pressable>
        <Text style={[styles.logoText, { fontSize: 14 }]}>NutriHelp</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: 30 }]}>Nutrition Summary</Text>
        <Text style={[styles.subtitle, { fontSize: 16, lineHeight: 23 }]}>
          {loading
            ? "Loading today's nutrition data..."
            : `Today's total: ${totalCalories} kcal consumed`}
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner color={colors.facebookBlue} />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyState}>
            <EmptyState
              message="No meal data for today. Add meals to your plan to see nutrition breakdown here."
              style={styles.emptyStateInner}
            />
            <Button
              label="Go to Meal Plan"
              onPress={() => navigation.navigate("MealPlanOverviewScreen")}
              style={[styles.planButton, { minHeight: 48, height: undefined }]}
              textStyle={[styles.planButtonText, { fontSize: 14 }]}
            />
          </View>
        ) : (
          rows.map((item) => (
            <View key={item.label} style={styles.rowCard}>
              <View style={styles.rowHeader}>
                <Text style={[styles.rowTitle, { color: item.color, fontSize: 22 }]}>
                  {item.label}
                </Text>
                <Text style={[styles.rowValue, { fontSize: 16 }]}>{item.value}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    { width: `${item.progress * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={[styles.rowProgress, { fontSize: 12 }]}>
                {Math.round(item.progress * 100)}% of daily target
              </Text>
            </View>
          ))
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
  rowCard: {
    borderWidth: 1.5,
    borderColor: colors.textNearBlack,
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
  rowTitle: { fontWeight: "800" },
  rowValue: { color: colors.textNearBlack },
  track: { height: 14, borderRadius: 99, backgroundColor: colors.c_d9d9d9, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  rowProgress: { marginTop: 8, color: colors.textGrayLight },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyStateInner: { marginTop: 0 },
  planButton: {
    borderRadius: 14,
    backgroundColor: colors.primaryMutedAlt,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  planButtonText: { fontWeight: "700", color: colors.white },
});
