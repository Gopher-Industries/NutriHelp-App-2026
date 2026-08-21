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
              {
                borderColor: colors.successBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.successTick,
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
                  { color: colors.textSecondary },
                ]}
              >
                • At least 8 characters
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { color: colors.textSecondary },
                ]}
              >
                • One uppercase letter
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { color: colors.textSecondary },
                ]}
              >
                • One lowercase letter
              </Text>

              <Text
                style={[
                  styles.ruleText,
                  { color: colors.textSecondary },
                ]}
              >
                • One number
              </Text>

              <Text
                style={[
                  styles.ruleText,
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
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "left",
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 290,
  },

  infoBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },

  passwordRules: {
    marginTop: -4,
    marginBottom: 8,
    paddingLeft: 4,
  },

  ruleText: {
    fontSize: 12,
    lineHeight: 18,
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
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  successTick: {
    width: 56,
    height: 56,
    borderRadius: 999,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 54,
  },

  successTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
  },

  successMessage: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});