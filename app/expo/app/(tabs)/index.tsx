import React, { useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { YStack, Text } from "tamagui";
import { format } from "date-fns";

// Stores & Providers -------------------------------------------------------
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";

// New hooks (logic extracted) ---------------------------------------------
import { useRemoteSync } from "@/hooks/useRemoteSync";
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useReportData } from "@/hooks/useReportData";

// UI Components ------------------------------------------------------------
import DateFilter from "@/components/reports/DateFilter";
import BudgetSummaryCard from "@/components/home/BudgetSummaryCard";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import RecentBillsList from "@/components/home/RecentBillsList";
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Utils & Types ------------------------------------------------------------
import { updateUserPreferences } from "@/utils/userPreferences.utils";
import { Budgets } from "@/utils/budget.utils";
import { UserPreferences } from "@/types/user.types";
import { DatePeriodEnum } from "@/types/reports.types";

type FilterMode = "all" | "include" | "exclude";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const { t } = useTranslation();

  // Data -------------------------------------------------------------------
  const { bills, transactions, isLoading: isDataLoading, refreshData } =
    useData();
  const { isAuthenticated, user } = useAuth();
  const { budgets, saveBudgetForPeriod } = useBudgets();

  // Synchronisation --------------------------------------------------------
  const syncingRemote = useRemoteSync(isAuthenticated, user, refreshData);

  // Reports & Period management -------------------------------------------
  const {
    periodType,
    handlePeriodTypeChange,
    periodSelectors,
    selectedPeriodId,
    setSelectedPeriodId,
    reportData,
    loadingReport,
    loadReportData,
    setReportData,
  } = useReportData(viewMode);

  // Derive period key for budget utils
  const budgetPeriod: "weekly" | "monthly" | "yearly" =
    periodType === DatePeriodEnum.WEEK
      ? "weekly"
      : periodType === DatePeriodEnum.MONTH
        ? "monthly"
        : "yearly";

  // Category filters -------------------------------------------------------
  const {
    includedCategories,
    excludedCategories,
    setIncludedCategories,
    setExcludedCategories,
  } = useCategoryFilters(budgetPeriod, budgets);

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
    await loadReportData();
    setIsRefreshing(false);
  };

  const handleSaveBudgets = async (nextBudgets: Budgets) => {
    setSavingBudget(true);
    try {
      const periods: ("weekly" | "monthly" | "yearly")[] = [
        "weekly",
        "monthly",
        "yearly",
      ];
      const prefsUpdate: Partial<UserPreferences> = { budgetFilters: {} };

      for (const p of periods) {
        const detailObj = nextBudgets[p] as any;
        await saveBudgetForPeriod(p, detailObj);
        prefsUpdate.budgetFilters![p] = {
          mode: detailObj.filterMode as FilterMode,
          categories: detailObj.categories,
        };
      }
      await updateUserPreferences(prefsUpdate);

      // Update local filters according to current period
      const detail = nextBudgets[budgetPeriod];
      if (detail?.filterMode === "include") {
        setIncludedCategories(detail.categories);
        setExcludedCategories([]);
      } else if (detail?.filterMode === "exclude") {
        setExcludedCategories(detail.categories);
        setIncludedCategories([]);
      } else {
        setIncludedCategories([]);
        setExcludedCategories([]);
      }

      // Reflect budget changes in merged report data
      if (reportData) {
        const spentTotal = (reportData.categoryData || []).reduce(
          (s, c) => s + c.value,
          0
        );
        const amount = detail?.amount ?? null;
        const remaining = amount ? Math.max(0, amount - spentTotal) : 0;
        const percentage = amount ? Math.min((spentTotal / amount) * 100, 100) : 0;
        let status: "good" | "warning" | "danger" | "none" = "none";
        if (amount == null) status = "none";
        else if (percentage >= 90) status = "danger";
        else if (percentage >= 70) status = "warning";
        else status = "good";

        setReportData({ ...reportData, budget: { amount, spent: spentTotal, remaining, percentage, status } });
      }
    } catch (error) {
      console.error("Failed to save budgets:", error);
    } finally {
      setSavingBudget(false);
    }
  };

  const handleStartChat = () => router.push("/chat");
  const handleBudgetFinancialInsights = () => {
    const periodParam =
      periodType === DatePeriodEnum.WEEK
        ? "week"
        : periodType === DatePeriodEnum.MONTH
          ? "month"
          : "year";
    router.push(`/chat?insightsPeriod=${periodParam}&ts=${Date.now()}`);
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

  if (!hasBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <WelcomeScreen onStartChatPress={handleStartChat} />
      </SafeAreaView>
    );
  }

  return (
    <>
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
            {loadingReport && !isRefreshing ? (
              <YStack alignItems="center" justifyContent="center" paddingVertical="$4">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text marginTop="$2">{t("Loading...")}</Text>
              </YStack>
            ) : (
              <YStack gap="$3">
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

                {reportData && (
                  <>
                    <EnhancedDonutChart data={reportData.categoryData || []} />
                    <ExpenseTrendChart
                      data={reportData.trendData || []}
                      averageSpending={reportData.averageSpending || 0}
                    />
                  </>
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

      <BudgetUpdateModal
        isOpen={isBudgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        budgets={budgets}
        onSave={handleSaveBudgets}
        defaultPeriod={budgetPeriod}
      />
    </>
  );
}
