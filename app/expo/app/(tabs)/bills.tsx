import React, { useState, useEffect, useMemo } from "react";
import {
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { useTranslation } from "react-i18next";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { Bill } from "@/types/bills.types";
import AppHeader from "@/components/shared/AppHeader";
import { FilterWithTotalExpense, CategoryFilterType } from "@/components/bills/FilterWithTotalExpense";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { BillDateGroup } from "@/components/bills/BillDateGroup";
import { EmptyState } from "@/components/bills/EmptyState";

// Mock bills data
const generateMockBills = (): Bill[] => {
  const bills: Bill[] = [];

  // Use defined categories
  const categoryIds = EXPENSE_CATEGORIES.map(cat => cat.id);
  const merchants = [
    "Starbucks",
    "Uber",
    "Amazon",
    "Cinema",
    "Utility Company",
    "Landlord",
    "Mobile Carrier",
    "Instagram",
  ];

  // Generate today's bills
  for (let i = 0; i < 3; i++) {
    const categoryIndex = Math.floor(Math.random() * categoryIds.length);
    bills.push({
      id: `today_${i}`,
      amount: Math.floor(Math.random() * 200) + 10,
      category: categoryIds[categoryIndex],
      account: "Cash",
      date: new Date(),
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      notes: "This is a test bill",
      createdBy: "user_1",
      creatorName: "John",
      isFamilyBill: i % 2 === 0,
      familyId: i % 2 === 0 ? "1" : undefined,
      familyName: i % 2 === 0 ? "My Family" : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Generate yesterday's bills
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  for (let i = 0; i < 2; i++) {
    const categoryIndex = Math.floor(Math.random() * categoryIds.length);
    bills.push({
      id: `yesterday_${i}`,
      amount: Math.floor(Math.random() * 100) + 20,
      category: categoryIds[categoryIndex],
      account: "Credit Card",
      date: yesterday,
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      notes: "This is a test bill",
      createdBy: i === 0 ? "user_1" : "user_2",
      creatorName: i === 0 ? "John" : "Jane",
      isFamilyBill: true,
      familyId: "1",
      familyName: "My Family",
      createdAt: yesterday,
      updatedAt: yesterday,
    });
  }

  // Generate last week's bills
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);

  for (let i = 0; i < 4; i++) {
    const categoryIndex = Math.floor(Math.random() * categoryIds.length);
    bills.push({
      id: `lastweek_${i}`,
      amount: Math.floor(Math.random() * 300) + 50,
      category: categoryIds[categoryIndex],
      account: i % 2 === 0 ? "Cash" : "Digital Payment",
      date: lastWeek,
      merchant: merchants[Math.floor(Math.random() * merchants.length)],
      notes: "This is a test bill",
      createdBy: "user_1",
      creatorName: "John",
      isFamilyBill: i % 3 === 0,
      familyId: i % 3 === 0 ? "1" : undefined,
      familyName: i % 3 === 0 ? "My Family" : undefined,
      createdAt: lastWeek,
      updatedAt: lastWeek,
    });
  }

  return bills;
};

export default function BillsScreen() {
  const { viewMode } = useViewStore();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>("all");

  // Initialize with mock data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockBills = generateMockBills();
      setBills(mockBills);
      setLoading(false);
    }, 1000);
  }, []);

  // Apply view mode filter
  useEffect(() => {
    let filtered = [...bills];
    
    // View mode filter (personal/family)
    if (viewMode === "family") {
      if (!isLoggedIn) {
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
      filtered = filtered.filter(bill => {
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
    if (categoryFilter !== "all") {
      filtered = filtered.filter(bill => bill.category === categoryFilter);
    }
    
    setFilteredBills(filtered);
  }, [bills, viewMode, isLoggedIn, startDate, endDate, categoryFilter]);

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

    return Object.entries(groups).map(([date, bills]) => ({
      date,
      bills,
      totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredBills]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const renderDateGroup = ({ item }: { item: (typeof billGroups)[0] }) => (
    <BillDateGroup item={item} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <YStack flex={1}>
        {/* Header */}
        <AppHeader />
        
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
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </YStack>
        ) : filteredBills.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={billGroups}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: "#f8fafc"
  },
  listContainer: {
    paddingVertical: 4
  }
});
