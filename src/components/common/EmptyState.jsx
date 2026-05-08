import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function EmptyState({ message }) {
  return (
    <View style={{ alignItems: "center", marginTop: 40 }}>
      {/* Icon */}
      <Ionicons name="information-circle-outline" size={40} color="#777" />
      {/* Message */}
      <Text style={{ color: "#777", marginTop: 8 }}>
        {message}
      </Text>

    </View>
  );
}