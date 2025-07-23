#!/usr/bin/env node

/**
 * MomiQ 数据库管理工具
 * 提供统一的数据库操作命令
 */

const { createClient } = require("@libsql/client");
require("dotenv").config();

const commands = {
  check: "检查数据库状态和表结构",
  update: "更新数据库结构（安全的增量更新）",
  reset: "重置数据库（危险操作，会删除所有数据）",
  migrate: "运行数据库迁移",
  backup: "备份数据库（仅本地SQLite）",
  help: "显示帮助信息"
};

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }

  if (!commands[command]) {
    console.error(`❌ 未知命令: ${command}`);
    showHelp();
    process.exit(1);
  }

  try {
    switch (command) {
      case 'check':
        await checkDatabase();
        break;
      case 'update':
        await updateDatabase();
        break;
      case 'reset':
        await resetDatabase();
        break;
      case 'migrate':
        await migrateDatabase();
        break;
      case 'backup':
        await backupDatabase();
        break;
    }
  } catch (error) {
    console.error(`❌ 命令执行失败:`, error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🗄️  MomiQ 数据库管理工具

使用方法:
  npm run db:manage <command>

可用命令:
${Object.entries(commands).map(([cmd, desc]) => `  ${cmd.padEnd(10)} - ${desc}`).join('\n')}

示例:
  npm run db:manage check    # 检查数据库状态
  npm run db:manage update   # 更新数据库结构
  npm run db:manage help     # 显示此帮助信息

环境变量:
  TURSO_DATABASE_URL  - Turso数据库URL（生产环境）
  TURSO_AUTH_TOKEN    - Turso认证令牌（生产环境）
  DATABASE_URL        - 本地SQLite数据库路径（开发环境）
`);
}

async function getDbClient() {
  let dbConfig;
  let environment;
  
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    console.log("🌐 连接到 Turso 生产数据库...");
    environment = "production";
    dbConfig = {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  } else {
    console.log("💾 连接到本地 SQLite 数据库...");
    environment = "development";
    dbConfig = {
      url: process.env.DATABASE_URL || "file:./data/momiq.db",
    };
  }

  const db = createClient(dbConfig);
  
  // 测试连接
  try {
    await db.execute("SELECT 1");
    console.log(`✅ 数据库连接成功 (${environment})`);
  } catch (error) {
    throw new Error(`数据库连接失败: ${error.message}`);
  }

  return { db, environment };
}

async function checkDatabase() {
  console.log("🔍 检查数据库状态...");
  
  const { db, environment } = await getDbClient();
  
  try {
    // 检查表是否存在
    const tables = ['users', 'bills', 'family_spaces', 'family_members', 'family_join_requests', 'user_sessions'];
    
    console.log("\n📋 表结构检查:");
    for (const table of tables) {
      try {
        await db.execute(`SELECT 1 FROM ${table} LIMIT 1`);
        console.log(`  ${table.padEnd(20)} ✅ 存在`);
      } catch (error) {
        console.log(`  ${table.padEnd(20)} ❌ 不存在`);
      }
    }

    // 检查bills表的family_space_id列
    try {
      const billsSchema = await db.execute("PRAGMA table_info(bills)");
      const hasFamilySpaceId = billsSchema.rows.some(row => row.name === 'family_space_id');
      console.log(`\n🔗 Bills表family_space_id列: ${hasFamilySpaceId ? '✅ 存在' : '❌ 缺失'}`);
    } catch (error) {
      console.log("\n🔗 无法检查Bills表结构");
    }

    // 统计数据
    console.log("\n📊 数据统计:");
    for (const table of tables) {
      try {
        const result = await db.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = result.rows[0]?.count || 0;
        console.log(`  ${table.padEnd(20)} ${count} 条记录`);
      } catch (error) {
        console.log(`  ${table.padEnd(20)} 无法统计`);
      }
    }

  } finally {
    await db.close();
  }
}

async function updateDatabase() {
  console.log("🔄 更新数据库结构...");
  
  const { updateDatabase: runUpdate } = require('./update-database.js');
  await runUpdate();
}

async function resetDatabase() {
  console.log("⚠️  重置数据库（这将删除所有数据）");
  
  // 安全确认
  if (process.env.NODE_ENV === 'production') {
    throw new Error("生产环境不允许重置数据库");
  }

  const { db, environment } = await getDbClient();
  
  try {
    console.log("🗑️  删除所有表...");
    
    const tables = ['family_join_requests', 'family_members', 'bills', 'budgets', 'sync_logs', 'data_conflicts', 'user_sessions', 'family_spaces', 'users'];
    
    for (const table of tables) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`  ✅ 删除表 ${table}`);
      } catch (error) {
        console.log(`  ❌ 删除表 ${table} 失败: ${error.message}`);
      }
    }

    console.log("🏗️  重新创建表结构...");
    await updateDatabase();
    
    console.log("✅ 数据库重置完成");
    
  } finally {
    await db.close();
  }
}

async function migrateDatabase() {
  console.log("🔄 运行数据库迁移...");
  
  const { db, environment } = await getDbClient();
  
  try {
    // 迁移1: 添加family_space_id列
    console.log("🔄 迁移1: 为bills表添加family_space_id列...");
    try {
      await db.execute(`ALTER TABLE bills ADD COLUMN family_space_id TEXT`);
      console.log("✅ 迁移1完成");
    } catch (error) {
      if (error.message.includes("duplicate column") || error.message.includes("already exists")) {
        console.log("✅ 迁移1: 列已存在，跳过");
      } else {
        throw error;
      }
    }

    // 可以在这里添加更多迁移...
    
    console.log("✅ 所有迁移完成");
    
  } finally {
    await db.close();
  }
}

async function backupDatabase() {
  const { environment } = await getDbClient();
  
  if (environment === 'production') {
    console.log("ℹ️  生产环境数据库备份请使用 Turso 的备份功能");
    console.log("   参考: https://docs.turso.tech/features/backups");
    return;
  }

  console.log("💾 备份本地数据库...");
  
  const fs = require('fs');
  const path = require('path');
  
  const dbPath = './data/momiq.db';
  const backupPath = `./data/momiq_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
  
  try {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      console.log(`✅ 数据库已备份到: ${backupPath}`);
    } else {
      console.log("❌ 数据库文件不存在");
    }
  } catch (error) {
    throw new Error(`备份失败: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkDatabase,
  updateDatabase,
  resetDatabase,
  migrateDatabase,
  backupDatabase
};