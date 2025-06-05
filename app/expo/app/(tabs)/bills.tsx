import React, { useState, useEffect } from "react";
import {
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Filter, Search, Plus, Calendar, CreditCard, ShoppingBag, Film, Zap, PizzaIcon } from "lucide-react-native";
import { 
  View, 
  Text, 
  Card, 
  Button, 
  XStack, 
  YStack, 
  Input,
  Circle,
  H3,
  H4,
  Avatar,
} from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";

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

// Helper function to get icon based on category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Food":
      return <PizzaIcon  size={18} color="#3B82F6" />;
    case "Transport":
      return <CreditCard size={18} color="#3B82F6" />;
    case "Shopping":
      return <ShoppingBag size={18} color="#EC4899" />;
    case "Entertainment":
      return <Film size={18} color="#F59E0B" />;
    case "Utilities":
      return <Zap size={18} color="#8B5CF6" />;
    default:
      return <CreditCard size={18} color="#6B7280" />;
  }
};

// Get category color
const getCategoryColor = (category: string) => {
  switch (category) {
    case "Food":
      return "#10B981";
    case "Transport":
      return "#3B82F6";
    case "Shopping":
      return "#EC4899";
    case "Entertainment":
      return "#F59E0B";
    case "Utilities":
      return "#8B5CF6";
    default:
      return "#6B7280";
  }
};

export default function BillsScreen() {
  const router = useRouter();
  const { viewMode, currentFamilySpace } = useViewStore();
  const { isLoggedIn } = useAuth();

  const [loading, setLoading] = useState(true);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [searchText, setSearchText] = useState("");

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

  // Handle search
  useEffect(() => {
    if (searchText.trim() === "") return;
    
    setFilteredBills(prevBills => 
      prevBills.filter(bill => 
        (bill.merchant?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
        bill.category.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [searchText]);

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
    <Card 
      marginVertical="$2" 
      marginHorizontal="$2"
      padding="$3.5" 
      borderRadius="$4" 
      backgroundColor="white"
      elevate
      pressStyle={{ opacity: 0.9, scale: 0.98 }}
      animation="bouncy"
      onPress={() => router.push("/bills/add")}
    >
      <XStack alignItems="center" justifyContent="space-between" width="100%">
        <XStack alignItems="center" space="$3">
          <Avatar circular size="$4.5" backgroundColor={`${getCategoryColor(item.category)}20`}>
            <Avatar.Fallback alignItems="center" justifyContent="center">
              {typeof getCategoryIcon(item.category) === 'string' 
                ? getCategoryIcon(item.category) 
                : getCategoryIcon(item.category)}
            </Avatar.Fallback>
          </Avatar>
          
          <YStack>
            <Text fontWeight="$7" fontSize="$4">{item.merchant || item.category}</Text>
            <XStack alignItems="center" space="$1">
              {item.isFamilyBill && viewMode === "family" && (
                <Text fontSize="$2.5" color="$blue9">
                  {item.creatorName}
                </Text>
              )}
              <Text fontSize="$2.5" color="$gray10">{item.account}</Text>
            </XStack>
          </YStack>
        </XStack>
        
        <YStack alignItems="flex-end">
          <Text fontWeight="$7" fontSize="$4.5" color="$red9">-¥{item.amount.toFixed(2)}</Text>
          <Text fontSize="$2.5" color="$gray10">
            {new Date(item.date).getHours().toString().padStart(2, '0')}:{new Date(item.date).getMinutes().toString().padStart(2, '0')}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );

  const renderDateGroup = ({ item }: { item: (typeof billGroups)[0] }) => (
    <YStack marginBottom="$4">
      <XStack 
        justifyContent="space-between" 
        paddingHorizontal="$4" 
        paddingVertical="$2"
        marginBottom="$1"
        alignItems="center"
      >
        <XStack alignItems="center" space="$2">
          <Calendar size={16} color="#6B7280" />
          <Text fontSize="$3.5" fontWeight="$6" color="$gray11">{formatDate(item.date)}</Text>
        </XStack>
        <Text fontSize="$3.5" fontWeight="$7" color="$red9">¥{item.totalAmount.toFixed(2)}</Text>
      </XStack>
      
      {item.bills.map((bill) => renderBillItem({ item: bill }))}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* Header */}
        <LinearGradient
          colors={["$blue9", "$blue8"]}
          start={[0, 0]}
          end={[1, 0]}
          padding="$4"
        >
          <XStack 
            alignItems="center" 
            justifyContent="space-between" 
            marginBottom="$2"
          >
            <H3 color="white">
              
            </H3>

            <XStack space="$2">
              <Button
                size="$3"
                circular
                backgroundColor="rgba(255,255,255,0.2)"
                hoverStyle={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                pressStyle={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                onPress={() => router.push("/bills/add")}
              >
                <Plus size={20} color="white" />
              </Button>

              <Button
                size="$3"
                circular
                backgroundColor="rgba(255,255,255,0.2)"
                hoverStyle={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                pressStyle={{ backgroundColor: "rgba(255,255,255,0.4)" }}
                onPress={() => {
                  /* Show filter modal */
                }}
              >
                <Filter size={20} color="white" />
              </Button>
            </XStack>
          </XStack>

          {/* Search */}
          <XStack marginTop="$1">
            <Input
              flex={1}
              placeholder="Search bills..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              size="$4"
              borderRadius="$6"
              paddingLeft="$9"
              backgroundColor="rgba(255,255,255,0.2)"
              borderWidth={0}
              autoCapitalize="none"
              color="white"
              value={searchText}
              onChangeText={setSearchText}
            />
            <Button
              position="absolute"
              left="$2"
              chromeless
            >
              <Search size={20} color="rgba(255,255,255,0.7)" />
            </Button>
          </XStack>
        </LinearGradient>

        {/* Bills List */}
        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <ActivityIndicator size="large" color="#3B82F6" />
          </YStack>
        ) : filteredBills.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
            <Card
              borderRadius="$6"
              padding="$6"
              maxWidth={300}
              backgroundColor="white"
              elevate
              shadowColor="rgba(0,0,0,0.1)"
              shadowRadius={20}
            >
              <YStack alignItems="center" space="$3">
                <Circle size="$10" backgroundColor="$blue2">
                  <CreditCard size={36} color="#3B82F6" />
                </Circle>
                <H4 marginTop="$2">No Bills Found</H4>
                <Text textAlign="center" color="$gray10" maxWidth={200}>
                  {viewMode === "family" && !isLoggedIn
                    ? "Please login to view family bills"
                    : "Click the button below to add a bill"}
                </Text>
                <Button
                  marginTop="$4"
                  backgroundColor="$blue9"
                  paddingHorizontal="$6"
                  paddingVertical="$2"
                  borderRadius="$6"
                  pressStyle={{ opacity: 0.9, scale: 0.98 }}
                  onPress={() => router.push("/bills/add")}
                >
                  <Text color="white" fontWeight="$6">
                    Add Bill
                  </Text>
                </Button>
              </YStack>
            </Card>
          </YStack>
        ) : (
          <FlatList
            data={billGroups}
            renderItem={renderDateGroup}
            keyExtractor={(item) => item.date}
            contentContainerStyle={{ padding: 10 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
