import { View, useColorScheme } from "react-native";

export default function Card({ children, style }) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return (
    <View
      style={[
        {
          backgroundColor: isDark ? "#1F2937" : "#fff", 
          padding: 16,
          borderRadius: 10,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
          marginBottom: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}