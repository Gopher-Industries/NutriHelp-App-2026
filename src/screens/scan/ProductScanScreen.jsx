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

      setResult(data);
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
          <Text style={styles.foodName}>
            {result.foodName ?? result.name ?? "Unknown Food"}
          </Text>

          <Text style={styles.perServing}>Per serving</Text>

          <View style={styles.nutriRow}>
            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.calories ?? "--"}
              </Text>
              <Text style={styles.nutriLabel}>Calories</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.protein ?? "--"}g
              </Text>
              <Text style={styles.nutriLabel}>Protein</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.carbs ?? "--"}g
              </Text>
              <Text style={styles.nutriLabel}>Carbs</Text>
            </View>

            <View style={styles.nutriItem}>
              <Text style={styles.nutriValue}>
                {result.fat ?? "--"}g
              </Text>
              <Text style={styles.nutriLabel}>Fat</Text>
            </View>
          </View>
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
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },

  foodName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#18233D",
    marginBottom: 4,
  },

  perServing: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 16,
  },

  nutriRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  nutriItem: {
    alignItems: "center",
  },

  nutriValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4CAF50",
  },

  nutriLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
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
    height: 48,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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