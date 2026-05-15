import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import StarRating from "react-native-star-rating-widget";
import baseApi from "../../api/baseApi";
import { useUser } from "../../context/UserContext";
import recipeApi from "../../api/recipeApi";
import {
  addRecipeBookmark,
  isRecipeBookmarked,
  removeRecipeBookmark,
} from "../../utils/recipeBookmarks";

const C = {
  primary: "#1A6DB5",
  navy: "#0f2454",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  gray100: "#f3f4f6",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  white: "#fff",
};

/** Home mealsCard-style */
const SURFACE_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};
/** Home statCard-style (compact metrics) */
const STAT_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 6 },
  elevation: 1,
};

const SERVING_SCALE_OPTIONS = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 3, label: "3x" },
];

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

function pickFirstText(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function formatNutritionLabel(key) {
  const normalized = String(key ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!normalized) {
    return "Nutrition";
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toNutritionDisplayValue(value) {
  if (value == null) {
    return "";
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    const amount = value?.value ?? value?.amount ?? value?.qty ?? value?.quantity;
    const unit = String(value?.unit ?? value?.units ?? "").trim();
    const amountText = String(amount ?? "").trim();
    if (!amountText) {
      return "";
    }
    return unit ? `${amountText} ${unit}` : amountText;
  }
  return String(value).trim();
}

function normalizeNutritionRows(raw) {
  if (Array.isArray(raw?.nutrition)) {
    return raw.nutrition
      .map((item) => ({
        name: item?.name ?? item?.label ?? "Nutrition",
        value: String(item?.value ?? item?.amount ?? "-"),
      }))
      .filter((item) => item.value && item.value !== "-");
  }

  if (raw?.nutrition && typeof raw.nutrition === "object") {
    const rows = Object.entries(raw.nutrition)
      .map(([key, value]) => {
        const formattedValue = toNutritionDisplayValue(value);
        return {
          name: formatNutritionLabel(key),
          value: formattedValue,
        };
      })
      .filter((item) => item.value);
    if (rows.length > 0) {
      return rows;
    }
  }

  const fallbackEntries = [
    ["Calories", raw?.calories ?? raw?.kcal ?? raw?.energy_kcal ?? raw?.total_calories],
    ["Protein", raw?.protein ?? raw?.proteins],
    ["Carbs", raw?.carbs ?? raw?.carbohydrates ?? raw?.carbohydrate],
    ["Fat", raw?.fat ?? raw?.fats],
    ["Fiber", raw?.fiber],
    ["Sugar", raw?.sugar],
    ["Sodium", raw?.sodium],
  ];
  const fallbackRows = fallbackEntries
    .map(([name, value]) => ({
      name,
      value: String(value ?? "").trim(),
    }))
    .filter((item) => item.value);
  if (fallbackRows.length > 0) {
    return fallbackRows;
  }

  if (raw?.rawRecipe && raw.rawRecipe !== raw) {
    return normalizeNutritionRows(raw.rawRecipe);
  }

  return [];
}

async function fetchReviewSummaryStatsForRecipe(recipe, fallbackSourceType = "") {
  const normalizedRecipeId = recipeApi.normalizeRecipeReviewId(recipe?.id ?? recipe?.recipe_id);
  if (!normalizedRecipeId) {
    return null;
  }

  const normalizedSourceType =
    recipeApi.normalizeRecipeReviewSourceType(
      recipe?.sourceType ?? recipe?.source ?? fallbackSourceType
    ) || "recipe_library";

  const summaries = await recipeApi.fetchRecipeReviewSummaries([
    {
      sourceType: normalizedSourceType,
      recipeId: normalizedRecipeId,
    },
  ]);

  const key = recipeApi.getRecipeReviewKey(normalizedSourceType, normalizedRecipeId);
  const summary = summaries?.[key];
  if (!summary || typeof summary !== "object") {
    return null;
  }

  const ratingRaw = Number(summary.averageRating ?? summary.rating);
  const totalRaw = Number(summary.reviewCount ?? summary.count);
  const rating = Number.isFinite(ratingRaw) ? Math.max(0, ratingRaw) : 0;
  const totalRatings = Number.isFinite(totalRaw) ? Math.max(0, totalRaw) : 0;

  return { rating, totalRatings };
}

function resolveReviewTarget(recipe, fallbackSourceType = "") {
  const normalizedRecipeId = recipeApi.normalizeRecipeReviewId(recipe?.id ?? recipe?.recipe_id);
  if (!normalizedRecipeId) {
    return null;
  }

  const normalizedSourceType =
    recipeApi.normalizeRecipeReviewSourceType(
      recipe?.sourceType ?? recipe?.source ?? fallbackSourceType
    ) || "recipe_library";

  return {
    sourceType: normalizedSourceType,
    recipeId: normalizedRecipeId,
  };
}

function normalizeReviewItem(raw, index) {
  return {
    id: String(raw?.id ?? `review-${index + 1}`),
    userName: String(raw?.userName ?? raw?.user_name ?? `User ${raw?.userId ?? ""}`).trim(),
    comment: String(raw?.comment ?? ""),
    rating: Number(raw?.rating) || 0,
    createdAt: String(raw?.createdAt ?? raw?.created_at ?? ""),
    userAvatar: String(raw?.userAvatar ?? raw?.user_avatar ?? "").trim(),
  };
}

function formatReviewDate(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Minimal shell before loaded data or when navigation has no recipe id. */
function detailPlaceholder(recipeId, variant) {
  const id = recipeId != null && String(recipeId) !== "" ? String(recipeId) : "";
  const titleByVariant = {
    loading: "Loading…",
    "no-id": "No recipe selected",
    failed: "Could not load recipe",
  };
  return {
    id,
    title: titleByVariant[variant] ?? titleByVariant.loading,
    description: "",
    imageUrl: "",
    rating: 0,
    totalRatings: 0,
    userRating: 0,
    timeMinutes: 0,
    servings: 1,
    difficulty: "—",
    source: "",
    sourceType: "",
    cuisine: "",
    authorName: "",
    ingredients: [],
    instructions: [],
    nutrition: [],
  };
}

function MetaItem({ label, value }) {
  return (
    <View style={[styles.metaItem, { flexBasis: 0 }]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function RecipeDetailScreen({ navigation, route }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const effectiveUserId = userId ?? 0;
  const [isSaved, setIsSaved] = useState(false);
  const [recipeData, setRecipeData] = useState(() =>
    detailPlaceholder(route?.params?.recipeId, route?.params?.recipeId ? "loading" : "no-id")
  );
  const [baseRecipeData, setBaseRecipeData] = useState(() =>
    detailPlaceholder(route?.params?.recipeId, route?.params?.recipeId ? "loading" : "no-id")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [activeTab, setActiveTab] = useState("ingredients");
  const [scaleValue, setScaleValue] = useState(1);
  const [reviewItems, setReviewItems] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const recipeId = route?.params?.recipeId;
  const routeRecipe = route?.params?.recipe;

  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const layoutHeightRef = useRef(0);

  const loadReviews = useCallback(
    async (recipeLike) => {
      const target = resolveReviewTarget(recipeLike, recipeLike?.sourceType ?? recipeLike?.source);
      if (!target) {
        setReviewItems([]);
        return;
      }

      setIsReviewsLoading(true);
      try {
        const response = await recipeApi.fetchRecipeReviews(target.sourceType, target.recipeId);
        const items = Array.isArray(response?.items)
          ? response.items.map((item, index) => normalizeReviewItem(item, index))
          : [];
        setReviewItems(items);
      } catch (error) {
        if (__DEV__) {
          console.warn("[RecipeDetail] fetchRecipeReviews failed:", error?.message ?? error);
        }
        setReviewItems([]);
      } finally {
        setIsReviewsLoading(false);
      }
    },
    []
  );

  function normalizeRecipe(raw) {
    const rawIngredients = Array.isArray(raw?.ingredients)
      ? raw.ingredients
      : typeof raw?.ingredients === "string"
        ? raw.ingredients
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
    const rawInstructions = Array.isArray(raw?.instructions)
      ? raw.instructions
      : typeof raw?.instructions === "string"
        ? raw.instructions
            .split(/\n+/)
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    return {
      id: String(raw?.id ?? raw?.recipe_id ?? ""),
      title: raw?.title ?? raw?.name ?? raw?.recipe_name ?? "",
      description: raw?.description ?? raw?.summary ?? raw?.details ?? "",
      imageUrl: pickRecipeImageUrl(raw),
      rating: Number(raw?.rating ?? raw?.avg_rating ?? 0) || 0,
      totalRatings:
        Number(raw?.totalRatings ?? raw?.total_ratings ?? raw?.rating_count ?? raw?.num_ratings ?? 0) ||
        0,
      userRating:
        Number(
          raw?.userRating ??
            raw?.user_rating ??
            raw?.my_rating ??
            raw?.your_rating ??
            raw?.rating_by_user ??
            0
        ) || 0,
      timeMinutes: Number(raw?.timeMinutes ?? raw?.time_minutes ?? raw?.time ?? 0),
      servings: Number(raw?.servings ?? raw?.serving_count ?? 1),
      difficulty: raw?.difficulty ?? raw?.level ?? "",
      source: pickFirstText(raw?.source, raw?.sourceType),
      sourceType: pickFirstText(raw?.sourceType, raw?.source),
      cuisine: pickFirstText(raw?.cuisine, raw?.cuisine_name),
      authorName: pickFirstText(raw?.authorName, raw?.author_name),
      ingredients: rawIngredients.map((item) =>
        typeof item === "string"
          ? {
              quantity: "",
              unit: "",
              name: item,
            }
          : {
              quantity: String(item?.quantity ?? item?.amount ?? ""),
              unit: String(item?.unit ?? "").trim(),
              name: item?.name ?? item?.ingredient ?? "Ingredient",
            }
      ),
      instructions: rawInstructions.map((step, index) =>
        typeof step === "string"
          ? {
              number: index + 1,
              title: `Step ${index + 1}`,
              description: step,
            }
          : {
              number: Number(step?.number ?? step?.step ?? index + 1),
              title: step?.title ?? `Step ${index + 1}`,
              description: step?.description ?? step?.content ?? "",
            }
      ),
      nutrition: normalizeNutritionRows(raw),
    };
  }

  function hasRenderableContent(data) {
    const title = String(data?.title ?? "").trim();
    const ingredientsCount = Array.isArray(data?.ingredients) ? data.ingredients.length : 0;
    const instructionsCount = Array.isArray(data?.instructions) ? data.instructions.length : 0;
    return title.length > 0 || ingredientsCount > 0 || instructionsCount > 0;
  }

  useEffect(() => {
    let active = true;

    const loadRecipe = async () => {
      if (routeRecipe && active) {
        const normalizedFromRoute = normalizeRecipe(routeRecipe);
        setRecipeData(normalizedFromRoute);
        setBaseRecipeData(normalizedFromRoute);
        loadReviews(normalizedFromRoute);
        try {
          const routeReviewStats = await fetchReviewSummaryStatsForRecipe(
            normalizedFromRoute,
            normalizedFromRoute?.sourceType ?? normalizedFromRoute?.source
          );
          if (active && routeReviewStats) {
            setRecipeData((prev) => ({ ...prev, ...routeReviewStats }));
            setBaseRecipeData((prev) => ({ ...prev, ...routeReviewStats }));
          }
        } catch {
          // ignore review summary failures; detail can still render without them
        }
      }

      if (!recipeId) {
        if (!routeRecipe) {
          setRecipeData(detailPlaceholder("", "no-id"));
          setBaseRecipeData(detailPlaceholder("", "no-id"));
          setReviewItems([]);
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await recipeApi.getRecipeById(recipeId, { userId: effectiveUserId });
        const rawRecipe = response?.recipe ?? response?.data?.recipe ?? response;
        if (active) {
          const normalized = normalizeRecipe(rawRecipe);
          if (hasRenderableContent(normalized)) {
            let nextRecipe = normalized;
            try {
              const reviewStats = await fetchReviewSummaryStatsForRecipe(
                normalized,
                normalized?.sourceType ?? normalized?.source
              );
              if (reviewStats) {
                nextRecipe = { ...normalized, ...reviewStats };
              }
            } catch {
              // ignore review summary failures; detail can still render without them
            }
            if (active) {
              setRecipeData(nextRecipe);
              setBaseRecipeData(nextRecipe);
              loadReviews(nextRecipe);
            }
          }
        }
      } catch (error) {
        if (active) {
          if (__DEV__) {
            console.warn("[RecipeDetail] recipeApi.getRecipeById failed:", error?.message ?? error);
          }
          if (!routeRecipe) {
            const shell = detailPlaceholder(recipeId, "failed");
            setRecipeData(shell);
            setBaseRecipeData(shell);
          }
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadRecipe();

    return () => {
      active = false;
    };
  }, [recipeId, effectiveUserId, routeRecipe, loadReviews]);

  useEffect(() => {
    setScaleValue(1);
  }, [recipeId]);

  const recipe = useMemo(() => recipeData, [recipeData]);

  useEffect(() => {
    const seedRating = Number(recipe?.userRating) || 0;
    setReviewRating(seedRating);
  }, [recipe?.id, recipe?.userRating]);

  useEffect(() => {
    setReviewDraft("");
  }, [recipe?.id]);

  useEffect(() => {
    let active = true;

    const syncBookmarkState = async () => {
      const currentId = recipeData?.id;
      if (!currentId) {
        if (active) {
          setIsSaved(false);
        }
        return;
      }

      try {
        const saved = await isRecipeBookmarked(effectiveUserId, currentId);
        if (active) {
          setIsSaved(saved);
        }
      } catch {
        if (active) {
          setIsSaved(false);
        }
      }
    };

    syncBookmarkState();

    return () => {
      active = false;
    };
  }, [effectiveUserId, recipeData?.id]);
  const displayedServings = useMemo(
    () => (Number(baseRecipeData.servings) || 1) * scaleValue,
    [baseRecipeData.servings, scaleValue]
  );

  const scaleQuantity = (quantityText, multiplier) => {
    const input = String(quantityText ?? "").trim();
    const match = input.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)$/);
    if (!match) {
      return input;
    }

    const numberPart = match[1];
    const unit = match[2] ?? "";
    let baseNumber = 0;

    if (numberPart.includes(" ")) {
      const [whole, frac] = numberPart.split(" ");
      const [n, d] = frac.split("/");
      baseNumber = Number(whole) + Number(n) / Number(d);
    } else if (numberPart.includes("/")) {
      const [n, d] = numberPart.split("/");
      baseNumber = Number(n) / Number(d);
    } else {
      baseNumber = Number(numberPart);
    }

    if (!Number.isFinite(baseNumber)) {
      return input;
    }

    const scaled = baseNumber * multiplier;
    const formatted = Number.isInteger(scaled) ? `${scaled}` : scaled.toFixed(2);
    return `${formatted}${unit ? ` ${unit}` : ""}`;
  };

  const handleScaleChange = async (nextScale) => {
    const n = Number(nextScale);
    const safeNextScale = SERVING_SCALE_OPTIONS.some((o) => o.value === n) ? n : 1;
    if (safeNextScale === scaleValue) {
      return;
    }
    setScaleValue(safeNextScale);
    setIsScaling(true);

    try {
      const response = await baseApi.post("/api/recipe/scale", {
        recipe_id: recipe.id,
        scale: safeNextScale,
      });

      const scaledRecipe = response?.recipe ?? response?.data?.recipe;
      if (scaledRecipe) {
        setRecipeData((prev) => normalizeRecipe({ ...prev, ...scaledRecipe }));
      } else {
        setRecipeData((prev) => ({
          ...prev,
          servings: (Number(baseRecipeData.servings) || 1) * safeNextScale,
          ingredients: baseRecipeData.ingredients.map((item) => ({
            ...item,
            quantity: scaleQuantity(item.quantity, safeNextScale),
          })),
        }));
      }
    } catch (error) {
      setRecipeData((prev) => ({
        ...prev,
        servings: (Number(baseRecipeData.servings) || 1) * safeNextScale,
        ingredients: baseRecipeData.ingredients.map((item) => ({
          ...item,
          quantity: scaleQuantity(item.quantity, safeNextScale),
        })),
      }));
    } finally {
      setIsScaling(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === "ingredients") {
      return (
        <View style={styles.tabPad}>
          {recipe.ingredients.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={[
                styles.ingredientRow,
                index < recipe.ingredients.length - 1 ? styles.ingredientRowBorder : null,
              ]}
            >
              <Text style={styles.ingredientName}>{item.name}</Text>
              <Text style={styles.ingredientQty}>{[item.quantity, item.unit].filter(Boolean).join(" ")}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === "instructions") {
      return (
        <View style={styles.tabPad}>
          {recipe.instructions.map((step, index) => (
            <View
              key={step.number}
              style={[
                styles.instructionBlock,
                index < recipe.instructions.length - 1 ? styles.instructionBlockBorder : null,
              ]}
            >
              <Text style={styles.stepLabel}>
                Step {String(step.number).padStart(2, "0")} of{" "}
                {String(recipe.instructions.length).padStart(2, "0")}
              </Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.description}</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.tabPad}>
        <View style={styles.nutritionShell}>
          {recipe.nutrition.length > 0 ? (
            recipe.nutrition.map((item, index) => (
              <View
                key={`${item.name}-${index}`}
                style={[
                  styles.nutritionRow,
                  index < recipe.nutrition.length - 1 ? styles.nutritionRowBorder : null,
                ]}
              >
                <Text style={styles.nutritionName}>{item.name}</Text>
                <Text style={styles.nutritionValue}>{item.value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.nutritionEmptyText}>No nutrition information available yet.</Text>
          )}
        </View>
      </View>
    );
  };

  const handleClampScroll = (_contentWidth, contentHeight) => {
    const lh = layoutHeightRef.current;
    if (!lh || !contentHeight) {
      return;
    }
    const maxY = Math.max(0, contentHeight - lh);
    if (scrollYRef.current > maxY) {
      scrollRef.current?.scrollTo({ y: maxY, animated: false });
      scrollYRef.current = maxY;
    }
  };

  const handleShare = async () => {
    const title = recipe.title?.trim() || "Recipe";
    const parts = [title];
    const imageTrim = String(recipe.imageUrl ?? "").trim();
    if (imageTrim) {
      parts.push(imageTrim);
    }

    const message = parts.join("\n");

    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title, text: message });
        }
        return;
      }

      await Share.share({ title, message });
    } catch (error) {
      /* dismissed share sheet is not an error */
    }
  };

  const handleToggleBookmark = useCallback(async () => {
    const currentId = recipe?.id;
    if (!currentId) {
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);

    try {
      if (nextSaved) {
        await addRecipeBookmark(effectiveUserId, recipe);
      } else {
        await removeRecipeBookmark(effectiveUserId, currentId);
      }
    } catch {
      setIsSaved(!nextSaved);
    }
  }, [effectiveUserId, isSaved, recipe]);

  const handleBackPress = useCallback(() => {
    const state = navigation?.getState?.();
    const stackRoutes = Array.isArray(state?.routes) ? state.routes : [];
    if (stackRoutes.length <= 1) {
      navigation?.navigate?.("RecipeListScreen");
      return;
    }
    navigation?.goBack?.();
  }, [navigation]);

  const handleSubmitReview = useCallback(async () => {
    const target = resolveReviewTarget(recipe, recipe?.sourceType ?? recipe?.source);
    const comment = String(reviewDraft ?? "").trim();
    const rating = Math.round(Number(reviewRating) || 0);

    if (!target) {
      Alert.alert("Review unavailable", "Recipe is missing source information.");
      return;
    }
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert("Select rating", "Please choose a rating from 1 to 5 stars.");
      return;
    }
    if (comment.length < 2) {
      Alert.alert("Add review", "Please enter at least 2 characters.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const result = await recipeApi.submitRecipeReview({
        sourceType: target.sourceType,
        recipeId: target.recipeId,
        rating,
        comment,
      });

      const summaryRatingRaw = Number(result?.summary?.averageRating ?? result?.summary?.rating);
      const summaryTotalRaw = Number(result?.summary?.reviewCount ?? result?.summary?.count);
      const summaryRating = Number.isFinite(summaryRatingRaw) ? Math.max(0, summaryRatingRaw) : recipe.rating;
      const summaryTotal = Number.isFinite(summaryTotalRaw)
        ? Math.max(0, summaryTotalRaw)
        : recipe.totalRatings;

      setRecipeData((prev) => ({
        ...prev,
        rating: summaryRating,
        totalRatings: summaryTotal,
        userRating: rating,
      }));
      setBaseRecipeData((prev) => ({
        ...prev,
        rating: summaryRating,
        totalRatings: summaryTotal,
        userRating: rating,
      }));

      setReviewDraft("");
      await loadReviews({
        ...recipe,
        sourceType: target.sourceType,
        source: target.sourceType,
        id: target.recipeId,
      });
      Alert.alert("Review saved", "Your rating and comment were submitted.");
    } catch (error) {
      Alert.alert("Submit failed", error?.message ?? "Unable to submit review right now.");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [recipe, reviewDraft, reviewRating, loadReviews]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.pageChrome}>
      <ScrollView
        ref={scrollRef}
        style={[
          styles.flex1,
          styles.scrollViewport,
          Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        {...verticalScrollProps}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={32}
        onLayout={(e) => {
          layoutHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={handleClampScroll}
      >
        <View style={styles.heroPad}>
          <View style={styles.heroRelative}>
            {String(recipe.imageUrl ?? "").trim() ? (
              <Image
                source={{ uri: String(recipe.imageUrl).trim() }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.heroPlaceholder} accessibilityRole="image" accessibilityLabel="No recipe image">
                <Ionicons name="image-outline" size={56} color="#a8a29e" />
              </View>
            )}
            <Pressable
              onPress={handleBackPress}
              style={styles.heroBackBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </Pressable>
            <Pressable
              onPress={handleToggleBookmark}
              style={styles.bookmarkBtn}
              accessibilityRole="button"
              accessibilityLabel="Toggle bookmark"
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isSaved ? C.primary : C.white}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.minH0}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={C.primary} />
              <Text style={styles.loadingText}>Loading recipe details...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bodyPad}>
          <View style={styles.titleRow}>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Pressable
              onPress={handleShare}
              style={styles.shareBtn}
              accessibilityRole="button"
              accessibilityLabel="Share recipe"
            >
              <Ionicons name="share-outline" size={22} color={C.primary} />
            </Pressable>
          </View>
          {recipe.description ? <Text style={styles.desc}>{recipe.description}</Text> : null}
          <View style={styles.badgeRow}>
            {recipe.source ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {recipe.source === "community" ? "Community" : "Library"}
                </Text>
              </View>
            ) : null}
            {recipe.cuisine ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{recipe.cuisine}</Text>
              </View>
            ) : null}
            {recipe.authorName ? (
              <View style={styles.authorChip}>
                <Ionicons name="person-circle-outline" size={16} color={C.slate600} />
                <Text style={styles.authorChipText}>By {recipe.authorName}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <MetaItem
              label="Rating"
              value={`${(Number(recipe.rating) || 0).toFixed(1)} / 5`}
            />
            <MetaItem label="Time" value={`${recipe.timeMinutes} mins`} />
            <MetaItem label="Servings" value={`${Number(baseRecipeData.servings) || 1}`} />
            <MetaItem label="Difficulty" value={recipe.difficulty} />
          </View>
        </View>

        <View style={styles.sectionPad}>
          <View style={styles.scaleCard}>
            <Text style={styles.scaleTitle}>Serving scale</Text>
            <View style={styles.pickerShell}>
              <Picker
                selectedValue={scaleValue}
                onValueChange={(v) => handleScaleChange(Number(v))}
                style={{ minHeight: 48 }}
                accessibilityLabel="Serving scale"
              >
                {SERVING_SCALE_OPTIONS.map((opt) => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>

            <View style={styles.servingsBlock}>
              <Text style={styles.servingsNumber}>{displayedServings}</Text>
              <Text style={styles.servingsLabel}>servings</Text>
            </View>

            {isScaling ? (
              <View style={styles.scalingRow}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.scalingText}>Updating quantities...</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionPad}>
          <View style={styles.tabsOuter}>
            <View style={styles.tabBar}>
              {["ingredients", "instructions", "nutrition"].map((tab) => {
                const selected = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabCell, selected ? styles.tabCellActive : styles.tabCellInactive]}
                  >
                    <Text
                      style={[styles.tabCellText, selected ? styles.tabCellTextActive : styles.tabCellTextInactive]}
                      numberOfLines={1}
                    >
                      {tab === "ingredients"
                        ? "Ingredients"
                        : tab === "instructions"
                          ? "Instructions"
                          : "Nutrition"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.tabBody}>{renderTabContent()}</View>
          </View>

          <View style={styles.reviewComposerCard}>
            <Text style={styles.reviewComposerTitle}>Your review</Text>
            <Text style={styles.reviewComposerHint}>Choose stars and write a short comment.</Text>
            <View style={styles.reviewStarsWrap}>
              <StarRating
                rating={Number(reviewRating) || 0}
                maxStars={5}
                starSize={30}
                color="#F59E0B"
                emptyColor="#D1D5DB"
                enableHalfStar={false}
                onChange={(value) => setReviewRating(Math.round(value))}
                enableSwiping={false}
              />
            </View>
            <TextInput
              value={reviewDraft}
              onChangeText={setReviewDraft}
              placeholder="Share your experience with this recipe..."
              placeholderTextColor="#94A3B8"
              style={styles.reviewInput}
              multiline
              maxLength={1200}
              textAlignVertical="top"
            />
            <Text style={styles.reviewInputCounter}>{reviewDraft.trim().length}/1200</Text>
            <Pressable
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
              style={[styles.reviewSubmitBtn, isSubmittingReview ? styles.reviewSubmitBtnDisabled : null]}
            >
              {isSubmittingReview ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.reviewSubmitBtnText}>Submit review</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.reviewListCard}>
            <View style={styles.reviewListHeader}>
              <Text style={styles.reviewListTitle}>Community reviews</Text>
              <Text style={styles.reviewListCount}>{reviewItems.length}</Text>
            </View>
            {isReviewsLoading ? (
              <View style={styles.reviewListLoading}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.reviewListLoadingText}>Loading reviews...</Text>
              </View>
            ) : reviewItems.length === 0 ? (
              <Text style={styles.reviewEmptyText}>No reviews yet. Be the first to leave one.</Text>
            ) : (
              reviewItems.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.reviewItem,
                    index < reviewItems.length - 1 ? styles.reviewItemBorder : null,
                  ]}
                >
                  <View style={styles.reviewItemTop}>
                    <View style={styles.reviewAuthorWrap}>
                      <Ionicons name="person-circle-outline" size={18} color={C.slate600} />
                      <Text style={styles.reviewAuthor} numberOfLines={1}>
                        {item.userName || "NutriHelp user"}
                      </Text>
                    </View>
                    <Text style={styles.reviewDate}>{formatReviewDate(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.reviewStarsText}>{"★".repeat(Math.max(0, Math.min(5, item.rating)))}</Text>
                  <Text style={styles.reviewComment}>{item.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  pageChrome: { flex: 1 },
  scrollViewport: { backgroundColor: "#FFFFFF" },
  flex1: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  heroPad: { paddingHorizontal: 18, paddingTop: 8 },
  heroRelative: { position: "relative" },
  heroImage: {
    height: 256,
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
  },
  heroPlaceholder: {
    height: 256,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: "#E5E7EB",
  },
  heroBackBtn: {
    position: "absolute",
    left: 12,
    top: 12,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  bookmarkBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  minH0: { minHeight: 0 },
  loadingRow: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  loadingText: { marginLeft: 8, fontSize: 16, color: C.primary },
  bodyPad: { paddingHorizontal: 18 },
  titleRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  recipeTitle: {
    minWidth: 0,
    flex: 1,
    paddingRight: 4,
    fontSize: 30,
    fontWeight: "600",
    color: "#253B63",
  },
  shareBtn: {
    marginTop: 4,
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  desc: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: C.slate600,
  },
  badgeRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.slate700,
  },
  authorChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  authorChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.slate600,
  },
  metaRow: { marginTop: 12, flexDirection: "row", gap: 8 },
  metaItem: {
    ...STAT_SHADOW,
    minWidth: 0,
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metaLabel: { fontSize: 12, color: C.slate500 },
  metaValue: { fontSize: 16, fontWeight: "600", color: C.slate800 },
  sectionPad: { paddingHorizontal: 18, marginTop: 12 },
  scaleCard: {
    ...SURFACE_SHADOW,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  scaleTitle: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    color: C.slate700,
  },
  pickerShell: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
  },
  servingsBlock: { marginTop: 12, alignItems: "center" },
  servingsNumber: { fontSize: 24, fontWeight: "600", color: C.navy },
  servingsLabel: { fontSize: 16, color: C.gray500 },
  scalingRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  scalingText: { marginLeft: 8, fontSize: 14, color: C.primary },
  tabsOuter: {
    ...SURFACE_SHADOW,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    padding: 12,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    padding: 4,
  },
  tabCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  tabCellActive: { backgroundColor: C.primary },
  tabCellInactive: { backgroundColor: "transparent" },
  tabCellText: { textAlign: "center", fontSize: 14, fontWeight: "600" },
  tabCellTextActive: { color: C.white },
  tabCellTextInactive: { color: C.slate700 },
  tabBody: { marginTop: 8 },
  tabPad: { paddingHorizontal: 4, paddingVertical: 8 },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  ingredientRowBorder: { borderBottomWidth: 1, borderBottomColor: C.gray100 },
  ingredientName: { marginRight: 24, flex: 1, fontSize: 16, fontWeight: "600", color: C.slate900 },
  ingredientQty: { fontSize: 16, fontWeight: "600", color: C.primary },
  instructionBlock: { paddingVertical: 8 },
  instructionBlockBorder: { borderBottomWidth: 1, borderBottomColor: C.gray100 },
  stepLabel: { fontSize: 16, fontWeight: "600", color: C.primary },
  stepTitle: { marginTop: 4, fontSize: 18, fontWeight: "600", color: C.slate800 },
  stepDesc: { marginTop: 4, fontSize: 16, lineHeight: 24, color: C.slate600 },
  nutritionShell: { borderRadius: 12, backgroundColor: "#F9FAFB", padding: 12 },
  nutritionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  nutritionRowBorder: { borderBottomWidth: 1, borderBottomColor: C.gray300 },
  nutritionName: { fontSize: 16, color: C.slate600 },
  nutritionValue: { fontSize: 16, fontWeight: "600", color: C.slate800 },
  nutritionEmptyText: { fontSize: 14, color: C.slate500, textAlign: "center", paddingVertical: 10 },
  reviewComposerCard: {
    ...SURFACE_SHADOW,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    padding: 12,
  },
  reviewComposerTitle: { fontSize: 18, fontWeight: "700", color: "#253B63" },
  reviewComposerHint: { marginTop: 2, fontSize: 13, color: C.slate500 },
  reviewStarsWrap: { marginTop: 8, alignItems: "flex-start" },
  reviewInput: {
    marginTop: 8,
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.slate800,
  },
  reviewInputCounter: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 12,
    color: C.slate500,
  },
  reviewSubmitBtn: {
    marginTop: 8,
    minHeight: 44,
    minWidth: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },
  reviewSubmitBtnDisabled: {
    opacity: 0.75,
  },
  reviewSubmitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reviewListCard: {
    ...SURFACE_SHADOW,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reviewListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reviewListTitle: { fontSize: 18, fontWeight: "700", color: "#253B63" },
  reviewListCount: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reviewListLoading: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewListLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: C.primary,
  },
  reviewEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: C.slate500,
  },
  reviewItem: {
    marginTop: 12,
    paddingBottom: 12,
  },
  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  reviewItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewAuthorWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAuthor: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "700",
    color: C.slate800,
  },
  reviewDate: {
    fontSize: 12,
    color: C.slate500,
  },
  reviewStarsText: {
    marginTop: 6,
    fontSize: 14,
    color: "#F59E0B",
    letterSpacing: 1.2,
  },
  reviewComment: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: C.slate700,
  },
});
