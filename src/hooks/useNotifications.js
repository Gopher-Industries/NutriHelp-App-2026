// src/hooks/useNotifications.js
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { registerDeviceToken } from "../api/notificationApi";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // we show custom in-app banner instead
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function configureAndroidChannels() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("meal-reminders", {
    name: "Meal Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: true,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync("health-alerts", {
    name: "Health Alerts",
    importance: Notifications.AndroidImportance.MAX,
    sound: true,
    vibrationPattern: [0, 500, 250, 500],
  });
}

export default function useNotifications({ onNavigate } = {}) {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [foregroundNotification, setForegroundNotification] = useState(null);
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  const registerToken = async () => {
    if (!Device.isDevice) {
      console.log("[Notifications] Not a physical device — skipping token registration");
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      await registerDeviceToken(token.data);
      console.log("[Notifications] Token registered:", token.data);
    } catch (e) {
      console.log("[Notifications] Token registration failed:", e.message);
    }
  };

  const requestPermission = async () => {
    await configureAndroidChannels();

    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === "granted";
    setPermissionGranted(granted);

    if (granted) {
      await registerToken();
    }

    return granted;
  };

  useEffect(() => {
    // Listen for foreground notifications — show custom in-app banner
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setForegroundNotification(notification);
      });

    // Listen for notification taps (background/killed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const screen =
          response.notification.request.content.data?.screen;
        if (screen && onNavigate) {
          onNavigate(screen);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [onNavigate]);

  const dismissForegroundNotification = () => {
    setForegroundNotification(null);
  };

  return {
    permissionGranted,
    requestPermission,
    foregroundNotification,
    dismissForegroundNotification,
  };
}