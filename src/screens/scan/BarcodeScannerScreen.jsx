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
import { useUser } from "../../context/UserContext";
import { addScanEntry } from "../../utils/scanHistoryStorage";

const OFF_FIELDS = "product_name,allergens_tags,allergens_from_ingredients,ingredients_text";

// FE-17: Barcode lookups deliberately use the Open Food Facts public API
// rather than a proprietary/paid barcode service. EXPO_PUBLIC_API_BARCODE_URL
// was audited and found unused anywhere in the codebase, so it was removed
// from .env.example — this is the app's committed data source going forward.
// See FE-17-barcode-source-audit.md for the audit that led to this decision.
async function fetchFromOpenFoodFacts(barcode) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=${OFF_FIELDS}`;
  const response = await fetch(url, {
    headers: { "User-Agent": "NutriHelp-Mobile/1.0" },
  });
  if (!response.ok) throw new Error("Could not reach product database. Please try again.");
  const data = await response.json();
  if (data.status === 0) throw new Error("Product not found. Try entering the barcode manually.");
  return data.product;
}

function parseAllergens(product) {
  if (product.allergens_tags?.length) {
    return product.allergens_tags
      .map((t) => t.replace(/^[a-z]{2}:/, ""))
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }
  if (product.allergens_from_ingredients) {
    return product.allergens_from_ingredients
      .split(",")
      .map((s) => s.trim().replace(/^[a-z]{2}:/, ""))
      .filter(Boolean)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  }
  return [];
}

function parseIngredients(product) {
  if (!product.ingredients_text) return [];
  return product.ingredients_text
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeBarcodeResult(product, barcode) {
  return {
    name: product.product_name || "Unknown Product",
    barcode,
    productAllergens: parseAllergens(product),
    detectedIngredients: parseIngredients(product),
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
  const hasAllergens = result.productAllergens?.length > 0;
  return (
    <View style={styles.resultSheet}>
      <View style={styles.resultHandle} />

      <Text style={styles.resultEyebrow}>Barcode Result</Text>
      <Text style={styles.resultTitle} numberOfLines={2}>{result.name}</Text>

      {/* Allergen status card */}
      <View style={styles.allergenCard}>
        <View style={styles.allergenCardLeft}>
          <Ionicons
            name={hasAllergens ? "warning-outline" : "shield-checkmark-outline"}
            size={22}
            color={hasAllergens ? "#F59E0B" : "#22C55E"}
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.allergenCardLabel}>Product Allergens</Text>
            <Text style={[styles.allergenCardStatus, { color: hasAllergens ? "#F59E0B" : "#22C55E" }]}>
              {hasAllergens ? `Contains ${result.productAllergens.length} allergen${result.productAllergens.length > 1 ? "s" : ""}` : "No allergens declared"}
            </Text>
          </View>
        </View>
        <View style={[styles.statusChip, hasAllergens ? styles.chipWarning : styles.chipSafe]}>
          <Text style={styles.statusChipText}>{hasAllergens ? "Check" : "Clear"}</Text>
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
          <Text style={styles.metricValue}>{result.productAllergens?.length || 0}</Text>
          <Text style={styles.metricLabel}>Allergens</Text>
        </View>
      </View>

      {/* Product allergens */}
      {hasAllergens && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Contains allergens</Text>
          <Text style={styles.infoCardText}>{result.productAllergens.join(", ")}</Text>
        </View>
      )}

      {/* Detected ingredients */}
      {result.detectedIngredients?.length > 0 && (
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Ingredients</Text>
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
        <Text style={styles.secondaryBtnText}>{saveState === "saved" ? "Done" : "Scan Another Product"}</Text>
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

export default function BarcodeScannerScreen({ navigation }) {
  const { user } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [saveState, setSaveState] = useState("idle");
  const scanLocked = useRef(false);

  if (!permission) return null;

  if (!permission.granted) {
    if (permission.canAskAgain) {
      return (
        <PermissionExplanationScreen onRequest={requestPermission} />
      );
    }
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
      const product = await fetchFromOpenFoodFacts(normalizedBarcode);
      setResult(normalizeBarcodeResult(product, normalizedBarcode));
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
    if (saveState === "saved" && navigation?.canGoBack()) {
      navigation.goBack();
      return;
    }
    setResult(null);
    setManualBarcode("");
    setSaveState("idle");
    scanLocked.current = false;
  };

  const handleSaveToHistory = async () => {
    if (!result) return;
    try {
      setSaveState("saving");
      await addScanEntry({
        label: result.name,
        barcode: result.barcode,
        productAllergens: result.productAllergens || [],
        detectedIngredients: result.detectedIngredients || [],
        source: "mobile_barcode_scan",
        date: new Date().toISOString().slice(0, 10),
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
  chipWarning: { backgroundColor: "#FEF3C7" },
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
