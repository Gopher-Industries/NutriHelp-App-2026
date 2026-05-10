import "./src/styles/global.css";
import React from 'react';
import { View } from "react-native";
import { UserProvider } from "./src/context/UserContext";
import HealthToolsScreen from "./src/screens/health/HealthToolsScreen";

export default function App() {
  return (
    <UserProvider>
      <View className="flex-1 bg-white">
        <HealthToolsScreen />
      </View>
    </UserProvider>
  );
}
