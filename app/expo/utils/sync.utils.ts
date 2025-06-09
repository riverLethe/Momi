import { storage, STORAGE_KEYS } from './storage.utils';
import { Bill } from '@/types/bills.types';
import { Transaction } from '@/types/transactions.types';
import { ReportData } from '@/types/reports.types';
import { SYNC_API } from './api.config';

/**
 * 同步远程数据到本地存储
 * 在实际应用中，这个函数会调用后端 API 获取数据并合并到本地
 */
export const syncRemoteData = async (
  dataType: 'bills' | 'transactions' | 'reports',
  userId: string
): Promise<void> => {
  try {
    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 在真实应用中，这里会是一个 API 调用
    // const response = await fetch(getApiUrl(dataType, userId));
    // const remoteData = await response.json();
    
    // 获取当前本地数据
    let localData: any[] = [];
    let storageKey: string;
    
    switch (dataType) {
      case 'bills':
        storageKey = STORAGE_KEYS.BILLS;
        localData = await storage.getItem<Bill[]>(storageKey) || [];
        // 实际应用中会使用: const response = await fetch(SYNC_API.syncBills);
        break;
      case 'transactions':
        storageKey = STORAGE_KEYS.TRANSACTIONS;
        localData = await storage.getItem<Transaction[]>(storageKey) || [];
        // 实际应用中会使用: const response = await fetch(SYNC_API.syncTransactions);
        break;
      case 'reports':
        storageKey = STORAGE_KEYS.REPORTS;
        localData = await storage.getItem<ReportData[]>(storageKey) || [];
        // 实际应用中会使用: const response = await fetch(SYNC_API.syncReports);
        break;
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
    
    // 这里我们简单地保留当前数据，因为它是模拟的
    // 在真实应用中，你会进行本地数据和远程数据的合并
    // 例如:
    // const mergedData = mergeData(localData, remoteData);
    // await storage.setItem(storageKey, mergedData);
    
    console.log(`Successfully synced ${dataType} for user ${userId}`);
  } catch (error) {
    console.error(`Failed to sync ${dataType} data:`, error);
    throw error;
  }
};

/**
 * 获取相应数据类型的API URL
 */
const getApiUrl = (dataType: 'bills' | 'transactions' | 'reports', userId: string): string => {
  switch (dataType) {
    case 'bills':
      return `${SYNC_API.syncBills}?userId=${userId}`;
    case 'transactions':
      return `${SYNC_API.syncTransactions}?userId=${userId}`;
    case 'reports':
      return `${SYNC_API.syncReports}?userId=${userId}`;
    default:
      throw new Error(`Unsupported data type: ${dataType}`);
  }
};

/**
 * 将本地数据同步到远程
 * 在实际应用中，这个函数会将本地的更改推送到后端
 */
export const pushLocalChanges = async (
  dataType: 'bills' | 'transactions',
  userId: string
): Promise<void> => {
  try {
    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 获取本地数据
    let localData: any[] = [];
    let storageKey: string;
    let apiUrl: string;
    
    switch (dataType) {
      case 'bills':
        storageKey = STORAGE_KEYS.BILLS;
        apiUrl = SYNC_API.syncBills;
        localData = await storage.getItem<Bill[]>(storageKey) || [];
        break;
      case 'transactions':
        storageKey = STORAGE_KEYS.TRANSACTIONS;
        apiUrl = SYNC_API.syncTransactions;
        localData = await storage.getItem<Transaction[]>(storageKey) || [];
        break;
      default:
        throw new Error(`Unsupported data type: ${dataType}`);
    }
    
    // 在真实应用中，你会将本地更改推送到后端
    // 例如:
    // await fetch(apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify({
    //     userId,
    //     data: localData
    //   })
    // });
    
    console.log(`Successfully pushed local ${dataType} changes for user ${userId}`);
  } catch (error) {
    console.error(`Failed to push local ${dataType} changes:`, error);
    throw error;
  }
}; 