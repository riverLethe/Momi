import { v4 as uuidv4 } from 'uuid';
import { storage, STORAGE_KEYS } from './storage.utils';
import { Transaction, TransactionInput, TransactionFilter } from '@/types/transactions.types';
import { User } from '@/types/user.types';
import { format, subDays, isWithinInterval, parseISO } from 'date-fns';


/**
 * Get all transactions from local storage
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await storage.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS);
    return transactions || [];
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return [];
  }
};

/**
 * Save a new transaction to local storage
 */
export const saveTransaction = async (
  transaction: TransactionInput, 
  currentUser: Partial<User>
): Promise<Transaction> => {
  try {
    const transactions = await getTransactions();
    
    const newTransaction: Transaction = {
      id: uuidv4(),
      ...transaction,
      createdBy: currentUser.id || 'local-user',
      creatorName: currentUser.name || 'Local User',
      createdAt: new Date(),
      updatedAt: new Date(),
      date: transaction.date || new Date(),
    };
    
    await storage.setItem(STORAGE_KEYS.TRANSACTIONS, [...transactions, newTransaction]);
    return newTransaction;
  } catch (error) {
    console.error('Failed to save transaction:', error);
    throw error;
  }
};

/**
 * Update an existing transaction in local storage
 */
export const updateTransaction = async (
  id: string, 
  transactionData: Partial<TransactionInput>
): Promise<Transaction | null> => {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      console.error(`Transaction with ID ${id} not found`);
      return null;
    }
    
    const updatedTransaction = {
      ...transactions[index],
      ...transactionData,
      updatedAt: new Date(),
    };
    
    transactions[index] = updatedTransaction;
    await storage.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
    
    return updatedTransaction;
  } catch (error) {
    console.error('Failed to update transaction:', error);
    throw error;
  }
};

/**
 * Delete a transaction from local storage
 */
export const deleteTransaction = async (id: string): Promise<boolean> => {
  try {
    const transactions = await getTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (transactions.length === filteredTransactions.length) {
      return false; // Transaction not found
    }
    
    await storage.setItem(STORAGE_KEYS.TRANSACTIONS, filteredTransactions);
    return true;
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    throw error;
  }
};

/**
 * Filter transactions based on provided criteria
 */
export const filterTransactions = async (filter: TransactionFilter): Promise<Transaction[]> => {
  try {
    const transactions = await getTransactions();
    
    return transactions.filter(transaction => {
      // Date range filter
      if (filter.startDate && filter.endDate) {
        const transactionDate = new Date(transaction.date);
        if (!isWithinInterval(transactionDate, { 
          start: new Date(filter.startDate), 
          end: new Date(filter.endDate) 
        })) {
          return false;
        }
      }
      
      // Transaction type filter
      if (filter.type && filter.type !== 'all') {
        if (transaction.type !== filter.type) {
          return false;
        }
      }
      
      // Categories filter
      if (filter.categories && filter.categories.length > 0) {
        if (!filter.categories.includes(transaction.category)) {
          return false;
        }
      }
      
      // Accounts filter
      if (filter.accounts && filter.accounts.length > 0) {
        if (!filter.accounts.includes(transaction.account)) {
          return false;
        }
      }
      
      // Search text filter
      if (filter.search) {
        const searchText = filter.search.toLowerCase();
        const matchesSearch = 
          transaction.merchant?.toLowerCase().includes(searchText) ||
          transaction.notes?.toLowerCase().includes(searchText) ||
          transaction.category.toLowerCase().includes(searchText);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by selected field
      if (filter.sortBy === 'amount') {
        return filter.sortOrder === 'asc' 
          ? a.amount - b.amount 
          : b.amount - a.amount;
      }
      
      // Default sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      
      return filter.sortOrder === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    });
  } catch (error) {
    console.error('Failed to filter transactions:', error);
    return [];
  }
};

/**
 * Get recent transactions (last 7 days)
 */
export const getRecentTransactions = async (limit = 10): Promise<Transaction[]> => {
  try {
    const transactions = await getTransactions();
    const sevenDaysAgo = subDays(new Date(), 7);
    
    return transactions
      .filter(transaction => new Date(transaction.date) >= sevenDaysAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get recent transactions:', error);
    return [];
  }
}; 