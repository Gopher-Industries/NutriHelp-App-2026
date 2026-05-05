import "./src/styles/global.css";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text, View } from "react-native";

import { UserProvider, useUser } from "./src/context/UserContext";
import LoginScreen from "./src/screens/auth/LoginScreen";

function AppContent() {
  const { loading, isAuthenticated, logout } = useUser();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-sm text-[#6B7280]">Checking auth...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-3xl font-bold text-[#047857]">
        NutriHelp
      </Text>

      <Text className="mt-2 text-center text-base text-[#6B7280]">
        Authenticated
      </Text>

      <Text
        className="mt-8 rounded-lg bg-[#1F73B7] px-8 py-3 text-center text-sm font-bold text-white"
        onPress={logout}
      >
        Log out
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}