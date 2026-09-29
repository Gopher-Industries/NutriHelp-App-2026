import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  verifyPasswordResetCode,
  requestPasswordReset,
} from "../../api/authApi";
import { toErrorMessage } from "../../api/baseApi";
import useAppTheme from "../../hooks/useAppTheme";

import {
  AuthButton,
  AuthCard,
  AuthScreen,
  HelperLink,
} from "./AuthComponents";

export default function ForgotPasswordStep2Screen({
  email = "",
  goTo = (_nextScreen, _params) => {},
}) {
  const { colors } = useAppTheme();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [error, setError] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const handleCodeChange = (text) => {
    const numbersOnly = text.replace(/\D/g, "").slice(0, 6);
    setCode(numbersOnly);
    setError("");
  };

  const handleVerifyCode = async () => {
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyPasswordResetCode(email, code);

      goTo("forgot3", {
        email,
        resetToken: response?.resetToken,
      });
    } catch (error) {
      setError(
        toErrorMessage(
          error,
          "Invalid or expired code. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0) {
      return;
    }

    setResendSeconds(60);
    setError("");

    try {
      await requestPasswordReset(email);
    } catch (error) {
      setError(
        toErrorMessage(
          error,
          "Unable to resend code right now. Please try again later."
        )
      );
    }
  };

  return (
    <AuthScreen onBack={() => goTo("forgot1")}>
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
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <Text
                style={[
                  styles.iconText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                ✓
              </Text>
            </View>

            <View style={styles.titleBlock}>
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.text,
                  },
                ]}
              >
                Verification
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                Enter the 6-digit code sent to your email.
              </Text>

              <Text
                style={[
                  styles.emailText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {email || "your email"}
              </Text>
            </View>

            <View
              style={[
                styles.otpBox,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.inputBackground,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.otpInput,
                  {
                    color: colors.text,
                  },
                ]}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
            </View>

            {error ? (
              <Text
                style={[
                  styles.errorText,
                  {
                    color: colors.error,
                  },
                ]}
              >
                {error}
              </Text>
            ) : null}

            <Text
              style={[
                styles.resendText,
                {
                  color:
                    resendSeconds > 0
                      ? colors.textSecondary
                      : colors.primary,
                },
              ]}
              onPress={handleResend}
            >
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </Text>

            <AuthButton
              title="Verify"
              onPress={handleVerifyCode}
              loading={loading}
            />

            <View style={styles.footer}>
              <HelperLink
                title="Back to Email"
                onPress={() => goTo("forgot1")}
              />

              <HelperLink
                title="Back to Login"
                onPress={() => goTo("login")}
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

  iconCircle: {
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  iconText: {
    fontSize: 30,
    fontWeight: "800",
  },

  titleBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },

  emailText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },

  otpBox: {
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: "center",
    marginBottom: 10,
  },

  otpInput: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
  },

  errorText: {
    marginTop: 4,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
  },

  resendText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },

  footer: {
    marginTop: 14,
  },
});