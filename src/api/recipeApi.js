import baseApi, { ApiError } from "./baseApi";

const { get, post } = baseApi;

const RECIPE_ENDPOINTS = {
  listCandidates: ["/recipe", "/api/recipe"],
  detailCandidates: [
    "/recipe/:id",
    "/recipe/details/:id",
    "/api/recipe/:id",
    "/api/recipe/details/:id",
  ],
  createCandidates: ["/recipe/createRecipe", "/api/recipe/createRecipe"],
  searchCandidates: ["/filter", "/recipe/search", "/api/filter", "/api/recipe/search"],
  communityCandidates: ["/recipe/community", "/api/recipe/community"],
  rateCandidates: ["/recipe/:id/rate", "/recipe/rate", "/api/recipe/:id/rate", "/api/recipe/rate"],
  cuisineCandidates: ["/fooddata/cuisines", "/api/fooddata/cuisines"],
  ingredientCandidates: ["/fooddata/ingredients", "/api/fooddata/ingredients"],
  cookingMethodCandidates: ["/fooddata/cookingmethods", "/api/fooddata/cookingmethods"],
  recipeLibraryAddMealCandidates: ["/recipe-library/add-meal", "/api/recipe-library/add-meal"],
  recipeLibraryPublicCandidates: ["/recipe-library/public", "/api/recipe-library/public"],
  reviewSummaryCandidates: ["/recipe-reviews/summary", "/api/recipe-reviews/summary"],
  reviewListCandidates: ["/recipe-reviews", "/api/recipe-reviews"],
  reviewSubmitCandidates: ["/recipe-reviews", "/api/recipe-reviews"],
};

function buildPath(template, params = {}) {
  return Object.entries(params).reduce((path, [key, value]) => {
    return path.replace(`:${key}`, encodeURIComponent(String(value)));
  }, template);
}

async function tryCandidates(candidates, requestBuilder) {
  let lastError = null;

  for (const candidate of candidates) {
    try {
      return await requestBuilder(candidate);
    } catch (error) {
      if (!(error instanceof ApiError) || (error.status !== 404 && error.status !== 405)) {
        throw error;
      }
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error("No endpoint candidates provided.");
}

export async function getRecipes({ userId } = {}) {
  return tryCandidates(RECIPE_ENDPOINTS.listCandidates, (candidate) =>
    post(candidate, { user_id: userId })
  );
}

export async function getRecipeById(recipeId, { userId } = {}) {
  if (!recipeId) {
    throw new Error("getRecipeById() requires recipeId.");
  }

  try {
    return await tryCandidates(RECIPE_ENDPOINTS.detailCandidates, (candidate) =>
      get(buildPath(candidate, { id: recipeId }))
    );
  } catch (error) {
    if (!userId) {
      throw error;
    }

    const data = await getRecipes({ userId });
    const list = Array.isArray(data?.recipes) ? data.recipes : [];
    const recipe = list.find((item) => String(item?.id) === String(recipeId));

    if (recipe) {
      return recipe;
    }

    throw new ApiError(`Recipe ${recipeId} not found`, 404, {
      recipe_id: recipeId,
    });
  }
}

export async function createRecipe(payload) {
  return tryCandidates(RECIPE_ENDPOINTS.createCandidates, (candidate) =>
    post(candidate, payload)
  );
}

export async function searchRecipes(params = {}) {
  return tryCandidates(RECIPE_ENDPOINTS.searchCandidates, (candidate) =>
    get(candidate, { query: params })
  );
}

export async function getCommunityRecipes(limit = 300) {
  return tryCandidates(RECIPE_ENDPOINTS.communityCandidates, (candidate) =>
    get(candidate, {
      query: { limit },
    })
  );
}

export async function getRecipeLibraryForAddMeal({ limit = 500, cacheBust = true } = {}) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 500));
  const ts = cacheBust ? Date.now() : null;

  try {
    return await tryCandidates(RECIPE_ENDPOINTS.recipeLibraryAddMealCandidates, (candidate) =>
      get(candidate, {
        query: {
          limit: safeLimit,
          ...(ts ? { ts } : {}),
        },
      })
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return tryCandidates(RECIPE_ENDPOINTS.recipeLibraryPublicCandidates, (candidate) =>
        get(candidate, {
          query: {
            limit: safeLimit,
            ...(ts ? { ts } : {}),
          },
        })
      );
    }
    throw error;
  }
}

function normalizeLookupRows(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }
  return [];
}

export async function getCuisineList() {
  const response = await tryCandidates(RECIPE_ENDPOINTS.cuisineCandidates, (candidate) =>
    get(candidate)
  );
  return normalizeLookupRows(response, ["cuisines"]);
}

export async function getIngredientsList() {
  const response = await tryCandidates(RECIPE_ENDPOINTS.ingredientCandidates, (candidate) =>
    get(candidate)
  );
  return normalizeLookupRows(response, ["ingredients"]);
}

export async function getCookingMethodList() {
  const response = await tryCandidates(RECIPE_ENDPOINTS.cookingMethodCandidates, (candidate) =>
    get(candidate)
  );
  return normalizeLookupRows(response, ["cookingMethods"]);
}

export async function rateRecipe(recipeId, payload = {}) {
  if (!recipeId) {
    throw new Error("rateRecipe() requires recipeId.");
  }

  return tryCandidates(RECIPE_ENDPOINTS.rateCandidates, (candidate) => {
    if (candidate.includes(":id")) {
      return post(buildPath(candidate, { id: recipeId }), payload);
    }
    return post(candidate, { recipe_id: recipeId, ...payload });
  });
}

export function normalizeRecipeReviewSourceType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "library" || normalized === "catalog") {
    return "recipe_library";
  }
  if (normalized === "recipe_library" || normalized === "community") {
    return normalized;
  }
  return "";
}

export function normalizeRecipeReviewId(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function getRecipeReviewKey(sourceType, recipeId) {
  const normalizedSource = normalizeRecipeReviewSourceType(sourceType);
  const normalizedId = normalizeRecipeReviewId(recipeId);
  return normalizedSource && normalizedId ? `${normalizedSource}:${normalizedId}` : "";
}

export async function fetchRecipeReviewSummaries(items = []) {
  const payloadItems = items
    .map((item) => ({
      source_type: normalizeRecipeReviewSourceType(
        item?.sourceType ?? item?.source ?? item?.source_type
      ),
      recipe_id: normalizeRecipeReviewId(item?.recipeId ?? item?.recipe_id ?? item?.id),
    }))
    .filter((item) => item.source_type && item.recipe_id);

  if (payloadItems.length === 0) {
    return {};
  }

  const response = await tryCandidates(RECIPE_ENDPOINTS.reviewSummaryCandidates, (candidate) =>
    post(candidate, { items: payloadItems })
  );

  if (response && typeof response === "object" && response.data && typeof response.data === "object") {
    return response.data;
  }
  return response && typeof response === "object" ? response : {};
}

export async function fetchRecipeReviews(sourceType, recipeId) {
  const normalizedSourceType = normalizeRecipeReviewSourceType(sourceType);
  const normalizedRecipeId = normalizeRecipeReviewId(recipeId);

  if (!normalizedSourceType || !normalizedRecipeId) {
    return { items: [], summary: { averageRating: null, reviewCount: 0 } };
  }

  const response = await tryCandidates(RECIPE_ENDPOINTS.reviewListCandidates, (candidate) =>
    get(candidate, {
      query: {
        source_type: normalizedSourceType,
        recipe_id: normalizedRecipeId,
      },
    })
  );

  const root = response?.data ? response : { data: response };
  const items = Array.isArray(root?.data) ? root.data : [];
  const summary = root?.summary ?? { averageRating: null, reviewCount: 0 };
  return { items, summary };
}

export async function submitRecipeReview({
  sourceType,
  recipeId,
  rating,
  comment,
}) {
  const normalizedSourceType = normalizeRecipeReviewSourceType(sourceType);
  const normalizedRecipeId = normalizeRecipeReviewId(recipeId);

  if (!normalizedSourceType || !normalizedRecipeId) {
    throw new Error("Valid sourceType and recipeId are required.");
  }

  const response = await tryCandidates(RECIPE_ENDPOINTS.reviewSubmitCandidates, (candidate) =>
    post(candidate, {
      source_type: normalizedSourceType,
      recipe_id: normalizedRecipeId,
      rating,
      comment,
    })
  );

  const root = response?.data ? response : { data: response };
  return {
    item: root?.data ?? null,
    summary: root?.summary ?? { averageRating: null, reviewCount: 0 },
  };
}

const recipeApi = {
  getRecipes,
  getRecipeById,
  createRecipe,
  searchRecipes,
  getCommunityRecipes,
  getRecipeLibraryForAddMeal,
  getCuisineList,
  getIngredientsList,
  getCookingMethodList,
  rateRecipe,
  fetchRecipeReviewSummaries,
  fetchRecipeReviews,
  submitRecipeReview,
  getRecipeReviewKey,
  normalizeRecipeReviewSourceType,
  normalizeRecipeReviewId,
};

export default recipeApi;
