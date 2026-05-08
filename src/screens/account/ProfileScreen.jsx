import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const logo = require("../../../assets/nutrihelp-logo.png");

const profilePhoto =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300";

export default function ProfileScreen({ navigation }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: "Eleanor",
    lastName: "Shelby",
    email: "eleanor.shelby@mail.com",
    phone: "+1 (555) 012-3456",
    dob: "May 12, 1968",
    diet: "Low Sodium"
  });

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  if (editing) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <ScrollView contentContainerStyle={styles.editContent}>
          <PhoneHeader navigation={navigation} />
          <View style={styles.editAvatarWrap}>
            <View style={styles.placeholderAvatar}>
              <Ionicons name="person" size={42} color="#23334D" />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="pencil" size={11} color="#FFFFFF" />
            </View>
            <Text style={styles.editPhotoText}>Edit photo</Text>
          </View>

          <Field label="FIRST NAME" value={form.firstName} onChangeText={(value) => setField("firstName", value)} />
          <Field label="LAST NAME" value={form.lastName} onChangeText={(value) => setField("lastName", value)} />
          <Field
            label="EMAIL"
            value={form.email}
            onChangeText={(value) => setField("email", value)}
            error="Please enter a valid email address"
          />
          <Field label="PHONE" value={form.phone} onChangeText={(value) => setField("phone", value)} />
          <Field label="DATE OF BIRTH" value={form.dob} onChangeText={(value) => setField("dob", value)} icon="calendar-outline" />
          <Field label="DIETARY PREFERENCE" value={form.diet} onChangeText={(value) => setField("diet", value)} icon="chevron-down" />

          <Pressable style={styles.primaryButton} onPress={() => setEditing(false)}>
            <Text style={styles.primaryText}>Save Changes</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setEditing(false)}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <PhoneHeader navigation={navigation} />

        <View style={styles.profileHero}>
          <View style={styles.photoRing}>
            <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
          </View>
          <Text style={styles.name}>Eleanor Thorne</Text>
          <Text style={styles.email}>el.thorne@healthmail.com</Text>
        </View>

        <View style={styles.statsCard}>
          <Metric icon="calendar" value="64" label="AGE" />
          <Metric icon="leaf" value="Vegan" label="DIET" green />
          <Metric icon="scale-bathroom" value="68kg" label="GOAL" />
        </View>

        <Pressable style={styles.primaryButton} onPress={() => setEditing(true)}>
          <Ionicons name="pencil" size={15} color="#FFFFFF" />
          <Text style={styles.primaryText}>Edit Profile</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={15} color="#536176" />
          <Text style={styles.secondaryText}>Settings</Text>
        </Pressable>

        <View style={styles.streakCard}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-circle" size={26} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.streakTitle}>Streak: 12 Days</Text>
            <Text style={styles.streakText}>Your plant-based journey is thriving.</Text>
          </View>
        </View>
      </ScrollView>
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  );
}

function PhoneHeader({ navigation }) {
  return (
    <View style={styles.header}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.headerIcons}>
        <Ionicons name="cellular" size={15} color="#0D1B34" />
        <Ionicons name="wifi" size={15} color="#0D1B34" />
        <Ionicons name="battery-full" size={16} color="#0D1B34" />
      </View>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate("ShoppingList")}>
          <Ionicons name="menu" size={22} color="#2C67A5" />
        </Pressable>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <Pressable style={styles.smallAvatar} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person" size={14} color="#F4B48C" />
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ icon, value, label, green }) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={21} color={green ? "#2B7D3B" : "#2B5D9B"} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText, error, icon }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputShell, error && styles.inputError]}>
        <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
        {icon && <Ionicons name={icon} size={17} color="#536176" />}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function BottomNav({ navigation, active }) {
  const tabs = [
    ["Home", "home-outline", "Profile"],
    ["Plans", "git-branch-outline", "Appointments"],
    ["Profile", "person", "Profile"],
    ["Settings", "settings-outline", "Settings"]
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map(([label, icon, route]) => {
        const selected = active === label;
        return (
          <Pressable
            key={label}
            style={[styles.tab, selected && styles.activeTab]}
            onPress={() => navigation.navigate(route)}
          >
            <Ionicons name={icon} size={21} color={selected ? "#FFFFFF" : "#8792A6"} />
            <Text style={[styles.tabText, selected && styles.activeTabText]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAFAFF" },
  content: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 108 },
  editContent: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 28 },
  header: { marginBottom: 16, paddingHorizontal: 0 },
  time: { color: "#0D1B34", fontWeight: "800", fontSize: 14, marginLeft: 0 },
  headerIcons: { position: "absolute", right: 0, top: 1, flexDirection: "row", gap: 4 },
  topBar: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E7EBF8",
    marginHorizontal: -28,
    paddingHorizontal: 28,
    marginTop: 12
  },
  logo: { width: 74, height: 28 },
  smallAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EAF0FB",
    alignItems: "center",
    justifyContent: "center"
  },
  profileHero: { alignItems: "center", paddingTop: 8 },
  photoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#1F6A39",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  profilePhoto: { width: 78, height: 78, borderRadius: 39 },
  name: { color: "#23334D", fontSize: 21, fontWeight: "900" },
  email: { color: "#606A7A", fontSize: 14, marginTop: 2 },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginTop: 24,
    marginBottom: 24,
    overflow: "hidden",
    shadowColor: "#CBD3E8",
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  metric: { flex: 1, alignItems: "center", paddingVertical: 18, borderRightWidth: 1, borderRightColor: "#EDF0F8" },
  metricValue: { color: "#23334D", fontSize: 17, fontWeight: "900", marginTop: 4 },
  metricLabel: { color: "#536176", fontSize: 10, fontWeight: "900", marginTop: 2 },
  primaryButton: {
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: "#285F9F",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    marginHorizontal: 0
  },
  primaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 15 },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: "#E0E5F5",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24
  },
  secondaryText: { color: "#606A7A", fontWeight: "900", fontSize: 15 },
  streakCard: {
    backgroundColor: "#E3F0ED",
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  checkCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#2B7D3B", alignItems: "center", justifyContent: "center" },
  streakTitle: { color: "#23334D", fontSize: 15, fontWeight: "900" },
  streakText: { color: "#66717F", fontSize: 12, marginTop: 2 },
  editAvatarWrap: { alignItems: "center", marginTop: -10, marginBottom: 8 },
  placeholderAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#E7EEFF", alignItems: "center", justifyContent: "center" },
  editBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#2B67A8", alignItems: "center", justifyContent: "center", marginTop: -16, marginLeft: 48 },
  editPhotoText: { color: "#285F9F", fontWeight: "900", fontSize: 12, marginTop: 2 },
  fieldBlock: { marginHorizontal: 0, marginBottom: 9 },
  fieldLabel: { color: "#536176", fontSize: 11, fontWeight: "900", marginLeft: 2, marginBottom: 4 },
  inputShell: {
    height: 42,
    borderRadius: 10,
    backgroundColor: "#DFE6FA",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent"
  },
  inputError: { borderColor: "#C53332", backgroundColor: "#E7EEFF" },
  input: { flex: 1, color: "#23334D", fontWeight: "800", fontSize: 14, padding: 0 },
  errorText: { color: "#C53332", fontSize: 11, fontWeight: "700", marginTop: 3, marginLeft: 12 },
  bottomNav: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 16,
    height: 76,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowColor: "#CBD3E8",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  tab: { minWidth: 58, minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  activeTab: { backgroundColor: "#285F9F", paddingHorizontal: 12 },
  tabText: { color: "#8792A6", fontSize: 11, fontWeight: "700", marginTop: 3 },
  activeTabText: { color: "#FFFFFF" }
});
