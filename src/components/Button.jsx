// src/components/Button.jsx
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // "primary" | "secondary" | "danger"
  style,
  textStyle,
}) {
  const handlePress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics not supported on this device — ignore silently
    }
    onPress?.();
  };

  return (
    <Pressable
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" ? "#18233D" : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text`],
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  primary: {
    backgroundColor: "#4CAF50",
  },

  secondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  danger: {
    backgroundColor: "#EF4444",
  },

  disabled: {
    backgroundColor: "#E5E7EB",
  },

  text: {
    fontSize: 14,
    fontWeight: "700",
  },

  primaryText: {
    color: "#FFFFFF",
  },

  secondaryText: {
    color: "#18233D",
  },

  dangerText: {
    color: "#FFFFFF",
  },

  disabledText: {
    color: "#9CA3AF",
  },
});