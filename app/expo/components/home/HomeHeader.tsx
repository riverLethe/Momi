import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { Bell, Plus, Settings, Sun, Moon } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Avatar,
  useTheme,
  useThemeName,
  Separator,
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme as useAppTheme } from "@/providers/ThemeProvider";

interface HomeHeaderProps {
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onNotificationPress,
  onSettingsPress,
  onAvatarPress,
}) => {
  const router = useRouter();
  const { viewMode, setViewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();
  const themeName = useThemeName();
  const { toggleTheme } = useAppTheme();
  const { t } = useTranslation();

  const isDark = themeName === "dark";

  // Toggle between personal and family view
  const toggleViewMode = () => {
    if (!isAuthenticated && viewMode === "personal") {
      // If user is not logged in and tries to switch to family view, prompt to login
      router.push("/auth/login");
      return;
    }

    setViewMode(viewMode === "personal" ? "family" : "personal");
  };

  return (
    <YStack backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        <XStack alignItems="center" space="$3">
          <Avatar circular size="$5" onPress={onAvatarPress}>
            {isAuthenticated && user?.avatar ? (
              <Avatar.Image
                accessibilityLabel={user?.name || 'User avatar'}
                src={user.avatar}
              />
            ) : (
              <Avatar.Fallback
                backgroundColor={isAuthenticated ? "$blue5" : "$gray5"}
                alignItems="center"
                justifyContent="center"
              >
                <Text color={isAuthenticated ? "$blue11" : "$gray11"} fontSize="$6" fontWeight="bold">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                </Text>
              </Avatar.Fallback>
            )}
          </Avatar>

          <YStack>
            <Text fontSize="$5" fontWeight="$7" color="$color">
              {isAuthenticated ? user?.name : t('Guest')}
            </Text>
            <Button
              size="$2"
              chromeless
              onPress={toggleViewMode}
              backgroundColor="transparent"
            >
              <Text fontSize="$2" color="$color10">
                {viewMode === "personal" ? t("Personal") : t("Family")} {t("View")}
              </Text>
            </Button>
          </YStack>
        </XStack>

        <XStack alignItems="center" space="$3">
          <Button
            size="$2"
            circular
            pressStyle={{ scale: 0.92 }}
            backgroundColor="$card"
            onPress={toggleTheme}
          >
            {isDark ? (
              <Sun size={18} color={theme?.color?.get()} />
            ) : (
              <Moon size={18} color={theme?.color?.get()} />
            )}
          </Button>

          <Button
            size="$2"
            circular
            pressStyle={{ scale: 0.92 }}
            backgroundColor="$card"
            onPress={onNotificationPress || (() => router.push("/notifications"))}
          >
            <Bell size={18} color={theme?.color?.get()} />
          </Button>

          <Button
            size="$2"
            circular
            pressStyle={{ scale: 0.92 }}
            backgroundColor="$card"
            onPress={onSettingsPress || (() => router.push("/settings"))}
          >
            <Settings size={18} color={theme?.color?.get()} />
          </Button>
        </XStack>
      </XStack>

      <Separator />
    </YStack>
  );
};

export default HomeHeader;