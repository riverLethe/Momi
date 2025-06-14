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

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "positive":
        return <TrendingUp size={16} color="#10B981" />;
      case "negative":
        return <TrendingDown size={16} color="#EF4444" />;
      default:
        return <DollarSign size={16} color="#3B82F6" />;
    }
  };

  return (
    <Card
      padding="$2"
      borderRadius="$4"
      backgroundColor="white"
      marginBottom="$4"
    >
      <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Financial Insights")}
      </Text>

      <YStack space="$3.5">
        {insights.map((insight, index) => (
          <XStack key={index} space="$3" alignItems="center">
            <Circle
              size="$3.5"
              backgroundColor={
                insight.type === "positive"
                  ? "#ECFDF5"
                  : insight.type === "negative"
                    ? "#FEF2F2"
                    : "#EBF5FF"
              }
            >
              {getIcon(insight.type)}
            </Circle>
            <YStack flex={1}>
              <Text fontSize="$3" fontWeight="$6" color="$gray12">
                {t(insight.title)}
              </Text>
              <Text fontSize="$2.5" color="$gray10">
                {t(insight.description)}
              </Text>
            </YStack>
          </XStack>
        ))}
      </YStack>
    </Card>
  );
};

export default FinancialInsights;
