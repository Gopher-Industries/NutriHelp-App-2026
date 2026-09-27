import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

import { colors } from "../../theme";

/**
 * Shared loading indicator (FE-02).
 */
export default function LoadingSpinner({
  message,
  size = "large",
  color = colors.primary,
  style,
  textStyle,
}) {
  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text style={[styles.message, textStyle]}>
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
