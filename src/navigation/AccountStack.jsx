import { createStackNavigator } from "@react-navigation/stack";

import DeleteAccountScreen from "../screens/profile/DeleteAccountScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import TimerScreen from "../screens/tools/TimerScreen";
import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();
export default function AccountStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeleteAccountScreen"
        component={DeleteAccountScreen}
        options={{ headerShown: false }}
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
        component={TimerScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HealthToolsScreen"
        component={PlaceholderScreen}
        options={{ title: "Health Tools" }}
      />
    </Stack.Navigator>
  );
}
