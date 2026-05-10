import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import WaterTracker from '../../components/WaterTracker';

export default function HomeScreen({ userId = null }) {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-4 pt-12">
        <Text className="text-3xl font-black text-slate-900 mb-6">Home</Text>
        
        {/* MOB-FE05: WaterTracker on HomeScreen */}
        <View className="mb-6">
          <WaterTracker userId={userId} dailyGoal={8} />
        </View>
        
        <View className="bg-white p-6 rounded-2xl border border-slate-200">
          <Text className="text-xl font-bold text-slate-800">Welcome to NutriHelp!</Text>
          <Text className="text-slate-500 mt-2">
            Your journey to better health starts here. Log your water intake above and explore your daily plan in the tabs.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
