// src/components/NotificationPermissionScreen.jsx
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function NotificationPermissionScreen({ onAllow, onSkip }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔔</Text>

      <Text style={styles.title}>Stay on Track</Text>

      <Text style={styles.body}>
        NutriHelp can send you meal reminders and health alerts to help you
        reach your nutrition goals. You can change this anytime in Settings.
      </Text>

      <Pressable style={styles.primaryButton} onPress={onAllow}>
        <Text style={styles.primaryButtonText}>Allow Notifications</Text>
      </Pressable>

      <Pressable style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipButtonText}>Not Now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 16,
    textAlign: "center",
  },

  body: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },

  primaryButton: {
    height: 48,
    width: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  skipButton: {
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  skipButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
});