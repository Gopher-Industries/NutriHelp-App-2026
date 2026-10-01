import { Text, View } from "react-native";

export default function PlaceholderScreen({ route }) {
  const screenName = route?.name ?? "Screen";

  return (
    <View className="flex-1 items-center justify-center bg-nh-white px-6 dark:bg-nh-dark-c_0b1220">
      <Text className="text-2xl font-bold text-nh-success">{screenName}</Text>
      <Text className="mt-2 text-sm text-nh-textSecondary dark:text-nh-dark-textMuted">
        Coming soon
      </Text>
    </View>
  );
}
