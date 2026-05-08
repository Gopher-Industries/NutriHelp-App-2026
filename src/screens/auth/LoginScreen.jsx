import { useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

import { ApiError, toErrorMessage } from "../../api/baseApi";
import { exchangeGoogleToken, loginUser } from "../../api/authApi";
import { useUser } from "../../context/UserContext";
import useFormValidation from "../../hooks/useFormValidation";
import supabase from "../../utils/supabase";

WebBrowser.maybeCompleteAuthSession();

import {
  AuthButton,
  AuthCard,
  AuthInput,
  AuthScreen,
  GoogleButton,
  HelperLink,
} from "./AuthComponents";

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
  const [appleLoading, setAppleLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const { values, errors, handleChange, setErrors, validate } =
    useFormValidation(loginSchema, {
      email: "",
      password: "",
    });

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
          setGeneralError("Your account has been deactivated. Contact support.");
          return;
        }
      }
      setGeneralError(toErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError("");
    setGoogleLoading(true);

    try {
      const redirectTo = AuthSession.makeRedirectUri({
        path: "auth/callback",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) {
        throw error;
      }

      if (!data?.url) {
        throw new Error("Google sign-in URL was not returned.");
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success" || !result.url) {
        if (result.type === "cancel" || result.type === "dismiss") {
          return;
        }
        throw new Error("Google sign-in was not completed.");
      }

      const { queryParams } = Linking.parse(result.url);
      const code = typeof queryParams?.code === "string" ? queryParams.code : null;
      if (!code) {
        throw new Error("Missing Google authorization code.");
      }

      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        throw sessionError;
      }

      const supabaseAccessToken = sessionData?.session?.access_token;
      if (!supabaseAccessToken) {
        throw new Error("Missing Google session token.");
      }

      const backendSession = await exchangeGoogleToken(supabaseAccessToken);
      await login(backendSession);
    } catch (error) {
      setGeneralError(toErrorMessage(error, "Google sign-in failed. Please try again."));
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- Apple Sign-In ---
  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    setGeneralError("");

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/auth/apple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identityToken: credential.identityToken,
            email: credential.email,
            fullName: credential.fullName,
            appleUserId: credential.user,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(toErrorMessage(data, "Apple sign-in failed."));
      }
      await login(data);
    } catch (error) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        return;
      }
      if (error.code === "ERR_NOT_AVAILABLE") {
        setGeneralError("Apple Sign-In is not available on this device.");
        return;
      }
      setGeneralError(toErrorMessage(error, "Apple sign-in failed. Please try again."));
    } finally {
      setAppleLoading(false);
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
                {rememberMe ? <Text style={styles.checkmark}>✓</Text> : null}
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

            {Platform.OS === "ios" && (
              appleLoading ? (
                <View style={styles.appleLoadingBox}>
                  <Text style={styles.appleLoadingText}>Signing in with Apple...</Text>
                </View>
              ) : (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={8}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )
            )}

            <AuthButton
              title="Login"
              onPress={handleLogin}
              loading={loading || googleLoading}
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

  appleButton: {
    marginTop: 12,
    marginBottom: 8,
    height: 48,
    width: "100%",
  },

  appleLoadingBox: {
    marginTop: 12,
    marginBottom: 8,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },

  appleLoadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
