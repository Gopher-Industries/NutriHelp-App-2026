import { createStackNavigator } from "@react-navigation/stack";

import WeeklyPlanScreen from "../screens/meal/WeeklyPlanScreen";
import DailyPlanScreen from "../screens/meal/DailyPlanScreen";
import MealPlanDetailScreen from "../screens/meal/MealPlanDetailScreen";
import AiMealPlanScreen from "../screens/meal/AiMealPlanScreen";
import NutritionCalculatorScreen from "../screens/meal/NutritionCalculatorScreen";
import MenuScreen from "../screens/meal/MenuScreen";
import EditDailyPlanScreen from "../screens/meal/EditDailyPlanScreen";

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
        name="AIWeeklyPlanScreen"
        component={AiMealPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditDailyPlanScreen"
        component={EditDailyPlanScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NutritionCalculatorScreen"
        component={NutritionCalculatorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MenuScreen"
        component={MenuScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}