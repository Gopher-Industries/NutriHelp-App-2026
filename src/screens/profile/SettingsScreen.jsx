import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import notificationApi from "../../api/notificationApi";
import useBiometric from "../../hooks/useBiometric";
import profileApi from "../../api/profileApi";
import { useUser } from "../../context/UserContext";

const SETTINGS_FALLBACK_KEY = "nutrihelp.settings.local";

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function SettingRow({
  label,
  description,
  right,
  labelStyle,
  onPress,
  danger = false,
  last = false,
}) {
  return (
    <>
      <Pressable style={styles.row} onPress={onPress}>
        <View style={styles.rowTextWrap}>
          <Text
            style={[
              styles.rowLabel,
              labelStyle,
              danger ? styles.rowLabelDanger : null,
            ]}
          >
            {label}
          </Text>
          {description ? (
            <Text style={styles.rowDescription}>{description}</Text>
          ) : null}
        </View>
        {right}
      </Pressable>
      {!last ? <View style={styles.rowDivider} /> : null}
    </>
  );
}

export default function SettingsScreen({ navigation }) {
  const { logout, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [profile, setProfile] = useState(null);
  const [preferences, setPreferences] = useState({
    mealReminders: true,
    waterReminders: true,
  });

  const { isAvailable, isEnabled, setEnabled } = useBiometric({ onAuthFail: logout });

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [remoteResponse, localFallback] = await Promise.all([
        notificationApi.getPreferences().catch(() => null),
        AsyncStorage.getItem(SETTINGS_FALLBACK_KEY),
      ]);
      const loadedProfile = await profileApi.getProfile().catch(() => null);

      const remotePreferences =
        remoteResponse?.data?.data ||
        remoteResponse?.data?.notification_preferences ||
        remoteResponse?.notification_preferences ||
        null;

      const localPreferences = localFallback ? JSON.parse(localFallback) : {};
      setProfile(loadedProfile);

      setPreferences({
        mealReminders:
          remotePreferences?.mealReminders ?? localPreferences.mealReminders ?? true,
        waterReminders:
          remotePreferences?.waterReminders ?? localPreferences.waterReminders ?? true,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const persistPreferences = async (nextPreferences) => {
    setPreferences(nextPreferences);
    await AsyncStorage.setItem(
      SETTINGS_FALLBACK_KEY,
      JSON.stringify(nextPreferences)
    );

    try {
      await notificationApi.updatePreferences(nextPreferences);
    } catch {
      // Keep local state even if remote persistence is temporarily unavailable.
    }
  };

  const togglePreference = async (key) => {
    const nextPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    await persistPreferences(nextPreferences);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap} edges={["top"]}>
        <ActivityIndicator size="large" color="#0B5FA5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Ionicons name="menu" size={20} color="#0B5FA5" />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <Pressable style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(user?.name || user?.email || "NH").slice(0, 2).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Manage your wellness preferences and account.
        </Text>

        <SectionTitle>NOTIFICATIONS</SectionTitle>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Meal Reminders"
            right={
              <Switch
                value={preferences.mealReminders}
                onValueChange={() => togglePreference("mealReminders")}
                trackColor={{ false: "#D7DDF0", true: "#10703E" }}
                thumbColor="#FFFFFF"
              />
            }
            onPress={() => togglePreference("mealReminders")}
          />
          <SettingRow
            label="Water Reminders"
            right={
              <Switch
                value={preferences.waterReminders}
                onValueChange={() => togglePreference("waterReminders")}
                trackColor={{ false: "#D7DDF0", true: "#10703E" }}
                thumbColor="#FFFFFF"
              />
            }
            onPress={() => togglePreference("waterReminders")}
            last
          />
        </View>

        <SectionTitle>SECURITY</SectionTitle>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Face ID"
            description={
              isAvailable
                ? "Use biometric unlock after inactivity."
                : "Biometric authentication is not available on this device."
            }
            right={
              <Switch
                value={isEnabled}
                onValueChange={setEnabled}
                disabled={!isAvailable}
                trackColor={{ false: "#D7DDF0", true: "#10703E" }}
                thumbColor="#FFFFFF"
              />
            }
            onPress={() => isAvailable && setEnabled(!isEnabled)}
          />
          <SettingRow
            label="Change Password"
            right={<Ionicons name="chevron-forward" size={18} color="#9AA4B2" />}
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                initialProfile: profile,
              })
            }
            last
          />
        </View>

        <SectionTitle>ACCOUNT</SectionTitle>
        <View style={styles.sectionCard}>
          <SettingRow
            label="Edit Profile"
            right={<Ionicons name="chevron-forward" size={18} color="#9AA4B2" />}
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                initialProfile: profile,
              })
            }
          />
          <SettingRow
            label="Delete Account"
            description="Review deletion details before taking action."
            right={<Ionicons name="chevron-forward" size={18} color="#9AA4B2" />}
            onPress={() => navigation.navigate("DeleteAccountScreen")}
          />
          <SettingRow
            label="Log Out"
            danger
            right={<Ionicons name="log-out-outline" size={18} color="#D62828" />}
            onPress={() => setShowLogoutModal(true)}
            last
          />
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={18} color="#D62828" />
            </View>
            <Text style={styles.modalTitle}>Are you sure you want to log out?</Text>
            <Text style={styles.modalSubtitle}>
              You will need to re-enter your credentials to access your health data.
            </Text>

            <Pressable
              style={styles.logoutButton}
              onPress={() => {
                setShowLogoutModal(false);
                logout();
              }}
            >
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
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
    backgroundColor: "#E7EEFB",
    alignItems: "center",
    justifyContent: "center",
  },

  headerAvatarText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#173E6A",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#6B7280",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    marginBottom: 8,
  },

  sectionCard: {
    borderRadius: 16,
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  row: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rowTextWrap: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
  },

  rowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#18233D",
  },

  rowLabelDanger: {
    color: "#D62828",
  },

  rowDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "#6B7280",
  },

  rowDivider: {
    height: 1,
    backgroundColor: "#D9E2F4",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    justifyContent: "flex-end",
  },

  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },

  sheetHandle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 18,
  },

  modalIconWrap: {
    alignSelf: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  modalTitle: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800",
    color: "#18233D",
    marginBottom: 8,
  },

  modalSubtitle: {
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    marginBottom: 22,
  },

  logoutButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#C81E1E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  logoutButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cancelButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#E1E8F7",
    alignItems: "center",
    justifyContent: "center",
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#55627D",
  },
});
