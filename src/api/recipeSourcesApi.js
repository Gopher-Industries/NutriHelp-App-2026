import baseApi from "./baseApi";

// The configured base URL is the API host (without /api), as in recipeApi.
export async function searchRecipeSources(query, { signal } = {}) {
  const response = await baseApi.get("/api/recipe-sources/search", {
    query: { q: query.trim() }, signal,
  });
  if (!Array.isArray(response?.data?.results)) throw new Error("Invalid recipe search response.");
  return response.data.results;
}

export async function mapRecipeSource(source, externalId, { signal } = {}) {
  const response = await baseApi.post("/api/recipe-sources/map", {
    source, external_id: externalId,
  }, { signal, timeoutMs: 120000 });
  if (!response?.data?.draft || typeof response.data.draft !== "object") {
    throw new Error("Invalid recipe mapping response.");
  }
  const { ingredients, instructions } = response.data.draft;
  if ((ingredients != null && !Array.isArray(ingredients)) ||
      (instructions != null && !Array.isArray(instructions))) {
    throw new Error("Invalid recipe mapping response.");
  }
  return response.data;
}
