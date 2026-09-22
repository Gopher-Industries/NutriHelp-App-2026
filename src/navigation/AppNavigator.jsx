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
import { AccessibilityProvider } from "../context/AccessibilityContext";
import { HealthConditionsProvider } from "../context/HealthConditionsContext";
import { ChatbotProvider } from "../context/ChatbotContext";
import { ToastProvider } from "../context/ToastContext";
import FloatingChatbot from "../components/FloatingChatbot/FloatingChatbot";
import Toast from "../components/Toast";

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
  );
}