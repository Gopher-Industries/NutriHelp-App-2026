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
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { request } from "../../api/baseApi";
import { saveScannedMeal } from "../../api/mealLogApi";
import { useUser } from "../../context/UserContext";

const SCREENS = { INITIAL: "initial", PREVIEW: "preview", LOADING: "loading", RESULT: "result", ERROR: "error" };

function normalizeImageResult(response) {
  const payload = response?.data || response;
  const scan = payload?.scan || {};
  const classification = scan?.classification || payload?.classification || {};
  const caloriesValue = classification?.calories?.value ?? null;
  const caloriesUnit = classification?.calories?.unit || null;
  return {
    foodName: classification?.label || classification?.rawLabel || scan?.item?.name || "Unknown Food",
    confidence: classification?.confidence,
    caloriesValue,
    caloriesUnit,
    source: classification?.source || payload?.explainability?.source || "image",
    uncertain: Boolean(classification?.uncertain),
    alternatives: classification?.alternatives || [],
  };
}

export default function ProductScanScreen({ navigation }) {
  const { user } = useUser();
  const [screen, setScreen] = useState(SCREENS.INITIAL);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [saveState, setSaveState] = useState("idle");

  const pickImage = async (fromCamera) => {
    try {
      const pickerResult = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: false });

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
      formData.append("image", { uri: imageUri, name: "food.jpg", type: "image/jpeg" });
      const data = await request("POST", "/api/imageClassification", { body: formData });
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
    setSaveState("idle");
  };

  const handleSaveToHistory = async () => {
    if (!result) return;
    try {
      setSaveState("saving");
      await saveScannedMeal({
        user_id: user?.id || user?.user_id || user?.email || "anonymous",
        date: new Date().toISOString().slice(0, 10),
        meal_type: "Snacks",
        label: result.foodName,
        confidence: Number(result.confidence || 0),
        estimated_calories: result.caloriesValue != null ? Math.round(Number(result.caloriesValue)) : null,
        serving_description: result.caloriesUnit || null,
        recommendation: result.uncertain ? "Saved from image scan after review." : "Saved from image scan.",
        is_unclear: Boolean(result.uncertain),
        source: "mobile_image_scan",
      });
      setSaveState("saved");
    } catch (saveError) {
      setSaveState("idle");
      setError(saveError.message || "Failed to save scan history.");
      setScreen(SCREENS.ERROR);
    }
  };

  const Header = () => (
    <View style={styles.topRow}>
      <Pressable style={styles.backBtn} onPress={() => navigation?.canGoBack() ? navigation.goBack() : handleReset()}>
        <Ionicons name="arrow-back" size={22} color="#667085" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.logoText}>NutriHelp</Text>
    </View>
  );

  // --- Initial ---
  if (screen === SCREENS.INITIAL) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header />
          <Text style={styles.pageTitle}>Scan by Photo</Text>
          <Text style={styles.pageSubtitle}>Take or upload a photo to identify your food</Text>

          <Pressable style={styles.uploadBox} onPress={() => pickImage(true)}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="camera-outline" size={36} color="#2A78C5" />
            </View>
            <Text style={styles.uploadTitle}>Take a Photo</Text>
            <Text style={styles.uploadDesc}>Use your camera to capture the food</Text>
          </Pressable>

          <Pressable style={styles.outlineBox} onPress={() => pickImage(false)}>
            <Ionicons name="image-outline" size={22} color="#2A78C5" style={{ marginRight: 10 }} />
            <Text style={styles.outlineBoxText}>Choose from Library</Text>
          </Pressable>

          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Tips for best results</Text>
            <View style={styles.helpRow}><View style={styles.helpBullet} /><Text style={styles.helpText}>Ensure the food is clearly visible and well-lit</Text></View>
            <View style={styles.helpRow}><View style={styles.helpBullet} /><Text style={styles.helpText}>Fill the frame with the food item</Text></View>
            <View style={styles.helpRow}><View style={styles.helpBullet} /><Text style={styles.helpText}>Avoid blurry or dark photos</Text></View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Preview ---
  if (screen === SCREENS.PREVIEW) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header />
          <Text style={styles.pageTitle}>Preview</Text>
          <Text style={styles.pageSubtitle}>Check your photo before analysing</Text>

          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />

          <Pressable style={styles.primaryBtn} onPress={analyseImage}>
            <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Analyse Food</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>Choose Different Image</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Loading ---
  if (screen === SCREENS.LOADING) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2A78C5" />
          <Text style={styles.loadingTitle}>Analysing your food…</Text>
          <Text style={styles.loadingSubtitle}>This may take a few seconds</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Result ---
  if (screen === SCREENS.RESULT && result) {
    const confidence = result.confidence ? Math.round(result.confidence * 100) : null;
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header />
          <Text style={styles.pageTitle}>Results</Text>
          <Text style={styles.pageSubtitle}>AI image classification summary</Text>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="cover" />}

          {/* Main result card */}
          <View style={styles.resultCard}>
            <View style={styles.resultAccentBar} />
            <View style={styles.resultCardBody}>
              <Text style={styles.resultEyebrow}>Identified Food</Text>
              <Text style={styles.resultFoodName}>{result.foodName}</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>
                    {result.caloriesValue != null ? String(result.caloriesValue) : "--"}
                  </Text>
                  <Text style={styles.metricLabel}>Calories</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{confidence != null ? `${confidence}%` : "--"}</Text>
                  <Text style={styles.metricLabel}>Confidence</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{result.uncertain ? "Low" : "Good"}</Text>
                  <Text style={styles.metricLabel}>Accuracy</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Alternatives */}
          {result.alternatives?.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Possible alternatives</Text>
              <Text style={styles.infoCardText}>
                {result.alternatives.map((a) => a.label || a).join(" · ")}
              </Text>
            </View>
          )}

          {result.uncertain && (
            <View style={[styles.infoCard, styles.warningCard]}>
              <Ionicons name="alert-circle-outline" size={16} color="#D97706" style={{ marginBottom: 4 }} />
              <Text style={styles.warningText}>
                The AI is not fully confident in this result. Review before saving.
              </Text>
            </View>
          )}

          <Pressable
            style={[styles.primaryBtn, saveState === "saved" && styles.savedBtn]}
            onPress={handleSaveToHistory}
            disabled={saveState === "saving" || saveState === "saved"}
          >
            <Ionicons
              name={saveState === "saved" ? "checkmark-circle-outline" : "bookmark-outline"}
              size={18}
              color="#FFFFFF"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.primaryBtnText}>
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved to History" : "Save to History"}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>Scan Another Food</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- Error ---
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <Pressable style={styles.primaryBtn} onPress={handleReset}>
          <Text style={styles.primaryBtnText}>Try Again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 16, color: "#667085" },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },

  pageTitle: { fontSize: 32, fontWeight: "800", color: "#253B63", marginBottom: 6 },
  pageSubtitle: { fontSize: 15, color: "#66758F", marginBottom: 22 },

  uploadBox: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  uploadIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  uploadTitle: { fontSize: 18, fontWeight: "700", color: "#253B63", marginBottom: 6 },
  uploadDesc: { fontSize: 14, color: "#667085" },

  outlineBox: {
    height: 52,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#2A78C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  outlineBoxText: { fontSize: 15, fontWeight: "700", color: "#2A78C5" },

  helpCard: {
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
  },
  helpTitle: { fontSize: 15, fontWeight: "700", color: "#253B63", marginBottom: 12 },
  helpRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  helpBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2A78C5", marginTop: 6 },
  helpText: { flex: 1, fontSize: 14, color: "#667085", lineHeight: 21 },

  previewImage: { width: "100%", height: 280, borderRadius: 18, marginBottom: 20 },

  centerContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  loadingTitle: { fontSize: 18, fontWeight: "700", color: "#253B63" },
  loadingSubtitle: { fontSize: 14, color: "#94A3B8" },

  resultImage: { width: "100%", height: 200, borderRadius: 18, marginBottom: 16 },

  resultCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  resultAccentBar: { width: 4, backgroundColor: "#2A78C5" },
  resultCardBody: { flex: 1, padding: 16 },
  resultEyebrow: { fontSize: 11, fontWeight: "700", color: "#2A78C5", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 },
  resultFoodName: { fontSize: 22, fontWeight: "800", color: "#253B63", marginBottom: 16 },

  metricRow: { flexDirection: "row", alignItems: "center" },
  metricItem: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, height: 32, backgroundColor: "#E5E7EB" },
  metricValue: { fontSize: 18, fontWeight: "800", color: "#253B63", marginBottom: 2 },
  metricLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },

  infoCard: {
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  infoCardTitle: { fontSize: 14, fontWeight: "700", color: "#253B63", marginBottom: 6 },
  infoCardText: { fontSize: 14, color: "#667085", lineHeight: 21 },
  warningCard: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A", alignItems: "flex-start" },
  warningText: { fontSize: 13, color: "#92400E", lineHeight: 19 },

  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2A78C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  savedBtn: { backgroundColor: "#22C55E" },

  secondaryBtn: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#667085" },

  errorTitle: { fontSize: 20, fontWeight: "800", color: "#253B63", textAlign: "center" },
  errorBody: { fontSize: 14, color: "#EF4444", textAlign: "center", lineHeight: 22 },
});
