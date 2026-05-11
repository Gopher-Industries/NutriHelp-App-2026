import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const METHODS = {
  image: {
    title: "Scan By Product Image",
    cardTitle: "Enter Product Information",
    fieldLabel: "Product Image",
    ctaTitle: "Click to Upload Image",
    ctaSubtitle: "Take a clear photo of the product",
    helper: "• Product Image: Take a clear photo of the product and fill in the details.",
    routeName: "ProductScanScreen",
    icon: "camera-outline",
  },
  barcode: {
    title: "Scan By Barcode",
    cardTitle: "Scan Barcode Number",
    fieldLabel: "Barcode",
    ctaTitle: "Scan Barcode",
    ctaSubtitle: "Scan the barcode on the product",
    helper: "• Barcode: Type in the numbers shown below the barcode lines.",
    routeName: "BarcodeScannerScreen",
    icon: "barcode-outline",
  },
};

function MethodButton({ methodKey, selected, onPress }) {
  const method = METHODS[methodKey];
  return (
    <Pressable
      onPress={() => onPress(methodKey)}
      style={[styles.methodButton, selected && styles.methodButtonSelected]}
    >
      <Ionicons
        name={method.icon}
        size={28}
        color="#111111"
        style={styles.methodIcon}
      />
      <Text style={styles.methodText}>{method.title}</Text>
    </Pressable>
  );
}

export default function ScanProductScreen({ navigation, route }) {
  const selectedMethod = route?.params?.method === "barcode" ? "barcode" : "image";
  const method = METHODS[selectedMethod];

  const handleSelect = (methodKey) => {
    navigation.setParams({ method: methodKey });
  };

  const handlePrimaryAction = () => {
    navigation.navigate(method.routeName);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={34} color="#111111" />
          </Pressable>
          <Text style={styles.headerTitle}>Scan</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.methodCard}>
          <Text style={styles.cardHeadline}>Choose Scan Method</Text>
          <View style={styles.methodRow}>
            <MethodButton
              methodKey="image"
              selected={selectedMethod === "image"}
              onPress={handleSelect}
            />
            <MethodButton
              methodKey="barcode"
              selected={selectedMethod === "barcode"}
              onPress={handleSelect}
            />
          </View>
          <View style={styles.selectionChip}>
            <Text style={styles.selectionChipText}>Selected</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>{method.cardTitle}</Text>
          <Text style={styles.sectionLabel}>{method.fieldLabel}</Text>

          <Pressable style={styles.uploadBox} onPress={handlePrimaryAction}>
            <MaterialCommunityIcons
              name={selectedMethod === "image" ? "image-plus-outline" : "barcode-scan"}
              size={34}
              color="#1877F2"
            />
            <Text style={styles.uploadTitle}>{method.ctaTitle}</Text>
            <Text style={styles.uploadSubtitle}>{method.ctaSubtitle}</Text>
          </Pressable>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>How to Use</Text>
          <Text style={styles.helpText}>{method.helper}</Text>
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  backButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    borderColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FF4D00",
  },
  headerSpacer: {
    width: 78,
  },
  methodCard: {
    borderRadius: 40,
    backgroundColor: "#000000",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 26,
    marginBottom: 22,
    borderWidth: 4,
    borderColor: "#1990FF",
  },
  cardHeadline: {
    fontSize: 29,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 22,
  },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  methodButton: {
    flex: 1,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: "#ECECEC",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  methodButtonSelected: {
    backgroundColor: "#FFFFFF",
  },
  methodIcon: {
    marginRight: 8,
  },
  methodText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  selectionChip: {
    alignSelf: "center",
    marginTop: 14,
    borderRadius: 999,
    backgroundColor: "#FF5D9E",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectionChipText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  actionCard: {
    borderRadius: 40,
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 22,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 18,
  },
  uploadBox: {
    borderRadius: 24,
    backgroundColor: "#5A93D6",
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  uploadTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  uploadSubtitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  helpCard: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  helpTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 14,
  },
  helpText: {
    fontSize: 17,
    lineHeight: 24,
    color: "#111111",
  },
});
