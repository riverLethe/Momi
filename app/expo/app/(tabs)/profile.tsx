import React from "react";
import { Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User,
  Home,
  CreditCard,
  FileText,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
} from "lucide-react-native";
import {
  View,
  Text,
  Button,
  XStack,
  YStack,
  Card,
  H2,
  Avatar,
  Circle,
  Separator
} from "tamagui";

import { useAuth } from "@/providers/AuthProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  const handleFamilySpacePress = () => {
    if (!isLoggedIn) {
      // Prompt the user to login
      Alert.alert(
        "Login Required",
        "You need to login to manage family spaces.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }

    router.push("/family");
  };

  const handleLogout = async () => {
    await logout();
    // No need to navigate since we're already on the profile page
  };

  const handleLogin = () => {
    router.push("/auth/login");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1}>
        <YStack padding="$4">
          <H2>Profile</H2>
        </YStack>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          {/* User Info Card */}
          <Card padding="$6" marginBottom="$6" alignItems="center" elevate>
            <Avatar circular size="$8" marginBottom="$4" backgroundColor="$gray3">
              <User size={40} color="#9CA3AF" />
            </Avatar>
            <Text fontSize="$6" fontWeight="$7">
              {isLoggedIn ? user?.username : "Guest"}
            </Text>
            {isLoggedIn ? (
              <Text color="$gray10">{user?.id}</Text>
            ) : (
              <Button
                marginTop="$3"
                backgroundColor="$blue9"
                paddingHorizontal="$6"
                paddingVertical="$2"
                borderRadius="$10"
                onPress={handleLogin}
              >
                <Text color="white" fontWeight="$6">Login</Text>
              </Button>
            )}
          </Card>

          {/* Family Space Section */}
          <Card marginBottom="$6" elevate>
            <Text padding="$4" paddingBottom="$2" fontWeight="$6" color="$gray10">
              FAMILY
            </Text>

            <Button
              borderBottomWidth={1}
              borderBottomColor="$gray3"
              chromeless
              justifyContent="flex-start"
              onPress={handleFamilySpacePress}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$blue2" marginRight="$3">
                    <Home size={20} color="#3B82F6" />
                  </Circle>
                  <Text fontWeight="$6">Family Spaces</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Personal Finance Section */}
          <Card marginBottom="$6" elevate>
            <Text padding="$4" paddingBottom="$2" fontWeight="$6" color="$gray10">
              FINANCE
            </Text>

            <Button
              borderBottomWidth={1}
              borderBottomColor="$gray3"
              chromeless
              justifyContent="flex-start"
              onPress={() => router.push("/budget")}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$green2" marginRight="$3">
                    <CreditCard size={20} color="#10B981" />
                  </Circle>
                  <Text fontWeight="$6">My Budgets</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>

            <Button
              chromeless
              justifyContent="flex-start"
              onPress={() => router.push("/export")}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$purple2" marginRight="$3">
                    <FileText size={20} color="#8B5CF6" />
                  </Circle>
                  <Text fontWeight="$6">Export Data</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Settings Section */}
          <Card marginBottom="$6" elevate>
            <Text padding="$4" paddingBottom="$2" fontWeight="$6" color="$gray10">
              SETTINGS
            </Text>

            <Button
              borderBottomWidth={1}
              borderBottomColor="$gray3"
              chromeless
              justifyContent="flex-start"
              onPress={() => router.push("/settings")}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$gray3" marginRight="$3">
                    <Settings size={20} color="#6B7280" />
                  </Circle>
                  <Text fontWeight="$6">App Settings</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>

            <Button
              chromeless
              justifyContent="flex-start"
              onPress={() => router.push("/notifications")}
            >
              <XStack alignItems="center" justifyContent="space-between" width="100%">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$yellow2" marginRight="$3">
                    <Bell size={20} color="#F59E0B" />
                  </Circle>
                  <Text fontWeight="$6">Notifications</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Logout Button (only if logged in) */}
          {isLoggedIn && (
            <Button
              backgroundColor="$background"
              padding="$4"
              marginBottom="$10"
              alignItems="center"
              justifyContent="center"
              elevate
              onPress={handleLogout}
            >
              <XStack>
                <LogOut size={20} color="#EF4444" />
                <Text fontWeight="$6" color="#EF4444" marginLeft="$2">Logout</Text>
              </XStack>
            </Button>
          )}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
