import { storage, STORAGE_KEYS } from "./storage.utils";
import { Bill } from "@/types/bills.types";
import { Transaction } from "@/types/transactions.types";
import { ReportData } from "@/types/reports.types";
import { SYNC_API } from "./api.config";

// 同步状态缓存
const syncStatusCache: Record<
  string,
  {
    lastSyncTime: number;
    isInProgress: boolean;
  }
> = {};

// 防抖计时器
let syncDebounceTimer: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_DELAY = 1000; // 1秒防抖

/**
 * 检查是否需要同步
 */
function shouldSync(dataType: string, userId: string): boolean {
  const key = `${dataType}-${userId}`;
  const cache = syncStatusCache[key];

  if (!cache) return true;

  // 正在同步中则跳过
  if (cache.isInProgress) return false;

  // 30秒内不重复同步
  const now = Date.now();
  if (now - cache.lastSyncTime < 30000) return false;

  return true;
}

/**
 * 更新同步状态
 */
function updateSyncStatus(
  dataType: string,
  userId: string,
  isInProgress: boolean
) {
  const key = `${dataType}-${userId}`;
  syncStatusCache[key] = {
    lastSyncTime: isInProgress
      ? syncStatusCache[key]?.lastSyncTime || Date.now()
      : Date.now(),
    isInProgress,
  };
}

/**
 * 优化的远程数据同步 - 后台非阻塞操作
 * 在实际应用中，这个函数会调用后端 API 获取数据并合并到本地
 */
export const syncRemoteData = async (
  dataType: "bills" | "transactions" | "reports",
  userId: string,
  forceSync = false
): Promise<void> => {
  // 检查是否需要同步
  if (!forceSync && !shouldSync(dataType, userId)) {
    console.log(
      `Skipping ${dataType} sync for user ${userId} - too frequent or in progress`
    );
    return;
  }

  // 防抖处理
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  return new Promise((resolve) => {
    syncDebounceTimer = setTimeout(async () => {
      try {
        await performSync(dataType, userId);
        resolve();
      } catch (error) {
        console.warn(`Sync failed for ${dataType}:`, error);
        updateSyncStatus(dataType, userId, false);
        resolve(); // 不阻塞主流程
      }
    }, SYNC_DEBOUNCE_DELAY);
  });
};

/**
 * 执行实际的同步操作
 */
async function performSync(
  dataType: "bills" | "transactions" | "reports",
  userId: string
): Promise<void> {
  updateSyncStatus(dataType, userId, true);

  try {
    // 模拟网络请求延迟 - 在实际应用中这会是真实的API调用
    await new Promise((resolve) => setTimeout(resolve, 200)); // 减少模拟延迟

    // 在真实应用中，这里会是一个 API 调用
    let localData: any[] = [];
    let storageKey: string;

    switch (dataType) {
      case "bills":
        storageKey = STORAGE_KEYS.BILLS;
        localData = (await storage.getItem<Bill[]>(storageKey)) || [];
        // 实际应用中会使用: const response = await fetch(SYNC_API.syncBills);
        break;
      case "transactions":
        storageKey = STORAGE_KEYS.TRANSACTIONS;
        localData = (await storage.getItem<Transaction[]>(storageKey)) || [];
        // 实际应用中会使用: const response = await fetch(SYNC_API.syncTransactions);
        break;
      case "reports":
        storageKey = STORAGE_KEYS.REPORTS;
        localData = (await storage.getItem<ReportData[]>(storageKey)) || [];
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

    console.log(
      `Successfully synced ${dataType} for user ${userId} (${localData.length} items)`
    );
  } finally {
    updateSyncStatus(dataType, userId, false);
  }
}

/**
 * 批量同步多种数据类型
 */
export const syncMultipleDataTypes = async (
  dataTypes: ("bills" | "transactions" | "reports")[],
  userId: string,
  forceSync = false
): Promise<void> => {
  // 并行同步，错误隔离
  const syncPromises = dataTypes.map(async (dataType) => {
    try {
      await syncRemoteData(dataType, userId, forceSync);
    } catch (error) {
      console.warn(`Failed to sync ${dataType}:`, error);
      // 错误隔离 - 单个数据类型失败不影响其他类型
    }
  });

  await Promise.allSettled(syncPromises);
};

/**
 * 优化的本地数据推送
 * 在实际应用中，这个函数会将本地的更改推送到后端
 */
export const pushLocalChanges = async (
  dataType: "bills" | "transactions",
  userId: string,
  forceSync = false
): Promise<void> => {
  // 检查是否需要同步
  if (!forceSync && !shouldSync(`push-${dataType}`, userId)) {
    console.log(
      `Skipping ${dataType} push for user ${userId} - too frequent or in progress`
    );
    return;
  }

  const pushKey = `push-${dataType}`;
  updateSyncStatus(pushKey, userId, true);

  try {
    // 模拟网络请求延迟
    await new Promise((resolve) => setTimeout(resolve, 200));

    // 获取本地数据
    let localData: any[] = [];
    let storageKey: string;
    let apiUrl: string;

    switch (dataType) {
      case "bills":
        storageKey = STORAGE_KEYS.BILLS;
        apiUrl = SYNC_API.syncBills;
        localData = (await storage.getItem<Bill[]>(storageKey)) || [];
        break;
      case "transactions":
        storageKey = STORAGE_KEYS.TRANSACTIONS;
        apiUrl = SYNC_API.syncTransactions;
        localData = (await storage.getItem<Transaction[]>(storageKey)) || [];
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

    console.log(
      `Successfully pushed local ${dataType} changes for user ${userId} (${localData.length} items)`
    );
  } catch (error) {
    console.error(`Failed to push local ${dataType} changes:`, error);
    throw error;
  } finally {
    updateSyncStatus(pushKey, userId, false);
  }
};

/**
 * 清除同步缓存
 */
export function clearSyncCache(): void {
  Object.keys(syncStatusCache).forEach((key) => {
    delete syncStatusCache[key];
  });

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
}

/**
 * 获取同步状态信息 - 用于调试
 */
export function getSyncStatus(): Record<string, any> {
  return {
    cache: syncStatusCache,
    hasActiveTimer: !!syncDebounceTimer,
  };
}

/**
 * 智能同步策略 - 根据数据类型和使用场景选择同步方式
 */
export const smartSync = async (
  userId: string,
  context: "app_start" | "user_action" | "background" = "user_action"
): Promise<void> => {
  switch (context) {
    case "app_start":
      // 应用启动时，优先同步关键数据
      await syncRemoteData("bills", userId);
      // 后台同步次要数据
      setTimeout(() => {
        syncMultipleDataTypes(["transactions", "reports"], userId).catch(
          () => {}
        );
      }, 2000);
      break;

    case "user_action":
      // 用户操作时，同步相关数据
      await syncRemoteData("bills", userId);
      break;

    case "background":
      // 后台同步，所有数据类型但不阻塞
      syncMultipleDataTypes(["bills", "transactions", "reports"], userId).catch(
        () => {}
      );
      break;
  }
};
