import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Bill } from '@/types/bills.types';
import { Transaction } from '@/types/transactions.types';
import { getBills, getUpcomingBills } from '@/utils/bills.utils';
import { getTransactions, getRecentTransactions } from '@/utils/transactions.utils';
import { useAuth } from './AuthProvider';
import { syncSpendingWidgets } from "@/utils/spendingWidgetSync.utils";
import { storage } from '@/utils/storage.utils';

// Define the data context type
interface DataContextType {
  bills: Bill[];
  transactions: Transaction[];
  recentTransactions: Transaction[];
  upcomingBills: Bill[];
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
  dataVersion: number;
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
  const { isAuthenticated } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState<DataContextType['isLoading']>({
    bills: true,
    transactions: true,
    upcomingBills: true,
    recentTransactions: true,
    initial: true,
  });
  const [dataVersion, setDataVersion] = useState<number>(Date.now());
  const lastRefresh = React.useRef<number>(0);

  // 加载账单数据
  const loadBills = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, bills: true }));
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

  // 加载即将到期账单
  const loadUpcomingBills = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, upcomingBills: true }));
      const loadedUpcomingBills = await getUpcomingBills();
      setUpcomingBills(loadedUpcomingBills);
      return loadedUpcomingBills;
    } catch (error) {
      console.error('Failed to load upcoming bills:', error);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, upcomingBills: false }));
    }
  }, []);

  // 加载交易数据
  const loadTransactions = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, transactions: true }));
      const loadedTransactions = await getTransactions();
      setTransactions(loadedTransactions);
      return loadedTransactions;
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, transactions: false, initial: false }));
    }
  }, []);

  // 加载最近交易数据
  const loadRecentTransactions = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, recentTransactions: true }));
      const loadedRecentTransactions = await getRecentTransactions();
      setRecentTransactions(loadedRecentTransactions);
      return loadedRecentTransactions;
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      return [];
    } finally {
      setIsLoading(prev => ({ ...prev, recentTransactions: false }));
    }
  }, []);

  // Function to refresh specific data
  const refreshData = useCallback(async (dataType: 'bills' | 'transactions' | 'all' = 'all') => {
    // 使用防抖逻辑，避免短时间内多次刷新
    const now = Date.now();
    if (now - lastRefresh.current < 1000) { // 1秒内不重复刷新
      console.log("刷新间隔过短，跳过");
      return;
    }
    lastRefresh.current = now;

    try {
      // 使数据缓存失效
      if (dataType === 'bills' || dataType === 'all') {
        storage.invalidateCache('momiq_bills');
        await loadBills();
      }

      if (dataType === 'transactions' || dataType === 'all') {
        storage.invalidateCache('momiq_transactions');
        await loadTransactions();
      }

      // 更新数据版本 - 使用时间戳作为版本号
      const newVersion = Math.floor(now / 1000); // 使用秒级时间戳
      console.log(`设置新数据版本: ${newVersion}`);
      setDataVersion(newVersion);

      // 后台刷新小部件
      syncSpendingWidgets({ viewMode: "personal" }).catch(() => { });
    } catch (error) {
      console.error("刷新数据失败:", error);
    }
  }, [loadBills, loadTransactions]);

  // 刷新即将到期账单
  const refreshUpcomingBills = useCallback(async () => {
    await loadUpcomingBills();
  }, [loadUpcomingBills]);

  // 刷新最近交易
  const refreshRecentTransactions = useCallback(async () => {
    await loadRecentTransactions();
  }, [loadRecentTransactions]);

  // 初次加载数据
  useEffect(() => {
    const initialLoad = async () => {
      try {
        // 首先加载关键数据 (bills和transactions)
        await Promise.all([loadBills(), loadTransactions()]);

        // 然后加载次要数据
        Promise.all([loadUpcomingBills(), loadRecentTransactions()]).catch(err => {
          console.warn('Failed to load secondary data:', err);
        });
      } catch (error) {
        console.error('初始数据加载失败:', error);
        // 确保即使失败也重置加载状态
        setIsLoading(prev => ({
          ...prev,
          bills: false,
          transactions: false,
          initial: false
        }));
      }
    };

    initialLoad();
  }, [isAuthenticated, loadBills, loadTransactions, loadUpcomingBills, loadRecentTransactions]);

  // Context value
  const contextValue: DataContextType = {
    bills,
    transactions,
    recentTransactions,
    upcomingBills,
    isLoading,
    refreshData,
    refreshUpcomingBills,
    refreshRecentTransactions,
    dataVersion,
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