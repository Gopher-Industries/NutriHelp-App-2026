import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useToast } from "../context/ToastContext";

const TYPE_COLORS = {
  info: "#1F73B7",
  success: "#22C55E",
  error: "#EF4444",
};

export default function Toast() {
  const { toast, hideToast } = useToast();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return undefined;

    // fade in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => hideToast());
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast, opacity, hideToast]);

  if (!toast) return null;

  const backgroundColor = TYPE_COLORS[toast.type] || TYPE_COLORS.info;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: insets.bottom + 24, opacity },
      ]}
    >
      <Pressable
        onPress={hideToast}
        style={[styles.toast, { backgroundColor }]}
        accessibilityRole="alert"
        accessibilityLabel={toast.message}
      >
        <Text style={styles.text}>{toast.message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  toast: {
    maxWidth: 500,
    minWidth: 200,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});