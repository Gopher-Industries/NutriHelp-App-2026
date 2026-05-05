import { View, Text } from "react-native";

export default function Badge({ label, variant = "category" }) {
  let backgroundColor = "#16A34A";
  if (variant === "tag") backgroundColor = "#2563EB"; 
  if (variant === "status") backgroundColor = "#DC2626"; 
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
      <Text style={{ color: "#fff", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}