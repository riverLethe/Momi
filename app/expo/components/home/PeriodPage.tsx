import React, { useState, useEffect } from "react";
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
import {
    BudgetPeriod,
    Budgets,
} from "@/utils/budget.utils";
import { DatePeriodEnum } from "@/types/reports.types";

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
    const { viewMode } = useViewStore();
    const { t } = useTranslation();

    // Data -------------------------------------------------------------------
    const { bills, transactions, refreshData } = useData();
    const { budgets, saveBudgetForPeriod } = useBudgets();

    // Reports ----------------------------------------------------------------
    const {
        periodType: currentPeriodType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        handlePeriodTypeChange, // keep from hook but not used for cross-page switch
        periodSelectors,
        selectedPeriodId,
        setSelectedPeriodId,
        reportData,
        loadingReport,
        refreshReport,
        isChangingPeriodType,
    } = useReportData(viewMode, periodType);

    // Category filters -------------------------------------------------------
    const { includedCategories, excludedCategories } = useCategoryFilters(
        periodType,
        budgets
    );

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

            for (const p of periods) {
                const detail = nextBudgets[p as keyof Budgets];
                if (detail) {
                    await saveBudgetForPeriod(p, detail);
                }
            }

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

        const params: Record<string, string> = {
            category: categoryId,
        };
        if (start) params.startDate = format(start, "yyyy-MM-dd");
        if (end) params.endDate = format(end, "yyyy-MM-dd");

        router.push({ pathname: "/bills", params });
    };

    // Sync iOS widgets --------------------------------------------------------
    useSpendingWidgetSync(reportData, periodType, viewMode);
    useBudgetWidgetSync(reportData, periodType, viewMode);

    // Sync external selectedId -> internal
    useEffect(() => {
        if (externalSelectedId && externalSelectedId !== selectedPeriodId) {
            setSelectedPeriodId(externalSelectedId);
        }
    }, [externalSelectedId]);

    // Sync internal -> parent
    useEffect(() => {
        if (selectedPeriodId !== externalSelectedId) {
            onSelectedPeriodChange(selectedPeriodId);
        }
    }, [selectedPeriodId]);

    /* ---------------------------- UI 渲染逻辑 ---------------------------- */
    const shouldShowFullLoading =
        loadingReport && !isChangingPeriodType && !reportData;
    const shouldShowMinimalLoading = loadingReport && isChangingPeriodType;

    const mainContent = hasBills ? (
        <View style={{ flex: 1, backgroundColor: "#eee" }}>
            <YStack flex={1}>
                {/* Header removed; DateFilter handled by parent */}

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

                            {reportData ? (
                                <>
                                    <EnhancedDonutChart
                                        data={reportData.categoryData || []}
                                        onCategoryPress={handleCategoryPress}
                                    />
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
        </View>
    ) : (
        <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
            <WelcomeScreen onStartChatPress={handleStartChat} />
        </View>
    );

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