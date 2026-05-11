import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_TIMERS = [1, 5, 10, 15, 20, 25, 30, 35];

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function TimerScreen({ navigation }) {
  const [durationSeconds, setDurationSeconds] = useState(19 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(11 * 60 + 15);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          setIsRunning(false);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const progress = 1 - remainingSeconds / Math.max(durationSeconds, 1);
  const stageCount = Math.min(4, Math.max(1, Math.ceil(progress * 4) || 1));

  const selectQuickTimer = (minutes) => {
    const nextDuration = minutes * 60;
    setDurationSeconds(nextDuration);
    setRemainingSeconds(nextDuration);
    setIsRunning(false);
  };

  const adjustTime = (deltaSeconds) => {
    setRemainingSeconds((previous) => Math.max(0, previous + deltaSeconds));
    setDurationSeconds((previous) => Math.max(60, previous + deltaSeconds));
  };

  const toggleTimer = () => {
    if (remainingSeconds === 0) {
      setRemainingSeconds(durationSeconds);
    }
    setIsRunning((previous) => !previous);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={34} color="#111111" />
          </Pressable>
          <Text style={styles.pageTitle}>Countdown</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.timerHero}>
          <Text style={styles.liveTime}>{formatSeconds(remainingSeconds)}</Text>

          <View style={styles.stageRow}>
            {[0, 1, 2, 3].map((index) => {
              const active = index < stageCount;
              const heating = index === 3;
              return (
                <View
                  key={index}
                  style={[
                    styles.stageBox,
                    active && styles.stageBoxActive,
                    heating && styles.stageBoxHeating,
                  ]}
                >
                  {heating ? (
                    <>
                      <Text style={styles.heatingTag}>Heating</Text>
                      <Ionicons name="flame-outline" size={28} color="#FFE96B" />
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.heroControlsRow}>
            <Pressable style={styles.stopButton} onPress={toggleTimer}>
              <Ionicons
                name={isRunning ? "pause" : "play"}
                size={28}
                color="#000000"
              />
            </Pressable>

            <View style={styles.durationChip}>
              <Text style={styles.durationChipText}>{formatSeconds(durationSeconds)}</Text>
            </View>
          </View>

          <View style={styles.adjustRow}>
            <Pressable style={styles.adjustButton} onPress={() => adjustTime(-60)}>
              <Text style={styles.adjustLabel}>-1 Min</Text>
            </Pressable>
            <Pressable style={styles.adjustButton} onPress={() => adjustTime(60)}>
              <Text style={styles.adjustLabel}>+1 Min</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Quick Timer</Text>
          <View style={styles.quickTimerGrid}>
            {QUICK_TIMERS.map((minutes) => (
              <Pressable
                key={minutes}
                style={styles.quickTimerButton}
                onPress={() => selectQuickTimer(minutes)}
              >
                <Text style={styles.quickTimerText}>{minutes} Min</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.howTitle}>How to Use</Text>
          <Text style={styles.helpText}>
            • Choose a quick timer or adjust time using +/- buttons
          </Text>
          <Text style={styles.helpText}>
            • Press the Stop/Start Button to begin
          </Text>
          <Text style={styles.helpText}>
            • Input field for add time and start
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  backButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FF4D00",
  },
  topSpacer: {
    width: 78,
  },
  timerHero: {
    borderRadius: 40,
    backgroundColor: "#201D17",
    paddingHorizontal: 22,
    paddingVertical: 26,
    marginBottom: 24,
  },
  liveTime: {
    fontSize: 46,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 24,
  },
  stageRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  stageBox: {
    flex: 1,
    height: 62,
    borderRadius: 18,
    backgroundColor: "#4C401F",
    opacity: 0.55,
  },
  stageBoxActive: {
    opacity: 1,
  },
  stageBoxHeating: {
    backgroundColor: "#FFD24A",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heatingTag: {
    position: "absolute",
    top: -32,
    alignSelf: "center",
    backgroundColor: "#FFD24A",
    color: "#111111",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 13,
    fontWeight: "700",
  },
  heroControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  stopButton: {
    width: 120,
    height: 50,
    borderRadius: 18,
    backgroundColor: "#FFD24A",
    alignItems: "center",
    justifyContent: "center",
  },
  durationChip: {
    minWidth: 118,
    borderRadius: 18,
    backgroundColor: "#BFBFBF",
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  durationChipText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
  },
  adjustRow: {
    flexDirection: "row",
    gap: 12,
  },
  adjustButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#6A655A",
    paddingVertical: 10,
    alignItems: "center",
  },
  adjustLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 34,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 18,
  },
  quickTimerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  quickTimerButton: {
    width: "22%",
    minWidth: 72,
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  quickTimerText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  howTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 16,
  },
  helpText: {
    fontSize: 18,
    lineHeight: 26,
    color: "#111111",
    marginBottom: 4,
  },
});
