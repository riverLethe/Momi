import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ScrollView,
    RefreshControl,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { YStack } from "tamagui";
import { format } from "date-fns";

// Stores & Providers -------------------------------------------------------
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";
import { useViewStore } from "@/stores/viewStore";

// New hooks (logic extracted) ---------------------------------------------
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useSplitReportData } from "@/hooks/useReportData";
import { useSpendingWidgetSync } from "@/hooks/useSpendingWidgetSync";
import { useBudgetWidgetSync } from "@/hooks/useBudgetWidgetSync";

// UI Components ------------------------------------------------------------
import BudgetSummaryCard from "@/components/home/BudgetSummaryCard";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import RecentBillsList from "@/components/home/RecentBillsList";

// Utils & Types ------------------------------------------------------------
import { DatePeriodEnum } from "@/types/reports.types";

// Subcomponents memo optimization
const MemoizedBudgetSummaryCard = React.memo(BudgetSummaryCard);
const MemoizedEnhancedDonutChart = React.memo(EnhancedDonutChart);
const MemoizedExpenseTrendChart = React.memo(ExpenseTrendChart);
const MemoizedRecentBillsList = React.memo(RecentBillsList);

interface PeriodPageProps {
    periodType: DatePeriodEnum;
    onPeriodTypeChange: (p: DatePeriodEnum) => void;
    selectedPeriodId: string;
    onSelectedPeriodChange: (id: string) => void;
    /** Trigger opening of the global budget modal */
    openBudgetModal: () => void;
}

/**
 * PeriodPage 独立渲染一个周期（周 / 月 / 年）的主页内容。
 * 注意：内部仍然使用 useReportData，但在挂载 / 外部切换时同步 periodType。
 */
const PeriodPage: React.FC<PeriodPageProps> = ({
    periodType,
    onPeriodTypeChange,
    selectedPeriodId: externalSelectedId,
    onSelectedPeriodChange,
    openBudgetModal,
}) => {
    const router = useRouter();

    // View mode and data -----------------------------------------------------
    const { viewMode } = useViewStore();
    const { bills: rawBills, transactions, refreshData, getBillsForViewMode } = useData();
    const { budgets } = useBudgets();

    // Get bills based on current view mode
    const bills = useMemo(() => getBillsForViewMode(viewMode), [getBillsForViewMode, viewMode]);

    // Reports ----------------------------------------------------------------
    const {
        periodSelectors,
        selectedPeriodId,
        setSelectedPeriodId: handlePeriodChange,
        coreReport,
        budgetReport,
        loadingCore,
        loadingBudget,
        refreshCoreReport,
        refreshBudgetReport,
        refreshBothReports,
    } = useSplitReportData(viewMode, periodType);

    // 缓存周期选择器查找
    const currentSelector = useMemo(() =>
        periodSelectors.find((p) => p.id === selectedPeriodId),
        [periodSelectors, selectedPeriodId]
    );

    // Category filters -------------------------------------------------------
    const { includedCategories, excludedCategories } = useCategoryFilters(
        periodType,
        budgets
    );

    // Budget status & categories --------------------------------------------
    const budgetStatusData = useMemo(() => ({
        bills,
        transactions,
        periodType,
        budgets,
        includedCategories,
        excludedCategories,
        periodStart: currentSelector?.startDate,
        periodEnd: currentSelector?.endDate,
    }), [bills, transactions, periodType, budgets, includedCategories, excludedCategories, currentSelector]);

    const { budgetStatus, categories } = useBudgetStatus(budgetStatusData);

    // Local UI states --------------------------------------------------------
    const hasBills = useMemo(() =>
        bills.length > 0 || transactions.length > 0,
        [bills.length, transactions.length]
    );

    const [isRefreshing, setIsRefreshing] = useState(false);

    /* ------------------------------- Actions ------------------------------- */
    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([refreshData(), refreshBothReports()]);
        } catch (error) {
            console.error("Failed to refresh data:", error);
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshData, refreshBothReports]);

    const handleBudgetFinancialInsights = useCallback(() => {
        router.push(`/chat?insightsPeriod=${periodType}&ts=${Date.now()}`);
    }, [router, periodType]);

    /* --------------------------- Category navigation --------------------------- */
    const handleCategoryPress = useCallback((categoryId: string) => {
        const start = currentSelector?.startDate;
        const end = currentSelector?.endDate;

        const params: Record<string, string> = {
            category: categoryId,
        };
        if (start) params.startDate = format(start, "yyyy-MM-dd");
        if (end) params.endDate = format(end, "yyyy-MM-dd");

        router.push({ pathname: "/bills", params });
    }, [currentSelector, router]);

    // Sync iOS widgets --------------------------------------------------------
    // 合并报表数据用于 Widget 同步
    const combinedReportData = useMemo(() => {
        if (!coreReport || !budgetReport) return null;
        return {
            ...coreReport,
            healthScore: budgetReport.healthScore,
            budget: budgetReport.budget,
        };
    }, [coreReport, budgetReport]);

    useSpendingWidgetSync(combinedReportData, periodType, viewMode);
    useBudgetWidgetSync(budgetReport, periodType, viewMode);

    // Sync external selectedId -> internal
    useEffect(() => {
        if (externalSelectedId && externalSelectedId !== selectedPeriodId) {
            handlePeriodChange(externalSelectedId);
        }
    }, [externalSelectedId, selectedPeriodId, handlePeriodChange]);

    // Sync internal -> parent
    useEffect(() => {
        if (selectedPeriodId !== externalSelectedId) {
            onSelectedPeriodChange(selectedPeriodId);
        }
    }, [selectedPeriodId, externalSelectedId, onSelectedPeriodChange]);

    /* ---------------------------- UI 渲染逻辑 ---------------------------- */
    // 缓存预算数据
    const budgetSummaryProps = useMemo(() => ({
        budgetStatus,
        categories,
        isLoading: false,
        budgets: {
            weekly: budgets.weekly?.amount ?? null,
            monthly: budgets.monthly?.amount ?? null,
            yearly: budgets.yearly?.amount ?? null,
        },
        onEditBudgetPress: openBudgetModal,
        onCategoryPress: handleCategoryPress,
        bills,
        budgetsDetail: budgets,
        periodType,
        periodStart: currentSelector?.startDate,
        periodEnd: currentSelector?.endDate,
        onSetBudget: openBudgetModal,
        onChatPress: handleBudgetFinancialInsights,
        healthScore: budgetReport?.healthScore,
    }), [
        budgetStatus,
        categories,
        budgets,
        openBudgetModal,
        handleCategoryPress,
        bills,
        periodType,
        currentSelector?.startDate,
        currentSelector?.endDate,
        handleBudgetFinancialInsights,
        budgetReport?.healthScore,
    ]);

    // 缓存图表数据
    const chartData = useMemo(() => ({
        categoryData: coreReport?.categoryData || [],
        trendData: coreReport?.trendData || [],
        averageSpending: coreReport?.averageSpending || 0,
    }), [coreReport]);

    const mainContent = useMemo(() => {
        return (
            <YStack flex={1} backgroundColor="$background">
                <YStack flex={1}>
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                colors={["#3B82F6"]}
                            />
                        }
                    >
                        <YStack gap="$3">
                            <MemoizedBudgetSummaryCard {...budgetSummaryProps} />

                            {coreReport && (
                                <>
                                    <MemoizedEnhancedDonutChart
                                        data={chartData.categoryData}
                                        onCategoryPress={handleCategoryPress}
                                    />
                                    <MemoizedExpenseTrendChart
                                        data={chartData.trendData}
                                        averageSpending={chartData.averageSpending}
                                    />
                                </>
                            )}

                            <MemoizedRecentBillsList
                                bills={bills}
                                maxItems={5}
                            />
                        </YStack>
                    </ScrollView>
                </YStack>
            </YStack>
        );
    }, [
        hasBills,
        isRefreshing,
        handleRefresh,
        budgetSummaryProps,
        coreReport,
        chartData,
        handleCategoryPress,
        bills,
        currentSelector?.startDate,
        currentSelector?.endDate,
    ]);

    return (
        <>
            {mainContent}
        </>
    );
};

export default React.memo(PeriodPage);