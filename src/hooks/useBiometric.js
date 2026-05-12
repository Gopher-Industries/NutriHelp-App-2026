// src/hooks/useBiometric.js
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BIOMETRIC_KEY = "biometricEnabled";
const BACKGROUND_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function buildBiometricKey(storageScopeKey) {
  return storageScopeKey ? `${BIOMETRIC_KEY}.${storageScopeKey}` : BIOMETRIC_KEY;
}

export default function useBiometric({ onAuthFail, storageScopeKey } = {}) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const backgroundAtRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const attemptCountRef = useRef(0);

  // Check hardware + enrollment
  useEffect(() => {
    async function checkAvailability() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(hasHardware && isEnrolled);
    }

    checkAvailability();
  }, []);

  // Load persisted preference
  useEffect(() => {
    async function loadPreference() {
      const stored = await AsyncStorage.getItem(buildBiometricKey(storageScopeKey));
      setIsEnabled(stored === "true");
    }

    loadPreference();
  }, [storageScopeKey]);

  const setEnabled = useCallback(async (value) => {
    setIsEnabled(value);
    await AsyncStorage.setItem(
      buildBiometricKey(storageScopeKey),
      value ? "true" : "false"
    );
  }, [storageScopeKey]);

  const authenticate = useCallback(async () => {
    if (!isAvailable || isPrompting) return;
    setIsPrompting(true);
    attemptCountRef.current = 0;

    try {
      while (attemptCountRef.current < 3) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Authenticate to continue",
          fallbackLabel: "Use Password",
          cancelLabel: "Cancel",
          disableDeviceFallback: false,
        });

        if (result.success) {
          attemptCountRef.current = 0;
          return true;
        }

        if (
          result.error === "user_cancel" ||
          result.error === "system_cancel"
        ) {
          // User cancelled — logout
          onAuthFail?.();
          return false;
        }

        attemptCountRef.current += 1;

        if (attemptCountRef.current >= 3) {
          // 3 failed attempts — logout
          onAuthFail?.();
          return false;
        }
      }
    } catch (e) {
      console.log("[Biometric] Auth error:", e.message);
      onAuthFail?.();
      return false;
    } finally {
      setIsPrompting(false);
    }
  }, [isAvailable, isPrompting, onAuthFail]);

  // Monitor app state — trigger biometric after 5+ min background
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

        if (isEnabled && isAvailable && inactiveFor >= BACKGROUND_THRESHOLD_MS) {
          authenticate();
        }
      }
    });

    return () => subscription.remove();
  }, [isEnabled, isAvailable, authenticate]);

  return {
    isAvailable,
    isEnabled,
    setEnabled,
    authenticate,
    isPrompting,
  };
}
