import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";

import AccountStack from "./AccountStack";
import HomeStack from "./HomeStack";
import MealStack from "./MealStack";
import RecipeStack from "./RecipeStack";
import ScanStack from "./ScanStack";

const Tab = createBottomTabNavigator();

const NUTRIHELP_BLUE = "#2A78C5";

const TAB_ICON_BY_ROUTE = {
  Home: "home",
  Meals: "restaurant",
  Recipes: "book",
  Scan: "barcode",
  Profile: "person",
};

export default function MainTabs() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: NUTRIHELP_BLUE,
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
      <Tab.Screen
        name="Recipes"
        component={RecipeStack}
        options={{ tabBarLabel: "Recipes", popToTopOnBlur: true }}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate("Recipes", {
              screen: "RecipeListScreen",
            });
          },
        })}
      />
      <Tab.Screen
        name="Scan"
        component={ScanStack}
        options={{ tabBarLabel: "Scan" }}
      />
      <Tab.Screen
        name="Profile"
        component={AccountStack}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}
