import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Linking, NativeModules, AppState } from "react-native";

import config from "../tamagui.config";
import "../global.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { DataProvider } from "@/providers/DataProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import NotificationProvider from "@/providers/NotificationProvider";
import I18nProvider from "@/providers/I18nProvider";

// Import i18n instance to initialize it
import "@/i18n";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Consume any pending deep link (iOS ≤16 fallback) whenever the app becomes active.
  useEffect(() => {
    if (!loaded) return;

    const handlePendingDeepLink = () => {
      const bridge = (NativeModules as any)?.PendingLinkBridge;
      if (bridge?.consumePendingDeepLink) {
        bridge
          .consumePendingDeepLink()
          .then((url: string | null) => {
            if (url && typeof url === "string" && url.length > 0) {
              // Give navigation tree a tick to mount before navigating
              setTimeout(() => Linking.openURL(url).catch(() => {}), 200);
            }
          })
          .catch((e: any) => {
            console.warn("Failed to consume pending deep link", e);
          });
      }
    };

    // Initial check after resources are loaded
    handlePendingDeepLink();

    // Listen for app returning to foreground to re-check
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        handlePendingDeepLink();
      }
    });

    return () => {
      // For RN < 0.65 compatibility, guard remove existence
      // @ts-ignore – typings differ across versions
      subscription?.remove?.();
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={config}>
          <I18nProvider>
            <AuthProvider>
              <DataProvider>
                <ChatProvider>
                  <NotificationProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: "slide_from_right",
                      }}
                    />
                  </NotificationProvider>
                </ChatProvider>
              </DataProvider>
            </AuthProvider>
          </I18nProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
