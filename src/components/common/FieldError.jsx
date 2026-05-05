import { Text } from "react-native";

export default function FieldError({ message }) {
  if (!message) return null;
  return (
    <Text style={{ color: "red", marginTop: 4 }}>
      {message}
    </Text>
  );
}