import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { resetPassword } from "../../api/authApi";
import { toErrorMessage } from "../../api/baseApi";
import { useAccessibility } from "../../context/AccessibilityContext";
import useFormValidation from "../../hooks/useFormValidation";
import useAppTheme from "../../hooks/useAppTheme";

import {
  AuthButton,
  AuthCard,
  AuthInput,
  AuthScreen,
  HelperLink,
} from "./AuthComponents";

const newPasswordSchema = {
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

export default function ForgotPasswordStep3Screen({
  email = "",
  resetToken = "",
  goTo = (_nextScreen, _params) => {},
}) {
  const { fs, sh } = useAccessibility();
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [passwordReset, setPasswordReset] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const { values, errors, handleChange, validate } = useFormValidation(
    newPasswordSchema,
    {
      password: "",
      confirmPassword: "",
    }
  );

  const handleResetPassword = async () => {
    setGeneralError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email, resetToken, values.password);
      setPasswordReset(true);
    } catch (error) {
      setGeneralError(
        toErrorMessage(
          error,
          "Password reset failed. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  if (passwordReset) {
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
            Password updated!
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
            Your password has been reset successfully. You can now log in with
            your new password.
          </Text>

          <AuthButton
            title="Go to Login"
            onPress={() => goTo("login")}
          />
        </View>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen onBack={() => goTo("forgot2", { email })}>
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
              <Text
                style={[
                  styles.title,
                  { fontSize: fs(22) },
                  {
                    color: colors.text,
                  },
                ]}
              >
                Create new password
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
                Choose a strong new password for your NutriHelp account.
              </Text>
            </View>

            {generalError ? (
              <View
                style={[
                  styles.infoBox,
                  {
                    borderColor: colors.error,
                    backgroundColor: colors.errorBackground,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.infoText,
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

            <AuthInput
              label="New Password"
              value={values.password}
              onChangeText={(text) => handleChange("password", text)}
              placeholder="Enter New Password"
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
              label="Confirm New Password"
              value={values.confirmPassword}
              onChangeText={(text) =>
                handleChange("confirmPassword", text)
              }
              placeholder="Re-enter New Password"
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              showPasswordToggle
              passwordVisible={confirmPasswordVisible}
              onTogglePassword={() =>
                setConfirmPasswordVisible((previous) => !previous)
              }
            />

            <View style={styles.passwordRules}>
              <Text
                style={[
                  styles.ruleText,
                  { fontSize: fs(12), lineHeight: fs(18) },
                  { color: colors.textSecondary },
                ]}
              >
                • At least 8 characters
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { fontSize: fs(12), lineHeight: fs(18) },
                  { color: colors.textSecondary },
                ]}
              >
                • One uppercase letter
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { fontSize: fs(12), lineHeight: fs(18) },
                  { color: colors.textSecondary },
                ]}
              >
                • One lowercase letter
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { fontSize: fs(12), lineHeight: fs(18) },
                  { color: colors.textSecondary },
                ]}
              >
                • One number
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { fontSize: fs(12), lineHeight: fs(18) },
                  { color: colors.textSecondary },
                ]}
              >
                • One special character
              </Text>
            </View>

            <AuthButton
              title="Save New Password"
              onPress={handleResetPassword}
              loading={loading}
            />

            <View style={styles.footer}>
              <HelperLink
                title="Back to Verification"
                onPress={() => goTo("forgot2", { email })}
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
    paddingTop: 24,
    paddingBottom: 48,
  },

  titleBlock: {
    alignItems: "flex-start",
    marginBottom: 24,
  },

  title: {
    textAlign: "left",
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "left",
  },

  infoBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  infoText: {
    fontWeight: "500",
  },

  passwordRules: {
    marginTop: -4,
    marginBottom: 8,
    paddingLeft: 4,
  },

  ruleText: {
  },

  footer: {
    marginTop: 14,
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