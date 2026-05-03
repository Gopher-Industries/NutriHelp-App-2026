import "./src/styles/global.css";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { UserProvider, useUser } from "./src/context/UserContext";

function AppContent() {
  const { loading, isAuthenticated } = useUser();

  const statusLabel = loading
    ? "Checking auth..."
    : isAuthenticated
    ? "Authenticated"
    : "Unauthenticated";

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-green-600">NutriHelp</Text>
      <Text className="mt-2 text-sm text-slate-600">{statusLabel}</Text>
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
