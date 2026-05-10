import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import recipeApi from "../../api/recipeApi";
import { useUser } from "../../context/UserContext";

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

function buildCreatedRecipeSnapshot(payload, apiResponse, previewImageUri) {
  const raw = apiResponse?.recipe ?? apiResponse?.data?.recipe ?? apiResponse?.data;
  const localClientId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const hasServerId =
    raw &&
    (raw.id != null ||
      raw.recipe_id != null ||
      raw.recipeId != null ||
      raw.recipeID != null);
  if (hasServerId) {
    return {
      ...raw,
      local_client_id: raw?.local_client_id ?? localClientId,
    };
  }
  const tempId = localClientId;
  const snapshot = {
    id: tempId,
    recipe_id: tempId,
    local_client_id: localClientId,
    title: payload.recipe_name,
    name: payload.recipe_name,
    category: payload.category,
    time_minutes: Number(payload.time_minutes) || 15,
    servings: Number(payload.servings) || 1,
    difficulty: payload.difficulty || "Easy",
    rating: 0,
    total_ratings: 0,
    ingredients: Array.isArray(payload.ingredients) ? payload.ingredients : [],
    instructions: Array.isArray(payload.instructions)
      ? payload.instructions.map((step, index) => ({
          number: Number(step?.number ?? index + 1),
          title: step?.title ?? `Step ${index + 1}`,
          description: step?.description ?? step?.content ?? "",
        }))
      : [],
    nutrition: payload.nutrition,
  };
  const cal = payload.nutrition?.calories;
  if (cal != null && String(cal).trim() !== "") {
    snapshot.calories = cal;
  }
  if (previewImageUri) {
    snapshot.imageUrl = previewImageUri;
    snapshot.image_url = previewImageUri;
  }
  return snapshot;
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
      const response = await recipeApi.createRecipe(payload);
      const snapshot = buildCreatedRecipeSnapshot(payload, response, imageUri);
      navigation?.navigate?.("RecipeListScreen", {
        createdRecipe: snapshot,
        createdAt: Date.now(),
      });
      Alert.alert("Saved", "Recipe created successfully.");
    } catch (error) {
      const snapshot = buildCreatedRecipeSnapshot(payload, null, imageUri);
      navigation?.navigate?.("RecipeListScreen", {
        createdRecipe: snapshot,
        createdAt: Date.now(),
      });
      Alert.alert("Save failed", "Could not save recipe right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-stone-100" style={{ flex: 1 }}>
      <ScrollView
        style={[
          { flex: 1 },
          Platform.OS === "web" ? { overscrollBehavior: "none" } : null,
        ]}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        {...verticalScrollProps}
      >
        <Text className="mb-4 text-2xl font-semibold text-slate-900">Create Recipe</Text>

        <View className="rounded-2xl bg-white p-4">
          <Text className="mb-2 text-base font-semibold text-slate-800">Recipe Name</Text>
          <TextInput
            value={recipeName}
            onChangeText={setRecipeName}
            placeholder="Enter recipe name"
            className="min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />
          {showErrors && errors.recipeName ? (
            <Text className="mt-1 text-sm text-red-600">{errors.recipeName}</Text>
          ) : null}

          <Text className="mb-2 mt-4 text-base font-semibold text-slate-800">Category</Text>
          <View className="min-h-[44px] justify-center rounded-xl border border-gray-300 bg-white">
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

          <Text className="mb-2 mt-4 text-base font-semibold text-slate-800">Cooking Time (mins)</Text>
          <TextInput
            value={timeMinutes}
            onChangeText={setTimeMinutes}
            placeholder="e.g. 30"
            keyboardType="numeric"
            className="min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />

          <Text className="mb-2 mt-4 text-base font-semibold text-slate-800">Servings</Text>
          <TextInput
            value={servings}
            onChangeText={setServings}
            placeholder="e.g. 2"
            keyboardType="numeric"
            className="min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />

          <Text className="mb-2 mt-4 text-base font-semibold text-slate-800">Difficulty</Text>
          <View className="min-h-[44px] justify-center rounded-xl border border-gray-300 bg-white">
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

          <Text className="mb-2 mt-4 text-base font-semibold text-slate-800">Recipe Photo</Text>
          <Pressable
            onPress={openImagePickerMenu}
            className="min-h-[44px] items-center justify-center rounded-xl bg-[#1A6DB5] px-4"
          >
            <Text className="text-base font-semibold text-white">Choose / Take Photo</Text>
          </Pressable>
          {imageUri ? (
            <Image source={{ uri: imageUri }} className="mt-3 h-48 w-full rounded-xl" />
          ) : null}
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900">Ingredients</Text>
            <Pressable
              onPress={addIngredientRow}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-stone-100 px-3"
            >
              <Text className="text-base font-semibold text-[#1A6DB5]">+ Add</Text>
            </Pressable>
          </View>

          {ingredients.map((item, index) => (
            <View key={item.id} className="mb-3 rounded-xl border border-gray-200 p-3">
              <TextInput
                value={item.name}
                onChangeText={(value) => updateIngredientRow(item.id, "name", value)}
                placeholder={`Ingredient ${index + 1} name`}
                className="mb-2 min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
              />
              <TextInput
                value={item.quantity}
                onChangeText={(value) => updateIngredientRow(item.id, "quantity", value)}
                placeholder="Quantity (e.g. 1)"
                className="min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
              />
              <View className="mt-2 min-h-[44px] justify-center rounded-xl border border-gray-300 bg-white">
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
                <Pressable
                  onPress={() => removeIngredientRow(item.id)}
                  className="mt-2 min-h-[44px] items-center justify-center rounded-xl bg-red-50"
                >
                  <Text className="text-base font-semibold text-red-600">Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {showErrors && errors.ingredients ? (
            <Text className="mt-1 text-sm text-red-600">{errors.ingredients}</Text>
          ) : null}
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-slate-900">Instructions</Text>
            <Pressable
              onPress={addStepRow}
              className="min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-stone-100 px-3"
            >
              <Text className="text-base font-semibold text-[#1A6DB5]">+ Add</Text>
            </Pressable>
          </View>

          {steps.map((item, index) => (
            <View key={item.id} className="mb-3 rounded-xl border border-gray-200 p-3">
              <Text className="mb-1 text-sm font-semibold text-[#1A6DB5]">Step {index + 1}</Text>
              <TextInput
                value={item.text}
                onChangeText={(value) => updateStepRow(item.id, value)}
                placeholder="Describe this step"
                multiline
                textAlignVertical="top"
                className="min-h-[90px] rounded-xl border border-gray-300 px-3 py-2 text-base text-slate-900"
              />
              {steps.length > 1 ? (
                <Pressable
                  onPress={() => removeStepRow(item.id)}
                  className="mt-2 min-h-[44px] items-center justify-center rounded-xl bg-red-50"
                >
                  <Text className="text-base font-semibold text-red-600">Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          {showErrors && errors.steps ? (
            <Text className="mt-1 text-sm text-red-600">{errors.steps}</Text>
          ) : null}
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4">
          <Text className="mb-3 text-lg font-semibold text-slate-900">
            Nutritional Information
          </Text>
          <TextInput
            value={calories}
            onChangeText={setCalories}
            placeholder="Calories (kcal)"
            keyboardType="numeric"
            className="mb-2 min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />
          <TextInput
            value={protein}
            onChangeText={setProtein}
            placeholder="Protein (g)"
            keyboardType="numeric"
            className="mb-2 min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />
          <TextInput
            value={carbs}
            onChangeText={setCarbs}
            placeholder="Carbs (g)"
            keyboardType="numeric"
            className="mb-2 min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />
          <TextInput
            value={fat}
            onChangeText={setFat}
            placeholder="Fat (g)"
            keyboardType="numeric"
            className="min-h-[44px] rounded-xl border border-gray-300 px-3 text-base text-slate-900"
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          className="mt-5 min-h-[48px] items-center justify-center rounded-xl bg-[#1A6DB5]"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-base font-semibold text-white">Save Recipe</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}
