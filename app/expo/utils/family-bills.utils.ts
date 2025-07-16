import { apiClient } from './api';
import { getAuthToken } from './userPreferences.utils';
import { Bill } from '@/types/bills.types';

/**
 * 家庭账单工具函数
 * 用于管理家庭空间的账单数据
 */

export interface FamilyBillsResponse {
  success: boolean;
  data: {
    bills: Bill[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    familySpace: {
      id: string;
      name: string;
    };
  };
}

export interface CreateFamilyBillData {
  familyId: string;
  amount: number;
  category: string;
  notes?: string;
  date?: string;
  merchant?: string;
}

export interface FamilyBillsOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

/**
 * 获取家庭账单列表
 */
export const getFamilyBills = async (
  familyId: string,
  options?: FamilyBillsOptions
): Promise<FamilyBillsResponse> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await apiClient.family.getBills(token, familyId, options);
    return response;
  } catch (error) {
    console.error('Failed to get family bills:', error);
    throw error;
  }
};

/**
 * 创建家庭账单
 */
export const createFamilyBill = async (
  billData: CreateFamilyBillData
): Promise<{ success: boolean; data: { bill: Bill } }> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await apiClient.family.createBill(token, billData);
    return response;
  } catch (error) {
    console.error('Failed to create family bill:', error);
    throw error;
  }
};

/**
 * 获取家庭账单（分页）
 */
export const getFamilyBillsPaginated = async (
  familyId: string,
  page: number = 1,
  pageSize: number = 20,
  dateRange?: { startDate?: string; endDate?: string }
): Promise<FamilyBillsResponse> => {
  const offset = (page - 1) * pageSize;
  
  return getFamilyBills(familyId, {
    limit: pageSize,
    offset,
    startDate: dateRange?.startDate,
    endDate: dateRange?.endDate,
  });
};

/**
 * 获取家庭账单（按月份）
 */
export const getFamilyBillsByMonth = async (
  familyId: string,
  year: number,
  month: number
): Promise<FamilyBillsResponse> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  return getFamilyBills(familyId, {
    startDate,
    endDate,
    limit: 1000, // 获取整月数据
  });
};

/**
 * 获取家庭账单（按日期范围）
 */
export const getFamilyBillsByDateRange = async (
  familyId: string,
  startDate: string,
  endDate: string,
  limit?: number
): Promise<FamilyBillsResponse> => {
  return getFamilyBills(familyId, {
    startDate,
    endDate,
    limit: limit || 1000,
  });
};

/**
 * 获取最近的家庭账单
 */
export const getRecentFamilyBills = async (
  familyId: string,
  limit: number = 10
): Promise<FamilyBillsResponse> => {
  return getFamilyBills(familyId, {
    limit,
    offset: 0,
  });
};

/**
 * 刷新家庭账单数据
 * 用于实时获取最新的家庭账单
 */
export const refreshFamilyBills = async (
  familyId: string
): Promise<FamilyBillsResponse> => {
  // 获取最近30天的账单
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];
  
  return getFamilyBills(familyId, {
    startDate,
    limit: 1000,
  });
};

/**
 * 检查家庭账单权限
 * 验证用户是否可以查看指定家庭空间的账单
 */
export const checkFamilyBillsPermission = async (
  familyId: string
): Promise<boolean> => {
  try {
    // 尝试获取一条账单来验证权限
    await getFamilyBills(familyId, { limit: 1 });
    return true;
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};