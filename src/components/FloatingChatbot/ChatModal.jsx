import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAccessibility } from "../../context/AccessibilityContext";
import { sendChatMessage } from "../../services/chatbotApi";

const STORAGE_KEY = "nh-chat-messages";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── TTS helpers ───────────────────────────────────────────────────────────────

function useSpeech() {
  const [speakingId, setSpeakingId] = useState(null);

  const speak = useCallback((id, text) => {
    Speech.stop();
    setSpeakingId(id);
    Speech.speak(text, {
      language: "en",
      rate: 0.88,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeakingId(null);
  }, []);

  return { speakingId, speak, stop };
}

// ── Bubbles ───────────────────────────────────────────────────────────────────

function UserBubble({ message, fs, sh }) {
  return (
    <View style={styles.userRow}>
      <View style={[styles.userBubble, { maxWidth: "82%" }]}>
        <Text style={[styles.userText, { fontSize: fs(15) }]}>{message.text}</Text>
        <Text style={[styles.userTimestamp, { fontSize: fs(10) }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

function AiBubble({ message, speakingId, onSpeak, onStop, fs, sh }) {
  const isThisSpeaking = speakingId === message.id;
  return (
    <View style={styles.aiRow}>
      <View style={[styles.aiBubble, { maxWidth: "82%" }]}>
        <Text style={[styles.aiText, { fontSize: fs(15) }]}>{message.text}</Text>

        <View style={styles.aiBubbleFooter}>
          <Text style={[styles.aiTimestamp, { fontSize: fs(10) }]}>
            {formatTime(message.timestamp)}
          </Text>
          {/* Read-aloud button */}
          <Pressable
            style={[styles.speakBtn, { width: sh(28), height: sh(28), borderRadius: sh(14) }]}
            onPress={() =>
              isThisSpeaking ? onStop() : onSpeak(message.id, message.text)
            }
            hitSlop={8}
          >
            <Ionicons
              name={isThisSpeaking ? "stop-circle" : "volume-high-outline"}
              size={fs(15)}
              color={isThisSpeaking ? "#EF4444" : "#0B5FA5"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ThinkingBubble({ fs }) {
  return (
    <View style={styles.aiRow}>
      <View style={[styles.aiBubble, styles.thinkingBubble]}>
        <ActivityIndicator size="small" color="#0B5FA5" />
        <Text style={[styles.thinkingText, { fontSize: fs(14) }]}>Thinking…</Text>
      </View>
    </View>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function ChatModal({ visible, onClose }) {
  const { fs, sh } = useAccessibility();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);
  const { speakingId, speak, stop } = useSpeech();

  useEffect(() => {
    if (visible) loadMessages();
    return () => { if (!visible) Speech.stop(); };
  }, [visible]);

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
  };

  const saveMessages = async (msgs) => {
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)); } catch {}
  };

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date().toISOString(),
    };
    const withUser = [...messages, userMsg];
    setMessages(withUser);
    setInput("");
    setError(null);
    setLoading(true);
    try {
      const reply = await sendChatMessage(text);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: reply,
        timestamp: new Date().toISOString(),
      };
      const final = [...withUser, aiMsg];
      setMessages(final);
      await saveMessages(final);
    } catch (err) {
      setError(err.message || "Failed to get a response. Please try again.");
      await saveMessages(withUser);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert("Clear chat", "Remove all messages?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          setMessages([]);
          setError(null);
          Speech.stop();
          await AsyncStorage.removeItem(STORAGE_KEY);
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }) =>
      item.role === "user" ? (
        <UserBubble message={item} fs={fs} sh={sh} />
      ) : (
        <AiBubble
          message={item}
          speakingId={speakingId}
          onSpeak={speak}
          onStop={stop}
          fs={fs}
          sh={sh}
        />
      ),
    [fs, sh, speakingId, speak, stop]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={[styles.header, { minHeight: sh(52) }]}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="chevron-down" size={sh(26)} color="#64748B" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Ionicons name="sparkles" size={fs(17)} color="#0B5FA5" />
            <Text style={[styles.headerTitle, { fontSize: fs(17) }]}> NutriHelp AI</Text>
          </View>
          <Pressable onPress={handleClear} style={styles.headerBtn} hitSlop={12}>
            <Ionicons name="trash-outline" size={fs(20)} color="#94A3B8" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          {/* Messages */}
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={sh(52)} color="#CBD5E1" />
                <Text style={[styles.emptyTitle, { fontSize: fs(17) }]}>Ask NutriHelp AI</Text>
                <Text style={[styles.emptyBody, { fontSize: fs(14) }]}>
                  Get personalised advice on nutrition, meals, and health goals. Tap the speaker icon to hear replies aloud.
                </Text>
              </View>
            }
            ListFooterComponent={loading ? <ThinkingBubble fs={fs} /> : null}
            renderItem={renderItem}
          />

          {/* Error */}
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={fs(14)} color="#EF4444" />
              <Text style={[styles.errorText, { fontSize: fs(13) }]}> {error}</Text>
              <Pressable onPress={() => setError(null)} hitSlop={8}>
                <Ionicons name="close" size={fs(14)} color="#94A3B8" />
              </Pressable>
            </View>
          ) : null}

          {/* Input bar */}
          <View style={[styles.inputBar, { minHeight: sh(64) }]}>
            <TextInput
              style={[styles.input, { fontSize: fs(15), minHeight: sh(44) }]}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message…"
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
            />

            <Pressable
              style={[
                styles.sendBtn,
                { width: sh(44), height: sh(44), borderRadius: sh(22) },
                (!input.trim() || loading) && styles.sendBtnDisabled,
              ]}
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <Ionicons name="send" size={fs(17)} color="#FFFFFF" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBtn: { padding: 4, minWidth: 32 },
  headerCenter: { flexDirection: "row", alignItems: "center" },
  headerTitle: { fontWeight: "700", color: "#253B63" },

  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, flexGrow: 1 },

  empty: { flex: 1, alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  emptyTitle: { fontWeight: "700", color: "#253B63", marginTop: 16 },
  emptyBody: { color: "#94A3B8", textAlign: "center", lineHeight: 21, marginTop: 8 },

  // User bubble
  userRow: { alignItems: "flex-end", marginBottom: 10 },
  userBubble: {
    backgroundColor: "#0B5FA5",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userText: { color: "#FFFFFF", lineHeight: 22 },
  userTimestamp: { color: "rgba(255,255,255,0.55)", marginTop: 4, textAlign: "right" },

  // AI bubble
  aiRow: { alignItems: "flex-start", marginBottom: 10 },
  aiBubble: {
    backgroundColor: "#F1F5F9",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiText: { color: "#253B63", lineHeight: 22 },
  aiBubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  aiTimestamp: { color: "#94A3B8" },
  speakBtn: {
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  // Thinking
  thinkingBubble: { flexDirection: "row", alignItems: "center", gap: 8 },
  thinkingText: { color: "#94A3B8", fontStyle: "italic" },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
  },
  errorText: { color: "#EF4444", flex: 1, lineHeight: 18 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    color: "#253B63",
    backgroundColor: "#F8FAFC",
  },
  sendBtn: {
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#CBD5E1" },
});
