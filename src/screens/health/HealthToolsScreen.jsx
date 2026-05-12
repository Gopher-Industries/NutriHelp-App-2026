import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import WaterTracker from '../../components/WaterTracker';
import CalorieBarChart from '../../components/charts/CalorieBarChart';
import { useUser } from '../../context/UserContext';

const MOCK_CALORIE_DATA = [
  { label: "Breakfast", intake: 450 },
  { label: "Lunch", intake: 650 },
  { label: "Dinner", intake: 800 },
  { label: "Snack", intake: 200 }
];

export default function HealthToolsScreen() {
  const { user } = useUser();
  const userId = user?.id || null;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-4 pt-12">
        <Text className="text-3xl font-black text-slate-900 mb-6">Health Tools</Text>
        
        {/* MOB-FE05: WaterTracker on HealthToolsScreen */}
        <View className="mb-6">
          <WaterTracker userId={userId} dailyGoal={8} />
        </View>

        {/* MOB-FE05: CalorieBarChart on HealthToolsScreen */}
        <View className="mb-6">
          <CalorieBarChart data={MOCK_CALORIE_DATA} goal={800} />
        </View>
      </View>
    </ScrollView>
  );
}
