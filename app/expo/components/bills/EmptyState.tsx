import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Text, YStack, Image } from "tamagui";

export const EmptyState = () => {
  const { viewMode } = useViewStore();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const getEmptyStateMessage = () => {
    if (viewMode === "family" && !isAuthenticated) {
      return t("Please sign in to view family expenses");
    }
    return t("Try adjusting filters or add your first expense");
  };

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
      <Card
        borderRadius="$4"
        padding="$5"
        width="90%"
        backgroundColor="white"
        elevation={2}
      >
        <YStack alignItems="center" space="$3">
          <Image
          source={require("@/assets/images/welcome-bill.png")}
          alt="No data"
          width={200}
          height={160}
          resizeMode="contain"
        />
          <Text fontSize="$5" fontWeight="$6" marginTop="$2">
            {t("No Expenses Found")}
          </Text>
          <Text textAlign="center" color="$gray10">
            {getEmptyStateMessage()}
          </Text>
        </YStack>
      </Card>
    </YStack>
  );
}; 