import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getRecommendations } from "../../api/recommendationApi";
import { toErrorMessage } from "../../api/baseApi";

/**
 * FE-26 — RecommendedDetails: real recipe data (no static mock).
 *
 * Previously this screen showed a hard-coded "Berry Protein Smoothie" with fixed
 * numbers. It now fetches real recommendations from the backend
 * (POST /api/recommendations via the services layer) and renders the top item's
 * real title, explanation, image and nutrition — with loading / error / empty
 * states. No hard-coded recipe content remains.
 */

function nutritionValue(nutrition, keys) {
  if (!nutrition || typeof nutrition !== "object") return null;
  for (const k of keys) {
    if (nutrition[k] != null) return nutrition[k];
  }
  return null;
}

export default function RecommendedDetailsScreen() {
  const [status, setStatus] = useState("loading"); // loading | ready | empty | error
  const [item, setItem] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const load = async () => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const items = await getRecommendations();
      if (!items.length) {
        setStatus("empty");
        return;
      }
      // Top recommendation (rank 1 if present, otherwise the first).
      const top = items.slice().sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))[0];
      setItem(top);
      setStatus("ready");
    } catch (e) {
      setErrorMessage(toErrorMessage(e, "Couldn’t load your recommendation."));
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#0B5FA5" />
      </SafeAreaView>
    );
  }

  if (status === "error") {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top"]}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <Pressable style={styles.retryButton} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (status === "empty") {
    return (
      <SafeAreaView style={styles.centerWrap} edges={["top"]}>
        <Text style={styles.title}>Recommended for you</Text>
        <Text style={styles.subtitle}>
          No recommendations yet. Add your preferences and check back soon.
        </Text>
      </SafeAreaView>
    );
  }

  const calories = nutritionValue(item.nutrition, ["calories", "kcal", "energy"]);
  const protein = nutritionValue(item.nutrition, ["protein", "protein_g", "proteinGrams"]);
  const imageUrl = item.imageUrl || item.image_url || null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Recommended for you</Text>
        <Text style={styles.subtitle}>
          Based on your current nutrition goals, here’s a strong fit.
        </Text>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.heroImage} />
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.foodTitle}>{item.title || "Recommended recipe"}</Text>
          {item.explanation ? (
            <Text style={styles.foodDescription}>{item.explanation}</Text>
          ) : null}

          {calories != null ? (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Calories</Text>
              <Text style={styles.metricValue}>{`${calories} kcal`}</Text>
            </View>
          ) : null}
          {protein != null ? (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Protein</Text>
              <Text style={styles.metricValue}>{`${protein} g`}</Text>
            </View>
          ) : null}
          {item.preparationTime != null || item.preparation_time != null ? (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Prep time</Text>
              <Text style={styles.metricValue}>
                {`${item.preparationTime ?? item.preparation_time} min`}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { padding: 20, paddingBottom: 32 },
  centerWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: { fontSize: 30, fontWeight: "800", color: "#111111", marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: "#555555", marginBottom: 20, textAlign: "center" },
  heroImage: { width: "100%", height: 220, borderRadius: 28, marginBottom: 18 },
  infoCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 28,
    padding: 20,
  },
  foodTitle: { fontSize: 24, fontWeight: "800", color: "#111111", marginBottom: 10 },
  foodDescription: { fontSize: 16, lineHeight: 23, color: "#444444", marginBottom: 18 },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricLabel: { fontSize: 16, color: "#555555" },
  metricValue: { fontSize: 17, fontWeight: "700", color: "#111111" },
  errorText: { color: "#D62828", fontSize: 15, textAlign: "center", marginBottom: 16 },
  retryButton: {
    backgroundColor: "#0B5FA5",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#FFFFFF", fontWeight: "700" },
});
