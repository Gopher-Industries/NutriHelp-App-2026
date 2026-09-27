import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { colors } from "../../theme";

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}) {
  const bg =
    variant === "primary"
      ? colors.successStrong
      : variant === "secondary"
      ? colors.textSecondary
      : "transparent";

  const border = variant === "outline" ? 1 : 0;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        backgroundColor: bg,
        borderWidth: border,
        borderColor: colors.successStrong,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={{ color: variant === "outline" ? colors.successStrong : colors.white }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}