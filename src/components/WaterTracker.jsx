import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
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

function ProgressRing({ progress, current, goal }) {
  const size = 230;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressLength = circumference * progress;
  const segmentLength = circumference / 4;
  const visibleSegment = Math.max(segmentLength - 28, 8);

  return (
    <View style={styles.ringWrap}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#DDDAD7"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {[0, 1, 2, 3].map((index) => {
          const dashOffset = index * segmentLength;
          const activeLength = Math.max(
            Math.min(progressLength - dashOffset, visibleSegment),
            0
          );

          if (activeLength <= 0) {
            return null;
          }

          return (
            <Circle
              key={`segment-${index}`}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#57E1D4"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${activeLength} ${circumference}`}
              strokeDashoffset={circumference * 0.25 - dashOffset}
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>

      <View style={styles.ringCenter}>
        <Text style={styles.ringCurrent}>{current}</Text>
        <Text style={styles.ringDivider}> / </Text>
        <Text style={styles.ringGoal}>{goal}</Text>
      </View>
    </View>
  );
}

function QuickAction({ label, onPress }) {
  return (
    <Pressable style={styles.quickActionButton} onPress={onPress}>
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

      if (cancelled) {
        return;
      }

      setGlasses(remoteGlasses ?? localGlasses ?? 0);
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

    if (userId) {
      logWaterIntake(userId, safeValue).catch(console.error);
    }
  };

  const adjustGlasses = async (delta) => {
    await persistIntake(glasses + delta);
  };

  const handleToggleReminders = async (value) => {
    setRemindersEnabled(value);
    await AsyncStorage.setItem(buildReminderKey(userId), value ? "true" : "false");
  };

  const applyCustomAmount = async () => {
    const parsed = Number.parseInt(customValue, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      Alert.alert("Custom intake", "Please enter a valid number of cups.");
      return;
    }

    await persistIntake(glasses + parsed);
    setCustomVisible(false);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.modeIconButton}>
          <Ionicons name="water-outline" size={26} color="#56E0D3" />
        </View>
        <Text style={styles.logoText}>NutriHelp</Text>
        <View style={styles.modeIconButtonDark}>
          <Ionicons name="moon-outline" size={24} color="#B9B1A8" />
        </View>
      </View>

      <ProgressRing progress={progress} current={glasses} goal={dailyGoal} />

      <Text style={styles.message}>
        Let's start building healthy hydration habits together
      </Text>

      <View style={styles.counterRow}>
        <Pressable style={styles.circleControl} onPress={() => adjustGlasses(-1)}>
          <Ionicons name="remove" size={26} color="#56E0D3" />
        </Pressable>
        <Text style={styles.counterValue}>{glasses}</Text>
        <Pressable style={styles.circleControl} onPress={() => adjustGlasses(1)}>
          <Ionicons name="add" size={26} color="#56E0D3" />
        </Pressable>
      </View>

      <View style={styles.quickActionsRow}>
        <QuickAction label="+1 cup" onPress={() => adjustGlasses(1)} />
        <QuickAction label="+2 cups" onPress={() => adjustGlasses(2)} />
        <QuickAction label="Custom" onPress={() => setCustomVisible(true)} />
      </View>

      <View style={styles.remindersRow}>
        <Text style={styles.remindersText}>Daily reminders</Text>
        <Switch
          value={remindersEnabled}
          onValueChange={handleToggleReminders}
          trackColor={{ false: "#4B5563", true: "#4B5563" }}
          thumbColor="#1F2328"
        />
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={customVisible}
        onRequestClose={() => setCustomVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom water amount</Text>
            <Text style={styles.modalSubtitle}>Enter the number of cups to add</Text>

            <TextInput
              style={styles.modalInput}
              value={customValue}
              onChangeText={setCustomValue}
              keyboardType="number-pad"
              placeholder="1"
              placeholderTextColor="#A8A29E"
            />

            <Pressable style={styles.modalPrimaryButton} onPress={applyCustomAmount}>
              <Text style={styles.modalPrimaryText}>Add cups</Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondaryButton}
              onPress={() => setCustomVisible(false)}
            >
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 26,
    paddingTop: 18,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
  },
  modeIconButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#083F38",
    alignItems: "center",
    justifyContent: "center",
  },
  modeIconButtonDark: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#202227",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  ringCenter: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "baseline",
  },
  ringCurrent: {
    fontSize: 54,
    fontWeight: "800",
    color: "#57E1D4",
  },
  ringDivider: {
    fontSize: 24,
    color: "#9F968D",
  },
  ringGoal: {
    fontSize: 24,
    color: "#9F968D",
  },
  message: {
    textAlign: "center",
    fontSize: 22,
    lineHeight: 34,
    color: "#B8AEA3",
    marginBottom: 34,
    paddingHorizontal: 12,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  circleControl: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: "#11CFC1",
    alignItems: "center",
    justifyContent: "center",
  },
  counterValue: {
    width: 86,
    textAlign: "center",
    fontSize: 38,
    fontWeight: "700",
    color: "#D1CCC5",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 78,
  },
  quickActionButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: "#3B3B3B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickActionText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#C2BCB4",
  },
  remindersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  remindersText: {
    fontSize: 22,
    color: "#D2CCC4",
  },
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#78716C",
    marginBottom: 16,
  },
  modalInput: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6D3D1",
    paddingHorizontal: 16,
    fontSize: 20,
    color: "#111827",
    marginBottom: 14,
  },
  modalPrimaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#11CFC1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  modalPrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#083F38",
  },
  modalSecondaryButton: {
    height: 48,
    borderRadius: 18,
    backgroundColor: "#F5F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#57534E",
  },
});
