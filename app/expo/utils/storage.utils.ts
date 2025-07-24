import { MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";

// Storage keys
export const STORAGE_KEYS = {
  BILLS: "momiq_bills",
  FAMILY_BILLS: "momiq_family_bills", // 家庭账单缓存
  TRANSACTIONS: "momiq_transactions",
  REPORTS: "momiq_reports",
  USER_PREFERENCES: "momiq_user_preferences",
  BUDGETS: "momiq_budgets",
  AUTH_TOKEN: "momiq_auth_token",
  FAMILY_SPACES: "momiq_family_spaces",
  NOTIFICATIONS: "momiq_notifications",
  NOTIFICATION_SETTINGS: "momiq_notification_settings",
  VIEW_STORE: "momiq_view_store", // 视图模式存储
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

// ---------------------------------------------------------------------------
// MMKV INSTANCE (Singleton)
// ---------------------------------------------------------------------------
// Creating multiple MMKV instances with the same `id` will trigger extra log
// noise ("Creating MMKV instance \"momiq_storage\"...").  Because modules are
// single-cached by the bundler, instantiating here guarantees a single shared
// instance across the entire JS runtime.

export const mmkv = new MMKV({ id: "momiq_storage" });

/** Helper: Promise-wrap synchronous MMKV calls so the external API stays async. */
const wrapAsync = <T>(fn: () => T): Promise<T> => {
  return new Promise((resolve, reject) => {
    try {
      resolve(fn());
    } catch (err) {
      reject(err);
    }
  });
};

// ---------------------------------------------------------------------------
// Regular storage for non-sensitive data (backed by MMKV)
// ---------------------------------------------------------------------------

export const storage = {
  /**
   * Store data in local storage
   */
  setItem: async <T>(key: string, value: T): Promise<void> =>
    wrapAsync(() => {
      const jsonValue = JSON.stringify(value);
      mmkv.set(key, jsonValue);

      // 更新内存缓存
      memoryCache[key] = {
        data: value,
        timestamp: Date.now(),
      };
    }),

  /**
   * Get data from local storage
   */
  getItem: async <T>(key: string): Promise<T | null> =>
    wrapAsync(() => {
      // 1. Memory-cache first
      const cached = memoryCache[key];
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data as T;
      }

      // 2. MMKV lookup
      const jsonValue = mmkv.getString(key);
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue) as T;
        memoryCache[key] = { data: parsed, timestamp: Date.now() };
        return parsed;
      }

      // 3. Legacy key fallback (also in MMKV ‑ migration from old key)
      const legacyKey = deriveLegacyKey(key);
      if (legacyKey) {
        const legacyValue = mmkv.getString(legacyKey);
        if (legacyValue != null) {
          // migrate
          mmkv.set(key, legacyValue);
          mmkv.delete(legacyKey);

          const parsedLegacy = JSON.parse(legacyValue) as T;
          memoryCache[key] = { data: parsedLegacy, timestamp: Date.now() };
          return parsedLegacy;
        }
      }

      return null;
    }),

  /**
   * Remove data from local storage
   */
  removeItem: async (key: string): Promise<void> =>
    wrapAsync(() => {
      mmkv.delete(key);
      if (key in memoryCache) delete memoryCache[key];
    }),

  /**
   * Clear all data from local storage
   */
  clear: async (): Promise<void> =>
    wrapAsync(() => {
      mmkv.clearAll();
      Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
    }),

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
