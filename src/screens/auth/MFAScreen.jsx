import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { resendMFA, verifyMFA } from "../../api/authApi";
import { toErrorMessage } from "../../api/baseApi";
import { useUser } from "../../context/UserContext";
import useAppTheme from "../../hooks/useAppTheme";

import {
  AuthButton,
  AuthCard,
  AuthScreen,
  HelperLink,
} from "./AuthComponents";

function maskEmail(email) {
  if (!email || !email.includes("@")) {
    return "your email inbox";
  }

  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  if (name.length <= 2) {
    return `${name[0] || ""}***@${domain}`;
  }

  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

export default function MFAScreen({
  email = "",
  password = "",
  goTo = (_nextScreen, _params) => {},
}) {
  const hiddenInputRef = useRef(null);
  const { login } = useUser();
  const { colors } = useAppTheme();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(60);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (resendSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setResendSeconds((previous) => previous - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds]);

  const otpSlots = useMemo(
    () => Array.from({ length: 6 }, (_, index) => code[index] || ""),
    [code]
  );

  const handleCodeChange = (text) => {
    const numbersOnly = text.replace(/\D/g, "").slice(0, 6);
    setCode(numbersOnly);
    setError("");
    setInfoMessage("");
  };

  const handleVerifyMFA = async () => {
    setError("");
    setInfoMessage("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit MFA code.");
      return;
    }

    if (!password) {
      setError("Session expired. Please go back and log in again.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyMFA(email, password, code);
      await login(response);
    } catch (verifyError) {
      setError(
        toErrorMessage(
          verifyError,
          "Invalid MFA code. Please try again."
        )
      );
      setCode("");
      hiddenInputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendSeconds > 0 || resending) {
      return;
    }

    if (!password) {
      setError("Session expired. Please go back and log in again.");
      return;
    }

    setResending(true);
    setError("");
    setInfoMessage("");

    try {
      await resendMFA(email, password);
      setResendSeconds(60);
      setCode("");
      setInfoMessage(
        `A new verification code was sent to ${maskEmail(email)}.`
      );
      hiddenInputRef.current?.focus();
    } catch (resendError) {
      setError(
        toErrorMessage(
          resendError,
          "Unable to resend the MFA code right now. Please try again later."
        )
      );
    } finally {
      setResending(false);
    }
  };

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
            {/* HERO ICON */}

            <View style={styles.heroIconWrap}>
              <View
                style={[
                  styles.heroIconCard,
                  {
                    backgroundColor: colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.heroIcon,
                    {
                      color: colors.primary,
                    },
                  ]}
                >
                  ✉
                </Text>
              </View>

              <View
                style={[
                  styles.successBadge,
                  {
                    backgroundColor: colors.success,
                    borderColor: colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.successBadgeText,
                    {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  ✓
                </Text>
              </View>
            </View>

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
                Enter the 6-digit code we sent to your email inbox.
              </Text>

              <Text
                style={[
                  styles.emailText,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {maskEmail(email)}
              </Text>
            </View>

            {/* OTP INPUT */}

            <Pressable
              style={styles.otpRow}
              onPress={() => hiddenInputRef.current?.focus()}
            >
              {otpSlots.map((digit, index) => {
                const isActive =
                  index === Math.min(code.length, 5);

                const borderColor =
                  digit || isActive
                    ? colors.primary
                    : colors.border;

                const backgroundColor =
                  digit || isActive
                    ? colors.inputBackground
                    : colors.surfaceSecondary;

                return (
                  <View
                    key={`otp-${index}`}
                    style={[
                      styles.otpSlot,
                      index < otpSlots.length - 1
                        ? styles.otpSlotSpacing
                        : null,
                      {
                        borderColor,
                        backgroundColor,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.otpSlotText,
                        {
                          color: colors.text,
                        },
                      ]}
                    >
                      {digit || ""}
                    </Text>
                  </View>
                );
              })}
            </Pressable>

            <TextInput
              ref={hiddenInputRef}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              style={styles.hiddenInput}
            />

            {/* ERROR / INFO */}

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

            {!error && infoMessage ? (
              <Text
                style={[
                  styles.infoText,
                  {
                    color: colors.success,
                  },
                ]}
              >
                {infoMessage}
              </Text>
            ) : null}

            {/* RESEND TIMER */}

            <Text
              style={[
                styles.resendHint,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {resendSeconds > 0
                ? `Resend in 0:${String(resendSeconds).padStart(2, "0")}`
                : "Didn't receive a code?"}
            </Text>

            {/* VERIFY */}

            <AuthButton
              title="Verify"
              onPress={handleVerifyMFA}
              loading={loading}
              disabled={code.length !== 6 || resending}
            />

            <HelperLink
              title={
                resending
                  ? "Sending a new code..."
                  : "Resend code"
              }
              onPress={handleResend}
            />

            <View style={styles.footer}>
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
    paddingTop: 14,
    paddingBottom: 48,
  },

  heroIconWrap: {
    alignSelf: "center",
    marginBottom: 26,
  },

  heroIconCard: {
    width: 86,
    height: 86,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  heroIcon: {
    fontSize: 34,
  },

  successBadge: {
    position: "absolute",
    right: -2,
    top: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },

  successBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  titleBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 290,
  },

  emailText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  otpSlot: {
    flex: 1,
    height: 54,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  otpSlotSpacing: {
    marginRight: 10,
  },

  otpSlotText: {
    fontSize: 22,
    fontWeight: "800",
  },

  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },

  errorText: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },

  infoText: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },

  resendHint: {
    marginBottom: 8,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },

  footer: {
    marginTop: 2,
  },
});