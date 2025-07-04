import { Alert } from "react-native";
import { useTranslation } from "react-i18next";

import { Bill } from "@/types/bills.types";
import {
  deleteBill as deleteBillUtil,
  updateBill as updateBillUtil,
} from "@/utils/bills.utils";
import { useData } from "@/providers/DataProvider";

interface DeleteBillOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
  confirmMessage?: string;
  ignoreRefresh?: boolean;
}

interface UpdateBillFieldOptions {
  onSuccess?: (updatedBill: Bill) => void;
  onError?: (error: unknown) => void;
  /**
   * When true, skip the global refreshData call after the bill has been updated.
   * Useful when you only need the current screen to reflect the change quickly.
   */
  ignoreRefresh?: boolean;
}

/**
 * useBillActions - provide common actions (delete / update) related to a single bill
 */
export const useBillActions = () => {
  const { t } = useTranslation();
  const { refreshData } = useData();

  /**
   * Show a confirmation dialog then delete the specified bill.
   */
  const confirmDeleteBill = (bill: Bill, options: DeleteBillOptions = {}) => {
    const { onSuccess, onError, confirmMessage, ignoreRefresh } = options;

    Alert.alert(
      t("Delete Bill"),
      confirmMessage ||
        t(
          "Are you sure you want to delete this bill? This action cannot be undone."
        ),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteBillUtil(bill.id);
              if (success) {
                if (!ignoreRefresh) {
                  // Fire-and-forget refresh so UI actions are not blocked
                  refreshData().catch(() => {});
                }
                onSuccess?.();
              } else {
                throw new Error("Bill not found");
              }
            } catch (error) {
              console.error("Failed to delete bill:", error);
              onError?.(error);
            }
          },
        },
      ]
    );
  };

  /**
   * Update a single field of the bill and refresh global data.
   * Returns the updated bill via onSuccess callback.
   */
  const updateBillField = async (
    bill: Bill,
    field: keyof Bill,
    value: any,
    options: UpdateBillFieldOptions = {}
  ) => {
    const { onSuccess, onError, ignoreRefresh } = options;
    try {
      const prevVal: any = (bill as any)[field];
      if (field === "date") {
        if (new Date(prevVal).getTime() === new Date(value).getTime()) {
          onSuccess?.(bill as Bill);
          return;
        }
      } else if (prevVal === value) {
        onSuccess?.(bill as Bill);
        return;
      }

      // Build the updated bill object locally for immediate UI feedback
      const updatedLocal: Bill = {
        ...bill,
        [field]: value,
        updatedAt: new Date(),
      } as Bill;

      // Optimistically update caller
      onSuccess?.(updatedLocal);

      // Persist change in background – this prevents blocking the UI thread
      (async () => {
        try {
          await updateBillUtil(bill.id, updatedLocal);

          // Refresh global store after persistence completes if requested
          if (!ignoreRefresh) {
            await refreshData();
          }
        } catch (err) {
          console.error("Failed to persist bill update:", err);
          onError?.(err);
        }
      })();
    } catch (error) {
      console.error("Failed to update bill field:", error);
      onError?.(error);
    }
  };

  return {
    confirmDeleteBill,
    updateBillField,
  };
};
