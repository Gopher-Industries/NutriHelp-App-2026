import AsyncStorage from "@react-native-async-storage/async-storage";

const WATER_LOCAL_KEY = "nutrihelp.water_intake.today";

function buildWaterStorageKey(userId) {
  const date = new Date().toISOString().split("T")[0];
  const scope = userId ? `user_${userId}` : "guest";
  return `${WATER_LOCAL_KEY}_${scope}_${date}`;
}

export async function getTodayIntakeLocal(userId) {
  try {
    const val = await AsyncStorage.getItem(buildWaterStorageKey(userId));
    return val ? parseInt(val, 10) : 0;
  } catch (error) {
    console.error("Local water storage error:", error);
    return 0;
  }
}

export async function saveTodayIntakeLocal(userId, glasses) {
  try {
    await AsyncStorage.setItem(buildWaterStorageKey(userId), String(glasses));
  } catch (error) {
    console.error("Local water storage error:", error);
  }
}
