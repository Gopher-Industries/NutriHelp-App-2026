import baseApi from "./baseApi";

const { get, post } = baseApi;

const MEAL_PLAN_ENDPOINTS = {
  weeklyPlan: "/api/mealplan",
  aiGenerate: "/api/meal-plan/ai-generate",
  feedback: "/api/meal-plan/feedback/:planId",
};

function buildPath(template, params = {}) {
  return Object.entries(params).reduce((path, [key, value]) => {
    return path.replace(`:${key}`, encodeURIComponent(String(value)));
  }, template);
}

function normalizeMealPlanItems(response) {
  const items = response?.data?.items || response?.items || response?.mealPlan || [];
  return Array.isArray(items) ? items : [];
}

function isSameDay(value, date) {
  if (!value || !date) {
    return false;
  }

  const a = new Date(value);
  const b = new Date(date);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export async function getWeeklyPlan({ userId } = {}) {
  return get(MEAL_PLAN_ENDPOINTS.weeklyPlan, {
    query: { user_id: userId },
  });
}

export async function getDailyPlan({ userId, date, mealType } = {}) {
  const weekly = await getWeeklyPlan({ userId });
  const items = normalizeMealPlanItems(weekly);

  return items.filter((item) => {
    const sameDay = date ? isSameDay(item.created_at || item.date, date) : true;
    const sameType = mealType
      ? String(item.meal_type || "").toLowerCase() === String(mealType).toLowerCase()
      : true;
    return sameDay && sameType;
  });
}

export async function updateDailyPlan(payload) {
  return post(MEAL_PLAN_ENDPOINTS.weeklyPlan, payload);
}

export async function generateAIPlan(payload) {
  return post(MEAL_PLAN_ENDPOINTS.aiGenerate, payload);
}

export async function submitPlanFeedback(planId, payload) {
  if (!planId) {
    throw new Error("submitPlanFeedback() requires planId.");
  }
  return post(buildPath(MEAL_PLAN_ENDPOINTS.feedback, { planId }), payload);
}

export async function saveMealToDaily(payload) {
  return post("/api/mealplan/ai-suggestion", payload);
}

const mealPlanApi = {
  getWeeklyPlan,
  getDailyPlan,
  updateDailyPlan,
  generateAIPlan,
  submitPlanFeedback,
  saveMealToDaily,
};

export default mealPlanApi;
