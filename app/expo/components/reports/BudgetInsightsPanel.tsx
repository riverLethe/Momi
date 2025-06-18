import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { YStack, XStack, Text, Button, Separator, Card, Spinner } from "tamagui";
import { formatCurrency as fmtCurrency } from "@/utils/format";
import {
  Insight,
  HealthScoreDetail,
  DatePeriodEnum,
} from "@/types/reports.types";
import type { Bill } from "@/types/bills.types";
import type { Budgets } from "@/utils/budget.utils";
import InsightsSectionList from "@/components/reports/InsightsSectionList";
import BudgetHealthCard from "@/components/reports/BudgetHealthCard";
import { summariseBills } from "@/utils/abi-summary.utils";
import { computeHealthScore } from "@/utils/health-score.utils";
import { useAbiReport } from "@/hooks/reports/useAbiReport";

interface BudgetOverview {
  amount: number | null;
  spent: number;
  remaining: number;
  percentage: number;
  status: "good" | "warning" | "danger" | "none";
}

interface BudgetInsightsPanelProps {
  budget: BudgetOverview | undefined;
  bills: Bill[];
  budgets: Budgets;
  periodType: DatePeriodEnum;
  periodStart?: Date; // may be undefined on first render
  periodEnd?: Date;
  onSetBudget: () => void;
}

const BudgetInsightsPanel: React.FC<BudgetInsightsPanelProps> = ({
  budget,
  bills,
  budgets,
  periodType,
  periodStart,
  periodEnd,
  onSetBudget,
}) => {
  const { t } = useTranslation();

  // Build summary only when all inputs ready
  const summary = useMemo(() => {
    if (!periodStart || !periodEnd) return null;
    return summariseBills(bills, budgets, periodType, periodStart, periodEnd, 0);
  }, [bills, budgets, periodType, periodStart, periodEnd]);

  const {
    data: abiData,
    loading: abiLoading,
    refresh,
  } = useAbiReport(
    summary
      ? {
        summary,
      }
      : {
        summary: {
          period: "weekly",
          startDate: "",
          endDate: "",
          coreTotals: { totalExpense: 0 },
          budgetUtilisation: { categoryUtil: [] },
          volatility: {
            dailyExpenses: [],
            volatilityPct: 0,
            dailyStats: {
              mean: 0,
              median: 0,
              max: 0,
              min: 0,
              p90: 0,
            },
            topSpendDays: [],
          },
          categoryMomentum: [],
          recurring: { recurringCoverDays: 0 },
        } as any,
      }
  );

  const insights: Insight[] = (abiData?.insights || []).map((ins: any) => ({
    id: ins.id,
    title: ins.title,
    description: ins.description,
    type:
      ins.severity === "critical"
        ? "negative"
        : ins.severity === "warn"
          ? "neutral"
          : "positive",
    severity: ins.severity,
    recommendedAction: ins.recommendedAction,
  }));

  const healthScore: HealthScoreDetail | undefined = summary
    ? (computeHealthScore(summary) as HealthScoreDetail)
    : undefined;

  // Determine colour severity to keep consistent with overall health
  const barSeverity: "danger" | "warning" | "good" = healthScore
    ? healthScore.status === "Danger"
      ? "danger"
      : healthScore.status === "Warning"
        ? "warning"
        : "good"
    : budget?.status === "danger"
      ? "danger"
      : budget?.status === "warning"
        ? "warning"
        : "good";

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
    <Card paddingVertical="$4" backgroundColor="white" borderRadius="$4" gap="$4">
      {/* Header with Refresh */}
      {refresh && (
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
          <Text fontSize="$3" fontWeight="$7" color="$gray12">
            {t("Budget Overview")}
          </Text>
          <Button
            size="$2"
            backgroundColor="$blue9"
            color="white"
            disabled={abiLoading}
            pressStyle={{ opacity: 0.8 }}
            onPress={refresh}
          >
            {abiLoading ? t("Refreshing...") : t("Refresh insights")}
          </Button>
        </XStack>
      )}

      {/* Unified Budget + Health Card */}
      <BudgetHealthCard budget={budget} health={healthScore} />

      {/* Insights */}
      {abiLoading && !abiData ? (
        <YStack alignItems="center" paddingVertical="$3">
          <Spinner color="$blue9" />
        </YStack>
      ) : (
        <InsightsSectionList insights={insights} />
      )}

    </Card>
  );
};

export default BudgetInsightsPanel; 