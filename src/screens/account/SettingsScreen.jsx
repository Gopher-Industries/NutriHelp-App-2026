import React, { useContext, useState } from "react";
import { Image, Modal, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DarkModeContext } from "../../context/DarkModeContext";
import { useUser } from "../../context/UserContext";

const logo = require("../../../assets/nutrihelp-logo.png");

export default function SettingsScreen({ navigation }) {
  const { darkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { logout } = useUser();
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = async () => {
    setLogoutOpen(false);
    await logout();
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <PhoneHeader navigation={navigation} />
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your wellness preferences and account</Text>

        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingSwitch title="Meal Reminders" value={mealReminders} onValueChange={setMealReminders} />
          <SettingSwitch title="Water Reminders" value={waterReminders} onValueChange={setWaterReminders} last />
        </View>

        <Text style={styles.sectionLabel}>DIETARY PREFERENCES</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => navigation.navigate("ShoppingList")}>
            <Text style={styles.rowTitle}>Update Preferences</Text>
            <Ionicons name="chevron-forward" size={18} color="#B3BBCB" />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => navigation.navigate("Timer")}>
            <Text style={styles.rowTitle}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color="#B3BBCB" />
          </Pressable>
          <Pressable style={styles.row} onPress={() => setLogoutOpen(true)}>
            <Text style={styles.logoutText}>Log Out</Text>
            <Ionicons name="log-out-outline" size={18} color="#DF7D7D" />
          </Pressable>
          <Pressable style={[styles.row, styles.lastRow]} onPress={() => navigation.navigate("DeleteAccount")}>
            <Text style={styles.deleteText}>Delete Account</Text>
            <Ionicons name="trash-outline" size={18} color="#C53332" />
          </Pressable>
        </View>
      </View>

      <BottomNav navigation={navigation} active="Settings" />
      <LogoutSheet visible={logoutOpen} onCancel={() => setLogoutOpen(false)} onLogout={confirmLogout} />
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

function SettingSwitch({ title, value, onValueChange, last }) {
  return (
    <View style={[styles.switchRow, last && styles.lastRow]}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#E3E8F4", true: "#4A9B56" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function LogoutSheet({ visible, onCancel, onLogout }) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.fakePage}>
          <Text style={styles.blurTitle}>Profile</Text>
          <View style={styles.blurCard} />
        </View>
        <View style={styles.sheet}>
          <View style={styles.dragHandle} />
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={24} color="#C53332" />
          </View>
          <Text style={styles.sheetTitle}>Are you sure you want to log out?</Text>
          <Text style={styles.sheetText}>
            You will need re-enter your credentials to access your health data.
          </Text>
          <Pressable style={styles.redButton} onPress={onLogout}>
            <Text style={styles.redButtonText}>Log Out</Text>
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function BottomNav({ navigation, active }) {
  const tabs = [
    ["Home", "home-outline", "Profile"],
    ["Plans", "git-branch-outline", "Appointments"],
    ["Profile", "person-outline", "Profile"],
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
  header: { marginBottom: 28 },
  time: { color: "#0D1B34", fontWeight: "800", fontSize: 14 },
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
  smallAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#EAF0FB", alignItems: "center", justifyContent: "center" },
  title: { color: "#23334D", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#8B93A1", fontSize: 14, marginTop: 4, marginBottom: 24 },
  sectionLabel: { color: "#9AA2B2", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, marginLeft: 14, marginBottom: 10, marginTop: 6 },
  card: { backgroundColor: "#F0F3FC", borderRadius: 14, marginBottom: 24, overflow: "hidden" },
  switchRow: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E2E7F6" },
  row: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E2E7F6" },
  lastRow: { borderBottomWidth: 0 },
  rowTitle: { color: "#34425B", fontSize: 16, fontWeight: "800" },
  logoutText: { color: "#C53332", fontSize: 16, fontWeight: "900" },
  deleteText: { color: "#C53332", fontSize: 16, fontWeight: "800" },
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
  activeTab: { backgroundColor: "#2B67A8", paddingHorizontal: 12 },
  tabText: { color: "#8792A6", fontSize: 11, fontWeight: "700", marginTop: 3 },
  activeTabText: { color: "#FFFFFF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(30,39,58,0.42)", justifyContent: "flex-end" },
  fakePage: { ...StyleSheet.absoluteFillObject, padding: 32, opacity: 0.2 },
  blurTitle: { color: "#23334D", fontSize: 26, fontWeight: "900", marginTop: 130 },
  blurCard: { height: 86, borderRadius: 20, backgroundColor: "#FFFFFF", marginTop: 30 },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: "center"
  },
  dragHandle: { width: 42, height: 4, borderRadius: 2, backgroundColor: "#E7EAF2", marginBottom: 28 },
  logoutIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FFF3F2", alignItems: "center", justifyContent: "center", marginBottom: 28 },
  sheetTitle: { color: "#23334D", fontSize: 18, fontWeight: "900", textAlign: "center" },
  sheetText: { color: "#697384", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, marginBottom: 30 },
  redButton: { height: 56, borderRadius: 22, backgroundColor: "#B92E27", alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  redButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  cancelButton: { height: 52, borderRadius: 4, alignSelf: "stretch", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#4A9DF2", marginTop: 8, backgroundColor: "#E8EDF9" },
  cancelText: { color: "#5B6170", fontSize: 16, fontWeight: "800" }
});
