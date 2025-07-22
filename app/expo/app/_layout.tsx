import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Linking, NativeModules, AppState } from "react-native";
// @ts-ignore – provided by Expo SDK
import * as Notifications from "expo-notifications";

import config from "../tamagui.config";
import "../global.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { DataProvider } from "@/providers/DataProvider";
import { ChatProvider } from "@/providers/ChatProvider";
import NotificationProvider from "@/providers/NotificationProvider";
import I18nProvider from "@/providers/I18nProvider";
import ThemeProvider, { useTheme } from "@/providers/ThemeProvider";
import { useViewStore } from "@/stores/viewStore";

// Import i18n instance to initialize it
import "@/i18n";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Ensure notifications show alert while app is foreground
Notifications.setNotificationHandler({
  // @ts-ignore – SDK type version mismatch workaround
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

// Add wrapper component to use theme inside TamaguiProvider
function AppContent() {
  const { actualTheme } = useTheme();
  const { initializeViewMode } = useViewStore();

  // 在应用启动时初始化视图模式
  useEffect(() => {
    initializeViewMode();
  }, [initializeViewMode]);

  return (
    <TamaguiProvider config={config} defaultTheme={actualTheme}>
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
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Consume any pending deep link (iOS ≤16 fallback) once resources are ready,
  // then hide the splash screen. This ensures we navigate **before** the first
  // frame of the main UI becomes visible, eliminating the flash of the home
  // screen when the app is launched from a Shortcut.
  useEffect(() => {
    if (!loaded) return;

    const handleInitialDeepLinkAndHide = async () => {
      try {
        const bridge = (NativeModules as any)?.PendingLinkBridge;
        if (bridge?.consumePendingDeepLink) {
          try {
            const url: string | null = await bridge.consumePendingDeepLink();
            if (url && typeof url === "string" && url.length > 0) {
              await Linking.openURL(url).catch(() => { });
            }
          } catch (e) {
            console.warn("Failed to consume pending deep link", e);
          }
        }
      } finally {
        // Always hide splash once we're done so the first frame shown to the
        // user is already the correct screen (or home when no link).
        SplashScreen.hideAsync();
      }
    };

    // Run once after fonts/assets are ready.
    handleInitialDeepLinkAndHide();

    // Listen for app returning to foreground to re-check (no splash here)
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const bridge = (NativeModules as any)?.PendingLinkBridge;
        if (bridge?.consumePendingDeepLink) {
          bridge
            .consumePendingDeepLink()
            .then((url: string | null) => {
              if (url && typeof url === "string" && url.length > 0) {
                Linking.openURL(url).catch(() => { });
              }
            })
            .catch((e: any) => {
              console.warn("Failed to consume pending deep link", e);
            });
        }
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
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
