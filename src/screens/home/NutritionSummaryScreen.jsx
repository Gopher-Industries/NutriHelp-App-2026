import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SUMMARY_ROWS = [
  { label: "Protein", consumed: "56 g", target: "85 g", progress: 0.66, color: "#1877F2" },
  { label: "Fiber", consumed: "18 g", target: "32 g", progress: 0.56, color: "#39D353" },
  { label: "Sugar", consumed: "24 g", target: "40 g", progress: 0.45, color: "#FF4D00" },
  { label: "Sodium", consumed: "2.5 g", target: "5 g", progress: 0.34, color: "#FFC400" },
];

export default function NutritionSummaryScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nutrition Summary</Text>
        <Text style={styles.subtitle}>
          A quick look at the nutrients you have consumed so far today.
        </Text>

        {SUMMARY_ROWS.map((item) => (
          <View key={item.label} style={styles.rowCard}>
            <View style={styles.rowHeader}>
              <Text style={[styles.rowTitle, { color: item.color }]}>{item.label}</Text>
              <Text style={styles.rowValue}>
                {item.consumed} / {item.target}
              </Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${item.progress * 100}%`, backgroundColor: item.color },
                ]}
              />
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
  track: {
    height: 14,
    borderRadius: 99,
    backgroundColor: "#D9D9D9",
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 99 },
});
