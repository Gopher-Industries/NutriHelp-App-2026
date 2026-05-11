import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import WeeklyProgressChart from '../../components/charts/WeeklyProgressChart';

const MOCK_WEEKLY_DATA = [
  { day: "Mon", calories: 1800 },
  { day: "Tue", calories: 2100 },
  { day: "Wed", calories: 1950 },
  { day: "Thu", calories: 2300 },
  { day: "Fri", calories: 2000 },
  { day: "Sat", calories: 2500 },
  { day: "Sun", calories: 2200 }
];

export default function WeeklyPlanScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-4 pt-12">
        <Text className="text-3xl font-black text-slate-900 mb-6">Weekly Plan</Text>
        
        {/* MOB-FE05: WeeklyProgressChart on WeeklyPlanScreen */}
        <View className="mb-6">
          <WeeklyProgressChart data={MOCK_WEEKLY_DATA} />
        </View>
      </View>
    </ScrollView>
  );
}
