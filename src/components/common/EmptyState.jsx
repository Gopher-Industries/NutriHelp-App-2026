import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../theme";

/**
 * Shared empty state (FE-02).
 */
export default function EmptyState({ message, style, icon = "information-circle-outline" }) {
  return (
    <View style={[styles.wrap, style]}>
      <Ionicons name={icon} size={40} color={colors.textGrayMid} />
      <Text style={styles.message}>{message}</Text>
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
    fontSize: 14,
    color: colors.textGrayMid,
    marginTop: 8,
    textAlign: "center",
  },
});
