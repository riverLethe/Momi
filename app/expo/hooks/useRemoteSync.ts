import { useEffect, useState } from "react";
import { syncRemoteData } from "@/utils/sync.utils";

/**
 * Synchronise bills & transactions with remote backend whenever user/auth changes.
 * Returns a boolean flag indicating whether a sync operation is currently running.
 */
export const useRemoteSync = (
  isAuthenticated: boolean,
  user: { id: string } | null | undefined,
  refreshData: () => Promise<void>
) => {
  const [syncingRemote, setSyncingRemote] = useState(false);

  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user?.id) {
        try {
          setSyncingRemote(true);
          await syncRemoteData("bills", user.id);
          await syncRemoteData("transactions", user.id);
          await refreshData();
        } catch (error) {
          console.error("Failed to sync remote data:", error);
        } finally {
          setSyncingRemote(false);
        }
      }
    };

    syncData();
    // We intentionally exclude refreshData from deps to avoid re-creating the effect
    // whenever the function identity changes (it is usually stable but memoised).
  }, [isAuthenticated, user]);

  return syncingRemote;
};
