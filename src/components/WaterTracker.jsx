import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { getTodayIntakeLocal, getTodayIntake, logWaterIntake, saveTodayIntakeLocal } from '../api/waterIntakeApi';

const DAILY_GOAL_CUPS = 8;

const STAGES = {
  SAD: 'sad',
  NEUTRAL: 'neutral',
  EXCITED: 'excited',
  MEDAL: 'medal',
};

const STAGE_CONFIG = {
  sad:     { emoji: '😟', bg: '#fef2f2', darkBg: '#1c1917', accent: '#ef4444' },
  neutral: { emoji: '🙂', bg: '#fffbeb', darkBg: '#1c1917', accent: '#f59e0b' },
  excited: { emoji: '🌟', bg: '#f0fdf4', darkBg: '#052e16', accent: '#22c55e' },
  medal:   { emoji: '🏅', bg: '#fefce8', darkBg: '#1a2e05', accent: '#eab308' },
};

const MESSAGES = {
  sad: "You need water, start sipping!",
  neutral: "Doing okay, keep going!",
  excited: "Almost there, finish strong!",
  medal: "Goal achieved, amazing job!",
};

const getStage = (cups) => {
  if (cups <= 2) return STAGES.SAD;
  if (cups <= 5) return STAGES.NEUTRAL;
  if (cups <= 7) return STAGES.EXCITED;
  return STAGES.MEDAL;
};

export default function WaterTracker({ userId, dailyGoal = DAILY_GOAL_CUPS }) {
  const [glasses, setGlasses] = useState(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fillHeight = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const orbGlow = useSharedValue(0);

  useEffect(() => {
    const fetchIntake = async () => {
      let todayIntake = 0;
      
      if (userId) {
        // Try backend first if authenticated
        todayIntake = await getTodayIntake(userId);
      } else {
        // Fallback to local
        todayIntake = await getTodayIntakeLocal();
      }

      setGlasses(todayIntake);
      const pct = Math.min(todayIntake / dailyGoal, 1) * 100;
      fillHeight.value = withTiming(pct, { duration: 1200, easing: Easing.out(Easing.cubic) });
    };
    fetchIntake();
  }, [userId, dailyGoal]);

  const updateIntake = async (newGlasses) => {
    setGlasses(newGlasses);
    const pct = Math.min(newGlasses / dailyGoal, 1) * 100;
    fillHeight.value = withTiming(pct, { duration: 800, easing: Easing.out(Easing.cubic) });
    
    // Pulse the orb glow on update
    orbGlow.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(0, { duration: 600 })
    );

    await saveTodayIntakeLocal(newGlasses);
    logWaterIntake(userId, newGlasses).catch(console.error);
  };

  const handleAdd = () => {
    if (glasses < dailyGoal) {
      buttonScale.value = withSequence(
        withSpring(0.85, { damping: 4 }),
        withSpring(1, { damping: 6 })
      );
      updateIntake(glasses + 1);
    }
  };

  const stage = getStage(glasses);
  const config = STAGE_CONFIG[stage];
  const hydrationPct = Math.round((glasses / dailyGoal) * 100);
  const currentL = (glasses * 0.25).toFixed(1);
  const goalL = (dailyGoal * 0.25).toFixed(1);

  const fillStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value}%`,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: orbGlow.value * 0.6,
    transform: [{ scale: 1 + orbGlow.value * 0.08 }],
  }));

  const addBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View 
      className={`rounded-2xl overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-slate-200'}`}
      style={{ backgroundColor: isDark ? config.darkBg : config.bg }}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            💧 Daily Water Intake
          </Text>
          <View className="flex-row items-center" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {currentL}L / {goalL}L
            </Text>
          </View>
        </View>
      </View>

      {/* Orb + Fill Area */}
      <View className="items-center py-4">
        <View style={{ width: 140, height: 140, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          {/* Glow ring */}
          <Animated.View 
            style={[
              glowStyle,
              { 
                position: 'absolute', width: 152, height: 152, borderRadius: 76,
                backgroundColor: config.accent,
              }
            ]}
          />
          
          {/* Orb container */}
          <View 
            style={{ 
              width: 140, height: 140, borderRadius: 70, overflow: 'hidden', 
              borderWidth: 3, borderColor: isDark ? '#475569' : '#cbd5e1',
              backgroundColor: isDark ? '#0f172a' : '#e2e8f0',
            }}
          >
            {/* Water fill */}
            <Animated.View 
              style={[
                fillStyle, 
                { 
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  backgroundColor: '#3b82f6',
                  borderTopLeftRadius: 4, borderTopRightRadius: 4,
                }
              ]}
            >
              {/* Wave overlay */}
              <View style={{ 
                position: 'absolute', top: -6, left: -10, right: -10, height: 16, 
                backgroundColor: '#60a5fa', borderRadius: 999, opacity: 0.5 
              }} />
            </Animated.View>

            {/* Center text */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
                {hydrationPct}%
              </Text>
            </View>
          </View>
        </View>

        {/* Stage message */}
        <View className="flex-row items-center mt-4 px-4">
          <Text style={{ fontSize: 22, marginRight: 6 }}>{config.emoji}</Text>
          <Text className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {MESSAGES[stage]}
          </Text>
        </View>
      </View>

      {/* Controls Section */}
      <View 
        className="px-5 pt-4 pb-5"
        style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.7)' }}
      >
        {/* Glass count display */}
        <View className="flex-row items-center justify-center mb-4">
          <Text className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {glasses}
          </Text>
          <Text className={`text-lg font-medium ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            / {dailyGoal} glasses
          </Text>
        </View>

        {/* Glass grid */}
        <View className="flex-row justify-center mb-5">
          {[...Array(dailyGoal)].map((_, i) => (
            <View 
              key={i}
              style={{
                width: 28, height: 38, marginHorizontal: 3,
                borderWidth: 2, borderColor: isDark ? '#475569' : '#94a3b8',
                borderTopLeftRadius: 4, borderTopRightRadius: 4,
                borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
                overflow: 'hidden', backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
              }}
            >
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                height: i < glasses ? '80%' : 0,
                backgroundColor: config.accent,
                opacity: i < glasses ? 1 : 0,
              }} />
            </View>
          ))}
        </View>

        {/* Add Glass Button */}
        <Animated.View style={addBtnStyle}>
          <TouchableOpacity 
            onPress={handleAdd}
            disabled={glasses >= dailyGoal}
            activeOpacity={0.8}
            style={{
              backgroundColor: glasses >= dailyGoal ? (isDark ? '#334155' : '#cbd5e1') : '#16a34a',
              paddingVertical: 14, borderRadius: 14, alignItems: 'center',
              shadowColor: '#000', shadowOpacity: glasses >= dailyGoal ? 0 : 0.15,
              shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3,
            }}
          >
            <Text style={{ color: glasses >= dailyGoal ? (isDark ? '#64748b' : '#94a3b8') : '#ffffff', fontSize: 16, fontWeight: '700' }}>
              {glasses >= dailyGoal ? '✓ Goal Complete!' : '+ Log Glass (250ml)'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
