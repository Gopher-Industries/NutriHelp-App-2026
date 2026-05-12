import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";

export const COLUMN_GAP = 16;
const NUM_COLUMNS = 2;
const H_PADDING = 16;

const C = {
  primary: "#1A6DB5",
  stone100: "#f5f5f4",
  stone200: "#e7e5e4",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate600: "#475569",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray700: "#374151",
  white: "#fff",
};

/** Fixed layout so every card matches; title area always reserves two lines. */
const RECIPE_CARD_IMAGE_H = 112;
const RECIPE_CARD_TITLE_LINE_HEIGHT = 24;
const RECIPE_CARD_TITLE_MAX_LINES = 2;
const RECIPE_CARD_TITLE_BLOCK_H =
  RECIPE_CARD_TITLE_LINE_HEIGHT * RECIPE_CARD_TITLE_MAX_LINES;
const RECIPE_CARD_CONTENT_PAD_V = 12;
const RECIPE_CARD_TITLE_META_GAP = 8;
const RECIPE_CARD_META_ROW_H = 24;
export const RECIPE_CARD_HEIGHT =
  RECIPE_CARD_IMAGE_H +
  RECIPE_CARD_CONTENT_PAD_V +
  RECIPE_CARD_TITLE_BLOCK_H +
  RECIPE_CARD_TITLE_META_GAP +
  RECIPE_CARD_META_ROW_H +
  RECIPE_CARD_CONTENT_PAD_V;

const flatListScrollProps = {
  bounces: false,
  alwaysBounceVertical: false,
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android"
    ? { overScrollMode: "never", removeClippedSubviews: false }
    : {}),
};

const horizontalScrollProps = {
  bounces: false,
  alwaysBounceHorizontal: false,
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};
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

export function useRecipeCardWidth() {
  const { width } = useWindowDimensions();
  return useMemo(
    () => (width - H_PADDING * 2 - COLUMN_GAP) / NUM_COLUMNS,
    [width]
  );
}

function parseNumericCalories(value) {
  if (value == null || value === "") {
    return null;
  }
  const n = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function extractCaloriesFromRecipe(raw) {
  const direct =
    raw?.calories ??
    raw?.calorie_count ??
    raw?.total_calories ??
    raw?.energy_kcal ??
    raw?.kcal ??
    raw?.energy;
  let parsed = parseNumericCalories(direct);
  if (parsed != null) {
    return parsed;
  }

  const nut = raw?.nutrition;
  if (nut && typeof nut === "object" && !Array.isArray(nut)) {
    parsed = parseNumericCalories(
      nut.calories ?? nut.Calories ?? nut.kcal ?? nut.total_calories
    );
    if (parsed != null) {
      return parsed;
    }
  }

  if (Array.isArray(raw?.nutrition)) {
    const calEntry = raw.nutrition.find((item) =>
      String(item?.name ?? item?.label ?? "")
        .toLowerCase()
        .includes("cal")
    );
    if (calEntry) {
      parsed = parseNumericCalories(calEntry.value ?? calEntry.amount);
      if (parsed != null) {
        return parsed;
      }
    }
  }

  return null;
}

function pickRecipeImageUrl(raw) {
  const candidates = [raw?.imageUrl, raw?.image_url, raw?.thumbnail_url, raw?.recipe_image_url];
  for (const candidate of candidates) {
    const s = String(candidate ?? "").trim();
    if (s) {
      return s;
    }
  }
  return "";
}

export function normalizeRecipe(raw, index) {
  const rating =
    Number(raw?.rating ?? raw?.avg_rating ?? raw?.average_rating ?? 0) || 0;
  const totalRatings =
    Number(raw?.totalRatings ?? raw?.total_ratings ?? raw?.rating_count ?? raw?.num_ratings ?? 0) ||
    0;

  const normalizedNutrition = Array.isArray(raw?.nutrition)
    ? raw.nutrition.map((item) => ({
        name: item?.name ?? item?.label ?? "Nutrition",
        value: String(item?.value ?? item?.amount ?? "-"),
      }))
    : raw?.nutrition && typeof raw.nutrition === "object"
      ? Object.entries(raw.nutrition).map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value ?? "-"),
        }))
      : [];

  return {
    id: String(
      raw?.id ??
        raw?.recipe_id ??
        raw?.recipeId ??
        raw?.local_client_id ??
        raw?.localId ??
        `${raw?.title ?? raw?.name ?? "recipe"}-${index + 1}`
    ),
    title: raw?.title ?? raw?.name ?? raw?.recipe_name ?? "Untitled Recipe",
    description: raw?.description ?? raw?.summary ?? raw?.details ?? "",
    category: String(raw?.category ?? raw?.meal_type ?? "").trim() || "Recommended",
    timeMinutes: Number(raw?.timeMinutes ?? raw?.time_minutes ?? raw?.time ?? 10),
    servings: Number(raw?.servings ?? raw?.serving_count ?? 1),
    difficulty: raw?.difficulty ?? raw?.level ?? "Easy",
    calories: extractCaloriesFromRecipe(raw),
    rating,
    totalRatings,
    ingredients: Array.isArray(raw?.ingredients)
      ? raw.ingredients.map((item) => ({
          quantity: String(item?.quantity ?? item?.amount ?? ""),
          unit: String(item?.unit ?? "").trim(),
          name: item?.name ?? item?.ingredient ?? "Ingredient",
        }))
      : [],
    instructions: Array.isArray(raw?.instructions)
      ? raw.instructions.map((step, stepIndex) => ({
          number: Number(step?.number ?? step?.step ?? stepIndex + 1),
          title: step?.title ?? `Step ${stepIndex + 1}`,
          description: step?.description ?? step?.content ?? "",
        }))
      : [],
    nutrition: normalizedNutrition,
    imageUrl: pickRecipeImageUrl(raw),
  };
}

export function extractRecipeList(response) {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.recipes)) {
    return response.recipes;
  }
  if (Array.isArray(response?.data?.recipes)) {
    return response.data.recipes;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.content)) {
    return response.content;
  }
  if (Array.isArray(response?.items)) {
    return response.items;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }
  return [];
}

export function FilterChips({ filters, selectedFilter, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
      contentContainerStyle={styles.chipScrollContent}
      {...horizontalScrollProps}
    >
      {filters.map((filter) => {
        const isSelected = filter === selectedFilter;

        return (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
          >
            <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function RecipeCard({ recipe, onPress, cardWidth }) {
  const avgRating = Number(recipe?.rating) || 0;
  const reviewCount = Number(recipe?.totalRatings) || 0;
  const shouldShowScore = avgRating > 0 || reviewCount > 0;
  const title = recipe?.title ?? "";
  const imageUri = String(recipe?.imageUrl ?? "").trim();

  const showFullTitle = () => {
    if (!title.trim()) {
      return;
    }
    Alert.alert("Recipe", title);
  };

  return (
    <Pressable
      onPress={() => onPress?.(recipe)}
      onLongPress={showFullTitle}
      accessibilityRole="button"
      accessibilityLabel={title || "Recipe"}
      accessibilityHint="Opens recipe. Long press to show the full name."
      delayLongPress={350}
      style={[
        styles.card,
        {
          width: cardWidth,
          height: RECIPE_CARD_HEIGHT,
          minWidth: 44,
          alignSelf: "flex-start",
          flexShrink: 0,
        },
      ]}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ height: RECIPE_CARD_IMAGE_H, width: "100%" }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[styles.imagePlaceholder, { height: RECIPE_CARD_IMAGE_H }]}
          accessibilityRole="image"
          accessibilityLabel="No recipe image"
        >
          <Ionicons name="image-outline" size={40} color="#a8a29e" />
        </View>
      )}

      <View
        style={{
          paddingHorizontal: RECIPE_CARD_CONTENT_PAD_V,
          paddingTop: RECIPE_CARD_CONTENT_PAD_V,
          paddingBottom: RECIPE_CARD_CONTENT_PAD_V,
        }}
      >
        <View
          style={{
            height: RECIPE_CARD_TITLE_BLOCK_H,
            marginBottom: RECIPE_CARD_TITLE_META_GAP,
          }}
        >
          <Text
            numberOfLines={RECIPE_CARD_TITLE_MAX_LINES}
            ellipsizeMode="tail"
            style={[styles.cardTitle, { lineHeight: RECIPE_CARD_TITLE_LINE_HEIGHT }]}
          >
            {title}
          </Text>
        </View>

        <View style={[styles.metaRow, { height: RECIPE_CARD_META_ROW_H }]}>
          <View style={styles.metaLeft}>
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text style={[styles.metaRating, { marginLeft: 4 }]} numberOfLines={1}>
              {shouldShowScore ? avgRating.toFixed(1) : "—"}
            </Text>
            {reviewCount > 0 ? (
              <Text style={[styles.metaCount, { marginLeft: 4 }]} numberOfLines={1}>
                ({reviewCount})
              </Text>
            ) : null}
          </View>
          <Text style={[styles.kcalText, { flexShrink: 0 }]} numberOfLines={1}>
            {recipe?.calories != null ? `${recipe.calories} kcal` : "—"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

async function fetchListFromApi(userId) {
  const primary = await recipeApi.getRecipes({ userId });
  return extractRecipeList(primary);
}

function SearchEntryBar({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.searchEntryBar}
      accessibilityRole="button"
      accessibilityLabel="Open recipe search"
    >
      <Ionicons name="search-outline" size={22} color="#9ca3af" />
      <Text style={styles.searchEntryText}>Search recipes…</Text>
    </Pressable>
  );
}

export default function RecipeListScreen({ navigation, route }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const effectiveUserId = userId ?? 0;
  const createdAt = route?.params?.createdAt;

  const [browseRecipes, setBrowseRecipes] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [browseFilter, setBrowseFilter] = useState("All");
  const [browseFilters, setBrowseFilters] = useState(["All"]);
  const cardWidth = useRecipeCardWidth();

  const loadBrowseAndMerge = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setBrowseLoading(true);
    }

    try {
      const list = await fetchListFromApi(effectiveUserId);
      const mapped = list.map((item, i) => normalizeRecipe(item, i));
      setBrowseRecipes(mapped);

      const categories = new Set(mapped.map((item) => item.category).filter(Boolean));
      if (browseFilter && browseFilter !== "All") {
        categories.add(browseFilter);
      }
      const nextFilters = ["All", ...[...categories].sort()];
      setBrowseFilters(nextFilters);
    } catch (error) {
      if (__DEV__) {
        const status = error?.status ?? error?.response?.status;
        const data = error?.data ?? error?.response?.data;
        console.warn("[RecipeList] recipeApi.getRecipes failed:", {
          message: error?.message ?? error,
          status,
          data,
        });
      }

      setBrowseRecipes([]);
      setBrowseFilters(["All"]);
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setBrowseLoading(false);
      }
    }
  }, [effectiveUserId, browseFilter]);

  useEffect(() => {
    loadBrowseAndMerge();
  }, [loadBrowseAndMerge, createdAt]);

  const browseFiltered = useMemo(() => {
    if (browseFilter === "All") {
      return browseRecipes;
    }
    return browseRecipes.filter((item) => item.category === browseFilter);
  }, [browseRecipes, browseFilter]);

  const handleRecipePress = (recipe) => {
    navigation?.navigate?.("RecipeDetailScreen", {
      recipeId: recipe.id,
      recipe,
    });
  };

  const renderBrowseEmpty = () => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>No recipes in this category.</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Recipes</Text>
        <Pressable
          onPress={() => navigation?.navigate?.("CreateRecipeScreen")}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Create recipe</Text>
        </Pressable>
      </View>

      <SearchEntryBar onPress={() => navigation?.navigate?.("SearchRecipesScreen", {})} />

      <FilterChips
        filters={browseFilters}
        selectedFilter={browseFilter}
        onSelect={setBrowseFilter}
      />

      {browseLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={C.primary} />
          <Text style={styles.loadingText}>Loading recipes…</Text>
        </View>
      ) : null}

      <FlatList
        data={browseLoading ? [] : browseFiltered}
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
        ListEmptyComponent={browseLoading ? null : renderBrowseEmpty}
        refreshing={isRefreshing}
        onRefresh={() => loadBrowseAndMerge(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chipScroll: { flexGrow: 0, flexShrink: 0, alignSelf: "stretch" },
  chipScrollContent: { paddingRight: 8, alignItems: "flex-start", marginBottom: 16 },
  chip: {
    marginRight: 12,
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
  },
  chipUnselected: {
    borderColor: C.gray300,
    backgroundColor: C.white,
  },
  chipSelected: {
    borderColor: C.primary,
    backgroundColor: C.primary,
  },
  chipText: {
    fontSize: 16,
    color: C.gray700,
  },
  chipTextSelected: {
    fontWeight: "600",
    color: C.white,
  },
  card: {
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.gray200,
    backgroundColor: C.white,
  },
  imagePlaceholder: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.stone200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: C.slate900,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLeft: {
    minHeight: 0,
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  metaRating: {
    fontSize: 14,
    fontWeight: "500",
    color: C.slate800,
  },
  metaCount: {
    fontSize: 12,
    color: C.gray400,
  },
  kcalText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.slate600,
  },
  searchEntryBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.gray300,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchEntryText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: C.gray400,
  },
  emptyBox: {
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 18,
    color: C.slate800,
  },
  screen: {
    flex: 1,
    backgroundColor: C.stone100,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: C.slate900,
  },
  primaryBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.white,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: C.primary,
  },
});
