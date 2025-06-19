import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Bill } from '@/types/bills.types';
import { Transaction } from '@/types/transactions.types';
import { getBills, getUpcomingBills } from '@/utils/bills.utils';
import { getTransactions, getRecentTransactions } from '@/utils/transactions.utils';
import { useAuth } from './AuthProvider';
import { syncSpendingWidgets } from "@/utils/spendingWidgetSync.utils";

// Define the data context type
interface DataContextType {
  bills: Bill[];
  transactions: Transaction[];
  recentTransactions: Transaction[];
  upcomingBills: Bill[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Function to load all data
  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load bills
      const loadedBills = await getBills();
      setBills(loadedBills);

      // Load upcoming bills
      const loadedUpcomingBills = await getUpcomingBills();
      setUpcomingBills(loadedUpcomingBills);

      // Load transactions
      const loadedTransactions = await getTransactions();
      setTransactions(loadedTransactions);

      // Load recent transactions
      const loadedRecentTransactions = await getRecentTransactions();
      setRecentTransactions(loadedRecentTransactions);

      // After data reload, refresh widgets in background (personal view)
      syncSpendingWidgets({ viewMode: "personal" }).catch(() => { });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh function for pull-to-refresh
  const refreshData = async () => {
    await loadData();
  };

  // Load data on mount and when auth status changes
  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  // Context value
  const contextValue: DataContextType = {
    bills,
    transactions,
    recentTransactions,
    upcomingBills,
    isLoading,
    refreshData,
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