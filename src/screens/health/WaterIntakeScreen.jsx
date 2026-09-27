import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import WaterTracker from "../../components/WaterTracker";
import { useUser } from "../../context/UserContext";

import { colors } from "../../theme";
export default function WaterIntakeScreen({ navigation }) {
  const { user } = useUser();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondaryAlt} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.logoText}>NutriHelp</Text>
        <View style={styles.headerSpacer} />
      </View>
      <WaterTracker userId={user?.id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceGray,
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 16, color: colors.textSecondaryAlt },
  logoText: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  headerSpacer: { width: 60 },
});
