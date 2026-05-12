import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "nutrihelp.daily_meals";

function storageKey(date) {
  const d = typeof date === "string" ? date : date.toISOString().slice(0, 10);
  return `${PREFIX}.${d}`;
}

// Handles old single-object format and new array format.
function normalizeTypeData(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && value.title) return [value];
  return [];
}

export async function getDailyMeals(date) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(date));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const result = {};
    for (const [key, val] of Object.entries(parsed)) {
      result[key] = normalizeTypeData(val);
    }
    return result;
  } catch {
    return {};
  }
}

export async function saveDailyMeal(date, mealType, meal) {
  try {
    const current = await getDailyMeals(date);
    const type = String(mealType).toLowerCase();
    const existing = current[type] || [];
    const entry = meal._id ? meal : { ...meal, _id: Date.now().toString() };
    await AsyncStorage.setItem(
      storageKey(date),
      JSON.stringify({ ...current, [type]: [...existing, entry] })
    );
  } catch (err) {
    console.error("[dailyMealsStorage] save error:", err);
  }
}

export async function removeDailyMealItem(date, mealType, mealId) {
  try {
    const current = await getDailyMeals(date);
    const type = String(mealType).toLowerCase();
    const next = (current[type] || []).filter((m) => m._id !== mealId);
    await AsyncStorage.setItem(
      storageKey(date),
      JSON.stringify({ ...current, [type]: next })
    );
  } catch (err) {
    console.error("[dailyMealsStorage] remove error:", err);
  }
}
