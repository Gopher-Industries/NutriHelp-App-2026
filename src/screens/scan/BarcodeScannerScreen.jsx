import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import baseApi from "../../api/baseApi";

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [nutritionResult, setNutritionResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [lastBarcode, setLastBarcode] = useState("");

  const askForCamera = async () => {
    setHasSeenIntro(true);
    await requestPermission();
  };

  const scanBarcode = async (barcode) => {
    const cleanBarcode = barcode.trim();

    if (!cleanBarcode || loading) return;
    if (scanned && cleanBarcode === lastBarcode) return;

    setScanned(true);
    setLoading(true);
    setLastBarcode(cleanBarcode);

    try {
      console.log("SENDING BARCODE:", cleanBarcode);

      const data = await baseApi.get(`/api/barcode/${cleanBarcode}`);

      console.log("SUCCESS RESPONSE:", data);

      setNutritionResult(data);
      setShowResult(true);
    } catch (error) {
      console.log("BARCODE ERROR:", error?.data || error.message || error);

      Alert.alert(
        "Barcode not found",
        "We could not find nutrition information for this barcode. You can try again or enter it manually."
      );

      setScanned(false);
      setLastBarcode("");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Missing barcode", "Please enter a barcode first.");
      return;
    }

    scanBarcode(manualCode);
  };

  const closeResultSheet = () => {
    setShowResult(false);
    setNutritionResult(null);
    setScanned(false);
    setLastBarcode("");
    setManualCode("");
  };

  if (!hasSeenIntro) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Scan food barcodes</Text>

        <Text style={styles.bodyText}>
          NutriHelp uses your camera to scan barcode numbers and show nutrition
          information. You can also enter the barcode manually.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={askForCamera}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>

        <ManualInput
          manualCode={manualCode}
          setManualCode={setManualCode}
          handleManualSubmit={handleManualSubmit}
        />
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.helperText}>Checking camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Camera access denied</Text>

        <Text style={styles.bodyText}>
          No worries. You can still enter the barcode manually below.
        </Text>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.secondaryButtonText}>Open Settings</Text>
        </TouchableOpacity>

        <ManualInput
          manualCode={manualCode}
          setManualCode={setManualCode}
          handleManualSubmit={handleManualSubmit}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr"],
        }}
        onBarcodeScanned={
          loading || scanned ? undefined : ({ data }) => scanBarcode(data)
        }
      >
        <View style={styles.overlay}>
          <Text style={styles.scanTitle}>Scan barcode</Text>

          <Text style={styles.scanHelper}>
            Place the barcode inside the frame
          </Text>

          <View style={styles.scanBox} />

          <TouchableOpacity
            style={styles.torchButton}
            onPress={() => setTorchOn((current) => !current)}
          >
            <Text style={styles.torchText}>
              {torchOn ? "Turn flash off" : "Turn flash on"}
            </Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Checking nutrition info...</Text>
        </View>
      )}

      <View style={styles.manualContainer}>
        <ManualInput
          manualCode={manualCode}
          setManualCode={setManualCode}
          handleManualSubmit={handleManualSubmit}
        />
      </View>

      {showResult && (
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>Nutrition result</Text>

          <Text style={styles.resultText}>
            {nutritionResult?.name ||
              nutritionResult?.productName ||
              nutritionResult?.product?.name ||
              "Product found"}
          </Text>

          <Text style={styles.resultText}>
            Calories:{" "}
            {nutritionResult?.calories ||
              nutritionResult?.product?.calories ||
              "N/A"}
          </Text>

          <Text style={styles.resultText}>
            Protein:{" "}
            {nutritionResult?.protein ||
              nutritionResult?.product?.protein ||
              "N/A"}
          </Text>

          <Text style={styles.resultText}>
            Carbs:{" "}
            {nutritionResult?.carbs || nutritionResult?.product?.carbs || "N/A"}
          </Text>

          <Text style={styles.resultText}>
            Fat:{" "}
            {nutritionResult?.fat || nutritionResult?.product?.fat || "N/A"}
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={closeResultSheet}
          >
            <Text style={styles.primaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ManualInput({ manualCode, setManualCode, handleManualSubmit }) {
  return (
    <View style={styles.manualInputBox}>
      <Text style={styles.manualLabel}>Enter barcode manually</Text>

      <TextInput
        style={styles.input}
        value={manualCode}
        onChangeText={setManualCode}
        placeholder="Enter barcode number"
        keyboardType="number-pad"
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleManualSubmit}>
        <Text style={styles.primaryButtonText}>Submit barcode</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  scanTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  scanHelper: {
    color: "#fff",
    fontSize: 15,
    marginBottom: 32,
    textAlign: "center",
  },
  scanBox: {
    width: 260,
    height: 160,
    borderWidth: 3,
    borderColor: "#22c55e",
    borderRadius: 16,
  },
  torchButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  torchText: {
    color: "#fff",
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
  },
  manualContainer: {
    backgroundColor: "#fff",
    padding: 16,
  },
  manualInputBox: {
    width: "100%",
    marginTop: 20,
  },
  manualLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#374151",
  },
  permissionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#111827",
  },
  bodyText: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 20,
    lineHeight: 22,
  },
  helperText: {
    marginTop: 12,
    color: "#6b7280",
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#16a34a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 15,
  },
});