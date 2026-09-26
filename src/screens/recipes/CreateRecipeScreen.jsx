import React, { useEffect, useMemo, useRef, useState } from "react";
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
import RecipeSourceSearch from "../../components/RecipeSourceSearch";
import buildSourcePrefill from "./buildSourcePrefill";
import saveRecipeDraft from "./saveRecipeDraft";
import { resolveRecipeIngredients } from "../../api/recipeSourcesApi";
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
      id: pickId(item?.id),
      name: pickText(item?.name, item?.label, item?.value),
    }))
    .filter((item) => item.name);
}

function normalizeCookingMethodRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((item, index) => ({
      id: pickId(item?.id),
      name: pickText(item?.name, item?.label, item?.value),
    }))
    .filter((item) => item.name);
}

function normalizeIngredientRows(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: null,
          name: item.trim(),
          category: "",
        };
      }
      return {
        id: pickId(item?.id),
        name: pickText(item?.name, item?.label, item?.value),
        category: pickText(item?.category, item?.ingredient_category),
      };
    })
    .filter((item) => item.name);
}

export default function CreateRecipeScreen({ navigation }) {
  const { user } = useUser();
  const userId = useMemo(() => extractUserId(user), [user]);
  const saveInProgress = useRef(false);

  const sourceApplied = useRef(false);
  const [sourceReview, setSourceReview] = useState(null);
  const [recipeName, setRecipeName] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [servings, setServings] = useState("");

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

  const [cuisineOptions, setCuisineOptions] = useState([]);
  const [ingredientCatalog, setIngredientCatalog] = useState([]);
  const [cookingMethodOptions, setCookingMethodOptions] = useState([]);
  const [isLookupLoading, setIsLookupLoading] = useState(true);
  const [lookupWarning, setLookupWarning] = useState("");

  const [imageUri, setImageUri] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [sourceImageData, setSourceImageData] = useState("");
  const [isSourcePhoto, setIsSourcePhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const applySource = (mapped) => {
    const prefill = buildSourcePrefill(mapped);
    sourceApplied.current = true;
    setRecipeName(prefill.fields.recipeName);
    setCuisine(prefill.fields.cuisine);
    setCookingMethod(prefill.fields.cookingMethod);
    setTimeMinutes(prefill.fields.timeMinutes);
    setServings(prefill.fields.servings);
    setIngredients(prefill.ingredients.length ? prefill.ingredients : [{ id: 1, category: "", ingredientId: null, name: "", quantity: "", unit: "", cost: "" }]);
    setSteps(prefill.steps.length ? prefill.steps : [{ id: 1, text: "" }]);
    setImageUri(prefill.imageUri);
    setImageBase64("");
    setSourceImageData(prefill.sourceImageData);
    setIsSourcePhoto(Boolean(prefill.imageUri));
    setSourceReview(prefill.missing);
    setShowErrors(false);
  };

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
        if (rows.length > 0 && !sourceApplied.current) {
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
        if (rows.length > 0 && !sourceApplied.current) {
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
      setSourceImageData("");
      setIsSourcePhoto(false);
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
      setSourceImageData("");
      setIsSourcePhoto(false);
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
    if (saveInProgress.current) return;
    setShowErrors(true);
    if (!isValid) {
      Alert.alert("Review recipe", "Complete the recipe name, cuisine, cooking method, ingredients and instructions.");
      return;
    }
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in before saving your recipe.");
      return;
    }
    saveInProgress.current = true;
    setIsSubmitting(true);
    try {
      await saveRecipeDraft({
        recipeName, cuisine, cookingMethod, cuisineOptions, cookingMethodOptions,
        timeMinutes, servings, ingredients, steps,
        imageData: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : sourceImageData,
      }, { resolveIngredients: resolveRecipeIngredients, createRecipe: recipeApi.createRecipe });
      navigation?.navigate?.("RecipeListScreen", { createdAt: Date.now() });
      Alert.alert("Saved", "Recipe created successfully.");
    } catch (error) {
      Alert.alert("Save failed", error?.message || "Could not save recipe. Your draft is still here; please try again.");
    } finally {
      saveInProgress.current = false;
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
          <RecipeSourceSearch onPrefill={applySource} disabled={isSubmitting} />
          {sourceReview && <View style={[styles.card, { marginBottom: 16 }]}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Review source recipe</Text>
            <Text accessibilityLiveRegion="polite" style={styles.lookupWarning}>Missing or needs review: {sourceReview.join(", ")}.</Text>
            <Text style={styles.lookupWarning}>When you save, ingredients are matched to existing NutriHelp items and missing ones are added. Review the quantities and original measures before saving.</Text>
          </View>}
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

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Cuisine</Text>
            {cuisineOptions.length > 0 ? (
              <View style={styles.pickerShell}>
                <Picker selectedValue={cuisine} onValueChange={(value) => setCuisine(value)} style={{ minHeight: 44 }}>
                  {[
                    ...(!cuisineOptions.some((item) => item.name === cuisine)
                      ? [{ key: "cuisine-current", label: cuisine || "Select cuisine", value: cuisine }]
                      : []),
                    ...cuisineOptions.map((item) => ({ key: `cuisine-${item.id}`, label: item.name, value: item.name })),
                  ].map((option) => (
                    <Picker.Item key={option.key} label={option.label} value={option.value} />
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
                  {[
                    ...(!cookingMethodOptions.some((item) => item.name === cookingMethod)
                      ? [{ key: "method-current", label: cookingMethod || "Select cooking method", value: cookingMethod }]
                      : []),
                    ...cookingMethodOptions.map((item) => ({ key: `method-${item.id}`, label: item.name, value: item.name })),
                  ].map((option) => (
                    <Picker.Item key={option.key} label={option.label} value={option.value} />
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

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Recipe Photo</Text>
            <Pressable onPress={openImagePickerMenu} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Choose / Take Photo</Text>
            </Pressable>
            {imageUri ? <Image source={{ uri: imageUri }} accessibilityLabel="Recipe photo" style={styles.previewImage} /> : null}
            {isSourcePhoto && (
              <Text style={styles.lookupWarning}>
                {sourceImageData
                  ? "Photo from TheMealDB. Choose or take a photo to replace it."
                  : "Photo from TheMealDB is available for preview only. Choose your own photo to include it when saving."}
              </Text>
            )}
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
                        {[
                          { key: "category-empty", label: "Select category", value: "" },
                          ...(item.category && !ingredientCategories.includes(item.category)
                            ? [{ key: `category-current-${item.id}`, label: item.category, value: item.category }]
                            : []),
                          ...ingredientCategories.map((cat) => ({ key: `cat-${cat}`, label: cat, value: cat })),
                        ].map((option) => (
                          <Picker.Item key={option.key} label={option.label} value={option.value} />
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
                  {names.length > 0 && (!sourceReview || names.includes(item.name)) ? (
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
                      onChangeText={(value) => updateIngredientRow(item.id, "ingredientName", value)}
                      placeholder="Ingredient name"
                      style={styles.input}
                    />
                  )}

                  {(item.sourceMeasure || item.notes) ? (
                    <Text style={styles.lookupWarning}>
                      {item.sourceMeasure ? `Original measure: ${item.sourceMeasure}` : `Source note: ${item.notes}`}
                      {!item.quantity || !item.unit ? " — review quantity and unit." : ""}
                    </Text>
                  ) : null}

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
                      {[
                        ...(!UNIT_OPTIONS.includes(item.unit)
                          ? [{ key: `unit-current-${item.id}`, label: item.unit || "Review unit", value: item.unit }]
                          : []),
                        ...UNIT_OPTIONS.map((unit) => ({ key: unit, label: unit, value: unit })),
                      ].map((option) => (
                        <Picker.Item key={option.key} label={option.label} value={option.value} />
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
