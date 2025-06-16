import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Home,
  CreditCard,
  FileText,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  UserCircle,
} from "lucide-react-native";
import {
  Text,
  Button,
  XStack,
  YStack,
  Card,
  H2,
  Avatar,
  Circle,
  Separator,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";
import { installQuickScreenshotBillShortcut } from '@/utils/shortcutInstaller';

import { useAuth } from "@/providers/AuthProvider";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();

  const handleFamilySpacePress = () => {
    if (!isLoggedIn) {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1}>
        {/* Header */}
        <LinearGradient
          colors={["$blue9", "$blue8"]}
          start={[0, 0]}
          end={[1, 0]}
          padding="$5"
          borderRadius="$0"
          marginBottom="$6"
        >
          <YStack>
            
            <XStack alignItems="center" space="$4">
              <Avatar circular size="$10" overflow="hidden">
                {isLoggedIn ? (
                  <Avatar.Image 
                    accessibilityLabel={user?.username || "User avatar"}
                    src="https://images.unsplash.com/photo-1548142813-c348350df52b?&w=150&h=150&dpr=2&q=80"
                  />
                ) : (
                  <Avatar.Fallback backgroundColor="rgba(255,255,255,0.2)"alignItems="center" justifyContent="center">
                    <UserCircle size={52} color="white" />
                  </Avatar.Fallback>
                )}
              </Avatar>
              
              <YStack>
                <Text fontSize="$5" fontWeight="$7" color="white">
                  {isLoggedIn ? user?.username : "Guest"}
                </Text>
                {isLoggedIn ? (
                  <Text color="rgba(255,255,255,0.8)" fontSize="$3">{user?.id}</Text>
                ) : (
                  <Button
                    size="$2"
                    marginTop="$3"
                    backgroundColor="white"
                    onPress={handleLogin}
                  >
                    <Text color="$blue9">Login</Text>
                  </Button>
                )}
              </YStack>
            </XStack>
          </YStack>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Family Space Section */}
          <Card 
            marginBottom="$5" 
            elevate 
            borderWidth={1}
            borderColor="$gray6"
          >
            <Text 
              paddingHorizontal="$4" 
              paddingTop="$4" 
              paddingBottom="$3" 
              fontWeight="$7" 
              color="$gray11" 
              fontSize="$3"
            >
              FAMILY
            </Text>
            <Separator />

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
                  <Text fontWeight="$6" fontSize="$3">Family Spaces</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Personal Finance Section */}
          <Card 
            marginBottom="$5" 
            elevate 
            borderWidth={1}
            borderColor="$gray6"
          >
            <Text 
              paddingHorizontal="$4" 
              paddingTop="$4" 
              paddingBottom="$3" 
              fontWeight="$7" 
              color="$gray11" 
              fontSize="$3"
            >
              FINANCE
            </Text>
            <Separator />

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
                  <Text fontWeight="$6" fontSize="$3">My Budgets</Text>
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
                  <Text fontWeight="$6" fontSize="$3">Export Data</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Settings Section */}
          <Card 
            marginBottom="$5" 
            elevate 
            borderWidth={1}
            borderColor="$gray6"
          >
            <Text 
              paddingHorizontal="$4" 
              paddingTop="$4" 
              paddingBottom="$3" 
              fontWeight="$7" 
              color="$gray11" 
              fontSize="$3"
            >
              SETTINGS
            </Text>
            <Separator  />

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
                  <Text fontWeight="$6" fontSize="$3">App Settings</Text>
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
                  <Text fontWeight="$6" fontSize="$3">Notifications</Text>
                </XStack>
                <ChevronRight size={20} color="#9CA3AF" />
              </XStack>
            </Button>
          </Card>

          {/* Logout Button (only if logged in) */}
          {isLoggedIn && (
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
                <Text fontWeight="$6" color="#EF4444" fontSize="$3">Logout</Text>
              </XStack>
            </Button>
          )}

          <Button
            onPress={() => installQuickScreenshotBillShortcut()}
          >
            Install Quick Screenshot Shortcut
          </Button>
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
