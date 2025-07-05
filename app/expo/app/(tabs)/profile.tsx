import React from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Home,
  CreditCard,
  FileText,
  Settings,
  Bell,
} from "lucide-react-native";
import {
  Text,
  XStack,
  YStack,
  Circle,
  View,
  useTheme,
} from "tamagui";

import { useAuth } from "@/providers/AuthProvider";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileRow } from "@/components/profile/ProfileRow";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();

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
    <View flex={1} backgroundColor="$background">
      <YStack flex={1}>
        {/* Header with logout button */}
        <ProfileHeader
          user={user}
          isAuthenticated={isAuthenticated}
          onLoginPress={handleLogin}
          onLogoutPress={isAuthenticated ? handleLogout : undefined}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Settings Section */}
          <ProfileSection title={t('Settings')}>
            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$gray4">
                  <Settings size={20} color={theme.color8?.get()} />
                </Circle>
              }
              label={t('App Settings')}
              onPress={() => router.push('/settings')}
            />

            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$yellow4">
                  <Bell size={22} color="#F59E0B" />
                </Circle>
              }
              label={t("Notifications")}
              onPress={() => router.push("/notifications")}
            />

            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$purple4">
                  <CreditCard size={22} color="#8B5CF6" />
                </Circle>
              }
              label={t("Quick Bill Screenshot Setup")}
              onPress={() => router.push("/shortcut-guide")}
            />
            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$green4">
                  <Home size={22} color="#10B981" />
                </Circle>
              }
              label={t("iOS Widget Setup")}
              onPress={() => router.push("/widget-guide")}
            />
            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$blue4">
                  <FileText size={22} color="#3B82F6" />
                </Circle>
              }
              label={t("Export Data")}
              onPress={() => router.push("/export")}
            />
          </ProfileSection>
        </ScrollView>
      </YStack>
    </View>
  );
}
