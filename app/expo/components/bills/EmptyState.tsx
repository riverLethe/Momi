import { useAuth } from "@/providers/AuthProvider";
import { useViewStore } from "@/stores/viewStore";
import { Calendar } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Circle, Text, YStack } from "tamagui";

export const EmptyState = () => {
  const { viewMode } = useViewStore();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();

  const getEmptyStateMessage = () => {
    if (viewMode === "family" && !isLoggedIn) {
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
          <Circle size={60} backgroundColor="$gray2">
            <Calendar size={28} color="#64748B" />
          </Circle>
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