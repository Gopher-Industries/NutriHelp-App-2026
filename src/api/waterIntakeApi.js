import AsyncStorage from "@react-native-async-storage/async-storage";
import baseApi from "./baseApi";

const WATER_LOCAL_KEY = "nutrihelp.water_intake.today";

function getTodayKey() {
  return `${WATER_LOCAL_KEY}_${new Date().toISOString().split('T')[0]}`;
}

export async function getTodayIntakeLocal() {
  try {
    const val = await AsyncStorage.getItem(getTodayKey());
    return val ? parseInt(val, 10) : 0;
  } catch (error) {
    console.error("Local water storage error:", error);
    return 0;
  }
}

export async function saveTodayIntakeLocal(glasses) {
  try {
    await AsyncStorage.setItem(getTodayKey(), String(glasses));
  } catch (error) {
    console.error("Local water storage error:", error);
  }
}

export async function logWaterIntake(userId, glassesConsumed) {
  // Silent return if anonymous (will still work locally)
  if (!userId) return; 
  
  return baseApi.post("/api/water-intake", {
    user_id: userId,
    amount_ml: glassesConsumed * 250,
    date: new Date().toISOString().split('T')[0],
  });
}

export async function getTodayIntake(userId) {
  if (!userId) return null;

  try {
    const date = new Date().toISOString().split('T')[0];
    const records = await baseApi.get("/api/water-intake", {
      query: { user_id: userId, date },
    });
    if (records && records.length > 0) {
      return Math.round((records[0].amount_ml || 0) / 250);
    }
    return 0;
  } catch (error) {
    console.error("Error fetching water intake:", error);
    return 0;
  }
}
