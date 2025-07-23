#!/usr/bin/env node

/**
 * MomiQ 数据库管理工具
 * 提供统一的数据库操作命令
 */

const { createClient } = require("@libsql/client");
require("dotenv").config();

const commands = {
  check: "检查数据库状态和表结构",
  schema: "查看指定表的详细结构",
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
      case 'schema':
        await showTableSchema();
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
  npm run db:manage <command> [options]

可用命令:
${Object.entries(commands).map(([cmd, desc]) => `  ${cmd.padEnd(10)} - ${desc}`).join('\n')}

示例:
  npm run db:manage check           # 检查数据库状态
  npm run db:manage schema bills    # 查看 bills 表结构
  npm run db:manage schema users    # 查看 users 表结构
  npm run db:manage update          # 更新数据库结构
  npm run db:manage help            # 显示此帮助信息

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
  console.log('🔍 检查数据库状态...');
  
  const { db, environment } = await getDbClient();
  
  try {
    // 检查表是否存在
    const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    
    if (tables.rows.length === 0) {
      console.log('❌ 数据库中没有找到任何表');
      return;
    }
    
    console.log(`✅ 找到 ${tables.rows.length} 个表:`);
    
    for (const table of tables.rows) {
      const tableName = table.name || table[0];
      console.log(`\n📋 表: ${tableName}`);
      
      // 获取表结构
      const schema = await db.execute(`PRAGMA table_info(${tableName})`);
      console.log('  字段:');
      schema.rows.forEach(column => {
        const name = column.name || column[1];
        const type = column.type || column[2];
        const notNull = column.notnull || column[3];
        const defaultValue = column.dflt_value || column[4];
        const pk = column.pk || column[5];
        
        let info = `    ${name} (${type})`;
        if (pk) info += ' PRIMARY KEY';
        if (notNull) info += ' NOT NULL';
        if (defaultValue !== null) info += ` DEFAULT ${defaultValue}`;
        
        console.log(info);
      });
      
      // 获取记录数
      const count = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
      const recordCount = count.rows[0].count || count.rows[0][0];
      console.log(`  记录数: ${recordCount}`);
    }
    
    console.log('\n✅ 数据库检查完成');
    
  } catch (error) {
    console.error('❌ 检查数据库时出错:', error.message);
    throw error;
  } finally {
    await db.close();
  }
}

async function showTableSchema() {
  const tableName = process.argv[3];
  
  if (!tableName) {
    console.log('❌ 请指定要查看的表名');
    console.log('使用方法: npm run db:manage schema <table_name>');
    console.log('示例: npm run db:manage schema bills');
    return;
  }
  
  console.log(`🔍 查看表 "${tableName}" 的结构...`);
  
  const { db, environment } = await getDbClient();
  
  try {
    // 检查表是否存在
    const tableExists = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      [tableName]
    );
    
    if (tableExists.rows.length === 0) {
      console.log(`❌ 表 "${tableName}" 不存在`);
      
      // 显示可用的表
      const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (tables.rows.length > 0) {
        console.log('\n可用的表:');
        tables.rows.forEach(table => {
          const name = table.name || table[0];
          console.log(`  - ${name}`);
        });
      }
      return;
    }
    
    console.log(`\n📋 表: ${tableName}`);
    console.log('=' .repeat(50));
    
    // 获取表结构
    const schema = await db.execute(`PRAGMA table_info(${tableName})`);
    
    console.log('\n🏗️  字段结构:');
    console.log('字段名'.padEnd(20) + '类型'.padEnd(15) + '约束'.padEnd(25) + '默认值');
    console.log('-'.repeat(80));
    
    schema.rows.forEach(column => {
      const name = column.name || column[1];
      const type = column.type || column[2];
      const notNull = column.notnull || column[3];
      const defaultValue = column.dflt_value || column[4];
      const pk = column.pk || column[5];
      
      let constraints = [];
      if (pk) constraints.push('PRIMARY KEY');
      if (notNull) constraints.push('NOT NULL');
      
      const constraintStr = constraints.join(', ') || '-';
      const defaultStr = defaultValue !== null ? defaultValue : '-';
      
      console.log(
        name.padEnd(20) + 
        type.padEnd(15) + 
        constraintStr.padEnd(25) + 
        defaultStr
      );
    });
    
    // 获取索引信息
    const indexes = await db.execute(`PRAGMA index_list(${tableName})`);
    if (indexes.rows.length > 0) {
      console.log('\n🔍 索引:');
      for (const index of indexes.rows) {
        const indexName = index.name || index[1];
        const unique = index.unique || index[2];
        
        const indexInfo = await db.execute(`PRAGMA index_info(${indexName})`);
        const columns = indexInfo.rows.map(col => col.name || col[2]).join(', ');
        
        console.log(`  - ${indexName} (${columns})${unique ? ' [UNIQUE]' : ''}`);
      }
    }
    
    // 获取外键信息
    const foreignKeys = await db.execute(`PRAGMA foreign_key_list(${tableName})`);
    if (foreignKeys.rows.length > 0) {
      console.log('\n🔗 外键约束:');
      foreignKeys.rows.forEach(fk => {
        const from = fk.from || fk[3];
        const table = fk.table || fk[2];
        const to = fk.to || fk[4];
        console.log(`  - ${from} → ${table}.${to}`);
      });
    }
    
    // 获取记录数和示例数据
    const count = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    const recordCount = count.rows[0].count || count.rows[0][0];
    console.log(`\n📊 记录数: ${recordCount}`);
    
    if (recordCount > 0) {
      console.log('\n📄 示例数据 (前3条):');
      const sample = await db.execute(`SELECT * FROM ${tableName} LIMIT 3`);
      
      if (sample.rows.length > 0) {
        // 获取列名
        const columns = schema.rows.map(col => col.name || col[1]);
        
        // 打印表头
        console.log(columns.map(col => col.padEnd(15)).join(' | '));
        console.log(columns.map(() => '-'.repeat(15)).join('-|-'));
        
        // 打印数据
        sample.rows.forEach(row => {
          const values = columns.map(col => {
            const value = row[col] !== undefined ? row[col] : (row[columns.indexOf(col)] || '');
            return String(value).padEnd(15);
          });
          console.log(values.join(' | '));
        });
      }
    }
    
    console.log('\n✅ 表结构查看完成');
    
  } catch (error) {
    console.error('❌ 查看表结构时出错:', error.message);
    throw error;
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