// src/screens/scan/ProductScanScreen.jsx
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { request } from "../../api/baseApi";

const SCREENS = {
  INITIAL: "initial",
  PREVIEW: "preview",
  LOADING: "loading",
  RESULT: "result",
  ERROR: "error",
};

function normalizeImageResult(response) {
  const payload = response?.data || response;
  const scan = payload?.scan || {};
  const classification = scan?.classification || payload?.classification || {};

  return {
    foodName:
      classification?.label ||
      classification?.rawLabel ||
      scan?.item?.name ||
      "Unknown Food",
    confidence: classification?.confidence,
    calories: classification?.calories ?? "--",
    source: classification?.source || payload?.explainability?.source || "image",
    uncertain: Boolean(classification?.uncertain),
    alternatives: classification?.alternatives || [],
  };
}

export default function ProductScanScreen() {
  const [screen, setScreen] = useState(SCREENS.INITIAL);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const pickImage = async (fromCamera) => {
    try {
      let pickerResult;

      if (fromCamera) {
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });
      }

      if (!pickerResult.canceled && pickerResult.assets?.[0]?.uri) {
        setImageUri(pickerResult.assets[0].uri);
        setScreen(SCREENS.PREVIEW);
      }
    } catch (e) {
      setError(e.message ?? "Failed to select image.");
      setScreen(SCREENS.ERROR);
    }
  };

  const analyseImage = async () => {
    if (!imageUri) return;
    setScreen(SCREENS.LOADING);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "food.jpg",
        type: "image/jpeg",
      });

      const data = await request("POST", "/api/imageClassification", {
        body: formData,
      });

      setResult(normalizeImageResult(data));
      setScreen(SCREENS.RESULT);
    } catch (e) {
      setError(e.message ?? "Failed to analyse image. Please try again.");
      setScreen(SCREENS.ERROR);
    }
  };

  const handleReset = () => {
    setScreen(SCREENS.INITIAL);
    setImageUri(null);
    setResult(null);
    setError("");
  };

  // --- Initial screen ---
  if (screen === SCREENS.INITIAL) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scan Food</Text>
        <Text style={styles.subtitle}>
          Take a photo or choose from your library to identify your food and get
          nutritional information.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => pickImage(true)}
        >
          <Text style={styles.primaryButtonText}>📷 Take Photo</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => pickImage(false)}
        >
          <Text style={styles.secondaryButtonText}>🖼 Choose from Library</Text>
        </Pressable>
      </View>
    );
  }

  // --- Preview screen ---
  if (screen === SCREENS.PREVIEW) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Preview</Text>

        <Image
          source={{ uri: imageUri }}
          style={styles.previewImage}
          resizeMode="cover"
        />

        <Pressable style={styles.primaryButton} onPress={analyseImage}>
          <Text style={styles.primaryButtonText}>Analyse Food</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleReset}>
          <Text style={styles.secondaryButtonText}>Choose Different Image</Text>
        </Pressable>
      </View>
    );
  }

  // --- Loading screen ---
  if (screen === SCREENS.LOADING) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Analysing your food…</Text>
      </View>
    );
  }

  // --- Result screen ---
  if (screen === SCREENS.RESULT && result) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Results</Text>

        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.resultCard}>
          <Text style={styles.resultEyebrow}>Image Result</Text>
          <Text style={styles.foodName}>
            {result.foodName ?? result.name ?? "Unknown Food"}
          </Text>

          <Text style={styles.perServing}>AI classification summary</Text>

          <View style={styles.nutriRow}>
            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.calories ?? "--"}
              </Text>
              <Text style={styles.nutriLabel}>Calories</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.confidence ? `${Math.round(result.confidence * 100)}%` : "--"}
              </Text>
              <Text style={styles.nutriLabel}>Confidence</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.source ?? "--"}
              </Text>
              <Text style={styles.nutriLabel}>Source</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.uncertain ? "Yes" : "No"}
              </Text>
              <Text style={styles.nutriLabel}>Uncertain</Text>
            </View>
          </View>

          {result.alternatives?.length ? (
            <View style={styles.alternativesBox}>
              <Text style={styles.alternativesTitle}>Possible alternatives</Text>
              <Text style={styles.alternativesText}>
                {result.alternatives.map((item) => item.label || item).join(", ")}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable style={styles.primaryButton} onPress={handleReset}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // --- Error screen ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable style={styles.primaryButton} onPress={handleReset}>
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 60,
  },

  centerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  scrollContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 40,
  },

  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 12,
    marginBottom: 24,
  },

  resultImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },

  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
  },

  resultEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#93C5FD",
    marginBottom: 10,
  },

  foodName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },

  perServing: {
    fontSize: 13,
    color: "#CBD5E1",
    marginBottom: 18,
  },

  nutriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },

  nutriItem: {
    alignItems: "center",
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },

  nutriValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },

  nutriLabel: {
    fontSize: 11,
    color: "#93C5FD",
    marginTop: 4,
  },

  alternativesBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
  },

  alternativesTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },

  alternativesText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  errorText: {
    fontSize: 14,
    color: "#EF4444",
    marginBottom: 24,
    lineHeight: 22,
  },

  primaryButton: {
    height: 52,
    backgroundColor: "#1877F2",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    color: "#18233D",
    fontSize: 14,
    fontWeight: "600",
  },
});
