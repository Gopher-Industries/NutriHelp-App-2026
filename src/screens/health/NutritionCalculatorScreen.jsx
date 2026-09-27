import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import NutritionPieChart from '../../components/charts/NutritionPieChart';

import { colors } from "../../theme";
const MOCK_PIE_DATA = [
  { label: "Protein", value: 120, colour: colors.successStrong },
  { label: "Carbs", value: 240, colour: colors.warning },
  { label: "Fat", value: 80, colour: colors.info }
];

export default function NutritionCalculatorScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="p-4 pt-12">
        <Text className="text-3xl font-black text-slate-900 mb-6">Nutrition Calculator</Text>
        
        {/* MOB-FE05: NutritionPieChart on NutritionCalculatorScreen */}
        <View className="mb-6">
          <NutritionPieChart data={MOCK_PIE_DATA} />
        </View>
      </View>
    </ScrollView>
  );
}
