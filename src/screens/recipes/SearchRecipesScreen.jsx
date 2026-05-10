import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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
    <View className="mb-4">
      <View className="flex-row items-center rounded-xl border border-gray-300 bg-white pr-2">
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
          className="h-12 flex-1 px-4 text-base text-gray-900"
          style={{ minHeight: 44 }}
        />
        {isFocused && value.trim().length > 0 ? (
          <Pressable
            onPress={onClear}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#1A6DB5]"
            hitSlop={8}
          >
            <Text className="text-lg font-semibold text-white">X</Text>
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
  const [allRecipes, setAllRecipes] = useState([]);
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
          setAllRecipes(list);
        }
      } catch (error) {
        if (active) {
          if (__DEV__) {
            console.warn("[SearchRecipes] recipeApi.searchRecipes failed:", error?.message ?? error);
          }
          setAllRecipes([]);
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
  }, [searchRequest]);

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
      ...allRecipes.map((item) => item.category),
    ]);
    return ["All", ...[...categories].sort()];
  }, [allRecipes]);

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((item) => {
      const matchesFilter =
        !selectedFilter || selectedFilter === "All" ? true : item.category === selectedFilter;
      const matchesQuery =
        debouncedQuery.length === 0 || item.title.toLowerCase().includes(debouncedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [allRecipes, selectedFilter, debouncedQuery]);

  const titleSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return [];
    }

    const source = allRecipes.filter((item) =>
      selectedFilter && selectedFilter !== "All" ? item.category === selectedFilter : true
    );
    const matchedTitles = source
      .map((item) => item.title)
      .filter((title) => title.toLowerCase().includes(normalized));

    return [...new Set(matchedTitles)].slice(0, 6);
  }, [query, allRecipes, selectedFilter]);

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
      <View className="items-center rounded-2xl bg-white px-4 py-8">
        <Text className="text-center text-lg text-slate-800">{message}</Text>
        {displayTerm.length > 0 ? (
          <Pressable
            onPress={handleClearSearch}
            className="mt-4 min-h-[44px] min-w-[120px] items-center justify-center rounded-xl border border-[#1A6DB5] px-4"
          >
            <Text className="text-base font-semibold text-[#1A6DB5]">Clear search</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-stone-100 px-4 pt-4" style={{ flex: 1 }}>
      <View className="mb-3 flex-row items-center">
        <Pressable
          onPress={() => navigation?.navigate?.("RecipeListScreen")}
          className="mr-3 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-white px-3"
          accessibilityRole="button"
          accessibilityLabel="Back to recipe list"
        >
          <Text className="text-lg font-semibold text-[#1A6DB5]">‹</Text>
        </Pressable>
        <Text className="flex-1 text-xl font-semibold text-slate-900">Search recipes</Text>
      </View>

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
        <View className="mb-4 rounded-xl border border-gray-200 bg-white">
          <Text className="px-4 pb-2 pt-3 text-sm font-semibold text-[#1A6DB5]">
            {query.trim().length === 0 ? "Recent searches" : "Suggestions"}
          </Text>
          {displayedSuggestions.length === 0 ? (
            <Text className="px-4 pb-4 text-base text-gray-500">
              {query.trim().length === 0 ? "No recent searches yet." : "No matching recipes."}
            </Text>
          ) : (
            <ScrollView
              style={[
                { maxHeight: 180 },
                Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
              ]}
              nestedScrollEnabled
              {...verticalScrollProps}
            >
              {displayedSuggestions.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => handleSuggestionPress(item)}
                  className="min-h-[44px] justify-center border-t border-gray-100 px-4 py-2"
                >
                  <Text className="text-base text-slate-800">{item}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      <FilterChips filters={filters} selectedFilter={selectedFilter} onSelect={setSelectedFilter} />

      {isLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color="#1A6DB5" />
          <Text className="mt-2 text-base text-[#1A6DB5]">Searching…</Text>
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
          { flex: 1, minHeight: 0 },
          Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
        ]}
        columnWrapperStyle={{
          marginBottom: COLUMN_GAP,
          columnGap: COLUMN_GAP,
          alignItems: "flex-start",
        }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={isLoading ? null : renderEmptyState}
      />
    </View>
  );
}
