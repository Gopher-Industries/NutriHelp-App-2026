import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { UserProvider, useUser } from "../context/UserContext";

import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";
function AuthGateSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-[#0B1220]">
      <Text className="mb-4 text-3xl font-bold text-[#047857]">NutriHelp</Text>
      <ActivityIndicator size="large" color="#047857" />
    </View>
  );
}

function RootNavigator() {
  const { loading, isAuthenticated } = useUser();

  if (loading) {
    return <AuthGateSplash />;
  }

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    // Additional context providers (e.g. a future ThemeProvider) should
    // wrap NavigationContainer alongside UserProvider here.
    <UserProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
        <StatusBar style={colorScheme === "dark" ? "light" : "auto"} />
      </NavigationContainer>
    </UserProvider>
  );
}
