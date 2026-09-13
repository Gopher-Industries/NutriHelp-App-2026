const positiveId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const text = (value) => String(value ?? '').trim();

export default async function saveRecipeDraft(form, { resolveIngredients, createRecipe }) {
  const cuisineId = positiveId(form.cuisineOptions.find(row => row.name === form.cuisine)?.id);
  const methodId = positiveId(form.cookingMethodOptions.find(row => row.name === form.cookingMethod)?.id);
  if (!text(form.recipeName)) throw new Error('Enter a recipe name.');
  if (!cuisineId || !methodId) throw new Error('Select a cuisine and cooking method from the available options.');
  const time = Number(form.timeMinutes), servings = Number(form.servings);
  if (!Number.isInteger(time) || time < 1) throw new Error('Enter cooking time in whole minutes.');
  if (!Number.isInteger(servings) || servings < 1) throw new Error('Enter the number of servings as a whole number.');
  const rows = form.ingredients.filter(row => text(row.name) || text(row.quantity));
  if (!rows.length) throw new Error('Add at least one ingredient.');
  const instructions = form.steps.map(row => text(row.text)).filter(Boolean).join('\n');
  if (!instructions) throw new Error('Add at least one instruction.');
  const prepared = rows.map(row => {
    if (!text(row.name)) throw new Error('Enter a name for every ingredient.');
    const quantity = text(row.quantity) ? Number(row.quantity) : null;
    const sourceMeasure = text(row.sourceMeasure);
    const notes = text(row.notes);
    if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0)) throw new Error(`Review the quantity for ${row.name}. Use a positive number.`);
    if (quantity === null && !sourceMeasure && !notes) throw new Error(`Enter a quantity for ${row.name}.`);
    const cost = text(row.cost) ? Number(row.cost) : null;
    if (cost !== null && (!Number.isFinite(cost) || cost < 0)) throw new Error(`Review the cost for ${row.name}.`);
    return { ...row, ingredientId: positiveId(row.ingredientId), quantity, cost, sourceMeasure, notes };
  });
  // Only a deliberate, validated Save reaches the shared ingredient resolver.
  const pending = prepared.filter(row => !row.ingredientId);
  for (let offset = 0; offset < pending.length; offset += 30) {
    const batch = pending.slice(offset, offset + 30);
    const resolved = await resolveIngredients(batch.map(row => ({ name: text(row.name), ...(text(row.category) ? { category: text(row.category) } : {}) })));
    for (const row of batch) {
      const match = resolved.find(item => text(item.name) === text(row.name) && ['matched', 'created'].includes(item.status));
      row.ingredientId = positiveId(match?.id);
      if (!row.ingredientId) throw new Error(`Could not add ${row.name}. Your draft is still here; please try saving again.`);
    }
  }
  const payload = {
    recipe_name: text(form.recipeName), cuisine_id: cuisineId, cooking_method_id: methodId,
    preparation_time: time, total_servings: servings, instructions,
    ingredient_id: prepared.map(row => row.ingredientId),
    ingredient_quantity: prepared.map(row => row.quantity),
    ingredient_unit: prepared.map(row => text(row.unit)),
    ingredient_notes: prepared.map(row => row.notes),
    ingredient_source_measure: prepared.map(row => row.sourceMeasure),
    ingredient_cost: prepared.map(row => row.cost),
    ...(form.imageData ? { recipe_image: form.imageData } : {}),
  };
  return createRecipe(payload);
}
