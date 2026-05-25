import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { getScanHistory } from "../../utils/scanHistoryStorage";

function DetailSheet({ item, onClose }) {
  if (!item) return null;
  const hasAllergens = item.productAllergens?.length > 0;
  const savedAt = item.saved_at
    ? new Date(item.saved_at).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : item.date || "";

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.sheetEyebrow}>Scan History</Text>
          <Text style={styles.sheetTitle} numberOfLines={2}>{item.label}</Text>

          {/* Allergen status */}
          <View style={styles.allergenCard}>
            <View style={styles.allergenCardLeft}>
              <Ionicons
                name={hasAllergens ? "warning-outline" : "shield-checkmark-outline"}
                size={22}
                color={hasAllergens ? "#F59E0B" : "#22C55E"}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.allergenLabel}>Product Allergens</Text>
                <Text style={[styles.allergenStatus, { color: hasAllergens ? "#F59E0B" : "#22C55E" }]}>
                  {hasAllergens
                    ? `Contains ${item.productAllergens.length} allergen${item.productAllergens.length > 1 ? "s" : ""}`
                    : "No allergens declared"}
                </Text>
              </View>
            </View>
            <View style={[styles.chip, hasAllergens ? styles.chipWarning : styles.chipSafe]}>
              <Text style={styles.chipText}>{hasAllergens ? "Check" : "Clear"}</Text>
            </View>
          </View>

          {/* Metrics row */}
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.barcode ?? "--"}</Text>
              <Text style={styles.metricLabel}>Barcode</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.detectedIngredients?.length || 0}</Text>
              <Text style={styles.metricLabel}>Ingredients</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{item.productAllergens?.length || 0}</Text>
              <Text style={styles.metricLabel}>Allergens</Text>
            </View>
          </View>

          {/* Allergens list */}
          {hasAllergens && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Contains allergens</Text>
              <Text style={styles.infoCardText}>{item.productAllergens.join(", ")}</Text>
            </View>
          )}

          {/* Ingredients list */}
          {item.detectedIngredients?.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Ingredients</Text>
              <Text style={styles.infoCardText}>{item.detectedIngredients.join(", ")}</Text>
            </View>
          )}

          {/* Saved date */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Scanned on</Text>
            <Text style={styles.infoCardText}>{savedAt}</Text>
          </View>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function HistoryItem({ item, onPress }) {
  const savedAt = item.saved_at
    ? new Date(item.saved_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : item.date || "";
  const hasAllergens = item.productAllergens?.length > 0;

  return (
    <Pressable style={styles.historyItem} onPress={() => onPress(item)}>
      <View style={styles.historyIconWrap}>
        <Ionicons name="barcode-outline" size={18} color="#2A78C5" />
      </View>
      <View style={styles.historyInfo}>
        <Text style={styles.historyName} numberOfLines={1}>{item.label}</Text>
        <Text style={styles.historyMeta}>
          {item.barcode ? `${item.barcode} · ` : ""}{savedAt}
        </Text>
      </View>
      {hasAllergens && (
        <View style={styles.allergenDot}>
          <Ionicons name="warning-outline" size={14} color="#F59E0B" />
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </Pressable>
  );
}

export default function ScanProductScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useFocusEffect(
    useCallback(() => {
      getScanHistory().then(setHistory).catch(() => setHistory([]));
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Product Scan</Text>
        <Text style={styles.pageSubtitle}>Identify products with barcode scanning</Text>

        <Pressable
          style={styles.scanCard}
          onPress={() => navigation.navigate("BarcodeScannerScreen")}
        >
          <View style={styles.scanIconWrap}>
            <Ionicons name="barcode-outline" size={32} color="#2A78C5" />
          </View>
          <View style={styles.scanCardText}>
            <Text style={styles.scanCardTitle}>Scan Barcode</Text>
            <Text style={styles.scanCardDesc}>Point camera at a product barcode or enter manually</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </Pressable>

        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Scans</Text>
          {history.length > 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{history.length}</Text>
            </View>
          )}
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyText}>No scans yet</Text>
            <Text style={styles.emptySubtext}>Scan a barcode to see results here</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <HistoryItem item={item} onPress={setSelected} />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </View>

      <DetailSheet item={selected} onClose={() => setSelected(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  pageTitle: { fontSize: 30, fontWeight: "800", color: "#253B63", marginBottom: 4 },
  pageSubtitle: { fontSize: 14, color: "#66758F", marginBottom: 22 },

  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    padding: 16,
    marginBottom: 28,
    gap: 14,
  },
  scanIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  scanCardText: { flex: 1 },
  scanCardTitle: { fontSize: 16, fontWeight: "700", color: "#253B63", marginBottom: 3 },
  scanCardDesc: { fontSize: 13, color: "#667085", lineHeight: 18 },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: { fontSize: 17, fontWeight: "700", color: "#253B63" },
  historyBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  historyBadgeText: { fontSize: 12, fontWeight: "700", color: "#2A78C5" },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 80,
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#94A3B8" },
  emptySubtext: { fontSize: 13, color: "#CBD5E1" },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: "600", color: "#253B63", marginBottom: 2 },
  historyMeta: { fontSize: 12, color: "#94A3B8" },
  allergenDot: { marginRight: 2 },

  // Detail sheet
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#2A78C5",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 24, fontWeight: "800", color: "#253B63", marginBottom: 16 },

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
  allergenLabel: { fontSize: 12, color: "#94A3B8", fontWeight: "500", marginBottom: 2 },
  allergenStatus: { fontSize: 14, fontWeight: "700" },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipSafe: { backgroundColor: "#DCFCE7" },
  chipWarning: { backgroundColor: "#FEF3C7" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#374151" },

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

  closeBtn: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  closeBtnText: { fontSize: 15, fontWeight: "600", color: "#667085" },
});
