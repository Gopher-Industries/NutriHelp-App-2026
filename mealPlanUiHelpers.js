const RECIPE_IMAGES = [
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80",
];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"];
export const SUMMARY_COLORS = {
  Protein: "#1877F2",
  Fiber: "#39D353",
  Sugar: "#FF4D00",
  Sodium: "#FFC400",
};

export function formatDisplayName(value = "") {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function sameDay(left, right) {
  if (!left || !right) {
    return false;
  }
  return String(left).slice(0, 10) === String(right).slice(0, 10);
}

export function getWeekDates(anchor = new Date()) {
  const base = new Date(anchor);
  const current = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const start = new Date(current);
  start.setDate(current.getDate() - current.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function monthYearLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function normalizeMealItems(response) {
  const items =
    response?.data?.items ||
    response?.items ||
    response?.mealPlans ||
    response?.mealPlan ||
    [];

  return Array.isArray(items) ? items : [];
}

function toNumber(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

export function normalizeRecipe(recipe, mealType, index = 0) {
  const title =
    recipe?.title ||
    recipe?.recipe_name ||
    `${formatDisplayName(mealType)} Idea ${index + 1}`;

  return {
    id: recipe?.id || recipe?.recipeId || recipe?.recipe_id || `${mealType}-${index}`,
    title,
    imageUrl: recipe?.imageUrl || recipe?.image_url || RECIPE_IMAGES[index % RECIPE_IMAGES.length],
    calories: toNumber(recipe?.nutrition?.calories ?? recipe?.calories),
    protein: toNumber(recipe?.nutrition?.protein ?? recipe?.protein),
    fiber: toNumber(recipe?.nutrition?.fiber ?? recipe?.fiber),
    sugar: toNumber(recipe?.nutrition?.sugar ?? recipe?.sugar),
    sodium: toNumber(recipe?.nutrition?.sodium ?? recipe?.sodium),
  };
}

export function groupMealsByType(items = [], date = new Date()) {
  return MEAL_TYPES.map((mealType) => {
    const matchingItems = items.filter((item) => {
      const itemMealType = String(item?.mealType || item?.meal_type || "").toLowerCase();
      const itemDate = item?.date || item?.createdAt || item?.created_at;
      return itemMealType === mealType && sameDay(itemDate, date);
    });

    const recipes = matchingItems.flatMap((item) =>
      (item?.recipes || []).map((recipe, index) => normalizeRecipe(recipe, mealType, index))
    );

    const fallbackRecipes =
      recipes.length > 0
        ? recipes
        : RECIPE_IMAGES.slice(0, 3).map((imageUrl, index) => ({
            id: `${mealType}-fallback-${index}`,
            title: `${formatDisplayName(mealType)} Choice ${index + 1}`,
            imageUrl,
            calories: 320 + index * 40,
            protein: 18 + index * 4,
            fiber: 6 + index * 2,
            sugar: 8 + index * 2,
            sodium: 1.2 + index * 0.3,
          }));

    return {
      mealType,
      title: formatDisplayName(mealType),
      recipes: fallbackRecipes,
      hasLiveData: recipes.length > 0,
    };
  });
}

export function buildNutritionSummary(recipes = []) {
  const totals = recipes.reduce(
    (acc, recipe) => {
      acc.protein += toNumber(recipe.protein);
      acc.fiber += toNumber(recipe.fiber);
      acc.sugar += toNumber(recipe.sugar);
      acc.sodium += toNumber(recipe.sodium);
      return acc;
    },
    { protein: 0, fiber: 0, sugar: 0, sodium: 0 }
  );

  const targets = {
    protein: 80,
    fiber: 30,
    sugar: 50,
    sodium: 5,
  };

  return [
    {
      label: "Protein",
      value: `${Math.round(totals.protein)} g`,
      progress: Math.min(totals.protein / targets.protein, 1),
      color: SUMMARY_COLORS.Protein,
    },
    {
      label: "Fiber",
      value: `${Math.round(totals.fiber)} g`,
      progress: Math.min(totals.fiber / targets.fiber, 1),
      color: SUMMARY_COLORS.Fiber,
    },
    {
      label: "Sugar",
      value: `${Math.round(totals.sugar)} g`,
      progress: Math.min(totals.sugar / targets.sugar, 1),
      color: SUMMARY_COLORS.Sugar,
    },
    {
      label: "Sodium",
      value: `${totals.sodium.toFixed(1)} g`,
      progress: Math.min(totals.sodium / targets.sodium, 1),
      color: SUMMARY_COLORS.Sodium,
    },
  ];
}
