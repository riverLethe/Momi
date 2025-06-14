import React, { useState, useEffect } from "react";
import { ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { YStack, Text, Separator } from "tamagui";

// Components
import DateFilter from "@/components/reports/DateFilter";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import FinancialInsights from "@/components/reports/FinancialInsights";
import FinancialHealthScore from "@/components/reports/FinancialHealthScore";
import EmptyState from "@/components/reports/EmptyState";

// Hooks, Stores & Providers
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";

// Types & Utils
import {
  DatePeriodEnum,
  PeriodSelectorData,
  ReportData,
} from "@/types/reports.types";
import { fetchReportData } from "@/utils/reports.utils";
import { syncRemoteData } from "@/utils/sync.utils";

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const { refreshData, bills, transactions } = useData();

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <YStack flex={1}>
        {/* Header */}
        {/* <AppHeader /> */}

        {/* Date & Comparison Filters */}
        {bills.length > 0 && (
          <YStack
            marginHorizontal="$4"
            marginTop="$3.5"
            marginBottom="$3.5"
            backgroundColor="white"
            borderRadius="$4"
            shadowColor="rgba(0,0,0,0.08)"
            shadowRadius={6}
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

            {/* Financial Insights */}
            <YStack paddingTop="$1">
              <FinancialInsights insights={reportData?.insights || []} />
            </YStack>
            <Separator marginVertical="$2" borderColor="$gray3" />

            {/* Financial Health Score */}
            <YStack paddingTop="$1">
              <FinancialHealthScore
                healthScore={
                  reportData?.healthScore || {
                    score: 0,
                    status: "Good",
                    categories: [],
                  }
                }
              />
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  );
}
