import { Ionicons } from "@expo/vector-icons";
import {
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
          Deleting your account would permanently remove your profile, wellness,
          and meal data.
        </Text>

        {/* FE-22: no backend delete-account endpoint exists yet, so the action
            cannot be performed. Communicate this clearly instead of showing a
            delete button that appears to work but silently does nothing. */}
        <View style={styles.noticeBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#B45309" />
          <Text style={styles.noticeText}>
            Account deletion isn’t available yet. This feature is waiting on the
            backend and will be enabled in a future update. To request deletion
            in the meantime, please contact support.
          </Text>
        </View>

        <Pressable style={styles.keepButton} onPress={() => navigation.goBack()}>
          <Text style={styles.keepButtonText}>Back to Settings</Text>
        </Pressable>

        <Pressable
          style={styles.deleteButtonDisabled}
          disabled
          accessibilityState={{ disabled: true }}
          accessibilityLabel="Delete account, currently unavailable"
        >
          <Text style={styles.deleteButtonDisabledText}>Delete Unavailable</Text>
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

  noticeBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },

  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#92400E",
  },

  deleteButtonDisabled: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    opacity: 0.7,
  },

  deleteButtonDisabledText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#9CA3AF",
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
