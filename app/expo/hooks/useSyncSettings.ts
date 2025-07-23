import { useState, useEffect, useCallback } from "react";
import { storage } from "@/utils/storage.utils";
import { useAuth } from "@/providers/AuthProvider";

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
  const { syncData, lastSyncTime, isSyncing, isOnline, isAuthenticated } = useAuth();
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

  // Format last sync time
  const getLastSyncText = useCallback(() => {
    if (!lastSyncTime) return "Never synced";

    const year = lastSyncTime.getFullYear();
    const month = String(lastSyncTime.getMonth() + 1).padStart(2, '0');
    const day = String(lastSyncTime.getDate()).padStart(2, '0');
    const hours = String(lastSyncTime.getHours()).padStart(2, '0');
    const minutes = String(lastSyncTime.getMinutes()).padStart(2, '0');
    const seconds = String(lastSyncTime.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
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
