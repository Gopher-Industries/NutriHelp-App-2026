import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";

const C = {
  primary: "#1A6DB5",
  stone100: "#f5f5f4",
  slate900: "#0f172a",
  slate800: "#1e293b",
  red600: "#dc2626",
  red50: "#fef2f2",
  white: "#fff",
};

const verticalScrollProps = {
  keyboardShouldPersistTaps: "handled",
  bounces: false,
  alwaysBounceVertical: false,
  ...(Platform.OS === "ios"
    ? {
        decelerationRate: "normal",
      }
    : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};

const CATEGORY_OPTIONS = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
  "Vegetarian",
];
const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];
const UNIT_OPTIONS = ["g", "ml", "cups", "tbsp", "tsp", "pcs"];

function extractUserId(user) {
  const candidates = [user?.id, user?.userId, user?.user_id, user?.profile?.id];
  for (const value of candidates) {
    if (value == null || value === "") {
      continue;
    }
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
  }
  return null;
}

function useFormValidation({ recipeName, ingredients, steps }) {
  return useMemo(() => {
    const errors = {};

    if (!recipeName.trim()) {
      errors.recipeName = "Recipe name is required.";
    }

    const validIngredients = ingredients.filter(
      (item) => item.name.trim() || item.quantity.trim()
    );
    if (validIngredients.length < 1) {
      errors.ingredients = "At least 1 ingredient is required.";
    }

    const validSteps = steps.filter((item) => item.text.trim());
    if (validSteps.length < 1) {
      errors.steps = "At least 1 step is required.";
    }

    return {
      errors,
      isValid: Object.keys(errors).length === 0,
    };
  }, [recipeName, ingredients, steps]);
}

export default function CreateRecipeScreen({ navigation }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const effectiveUserId = userId ?? 0;
  const [recipeName, setRecipeName] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [timeMinutes, setTimeMinutes] = useState("");
  const [servings, setServings] = useState("");
  const [difficulty, setDifficulty] = useState(DIFFICULTY_OPTIONS[0]);

  const [ingredients, setIngredients] = useState([{ id: 1, name: "", quantity: "", unit: UNIT_OPTIONS[0] }]);
  const [steps, setSteps] = useState([{ id: 1, text: "" }]);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [imageUri, setImageUri] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const { errors, isValid } = useFormValidation({
    recipeName,
    ingredients,
    steps,
  });

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      { id: Date.now(), name: "", quantity: "", unit: UNIT_OPTIONS[0] },
    ]);
  };

  const removeIngredientRow = (id) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const updateIngredientRow = (id, field, value) => {
    setIngredients((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addStepRow = () => {
    setSteps((prev) => [...prev, { id: Date.now(), text: "" }]);
  };

  const removeStepRow = (id) => {
    setSteps((prev) => prev.filter((item) => item.id !== id));
  };

  const updateStepRow = (id, value) => {
    setSteps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text: value } : item))
    );
  };

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri ?? "");
      setImageBase64(asset.base64 ?? "");
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri ?? "");
      setImageBase64(asset.base64 ?? "");
    }
  };

  const openImagePickerMenu = () => {
    Alert.alert("Recipe Photo", "Choose image source", [
      { text: "Camera Roll", onPress: pickImageFromLibrary },
      { text: "New Photo", onPress: takePhoto },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    if (!isValid) {
      return;
    }

    const validIngredients = ingredients
      .filter((item) => item.name.trim() || item.quantity.trim())
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity.trim(),
        unit: item.unit,
      }));

    const validSteps = steps
      .filter((item) => item.text.trim())
      .map((item, index) => ({
        number: index + 1,
        description: item.text.trim(),
      }));

    const payload = {
      user_id: effectiveUserId,
      recipe_name: recipeName.trim(),
      category,
      time_minutes: timeMinutes.trim(),
      servings: servings.trim(),
      difficulty,
      ingredients: validIngredients,
      instructions: validSteps,
      nutrition: {
        calories: calories.trim(),
        protein: protein.trim(),
        carbs: carbs.trim(),
        fat: fat.trim(),
      },
      recipe_image: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : "",
    };

    try {
      setIsSubmitting(true);
      await recipeApi.createRecipe(payload);
      navigation?.navigate?.("RecipeListScreen", {
        createdAt: Date.now(),
      });
      Alert.alert("Saved", "Recipe created successfully.");
    } catch (error) {
      Alert.alert("Save failed", "Could not save recipe right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView
        style={[styles.flex1, Platform.OS === "web" ? { overscrollBehavior: "none" } : null]}
        contentContainerStyle={styles.scrollContent}
        {...verticalScrollProps}
      >
        <Text style={styles.pageTitle}>Create Recipe</Text>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Recipe Name</Text>
          <TextInput
            value={recipeName}
            onChangeText={setRecipeName}
            placeholder="Enter recipe name"
            style={styles.input}
          />
          {showErrors && errors.recipeName ? <Text style={styles.errorText}>{errors.recipeName}</Text> : null}

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Category</Text>
          <View style={styles.pickerShell}>
            <Picker
              selectedValue={category}
              onValueChange={(value) => setCategory(value)}
              style={{ minHeight: 44 }}
            >
              {CATEGORY_OPTIONS.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Cooking Time (mins)</Text>
          <TextInput
            value={timeMinutes}
            onChangeText={setTimeMinutes}
            placeholder="e.g. 30"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Servings</Text>
          <TextInput
            value={servings}
            onChangeText={setServings}
            placeholder="e.g. 2"
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Difficulty</Text>
          <View style={styles.pickerShell}>
            <Picker
              selectedValue={difficulty}
              onValueChange={(value) => setDifficulty(value)}
              style={{ minHeight: 44 }}
            >
              {DIFFICULTY_OPTIONS.map((item) => (
                <Picker.Item key={item} label={item} value={item} />
              ))}
            </Picker>
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Recipe Photo</Text>
          <Pressable onPress={openImagePickerMenu} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Choose / Take Photo</Text>
          </Pressable>
          {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : null}
        </View>

        <View style={[styles.card, styles.cardSpaced]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <Pressable onPress={addIngredientRow} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </View>

          {ingredients.map((item, index) => (
            <View key={item.id} style={styles.subCard}>
              <TextInput
                value={item.name}
                onChangeText={(value) => updateIngredientRow(item.id, "name", value)}
                placeholder={`Ingredient ${index + 1} name`}
                style={[styles.input, styles.inputMarginBottom]}
              />
              <TextInput
                value={item.quantity}
                onChangeText={(value) => updateIngredientRow(item.id, "quantity", value)}
                placeholder="Quantity (e.g. 1)"
                style={styles.input}
              />
              <View style={[styles.pickerShell, styles.pickerSpaced]}>
                <Picker
                  selectedValue={item.unit}
                  onValueChange={(value) => updateIngredientRow(item.id, "unit", value)}
                  style={{ minHeight: 44 }}
                >
                  {UNIT_OPTIONS.map((u) => (
                    <Picker.Item key={u} label={u} value={u} />
                  ))}
                </Picker>
              </View>
              {ingredients.length > 1 ? (
                <Pressable onPress={() => removeIngredientRow(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {showErrors && errors.ingredients ? <Text style={styles.errorText}>{errors.ingredients}</Text> : null}
        </View>

        <View style={[styles.card, styles.cardSpaced]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <Pressable onPress={addStepRow} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </Pressable>
          </View>

          {steps.map((item, index) => (
            <View key={item.id} style={styles.subCard}>
              <Text style={styles.stepLabel}>Step {index + 1}</Text>
              <TextInput
                value={item.text}
                onChangeText={(value) => updateStepRow(item.id, value)}
                placeholder="Describe this step"
                multiline
                textAlignVertical="top"
                style={styles.stepInput}
              />
              {steps.length > 1 ? (
                <Pressable onPress={() => removeStepRow(item.id)} style={styles.removeBtn}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {showErrors && errors.steps ? <Text style={styles.errorText}>{errors.steps}</Text> : null}
        </View>

        <View style={[styles.card, styles.cardSpaced]}>
          <Text style={[styles.sectionTitle, styles.nutritionTitle]}>Nutritional Information</Text>
          <TextInput
            value={calories}
            onChangeText={setCalories}
            placeholder="Calories (kcal)"
            keyboardType="numeric"
            style={[styles.input, styles.inputMarginBottom]}
          />
          <TextInput
            value={protein}
            onChangeText={setProtein}
            placeholder="Protein (g)"
            keyboardType="numeric"
            style={[styles.input, styles.inputMarginBottom]}
          />
          <TextInput
            value={carbs}
            onChangeText={setCarbs}
            placeholder="Carbs (g)"
            keyboardType="numeric"
            style={[styles.input, styles.inputMarginBottom]}
          />
          <TextInput
            value={fat}
            onChangeText={setFat}
            placeholder="Fat (g)"
            keyboardType="numeric"
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Save Recipe</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: C.stone100 },
  flex1: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  pageTitle: { marginBottom: 16, fontSize: 24, fontWeight: "600", color: C.slate900 },
  card: { borderRadius: 16, backgroundColor: C.white, padding: 16 },
  cardSpaced: { marginTop: 16 },
  fieldLabel: { marginBottom: 8, fontSize: 16, fontWeight: "600", color: C.slate800 },
  fieldLabelSpaced: { marginTop: 16 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    fontSize: 16,
    color: C.slate900,
  },
  inputMarginBottom: { marginBottom: 8 },
  errorText: { marginTop: 4, fontSize: 14, color: C.red600 },
  pickerShell: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: C.white,
  },
  pickerSpaced: { marginTop: 8 },
  primaryBtn: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.primary,
    paddingHorizontal: 16,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "600", color: C.white },
  previewImage: { marginTop: 12, height: 192, width: "100%", borderRadius: 12 },
  sectionHeader: { marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: C.slate900 },
  nutritionTitle: { marginBottom: 12 },
  addBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.stone100,
    paddingHorizontal: 12,
  },
  addBtnText: { fontSize: 16, fontWeight: "600", color: C.primary },
  subCard: { marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 },
  stepLabel: { marginBottom: 4, fontSize: 14, fontWeight: "600", color: C.primary },
  stepInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: C.slate900,
  },
  removeBtn: {
    marginTop: 8,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.red50,
  },
  removeBtnText: { fontSize: 16, fontWeight: "600", color: C.red600 },
  submitBtn: {
    marginTop: 20,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: C.primary,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "600", color: C.white },
});
