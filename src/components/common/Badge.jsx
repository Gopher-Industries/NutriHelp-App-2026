import { View, Text } from "react-native";

import { colors } from "../../theme";
export default function Badge({ label, variant = "category" }) {
  let backgroundColor = colors.successStrong;
  if (variant === "tag") backgroundColor = colors.infoStrong; 
  if (variant === "status") backgroundColor = colors.dangerStrong; 
  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color: colors.white, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}