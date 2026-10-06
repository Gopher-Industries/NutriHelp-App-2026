import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAccessibility } from "../../context/AccessibilityContext";
import { colors } from "../../theme";

/**
 * Shared empty state (FE-02).
 * Consumes AccessibilityContext font/icon scale (FE-04).
 */
export default function EmptyState({ message, style, icon = "information-circle-outline" }) {
  const { fs } = useAccessibility();

  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name={icon} size={fs(40)} color={colors.textGrayMid} />
      <Text style={[styles.message, { fontSize: fs(14) }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    marginTop: 40,
    paddingHorizontal: 16,
  },
  message: {
    color: colors.textGrayMid,
    marginTop: 8,
    textAlign: "center",
  },
});
