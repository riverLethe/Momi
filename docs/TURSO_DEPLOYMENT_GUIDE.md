# Turso 生产环境部署指南

## 🎯 概述

本指南将帮你将 MomiQ 应用从本地 SQLite 无缝切换到 Turso 生产环境。**只需要调整环境变量即可！**

## 🚀 快速部署（5分钟）

### 1. 安装和设置 Turso

```bash
# 运行自动化设置脚本
cd app/server
npm run turso:setup

# 或者手动设置
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
turso db create momiq-prod
```

### 2. 获取连接信息

```bash
# 获取数据库 URL
turso db show momiq-prod --url

# 创建访问令牌
turso db tokens create momiq-prod
```

### 3. 配置环境变量

将以下变量添加到你的生产环境：

```env
# 从本地 SQLite 切换到 Turso
DATABASE_URL="libsql://momiq-prod.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# 其他配置保持不变
NODE_ENV="production"
JWT_SECRET="your-secret-key"
```

### 4. 部署数据库

```bash
# 部署迁移和种子数据
npm run db:deploy
npm run db:seed
```

## 📊 环境对比

| 环境     | DATABASE_URL                | 说明             |
| -------- | --------------------------- | ---------------- |
| **开发** | `file:./data/momiq.db`      | 本地 SQLite 文件 |
| **生产** | `libsql://your-db.turso.io` | Turso 云端数据库 |

## 🔧 平台部署指南

### Vercel 部署

1. **推送代码到 GitHub**
2. **连接 Vercel 项目**
3. **配置环境变量：**
   ```
   DATABASE_URL = libsql://momiq-prod.turso.io
   TURSO_AUTH_TOKEN = your-token
   JWT_SECRET = your-secret
   ```
4. **部署！**

### Railway 部署

1. **连接 GitHub 仓库**
2. **添加环境变量：**
   ```
   DATABASE_URL = libsql://momiq-prod.turso.io
   TURSO_AUTH_TOKEN = your-token
   JWT_SECRET = your-secret
   ```
3. **自动部署**

### Netlify 部署

1. **连接仓库**
2. **设置构建命令：** `npm run build`
3. **配置环境变量**
4. **部署**

## 🎛️ 数据库管理

### 常用命令

```bash
# 查看所有数据库
turso db list

# 进入数据库交互模式
turso db shell momiq-prod

# 查看使用统计
turso db usage momiq-prod

# 备份数据库
turso db dump momiq-prod > backup.sql

# 创建新令牌
turso db tokens create momiq-prod
```

### 监控和维护

```sql
-- 在 turso db shell 中执行

-- 查看用户数量
SELECT COUNT(*) FROM users;

-- 查看账单数量
SELECT COUNT(*) FROM bills WHERE isDeleted = false;

-- 查看最近活跃用户
SELECT email, lastLoginAt FROM users
ORDER BY lastLoginAt DESC LIMIT 10;

-- 数据库大小估算
SELECT COUNT(*) as table_count,
       SUM(CASE WHEN name = 'bills' THEN 1 ELSE 0 END) as bill_records,
       SUM(CASE WHEN name = 'users' THEN 1 ELSE 0 END) as user_records
FROM sqlite_master WHERE type = 'table';
```

## 📈 性能优化

### 1. 连接池配置

```typescript
// lib/database.ts 中已自动配置
export const db = createClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});
```

### 2. 查询优化

```typescript
// 推荐的查询模式
const bills = await prisma.bill.findMany({
  where: {
    userId,
    isDeleted: false,
    billDate: {
      gte: startDate,
      lte: endDate,
    },
  },
  orderBy: { billDate: "desc" },
  take: 100, // 分页限制
});
```

### 3. 缓存策略

```typescript
// 可以添加 Redis 缓存层
const cachedBudgets = await redis.get(`budgets:${userId}`);
if (!cachedBudgets) {
  const budgets = await prisma.budget.findMany({
    where: { userId },
  });
  await redis.setex(`budgets:${userId}`, 300, JSON.stringify(budgets));
}
```

## 🔐 安全配置

### 1. 环境变量安全

```bash
# 生成强密钥
openssl rand -base64 32

# 设置生产环境变量
JWT_SECRET="$(openssl rand -base64 32)"
```

### 2. 数据库访问控制

Turso 自动提供：

- ✅ TLS 加密传输
- ✅ 访问令牌认证
- ✅ 网络访问控制
- ✅ 自动备份

### 3. API 安全

```typescript
// middleware/auth.ts
export function requireAuth(req: Request) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    throw new Error("Authentication required");
  }
  // JWT 验证逻辑
}
```

## 📊 成本管理

### 免费额度监控

```bash
# 检查使用情况
turso db usage momiq-prod

# 输出示例：
# Reads: 1,234,567 / 1,000,000,000 (0.1%)
# Writes: 12,345 / 10,000,000 (0.1%)
# Storage: 45MB / 1GB (4.5%)
```

### 成本优化建议

1. **查询优化**：使用索引，避免全表扫描
2. **数据清理**：定期清理软删除数据
3. **缓存策略**：减少重复查询
4. **批量操作**：合并多个写入操作

## 🔄 迁移策略

### 从 SQLite 迁移到 Turso

```bash
# 1. 导出本地数据
sqlite3 data/momiq.db .dump > local_backup.sql

# 2. 设置 Turso
npm run turso:setup

# 3. 导入数据（如果需要）
turso db shell momiq-prod < local_backup.sql

# 4. 更新环境变量
# DATABASE_URL="libsql://momiq-prod.turso.io"
```

### 从 Turso 迁移到 PostgreSQL（未来）

```bash
# 1. 导出 Turso 数据
turso db dump momiq-prod > turso_backup.sql

# 2. 转换为 PostgreSQL 格式
# (需要格式转换工具)

# 3. 更新 schema.prisma
# provider = "postgresql"

# 4. 重新迁移
npm run db:migrate
```

## 🚨 故障排除

### 常见问题

#### 1. 连接失败

```bash
# 检查令牌是否有效
turso auth whoami

# 重新生成令牌
turso db tokens create momiq-prod
```

#### 2. 迁移失败

```bash
# 检查数据库状态
turso db shell momiq-prod
.tables

# 重置迁移（谨慎使用）
npm run db:reset
```

#### 3. 性能问题

```sql
-- 检查慢查询
EXPLAIN QUERY PLAN
SELECT * FROM bills WHERE userId = ? ORDER BY billDate DESC;

-- 添加索引
CREATE INDEX idx_bills_user_date ON bills(userId, billDate);
```

## 📞 支持资源

- **Turso 文档：** https://docs.turso.tech/
- **Prisma + Turso：** https://www.prisma.io/docs/guides/migrate/developing-with-prisma-migrate/enable-native-database-types
- **MomiQ 项目支持：** 查看项目 README

## ✅ 部署检查清单

- [ ] Turso CLI 已安装和配置
- [ ] 数据库已创建和配置
- [ ] 环境变量已设置
- [ ] 迁移已部署 (`npm run db:deploy`)
- [ ] 种子数据已加载（可选）
- [ ] 应用部署成功
- [ ] 数据库连接测试通过
- [ ] 认证功能测试通过
- [ ] 数据同步功能测试通过

🎉 **恭喜！你的 MomiQ 应用现在运行在 Turso 云端数据库上！**
