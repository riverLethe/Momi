import { storage, STORAGE_KEYS } from "./storage.utils";
import { Bill, BillInput, BillStats } from "@/types/bills.types";
import { User } from "@/types/user.types";
import { format, subDays, isWithinInterval } from "date-fns";
import { addOperation as queueBillOperation } from "./offlineQueue.utils";

/**
 * Generate a unique ID for bills
 */
const generateId = (): string => {
  return (
    "bill_" +
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    "_" +
    Date.now().toString()
  );
};

/**
 * Get all bills from local storage
 */
export const getBills = async (): Promise<Bill[]> => {
  try {
    const bills = await storage.getItem<Bill[]>(STORAGE_KEYS.BILLS);
    return bills || [];
  } catch (error) {
    console.error("Failed to get bills:", error);
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
      createdBy: currentUser.id || "local-user",
      creatorName: currentUser.name || "Local User",
      createdAt: new Date(),
      updatedAt: new Date(),
      date: bill.date || new Date(),
    };

    await storage.setItem(STORAGE_KEYS.BILLS, [...bills, newBill]);

    // Queue operation for offline sync
    try {
      await queueBillOperation("create", newBill);
    } catch (e) {
      console.warn("Failed to queue create operation", e);
    }

    return newBill;
  } catch (error) {
    console.error("Failed to save bill:", error);
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
    const index = bills.findIndex((b) => b.id === id);

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

    // Queue operation for offline sync
    try {
      await queueBillOperation("update", updatedBill as any);
    } catch (e) {
      console.warn("Failed to queue update operation", e);
    }

    return updatedBill;
  } catch (error) {
    console.error("Failed to update bill:", error);
    throw error;
  }
};

/**
 * Delete a bill from local storage
 */
export const deleteBill = async (id: string): Promise<boolean> => {
  try {
    const bills = await getBills();
    const filteredBills = bills.filter((b) => b.id !== id);

    if (bills.length === filteredBills.length) {
      return false; // Bill not found
    }

    await storage.setItem(STORAGE_KEYS.BILLS, filteredBills);

    // Queue delete operation for offline sync
    try {
      await queueBillOperation("delete", { id } as any);
    } catch (e) {
      console.warn("Failed to queue delete operation", e);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete bill:", error);
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
    const filteredBills = bills.filter((bill) => {
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

    filteredBills.forEach((bill) => {
      const currentAmount = categoryMap.get(bill.category) || 0;
      categoryMap.set(bill.category, currentAmount + bill.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      })
    );

    // Sort by amount descending
    categoryBreakdown.sort((a, b) => b.amount - a.amount);

    return {
      totalAmount,
      categoryBreakdown,
    };
  } catch (error) {
    console.error("Failed to get bill stats:", error);
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

    return bills
      .filter((bill) => {
        const billDate = new Date(bill.date);
        return billDate.getFullYear() === year && billDate.getMonth() === month;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Failed to get bills by month:", error);
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
      .filter((bill) => {
        const billDate = new Date(bill.date);
        return billDate >= today && billDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error("Failed to get upcoming bills:", error);
    return [];
  }
};

/**
 * Filter bills based on query parameters coming from AI or UI.
 * Any of the parameters are optional – if omitted they are ignored.
 */
export interface BillQuery {
  // Single date range (legacy)
  startDate?: string | Date;
  endDate?: string | Date;
  // Multiple date ranges support. If provided, ignore startDate/endDate.
  dateRanges?: { startDate?: string | Date; endDate?: string | Date }[];

  // Category single or multiple
  category?: string;
  categories?: string[];

  // Keyword single or multiple
  keyword?: string;
  keywords?: string[];

  minAmount?: number;
  maxAmount?: number;
  dateField?: "date" | "createdAt" | "updatedAt";
}

export const filterBills = (bills: Bill[], query: BillQuery): Bill[] => {
  let result = [...bills];

  const {
    startDate,
    endDate,
    dateRanges,
    category,
    categories,
    keyword,
    keywords,
    minAmount,
    maxAmount,
    dateField = "date",
  } = query;

  // Date range filter
  if (Array.isArray(dateRanges) && dateRanges.length) {
    // include bill if it matches ANY of the provided ranges
    result = result.filter((bill) => {
      const billDate = new Date(bill[dateField] as Date);
      return dateRanges.some((r) => {
        const s = r.startDate ? new Date(r.startDate) : undefined;
        const e = r.endDate ? new Date(r.endDate) : undefined;
        if (s && billDate < s) return false;
        if (e) {
          const eDayEnd = new Date(e);
          eDayEnd.setHours(23, 59, 59, 999);
          if (billDate > eDayEnd) return false;
        }
        return true;
      });
    });
  } else if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    result = result.filter((bill) => {
      const selectedDate = new Date(bill[dateField] as Date);
      if (start && selectedDate < start) return false;
      if (end) {
        const endWithTime = new Date(end);
        // include entire end day
        endWithTime.setHours(23, 59, 59, 999);
        if (selectedDate > endWithTime) return false;
      }
      return true;
    });
  }

  // Category filter
  if (categories && categories.length) {
    const set = new Set(categories);
    result = result.filter((bill) => set.has(bill.category));
  } else if (category) {
    result = result.filter((bill) => bill.category === category);
  }

  // Amount range filter
  if (typeof minAmount === "number") {
    result = result.filter((bill) => bill.amount >= minAmount);
  }
  if (typeof maxAmount === "number") {
    result = result.filter((bill) => bill.amount <= maxAmount);
  }

  // Keyword filter
  const keywordList: string[] = (() => {
    if (keywords && keywords.length) return keywords;
    if (keyword && keyword.trim()) return [keyword];
    return [];
  })();

  if (keywordList.length) {
    const lowerList = keywordList.map((k) => k.toLowerCase());
    result = result.filter((bill) => {
      const note = bill.notes?.toLowerCase() || "";
      const merchant = bill.merchant?.toLowerCase() || "";
      return lowerList.some((kw) => note.includes(kw) || merchant.includes(kw));
    });
  }

  return result;
};
