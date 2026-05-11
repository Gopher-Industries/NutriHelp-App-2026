import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { CartesianChart, Bar } from 'victory-native';

export default function WeeklyProgressChart({ data }) {
  const isDark = useColorScheme() === 'dark';
  
  const chartData = data.map((d, i) => ({ 
    x: i.toString(),
    y: Number(d.calories) || 0, 
    label: d.day,
  }));

  const hasData = chartData.some(d => d.y > 0);
  const maxCal = Math.max(...chartData.map(d => d.y), 0);
  const avgCal = hasData ? Math.round(chartData.reduce((s, d) => s + d.y, 0) / chartData.length) : 0;

  return (
    <View 
      className={`rounded-2xl overflow-hidden ${isDark ? 'border border-slate-700' : 'border border-slate-200'}`}
      style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff' }}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              📊 7-Day Progress
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Daily calorie tracking
            </Text>
          </View>
          {hasData && (
            <View className="items-end">
              <Text className={`text-xl font-black ${isDark ? 'text-green-400' : 'text-green-600'}`}>{avgCal}</Text>
              <Text className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>avg kcal</Text>
            </View>
          )}
        </View>
      </View>
      
      {hasData ? (
        <View className="px-2 pb-2">
          <View style={{ height: 200 }}>
            <CartesianChart 
              data={chartData} 
              xKey="x" 
              yKeys={["y"]} 
              domainPadding={{ left: 28, right: 28, top: 30, bottom: 0 }}
            >
              {({ points, chartBounds }) => (
                <Bar
                  chartBounds={chartBounds}
                  points={points.y}
                  color={isDark ? "#22c55e" : "#16a34a"}
                  roundedCorners={{ topLeft: 6, topRight: 6 }}
                />
              )}
            </CartesianChart>
          </View>
          
          {/* Day labels */}
          <View className="flex-row justify-around px-3 pt-1 pb-3">
            {chartData.map((d) => (
              <View key={d.x} className="items-center">
                <Text className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {d.label.substring(0, 3)}
                </Text>
                <Text className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {d.y > 0 ? d.y : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
          <Text className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tracking data this week</Text>
        </View>
      )}
    </View>
  );
}
