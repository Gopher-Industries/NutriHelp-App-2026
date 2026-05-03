import baseApi, { ApiError } from "./baseApi";

const { get, post } = baseApi;

const RECIPE_ENDPOINTS = {
  list: "/recipe",
  detailCandidates: ["/recipe/:id", "/recipe/details/:id"],
  create: "/recipe/createRecipe",
  searchCandidates: ["/filter", "/recipe/search"],
  rateCandidates: ["/recipe/:id/rate", "/recipe/rate"],
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
  return post(RECIPE_ENDPOINTS.list, { user_id: userId });
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
  return post(RECIPE_ENDPOINTS.create, payload);
}

export async function searchRecipes(params = {}) {
  return tryCandidates(RECIPE_ENDPOINTS.searchCandidates, (candidate) =>
    get(candidate, { query: params })
  );
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

const recipeApi = {
  getRecipes,
  getRecipeById,
  createRecipe,
  searchRecipes,
  rateRecipe,
};

export default recipeApi;
