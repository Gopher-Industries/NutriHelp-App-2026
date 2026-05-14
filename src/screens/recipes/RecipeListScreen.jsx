import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
];

const COMING_SOON_SECTIONS = ["Popular Recipes", "Recently Added", "My Saved Recipes"];

export default function RecipeListScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recipes</Text>
          <Text style={styles.subtitle}>Find and save your favourite meals</Text>
        </View>
        <Pressable
          style={styles.searchBtn}
          onPress={() => navigation.navigate("SearchRecipesScreen")}
        >
          <Ionicons name="search" size={20} color="#2A78C5" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CATEGORIES.map((c, idx) => (
            <View
              key={c.key}
              style={[styles.chip, idx === 0 && styles.chipActive]}
            >
              <Text style={[styles.chipText, idx === 0 && styles.chipTextActive]}>
                {c.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Empty / placeholder state */}
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="book-outline" size={36} color="#2A78C5" />
          </View>
          <Text style={styles.emptyTitle}>Recipe browser coming soon</Text>
          <Text style={styles.emptyDesc}>
            This section is under development. In the meantime, you can explore
            recipes through your meal plan or create your own.
          </Text>
          <Pressable
            style={styles.createBtn}
            onPress={() => navigation.navigate("CreateRecipeScreen")}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.createBtnText}>Create Recipe</Text>
          </Pressable>
        </View>

        {/* Section stubs */}
        {COMING_SOON_SECTIONS.map((section) => (
          <View key={section} style={styles.sectionCard}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{section}</Text>
              <Text style={styles.sectionSeeAll}>See all</Text>
            </View>
            <View style={styles.sectionPlaceholder}>
              <Ionicons name="time-outline" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
              <Text style={styles.sectionPlaceholderText}>Coming soon</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  title: { fontSize: 28, fontWeight: "800", color: "#253B63" },
  subtitle: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 36 },

  chipRow: { paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
  },
  chipActive: {
    borderColor: "#2A78C5",
    backgroundColor: "#EFF6FF",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#94A3B8" },
  chipTextActive: { color: "#2A78C5" },

  emptyCard: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#253B63",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  createBtn: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 23,
    backgroundColor: "#2A78C5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  sectionCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#253B63" },
  sectionSeeAll: { fontSize: 13, fontWeight: "600", color: "#2A78C5" },
  sectionPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  sectionPlaceholderText: { fontSize: 13, color: "#94A3B8", fontWeight: "500" },
});
