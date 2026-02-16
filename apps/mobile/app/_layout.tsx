import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "@/src/providers/session-provider";
import { listenForNotificationTap } from "@/src/services/notifications";

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    listenForNotificationTap((url) => {
      if (url.includes("focus=approvals")) {
        router.push({ pathname: "/(app)", params: { focus: "approvals" } });
        return;
      }

      router.push("/(app)");
    }).then((sub) => {
      subscription = sub;
    });

    return () => {
      subscription?.remove();
    };
  }, [router]);

  return (
    <SessionProvider>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </SessionProvider>
  );
}
