import AsyncStorage from "@react-native-async-storage/async-storage";
import baseApi from "./baseApi";

const WATER_LOCAL_KEY = "nutrihelp.water_intake.today";

function buildWaterStorageKey(userId) {
  const date = new Date().toISOString().split('T')[0];
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

export async function logWaterIntake(userId, glassesConsumed) {
  // Silent return if anonymous (will still work locally)
  if (!userId) return; 
  
  return baseApi.post("/api/water-intake", {
    amount_ml: glassesConsumed * 250,
    date: new Date().toISOString().split('T')[0],
  });
}

export async function getTodayIntake(userId) {
  if (!userId) return null;

  try {
    const date = new Date().toISOString().split('T')[0];
    const records = await baseApi.get("/api/water-intake", {
      query: { date },
    });
    const rows = Array.isArray(records) ? records : [];
    if (rows.length > 0) {
      const amountMl = rows.reduce((maxValue, row) => {
        const currentValue = Number(row?.amount_ml || 0);
        return currentValue > maxValue ? currentValue : maxValue;
      }, 0);
      return Math.round(amountMl / 250);
    }
    return 0;
  } catch (error) {
    console.error("Error fetching water intake:", error);
    return 0;
  }
}
