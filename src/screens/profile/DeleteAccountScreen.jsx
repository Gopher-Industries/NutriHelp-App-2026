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

import Button from "../../components/common/Button";

import { colors } from "../../theme";
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
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.logoText}>NutriHelp</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroCircle}>
            <View style={styles.heroInner}>
              <Ionicons name="alert" size={26} color={colors.dangerAlt2} />
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

        <Button
          label="Keep My Account"
          variant="success"
          onPress={() => navigation.goBack()}
          style={styles.keepButton}
          textStyle={styles.keepButtonText}
        />

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
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.textMuted} />
          <Text style={styles.footerPillText}>VITALITY SECURITY PROTOCOL</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  screen: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.textPrimary,
  },

  heroWrap: {
    marginTop: 18,
    marginBottom: 18,
  },

  heroCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.c_ffe6e6,
    alignItems: "center",
    justifyContent: "center",
  },

  heroInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.c_ffd1d1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 24,
  },

  keepButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.successDeep,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  keepButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },

  deleteButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.c_fff5f5,
    borderWidth: 1,
    borderColor: colors.c_e9b6b6,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  deleteButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.dangerAlt2,
  },

  footerPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: colors.c_f5f7fb,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  footerPillText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
  },
});
