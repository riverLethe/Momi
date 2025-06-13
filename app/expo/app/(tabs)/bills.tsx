import React, { useState, useEffect, useMemo } from "react";
import { FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { useTranslation } from "react-i18next";

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

export default function BillsScreen() {
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const { bills, isLoading, refreshData } = useData();

  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [syncingRemote, setSyncingRemote] = useState(false);
  const { confirmDeleteBill } = useBillActions();

  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>([]);

  // Sync with remote data if authenticated
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user) {
        try {
          setSyncingRemote(true);
          // 在实际应用中，这里会从远程API获取数据并更新本地存储
          await syncRemoteData("bills", user.id);
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

  // Apply view mode filter
  useEffect(() => {
    let filtered = [...bills];

    // View mode filter (personal/family)
    if (viewMode === "family") {
      if (!isAuthenticated) {
        // If not logged in, can't view family bills
        filtered = [];
      } else {
        // Filter to show only family bills
        filtered = filtered.filter((bill) => bill.isFamilyBill);
      }
    } else {
      // Filter to show only personal bills
      filtered = filtered.filter((bill) => !bill.isFamilyBill);
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

    setFilteredBills(filtered);
  }, [bills, viewMode, isAuthenticated, startDate, endDate, categoryFilter]);

  // Calculate total expenses
  const totalExpense = useMemo(() => {
    return filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [filteredBills]);

  // Group bills by date
  const billGroups = useMemo(() => {
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

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleDeleteBill = (bill: Bill) => {
    confirmDeleteBill(bill, {
      ignoreRefresh: true,
      onSuccess: () => {
        setFilteredBills(filteredBills.filter((b) => b.id !== bill.id));
      },
    });
  };

  const renderDateGroup = ({ item }: { item: (typeof billGroups)[0] }) => (
    <BillDateGroup item={item} onDelete={handleDeleteBill} />
  );

  // Handle refresh (pull-to-refresh)
  const handleRefresh = async () => {
    await refreshData();
  };

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1}>
        {
          /* When there is no data yet, show loading or empty state */
          bills.length === 0 ? (
            isLoading || syncingRemote ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" color="#3B82F6" />
              </YStack>
            ) : (
              <EmptyState />
            )
          ) : (
            <>
              {/* Filters & Total Expense in one row */}
              <FilterWithTotalExpense
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                onDateRangeChange={handleDateRangeChange}
                totalExpense={totalExpense}
                startDate={startDate}
                endDate={endDate}
              />

              {/* Bills List */}
              <FlatList
                data={billGroups}
                renderItem={renderDateGroup}
                keyExtractor={(item) => item.date}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                onRefresh={handleRefresh}
                refreshing={isLoading || syncingRemote}
              />
            </>
          )
        }
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  listContainer: {
    paddingVertical: 4,
  },
});
