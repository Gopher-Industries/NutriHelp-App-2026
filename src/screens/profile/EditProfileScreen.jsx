import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import profileApi from "../../api/profileApi";
import { useUser } from "../../context/UserContext";

function buildInitials(fullName = "") {
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "NH";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "sentences",
  secureTextEntry = false,
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

function toFormValues(profile = {}, fallbackUser = null) {
  const fallbackName = fallbackUser?.name || "";
  const fallbackEmail = fallbackUser?.email || "";

  return {
    fullName: profile?.fullName || profile?.name || fallbackName,
    contactNumber: profile?.contactNumber || "",
    email: profile?.email || fallbackEmail,
    address: profile?.address || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

export default function EditProfileScreen({ navigation, route }) {
  const { logout, user } = useUser();
  const initialProfile = route?.params?.initialProfile || null;
  const [loading, setLoading] = useState(!initialProfile);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => toFormValues(initialProfile, user));

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const profile = await profileApi.getProfile();
        if (!cancelled) {
          setForm((previous) => ({
            ...toFormValues(profile, user),
            currentPassword: previous.currentPassword,
            newPassword: previous.newPassword,
            confirmPassword: previous.confirmPassword,
          }));
        }
      } catch (error) {
        if (!cancelled && !initialProfile) {
          Alert.alert("Edit Profile", error.message || "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [initialProfile, user]);

  const initials = useMemo(() => buildInitials(form.fullName), [form.fullName]);

  const updateField = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert("Edit Profile", "Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      Alert.alert("Edit Profile", "Email is required.");
      return;
    }

    if (form.currentPassword || form.newPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        Alert.alert("Edit Profile", "Current password is required.");
        return;
      }
      if (!form.newPassword) {
        Alert.alert("Edit Profile", "New password is required.");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        Alert.alert("Edit Profile", "Passwords do not match.");
        return;
      }
    }

    try {
      setSaving(true);

      await profileApi.updateProfile({
        fullName: form.fullName,
        email: form.email,
        contactNumber: form.contactNumber,
        address: form.address,
      });

      if (form.currentPassword || form.newPassword || form.confirmPassword) {
        const passwordResponse = await profileApi.updatePassword({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
          confirmPassword: form.confirmPassword,
        });

        const payload = passwordResponse?.data || passwordResponse;
        if (payload?.requireReauthentication) {
          Alert.alert(
            "Password Updated",
            "Your password was changed. Please sign in again.",
            [{ text: "OK", onPress: logout }]
          );
          return;
        }
      }

      Alert.alert("Profile", "Changes saved successfully.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Edit Profile", error.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
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
            <Ionicons name="chevron-back" size={22} color="#18233D" />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Pressable style={styles.avatarAction}>
            <Ionicons name="camera-outline" size={18} color="#0B5FA5" />
          </Pressable>
          <Text style={styles.editPhotoLabel}>Edit photo</Text>
        </View>

        <LabeledInput
          label="FULL NAME"
          placeholder="Enter your name"
          value={form.fullName}
          onChangeText={(value) => updateField("fullName", value)}
        />
        <LabeledInput
          label="EMAIL"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(value) => updateField("email", value)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <LabeledInput
          label="PHONE"
          placeholder="+61 400 000 000"
          value={form.contactNumber}
          onChangeText={(value) => updateField("contactNumber", value)}
          keyboardType="phone-pad"
        />
        <LabeledInput
          label="ADDRESS"
          placeholder="Enter your address"
          value={form.address}
          onChangeText={(value) => updateField("address", value)}
        />
        <LabeledInput
          label="CURRENT PASSWORD"
          placeholder="Enter current password"
          value={form.currentPassword}
          onChangeText={(value) => updateField("currentPassword", value)}
          autoCapitalize="none"
          secureTextEntry
        />
        <LabeledInput
          label="NEW PASSWORD"
          placeholder="Enter new password"
          value={form.newPassword}
          onChangeText={(value) => updateField("newPassword", value)}
          autoCapitalize="none"
          secureTextEntry
        />
        <LabeledInput
          label="CONFIRM PASSWORD"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChangeText={(value) => updateField("confirmPassword", value)}
          autoCapitalize="none"
          secureTextEntry
        />

        <Pressable
          style={[styles.saveButton, saving ? styles.buttonDisabled : null]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving Changes..." : "Save Changes"}
          </Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
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
    marginBottom: 12,
  },

  iconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  iconSpacer: {
    width: 36,
    height: 36,
  },

  logoText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#18233D",
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#DCE7FB",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#173E6A",
  },

  avatarAction: {
    marginTop: -16,
    marginLeft: 72,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  editPhotoLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#0B5FA5",
  },

  inputGroup: {
    marginBottom: 12,
  },

  inputLabel: {
    marginBottom: 6,
    fontSize: 10,
    fontWeight: "800",
    color: "#6B7280",
  },

  input: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#EAF0FF",
    borderWidth: 1,
    borderColor: "#D8E1F5",
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#18233D",
  },

  saveButton: {
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#0B5FA5",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cancelButton: {
    marginTop: 10,
    height: 52,
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

  buttonDisabled: {
    opacity: 0.7,
  },
});
