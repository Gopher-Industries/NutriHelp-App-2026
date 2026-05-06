import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ApiError } from "../../api/baseApi";
import { registerUser } from "../../api/authApi";
import useFormValidation from "../../hooks/useFormValidation";

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
          setErrors({ email: "An account with this email already exists." });
          return;
        }
        setGeneralError(error.data?.error || "Account creation failed. Please try again.");
        return;
      }

      setGeneralError(error.message || "Account creation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (accountCreated) {
    return (
      <AuthScreen onBack={() => goTo("login")}>
        <View style={styles.successWrapper}>
          <View style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </View>

          <Text style={styles.successTitle}>You are all set!</Text>

          <Text style={styles.successMessage}>
            The account was created successfully. Welcome to NutriHelp.
          </Text>

          <AuthButton title="Go to Login" onPress={() => goTo("login")} />
        </View>
      </AuthScreen>
    );
  }

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
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Create Account</Text>

              <Text style={styles.subtitle}>
                Join NutriHelp and start managing your nutrition journey.
              </Text>
            </View>

            {generalError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{generalError}</Text>
              </View>
            ) : null}

            <AuthInput
              label="First Name"
              value={values.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
              placeholder="Enter Your First Name"
              error={errors.firstName}
            />

            <AuthInput
              label="Last Name"
              value={values.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
              placeholder="Enter Your Last Name"
              error={errors.lastName}
            />

            <AuthInput
              label="Email"
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

            <AuthInput
              label="Re-enter Password"
              value={values.confirmPassword}
              onChangeText={(text) => handleChange("confirmPassword", text)}
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

            <AuthButton
              title="Create Account"
              onPress={handleSignup}
              loading={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text
                  style={styles.footerLinkDark}
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
    maxWidth: 290,
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

  successWrapper: {
    flex: 1,
    justifyContent: "center",
  },

  successCircle: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "#DDEFE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  successTick: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#047857",
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 54,
  },

  successTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: "#047857",
  },

  successMessage: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },
});