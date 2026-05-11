import { View, ActivityIndicator, Text } from "react-native";

export default function LoadingSpinner({ message }) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" />
      {message && (
        <Text style={{ marginTop: 10 }}>{message}</Text>
      )}
    </View>
  );
}