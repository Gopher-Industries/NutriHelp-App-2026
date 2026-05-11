import { createStackNavigator } from "@react-navigation/stack";

import WeeklyPlanScreen from "../screens/meal/WeeklyPlanScreen";
import DailyPlanScreen from "../screens/meal/DailyPlanScreen";
import NutritionCalculatorScreen from "../screens/health/NutritionCalculatorScreen";

const Stack = createStackNavigator();
export default function MealStack() {
  return (
    <Stack.Navigator initialRouteName="WeeklyPlanScreen">
      <Stack.Screen
        name="WeeklyPlanScreen"
        component={WeeklyPlanScreen}
        options={{ title: "Weekly Plan" }}
      />
      <Stack.Screen
        name="DailyPlanScreen"
        component={DailyPlanScreen}
        options={{ title: "Daily Plan" }}
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
        component={PlaceholderScreen}
        options={{ title: "AI Weekly Plan" }}
      />
    </Stack.Navigator>
  );
}
