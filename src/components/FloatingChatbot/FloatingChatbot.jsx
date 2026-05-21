import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { useUser } from "../../context/UserContext";
import { useChatbot } from "../../context/ChatbotContext";
import ChatModal from "./ChatModal";

export default function FloatingChatbot() {
  const { isAuthenticated } = useUser();
  const { open, openChatbot, closeChatbot } = useChatbot();

  if (!isAuthenticated) return null;

  return (
    <>
      <ChatModal visible={open} onClose={closeChatbot} />

      {/* pointerEvents="box-none" on the wrapper lets all touches that miss
          the FAB pass through to the navigation content below */}
      <View style={styles.container} pointerEvents="box-none">
        <Pressable
          style={styles.fab}
          onPress={openChatbot}
          android_ripple={{ color: "rgba(255,255,255,0.3)", borderless: true, radius: 30 }}
          accessibilityLabel="Open AI chat"
          accessibilityRole="button"
        >
          <Ionicons name="chatbubble-ellipses" size={26} color="#FFFFFF" />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 9999,
    elevation: 9999,
    // Explicit dimensions so the touch target is always correct
    width: 60,
    height: 60,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    // Android elevation
    elevation: 8,
  },
});
