#!/usr/bin/env node

const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
  console.log("🗄️ Initializing database schema...");

  // Determine database configuration
  let dbConfig;
  
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Turso configuration
    console.log("🌐 Using Turso database...");
    dbConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  } else {
    // Local SQLite configuration
    console.log("💾 Using local SQLite database...");
    
    // Ensure data directory exists for local SQLite
    const dataDir = path.join(__dirname, "..", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  // Create database client
  const db = createClient(dbConfig);

  try {
    // Create tables
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

    // Create indexes
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


    console.log("✅ Database schema initialized successfully!");

    // Close connection
    await db.close();
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };
