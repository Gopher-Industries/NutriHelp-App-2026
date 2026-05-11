import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";

import AccountStack from "./AccountStack";
import CommunityStack from "./CommunityStack";
import HomeStack from "./HomeStack";
import MealStack from "./MealStack";
import RecipeStack from "./RecipeStack";

const Tab = createBottomTabNavigator();

const NUTRIHELP_GREEN = "#047857";

const TAB_ICON_BY_ROUTE = {
  Home: "home",
  Meals: "restaurant",
  Recipes: "book",
  Community: "people",
  Account: "person",
};

export default function MainTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: NUTRIHELP_GREEN,
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#6B7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
          borderTopColor: isDark ? "#1F2937" : "#E5E7EB",
        },
        tabBarIcon: ({ color, size, focused }) => {
          const baseName = TAB_ICON_BY_ROUTE[route.name] ?? "ellipse";
          const iconName = focused ? baseName : `${baseName}-outline`;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen
        name="Meals"
        component={MealStack}
        options={{ tabBarLabel: "Meals" }}
      />
      <Tab.Screen name="Recipes" component={RecipeStack} />
      <Tab.Screen name="Community" component={CommunityStack} />
      <Tab.Screen name="Account" component={AccountStack} />
    </Tab.Navigator>
  );
}
