import { createStackNavigator } from "@react-navigation/stack";

import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function MealStack() {
  return (
    <Stack.Navigator initialRouteName="WeeklyPlanScreen">
      <Stack.Screen
        name="WeeklyPlanScreen"
        component={PlaceholderScreen}
        options={{ title: "Weekly Plan" }}
      />
      <Stack.Screen
        name="DailyPlanScreen"
        component={PlaceholderScreen}
        options={{ title: "Daily Plan" }}
      />
      <Stack.Screen
        name="EditDailyPlanScreen"
        component={PlaceholderScreen}
        options={{ title: "Edit Daily Plan" }}
      />
      <Stack.Screen
        name="NutritionCalculatorScreen"
        component={PlaceholderScreen}
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
