import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";
import { storage, STORAGE_KEYS } from "@/utils/storage.utils";
import { getQueue, clearQueue } from "@/utils/offlineQueue.utils";
import { getBills as getLocalBills } from "@/utils/bills.utils";

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
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: false,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    error: null,
  });

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setSyncState((prev) => ({
        ...prev,
        isOnline: state.isConnected === true,
      }));
    });

    return () => unsubscribe();
  }, []);

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
        lastSyncTime: lastSyncStr ? new Date(lastSyncStr) : null,
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

  const syncData = useCallback(
    async (force = false) => {
      if (!isAuthenticated || !user) {
        console.log("Not authenticated, skipping sync");
        return;
      }

      if (syncState.isSyncing && !force) {
        console.log("Sync already in progress");
        return;
      }

      setSyncState((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
      }));

      try {
        const token = await getAuthToken();
        if (!token) {
          throw new Error("No auth token available");
        }

        // STEP 1: flush offline queue (if any)
        const queue = await getQueue();
        if (queue.length > 0) {
          console.log(`Uploading ${queue.length} queued bill operations...`);
          await apiClient.sync.uploadBills(token, queue);
        }

        // STEP 2: download remote changes since last sync
        const remoteBills = await apiClient.sync.downloadBills(
          token,
          syncState.lastSyncTime
            ? syncState.lastSyncTime.toISOString()
            : undefined
        );

        if (Array.isArray(remoteBills) && remoteBills.length > 0) {
          const localBills = await getLocalBills();
          const merged: any[] = [...localBills];

          remoteBills.forEach((remote: any) => {
            const idx = merged.findIndex((b: any) => b.id === remote.id);
            if (remote.deleted) {
              if (idx !== -1) merged.splice(idx, 1);
              return;
            }
            if (idx !== -1) {
              merged[idx] = remote;
            } else {
              merged.push(remote);
            }
          });

          await storage.setItem(STORAGE_KEYS.BILLS, merged);
          // invalidate cache so next reads get fresh data
          storage.invalidateCache(STORAGE_KEYS.BILLS);
        }

        // STEP 3: clear offline queue & pending counter
        await clearQueue();

        // STEP 4: update last sync time
        const newSyncTime = new Date();
        await storage.setItem(LAST_SYNC_KEY, newSyncTime.toISOString());
        await savePendingChanges(0);

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncTime: newSyncTime,
          pendingChanges: 0,
          error: null,
        }));

        console.log("Data sync completed successfully");
      } catch (error: any) {
        console.error("Sync failed:", error);

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: error?.message || "Sync failed",
        }));

        if (syncState.isOnline) {
          Alert.alert(
            "Sync Failed",
            "Failed to sync your data. Please try again later.",
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
  useEffect(() => {
    if (
      isAuthenticated &&
      syncState.isOnline &&
      syncState.pendingChanges > 0 &&
      !syncState.isSyncing
    ) {
      syncData();
    }
  }, [
    isAuthenticated,
    syncState.isOnline,
    syncState.pendingChanges,
    syncState.isSyncing,
    syncData,
  ]);

  return {
    ...syncState,
    syncData,
    incrementPendingChanges,
    getSyncStatusText,
    getSyncStatusColor,
  };
};
