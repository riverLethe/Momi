import React from "react";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Circle,
  Separator,
} from "tamagui";

export interface BudgetStatus {
  status: "excellent" | "good" | "warning";
  remaining: number;
  percentage: number;
}

export interface CategoryAnalysis {
  label: string;
  status: "save" | "normal" | "exceeding";
  percentage: number;
}

interface BudgetAnalysisSummaryProps {
  budgetStatus: BudgetStatus;
  categoryAnalysis: CategoryAnalysis[];
  isPersonalView?: boolean;
  onManageBudgetPress?: () => void;
}

export const BudgetAnalysisSummary: React.FC<BudgetAnalysisSummaryProps> = ({
  budgetStatus,
  categoryAnalysis,
  isPersonalView = true,
  onManageBudgetPress
}) => {
  return (
    <Card 
      padding="$4" 
      borderRadius="$4" 
      backgroundColor="white" 
      elevate
      shadowColor="rgba(0,0,0,0.08)"
      shadowRadius={4}
      marginBottom="$4"
    >
      <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
        Spending Summary
      </Text>
      
      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$gray11">Budget Status</Text>
          <XStack alignItems="center" space="$1.5">
            {budgetStatus.status === "excellent" && (
              <CheckCircle size={16} color="#10B981" />
            )}
            {budgetStatus.status === "good" && (
              <CheckCircle size={16} color="#3B82F6" />
            )}
            {budgetStatus.status === "warning" && (
              <AlertTriangle size={16} color="#F59E0B" />
            )}
            <Text 
              fontWeight="$7" 
              fontSize="$3.5"
              color={
                budgetStatus.status === "excellent" 
                  ? "$green9" 
                  : budgetStatus.status === "good" 
                    ? "$blue9" 
                    : "$amber9"
              }
            >
              {budgetStatus.status === "excellent" 
                ? "Excellent" 
                : budgetStatus.status === "good" 
                  ? "On Track" 
                  : "Caution"}
            </Text>
          </XStack>
        </XStack>
        
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$3" color="$gray11">Remaining Budget</Text>
          <Text 
            fontWeight="$7" 
            fontSize="$4"
            color={
              budgetStatus.percentage > 50 
                ? "$green9" 
                : budgetStatus.percentage > 20 
                  ? "$blue9" 
                  : "$amber9"
            }
          >
            ¥{budgetStatus.remaining}
          </Text>
        </XStack>
        
        <Separator marginVertical="$2" />
        
        <Text fontSize="$3" fontWeight="$6" color="$gray12" marginBottom="$1">
          Category Analysis
        </Text>
        
        {categoryAnalysis.map((category, index) => (
          <XStack key={index} justifyContent="space-between" alignItems="center">
            <Text fontSize="$3" color="$gray11">{category.label}</Text>
            <XStack alignItems="center" space="$1.5">
              {category.status === "save" && (
                <Text fontWeight="$6" fontSize="$3" color="$green9">
                  Save {category.percentage}%
                </Text>
              )}
              {category.status === "normal" && (
                <Text fontWeight="$6" fontSize="$3" color="$blue9">
                  Normal
                </Text>
              )}
              {category.status === "exceeding" && (
                <Text fontWeight="$6" fontSize="$3" color="$red9">
                  Exceeding by {category.percentage}%
                </Text>
              )}
            </XStack>
          </XStack>
        ))}
        
        <Button
          backgroundColor="$gray1"
          borderRadius="$3"
          paddingVertical="$2"
          marginTop="$1"
          hoverStyle={{ backgroundColor: "$gray2" }}
          pressStyle={{ backgroundColor: "$gray3" }}
          onPress={onManageBudgetPress || (() => alert("Budget management feature coming soon"))}
        >
          <XStack justifyContent="space-between" alignItems="center" width="100%">
            <Text fontWeight="$6" fontSize="$3">
              {isPersonalView ? "My Budget" : "Family Budget"}
            </Text>
            <XStack alignItems="center" space="$1">
              <Text fontWeight="$7" fontSize="$3.5" color="$green9">¥{budgetStatus.remaining} left</Text>
              <ArrowRight size={14} color="#10B981" />
            </XStack>
          </XStack>
        </Button>
      </YStack>
    </Card>
  );
};

export default BudgetAnalysisSummary; 