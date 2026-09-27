import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Text, View, useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { UserProvider, useUser } from "../context/UserContext";
import { AccessibilityProvider } from "../context/AccessibilityContext";
import { HealthConditionsProvider } from "../context/HealthConditionsContext";
import { ChatbotProvider } from "../context/ChatbotContext";
import { ToastProvider } from "../context/ToastContext";

import FloatingChatbot from "../components/FloatingChatbot/FloatingChatbot";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Toast from "../components/Toast";

import AuthStack from "./AuthStack";
import MainTabs from "./MainTabs";

import { colors } from "../theme";

function AuthGateSplash() {
  return (
    <View className="flex-1 items-center justify-center bg-nh-white dark:bg-nh-dark-c_0b1220">
      <Text className="mb-4 text-3xl font-bold text-nh-success">
        NutriHelp
      </Text>

      <LoadingSpinner color={colors.success} />
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
    <SafeAreaProvider>
    <UserProvider>
      <AccessibilityProvider>
      <HealthConditionsProvider>
      <ChatbotProvider>
      <ToastProvider>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
        {/* FloatingChatbot must be INSIDE NavigationContainer so it shares
            the same native view layer as react-native-screens. Placing it
            after RootNavigator gives it a higher z-order, keeping it visible
            above all screens. */}
        <FloatingChatbot />
        <Toast />
        <StatusBar style={colorScheme === "dark" ? "light" : "auto"} />
      </NavigationContainer>
      </ToastProvider>
      </ChatbotProvider>
      </HealthConditionsProvider>
      </AccessibilityProvider>
    </UserProvider>
    </SafeAreaProvider>
  );
}