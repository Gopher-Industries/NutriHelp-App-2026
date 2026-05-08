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
import * as AppleAuthentication from "expo-apple-authentication";

import { ApiError } from "../../api/baseApi";
import { loginUser } from "../../api/authApi";
import { useUser } from "../../context/UserContext";
import useFormValidation from "../../hooks/useFormValidation";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

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
  const [appleLoading, setAppleLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const { values, errors, handleChange, setErrors, validate } =
    useFormValidation(loginSchema, {
      email: "",
      password: "",
    });

  const { initiateGoogleSignIn, loading: googleLoading, error: googleError } =
    useGoogleAuth({
      onSuccess: async (authData) => {
        await login(authData);
      },
    });

  useEffect(() => {
    if (googleError) {
      setGeneralError(googleError);
    }
  }, [googleError]);

  const handleGoogleSignIn = async () => {
    setGeneralError("");
    try {
      await initiateGoogleSignIn();
    } catch (error) {
      setGeneralError(error.message || "Google sign-in failed. Please try again.");
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

      const res = await fetch(
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Apple sign-in failed.");
      await login(data);
    } catch (e) {
      if (e.code === "ERR_REQUEST_CANCELED") {
        // User cancelled — stay on login silently
      } else if (e.code === "ERR_NOT_AVAILABLE") {
        setGeneralError("Apple Sign-In is not available on this device.");
      } else {
        setGeneralError(e.message ?? "Apple sign-in failed. Please try again.");
      }
    } finally {
      setAppleLoading(false);
    }
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
          setGeneralError("Your account has been deactivated. Contact support.");
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

            <AuthButton title="Login" onPress={handleLogin} loading={loading} />

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
