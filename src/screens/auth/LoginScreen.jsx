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
import useAppTheme from "../../hooks/useAppTheme";
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

  // FE-24: Get light/dark theme colours
  const { colors } = useAppTheme();

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
          setGeneralError(
            "Your account has been deactivated. Contact support."
          );
          return;
        }
      }

      setGeneralError(
        toErrorMessage(error, "Login failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Google login ---
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
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;

      if (!data?.url) {
        throw new Error("Google sign-in URL was not returned.");
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type !== "success" || !result.url) {
        if (result.type === "cancel" || result.type === "dismiss") {
          return;
        }

        throw new Error("Google sign-in was not completed.");
      }

      // Implicit flow:
      // access_token is contained in the URL hash fragment
      const fragment = result.url.includes("#")
        ? result.url.split("#")[1]
        : "";

      const params = new URLSearchParams(fragment);
      const supabaseAccessToken = params.get("access_token");

      if (!supabaseAccessToken) {
        throw new Error("Missing Google session token.");
      }

      const backendSession =
        await exchangeGoogleToken(supabaseAccessToken);

      await login(backendSession);
    } catch (error) {
      setGeneralError(
        toErrorMessage(
          error,
          "Google sign-in failed. Please try again."
        )
      );
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
            {/* TITLE */}

            <View style={styles.titleBlock}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Login
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Welcome back! Sign in to continue using NutriHelp.
              </Text>
            </View>

            {/* GENERAL ERROR */}

            {generalError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    borderColor: colors.error,
                    backgroundColor: colors.errorBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.errorBoxText,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {generalError}
                </Text>
              </View>
            ) : null}

            {/* EMAIL */}

            <AuthInput
              label="Email Address"
              value={values.email}
              onChangeText={(text) =>
                handleChange("email", text)
              }
              placeholder="Enter Your Email"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* PASSWORD */}

            <AuthInput
              label="Password"
              value={values.password}
              onChangeText={(text) =>
                handleChange("password", text)
              }
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

            {/* REMEMBER ME */}

            <Pressable
              style={styles.rememberRow}
              onPress={() =>
                setRememberMe((previous) => !previous)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: rememberMe
                      ? colors.primary
                      : colors.border,

                    backgroundColor: rememberMe
                      ? colors.primary
                      : colors.inputBackground,
                  },
                ]}
              >
                {rememberMe ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>

              <Text
                style={[
                  styles.rememberText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Remember me
              </Text>
            </Pressable>

            {/* DIVIDER */}

            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.dividerText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                or
              </Text>

              <View
                style={[
                  styles.divider,
                  {
                    backgroundColor: colors.border,
                  },
                ]}
              />
            </View>

            {/* GOOGLE SIGN IN */}

            <GoogleButton
              onPress={handleGoogleSignIn}
              loading={googleLoading}
              disabled={googleLoading}
            />

            {/* LOGIN BUTTON */}

            <AuthButton
              title="Login"
              onPress={handleLogin}
              loading={loading || googleLoading}
            />

            {/* FOOTER */}

            <View style={styles.footer}>
              <Text
                style={[
                  styles.footerText,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {"Don't have an account? "}

                <Text
                  style={[
                    styles.footerLinkDark,
                    {
                      color: colors.text,
                    },
                  ]}
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
  },

  subtitle: {
    marginTop: 8,
    textAlign: "left",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 280,
  },

  errorBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  errorBoxText: {
    fontSize: 12,
    fontWeight: "500",
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
    alignItems: "center",
    justifyContent: "center",
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
  },

  dividerRow: {
    marginVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  divider: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
  },

  footer: {
    marginTop: 16,
  },

  footerText: {
    textAlign: "center",
    fontSize: 12,
  },

  footerLinkDark: {
    fontWeight: "700",
  },
});