import { createStackNavigator } from "@react-navigation/stack";

import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function AccountStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={PlaceholderScreen}
        options={{ title: "Profile" }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={PlaceholderScreen}
        options={{ title: "Settings" }}
      />
      <Stack.Screen
        name="DietaryRequirementsScreen"
        component={PlaceholderScreen}
        options={{ title: "Dietary Requirements" }}
      />
      <Stack.Screen
        name="ShoppingListScreen"
        component={PlaceholderScreen}
        options={{ title: "Shopping List" }}
      />
      <Stack.Screen
        name="AppointmentsScreen"
        component={PlaceholderScreen}
        options={{ title: "Appointments" }}
      />
      <Stack.Screen
        name="TimerScreen"
        component={PlaceholderScreen}
        options={{ title: "Timer" }}
      />
      <Stack.Screen
        name="HealthToolsScreen"
        component={PlaceholderScreen}
        options={{ title: "Health Tools" }}
      />
    </Stack.Navigator>
  );
}
