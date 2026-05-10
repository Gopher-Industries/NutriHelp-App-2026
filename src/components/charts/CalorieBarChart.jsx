import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { CartesianChart, Bar, Line } from 'victory-native';

export default function CalorieBarChart({ data, goal }) {
  const isDark = useColorScheme() === 'dark';
  const targetGoal = Number(goal) || 0;
  
  const chartData = data.map((d, i) => ({ 
    x: i.toString(), 
    y: Number(d.intake) || 0, 
    goalData: targetGoal,
    label: d.label, 
  }));

  const hasData = chartData.some(d => d.y > 0) || targetGoal > 0;
  const totalIntake = chartData.reduce((s, d) => s + d.y, 0);
  const overUnder = totalIntake - (targetGoal * chartData.length);

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
              🔥 Calorie Intake vs Goal
            </Text>
            <Text className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {targetGoal > 0 ? `Goal: ${targetGoal} kcal per meal` : 'Track your daily meals'}
            </Text>
          </View>
          {hasData && targetGoal > 0 && (
            <View 
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: overUnder <= 0 ? (isDark ? '#052e16' : '#f0fdf4') : (isDark ? '#451a03' : '#fef3c7') }}
            >
              <Text 
                className="text-xs font-bold"
                style={{ color: overUnder <= 0 ? '#22c55e' : '#f59e0b' }}
              >
                {overUnder <= 0 ? '✓ On Track' : '⚠ Over'}
              </Text>
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
              yKeys={["y", "goalData"]} 
              domainPadding={{ left: 40, right: 40, top: 40, bottom: 0 }}
            >
              {({ points, chartBounds }) => (
                <>
                  <Bar
                    chartBounds={chartBounds}
                    points={points.y}
                    color={isDark ? "#22c55e" : "#16a34a"}
                    roundedCorners={{ topLeft: 6, topRight: 6 }}
                  />
                  {targetGoal > 0 && points.goalData && (
                    <Line
                      points={points.goalData}
                      color={isDark ? "#fbbf24" : "#f59e0b"}
                      strokeWidth={2}
                    />
                  )}
                </>
              )}
            </CartesianChart>
          </View>

          {/* Meal labels */}
          <View className="flex-row justify-around px-3 pt-1 pb-3">
            {chartData.map((d) => (
              <View key={d.x} className="items-center">
                <Text className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {d.label}
                </Text>
                <Text className={`text-[9px] mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  {d.y} kcal
                </Text>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View className="flex-row justify-center px-5 pb-4 pt-1">
            <View className="flex-row items-center mr-5">
              <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: isDark ? '#22c55e' : '#16a34a', marginRight: 6 }} />
              <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Intake</Text>
            </View>
            {targetGoal > 0 && (
              <View className="flex-row items-center">
                <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: isDark ? '#fbbf24' : '#f59e0b', marginRight: 6 }} />
                <Text className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Goal ({targetGoal})</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
          <Text className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Log your intake to see data here</Text>
        </View>
      )}
    </View>
  );
}
