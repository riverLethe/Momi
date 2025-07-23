import { useState, useEffect, useCallback, useRef } from "react";
import { Alert, AppState } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";
import { storage, STORAGE_KEYS } from "@/utils/storage.utils";
import {
  getQueue,
  clearQueue,
  getPendingCount,
} from "@/utils/offlineQueue.utils";
import { getBills as getLocalBills } from "@/utils/bills.utils";
import { useTranslation } from "react-i18next";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  error: string | null;
}

const LAST_SYNC_KEY = "momiq_last_sync";
const PENDING_CHANGES_KEY = "momiq_pending_changes";

export const useDataSync = () => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  });

  // 提前声明syncData函数引用，但实现在后面定义
  const syncDataRef = useRef<(force?: boolean) => Promise<void>>(() =>
    Promise.resolve()
  );

  // Monitor network connectivity and app state
  useEffect(() => {
    // Network connectivity monitoring
    const netInfoUnsubscribe = NetInfo.addEventListener(
      (state: NetInfoState) => {
        const wasOffline = !syncState.isOnline;
        const isNowOnline = state.isConnected === true;

        setSyncState((prev) => ({
          ...prev,
          isOnline: isNowOnline,
        }));

        // If we just came back online and have pending changes, trigger sync
        if (
          wasOffline &&
          isNowOnline &&
          syncState.pendingChanges > 0 &&
          !syncState.isSyncing
        ) {
          console.info("Network connection restored, triggering sync...");
          syncDataRef.current();
        }
      }
    );

    // App state monitoring (background/foreground transitions)
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (
          nextAppState === "active" &&
          isAuthenticated &&
          syncState.pendingChanges > 0
        ) {
          // App has come to the foreground
          console.info(
            "App returned to foreground, checking for pending changes..."
          );
          syncDataRef.current();
        }
      }
    );

    return () => {
      netInfoUnsubscribe();
      appStateSubscription.remove();
    };
  }, [
    isAuthenticated,
    syncState.isOnline,
    syncState.pendingChanges,
    syncState.isSyncing,
  ]);

  // Load local sync state on mount
  useEffect(() => {
    loadLocalSyncState();
  }, []);

  // Update sync state when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadLocalSyncState();
    }
  }, [isAuthenticated]);

  const loadLocalSyncState = async () => {
    try {
      const [lastSyncStr, pendingChangesStr] = await Promise.all([
        storage.getItem<string>(LAST_SYNC_KEY),
        storage.getItem<string>(PENDING_CHANGES_KEY),
      ]);

      setSyncState((prev) => ({
        ...prev,
        lastSyncTime: lastSyncStr ? new Date(parseInt(lastSyncStr) || lastSyncStr) : null,
        pendingChanges: pendingChangesStr ? parseInt(pendingChangesStr, 10) : 0,
      }));
    } catch (error) {
      console.error("Failed to load local sync state:", error);
    }
  };

  const savePendingChanges = async (count: number) => {
    try {
      await storage.setItem(PENDING_CHANGES_KEY, count.toString());
      setSyncState((prev) => ({
        ...prev,
        pendingChanges: count,
      }));
    } catch (error) {
      console.error("Failed to save pending changes:", error);
    }
  };

  const incrementPendingChanges = useCallback(async () => {
    const newCount = syncState.pendingChanges + 1;
    await savePendingChanges(newCount);
  }, [syncState.pendingChanges]);

  // 定义syncData实现
  const syncData = useCallback(
    async (force = false) => {
      if (!isAuthenticated || !user) {
        console.info("Not authenticated, skipping sync");
        return;
      }

      if (syncState.isSyncing && !force) {
        console.info("Sync already in progress");
        return;
      }

      setSyncState((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
      }));

      // Implement exponential backoff for retries
      let retryCount = 0;
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second

      const performSync = async (): Promise<boolean> => {
        try {
          const token = await getAuthToken();
          if (!token) {
            throw new Error("No auth token available");
          }

          // Check network status before proceeding
          const netInfo = await NetInfo.fetch();
          if (!netInfo.isConnected) {
            console.info("Device is offline, deferring sync");
            return false;
          }

          // STEP 1: flush offline queue (if any)
          const queue = await getQueue();
          if (queue.length > 0) {
            console.info(`Uploading ${queue.length} queued bill operations...`);
            // Split into batches of 50 operations for better reliability
            const batchSize = 50;
            for (let i = 0; i < queue.length; i += batchSize) {
              const batch = queue.slice(i, i + batchSize);
              
              // 转换时间字段为时间戳格式，以匹配服务端期望的格式
              const formattedBatch = batch.map(operation => ({
                ...operation,
                bill: {
                  ...operation.bill,
                  date: operation.bill.date instanceof Date 
                    ? operation.bill.date.getTime() 
                    : operation.bill.date,
                  createdAt: operation.bill.createdAt instanceof Date 
                    ? operation.bill.createdAt.getTime() 
                    : operation.bill.createdAt,
                  updatedAt: operation.bill.updatedAt instanceof Date 
                    ? operation.bill.updatedAt.getTime() 
                    : operation.bill.updatedAt,
                }
              }));
              
              await apiClient.sync.uploadBills(token, formattedBatch);
              console.info(
                `Uploaded batch ${i / batchSize + 1} of ${Math.ceil(queue.length / batchSize)}`
              );
            }
          }

          // STEP 2: download remote changes since last sync
          const lastSyncTimeStr = await storage.getItem<string>(LAST_SYNC_KEY);
          console.info(
            `Downloading bills since ${lastSyncTimeStr || "beginning"}`
          );

          const downloadResult = await apiClient.sync.downloadBills(
            token,
            lastSyncTimeStr || undefined
          );

          // 正确提取bills数组
          const remoteBills = downloadResult.success ? downloadResult.bills : [];

          if (Array.isArray(remoteBills) && remoteBills.length > 0) {
            console.info(`Downloaded ${remoteBills.length} bills from server`);
            const localBills = await getLocalBills();
            console.info(`Merging with ${localBills.length} local bills`);

            // Smart merge with conflict resolution
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

              const idx = merged.findIndex((b: any) => b.id === remote.id);

              // Handle deleted bills
              if (remote.deleted) {
                if (idx !== -1) merged.splice(idx, 1);
                return;
              }

              if (idx !== -1) {
                // Potential conflict - check timestamps
                const localBill = merged[idx];
                const localUpdatedAt = new Date(
                  localBill.updatedAt || localBill.createdAt
                ).getTime();
                const remoteUpdatedAt = new Date(
                  remote.updatedAt || remote.createdAt
                ).getTime();

                if (remoteUpdatedAt > localUpdatedAt) {
                  // Remote is newer, use it
                  merged[idx] = normalizedRemote;
                } else if (remoteUpdatedAt < localUpdatedAt) {
                  // Local is newer, keep it and track conflict
                  conflicts.push({
                    local: localBill,
                    remote: normalizedRemote,
                    resolution: "kept-local",
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
            // Invalidate cache so next reads get fresh data
            storage.invalidateCache(STORAGE_KEYS.BILLS);

            // Log conflicts if any
            if (conflicts.length > 0) {
              console.info(
                `Resolved ${conflicts.length} conflicts during sync`
              );
            }
          } else {
            console.info("No new bills to download");
          }

          // STEP 3: clear offline queue & pending counter
          await clearQueue();

          // STEP 4: update last sync time
          const newSyncTime = new Date();
        await storage.setItem(LAST_SYNC_KEY, newSyncTime.getTime().toString());
          await savePendingChanges(0);

          console.info("Data sync completed successfully");
          return true;
        } catch (error: any) {
          console.error("Sync attempt failed:", error);

          if (retryCount < maxRetries) {
            // Exponential backoff
            const delay = baseDelay * Math.pow(2, retryCount);
            console.info(
              `Retrying sync in ${delay}ms (attempt ${retryCount + 1} of ${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            retryCount++;
            return performSync(); // Recursive retry
          }

          throw error; // Rethrow after max retries
        }
      };

      try {
        const success = await performSync();

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: success ? new Date() : prev.lastSyncTime,
          pendingChanges: success ? 0 : prev.pendingChanges,
          error: null,
        }));
      } catch (error: any) {
        console.error("Sync failed after retries:", error);

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error?.message || "Sync failed",
        }));

        if (syncState.isOnline) {
          Alert.alert(
            t("Sync Failed"),
            t("Failed to sync your data. Please try again later."),
            [{ text: "OK" }]
          );
        }
      }
    },
    [
      isAuthenticated,
      user,
      syncState.isSyncing,
      syncState.isOnline,
      syncState.lastSyncTime,
    ]
  );

  const getSyncStatusText = () => {
    if (!isAuthenticated) return "Not signed in";
    if (syncState.isSyncing) return "Syncing...";
    if (!syncState.isOnline) return "Offline";
    if (syncState.pendingChanges > 0)
      return `${syncState.pendingChanges} changes pending`;
    if (syncState.lastSyncTime) {
      const timeDiff = Date.now() - syncState.lastSyncTime.getTime();
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `Synced ${days} day${days > 1 ? "s" : ""} ago`;
      if (hours > 0) return `Synced ${hours} hour${hours > 1 ? "s" : ""} ago`;
      if (minutes > 0)
        return `Synced ${minutes} minute${minutes > 1 ? "s" : ""} ago`;
      return "Synced just now";
    }
    return "Never synced";
  };

  const getSyncStatusColor = () => {
    if (!isAuthenticated) return "#9CA3AF";
    if (syncState.isSyncing) return "#3B82F6";
    if (!syncState.isOnline) return "#EF4444";
    if (syncState.pendingChanges > 0) return "#F59E0B";
    return "#10B981";
  };

  // Auto-sync when device is back online and there are pending changes
  // Implements regular sync strategy: automatically sync operation queue to remote when user is online
  useEffect(() => {
    if (
      isAuthenticated &&
      syncState.isOnline &&
      syncState.pendingChanges > 0 &&
      !syncState.isSyncing
    ) {
      console.info(
        "Detected network connection and pending changes, starting automatic sync..."
      );
      syncData();
    }
  }, [
    isAuthenticated,
    syncState.isOnline,
    syncState.pendingChanges,
    syncState.isSyncing,
    syncData,
  ]);

  // 更新syncDataRef引用
  useEffect(() => {
    syncDataRef.current = syncData;
  }, [syncData]);

  // Periodic sync check (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(
      async () => {
        try {
          // Check for pending changes
          const pendingCount = await getPendingCount();

          // Also check if we haven't synced in a while (over 30 minutes)
          const lastSyncTimeStr = await storage.getItem<string>(LAST_SYNC_KEY);
          const lastSyncTime = lastSyncTimeStr
            ? new Date(lastSyncTimeStr)
            : null;
          const syncTooOld = lastSyncTime
            ? Date.now() - lastSyncTime.getTime() > 30 * 60 * 1000
            : true;

          if (
            syncState.isOnline &&
            !syncState.isSyncing &&
            (pendingCount > 0 || syncTooOld)
          ) {
            console.info(
              "Periodic check: Found pending changes or sync is outdated, starting sync..."
            );
            syncDataRef.current();
          }
        } catch (error) {
          console.error("Periodic sync check failed:", error);
        }
      },
      5 * 60 * 1000
    ); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, syncState.isOnline, syncState.isSyncing]);

  return {
    ...syncState,
    syncData,
    incrementPendingChanges,
    getSyncStatusText,
    getSyncStatusColor,
  };
};
