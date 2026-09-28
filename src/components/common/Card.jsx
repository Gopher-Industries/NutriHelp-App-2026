import { View } from "react-native";
import useAppTheme from "../../hooks/useAppTheme";

export default function Card({ children, style }) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          padding: 16,
          borderRadius: 10,
          shadowColor: colors.text,
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