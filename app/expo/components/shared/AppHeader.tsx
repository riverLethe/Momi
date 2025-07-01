import React from "react";
import { useRouter } from "expo-router";
import { Bell, Plus, Search } from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Avatar,
  useTheme,
  Input,
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

interface AppHeaderProps {
  showSearch?: boolean;
  showAddButton?: boolean;
  searchText?: string;
  onSearchChange?: (text: string) => void;
  onAddPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  showSearch = false,
  showAddButton = false,
  searchText = "",
  onSearchChange,
  onAddPress,
}) => {
  const router = useRouter();
  const { viewMode, setViewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const theme = useTheme();

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
    <YStack>
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="$4"
        paddingVertical="$3"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack alignItems="center" space="$2">
          <Avatar circular size="$4">
            <Avatar.Fallback delayMs={600}>
              <View backgroundColor={isAuthenticated ? "$blue5" : "$gray5"} width="100%" height="100%" alignItems="center" justifyContent="center">
                <Text color={isAuthenticated ? "$blue11" : "$gray11"} fontSize="$6" fontWeight="bold">
                  {isAuthenticated && user?.name ? user.name.charAt(0).toUpperCase() : "G"}
                </Text>
              </View>
            </Avatar.Fallback>
          </Avatar>
          <Text fontSize="$4" fontWeight="$6" color="$color">
            {isAuthenticated ? user?.name : "Guest"}
          </Text>
        </XStack>

        <XStack alignItems="center" space="$3">
          {showAddButton && (
            <Button
              size="$2"
              circular
              backgroundColor="$card"
              pressStyle={{ scale: 0.92 }}
              onPress={onAddPress || (() => router.push('/bills/add'))}
            >
              <Plus size={18} color={theme?.color?.get()} />
            </Button>
          )}

          {/* <Button
            size="$2"
            backgroundColor={viewMode === "personal" ? "$blue5" : "$orange5"}
            paddingHorizontal="$3"
            borderRadius="$4"
            pressStyle={{ scale: 0.97, opacity: 0.9 }}
            onPress={toggleViewMode}
          >
            <Text color={viewMode === "personal" ? "$blue11" : "$orange11"} fontWeight="$6">
              {viewMode === "personal" ? "Personal" : "Family"}
            </Text>
          </Button>

          <Button 
            size="$2" 
            circular 
            pressStyle={{ scale: 0.92 }} 
            backgroundColor="$card" 
            onPress={() => {}}
          >
            <Bell size={18} color={theme?.color?.get()} />
          </Button> */}
        </XStack>
      </XStack>

      {/* Search bar */}
      {showSearch && (
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$2"
          backgroundColor="$background"
        >
          <Input
            flex={1}
            placeholder="Search bills..."
            size="$3"
            borderRadius="$4"
            paddingLeft="$9"
            backgroundColor="$card"
            value={searchText}
            onChangeText={onSearchChange}
          />
          <Button
            position="absolute"
            left="$6"
            top="$3.5"
            chromeless
          >
            <Search size={18} color="$gray10" />
          </Button>
        </XStack>
      )}
    </YStack>
  );
};

export default AppHeader; 