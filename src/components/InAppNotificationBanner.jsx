import { colors } from "../theme";
// src/components/InAppNotificationBanner.jsx
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function InAppNotificationBanner({ notification, onDismiss }) {
  if (!notification) return null;

  const title = notification.request.content.title ?? "Notification";
  const body = notification.request.content.body ?? "";

  // Auto dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  return (
    <Pressable style={styles.banner} onPress={onDismiss}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {body ? (
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        ) : null}
      </View>
      <Text style={styles.dismiss}>✕</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 56,
    left: 16,
    right: 16,
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },

  content: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 2,
  },

  body: {
    fontSize: 12,
    color: colors.borderStrong,
  },

  dismiss: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 12,
  },
});