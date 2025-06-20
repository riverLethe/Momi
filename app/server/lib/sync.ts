import { prisma } from "./database";
import type { PrismaClient } from "@prisma/client";

export interface SyncRequest {
  bills?: any[];
  budgets?: any[];
  lastSyncTime?: string;
  deviceId?: string;
  deviceType?: "ios" | "android" | "web";
  appVersion?: string;
}

export interface SyncResponse {
  bills: any[];
  budgets: any[];
  conflicts: any[];
  lastSyncTime: string;
  stats: {
    billsUploaded: number;
    billsDownloaded: number;
    budgetsUploaded: number;
    budgetsDownloaded: number;
    conflictsDetected: number;
  };
}

export interface ConflictData {
  entityType: "bill" | "budget";
  entityId: string;
  conflictType: "update_conflict" | "delete_conflict";
  localData: any;
  serverData: any;
}

export class SyncService {
  /**
   * 执行完整的数据同步
   */
  static async syncUserData(
    userId: string,
    syncRequest: SyncRequest
  ): Promise<SyncResponse> {
    const startTime = new Date();
    let stats = {
      billsUploaded: 0,
      billsDownloaded: 0,
      budgetsUploaded: 0,
      budgetsDownloaded: 0,
      conflictsDetected: 0,
    };

    try {
      // 在事务中执行同步操作
      const result = await prisma.$transaction(async (tx) => {
        const conflicts: ConflictData[] = [];

        // 1. 同步账单数据
        const {
          uploaded: billsUploaded,
          downloaded: billsDownloaded,
          conflicts: billConflicts,
        } = await this.syncBills(
          tx,
          userId,
          syncRequest.bills || [],
          syncRequest.lastSyncTime
        );

        stats.billsUploaded = billsUploaded;
        stats.billsDownloaded = billsDownloaded;
        conflicts.push(...billConflicts);

        // 2. 同步预算数据
        const {
          uploaded: budgetsUploaded,
          downloaded: budgetsDownloaded,
          conflicts: budgetConflicts,
        } = await this.syncBudgets(
          tx,
          userId,
          syncRequest.budgets || [],
          syncRequest.lastSyncTime
        );

        stats.budgetsUploaded = budgetsUploaded;
        stats.budgetsDownloaded = budgetsDownloaded;
        conflicts.push(...budgetConflicts);

        // 3. 获取最新数据
        const [bills, budgets] = await Promise.all([
          this.getUserBills(tx, userId, syncRequest.lastSyncTime),
          this.getUserBudgets(tx, userId, syncRequest.lastSyncTime),
        ]);

        stats.conflictsDetected = conflicts.length;

        return { bills, budgets, conflicts };
      });

      // 4. 记录同步日志
      await this.createSyncLog(userId, "full", "success", stats, syncRequest);

      // 5. 更新用户最后同步时间
      await prisma.user.update({
        where: { id: userId },
        data: { lastSyncAt: new Date() },
      });

      return {
        ...result,
        lastSyncTime: new Date().toISOString(),
        stats,
      };
    } catch (error) {
      console.error("Sync failed for user:", userId, error);

      // 记录失败日志
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.createSyncLog(
        userId,
        "full",
        "error",
        stats,
        syncRequest,
        errorMessage
      );

      throw new Error("Sync operation failed");
    }
  }

  /**
   * 同步账单数据
   */
  private static async syncBills(
    tx: PrismaClient,
    userId: string,
    localBills: any[],
    lastSyncTime?: string
  ) {
    let uploaded = 0;
    let downloaded = 0;
    const conflicts: ConflictData[] = [];

    // 处理本地账单上传
    for (const localBill of localBills) {
      try {
        const existingBill = await tx.bill.findUnique({
          where: { id: localBill.id },
        });

        if (!existingBill) {
          // 创建新账单
          await tx.bill.create({
            data: {
              id: localBill.id,
              userId,
              amount: localBill.amount,
              category: localBill.category,
              categoryName: localBill.categoryName,
              merchant: localBill.merchant,
              note: localBill.note,
              paymentMethod: localBill.paymentMethod,
              billDate: new Date(localBill.date || localBill.billDate),
              receiptUrl: localBill.receiptUrl,
              location: localBill.location,
              tags: localBill.tags || [],
              lastModified: new Date(localBill.updatedAt || Date.now()),
              syncVersion: 1,
              isDeleted: localBill.isDeleted || false,
            },
          });
          uploaded++;
        } else {
          // 检查冲突
          const serverModified = existingBill.lastModified;
          const localModified = new Date(localBill.updatedAt || Date.now());

          if (serverModified > localModified) {
            // 服务器数据更新，存在冲突
            conflicts.push({
              entityType: "bill",
              entityId: localBill.id,
              conflictType: "update_conflict",
              localData: localBill,
              serverData: existingBill,
            });
          } else if (localModified > serverModified) {
            // 本地数据更新，上传到服务器
            await tx.bill.update({
              where: { id: localBill.id },
              data: {
                amount: localBill.amount,
                category: localBill.category,
                categoryName: localBill.categoryName,
                merchant: localBill.merchant,
                note: localBill.note,
                paymentMethod: localBill.paymentMethod,
                billDate: new Date(localBill.date || localBill.billDate),
                receiptUrl: localBill.receiptUrl,
                location: localBill.location,
                tags: localBill.tags || [],
                lastModified: localModified,
                syncVersion: existingBill.syncVersion + 1,
                isDeleted: localBill.isDeleted || false,
              },
            });
            uploaded++;
          }
        }
      } catch (error) {
        console.error(`Failed to sync bill ${localBill.id}:`, error);
      }
    }

    // 统计下载数量（服务器上有但本地同步时间后更新的数据）
    if (lastSyncTime) {
      const serverUpdates = await tx.bill.count({
        where: {
          userId,
          lastModified: {
            gt: new Date(lastSyncTime),
          },
          isDeleted: false,
        },
      });
      downloaded = serverUpdates;
    }

    return { uploaded, downloaded, conflicts };
  }

  /**
   * 同步预算数据
   */
  private static async syncBudgets(
    tx: PrismaClient,
    userId: string,
    localBudgets: any[],
    lastSyncTime?: string
  ) {
    let uploaded = 0;
    let downloaded = 0;
    const conflicts: ConflictData[] = [];

    // 处理本地预算上传
    for (const localBudget of localBudgets) {
      try {
        const existingBudget = await tx.budget.findUnique({
          where: { id: localBudget.id },
        });

        if (!existingBudget) {
          // 创建新预算
          await tx.budget.create({
            data: {
              id: localBudget.id,
              userId,
              name: localBudget.name,
              amount: localBudget.amount,
              period: localBudget.period,
              category: localBudget.category,
              startDate: new Date(localBudget.startDate),
              endDate: new Date(localBudget.endDate),
              isActive: localBudget.isActive !== false,
              alertThreshold: localBudget.alertThreshold,
              lastModified: new Date(localBudget.updatedAt || Date.now()),
              syncVersion: 1,
              isDeleted: localBudget.isDeleted || false,
            },
          });
          uploaded++;
        } else {
          // 检查冲突
          const serverModified = existingBudget.lastModified;
          const localModified = new Date(localBudget.updatedAt || Date.now());

          if (serverModified > localModified) {
            // 服务器数据更新，存在冲突
            conflicts.push({
              entityType: "budget",
              entityId: localBudget.id,
              conflictType: "update_conflict",
              localData: localBudget,
              serverData: existingBudget,
            });
          } else if (localModified > serverModified) {
            // 本地数据更新，上传到服务器
            await tx.budget.update({
              where: { id: localBudget.id },
              data: {
                name: localBudget.name,
                amount: localBudget.amount,
                period: localBudget.period,
                category: localBudget.category,
                startDate: new Date(localBudget.startDate),
                endDate: new Date(localBudget.endDate),
                isActive: localBudget.isActive !== false,
                alertThreshold: localBudget.alertThreshold,
                lastModified: localModified,
                syncVersion: existingBudget.syncVersion + 1,
                isDeleted: localBudget.isDeleted || false,
              },
            });
            uploaded++;
          }
        }
      } catch (error) {
        console.error(`Failed to sync budget ${localBudget.id}:`, error);
      }
    }

    // 统计下载数量
    if (lastSyncTime) {
      const serverUpdates = await tx.budget.count({
        where: {
          userId,
          lastModified: {
            gt: new Date(lastSyncTime),
          },
          isDeleted: false,
        },
      });
      downloaded = serverUpdates;
    }

    return { uploaded, downloaded, conflicts };
  }

  /**
   * 获取用户账单数据
   */
  private static async getUserBills(
    tx: PrismaClient,
    userId: string,
    lastSyncTime?: string
  ) {
    const where: any = {
      userId,
      isDeleted: false,
    };

    if (lastSyncTime) {
      where.lastModified = {
        gt: new Date(lastSyncTime),
      };
    }

    return await tx.bill.findMany({
      where,
      orderBy: {
        lastModified: "desc",
      },
    });
  }

  /**
   * 获取用户预算数据
   */
  private static async getUserBudgets(
    tx: any,
    userId: string,
    lastSyncTime?: string
  ) {
    const where: any = {
      userId,
      isDeleted: false,
    };

    if (lastSyncTime) {
      where.lastModified = {
        gt: new Date(lastSyncTime),
      };
    }

    return await tx.budget.findMany({
      where,
      orderBy: {
        lastModified: "desc",
      },
    });
  }

  /**
   * 创建同步日志
   */
  private static async createSyncLog(
    userId: string,
    syncType: string,
    status: string,
    stats: any,
    syncRequest: SyncRequest,
    message?: string
  ) {
    return await prisma.syncLog.create({
      data: {
        userId,
        syncType,
        status,
        message,
        billsUploaded: stats.billsUploaded,
        billsDownloaded: stats.billsDownloaded,
        budgetsUploaded: stats.budgetsUploaded,
        budgetsDownloaded: stats.budgetsDownloaded,
        conflictsResolved: stats.conflictsDetected,
        deviceId: syncRequest.deviceId,
        deviceType: syncRequest.deviceType,
        appVersion: syncRequest.appVersion,
      },
    });
  }

  /**
   * 解决数据冲突
   */
  static async resolveConflict(
    userId: string,
    conflictId: string,
    resolution: "local" | "server" | "merge",
    mergedData?: any
  ) {
    const conflict = await prisma.dataConflict.findUnique({
      where: { id: conflictId },
    });

    if (!conflict || conflict.userId !== userId) {
      throw new Error("Conflict not found");
    }

    let resolvedData: any;

    switch (resolution) {
      case "local":
        resolvedData = conflict.localData;
        break;
      case "server":
        resolvedData = conflict.serverData;
        break;
      case "merge":
        resolvedData = mergedData || conflict.localData;
        break;
    }

    // 更新实际数据
    if (conflict.entityType === "bill") {
      await prisma.bill.update({
        where: { id: conflict.entityId },
        data: {
          ...resolvedData,
          lastModified: new Date(),
          syncVersion: { increment: 1 },
        },
      });
    } else if (conflict.entityType === "budget") {
      await prisma.budget.update({
        where: { id: conflict.entityId },
        data: {
          ...resolvedData,
          lastModified: new Date(),
          syncVersion: { increment: 1 },
        },
      });
    }

    // 标记冲突已解决
    await prisma.dataConflict.update({
      where: { id: conflictId },
      data: {
        isResolved: true,
        resolvedData,
        resolvedBy: "user",
        resolvedAt: new Date(),
      },
    });

    return resolvedData;
  }

  /**
   * 获取用户同步统计
   */
  static async getSyncStats(userId: string) {
    const [recentSyncs, totalBills, totalBudgets, pendingConflicts] =
      await Promise.all([
        prisma.syncLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.bill.count({
          where: { userId, isDeleted: false },
        }),
        prisma.budget.count({
          where: { userId, isDeleted: false },
        }),
        prisma.dataConflict.count({
          where: { userId, isResolved: false },
        }),
      ]);

    return {
      recentSyncs,
      totalBills,
      totalBudgets,
      pendingConflicts,
      lastSync: recentSyncs[0]?.createdAt || null,
    };
  }

  /**
   * 清理旧的同步数据
   */
  static async cleanupOldData(userId: string, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // 清理旧的同步日志
    await prisma.syncLog.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // 清理已解决的冲突
    await prisma.dataConflict.deleteMany({
      where: {
        userId,
        isResolved: true,
        resolvedAt: {
          lt: cutoffDate,
        },
      },
    });
  }
}
