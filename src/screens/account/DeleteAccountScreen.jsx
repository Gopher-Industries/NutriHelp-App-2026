import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const logo = require("../../../assets/nutrihelp-logo.png");

export default function DeleteAccountScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <PhoneChrome />
      <View style={styles.logoWrap}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      </View>

      <View style={styles.alertArt}>
        <View style={styles.blueDot} />
        <View style={styles.redCircle}>
          <Ionicons name="alert" size={34} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.title}>Delete your account?</Text>
      <Text style={styles.body}>
        This will permanently delete all your data, including health metrics,
        recipes, and personalized meal plans. This action cannot be undone.
      </Text>

      <Pressable style={styles.keepButton} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.keepText}>Keep My Account</Text>
      </Pressable>

      <Pressable style={styles.deleteButton}>
        <Text style={styles.deleteText}>Delete My Account</Text>
      </Pressable>

      <View style={styles.securityPill}>
        <Ionicons name="information-circle-outline" size={14} color="#7B8493" />
        <Text style={styles.securityText}>VITALITY SECURITY PROTOCOL</Text>
      </View>

      <View style={styles.homeIndicator} />
    </View>
  );
}

function PhoneChrome() {
  return (
    <View style={styles.status}>
      <Text style={styles.time}>9:41</Text>
      <View style={styles.headerIcons}>
        <Ionicons name="cellular" size={15} color="#000000" />
        <Ionicons name="wifi" size={15} color="#000000" />
        <Ionicons name="battery-full" size={16} color="#000000" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FAFAFF", paddingHorizontal: 34, paddingTop: 16, alignItems: "center" },
  status: { alignSelf: "stretch", height: 30 },
  time: { color: "#0D1B34", fontWeight: "800", fontSize: 14 },
  headerIcons: { position: "absolute", right: 0, top: 1, flexDirection: "row", gap: 4 },
  logoWrap: { marginTop: 28 },
  logo: { width: 86, height: 34 },
  alertArt: { width: 140, height: 120, marginTop: 38, alignItems: "center", justifyContent: "center" },
  redCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#F9D8D3", alignItems: "center", justifyContent: "center" },
  blueDot: { position: "absolute", right: 13, top: 4, width: 38, height: 38, borderRadius: 19, backgroundColor: "#DDE6FB" },
  title: { color: "#17233B", fontSize: 23, fontWeight: "900", marginTop: 18, textAlign: "center" },
  body: { color: "#596273", fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 24, marginBottom: 36 },
  keepButton: { height: 58, borderRadius: 25, backgroundColor: "#286B34", alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  keepText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  deleteButton: { height: 56, borderRadius: 24, borderWidth: 1, borderColor: "#F0C8CC", backgroundColor: "#FBF7FF", alignSelf: "stretch", alignItems: "center", justifyContent: "center", marginTop: 14 },
  deleteText: { color: "#C53332", fontSize: 16, fontWeight: "900" },
  securityPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F3FA", borderRadius: 10, paddingHorizontal: 18, height: 34, marginTop: 34 },
  securityText: { color: "#7B8493", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  homeIndicator: { position: "absolute", bottom: 20, width: 128, height: 4, borderRadius: 2, backgroundColor: "#D3D8E2" }
});
