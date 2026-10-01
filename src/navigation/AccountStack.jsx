import { createStackNavigator } from "@react-navigation/stack";

import AppointmentDetailScreen from "../screens/appointments/AppointmentDetailScreen";
import AppointmentsScreen from "../screens/appointments/AppointmentsScreen";
import BookAppointmentScreen from "../screens/appointments/BookAppointmentScreen";
import DeleteAccountScreen from "../screens/profile/DeleteAccountScreen";
import EditProfileScreen from "../screens/profile/EditProfileScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import SettingsScreen from "../screens/profile/SettingsScreen";
import TimerScreen from "../screens/tools/TimerScreen";
import PlaceholderScreen from "./_PlaceholderScreen";
import ShoppingListScreen from "../screens/account/ShoppingListScreen";

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
       component={ShoppingListScreen}
       options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentsScreen"
        component={AppointmentsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentDetailScreen"
        component={AppointmentDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookAppointmentScreen"
        component={BookAppointmentScreen}
        options={{ headerShown: false }}
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
