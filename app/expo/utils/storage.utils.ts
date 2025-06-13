import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Storage keys
export const STORAGE_KEYS = {
  BILLS: "momiq_bills",
  TRANSACTIONS: "momiq_transactions",
  REPORTS: "momiq_reports",
  USER_PREFERENCES: "momiq_user_preferences",
  AUTH_TOKEN: "momiq_auth_token",
  FAMILY_SPACES: "momiq_family_spaces",
};

//todo: remove this after migration
// Utility: given a new-format key, derive its legacy counterpart (if any)
const deriveLegacyKey = (key: string): string | null => {
  if (key.startsWith("momiq_")) {
    return key.replace("momiq_", "momi_");
  }
  return null;
};

// Regular storage for non-sensitive data
export const storage = {
  /**
   * Store data in local storage
   */
  setItem: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
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
      // 1. Try to read using the new key
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        return JSON.parse(jsonValue);
      }

      // 2. Fallback to legacy key if data under new key is missing
      const legacyKey = deriveLegacyKey(key);
      if (legacyKey) {
        const legacyValue = await AsyncStorage.getItem(legacyKey);
        if (legacyValue != null) {
          // Migrate data to the new key asynchronously (fire-and-forget)
          AsyncStorage.setItem(key, legacyValue).catch(() => {});
          AsyncStorage.removeItem(legacyKey).catch(() => {});
          return JSON.parse(legacyValue);
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
    } catch (error) {
      console.error("Error clearing storage:", error);
      throw error;
    }
  },
};

// Secure storage for sensitive data
export const secureStorage = {
  /**
   * Store sensitive data in secure storage
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error storing ${key} securely:`, error);
      throw error;
    }
  },

  /**
   * Get sensitive data from secure storage
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      // 1. Attempt to fetch using the new key
      const value = await SecureStore.getItemAsync(key);
      if (value != null) {
        return value;
      }

      // 2. Fallback to legacy key
      const legacyKey = deriveLegacyKey(key);
      if (legacyKey) {
        const legacyValue = await SecureStore.getItemAsync(legacyKey);
        if (legacyValue != null) {
          // Migrate to the new key (fire-and-forget)
          SecureStore.setItemAsync(key, legacyValue).catch(() => {});
          SecureStore.deleteItemAsync(legacyKey).catch(() => {});
          return legacyValue;
        }
      }

      return null;
    } catch (error) {
      console.error(`Error retrieving ${key} securely:`, error);
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
      console.error(`Error removing ${key} securely:`, error);
      throw error;
    }
  },
};
