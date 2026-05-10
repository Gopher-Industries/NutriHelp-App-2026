import { createStackNavigator } from "@react-navigation/stack";

import CreateRecipeScreen from "../screens/recipes/CreateRecipeScreen";
import RecipeDetailScreen from "../screens/recipes/RecipeDetailScreen";
import RecipeListScreen from "../screens/recipes/RecipeListScreen";
import SearchRecipesScreen from "../screens/recipes/SearchRecipesScreen";

const Stack = createStackNavigator();

export default function RecipeStack() {
  return (
    <Stack.Navigator
      initialRouteName="RecipeListScreen"
      screenOptions={{
        cardStyle: { flex: 1 },
      }}
    >
      <Stack.Screen
        name="RecipeListScreen"
        component={RecipeListScreen}
        options={{ title: "Recipes" }}
      />
      <Stack.Screen
        name="RecipeDetailScreen"
        component={RecipeDetailScreen}
        options={{ title: "Recipe" }}
      />
      <Stack.Screen
        name="CreateRecipeScreen"
        component={CreateRecipeScreen}
        options={{ title: "Create Recipe" }}
      />
      <Stack.Screen
        name="SearchRecipesScreen"
        component={SearchRecipesScreen}
        options={{ title: "Search Recipes" }}
      />
    </Stack.Navigator>
  );
}
