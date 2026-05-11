import { Ionicons } from "@expo/vector-icons";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DeleteAccountScreen({ navigation }) {
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

        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <View style={styles.heroInner}>
              <Ionicons name="alert" size={26} color="#C81E1E" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Delete your account?</Text>
        <Text style={styles.subtitle}>
          This would permanently remove your local access to profile, wellness,
          and meal data. The mobile app does not currently expose a confirmed
          backend delete-account endpoint, so this screen is intentionally
          blocked from performing the action.
        </Text>

        <Pressable style={styles.keepButton} onPress={() => navigation.goBack()}>
          <Text style={styles.keepButtonText}>Keep My Account</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert(
              "Delete Account",
              "This mobile flow is intentionally blocked because no confirmed backend delete-account endpoint is wired yet."
            )
          }
        >
          <Text style={styles.deleteButtonText}>Delete My Account</Text>
        </Pressable>

        <View style={styles.footerPill}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#9CA3AF" />
          <Text style={styles.footerPillText}>VITALITY SECURITY PROTOCOL</Text>
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

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 22,
    paddingBottom: 34,
    alignItems: "center",
  },

  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
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

  heroWrap: {
    marginTop: 18,
    marginBottom: 18,
  },

  heroCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#FFE6E6",
    alignItems: "center",
    justifyContent: "center",
  },

  heroInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#FFD1D1",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#18233D",
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: "#6B7280",
    marginBottom: 24,
  },

  keepButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#10703E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  keepButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  deleteButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#E9B6B6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#C81E1E",
  },

  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#F5F7FB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  footerPillText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: "800",
    color: "#9CA3AF",
  },
});
