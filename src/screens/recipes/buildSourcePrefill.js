const text = (value) => value == null ? "" : String(value);

export default function buildSourcePrefill({ draft, unmapped_fields = [] }) {
  const fields = {
    recipeName: text(draft.recipe_name), cuisine: text(draft.cuisine_name),
    cookingMethod: text(draft.cooking_method_name), timeMinutes: text(draft.cook_time_minutes),
    servings: text(draft.servings),
  };
  const ingredients = (draft.ingredients || []).map((item, index) => ({
    id: index + 1, name: text(item.matched_name || item.name),
    ingredientId: item.ingredient_id ?? null, category: text(item.category),
    quantity: text(item.quantity), unit: text(item.unit), cost: "",
  }));
  const steps = (draft.instructions || []).map(text).filter((step) => step.trim())
    .map((step, index) => ({ id: index + 1, text: step }));
  const labels = { recipeName: "Recipe name", cuisine: "Cuisine", cookingMethod: "Cooking method", timeMinutes: "Cooking time", servings: "Servings" };
  const missing = Object.keys(fields).filter((key) => !fields[key]).map((key) => labels[key]);
  if (!ingredients.length) missing.push("Ingredients");
  if (!steps.length) missing.push("Instructions");
  if (ingredients.some((item) => !item.category)) missing.push("Ingredient categories");
  if (ingredients.some((item) => !item.quantity)) missing.push("Ingredient quantities");
  if (ingredients.some((item) => !item.unit)) missing.push("Ingredient units (source measures are kept in Quantity)");
  // These mobile fields cannot be reliably inferred from a source recipe.
  missing.push("Ingredient costs", "Nutrition", "Category and difficulty (review existing choices)");
  return { fields, ingredients, steps, missing: [...new Set([...missing, ...unmapped_fields.map((field) => field.replace(/_/g, " "))])] };
}
