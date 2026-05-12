import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import recipeApi from "../../api/recipeApi";
import {
  COLUMN_GAP,
  extractRecipeList,
  FilterChips,
  normalizeRecipe,
  RecipeCard,
  useRecipeCardWidth,
} from "./RecipeListScreen";
import { useUser } from "../../context/UserContext";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  primary: "#1A6DB5",
  stone100: "#f5f5f4",
  slate900: "#0f172a",
  slate800: "#1e293b",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  white: "#fff",
};

const SURFACE_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};
const SURFACE_SHADOW_SUBTLE = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 1,
};

const flatListScrollProps = {
  bounces: false,
  alwaysBounceVertical: false,
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android"
    ? { overScrollMode: "never", removeClippedSubviews: false }
    : {}),
};

const verticalScrollProps = {
  keyboardShouldPersistTaps: "handled",
  bounces: false,
  alwaysBounceVertical: false,
  ...(Platform.OS === "ios"
    ? {
        decelerationRate: "normal",
      }
    : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};

const SEARCH_DEBOUNCE_MS = 300;
const MAX_RECENT_SEARCHES = 5;
const RECENT_SEARCHES_STORAGE_KEY = "nutrihelp.recentRecipeSearches";

function extractUserId(user) {
  const candidates = [user?.id, user?.userId, user?.user_id, user?.profile?.id];
  for (const value of candidates) {
    if (value == null || value === "") {
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

/** Request payload: category + query are both sent when set (combined server-side filter). */
function buildSearchRequest(debouncedSearch, category) {
  const params = {};
  if (debouncedSearch.length > 0) {
    params.query = debouncedSearch;
  }
  if (category && category !== "All") {
    params.category = category;
  }
  return params;
}

function DebouncedSearchBar({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  isFocused,
  onFocus,
  onBlur,
  onClear,
  onSubmitEditing,
}) {
  return (
    <View style={styles.searchBarWrap}>
      <View style={styles.searchRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {isFocused && value.trim().length > 0 ? (
          <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
            <Text style={styles.clearBtnText}>X</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function SearchRecipesScreen({ navigation }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const effectiveUserId = userId ?? 0;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [remoteRecipes, setRemoteRecipes] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentHydrated, setRecentHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const cardWidth = useRecipeCardWidth();
  const lastRecordedDebouncedRef = useRef("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        if (cancelled || raw == null) {
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(
            parsed
              .filter((item) => typeof item === "string" && item.trim().length > 0)
              .slice(0, MAX_RECENT_SEARCHES)
          );
        }
      } catch {
        /* ignore corrupt storage */
      } finally {
        if (!cancelled) {
          setRecentHydrated(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recentHydrated) {
      return;
    }
    (async () => {
      try {
        if (recentSearches.length === 0) {
          await AsyncStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
        } else {
          await AsyncStorage.setItem(
            RECENT_SEARCHES_STORAGE_KEY,
            JSON.stringify(recentSearches)
          );
        }
      } catch {
        /* ignore */
      }
    })();
  }, [recentSearches, recentHydrated]);

  const searchRequest = useMemo(
    () => buildSearchRequest(debouncedQuery, selectedFilter),
    [debouncedQuery, selectedFilter]
  );

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      setIsLoading(true);

      try {
        const response = await recipeApi.searchRecipes({
          ...searchRequest,
          user_id: effectiveUserId,
        });
        const list = extractRecipeList(response).map(normalizeRecipe);
        if (active) {
          setRemoteRecipes(list);
        }
      } catch (error) {
        if (active) {
          if (__DEV__) {
            console.warn("[SearchRecipes] recipeApi.searchRecipes failed:", error?.message ?? error);
          }
          setRemoteRecipes([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    runSearch();

    return () => {
      active = false;
    };
  }, [searchRequest, effectiveUserId]);

  /** Record a completed debounced search so typing (not only Enter) fills recents; skip when only the category filter changes. */
  useEffect(() => {
    if (!debouncedQuery) {
      lastRecordedDebouncedRef.current = "";
      return;
    }
    if (!recentHydrated || isLoading) {
      return;
    }
    if (lastRecordedDebouncedRef.current === debouncedQuery) {
      return;
    }
    lastRecordedDebouncedRef.current = debouncedQuery;

    const displayTerm =
      query.trim().length > 0 && query.trim().toLowerCase() === debouncedQuery
        ? query.trim()
        : debouncedQuery;

    setRecentSearches((prev) => {
      const withoutDuplicate = prev.filter(
        (item) => item.toLowerCase() !== debouncedQuery.toLowerCase()
      );
      return [displayTerm, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
    });
  }, [recentHydrated, isLoading, debouncedQuery, query]);

  const filters = useMemo(() => {
    const categories = new Set([
      ...remoteRecipes.map((item) => item.category),
    ]);
    return ["All", ...[...categories].sort()];
  }, [remoteRecipes]);

  const filteredRecipes = useMemo(() => {
    return remoteRecipes.filter((item) => {
      const matchesFilter =
        !selectedFilter || selectedFilter === "All" ? true : item.category === selectedFilter;
      const matchesQuery =
        debouncedQuery.length === 0 || item.title.toLowerCase().includes(debouncedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [remoteRecipes, selectedFilter, debouncedQuery]);

  const titleSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return [];
    }

    const source = remoteRecipes.filter((item) =>
      selectedFilter && selectedFilter !== "All" ? item.category === selectedFilter : true
    );
    const matchedTitles = source
      .map((item) => item.title)
      .filter((title) => title.toLowerCase().includes(normalized));

    return [...new Set(matchedTitles)].slice(0, 6);
  }, [query, remoteRecipes, selectedFilter]);

  const displayedSuggestions =
    query.trim().length === 0 ? recentSearches : titleSuggestions;

  const commitSearch = (text) => {
    const normalized = text.trim();
    setQuery(normalized);
    setDebouncedQuery(normalized.toLowerCase());

    if (!normalized) {
      return;
    }

    setRecentSearches((prev) => {
      const withoutDuplicate = prev.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase()
      );
      return [normalized, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const handleClearSearch = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  const handleSuggestionPress = (item) => {
    commitSearch(item);
    setIsSearchFocused(false);
  };

  const handleRecipePress = (recipe) => {
    navigation?.navigate?.("RecipeDetailScreen", {
      recipeId: recipe.id,
      recipe,
    });
  };

  const renderEmptyState = () => {
    const rawTerm = query.trim();
    const appliedTerm = debouncedQuery;
    const displayTerm =
      rawTerm.length > 0
        ? rawTerm
        : appliedTerm.length > 0
          ? appliedTerm
          : "";

    const categoryPhrase =
      selectedFilter && selectedFilter !== "All" ? ` in ${selectedFilter}` : "";

    let message;
    if (displayTerm.length > 0) {
      message = `No recipes found for "${displayTerm}"${categoryPhrase}.`;
    } else if (selectedFilter && selectedFilter !== "All") {
      message = `No recipes found in "${selectedFilter}".`;
    } else {
      message = "No recipes match your search.";
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyMessage}>{message}</Text>
        {displayTerm.length > 0 ? (
          <Pressable onPress={handleClearSearch} style={styles.emptyClearBtn}>
            <Text style={styles.emptyClearText}>Clear search</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.pageChrome}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color="#253B63" />
        </Pressable>
        <Text style={styles.headerTitle}>Search recipes</Text>
        <View style={styles.headerSpacer} />
      </View>
      <View style={styles.screenBody}>
      <DebouncedSearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search recipes…"
        autoFocus
        isFocused={isSearchFocused}
        onFocus={() => setIsSearchFocused(true)}
        onBlur={() => {
          setTimeout(() => setIsSearchFocused(false), 120);
        }}
        onClear={handleClearSearch}
        onSubmitEditing={() => commitSearch(query)}
      />

      {isSearchFocused ? (
        <View style={styles.suggestionsPanel}>
          <Text style={styles.suggestionsHeading}>
            {query.trim().length === 0 ? "Recent searches" : "Suggestions"}
          </Text>
          {displayedSuggestions.length === 0 ? (
            <Text style={styles.suggestionsEmpty}>
              {query.trim().length === 0 ? "No recent searches yet." : "No matching recipes."}
            </Text>
          ) : (
            <ScrollView
              style={[
                styles.suggestionsScroll,
                Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
              ]}
              nestedScrollEnabled
              {...verticalScrollProps}
            >
              {displayedSuggestions.map((item) => (
                <Pressable key={item} onPress={() => handleSuggestionPress(item)} style={styles.suggestionRow}>
                  <Text style={styles.suggestionText}>{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      <FilterChips filters={filters} selectedFilter={selectedFilter} onSelect={setSelectedFilter} />

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : null}

      <FlatList
        data={isLoading ? [] : filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard recipe={item} onPress={handleRecipePress} cardWidth={cardWidth} />
        )}
        numColumns={2}
        {...flatListScrollProps}
        style={[
          styles.list,
          Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
        ]}
        columnWrapperStyle={{
          marginBottom: COLUMN_GAP,
          columnGap: COLUMN_GAP,
          alignItems: "flex-start",
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? null : renderEmptyState}
      />
      </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  pageChrome: { flex: 1 },
  /** AI Meal Plan (`PersonalisedPlanForm`) header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#253B63",
  },
  headerSpacer: { width: 44 },
  screenBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: "#F8FAFC",
  },
  searchBarWrap: { marginBottom: 16 },
  searchRow: {
    ...SURFACE_SHADOW_SUBTLE,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingRight: 8,
  },
  searchInput: {
    height: 48,
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111827",
    minHeight: 44,
  },
  clearBtn: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: C.primary,
  },
  clearBtnText: { fontSize: 18, fontWeight: "600", color: C.white },
  suggestionsPanel: {
    ...SURFACE_SHADOW,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
  },
  suggestionsHeading: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: C.primary,
  },
  suggestionsEmpty: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    fontSize: 16,
    color: C.gray500,
  },
  suggestionsScroll: { maxHeight: 180 },
  suggestionRow: {
    minHeight: 44,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: C.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 16, color: C.slate800 },
  loadingRow: { alignItems: "center", paddingVertical: 24 },
  loadingText: { marginTop: 8, fontSize: 16, color: C.primary },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingBottom: 24 },
  emptyState: {
    ...SURFACE_SHADOW,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyMessage: { textAlign: "center", fontSize: 18, color: C.slate800 },
  emptyClearBtn: {
    marginTop: 16,
    minHeight: 44,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.primary,
    paddingHorizontal: 16,
  },
  emptyClearText: { fontSize: 16, fontWeight: "600", color: C.primary },
});
