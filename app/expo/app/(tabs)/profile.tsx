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
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
} from "lucide-react-native";
import {
  Text,
  Button,
  XStack,
  YStack,
  Circle,
  Separator,
  Spinner,
  View,
} from "tamagui";

import { useAuth } from "@/providers/AuthProvider";
import { useDataSync } from "@/hooks/useDataSync";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { ProfileRow } from "@/components/profile/ProfileRow";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    isOnline,
    isSyncing,
    syncData,
    getSyncStatusText,
    getSyncStatusColor
  } = useDataSync();
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

  const handleSyncPress = () => {
    if (isAuthenticated && isOnline) {
      syncData();
    }
  };

  return (
    <View flex={1} backgroundColor="#eee">
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
          {/* Sync Status Section */}
          {isAuthenticated && (
            <ProfileSection title={t("Data Sync")}>
              <YStack gap="$3">
                {/* Sync Status */}
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" gap="$3">
                    <Circle size="$3" backgroundColor={isOnline ? "$green4" : "$red4"}>
                      {isOnline ? (
                        <Wifi size={18} color="#10B981" />
                      ) : (
                        <WifiOff size={18} color="#EF4444" />
                      )}
                    </Circle>
                    <YStack>
                      <Text fontWeight="$6" fontSize="$3">
                        {t("Status")}
                      </Text>
                      <Text
                        fontSize="$2"
                        color={getSyncStatusColor()}
                        opacity={0.8}
                      >
                        {getSyncStatusText()}
                      </Text>
                    </YStack>
                  </XStack>
                  <Button
                    chromeless
                    onPress={handleSyncPress}
                    disabled={!isAuthenticated || !isOnline || isSyncing}
                    opacity={(!isAuthenticated || !isOnline || isSyncing) ? 0.5 : 1}
                  >
                    {isSyncing ? (
                      <Spinner size="small" color="$blue9" />
                    ) : (
                      <RefreshCw size={20} color="#3B82F6" />
                    )}
                  </Button>
                </XStack>

                <Separator opacity={0.3} />

                {/* Last Sync Time */}
                <XStack alignItems="center" gap="$3">
                  <Circle size="$3" backgroundColor="$blue4">
                    <Clock size={18} color="#3B82F6" />
                  </Circle>
                  <YStack>
                    <Text fontWeight="$6" fontSize="$3">
                      {t("Last Sync")}
                    </Text>
                    <Text fontSize="$2" color="$gray10" opacity={0.8}>
                      {getSyncStatusText()}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </ProfileSection>
          )}

          {/* Family Space Section */}
          {/* <ProfileSection title={t("Family")}>
            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$blue4">
                  <Home size={22} color="#3B82F6" />
                </Circle>
              }
              label={t("Family Spaces")}
              onPress={handleFamilySpacePress}
            />
          </ProfileSection> */}


          {/* Settings Section */}
          <ProfileSection title={t("Settings")}>
            <ProfileRow
              icon={
                <Circle size="$3" backgroundColor="$gray4">
                  <Settings size={22} color="#6B7280" />
                </Circle>
              }
              label={t("App Settings")}
              onPress={() => router.push("/settings")}
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
              <XStack alignItems="center" gap="$2">
                <LogOut size={20} color="#EF4444" />
                <Text fontWeight="$6" color="#EF4444" fontSize="$3">{t("Logout")}</Text>
              </XStack>
            </Button>
          )}
        </ScrollView>
      </YStack>
    </View>
  );
}
