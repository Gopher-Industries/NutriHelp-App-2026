import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOAL_ITEMS = [
  { label: "Calories remaining", value: "650 kcal", color: "#1877F2" },
  { label: "Protein target", value: "120 g", color: "#39D353" },
  { label: "Water target", value: "8 glasses", color: "#13B5EA" },
];

export default function GoalDetailsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Goal Progress</Text>
        <Text style={styles.subtitle}>
          Your nutrition plan is on track today. Keep pushing toward your daily
          calorie and hydration targets.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.ring}>
            <View style={styles.ringFill} />
            <View style={styles.innerCircle}>
              <Text style={styles.ringValue}>3350</Text>
              <Text style={styles.ringUnit}>of 4000 kcal</Text>
            </View>
          </View>
          <Text style={styles.heroHeadline}>84% of your daily goal reached</Text>
        </View>

        {GOAL_ITEMS.map((item) => (
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
    transform: [{ rotate: "55deg" }],
  },
  innerCircle: {
    transform: [{ rotate: "20deg" }],
    alignItems: "center",
  },
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
});
