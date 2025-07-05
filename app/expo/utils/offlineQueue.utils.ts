import { storage } from "./storage.utils";
import { Bill } from "@/types/bills.types";

// Storage keys specific to queue / pending-changes counter
const QUEUE_KEY = "momiq_bill_sync_queue";
const PENDING_CHANGES_KEY = "momiq_pending_changes";

export type BillSyncAction = "create" | "update" | "delete";

export interface BillSyncOperation {
  id: string; // local operation id
  action: BillSyncAction;
  bill: Partial<Bill> & { id: string };
  timestamp: number;
}

/**
 * Return the current offline queue (empty array if nothing queued).
 */
export const getQueue = async (): Promise<BillSyncOperation[]> => {
  return (await storage.getItem<BillSyncOperation[]>(QUEUE_KEY)) || [];
};

/** Persist queue (internal helper) and also update the pending-changes counter. */
const persistQueue = async (queue: BillSyncOperation[]) => {
  await storage.setItem(QUEUE_KEY, queue);
  await storage.setItem(PENDING_CHANGES_KEY, queue.length.toString());
};

/**
 * Push a new bill operation into the offline queue.
 */
export const addOperation = async (
  action: BillSyncAction,
  bill: Partial<Bill> & { id: string }
) => {
  const queue = await getQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    action,
    bill,
    timestamp: Date.now(),
  });
  await persistQueue(queue);
};

/**
 * Remove all queued operations and reset pending-changes counter.
 */
export const clearQueue = async () => {
  await storage.removeItem(QUEUE_KEY);
  await storage.setItem(PENDING_CHANGES_KEY, "0");
};

/**
 * Convenience: return how many pending operations currently exist.
 */
export const getPendingCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.length;
};
