import { useState } from "react";
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
      const redirectTo = "nutrihelp://auth-callback";

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error("Google sign-in URL was not returned.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success" || !result.url) {
        if (result.type === "cancel" || result.type === "dismiss") return;
        throw new Error("Google sign-in was not completed.");
      }

      // Implicit flow: access_token is in the URL hash fragment
      // nutrihelp://auth-callback#access_token=xxx&refresh_token=xxx
      const fragment = result.url.includes("#") ? result.url.split("#")[1] : "";
      const params = new URLSearchParams(fragment);
      const supabaseAccessToken = params.get("access_token");

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
