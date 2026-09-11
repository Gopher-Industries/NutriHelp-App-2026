import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { requestPasswordReset } from "../../api/authApi";
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

const forgotPasswordSchema = {
  email: {
    required: true,
    type: "email",
  },
};

export default function ForgotPasswordStep1Screen({
  goTo = (_nextScreen, _params) => {},
}) {
  const { colors } = useAppTheme();

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const { values, errors, handleChange, validate } = useFormValidation(
    forgotPasswordSchema,
    {
      email: "",
    }
  );

  const handleSendResetLink = async () => {
    setGeneralError("");

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(values.email);

      goTo("forgot2", {
        email: values.email.trim(),
      });
    } catch (error) {
      setGeneralError(
        toErrorMessage(
          error,
          "We could not send the reset email. Please try again."
        )
      );
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
                ✉
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
                Forgot your password?
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                No worries. Enter your email below and we will send you a code
                to reset it.
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
              label="Email Address"
              value={values.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Enter Your Email"
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <AuthButton
              title="Send Reset Link"
              onPress={handleSendResetLink}
              loading={loading}
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
    paddingTop: 32,
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
    marginBottom: 28,
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

  footer: {
    marginTop: 14,
  },
});