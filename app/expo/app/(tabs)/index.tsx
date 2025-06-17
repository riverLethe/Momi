import React, { useState, useEffect } from "react";
import {
  ScrollView,
  ActivityIndicator,
  View,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { YStack, Text, Separator } from "tamagui";

// Providers and Stores
import { useViewStore } from "@/stores/viewStore";
import { useAuth } from "@/providers/AuthProvider";
import { useData } from "@/providers/DataProvider";

// Custom Components
import BudgetSummaryCard, {
  BudgetStatusInfo,
  CategorySpending,
  BudgetPeriod,
} from "@/components/home/BudgetSummaryCard";
import BudgetUpdateModal from "@/components/budget/BudgetUpdateModal";
import RecentBillsList from "@/components/home/RecentBillsList";
import WelcomeScreen from "@/components/home/WelcomeScreen";

// Constants and Types
import { getCategoryById } from "@/constants/categories";
import { Bill } from "@/types/bills.types";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/utils/userPreferences.utils";
import { syncRemoteData } from "@/utils/sync.utils";
import { UserPreferences } from "@/types/user.types";
import { useBudgets } from "@/hooks/useBudgets";
import { Budgets } from "@/utils/budget.utils";

type FilterMode = "all" | "include" | "exclude";

export default function HomeScreen() {
  const router = useRouter();
  const { viewMode } = useViewStore();
  const { isAuthenticated, user } = useAuth();
  const {
    bills,
    transactions,
    isLoading: isDataLoading,
    refreshData,
  } = useData();

  // Whether user has bills or transactions
  const [hasBills, setHasBills] = useState(true);

  // Budgets loaded via custom hook
  const { budgets, saveBudgetForPeriod } = useBudgets();

  // Selected period for UI (default monthly)
  const [budgetPeriod, setBudgetPeriod] = useState<BudgetPeriod>("monthly");

  // Budget data
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusInfo>({
    status: "none",
    remaining: 0,
    spent: 0,
    total: 0,
    percentage: 0,
  });

  // Category analysis data
  const [categories, setCategories] = useState<CategorySpending[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Modal open state for BudgetUpdateModal
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);

  // Remote data synchronization
  const [syncingRemote, setSyncingRemote] = useState(false);

  // Category filter state
  const [includedCategories, setIncludedCategories] = useState<string[]>([]);
  const [excludedCategories, setExcludedCategories] = useState<string[]>([]);

  // Sync remote data
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user) {
        try {
          setSyncingRemote(true);
          // Sync bills and transactions data
          await syncRemoteData("bills", user.id);
          await syncRemoteData("transactions", user.id);
          // Refresh local data
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

  // Load user preferences (category filters etc.)
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        const preferences = await getUserPreferences();

        if (preferences) {
          // Prefer new per-period filters if present
          const periodFilters = preferences.budgetFilters?.[budgetPeriod];
          if (periodFilters) {
            if (periodFilters.mode === "include") {
              setIncludedCategories(periodFilters.categories);
              setExcludedCategories([]);
            } else if (periodFilters.mode === "exclude") {
              setExcludedCategories(periodFilters.categories);
              setIncludedCategories([]);
            } else {
              setIncludedCategories([]);
              setExcludedCategories([]);
            }
          } else {
            // Fallback to legacy global fields
            if (preferences.budgetIncludedCategories) {
              setIncludedCategories(preferences.budgetIncludedCategories);
            }

            if (preferences.budgetExcludedCategories) {
              setExcludedCategories(preferences.budgetExcludedCategories);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load user preferences:", error);
      }
    };

    loadUserPreferences();
  }, []);

  // Check if there are bills or transaction data
  useEffect(() => {
    setHasBills(bills.length > 0 || transactions.length > 0);
  }, [bills, transactions]);

  // Calculate budget status (for selected period)
  useEffect(() => {
    // Calculate total expenses
    let totalSpent = 0;

    // Filter transactions and bills by budget period
    const today = new Date();

    // Filter transactions
    const filteredTransactions = transactions.filter((tx) => {
      const txDate = new Date(tx.date);

      // Category filter
      const shouldSkipCategory =
        (includedCategories.length > 0 &&
          !includedCategories.includes(tx.category)) ||
        (includedCategories.length === 0 &&
          excludedCategories.includes(tx.category));

      if (shouldSkipCategory) return false;

      if (budgetPeriod === "weekly") {
        // Get start of week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return txDate >= startOfWeek && tx.type === "expense";
      } else if (budgetPeriod === "monthly") {
        // Get start of month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return txDate >= startOfMonth && tx.type === "expense";
      } else {
        // Get start of year
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return txDate >= startOfYear && tx.type === "expense";
      }
    });

    // Filter bills
    const filteredBills = bills.filter((bill) => {
      const billDate = new Date(bill.date);

      // Category filter
      const shouldSkipCategory =
        (includedCategories.length > 0 &&
          !includedCategories.includes(bill.category)) ||
        (includedCategories.length === 0 &&
          excludedCategories.includes(bill.category));

      if (shouldSkipCategory) return false;

      if (budgetPeriod === "weekly") {
        // Get start of week
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return billDate >= startOfWeek;
      } else if (budgetPeriod === "monthly") {
        // Get start of month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return billDate >= startOfMonth;
      } else {
        // Get start of year
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return billDate >= startOfYear;
      }
    });

    // Calculate total transaction expenses
    const transactionsSpent = filteredTransactions.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );

    // Calculate total bill expenses
    const billsSpent = filteredBills.reduce(
      (sum, bill) => sum + bill.amount,
      0
    );

    // Calculate total expenses (transactions + bills)
    totalSpent = transactionsSpent + billsSpent;

    // Retrieve budget detail for selected period
    const periodDetail = budgets[budgetPeriod] || {
      amount: null,
      filterMode: "all" as FilterMode,
      categories: [],
    };

    const total = periodDetail.amount || 0;
    const remaining = Math.max(0, total - totalSpent);
    const percentage = total > 0 ? Math.round((totalSpent / total) * 100) : 0;

    // Determine status
    let status: "good" | "warning" | "danger" | "none" = "none";
    if (periodDetail.amount == null) {
      status = "none";
    } else if (percentage >= 90) {
      status = "danger";
    } else if (percentage >= 70) {
      status = "warning";
    } else {
      status = "good";
    }

    // Update budget status
    setBudgetStatus({
      status,
      remaining,
      spent: totalSpent,
      total,
      percentage,
    });

    // Calculate category expenses (combine transactions and bills)
    const categoryMap = new Map<string, number>();

    // Add transaction category expenses
    filteredTransactions.forEach((tx) => {
      const currentAmount = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, currentAmount + tx.amount);
    });

    // Add bill category expenses
    filteredBills.forEach((bill) => {
      const currentAmount = categoryMap.get(bill.category) || 0;
      categoryMap.set(bill.category, currentAmount + bill.amount);
    });

    // Convert to category spending array
    const categorySpending: CategorySpending[] = Array.from(
      categoryMap.entries()
    )
      .map(([id, amount]) => {
        const categoryInfo = getCategoryById(id);
        const categoryPercentage =
          total > 0 ? Math.round((amount / total) * 100) : 0;

        let status: "normal" | "exceeding" | "save" = "normal";
        if (categoryPercentage >= 25) {
          // Assume category budget is 25% of total
          status = "exceeding";
        } else if (categoryPercentage <= 10) {
          status = "save";
        }

        return {
          id,
          label: categoryInfo?.name || id,
          status,
          percentage: categoryPercentage > 25 ? categoryPercentage - 25 : 0, // Percentage exceeding budget
          amount,
          color: categoryInfo?.color || "#999",
        };
      })
      .sort((a, b) => b.amount - a.amount) // Sort by amount in descending order
      .slice(0, 5); // Only take top five

    setCategories(categorySpending);
  }, [
    transactions,
    bills,
    budgetPeriod,
    budgets,
    viewMode,
    includedCategories,
    excludedCategories,
  ]);

  // Update category filter state when budgetPeriod changes
  useEffect(() => {
    const applyPeriodFilters = () => {
      const detail = budgets[budgetPeriod];
      if (!detail) return;

      if (detail.filterMode === "include") {
        setIncludedCategories(detail.categories);
        setExcludedCategories([]);
      } else if (detail.filterMode === "exclude") {
        setExcludedCategories(detail.categories);
        setIncludedCategories([]);
      } else {
        setIncludedCategories([]);
        setExcludedCategories([]);
      }
    };

    applyPeriodFilters();
  }, [budgetPeriod, budgets]);

  // Handle setting budget
  const handleSaveBudgets = async (nextBudgets: Budgets) => {
    setIsLoading(true);
    try {
      // Persist budgets and filters per period
      const periods: ("weekly" | "monthly" | "yearly")[] = [
        "weekly",
        "monthly",
        "yearly",
      ];

      // Prepare preferences update object
      const prefsUpdate: Partial<UserPreferences> = {
        budgetFilters: {},
      };

      for (const p of periods) {
        const detailObj = nextBudgets[p] as any;
        await saveBudgetForPeriod(p, detailObj);

        prefsUpdate.budgetFilters![p] = {
          mode: detailObj.filterMode,
          categories: detailObj.categories,
        };
      }

      await updateUserPreferences(prefsUpdate);

      // Update local filter state according to current selected period
      const currentDetail = nextBudgets[budgetPeriod];
      if (currentDetail?.filterMode === "include") {
        setIncludedCategories(currentDetail.categories);
        setExcludedCategories([]);
      } else if (currentDetail?.filterMode === "exclude") {
        setExcludedCategories(currentDetail.categories);
        setIncludedCategories([]);
      } else {
        setIncludedCategories([]);
        setExcludedCategories([]);
      }
    } catch (error) {
      console.error("Failed to save budgets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    await refreshData();
  };

  // Handle starting chat
  const handleStartChat = () => {
    router.push("/chat");
  };


  // Navigate to dedicated budget management page
  const handleManageBudget = () => {
    router.push("/reports?tab=budget");
  };

  // Handle viewing category details
  const handleCategoryPress = (categoryId: string) => {
    router.push(`/reports?category=${categoryId}`);
  };

  // If loading data, show loading state
  if (isDataLoading || syncingRemote) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16 }}>Loading your financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If user has no bills or transactions, show welcome screen
  if (!hasBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }}>
        <WelcomeScreen onStartChatPress={handleStartChat} />
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <YStack flex={1}>
          {/* Content */}
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
            {/* Budget Summary Card */}
            <BudgetSummaryCard
              budgetStatus={budgetStatus}
              categories={categories}
              isLoading={isLoading}
              budgets={{
                weekly: budgets.weekly?.amount ?? null,
                monthly: budgets.monthly?.amount ?? null,
                yearly: budgets.yearly?.amount ?? null,
              }}
              currentPeriod={budgetPeriod}
              onPeriodChange={setBudgetPeriod}
              onCategoryPress={handleCategoryPress}
              onManageBudgetPress={handleManageBudget}
              onEditBudgetPress={() => setBudgetModalOpen(true)}
              isPersonalView={viewMode === "personal"}
            />
            <Separator marginVertical="$2" borderColor="$gray3" />

            {/* Recent Bills List */}
            <RecentBillsList
              bills={bills.slice(0, 5)}
              isLoading={false}
              maxItems={5}
            />
          </ScrollView>
        </YStack>
      </SafeAreaView>
      {/* Budget Update Modal */}
      <BudgetUpdateModal
        isOpen={isBudgetModalOpen}
        onOpenChange={setBudgetModalOpen}
        budgets={budgets}
        onSave={handleSaveBudgets}
        defaultPeriod={budgetPeriod}
      />
    </>
  );
}
