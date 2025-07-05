import { useState, useEffect, useCallback } from "react";
import { storage } from "@/utils/storage.utils";
import { useAuth } from "@/providers/AuthProvider";
import { useDataSync } from "./useDataSync";

interface SyncSettings {
  autoSyncEnabled: boolean;
  syncInterval: number; // in minutes
  wifiOnlySync: boolean;
}

const DEFAULT_SYNC_SETTINGS: SyncSettings = {
  autoSyncEnabled: true,
  syncInterval: 30, // 30 minutes
  wifiOnlySync: false,
};

const SYNC_SETTINGS_KEY = "momiq_sync_settings";

export const useSyncSettings = () => {
  const { isAuthenticated } = useAuth();
  const { syncData, lastSyncTime, isSyncing, isOnline } = useDataSync();
  const [settings, setSettings] = useState<SyncSettings>(DEFAULT_SYNC_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings =
          await storage.getItem<SyncSettings>(SYNC_SETTINGS_KEY);
        if (storedSettings) {
          setSettings(storedSettings);
        }
      } catch (error) {
        console.error("Failed to load sync settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: SyncSettings) => {
    try {
      await storage.setItem(SYNC_SETTINGS_KEY, newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error("Failed to save sync settings:", error);
    }
  }, []);

  // Update individual setting
  const updateSetting = useCallback(
    async <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      await saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Manual sync
  const performManualSync = useCallback(async () => {
    if (!isAuthenticated || !isOnline) return;

    try {
      await syncData();
    } catch (error) {
      console.error("Manual sync failed:", error);
      throw error;
    }
  }, [isAuthenticated, isOnline, syncData]);

  // Auto sync effect
  useEffect(() => {
    if (!settings.autoSyncEnabled || !isAuthenticated || !isOnline) return;

    const interval = setInterval(
      () => {
        syncData();
      },
      settings.syncInterval * 60 * 1000
    ); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [
    settings.autoSyncEnabled,
    settings.syncInterval,
    isAuthenticated,
    isOnline,
    syncData,
  ]);

  // Format last sync time
  const getLastSyncText = useCallback(() => {
    if (!lastSyncTime) return "Never synced";

    const now = new Date();
    const timeDiff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(timeDiff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  }, [lastSyncTime]);

  return {
    settings,
    isLoading,
    updateSetting,
    performManualSync,
    getLastSyncText,
    // Sync status
    isSyncing,
    isOnline,
    lastSyncTime,
  };
};
