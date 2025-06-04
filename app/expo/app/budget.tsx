import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Button, H2, Text, View, XStack, YStack } from "tamagui";

export default function BudgetScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1} padding="$4">
        <XStack alignItems="center" marginBottom="$4">
          <Button
            size="$3"
            circular
            icon={<ArrowLeft size={24} color="#000" />}
            onPress={() => router.back()}
          />
          <H2 marginLeft="$2">My Budgets</H2>
        </XStack>

        <View flex={1} justifyContent="center" alignItems="center">
          <Text fontSize="$6" color="$gray9">Budget management coming soon</Text>
        </View>
      </YStack>
    </SafeAreaView>
  );
} 