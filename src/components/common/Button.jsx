import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}) {
  const bg =
    variant === "primary"
      ? "#16A34A"
      : variant === "secondary"
      ? "#6B7280"
      : "transparent";

  const border = variant === "outline" ? 1 : 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: bg,
        borderWidth: border,
        borderColor: "#16A34A",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ color: variant === "outline" ? "#16A34A" : "#fff" }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}