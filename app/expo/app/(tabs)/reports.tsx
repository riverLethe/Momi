import React, { useState, useEffect } from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { YStack, Text } from "tamagui";

// Components
import AppHeader from "@/components/shared/AppHeader";
import DateFilter from "@/components/reports/DateFilter";
import EnhancedDonutChart from "@/components/reports/EnhancedDonutChart";
import ExpenseTrendChart from "@/components/reports/ExpenseTrendChart";
import FinancialInsights from "@/components/reports/FinancialInsights";
import FinancialHealthScore from "@/components/reports/FinancialHealthScore";
import EmptyState from "@/components/reports/EmptyState";

// Hooks, Stores & Providers
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// Types & Utils
import { 
  DatePeriodEnum, 
  PeriodSelectorData, 
  ReportData 
} from "@/types/reports.types";
import { fetchReportData } from "@/utils/reports.utils";

export default function ReportsScreen() {
  const { t } = useTranslation();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn } = useAuth();

  // State
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<DatePeriodEnum>(DatePeriodEnum.WEEK);
  const [periodSelectors, setPeriodSelectors] = useState<PeriodSelectorData[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");
  const [hasData, setHasData] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  // Check if family mode is accessible
  useEffect(() => {
    if (viewMode === "family" && !isLoggedIn) {
      // If trying to view family reports but not logged in
      useViewStore.getState().setViewMode("personal");
    }
  }, [viewMode, isLoggedIn]);

  // Load data when parameters change
  useEffect(() => {
    loadReportData();
  }, [viewMode, periodType, selectedPeriodId]);

  // Load report data
  const loadReportData = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would call an API
      const data = await fetchReportData(
        periodType,
        viewMode,
        selectedPeriodId
      );
      
      setPeriodSelectors(data.periodSelectors || []);
      
      // If no selected period yet, select the first one
      if (!selectedPeriodId && data.periodSelectors && data.periodSelectors.length > 0) {
        setSelectedPeriodId(data.periodSelectors[0].id);
      }
      
      setReportData(data);
      setHasData(data.categoryData.length > 0 && data.categoryData.some(cat => cat.value > 0));
    } catch (error) {
      console.error("Error fetching report data:", error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle period type change
  const handlePeriodTypeChange = (newPeriodType: DatePeriodEnum) => {
    setPeriodType(newPeriodType);
    setSelectedPeriodId(""); // Reset selected period
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* Header */}
        <AppHeader />

        {/* Date & Comparison Filters */}
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

        {/* Content */}
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text marginTop="$4" color="$gray10">{t("Loading reports")}</Text>
          </YStack>
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <ScrollView 
            style={{ flex: 1, paddingHorizontal: 16 }} 
            contentContainerStyle={{ paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Distribution (Donut Chart) */}
            <YStack paddingTop="$1">
              <EnhancedDonutChart 
                data={reportData?.categoryData || []} 
                topSpendingCategories={reportData?.topSpendingCategories}
              />
            </YStack>
          
            {/* Expense Trend Chart */}
            <YStack paddingTop="$1">
              <ExpenseTrendChart 
                data={reportData?.trendData || []}
                averageSpending={reportData?.averageSpending || 0}
              />
            </YStack>
            
            {/* Financial Insights */}
            <YStack paddingTop="$1">
              <FinancialInsights insights={reportData?.insights || []} />
            </YStack>
            
            {/* Financial Health Score */}
            <YStack paddingTop="$1">
              <FinancialHealthScore healthScore={reportData?.healthScore || { 
                score: 0, 
                status: "Good", 
                categories: [] 
              }} />
            </YStack>
          </ScrollView>
        )}
      </YStack>
    </SafeAreaView>
  );
}
