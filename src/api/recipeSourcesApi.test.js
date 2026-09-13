const mockApi = { get: jest.fn(), post: jest.fn() };
jest.mock("./baseApi", () => ({ __esModule: true, default: mockApi }));
const { searchRecipeSources, mapRecipeSource } = require("./recipeSourcesApi");
test("search uses authenticated baseApi with encoded query options and cancellation", async () => {
  const signal = new AbortController().signal;
  mockApi.get.mockResolvedValue({ data: { results: [{ title: "Soup" }] } });
  expect(await searchRecipeSources(" soup & rice ", { signal })).toEqual([{ title: "Soup" }]);
  expect(mockApi.get).toHaveBeenCalledWith("/api/recipe-sources/search", { query: { q: "soup & rice" }, signal });
});
test("mapping posts only source identity, with enough time for backend fallback", async () => {
  mockApi.post.mockResolvedValue({ data: { draft: { recipe_name: "Soup" } } });
  expect(await mapRecipeSource("themealdb", "1")).toEqual({ draft: { recipe_name: "Soup" } });
  expect(mockApi.post).toHaveBeenCalledWith("/api/recipe-sources/map", { source: "themealdb", external_id: "1" }, { timeoutMs: 120000, signal: undefined });
});
test("errors propagate rather than masquerading as empty results", async () => {
  mockApi.get.mockRejectedValue(new Error("Unauthorized"));
  await expect(searchRecipeSources("soup")).rejects.toThrow("Unauthorized");
  mockApi.post.mockRejectedValue(new Error("Unavailable"));
  await expect(mapRecipeSource("themealdb", "1")).rejects.toThrow("Unavailable");
});
test("rejects malformed envelopes", async () => {
  mockApi.get.mockResolvedValue({});
  mockApi.post.mockResolvedValue({ data: {} });
  await expect(searchRecipeSources("soup")).rejects.toThrow("Invalid");
  await expect(mapRecipeSource("themealdb", "1")).rejects.toThrow("Invalid");
});
