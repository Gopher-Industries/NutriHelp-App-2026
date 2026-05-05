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

import { post } from "../../api/baseApi";
import { useUser } from "../../context/UserContext";

import {
  AuthButton,
  AuthCard,
  AuthScreen,
  HelperLink,
} from "./AuthComponents";

export default function MFAScreen({
  email = "",
  goTo = (_nextScreen, _params) => {},
}) {
  const { login } = useUser();

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

  useEffect(() => {
    if (code.length === 6) {
      handleVerifyMFA();
    }
  }, [code]);

  const handleCodeChange = (text) => {
    const numbersOnly = text.replace(/\D/g, "").slice(0, 6);
    setCode(numbersOnly);
    setError("");
  };

  const handleVerifyMFA = async () => {
    setError("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit MFA code.");
      return;
    }

    setLoading(true);

    try {
      const response = await post(
        "/api/auth/mfa/verify",
        {
          email,
          code,
        },
        { skipAuth: true }
      );

      await login(response);
    } catch {
      setError("Invalid MFA code. Please try again.");
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
      await post(
        "/api/auth/mfa/resend",
        {
          email,
        },
        { skipAuth: true }
      );
    } catch {
      setError("Unable to resend MFA code right now. Please try again later.");
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
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔐</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>Two-Step Verification</Text>

              <Text style={styles.subtitle}>
                Enter the 6-digit security code sent to your email to continue.
              </Text>

              <Text style={styles.emailText}>{email || "your email"}</Text>
            </View>

            <View style={styles.otpBox}>
              <TextInput
                style={styles.otpInput}
                value={code}
                onChangeText={handleCodeChange}
                placeholder="000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.resendText} onPress={handleResend}>
              {resendSeconds > 0
                ? `Resend code in ${resendSeconds}s`
                : "Resend code"}
            </Text>

            <AuthButton
              title="Verify"
              onPress={handleVerifyMFA}
              loading={loading}
            />

            <View style={styles.footer}>
              <HelperLink title="Back to Login" onPress={() => goTo("login")} />
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
    paddingBottom: 24,
  },

  iconCircle: {
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 999,
    backgroundColor: "#EEF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  iconText: {
    fontSize: 30,
  },

  titleBlock: {
    alignItems: "center",
    marginBottom: 24,
  },

  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "800",
    color: "#18233D",
  },

  subtitle: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    maxWidth: 300,
  },

  emailText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#1F73B7",
  },

  otpBox: {
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#1F73B7",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    marginBottom: 10,
  },

  otpInput: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#18233D",
  },

  errorText: {
    marginTop: 4,
    marginBottom: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },

  resendText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#1F73B7",
    marginBottom: 8,
  },

  footer: {
    marginTop: 14,
  },
});