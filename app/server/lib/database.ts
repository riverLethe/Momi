import { createClient, Client } from "@libsql/client";
import { environmentUtils, tursoConfig } from "./turso";

// Global database client instance
declare global {
  var dbClient: Client | undefined;
}

// Create database client based on environment
function createDatabaseClient(): Client {
  if (environmentUtils.isTursoEnvironment()) {
    // Production: Turso
    return createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  } else {
    // Development: Local SQLite
    return createClient({
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    });
  }
}

// Initialize client
export const db = global.dbClient || createDatabaseClient();

// Initialize database and show info
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

// Prevent multiple instances in development
if (process.env.NODE_ENV !== "production") {
  global.dbClient = db;
}

// Database service class with utility methods
export class DatabaseService {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await db.execute("SELECT 1");

      // If Turso environment, test direct connection too
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
   * Close database connection gracefully
   */
  static async disconnect(): Promise<void> {
    await db.close();
  }

  /**
   * Execute a batch of statements as a transaction
   */
  static async batch(
    statements: { sql: string; args: any[] }[]
  ): Promise<void> {
    await db.batch(
      statements.map((stmt) => ({
        sql: stmt.sql,
        args: stmt.args || [],
      }))
    );
  }

  /**
   * Initialize database schema
   */
  static async initializeSchema(): Promise<void> {
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        provider TEXT NOT NULL,
        provider_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        last_sync INTEGER,
        is_deleted BOOLEAN DEFAULT 0
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        bill_date INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        sync_version INTEGER DEFAULT 1,
        family_space_id TEXT,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (family_space_id) REFERENCES family_spaces (id)
      )
    `);

    // Migration: Add family_space_id column to existing bills table if it doesn't exist
    try {
      await db.execute(`
        ALTER TABLE bills ADD COLUMN family_space_id TEXT
      `);
    } catch (error) {
      // Column already exists, ignore the error
    }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        sync_version INTEGER DEFAULT 1,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS data_conflicts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT NOT NULL,
        local_data TEXT NOT NULL,
        remote_data TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // 家庭空间表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_by TEXT NOT NULL,
        creator_name TEXT NOT NULL,
        invite_code TEXT UNIQUE NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);
    
    // 家庭成员表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        is_creator BOOLEAN DEFAULT 0,
        joined_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        last_transaction_time INTEGER,
        FOREIGN KEY (family_id) REFERENCES family_spaces (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(family_id, user_id)
      )
    `);

    // 家庭加入请求表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS family_join_requests (
        id TEXT PRIMARY KEY,
        family_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        user_email TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
        responded_at INTEGER,
        responded_by TEXT,
        FOREIGN KEY (family_id) REFERENCES family_spaces (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (responded_by) REFERENCES users (id),
        UNIQUE(family_id, user_id)
      )
    `);

    // Create indexes for better performance
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_bills_user_date ON bills (user_id, bill_date)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_bills_family_date ON bills (family_space_id, bill_date)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets (user_id, category)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions (token)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members (user_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members (family_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_family ON family_join_requests (family_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_user ON family_join_requests (user_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_status ON family_join_requests (status)`
    );

  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    const billResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM bills WHERE user_id = ? AND is_deleted = 0",
      args: [userId],
    });

    const budgetResult = await db.execute({
      sql: "SELECT COUNT(*) as count FROM budgets WHERE user_id = ? AND is_deleted = 0",
      args: [userId],
    });

    const lastSyncResult = await db.execute({
      sql: "SELECT created_at FROM sync_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      args: [userId],
    });

    return {
      billCount: (billResult.rows[0]?.count as number) || 0,
      budgetCount: (budgetResult.rows[0]?.count as number) || 0,
      lastSync: lastSyncResult.rows[0]?.created_at || null,
    };
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await db.execute({
      sql: "DELETE FROM user_sessions WHERE expires_at < ?",
      args: [Date.now()],
    });
    return result.rowsAffected;
  }

  /**
   * Get pending conflicts
   */
  static async getPendingConflicts(userId: string) {
    const result = await db.execute({
      sql: "SELECT * FROM data_conflicts WHERE user_id = ? AND is_resolved = 0 ORDER BY created_at DESC",
      args: [userId],
    });
    return result.rows;
  }
}
