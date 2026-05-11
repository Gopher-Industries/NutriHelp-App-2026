// src/screens/scan/BarcodeScannerScreen.jsx
import { useState, useRef } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
    hasUserAllergen:
      detection?.hasUserAllergen ?? allergens?.hasMatch ?? false,
    matchingAllergens:
      detection?.matchingAllergens ||
      allergens?.matchingIngredients ||
      [],
    detectedIngredients:
      payload?.barcodeIngredients || allergens?.detectedIngredients || [],
  };
}

// --- Loading Overlay ---
function LoadingOverlay() {
  return (
    <View style={styles.loadingOverlay}>
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text style={styles.loadingText}>Looking up barcode...</Text>
    </View>
  );
}

// --- Bottom Sheet Result ---
function ResultSheet({ result, onClose, onSave, saveState }) {
  return (
    <View style={styles.resultSheet}>
      <View style={styles.resultHandle} />
      <Text style={styles.resultEyebrow}>Barcode Result</Text>
      <Text style={styles.resultTitle}>{result.name ?? "Product"}</Text>

      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroTitle}>Allergen Check</Text>
          <View
            style={[
              styles.statusChip,
              result.hasUserAllergen ? styles.statusChipDanger : styles.statusChipSafe,
            ]}
          >
            <Text style={styles.statusChipText}>
              {result.hasUserAllergen ? "Match found" : "Safe for profile"}
            </Text>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Barcode</Text>
            <Text style={styles.metricValue}>{result.barcode ?? "--"}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ingredients found</Text>
            <Text style={styles.metricValue}>
              {result.detectedIngredients?.length || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>Matched allergens</Text>
        <Text style={styles.notesText}>
          {result.matchingAllergens?.length
            ? result.matchingAllergens.join(", ")
            : "No allergen conflicts detected for this barcode."}
        </Text>
      </View>

      <View style={styles.notesCard}>
        <Text style={styles.notesTitle}>Detected ingredients</Text>
        <Text style={styles.notesText}>
          {result.detectedIngredients?.length
            ? result.detectedIngredients.join(", ")
            : "No ingredient list was returned by the scan service."}
        </Text>
      </View>

      <Pressable
        style={[
          styles.secondaryButton,
          saveState === "saved" ? styles.secondaryButtonSaved : null,
        ]}
        onPress={onSave}
        disabled={saveState === "saving" || saveState === "saved"}
      >
        <Text style={styles.secondaryButtonText}>
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved to History"
              : "Save to History"}
        </Text>
      </Pressable>

      <Pressable style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Scan another product</Text>
      </Pressable>
    </View>
  );
}

// --- Permission Explanation Screen ---
function PermissionExplanationScreen({ onRequest }) {
  return (
    <View style={styles.permissionScreen}>
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionText}>
        NutriHelp needs access to your camera to scan barcodes and look up
        nutritional information for your food products.
      </Text>
      <Pressable style={styles.primaryButton} onPress={onRequest}>
        <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
      </Pressable>
    </View>
  );
}

// --- Permission Denied Fallback ---
function PermissionDeniedScreen() {
  return (
    <View style={styles.permissionScreen}>
      <Text style={styles.permissionTitle}>Camera Access Denied</Text>
      <Text style={styles.permissionText}>
        You've denied camera access. To use the barcode scanner, please enable
        camera permissions in your device settings.
      </Text>
      <Pressable
        style={styles.primaryButton}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.primaryButtonText}>Open Settings</Text>
      </Pressable>
    </View>
  );
}

// --- Main Screen ---
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

  // Step 1 — show custom explanation screen before system dialog
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

  // Step 2 — permission denied fallback
  if (permission && !permission.granted) {
    return <PermissionDeniedScreen />;
  }

  const lookupBarcode = async (barcode) => {
    if (!barcode || loading) return;
    const normalizedBarcode = String(barcode).trim();
    if (!/^\d{8,14}$/.test(normalizedBarcode)) {
      setError("Please scan or enter a valid barcode with 8 to 14 digits.");
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
    if (scanLocked.current) return; // prevent duplicate requests
    if (type === "qr") {
      setError("QR codes are ignored here. Please scan a product barcode.");
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
    scanLocked.current = false; // unlock scanner
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
      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "ean8", "code128", "code39"],
        }}
        onBarcodeScanned={result ? undefined : handleBarcodeScanned}
      />

      {/* Torch toggle */}
      <Pressable
        style={styles.torchButton}
        onPress={() => setTorchOn((prev) => !prev)}
      >
        <Text style={styles.torchButtonText}>
          {torchOn ? "⚡ Flash On" : "⚡ Flash Off"}
        </Text>
      </Pressable>

      {/* Scan frame hint */}
      <View style={styles.scanHint}>
        <Text style={styles.scanHintText}>
          Point camera at a barcode to scan
        </Text>
      </View>

      {/* Manual input fallback */}
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Or enter barcode manually:</Text>
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
            style={styles.manualButton}
            onPress={handleManualSubmit}
            disabled={loading}
          >
            <Text style={styles.manualButtonText}>Search</Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {/* Loading overlay */}
      {loading && <LoadingOverlay />}

      {/* Result bottom sheet */}
      {result && (
        <ResultSheet
          result={result}
          onClose={handleCloseResult}
          onSave={handleSaveToHistory}
          saveState={saveState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },

  camera: {
    flex: 1,
  },

  torchButton: {
    position: "absolute",
    top: 56,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  torchButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  scanHint: {
    position: "absolute",
    top: "45%",
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  scanHintText: {
    color: "#FFFFFF",
    fontSize: 13,
  },

  manualContainer: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },

  manualLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 8,
  },

  manualRow: {
    flexDirection: "row",
    gap: 8,
  },

  manualInput: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#18233D",
  },

  manualButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  manualButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  errorText: {
    marginTop: 8,
    color: "#FCA5A5",
    fontSize: 12,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  resultSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  resultHandle: {
    width: 58,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 16,
  },

  resultEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#1877F2",
    marginBottom: 8,
  },

  resultTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 18,
  },

  heroCard: {
    borderRadius: 28,
    backgroundColor: "#0F172A",
    padding: 18,
    marginBottom: 16,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  statusChipSafe: {
    backgroundColor: "#1D4ED8",
  },

  statusChipDanger: {
    backgroundColor: "#DC2626",
  },

  statusChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  metricGrid: {
    flexDirection: "row",
    gap: 12,
  },

  metricCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    padding: 14,
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#93C5FD",
    marginBottom: 8,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  notesCard: {
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },

  notesTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  notesText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  closeButton: {
    marginTop: 10,
    height: 52,
    backgroundColor: "#1877F2",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 6,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  secondaryButtonText: {
    color: "#18233D",
    fontSize: 14,
    fontWeight: "700",
  },

  secondaryButtonSaved: {
    borderColor: "#22C55E",
    backgroundColor: "#F0FDF4",
  },

  permissionScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  permissionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 16,
    textAlign: "center",
  },

  permissionText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  primaryButton: {
    height: 48,
    width: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
