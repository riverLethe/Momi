import { PrismaClient } from "@prisma/client";
import { environmentUtils, tursoConfig } from "./turso";

// 全局 Prisma 客户端实例
declare global {
  var prisma: PrismaClient | undefined;
}

// 创建 Prisma 客户端实例
export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// 初始化时显示数据库信息
if (process.env.NODE_ENV === "development") {
  const dbInfo = environmentUtils.getDatabaseInfo();
  console.log("📊 Database Configuration:");
  console.log(`   Type: ${dbInfo.type}`);
  console.log(`   Environment: ${dbInfo.environment}`);
  console.log(`   URL: ${dbInfo.url}`);
  if (environmentUtils.isTursoEnvironment()) {
    console.log(
      `   Auth Token: ${dbInfo.hasAuthToken ? "✅ Configured" : "❌ Missing"}`
    );
  }
}

// 在开发环境中避免热重载时创建多个实例
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// 数据库工具函数
export class DatabaseService {
  /**
   * 测试数据库连接
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;

      // 如果是 Turso 环境，也测试直接连接
      if (environmentUtils.isTursoEnvironment()) {
        await tursoConfig.testConnection();
      }

      return true;
    } catch (error) {
      console.error("Database connection failed:", error);
      return false;
    }
  }

  /**
   * 优雅关闭数据库连接
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  /**
   * 执行数据库事务
   */
  static async transaction<T>(
    fn: (tx: PrismaClient) => Promise<T>
  ): Promise<T> {
    return await prisma.$transaction(fn);
  }

  /**
   * 获取用户统计信息
   */
  static async getUserStats(userId: string) {
    const [billCount, budgetCount, lastSyncLog] = await Promise.all([
      prisma.bill.count({
        where: { userId, isDeleted: false },
      }),
      prisma.budget.count({
        where: { userId, isDeleted: false },
      }),
      prisma.syncLog.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      billCount,
      budgetCount,
      lastSync: lastSyncLog?.createdAt || null,
    };
  }

  /**
   * 清理过期的用户会话
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * 获取同步冲突
   */
  static async getPendingConflicts(userId: string) {
    return await prisma.dataConflict.findMany({
      where: {
        userId,
        isResolved: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}
