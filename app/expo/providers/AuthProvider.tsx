import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { User, AuthState } from '@/types/user.types';
import {
  getAuthToken,
  removeAuthToken,
  storeAuthToken,
  isAuthenticated as checkAuthentication,
} from '@/utils/userPreferences.utils';
import { storage, STORAGE_KEYS } from '@/utils/storage.utils';
import { clearQueue, getPendingCount, getQueue } from '@/utils/offlineQueue.utils';
import { apiClient } from '@/utils/api';
import { SyncOptionsSheet } from '@/components/ui/SyncOptionsSheet';
import { GlobalJoinRequestsListener } from '@/components/family/GlobalJoinRequestsListener';

// Configure Google Sign-In
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;




// Complete the sign-in with web browser for OAuth flows
WebBrowser.maybeCompleteAuthSession();

// Use Expo Auth Request for WeChat Sign In
const redirectUri = AuthSession.makeRedirectUri({
  scheme: process.env.EXPO_PUBLIC_SCHEME || 'momiq'
});

// Initial auth state
const initialAuthState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
};

// Auth context type
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  loginWithWeChat: () => Promise<boolean>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  syncData: () => Promise<void>;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  showSyncOptionsSheet: boolean;
  setSyncOptionsSheet: (show: boolean) => void;
  isRefreshBill: boolean;
  setIsRefreshBill: (isRefresh: boolean) => void;
  isOnline: boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [showSyncOptionsSheet, setShowSyncOptionsSheet] = useState(false);
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const [localBills, setLocalBills] = useState<any[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncOperation, setSyncOperation] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshBill, setIsRefreshBill] = useState(false);
  
  const [isOnline, setIsOnline] = useState(true);
  
  // Auto sync timer ref
  const autoSyncTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Google Auth Request Setup
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    scopes: ['openid', 'profile', 'email'],
    selectAccount: true,
  });

  // WeChat Auth Request Setup (only if APP_ID exists)
  const wechatRequestConfig = React.useMemo(() => {
    const wechatAppId = process.env.EXPO_PUBLIC_WECHAT_APP_ID;
    if (!wechatAppId) return null;

    return {
      clientId: wechatAppId,
      scopes: ["snsapi_userinfo"],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      state: Crypto.randomUUID(),
      extraParams: {
        appid: wechatAppId,
        scope: "snsapi_userinfo",
      },
    };
  }, [redirectUri]);

  const wechatServiceConfig = React.useMemo(() => {
    if (!wechatRequestConfig) return null;
    return {
      authorizationEndpoint: "https://open.weixin.qq.com/connect/oauth2/authorize",
      tokenEndpoint: "https://api.weixin.qq.com/sns/oauth2/access_token",
    };
  }, [wechatRequestConfig]);

  const [wechatRequest, wechatResponse, wechatPromptAsync] = AuthSession.useAuthRequest(
    // If WeChat is not configured, provide a dummy config to satisfy hook rules
    (wechatRequestConfig ?? {
      clientId: "",
      redirectUri,
      scopes: [],
      responseType: AuthSession.ResponseType.Token,
    }),
    wechatServiceConfig ?? null
  );



  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected === true);
    });

    return unsubscribe;
  }, []);

  /**
   * Simplified push sync - only uploads local changes to remote
   * This is used for automatic background sync
   */
  const pushSync = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // Get authentication token
      const token = await getAuthToken();
      if (!token) {
        console.warn("No auth token available for push sync");
        return;
      }

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected === true;

      if (!isOnline) {
        console.info('Device offline, skipping push sync');
        return;
      }

      // Get offline operation queue
      const queue = await getQueue();
      if (queue.length === 0) {
        console.info('No pending operations to push');
        return;
      }

      console.info(`Push sync: uploading ${queue.length} queued operations...`);

      // Process in batches for better reliability
      const batchSize = 50;
      for (let i = 0; i < queue.length; i += batchSize) {
        const batch = queue.slice(i, i + batchSize);
        
        // 确保上传前将Date对象转换为时间戳，以匹配服务端格式
        const normalizedBatch = batch.map((operation: any) => {
          if (operation.bill) {
            return {
              ...operation,
              bill: {
                ...operation.bill,
                date: operation.bill.date instanceof Date ? operation.bill.date.getTime() : operation.bill.date,
                createdAt: operation.bill.createdAt instanceof Date ? operation.bill.createdAt.getTime() : operation.bill.createdAt,
                updatedAt: operation.bill.updatedAt instanceof Date ? operation.bill.updatedAt.getTime() : operation.bill.updatedAt,
              }
            };
          }
          return operation;
        });
        
        await apiClient.sync.uploadBills(token, normalizedBatch);
        console.info(`Push sync: uploaded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(queue.length / batchSize)}`);
      }

      // Clear queue after successful upload
      await clearQueue();
      
      // Update last sync time
      const newSyncTime = new Date();
      await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
      setLastSyncTime(newSyncTime);

      console.info('Push sync completed successfully');
    } catch (error) {
      console.error('Push sync error:', error);
      // Don't block user flow, handle error silently
    }
  }, [authState.isAuthenticated, authState.user]);

  // Global auto push sync timer
  useEffect(() => {
    // Clear existing timer
    if (autoSyncTimerRef.current) {
      clearInterval(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    // Only start auto sync if user is authenticated
    if (!authState.isAuthenticated || !authState.user) {
      return;
    }

    console.info('Starting auto push sync timer (5 minute interval)');

    // Set up new timer - push sync every 5 minutes
    autoSyncTimerRef.current = setInterval(
      async () => {
        // Check if we're online
        if (!isOnline) {
          console.info('Auto push sync skipped: Device offline');
          return;
        }

        console.info('Performing auto push sync...');
        try {
          await pushSync();
        } catch (error) {
          console.error('Auto push sync failed:', error);
        }
      },
      5 * 60 * 1000 // 5 minutes in milliseconds
    );

    // Cleanup function
    return () => {
      if (autoSyncTimerRef.current) {
        clearInterval(autoSyncTimerRef.current);
        autoSyncTimerRef.current = null;
      }
    };
  }, [authState.isAuthenticated, authState.user, isOnline, pushSync]);


  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isUserAuthenticated = await checkAuthentication();

        if (isUserAuthenticated) {
          const token = await getAuthToken();
          if (token) {
            // Fetch user data from API
            try {
              const userData = await apiClient.auth.getProfile(token);
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                user: userData,
                error: null,
              });
            } catch (error) {
              console.error('Failed to fetch user profile:', error);
              // Fallback to mock user for development
              setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
                error: null,
              });
            }
          }
        } else {
          setAuthState({
            ...initialAuthState,
            isLoading: false,
          });
        }
      } catch (error) {
        setAuthState({
          ...initialAuthState,
          isLoading: false,
          error: 'Failed to check authentication status',
        });
      }
    };

    checkAuth();
  }, []);

  // Handle Google response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSignInResponse(googleResponse);
    }
  }, [googleResponse]);

  // Handle WeChat response
  useEffect(() => {
    if (wechatResponse?.type === 'success') {
      handleWeChatSignInResponse(wechatResponse);
    }
  }, [wechatResponse]);

  /**
   * Sync data with server
   * Implements regular sync strategy:
   * 1. Records user operations on bills while offline in an operation queue
   * 2. Automatically syncs the operation queue to remote when user has network
   * 3. Clears operation queue when user logs out
   */
  const syncData = useCallback(async (): Promise<void> => {
    if (!authState.isAuthenticated || !authState.user) return;

    try {
      // Get authentication token
      const token = await getAuthToken();
      if (!token) {
        throw new Error("No auth token available");
      }

      // Check network status
      const netInfo = await NetInfo.fetch();
      const isOnline = netInfo.isConnected === true;

      if (!isOnline) {
        console.info('Device offline, skipping sync');
        return;
      }

      // Get offline operation queue
      const queue = await getQueue();
      if (queue.length > 0) {
        console.info(`Uploading ${queue.length} queued bill operations...`);

        // Process in batches for better reliability
        const batchSize = 50;
        for (let i = 0; i < queue.length; i += batchSize) {
          const batch = queue.slice(i, i + batchSize);
          
          // 确保上传前将Date对象转换为时间戳，以匹配服务端格式
          const normalizedBatch = batch.map((operation: any) => {
            if (operation.bill) {
              return {
                ...operation,
                bill: {
                  ...operation.bill,
                  date: operation.bill.date instanceof Date ? operation.bill.date.getTime() : operation.bill.date,
                  createdAt: operation.bill.createdAt instanceof Date ? operation.bill.createdAt.getTime() : operation.bill.createdAt,
                  updatedAt: operation.bill.updatedAt instanceof Date ? operation.bill.updatedAt.getTime() : operation.bill.updatedAt,
                }
              };
            }
            return operation;
          });
          
          await apiClient.sync.uploadBills(token, normalizedBatch);
          console.info(`Uploaded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(queue.length / batchSize)}`);
        }

        // Clear queue after successful upload
        await clearQueue();
      }

      // Download remote changes
      const lastSyncTimeStr = await storage.getItem<string>("momiq_last_sync");
      console.info(`Downloading bills since ${lastSyncTimeStr || 'beginning'}`);

      const response = await apiClient.sync.downloadBills(
        token,
        lastSyncTimeStr ? lastSyncTimeStr : undefined
      );

      const remoteBills = response.bills || [];

      if (Array.isArray(remoteBills) && remoteBills.length > 0) {
        console.info(`Downloaded ${remoteBills.length} bills from server`);

        // Get local bills
        const localBills = (await storage.getItem<any[]>(STORAGE_KEYS.BILLS)) || [];
        console.info(`Merging with ${localBills.length} local bills`);

        // Merge local and remote bills with conflict resolution
        const merged: any[] = [...localBills];
        const conflicts: any[] = [];

        remoteBills.forEach((remote: any) => {
          // 将服务端返回的时间戳转换为Date对象，以保持客户端数据一致性
          const normalizedRemote = {
            ...remote,
            date: remote.date ? new Date(remote.date) : new Date(),
            createdAt: remote.createdAt ? new Date(remote.createdAt) : new Date(),
            updatedAt: remote.updatedAt ? new Date(remote.updatedAt) : new Date(),
          };
          
          const idx = merged.findIndex((b: any) => b.id === normalizedRemote.id);

          // Handle deleted bills
          if (normalizedRemote.deleted) {
            if (idx !== -1) merged.splice(idx, 1);
            return;
          }

          if (idx !== -1) {
            // Potential conflict - check timestamps
            const localBill = merged[idx];
            const localUpdatedAt = new Date(localBill.updatedAt || localBill.createdAt).getTime();
            const remoteUpdatedAt = new Date(normalizedRemote.updatedAt || normalizedRemote.createdAt).getTime();

            if (remoteUpdatedAt > localUpdatedAt) {
              // Remote is newer, use it
              merged[idx] = normalizedRemote;
            } else if (remoteUpdatedAt < localUpdatedAt) {
              // Local is newer, keep it and track conflict
              conflicts.push({
                local: localBill,
                remote: normalizedRemote,
                resolution: 'kept-local'
              });
            } else {
              // Same timestamp, keep remote for consistency
              merged[idx] = normalizedRemote;
            }
          } else {
            // No conflict, just add the remote bill
            merged.push(normalizedRemote);
          }
        });

        // Save merged bills
        await storage.setItem(STORAGE_KEYS.BILLS, merged);
        // Refresh cache
        storage.invalidateCache(STORAGE_KEYS.BILLS);


      } else {
        console.info('No new bills to download');
      }

      // Update sync time
      const newSyncTime = new Date();
        await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
      setLastSyncTime(newSyncTime);

      // 刷新数据提供者中的数据
      setIsRefreshBill(true);
      console.info('Data sync completed successfully');
    } catch (error) {
      console.error('Data sync error:', error);
      // Don't block user flow, handle error silently
      // But we could add a retry mechanism here in the future
    }
  }, [authState.isAuthenticated, authState.user]);

  /**
   * After successful login prompt user how to handle existing local bills.
   * Provides options to merge data, clear local and download from server,
   * or push local data to server and override.
   */
  const handlePostLoginSync = useCallback(
    async (token: string) => {
      try {
        const localBills = (await storage.getItem<any[]>(STORAGE_KEYS.BILLS)) || [];

        // If no local bills, just run normal sync
        if (localBills.length === 0) {
          syncData();
          return;
        }

        // Store token and bills for sheet handlers
        setSyncToken(token);
        setLocalBills(localBills);
        setShowSyncOptionsSheet(true);
      } catch (err) {
        console.error('Post-login sync prompt error:', err);
        syncData();
      }
    },
    [syncData]
  );

  // Sync option handlers
  const handleMerge = useCallback(async () => {
    // Merge strategy: Combine remote and local bills, deduplicating by bill ID
    // This is the smart merge option that preserves the most data
    try {
      setIsSyncing(true);
      setSyncOperation(t('Merging local and remote data...'));
      setSyncProgress(10);
      console.info('Executing merge strategy');
      // Get remote bills and merge with local bills
      if (syncToken) {
        const token = syncToken;
        setSyncProgress(20);
        const response = await apiClient.sync.downloadBills(token);
        const remoteBills = response.bills || [];

        if (Array.isArray(remoteBills) && remoteBills.length > 0) {
          // Merge local and remote bills, deduplicating by ID
          const merged: any[] = [...localBills];
          const conflicts: any[] = [];

          remoteBills.forEach((remote: any) => {
            // 将服务端返回的时间戳转换为Date对象，以保持客户端数据一致性
            const normalizedRemote = {
              ...remote,
              date: remote.date ? new Date(remote.date) : new Date(),
              createdAt: remote.createdAt ? new Date(remote.createdAt) : new Date(),
              updatedAt: remote.updatedAt ? new Date(remote.updatedAt) : new Date(),
            };
            
            const idx = merged.findIndex((b: any) => b.id === normalizedRemote.id);
            if (normalizedRemote.deleted) {
              // If remote bill is marked as deleted, remove from merged result
              if (idx !== -1) merged.splice(idx, 1);
              return;
            }

            if (idx !== -1) {
              // If bill exists locally with same ID, keep the newest version
              const localBill = merged[idx];
              const localUpdatedAt = new Date(localBill.updatedAt || localBill.createdAt).getTime();
              const remoteUpdatedAt = new Date(normalizedRemote.updatedAt || normalizedRemote.createdAt).getTime();

              if (remoteUpdatedAt > localUpdatedAt) {
                merged[idx] = normalizedRemote;
              } else if (remoteUpdatedAt < localUpdatedAt) {
                // Local is newer, track conflict but keep local
                conflicts.push({
                  local: localBill,
                  remote: normalizedRemote,
                  resolution: 'kept-local'
                });
              }
            } else {
              // If bill doesn't exist locally, add the remote bill
              merged.push(normalizedRemote);
            }
          });

          setSyncProgress(50);
          // Save merged bills
          await storage.setItem(STORAGE_KEYS.BILLS, merged);
          setSyncProgress(70);
          // Clear offline queue since we've processed all changes
          await clearQueue();
          setSyncProgress(80);
          // Update sync time
          const newSyncTime = new Date();
        await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
          setLastSyncTime(newSyncTime);
          setSyncProgress(90);

          // Refresh cache
          storage.invalidateCache(STORAGE_KEYS.BILLS);
          setSyncProgress(100);

        }
      }

      // Wait a moment to show 100% completion
      setTimeout(async () => {
        // 刷新数据提供者中的数据
        setIsRefreshBill(true);
        setIsSyncing(false);
        setSyncProgress(0);
        // Close sync options sheet
        setShowSyncOptionsSheet(false);
      }, 1000);
    } catch (err) {
      console.error('Bill merge failed:', err);
      // Still try regular sync on error
      syncData();
    }
  }, [syncToken, localBills, syncData]);

  const handleClearAndDownload = useCallback(async () => {
    // Clear and download strategy: Clear local bills and download all bills from remote
    // This is useful when you want to reset local data and use server as source of truth
    try {
      setIsSyncing(true);
      setSyncOperation(t('Clearing local data and downloading from server...'));
      setSyncProgress(10);
      console.info('Executing clear and download strategy');
      // Clear local bills
      await storage.setItem(STORAGE_KEYS.BILLS, []);
      setSyncProgress(30);
      // Clear offline queue
      await clearQueue();
      setSyncProgress(40);

      // Download bills from remote
      if (syncToken) {
        const token = syncToken;
        setSyncProgress(50);
        const response = await apiClient.sync.downloadBills(token);
        const remoteBills = response.bills || [];
        setSyncProgress(70);

        if (Array.isArray(remoteBills) && remoteBills.length > 0) {
          console.info(`Downloaded ${remoteBills.length} bills from server`);
          
          // 将服务端返回的时间戳转换为Date对象，以保持客户端数据一致性
          const normalizedBills = remoteBills.map((bill: any) => ({
            ...bill,
            date: bill.date ? new Date(bill.date) : new Date(),
            createdAt: bill.createdAt ? new Date(bill.createdAt) : new Date(),
            updatedAt: bill.updatedAt ? new Date(bill.updatedAt) : new Date(),
          }));
          
          // Save remote bills locally
          await storage.setItem(STORAGE_KEYS.BILLS, normalizedBills);
          setSyncProgress(85);
          // Update sync time
          const newSyncTime = new Date();
        await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
          setLastSyncTime(newSyncTime);
          setSyncProgress(95);

          // Refresh cache
          storage.invalidateCache(STORAGE_KEYS.BILLS);
          setSyncProgress(100);
        } else {
          console.info('No bills found on server');
          setSyncProgress(100);
        }
      }

      // Wait a moment to show 100% completion
      setTimeout(async () => {
        // 刷新数据提供者中的数据
        setIsRefreshBill(true);
        setIsSyncing(false);
        setSyncProgress(0);
        // Close sync options sheet
        setShowSyncOptionsSheet(false);
      }, 1000);
    } catch (err) {
      console.error('Clear and download bills failed:', err);
      // Still try regular sync on error
      syncData();
    }
  }, [syncToken, syncData]);

  const handlePushAndOverride = useCallback(async () => {
    // Push and override strategy: Clear remote bills first, then push all local bills
    // This is useful when local data is the source of truth and you want to reset server data
    if (!syncToken) return;

    try {
      setIsSyncing(true);
      setSyncOperation(t('Clearing server data and uploading local bills...'));
      setSyncProgress(10);
      console.info('Executing push and override strategy');

      if (localBills.length === 0) {
        setSyncProgress(50);
        setSyncOperation(t('Clearing server data...'));
        
        // If no local bills, just clear server data
        await apiClient.sync.uploadBills(syncToken, [], true);
        
        setSyncProgress(100);
        setSyncOperation(t('Sync completed'));
        
        // Clear offline queue
        await clearQueue();
        
        // Update sync time
        const newSyncTime = new Date();
        await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
        setLastSyncTime(newSyncTime);
        
        // Refresh cache
        storage.invalidateCache(STORAGE_KEYS.BILLS);
        
        setTimeout(async () => {
          setIsRefreshBill(true);
          setIsSyncing(false);
          setSyncProgress(0);
          setShowSyncOptionsSheet(false);
        }, 1000);
        
        return;
      }

      // Step 1: Upload all local bills as create operations with override mode
      const operations = localBills.map((bill) => ({
        action: 'create' as const,
        bill: bill
      }));

      console.info(`Uploading ${operations.length} local bills to server with override mode`);
      setSyncProgress(25);

      // Process in batches for better reliability
      const batchSize = 50;
      const totalBatches = Math.ceil(operations.length / batchSize);
      
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const isFirstBatch = i === 0;
        
        // 确保上传前将Date对象转换为时间戳，以匹配服务端格式
        const normalizedBatch = batch.map((operation: any) => ({
          ...operation,
          bill: {
            ...operation.bill,
            date: operation.bill.date instanceof Date ? operation.bill.date.getTime() : operation.bill.date,
            createdAt: operation.bill.createdAt instanceof Date ? operation.bill.createdAt.getTime() : operation.bill.createdAt,
            updatedAt: operation.bill.updatedAt instanceof Date ? operation.bill.updatedAt.getTime() : operation.bill.updatedAt,
          }
        }));
        
        // Only enable override mode for the first batch
        await apiClient.sync.uploadBills(syncToken, normalizedBatch, isFirstBatch);
        const currentBatch = Math.floor(i / batchSize) + 1;
        const progress = 25 + (currentBatch / totalBatches) * 50; // 25-75% for upload
        setSyncProgress(Math.round(progress));
        console.info(`Uploaded batch ${currentBatch} of ${totalBatches}`);
      }

      setSyncProgress(75);
      setSyncOperation(t('Cleaning local data...'));

      // Step 2: Clear offline queue since we've uploaded everything
      await clearQueue();
      setSyncProgress(90);

      setSyncOperation(t('Updating sync status...'));

      // Step 3: Update sync time
      const newSyncTime = new Date();
      await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
      setLastSyncTime(newSyncTime);
      setSyncProgress(95);

      // Step 4: Refresh cache
      storage.invalidateCache(STORAGE_KEYS.BILLS);
      setSyncProgress(100);

      setSyncOperation(t('Sync completed'));
      console.info('Push and override completed successfully');

      // Wait a moment to show 100% completion
      setTimeout(async () => {
        // 刷新数据提供者中的数据
        setIsRefreshBill(true);
        setIsSyncing(false);
        setSyncProgress(0);
        // Close sync options sheet
        setShowSyncOptionsSheet(false);
      }, 1000);

    } catch (err) {
      console.error('Push and override bills failed:', err);
      setIsSyncing(false);
      setSyncProgress(0);
      // Still try regular sync on error
      syncData();
    }
  }, [syncToken, localBills, syncData, t]);

  /**
   * Handle synchronized sign out
   * Attempts to sync pending changes before clearing auth token and queue
   */
  const handleSyncSignOut = useCallback(async () => {
    try {
      // Check if there are pending changes to sync
      const pendingCount = await getPendingCount();
      const isConnected = await NetInfo.fetch().then(state => state.isConnected);
      const token = await getAuthToken();

      // If we have pending changes, network connection, and valid token, try to sync before logout
      if (pendingCount > 0 && isConnected && token) {
        console.info(`Attempting to sync ${pendingCount} pending changes before logout`);

        // Set a timeout to ensure the sync doesn't hang indefinitely
        const syncPromise = syncData();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Sync timeout')), 10000); // 10 second timeout
        });

        try {
          // Race between sync and timeout
          await Promise.race([syncPromise, timeoutPromise]);
          console.info('Pre-logout sync completed successfully');
        } catch (syncError) {
          console.warn('Pre-logout sync failed or timed out:', syncError);
          // Continue with logout even if sync fails
        }
      }
    } catch (error) {
      console.error('Error during pre-logout sync check:', error);
      // Continue with logout even if there was an error checking sync status
    }

    // Remove authentication token
    await removeAuthToken();
    // Clear offline operation queue
    await clearQueue();
    // Reset authentication state
    setAuthState({ ...initialAuthState, isLoading: false });
    // Reset sync-related states
    setLastSyncTime(null);
    setSyncToken(null);
    setLocalBills([]);
    // Clear sync time record
    await storage.removeItem("momiq_last_sync");
    console.info('User logged out, sync state reset');
  }, [syncData]);

  /**
   * Email/Password login function
   */
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Call authentication API
      const response = await apiClient.auth.login({ email, password });

      if (response.token) {
        await storeAuthToken(response.token);

        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: response.user,
          error: null,
        });

        // Prompt user for sync strategy
        handlePostLoginSync(response.token);

        return true;
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Login failed. Please check your credentials.',
      }));
      return false;
    }
  }, [syncData, handlePostLoginSync]);
  const refreshUserInfo = useCallback(async (token: string, user: User) => {
    // 获取用户完整信息
    try {
      const userData = await apiClient.auth.getProfile(token);
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: userData,
        error: null,
      });
    } catch (profileError) {
      console.error('Failed to fetch user profile after Apple login:', profileError);
      // 如果获取完整信息失败，仍使用登录返回的基本用户信息
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: user,
        error: null,
      });
    }
  }, []);
  /**
   * Handle Google Sign In response
   */
  const handleGoogleSignInResponse = useCallback(async (response: AuthSession.AuthSessionResult): Promise<boolean> => {
    try {
      if (response.type === 'success') {
        // expo-auth-session/providers/google returns tokens in authentication object
        const authentication = (response as any).authentication;
        const params = response.params;

        // Try to get id_token from authentication object first, then from params
        const idToken = authentication?.idToken || params?.id_token;

        // Only proceed if we have an idToken (skip the first response with just authorization code)
        if (idToken) {
          const apiResponse = await apiClient.auth.googleLogin({ idToken });

          if (apiResponse.token) {
            await storeAuthToken(apiResponse.token);
            refreshUserInfo(apiResponse.token, apiResponse.user);

            handlePostLoginSync(apiResponse.token);

            return true;
          }
        } else {
          // This is likely the first response with authorization code, not an error
          // Just log for debugging but don't throw error
          return false; // Return false but don't throw error
        }
      } else {
        console.error('Google sign-in response type:', response.type);
        if (response.type === 'error') {
          console.error('Google sign-in error details:', response.error);
        }
      }

      throw new Error('Google sign-in failed');
    } catch (error) {
      console.error('Google sign-in response error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
      return false;
    }
  }, [handlePostLoginSync]);

  /**
   * Google Sign In
   */
  const loginWithGoogle = useCallback(async (): Promise<boolean> => {
    try {
      // Check if Google configuration is complete
      if (!googleWebClientId || !googleIosClientId) {
        console.error('Google OAuth configuration incomplete:', {
          webClientId: !!googleWebClientId,
          iosClientId: !!googleIosClientId,
          androidClientId: !!googleAndroidClientId
        });
        Alert.alert(t('Error'), t('Google login is not properly configured. Please check environment variables.'));
        return false;
      }

      if (!googlePromptAsync || typeof googlePromptAsync !== 'function') {
        console.error('Google promptAsync not available');
        Alert.alert(t('Error'), t('Google login is not configured'));
        return false;
      }

      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await googlePromptAsync();

      if (result.type === 'success') {
        return await handleGoogleSignInResponse(result);
      } else if (result.type === 'cancel') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      } else {
        console.error('Google sign-in failed with type:', result.type);
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
        return false;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'Google sign-in failed' }));
      return false;
    }
  }, [googlePromptAsync, handleGoogleSignInResponse, googleWebClientId, googleIosClientId]);

  /**
   * Apple Sign In
   */
  const loginWithApple = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      if (Platform.OS !== 'ios') {
        Alert.alert(t('Error'), t('Apple Sign In is only available on iOS devices'));
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Use expo-apple-authentication for Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential && credential.identityToken) {
        // Send identity token to backend for verification
        const appleResponse = await apiClient.auth.appleLogin({
          identityToken: credential.identityToken,
          user: credential.user
        });

        if (appleResponse.token) {
          await storeAuthToken(appleResponse.token);
          refreshUserInfo(appleResponse.token, appleResponse.user);

          handlePostLoginSync(appleResponse.token);

          return true;
        }
      }

      throw new Error('Apple sign-in failed');
    } catch (error) {
      console.error('Apple sign-in error:', error);

      // User canceled login
      if ((error as any)?.code === 'ERR_CANCELED') {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: t('Apple sign-in failed'),
      }));
      return false;
    }
  }, [syncData, handlePostLoginSync]);

  /**
   * WeChat Sign In
   */
  const loginWithWeChat = useCallback(async (): Promise<boolean> => {
    try {
      if (!wechatPromptAsync || typeof wechatPromptAsync !== 'function') {
        Alert.alert(t('Error'), t('WeChat login is not configured'));
        return false;
      }

      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await wechatPromptAsync();

      if (result.type === 'success') {
        return await handleWeChatSignInResponse(result);
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    } catch (error) {
      console.error('WeChat sign-in error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'WeChat sign-in failed' }));
      return false;
    }
  }, [wechatPromptAsync, syncData]);

  /**
   * Handle WeChat Sign In response
   */
  const handleWeChatSignInResponse = useCallback(async (response: AuthSession.AuthSessionResult): Promise<boolean> => {
    try {
      if (response.type === 'success' && response.params.code) {
        const apiResponse = await apiClient.auth.wechatLogin({ code: response.params.code });

        if (apiResponse.token) {
          await storeAuthToken(apiResponse.token);

          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: apiResponse.user,
            error: null,
          });

          // Trigger data sync
          syncData();

          return true;
        }
      }

      throw new Error('WeChat sign-in failed');
    } catch (error) {
      console.error('WeChat sign-in response error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: 'WeChat sign-in failed' }));
      return false;
    }
  }, [syncData]);

  /**
   * Logout function
   * Ensures all pending changes are synced before signing out
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // Check if there are pending changes to sync
      const pendingCount = await getPendingCount();
      if (pendingCount > 0) {
        // Show alert to inform user about pending changes
        const isConnected = await NetInfo.fetch().then(state => state.isConnected);

        if (isConnected) {
          Alert.alert(
            t('Pending Changes'),
            t('You have {{count}} unsaved changes. We\'ll try to sync them before logging out.', { count: pendingCount }),
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            t('Offline Changes'),
            t('You have {{count}} unsaved changes that cannot be synced while offline. These changes will be lost if you log out now.', { count: pendingCount }),
            [
              {
                text: t('Cancel'),
                style: 'cancel',
                onPress: () => setAuthState(prev => ({ ...prev, isLoading: false }))
              },
              {
                text: t('Log Out Anyway'),
                style: 'destructive',
                onPress: async () => {
                  // User confirmed to log out without syncing
                  await handleSyncSignOut();
                }
              }
            ]
          );
          return; // Exit early to wait for user decision
        }
      }

      // Use handleSyncSignOut to process synchronized sign out
      // It will attempt to sync pending changes, then clear auth token and queue
      await handleSyncSignOut();
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: t('Logout failed'),
      }));
    }
  }, [handleSyncSignOut]);

  /**
   * Delete account function
   */
  const deleteAccount = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const token = await getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call API to delete account
      await apiClient.auth.deleteAccount(token);

      // Remove token from storage
      await removeAuthToken();

      // Clear local data
      await storage.clear();

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });

      setLastSyncTime(null);
      return true;
    } catch (error) {
      console.error('Delete account error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: t('Failed to delete account'),
      }));
      return false;
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((userData: Partial<User>): void => {
    if (!authState.user) return;

    setAuthState(prev => ({
      ...prev,
      user: {
        ...prev.user!,
        ...userData,
      },
    }));
  }, [authState.user]);

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithGoogle,
    loginWithApple,
    loginWithWeChat,
    logout,
    deleteAccount,
    updateUser,
    syncData,
    lastSyncTime,
    isSyncing,
    showSyncOptionsSheet,
    setSyncOptionsSheet: setShowSyncOptionsSheet,
    isRefreshBill,
    setIsRefreshBill,
    isOnline,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <SyncOptionsSheet
        open={showSyncOptionsSheet}
        onOpenChange={setShowSyncOptionsSheet}
        onMerge={handleMerge}
        onClearAndDownload={handleClearAndDownload}
        onPushAndOverride={handlePushAndOverride}
        syncProgress={syncProgress}
        syncOperation={syncOperation}
        isSyncing={isSyncing}
      />
      <GlobalJoinRequestsListener />
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
