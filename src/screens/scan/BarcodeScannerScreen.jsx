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
function ResultSheet({ result, onClose }) {
  return (
    <View style={styles.resultSheet}>
      <Text style={styles.resultTitle}>{result.name ?? "Product"}</Text>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Calories</Text>
        <Text style={styles.resultValue}>{result.calories ?? "--"} kcal</Text>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Protein</Text>
        <Text style={styles.resultValue}>{result.protein ?? "--"} g</Text>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Carbs</Text>
        <Text style={styles.resultValue}>{result.carbs ?? "--"} g</Text>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultLabel}>Fat</Text>
        <Text style={styles.resultValue}>{result.fat ?? "--"} g</Text>
      </View>

      <Pressable style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
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
  const [permission, requestPermission] = useCameraPermissions();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
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
    setError("");
    setLoading(true);
    scanLocked.current = true;
    try {
      const data = await post("/api/barcode", { barcode });
      setResult(data);
    } catch (e) {
      setError(e.message ?? "Failed to look up barcode. Please try again.");
      scanLocked.current = false;
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }) => {
    if (scanLocked.current) return; // prevent duplicate requests
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
    scanLocked.current = false; // unlock scanner
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "upc_a", "qr"],
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
        <ResultSheet result={result} onClose={handleCloseResult} />
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18233D",
    marginBottom: 16,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  resultLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  resultValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18233D",
  },

  closeButton: {
    marginTop: 20,
    height: 48,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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