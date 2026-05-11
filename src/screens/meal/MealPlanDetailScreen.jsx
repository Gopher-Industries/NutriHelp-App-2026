import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTodayIntake } from "../../api/waterIntakeApi";
import mealPlanApi from "../../api/mealPlanApi";
import { useUser } from "../../context/UserContext";
import {
  buildNutritionSummary,
  formatDisplayName,
  groupMealsByType,
  MEAL_TYPES,
} from "./mealPlanUiHelpers";

export default function MealPlanDetailScreen({ navigation, route }) {
  const { user } = useUser();
  const [selectedMealType, setSelectedMealType] = useState(route?.params?.mealType || "breakfast");
  const [groups, setGroups] = useState([]);
  const [glasses, setGlasses] = useState(0);

  const selectedDate = route?.params?.date || new Date().toISOString().slice(0, 10);

  useEffect(() => {
    setSelectedMealType(route?.params?.mealType || "breakfast");
  }, [route?.params?.mealType]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [weeklyResponse, todayGlasses] = await Promise.all([
          mealPlanApi.getWeeklyPlan({ userId: user?.id }),
          getTodayIntake(user?.id),
        ]);

        if (cancelled) {
          return;
        }

        setGroups(groupMealsByType(weeklyResponse?.data?.items || weeklyResponse?.items || [], selectedDate));
        setGlasses(Number(todayGlasses || 0));
      } catch (_error) {
        if (!cancelled) {
          setGroups(groupMealsByType([], selectedDate));
          setGlasses(0);
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, user?.id]);

  const selectedGroup =
    groups.find((group) => group.mealType === selectedMealType) ||
    groupMealsByType([], selectedDate).find((group) => group.mealType === selectedMealType);

  const nutritionSummary = useMemo(
    () => buildNutritionSummary(selectedGroup?.recipes || []),
    [selectedGroup]
  );

  const goalGlasses = 6;
  const amountMl = glasses * 250;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={34} color="#111111" />
          </Pressable>
          <Ionicons name="restaurant-outline" size={30} color="#1877F2" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {MEAL_TYPES.map((mealType) => {
            const active = selectedMealType === mealType;
            return (
              <Pressable
                key={mealType}
                style={[styles.tabChip, active && styles.tabChipActive]}
                onPress={() => setSelectedMealType(mealType)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {formatDisplayName(mealType)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View>
              <Text style={styles.waterTitle}>Water Intake</Text>
              <Text style={styles.waterSubtext}>
                {glasses} of {goalGlasses} glasses consumed
              </Text>
              <Text style={styles.waterMlText}>
                {amountMl} ML / {goalGlasses * 250} ML
              </Text>
            </View>
            <Ionicons name="water-outline" size={28} color="#1990FF" />
          </View>

          <View style={styles.glassRow}>
            {Array.from({ length: goalGlasses }).map((_, index) => {
              const active = index < glasses;
              return (
                <Ionicons
                  key={index}
                  name="water-outline"
                  size={28}
                  color={active ? "#1990FF" : "#FFFFFF"}
                  style={styles.glassIcon}
                />
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{selectedGroup?.title || "Meal"}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.recipeRow}>
            {(selectedGroup?.recipes || []).map((recipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Nutrition Summary</Text>
          {nutritionSummary.map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: item.color }]}>{item.label}</Text>
              <View style={styles.summaryTrack}>
                <View
                  style={[
                    styles.summaryFill,
                    { width: `${item.progress * 100}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 28 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: { gap: 14, paddingBottom: 18 },
  tabChip: {
    minWidth: 156,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  tabChipActive: {
    borderColor: "#1877F2",
  },
  tabText: { fontSize: 22, color: "#1877F2", fontWeight: "500" },
  tabTextActive: { fontWeight: "800" },
  waterCard: {
    borderRadius: 30,
    backgroundColor: "#000000",
    padding: 20,
    marginBottom: 22,
  },
  waterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  waterTitle: { fontSize: 26, fontWeight: "800", color: "#FFFFFF" },
  waterSubtext: { fontSize: 15, color: "#FFFFFF", marginTop: 4 },
  waterMlText: { fontSize: 16, color: "#1990FF", fontWeight: "800", marginTop: 8 },
  glassRow: { flexDirection: "row" },
  glassIcon: { marginRight: 10 },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 16,
  },
  recipeRow: { flexDirection: "row", gap: 14, marginBottom: 22 },
  recipeCard: { width: 176, height: 176, borderRadius: 24, overflow: "hidden" },
  recipeImage: { width: "100%", height: "100%" },
  summaryCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: "#FFFFFF",
  },
  summaryTitle: { fontSize: 26, fontWeight: "800", color: "#111111", marginBottom: 18 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: { width: 66, fontSize: 17, fontWeight: "500" },
  summaryTrack: {
    flex: 1,
    height: 10,
    borderRadius: 99,
    backgroundColor: "#D9D9D9",
    marginHorizontal: 14,
    overflow: "hidden",
  },
  summaryFill: { height: "100%", borderRadius: 99 },
  summaryValue: { width: 52, textAlign: "right", fontSize: 16, color: "#111111" },
});
