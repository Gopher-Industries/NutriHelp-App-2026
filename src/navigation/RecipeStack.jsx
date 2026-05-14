import { createStackNavigator } from "@react-navigation/stack";

import RecipeListScreen from "../screens/recipes/RecipeListScreen";
import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function RecipeStack() {
  return (
    <Stack.Navigator initialRouteName="RecipeListScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="RecipeListScreen"
        component={RecipeListScreen}
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
