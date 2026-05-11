import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function NavigationHeader({
  title,
  showBackButton = false,
  onBackPress,
  rightAction,
}) {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View
      style={{
        height: 60,
        backgroundColor: isDark ? "#111827" : "#ffffff", 
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
      }}
    >
      {showBackButton && (
        <TouchableOpacity
          onPress={onBackPress || (() => navigation.goBack())}
          style={{
            position: "absolute",
            left: 15,
            padding: 10,
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#fff" : "#000"} 
          />
        </TouchableOpacity>
      )}

      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: isDark ? "#fff" : "#000", 
        }}
      >
        {title}
      </Text>

      {rightAction && (
        <View style={{ position: "absolute", right: 15 }}>
          {rightAction}
        </View>
      )}
    </View>
  );
}