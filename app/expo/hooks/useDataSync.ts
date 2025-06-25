import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useAuth } from "@/providers/AuthProvider";
import { apiClient } from "@/utils/api";
import { getAuthToken } from "@/utils/userPreferences.utils";
import { storage } from "@/utils/storage.utils";

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
  const { isAuthenticated, user, lastSyncTime: authLastSyncTime } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isOnline: false,
    isSyncing: false,
    lastSyncTime: authLastSyncTime,
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

        // Perform sync
        await apiClient.sync.syncData(token);

        // Update sync state
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
    [isAuthenticated, user, syncState.isSyncing, syncState.isOnline]
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

  return {
    ...syncState,
    syncData,
    incrementPendingChanges,
    getSyncStatusText,
    getSyncStatusColor,
  };
};
