import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

import { useAccessibility } from "../../context/AccessibilityContext";
import { colors } from "../../theme";

/**
 * Shared loading indicator (FE-02).
 * Consumes AccessibilityContext font scale (FE-04).
 */
export default function LoadingSpinner({
  message,
  size = "large",
  color = colors.primary,
  style,
  textStyle,
}) {
  const { fs } = useAccessibility();

  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text style={[styles.message, { fontSize: fs(14) }, textStyle]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    marginTop: 10,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
