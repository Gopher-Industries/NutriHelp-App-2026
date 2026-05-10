import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Share, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ScrollView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import baseApi from "../../api/baseApi";
import RecipeRating from "../../components/RecipeRating";
import { useUser } from "../../context/UserContext";
import recipeApi from "../../api/recipeApi";

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
    ingredients: [],
    instructions: [],
    nutrition: [],
  };
}

function MetaItem({ label, value }) {
  return (
    <View className="min-w-0 flex-1 rounded-xl bg-white px-2 py-2" style={{ flexBasis: 0 }}>
      <Text className="text-xs text-slate-500">{label}</Text>
      <Text className="text-base font-semibold text-slate-800" numberOfLines={2}>
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

  const recipeId = route?.params?.recipeId;
  const routeRecipe = route?.params?.recipe;

  const scrollRef = useRef(null);
  const scrollYRef = useRef(0);
  const layoutHeightRef = useRef(0);

  function normalizeRecipe(raw) {
    return {
      id: String(raw?.id ?? raw?.recipe_id ?? ""),
      title: raw?.title ?? raw?.name ?? raw?.recipe_name ?? "",
      description: raw?.description ?? raw?.summary ?? raw?.details ?? "",
      imageUrl: pickRecipeImageUrl(raw),
      rating: Number(raw?.rating ?? raw?.avg_rating ?? 0) || 0,
      totalRatings:
        Number(raw?.totalRatings ?? raw?.total_ratings ?? raw?.rating_count ?? raw?.num_ratings ?? 0) ||
        0,
      userRating: Number(
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
      ingredients: Array.isArray(raw?.ingredients)
        ? raw.ingredients.map((item) => ({
            quantity: String(item?.quantity ?? item?.amount ?? ""),
            unit: String(item?.unit ?? "").trim(),
            name: item?.name ?? item?.ingredient ?? "Ingredient",
          }))
        : [],
      instructions: Array.isArray(raw?.instructions)
        ? raw.instructions.map((step, index) => ({
            number: Number(step?.number ?? step?.step ?? index + 1),
            title: step?.title ?? `Step ${index + 1}`,
            description: step?.description ?? step?.content ?? "",
          }))
        : [],
      nutrition: Array.isArray(raw?.nutrition)
        ? raw.nutrition.map((item) => ({
            name: item?.name ?? item?.label ?? "Nutrition",
            value: String(item?.value ?? item?.amount ?? "-"),
          }))
        : [],
    };
  }

  useEffect(() => {
    let active = true;

    const loadRecipe = async () => {
      if (routeRecipe && active) {
        const normalizedFromRoute = normalizeRecipe(routeRecipe);
        setRecipeData(normalizedFromRoute);
        setBaseRecipeData(normalizedFromRoute);
      }

      if (!recipeId) {
        if (!routeRecipe) {
          setRecipeData(detailPlaceholder("", "no-id"));
          setBaseRecipeData(detailPlaceholder("", "no-id"));
        }
        return;
      }

      setIsLoading(true);

      try {
        const response = await recipeApi.getRecipeById(recipeId, { userId: effectiveUserId });
        const rawRecipe = response?.recipe ?? response?.data?.recipe ?? response;
        if (active) {
          const normalized = normalizeRecipe(rawRecipe);
          setRecipeData(normalized);
          setBaseRecipeData(normalized);
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
  }, [recipeId, effectiveUserId, routeRecipe]);

  useEffect(() => {
    setScaleValue(1);
  }, [recipeId]);

  const recipe = useMemo(() => recipeData, [recipeData]);
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
        <View className="px-1 py-2">
          {recipe.ingredients.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              className="flex-row items-center justify-between border-b border-gray-100 py-3"
            >
              <Text className="mr-6 flex-1 text-base font-semibold text-slate-900">{item.name}</Text>
              <Text className="text-base font-semibold text-[#1A6DB5]">
                {[item.quantity, item.unit].filter(Boolean).join(" ")}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    if (activeTab === "instructions") {
      return (
        <View className="px-1 py-2">
          {recipe.instructions.map((step, index) => (
            <View
              key={step.number}
              className={index === recipe.instructions.length - 1 ? "py-2" : "border-b border-gray-100 py-2"}
            >
              <Text className="text-base font-semibold text-[#1A6DB5]">
                Step {String(step.number).padStart(2, "0")} of{" "}
                {String(recipe.instructions.length).padStart(2, "0")}
              </Text>
              <Text className="mt-1 text-lg font-semibold text-slate-800">{step.title}</Text>
              <Text className="mt-1 text-base leading-6 text-slate-600">{step.description}</Text>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View className="px-1 py-2">
        <View className="rounded-xl bg-stone-100 p-3">
          {recipe.nutrition.map((item, index) => (
            <View
              key={item.name}
              className={
                index === recipe.nutrition.length - 1
                  ? "flex-row items-center justify-between py-3"
                  : "flex-row items-center justify-between border-b border-gray-300 py-3"
              }
            >
              <Text className="text-base text-slate-600">{item.name}</Text>
              <Text className="text-base font-semibold text-slate-800">{item.value}</Text>
            </View>
          ))}
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
    if (recipe.imageUrl) {
      parts.push(String(recipe.imageUrl));
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

  return (
    <View className="flex-1 bg-stone-100">
      <ScrollView
        ref={scrollRef}
        style={[
          { flex: 1 },
          Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
        ]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
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
        <View className="px-4 pt-4">
          <View className="relative">
            {String(recipe.imageUrl ?? "").trim() ? (
              <Image
                source={{ uri: String(recipe.imageUrl).trim() }}
                className="h-64 w-full rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <View
                className="h-64 w-full items-center justify-center rounded-2xl bg-stone-200"
                accessibilityRole="image"
                accessibilityLabel="No recipe image"
              >
                <Ionicons name="image-outline" size={56} color="#a8a29e" />
              </View>
            )}
            <Pressable
              onPress={() => navigation?.goBack?.()}
              className="absolute left-3 top-3 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/40"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-lg font-semibold text-white">{"<"}</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsSaved((prev) => !prev)}
              className="absolute right-3 top-3 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/45"
              accessibilityRole="button"
              accessibilityLabel="Toggle bookmark"
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isSaved ? "#1A6DB5" : "#FFFFFF"}
              />
            </Pressable>
          </View>
        </View>

        <View className="min-h-0">
          {isLoading ? (
            <View className="mb-2 mt-4 flex-row items-center px-4">
              <ActivityIndicator size="small" color="#1A6DB5" />
              <Text className="ml-2 text-base text-[#1A6DB5]">Loading recipe details...</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4">
          <View className="mt-3 flex-row items-start gap-2">
            <Text className="min-w-0 flex-1 pr-1 text-3xl font-semibold text-slate-900">{recipe.title}</Text>
            <Pressable
              onPress={handleShare}
              className="mt-1 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-gray-200 bg-white"
              accessibilityRole="button"
              accessibilityLabel="Share recipe"
            >
              <Ionicons name="share-outline" size={22} color="#1A6DB5" />
            </Pressable>
          </View>
          {recipe.description ? (
            <Text className="mt-2 text-base leading-6 text-slate-600">{recipe.description}</Text>
          ) : null}
          <View className="mt-3 flex-row gap-2">
            <MetaItem label="Rating" value={`${recipe.rating} / 5`} />
            <MetaItem label="Cooking Time" value={`${recipe.timeMinutes} mins`} />
            <MetaItem
              label="Servings"
              value={`${Number(baseRecipeData.servings) || 1}`}
            />
            <MetaItem label="Difficulty" value={recipe.difficulty} />
          </View>
        </View>

        <View className="mt-3 px-4">
          <View className="rounded-xl border border-gray-300 bg-white px-3 py-3">
            <Text className="mb-2 text-center text-sm font-semibold text-slate-700">
              Serving scale
            </Text>
            <View className="min-h-[48px] justify-center rounded-xl border border-gray-300 bg-white">
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

            <View className="mt-3 items-center">
              <Text className="text-2xl font-semibold text-[#0f2454]">{displayedServings}</Text>
              <Text className="text-base text-gray-500">servings</Text>
            </View>

            {isScaling ? (
              <View className="mt-2 flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#1A6DB5" />
                <Text className="ml-2 text-sm text-[#1A6DB5]">Updating quantities...</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="mt-3 px-4">
          <View className="rounded-2xl bg-white p-3">
            <View className="flex-row rounded-xl border border-gray-300 bg-white p-1">
              {["ingredients", "instructions", "nutrition"].map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{ flex: 1, flexBasis: 0, minWidth: 0 }}
                  className={`min-h-[44px] items-center justify-center rounded-lg px-1 ${
                    activeTab === tab ? "bg-[#1A6DB5]" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      activeTab === tab ? "text-white" : "text-slate-700"
                    }`}
                    numberOfLines={1}
                  >
                    {tab === "ingredients"
                      ? "Ingredients"
                      : tab === "instructions"
                        ? "Instructions"
                        : "Nutrition"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-2">{renderTabContent()}</View>
          </View>

          <View className="mt-4">
            <RecipeRating
              recipeId={recipe.id}
              averageRating={recipe.rating}
              totalRatings={recipe.totalRatings}
              userRating={recipe.userRating}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
