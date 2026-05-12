import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import profileApi from "../../api/profileApi";
import { useUser } from "../../context/UserContext";

const CALORIE_OPTIONS = [1500, 1800, 2000, 2200, 2500];
const GOAL_OPTIONS = ["Lose Weight", "Maintain Weight", "Build Muscle", "Improve Health"];
const MEAL_ACCENTS = { breakfast: "#F59E0B", lunch: "#22C55E", dinner: "#3B82F6" };

function PlanDayCard({ day }) {
  return (
    <View style={styles.dayCard}>
      <Text style={styles.dayName}>{day.label}</Text>
      {(day.meals || []).map((meal) => (
        <View key={meal.id || meal.meal_type} style={styles.mealRow}>
          <View
            style={[
              styles.mealAccent,
              { backgroundColor: MEAL_ACCENTS[meal.meal_type?.toLowerCase()] || "#94A3B8" },
            ]}
          />
          <View style={styles.mealInfo}>
            <Text style={styles.mealTitle}>{meal.title || meal.recipe_name || "Meal"}</Text>
            <Text style={styles.mealMeta}>
              {meal.calories ? `${Math.round(meal.calories)} cal` : meal.meal_type}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AIWeeklyPlanScreen({ navigation }) {
  const { user } = useUser();
  const [step, setStep] = useState("configure");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [goal, setGoal] = useState("Maintain Weight");
  const [dietaryPreference, setDietaryPreference] = useState("");

  const handleGenerate = async () => {
    setGenerating(true);
    setStep("generating");

    try {
      let preference = dietaryPreference;
      if (!preference) {
        try {
          const profile = await profileApi.getProfile();
          preference =
            profile?.dietary_preference ||
            profile?.preferenceSummary?.dietaryRequirements?.[0] ||
            "Balanced";
        } catch {
          preference = "Balanced";
        }
      }

      const response = await mealPlanApi.generateAIPlan({
        user_id: user?.id,
        calorie_target: calorieTarget,
        goal,
        dietary_preference: preference,
        days: 7,
      });

      const plan =
        response?.data?.plan ||
        response?.plan ||
        response?.data ||
        null;

      if (plan) {
        setGeneratedPlan(plan);
        setStep("result");
      } else {
        Alert.alert(
          "Plan Generated",
          "Your AI plan has been generated and saved to your account!",
          [{ text: "Go to My Plan", onPress: () => navigation.goBack() }]
        );
        setStep("configure");
      }
    } catch (error) {
      Alert.alert(
        "Generation Failed",
        error?.message || "Could not generate a plan. Please try again.",
        [{ text: "OK" }]
      );
      setStep("configure");
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      Alert.alert(
        "Plan Saved!",
        "Your AI-generated meal plan has been added to your account.",
        [{ text: "View My Plan", onPress: () => navigation.goBack() }]
      );
    } finally {
      setSaving(false);
    }
  };

  const renderDays = () => {
    if (!generatedPlan) return null;

    if (Array.isArray(generatedPlan)) {
      return generatedPlan.map((day, index) => (
        <PlanDayCard
          key={`day-${index}`}
          day={{
            label: day.date
              ? new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(new Date(day.date))
              : `Day ${index + 1}`,
            meals: day.meals || day.items || [],
          }}
        />
      ));
    }

    if (typeof generatedPlan === "object") {
      return Object.entries(generatedPlan).map(([key, value], index) => (
        <PlanDayCard
          key={key}
          day={{
            label: key,
            meals: Array.isArray(value) ? value : value?.meals || [],
          }}
        />
      ));
    }

    return null;
  };

  if (step === "generating") {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B78C5" />
          <Text style={styles.loadingTitle}>Generating your plan...</Text>
          <Text style={styles.loadingSubtitle}>
            Our AI is crafting a personalised {calorieTarget} kcal/day plan for your goal: {goal}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "result" && generatedPlan) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => setStep("configure")}>
            <Ionicons name="arrow-back" size={22} color="#667085" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.resultContent}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Your AI Meal Plan</Text>
            <Text style={styles.resultSubtitle}>
              {calorieTarget} kcal/day · {goal}
            </Text>
          </View>

          {renderDays()}

          <Pressable
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleSavePlan}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            <Text style={styles.primaryButtonText}>
              {saving ? "  Saving..." : "Save to My Plan"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={handleGenerate}>
            <Ionicons name="refresh-outline" size={16} color="#2B78C5" />
            <Text style={styles.secondaryButtonText}>  Regenerate</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

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

      <ScrollView contentContainerStyle={styles.configContent}>
        <Text style={styles.configTitle}>AI Meal Planner</Text>
        <Text style={styles.configSubtitle}>
          Let AI create a personalised weekly meal plan based on your goals and preferences.
        </Text>

        <Text style={styles.sectionLabel}>Daily Calorie Target</Text>
        <View style={styles.chipRow}>
          {CALORIE_OPTIONS.map((cal) => (
            <Pressable
              key={cal}
              style={[styles.chip, calorieTarget === cal && styles.chipActive]}
              onPress={() => setCalorieTarget(cal)}
            >
              <Text style={[styles.chipText, calorieTarget === cal && styles.chipTextActive]}>
                {cal} kcal
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Your Goal</Text>
        <View style={styles.goalList}>
          {GOAL_OPTIONS.map((g) => (
            <Pressable
              key={g}
              style={[styles.goalOption, goal === g && styles.goalOptionActive]}
              onPress={() => setGoal(g)}
            >
              <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>{g}</Text>
              {goal === g && <Ionicons name="checkmark-circle" size={20} color="#2B78C5" />}
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color="#2B78C5" />
          <Text style={styles.infoText}>
            Your dietary preferences from your profile will be automatically applied.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleGenerate}>
          <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>  Generate My Plan</Text>
        </Pressable>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingTitle: { marginTop: 20, fontSize: 22, fontWeight: "800", color: "#18233D", textAlign: "center" },
  loadingSubtitle: { marginTop: 12, fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  configContent: { padding: 20, paddingBottom: 40 },
  configTitle: { fontSize: 30, fontWeight: "800", color: "#18233D", marginBottom: 8 },
  configSubtitle: { fontSize: 15, color: "#6B7280", lineHeight: 22, marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#374151", marginBottom: 12, marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  chipActive: { borderColor: "#2B78C5", backgroundColor: "#EAF2FF" },
  chipText: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  chipTextActive: { color: "#2B78C5" },
  goalList: { marginBottom: 20 },
  goalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  goalOptionActive: { borderColor: "#2B78C5", backgroundColor: "#EAF2FF" },
  goalText: { fontSize: 15, color: "#374151" },
  goalTextActive: { fontWeight: "700", color: "#2B78C5" },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF2FF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  infoText: { flex: 1, marginLeft: 10, fontSize: 13, color: "#374151", lineHeight: 19 },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  secondaryButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  secondaryButtonText: { fontSize: 15, fontWeight: "700", color: "#2B78C5" },
  buttonDisabled: { opacity: 0.65 },
  resultContent: { padding: 20, paddingBottom: 40 },
  resultHeader: { marginBottom: 20 },
  resultTitle: { fontSize: 26, fontWeight: "800", color: "#18233D", marginBottom: 4 },
  resultSubtitle: { fontSize: 14, color: "#6B7280" },
  dayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 14,
    marginBottom: 14,
  },
  dayName: { fontSize: 16, fontWeight: "800", color: "#253B63", marginBottom: 10 },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  mealAccent: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  mealInfo: { flex: 1 },
  mealTitle: { fontSize: 14, fontWeight: "600", color: "#253B63" },
  mealMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});
