import { db } from "./database";

// Types
export interface SyncData {
  bills: any[];
  budgets: any[];
  lastSyncTimestamp?: string;
  lastSyncTime?: string;
  deviceId?: string;
  deviceType?: string;
  appVersion?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: {
    bills: any[];
    budgets: any[];
    conflicts: any[];
  };
}

export interface SyncLog {
  id: string;
  userId: string;
  operation: string;
  status: string;
  details?: string;
  createdAt: string;
}

// Sync Service
export class SyncService {
  /**
   * Sync user data from client to server
   */
  static async syncUserData(
    userId: string,
    clientData: SyncData,
    deviceInfo?: string
  ): Promise<SyncResult> {
    try {
      // Start transaction-like operations
      const conflicts: any[] = [];
      const syncedBills: any[] = [];
      const syncedBudgets: any[] = [];

      // Process bills
      for (const bill of clientData.bills) {
        const result = await this.processBillSync(userId, bill);
        if (result.conflict) {
          conflicts.push(result.conflict);
        } else if (result.bill) {
          syncedBills.push(result.bill);
        }
      }

      // Process budgets
      for (const budget of clientData.budgets) {
        const result = await this.processBudgetSync(userId, budget);
        if (result.conflict) {
          conflicts.push(result.conflict);
        } else if (result.budget) {
          syncedBudgets.push(result.budget);
        }
      }

      // Update user's last sync time
      await db.execute({
        sql: `UPDATE users SET last_sync = ?, updated_at = ? WHERE id = ?`,
        args: [new Date().toISOString(), new Date().toISOString(), userId],
      });

      // Log sync operation
      await this.createSyncLog(userId, "sync", "success", {
        billsCount: syncedBills.length,
        budgetsCount: syncedBudgets.length,
        conflictsCount: conflicts.length,
        deviceInfo,
      });

      return {
        success: true,
        message: "Sync completed successfully",
        data: {
          bills: syncedBills,
          budgets: syncedBudgets,
          conflicts,
        },
      };
    } catch (error) {
      // Log sync error
      await this.createSyncLog(userId, "sync", "error", {
        error: error instanceof Error ? error.message : "Unknown error",
        deviceInfo,
      });

      return {
        success: false,
        message: "Sync failed",
      };
    }
  }

  /**
   * Process bill synchronization
   */
  private static async processBillSync(
    userId: string,
    bill: any
  ): Promise<{ bill?: any; conflict?: any }> {
    // Check if bill exists
    const existingResult = await db.execute({
      sql: "SELECT * FROM bills WHERE id = ? AND user_id = ?",
      args: [bill.id, userId],
    });

    // 处理家庭空间ID
    const familySpaceId = bill.familySpaceId || null;

    if (existingResult.rows.length === 0) {
      // Insert new bill
      await db.execute({
        sql: `INSERT INTO bills (id, user_id, amount, category, description, bill_date, created_at, updated_at, sync_version, family_space_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          bill.id,
          userId,
          bill.amount,
          bill.category,
          bill.description || null,
          bill.billDate,
          bill.createdAt || new Date().toISOString(),
          new Date().toISOString(),
          bill.syncVersion || 1,
          familySpaceId,
        ],
      });

      // 如果是家庭账单，更新用户的最后记账时间
      if (familySpaceId) {
        try {
          const { FamilyService } = require("./family");
          await FamilyService.updateLastTransactionTime(userId);
        } catch (error) {
          console.error("Failed to update last transaction time:", error);
        }
      }

      return { bill };
    } else {
      // Check for conflicts
      const existing = existingResult.rows[0];
      if (existing.sync_version !== bill.syncVersion) {
        // Conflict detected
        return {
          conflict: {
            id: bill.id,
            type: "bill",
            localData: existing,
            remoteData: bill,
          },
        };
      }

      // Update existing bill
      await db.execute({
        sql: `UPDATE bills SET amount = ?, category = ?, description = ?, bill_date = ?, updated_at = ?, sync_version = ?, family_space_id = ?
              WHERE id = ? AND user_id = ?`,
        args: [
          bill.amount,
          bill.category,
          bill.description || null,
          bill.billDate,
          new Date().toISOString(),
          (bill.syncVersion || 1) + 1,
          familySpaceId,
          bill.id,
          userId,
        ],
      });

      // 如果是家庭账单，更新用户的最后记账时间
      if (familySpaceId) {
        try {
          const { FamilyService } = require("./family");
          await FamilyService.updateLastTransactionTime(userId);
        } catch (error) {
          console.error("Failed to update last transaction time:", error);
        }
      }

      return { bill };
    }
  }

  /**
   * Process budget synchronization
   */
  private static async processBudgetSync(
    userId: string,
    budget: any
  ): Promise<{ budget?: any; conflict?: any }> {
    // Check if budget exists
    const existingResult = await db.execute({
      sql: "SELECT * FROM budgets WHERE id = ? AND user_id = ?",
      args: [budget.id, userId],
    });

    if (existingResult.rows.length === 0) {
      // Insert new budget
      await db.execute({
        sql: `INSERT INTO budgets (id, user_id, category, amount, period, created_at, updated_at, sync_version)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          budget.id,
          userId,
          budget.category,
          budget.amount,
          budget.period,
          budget.createdAt || new Date().toISOString(),
          new Date().toISOString(),
          budget.syncVersion || 1,
        ],
      });
      return { budget };
    } else {
      // Check for conflicts
      const existing = existingResult.rows[0];
      if (existing.sync_version !== budget.syncVersion) {
        // Conflict detected
        return {
          conflict: {
            id: budget.id,
            type: "budget",
            localData: existing,
            remoteData: budget,
          },
        };
      }

      // Update existing budget
      await db.execute({
        sql: `UPDATE budgets SET category = ?, amount = ?, period = ?, updated_at = ?, sync_version = ?
              WHERE id = ? AND user_id = ?`,
        args: [
          budget.category,
          budget.amount,
          budget.period,
          new Date().toISOString(),
          (budget.syncVersion || 1) + 1,
          budget.id,
          userId,
        ],
      });
      return { budget };
    }
  }

  /**
   * Create sync log
   */
  static async createSyncLog(
    userId: string,
    operation: string,
    status: string,
    details?: any
  ): Promise<void> {
    const id =
      "log_" +
      Math.random().toString(36).substr(2, 9) +
      Date.now().toString(36);

    await db.execute({
      sql: `INSERT INTO sync_logs (id, user_id, operation, status, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        userId,
        operation,
        status,
        details ? JSON.stringify(details) : null,
        new Date().toISOString(),
      ],
    });
  }

  /**
   * Get user data for sync
   */
  static async getUserSyncData(
    userId: string,
    lastSyncTimestamp?: string
  ): Promise<SyncData> {
    const whereClause = lastSyncTimestamp
      ? "user_id = ? AND updated_at > ? AND is_deleted = 0"
      : "user_id = ? AND is_deleted = 0";

    const args = lastSyncTimestamp ? [userId, lastSyncTimestamp] : [userId];

    const [billsResult, budgetsResult] = await Promise.all([
      db.execute({
        sql: `SELECT * FROM bills WHERE ${whereClause} ORDER BY updated_at DESC`,
        args,
      }),
      db.execute({
        sql: `SELECT * FROM budgets WHERE ${whereClause} ORDER BY updated_at DESC`,
        args,
      }),
    ]);

    return {
      bills: billsResult.rows,
      budgets: budgetsResult.rows,
      lastSyncTimestamp: new Date().toISOString(),
    };
  }

  /**
   * Get sync statistics
   */
  static async getSyncStats(userId: string) {
    const [billCount, budgetCount, conflictCount] = await Promise.all([
      db.execute({
        sql: "SELECT COUNT(*) as count FROM bills WHERE user_id = ? AND is_deleted = 0",
        args: [userId],
      }),
      db.execute({
        sql: "SELECT COUNT(*) as count FROM budgets WHERE user_id = ? AND is_deleted = 0",
        args: [userId],
      }),
      db.execute({
        sql: "SELECT COUNT(*) as count FROM data_conflicts WHERE user_id = ? AND is_resolved = 0",
        args: [userId],
      }),
    ]);

    return {
      billCount: billCount.rows[0]?.count || 0,
      budgetCount: budgetCount.rows[0]?.count || 0,
      conflictCount: conflictCount.rows[0]?.count || 0,
    };
  }

  /**
   * Clean up old sync logs
   */
  static async cleanupOldLogs(
    userId: string,
    daysToKeep: number = 30
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db.execute({
      sql: "DELETE FROM sync_logs WHERE user_id = ? AND created_at < ?",
      args: [userId, cutoffDate.toISOString()],
    });

    return result.rowsAffected;
  }

  /**
   * Resolve conflict
   */
  static async resolveConflict(
    userId: string,
    conflictId: string,
    resolution: "local" | "remote"
  ): Promise<boolean> {
    const conflictResult = await db.execute({
      sql: "SELECT * FROM data_conflicts WHERE id = ? AND user_id = ?",
      args: [conflictId, userId],
    });

    if (conflictResult.rows.length === 0) {
      return false;
    }

    const conflict = conflictResult.rows[0];
    const data =
      resolution === "local"
        ? JSON.parse(String(conflict.local_data))
        : JSON.parse(String(conflict.remote_data));

    // Apply resolution based on resource type
    if (conflict.resource_type === "bill") {
      await db.execute({
        sql: `UPDATE bills SET amount = ?, category = ?, description = ?, bill_date = ?, updated_at = ?
              WHERE id = ? AND user_id = ?`,
        args: [
          data.amount,
          data.category,
          data.description,
          data.billDate,
          new Date().toISOString(),
          conflict.resource_id,
          userId,
        ],
      });
    } else if (conflict.resource_type === "budget") {
      await db.execute({
        sql: `UPDATE budgets SET category = ?, amount = ?, period = ?, updated_at = ?
              WHERE id = ? AND user_id = ?`,
        args: [
          data.category,
          data.amount,
          data.period,
          new Date().toISOString(),
          conflict.resource_id,
          userId,
        ],
      });
    }

    // Mark conflict as resolved
    await db.execute({
      sql: "UPDATE data_conflicts SET is_resolved = 1 WHERE id = ?",
      args: [conflictId],
    });

    return true;
  }
}
