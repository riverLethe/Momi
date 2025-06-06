import React, { useState, useEffect, useMemo } from "react";
import {
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  XStack, 
  YStack, 
  Circle,
  Avatar,
} from "tamagui";
import { useTranslation } from "react-i18next";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { Bill } from "@/types/bills.types";
import AppHeader from "@/components/shared/AppHeader";
import BillsFilter, { DateFilterType, CategoryFilterType } from "@/components/bills/BillsFilter";
import { EXPENSE_CATEGORIES, getCategoryById, getCategoryIcon, getTranslatedCategoryName } from "@/constants/categories";

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
  const router = useRouter();
  const { viewMode } = useViewStore();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
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
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisYearStart = new Date(today.getFullYear(), 0, 1);
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= today;
          });
          break;
        case "this_week":
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= thisWeekStart;
          });
          break;
        case "this_month":
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= thisMonthStart;
          });
          break;
        case "this_year":
          filtered = filtered.filter(bill => {
            const billDate = new Date(bill.date);
            return billDate >= thisYearStart;
          });
          break;
      }
    }
    
    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(bill => bill.category === categoryFilter);
    }
    
    setFilteredBills(filtered);
  }, [bills, viewMode, isLoggedIn, dateFilter, categoryFilter]);

  // Calculate total expenses
  const totalExpense = useMemo(() => {
    return filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [filteredBills]);

  // Group bills by date
  const groupBillsByDate = () => {
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
    }));
  };

  const billGroups = groupBillsByDate();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return t('Today');
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('Yesterday');
    } else {
      return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric"
      });
    }
  };

  const handleBillPress = (bill: Bill) => {
    router.push({
      pathname: "/bills/details",
      params: { id: bill.id }
    });
  };

  const renderBillItem = ({ item }: { item: Bill }) => {
    const category = getCategoryById(item.category);
    const CategoryIcon = getCategoryIcon(item.category);
    const categoryName = t(category.name);
    
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleBillPress(item)}>
        <Card 
          marginVertical="$1.5" 
          marginHorizontal="$2"
          padding="$3" 
          borderRadius="$3" 
          backgroundColor="white"
          elevate
          animation="bouncy"
        >
          <XStack alignItems="center" justifyContent="space-between" width="100%">
            <XStack alignItems="center" space="$3">
              <Avatar circular size="$3.5" backgroundColor={`${category.color}20`}>
                <CategoryIcon size={16} color={category.color} />
              </Avatar>
              
              <YStack>
                <Text fontWeight="$6" fontSize="$3">{item.merchant || categoryName}</Text>
                <Text fontSize="$2.5" color="$gray10">
                  {new Date(item.date).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </Text>
              </YStack>
            </XStack>
            
            <YStack alignItems="flex-end">
              <Text fontWeight="$6" fontSize="$3.5" color="$red9">-¥{item.amount.toFixed(2)}</Text>
              <Text fontSize="$2.5" color="$gray10">{categoryName}</Text>
            </YStack>
          </XStack>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderDateGroup = ({ item }: { item: (typeof billGroups)[0] }) => (
    <YStack marginBottom="$3">
      <XStack 
        justifyContent="space-between" 
        paddingHorizontal="$4" 
        paddingVertical="$2"
        marginBottom="$1"
        alignItems="center"
      >
        <XStack alignItems="center" space="$2">
          <Calendar size={16} color="#64748B" />
          <Text fontSize="$3" fontWeight="$6" color="$gray11">{formatDate(item.date)}</Text>
        </XStack>
        <Text fontSize="$3" fontWeight="$6" color="$red9">¥{item.totalAmount.toFixed(2)}</Text>
      </XStack>
      
      {item.bills.map((bill) => (
        <React.Fragment key={bill.id}>
          {renderBillItem({ item: bill })}
        </React.Fragment>
      ))}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* Header */}
        <AppHeader />
        
        {/* Filters */}
        <BillsFilter 
          dateFilter={dateFilter}
          categoryFilter={categoryFilter}
          onDateFilterChange={setDateFilter}
          onCategoryFilterChange={setCategoryFilter}
        />
        
        {/* Total Expense Display */}
        <Card 
          marginHorizontal="$3" 
          marginTop="$2" 
          marginBottom="$3" 
          padding="$3" 
          backgroundColor="white"
          borderRadius="$3"
          elevate
        >
          <XStack alignItems="center" justifyContent="space-between">
            <Text fontSize="$3" fontWeight="$5" color="$gray11">{t('Total Expense')}</Text>
            <Text fontSize="$5" fontWeight="$7" color="$red9">¥{totalExpense.toFixed(2)}</Text>
          </XStack>
        </Card>
        
        {/* Bills List */}
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </YStack>
        ) : filteredBills.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Card
              borderRadius="$4"
              padding="$5"
              maxWidth={300}
              backgroundColor="white"
              elevate
              shadowColor="rgba(0,0,0,0.1)"
              shadowRadius={10}
            >
              <YStack alignItems="center" space="$3">
                <Circle size="$8" backgroundColor="$gray2">
                  <Calendar size={28} color="#64748B" />
                </Circle>
                <Text fontSize="$4" fontWeight="$6" marginTop="$2">{t('No Bills')}</Text>
                <Text textAlign="center" color="$gray10" maxWidth={200}>
                  {viewMode === "family" && !isLoggedIn
                    ? t('Please login to view family bills')
                    : t('Try changing filters')}
                </Text>
              </YStack>
            </Card>
          </YStack>
        ) : (
          <FlatList
            data={billGroups}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={{ padding: 8, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
