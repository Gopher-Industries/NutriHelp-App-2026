import buildSourcePrefill from "./buildSourcePrefill";
test("keeps source measures and matched ids without inventing units or nutrition", () => {
  const result = buildSourcePrefill({ unmapped_fields: ["category", "meal_type", "difficulty", "nutrition", "calories", "protein", "carbs", "carbohydrates", "fat", "ingredient_category"], draft: { recipe_name: "Soup", cook_time_minutes: 0, prep_time_minutes: 12, ingredients: [{ name: "Tomatoes", matched_name: "Tomato", ingredient_id: 8, quantity: "1/2 cup", category: "Pantry" }], instructions: ["Mix", "", "Cook"] } });
  expect(result.fields.timeMinutes).toBe("0");
  expect(result.ingredients[0]).toMatchObject({ ingredientId: 8, name: "Tomato", quantity: "1/2 cup", unit: "", cost: "" });
  expect(result.steps).toEqual([{ id: 1, text: "Mix" }, { id: 2, text: "Cook" }]);
  expect(result.missing).toContain("Servings");
  expect(result.missing).toContain("Ingredient costs");
  expect(result.missing).toContain("ingredient category");
  expect(result.missing.join(" ")).not.toMatch(/nutrition|calories|protein|carbs|carbohydrates|fat|difficulty|meal type/i);
});
test("empty draft reports missing fields and never fabricates ingredient ids", () => {
  const result = buildSourcePrefill({ draft: { ingredients: [{ name: "Unknown" }] } });
  expect(result.ingredients[0].ingredientId).toBeNull();
  expect(result.missing).toEqual(expect.arrayContaining(["Recipe name", "Cooking time", "Instructions"]));
});

test("normalizes equivalent unit labels and preserves source measures for review", () => {
  const result = buildSourcePrefill({ draft: { ingredients: [
    { name: "Oil", quantity: 0.25, unit: "cup", source_measure: "1/4 cup" },
    { name: "Salt", quantity: null, unit: null, notes: "To taste", source_measure: "To taste" },
    { name: "Garlic", quantity: 3, unit: "cloves", notes: "chopped" },
    { name: "Spice", quantity: 0.5, unit: "teaspoon" },
  ] } });
  expect(result.ingredients[0]).toMatchObject({ quantity: "0.25", unit: "cups", sourceMeasure: "1/4 cup" });
  expect(result.ingredients[1]).toMatchObject({ quantity: "", unit: "", notes: "To taste", sourceMeasure: "To taste" });
  expect(result.ingredients[2]).toMatchObject({ unit: "cloves", notes: "chopped" });
  expect(result.ingredients[3].unit).toBe("tsp");
  expect(result.fields.timeMinutes).toBe("");
  expect(result.fields.servings).toBe("");
});
