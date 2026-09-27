import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

export default function EmptyState({ message }) {
  return (
    <View style={{ alignItems: "center", marginTop: 40 }}>
      {/* Icon */}
      <Ionicons name="information-circle-outline" size={40} color={colors.textGrayMid} />
      {/* Message */}
      <Text style={{ color: colors.textGrayMid, marginTop: 8 }}>
        {message}
      </Text>

    </View>
  );
}