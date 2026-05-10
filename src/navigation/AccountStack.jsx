import { createStackNavigator } from "@react-navigation/stack";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useUser } from "../context/UserContext";
import PlaceholderScreen from "./_PlaceholderScreen";

function ProfileScreen() {
  const { logout, user } = useUser();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {user?.email ? (
        <Text style={styles.email}>{user.email}</Text>
      ) : null}
      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#047857",
  },
  email: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
  },
  logoutButton: {
    marginTop: 32,
    backgroundColor: "#EF4444",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

const Stack = createStackNavigator();
export default function AccountStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
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
