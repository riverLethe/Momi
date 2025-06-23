import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Storage keys
export const STORAGE_KEYS = {
  BILLS: "momiq_bills",
  TRANSACTIONS: "momiq_transactions",
  REPORTS: "momiq_reports",
  USER_PREFERENCES: "momiq_user_preferences",
  BUDGETS: "momiq_budgets",
  AUTH_TOKEN: "momiq_auth_token",
  FAMILY_SPACES: "momiq_family_spaces",
  NOTIFICATIONS: "momiq_notifications",
  NOTIFICATION_SETTINGS: "momiq_notification_settings",
};

// Legacy key mapping for backward compatibility
function deriveLegacyKey(key: string): string | null {
  const mapping: Record<string, string> = {
    [STORAGE_KEYS.BILLS]: "bills",
    [STORAGE_KEYS.TRANSACTIONS]: "transactions",
    [STORAGE_KEYS.USER_PREFERENCES]: "user_preferences",
    [STORAGE_KEYS.BUDGETS]: "budgets",
  };
  return mapping[key] || null;
}

// 内存缓存，减少对AsyncStorage的访问
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

// 缓存过期时间 (毫秒)
const CACHE_TTL = 30000; // 30秒

// Regular storage for non-sensitive data
export const storage = {
  /**
   * Store data in local storage
   */
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);

      // 同时更新内存缓存
      memoryCache[key] = {
        data: value,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get data from local storage
   */
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      // 1. 检查内存缓存是否存在且未过期
      const cachedItem = memoryCache[key];
      if (cachedItem && Date.now() - cachedItem.timestamp < CACHE_TTL) {
        return cachedItem.data;
      }

      // 2. 如果没有缓存或已过期，尝试从AsyncStorage读取
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        const parsedData = JSON.parse(jsonValue);

        // 更新内存缓存
        memoryCache[key] = {
          data: parsedData,
          timestamp: Date.now(),
        };

        return parsedData;
      }

      // 3. Fallback to legacy key if data under new key is missing
      const legacyKey = deriveLegacyKey(key);
      if (legacyKey) {
        const legacyValue = await AsyncStorage.getItem(legacyKey);
        if (legacyValue != null) {
          // Migrate data to the new key asynchronously (fire-and-forget)
          AsyncStorage.setItem(key, legacyValue).catch(() => {});
          AsyncStorage.removeItem(legacyKey).catch(() => {});

          const parsedLegacyData = JSON.parse(legacyValue);

          // 更新内存缓存
          memoryCache[key] = {
            data: parsedLegacyData,
            timestamp: Date.now(),
          };

          return parsedLegacyData;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove data from local storage
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);

      // 同时从内存缓存中删除
      if (key in memoryCache) {
        delete memoryCache[key];
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  },

  /**
   * Clear all data from local storage
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();

      // 清空内存缓存
      Object.keys(memoryCache).forEach((key) => {
        delete memoryCache[key];
      });
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },

  /**
   * Invalidate memory cache for a specific key
   */
  invalidateCache: (key: string): void => {
    if (key in memoryCache) {
      delete memoryCache[key];
    }
  },

  /**
   * Invalidate all memory caches
   */
  invalidateAllCaches: (): void => {
    Object.keys(memoryCache).forEach((key) => {
      delete memoryCache[key];
    });
  },
};

// Secure storage for sensitive data
export const secureStorage = {
  /**
   * Store sensitive data securely
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing secure ${key}:`, error);
      throw error;
    }
  },

  /**
   * Get sensitive data from secure storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving secure ${key}:`, error);
      return null;
    }
  },

  /**
   * Remove sensitive data from secure storage
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing secure ${key}:`, error);
      throw error;
    }
  },
};
