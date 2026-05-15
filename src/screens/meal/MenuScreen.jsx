import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import mealPlanApi from "../../api/mealPlanApi";
import BottomSheet from "../../components/common/BottomSheet";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Protein", "Dairy", "Snacks", "Meals"];

export default function MenuScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Initial load / search
  useEffect(() => {
    let cancelled = false;

    async function doSearch() {
      if (searchQuery.trim().length === 0) {
        // Load default results or empty
        setLoading(true);
        try {
          const res = await mealPlanApi.searchFood(""); // backend limits or returns all for empty
          if (!cancelled) setResults(res?.data?.data || res?.data || []);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const res = await mealPlanApi.searchFood(searchQuery.trim());
        if (!cancelled) setResults(res?.data?.data || res?.data || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const handler = setTimeout(doSearch, 300);
    return () => {
      cancelled = true;
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const filteredResults = useMemo(() => {
    if (selectedCategory === "All") return results;
    return results.filter(
      (item) => String(item.category || "").toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [results, selectedCategory]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSheetVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Food Database</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods, ingredients..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable style={styles.clearSearch} onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[
                styles.filterChip,
                selectedCategory === cat && styles.filterChipActive
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text 
                style={[
                  styles.filterChipText, 
                  selectedCategory === cat && styles.filterChipTextActive
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.mainContent}>
          <LoadingSpinner message="Searching database..." />
        </View>
      ) : filteredResults.length === 0 ? (
        <View style={styles.mainContent}>
          <EmptyState
            icon="search-outline"
            title="No Results Found"
            message={`We couldn't find any items matching "${searchQuery}".`}
          />
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) => `${item.food_id || item.id}-${index}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => handleSelectItem(item)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{item.food_name || item.name}</Text>
                {item.category && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.cardCal}>{Math.round(item.calories || 0)} kcal</Text>
                <Text style={styles.cardUnit}>per 100g</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </Pressable>
          )}
        />
      )}

      {selectedItem && (
        <BottomSheet
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          title={selectedItem.food_name || selectedItem.name}
        >
          <View style={styles.bsContent}>
            <Text style={styles.bsSubtitle}>Nutritional Breakdown (per 100g)</Text>
            
            <View style={styles.macroGrid}>
              <View style={[styles.macroBox, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
                <Text style={styles.macroBoxVal}>{Math.round(selectedItem.calories || 0)}</Text>
                <Text style={styles.macroBoxLabel}>Calories</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}>
                <Text style={styles.macroBoxVal}>{Math.round(selectedItem.protein || 0)}g</Text>
                <Text style={styles.macroBoxLabel}>Protein</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
                <Text style={styles.macroBoxVal}>{Math.round(selectedItem.carbs || 0)}g</Text>
                <Text style={styles.macroBoxLabel}>Carbs</Text>
              </View>
              <View style={[styles.macroBox, { backgroundColor: "#F3E8FF", borderColor: "#E9D5FF" }]}>
                <Text style={styles.macroBoxVal}>{Math.round(selectedItem.fat || 0)}g</Text>
                <Text style={styles.macroBoxLabel}>Fat</Text>
              </View>
            </View>

            <View style={styles.microList}>
              <View style={styles.microRow}>
                <Text style={styles.microLabel}>Fiber</Text>
                <Text style={styles.microVal}>{Math.round(selectedItem.fiber || 0)}g</Text>
              </View>
              <View style={styles.microRow}>
                <Text style={styles.microLabel}>Sugar</Text>
                <Text style={styles.microVal}>{Math.round(selectedItem.sugar || 0)}g</Text>
              </View>
              <View style={styles.microRow}>
                <Text style={styles.microLabel}>Sodium</Text>
                <Text style={styles.microVal}>{Math.round(selectedItem.sodium || 0)}mg</Text>
              </View>
            </View>
            
            <Pressable
              style={styles.bsCloseBtn}
              onPress={() => setSheetVisible(false)}
            >
              <Text style={styles.bsCloseBtnText}>Close</Text>
            </Pressable>
          </View>
        </BottomSheet>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#253B63",
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  clearSearch: { padding: 4 },
  
  filterWrap: {
    marginBottom: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterChipActive: {
    backgroundColor: "#2A78C5",
    borderColor: "#2A78C5",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },

  mainContent: {
    flex: 1,
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardInfo: { flex: 1, marginRight: 12 },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  
  cardStats: { alignItems: "flex-end", marginRight: 10 },
  cardCal: { fontSize: 15, fontWeight: "800", color: "#047857" },
  cardUnit: { fontSize: 11, color: "#9CA3AF" },

  bsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  bsSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    fontWeight: "500",
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  macroBox: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  macroBoxVal: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  macroBoxLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  
  microList: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    marginBottom: 24,
  },
  microRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  microLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  microVal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  bsCloseBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  bsCloseBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
});