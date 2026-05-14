import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

import {
  getTodayIntake,
  getTodayIntakeLocal,
  logWaterIntake,
  saveTodayIntakeLocal,
} from "../api/waterIntakeApi";

const DAILY_GOAL_CUPS = 8;
const REMINDERS_KEY = "nutrihelp.water.dailyReminders";

function buildReminderKey(userId) {
  const scope = userId ? `user_${userId}` : "guest";
  return `${REMINDERS_KEY}.${scope}`;
}

function ProgressRing({ current, goal }) {
  const size = 220;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const gapDeg = 5;
  const segDeg = (360 / goal) - gapDeg;
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
              stroke={filled ? "#2A78C5" : "#DBEAFE"}
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
  const [glasses, setGlasses] = useState(0);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);
  const [customValue, setCustomValue] = useState("1");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const [remoteGlasses, localGlasses, storedReminder] = await Promise.all([
        userId ? getTodayIntake(userId).catch(() => null) : Promise.resolve(null),
        getTodayIntakeLocal(userId),
        AsyncStorage.getItem(buildReminderKey(userId)),
      ]);
      if (cancelled) return;
      setGlasses(remoteGlasses ?? localGlasses ?? 0);
      setRemindersEnabled(storedReminder === "true");
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [userId]);

  const progress = useMemo(
    () => Math.min(Math.max(glasses / dailyGoal, 0), 1),
    [glasses, dailyGoal]
  );

  const persistIntake = async (nextGlasses) => {
    const safeValue = Math.max(0, Math.min(nextGlasses, dailyGoal));
    setGlasses(safeValue);
    await saveTodayIntakeLocal(userId, safeValue);
    if (userId) logWaterIntake(userId, safeValue).catch(console.error);
  };

  const adjustGlasses = (delta) => persistIntake(glasses + delta);

  const handleToggleReminders = async (value) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem(buildReminderKey(userId), value ? "true" : "false");
  };

  const applyCustomAmount = async () => {
    const parsed = parseInt(customValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert("Custom intake", "Please enter a valid number of cups.");
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
      {/* Progress ring */}
      <ProgressRing current={glasses} goal={dailyGoal} />

      {/* Status text */}
      <Text style={styles.statusTitle}>
        {pct >= 100 ? "Daily goal reached! 🎉" : `${pct}% of daily goal`}
      </Text>
      <Text style={styles.statusSubtitle}>
        {remaining > 0
          ? `${remaining} more cup${remaining > 1 ? "s" : ""} to reach your goal`
          : "Great job staying hydrated today"}
      </Text>

      {/* Counter */}
      <View style={styles.counterCard}>
        <Pressable
          style={[styles.counterBtn, glasses <= 0 && styles.counterBtnDisabled]}
          onPress={() => adjustGlasses(-1)}
          disabled={glasses <= 0}
        >
          <Ionicons name="remove" size={24} color={glasses <= 0 ? "#CBD5E1" : "#2A78C5"} />
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
          <Ionicons name="add" size={24} color={glasses >= dailyGoal ? "#CBD5E1" : "#2A78C5"} />
        </Pressable>
      </View>

      {/* Quick actions */}
      <View style={styles.quickRow}>
        <QuickAction label="+1 cup" onPress={() => adjustGlasses(1)} />
        <QuickAction label="+2 cups" onPress={() => adjustGlasses(2)} />
        <QuickAction label="Custom" onPress={() => setCustomVisible(true)} />
      </View>

      {/* Reminders toggle */}
      <View style={styles.remindersCard}>
        <View style={styles.remindersLeft}>
          <Ionicons name="notifications-outline" size={20} color="#2A78C5" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.remindersTitle}>Daily reminders</Text>
            <Text style={styles.remindersSubtitle}>
              {remindersEnabled ? "Reminders are on" : "Tap to enable reminders"}
            </Text>
          </View>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={handleToggleReminders}
          trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
          thumbColor={remindersEnabled ? "#2A78C5" : "#9CA3AF"}
        />
      </View>

      {/* Hydration tip */}
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={16} color="#2A78C5" style={{ marginBottom: 6 }} />
        <Text style={styles.tipText}>
          Drinking enough water supports digestion, energy levels, and overall health. Aim for 8 cups per day.
        </Text>
      </View>

      {/* Custom modal */}
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
              placeholderTextColor="#9CA3AF"
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
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36 },

  ringWrap: { alignItems: "center", justifyContent: "center", marginBottom: 20 },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringCurrent: { fontSize: 52, fontWeight: "800", color: "#253B63" },
  ringLabel: { fontSize: 14, color: "#94A3B8", fontWeight: "500" },

  statusTitle: { fontSize: 20, fontWeight: "700", color: "#253B63", textAlign: "center", marginBottom: 6 },
  statusSubtitle: { fontSize: 14, color: "#667085", textAlign: "center", marginBottom: 24 },

  counterCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: "#000",
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
    borderColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnDisabled: { borderColor: "#E5E7EB" },
  counterCenter: { alignItems: "center" },
  counterValue: { fontSize: 40, fontWeight: "800", color: "#253B63" },
  counterLabel: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  quickActionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: { fontSize: 14, fontWeight: "600", color: "#2A78C5" },

  remindersCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  remindersLeft: { flexDirection: "row", alignItems: "center" },
  remindersTitle: { fontSize: 15, fontWeight: "600", color: "#253B63" },
  remindersSubtitle: { fontSize: 12, color: "#94A3B8", marginTop: 2 },

  tipCard: {
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 16,
    alignItems: "flex-start",
  },
  tipText: { fontSize: 13, color: "#3B82F6", lineHeight: 20 },

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
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#253B63", marginBottom: 6 },
  modalSubtitle: { fontSize: 14, color: "#667085", lineHeight: 21, marginBottom: 16 },
  modalInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 16,
    fontSize: 20,
    color: "#253B63",
    marginBottom: 14,
  },
  modalPrimaryBtn: {
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2A78C5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalPrimaryText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  modalSecondaryBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: { fontSize: 15, fontWeight: "600", color: "#667085" },
});
