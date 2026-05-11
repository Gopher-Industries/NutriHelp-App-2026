import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "../screens/home/HomeScreen";
import HealthToolsScreen from "../screens/health/HealthToolsScreen";

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
        name="FAQScreen"
        component={PlaceholderScreen}
        options={{ title: "FAQ" }}
      />
      <Stack.Screen
        name="BarcodeScannerScreen"
        component={PlaceholderScreen}
        options={{ title: "Scan Barcode" }}
      />
      <Stack.Screen
        name="ProductScanScreen"
        component={PlaceholderScreen}
        options={{ title: "Product" }}
      />
    </Stack.Navigator>
  );
}
