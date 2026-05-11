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

import mealPlanApi from "../../api/mealPlanApi";
import { useUser } from "../../context/UserContext";
import { groupMealsByType } from "./mealPlanUiHelpers";

export default function WeeklyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeals() {
      try {
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        if (!cancelled) {
          setGroups(groupMealsByType(response?.data?.items || response?.items || [], new Date()));
        }
      } catch (_error) {
        if (!cancelled) {
          setGroups(groupMealsByType([], new Date()));
        }
      }
    }

    loadMeals();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const breakfastGroup =
    groups.find((group) => group.mealType === "breakfast") ||
    groupMealsByType([], new Date())[0];

  const displayName = useMemo(
    () =>
      user?.full_name ||
      user?.name ||
      (user?.email ? user.email.split("@")[0] : "NutriHelp User"),
    [user]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.welcome}>Hi, Welcome to NutriHelp 👋</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("NutritionCalculatorScreen")}>
            <Ionicons name="restaurant-outline" size={34} color="#1877F2" />
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>What is Your Meal Plan Today?</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate("DailyPlanScreen")}
        >
          <Text style={styles.primaryButtonText}>Show Personalized Weekly Plan</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Breakfast</Text>
          <Pressable
            onPress={() =>
              navigation.navigate("MealPlanDetailScreen", {
                mealType: "breakfast",
                date: new Date().toISOString().slice(0, 10),
              })
            }
          >
            <Ionicons name="chevron-forward" size={28} color="#234BFF" />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {breakfastGroup.recipes.slice(0, 4).map((recipe) => (
            <Pressable
              key={recipe.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate("MealPlanDetailScreen", {
                  mealType: "breakfast",
                  date: new Date().toISOString().slice(0, 10),
                })
              }
            >
              <Image source={{ uri: recipe.imageUrl }} style={styles.cardImage} />
              <Text style={styles.cardLabel} numberOfLines={2}>
                {recipe.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 32 },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  welcome: { fontSize: 15, color: "#222222", marginBottom: 4 },
  name: { fontSize: 28, fontWeight: "700", color: "#111111" },
  heroTitle: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 28,
    maxWidth: 340,
  },
  primaryButton: {
    borderRadius: 22,
    backgroundColor: "#1877F2",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  primaryButtonText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 27, fontWeight: "800", color: "#111111" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  card: {
    width: "47%",
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 28,
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  cardImage: {
    width: "100%",
    height: 104,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 16,
    lineHeight: 21,
    color: "#111111",
    minHeight: 42,
  },
});
