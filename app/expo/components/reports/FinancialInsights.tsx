import React from "react";
import { useTranslation } from "react-i18next";
import { Card, XStack, YStack, Text, Circle } from "tamagui";
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign,
} from "lucide-react-native";
import { Insight } from "@/types/reports.types";

interface FinancialInsightsProps {
  insights: Insight[];
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ insights }) => {
  const { t } = useTranslation();

  const getIcon = (severity: string | undefined) => {
    switch (severity) {
      case "critical":
        return <TrendingDown size={16} color="#EF4444" />;
      case "warn":
        return <AlertTriangle size={16} color="#F59E0B" />;
      default:
        return <TrendingUp size={16} color="#10B981" />;
    }
  };

  return (
    <Card
      padding="$2"
      borderRadius="$4"
      backgroundColor="white"
      marginBottom="$4"
    >
      <Text fontSize="$3" fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Financial Insights")}
      </Text>

      <YStack gap="$3">
        {insights.map((insight, index) => (
          <XStack key={index} gap="$3" alignItems="center">
            <Circle
              size="$3"
              backgroundColor={
                insight.severity === "critical"
                  ? "#FEF2F2"
                  : insight.severity === "warn"
                    ? "#FFFBEB"
                    : "#ECFDF5"
              }
            >
              {getIcon(insight.severity)}
            </Circle>
            <YStack flex={1} gap="$2">
              <Text fontSize="$3" fontWeight="$6" color="$gray12">
                {t(insight.title)}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {t(insight.description)}
              </Text>
              {insight.recommendedAction && (
                <Text fontSize="$2" color="$blue9">
                  {t("Action: ") + t(insight.recommendedAction)}
                </Text>
              )}
            </YStack>
          </XStack>
        ))}
      </YStack>
    </Card>
  );
};

export default FinancialInsights;
