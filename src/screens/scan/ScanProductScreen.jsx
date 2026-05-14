import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const METHODS = [
  {
    key: "barcode",
    icon: "barcode-outline",
    label: "Barcode",
    description: "Scan the barcode on the product packaging",
    routeName: "BarcodeScannerScreen",
    accent: "#3B82F6",
  },
  {
    key: "image",
    icon: "camera-outline",
    label: "Photo",
    description: "Take or upload a photo of the food item",
    routeName: "ProductScanScreen",
    accent: "#F59E0B",
  },
];

export default function ScanProductScreen({ navigation, route }) {
  const selectedKey = route?.params?.method === "image" ? "image" : "barcode";

  const handleSelect = (key) => navigation.setParams({ method: key });

  const handleGo = () => {
    const method = METHODS.find((m) => m.key === selectedKey);
    if (method) navigation.navigate(method.routeName);
  };

  const selected = METHODS.find((m) => m.key === selectedKey);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.canGoBack() && navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#667085" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
        </View>

        <Text style={styles.pageTitle}>Scan Food</Text>
        <Text style={styles.pageSubtitle}>Choose a method to identify your food</Text>

        {/* Method cards */}
        <View style={styles.methodRow}>
          {METHODS.map((m) => {
            const active = m.key === selectedKey;
            return (
              <Pressable
                key={m.key}
                style={[styles.methodCard, active && { borderColor: m.accent, borderWidth: 2 }]}
                onPress={() => handleSelect(m.key)}
              >
                <View style={[styles.methodIconWrap, { backgroundColor: active ? m.accent + "18" : "#F1F5F9" }]}>
                  <Ionicons name={m.icon} size={28} color={active ? m.accent : "#94A3B8"} />
                </View>
                <Text style={[styles.methodLabel, active && { color: m.accent }]}>{m.label}</Text>
                <Text style={styles.methodDesc}>{m.description}</Text>
                {active && (
                  <View style={[styles.activeDot, { backgroundColor: m.accent }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Action card */}
        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <Ionicons name={selected.icon} size={20} color="#2A78C5" />
            <Text style={styles.actionTitle}>
              {selectedKey === "barcode" ? "Scan Barcode" : "Scan by Image"}
            </Text>
          </View>
          <Text style={styles.actionDesc}>
            {selectedKey === "barcode"
              ? "Point your camera at a barcode, or enter the number manually."
              : "Take a clear photo of the food item for AI analysis."}
          </Text>
          <Pressable style={styles.goBtn} onPress={handleGo}>
            <Ionicons name="scan-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.goBtnText}>
              {selectedKey === "barcode" ? "Open Scanner" : "Open Camera"}
            </Text>
          </Pressable>
        </View>

        {/* How to use */}
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>How to use</Text>
          {selectedKey === "barcode" ? (
            <>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Point camera at the barcode on the product</Text>
              </View>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Hold steady until the barcode is detected</Text>
              </View>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Or type the numbers under the barcode manually</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Take a clear, well-lit photo of the food</Text>
              </View>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Make sure the food fills most of the frame</Text>
              </View>
              <View style={styles.helpRow}>
                <View style={styles.helpBullet} />
                <Text style={styles.helpText}>Or choose an existing photo from your library</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 16, color: "#667085" },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },

  pageTitle: { fontSize: 32, fontWeight: "800", color: "#253B63", marginBottom: 6 },
  pageSubtitle: { fontSize: 15, color: "#66758F", marginBottom: 24 },

  methodRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  methodCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  methodIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  methodLabel: { fontSize: 15, fontWeight: "700", color: "#253B63", marginBottom: 4 },
  methodDesc: { fontSize: 12, color: "#94A3B8", textAlign: "center", lineHeight: 17 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
  },

  actionCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  actionTitle: { fontSize: 16, fontWeight: "700", color: "#253B63" },
  actionDesc: { fontSize: 14, color: "#667085", lineHeight: 21, marginBottom: 16 },
  goBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#2A78C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },

  helpCard: {
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 18,
  },
  helpTitle: { fontSize: 15, fontWeight: "700", color: "#253B63", marginBottom: 12 },
  helpRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  helpBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2A78C5",
    marginTop: 6,
  },
  helpText: { flex: 1, fontSize: 14, color: "#667085", lineHeight: 21 },
});
