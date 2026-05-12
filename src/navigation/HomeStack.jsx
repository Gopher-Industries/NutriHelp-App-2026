import { createStackNavigator } from "@react-navigation/stack";

import GoalDetailsScreen from "../screens/home/GoalDetailsScreen";
import HomeScreen from "../screens/home/HomeScreen";
import HealthToolsScreen from "../screens/health/HealthToolsScreen";
import MealPlanOverviewScreen from "../screens/home/MealPlanOverviewScreen";
import NutritionSummaryScreen from "../screens/home/NutritionSummaryScreen";
import RecommendedDetailsScreen from "../screens/home/RecommendedDetailsScreen";
import BarcodeScannerScreen from "../screens/scan/BarcodeScannerScreen";
import ProductScanScreen from "../screens/scan/ProductScanScreen";
import DailyPlanScreen from "../screens/meal/DailyPlanScreen";
import WeeklyPlanScreen from "../screens/meal/WeeklyPlanScreen";
import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function HomeStack() {
  return (
    <Stack.Navigator initialRouteName="HomeScreen">
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Stack.Screen
        name="HealthNewsScreen"
        component={PlaceholderScreen}
        options={{ title: "Health News" }}
      />
      <Stack.Screen
        name="HealthNewsDetailScreen"
        component={PlaceholderScreen}
        options={{ title: "Article" }}
      />
      <Stack.Screen
        name="HealthToolsScreen"
        component={HealthToolsScreen}
        options={{ title: "Health Tools" }}
      />
      <Stack.Screen
        name="GoalDetailsScreen"
        component={GoalDetailsScreen}
        options={{ title: "Goal" }}
      />
      <Stack.Screen
        name="NutritionSummaryScreen"
        component={NutritionSummaryScreen}
        options={{ title: "Nutrition Summary" }}
      />
      <Stack.Screen
        name="MealPlanOverviewScreen"
        component={MealPlanOverviewScreen}
        options={{ title: "Meal Plan" }}
      />
      <Stack.Screen
        name="RecommendedDetailsScreen"
        component={RecommendedDetailsScreen}
        options={{ title: "Recommended" }}
      />
      <Stack.Screen
        name="DailyPlanScreen"
        component={DailyPlanScreen}
        options={{ title: "Daily Plan" }}
      />
      <Stack.Screen
        name="WeeklyPlanScreen"
        component={WeeklyPlanScreen}
        options={{ title: "Weekly Plan" }}
      />
      <Stack.Screen
        name="FAQScreen"
        component={PlaceholderScreen}
        options={{ title: "FAQ" }}
      />
      <Stack.Screen
        name="BarcodeScannerScreen"
        component={BarcodeScannerScreen}
        options={{ title: "Scan Barcode" }}
      />
      <Stack.Screen
        name="ProductScanScreen"
        component={ProductScanScreen}
        options={{ title: "Product" }}
      />
    </Stack.Navigator>
  );
}
