import React, { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack } from "tamagui";

// Providers and Stores
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";

// Custom Components
import HomeHeader from "@/components/home/HomeHeader";
import QuickActionBar from "@/components/home/QuickActionBar";
import BudgetSummaryCard from "@/components/home/BudgetSummaryCard";
import { 
  BudgetStatusInfo,
  CategorySpending 
} from "@/components/home/BudgetSummaryCard";
import RecentBillsList from "@/components/home/RecentBillsList";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Constants and Types
import { getCategoryById } from "@/constants/categories";
import { Bill } from "@/types/bills.types";

// Mock data
const MOCK_BILLS: Bill[] = [
  {
    id: "1",
    amount: 128.5,
    category: "food",
    date: new Date(),
    merchant: "Grocery Store",
    notes: "Weekly groceries",
    createdBy: "user_1",
    creatorName: "John",
    isFamilyBill: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    amount: 45.0,
    category: "transport",
    date: new Date(Date.now() - 86400000), // yesterday
    merchant: "Gas Station",
    notes: "Fuel",
    createdBy: "user_1",
    creatorName: "John",
    isFamilyBill: false,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000),
  },
  {
    id: "3",
    amount: 200.0,
    category: "shopping",
    date: new Date(Date.now() - 2 * 86400000), // 2 days ago
    merchant: "Department Store",
    notes: "Clothes",
    createdBy: "user_1",
    creatorName: "John",
    isFamilyBill: false,
    createdAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000),
  }
];

// Mock budget categories
const MOCK_CATEGORIES: CategorySpending[] = [
  { 
    id: "food", 
    label: "Food", 
    status: "normal", 
    percentage: 0, 
    amount: 850,
    color: getCategoryById("food").color
  },
  { 
    id: "shopping", 
    label: "Shopping", 
    status: "exceeding", 
    percentage: 15, 
    amount: 450,
    color: getCategoryById("shopping").color
  },
  { 
    id: "entertainment", 
    label: "Entertainment", 
    status: "save", 
    percentage: 30, 
    amount: 200,
    color: getCategoryById("entertainment").color
  },
];

// Mock family budget categories
const MOCK_FAMILY_CATEGORIES: CategorySpending[] = [
  { 
    id: "food", 
    label: "Food", 
    status: "exceeding", 
    percentage: 12, 
    amount: 920,
    color: getCategoryById("food").color
  },
  { 
    id: "shopping", 
    label: "Shopping", 
    status: "exceeding", 
    percentage: 20, 
    amount: 580,
    color: getCategoryById("shopping").color
  },
  { 
    id: "entertainment", 
    label: "Entertainment", 
    status: "normal", 
    percentage: 0, 
    amount: 350,
    color: getCategoryById("entertainment").color
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  
  // 用户是否有账单
  const [hasBills, setHasBills] = useState(true);
  
  // 预算周期状态
  const [budgetPeriod, setBudgetPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  
  // 预算数据
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusInfo>({
    status: "good",
    remaining: 2400,
    spent: 2600,
    total: 5000,
    percentage: 52
  });
  
  // 类别分析数据
  const [categories, setCategories] = useState<CategorySpending[]>(MOCK_CATEGORIES);
  
  // 账单数据
  const [bills, setBills] = useState<Bill[]>(MOCK_BILLS);
  
  // 是否显示加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 预算金额
  const [currentBudget, setCurrentBudget] = useState<number | null>(5000);
  
  // 根据视图模式和预算周期更新数据
  useEffect(() => {
    if (viewMode === "family") {
      setBudgetStatus({
        status: "warning",
        remaining: 1800,
        spent: 3200,
        total: 5000,
        percentage: 64
      });
      setCategories(MOCK_FAMILY_CATEGORIES);
    } else {
      setBudgetStatus({
        status: "good",
        remaining: 2400,
        spent: 2600,
        total: 5000,
        percentage: 52
      });
      setCategories(MOCK_CATEGORIES);
    }
  }, [viewMode, budgetPeriod]);
  
  // 处理设置预算
  const handleSaveBudget = async (amount: number, period: "weekly" | "monthly" | "yearly") => {
    setIsLoading(true);
    try {
      // 这里应该调用API保存预算
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentBudget(amount);
      setBudgetPeriod(period);
      
      // 更新预算状态
      setBudgetStatus(prev => ({
        ...prev,
        total: amount,
        remaining: amount - prev.spent,
        percentage: Math.round((prev.spent / amount) * 100)
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理开始聊天
  const handleStartChat = () => {
    router.push("/chat");
  };
  
  // 处理添加账单
  const handleAddBill = () => {
    router.push("/bills/add");
  };
  
  // 处理预算管理
  const handleManageBudget = () => {
    // 这里可以打开预算管理模态框或导航到预算页面
    router.push("/reports?tab=budget");
  };
  
  // 处理查看账单详情
  const handleViewBill = (bill: Bill) => {
    // 简化处理，直接跳转到账单列表
    router.push("/bills");
  };
  
  // 处理查看类别详情
  const handleCategoryPress = (categoryId: string) => {
    // 简化处理，直接跳转到报表页面
    router.push("/reports");
  };
  
  // 如果用户没有账单，显示欢迎屏幕
  if (!hasBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <HomeHeader />
        <WelcomeScreen 
          onStartChatPress={handleStartChat}
          onSetBudgetPress={() => setHasBills(true)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <YStack flex={1}>
        {/* 头部 */}
        {/* <HomeHeader /> */}
        
        {/* 内容 */}
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 快速操作栏 */}
          {/* <QuickActionBar 
            onAddBillPress={handleAddBill}
            onAddBudgetPress={() => {}}
            onViewBillsPress={() => router.push("/bills")}
            onStartChatPress={handleStartChat}
            onAnalysisPress={() => router.push("/reports")}
          /> */}
          
          {/* 预算摘要卡片 - 整合了预算设置和分析 */}
          <BudgetSummaryCard 
            currentPeriod={budgetPeriod}
            currentBudget={currentBudget}
            onSaveBudget={handleSaveBudget}
            isLoading={isLoading}
            budgetStatus={budgetStatus}
            categories={categories}
            isPersonalView={viewMode === "personal"}
            onManageBudgetPress={handleManageBudget}
            onCategoryPress={handleCategoryPress}
          />

          {/* 最近账单 */}
          <RecentBillsList 
            bills={bills}
            isLoading={isLoading}
            maxItems={5}
          />
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
