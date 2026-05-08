import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { ApiError, post } from "../../api/baseApi";
import { loginUser } from "../../api/authApi";
import { useUser } from "../../context/UserContext";
import useFormValidation from "../../hooks/useFormValidation";

import {
  AuthButton,
  AuthCard,
  AuthInput,
  AuthScreen,
  GoogleButton,
  HelperLink,
} from "./AuthComponents";

WebBrowser.maybeCompleteAuthSession();

const loginSchema = {
  email: {
    required: true,
    type: "email",
  },
  password: {
    required: true,
    message: "Password is required.",
  },
};

export default function LoginScreen({ goTo = (_nextScreen, _params) => {} }) {
  const { login } = useUser();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const { values, errors, handleChange, setErrors, validate } =
    useFormValidation(loginSchema, {
      email: "",
      password: "",
    });

  // --- Google OAuth setup ---
  const googleConfigured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId:
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "placeholder",
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "placeholder",
    redirectUri: "nutrihelp://auth/callback",
  });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleCallback(response.authentication);
    } else if (
      response?.type === "dismiss" ||
      response?.type === "cancel"
    ) {
      // User cancelled — stay on login gracefully
      setGoogleLoading(false);
    } else if (response?.type === "error") {
      setGoogleLoading(false);
      setGeneralError("Google sign-in failed. Please try again.");
    }
  }, [response]);

  const handleGoogleCallback = async (authentication) => {
  if (!authentication?.accessToken) {
    setGoogleLoading(false);
    setGeneralError("Google sign-in failed. Please try again.");
    return;
  }

  try {
    // Exchange Google token with NutriHelp backend → Supabase session
    const data = await post(
      "/api/auth/google/exchange",
      { accessToken: authentication.accessToken },
      { skipAuth: true }
    );

    await login(data);
  } catch (e) {
    setGeneralError(
      e.message ?? "Google sign-in failed. Please try again."
    );
  } finally {
    setGoogleLoading(false);
  }
};

  const handleGoogleSignIn = async () => {
    if (!googleConfigured) {
      setGeneralError(
        "Google sign-in is not configured yet. Contact your team lead."
      );
      return;
    }
    setGoogleLoading(true);
    setGeneralError("");
    await promptAsync();
  };

  // --- Email/password login ---
  const handleLogin = async () => {
    setGeneralError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(values.email, values.password);

      if (response.mfaRequired) {
        goTo("mfa", {
          email: response.email,
          password: values.password,
        });
        return;
      }

      await login(response);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setErrors({ password: "Email or password incorrect." });
          return;
        }
        if (error.status === 403) {
          setGeneralError(
            "Your account has been deactivated. Contact support."
          );
          return;
        }
      }
      setGeneralError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthCard>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Login</Text>

              <Text style={styles.subtitle}>
                Welcome back! Sign in to continue using NutriHelp.
              </Text>
            </View>

            {generalError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{generalError}</Text>
              </View>
            ) : null}

            <AuthInput
              label="Email Address"
              value={values.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Enter Your Email"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AuthInput
              label="Password"
              value={values.password}
              onChangeText={(text) => handleChange("password", text)}
              placeholder="Enter Your Password"
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              showPasswordToggle
              passwordVisible={passwordVisible}
              onTogglePassword={() =>
                setPasswordVisible((previous) => !previous)
              }
            />

            <Pressable
              style={styles.rememberRow}
              onPress={() => setRememberMe((previous) => !previous)}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe && styles.checkboxSelected,
                ]}
              >
                {rememberMe ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>

              <Text style={styles.rememberText}>Remember me</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <GoogleButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={googleLoading}
            />

            <AuthButton
              title="Login"
              onPress={handleLogin}
              loading={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {"Don't have an account? "}
                <Text
                  style={styles.footerLinkDark}
                  onPress={() => goTo("signup")}
                >
                  Create Account.
                </Text>
              </Text>

              <HelperLink
                title="Forgot Password?"
                onPress={() => goTo("forgot1")}
              />
            </View>
          </AuthCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 8,
    paddingBottom: 48,
  },

  titleBlock: {
    alignItems: "flex-start",
    marginBottom: 20,
  },

  title: {
    textAlign: "left",
    fontSize: 24,
    fontWeight: "800",
    color: "#18233D",
  },

  subtitle: {
    marginTop: 8,
    textAlign: "left",
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    maxWidth: 280,
  },

  errorBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  errorBoxText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },

  rememberRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    marginRight: 8,
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  checkboxSelected: {
    borderColor: "#1F73B7",
    backgroundColor: "#1F73B7",
  },

  checkmark: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 12,
    marginTop: -2,
  },

  rememberText: {
    fontSize: 12,
    color: "#6B7280",
  },

  dividerRow: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#9CA3AF",
  },

  footer: {
    marginTop: 16,
  },

  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#6B7280",
  },

  footerLinkDark: {
    fontWeight: "700",
    color: "#18233D",
  },
});