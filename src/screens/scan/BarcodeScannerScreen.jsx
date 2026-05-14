import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { post } from "../../api/baseApi";
import { saveScannedMeal } from "../../api/mealLogApi";
import { useUser } from "../../context/UserContext";

function normalizeBarcodeResult(response) {
  const payload = response?.data || response;
  const scan = payload?.scan || {};
  const item = scan?.item || {};
  const allergens = scan?.allergens || {};
  const detection = payload?.detectionResult || {};
  return {
    name: item?.name || payload?.productName || "Product",
    barcode: item?.barcode || scan?.query?.barcode || null,
    hasUserAllergen: detection?.hasUserAllergen ?? allergens?.hasMatch ?? false,
    matchingAllergens: detection?.matchingAllergens || allergens?.matchingIngredients || [],
    detectedIngredients: payload?.barcodeIngredients || allergens?.detectedIngredients || [],
  };
}

function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>Looking up barcode…</Text>
    </View>
  );
}

function ResultSheet({ result, onClose, onSave, saveState }) {
  const safeChip = !result.hasUserAllergen;
  return (
    <View style={styles.resultSheet}>
      <View style={styles.resultHandle} />

      <Text style={styles.resultEyebrow}>Barcode Result</Text>
      <Text style={styles.resultTitle} numberOfLines={2}>{result.name}</Text>

      {/* Allergen status card */}
      <View style={styles.allergenCard}>
        <View style={styles.allergenCardLeft}>
          <Ionicons
            name={safeChip ? "shield-checkmark-outline" : "warning-outline"}
            size={22}
            color={safeChip ? "#22C55E" : "#EF4444"}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.allergenCardLabel}>Allergen Check</Text>
            <Text style={[styles.allergenCardStatus, { color: safeChip ? "#22C55E" : "#EF4444" }]}>
              {safeChip ? "Safe for your profile" : "Allergen match found"}
            </Text>
          </View>
        </View>
        <View style={[styles.statusChip, safeChip ? styles.chipSafe : styles.chipDanger]}>
          <Text style={styles.statusChipText}>{safeChip ? "Safe" : "Alert"}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{result.barcode ?? "--"}</Text>
          <Text style={styles.metricLabel}>Barcode</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{result.detectedIngredients?.length || 0}</Text>
          <Text style={styles.metricLabel}>Ingredients</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{result.matchingAllergens?.length || 0}</Text>
          <Text style={styles.metricLabel}>Allergens</Text>
        </View>
      </View>

      {/* Matched allergens */}
      {result.matchingAllergens?.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Matched allergens</Text>
          <Text style={styles.infoCardText}>{result.matchingAllergens.join(", ")}</Text>
        </View>
      )}

      {/* Detected ingredients */}
      {result.detectedIngredients?.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Detected ingredients</Text>
          <Text style={styles.infoCardText}>{result.detectedIngredients.join(", ")}</Text>
        </View>
      )}

      <Pressable
        style={[styles.primaryBtn, saveState === "saved" && styles.savedBtn]}
        onPress={onSave}
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

      <Pressable style={styles.secondaryBtn} onPress={onClose}>
        <Text style={styles.secondaryBtnText}>Scan Another Product</Text>
      </Pressable>
    </View>
  );
}

function PermissionExplanationScreen({ onRequest }) {
  return (
    <SafeAreaView style={styles.permissionSafe} edges={["top"]}>
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconWrap}>
          <Ionicons name="camera-outline" size={40} color="#2A78C5" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>
          NutriHelp needs access to your camera to scan barcodes and look up
          nutritional information for your food products.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={onRequest}>
          <Text style={styles.primaryBtnText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function PermissionDeniedScreen() {
  return (
    <SafeAreaView style={styles.permissionSafe} edges={["top"]}>
      <View style={styles.permissionContainer}>
        <View style={[styles.permissionIconWrap, { backgroundColor: "#FEF2F2" }]}>
          <Ionicons name="camera-off-outline" size={40} color="#EF4444" />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Denied</Text>
        <Text style={styles.permissionText}>
          To use the barcode scanner, please enable camera permissions in your
          device settings.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={() => Linking.openSettings()}>
          <Text style={styles.primaryBtnText}>Open Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function BarcodeScannerScreen() {
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const scanLocked = useRef(false);

  if (!hasRequestedPermission) {
    return (
      <PermissionExplanationScreen
        onRequest={async () => {
          setHasRequestedPermission(true);
          await requestPermission();
        }}
      />
    );
  }

  if (permission && !permission.granted) {
    return <PermissionDeniedScreen />;
  }

  const lookupBarcode = async (barcode) => {
    if (!barcode || loading) return;
    const normalizedBarcode = String(barcode).trim();
    if (!/^\d{8,14}$/.test(normalizedBarcode)) {
      setError("Please enter a valid barcode (8–14 digits).");
      return;
    }
    setError("");
    setLoading(true);
    scanLocked.current = true;
    try {
      const data = await post("/api/barcode/scan", { barcode: normalizedBarcode });
      setResult(normalizeBarcodeResult(data));
      setSaveState("idle");
    } catch (e) {
      setError(e.message ?? "Failed to look up barcode. Please try again.");
      scanLocked.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data, type }) => {
    if (scanLocked.current) return;
    if (type === "qr") {
      setError("QR codes are not supported. Please scan a product barcode.");
      return;
    }
    lookupBarcode(data);
  };

  const handleManualSubmit = () => {
    const trimmed = manualBarcode.trim();
    if (!trimmed) return;
    lookupBarcode(trimmed);
  };

  const handleCloseResult = () => {
    setResult(null);
    setManualBarcode("");
    setSaveState("idle");
    scanLocked.current = false;
  };

  const handleSaveToHistory = async () => {
    if (!result) return;
    try {
      setSaveState("saving");
      await saveScannedMeal({
        user_id: user?.id || user?.user_id || user?.email || "anonymous",
        date: new Date().toISOString().slice(0, 10),
        meal_type: "Snacks",
        label: result.name,
        confidence: 1,
        estimated_calories: null,
        serving_description: result.barcode || null,
        recommendation: "Saved from barcode scan.",
        is_unclear: false,
        source: "mobile_barcode_scan",
      });
      setSaveState("saved");
    } catch (saveError) {
      setSaveState("idle");
      setError(saveError.message || "Failed to save scan history.");
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "ean8", "code128", "code39"],
        }}
        onBarcodeScanned={result ? undefined : handleBarcodeScanned}
      />

      {/* Scan frame overlay */}
      <View style={styles.scanFrameWrap} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.scanHintText}>Align barcode within the frame</Text>
      </View>

      {/* Torch toggle */}
      <Pressable style={styles.torchBtn} onPress={() => setTorchOn((p) => !p)}>
        <Ionicons name={torchOn ? "flash" : "flash-off"} size={18} color={torchOn ? "#FCD34D" : "#FFFFFF"} />
        <Text style={styles.torchBtnText}>{torchOn ? "Flash On" : "Flash Off"}</Text>
      </Pressable>

      {/* Manual input */}
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Or enter barcode manually</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualBarcode}
            onChangeText={setManualBarcode}
            placeholder="e.g. 9300675023228"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            editable={!loading}
          />
          <Pressable
            style={[styles.manualBtn, loading && { opacity: 0.6 }]}
            onPress={handleManualSubmit}
            disabled={loading}
          >
            <Text style={styles.manualBtnText}>Search</Text>
          </Pressable>
        </View>
        {error ? (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color="#FCA5A5" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      {loading && <LoadingOverlay />}

      {result && (
        <ScrollView
          style={styles.resultSheetWrap}
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <ResultSheet
            result={result}
            onClose={handleCloseResult}
            onSave={handleSaveToHistory}
            saveState={saveState}
          />
        </ScrollView>
      )}
    </View>
  );
}

const CORNER_SIZE = 22;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1 },

  scanFrameWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanFrame: {
    width: 240,
    height: 160,
    marginBottom: 12,
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#FFFFFF",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 4 },
  scanHintText: { color: "#FFFFFF", fontSize: 13, fontWeight: "500", textAlign: "center", opacity: 0.85 },

  torchBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  torchBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  manualContainer: {
    position: "absolute",
    bottom: 170,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  manualLabel: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "500", marginBottom: 8 },
  manualRow: { flexDirection: "row", gap: 8 },
  manualInput: {
    flex: 1,
    height: 46,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#18233D",
  },
  manualBtn: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: "#2A78C5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  manualBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  errorText: { color: "#FCA5A5", fontSize: 12 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { color: "#FFFFFF", fontSize: 14, fontWeight: "500" },

  resultSheetWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "78%",
  },
  resultSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  resultHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 18,
  },
  resultEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#2A78C5",
    marginBottom: 4,
  },
  resultTitle: { fontSize: 24, fontWeight: "800", color: "#253B63", marginBottom: 16 },

  allergenCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    padding: 14,
    marginBottom: 14,
  },
  allergenCardLeft: { flexDirection: "row", alignItems: "center" },
  allergenCardLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "500", marginBottom: 2 },
  allergenCardStatus: { fontSize: 14, fontWeight: "700" },
  statusChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipSafe: { backgroundColor: "#DCFCE7" },
  chipDanger: { backgroundColor: "#FEE2E2" },
  statusChipText: { fontSize: 12, fontWeight: "700", color: "#374151" },

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    marginBottom: 14,
  },
  metricItem: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, height: 32, backgroundColor: "#E5E7EB" },
  metricValue: { fontSize: 16, fontWeight: "800", color: "#253B63", marginBottom: 2 },
  metricLabel: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },

  infoCard: {
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
  },
  infoCardTitle: { fontSize: 13, fontWeight: "700", color: "#253B63", marginBottom: 5 },
  infoCardText: { fontSize: 13, color: "#667085", lineHeight: 19 },

  primaryBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: "#2A78C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  savedBtn: { backgroundColor: "#22C55E" },

  secondaryBtn: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600", color: "#667085" },

  permissionSafe: { flex: 1, backgroundColor: "#FFFFFF" },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  permissionIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  permissionTitle: { fontSize: 22, fontWeight: "800", color: "#253B63", marginBottom: 12, textAlign: "center" },
  permissionText: { fontSize: 14, color: "#667085", textAlign: "center", lineHeight: 22, marginBottom: 32 },
});
