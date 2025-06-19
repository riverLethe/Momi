import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Home,
  CreditCard,
  FileText,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import {
  Text,
  Button,
  XStack,
  YStack,
  Card,
  Circle,
  Separator,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";
import { installQuickScreenshotBillShortcut } from '@/utils/shortcutInstaller';

import { useAuth } from "@/providers/AuthProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSection } from "@/components/profile/ProfileSection";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  const handleFamilySpacePress = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    router.push("/family");
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eee" }}>
      <YStack flex={1}>
        {/* Header */}
        <ProfileHeader
          user={user}
          isAuthenticated={isAuthenticated}
          onLoginPress={handleLogin}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Family Space Section */}
          <ProfileSection title={t("Family")}>
            <Button
              chromeless
              justifyContent="flex-start"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={handleFamilySpacePress}
              borderWidth={0}
              height="$5"
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" space="$3">
                  <Circle size="$3" backgroundColor="$blue4">
                    <Home size={22} color="#3B82F6" />
                  </Circle>
                  <Text fontWeight="$6" fontSize="$3">{t("Family Spaces")}</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </ProfileSection>

          {/* Personal Finance Section */}
          <ProfileSection title={t("Finance")}>
            <Button
              chromeless
              justifyContent="flex-start"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={() => router.push("/budget")}
              height="$5"
              borderWidth={0}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" space="$3">
                  <Circle size="$3" backgroundColor="$green4">
                    <CreditCard size={22} color="#10B981" />
                  </Circle>
                  <Text fontWeight="$6" fontSize="$3">{t("My Budgets")}</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>

            <Separator opacity={0.5} />

            <Button
              chromeless
              justifyContent="flex-start"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={() => router.push("/export")}
              height="$5"
              borderWidth={0}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" space="$3">
                  <Circle size="$3" backgroundColor="$purple4">
                    <FileText size={22} color="#8B5CF6" />
                  </Circle>
                  <Text fontWeight="$6" fontSize="$3">{t("Export Data")}</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </ProfileSection>

          {/* Settings Section */}
          <ProfileSection title={t("Settings")}>
            <Button
              chromeless
              justifyContent="flex-start"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={() => router.push("/settings")}
              height="$5"
              borderWidth={0}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" space="$3">
                  <Circle size="$3" backgroundColor="$gray4">
                    <Settings size={22} color="#6B7280" />
                  </Circle>
                  <Text fontWeight="$6" fontSize="$3">{t("App Settings")}</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>

            <Separator opacity={0.5} />

            <Button
              chromeless
              justifyContent="flex-start"
              hoverStyle={{ backgroundColor: "$gray2" }}
              pressStyle={{ backgroundColor: "$gray3" }}
              onPress={() => router.push("/notifications")}
              height="$5"
              borderWidth={0}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center" space="$3">
                  <Circle size="$3" backgroundColor="$yellow4">
                    <Bell size={22} color="#F59E0B" />
                  </Circle>
                  <Text fontWeight="$6" fontSize="$3">{t("Notifications")}</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </ProfileSection>

          {/* Logout Button (only if logged in) */}
          {isAuthenticated && (
            <Button
              backgroundColor="white"
              borderRadius="$6"
              padding="$4"
              marginBottom="$10"
              alignItems="center"
              justifyContent="center"
              elevate
              shadowColor="rgba(0,0,0,0.1)"
              shadowRadius={15}
              hoverStyle={{ backgroundColor: "$gray1" }}
              pressStyle={{ backgroundColor: "$gray2" }}
              onPress={handleLogout}
            >
              <XStack alignItems="center" space="$2">
                <LogOut size={20} color="#EF4444" />
                <Text fontWeight="$6" color="#EF4444" fontSize="$3">{t("Logout")}</Text>
              </XStack>
            </Button>
          )}

          <Button onPress={() => installQuickScreenshotBillShortcut()}>
            {t("Install Quick Screenshot Shortcut")}
          </Button>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
