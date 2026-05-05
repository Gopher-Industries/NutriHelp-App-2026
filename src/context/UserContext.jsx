import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AUTH_TOKEN_KEY, setUnauthorizedHandler } from "../api/baseApi";

const USER_STORAGE_KEY = "nutrihelp.auth.user";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

const UserContext = createContext(null);

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");

  if (typeof globalThis.atob === "function") {
    return globalThis.atob(padded);
  }

  throw new Error("No base64 decoder available in this runtime.");
}

function getTokenExpiryMs(token) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (!payload?.exp || typeof payload.exp !== "number") {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);

  const appStateRef = useRef(AppState.currentState);
  const backgroundAtRef = useRef(null);
  const autoLogoutTimerRef = useRef(null);

  const clearAutoLogoutTimer = useCallback(() => {
    if (autoLogoutTimerRef.current) {
      clearTimeout(autoLogoutTimerRef.current);
      autoLogoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(async () => {
    clearAutoLogoutTimer();
    setUser(null);
    setToken(null);
    setExpiresAt(null);

    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_STORAGE_KEY),
    ]);
  }, [clearAutoLogoutTimer]);

  const scheduleAutoLogout = useCallback(
    (nextExpiresAt) => {
      clearAutoLogoutTimer();
      if (!nextExpiresAt) {
        console.log("[UserContext] No expiration time, auto-logout not scheduled");
        return;
      }

      const remaining = nextExpiresAt - Date.now();
      console.log("[UserContext] Auto-logout scheduled. Expires at:", new Date(nextExpiresAt).toISOString(), "Remaining ms:", remaining);
      
      if (remaining <= 0) {
        console.log("[UserContext] Token already expired, logging out immediately");
        logout();
        return;
      }

      autoLogoutTimerRef.current = setTimeout(() => {
        console.log("[UserContext] Auto-logout timer fired");
        logout();
      }, remaining);
    },
    [clearAutoLogoutTimer, logout]
  );

  const login = useCallback(
    async (authOrToken, maybeUser = null, maybeExpiresAt = null) => {
      console.log("[UserContext] login() called with:", { authOrToken, maybeUser, maybeExpiresAt });
      
      const authObject =
        authOrToken && typeof authOrToken === "object" && !Array.isArray(authOrToken)
          ? authOrToken
          : null;

      const nextToken = authObject
        ? authObject.token || authObject.accessToken
        : authOrToken;
      const nextUser = authObject ? authObject.user ?? null : maybeUser;
      const nextExpiresAt =
        authObject && authObject.expiresAt
          ? authObject.expiresAt
          : maybeExpiresAt || getTokenExpiryMs(nextToken);

      console.log("[UserContext] Processed login data:", { nextToken: nextToken ? "***" : null, nextUser, nextExpiresAt: nextExpiresAt ? new Date(nextExpiresAt).toISOString() : null });

      if (!nextToken) {
        throw new Error("login() requires a JWT token.");
      }

      if (nextExpiresAt && nextExpiresAt <= Date.now()) {
        console.log("[UserContext] Token already expired");
        await logout();
        return false;
      }

      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, nextToken);
      if (nextUser) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }

      setToken(nextToken);
      setUser(nextUser);
      setExpiresAt(nextExpiresAt || null);
      scheduleAutoLogout(nextExpiresAt || null);
      console.log("[UserContext] Login successful");
      return true;
    },
    [logout, scheduleAutoLogout]
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(AUTH_TOKEN_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        console.log("[UserContext] Bootstrap auth - storedToken:", storedToken ? "***" : null, "storedUser:", storedUser ? "***" : null);

        if (!storedToken) {
          console.log("[UserContext] No stored token");
          return;
        }

        const nextExpiresAt = getTokenExpiryMs(storedToken);
        console.log("[UserContext] Token expiry:", nextExpiresAt ? new Date(nextExpiresAt).toISOString() : null);
        
        if (nextExpiresAt && nextExpiresAt <= Date.now()) {
          console.log("[UserContext] Stored token already expired");
          await logout();
          return;
        }

        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setUser(parsedUser);
        setExpiresAt(nextExpiresAt || null);
        scheduleAutoLogout(nextExpiresAt || null);
        console.log("[UserContext] Bootstrap auth successful");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
      clearAutoLogoutTimer();
    };
  }, [clearAutoLogoutTimer, logout, scheduleAutoLogout]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === "background" || nextState === "inactive") {
        backgroundAtRef.current = Date.now();
        return;
      }

      if (
        previousState.match(/background|inactive/) &&
        nextState === "active" &&
        backgroundAtRef.current
      ) {
        const inactiveFor = Date.now() - backgroundAtRef.current;
        backgroundAtRef.current = null;
        if (inactiveFor >= INACTIVITY_TIMEOUT_MS) {
          logout();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => {
      setUnauthorizedHandler(null);
    };
  }, [logout]);

  const isAuthenticated = Boolean(token);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated,
      login,
      logout,
    }),
    [user, token, loading, isAuthenticated, login, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within <UserProvider />");
  }
  return context;
}
