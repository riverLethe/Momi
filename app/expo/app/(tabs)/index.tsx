import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { YStack, Text } from "tamagui";
import { format } from "date-fns";
import { Gesture, GestureDetector, Directions } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

// Stores & Providers -------------------------------------------------------
import { useViewStore } from "@/stores/viewStore";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";

// New hooks (logic extracted) ---------------------------------------------
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useReportData } from "@/hooks/useReportData";
import { useSpendingWidgetSync } from "@/hooks/useSpendingWidgetSync";
import { useBudgetWidgetSync } from "@/hooks/useBudgetWidgetSync";

// UI Components ------------------------------------------------------------
import DateFilter from "@/components/reports/DateFilter";
import BudgetSummaryCard from "@/components/home/BudgetSummaryCard";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import RecentBillsList from "@/components/home/RecentBillsList";
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Utils & Types ------------------------------------------------------------
import { BudgetPeriod, Budgets } from "@/utils/budget.utils";
import { DatePeriodEnum } from "@/types/reports.types";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const { t } = useTranslation();

  // Data -------------------------------------------------------------------
  const { bills, transactions, refreshData } =
    useData();
  const { budgets, saveBudgetForPeriod } = useBudgets();

  // Reports & Period management -------------------------------------------
  const {
    periodType,
    handlePeriodTypeChange,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId,
    reportData,
    loadingReport,
    refreshReport,
    isChangingPeriodType
  } = useReportData(viewMode);

  // Category filters -------------------------------------------------------
  const {
    includedCategories,
    excludedCategories,
  } = useCategoryFilters(periodType, budgets);

  // Budget status & categories --------------------------------------------
  const { budgetStatus, categories } = useBudgetStatus({
    bills,
    transactions,
    periodType,
    budgets,
    includedCategories,
    excludedCategories,
    periodStart: periodSelectors.find((p) => p.id === selectedPeriodId)?.startDate,
    periodEnd: periodSelectors.find((p) => p.id === selectedPeriodId)?.endDate,
  });

  // Local UI states --------------------------------------------------------
  const hasBills = bills.length > 0 || transactions.length > 0;
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);

  // Determine if pull-to-refresh spinner is active
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ------------------------------- Actions ------------------------------- */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    await refreshReport();
    setIsRefreshing(false);
  };

  const handleSaveBudgets = async (nextBudgets: Budgets) => {
    setSavingBudget(true);
    try {
      const periods: BudgetPeriod[] = ["weekly", "monthly", "yearly"];

      // Persist every period's budget detail
      for (const p of periods) {
        const detail = nextBudgets[p as keyof Budgets];
        if (detail) {
          await saveBudgetForPeriod(p, detail);
        }
      }

      // Refresh statistics so UI reflects latest budgets & filters
      await refreshReport();
    } catch (error) {
      console.error("Failed to save budgets:", error);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleStartChat = () => router.push("/chat");
  const handleBudgetFinancialInsights = () => {
    router.push(`/chat?insightsPeriod=${periodType}&ts=${Date.now()}`);
  };

  const currentSelector = periodSelectors.find((p) => p.id === selectedPeriodId);

  /* --------------------------- Category navigation --------------------------- */
  const handleCategoryPress = (categoryId: string) => {
    const start = currentSelector?.startDate;
    const end = currentSelector?.endDate;

    // Build params object compatible with expo-router typed navigation
    const params: Record<string, string> = {
      category: categoryId,
    };
    if (start) params.startDate = format(start, "yyyy-MM-dd");
    if (end) params.endDate = format(end, "yyyy-MM-dd");

    router.push({ pathname: "/bills", params });
  };

  // Sync iOS spending widgets
  useSpendingWidgetSync(reportData, periodType, viewMode);

  // Sync iOS budget widgets
  useBudgetWidgetSync(reportData, periodType, viewMode);

  /* --------------------------- Swipe gestures --------------------------- */
  const periodOrder = [
    DatePeriodEnum.WEEK,
    DatePeriodEnum.MONTH,
    DatePeriodEnum.YEAR,
  ];

  // Navigate to the next period (week → month → year → week ...)
  const goNextPeriod = () => {
    const currentIdx = periodOrder.indexOf(periodType);
    const nextIdx = (currentIdx + 1) % periodOrder.length;
    handlePeriodTypeChange(periodOrder[nextIdx]);
  };

  // Navigate to the previous period (reverse order)
  const goPrevPeriod = () => {
    const currentIdx = periodOrder.indexOf(periodType);
    const prevIdx = (currentIdx - 1 + periodOrder.length) % periodOrder.length;
    handlePeriodTypeChange(periodOrder[prevIdx]);
  };

  // Define fling gestures for left / right
  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onEnd(() => {
      "worklet";
      // Call JS handler on the JS thread to prevent RNGH warning
      runOnJS(goNextPeriod)();
    });

  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onEnd(() => {
      "worklet";
      runOnJS(goPrevPeriod)();
    });

  const swipeGesture = Gesture.Simultaneous(swipeLeft, swipeRight);

  // 优化加载体验 - 只在首次加载或刷新时显示完整加载状态
  const shouldShowFullLoading = loadingReport && !isChangingPeriodType && !reportData;
  const shouldShowMinimalLoading = loadingReport && isChangingPeriodType;

  const mainContent = hasBills ? (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#eee" }}>
      <YStack flex={1}>
        {/* Header filter */}
        <YStack marginHorizontal="$2" marginBottom="$2" padding="$1">
          <DateFilter
            selectedPeriod={periodType}
            onPeriodChange={handlePeriodTypeChange}
            periodSelectors={periodSelectors}
            selectedPeriodId={selectedPeriodId}
            onPeriodSelectorChange={setSelectedPeriodId}
            onBillsPress={() => router.push("/bills")}
          />
        </YStack>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
            />
          }
        >
          {/* 改进加载状态显示 */}
          {shouldShowFullLoading ? (
            <YStack alignItems="center" justifyContent="center" paddingVertical="$4">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text marginTop="$2">{t("Loading...")}</Text>
            </YStack>
          ) : (
            <YStack gap="$3" opacity={shouldShowMinimalLoading ? 0.7 : 1}>
              <BudgetSummaryCard
                budgetStatus={budgetStatus}
                categories={categories}
                isLoading={savingBudget}
                budgets={{
                  weekly: budgets.weekly?.amount ?? null,
                  monthly: budgets.monthly?.amount ?? null,
                  yearly: budgets.yearly?.amount ?? null,
                }}
                onEditBudgetPress={() => setBudgetModalOpen(true)}
                onCategoryPress={handleCategoryPress}
                overviewBudget={reportData?.budget}
                bills={bills}
                budgetsDetail={budgets}
                periodType={periodType}
                periodStart={currentSelector?.startDate}
                periodEnd={currentSelector?.endDate}
                onSetBudget={() => setBudgetModalOpen(true)}
                onChatPress={handleBudgetFinancialInsights}
              />

              {/* 即使reportData不完整也显示图表，避免长时间白屏 */}
              {reportData ? (
                <>
                  <EnhancedDonutChart data={reportData.categoryData || []} />
                  <ExpenseTrendChart
                    data={reportData.trendData || []}
                    averageSpending={reportData.averageSpending || 0}
                  />
                </>
              ) : (
                <YStack alignItems="center" padding="$6">
                  <Text color="$gray9">{t("No data available")}</Text>
                </YStack>
              )}

              <RecentBillsList
                bills={bills}
                periodStart={currentSelector?.startDate}
                periodEnd={currentSelector?.endDate}
                maxItems={5}
              />
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  ) : (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <WelcomeScreen onStartChatPress={handleStartChat} />
    </SafeAreaView>
  );

  return (
    <>
      <GestureDetector gesture={swipeGesture}>
        {mainContent}
      </GestureDetector>

      <BudgetUpdateModal
        isOpen={isBudgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        budgets={budgets}
        onSave={handleSaveBudgets}
        defaultPeriod={periodType}
      />
    </>
  );
}
