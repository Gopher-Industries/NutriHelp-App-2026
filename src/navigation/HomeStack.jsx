import { createStackNavigator } from "@react-navigation/stack";

import GoalDetailsScreen from "../screens/home/GoalDetailsScreen";
import HomeScreen from "../screens/home/HomeScreen";
import ChatScreen from "../screens/home/ChatScreen";
import HealthToolsScreen from "../screens/health/HealthToolsScreen";
import WaterIntakeScreen from "../screens/health/WaterIntakeScreen";
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WaterIntakeScreen"
        component={WaterIntakeScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NutritionSummaryScreen"
        component={NutritionSummaryScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WeeklyPlanScreen"
        component={WeeklyPlanScreen}
        options={{ headerShown: false }}
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
