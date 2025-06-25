import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { YStack, Text } from "tamagui";
import { format } from "date-fns";

// Stores & Providers -------------------------------------------------------
import { useViewStore } from "@/stores/viewStore";
import { useData } from "@/providers/DataProvider";
import { useBudgets } from "@/hooks/useBudgets";

// New hooks (logic extracted) ---------------------------------------------
import { useCategoryFilters } from "@/hooks/useCategoryFilters";
import { useBudgetStatus } from "@/hooks/useBudgetStatus";
import { useSplitReportData } from "@/hooks/useReportData";
import { useSpendingWidgetSync } from "@/hooks/useSpendingWidgetSync";
import { useBudgetWidgetSync } from "@/hooks/useBudgetWidgetSync";
import { syncBudgetWidgets } from "@/utils/budgetWidgetSync.utils";

// UI Components ------------------------------------------------------------
import BudgetSummaryCard from "@/components/home/BudgetSummaryCard";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import RecentBillsList from "@/components/home/RecentBillsList";
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Utils & Types ------------------------------------------------------------
import {
    BudgetPeriod,
    Budgets,
} from "@/utils/budget.utils";
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
}) => {
    const router = useRouter();
    const { t } = useTranslation();

    // Data -------------------------------------------------------------------
    const { bills, transactions, refreshData } = useData();
    const { budgets, saveBudgetForPeriod } = useBudgets();

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
    } = useSplitReportData("personal", periodType);

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

    const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
    const [savingBudget, setSavingBudget] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isManuallyUpdatingWidget, setIsManuallyUpdatingWidget] = useState(false);

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

    const handleSaveBudgets = useCallback(async (nextBudgets: Budgets) => {
        setSavingBudget(true);
        setIsManuallyUpdatingWidget(true);
        try {
            const periods: BudgetPeriod[] = ["weekly", "monthly", "yearly"];

            // 顺序保存预算，避免并发写导致覆盖问题
            for (const p of periods) {
                const detail = nextBudgets[p as keyof Budgets];
                if (detail) {
                    // eslint-disable-next-line no-await-in-loop
                    await saveBudgetForPeriod(p, detail);
                }
            }

            // 预算更新后重新计算报表数据，确保 healthScore 及时刷新
            await refreshBudgetReport();

            // 等待一个微任务，确保 reportData 状态已更新
            await new Promise(resolve => setTimeout(resolve, 0));

            // Sync iOS widgets once after budgets are updated with the latest report
            syncBudgetWidgets({
                viewMode: "personal",
                currentBudgetData: budgetReport,
                currentPeriodType: periodType,
                budgetVersion: Date.now()
            }).catch(() => { });
        } catch (error) {
            console.error("Failed to save budgets:", error);
        } finally {
            setSavingBudget(false);
            // 延迟恢复自动同步，确保手动同步完成
            setTimeout(() => setIsManuallyUpdatingWidget(false), 1000);
        }
    }, [saveBudgetForPeriod, refreshBudgetReport, budgetReport, periodType]);

    const handleStartChat = useCallback(() => router.push("/chat"), [router]);

    const handleBudgetFinancialInsights = useCallback(() => {
        router.push(`/chat?insightsPeriod=${periodType}&ts=${Date.now()}`);
    }, [router, periodType]);

    const openBudgetModal = useCallback(() => setBudgetModalOpen(true), []);

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

    useSpendingWidgetSync(combinedReportData, periodType, "personal");
    useBudgetWidgetSync(budgetReport, periodType, "personal", isManuallyUpdatingWidget);

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
    // 优化loading逻辑：只在真正需要时显示
    const shouldShowLoading = useMemo(() =>
        (loadingCore || loadingBudget) && (!coreReport || !budgetReport) && hasBills,
        [loadingCore, loadingBudget, coreReport, budgetReport, hasBills]
    );

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
        if (!hasBills) {
            return (
                <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
                    <WelcomeScreen onStartChatPress={handleStartChat} />
                </View>
            );
        }

        return (
            <View style={{ flex: 1, backgroundColor: "#eee" }}>
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
                        {shouldShowLoading ? (
                            <YStack alignItems="center" justifyContent="center" paddingVertical="$4">
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text marginTop="$2">{t("Loading...")}</Text>
                            </YStack>
                        ) : (
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
                                    periodStart={currentSelector?.startDate}
                                    periodEnd={currentSelector?.endDate}
                                    maxItems={5}
                                />
                            </YStack>
                        )}
                    </ScrollView>
                </YStack>
            </View>
        );
    }, [
        hasBills,
        handleStartChat,
        isRefreshing,
        handleRefresh,
        shouldShowLoading,
        t,
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

            <BudgetUpdateModal
                isOpen={isBudgetModalOpen}
                onOpenChange={setBudgetModalOpen}
                budgets={budgets}
                onSave={handleSaveBudgets}
                defaultPeriod={periodType}
            />
        </>
    );
};

export default React.memo(PeriodPage); 