#!/usr/bin/env node

const { createClient } = require("@libsql/client");
require("dotenv").config();

async function createJoinRequestsTable() {
  console.log("🗄️ Creating family_join_requests table...");

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
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  // Create database client
  const db = createClient(dbConfig);

  try {
    // 创建家庭加入请求表
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

    // 创建索引
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_family ON family_join_requests (family_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_user ON family_join_requests (user_id)`
    );
    await db.execute(
      `CREATE INDEX IF NOT EXISTS idx_join_requests_status ON family_join_requests (status)`
    );

    console.log("✅ Family join requests table created successfully!");

    // 验证表是否创建成功
    const result = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='family_join_requests'");
    if (result.rows.length > 0) {
      console.log("✅ Table verification successful!");
    } else {
      console.log("❌ Table verification failed!");
    }

    // Close connection
    await db.close();
  } catch (error) {
    console.error("❌ Table creation failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createJoinRequestsTable();
}

module.exports = { createJoinRequestsTable };