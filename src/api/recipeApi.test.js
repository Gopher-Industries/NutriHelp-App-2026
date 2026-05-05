const mockBaseApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

class MockApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

jest.mock("./baseApi", () => ({
  __esModule: true,
  default: mockBaseApi,
  ApiError: MockApiError,
}));

const {
  createRecipe,
  getRecipeById,
  getRecipes,
  rateRecipe,
  searchRecipes,
} = require("./recipeApi");

describe("recipeApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets recipes via /recipe", async () => {
    mockBaseApi.post.mockResolvedValueOnce({ recipes: [] });

    await getRecipes({ userId: 7 });

    expect(mockBaseApi.post).toHaveBeenCalledWith("/recipe", { user_id: 7 });
  });

  it("gets recipe by id using direct detail endpoint when available", async () => {
    mockBaseApi.get.mockResolvedValueOnce({ id: 2 });

    const result = await getRecipeById(2);

    expect(mockBaseApi.get).toHaveBeenCalledWith("/recipe/2");
    expect(result).toEqual({ id: 2 });
  });

  it("falls back to recipe list lookup when detail endpoint is missing", async () => {
    mockBaseApi.get.mockRejectedValueOnce(new MockApiError("Not found", 404));
    mockBaseApi.get.mockRejectedValueOnce(new MockApiError("Not found", 404));
    mockBaseApi.post.mockResolvedValueOnce({
      recipes: [{ id: 99, recipe_name: "Pho" }],
    });

    const result = await getRecipeById(99, { userId: 10 });

    expect(mockBaseApi.post).toHaveBeenCalledWith("/recipe", { user_id: 10 });
    expect(result).toEqual({ id: 99, recipe_name: "Pho" });
  });

  it("creates recipe via /recipe/createRecipe", async () => {
    const payload = { name: "Rice Bowl", ingredients: [] };
    mockBaseApi.post.mockResolvedValueOnce({ ok: true });

    await createRecipe(payload);

    expect(mockBaseApi.post).toHaveBeenCalledWith("/recipe/createRecipe", payload);
  });

  it("searches recipes via /filter first", async () => {
    mockBaseApi.get.mockResolvedValueOnce([{ id: 1 }]);

    await searchRecipes({ dietary: "vegan", allergies: "peanut" });

    expect(mockBaseApi.get).toHaveBeenCalledWith("/filter", {
      query: { dietary: "vegan", allergies: "peanut" },
    });
  });

  it("falls back to /recipe/rate when /recipe/:id/rate is unavailable", async () => {
    mockBaseApi.post.mockRejectedValueOnce(new MockApiError("Not found", 404));
    mockBaseApi.post.mockResolvedValueOnce({ message: "rated" });

    const result = await rateRecipe(12, { rating: 5 });

    expect(mockBaseApi.post).toHaveBeenNthCalledWith(1, "/recipe/12/rate", { rating: 5 });
    expect(mockBaseApi.post).toHaveBeenNthCalledWith(2, "/recipe/rate", {
      recipe_id: 12,
      rating: 5,
    });
    expect(result).toEqual({ message: "rated" });
  });
});
