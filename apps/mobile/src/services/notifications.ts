import { Platform } from "react-native";
import * as Device from "expo-device";

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "web") {
    return { token: null, deviceId: "web", platform: "web" as const };
  }
  if (!Device.isDevice) {
    return { token: null, deviceId: "simulator", platform: Platform.OS as "ios" | "android" | "web" };
  }

  const Notifications = await import("expo-notifications");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#0EC5A4",
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (existing.status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    return { token: null, deviceId: Device.osInternalBuildId ?? "unknown", platform: Platform.OS as "ios" | "android" | "web" };
  }

  const expoToken = await Notifications.getExpoPushTokenAsync();

  return {
    token: expoToken.data,
    deviceId: Device.osInternalBuildId ?? Device.modelId ?? `${Platform.OS}-${Date.now()}`,
    platform: Platform.OS as "ios" | "android" | "web",
  };
}

export async function listenForNotificationTap(onUrl: (url: string) => void) {
  if (Platform.OS === "web") return { remove: () => {} };
  const Notifications = await import("expo-notifications");
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const maybeUrl = response.notification.request.content.data?.url;
    if (typeof maybeUrl === "string") {
      onUrl(maybeUrl);
    }
  });
}
