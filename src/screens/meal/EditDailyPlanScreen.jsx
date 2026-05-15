import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useUser } from "../../context/UserContext";
import { useFormValidation } from "../../hooks/useFormValidation";
import { formatDisplayName, groupMealsByType, MEAL_TYPES } from "./mealPlanUiHelpers";
import LoadingSpinner from "../../components/common/LoadingSpinner";

function formatScreenDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export default function EditDailyPlanScreen({ navigation, route }) {
  const { user } = useUser();
  const selectedDate = route?.params?.date || new Date().toISOString().slice(0, 10);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slots, setSlots] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  const [searchVisible, setSearchVisible] = useState(false);
  const [activeSlotName, setActiveSlotName] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const { errors, validate, clearErrors } = useFormValidation();
  const [formError, setFormError] = useState("");

  // Load initial data
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const response = await mealPlanApi.getWeeklyPlan({ userId: user?.id });
        if (!cancelled) {
          const rawItems = response?.data?.items || response?.items || response?.mealPlans || [];
          const groups = groupMealsByType(rawItems, selectedDate);
          
          const newSlots = { breakfast: [], lunch: [], dinner: [], snack: [] };
          groups.forEach((g) => {
            if (g.hasLiveData && g.recipes) {
              const type = g.mealType.toLowerCase();
              if (newSlots[type] !== undefined) {
                newSlots[type] = g.recipes;
              }
            }
          });
          setSlots(newSlots);
        }
      } catch (err) {
        // Fallback to empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => { cancelled = true; };
  }, [selectedDate, user?.id]);

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
        const items = response?.data?.data || response?.data || [];
        setSearchResults(Array.isArray(items) ? items : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, searchVisible]);

  const openSearch = (mealType) => {
    setActiveSlotName(mealType);
    setSearchVisible(true);
  };

  const closeSearch = () => {
    setSearchVisible(false);
    setActiveSlotName(null);
  };

  const handleAddItem = (item) => {
    if (!activeSlotName) return;
    
    // Normalize food item to match recipe shape for UI helpers if needed
    const normalized = {
      id: item.food_id || item.id,
      title: item.food_name || item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
    };

    setSlots((prev) => ({
      ...prev,
      [activeSlotName]: [...prev[activeSlotName], normalized]
    }));
    
    closeSearch();
    clearErrors();
    setFormError("");
  };

  const handleRemoveItem = (mealType, index) => {
    setSlots((prev) => {
      const arr = [...prev[mealType]];
      arr.splice(index, 1);
      return { ...prev, [mealType]: arr };
    });
  };

  const handleSave = async () => {
    setFormError("");
    
    // Validation: at least 1 overall meal
    const totalItems = Object.values(slots).reduce((sum, arr) => sum + arr.length, 0);
    if (totalItems === 0) {
      setFormError("At least 1 meal is required to save the daily plan.");
      return;
    }

    setSaving(true);
    try {
      const promises = MEAL_TYPES.map((mealType) => {
        const items = slots[mealType];
        const recipeIds = items.map((i) => i.id);
        
        // Always call updateDailyPlan; the backend handles empty arrays.
        return mealPlanApi.updateDailyPlan({
          recipe_ids: recipeIds,
          meal_type: mealType,
          user_id: user?.id,
          date: selectedDate,
        });
      });

      await Promise.all(promises);
      navigation.goBack();
    } catch (err) {
      setFormError(err?.message || "Failed to save meal plan. Please try again.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <LoadingSpinner message="Loading your daily plan..." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Plan</Text>
        <Pressable style={styles.headerBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.dateLabel}>{formatScreenDate(selectedDate)}</Text>
        
        {formError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorBannerText}>{formError}</Text>
          </View>
        ) : null}

        {MEAL_TYPES.map((mealType) => {
          const items = slots[mealType];
          
          return (
            <View key={mealType} style={styles.slotBlock}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotTitle}>{formatDisplayName(mealType)}</Text>
              </View>

              <View style={styles.slotItems}>
                {items.length === 0 ? (
                  <Text style={styles.emptySlotText}>No items added</Text>
                ) : (
                  items.map((item, idx) => (
                    <View key={`${item.id}-${idx}`} style={styles.slotItemRow}>
                      <View style={styles.slotItemInfo}>
                        <Text style={styles.slotItemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.slotItemCal}>
                          {Math.round(item.calories || 0)} cal
                        </Text>
                      </View>
                      <Pressable 
                        style={styles.removeBtn}
                        onPress={() => handleRemoveItem(mealType, idx)}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  ))
                )}
              </View>

              <Pressable
                style={styles.addBtn}
                onPress={() => openSearch(mealType)}
              >
                <Ionicons name="add" size={18} color="#2A78C5" />
                <Text style={styles.addBtnText}>Add to {formatDisplayName(mealType)}</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      {/* Full screen Search Modal */}
      <Modal visible={searchVisible} animationType="slide" onRequestClose={closeSearch}>
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.searchHeader}>
              <Pressable style={styles.searchCloseBtn} onPress={closeSearch}>
                <Ionicons name="arrow-back" size={24} color="#374151" />
              </Pressable>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search for ${activeSlotName}...`}
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
                          {Math.round(item.calories || 0)} cal
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
                  <Text style={styles.searchStateText}>Search the database by name</Text>
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
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  
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
  headerBtn: {
    paddingHorizontal: 12,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  saveText: { fontSize: 16, fontWeight: "700", color: "#047857" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  
  dateLabel: {
    fontSize: 22,
    fontWeight: "800",
    color: "#253B63",
    marginBottom: 16,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorBannerText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "500",
    flex: 1,
  },

  slotBlock: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  slotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  
  slotItems: {
    marginBottom: 12,
  },
  emptySlotText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontStyle: "italic",
    paddingVertical: 4,
  },
  slotItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  slotItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  slotItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  slotItemCal: {
    fontSize: 12,
    color: "#6B7280",
  },
  removeBtn: {
    padding: 4,
  },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 4,
  },
  addBtnText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#2A78C5",
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchCloseBtn: {
    padding: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#111827",
    paddingHorizontal: 8,
  },
  clearSearchBtn: {
    padding: 8,
  },
  searchResultsWrap: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchList: {
    paddingBottom: 40,
  },
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
  searchResultInfo: {
    flex: 1,
    marginRight: 16,
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  searchResultCal: {
    fontSize: 13,
    color: "#6B7280",
  },
  searchState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  searchStateText: {
    marginTop: 12,
    fontSize: 15,
    color: "#9CA3AF",
  },
});