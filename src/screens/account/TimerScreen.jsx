import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useKeepAwake } from 'expo-keep-awake';
import { colors, screenPadding, shadow, spacing } from '../../theme/nutriTheme';

const presets = [
  { label: 'Water', seconds: 60 },
  { label: 'Mindful meal', seconds: 300 },
  { label: 'Stretch', seconds: 600 },
];

export default function TimerScreen() {
  useKeepAwake();
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  const progress = useMemo(() => {
    const preset = presets.find((item) => item.seconds >= remaining) || presets[1];
    return Math.max(0, Math.min(1, remaining / preset.seconds));
  }, [remaining]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return undefined;
    }

    intervalRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          clearInterval(intervalRef.current);
          setRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Vibration.vibrate([0, 400, 200, 400]);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'NutriHelp timer complete',
              body: 'Your wellness timer has finished.',
            },
            trigger: null,
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
  const seconds = (remaining % 60).toString().padStart(2, '0');

  const reset = () => {
    setRunning(false);
    setRemaining(300);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Account</Text>
      <Text style={styles.title}>Timer</Text>

      <View style={styles.timerCard}>
        <View style={styles.ring}>
          <View style={[styles.ringFill, { opacity: 0.25 + progress * 0.75 }]} />
          <Text style={styles.time}>{minutes}:{seconds}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => setRunning((current) => !current)}>
            <Text style={styles.primaryText}>{running ? 'Pause' : 'Start'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.presetGrid}>
        {presets.map((preset) => (
          <Pressable
            key={preset.label}
            style={styles.preset}
            onPress={() => {
              setRunning(false);
              setRemaining(preset.seconds);
            }}
          >
            <Text style={styles.presetTitle}>{preset.label}</Text>
            <Text style={styles.presetTime}>{Math.round(preset.seconds / 60)} min</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, ...screenPadding },
  eyebrow: { color: colors.primary, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', marginBottom: spacing.md },
  timerCard: {
    ...shadow,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
  },
  ring: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 12,
    borderColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  time: { color: colors.ink, fontSize: 44, fontWeight: '900' },
  controls: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  primaryButton: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, minWidth: 112, alignItems: 'center' },
  primaryText: { color: colors.surface, fontWeight: '900' },
  secondaryButton: { backgroundColor: colors.surfaceAlt, borderRadius: 8, padding: spacing.md, minWidth: 112, alignItems: 'center' },
  secondaryText: { color: colors.primaryDark, fontWeight: '900' },
  presetGrid: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  preset: { ...shadow, flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: spacing.md },
  presetTitle: { color: colors.ink, fontWeight: '900' },
  presetTime: { color: colors.muted, marginTop: 4 },
});
