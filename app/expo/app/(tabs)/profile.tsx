import React from "react";
import { ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Home,
  CreditCard,
  FileText,
  Settings,
  Bell,
  UserX,
  LogOut,
  Users,
} from "lucide-react-native";
import {
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
  const { user, isAuthenticated, logout, deleteAccount } = useAuth();
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
    Alert.alert(
      t('Confirm Sign Out'),
      t('Are you sure you want to sign out?'),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Sign Out'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('Confirm Account Deletion'),
      t('This action will permanently delete your account and all data, and cannot be undone. Are you sure you want to continue?'),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Delete Account'),
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAccount();
            if (success) {
              Alert.alert(t('Account successfully deleted'));
            } else {
              Alert.alert(t('Failed to delete account, please try again later'));
            }
          },
        },
      ]
    );
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
                <Circle size="$3" backgroundColor="$purple4">
                  <Users size={20} color="#8B5CF6" />
                </Circle>
              }
              label={t('Family Space')}
              onPress={handleFamilySpacePress}
            />
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

          {/* Account Section - Only show when authenticated */}
          {isAuthenticated && (
            <ProfileSection title={t('Account')}>
              <ProfileRow
                icon={
                  <Circle size="$3" backgroundColor="$orange4">
                    <LogOut size={20} color="#F97316" />
                  </Circle>
                }
                label={t('Sign Out')}
                onPress={handleLogout}
              />
              <ProfileRow
                icon={
                  <Circle size="$3" backgroundColor="$red4">
                    <UserX size={20} color="#EF4444" />
                  </Circle>
                }
                label={t('Delete Account')}
                onPress={handleDeleteAccount}
              />
            </ProfileSection>
          )}
        </ScrollView>
      </YStack>

    </View>
  );
}
