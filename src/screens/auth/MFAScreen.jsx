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

import { verifyMFA } from "../../api/authApi";
import { useUser } from "../../context/UserContext";

import {
  AuthButton,
  AuthCard,
  AuthScreen,
  HelperLink,
} from "./AuthComponents";

export default function MFAScreen({
  email = "",
  password = "",
  goTo = (_nextScreen, _params) => {},
}) {
  const { login } = useUser();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    if (!password) {
      setError("Session expired. Please go back and log in again.");
      return;
    }

    setLoading(true);

    try {
      const response = await verifyMFA(email, password, code);
      await login(response);
    } catch (error) {
      setError(error?.message || "Invalid MFA code. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
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
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔐</Text>
            </View>

            <View style={styles.titleBlock}>
              <Text style={styles.title}>Two-Step Verification</Text>

              <Text style={styles.subtitle}>
                A 6-digit security code was sent to your email when you logged in.
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
    paddingBottom: 48,
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

  footer: {
    marginTop: 14,
  },
});
