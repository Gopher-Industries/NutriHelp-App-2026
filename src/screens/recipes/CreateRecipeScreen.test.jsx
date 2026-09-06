import React from "react";
import { act, create } from "react-test-renderer";
import CreateRecipeScreen from "./CreateRecipeScreen";
import RecipeSourceSearch from "../../components/RecipeSourceSearch";
import recipeApi from "../../api/recipeApi";
import { Alert } from "react-native";
jest.mock("react-native", () => ({ ActivityIndicator: "ActivityIndicator", Alert: { alert: jest.fn() }, Image: "Image", Platform: { OS: "ios" }, Pressable: "Pressable", ScrollView: "ScrollView", Text: "Text", TextInput: "TextInput", View: "View", StyleSheet: { create: (s) => s } }));
jest.mock("@react-native-picker/picker", () => { const Picker = "Picker"; return { Picker }; });
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-image-picker", () => ({}));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
jest.mock("../../context/UserContext", () => ({ useUser: () => ({ user: { id: 1 } }) }));
jest.mock("../../components/RecipeSourceSearch", () => jest.fn(() => null));
jest.mock("../../api/recipeApi", () => ({ __esModule: true, default: { getCuisineList: jest.fn(async () => []), getIngredientsList: jest.fn(async () => []), getCookingMethodList: jest.fn(async () => []), createRecipe: jest.fn() } }));
global.IS_REACT_ACT_ENVIRONMENT = true;
test("applies a draft, keeps manual editing, and prevents unsupported imported saves", async () => {
  // Picker.Item is only rendered for the static picker choices in this fixture.
  const picker = require("@react-native-picker/picker");
  picker.Picker = Object.assign((props) => React.createElement("Picker", props), { Item: "PickerItem" });
  let tree;
  await act(async () => { tree = create(<CreateRecipeScreen />); });
  act(() => tree.root.findByType(RecipeSourceSearch).props.onPrefill({ draft: {
    recipe_name: "Soup", cuisine_name: "Italian", cooking_method_name: "Boil",
    ingredients: [{ name: "Tomato", quantity: "2" }], instructions: ["Boil tomatoes"],
  } }));
  const name = tree.root.findAllByType("TextInput").find((node) => node.props.placeholder === "Enter recipe name");
  expect(name.props.value).toBe("Soup");
  act(() => name.props.onChangeText("My soup"));
  expect(name.props.value).toBe("My soup");
  const save = tree.root.findAllByType("Pressable").find((node) => node.findAllByType("Text").some((text) => text.props.children === "Save Recipe"));
  await act(async () => save.props.onPress());
  expect(Alert.alert).toHaveBeenCalledWith("Imported recipe saving is not available yet", expect.any(String));
  expect(recipeApi.createRecipe).not.toHaveBeenCalled();
  expect(name.props.value).toBe("My soup");
  act(() => tree.unmount());
});
