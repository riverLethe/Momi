import React from "react";
import { useTranslation } from "react-i18next";
import { 
  Card, 
  XStack, 
  YStack, 
  Text, 
  Circle 
} from "tamagui";
import { 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight 
} from "lucide-react-native";
import { FinancialInsight } from "@/types/reports.types";

interface FinancialInsightsProps {
  insights: FinancialInsight[];
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ insights }) => {
  const { t } = useTranslation();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "trending-up":
        return <TrendingUp size={16} color="#3B82F6" />;
      case "check-circle":
        return <CheckCircle size={16} color="#10B981" />;
      case "alert-triangle":
        return <AlertTriangle size={16} color="#F59E0B" />;
      default:
        return <ArrowRight size={16} color="#3B82F6" />;
    }
  };

  return (
    <Card 
      padding="$4" 
      borderRadius="$4" 
      backgroundColor="white" 
      marginBottom="$4"
      shadowColor="rgba(0,0,0,0.05)"
      shadowRadius={2}
      shadowOffset={{ width: 0, height: 1 }}
      elevation={1}
    >
      <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Financial Insights")}
      </Text>
      
      <YStack space="$3.5">
        {insights.map((insight, index) => (
          <XStack key={index} space="$3" alignItems="center">
            <Circle 
              size="$3.5" 
              backgroundColor={insight.backgroundColor}
            >
              {getIcon(insight.icon)}
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