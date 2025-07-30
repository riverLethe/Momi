import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Bill } from '@/types/bills.types';
import { Transaction } from '@/types/transactions.types';
import { getBills, getUpcomingBills, getFamilyBills, clearFamilyBillsCache } from '@/utils/bills.utils';
import { getTransactions, getRecentTransactions } from '@/utils/transactions.utils';
import { useAuth } from './AuthProvider';
import { syncSpendingWidgets } from "@/utils/spendingWidgetSync.utils";
import { storage } from '@/utils/storage.utils';
import { getFamilyBills as getFamilyBillsAPI } from '@/utils/family-bills.utils';
import { clearFamilyReportCache } from '@/utils/reports.utils';

// Define the data context type
interface DataContextType {
  // 个人数据
  bills: Bill[];
  transactions: Transaction[];
  recentTransactions: Transaction[];
  upcomingBills: Bill[];
  // 家庭数据
  familyBills: Bill[];
  isFamilyBillsLoading: boolean;
  isLoading: {
    bills: boolean;
    transactions: boolean;
    upcomingBills: boolean;
    recentTransactions: boolean;
    initial: boolean;
  };
  refreshData: (dataType?: 'bills' | 'transactions' | 'all') => Promise<void>;
  refreshUpcomingBills: () => Promise<void>;
  refreshRecentTransactions: () => Promise<void>;
  // 工具方法：按需获取指定视图模式的账单数据
  getBillsForViewMode: (viewMode: 'personal' | 'family') => Bill[];
  // 缓存管理方法
  clearFamilyBillsCache: (familyId?: string) => Promise<void>;
  // 版本控制 - 分离个人和家庭数据版本
  dataVersion: number; // 个人数据版本
  budgetVersion: number; // 个人预算版本
  familyDataVersion: number; // 家庭数据版本
  familyBudgetVersion: number; // 家庭预算版本
  /**
   * Manually bump the global data version so that consumers (e.g. report hooks,
   * widget sync) refresh their data. This should be called whenever some piece
   * of data changes that is not handled by {@link refreshData}, for example
   * when budgets are updated.
   */
  bumpDataVersion: () => void;
  bumpBudgetVersion: () => void;
  bumpFamilyDataVersion: () => void;
  bumpFamilyBudgetVersion: () => void;
  // 获取指定视图模式的数据版本
  getDataVersionForViewMode: (viewMode: 'personal' | 'family') => number;
  getBudgetVersionForViewMode: (viewMode: 'personal' | 'family') => number;
  munalCreatedBills: Bill[];
  setMunalCreatedBills: (bills: Bill[]) => void;
}

// Create the data context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Data provider props
interface DataProviderProps {
  children: ReactNode;
}

/**
 * Data Provider component
 */
export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, isRefreshBill, setIsRefreshBill } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [familyBills, setFamilyBills] = useState<Bill[]>([]);
  const [isFamilyBillsLoading, setIsFamilyBillsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState<DataContextType['isLoading']>({
    bills: false,
    transactions: false,
    upcomingBills: false,
    recentTransactions: false,
    initial: false,
  });
  const [dataVersion, setDataVersion] = useState<number>(Date.now());
  const [budgetVersion, setBudgetVersion] = useState<number>(Date.now());
  const [familyDataVersion, setFamilyDataVersion] = useState<number>(Date.now());
  const [familyBudgetVersion, setFamilyBudgetVersion] = useState<number>(Date.now());
  const lastRefresh = React.useRef<number>(0);
  const [munalCreatedBills, setMunalCreatedBills] = useState<Bill[]>([]);

  // 加载账单数据
  const loadBills = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, bills: true, initial: true }));
      const loadedBills = await getBills();
      setBills(loadedBills);
      return loadedBills;
    } catch (error) {
      console.error('Failed to load bills:', error);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, bills: false, initial: false }));
    }
  }, []);
  useEffect(() => {
    if (!isRefreshBill) return
    refreshData()
    setIsRefreshBill(false);
  }, [isRefreshBill])

  // 加载交易数据
  const loadTransactions = useCallback(async () => {
    try {
      const loadedTransactions = await getTransactions();
      setTransactions(loadedTransactions);
      return loadedTransactions;
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  }, []);

  // 加载即将到期账单 - 后台加载
  const loadUpcomingBills = useCallback(async () => {
    try {
      const loadedUpcomingBills = await getUpcomingBills();
      setUpcomingBills(loadedUpcomingBills);
      return loadedUpcomingBills;
    } catch (error) {
      console.error('Failed to load upcoming bills:', error);
      return [];
    }
  }, []);

  // 加载最近交易数据 - 后台加载
  const loadRecentTransactions = useCallback(async () => {
    try {
      const loadedRecentTransactions = await getRecentTransactions();
      setRecentTransactions(loadedRecentTransactions);
      return loadedRecentTransactions;
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      return [];
    }
  }, []);

  // 加载家庭账单数据
  const loadFamilyBills = useCallback(async (
    familyId?: string,
    options?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
      forceRefresh?: boolean;
    }
  ) => {
    const targetFamilyId = familyId || user?.family?.id;

    try {
      setIsFamilyBillsLoading(true);

      // 使用统一的缓存管理系统
      const bills = await getFamilyBills(
        options?.forceRefresh || false,
        async () => {
          if (!targetFamilyId) return [];
          // 网络请求函数
          const response = await getFamilyBillsAPI(targetFamilyId);
          return response.data.bills.map((bill: any) => ({
            ...bill,
            date: new Date(bill.date),
            createdAt: new Date(bill.createdAt),
            updatedAt: new Date(bill.updatedAt),
            isFamilyBill: true,
            familyId: targetFamilyId,
            familyName: user?.family?.name || "Family",
            // 家庭账单只读 - 只有创建者可以编辑
            isReadOnly: bill.createdBy !== user?.id
          }));
        }
      );

      setFamilyBills(bills);

      // 家庭账单更新后，只更新家庭数据版本
      const newVersion = Math.floor(Date.now() / 1000);
      setFamilyDataVersion(newVersion);
      setFamilyBudgetVersion(newVersion);

      // 检查家庭报告缓存是否需要更新
      if (options?.forceRefresh || familyDataVersion !== newVersion) {
        // 清除家庭相关的报告缓存
        try {
          clearFamilyReportCache();
        } catch (error) {
          console.warn('清除家庭报告缓存时出错:', error);
          // 如果清除缓存失败，不影响主要功能
        }
      }

      return bills;
    } catch (error) {
      console.error(`Failed to load family bills for ${targetFamilyId}:`, error);
      setFamilyBills([]);
      return [];
    } finally {
      setIsFamilyBillsLoading(false);
    }
  }, [user?.family?.id, user?.family?.name, user?.id, familyDataVersion]);

  // Function to refresh specific data
  const refreshData = useCallback(async (dataType: 'bills' | 'transactions' | 'all' = 'all') => {
    // 使用防抖逻辑，避免短时间内多次刷新
    const now = Date.now();
    if (now - lastRefresh.current < 1000) { // 1秒内不重复刷新
      return;
    }
    lastRefresh.current = now;

    try {
      // 使数据缓存失效
      if (dataType === 'bills' || dataType === 'all') {
        storage.invalidateCache('momiq_bills');
        await loadBills();

        // 如果用户有家庭，也刷新家庭账单
        if (user?.family?.id) {
          // 清理家庭账单的缓存
          await clearFamilyBillsCache();
          await loadFamilyBills(user.family.id, { forceRefresh: true });
        }
      }

      if (dataType === 'transactions' || dataType === 'all') {
        storage.invalidateCache('momiq_transactions');
        await loadTransactions();
      }

      // 更新数据版本 - 使用时间戳作为版本号
      const newVersion = Math.floor(now / 1000); // 使用秒级时间戳
      setDataVersion(newVersion);

      // 账单或交易变化时，预算报表也需要更新（因为会影响预算状态和健康分数）
      setBudgetVersion(newVersion);

      // 后台刷新小部件 - 不阻塞UI，使用优化的同步
      setTimeout(() => {
        syncSpendingWidgets({
          viewMode: "personal",
          dataVersion: newVersion,
          forceSync: false // 使用智能同步，避免过度刷新
        }).catch(() => { });
      }, 200); // 减少延迟时间
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  }, [loadBills, loadTransactions, loadFamilyBills, user?.family?.id]);

  // 刷新即将到期账单
  const refreshUpcomingBills = useCallback(async () => {
    await loadUpcomingBills();
  }, [loadUpcomingBills]);

  // 刷新最近交易
  const refreshRecentTransactions = useCallback(async () => {
    await loadRecentTransactions();
  }, [loadRecentTransactions]);


  // 按需获取指定视图模式的账单数据
  const getBillsForViewMode = useCallback((viewMode: 'personal' | 'family'): Bill[] => {
    if (viewMode === "personal") {
      // 个人模式：只返回个人账单
      return bills.filter(bill => !bill.isFamilyBill);
    } else if (viewMode === "family") {
      // 家庭模式：返回个人账单 + 家庭账单，但去重
      const personalBills = bills.filter(bill => !bill.isFamilyBill);
      const allBills = [...personalBills, ...familyBills];

      // 按ID去重，优先保留家庭账单版本（因为可能包含更多信息）
      const billMap = new Map<string, Bill>();
      allBills.forEach(bill => {
        const existing = billMap.get(bill.id);
        if (!existing || bill.isFamilyBill) {
          billMap.set(bill.id, bill);
        }
      });

      return Array.from(billMap.values()).sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return bills;
  }, [bills, familyBills]);

  // 初次加载数据
  useEffect(() => {
    const initialLoad = async () => {
      try {
        // 优先加载关键数据 - bills为主，transactions可后台
        await loadBills();


        // 后台加载次要数据
        setTimeout(() => {
          loadTransactions();
          loadUpcomingBills();
          loadRecentTransactions();
        }, 100);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    initialLoad();
  }, [loadBills, loadTransactions, loadUpcomingBills, loadRecentTransactions]);
  useEffect(() => {
    if (!user?.family?.id) return
    // 如果用户有家庭，同时加载家庭账单数据
    loadFamilyBills(user.family.id, { forceRefresh: false });
  }, [loadFamilyBills, user?.family?.id]);

  /**
   * Increment the global {@link dataVersion} so that any hook relying on this
   * value (e.g. {@link useReportData} or the widget-sync hooks) will perform a
   * fresh fetch. We simply use the current timestamp to guarantee monotonic
   * increase.
   */
  const bumpDataVersion = useCallback(() => {
    setDataVersion(Date.now());
  }, []);

  const bumpBudgetVersion = useCallback(() => {
    setBudgetVersion(Date.now());
  }, []);

  const bumpFamilyDataVersion = useCallback(() => {
    setFamilyDataVersion(Date.now());
  }, []);

  const bumpFamilyBudgetVersion = useCallback(() => {
    setFamilyBudgetVersion(Date.now());
  }, []);

  // 获取指定视图模式的数据版本
  const getDataVersionForViewMode = useCallback((viewMode: 'personal' | 'family'): number => {
    return viewMode === 'family' ? Math.max(dataVersion, familyDataVersion) : dataVersion;
  }, [dataVersion, familyDataVersion]);

  const getBudgetVersionForViewMode = useCallback((viewMode: 'personal' | 'family'): number => {
    return viewMode === 'family' ? Math.max(budgetVersion, familyBudgetVersion) : budgetVersion;
  }, [budgetVersion, familyBudgetVersion]);

  // 清理家庭账单缓存
  const clearFamilyBillsCacheMethod = useCallback(async (familyId?: string) => {
    try {
      await clearFamilyBillsCache();

      // 如果是当前用户的家庭，清空状态
      if (!familyId || familyId === user?.family?.id) {
        setFamilyBills([]);
      }
    } catch (error) {
      console.error("Failed to clear family bills cache:", error);
    }
  }, [user?.family?.id]);

  // Context value
  const contextValue: DataContextType = {
    // 个人数据
    bills,
    transactions,
    recentTransactions,
    upcomingBills,
    // 家庭数据
    familyBills,
    isFamilyBillsLoading,
    isLoading,
    refreshData,
    refreshUpcomingBills,
    refreshRecentTransactions,
    getBillsForViewMode,
    // 缓存管理方法
    clearFamilyBillsCache: clearFamilyBillsCacheMethod,
    // 版本控制
    dataVersion,
    budgetVersion,
    familyDataVersion,
    familyBudgetVersion,
    bumpDataVersion,
    bumpBudgetVersion,
    bumpFamilyDataVersion,
    bumpFamilyBudgetVersion,
    getDataVersionForViewMode,
    getBudgetVersionForViewMode,
    munalCreatedBills,
    setMunalCreatedBills,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

/**
 * Custom hook to use data context
 */
export const useData = (): DataContextType => {
  const context = useContext(DataContext);

  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }

  return context;
};