import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTodayIntakeLocal } from "../../api/waterIntakeApi";
import { useAccessibility } from "../../context/AccessibilityContext";
import { useHealthConditions } from "../../context/HealthConditionsContext";
import { useNutritionTargets } from "../../context/NutritionTargetsContext";
import { useUser } from "../../context/UserContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

// ── Large tappable tile ───────────────────────────────────────────────────────
function Tile({ emoji, label, sublabel, accent, onPress, fs, sh }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        { borderColor: accent + "44", minHeight: sh(120) },
        pressed && styles.tilePressed,
      ]}
      onPress={onPress}
      android_ripple={{ color: accent + "22" }}
    >
      <Text style={[styles.tileEmoji, { fontSize: fs(38) }]}>{emoji}</Text>
      <Text style={[styles.tileLabel, { fontSize: fs(17) }]}>{label}</Text>
      {sublabel ? (
        <Text style={[styles.tileSublabel, { fontSize: fs(12) }]}>{sublabel}</Text>
      ) : null}
    </Pressable>
  );
}

// ── Condition banner ──────────────────────────────────────────────────────────
function ConditionBanner({ conditions, fs }) {
  if (conditions.length === 0) return null;
  return (
    <View style={styles.conditionBanner}>
      <Ionicons name="medkit-outline" size={fs(15)} color="#B45309" />
      <Text style={[styles.conditionText, { fontSize: fs(13) }]}>
        {" "}Active conditions: {conditions.join(", ")}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ElderlyHomeScreen({ navigation }) {
  const { user } = useUser();
  const { fs, sh } = useAccessibility();
  const { conditions, activeWarnings } = useHealthConditions();
  const { waterTarget } = useNutritionTargets();
  const [waterGlasses, setWaterGlasses] = useState(0);

  const displayName = user?.full_name?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    (user?.email ? user.email.split("@")[0] : "there");

  useFocusEffect(
    useCallback(() => {
      getTodayIntakeLocal(user?.id).then(setWaterGlasses).catch(() => {});
    }, [user?.id])
  );

  const conditionLabels = conditions
    .map((k) => {
      const map = {
        diabetes: "Diabetes", hypertension: "High BP", heartDisease: "Heart Disease",
        kidneyDisease: "Kidney Disease", highCholesterol: "High Cholesterol",
        obesity: "Obesity", arthritis: "Arthritis", osteoporosis: "Osteoporosis",
      };
      return map[k] ?? k;
    });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { fontSize: fs(26) }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.name, { fontSize: fs(28) }]}>{displayName} 👋</Text>
            <Text style={[styles.date, { fontSize: fs(14) }]}>{getTodayLabel()}</Text>
          </View>
          <Pressable
            style={[styles.settingsBtn, { width: sh(48), height: sh(48), borderRadius: sh(24) }]}
            onPress={() => navigation.navigate("GoalDetailsScreen")}
          >
            <Ionicons name="stats-chart" size={fs(22)} color="#0B5FA5" />
          </Pressable>
        </View>

        {/* Active conditions banner */}
        <ConditionBanner conditions={conditionLabels} fs={fs} />

        {/* Water progress strip */}
        <Pressable
          style={[styles.waterStrip, { minHeight: sh(64) }]}
          onPress={() => navigation.navigate("WaterIntakeScreen")}
        >
          <Text style={[styles.waterEmoji, { fontSize: fs(26) }]}>💧</Text>
          <View style={styles.waterTextCol}>
            <Text style={[styles.waterLabel, { fontSize: fs(16) }]}>Today's water</Text>
            <Text style={[styles.waterValue, { fontSize: fs(22) }]}>
              {waterGlasses} <Text style={[styles.waterUnit, { fontSize: fs(14) }]}>of {waterTarget} cups</Text>
            </Text>
          </View>
          <View style={styles.waterBarWrap}>
            <View style={[styles.waterBarFill, { width: `${Math.min(waterGlasses / waterTarget, 1) * 100}%` }]} />
          </View>
          <Ionicons name="chevron-forward" size={fs(20)} color="#94A3B8" />
        </Pressable>

        {/* Active condition warnings */}
        {activeWarnings.length > 0 && (
          <View style={styles.warningsBlock}>
            {activeWarnings.map((w) => (
              <View key={w.key} style={styles.warningRow}>
                <Ionicons name="warning-outline" size={fs(14)} color="#D97706" style={{ marginTop: 2 }} />
                <Text style={[styles.warningText, { fontSize: fs(13) }]}> {w.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Main tile grid */}
        <Text style={[styles.sectionLabel, { fontSize: fs(13) }]}>QUICK ACCESS</Text>

        <View style={styles.grid}>
          <Tile
            emoji="🍽️"
            label="My Meals"
            sublabel="View & plan your meals"
            accent="#22C55E"
            onPress={() => navigation.navigate("WeeklyPlanScreen")}
            fs={fs} sh={sh}
          />
          <Tile
            emoji="📋"
            label="AI Health Plan"
            sublabel="Generate 8-week plan"
            accent="#0B5FA5"
            onPress={() => navigation.getParent()?.navigate("AIPlan")}
            fs={fs} sh={sh}
          />
          <Tile
            emoji="🏥"
            label="Health Tools"
            sublabel="Charts & trackers"
            accent="#F59E0B"
            onPress={() => navigation.navigate("HealthToolsScreen")}
            fs={fs} sh={sh}
          />
          <Tile
            emoji="🎯"
            label="My Goals"
            sublabel="Calories & progress"
            accent="#8B5CF6"
            onPress={() => navigation.navigate("GoalDetailsScreen")}
            fs={fs} sh={sh}
          />
        </View>

        {/* Settings shortcut */}
        <Pressable
          style={[styles.settingsShortcut, { minHeight: sh(56) }]}
          onPress={() => navigation.getParent()?.navigate("Profile", { screen: "SettingsScreen" })}
        >
          <Ionicons name="settings-outline" size={fs(20)} color="#667085" />
          <Text style={[styles.settingsShortcutText, { fontSize: fs(15) }]}>
            {" "}Settings · Text Size · Health Conditions
          </Text>
          <Ionicons name="chevron-forward" size={fs(18)} color="#94A3B8" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: { fontWeight: "500", color: "#667085" },
  name: { fontWeight: "800", color: "#18233D", lineHeight: 36 },
  date: { color: "#94A3B8", marginTop: 2 },
  settingsBtn: {
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  // Conditions
  conditionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  conditionText: { color: "#92400E", flex: 1, lineHeight: 19 },

  // Water strip
  waterStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 12,
  },
  waterEmoji: {},
  waterTextCol: { flex: 1 },
  waterLabel: { color: "#667085", fontWeight: "500" },
  waterValue: { fontWeight: "800", color: "#1D4ED8" },
  waterUnit: { color: "#94A3B8", fontWeight: "400" },
  waterBarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#DBEAFE",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  waterBarFill: {
    height: 3,
    backgroundColor: "#0B5FA5",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  // Warnings
  warningsBlock: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    gap: 6,
  },
  warningRow: { flexDirection: "row", alignItems: "flex-start" },
  warningText: { color: "#92400E", flex: 1, lineHeight: 19 },

  // Tiles
  sectionLabel: {
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  tile: {
    width: "47%",
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    gap: 6,
  },
  tilePressed: { opacity: 0.8 },
  tileEmoji: {},
  tileLabel: { fontWeight: "800", color: "#18233D" },
  tileSublabel: { color: "#94A3B8", lineHeight: 17 },

  // Settings shortcut
  settingsShortcut: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFAFA",
  },
  settingsShortcutText: { flex: 1, color: "#667085", fontWeight: "500" },
});
