import React from "react";
import { act, create } from "react-test-renderer";
import RecipeSourceSearch from "./RecipeSourceSearch";
import { mapRecipeSource, searchRecipeSources } from "../api/recipeSourcesApi";
jest.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", Pressable: "Pressable", Text: "Text", TextInput: "TextInput", View: "View", StyleSheet: { create: (s) => s } }));
jest.mock("../api/recipeSourcesApi", () => ({ mapRecipeSource: jest.fn(), searchRecipeSources: jest.fn() }));
global.IS_REACT_ACT_ENVIRONMENT = true;
const row = { title: "Soup", source: "themealdb", external_id: "1" };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
let tree, apply;
const input = (value) => act(() => tree.root.findByType("TextInput").props.onChangeText(value));
const tick = () => act(async () => { jest.advanceTimersByTime(400); });
const content = () => JSON.stringify(tree.toJSON());
beforeEach(async () => {
  jest.useFakeTimers(); jest.resetAllMocks(); apply = jest.fn();
  searchRecipeSources.mockResolvedValue([row]);
  await act(async () => { tree = create(<RecipeSourceSearch onPrefill={apply} />); });
});
afterEach(() => { act(() => tree.unmount()); jest.useRealTimers(); });
test("debounces, requires three characters and suppresses stale responses after deletion", async () => {
  const pending = deferred(); searchRecipeSources.mockReturnValueOnce(pending.promise);
  input("so"); await tick(); expect(searchRecipeSources).not.toHaveBeenCalled();
  input("sou"); act(() => jest.advanceTimersByTime(399)); expect(searchRecipeSources).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1); });
  input("s"); await act(async () => pending.resolve([row]));
  expect(content()).not.toContain("Use Soup");
  expect(content()).not.toContain("Searching…");
});
test("only newest query may publish results", async () => {
  const pending = deferred(); searchRecipeSources.mockReturnValueOnce(pending.promise);
  input("sou"); await tick(); input("rice"); await tick();
  await act(async () => pending.resolve([{ ...row, title: "Stale" }]));
  expect(content()).not.toContain("Stale"); expect(content()).toContain("Use Soup");
});
test("distinguishes empty and failed search", async () => {
  searchRecipeSources.mockResolvedValueOnce([]); input("zzz"); await tick();
  expect(content()).toContain("No recipes found");
  searchRecipeSources.mockRejectedValueOnce(new Error("Offline")); input("rice"); await tick();
  expect(content()).toContain("Could not search recipes"); expect(content()).not.toContain("No recipes found");
});
test("mapping failure preserves the form and permits retry; success requires deliberate apply", async () => {
  input("soup"); await tick(); mapRecipeSource.mockRejectedValueOnce(new Error("Offline"));
  await act(async () => tree.root.findByType("Pressable").props.onPress());
  expect(apply).not.toHaveBeenCalled(); expect(content()).toContain("Your form is unchanged");
  const mapped = { draft: { recipe_name: "Soup" } }; mapRecipeSource.mockResolvedValueOnce(mapped);
  await act(async () => tree.root.findByType("Pressable").props.onPress());
  expect(apply).not.toHaveBeenCalled();
  act(() => tree.root.findByType("Pressable").props.onPress());
  expect(apply).toHaveBeenCalledWith(mapped); expect(content()).not.toContain("No recipes found");
});
test("cancelled mapping cannot apply a late response", async () => {
  input("soup"); await tick(); const pending = deferred(); mapRecipeSource.mockReturnValueOnce(pending.promise);
  act(() => { tree.root.findByType("Pressable").props.onPress(); });
  act(() => tree.root.findByType("Pressable").props.onPress());
  await act(async () => pending.resolve({ draft: {} }));
  expect(apply).not.toHaveBeenCalled(); expect(content()).not.toContain("Apply recipe to form");
});
