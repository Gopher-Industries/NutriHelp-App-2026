import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";

export const COLUMN_GAP = 16;
const NUM_COLUMNS = 2;
const H_PADDING = 16;

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
const LOCAL_CREATED_RECIPES_KEY = "nutrihelp.localCreatedRecipes";

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
      style={{ flexGrow: 0, flexShrink: 0, alignSelf: "stretch" }}
      contentContainerStyle={{ paddingRight: 8, alignItems: "flex-start" }}
      className="mb-4"
      {...horizontalScrollProps}
    >
      {filters.map((filter) => {
        const isSelected = filter === selectedFilter;

        return (
          <Pressable
            key={filter}
            onPress={() => onSelect(filter)}
            className={`mr-3 h-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border px-4 ${
              isSelected ? "border-[#1A6DB5] bg-[#1A6DB5]" : "border-gray-300 bg-white"
            }`}
          >
            <Text
              className={`text-base ${isSelected ? "font-semibold text-white" : "text-gray-700"}`}
            >
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
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      style={{
        width: cardWidth,
        height: RECIPE_CARD_HEIGHT,
        minWidth: 44,
        alignSelf: "flex-start",
        flexShrink: 0,
      }}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="w-full"
          style={{ height: RECIPE_CARD_IMAGE_H }}
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-full items-center justify-center bg-stone-200"
          style={{ height: RECIPE_CARD_IMAGE_H }}
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
            className="text-base font-semibold text-slate-900"
            style={{ lineHeight: RECIPE_CARD_TITLE_LINE_HEIGHT }}
          >
            {title}
          </Text>
        </View>

        <View style={{ height: RECIPE_CARD_META_ROW_H }} className="flex-row items-center justify-between gap-2">
          <View className="min-h-0 min-w-0 flex-1 flex-row items-center">
            <Ionicons name="star" size={15} color="#F59E0B" />
            <Text className="ml-1 text-sm font-medium text-slate-800" numberOfLines={1}>
              {shouldShowScore ? avgRating.toFixed(1) : "—"}
            </Text>
            {reviewCount > 0 ? (
              <Text className="ml-1 text-xs text-gray-400" numberOfLines={1}>
                ({reviewCount})
              </Text>
            ) : null}
          </View>
          <Text
            className="text-sm font-medium text-slate-600"
            numberOfLines={1}
            style={{ flexShrink: 0 }}
          >
            {recipe?.calories != null ? `${recipe.calories} kcal` : "—"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

async function fetchListFromApi(userId, category) {
  const primary = await recipeApi.getRecipes({ userId, category });
  return extractRecipeList(primary);
}

function SearchEntryBar({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-4 min-h-[48px] flex-row items-center rounded-xl border border-gray-300 bg-white px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel="Open recipe search"
    >
      <Ionicons name="search-outline" size={22} color="#9ca3af" />
      <Text className="ml-2 flex-1 text-base text-gray-400">Search recipes…</Text>
    </Pressable>
  );
}

function mergeCreatedRecipe(mapped, pending) {
  if (!pending) {
    return mapped;
  }
  const p = normalizeRecipe(pending, mapped.length);
  if (mapped.some((r) => String(r.id) === String(p.id))) {
    return mapped;
  }
  return [p, ...mapped];
}

function mergeCreatedRecipes(mapped, pendings) {
  let next = mapped;
  for (const p of pendings ?? []) {
    next = mergeCreatedRecipe(next, p);
  }
  return next;
}

export default function RecipeListScreen({ navigation, route }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const effectiveUserId = userId ?? 0;
  const pendingCreated = route?.params?.createdRecipe;
  const createdAt = route?.params?.createdAt;

  const [browseRecipes, setBrowseRecipes] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [browseFilter, setBrowseFilter] = useState("All");
  const [browseFilters, setBrowseFilters] = useState(["All"]);
  const [localCreatedRecipes, setLocalCreatedRecipes] = useState([]);
  const cardWidth = useRecipeCardWidth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCAL_CREATED_RECIPES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (cancelled || !Array.isArray(parsed)) {
          return;
        }
        setLocalCreatedRecipes(parsed);
      } catch {
        /* ignore storage issues */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pendingCreated) {
      return;
    }
    setBrowseRecipes((prev) => mergeCreatedRecipe(prev, pendingCreated));
    setLocalCreatedRecipes((prev) => {
      const normalized = normalizeRecipe(pendingCreated, prev.length);
      const exists = prev.some(
        (item, index) => String(normalizeRecipe(item, index).id) === String(normalized.id)
      );
      const next = exists ? prev : [pendingCreated, ...prev];
      AsyncStorage.setItem(LOCAL_CREATED_RECIPES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [pendingCreated]);

  const loadBrowseAndMerge = useCallback(async (refreshing = false) => {
    if (refreshing) {
      setIsRefreshing(true);
    } else {
      setBrowseLoading(true);
    }

    try {
      const list = await fetchListFromApi(effectiveUserId, browseFilter);
      let mapped = list.map((item, i) => normalizeRecipe(item, i));
      mapped = mergeCreatedRecipe(mapped, pendingCreated);
      mapped = mergeCreatedRecipes(mapped, localCreatedRecipes);
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
  
      let mapped = mergeCreatedRecipe([], pendingCreated);
      mapped = mergeCreatedRecipes(mapped, localCreatedRecipes);
      setBrowseRecipes(mapped);

      const categories = new Set(mapped.map((item) => item.category).filter(Boolean));
      if (browseFilter && browseFilter !== "All") {
        categories.add(browseFilter);
      }
      setBrowseFilters(["All", ...[...categories].sort()]);
    } finally {
      if (refreshing) {
        setIsRefreshing(false);
      } else {
        setBrowseLoading(false);
      }
    }
  }, [effectiveUserId, browseFilter, localCreatedRecipes, pendingCreated]);

  useEffect(() => {
    loadBrowseAndMerge();
  }, [loadBrowseAndMerge, createdAt]);

  const browseFiltered = useMemo(() => browseRecipes, [browseRecipes]);

  const handleRecipePress = (recipe) => {
    navigation?.navigate?.("RecipeDetailScreen", {
      recipeId: recipe.id,
      recipe,
    });
  };

  const renderBrowseEmpty = () => (
    <View className="items-center rounded-2xl bg-white px-4 py-8">
      <Text className="text-center text-lg text-slate-800">No recipes in this category.</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-stone-100 px-4 pt-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-semibold text-slate-900">Recipes</Text>
        <Pressable
          onPress={() => navigation?.navigate?.("CreateRecipeScreen")}
          className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#1A6DB5] px-4"
        >
          <Text className="text-base font-semibold text-white">Create recipe</Text>
        </Pressable>
      </View>

      <SearchEntryBar onPress={() => navigation?.navigate?.("SearchRecipesScreen", {})} />

      <FilterChips
        filters={browseFilters}
        selectedFilter={browseFilter}
        onSelect={setBrowseFilter}
      />

      {browseLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color="#1A6DB5" />
          <Text className="mt-2 text-base text-[#1A6DB5]">Loading recipes…</Text>
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
