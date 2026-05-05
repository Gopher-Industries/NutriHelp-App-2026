import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

const nutriHelpLogo = require("../../../assets/nutrihelp-logo.png");
const googleLogo = require("../../../assets/google-logo.png");

function EyeIcon({ crossed = false }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12C4.6 7.8 8 5.5 12 5.5C16 5.5 19.4 7.8 21.5 12C19.4 16.2 16 18.5 12 18.5C8 18.5 4.6 16.2 2.5 12Z"
        stroke="#6B7280"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle
        cx={12}
        cy={12}
        r={3.2}
        stroke="#6B7280"
        strokeWidth={1.8}
      />

      {crossed ? (
        <Line
          x1={4}
          y1={20}
          x2={20}
          y2={4}
          stroke="#6B7280"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

export function AuthScreen({ children }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.backArrow}>‹</Text>

        <Image
          source={nutriHelpLogo}
          style={styles.nutriLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function AuthCard({ children }) {
  return <View style={styles.card}>{children}</View>;
}

export function FieldLabel({ children, error = false, focused = false }) {
  let color = "#18233D";

  if (error) {
    color = "#EF4444";
  } else if (focused) {
    color = "#1F73B7";
  }

  return <Text style={[styles.label, { color }]}>{children}</Text>;
}

export function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <Text style={styles.errorText}>{message}</Text>;
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  editable = true,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePassword,
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = Boolean(value && String(value).length > 0);

  let borderColor = "#CBD5E1";
  let borderWidth = 1;

  if (error) {
    borderColor = "#EF4444";
    borderWidth = 1.5;
  } else if (focused) {
    borderColor = "#1F73B7";
    borderWidth = 2;
  } else if (hasValue) {
    borderColor = "#18233D";
    borderWidth = 1.2;
  }

  if (!editable) {
    borderColor = "#E5E7EB";
    borderWidth = 1;
  }

  return (
    <View style={styles.inputGroup}>
      <FieldLabel error={Boolean(error)} focused={focused}>
        {label}
      </FieldLabel>

      <View style={[styles.inputBox, { borderColor, borderWidth }]}>
        <TextInput
          style={[styles.textInput, !editable && styles.disabledInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={editable ? "#9CA3AF" : "#E5E7EB"}
          secureTextEntry={secureTextEntry && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {showPasswordToggle ? (
          <Pressable style={styles.eyeButton} onPress={onTogglePassword}>
            <EyeIcon crossed={passwordVisible} />
          </Pressable>
        ) : null}
      </View>

      <FieldError message={error} />
    </View>
  );
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}) {
  return (
    <Pressable
      style={[styles.primaryButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text
          style={[
            styles.primaryButtonText,
            disabled && styles.disabledButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function GoogleButton({ onPress }) {
  return (
    <Pressable style={styles.googleButton} onPress={onPress}>
      <Image source={googleLogo} style={styles.googleLogo} resizeMode="contain" />

      <Text style={styles.googleButtonText}>Sign in with Google</Text>
    </Pressable>
  );
}

export function HelperLink({ title, onPress }) {
  return (
    <Pressable style={styles.linkWrapper} onPress={onPress}>
      <Text style={styles.linkText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backArrow: {
    fontSize: 32,
    color: "#18233D",
  },

  nutriLogo: {
    width: 112,
    height: 48,
  },

  body: {
    flex: 1,
  },

  card: {
    backgroundColor: "#FFFFFF",
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "500",
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputBox: {
    height: 50,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  textInput: {
    flex: 1,
    height: 50,
    fontSize: 14,
    color: "#18233D",
  },

  disabledInput: {
    color: "#D1D5DB",
  },

  eyeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  errorText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "#EF4444",
  },

  primaryButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#1F73B7",
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  disabledButton: {
    backgroundColor: "#E5E7EB",
  },

  disabledButtonText: {
    color: "#9CA3AF",
  },

  googleButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  googleLogo: {
    width: 42,
    height: 42,
    marginRight: 4,
  },

  googleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#18233D",
  },

  linkWrapper: {
    paddingVertical: 4,
  },

  linkText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#1F73B7",
    textDecorationLine: "underline",
  },
});