import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "../global.css";
import config from "../tamagui.config";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    // TODO: 检查用户认证状态和首次启动状态
    // 这里暂时模拟逻辑
    const checkAuthAndFirstLaunch = async () => {
      // 实际应该从存储中读取
      const hasLaunched = false; // 模拟首次启动
      const userToken = null; // 模拟未登录

      setIsFirstLaunch(!hasLaunched);
      setIsAuthenticated(!!userToken);
    };

    checkAuthAndFirstLaunch();
  }, []);

  useEffect(() => {
    // 处理导航逻辑
    if (!loaded) return;

    const inAuthGroup = segments[0] === "auth";

    if (isFirstLaunch && !inAuthGroup) {
      // 首次启动，跳转到引导页
      router.replace("/auth/onboarding");
    } else if (!isAuthenticated && !inAuthGroup) {
      // 未认证且不在认证组，跳转到登录页
      router.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      // 已认证但在认证组，跳转到主页
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isFirstLaunch, segments, loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="chat" options={{ headerShown: false }} />
          <Stack.Screen
            name="transactions/add"
            options={{
              title: "添加账单",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="transactions/[id]"
            options={{
              title: "账单详情",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
}
