import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../context/AccessibilityContext";

import { colors } from "../../theme";
export default function RecommendedDetailsScreen() {
  const { fs } = useAccessibility();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontSize: fs(30) }]}>Recommended for you</Text>
        <Text style={[styles.subtitle, { fontSize: fs(16), lineHeight: fs(23) }]}>
          Based on your current nutrition goals, this smoothie is a strong fit.
        </Text>

        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
          }}
          style={styles.heroImage}
        />

        <View style={styles.infoCard}>
          <Text style={[styles.foodTitle, { fontSize: fs(24) }]}>Berry Protein Smoothie</Text>
          <Text style={[styles.foodDescription, { fontSize: fs(16), lineHeight: fs(23) }]}>
            A balanced high-protein option with banana, berries, oats, and Greek
            yogurt to support your daily macro target.
          </Text>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { fontSize: fs(16) }]}>Calories</Text>
            <Text style={[styles.metricValue, { fontSize: fs(17) }]}>420 kcal</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { fontSize: fs(16) }]}>Protein</Text>
            <Text style={[styles.metricValue, { fontSize: fs(17) }]}>31 g</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { fontSize: fs(16) }]}>Best for</Text>
            <Text style={[styles.metricValue, { fontSize: fs(17) }]}>Post-workout recovery</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  screen: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontWeight: "800", color: colors.textNearBlack, marginBottom: 8 },
  subtitle: { color: colors.textGray, marginBottom: 20 },
  heroImage: { width: "100%", height: 220, borderRadius: 28, marginBottom: 18 },
  infoCard: {
    borderWidth: 1.5,
    borderColor: colors.textNearBlack,
    borderRadius: 28,
    padding: 20,
  },
  foodTitle: { fontWeight: "800", color: colors.textNearBlack, marginBottom: 10 },
  foodDescription: { color: colors.c_444444, marginBottom: 18 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  metricLabel: { color: colors.textGray },
  metricValue: { fontWeight: "700", color: colors.textNearBlack },
});
