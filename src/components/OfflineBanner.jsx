import { colors } from "../theme";
// src/components/OfflineBanner.jsx
import { StyleSheet, Text, View } from "react-native";

export default function OfflineBanner({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        📵 You are offline — showing cached data
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  text: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
});