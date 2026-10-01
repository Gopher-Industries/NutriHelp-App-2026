import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import { getTodayIntakeLocal, saveTodayIntakeLocal } from "../api/waterIntakeApi";
import { useToast } from "../context/ToastContext";

import { colors } from "../theme";
const DAILY_GOAL_CUPS = 8;
const REMINDERS_KEY = "nutrihelp.water.dailyReminders";
const WATER_NOTIFICATION_KEY = "nutrihelp.water.notificationId";
const WATER_CHANNEL_ID = "water-reminders";

function buildReminderKey(userId) {
  const scope = userId ? `user_${userId}` : "guest";
  return `${REMINDERS_KEY}.${scope}`;
}

async function setupAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(WATER_CHANNEL_ID, {
    name: "Water Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrationPattern: [0, 250, 250, 250],
  });
}

async function cancelWaterReminder() {
  try {
    const id = await AsyncStorage.getItem(WATER_NOTIFICATION_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(WATER_NOTIFICATION_KEY);
    }
  } catch {}
}

async function scheduleWaterReminder() {
  await cancelWaterReminder();
  await setupAndroidChannel();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to hydrate! 💧",
      body: "A glass of water keeps you energized and healthy.",
      data: { screen: "WaterIntake" },
      ...(Platform.OS === "android" && { channelId: WATER_CHANNEL_ID }),
    },
    trigger: {
      seconds: 3600,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(WATER_NOTIFICATION_KEY, id);
  return id;
}

function ProgressRing({ current, goal }) {
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const gapDeg = 5;
  const segDeg = 360 / goal - gapDeg;
  const segLength = (circumference * segDeg) / 360;

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        {Array.from({ length: goal }).map((_, i) => {
          const filled = i < current;
          const angle = -90 + i * (360 / goal);
          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              stroke={filled ? colors.primaryMuted : colors.surfaceInfo}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${segLength} ${circumference - segLength}`}
              transform={`rotate(${angle}, ${cx}, ${cy})`}
            />
          );
        })}
      </Svg>

      <View style={styles.ringCenter}>
        <Text style={styles.ringCurrent}>{current}</Text>
        <Text style={styles.ringLabel}>of {goal} cups</Text>
      </View>
    </View>
  );
}

function QuickAction({ label, onPress }) {
  return (
    <Pressable style={styles.quickActionBtn} onPress={onPress}>
      <Text style={styles.quickActionText}>{label}</Text>
    </Pressable>
  );
}

export default function WaterTracker({ userId, dailyGoal = DAILY_GOAL_CUPS }) {
  const { showToast } = useToast();
  const [glasses, setGlasses] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);
  const [customValue, setCustomValue] = useState("1");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [localGlasses, storedReminder] = await Promise.all([
        getTodayIntakeLocal(userId),
        AsyncStorage.getItem(buildReminderKey(userId)),
      ]);
      if (cancelled) return;
      setGlasses(localGlasses ?? 0);
      setRemindersEnabled(storedReminder === "true");
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const progress = useMemo(
    () => Math.min(Math.max(glasses / dailyGoal, 0), 1),
    [glasses, dailyGoal]
  );

  const persistIntake = async (nextGlasses) => {
    const safeValue = Math.max(0, Math.min(nextGlasses, dailyGoal));
    setGlasses(safeValue);
    await saveTodayIntakeLocal(userId, safeValue);
  };

  const adjustGlasses = (delta) => persistIntake(glasses + delta);

  const handleToggleReminders = async (value) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please enable notifications in your device settings to receive water reminders."
        );
        return;
      }
      await scheduleWaterReminder();
    } else {
      await cancelWaterReminder();
    }

    setRemindersEnabled(value);
    await AsyncStorage.setItem(buildReminderKey(userId), value ? "true" : "false");
  };

  const applyCustomAmount = async () => {
    const parsed = parseInt(customValue, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast("Please enter a valid number of cups.", "error");
      return;
    }
    await persistIntake(glasses + parsed);
    setCustomVisible(false);
  };

  const pct = Math.round(progress * 100);
  const remaining = Math.max(dailyGoal - glasses, 0);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProgressRing current={glasses} goal={dailyGoal} />

      <Text style={styles.statusTitle}>
        {pct >= 100 ? "Daily goal reached!" : `${pct}% of daily goal`}
      </Text>
      <Text style={styles.statusSubtitle}>
        {remaining > 0
          ? `${remaining} more cup${remaining > 1 ? "s" : ""} to reach your goal`
          : "Great job staying hydrated today"}
      </Text>

      <View style={styles.counterCard}>
        <Pressable
          style={[styles.counterBtn, glasses <= 0 && styles.counterBtnDisabled]}
          onPress={() => adjustGlasses(-1)}
          disabled={glasses <= 0}
        >
          <Ionicons name="remove" size={24} color={glasses <= 0 ? colors.borderSlate : colors.primaryMuted} />
        </Pressable>

        <View style={styles.counterCenter}>
          <Text style={styles.counterValue}>{glasses}</Text>
          <Text style={styles.counterLabel}>cups today</Text>
        </View>

        <Pressable
          style={[styles.counterBtn, glasses >= dailyGoal && styles.counterBtnDisabled]}
          onPress={() => adjustGlasses(1)}
          disabled={glasses >= dailyGoal}
        >
          <Ionicons name="add" size={24} color={glasses >= dailyGoal ? colors.borderSlate : colors.primaryMuted} />
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        <QuickAction label="+1 cup" onPress={() => adjustGlasses(1)} />
        <QuickAction label="+2 cups" onPress={() => adjustGlasses(2)} />
        <QuickAction label="Custom" onPress={() => setCustomVisible(true)} />
      </View>

      <View style={styles.remindersCard}>
        <View style={styles.remindersLeft}>
          <Ionicons name="notifications-outline" size={20} color={colors.primaryMuted} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.remindersTitle}>Hourly reminders</Text>
            <Text style={styles.remindersSubtitle}>
              {remindersEnabled
                ? "You'll be reminded every hour"
                : "Tap to get hourly hydration reminders"}
            </Text>
          </View>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={handleToggleReminders}
          trackColor={{ false: colors.border, true: colors.surfaceInfoStrong }}
          thumbColor={remindersEnabled ? colors.primaryMuted : colors.textMuted}
        />
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={16} color={colors.primaryMuted} style={{ marginBottom: 6 }} />
        <Text style={styles.tipText}>
          Drinking enough water supports digestion, energy levels, and overall health. Aim for 8
          cups per day.
        </Text>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={customVisible}
        onRequestClose={() => setCustomVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add custom amount</Text>
            <Text style={styles.modalSubtitle}>How many cups would you like to add?</Text>

            <TextInput
              style={styles.modalInput}
              value={customValue}
              onChangeText={setCustomValue}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor={colors.textMuted}
            />

            <Pressable style={styles.modalPrimaryBtn} onPress={applyCustomAmount}>
              <Text style={styles.modalPrimaryText}>Add cups</Text>
            </Pressable>

            <Pressable style={styles.modalSecondaryBtn} onPress={() => setCustomVisible(false)}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },

  ringWrap: { alignItems: "center", justifyContent: "center", marginBottom: 20 },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringCurrent: { fontSize: 52, fontWeight: "800", color: colors.textNavy },
  ringLabel: { fontSize: 14, color: colors.textSlate400, fontWeight: "500" },

  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textNavy,
    textAlign: "center",
    marginBottom: 6,
  },
  statusSubtitle: { fontSize: 14, color: colors.textSecondaryAlt, textAlign: "center", marginBottom: 24 },

  counterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnDisabled: { borderColor: colors.border },
  counterCenter: { alignItems: "center" },
  counterValue: { fontSize: 40, fontWeight: "800", color: colors.textNavy },
  counterLabel: { fontSize: 13, color: colors.textSlate400, fontWeight: "500" },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.surfaceInfoStrong,
    backgroundColor: colors.surfaceBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: { fontSize: 14, fontWeight: "600", color: colors.primaryMuted },

  remindersCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 16,
    marginBottom: 14,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  remindersLeft: { flexDirection: "row", alignItems: "center" },
  remindersTitle: { fontSize: 15, fontWeight: "600", color: colors.textNavy },
  remindersSubtitle: { fontSize: 12, color: colors.textSlate400, marginTop: 2 },

  tipCard: {
    borderRadius: 16,
    backgroundColor: colors.surfaceBlue,
    borderWidth: 1,
    borderColor: colors.surfaceInfoStrong,
    padding: 16,
    alignItems: "flex-start",
  },
  tipText: { fontSize: 13, color: colors.info, lineHeight: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: colors.white,
    padding: 22,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: colors.textNavy, marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: colors.textSecondaryAlt, lineHeight: 21, marginBottom: 16 },
  modalInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSlate,
    paddingHorizontal: 16,
    fontSize: 20,
    color: colors.textNavy,
    marginBottom: 14,
  },
  modalPrimaryBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalPrimaryText: { fontSize: 15, fontWeight: "700", color: colors.white },
  modalSecondaryBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surfaceSlate,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: { fontSize: 15, fontWeight: "600", color: colors.textSecondaryAlt },
});
