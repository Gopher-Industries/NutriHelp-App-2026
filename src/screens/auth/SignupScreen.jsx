import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError, toErrorMessage } from "../../api/baseApi";
import { registerUser } from "../../api/authApi";
import useFormValidation from "../../hooks/useFormValidation";
import { useAccessibility } from "../../context/AccessibilityContext";
import useAppTheme from "../../hooks/useAppTheme";

import {
  AuthButton,
  AuthCard,
  AuthInput,
  AuthScreen,
} from "./AuthComponents";

const signupSchema = {
  firstName: {
    required: true,
    type: "name",
  },
  lastName: {
    required: true,
    type: "name",
  },
  email: {
    required: true,
    type: "email",
  },
  password: {
    required: true,
    type: "password",
  },
  confirmPassword: {
    required: true,
    matchesField: "password",
    message: "Passwords do not match.",
  },
};

export default function SignupScreen({ goTo = (_nextScreen) => {} }) {
  const { fs, sh } = useAccessibility();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { values, errors, handleChange, setErrors, validate } =
    useFormValidation(signupSchema, {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

  const handleSignup = async () => {
    setGeneralError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await registerUser(
        values.firstName,
        values.lastName,
        values.email,
        values.password
      );

      setAccountCreated(true);
    } catch (error) {
      console.error("[SignupScreen] Signup error:", error);

      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({
            email: "An account with this email already exists.",
          });
          return;
        }

        setGeneralError(
          toErrorMessage(
            error,
            "Account creation failed. Please try again."
          )
        );
        return;
      }

      setGeneralError(
        toErrorMessage(
          error,
          "Account creation failed. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------
  // ACCOUNT CREATED / SUCCESS SCREEN
  // -------------------------------------------------------

  if (accountCreated) {
    return (
      <AuthScreen onBack={() => goTo("login")}>
        <View style={styles.successWrapper}>
          <View
            style={[
              styles.successCircle,
              { width: sh(120), height: sh(120) },
              {
                borderColor: colors.successBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.successTick,
                { width: sh(56), height: sh(56), fontSize: fs(34), lineHeight: fs(54), },
                {
                  backgroundColor: colors.success,
                  color: colors.primaryText,
                },
              ]}
            >
              ✓
            </Text>
          </View>

          <Text
            style={[
              styles.successTitle,
              { fontSize: fs(24) },
              {
                color: colors.success,
              },
            ]}
          >
            You are all set!
          </Text>

          <Text
            style={[
              styles.successMessage,
              { fontSize: fs(14), lineHeight: fs(20) },
              {
                color: colors.textSecondary,
              },
            ]}
          >
            The account was created successfully. Welcome to NutriHelp.
          </Text>

          <AuthButton
            title="Go to Login"
            onPress={() => goTo("login")}
          />
        </View>
      </AuthScreen>
    );
  }

  // -------------------------------------------------------
  // SIGNUP FORM
  // -------------------------------------------------------

  return (
    <AuthScreen onBack={() => goTo("login")}>
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
                  { fontSize: fs(24) },
                  {
                    color: colors.text,
                  },
                ]}
              >
                Create Account
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { fontSize: fs(13), lineHeight: fs(19) },
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Join NutriHelp and start managing your nutrition journey.
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
                    { fontSize: fs(12) },
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  {generalError}
                </Text>
              </View>
            ) : null}

            {/* FIRST NAME */}

            <AuthInput
              label="First Name"
              value={values.firstName}
              onChangeText={(text) =>
                handleChange("firstName", text)
              }
              placeholder="Enter Your First Name"
              error={errors.firstName}
            />

            {/* LAST NAME */}

            <AuthInput
              label="Last Name"
              value={values.lastName}
              onChangeText={(text) =>
                handleChange("lastName", text)
              }
              placeholder="Enter Your Last Name"
              error={errors.lastName}
            />

            {/* EMAIL */}

            <AuthInput
              label="Email"
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

            {/* CONFIRM PASSWORD */}

            <AuthInput
              label="Re-enter Password"
              value={values.confirmPassword}
              onChangeText={(text) =>
                handleChange("confirmPassword", text)
              }
              placeholder="Re-enter Your Password"
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              showPasswordToggle
              passwordVisible={confirmPasswordVisible}
              onTogglePassword={() =>
                setConfirmPasswordVisible((previous) => !previous)
              }
            />

            {/* CREATE ACCOUNT BUTTON */}

            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
            />

            {/* FOOTER */}

            <View style={styles.footer}>
              <Text
                style={[
                  styles.footerText,
                  { fontSize: fs(12) },
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Already have an account?{" "}

                <Text
                  style={[
                    styles.footerLinkDark,
                    {
                      color: colors.text,
                    },
                  ]}
                  onPress={() => goTo("login")}
                >
                  Login.
                </Text>
              </Text>
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
    marginBottom: 18,
  },

  title: {
    textAlign: "left",
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 8,
    textAlign: "left",
  },

  errorBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  errorBoxText: {
    fontWeight: "500",
  },

  footer: {
    marginTop: 16,
  },

  footerText: {
    textAlign: "center",
  },

  footerLinkDark: {
    fontWeight: "700",
  },

  successWrapper: {
    flex: 1,
    justifyContent: "center",
  },

  successCircle: {
    alignSelf: "center",
    borderRadius: 999,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  successTick: {
    borderRadius: 999,
    fontWeight: "800",
    textAlign: "center",
  },

  successTitle: {
    textAlign: "center",
    fontWeight: "800",
  },

  successMessage: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
  },
});