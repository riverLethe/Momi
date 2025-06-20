import { createClient } from "@libsql/client";

// Turso 数据库客户端配置
export const tursoConfig = {
  // 检测是否使用 Turso（基于 DATABASE_URL 格式）
  isTursoUrl: (url: string): boolean => {
    return url.startsWith("libsql://") || url.startsWith("https://");
  },

  // 创建 Turso 客户端
  createTursoClient: () => {
    const url = process.env.DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error("DATABASE_URL is required");
    }

    if (tursoConfig.isTursoUrl(url)) {
      if (!authToken) {
        throw new Error("TURSO_AUTH_TOKEN is required for Turso connections");
      }

      console.log(
        "🚀 Connecting to Turso database:",
        url.replace(/\/\/.*@/, "//***@")
      );

      return createClient({
        url,
        authToken,
      });
    }

    // 本地 SQLite 文件
    console.log("💻 Using local SQLite database:", url);
    return createClient({
      url,
    });
  },

  // 测试连接
  testConnection: async () => {
    try {
      const client = tursoConfig.createTursoClient();
      await client.execute("SELECT 1");
      console.log("✅ Database connection successful");
      return true;
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      return false;
    }
  },
};

// 环境检测工具
export const environmentUtils = {
  isProduction: () => process.env.NODE_ENV === "production",
  isDevelopment: () => process.env.NODE_ENV === "development",
  isTursoEnvironment: () => {
    const url = process.env.DATABASE_URL || "";
    return tursoConfig.isTursoUrl(url);
  },

  // 获取数据库信息
  getDatabaseInfo: () => {
    const url = process.env.DATABASE_URL || "";
    const isLocal = url.startsWith("file:");
    const isTurso = tursoConfig.isTursoUrl(url);

    return {
      url: isLocal ? url : url.replace(/\/\/.*@/, "//***@"), // 隐藏密码
      type: isLocal ? "SQLite (Local)" : isTurso ? "Turso (Cloud)" : "Unknown",
      environment: process.env.NODE_ENV || "development",
      hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
    };
  },
};

// 导出单例客户端（可选，用于直接查询）
let tursoClient: ReturnType<typeof createClient> | null = null;

export const getTursoClient = () => {
  if (!tursoClient) {
    tursoClient = tursoConfig.createTursoClient();
  }
  return tursoClient;
};
