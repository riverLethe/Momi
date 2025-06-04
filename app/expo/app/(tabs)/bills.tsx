import React, { useState, useEffect } from "react";
import {
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Filter, Search, ChevronRight, Plus } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Input,
  Circle,
  Separator,
  ScrollView
} from "tamagui";

import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { Bill } from "@/types/bills.types";

// Mock bills data
const generateMockBills = (): Bill[] => {
  const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Utilities",
  ];
  const merchants = [
    "Supermarket",
    "Taxi",
    "Mall",
    "Cinema",
    "Electric Company",
  ];
  const bills: Bill[] = [];

  // Generate today's bills
  for (let i = 0; i < 3; i++) {
    const categoryIndex = Math.floor(Math.random() * categories.length);
    bills.push({
      id: `today_${i}`,
      amount: Math.floor(Math.random() * 200) + 10,
      category: categories[categoryIndex],
      account: "Cash",
      date: new Date(),
      merchant: merchants[categoryIndex],
      notes: "",
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
    const categoryIndex = Math.floor(Math.random() * categories.length);
    bills.push({
      id: `yesterday_${i}`,
      amount: Math.floor(Math.random() * 100) + 20,
      category: categories[categoryIndex],
      account: "Credit Card",
      date: yesterday,
      merchant: merchants[categoryIndex],
      notes: "",
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
    const categoryIndex = Math.floor(Math.random() * categories.length);
    bills.push({
      id: `lastweek_${i}`,
      amount: Math.floor(Math.random() * 300) + 50,
      category: categories[categoryIndex],
      account: i % 2 === 0 ? "Cash" : "WeChat Pay",
      date: lastWeek,
      merchant: merchants[categoryIndex],
      notes: "",
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
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);

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
    if (viewMode === "family") {
      if (!isLoggedIn) {
        // If not logged in, can't view family bills
        setFilteredBills([]);
      } else {
        // Filter to show only family bills
        setFilteredBills(bills.filter((bill) => bill.isFamilyBill));
      }
    } else {
      // Filter to show only personal bills
      setFilteredBills(bills.filter((bill) => !bill.isFamilyBill));
    }
  }, [bills, viewMode, isLoggedIn]);

  // Group bills by date
  const groupBillsByDate = () => {
    const groups: { [key: string]: Bill[] } = {};

    filteredBills.forEach((bill) => {
      const dateStr = bill.date.toDateString();
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
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderBillItem = ({ item }: { item: Bill }) => (
    <Button
      backgroundColor="$background"
      pressStyle={{ backgroundColor: "$gray3" }}
      onPress={() => router.push("/bills/add")}
      marginVertical="$1"
      borderBottomWidth={1}
      borderBottomColor="$gray3"
    >
      <XStack alignItems="center" justifyContent="space-between" width="100%">
        <XStack alignItems="center">
          <Circle size="$4" backgroundColor="$gray3" marginRight="$3">
            {item.category === "Food" && <Text>🍔</Text>}
            {item.category === "Transport" && <Text>🚗</Text>}
            {item.category === "Shopping" && <Text>🛍️</Text>}
            {item.category === "Entertainment" && <Text>🎬</Text>}
            {item.category === "Utilities" && <Text>💡</Text>}
          </Circle>
          <YStack>
            <Text fontWeight="$6">{item.merchant || item.category}</Text>
            <XStack alignItems="center">
              {item.isFamilyBill && viewMode === "family" && (
                <Text fontSize="$2" color="$blue9" marginRight="$1">
                  {item.creatorName}
                </Text>
              )}
              <Text fontSize="$2" color="$gray10">{item.account}</Text>
            </XStack>
          </YStack>
        </XStack>
        <Text fontWeight="$6">-¥{item.amount.toFixed(2)}</Text>
      </XStack>
    </Button>
  );

  const renderDateGroup = ({ item }: { item: (typeof billGroups)[0] }) => (
    <YStack marginBottom="$4">
      <XStack justifyContent="space-between" paddingHorizontal="$4" paddingVertical="$2">
        <Text fontSize="$4" fontWeight="$6">{formatDate(item.date)}</Text>
        <Text fontSize="$4" color="$gray10">¥{item.totalAmount.toFixed(2)}</Text>
      </XStack>
      {item.bills.map((bill) => renderBillItem({ item: bill }))}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <YStack flex={1}>
        {/* Header */}
        <XStack 
          alignItems="center" 
          justifyContent="space-between" 
          paddingHorizontal="$4" 
          paddingVertical="$3"
        >
          <Text fontSize="$6" fontWeight="$7">
            {viewMode === "personal" ? "My Bills" : "Family Bills"}
          </Text>

          <XStack>
            <Button
              size="$3"
              circular
              marginRight="$2"
              backgroundColor="$gray3"
              onPress={() => router.push("/bills/add")}
            >
              <Plus size={20} color="#000" />
            </Button>

            <Button
              size="$3"
              circular
              backgroundColor="$gray3"
              onPress={() => {
                /* Show filter modal */
              }}
            >
              <Filter size={20} color="#000" />
            </Button>
          </XStack>
        </XStack>

        {/* Search */}
        <XStack paddingHorizontal="$4" paddingBottom="$4">
          <Input
            flex={1}
            placeholder="Search bills..."
            size="$4"
            borderRadius="$4"
            paddingLeft="$8"
            backgroundColor="$gray3"
            borderWidth={0}
            autoCapitalize="none"
          />
          <Button
            position="absolute"
            left="$4"
            chromeless
          >
            <Search size={20} color="#6B7280" />
          </Button>
        </XStack>

        {/* Bills List */}
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </YStack>
        ) : filteredBills.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Text fontSize="$5" fontWeight="$6" marginBottom="$2">No bills found</Text>
            <Text textAlign="center" color="$gray10">
              {viewMode === "family" && !isLoggedIn
                ? "Please log in to view family bills"
                : "Add a new bill to get started"}
            </Text>
            <Button
              marginTop="$4"
              backgroundColor="$blue9"
              color="white"
              size="$4"
              borderRadius="$4"
              onPress={() => router.push("/bills/add")}
            >
              <Text color="white" fontWeight="$6">
                Add Bill
              </Text>
            </Button>
          </YStack>
        ) : (
          <FlatList
            data={billGroups}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
