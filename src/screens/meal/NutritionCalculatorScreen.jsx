import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import NutritionPieChart from "../../components/charts/NutritionPieChart";
import { SUMMARY_COLORS } from "./mealPlanUiHelpers";

export default function NutritionCalculatorScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchVisible) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const q = searchQuery.trim();
    if (q.length === 0) {
      setSearchResults([]);
      return;
    }

    const handler = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const response = await mealPlanApi.searchFood(q);
        const data = response?.data?.data || response?.data || [];
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, searchVisible]);

  const handleAddItem = (food) => {
    // Add default qty of 100g
    const newItem = {
      id: `${food.food_id || food.id}-${Date.now()}`,
      foodId: food.food_id || food.id,
      title: food.food_name || food.name,
      baseCalories: food.calories || 0,
      baseProtein: food.protein || 0,
      baseCarbs: food.carbs || 0,
      baseFat: food.fat || 0,
      qty: "100", // keep as string for TextInput
    };
    
    setItems((prev) => [...prev, newItem]);
    setSearchVisible(false);
  };

  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQty = (id, newQty) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: newQty } : item))
    );
  };

  // Derive calculated totals based on base (per 100g or per serving) * (qty / 100)
  // Assuming API search returns values per 100g
  const totals = useMemo(() => {
    let cal = 0, pro = 0, car = 0, f = 0;
    
    items.forEach((item) => {
      const q = parseFloat(item.qty) || 0;
      const ratio = q / 100;
      
      cal += item.baseCalories * ratio;
      pro += item.baseProtein * ratio;
      car += item.baseCarbs * ratio;
      f += item.baseFat * ratio;
    });

    return { cal, pro, car, f };
  }, [items]);

  const chartData = [
    { label: "Protein", value: Math.round(totals.pro * 4), colour: SUMMARY_COLORS.Protein },
    { label: "Carbs", value: Math.round(totals.car * 4), colour: SUMMARY_COLORS.Carbs },
    { label: "Fat", value: Math.round(totals.f * 9), colour: SUMMARY_COLORS.Fat },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>Nutrition Calculator</Text>
        <Pressable 
          style={[styles.clearBtn, items.length === 0 && styles.clearBtnDisabled]} 
          onPress={() => setItems([])}
          disabled={items.length === 0}
        >
          <Text style={[styles.clearBtnText, items.length === 0 && styles.clearBtnTextDisabled]}>
            Clear
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.chartContainer}>
          <NutritionPieChart data={chartData} />
          <View style={styles.totalKcalIndicator}>
            <Text style={styles.totalMacroRow}>
              Total Protein: {Math.round(totals.pro)}g  ·  Carbs: {Math.round(totals.car)}g  ·  Fat: {Math.round(totals.f)}g
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Ingredients ({items.length})</Text>
          <Pressable style={styles.addBtn} onPress={() => setSearchVisible(true)}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calculator-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No ingredients added</Text>
            <Text style={styles.emptySub}>
              Search and add ingredients to calculate their combined nutritional value.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const q = parseFloat(item.qty) || 0;
            const ratio = q / 100;
            const cal = Math.round(item.baseCalories * ratio);
            
            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTopRow}>
                  <Text style={styles.itemName}>{item.title}</Text>
                  <Pressable 
                    onPress={() => handleRemoveItem(item.id)}
                    hitSlop={10}
                  >
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </Pressable>
                </View>
                
                <View style={styles.itemBottomRow}>
                  <View style={styles.qtyControl}>
                    <TextInput
                      style={styles.qtyInput}
                      value={item.qty}
                      onChangeText={(val) => handleUpdateQty(item.id, val)}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <Text style={styles.qtyUnit}>grams</Text>
                  </View>
                  <Text style={styles.itemCal}>{cal} kcal</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Search Modal */}
      <Modal visible={searchVisible} animationType="slide" onRequestClose={() => setSearchVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.searchHeader}>
              <Pressable style={styles.searchCloseBtn} onPress={() => setSearchVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </Pressable>
              <TextInput
                style={styles.searchInput}
                placeholder="Search food database..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </Pressable>
              )}
            </View>

            <View style={styles.searchResultsWrap}>
              {searchLoading ? (
                <View style={styles.searchState}>
                  <ActivityIndicator size="large" color="#2A78C5" />
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => `${item.food_id || item.id}-${index}`}
                  contentContainerStyle={styles.searchList}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      style={styles.searchResultRow}
                      onPress={() => handleAddItem(item)}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultTitle}>
                          {item.food_name || item.name}
                        </Text>
                        <Text style={styles.searchResultCal}>
                          {Math.round(item.calories || 0)} cal / 100g
                        </Text>
                      </View>
                      <Ionicons name="add-circle-outline" size={24} color="#047857" />
                    </Pressable>
                  )}
                />
              ) : searchQuery.trim().length > 0 ? (
                <View style={styles.searchState}>
                  <Text style={styles.searchStateText}>No foods found for "{searchQuery}"</Text>
                </View>
              ) : (
                <View style={styles.searchState}>
                  <Ionicons name="search" size={48} color="#E5E7EB" />
                  <Text style={styles.searchStateText}>Type to search ingredients</Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  clearBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  clearBtnText: { fontSize: 15, fontWeight: "600", color: "#DC2626" },
  clearBtnDisabled: { opacity: 0.5 },
  clearBtnTextDisabled: { color: "#9CA3AF" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  chartContainer: {
    marginBottom: 24,
  },
  totalKcalIndicator: {
    alignItems: "center",
    marginTop: 8,
  },
  totalMacroRow: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 8,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#253B63",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A78C5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 14,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },

  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#253B63",
    marginRight: 12,
  },
  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  qtyInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    width: 48,
    textAlign: "center",
  },
  qtyUnit: {
    fontSize: 14,
    color: "#6B7280",
    marginLeft: 4,
  },
  itemCal: {
    fontSize: 16,
    fontWeight: "700",
    color: "#047857",
  },

  modalSafeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  modalOverlay: { flex: 1 },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchCloseBtn: { padding: 8 },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#111827",
    paddingHorizontal: 8,
  },
  clearSearchBtn: { padding: 8 },
  searchResultsWrap: { flex: 1, backgroundColor: "#F9FAFB" },
  searchList: { paddingBottom: 40 },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultInfo: { flex: 1, marginRight: 16 },
  searchResultTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 2 },
  searchResultCal: { fontSize: 13, color: "#6B7280" },
  searchState: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  searchStateText: { marginTop: 12, fontSize: 15, color: "#9CA3AF" },
});