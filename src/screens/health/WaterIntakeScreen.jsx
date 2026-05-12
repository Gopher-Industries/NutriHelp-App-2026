import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import WaterTracker from "../../components/WaterTracker";
import { useUser } from "../../context/UserContext";

export default function WaterIntakeScreen({ navigation }) {
  const { user } = useUser();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#667085" />
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
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: { flexDirection: "row", alignItems: "center" },
  backText: { marginLeft: 6, fontSize: 16, color: "#667085" },
  logoText: { fontSize: 14, fontWeight: "700", color: "#18233D" },
  headerSpacer: { width: 60 },
});
