# MomiQ 生产环境数据库设置指南

## 概述

本文档提供了为 MomiQ 应用设置真实的 PostgreSQL 数据库的完整指南，包括本地开发和生产环境的配置。

## 技术栈

- **数据库**: PostgreSQL 14+
- **ORM**: Prisma 6.x
- **认证**: JWT + bcrypt
- **同步**: 增量同步 + 冲突解决

## 数据库架构

### 核心表结构

1. **users** - 用户信息
2. **user_sessions** - 用户会话管理
3. **bills** - 账单数据
4. **budgets** - 预算数据
5. **categories** - 分类系统
6. **sync_logs** - 同步日志
7. **data_conflicts** - 数据冲突记录
8. **system_configs** - 系统配置

### 关系图

```
users (1:N) user_sessions
users (1:N) bills
users (1:N) budgets
users (1:N) sync_logs
categories (1:N) categories (自引用父子关系)
```

## 环境配置

### 1. 本地开发环境

#### 安装 PostgreSQL

**macOS (使用 Homebrew):**

```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql-14 postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
下载并安装 PostgreSQL from https://www.postgresql.org/download/windows/

#### 创建数据库

```bash
# 连接到 PostgreSQL
sudo -u postgres psql

# 创建数据库和用户
CREATE DATABASE momiq_db;
CREATE USER momiq_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE momiq_db TO momiq_user;

# 退出
\q
```

#### 环境变量配置

在 `app/server/.env` 文件中配置：

```env
# Database Configuration
DATABASE_URL="postgresql://momiq_user:your_secure_password@localhost:5432/momiq_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# Google OAuth (可选)
GOOGLE_CLIENT_ID="your-google-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple Sign In (可选)
APPLE_TEAM_ID="your-apple-team-id"
APPLE_CLIENT_ID="com.momiq.app"
APPLE_KEY_ID="your-apple-key-id"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-apple-private-key\n-----END PRIVATE KEY-----"

# App Configuration
NODE_ENV="development"
PORT=3000

# Sync Configuration
SYNC_BATCH_SIZE=100
SYNC_TIMEOUT=30000
```

### 2. 生产环境配置

#### 云数据库选项

**选项 1: Railway**

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并创建项目
railway login
railway init
railway add postgresql

# 获取数据库 URL
railway variables
```

**选项 2: Vercel Postgres**

```bash
# 安装 Vercel CLI
npm install -g vercel

# 连接项目
vercel link

# 添加 Postgres 存储
vercel storage add postgres
```

**选项 3: Supabase**

```bash
# 创建 Supabase 项目
# 访问 https://supabase.com/dashboard
# 获取数据库连接字符串
```

**选项 4: Amazon RDS**

```bash
# 使用 AWS Console 或 CLI 创建 RDS PostgreSQL 实例
# 配置安全组允许应用服务器访问
```

## 数据库初始化

### 1. 安装依赖

```bash
cd app/server
npm install
```

### 2. 生成 Prisma 客户端

```bash
npm run db:generate
```

### 3. 运行数据库迁移

```bash
# 开发环境
npm run db:migrate

# 生产环境
npm run db:deploy
```

### 4. 运行种子脚本

```bash
npm run db:seed
```

### 5. 完整设置（一键命令）

```bash
npm run db:setup
```

## 数据库管理

### Prisma Studio

启动可视化数据库管理界面：

```bash
npm run db:studio
```

访问 http://localhost:5555 查看和编辑数据。

### 备份和恢复

**备份数据库：**

```bash
pg_dump -h localhost -U momiq_user -d momiq_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

**恢复数据库：**

```bash
psql -h localhost -U momiq_user -d momiq_db < backup_file.sql
```

### 数据库迁移

**创建新迁移：**

```bash
npx prisma migrate dev --name add_new_feature
```

**应用迁移到生产：**

```bash
npx prisma migrate deploy
```

## 性能优化

### 1. 数据库索引

已在 schema.prisma 中定义的关键索引：

```prisma
// 账单表索引
@@index([userId, billDate])
@@index([userId, category])
@@index([userId, lastModified])

// 预算表索引
@@index([userId, period])
@@index([userId, isActive])

// 同步日志索引
@@index([userId, createdAt])
```

### 2. 连接池配置

在生产环境的 DATABASE_URL 中添加连接池参数：

```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public&connection_limit=10&pool_timeout=20"
```

### 3. 查询优化

- 使用 `select` 指定需要的字段
- 合理使用 `include` 和 `select`
- 避免 N+1 查询问题

## 安全配置

### 1. 数据库用户权限

```sql
-- 创建只读用户用于报表
CREATE USER momiq_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE momiq_db TO momiq_readonly;
GRANT USAGE ON SCHEMA public TO momiq_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO momiq_readonly;
```

### 2. SSL 连接

生产环境强制使用 SSL：

```env
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

### 3. JWT 安全

- 使用至少 32 字符的随机密钥
- 设置合理的过期时间
- 实现 token 刷新机制

## 监控和日志

### 1. 数据库监控

**查询慢查询：**

```sql
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**检查连接数：**

```sql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

### 2. 应用日志

已在代码中实现的日志记录：

- 用户认证日志
- 同步操作日志
- 错误日志

### 3. 性能监控

使用 Prisma 的内置日志功能：

```typescript
const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
```

## 数据同步机制

### 1. 冲突解决策略

- **Last-Write-Wins**: 以最新时间戳为准
- **Manual Resolution**: 用户手动选择
- **Merge Strategy**: 智能合并数据

### 2. 同步状态跟踪

- `lastModified` 字段跟踪更新时间
- `syncVersion` 字段跟踪同步版本
- `isDeleted` 软删除标记

### 3. 批量同步优化

- 按批次处理同步数据
- 事务保证数据一致性
- 错误恢复机制

## 测试数据

### 演示账户

```
邮箱: demo@momiq.com
密码: password123
```

### 测试数据包含

- 8个主要分类和11个子分类
- 2个示例预算（总预算和餐饮预算）
- 5条示例账单记录
- 系统配置数据

## 故障排除

### 常见问题

**1. 连接超时**

```bash
# 检查数据库状态
pg_isready -h localhost -p 5432

# 检查防火墙设置
sudo ufw status
```

**2. 权限错误**

```sql
-- 检查用户权限
\du momiq_user

-- 重新授权
GRANT ALL PRIVILEGES ON DATABASE momiq_db TO momiq_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO momiq_user;
```

**3. 迁移失败**

```bash
# 重置数据库
npm run db:reset

# 重新运行迁移
npm run db:migrate
```

### 日志查看

**PostgreSQL 日志：**

```bash
# Ubuntu/Debian
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# macOS Homebrew
tail -f /opt/homebrew/var/log/postgresql@14.log
```

**应用日志：**

```bash
# 开发环境
npm run dev

# 生产环境
pm2 logs server
```

## 部署清单

### 部署前检查

- [ ] 数据库连接测试
- [ ] 环境变量配置
- [ ] SSL证书配置
- [ ] 备份策略设置
- [ ] 监控告警配置

### 部署步骤

1. 创建生产数据库
2. 配置环境变量
3. 运行数据库迁移
4. 执行种子脚本（可选）
5. 启动应用服务
6. 验证功能正常

### 回滚计划

1. 保留数据库备份
2. 记录迁移版本
3. 准备回滚脚本
4. 测试回滚流程

## 扩展和维护

### 1. 数据库扩展

- 读写分离配置
- 分片策略（按用户ID）
- 缓存层集成（Redis）

### 2. 定期维护

```bash
# 清理过期数据
npm run db:cleanup

# 重建索引
REINDEX DATABASE momiq_db;

# 更新统计信息
ANALYZE;
```

### 3. 版本升级

- PostgreSQL 版本升级策略
- Prisma 版本兼容性检查
- 数据迁移验证

## 联系支持

如果遇到数据库相关问题，请提供：

1. 错误日志
2. 数据库版本
3. 环境配置
4. 重现步骤

---

_此文档将随着系统的发展持续更新。最后更新：2024年12月_
