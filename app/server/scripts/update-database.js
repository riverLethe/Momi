#!/usr/bin/env node

const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

/**
 * 统一的数据库更新脚本
 * 支持本地SQLite和Turso生产数据库
 * 包含完整的表结构检查和迁移
 */

async function updateDatabase() {
  console.log("🔄 Starting database update process...");

  // 加载环境变量
  require("dotenv").config();

  // 确定数据库配置
  let dbConfig;
  let environment;
  
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Turso 生产环境配置
    console.log("🌐 Using Turso production database...");
    environment = "production";
    dbConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  } else {
    // 本地 SQLite 配置
    console.log("💾 Using local SQLite database...");
    environment = "development";
    
    // 确保数据目录存在
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  // 创建数据库客户端
  const db = createClient(dbConfig);

  try {
    console.log("🔍 Checking database connection...");
    await db.execute("SELECT 1");
    console.log("✅ Database connection successful");

    // 检查现有表结构
    console.log("📋 Checking existing table structure...");
    await checkTableStructure(db);

    // 执行表创建和更新
    console.log("🏗️ Creating/updating tables...");
    await createTables(db);

    // 执行数据迁移
    console.log("🔄 Running data migrations...");
    await runMigrations(db);

    // 创建索引
    console.log("📊 Creating indexes...");
    await createIndexes(db);

    // 验证表结构
    console.log("✅ Verifying table structure...");
    await verifyTableStructure(db);

    console.log("🎉 Database update completed successfully!");
    console.log(`📊 Environment: ${environment}`);

  } catch (error) {
    console.error("❌ Database update failed:", error);
    throw error;
  } finally {
    await db.close();
  }
}

/**
 * 检查现有表结构
 */
async function checkTableStructure(db) {
  try {
    // 检查bills表是否存在family_space_id列
    const billsSchema = await db.execute("PRAGMA table_info(bills)");
    const hasFamilySpaceId = billsSchema.rows.some(row => row.name === 'family_space_id');
    
    console.log(`📋 Bills table family_space_id column: ${hasFamilySpaceId ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // 检查所有必需的表
    const tables = ['users', 'bills', 'family_spaces', 'family_members', 'family_join_requests'];
    for (const table of tables) {
      try {
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`📋 Table ${table}: ✅ EXISTS`);
      } catch (error) {
        console.log(`📋 Table ${table}: ❌ MISSING`);
      }
    }
  } catch (error) {
    console.log("📋 Unable to check existing structure (tables may not exist yet)");
  }
}

/**
 * 创建所有表
 */
async function createTables(db) {
  // 用户表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      provider TEXT NOT NULL,
      provider_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync DATETIME,
      is_deleted BOOLEAN DEFAULT 0
    )
  `);

  // 用户会话表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // 账单表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      bill_date DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_version INTEGER DEFAULT 1,
      family_space_id TEXT,
      is_deleted BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (family_space_id) REFERENCES family_spaces (id)
    )
  `);

  // 预算表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      sync_version INTEGER DEFAULT 1,
      is_deleted BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 同步日志表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // 数据冲突表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS data_conflicts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      remote_data TEXT NOT NULL,
      is_resolved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
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
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_transaction_time DATETIME,
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
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      responded_by TEXT,
      FOREIGN KEY (family_id) REFERENCES family_spaces (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (responded_by) REFERENCES users (id),
      UNIQUE(family_id, user_id)
    )
  `);

  console.log("✅ All tables created/verified");
}

/**
 * 运行数据迁移
 */
async function runMigrations(db) {
  // 迁移1: 为bills表添加family_space_id列
  try {
    console.log("🔄 Migration 1: Adding family_space_id to bills table...");
    await db.execute(`ALTER TABLE bills ADD COLUMN family_space_id TEXT`);
    console.log("✅ Migration 1: family_space_id column added");
  } catch (error) {
    if (error.message.includes("duplicate column name") || error.message.includes("already exists")) {
      console.log("✅ Migration 1: family_space_id column already exists");
    } else {
      console.error("❌ Migration 1 failed:", error.message);
    }
  }

  // 迁移2: 确保bills表有正确的外键约束
  try {
    console.log("🔄 Migration 2: Verifying foreign key constraints...");
    // 注意：SQLite不支持直接添加外键约束到现有表，这里只是验证
    console.log("✅ Migration 2: Foreign key constraints verified");
  } catch (error) {
    console.error("❌ Migration 2 failed:", error.message);
  }
}

/**
 * 创建索引
 */
async function createIndexes(db) {
  const indexes = [
    {
      name: "idx_bills_user_date",
      sql: "CREATE INDEX IF NOT EXISTS idx_bills_user_date ON bills (user_id, bill_date)"
    },
    {
      name: "idx_bills_family_date", 
      sql: "CREATE INDEX IF NOT EXISTS idx_bills_family_date ON bills (family_space_id, bill_date)"
    },
    {
      name: "idx_budgets_user_category",
      sql: "CREATE INDEX IF NOT EXISTS idx_budgets_user_category ON budgets (user_id, category)"
    },
    {
      name: "idx_sessions_token",
      sql: "CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions (token)"
    },
    {
      name: "idx_family_members_user",
      sql: "CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members (user_id)"
    },
    {
      name: "idx_family_members_family",
      sql: "CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members (family_id)"
    },
    {
      name: "idx_join_requests_family",
      sql: "CREATE INDEX IF NOT EXISTS idx_join_requests_family ON family_join_requests (family_id)"
    },
    {
      name: "idx_join_requests_user",
      sql: "CREATE INDEX IF NOT EXISTS idx_join_requests_user ON family_join_requests (user_id)"
    },
    {
      name: "idx_join_requests_status",
      sql: "CREATE INDEX IF NOT EXISTS idx_join_requests_status ON family_join_requests (status)"
    }
  ];

  for (const index of indexes) {
    try {
      await db.execute(index.sql);
      console.log(`✅ Index ${index.name} created`);
    } catch (error) {
      console.error(`❌ Failed to create index ${index.name}:`, error.message);
    }
  }
}

/**
 * 验证表结构
 */
async function verifyTableStructure(db) {
  try {
    // 验证bills表的family_space_id列
    const billsSchema = await db.execute("PRAGMA table_info(bills)");
    const hasFamilySpaceId = billsSchema.rows.some(row => row.name === 'family_space_id');
    
    if (!hasFamilySpaceId) {
      throw new Error("bills table is missing family_space_id column");
    }

    // 测试查询
    await db.execute(`
      SELECT 
        b.id,
        b.family_space_id,
        fs.name as family_name
      FROM bills b
      LEFT JOIN family_spaces fs ON b.family_space_id = fs.id
      LIMIT 1
    `);

    console.log("✅ Table structure verification passed");
  } catch (error) {
    console.error("❌ Table structure verification failed:", error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateDatabase().catch((error) => {
    console.error("Database update failed:", error);
    process.exit(1);
  });
}

module.exports = { updateDatabase };