import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import baseApi from "../../api/baseApi";

export default function ProductScanScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera permission needed",
        "Please allow camera access to take a food photo."
      );
      return;
    }

    const response = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!response.canceled) {
      setSelectedImage(response.assets[0]);
      setResult(null);
    }
  };

  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo library permission needed",
        "Please allow photo access to choose a food image."
      );
      return;
    }

    const response = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!response.canceled) {
      setSelectedImage(response.assets[0]);
      setResult(null);
    }
  };

  const analyseImage = async () => {
    if (!selectedImage) {
      Alert.alert("No image selected", "Please take or choose a photo first.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("image", {
        uri: selectedImage.uri,
        name: "food-photo.jpg",
        type: "image/jpeg",
      });

      const data = await baseApi.post("/api/imageClassification", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("IMAGE CLASSIFICATION RESULT:", data);

      setResult(data);
    } catch (error) {
      console.log(
        "IMAGE CLASSIFICATION ERROR:",
        error?.data || error.message || error
      );

      Alert.alert(
        "Analysis failed",
        "We could not analyse this image. Please try another photo."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScreen = () => {
    setSelectedImage(null);
    setResult(null);
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Food photo analysis</Text>

      <Text style={styles.subtitle}>
        Take or choose a food photo to estimate nutrition details.
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={chooseFromLibrary}
        >
          <Text style={styles.secondaryButtonText}>Choose from Library</Text>
        </TouchableOpacity>
      </View>

      {selectedImage && (
        <View style={styles.previewCard}>
          <Image source={{ uri: selectedImage.uri }} style={styles.preview} />

          {!result && !loading && (
            <TouchableOpacity style={styles.primaryButton} onPress={analyseImage}>
              <Text style={styles.primaryButtonText}>Analyse</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Analysing your food...</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis result</Text>

          <Text style={styles.foodName}>
            {result?.foodName ||
              result?.name ||
              result?.prediction ||
              "Food identified"}
          </Text>

          <InfoRow
            label="Calories"
            value={result?.calories || result?.nutrition?.calories || "N/A"}
          />

          <InfoRow
            label="Protein"
            value={result?.protein || result?.nutrition?.protein || "N/A"}
          />

          <InfoRow
            label="Carbs"
            value={result?.carbs || result?.nutrition?.carbs || "N/A"}
          />

          <InfoRow
            label="Fat"
            value={result?.fat || result?.nutrition?.fat || "N/A"}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={resetScreen}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6b7280",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonRow: {
    gap: 12,
    marginBottom: 20,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: "#16a34a",
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  preview: {
    width: "100%",
    height: 260,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
  },
  loadingBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  foodName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#16a34a",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoLabel: {
    fontSize: 15,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "700",
  },
});