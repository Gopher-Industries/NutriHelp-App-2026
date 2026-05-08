import { Text, View } from "react-native";

export default function PlaceholderScreen({ route }) {
  const screenName = route?.name ?? "Screen";

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-[#0B1220]">
      <Text className="text-2xl font-bold text-[#047857]">{screenName}</Text>
      <Text className="mt-2 text-sm text-[#6B7280] dark:text-[#9CA3AF]">
        Coming soon
      </Text>
    </View>
  );
}
