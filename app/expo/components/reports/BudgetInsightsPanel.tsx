import React from "react";
import { useTranslation } from "react-i18next";
import { YStack, XStack, Text, Button, Separator, Card, Progress } from "tamagui";
import { formatCurrency as fmtCurrency } from "@/utils/format";
import { Insight, HealthScore } from "@/types/reports.types";
import FinancialInsights from "@/components/reports/FinancialInsights";
import FinancialHealthScore from "@/components/reports/FinancialHealthScore";

interface BudgetOverview {
  amount: number | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "danger" | "none";
}

interface BudgetInsightsPanelProps {
  budget: BudgetOverview | undefined;
  insights: Insight[];
  healthScore: HealthScore;
  onSetBudget: () => void;
}

const BudgetInsightsPanel: React.FC<BudgetInsightsPanelProps> = ({
  budget,
  insights,
  healthScore,
  onSetBudget,
}) => {
  const { t } = useTranslation();

  if (!budget || budget.amount == null) {
    return (
      <YStack alignItems="center" paddingVertical="$4" gap="$3">
        <Text fontSize="$4" fontWeight="$6" color="$gray11" textAlign="center">
          {t("Set up a budget for this period to unlock detailed insights")}
        </Text>
        <Button
          size="$3"
          backgroundColor="$blue9"
          color="white"
          pressStyle={{ opacity: 0.8 }}
          onPress={onSetBudget}
        >
          {t("Set Budget")}
        </Button>
      </YStack>
    );
  }

  // Helper format

  return (
    <Card padding="$4" backgroundColor="white" borderRadius="$4" gap="$4">
      {/* Budget Summary */}
      <YStack gap="$2">
      <Text fontSize="$3.5" fontWeight="$7" marginBottom="$3" color="$gray12">
        {t("Budget Overview")}
      </Text>

        {/* Progress */}
        <Progress value={budget.percentage} backgroundColor="$gray4" height={10} borderRadius={5}>
          <Progress.Indicator animation="bouncy" backgroundColor="$blue9" borderRadius={5} />
        </Progress>

        {/* Figures */}
        <XStack justifyContent="space-between" marginTop="$2">
          <YStack>
            <Text color="$gray10">{t("Budget")}</Text>
            <Text fontWeight="$7">{fmtCurrency(budget.amount)}</Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text color="$gray10">{t("Spent")}</Text>
            <Text fontWeight="$7">{fmtCurrency(budget.spent)}</Text>
          </YStack>
        </XStack>

        <XStack justifyContent="space-between" marginTop="$1">
          <YStack>
            <Text color="$gray10">{t("Remaining")}</Text>
            <Text fontWeight="$6" color={budget.remaining > 0 ? "$green9" : "$red9"}>{fmtCurrency(budget.remaining)}</Text>
          </YStack>
          <YStack alignItems="flex-end">
            <Text color="$gray10">{t("Used")}</Text>
            <Text fontWeight="$6">{budget.percentage.toFixed(1)}%</Text>
          </YStack>
        </XStack>
      </YStack>

      <Separator marginVertical="$2" borderColor="$gray3" />

      {/* Insights */}
      <FinancialInsights insights={insights} />


      <Separator marginVertical="$2" borderColor="$gray3" />

      {/* Health Score */}
      <FinancialHealthScore healthScore={healthScore} />

    </Card>
  );
};

export default BudgetInsightsPanel; 