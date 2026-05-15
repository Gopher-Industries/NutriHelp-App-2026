import React, { useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";
import { SafeAreaView } from "react-native-safe-area-context";

const C = {
  primary: "#1A6DB5",
  slate900: "#0f172a",
  slate800: "#1e293b",
  gray500: "#6b7280",
  red600: "#dc2626",
  red50: "#fef2f2",
  white: "#fff",
};

const SURFACE_SHADOW = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 2,
};

const verticalScrollProps = {
  keyboardShouldPersistTaps: "handled",
  bounces: false,
  alwaysBounceVertical: false,
  ...(Platform.OS === "ios" ? { decelerationRate: "normal" } : {}),
  ...(Platform.OS === "android" ? { overScrollMode: "never" } : {}),
};

const CATEGORY_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Vegetarian"];
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

function pickText(...values) {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s) return s;
  }
  return "";
}

function pickId(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function useFormValidation({ recipeName, ingredients, steps, cuisine, cookingMethod }) {
  return useMemo(() => {
    const errors = {};

    if (!recipeName.trim()) {
      errors.recipeName = "Recipe name is required.";
    }

    if (!cuisine.trim()) {
      errors.cuisine = "Cuisine is required.";
    }

    if (!cookingMethod.trim()) {
      errors.cookingMethod = "Cooking method is required.";
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
  }, [recipeName, ingredients, steps, cuisine, cookingMethod]);
}

function normalizeCuisineRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((item, index) => ({
      id: pickId(item?.id) ?? index + 1,
      name: pickText(item?.name, item?.label, item?.value),
    }))
    .filter((item) => item.name);
}

function normalizeCookingMethodRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((item, index) => ({
      id: pickId(item?.id) ?? index + 1,
      name: pickText(item?.name, item?.label, item?.value),
    }))
    .filter((item) => item.name);
}

function normalizeIngredientRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          name: item.trim(),
          category: "",
        };
      }
      return {
        id: pickId(item?.id) ?? index + 1,
        name: pickText(item?.name, item?.label, item?.value),
        category: pickText(item?.category, item?.ingredient_category),
      };
    })
    .filter((item) => item.name);
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

  const [cuisine, setCuisine] = useState("");
  const [cookingMethod, setCookingMethod] = useState("");

  const [ingredients, setIngredients] = useState([
    {
      id: 1,
      category: "",
      ingredientId: null,
      name: "",
      quantity: "",
      unit: UNIT_OPTIONS[0],
      cost: "",
    },
  ]);
  const [steps, setSteps] = useState([{ id: 1, text: "" }]);

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [ingredientCatalog, setIngredientCatalog] = useState([]);
  const [cookingMethodOptions, setCookingMethodOptions] = useState([]);
  const [isLookupLoading, setIsLookupLoading] = useState(true);
  const [lookupWarning, setLookupWarning] = useState("");

  const [imageUri, setImageUri] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const ingredientCategories = useMemo(() => {
    const list = ingredientCatalog
      .map((item) => item.category)
      .filter((item) => item.trim().length > 0);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  }, [ingredientCatalog]);

  const { errors, isValid } = useFormValidation({
    recipeName,
    ingredients,
    steps,
    cuisine,
    cookingMethod,
  });

  useEffect(() => {
    let active = true;

    const loadLookup = async () => {
      setIsLookupLoading(true);
      setLookupWarning("");

      const [cuisineResult, ingredientResult, cookingMethodResult] = await Promise.allSettled([
        recipeApi.getCuisineList(),
        recipeApi.getIngredientsList(),
        recipeApi.getCookingMethodList(),
      ]);

      if (!active) {
        return;
      }

      const warnings = [];

      if (cuisineResult.status === "fulfilled") {
        const rows = normalizeCuisineRows(cuisineResult.value);
        setCuisineOptions(rows);
        if (rows.length > 0) {
          setCuisine((prev) => (prev ? prev : rows[0].name));
        }
      } else {
        warnings.push("cuisine");
      }

      if (ingredientResult.status === "fulfilled") {
        setIngredientCatalog(normalizeIngredientRows(ingredientResult.value));
      } else {
        warnings.push("ingredients");
      }

      if (cookingMethodResult.status === "fulfilled") {
        const rows = normalizeCookingMethodRows(cookingMethodResult.value);
        setCookingMethodOptions(rows);
        if (rows.length > 0) {
          setCookingMethod((prev) => (prev ? prev : rows[0].name));
        }
      } else {
        warnings.push("cooking methods");
      }

      if (warnings.length > 0) {
        setLookupWarning(`Could not load ${warnings.join(", ")} from API. You can still type values manually.`);
      }

      setIsLookupLoading(false);
    };

    loadLookup();

    return () => {
      active = false;
    };
  }, []);

  const addIngredientRow = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: Date.now(),
        category: "",
        ingredientId: null,
        name: "",
        quantity: "",
        unit: UNIT_OPTIONS[0],
        cost: "",
      },
    ]);
  };

  const removeIngredientRow = (id) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const updateIngredientRow = (id, field, value) => {
    setIngredients((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        if (field === "category") {
          return {
            ...item,
            category: value,
            ingredientId: null,
            name: "",
          };
        }

        if (field === "ingredientName") {
          const matched = ingredientCatalog.find(
            (entry) => entry.name === value && (!item.category || entry.category === item.category)
          );
          return {
            ...item,
            name: value,
            ingredientId: matched?.id ?? null,
            category: item.category || matched?.category || "",
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const addStepRow = () => {
    setSteps((prev) => [...prev, { id: Date.now(), text: "" }]);
  };

  const removeStepRow = (id) => {
    setSteps((prev) => prev.filter((item) => item.id !== id));
  };

  const updateStepRow = (id, value) => {
    setSteps((prev) => prev.map((item) => (item.id === id ? { ...item, text: value } : item)));
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

    const selectedCuisine = cuisineOptions.find((item) => item.name === cuisine);
    const selectedCookingMethod = cookingMethodOptions.find((item) => item.name === cookingMethod);

    const validIngredients = ingredients
      .filter((item) => item.name.trim() || item.quantity.trim())
      .map((item) => {
        const parsedCost = Number(item.cost.trim());
        return {
          ingredient_id: item.ingredientId,
          ingredient_category: item.category.trim(),
          name: item.name.trim(),
          quantity: item.quantity.trim(),
          unit: item.unit,
          cost_aud:
            item.cost.trim() && Number.isFinite(parsedCost) ? Number(parsedCost.toFixed(2)) : null,
        };
      });

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
      cuisine,
      cuisine_id: selectedCuisine?.id ?? null,
      cooking_method: cookingMethod,
      cooking_method_id: selectedCookingMethod?.id ?? null,
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
      navigation?.navigate?.("RecipeListScreen", { createdAt: Date.now() });
      Alert.alert("Saved", "Recipe created successfully.");
    } catch (error) {
      Alert.alert("Save failed", "Could not save recipe right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableIngredientNames = (categoryValue) => {
    const filtered = ingredientCatalog.filter((item) => {
      if (!categoryValue) return true;
      return item.category === categoryValue;
    });
    return filtered.map((item) => item.name);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.pageChrome}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation?.goBack?.()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#253B63" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Recipe</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={[styles.flex1, styles.scrollSurface, Platform.OS === "web" ? { overscrollBehavior: "none" } : null]}
          contentContainerStyle={styles.scrollContent}
          {...verticalScrollProps}
        >
          <View style={styles.card}>
            {isLookupLoading ? (
              <View style={styles.lookupLoadingRow}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.lookupLoadingText}>Loading recipe lookups...</Text>
              </View>
            ) : null}
            {lookupWarning ? <Text style={styles.lookupWarning}>{lookupWarning}</Text> : null}

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
              <Picker selectedValue={category} onValueChange={(value) => setCategory(value)} style={{ minHeight: 44 }}>
                {CATEGORY_OPTIONS.map((item) => (
                  <Picker.Item key={item} label={item} value={item} />
                ))}
              </Picker>
            </View>

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Cuisine</Text>
            {cuisineOptions.length > 0 ? (
              <View style={styles.pickerShell}>
                <Picker selectedValue={cuisine} onValueChange={(value) => setCuisine(value)} style={{ minHeight: 44 }}>
                  {cuisineOptions.map((item) => (
                    <Picker.Item key={`cuisine-${item.id}`} label={item.name} value={item.name} />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput value={cuisine} onChangeText={setCuisine} placeholder="Type cuisine" style={styles.input} />
            )}
            {showErrors && errors.cuisine ? <Text style={styles.errorText}>{errors.cuisine}</Text> : null}

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Cooking Method</Text>
            {cookingMethodOptions.length > 0 ? (
              <View style={styles.pickerShell}>
                <Picker
                  selectedValue={cookingMethod}
                  onValueChange={(value) => setCookingMethod(value)}
                  style={{ minHeight: 44 }}
                >
                  {cookingMethodOptions.map((item) => (
                    <Picker.Item key={`method-${item.id}`} label={item.name} value={item.name} />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                value={cookingMethod}
                onChangeText={setCookingMethod}
                placeholder="Type cooking method"
                style={styles.input}
              />
            )}
            {showErrors && errors.cookingMethod ? <Text style={styles.errorText}>{errors.cookingMethod}</Text> : null}

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
              <Picker selectedValue={difficulty} onValueChange={(value) => setDifficulty(value)} style={{ minHeight: 44 }}>
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

            {ingredients.map((item, index) => {
              const names = availableIngredientNames(item.category);

              return (
                <View key={item.id} style={styles.subCard}>
                  <Text style={styles.ingredientRowTitle}>Ingredient {index + 1}</Text>
                  <Text style={styles.inputLabel}>Category</Text>
                  {ingredientCategories.length > 0 ? (
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={item.category}
                        onValueChange={(value) => updateIngredientRow(item.id, "category", value)}
                        style={{ minHeight: 44 }}
                      >
                        <Picker.Item label="Select category" value="" />
                        {ingredientCategories.map((cat) => (
                          <Picker.Item key={`cat-${cat}`} label={cat} value={cat} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <TextInput
                      value={item.category}
                      onChangeText={(value) => updateIngredientRow(item.id, "category", value)}
                      placeholder="Ingredient category"
                      style={styles.input}
                    />
                  )}

                  <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Ingredient</Text>
                  {names.length > 0 ? (
                    <View style={styles.pickerShell}>
                      <Picker
                        selectedValue={item.name}
                        onValueChange={(value) => updateIngredientRow(item.id, "ingredientName", value)}
                        style={{ minHeight: 44 }}
                      >
                        <Picker.Item label="Select ingredient" value="" />
                        {names.map((name) => (
                          <Picker.Item key={`${item.id}-${name}`} label={name} value={name} />
                        ))}
                      </Picker>
                    </View>
                  ) : (
                    <TextInput
                      value={item.name}
                      onChangeText={(value) => updateIngredientRow(item.id, "name", value)}
                      placeholder="Ingredient name"
                      style={styles.input}
                    />
                  )}

                  <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Quantity</Text>
                  <TextInput
                    value={item.quantity}
                    onChangeText={(value) => updateIngredientRow(item.id, "quantity", value)}
                    placeholder="e.g. 150"
                    style={styles.input}
                  />

                  <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Unit</Text>
                  <View style={styles.pickerShell}>
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

                  <Text style={[styles.inputLabel, styles.inputLabelSpaced]}>Cost (AUD, optional)</Text>
                  <TextInput
                    value={item.cost}
                    onChangeText={(value) => updateIngredientRow(item.id, "cost", value)}
                    placeholder="e.g. 2.65"
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />

                  {ingredients.length > 1 ? (
                    <Pressable onPress={() => removeIngredientRow(item.id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
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

          <Pressable onPress={handleSubmit} disabled={isSubmitting} style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}>
            {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Recipe</Text>}
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  pageChrome: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#253B63",
  },
  headerSpacer: { width: 44 },
  flex1: { flex: 1 },
  scrollSurface: { backgroundColor: "#F8FAFC" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  card: {
    ...SURFACE_SHADOW,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
    padding: 16,
  },
  cardSpaced: { marginTop: 16 },
  lookupLoadingRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  lookupLoadingText: { marginLeft: 8, fontSize: 14, color: C.primary },
  lookupWarning: { marginBottom: 10, fontSize: 13, color: C.gray500 },
  fieldLabel: { marginBottom: 8, fontSize: 16, fontWeight: "600", color: C.slate800 },
  fieldLabelSpaced: { marginTop: 16 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 12,
    fontSize: 16,
    color: C.slate900,
    backgroundColor: C.white,
  },
  inputMarginBottom: { marginBottom: 8 },
  inputLabel: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "600",
    color: C.gray500,
  },
  inputLabelSpaced: { marginTop: 10 },
  errorText: { marginTop: 4, fontSize: 14, color: C.red600 },
  pickerShell: {
    minHeight: 44,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    backgroundColor: C.white,
  },
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
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
  },
  addBtnText: { fontSize: 16, fontWeight: "600", color: C.primary },
  subCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  ingredientRowTitle: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
    color: C.slate800,
  },
  stepLabel: { marginBottom: 4, fontSize: 14, fontWeight: "600", color: C.primary },
  stepInput: {
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EDF5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: C.slate900,
    backgroundColor: C.white,
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
