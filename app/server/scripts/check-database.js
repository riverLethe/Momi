#!/usr/bin/env node

const { createClient } = require("@libsql/client");
require("dotenv").config();

async function checkDatabase() {
  console.log("🔍 Checking database contents...");

  let dbConfig;
  
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log("🌐 Using Turso database...");
    dbConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  } else {
    console.log("💾 Using local SQLite database...");
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  const db = createClient(dbConfig);

  try {
    // 查看所有用户
    const usersResult = await db.execute({
      sql: `SELECT id, name, email FROM users ORDER BY created_at DESC`,
      args: [],
    });

    console.log("\n👥 Users in database:");
    usersResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
    });

    // 查看家庭空间
    console.log("\n📋 Family Spaces:");
    const familySpaces = await db.execute({
      sql: "SELECT * FROM family_spaces",
      args: [],
    });
    console.log(`Found ${familySpaces.rows.length} family spaces:`);
    familySpaces.rows.forEach((space, index) => {
      console.log(`${index + 1}. ID: ${space.id}, Name: ${space.name}, Creator: ${space.creator_id}, Invite Code: ${space.invite_code}`);
    });

    // 查看所有用户会话
    const sessionsResult = await db.execute({
      sql: `SELECT id, user_id FROM user_sessions ORDER BY created_at DESC LIMIT 10`,
      args: [],
    });

    console.log("\n🔑 User sessions in database:");
    sessionsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Session ID: ${row.id}, User ID: ${row.user_id}`);
    });

    // 查看加入请求
    const joinRequestsResult = await db.execute({
      sql: `SELECT * FROM family_join_requests ORDER BY requested_at DESC LIMIT 10`,
      args: [],
    });

    console.log("\n📝 Join requests in database:");
    joinRequestsResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}, User: ${row.username}, Family: ${row.family_id}, Status: ${row.status}`);
    });

  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await db.close();
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase };