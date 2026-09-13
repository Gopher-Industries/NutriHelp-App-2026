import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { mapRecipeSource, searchRecipeSources } from "../api/recipeSourcesApi";

export default function RecipeSourceSearch({ onPrefill, disabled = false }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mapping, setMapping] = useState(false);
  const [draft, setDraft] = useState(null);
  const generation = useRef(0);
  const mapController = useRef(null);

  useEffect(() => () => { generation.current++; mapController.current?.abort(); }, []);
  useEffect(() => {
    const version = ++generation.current;
    const controller = new AbortController();
    if (disabled) {
      mapController.current?.abort();
      mapController.current = null;
      setMapping(false);
    }
    setResults([]);
    setError("");
    setStatus("");
    if (query.trim().length < 3 || disabled) return;
    const timer = setTimeout(async () => {
      setStatus("Searching…");
      try {
        const rows = await searchRecipeSources(query, { signal: controller.signal });
        if (version !== generation.current) return;
        setResults(rows);
        setStatus(rows.length ? `${rows.length} recipes found.` : "No recipes found. You can create one manually below.");
      } catch (err) {
        if (version !== generation.current) return;
        setStatus("");
        setError("Could not search recipes. Check your connection and sign-in, then try again.");
      }
    }, 400);
    return () => { generation.current++; clearTimeout(timer); controller.abort(); };
  }, [query, disabled]);

  const select = async (row) => {
    if (mapController.current || disabled) return;
    const version = ++generation.current;
    const controller = new AbortController();
    mapController.current = controller;
    setMapping(true);
    setError("");
    setDraft(null);
    setStatus(`Preparing ${row.title}… This may take up to two minutes.`);
    try {
      const mapped = await mapRecipeSource(row.source, row.external_id, { signal: controller.signal });
      if (version !== generation.current) return;
      // Let the user finish typing before explicitly replacing their form.
      setDraft(mapped);
      setResults([]);
      setStatus("Recipe ready. Apply it to replace the recipe name, cuisine, cooking method, cooking time, servings, photo, ingredients and instructions.");
    } catch (err) {
      if (version !== generation.current) return;
      setStatus("");
      setError("Could not prepare this recipe. Your form is unchanged. Try again or continue manually.");
    } finally {
      if (mapController.current === controller) {
        setMapping(false);
        mapController.current = null;
      }
    }
  };

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Start from a real recipe</Text>
    <Text style={styles.text}>Optional · Search TheMealDB with at least 3 characters.</Text>
    <TextInput accessibilityLabel="Start from a real recipe" accessibilityHint="Enter at least three characters, then select a recipe below"
      placeholder="Search recipes" autoCorrect={false} autoCapitalize="none" value={query} editable={!mapping && !disabled}
      onChangeText={(value) => { generation.current++; setDraft(null); setQuery(value); }} style={styles.input} />
    {mapping ? <ActivityIndicator accessibilityLabel="Preparing recipe" /> : null}
    {status ? <Text accessibilityLiveRegion="polite" style={styles.text}>{status}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {!mapping && !draft && results.map((row) => <Pressable key={`${row.source}-${row.external_id}`}
      accessibilityRole="button" accessibilityLabel={`Use ${row.title}, ${row.source}`} disabled={disabled}
      onPress={() => select(row)} style={styles.button}>
      <Text style={styles.title}>{row.title}</Text><Text style={styles.text}>{[row.cuisine, row.category, row.source].filter(Boolean).join(" · ")}</Text>
    </Pressable>)}
    {draft && <Pressable accessibilityRole="button" disabled={disabled} style={styles.button} onPress={() => {
      onPrefill(draft); setDraft(null); setStatus("Recipe applied. Review the missing fields and edit below.");
    }}><Text style={styles.title}>Apply recipe to form</Text></Pressable>}
    {mapping && <Pressable accessibilityRole="button" style={styles.button} onPress={() => {
      generation.current++; mapController.current?.abort(); mapController.current = null; setMapping(false); setStatus("Cancelled. Your form is unchanged.");
    }}><Text style={styles.title}>Cancel preparation</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8EDF5" },
  title: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  text: { fontSize: 14, color: "#475569", marginVertical: 6 },
  error: { fontSize: 14, color: "#b91c1c", marginVertical: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#94a3b8", borderRadius: 12, paddingHorizontal: 12, color: "#0f172a", fontSize: 16 },
  button: { minHeight: 48, justifyContent: "center", padding: 12, marginTop: 8, backgroundColor: "#eff6ff", borderRadius: 12 },
});
