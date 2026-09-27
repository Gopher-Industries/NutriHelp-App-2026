import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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

import mealPlanApi from "../../api/mealPlanApi";
import profileApi from "../../api/profileApi";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useUser } from "../../context/UserContext";

import { colors } from "../../theme";
function computeStreak(items = []) {
  if (!items.length) return 0;
  const daysWithMeals = new Set(
    items
      .map((item) => (item?.date || item?.created_at || item?.createdAt || "").slice(0, 10))
      .filter(Boolean)
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (daysWithMeals.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function buildInitials(profile) {
  const fullName = profile?.fullName || profile?.name || "";
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "NH";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function computeAge(value) {
  if (!value) {
    return "N/A";
  }

  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) {
    return "N/A";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age > 0 ? String(age) : "N/A";
}

function getPrimaryDiet(profile) {
  const preferenceSummary = profile?.preferenceSummary || {};
  const dietaryRequirements = preferenceSummary.dietaryRequirements || [];
  if (dietaryRequirements.length > 0) {
    return dietaryRequirements[0];
  }
  return "Balanced";
}

function getGoalLabel(profile) {
  const preferenceSummary = profile?.preferenceSummary || {};
  const healthConditions = preferenceSummary.healthConditions || [];
  if (healthConditions.length > 0) {
    return healthConditions[0];
  }
  return "Wellness";
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [nextProfile, mealResponse] = await Promise.all([
        profileApi.getProfile(),
        mealPlanApi.getWeeklyPlan({ userId: user?.id }).catch(() => null),
      ]);
      setProfile(nextProfile);
      const items =
        mealResponse?.data?.items ||
        mealResponse?.items ||
        mealResponse?.mealPlans ||
        [];
      setStreak(computeStreak(Array.isArray(items) ? items : []));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={["top"]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const fullName = profile?.fullName || user?.name || "NutriHelp User";
  const email = profile?.email || user?.email || "No email available";
  const age = computeAge(profile?.date_of_birth || profile?.dateOfBirth);
  const diet = getPrimaryDiet(profile);
  const goal = getGoalLabel(profile);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.iconButton}
            onPress={() => navigation.navigate("SettingsScreen")}
          >
            <Ionicons name="menu" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <Pressable
            style={styles.headerAvatar}
            onPress={() => navigation.navigate("SettingsScreen")}
          >
            <Text style={styles.headerAvatarText}>{buildInitials(profile)}</Text>
          </Pressable>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{buildInitials(profile)}</Text>
            </View>
          </View>

          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard icon="cake-variant-outline" value={age} label="AGE" />
          <StatCard icon="leaf" value={diet} label="DIET" />
          <StatCard icon="target" value={goal} label="GOAL" />
        </View>

        <Button
          label="Edit Profile"
          onPress={() =>
            navigation.navigate("EditProfileScreen", {
              initialProfile: profile,
            })
          }
          style={styles.primaryButton}
          textStyle={styles.primaryButtonText}
        />

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("SettingsScreen")}
        >
          <Ionicons name="settings-outline" size={16} color={colors.textMutedNavy} />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("ShoppingListScreen")}
      >
          <Ionicons name="cart-outline" size={16} color="#3C4A63" />
          <Text style={styles.secondaryButtonText}>Shopping List</Text>
        </Pressable>

        <Card style={styles.streakCard}>
          <View style={styles.streakBadge}>
            <Ionicons name="checkmark-circle" size={18} color={colors.white} />
          </View>
          <View style={styles.streakTextWrap}>
            <Text style={styles.streakTitle}>
              Streak: {streak} {streak === 1 ? "Day" : "Days"}
            </Text>
            <Text style={styles.streakSubtitle}>
              {streak >= 7
                ? "Amazing consistency — keep it up!"
                : streak >= 3
                  ? "You're building a great habit!"
                  : streak === 0
                    ? "Start planning today to build your streak."
                    : "Great start — keep going!"}
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 34,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.white,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: 18,
  },

  avatarOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceBlueTintAlt,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  avatarInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.c_173e6a,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.white,
  },

  fullName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
  },

  emailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  statsGrid: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: colors.textSlate,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },

  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  primaryButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },

  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.c_e7eefb,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 16,
  },

  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: colors.textMutedNavy,
  },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.c_eef5ef,
    borderRadius: 16,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 0,
  },

  streakBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.successDeep,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  streakTextWrap: {
    flex: 1,
  },

  streakTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.c_173e2a,
    marginBottom: 2,
  },

  streakSubtitle: {
    fontSize: 11,
    color: colors.c_5e7867,
  },
});
