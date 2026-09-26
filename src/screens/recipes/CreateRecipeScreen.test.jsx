import React from "react";
import { act, create } from "react-test-renderer";
import CreateRecipeScreen from "./CreateRecipeScreen";
import RecipeSourceSearch from "../../components/RecipeSourceSearch";
import recipeApi from "../../api/recipeApi";
import { resolveRecipeIngredients } from "../../api/recipeSourcesApi";
import { Alert } from "react-native";
jest.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", Alert: { alert: jest.fn() }, Image: "Image", Platform: { OS: "ios" }, Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", TextInput: "TextInput", View: "View", StyleSheet: { create: (s) => s } }));
jest.mock("@react-native-picker/picker", () => { const Picker = "Picker"; return { Picker }; });
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
jest.mock("../../context/UserContext", () => ({ useUser: () => ({ user: { id: 1 } }) }));
jest.mock("../../components/RecipeSourceSearch", () => jest.fn(() => null));
jest.mock("../../api/recipeApi", () => ({ __esModule: true, default: { getCuisineList: jest.fn(async () => [{id: 1, name: "Italian"}]), getIngredientsList: jest.fn(async () => []), getCookingMethodList: jest.fn(async () => [{id: 1, name: "Boil"}]), createRecipe: jest.fn() } }));
jest.mock("../../api/recipeSourcesApi", () => ({ resolveRecipeIngredients: jest.fn(async (rows) => rows.map((row, index) => ({ name: row.name, id: index + 10, status: "created" }))) }));
global.IS_REACT_ACT_ENVIRONMENT = true;
test("validates an imported draft then resolves ingredients and saves its photo", async () => {
  // Picker.Item is only rendered for the static picker choices in this fixture.
  const picker = require("@react-native-picker/picker");
  picker.Picker = Object.assign((props) => React.createElement("Picker", props), { Item: "PickerItem" });
  let tree;
  await act(async () => { tree = create(<CreateRecipeScreen />); });
  act(() => tree.root.findByType(RecipeSourceSearch).props.onPrefill({ source_image: "data:image/webp;base64,cGhvdG8=", draft: {
    recipe_name: "Soup", cuisine_name: "Italian", cooking_method_name: "Boil",
    ingredients: [{ name: "Tomato", quantity: "2" }, { name: "Salt", source_measure: "To taste", notes: "To taste" }], instructions: ["Boil tomatoes"],
  } }));
  const name = tree.root.findAllByType("TextInput").find((node) => node.props.placeholder === "Enter recipe name");
  expect(name.props.value).toBe("Soup");
  expect(JSON.stringify(tree.toJSON())).toContain("Original measure: To taste");
  expect(tree.root.findByType("Image").props.source.uri).toBe("data:image/webp;base64,cGhvdG8=");
  act(() => name.props.onChangeText("My soup"));
  expect(name.props.value).toBe("My soup");
  const save = tree.root.findAllByType("Pressable").find((node) => node.findAllByType("Text").some((text) => text.props.children === "Save Recipe"));
  await act(async () => save.props.onPress());
  expect(Alert.alert).toHaveBeenCalledWith("Save failed", "Enter cooking time in whole minutes.");
  expect(resolveRecipeIngredients).not.toHaveBeenCalled();
  expect(recipeApi.createRecipe).not.toHaveBeenCalled();
  expect(name.props.value).toBe("My soup");
  act(() => {
    tree.root.findAllByType("TextInput").find(node => node.props.placeholder === "e.g. 30").props.onChangeText("20");
    tree.root.findAllByType("TextInput").find(node => node.props.placeholder === "e.g. 2").props.onChangeText("2");
  });
  await act(async () => save.props.onPress());
  expect(resolveRecipeIngredients).toHaveBeenCalledTimes(1);
  expect(recipeApi.createRecipe).toHaveBeenCalledWith(expect.objectContaining({
    recipe_name: "My soup", ingredient_id: [10, 11], ingredient_quantity: [2, null],
    ingredient_source_measure: ["", "To taste"], instructions: "Boil tomatoes",
    preparation_time: 20, total_servings: 2, recipe_image: "data:image/webp;base64,cGhvdG8=",
  }));
  expect(Alert.alert).toHaveBeenCalledWith("Saved", "Recipe created successfully.");
  act(() => tree.root.findByType(RecipeSourceSearch).props.onPrefill({ draft: { recipe_name: "Another recipe" } }));
  expect(tree.root.findAllByType("Image")).toHaveLength(0);
  act(() => tree.unmount());
});
