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

interface HomeHeaderProps {
  onThemeToggle?: () => void;
  onNotificationPress?: () => void;
  onSettingsPress?: () => void;
  onAvatarPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onThemeToggle,
  onNotificationPress,
  onSettingsPress,
  onAvatarPress,
}) => {
  const router = useRouter();
  const { viewMode, setViewMode } = useViewStore();
  const { isLoggedIn, user } = useAuth();
  const theme = useTheme();
  const themeName = useThemeName();
  const { t } = useTranslation();
  
  const isDark = themeName === "dark";
  
  // Toggle between personal and family view
  const toggleViewMode = () => {
    if (!isLoggedIn && viewMode === "personal") {
      // If user is not logged in and tries to switch to family view, prompt to login
      router.push("/auth/login");
      return;
    }

    setViewMode(viewMode === "personal" ? "family" : "personal");
  };

  return (
    <YStack backgroundColor="$background">
      <XStack 
        alignItems="center" 
        justifyContent="space-between"
        paddingHorizontal="$4" 
        paddingVertical="$3"
      >
        <XStack alignItems="center" space="$2">
          <Avatar 
            circular 
            size="$4"
            pressStyle={{ scale: 0.95 }}
            onPress={onAvatarPress || (() => router.push(isLoggedIn ? "/profile" : "/auth/login"))}
          >
            <Avatar.Fallback delayMs={600}>
              <View 
                backgroundColor={isLoggedIn ? "$blue5" : "$gray5"} 
                width="100%" 
                height="100%" 
                alignItems="center" 
                justifyContent="center"
              >
                <Text 
                  color={isLoggedIn ? "$blue11" : "$gray11"} 
                  fontSize="$5" 
                  fontWeight="bold"
                >
                  {isLoggedIn && user?.username ? user.username.charAt(0).toUpperCase() : "G"}
                </Text>
              </View>
            </Avatar.Fallback>
          </Avatar>
          <YStack>
            <Text fontSize="$2" color="$gray10">
              {t("Hello")}
            </Text>
            <Text fontSize="$4" fontWeight="$6" color="$color">
              {isLoggedIn ? user?.username : t("Guest")}
            </Text>
          </YStack>
        </XStack>

        <XStack alignItems="center" space="$3">
          <Button 
            size="$2" 
            circular 
            pressStyle={{ scale: 0.92 }} 
            backgroundColor="$backgroundHover" 
            onPress={onThemeToggle}
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
            backgroundColor="$backgroundHover" 
            onPress={onNotificationPress || (() => router.push("/notifications"))}
          >
            <Bell size={18} color={theme?.color?.get()} />
          </Button>
          
          <Button 
            size="$2" 
            circular 
            pressStyle={{ scale: 0.92 }} 
            backgroundColor="$backgroundHover" 
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