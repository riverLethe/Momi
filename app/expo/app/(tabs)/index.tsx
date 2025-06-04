import React from "react";
import { ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, Plus, ChevronRight } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Avatar, 
  Circle, 
  Separator 
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace, setViewMode } = useViewStore();
  const { isLoggedIn, user } = useAuth();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <XStack alignItems="center" justifyContent="space-between" paddingHorizontal="$4" paddingVertical="$2">
        <XStack alignItems="center">
          <Avatar circular size="$4" marginRight="$2">
            <Avatar.Image accessibilityLabel="User avatar" />
            <Avatar.Fallback backgroundColor="$gray5" />
          </Avatar>
          <Text fontSize="$5" fontWeight="$6">
            {isLoggedIn ? user?.username : "Guest"}
          </Text>
        </XStack>

        <XStack alignItems="center">
          <Button
            size="$3"
            marginRight="$2"
            backgroundColor="$gray3"
            borderRadius="$10"
            onPress={toggleViewMode}
          >
            <Text fontSize="$4" fontWeight="$6">
              {viewMode === "personal"
                ? "Personal"
                : currentFamilySpace?.name || "Family"}
            </Text>
          </Button>

          <Button size="$3" circular chromeless onPress={() => {}}>
            <Bell size={24} color="#1F2937" />
          </Button>
        </XStack>
      </XStack>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Financial Summary Card */}
        <Card marginTop="$4" padding="$4" bordered elevate>
          <Text fontSize="$5" fontWeight="$7" marginBottom="$2">
            {viewMode === "personal" ? "My Summary" : "Family Summary"}
          </Text>
          <XStack justifyContent="space-between" marginBottom="$2">
            <YStack>
              <Text color="$gray10">This Month</Text>
              <Text fontSize="$7" fontWeight="$8">¥2,580</Text>
            </YStack>
            <YStack>
              <Text color="$gray10">Balance</Text>
              <Text fontSize="$7" fontWeight="$8" color="$green10">¥12,350</Text>
            </YStack>
          </XStack>
        </Card>

        {/* Quick Actions */}
        <XStack justifyContent="space-between" marginTop="$6">
          <Button
            flex={1}
            marginRight="$2"
            backgroundColor="$blue9"
            color="white"
            size="$4"
            borderRadius="$4"
            onPress={() => router.push("/bills/chat")}
          >
            <Text color="white" fontWeight="$6">
              AI Record
            </Text>
          </Button>

          <Button
            flex={1}
            marginLeft="$2"
            backgroundColor="$purple9"
            color="white"
            size="$4"
            borderRadius="$4"
            onPress={() => router.push("/bills/add")}
          >
            <Text color="white" fontWeight="$6">
              Manual Record
            </Text>
          </Button>
        </XStack>

        {/* Recent Transactions */}
        <YStack marginTop="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
            <Text fontSize="$5" fontWeight="$7">Recent Bills</Text>
            <Button
              chromeless
              onPress={() => router.push("/bills")}
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center">
                <Text color="$blue9" marginRight="$1">View All</Text>
                <ChevronRight size={16} color="#3B82F6" />
              </XStack>
            </Button>
          </XStack>

          {/* Example transactions */}
          {[1, 2, 3].map((item) => (
            <Card
              key={item}
              marginBottom="$3"
              padding="$4"
              bordered
              pressStyle={{ scale: 0.98 }}
              onPress={() => router.push("/bills/add")}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <XStack alignItems="center">
                  <Circle size="$4" backgroundColor="$gray3" marginRight="$3">
                    <Text>🛒</Text>
                  </Circle>
                  <YStack>
                    <Text fontWeight="$6">Groceries</Text>
                    <Text color="$gray10" fontSize="$2">Today, 14:30</Text>
                  </YStack>
                </XStack>
                <Text fontWeight="$6">-¥128.50</Text>
              </XStack>
            </Card>
          ))}
        </YStack>

        {/* Spending Analysis Preview */}
        <YStack marginTop="$4" marginBottom="$8">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
            <Text fontSize="$5" fontWeight="$7">Spending Analysis</Text>
            <Button
              chromeless
              onPress={() => router.push("/reports")}
              pressStyle={{ opacity: 0.7 }}
            >
              <XStack alignItems="center">
                <Text color="$blue9" marginRight="$1">Details</Text>
                <ChevronRight size={16} color="#3B82F6" />
              </XStack>
            </Button>
          </XStack>

          <Card padding="$4" bordered elevate>
            <Text textAlign="center" marginBottom="$4">Top Categories</Text>
            <XStack justifyContent="space-around">
              <YStack alignItems="center">
                <Circle size="$6" backgroundColor="$blue3" marginBottom="$2">
                  <Text fontSize="$5">🍔</Text>
                </Circle>
                <Text>Food</Text>
                <Text fontWeight="$6">¥850</Text>
              </YStack>
              <YStack alignItems="center">
                <Circle size="$6" backgroundColor="$green3" marginBottom="$2">
                  <Text fontSize="$5">🚗</Text>
                </Circle>
                <Text>Transport</Text>
                <Text fontWeight="$6">¥650</Text>
              </YStack>
              <YStack alignItems="center">
                <Circle size="$6" backgroundColor="$purple3" marginBottom="$2">
                  <Text fontSize="$5">🛍️</Text>
                </Circle>
                <Text>Shopping</Text>
                <Text fontWeight="$6">¥450</Text>
              </YStack>
            </XStack>
          </Card>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
