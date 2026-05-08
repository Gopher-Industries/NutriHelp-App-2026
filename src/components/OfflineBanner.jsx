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
    backgroundColor: "#F59E0B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  text: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});