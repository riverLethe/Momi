import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ActivityIndicator, StyleSheet, FlatList } from "react-native";
import { Text } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, XStack, YStack } from "tamagui";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTheme } from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";
import { Bill } from "@/types/bills.types";
import {
  FilterWithTotalExpense,
  CategoryFilterType,
} from "@/components/bills/FilterWithTotalExpense";
import { BillDateGroup } from "@/components/bills/BillDateGroup";
import { EmptyState } from "@/components/bills/EmptyState";
import { syncRemoteData } from "@/utils/sync.utils";
import { useBillActions } from "@/hooks/useBillActions";
import { filterBills, BillQuery } from "@/utils/bills.utils";

export default function BillsScreen() {
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { getBillsForViewMode, isLoading: dataLoading, refreshData } = useData();

  const [syncingRemote, setSyncingRemote] = useState(false);
  const { confirmDeleteBill } = useBillActions();

  /** Track global open bill id for swipe actions */
  const [openBillId, setOpenBillId] = useState<string | null>(null);

  // 获取当前视图模式对应的账单数据
  const bills = useMemo(() => getBillsForViewMode(viewMode), [getBillsForViewMode, viewMode]);

  // Detect AI filter params from route (deep link or AI search)
  const params = useLocalSearchParams();

  // Whether the current navigation came from AI search / deep link
  const aiFilterActive = params.ai === "1" || params.ai === "true";

  // -------- Filter states (initialized from params once) --------
  const [startDate, setStartDate] = useState<Date | null>(() => {
    if (typeof params.startDate === "string") {
      const sd = new Date(params.startDate);
      if (!isNaN(sd.getTime())) return sd;
    }
    return null;
  });

  const [endDate, setEndDate] = useState<Date | null>(() => {
    if (typeof params.endDate === "string") {
      const ed = new Date(params.endDate);
      if (!isNaN(ed.getTime())) return ed;
    }
    return null;
  });

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>(() => {
    if (typeof params.category === "string" && params.category) {
      return [params.category];
    }
    return [];
  });

  const [keywordFilter, setKeywordFilter] = useState<string | null>(() => {
    if (typeof params.keyword === "string" && params.keyword) {
      return params.keyword;
    }
    return null;
  });

  const [minAmount, setMinAmount] = useState<number | null>(() => {
    if (typeof params.minAmount === "string") {
      const v = parseFloat(params.minAmount);
      if (!isNaN(v)) return v;
    }
    return null;
  });

  const [maxAmount, setMaxAmount] = useState<number | null>(() => {
    if (typeof params.maxAmount === "string") {
      const v = parseFloat(params.maxAmount);
      if (!isNaN(v)) return v;
    }
    return null;
  });

  const theme = useTheme();

  // 后台同步远程数据，不阻塞UI
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setSyncingRemote(true);
          // 后台同步，不阻塞用户交互 - 使用智能同步
          setTimeout(async () => {
            try {
              await syncRemoteData("bills", user.id, false); // 使用智能同步，不强制
              await refreshData();
            } catch (error) {
              console.error("Failed to sync remote data:", error);
            } finally {
              setSyncingRemote(false);
            }
          }, 100);
        } catch (error) {
          console.error("Failed to sync remote data:", error);
          setSyncingRemote(false);
        }
      }
    };

    syncData();
  }, [isAuthenticated, user?.id, refreshData]);

  // 稳定化的params值，避免每次都重新创建对象
  const stableParams = useMemo(() => ({
    ai: params.ai,
    categories: params.categories,
    category: params.category,
    keywords: params.keywords,
    keyword: params.keyword,
    minAmount: params.minAmount,
    maxAmount: params.maxAmount,
    dateField: params.dateField,
    dateRanges: params.dateRanges,
    startDate: params.startDate,
    endDate: params.endDate,
  }), [
    params.ai,
    params.categories,
    params.category,
    params.keywords,
    params.keyword,
    params.minAmount,
    params.maxAmount,
    params.dateField,
    params.dateRanges,
    params.startDate,
    params.endDate,
  ]);

  // 使用useMemo优化过滤逻辑，减少重新计算
  const filteredBills = useMemo(() => {
    // --- If AI filter active, delegate to filterBills helper ---
    if (aiFilterActive) {
      const query: BillQuery = {
        // categories may arrive as comma separated list or single
        categories: typeof stableParams.categories === "string" ? stableParams.categories.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined,
        category: typeof stableParams.category === "string" ? stableParams.category : undefined,

        keywords: typeof stableParams.keywords === "string" ? stableParams.keywords.split(/[,;]/).map(s => s.trim()).filter(Boolean) : undefined,
        keyword: typeof stableParams.keyword === "string" ? stableParams.keyword : undefined,

        minAmount: typeof stableParams.minAmount === "string" ? parseFloat(stableParams.minAmount) : undefined,
        maxAmount: typeof stableParams.maxAmount === "string" ? parseFloat(stableParams.maxAmount) : undefined,

        dateField: typeof stableParams.dateField === "string" && ["date", "createdAt", "updatedAt"].includes(stableParams.dateField) ? stableParams.dateField as any : undefined,
      };

      // Multiple date ranges JSON encoded string
      if (typeof stableParams.dateRanges === "string") {
        try {
          const parsed = JSON.parse(stableParams.dateRanges);
          if (Array.isArray(parsed)) query.dateRanges = parsed;
        } catch { }
      } else {
        if (typeof stableParams.startDate === "string") query.startDate = stableParams.startDate;
        if (typeof stableParams.endDate === "string") query.endDate = stableParams.endDate;
      }

      // bills 数据已经根据视图模式过滤，直接使用
      return filterBills(bills, query);
    }

    // ---- Default (manual) filters ----
    // bills 数据已经根据视图模式合并，直接使用
    let filtered = [...bills];

    // 如果未登录且在家庭模式，返回空数组
    if (viewMode === "family" && !isAuthenticated) {
      filtered = [];
    }

    // Date filter
    if (startDate || endDate) {
      filtered = filtered.filter((bill) => {
        const billDate = new Date(bill.date);
        billDate.setHours(0, 0, 0, 0);

        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return billDate >= start && billDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return billDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return billDate <= end;
        }

        return true;
      });
    }

    // Category filter
    if (categoryFilter.length > 0) {
      filtered = filtered.filter((bill) =>
        categoryFilter.includes(bill.category)
      );
    }

    // Keyword filter (search in notes & merchant)
    if (keywordFilter) {
      const kw = keywordFilter.toLowerCase();
      filtered = filtered.filter(
        (bill) =>
          (bill.notes && bill.notes.toLowerCase().includes(kw)) ||
          (bill.merchant && bill.merchant.toLowerCase().includes(kw))
      );
    }

    // Amount filter (if either bound provided)
    if (minAmount !== null) {
      filtered = filtered.filter((bill) => bill.amount >= minAmount);
    }
    if (maxAmount !== null) {
      filtered = filtered.filter((bill) => bill.amount <= maxAmount);
    }

    return filtered;
  }, [bills, viewMode, isAuthenticated, startDate, endDate, categoryFilter, keywordFilter, minAmount, maxAmount, aiFilterActive, stableParams]);

  // Calculate total expenses - memoized
  const totalExpense = useMemo(() => {
    return filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [filteredBills]);

  // Group bills by date - optimized
  const billGroups = useMemo(() => {
    if (filteredBills.length === 0) return [];

    const groups: { [key: string]: Bill[] } = {};

    filteredBills.forEach((bill) => {
      const dateStr = new Date(bill.date).toDateString();
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(bill);
    });

    return Object.entries(groups)
      .map(([date, bills]) => ({
        date,
        bills,
        totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredBills]);

  const handleDateRangeChange = useCallback((start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleDeleteBill = useCallback(
    (bill: Bill) => {
      confirmDeleteBill(bill);
    },
    [confirmDeleteBill]
  );

  const renderDateGroup = useCallback(({ item }: { item: (typeof billGroups)[0] }) => (
    <BillDateGroup
      item={item}
      onDelete={handleDeleteBill}
      openBillId={openBillId}
      setOpenBillId={setOpenBillId}
    />
  ), [handleDeleteBill, openBillId]);

  // Handle refresh (pull-to-refresh)
  const handleRefresh = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  // 简化loading状态，只在真正需要时显示
  const showLoading = bills.length === 0 && (dataLoading.bills || syncingRemote);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <YStack flex={1} backgroundColor="$background">
        {
          /* When there is no data yet, show loading or empty state */
          bills.length === 0 ? (
            showLoading ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="small" color={theme.blue9?.get()} />
                <Text marginTop="$2" color="$color10" fontSize="$3">
                  {t("Loading bills...")}
                </Text>
              </YStack>
            ) : (
              <EmptyState />
            )
          ) : (
            <>
              {/* Filters & Total Expense in one row */}
              <XStack
                paddingHorizontal="$4"
                paddingLeft="$2"
                paddingVertical="$2"
                gap="$2"
                alignItems="center"
                justifyContent="space-between"
              >
                <Button size="$3"
                  circular borderRadius="$2"
                  chromeless
                  onPress={() => router.back()}
                  icon={<ChevronLeft size={20} color={theme.color?.get()} />}
                  pressStyle={{
                    backgroundColor: "transparent",
                    opacity: 0.5,
                    borderColor: "transparent",
                  }}
                />

                <FilterWithTotalExpense
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  onDateRangeChange={handleDateRangeChange}
                  totalExpense={totalExpense}
                  startDate={startDate}
                  endDate={endDate}
                  aiFilterActive={aiFilterActive}
                >
                  {/* AI Filter Tag */}
                  {aiFilterActive && (
                    <XStack
                      alignSelf="flex-start"
                      marginLeft={16}
                      marginBottom={4}
                      backgroundColor="$blue2"
                      paddingVertical="$1"
                      paddingHorizontal="$2"
                      borderRadius="$2"
                      alignItems="center"
                      gap="$1"
                    >
                      <Text fontSize="$3" color="$blue9">
                        {t("AI Filter")}
                      </Text>
                    </XStack>
                  )}
                </FilterWithTotalExpense>
              </XStack>

              {/* Bills List */}
              {
                (categoryFilter.length > 0 || aiFilterActive || (startDate || endDate)) && filteredBills.length === 0 && (
                  <YStack flex={1} alignItems="center" justifyContent="center" padding={16}>
                    <Text fontSize="$6" fontWeight="bold" textAlign="center" mb="$2" color="$color">
                      {t("No Bills Found")}
                    </Text>
                  </YStack>
                )
              }
              <FlatList<(typeof billGroups)[0]>
                data={billGroups}
                renderItem={renderDateGroup}
                keyExtractor={(item: (typeof billGroups)[0]) => item.date}
                extraData={openBillId}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
                refreshing={syncingRemote}
                initialNumToRender={10}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews={true}
                getItemLayout={undefined} // 让FlatList自动计算，避免强制计算
              />
            </>
          )
        }
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingVertical: 4,
  },
});
