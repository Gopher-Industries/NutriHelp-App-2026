import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import { useUser } from "../../context/UserContext";
import {
  formatDisplayName,
  getWeekDates,
  groupMealsByType,
} from "./mealPlanUiHelpers";

function sameCalendarDay(left, right) {
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

function formatScreenDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function MealSummaryCard({ item }) {
  return (
    <View style={styles.mealCard}>
      <View style={[styles.mealAccent, { backgroundColor: item.accent }]} />
      <View style={styles.mealTextWrap}>
        <Text style={styles.mealTitle}>{item.title}</Text>
        <Text style={[styles.mealType, { color: item.accent }]}>{item.mealType}</Text>
      </View>
      <Text style={styles.mealCalories}>{item.calories} cal</Text>
    </View>
  );
}

export default function WeeklyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState("loading");
  const [meals, setMeals] = useState([]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const loadPlan = useCallback(async () => {
    try {
      setStatus("loading");
      const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
      const groups = groupMealsByType(
        response?.data?.items || response?.items || response?.mealPlans || [],
        selectedDate
      );

      const summaryMeals = groups.map((group) => {
        const firstRecipe = group.recipes[0];
        return {
          id: `${group.mealType}-${firstRecipe?.id || "empty"}`,
          title: group.hasLiveData
            ? firstRecipe?.title || `${group.title} Plan`
            : `Nothing planned yet`,
          mealType: group.title,
          calories: Math.round(firstRecipe?.calories || 0),
          accent:
            group.mealType === "breakfast"
              ? "#F59E0B"
              : group.mealType === "lunch"
                ? "#22C55E"
                : "#3B82F6",
          hasLiveData: group.hasLiveData,
        };
      });

      setMeals(summaryMeals);
      setStatus("ready");
    } catch (_error) {
      setMeals([]);
      setStatus("error");
    }
  }, [selectedDate, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadPlan();
    }, [loadPlan])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.statusSpacer} />
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.batteryBadge}>
            <Ionicons name="battery-charging-outline" size={18} color="#22C55E" />
          </View>
        </View>

        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>Plan your meals for the week</Text>

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
                onPress={() => setSelectedDate(date)}
              >
                <Text style={styles.dayChipText}>
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.dayIndicatorWrap}>
          <View style={styles.dayIndicator} />
        </View>

        <Text style={styles.selectedDateLabel}>{formatScreenDate(selectedDate)}</Text>

        <View style={styles.planCard}>
          {status === "error" ? (
            <View style={styles.errorState}>
              <Text style={styles.errorTitle}>Could not load your meal plan</Text>
              <Text style={styles.errorSubtitle}>Tap below to try again</Text>
              <Pressable style={styles.primaryButton} onPress={loadPlan}>
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {status === "loading"
                ? ["Breakfast", "Lunch", "Dinner"].map((label, index) => (
                    <View
                      key={`${label}-${index}`}
                      style={[
                        styles.mealCard,
                        index === 2 ? styles.mealCardLast : null,
                      ]}
                    >
                      <View
                        style={[
                          styles.mealAccent,
                          {
                            backgroundColor:
                              index === 0 ? "#F59E0B" : index === 1 ? "#22C55E" : "#3B82F6",
                            opacity: 0.3,
                          },
                        ]}
                      />
                      <View style={styles.skeletonTextWrap}>
                        <View style={styles.skeletonLineLong} />
                        <View style={styles.skeletonLineShort} />
                      </View>
                    </View>
                  ))
                : meals.map((item, index) => (
                    <View key={item.id} style={index === meals.length - 1 ? styles.mealCardLast : null}>
                      <MealSummaryCard item={item} />
                    </View>
                  ))}

              <Pressable
                style={styles.linkButton}
                onPress={() =>
                  navigation.navigate("DailyPlanScreen", {
                    date: selectedDate.toISOString().slice(0, 10),
                  })
                }
              >
                <Text style={styles.linkButtonText}>View Details</Text>
              </Pressable>

              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  navigation.navigate("DailyPlanScreen", {
                    date: selectedDate.toISOString().slice(0, 10),
                    openAddMeal: true,
                  })
                }
              >
                <Text style={styles.primaryButtonText}>Add Meals</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statusSpacer: { width: 40 },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },
  batteryBadge: { width: 40, alignItems: "flex-end" },
  title: { fontSize: 34, fontWeight: "800", color: "#253B63", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#66758F", marginBottom: 28 },
  dayChipRow: { paddingBottom: 6 },
  dayChip: {
    minWidth: 78,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dayChipActive: { backgroundColor: "#184F88" },
  dayChipText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  dayIndicatorWrap: { paddingLeft: 28, marginTop: 2, marginBottom: 12 },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#184F88",
  },
  selectedDateLabel: {
    fontSize: 22,
    fontWeight: "800",
    color: "#253B63",
    marginBottom: 18,
  },
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    padding: 16,
  },
  mealCard: {
    minHeight: 94,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 14,
  },
  mealCardLast: {
    marginBottom: 12,
  },
  mealAccent: {
    width: 5,
    alignSelf: "stretch",
  },
  mealTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 6,
  },
  mealType: {
    fontSize: 14,
    fontWeight: "500",
  },
  mealCalories: {
    paddingRight: 14,
    fontSize: 16,
    color: "#A0AEC0",
  },
  linkButton: {
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 10,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#66758F",
  },
  primaryButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  errorState: {
    paddingVertical: 64,
    alignItems: "center",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 10,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  skeletonTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
  },
  skeletonLineLong: {
    width: "66%",
    height: 18,
    borderRadius: 8,
    backgroundColor: "#EAEFF5",
    marginBottom: 10,
  },
  skeletonLineShort: {
    width: "36%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
  },
});
