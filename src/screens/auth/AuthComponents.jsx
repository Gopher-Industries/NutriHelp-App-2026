import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";

const nutriHelpLogo = require("../../../assets/nutrihelp-logo.png");
const googleLogo = require("../../../assets/google-logo.png");

function EyeIcon({ crossed = false }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12C4.6 7.8 8 5.5 12 5.5C16 5.5 19.4 7.8 21.5 12C19.4 16.2 16 18.5 12 18.5C8 18.5 4.6 16.2 2.5 12Z"
        stroke="#6B7280"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Circle cx={12} cy={12} r={3.2} stroke="#6B7280" strokeWidth={1.8} />

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

function ChevronLeftIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke="#18233D"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AuthScreen({ children, onBack }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!onBack) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack();
        return true;
      }
    );

    return () => subscription.remove();
  }, [onBack]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top + 12, 48), paddingBottom: Math.max(insets.bottom, 32) },
      ]}
    >
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeftIcon />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

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

  let borderColor = "#D1D5DB";
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

      <View
        style={[
          styles.inputBox,
          { borderColor, borderWidth },
          !editable && styles.inputBoxDisabled,
        ]}
      >
        <TextInput
          style={[styles.textInput, !editable && styles.disabledInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={editable ? "#9CA3AF" : "#D1D5DB"}
          secureTextEntry={secureTextEntry && !passwordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {showPasswordToggle ? (
          <Pressable
            style={styles.eyeButton}
            onPress={onTogglePassword}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
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
      android_ripple={{ color: "rgba(255,255,255,0.25)", borderless: false }}
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

export function GoogleButton({ onPress, loading = false, disabled = false }) {
  return (
    <Pressable
      style={[styles.googleButton, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: "rgba(0,0,0,0.05)", borderless: false }}
    >
      {loading ? (
        <ActivityIndicator color="#18233D" />
      ) : (
        <>
          <Image
            source={googleLogo}
            style={styles.googleLogo}
            resizeMode="contain"
          />
          <Text style={styles.googleButtonText}>Sign in with Google</Text>
        </>
      )}
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
    paddingBottom: 32,
  },

  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  backPlaceholder: {
    width: 36,
    height: 36,
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
    color: "#18233D",
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

  inputBoxDisabled: {
    backgroundColor: "#F9FAFB",
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
    marginBottom: 8,
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
    marginBottom: 8,
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
    alignItems: "center",
  },

  linkText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F73B7",
    textDecorationLine: "underline",
  },
});
