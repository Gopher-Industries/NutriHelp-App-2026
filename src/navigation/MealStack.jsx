import { createStackNavigator } from "@react-navigation/stack";

import WeeklyPlanScreen from "../screens/meal/WeeklyPlanScreen";
import DailyPlanScreen from "../screens/meal/DailyPlanScreen";
import MealPlanDetailScreen from "../screens/meal/MealPlanDetailScreen";
import AiMealPlanScreen from "../screens/meal/AiMealPlanScreen";
import NutritionCalculatorScreen from "../screens/health/NutritionCalculatorScreen";
import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function MealStack() {
  return (
    <Stack.Navigator initialRouteName="WeeklyPlanScreen">
      <Stack.Screen
        name="WeeklyPlanScreen"
        component={WeeklyPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyPlanScreen"
        component={DailyPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MealPlanDetailScreen"
        component={MealPlanDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditDailyPlanScreen"
        component={PlaceholderScreen}
        options={{ title: "Edit Daily Plan" }}
      />
      <Stack.Screen
        name="NutritionCalculatorScreen"
        component={NutritionCalculatorScreen}
        options={{ title: "Nutrition Calculator" }}
      />
      <Stack.Screen
        name="MenuScreen"
        component={PlaceholderScreen}
        options={{ title: "Menu" }}
      />
      <Stack.Screen
        name="AIWeeklyPlanScreen"
        component={AiMealPlanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
