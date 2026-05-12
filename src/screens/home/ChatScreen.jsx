import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { post } from "../../api/baseApi";
import { useUser } from "../../context/UserContext";

const GREETING = {
  id: "greeting",
  role: "assistant",
  text: "Hi! I'm NutriHelp AI. Ask me anything about nutrition, recipes, meal planning, or your health goals. 🥗",
};

function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <Text style={styles.assistantAvatarText}>AI</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.assistantAvatarText}>AI</Text>
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
        <ActivityIndicator size="small" color="#9CA3AF" />
        <Text style={styles.typingText}>Thinking...</Text>
      </View>
    </View>
  );
}

export default function ChatScreen({ navigation }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([GREETING]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    const userMsg = { id: `user-${Date.now()}`, role: "user", text };
    setMessages((previous) => [...previous, userMsg]);
    setInputText("");
    setLoading(true);
    scrollToBottom();

    try {
      const response = await post("/api/chatbot", {
        user_id: user?.id,
        user_input: text,
      });

      const reply =
        response?.data?.response ||
        response?.response ||
        response?.message ||
        response?.data?.message ||
        "I'm not sure how to answer that. Could you rephrase?";

      const assistantMsg = { id: `ai-${Date.now()}`, role: "assistant", text: reply };
      setMessages((previous) => [...previous, assistantMsg]);
    } catch {
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: "Sorry, I couldn't process your request right now. Please check your connection and try again.",
      };
      setMessages((previous) => [...previous, errorMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#667085" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={styles.headerAiDot} />
          <Text style={styles.headerTitle}>NutriHelp AI</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {loading && <TypingIndicator />}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask about nutrition, recipes..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { flexDirection: "row", alignItems: "center", width: 60 },
  backText: { marginLeft: 4, fontSize: 15, color: "#667085" },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  headerAiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#18233D" },
  headerSpacer: { width: 60 },
  messageList: { flex: 1, backgroundColor: "#F8FAFC" },
  messageListContent: { paddingHorizontal: 16, paddingVertical: 16 },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  assistantAvatarText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  bubble: {
    maxWidth: "75%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#2B78C5",
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: "#FFFFFF" },
  bubbleTextAssistant: { color: "#18233D" },
  typingBubble: { flexDirection: "row", alignItems: "center" },
  typingText: { marginLeft: 8, fontSize: 14, color: "#9CA3AF" },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#18233D",
    marginRight: 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2B78C5",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { backgroundColor: "#B0C4DE" },
});
