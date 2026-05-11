import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MEAL_ITEMS = [
  { title: "Breakfast", status: "Completed", note: "Greek yogurt with berries" },
  { title: "Lunch", status: "Up next", note: "Chicken salad bowl" },
  { title: "Dinner", status: "Pending", note: "Grilled salmon with greens" },
];

export default function MealPlanOverviewScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Meal Plan</Text>
        <Text style={styles.subtitle}>
          Track what is planned for today and jump into your daily or weekly plan.
        </Text>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.primaryAction}
            onPress={() => navigation.navigate("DailyPlanScreen")}
          >
            <Text style={styles.primaryActionText}>Open Daily Plan</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryAction}
            onPress={() => navigation.navigate("WeeklyPlanScreen")}
          >
            <Text style={styles.secondaryActionText}>Open Weekly Plan</Text>
          </Pressable>
        </View>

        {MEAL_ITEMS.map((item) => (
          <View key={item.title} style={styles.mealCard}>
            <Text style={styles.mealTitle}>{item.title}</Text>
            <Text style={styles.mealStatus}>{item.status}</Text>
            <Text style={styles.mealNote}>{item.note}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: "800", color: "#111111", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: "#555555", marginBottom: 20 },
  actionRow: { gap: 12, marginBottom: 20 },
  primaryAction: {
    backgroundColor: "#111111",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryActionText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  secondaryAction: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#111111",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryActionText: { fontSize: 17, fontWeight: "800", color: "#111111" },
  mealCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  mealTitle: { fontSize: 22, fontWeight: "800", color: "#111111", marginBottom: 6 },
  mealStatus: { fontSize: 14, fontWeight: "700", color: "#FF4D00", marginBottom: 6 },
  mealNote: { fontSize: 16, color: "#444444" },
});
