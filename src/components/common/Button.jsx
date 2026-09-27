import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";

import { colors } from "../../theme";

/**
 * Shared primary action button (FE-02).
 * Variants map to existing app colors to avoid visual regressions.
 */
export default function Button({
  label,
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  ...rest
}) {
  const text = label ?? title ?? "";

  const variantStyle = styles[variant] || styles.primary;
  const variantTextStyle = styles[`${variant}Text`] || styles.primaryText;
  const spinnerColor =
    variant === "secondary" || variant === "outline"
      ? colors.primary
      : colors.white;

  return (
    <TouchableOpacity
      {...rest}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyle,
        disabled ? styles.disabled : null,
        style,
      ]}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text
          style={[
            styles.text,
            variantTextStyle,
            disabled ? styles.disabledText : null,
            textStyle,
          ]}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryText: {
    color: colors.textMutedNavy,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.white,
  },
  success: {
    backgroundColor: colors.primaryDeep,
  },
  successText: {
    color: colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
