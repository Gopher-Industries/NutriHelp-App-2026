import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "../../styles/themeColors";

export default function RecommendedDetailsScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recommended for you</Text>
        <Text style={styles.subtitle}>
          Based on your current nutrition goals, this smoothie is a strong fit.
        </Text>

        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=900&q=80",
          }}
          style={styles.heroImage}
        />

        <View style={styles.infoCard}>
          <Text style={styles.foodTitle}>Berry Protein Smoothie</Text>
          <Text style={styles.foodDescription}>
            A balanced high-protein option with banana, berries, oats, and Greek
            yogurt to support your daily macro target.
          </Text>

          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Calories</Text>
            <Text style={styles.metricValue}>420 kcal</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Protein</Text>
            <Text style={styles.metricValue}>31 g</Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Best for</Text>
            <Text style={styles.metricValue}>Post-workout recovery</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t) =>
StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: t.bg("#FFFFFF") },
  screen: { flex: 1, backgroundColor: t.bg("#FFFFFF") },
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: "800", color: t.fg("#111111"), marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: t.fg("#555555"), marginBottom: 20 },
  heroImage: { width: "100%", height: 220, borderRadius: 28, marginBottom: 18 },
  infoCard: {
    borderWidth: 1.5,
    borderColor: t.bd("#111111"),
    borderRadius: 28,
    padding: 20,
  },
  foodTitle: { fontSize: 24, fontWeight: "800", color: t.fg("#111111"), marginBottom: 10 },
  foodDescription: { fontSize: 16, lineHeight: 23, color: t.fg("#444444"), marginBottom: 18 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricLabel: { fontSize: 16, color: t.fg("#555555") },
  metricValue: { fontSize: 17, fontWeight: "700", color: t.fg("#111111") },
});
