// src/hooks/useOfflineCache.js
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

export const CACHE_KEYS = {
  weeklyPlan: "cachedWeeklyPlan",
  recipes: "cachedRecipes",
};

const MAX_CACHED_RECIPES = 20;

export function buildScopedCacheKey(baseKey, scopeKey) {
  return scopeKey ? `${baseKey}.${scopeKey}` : baseKey;
}

export function useNetworkBanner() {
  const [isConnected, setIsConnected] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setShowBanner(!connected);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setShowBanner(!connected);
    });

    return () => unsubscribe();
  }, []);

  return { isConnected, showBanner };
}

export async function cacheWeeklyPlan(data, scopeKey) {
  try {
    await AsyncStorage.setItem(
      buildScopedCacheKey(CACHE_KEYS.weeklyPlan, scopeKey),
      JSON.stringify(data)
    );
  } catch (e) {
    console.log("[Cache] Failed to cache weekly plan:", e.message);
  }
}

export async function getCachedWeeklyPlan(scopeKey) {
  try {
    const stored = await AsyncStorage.getItem(
      buildScopedCacheKey(CACHE_KEYS.weeklyPlan, scopeKey)
    );
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
}

export async function cacheRecipes(recipes, scopeKey) {
  try {
    const trimmed = recipes.slice(0, MAX_CACHED_RECIPES);
    await AsyncStorage.setItem(
      buildScopedCacheKey(CACHE_KEYS.recipes, scopeKey),
      JSON.stringify(trimmed)
    );
  } catch (e) {
    console.log("[Cache] Failed to cache recipes:", e.message);
  }
}

export async function getCachedRecipes(scopeKey) {
  try {
    const stored = await AsyncStorage.getItem(
      buildScopedCacheKey(CACHE_KEYS.recipes, scopeKey)
    );
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
}

// Hook for screens that need cached + live data
export function useCachedFetch(cacheKey, fetchFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const isMounted = useRef(true);

  const load = useCallback(async () => {
    // Step 1 — show cached data immediately
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached && isMounted.current) {
        setData(JSON.parse(cached));
        setIsFromCache(true);
        setLoading(false);
      }
    } catch {
      // ignore cache errors
    }

    // Step 2 — fetch fresh data in background
    try {
      const fresh = await fetchFn();
      if (fresh && isMounted.current) {
        setData(fresh);
        setIsFromCache(false);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(fresh));
      }
    } catch (e) {
      console.log("[Cache] Fetch failed, using cache:", e.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [cacheKey, fetchFn]);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
  }, [load]);

  return { data, loading, isFromCache, refresh: load };
}
