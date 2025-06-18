import React, { useState, useEffect } from "react";
import { ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { YStack, Text, Separator } from "tamagui";

// Components
import DateFilter from "@/components/reports/DateFilter";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import EmptyState from "@/components/reports/EmptyState";
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import BudgetInsightsPanel from "@/components/reports/BudgetInsightsPanel";

// Hooks, Stores & Providers
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";

// Types & Utils
import {
  DatePeriodEnum,
  PeriodSelectorData,
  ReportData,
} from "@/types/reports.types";
import { fetchReportData } from "@/utils/reports.utils";
import { syncRemoteData } from "@/utils/sync.utils";
import { Budgets, BudgetPeriod } from "@/utils/budget.utils";

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const { refreshData, bills, transactions } = useData();
  const { budgets, saveBudgetForPeriod } = useBudgets();
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);

  // State
  const [loading, setLoading] = useState(true);
  const [syncingRemote, setSyncingRemote] = useState(false);
  const [periodType, setPeriodType] = useState<DatePeriodEnum>(
    DatePeriodEnum.WEEK
  );
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>(
    []
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const currentSelector = periodSelectors.find((p) => p.id === selectedPeriodId);

  // Check if family mode is accessible
  useEffect(() => {
    if (viewMode === "family" && !isAuthenticated) {
      // If trying to view family reports but not logged in
      useViewStore.getState().setViewMode("personal");
    }
  }, [viewMode, isAuthenticated]);

  // Sync with remote data if authenticated
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user) {
        try {
          setSyncingRemote(true);
          // 在实际应用中，这里会从远程API获取数据并更新本地存储
          await syncRemoteData("reports", user.id);
          // 刷新本地数据
          await refreshData();
        } catch (error) {
          console.error("Failed to sync remote data:", error);
        } finally {
          setSyncingRemote(false);
        }
      }
    };

    syncData();
  }, [isAuthenticated, user]);

  // Load data when parameters change or when bills/transactions data changes
  useEffect(() => {
    loadReportData();
  }, [viewMode, periodType, selectedPeriodId, bills, transactions]);

  // Load report data
  const loadReportData = async () => {
    setLoading(true);

    try {
      // 始终使用最新的实际数据生成报表
      const data = await fetchReportData(
        periodType,
        viewMode,
        selectedPeriodId
      );

      setPeriodSelectors(data.periodSelectors || []);

      // If no selected period yet, select the first one
      if (
        !selectedPeriodId &&
        data.periodSelectors &&
        data.periodSelectors.length > 0
      ) {
        setSelectedPeriodId(data.periodSelectors[0].id);
      }

      setReportData(data);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle period type change
  const handlePeriodTypeChange = (newPeriodType: DatePeriodEnum) => {
    setPeriodType(newPeriodType);
    setSelectedPeriodId(""); // Reset selected period
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshData(); // 刷新本地数据
    await loadReportData(); // 重新生成报表
  };

  // Handler to save budgets (reuse from home, simplified)
  const handleSaveBudgets = async (next: Budgets) => {
    const pList: BudgetPeriod[] = ["weekly", "monthly", "yearly"];
    for (const p of pList) {
      await saveBudgetForPeriod(p, next[p] || {});
    }
    setBudgetModalOpen(false);

    // Update local reportData budget section only (avoid full reload)
    if (reportData) {
      const map: Record<BudgetPeriod, "weekly" | "monthly" | "yearly"> = {
        weekly: "weekly",
        monthly: "monthly",
        yearly: "yearly",
      } as const;

      const periodBudgetDetail = next[map[periodType === DatePeriodEnum.WEEK ? "weekly" : periodType === DatePeriodEnum.MONTH ? "monthly" : "yearly"]] as any;

      if (periodBudgetDetail) {
        const spentTotal = (reportData.categoryData || []).reduce((s, c) => s + c.value, 0);
        const amount = periodBudgetDetail.amount;
        const remaining = amount ? Math.max(0, amount - spentTotal) : 0;
        const percentage = amount ? Math.min((spentTotal / amount) * 100, 100) : 0;
        let status: "good" | "warning" | "danger" | "none" = "none";
        if (amount == null) status = "none";
        else if (percentage >= 90) status = "danger";
        else if (percentage >= 70) status = "warning";
        else status = "good";

        setReportData((prev) => prev ? { ...prev, budget: { amount, spent: spentTotal, remaining, percentage, status } } : prev);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <YStack flex={1}>
        {/* Header */}
        {/* <AppHeader /> */}

        {/* Date & Comparison Filters */}
        {bills.length > 0 && (
          <YStack
            marginHorizontal="$2"
            marginTop="$3.5"
            marginBottom="$3.5"
            backgroundColor="$gray2"
            borderRadius="$4"
            padding="$1"
          >
            <DateFilter
              selectedPeriod={periodType}
              onPeriodChange={handlePeriodTypeChange}
              periodSelectors={periodSelectors}
              selectedPeriodId={selectedPeriodId}
              onPeriodSelectorChange={setSelectedPeriodId}
            />
          </YStack>
        )}

        {/* Content */}
        {loading || syncingRemote ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text marginTop="$4" color="$gray10">
              {t("Loading reports")}
            </Text>
          </YStack>
        ) : bills.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                colors={["#3B82F6"]}
              />
            }
          >
            {/* Category Distribution (Donut Chart) */}
            <YStack paddingTop="$1">
              <EnhancedDonutChart
                data={reportData?.categoryData || []}
                topSpendingCategories={reportData?.topSpendingCategories}
              />
            </YStack>
            <Separator marginVertical="$2" borderColor="$gray3" />

            {/* Expense Trend Chart */}
            <YStack paddingTop="$1">
              <ExpenseTrendChart
                data={reportData?.trendData || []}
                averageSpending={reportData?.averageSpending || 0}
              />
            </YStack>
            <Separator marginVertical="$2" borderColor="$gray3" />

            {/* Budget Insights Panel */}
            <BudgetInsightsPanel
              budget={reportData?.budget}
              bills={bills}
              budgets={budgets}
              periodType={periodType}
              periodStart={currentSelector?.startDate}
              periodEnd={currentSelector?.endDate}
              onSetBudget={() => setBudgetModalOpen(true)}
            />
          </ScrollView>
        )}

        {/* Budget Modal */}
        <BudgetUpdateModal
          isOpen={isBudgetModalOpen}
          onOpenChange={setBudgetModalOpen}
          budgets={budgets}
          onSave={handleSaveBudgets}
          defaultPeriod={periodType === DatePeriodEnum.WEEK ? "weekly" : periodType === DatePeriodEnum.MONTH ? "monthly" : "yearly"}
        />
      </YStack>
    </SafeAreaView>
  );
}
