import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "nutrihelp_scan_history_v1";

export async function addScanEntry(entry) {
  const raw = await AsyncStorage.getItem(KEY);
  const history = raw ? JSON.parse(raw) : [];
  history.unshift({ ...entry, saved_at: new Date().toISOString() });
  await AsyncStorage.setItem(KEY, JSON.stringify(history.slice(0, 100)));
}

export async function getScanHistory() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
