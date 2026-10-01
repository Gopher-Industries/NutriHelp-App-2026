import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";

import AccountStack from "./AccountStack";
import CommunityStack from "./CommunityStack";
import HealthPlanStack from "./HealthPlanStack";
import HomeStack from "./HomeStack";
import MealStack from "./MealStack";
import RecipeStack from "./RecipeStack";
import ScanStack from "./ScanStack";

import { colors } from "../theme";
const Tab = createBottomTabNavigator();

const NUTRIHELP_PRIMARY = colors.primary;

const TAB_ICON_BY_ROUTE = {
  Home: "home",
  Meals: "restaurant",
  Recipes: "book",
  Scan: "barcode",
  AIPlan: "pulse",
  Community: "people",
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
        tabBarActiveTintColor: NUTRIHELP_PRIMARY,
        tabBarInactiveTintColor: isDark ? colors.textMuted : colors.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? colors.c_0b1220 : colors.white,
          borderTopColor: isDark ? colors.textGray800 : colors.border,
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
        name="AIPlan"
        component={HealthPlanStack}
        options={{ tabBarLabel: "AI Plan" }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStack}
        options={{
          tabBarLabel: "Community",
          popToTopOnBlur: true,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AccountStack}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
}
