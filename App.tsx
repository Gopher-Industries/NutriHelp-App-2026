import "./src/styles/global.css";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider, useUser } from "./src/context/UserContext";
import LoginScreen from "./src/screens/auth/LoginScreen";
import SignupScreen from "./src/screens/auth/SignupScreen";
import ForgotPasswordStep1Screen from "./src/screens/auth/ForgotPasswordStep1Screen";
import ForgotPasswordStep2Screen from "./src/screens/auth/ForgotPasswordStep2Screen";
import ForgotPasswordStep3Screen from "./src/screens/auth/ForgotPasswordStep3Screen";
import MFAScreen from "./src/screens/auth/MFAScreen";
import NotificationPermissionScreen from "./src/components/NotificationPermissionScreen";
import InAppNotificationBanner from "./src/components/InAppNotificationBanner";
import useNotifications from "./src/hooks/useNotifications";
import useBiometric from "./src/hooks/useBiometric";

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
  const [screen, setScreen] = useState<AuthScreenName>("login");
  const [authParams, setAuthParams] = useState<AuthParams>({});
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationPromptShown, setNotificationPromptShown] = useState(false);

  const {
    requestPermission,
    foregroundNotification,
    dismissForegroundNotification,
  } = useNotifications({
    onNavigate: (targetScreen: string) => {
      console.log("[App] Navigate to screen:", targetScreen);
      // Wire to navigation once M-21 navigation is implemented
    },
  });

  const { isAvailable: biometricAvailable } = useBiometric({
    onAuthFail: logout,
  });

  const goTo = (nextScreen: AuthScreenName, params: AuthParams = {}) => {
    setScreen(nextScreen);
    setAuthParams((previous) => ({
      ...previous,
      ...params,
    }));
  };

  // Show notification prompt after login
  const handlePostLogin = () => {
    if (!notificationPromptShown) {
      setShowNotificationPrompt(true);
      setNotificationPromptShown(true);
    }
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

  // Show notification permission explanation screen post-login
  if (isAuthenticated && showNotificationPrompt) {
    return (
      <NotificationPermissionScreen
        onAllow={async () => {
          setShowNotificationPrompt(false);
          await requestPermission();
        }}
        onSkip={() => setShowNotificationPrompt(false)}
      />
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
          <ForgotPasswordStep2Screen email={authParams.email} goTo={goTo} />
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
    <View className="flex-1 bg-white">
      {/* Foreground notification in-app banner */}
      <InAppNotificationBanner
        notification={foregroundNotification}
        onDismiss={dismissForegroundNotification}
      />

      <View className="flex-1 items-center justify-center px-6">
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
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}