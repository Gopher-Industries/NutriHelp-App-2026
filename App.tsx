import "./src/styles/global.css";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { UserProvider, useUser } from "./src/context/UserContext";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ForgotPasswordStep1Screen from "./src/screens/auth/ForgotPasswordStep1Screen";
import ForgotPasswordStep2Screen from "./src/screens/auth/ForgotPasswordStep2Screen";
import ForgotPasswordStep3Screen from "./src/screens/auth/ForgotPasswordStep3Screen";

type AuthScreenName = "login" | "signup" | "forgot1" | "forgot2" | "forgot3";

type AuthParams = {
  email?: string;
  code?: string;
};

function AppContent() {
  const { loading, isAuthenticated, logout } = useUser();
  const [screen, setScreen] = useState<AuthScreenName>("login");
  const [authParams, setAuthParams] = useState<AuthParams>({});

  const goTo = (nextScreen: AuthScreenName, params: AuthParams = {}) => {
    setScreen(nextScreen);
    setAuthParams((previous) => ({
      ...previous,
      ...params,
    }));
  };

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
    if (screen === "signup") {
      return (
        <>
          <SignupScreen goTo={goTo} />
          <StatusBar style="auto" />
        </>
      );
    }

    if (screen === "forgot1") {
      return (
        <>
          <ForgotPasswordStep1Screen goTo={goTo} />
          <StatusBar style="auto" />
        </>
      );
    }

    if (screen === "forgot2") {
      return (
        <>
          <ForgotPasswordStep2Screen
            email={authParams.email}
            goTo={goTo}
          />
          <StatusBar style="auto" />
        </>
      );
    }

    if (screen === "forgot3") {
      return (
        <>
          <ForgotPasswordStep3Screen
            email={authParams.email}
            code={authParams.code}
            goTo={goTo}
          />
          <StatusBar style="auto" />
        </>
      );
    }

    return (
      <>
        <LoginScreen goTo={goTo} />
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