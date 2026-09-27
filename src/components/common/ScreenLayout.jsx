import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native";

import useAppTheme from "../../hooks/useAppTheme";

export default function ScreenLayout({
  children,
  scrollable = false,
  style,
}) {
  const { colors } = useAppTheme();

  const content = scrollable ? (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {children}
    </ScrollView>
  ) : (
    <View style={{ padding: 16 }}>{children}</View>
  );

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}