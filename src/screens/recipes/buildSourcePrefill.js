const text = (value) => value == null ? "" : String(value);
const UNIT_ALIASES = {
  cup: "cups", cups: "cups", tablespoon: "tbsp", tablespoons: "tbsp", tbls: "tbsp", tbs: "tbsp",
  teaspoon: "tsp", teaspoons: "tsp", gram: "g", grams: "g",
  milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  piece: "pcs", pieces: "pcs",
};
const unit = (value) => UNIT_ALIASES[text(value).trim().toLowerCase()] || text(value).trim();
// These source fields have no editable controls in the mobile recipe form.
const NON_EDITABLE_SOURCE_FIELDS = new Set([
  "category", "meal_type", "difficulty", "nutrition",
  "calories", "protein", "carbs", "carbohydrates", "fat",
]);

export default function buildSourcePrefill({ draft, source_image, unmapped_fields = [] }) {
  const sourceImageData = typeof source_image === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(source_image) ? source_image : "";
  const imageUri = sourceImageData || text(draft.image_url);
  const fields = {
    recipeName: text(draft.recipe_name), cuisine: text(draft.cuisine_name),
    cookingMethod: text(draft.cooking_method_name), timeMinutes: text(draft.cook_time_minutes),
    servings: text(draft.servings),
  };
  const ingredients = (draft.ingredients || []).map((item, index) => ({
    id: index + 1, name: text(item.matched_name || item.name),
    ingredientId: item.ingredient_id ?? null, category: text(item.category),
    quantity: text(item.quantity), unit: unit(item.unit), cost: "",
    sourceMeasure: text(item.source_measure), notes: text(item.notes),
  }));
  const steps = (draft.instructions || []).map(text).filter((step) => step.trim())
    .map((step, index) => ({ id: index + 1, text: step }));
  const labels = { recipeName: "Recipe name", cuisine: "Cuisine", cookingMethod: "Cooking method", timeMinutes: "Cooking time", servings: "Servings" };
  const missing = Object.keys(fields).filter((key) => !fields[key]).map((key) => labels[key]);
  if (!ingredients.length) missing.push("Ingredients");
  if (!steps.length) missing.push("Instructions");
  if (ingredients.some((item) => !item.category)) missing.push("Ingredient categories");
  if (ingredients.some((item) => !item.quantity)) missing.push("Ingredient quantities");
  if (ingredients.some((item) => !item.unit)) missing.push("Ingredient units");
  // These mobile fields cannot be reliably inferred from a source recipe.
  missing.push("Ingredient costs");
  return { fields, ingredients, steps, imageUri, sourceImageData, missing: [...new Set([...missing, ...unmapped_fields.filter((field) => !NON_EDITABLE_SOURCE_FIELDS.has(field)).map((field) => field.replace(/_/g, " "))])] };
}
