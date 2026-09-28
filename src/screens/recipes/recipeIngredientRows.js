export default function recipeIngredientRows(ingredients) {
  if (Array.isArray(ingredients)) return ingredients;
  if (Array.isArray(ingredients?.id)) return ingredients.id.map((id, index) => ({
    ingredientId: id,
    name: ingredients.name?.[index] || `Ingredient ${id}`,
    quantity: ingredients.quantity?.[index] ?? ingredients.source_measure?.[index] ?? ingredients.notes?.[index] ?? '',
    unit: ingredients.quantity?.[index] == null ? '' : ingredients.unit?.[index] || '',
  }));
  return typeof ingredients === 'string' ? ingredients.split(',').map(name => name.trim()).filter(Boolean) : [];
}
