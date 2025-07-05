# 生产环境数据库设置指南

## 概述

本指南详细说明如何为 MomiQ 应用设置生产环境数据库。我们使用 **SQLite + Turso** 方案，提供轻量级、高性能的数据库解决方案。

### 技术栈

- **数据库**: SQLite (开发) + Turso (生产)
- **数据库客户端**: @libsql/client
- **认证**: JWT + bcrypt
- **同步**: 增量同步 + 冲突解决

## 🚀 快速部署

### 1. 安装 Turso CLI

```bash
# 安装 Turso CLI
npm install -g @turso/cli

# 或使用 Homebrew (macOS)
brew install tursodatabase/tap/turso
```

### 2. 创建 Turso 数据库

```bash
# 注册 Turso 账户
turso auth signup

# 创建生产数据库
turso db create momiq-production

# 查看数据库信息
turso db show momiq-production
```

### 3. 获取连接信息

```bash
# 获取数据库 URL
turso db show momiq-production --url

# 生成认证令牌
turso db tokens create momiq-production
```

### 4. 配置环境变量

在生产环境中设置以下环境变量：

```bash
# Turso 数据库配置
DATABASE_URL="libsql://momiq-production-[your-org].turso.io"
TURSO_AUTH_TOKEN="your-auth-token-here"

# JWT 配置
JWT_SECRET="your-production-jwt-secret-key"

# 其他配置
NODE_ENV="production"
API_BASE_URL="https://your-domain.com"
```

### 5. 初始化数据库结构

```bash
# 在生产环境运行
npm run db:setup
```

## 📊 数据库架构

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
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
);

-- 用户会话表
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 账单表
CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  bill_date DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 预算表
CREATE TABLE budgets (
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
);

-- 同步日志表
CREATE TABLE sync_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 数据冲突表
CREATE TABLE data_conflicts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  local_data TEXT NOT NULL,
  remote_data TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### 性能优化索引

```sql
-- 创建关键索引
CREATE INDEX idx_bills_user_date ON bills (user_id, bill_date);
CREATE INDEX idx_budgets_user_category ON budgets (user_id, category);
CREATE INDEX idx_sessions_token ON user_sessions (token);
CREATE INDEX idx_bills_category ON bills (category);
CREATE INDEX idx_bills_date ON bills (bill_date);
CREATE INDEX idx_sync_logs_user ON sync_logs (user_id);
```

## 🔧 数据库管理

### 使用 Turso CLI 查询

```bash
# 连接到数据库
turso db shell momiq-production

# 查看表结构
.schema

# 查询用户数据
SELECT COUNT(*) FROM users;

# 查看最近的账单
SELECT * FROM bills ORDER BY created_at DESC LIMIT 10;

# 查看同步统计
SELECT
  COUNT(*) as total_bills,
  SUM(amount) as total_amount,
  COUNT(DISTINCT user_id) as active_users
FROM bills
WHERE created_at > date('now', '-30 days');
```

### 数据备份

```bash
# 导出数据库
turso db dump momiq-production > backup-$(date +%Y%m%d).sql

# 恢复数据库 (如果需要)
cat backup-20240101.sql | turso db shell momiq-production
```

### 监控和统计

```bash
# 查看数据库使用情况
turso db usage momiq-production

# 查看连接信息
turso db show momiq-production

# 列出所有数据库
turso db list
```

## 📈 性能优化

### 查询优化

使用 libSQL 客户端进行高效查询：

```typescript
import { db } from "./lib/database";

// 高效的用户账单查询
const userBills = await db.execute({
  sql: `
    SELECT b.*, u.name as user_name 
    FROM bills b 
    JOIN users u ON b.user_id = u.id 
    WHERE b.user_id = ? 
    AND b.bill_date >= ? 
    ORDER BY b.bill_date DESC 
    LIMIT ?
  `,
  args: [userId, startDate, limit],
});

// 批量插入账单
const bills = [
  { id: "1", user_id: userId, amount: 100, category: "food" },
  { id: "2", user_id: userId, amount: 50, category: "transport" },
];

await db.batch(
  bills.map((bill) => ({
    sql: "INSERT INTO bills (id, user_id, amount, category) VALUES (?, ?, ?, ?)",
    args: [bill.id, bill.user_id, bill.amount, bill.category],
  }))
);
```

### 连接池配置

```typescript
// lib/database.ts
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
  // 生产环境优化配置
  sync: {
    interval: 60000, // 60秒同步间隔
  },
});
```

## 🔐 安全配置

### 访问控制

```bash
# 创建只读访问令牌 (用于分析)
turso db tokens create momiq-production --read-only

# 创建临时访问令牌
turso db tokens create momiq-production --expiration 1h
```

### 数据加密

```typescript
// 敏感数据加密示例
import bcrypt from "bcryptjs";

// 密码加密
const hashedPassword = await bcrypt.hash(password, 12);

// JWT 令牌
const token = jwt.sign(payload, process.env.JWT_SECRET!, {
  expiresIn: "7d",
  algorithm: "HS256",
});
```

## 🚨 故障排除

### 常见问题

1. **连接失败**

   ```bash
   # 检查网络连接
   turso db show momiq-production

   # 验证认证令牌
   turso auth show
   ```

2. **性能问题**

   ```sql
   -- 检查慢查询
   EXPLAIN QUERY PLAN SELECT * FROM bills WHERE user_id = ?;

   -- 检查索引使用
   .index
   ```

3. **同步错误**
   ```sql
   -- 查看同步日志
   SELECT * FROM sync_logs
   WHERE status = 'error'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### 数据恢复

```bash
# 从备份恢复
turso db restore momiq-production backup-20240101.sql

# 检查数据完整性
turso db shell momiq-production < integrity-check.sql
```

## 📊 监控和告警

### 基础监控

```typescript
// 健康检查端点
export async function GET() {
  try {
    await db.execute("SELECT 1");
    return Response.json({ status: "healthy" });
  } catch (error) {
    return Response.json(
      { status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}
```

### 指标收集

```sql
-- 用户增长指标
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE created_at >= date('now', '-30 days')
GROUP BY DATE(created_at);

-- 账单统计
SELECT
  category,
  COUNT(*) as count,
  AVG(amount) as avg_amount,
  SUM(amount) as total_amount
FROM bills
WHERE created_at >= date('now', '-7 days')
GROUP BY category;
```

## 🚀 扩展策略

### 水平扩展

当应用增长时，Turso 支持多地域部署：

```bash
# 创建多地域数据库
turso db create momiq-us --location ord
turso db create momiq-eu --location fra
turso db create momiq-asia --location sin
```

### 读写分离

```typescript
// 配置读写分离
const writeDB = createClient({
  url: process.env.WRITE_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const readDB = createClient({
  url: process.env.READ_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// 写操作使用主库
export const writeOperation = async (data) => {
  return await writeDB.execute(sql, args);
};

// 读操作使用从库
export const readOperation = async (query) => {
  return await readDB.execute(sql, args);
};
```

## 💡 最佳实践

1. **定期备份**: 设置自动备份计划
2. **监控指标**: 跟踪关键性能指标
3. **索引优化**: 根据查询模式优化索引
4. **数据清理**: 定期清理过期数据
5. **版本控制**: 跟踪数据库结构变更

## 📚 相关资源

- [Turso 官方文档](https://docs.turso.tech/)
- [libSQL 文档](https://github.com/libsql/libsql)
- [SQLite 性能优化](https://www.sqlite.org/optoverview.html)
