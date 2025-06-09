import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TamaguiProvider } from "tamagui";

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

  if (!loaded) {
    return null;
  }

  return (
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
  );
}
