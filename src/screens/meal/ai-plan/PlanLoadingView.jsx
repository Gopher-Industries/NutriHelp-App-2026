import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useAccessibility } from "../../../context/AccessibilityContext";
import { colors } from "../../../theme";
const MESSAGES = [
  "🔍 Searching for the best recipes for you...",
  "🥗 Analysing your dietary preferences...",
  "💊 Checking your health conditions...",
  "⚖️  Balancing your nutrition targets...",
  "🍽️  Crafting your 7-day meal plan...",
  "🧂 Reviewing sodium and allergen levels...",
  "📋 Selecting ingredients just for you...",
  "✨ Putting the finishing touches on your plan...",
];

const INTERVAL_MS = 2200;

export default function PlanLoadingView({ onCancel }) {
  const { fs, sh } = useAccessibility();
  const [msgIndex, setMsgIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    spinLoop.start();
    return () => spinLoop.stop();
  }, [spinAnim]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }).start();
      });
    }, INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        <View style={styles.spinnerInner} />
      </Animated.View>

      <Animated.Text
        style={[
          styles.message,
          { opacity: fadeAnim, fontSize: fs(17), lineHeight: fs(26), minHeight: sh(54) },
        ]}
      >
        {MESSAGES[msgIndex]}
      </Animated.Text>

      <Text style={[styles.hint, { fontSize: fs(13) }]}>This may take 10–30 seconds</Text>

      <View style={styles.dots}>
        {MESSAGES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === msgIndex && styles.dotActive]}
          />
        ))}
      </View>

      <Pressable style={[styles.cancelBtn, { minHeight: sh(44) }]} onPress={onCancel}>
        <Ionicons name="close" size={fs(16)} color={colors.textSecondary} />
        <Text style={[styles.cancelText, { fontSize: fs(14) }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: colors.white,
  },
  spinner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 5,
    borderColor: colors.border,
    borderTopColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 36,
  },
  spinnerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceGreen,
  },
  message: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textNavy,
    textAlign: "center",
    lineHeight: 26,
    minHeight: 54,
  },
  hint: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    marginTop: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.borderStrong,
  },
  dotActive: {
    backgroundColor: colors.success,
    width: 18,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  cancelText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
});
