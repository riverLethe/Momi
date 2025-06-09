import { storage, STORAGE_KEYS } from './storage.utils';
import { Bill, BillInput, BillStats } from '@/types/bills.types';
import { User } from '@/types/user.types';
import { format, subDays, isWithinInterval } from 'date-fns';

/**
 * Generate a unique ID for bills
 */
const generateId = (): string => {
  return 'bill_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         '_' + Date.now().toString();
};

/**
 * Get all bills from local storage
 */
export const getBills = async (): Promise<Bill[]> => {
  try {
    const bills = await storage.getItem<Bill[]>(STORAGE_KEYS.BILLS);
    return bills || [];
  } catch (error) {
    console.error('Failed to get bills:', error);
    return [];
  }
};

/**
 * Save a new bill to local storage
 */
export const saveBill = async (
  bill: BillInput, 
  currentUser: Partial<User>
): Promise<Bill> => {
  try {
    const bills = await getBills();
    
    const newBill: Bill = {
      id: generateId(),
      ...bill,
      createdBy: currentUser.id || 'local-user',
      creatorName: currentUser.name || 'Local User',
      createdAt: new Date(),
      updatedAt: new Date(),
      date: bill.date || new Date(),
    };
    
    await storage.setItem(STORAGE_KEYS.BILLS, [...bills, newBill]);
    return newBill;
  } catch (error) {
    console.error('Failed to save bill:', error);
    throw error;
  }
};

/**
 * Update an existing bill in local storage
 */
export const updateBill = async (
  id: string, 
  billData: Partial<BillInput>
): Promise<Bill | null> => {
  try {
    const bills = await getBills();
    const index = bills.findIndex(b => b.id === id);
    
    if (index === -1) {
      console.error(`Bill with ID ${id} not found`);
      return null;
    }
    
    const updatedBill = {
      ...bills[index],
      ...billData,
      updatedAt: new Date(),
    };
    
    bills[index] = updatedBill;
    await storage.setItem(STORAGE_KEYS.BILLS, bills);
    
    return updatedBill;
  } catch (error) {
    console.error('Failed to update bill:', error);
    throw error;
  }
};

/**
 * Delete a bill from local storage
 */
export const deleteBill = async (id: string): Promise<boolean> => {
  try {
    const bills = await getBills();
    const filteredBills = bills.filter(b => b.id !== id);
    
    if (bills.length === filteredBills.length) {
      return false; // Bill not found
    }
    
    await storage.setItem(STORAGE_KEYS.BILLS, filteredBills);
    return true;
  } catch (error) {
    console.error('Failed to delete bill:', error);
    throw error;
  }
};

/**
 * Get bill statistics for a given time period
 */
export const getBillStats = async (
  startDate: Date, 
  endDate: Date
): Promise<BillStats> => {
  try {
    const bills = await getBills();
    
    // Filter bills within the date range
    const filteredBills = bills.filter(bill => {
      const billDate = new Date(bill.date);
      return isWithinInterval(billDate, { start: startDate, end: endDate });
    });
    
    // Calculate total amount
    const totalAmount = filteredBills.reduce(
      (total, bill) => total + bill.amount, 
      0
    );
    
    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    
    filteredBills.forEach(bill => {
      const currentAmount = categoryMap.get(bill.category) || 0;
      categoryMap.set(bill.category, currentAmount + bill.amount);
    });
    
    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
    }));
    
    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);
    
    return {
      totalAmount,
      categoryBreakdown,
    };
  } catch (error) {
    console.error('Failed to get bill stats:', error);
    return {
      totalAmount: 0,
      categoryBreakdown: [],
    };
  }
};

/**
 * Get bills for a specific month
 */
export const getBillsByMonth = async (
  year: number, 
  month: number
): Promise<Bill[]> => {
  try {
    const bills = await getBills();
    
    return bills.filter(bill => {
      const billDate = new Date(bill.date);
      return billDate.getFullYear() === year && billDate.getMonth() === month;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Failed to get bills by month:', error);
    return [];
  }
};

/**
 * Get upcoming bills (next 30 days)
 */
export const getUpcomingBills = async (): Promise<Bill[]> => {
  try {
    const bills = await getBills();
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    
    return bills
      .filter(bill => {
        const billDate = new Date(bill.date);
        return billDate >= today && billDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Failed to get upcoming bills:', error);
    return [];
  }
}; 