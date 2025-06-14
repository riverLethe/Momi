import React from "react";
import { useTranslation } from "react-i18next";
import { Card, Circle, XStack, YStack, Text, Button } from "tamagui";
import { useRouter } from "expo-router";
import { FinancialHealthScore as HealthScoreType } from "@/types/reports.types";

interface FinancialHealthScoreProps {
  healthScore: HealthScoreType;
}

const FinancialHealthScore: React.FC<FinancialHealthScoreProps> = ({
  healthScore,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card padding="$2" borderRadius="$4" backgroundColor="white">
      <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Financial Health Score")}
      </Text>

      <YStack alignItems="center" marginBottom="$3">
        <Circle
          size="$9"
          backgroundColor="$blue1"
          borderWidth={8}
          borderColor="$blue9"
        >
          <Text fontSize="$6" fontWeight="$8" color="$blue9">
            {healthScore.score}
          </Text>
        </Circle>
        <Text fontSize="$3" fontWeight="$6" color="$gray11" marginTop="$2">
          {t(healthScore.status)}
        </Text>
      </YStack>

      <YStack space="$2">
        {healthScore.categories.map(
          (
            category: {
              name: any | string | string[];
              color: any;
              value: any | string | string[];
            },
            index: any
          ) => (
            <XStack
              key={index}
              justifyContent="space-between"
              alignItems="center"
            >
              <Text fontSize="$3" color="$gray11">
                {t(category.name)}
              </Text>
              <Text fontWeight="$6" fontSize="$3" color={category.color}>
                {t(category.value)}
              </Text>
            </XStack>
          )
        )}
      </YStack>

      <Button
        backgroundColor="$blue9"
        color="white"
        size="$3"
        marginTop="$3"
        hoverStyle={{ opacity: 0.9 }}
        pressStyle={{ opacity: 0.8 }}
        onPress={() => alert("Financial health details coming soon")}
      >
        <Text color="white" fontWeight="$6">
          {t("Improve Your Score")}
        </Text>
      </Button>
    </Card>
  );
};

export default FinancialHealthScore;
