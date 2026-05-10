import {
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";

export default function ScreenLayout({
  children,
  scrollable = false,
  style,
}) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
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
        { flex: 1, backgroundColor: isDark ? "#111827" : "#fff" }, 
        style, // ✅ applied style prop
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