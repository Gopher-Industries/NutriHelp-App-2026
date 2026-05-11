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
import {
  getWeekDates,
  groupMealsByType,
  monthYearLabel,
} from "./mealPlanUiHelpers";

export default function DailyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [groups, setGroups] = useState(groupMealsByType([], new Date()));

  useEffect(() => {
    let cancelled = false;

    async function loadMeals() {
      try {
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        if (!cancelled) {
          setGroups(groupMealsByType(response?.data?.items || response?.items || [], selectedDate));
        }
      } catch (_error) {
        if (!cancelled) {
          setGroups(groupMealsByType([], selectedDate));
        }
      }
    }

    loadMeals();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, user?.id]);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={34} color="#111111" />
          </Pressable>
          <Ionicons name="restaurant-outline" size={30} color="#1877F2" />
        </View>

        <View style={styles.monthRow}>
          <Ionicons name="chevron-back" size={24} color="#1877F2" />
          <Text style={styles.monthLabel}>{monthYearLabel(selectedDate)}</Text>
          <Ionicons name="chevron-forward" size={24} color="#1877F2" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {weekDates.map((date) => {
            const active = date.toDateString() === selectedDate.toDateString();
            return (
              <Pressable
                key={date.toISOString()}
                style={[styles.dateChip, active && styles.dateChipActive]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase()}
                </Text>
                <Text style={[styles.dateDay, active && styles.dateTextActive]}>
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.map((group) => (
          <View key={group.mealType} style={styles.groupBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{group.title}</Text>
              <Pressable
                onPress={() =>
                  navigation.navigate("MealPlanDetailScreen", {
                    mealType: group.mealType,
                    date: selectedDate.toISOString().slice(0, 10),
                  })
                }
              >
                <Ionicons name="add-circle-outline" size={34} color="#1877F2" />
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recipeRow}>
                {group.recipes.slice(0, 3).map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    style={styles.recipeCard}
                    onPress={() =>
                      navigation.navigate("MealPlanDetailScreen", {
                        mealType: group.mealType,
                        date: selectedDate.toISOString().slice(0, 10),
                      })
                    }
                  >
                    <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        ))}
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
    marginBottom: 18,
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
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  monthLabel: { fontSize: 18, fontWeight: "800", color: "#111111" },
  dateRow: { gap: 10, paddingBottom: 18 },
  dateChip: {
    width: 58,
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 18,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  dateChipActive: {
    borderColor: "#1877F2",
  },
  dateWeekday: { fontSize: 14, color: "#222222", marginBottom: 12 },
  dateDay: { fontSize: 28, fontWeight: "800", color: "#111111" },
  dateTextActive: { color: "#1877F2" },
  groupBlock: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 27, fontWeight: "800", color: "#111111" },
  recipeRow: { flexDirection: "row", gap: 14 },
  recipeCard: { width: 176, height: 176, borderRadius: 24, overflow: "hidden" },
  recipeImage: { width: "100%", height: "100%" },
});
