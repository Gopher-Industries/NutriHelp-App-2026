import { createStackNavigator } from "@react-navigation/stack";

import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function RecipeStack() {
  return (
    <Stack.Navigator initialRouteName="RecipeListScreen">
      <Stack.Screen
        name="RecipeListScreen"
        component={PlaceholderScreen}
        options={{ title: "Recipes" }}
      />
      <Stack.Screen
        name="RecipeDetailScreen"
        component={PlaceholderScreen}
        options={{ title: "Recipe" }}
      />
      <Stack.Screen
        name="CreateRecipeScreen"
        component={PlaceholderScreen}
        options={{ title: "Create Recipe" }}
      />
      <Stack.Screen
        name="SearchRecipesScreen"
        component={PlaceholderScreen}
        options={{ title: "Search Recipes" }}
      />
    </Stack.Navigator>
  );
}
