import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Button, H2, Text, View, XStack, YStack, useTheme } from "tamagui";
import { useTranslation } from "react-i18next";

export default function BudgetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} padding="$4" backgroundColor="$background">
        <XStack alignItems="center" marginBottom="$4">
          <Button
            size="$3"
            circular
            icon={<ArrowLeft size={24} color={theme.color?.get()} />}
            onPress={() => router.back()}
          />
          <H2 marginLeft="$2" color="$color">{t("My Budgets")}</H2>
        </XStack>

        <View flex={1} justifyContent="center" alignItems="center">
          <Text fontSize="$6" color="$color9">{t("Budget management coming soon")}</Text>
        </View>
      </YStack>
    </SafeAreaView>
  );
} 