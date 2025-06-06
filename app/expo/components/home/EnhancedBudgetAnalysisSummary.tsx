import React from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { AlertTriangle, CheckCircle, ArrowRight, Gauge } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Circle,
  Separator,
  Progress,
} from "tamagui";

export interface BudgetStatus {
  status: "excellent" | "good" | "warning" | "critical";
  remaining: number;
  total: number;
  percentage: number;
}

export interface CategoryAnalysis {
  id: string;
  label: string;
  status: "save" | "normal" | "exceeding";
  percentage: number;
  amount: number;
}

interface EnhancedBudgetAnalysisSummaryProps {
  budgetStatus: BudgetStatus;
  categoryAnalysis: CategoryAnalysis[];
  isPersonalView?: boolean;
  currency?: string;
  period: "weekly" | "monthly" | "yearly";
  onManageBudgetPress?: () => void;
}

export const EnhancedBudgetAnalysisSummary: React.FC<EnhancedBudgetAnalysisSummaryProps> = ({
  budgetStatus,
  categoryAnalysis,
  isPersonalView = true,
  currency = "¥",
  period,
  onManageBudgetPress
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  const formatCurrency = (amount: number): string => {
    return `${currency}${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "$green9";
      case "good":
        return "$blue9";
      case "warning":
        return "$amber9";
      case "critical":
        return "$red9";
      default:
        return "$gray9";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
      case "good":
        return <CheckCircle size={18} color={status === "excellent" ? "#10B981" : "#3B82F6"} />;
      case "warning":
      case "critical":
        return <AlertTriangle size={18} color={status === "warning" ? "#F59E0B" : "#EF4444"} />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return t("Excellent");
      case "good":
        return t("On Track");
      case "warning":
        return t("Caution");
      case "critical":
        return t("Critical");
      default:
        return t("Unknown");
    }
  };

  const getCategoryStatusColor = (status: string) => {
    switch (status) {
      case "save":
        return "$green9";
      case "normal":
        return "$blue9";
      case "exceeding":
        return "$red9";
      default:
        return "$gray9";
    }
  };

  const getCategoryStatusIcon = (status: string) => {
    switch (status) {
      case "save":
        return <Circle size={8} backgroundColor="#10B981" />;
      case "normal":
        return <Circle size={8} backgroundColor="#3B82F6" />;
      case "exceeding":
        return <Circle size={8} backgroundColor="#EF4444" />;
      default:
        return null;
    }
  };

  const percentUsed = 100 - budgetStatus.percentage;
  const progressColor = percentUsed > 80 ? "$red9" : percentUsed > 60 ? "$amber9" : "$green9";

  return (
    <Card 
      padding="$4" 
      borderRadius="$6" 
      backgroundColor="white" 
      elevate
      shadowColor="rgba(0,0,0,0.08)"
      shadowRadius={10}
      marginHorizontal="$4"
      marginBottom="$4"
    >
      <YStack space="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" fontWeight="$8" color="$gray12">
            {t("Spending Summary")}
          </Text>
          
          <XStack alignItems="center" space="$1.5" backgroundColor={getStatusColor(budgetStatus.status) + "15"} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$4">
            {getStatusIcon(budgetStatus.status)}
            <Text 
              fontWeight="$7" 
              fontSize="$2.5"
              color={getStatusColor(budgetStatus.status)}
            >
              {getStatusLabel(budgetStatus.status)}
            </Text>
          </XStack>
        </XStack>
        
        <YStack space="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" color="$gray11">{t("Remaining Budget")}</Text>
            <Text 
              fontWeight="$8" 
              fontSize="$5"
              color={getStatusColor(budgetStatus.status)}
            >
              {formatCurrency(budgetStatus.remaining)}
            </Text>
          </XStack>
          
          <YStack space="$1.5">
            <Progress value={percentUsed} backgroundColor="$gray4" height={10} borderRadius="$4">
              <Progress.Indicator animation="bouncy" backgroundColor={progressColor} />
            </Progress>
            <XStack justifyContent="space-between">
              <Text fontSize="$2" color="$gray9">
                {percentUsed.toFixed(0)}% {t("Used")}
              </Text>
              <Text fontSize="$2" color="$gray9">
                {t("Total")}: {formatCurrency(budgetStatus.total)}
              </Text>
            </XStack>
          </YStack>
        </YStack>
        
        <Separator marginVertical="$2" />
        
        <YStack>
          <Text fontSize="$3" fontWeight="$7" color="$gray12" marginBottom="$3">
            {t("Category Analysis")}
          </Text>
          
          {categoryAnalysis.map((category, index) => (
            <XStack key={category.id} justifyContent="space-between" alignItems="center" marginBottom="$2.5">
              <XStack alignItems="center" space="$2">
                {getCategoryStatusIcon(category.status)}
                <Text fontSize="$3" color="$gray11">{t(category.label)}</Text>
              </XStack>
              <Text 
                fontWeight="$6" 
                fontSize="$2.5" 
                color={getCategoryStatusColor(category.status)}
                backgroundColor={getCategoryStatusColor(category.status) + "15"}
                paddingHorizontal="$2"
                paddingVertical="$0.5"
                borderRadius="$2"
              >
                {category.status === "save" && `${t("Save Money")} ${category.percentage}%`}
                {category.status === "normal" && t("Normal")}
                {category.status === "exceeding" && `${t("Exceeding by")} ${category.percentage}%`}
              </Text>
            </XStack>
          ))}
        </YStack>
        
        <Button
          backgroundColor="$gray1"
          borderRadius="$6"
          paddingVertical="$2"
          marginTop="$2"
          hoverStyle={{ backgroundColor: "$gray2" }}
          pressStyle={{ backgroundColor: "$gray3" }}
          onPress={onManageBudgetPress || (() => router.push("/reports"))}
        >
          <XStack justifyContent="space-between" alignItems="center" width="100%">
            <Text fontWeight="$6" fontSize="$3">
              {isPersonalView ? t("My Budget") : t("Family Budget")}
            </Text>
            <XStack alignItems="center" space="$1">
              <Text fontWeight="$7" fontSize="$3.5" color="$green9">
                {formatCurrency(budgetStatus.remaining)} {t("left")}
              </Text>
              <ArrowRight size={16} color="#10B981" />
            </XStack>
          </XStack>
        </Button>
      </YStack>
    </Card>
  );
};

export default EnhancedBudgetAnalysisSummary; 