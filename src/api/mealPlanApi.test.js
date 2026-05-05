const mockBaseApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock("./baseApi", () => ({
  __esModule: true,
  default: mockBaseApi,
}));

const {
  generateAIPlan,
  getDailyPlan,
  getWeeklyPlan,
  submitPlanFeedback,
  updateDailyPlan,
} = require("./mealPlanApi");

describe("mealPlanApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets weekly plan with user query", async () => {
    mockBaseApi.get.mockResolvedValueOnce({ items: [] });

    await getWeeklyPlan({ userId: 12 });

    expect(mockBaseApi.get).toHaveBeenCalledWith("/mealplan", {
      query: { user_id: 12 },
    });
  });

  it("filters daily plan from weekly response", async () => {
    mockBaseApi.get.mockResolvedValueOnce({
      data: {
        items: [
          { created_at: "2026-05-03T09:00:00.000Z", meal_type: "breakfast" },
          { created_at: "2026-05-04T09:00:00.000Z", meal_type: "lunch" },
        ],
      },
    });

    const result = await getDailyPlan({
      userId: 12,
      date: "2026-05-03",
      mealType: "breakfast",
    });

    expect(result).toHaveLength(1);
    expect(result[0].meal_type).toBe("breakfast");
  });

  it("updates daily plan via /mealplan", async () => {
    const payload = { user_id: 12, recipe_ids: [1, 2], meal_type: "dinner" };
    mockBaseApi.post.mockResolvedValueOnce({ ok: true });

    await updateDailyPlan(payload);

    expect(mockBaseApi.post).toHaveBeenCalledWith("/mealplan", payload);
  });

  it("generates AI meal plan via /meal-plan/ai-generate", async () => {
    const payload = { dietType: "balanced" };
    mockBaseApi.post.mockResolvedValueOnce({ plan: [] });

    await generateAIPlan(payload);

    expect(mockBaseApi.post).toHaveBeenCalledWith("/meal-plan/ai-generate", payload);
  });

  it("submits feedback with plan id", async () => {
    const payload = { rating: 5, notes: "great plan" };
    mockBaseApi.post.mockResolvedValueOnce({ success: true });

    await submitPlanFeedback("plan_abc", payload);

    expect(mockBaseApi.post).toHaveBeenCalledWith("/meal-plan/feedback/plan_abc", payload);
  });
});
