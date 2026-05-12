import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import profileApi from "../../api/profileApi";
import { useUser } from "../../context/UserContext";

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
      <MaterialCommunityIcons name={icon} size={18} color="#0B5FA5" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const nextProfile = await profileApi.getProfile();
      setProfile(nextProfile);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#0B5FA5" />
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
            <Ionicons name="menu" size={20} color="#0B5FA5" />
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

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            navigation.navigate("EditProfileScreen", {
              initialProfile: profile,
            })
          }
        >
          <Ionicons name="create-outline" size={16} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Edit Profile</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("SettingsScreen")}
        >
          <Ionicons name="settings-outline" size={16} color="#3C4A63" />
          <Text style={styles.secondaryButtonText}>Settings</Text>
        </Pressable>

        <View style={styles.streakCard}>
          <View style={styles.streakBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.streakTextWrap}>
            <Text style={styles.streakTitle}>Streak: 12 Days</Text>
            <Text style={styles.streakSubtitle}>
              Your plant-based journey is thriving.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loadingWrap: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
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
    color: "#18233D",
  },

  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
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
    backgroundColor: "#E8F2FB",
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#0B5FA5",
  },

  avatarInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#173E6A",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
  },

  fullName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 4,
  },

  emailText: {
    fontSize: 13,
    color: "#6B7280",
  },

  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 16,
    shadowColor: "#0F172A",
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
    color: "#18233D",
    textAlign: "center",
  },

  statLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
  },

  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 12,
  },

  primaryButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: "#E7EEFB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 16,
  },

  secondaryButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#3C4A63",
  },

  streakCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF5EF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  streakBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10703E",
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
    color: "#173E2A",
    marginBottom: 2,
  },

  streakSubtitle: {
    fontSize: 11,
    color: "#5E7867",
  },
});
