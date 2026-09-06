import buildSourcePrefill from "./buildSourcePrefill";
test("keeps source measures and matched ids without inventing units or nutrition", () => {
  const result = buildSourcePrefill({ draft: { recipe_name: "Soup", cook_time_minutes: 0, prep_time_minutes: 12, ingredients: [{ name: "Tomatoes", matched_name: "Tomato", ingredient_id: 8, quantity: "1/2 cup", category: "Pantry" }], instructions: ["Mix", "", "Cook"] } });
  expect(result.fields.timeMinutes).toBe("0");
  expect(result.ingredients[0]).toMatchObject({ ingredientId: 8, name: "Tomato", quantity: "1/2 cup", unit: "", cost: "" });
  expect(result.steps).toEqual([{ id: 1, text: "Mix" }, { id: 2, text: "Cook" }]);
  expect(result.missing).toContain("Servings");
  expect(result.missing).toContain("Nutrition");
});
test("empty draft reports missing fields and never fabricates ingredient ids", () => {
  const result = buildSourcePrefill({ draft: { ingredients: [{ name: "Unknown" }] } });
  expect(result.ingredients[0].ingredientId).toBeNull();
  expect(result.missing).toEqual(expect.arrayContaining(["Recipe name", "Cooking time", "Instructions"]));
});
