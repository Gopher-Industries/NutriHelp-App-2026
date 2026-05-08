import "./src/styles/global.css";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import { ActivityIndicator, Text, View, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { UserProvider, useUser } from "./src/context/UserContext";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ForgotPasswordStep1Screen from "./src/screens/auth/ForgotPasswordStep1Screen";
import ForgotPasswordStep2Screen from "./src/screens/auth/ForgotPasswordStep2Screen";
import ForgotPasswordStep3Screen from "./src/screens/auth/ForgotPasswordStep3Screen";
import MFAScreen from "./src/screens/auth/MFAScreen";

type AuthScreenName =
  | "login"
  | "signup"
  | "forgot1"
  | "forgot2"
  | "forgot3"
  | "mfa";

type AuthParams = {
  email?: string;
  password?: string;
  resetToken?: string;
};

function AppContent() {
  const { loading, isAuthenticated, logout } = useUser();
  const { handleOAuthCallback } = require("./src/hooks/useGoogleAuth").useGoogleAuth();
  const [screen, setScreen] = useState<AuthScreenName>("login");
  const [authParams, setAuthParams] = useState<AuthParams>({});

  const goTo = (nextScreen: AuthScreenName, params: AuthParams = {}) => {
    setScreen(nextScreen);
    setAuthParams((previous) => ({
      ...previous,
      ...params,
    }));
  };

  // Deep link handler for OAuth callback
  useEffect(() => {
    const handleDeepLink = ({ url }: { url: string }) => {
      try {
        if (url && url.includes("auth-callback")) {
          // Delegate to hook's callback handler
          handleOAuthCallback(url).catch((err: any) =>
            console.error("[App] OAuth callback handler error:", err)
          );
        }
      } catch (err) {
        console.error("[App] Error handling deep link:", err);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Handle initial URL if app was launched from a deep link
    Linking.getInitialURL()
      .then((url) => {
        if (url != null && url.includes("auth-callback")) {
          handleDeepLink({ url });
        }
      })
      .catch((err) => console.error("[App] getInitialURL error:", err));

    return () => {
      subscription.remove();
    };
  }, [handleOAuthCallback]);

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
            resetToken={authParams.resetToken}
            goTo={goTo}
          />
          <StatusBar style="auto" />
        </>
      );
    }

    if (screen === "mfa") {
      return (
        <>
          <MFAScreen
            email={authParams.email}
            password={authParams.password}
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

import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return <AppNavigator />;
}
