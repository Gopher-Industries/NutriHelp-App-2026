<<<<<<< HEAD
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
=======
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/home/HomeScreen";


const Stack = createNativeStackNavigator();
>>>>>>> 4662b6e (M-25 to M-28: Common components implementation)

  return (
<<<<<<< HEAD
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
=======
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }} // 🔥 MUST BE HERE
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
>>>>>>> 4662b6e (M-25 to M-28: Common components implementation)
