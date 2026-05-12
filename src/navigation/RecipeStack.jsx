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
        headerShown: false,
        cardStyle: { flex: 1 },
      }}
    >
      <Stack.Screen name="RecipeListScreen" component={RecipeListScreen} />
      <Stack.Screen name="RecipeDetailScreen" component={RecipeDetailScreen} />
      <Stack.Screen name="CreateRecipeScreen" component={CreateRecipeScreen} />
      <Stack.Screen name="SearchRecipesScreen" component={SearchRecipesScreen} />
    </Stack.Navigator>
  );
}
