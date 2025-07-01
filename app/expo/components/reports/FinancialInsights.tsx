import React from "react";
import { useTranslation } from "react-i18next";
import { Card, XStack, YStack, Text, Circle } from "tamagui";
import {
  Info,
  SirenIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
} from "lucide-react-native";
import { Insight } from "@/types/reports.types";

interface FinancialInsightsProps {
  insights: Insight[];
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ insights }) => {
  const { t } = useTranslation();

  /**
   * Return an icon that visually represents the given severity level.
   * - critical  -> red downward trend (severe negative impact)
   * - warn      -> yellow warning triangle (potential risk)
   * - info      -> blue info icon (neutral / informational)
   * - undefined -> green upward trend (positive or neutral)
   */
  const getIcon = (severity?: "info" | "warn" | "critical") => {
    switch (severity) {
      case "critical":
        return <ThumbsDownIcon size={16} color="#EF4444" />; // red
      case "warn":
        return <SirenIcon size={16} color="#F59E0B" />; // yellow
      case "info":
        return <Info size={16} color="#3B82F6" />; // blue
      default:
        return <ThumbsUpIcon size={16} color="#10B981" />; // green
    }
  };

  return (
    <Card
      borderRadius="$4"
      overflow="hidden"
      elevation={0.5}
      backgroundColor="$card"
      padding="$2"
      width="100%"
    >

      <YStack gap="$3" >
        {insights.map((insight, index) => (
          <XStack key={index} gap="$3" alignItems="center" width="100%">
            <YStack flex={1} gap="$2" flexShrink={1}>
              <XStack alignItems="center" gap="$1">

                <Circle
                  size="$2"
                >
                  {getIcon(insight.severity)}
                </Circle>
                <Text fontSize="$3" fontWeight="$6" color="$gray12" flexShrink={1}>
                  {t(insight.title)}
                </Text>
              </XStack>
              <Text fontSize="$2" color="$gray10" flexShrink={1}>
                {t(insight.description)}
              </Text>
              {insight.recommendedAction && (
                <Text fontSize="$2" color="$blue9" flexShrink={1}>
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
