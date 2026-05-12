import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { PolarChart, Pie } from 'victory-native';

const DEFAULT_COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function NutritionPieChart({ data }) {
  const isDark = useColorScheme() === 'dark';
  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  const mappedData = data.map((item, i) => ({
    value: Number(item.value) || 0,
    color: item.colour || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    label: item.label,
  }));

  const hasData = total > 0;

  return (
    <View 
      className={`rounded-2xl overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-slate-200'}`}
      style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff' }}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-2">
        <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
          🥗 Macro Breakdown
        </Text>
        <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Protein · Carbs · Fat distribution
        </Text>
      </View>
      
      {hasData ? (
        <View className="items-center py-4">
          <View style={{ height: 200, width: 200, position: 'relative' }}>
            <PolarChart data={mappedData} colorKey="color" valueKey="value" labelKey="label">
              <Pie.Chart innerRadius={55} />
            </PolarChart>
            
            {/* Center total */}
            <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', alignItems: 'center' }} pointerEvents="none">
              <Text className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{total}</Text>
              <Text className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>kcal</Text>
            </View>
          </View>

          {/* Legend */}
          <View className="flex-row flex-wrap justify-center px-5 pt-2 pb-1">
            {data.map((item, index) => {
              const pct = total > 0 ? Math.round(((Number(item.value) || 0) / total) * 100) : 0;
              return (
                <View 
                  key={index} 
                  className="flex-row items-center mx-2 my-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
                >
                  <View style={{ backgroundColor: item.colour || DEFAULT_COLORS[index % DEFAULT_COLORS.length], width: 10, height: 10, borderRadius: 5, marginRight: 6 }} />
                  <Text className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {item.label}
                  </Text>
                  <Text className={`text-xs ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {pct}%
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
          <Text className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No nutritional data available</Text>
        </View>
      )}
    </View>
  );
}
