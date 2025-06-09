import { storage, secureStorage, STORAGE_KEYS } from './storage.utils';
import { UserPreferences, User } from '@/types/user.types';

// Default user preferences
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  currency: 'USD',
  language: 'en',
  theme: 'light',
  notificationsEnabled: true,
  defaultAccount: 'main',
};

/**
 * Get user preferences from local storage
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const preferences = await storage.getItem<UserPreferences>(STORAGE_KEYS.USER_PREFERENCES);
    return preferences || DEFAULT_USER_PREFERENCES;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Update user preferences in local storage
 */
export const updateUserPreferences = async (
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> => {
  try {
    const currentPreferences = await getUserPreferences();
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
    };
    
    await storage.setItem(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
    return updatedPreferences;
  } catch (error) {
    console.error('Failed to update user preferences:', error);
    throw error;
  }
};

/**
 * Reset user preferences to default values
 */
export const resetUserPreferences = async (): Promise<UserPreferences> => {
  try {
    await storage.setItem(STORAGE_KEYS.USER_PREFERENCES, DEFAULT_USER_PREFERENCES);
    return DEFAULT_USER_PREFERENCES;
  } catch (error) {
    console.error('Failed to reset user preferences:', error);
    throw error;
  }
};

/**
 * Store authentication token securely
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Failed to store auth token:', error);
    throw error;
  }
};

/**
 * Get authentication token from secure storage
 */
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Remove authentication token from secure storage
 */
export const removeAuthToken = async (): Promise<void> => {
  try {
    await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to remove auth token:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated based on token existence
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return token !== null;
};

/**
 * Store mock user for testing in local state
 */
export const getMockUser = (): User => {
  return {
    id: 'local-user',
    name: 'Local User',
    email: 'local@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}; 