import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import recipeApi from "../../api/recipeApi";
import {
  COLUMN_GAP,
  FilterChips,
  normalizeRecipe,
  RecipeCard,
} from "./RecipeListScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  primary: "#1A6DB5",
  slate900: "#0f172a",
  slate800: "#1e293b",
  gray100: "#f3f4f6",
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
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};

const horizontalScrollProps = {
  bounces: false,
  alwaysBounceHorizontal: false,
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};

const SEARCH_DEBOUNCE_MS = 300;
const MAX_RECENT_SEARCHES = 5;
const MAX_VISIBLE_RECENT_SEARCHES = 2;
const RECENT_SEARCHES_STORAGE_KEY = "nutrihelp.recentRecipeSearches";

function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function mapCommunityRecipe(row) {
  const servings = Number(row?.total_servings ?? row?.servings ?? 1) || 1;
  const minutes = Number(row?.preparation_time ?? row?.total_time_minutes ?? 0) || 0;
  const rawIngredients = row?.ingredients;
  const normalizedIngredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string"
      ? rawIngredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  const rawInstructions = Array.isArray(row?.instructions)
    ? row.instructions
    : typeof row?.instructions === "string"
      ? row.instructions
          .split(/\n+/)
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  return {
    id: row?.id,
    recipe_id: row?.id,
    recipe_name: row?.recipe_name ?? "Untitled Recipe",
    image_url: row?.image_url ?? "",
    category: row?.meal_type ?? "",
    meal_type: row?.meal_type ?? "",
    cuisine_name: row?.cuisine_name ?? "",
    preparation_time: minutes,
    time_minutes: minutes,
    total_servings: servings,
    servings,
    difficulty_level: row?.difficulty_level ?? "Easy",
    difficulty: row?.difficulty_level ?? "Easy",
    ingredients: normalizedIngredients,
    instructions: rawInstructions,
    source: "community",
    sourceType: "community",
    author_name: row?.author_name ?? "",
    author_user_id: row?.author_user_id ?? row?.user_id ?? row?.author_id ?? null,
  };
}

function mapRecipeLibraryRow(row) {
  const servings = Number(row?.servings ?? 1) || 1;
  const minutes =
    Number(row?.total_time_minutes ?? row?.prep_time_minutes ?? row?.cook_time_minutes ?? 0) ||
    0;
  return {
    id: row?.id,
    recipe_id: row?.id,
    recipe_name: row?.display_name ?? row?.recipe_name ?? row?.dish_name ?? "Untitled Recipe",
    image_url: row?.image_url ?? "",
    category: row?.meal_type ?? "",
    meal_type: row?.meal_type ?? "",
    cuisine_name: row?.cuisine_name_snapshot ?? "",
    preparation_time: minutes,
    time_minutes: minutes,
    total_servings: servings,
    servings,
    difficulty_level: row?.difficulty ? String(row.difficulty) : "Easy",
    difficulty: row?.difficulty ? String(row.difficulty) : "Easy",
    ingredients: row?.ingredients ?? [],
    instructions: row?.instructions ?? [],
    source: "recipe_library",
    sourceType: "recipe_library",
    rawRecipe: row,
  };
}

function extractCommunityRecipeList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.recipes)) return response.recipes;
  if (Array.isArray(response?.data?.recipes)) return response.data.recipes;
  return [];
}

function extractRecipeLibraryRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.recipes)) return response.recipes;
  if (Array.isArray(response?.data?.recipes)) return response.data.recipes;
  return [];
}

function getRecipeCuisine(recipe) {
  return pickFirstText(
    recipe?.cuisine,
    recipe?.cuisine_name,
    recipe?.rawRecipe?.cuisine_name_snapshot,
    recipe?.rawRecipe?.cuisine_name,
    recipe?.rawRecipe?.cuisine
  );
}

function getAuthorLabel(recipe) {
  const authorName = pickFirstText(recipe?.authorName, recipe?.author_name);
  if (authorName) return authorName;
  const authorId = recipe?.author_user_id ?? recipe?.authorId;
  if (authorId != null && String(authorId).trim() !== "") {
    return `User ${authorId}`;
  }
  return "";
}

function formatRatingSummary(recipe) {
  const rating = Number(recipe?.rating) || 0;
  const total = Number(recipe?.totalRatings) || 0;
  if (total <= 0 || rating <= 0) return "No reviews";
  return `${rating.toFixed(1)} (${total} ${total > 1 ? "reviews" : "review"})`;
}

function getReviewSourceType(recipe) {
  const normalized = String(recipe?.sourceType ?? recipe?.source ?? "")
    .trim()
    .toLowerCase();
  if (normalized.includes("community")) return "community";
  if (
    normalized === "recipe_library" ||
    normalized.includes("library") ||
    normalized.includes("catalog")
  ) {
    return "recipe_library";
  }
  return "";
}

function mergeReviewSummaryIntoRecipe(recipe, summaries) {
  const sourceType = getReviewSourceType(recipe);
  const key = recipeApi.getRecipeReviewKey(sourceType, recipe?.id ?? recipe?.recipe_id);
  if (!key || !summaries || typeof summaries !== "object") {
    return recipe;
  }

  const summary = summaries[key];
  if (!summary || typeof summary !== "object") {
    return recipe;
  }

  const nextRatingRaw = Number(summary.averageRating ?? summary.rating);
  const nextTotalRaw = Number(summary.reviewCount ?? summary.count);
  const nextRating = Number.isFinite(nextRatingRaw) ? Math.max(0, nextRatingRaw) : 0;
  const nextTotal = Number.isFinite(nextTotalRaw) ? Math.max(0, nextTotalRaw) : 0;
  return {
    ...recipe,
    rating: nextRating,
    totalRatings: nextTotal,
  };
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

function FeaturedRecipeCard({ recipe, onPress }) {
  const imageUri = String(recipe?.imageUrl ?? "").trim();

  return (
    <Pressable onPress={() => onPress?.(recipe)} style={styles.featuredCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.featuredImage} resizeMode="cover" />
      ) : (
        <View style={styles.featuredImagePlaceholder}>
          <Ionicons name="image-outline" size={30} color="#A8A29E" />
        </View>
      )}
      <View style={styles.featuredBody}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {recipe?.title ?? "Untitled Recipe"}
        </Text>
        <Text style={styles.featuredMetaText} numberOfLines={1}>
          {formatRatingSummary(recipe)}
        </Text>
        {getAuthorLabel(recipe) ? (
          <Text style={styles.featuredMetaText} numberOfLines={1}>
            By {getAuthorLabel(recipe)}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function SearchRecipesScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("library");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [remoteRecipes, setRemoteRecipes] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [recentHydrated, setRecentHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const cardWidth = useMemo(() => (width - 16 * 2 - COLUMN_GAP) / 2, [width]);
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
        // ignore storage error
      } finally {
        if (!cancelled) setRecentHydrated(true);
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
        // ignore storage error
      }
    })();
  }, [recentSearches, recentHydrated]);

  useEffect(() => {
    setSelectedCuisine("All");
  }, [selectedSource]);

  useEffect(() => {
    let active = true;

    const runSearch = async () => {
      setIsLoading(true);

      try {
        let list = [];

        if (selectedSource === "community") {
          const response = await recipeApi.getCommunityRecipes(500);
          list = extractCommunityRecipeList(response).map((item, index) =>
            normalizeRecipe(mapCommunityRecipe(item), index)
          );
        } else {
          const response = await recipeApi.getRecipeLibraryForAddMeal({
            limit: 500,
            cacheBust: true,
          });
          list = extractRecipeLibraryRows(response).map((item, index) =>
            normalizeRecipe(mapRecipeLibraryRow(item), index)
          );
        }

        const summaryItems = list
          .map((item) => ({
            sourceType: getReviewSourceType(item),
            recipeId: item?.id ?? item?.recipe_id,
          }))
          .filter((item) => item.sourceType && item.recipeId != null);

        if (summaryItems.length > 0) {
          const summaries = await recipeApi.fetchRecipeReviewSummaries(summaryItems).catch(() => ({}));
          list = list.map((item) => mergeReviewSummaryIntoRecipe(item, summaries));
        }

        if (active) {
          setRemoteRecipes(list);
        }
      } catch (error) {
        if (active) {
          if (__DEV__) {
            console.warn("[SearchRecipes] failed:", error?.message ?? error);
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
  }, [selectedSource]);

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

  const cuisines = useMemo(() => {
    const names = remoteRecipes.map((item) => getRecipeCuisine(item)).filter(Boolean);
    return ["All", ...new Set(names)];
  }, [remoteRecipes]);

  const filteredRecipes = useMemo(() => {
    return remoteRecipes.filter((item) => {
      const matchesQuery =
        debouncedQuery.length === 0 || item.title.toLowerCase().includes(debouncedQuery);
      const recipeCuisine = normalizeText(getRecipeCuisine(item));
      const selectedCuisineValue = normalizeText(selectedCuisine);
      const matchesCuisine =
        selectedCuisineValue === "all" ||
        (recipeCuisine.length > 0 && recipeCuisine === selectedCuisineValue);
      return matchesQuery && matchesCuisine;
    });
  }, [remoteRecipes, selectedCuisine, debouncedQuery]);

  const featuredRecipes = useMemo(() => filteredRecipes.slice(0, 8), [filteredRecipes]);

  const titleSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return [];
    }

    const sourceWithCuisine = remoteRecipes.filter((item) => {
      if (selectedCuisine === "All") {
        return true;
      }
      return normalizeText(getRecipeCuisine(item)) === normalizeText(selectedCuisine);
    });

    const matchedTitles = sourceWithCuisine
      .map((item) => item.title)
      .filter((title) => title.toLowerCase().includes(normalized));

    return [...new Set(matchedTitles)].slice(0, 6);
  }, [query, remoteRecipes, selectedCuisine]);

  const isShowingRecentSearches = query.trim().length === 0;
  const displayedSuggestions = isShowingRecentSearches
    ? recentSearches.slice(0, MAX_VISIBLE_RECENT_SEARCHES)
    : titleSuggestions;

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

  const handleToggleSource = () => {
    setSelectedSource((prev) => (prev === "library" ? "community" : "library"));
  };

  const handleRecipePress = (recipe) => {
    navigation?.navigate?.("RecipeDetailScreen", {
      recipeId: selectedSource === "community" ? undefined : recipe.id,
      recipe,
    });
  };

  const renderEmptyState = () => {
    const rawTerm = query.trim();
    const appliedTerm = debouncedQuery;
    const displayTerm = rawTerm.length > 0 ? rawTerm : appliedTerm.length > 0 ? appliedTerm : "";

    const cuisinePhrase =
      selectedCuisine && selectedCuisine !== "All" ? ` (${selectedCuisine})` : "";
    const sourcePhrase = selectedSource === "community" ? "community recipes" : "library recipes";

    let message;
    if (displayTerm.length > 0) {
      message = `No ${sourcePhrase} found for "${displayTerm}"${cuisinePhrase}.`;
    } else if (selectedCuisine && selectedCuisine !== "All") {
      message = `No ${sourcePhrase} found for cuisine "${selectedCuisine}".`;
    } else {
      message = `No ${sourcePhrase} match your search.`;
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

  const sourceLabel = selectedSource === "community" ? "Community" : "Library";
  const sourceHint =
    selectedSource === "community" ? "Showing community recipes" : "Showing library recipes";

  const listHeader = (
    <View style={styles.listHeader}>
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
          {!isShowingRecentSearches ? (
            <Text style={styles.suggestionsHeading}>Suggestions</Text>
          ) : null}
          {displayedSuggestions.length === 0 ? (
            <Text style={styles.suggestionsEmpty}>
              {isShowingRecentSearches ? "No recent searches yet." : "No matching recipes."}
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
                  <Text style={styles.suggestionText} numberOfLines={1}>
                    {item}
                  </Text>
                  {isShowingRecentSearches ? (
                    <Ionicons name="time-outline" size={16} color="#94A3B8" />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}

      <Text style={styles.sourceHint}>{sourceHint}</Text>

      <Text style={styles.filterHeading}>Cuisine</Text>
      <FilterChips filters={cuisines} selectedFilter={selectedCuisine} onSelect={setSelectedCuisine} />

      {featuredRecipes.length > 0 ? (
        <View style={styles.featuredSection}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredHeading}>Featured</Text>
            <Text style={styles.featuredSubheading}>
              {selectedSource === "community" ? "Top community picks" : "Top library picks"}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredRow}
            {...horizontalScrollProps}
          >
            {featuredRecipes.map((item) => (
              <FeaturedRecipeCard
                key={`featured-${item.id}`}
                recipe={item}
                onPress={handleRecipePress}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.pageChrome}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#253B63" />
          </Pressable>
          <Text style={styles.headerTitle}>Search recipes</Text>
          <Pressable
            onPress={handleToggleSource}
            style={styles.sourceToggleBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Switch source. Current: ${sourceLabel}`}
          >
            <Ionicons
              name={selectedSource === "community" ? "globe" : "globe-outline"}
              size={22}
              color={selectedSource === "community" ? C.primary : "#253B63"}
            />
          </Pressable>
        </View>

        <FlatList
          data={isLoading ? [] : filteredRecipes}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={{ width: cardWidth }}>
              <RecipeCard recipe={item} onPress={handleRecipePress} cardWidth={cardWidth} />
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMetaLeft} numberOfLines={1}>
                  {getAuthorLabel(item) ? `By ${getAuthorLabel(item)}` : "NutriHelp"}
                </Text>
                <Text style={styles.cardMetaRight} numberOfLines={1}>
                  {formatRatingSummary(item)}
                </Text>
              </View>
            </View>
          )}
          numColumns={2}
          {...flatListScrollProps}
          style={[styles.list, Platform.OS === "web" ? { overscrollBehavior: "none" } : null]}
          columnWrapperStyle={{
            marginBottom: COLUMN_GAP,
            columnGap: COLUMN_GAP,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={listHeader}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={isLoading ? null : renderEmptyState}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  pageChrome: { flex: 1 },
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
  sourceToggleBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  listHeader: {
    paddingTop: 20,
    paddingBottom: 8,
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
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  suggestionText: { flex: 1, marginRight: 8, fontSize: 16, color: C.slate800 },
  sourceHint: {
    marginBottom: 12,
    fontSize: 13,
    color: C.gray500,
  },
  filterHeading: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: C.slate800,
  },
  featuredSection: { marginBottom: 16 },
  featuredHeader: { marginBottom: 8 },
  featuredHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: C.slate900,
  },
  featuredSubheading: {
    marginTop: 2,
    fontSize: 13,
    color: C.gray500,
  },
  featuredRow: { paddingRight: 4 },
  featuredCard: {
    ...SURFACE_SHADOW,
    width: 236,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    overflow: "hidden",
    backgroundColor: C.white,
    marginRight: 10,
  },
  featuredImage: { height: 120, width: "100%" },
  featuredImagePlaceholder: {
    height: 120,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  featuredBody: { padding: 10 },
  featuredTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.slate800,
  },
  featuredMetaText: {
    marginTop: 3,
    fontSize: 12,
    color: C.gray500,
  },
  loadingRow: { alignItems: "center", paddingVertical: 24 },
  loadingText: { marginTop: 8, fontSize: 16, color: C.primary },
  list: { flex: 1, minHeight: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 24, backgroundColor: "#F8FAFC" },
  cardMetaRow: {
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMetaLeft: {
    flex: 1,
    fontSize: 12,
    color: C.gray500,
  },
  cardMetaRight: {
    maxWidth: "45%",
    fontSize: 12,
    fontWeight: "600",
    color: C.slate800,
    textAlign: "right",
  },
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
