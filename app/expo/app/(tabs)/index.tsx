import React, { useState, useEffect } from "react";
import { ScrollView, ActivityIndicator, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack, Text } from "tamagui";

// Providers and Stores
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";

// Custom Components
import HomeHeader from "@/components/home/HomeHeader";
import QuickActionBar from "@/components/home/QuickActionBar";
import BudgetSummaryCard, { 
  BudgetStatusInfo,
  CategorySpending,
  BudgetPeriod 
} from "@/components/home/BudgetSummaryCard";
import RecentBillsList from "@/components/home/RecentBillsList";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Constants and Types
import { getCategoryById } from "@/constants/categories";
import { Bill } from "@/types/bills.types";
import { getUserPreferences, updateUserPreferences } from "@/utils/userPreferences.utils";
import { syncRemoteData } from "@/utils/sync.utils";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const { bills, upcomingBills, transactions, recentTransactions, isLoading: isDataLoading, refreshData } = useData();
  
  // 用户是否有账单或交易
  const [hasBills, setHasBills] = useState(true);
  
  // 预算周期状态
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("monthly");
  
  // 预算数据
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusInfo>({
    status: "good",
    remaining: 0,
    spent: 0,
    total: 0,
    percentage: 0
  });
  
  // 类别分析数据
  const [categories, setCategories] = useState<CategorySpending[]>([]);
  
  // 是否显示加载状态
  const [isLoading, setIsLoading] = useState(false);
  
  // 是否正在同步远程数据
  const [syncingRemote, setSyncingRemote] = useState(false);
  
  // 预算金额
  const [currentBudget, setCurrentBudget] = useState<number | null>(null);
  
  // 同步远程数据
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user) {
        try {
          setSyncingRemote(true);
          // 同步账单和交易数据
          await syncRemoteData('bills', user.id);
          await syncRemoteData('transactions', user.id);
          // 刷新本地数据
          await refreshData();
        } catch (error) {
          console.error('Failed to sync remote data:', error);
        } finally {
          setSyncingRemote(false);
        }
      }
    };

    syncData();
  }, [isAuthenticated, user]);
  
  // 加载用户偏好
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const preferences = await getUserPreferences();
        
        // 如果有设置预算金额，则使用
        if (preferences && preferences.budgetAmount) {
          setCurrentBudget(preferences.budgetAmount);
        }
        
        // 如果有设置预算周期，则使用
        if (preferences && preferences.budgetPeriod) {
          setBudgetPeriod(preferences.budgetPeriod as BudgetPeriod);
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };
    
    loadUserPreferences();
  }, []);
  
  // 检查是否有账单或交易数据
  useEffect(() => {
    setHasBills(bills.length > 0 || transactions.length > 0);
  }, [bills, transactions]);
  
  // 计算预算状态
  useEffect(() => {
    // 计算总支出
    let totalSpent = 0;
    
    // 根据预算周期过滤交易和账单
    const today = new Date();
    
    // 过滤交易数据
    const filteredTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      if (budgetPeriod === "weekly") {
        // 获取本周起始日期
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek && tx.type === 'expense';
      } else if (budgetPeriod === "monthly") {
        // 获取本月起始日期
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return txDate >= startOfMonth && tx.type === 'expense';
      } else {
        // 获取本年起始日期
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return txDate >= startOfYear && tx.type === 'expense';
      }
    });
    
    // 过滤账单数据
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.date);
      
      if (budgetPeriod === "weekly") {
        // 获取本周起始日期
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return billDate >= startOfWeek;
      } else if (budgetPeriod === "monthly") {
        // 获取本月起始日期
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return billDate >= startOfMonth;
      } else {
        // 获取本年起始日期
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return billDate >= startOfYear;
      }
    });
    
    // 计算交易总支出
    const transactionsSpent = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // 计算账单总支出
    const billsSpent = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);
    
    // 计算总支出（交易 + 账单）
    totalSpent = transactionsSpent + billsSpent;
    
    // 计算剩余预算
    const total = currentBudget || 0;
    const remaining = Math.max(0, total - totalSpent);
    const percentage = total > 0 ? Math.round((totalSpent / total) * 100) : 0;
    
    // 确定状态
    let status: "good" | "warning" | "danger" = "good";
    if (percentage >= 90) {
      status = "danger";
    } else if (percentage >= 70) {
      status = "warning";
    }
    
    // 更新预算状态
    setBudgetStatus({
      status,
      remaining,
      spent: totalSpent,
      total,
      percentage,
    });
    
    // 计算类别支出 (合并交易和账单数据)
    const categoryMap = new Map<string, number>();
    
    // 添加交易类别支出
    filteredTransactions.forEach(tx => {
      const currentAmount = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, currentAmount + tx.amount);
    });
    
    // 添加账单类别支出
    filteredBills.forEach(bill => {
      const currentAmount = categoryMap.get(bill.category) || 0;
      categoryMap.set(bill.category, currentAmount + bill.amount);
    });
    
    // 转换为类别支出数组
    const categorySpending: CategorySpending[] = Array.from(categoryMap.entries())
      .map(([id, amount]) => {
        const categoryInfo = getCategoryById(id);
        const categoryPercentage = total > 0 ? Math.round((amount / total) * 100) : 0;
        
        let status: "normal" | "exceeding" | "save" = "normal";
        if (categoryPercentage >= 25) { // 假设类别预算占总预算的25%
          status = "exceeding";
        } else if (categoryPercentage <= 10) {
          status = "save";
        }
        
        return {
          id,
          label: categoryInfo?.name || id,
          status,
          percentage: categoryPercentage > 25 ? categoryPercentage - 25 : 0, // 超出预算的百分比
          amount,
          color: categoryInfo?.color || "#999",
        };
      })
      .sort((a, b) => b.amount - a.amount) // 按金额降序排序
      .slice(0, 5); // 只取前五项
    
    setCategories(categorySpending);
  }, [transactions, bills, budgetPeriod, currentBudget, viewMode]);
  
  // 处理设置预算
  const handleSaveBudget = async (amount: number, period: BudgetPeriod) => {
    setIsLoading(true);
    try {
      // 保存到用户偏好
      await updateUserPreferences({
        budgetAmount: amount,
        budgetPeriod: period,
      });
      
      // 更新状态
      setCurrentBudget(amount);
      setBudgetPeriod(period);
    } catch (error) {
      console.error('Failed to save budget:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 处理刷新
  const handleRefresh = async () => {
    await refreshData();
  };
  
  // 处理开始聊天
  const handleStartChat = () => {
    router.push("/chat");
  };
  
  // 处理添加账单
  const handleAddBill = () => {
    router.push('/bills/add');
  };
  
  // 处理预算管理
  const handleManageBudget = () => {
    // 这里可以打开预算管理模态框或导航到预算页面
    router.push("/reports?tab=budget");
  };
  
  // 处理查看账单详情
  const handleViewBill = (bill: Bill) => {
    // 简化处理，跳转到账单列表
    router.push("/bills");
  };
  
  // 处理查看类别详情
  const handleCategoryPress = (categoryId: string) => {
    // 简化处理，直接跳转到报表页面
    router.push(`/reports?category=${categoryId}`);
  };
  
  // 如果正在加载数据，显示加载状态
  if (isDataLoading || syncingRemote) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        {/* <HomeHeader /> */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16 }}>Loading your financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  // 如果用户没有账单或交易，显示欢迎屏幕
  if (!hasBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        {/* <HomeHeader /> */}
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isDataLoading || syncingRemote}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
            />
          }
        >
          {/* 快捷操作栏 */}
          {/* <QuickActionBar 
            onAddBillPress={handleAddBill}
            onAddBudgetPress={handleManageBudget}
            onViewBillsPress={() => router.push("/bills")}
            onStartChatPress={handleStartChat}
            onAnalysisPress={() => router.push("/reports")}
          /> */}
          
          {/* 预算摘要卡片 */}
          <BudgetSummaryCard 
            budgetStatus={budgetStatus}
            categories={categories}
            isLoading={isLoading}
            currentPeriod={budgetPeriod}
            currentBudget={currentBudget}
            onSaveBudget={handleSaveBudget}
            onCategoryPress={handleCategoryPress}
            onManageBudgetPress={handleManageBudget}
            isPersonalView={viewMode === "personal"}
          />
          
          {/* 最近账单列表 */}
          <RecentBillsList 
            bills={bills.slice(0, 5)}
            isLoading={false}
            maxItems={5}
          />
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}
