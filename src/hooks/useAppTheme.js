import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "../styles/theme";

export default function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    colors: isDark ? darkTheme : lightTheme,
  };
}