# MomiQ Server

这是 MomiQ 应用的后端服务器，使用 Next.js API Routes 和 PostgreSQL 数据库。

## 🚀 快速开始

### 1. 环境准备

确保已安装：

- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 2. 数据库设置

#### 本地 PostgreSQL

```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# 创建数据库
createdb momiq_db
```

#### 或使用云数据库

- [Railway](https://railway.app/) (推荐)
- [Supabase](https://supabase.com/)
- [Vercel Postgres](https://vercel.com/storage/postgres)

### 3. 环境配置

复制并配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DATABASE_URL="postgresql://username:password@localhost:5432/momiq_db"
JWT_SECRET="your-super-secret-key-at-least-32-characters"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
```

### 4. 安装和初始化

```bash
# 安装依赖
npm install

# 设置数据库（一键完成）
npm run db:setup
```

### 5. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

## 🔧 可用脚本

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build           # 构建生产版本
npm run start           # 启动生产服务器

# 数据库
npm run db:generate     # 生成 Prisma 客户端
npm run db:migrate      # 运行数据库迁移
npm run db:seed         # 运行种子脚本
npm run db:studio       # 启动 Prisma Studio
npm run db:reset        # 重置数据库
npm run db:setup        # 完整数据库设置
```

## 📡 API 端点

### 认证

- `POST /api/auth/login` - 邮箱密码登录
- `POST /api/auth/google` - Google OAuth 登录
- `POST /api/auth/apple` - Apple Sign In 登录

### 数据同步

- `GET /api/sync` - 获取同步统计
- `POST /api/sync` - 执行数据同步

## 🗃️ 数据库架构

### 核心表

- `users` - 用户信息
- `user_sessions` - 会话管理
- `bills` - 账单数据
- `budgets` - 预算数据
- `categories` - 分类系统
- `sync_logs` - 同步日志

### 演示账户

```
邮箱: demo@momiq.com
密码: password123
```

## 🔐 认证机制

- **JWT Token**: 7天有效期
- **Session Management**: 数据库存储会话
- **OAuth Support**: Google 和 Apple 登录
- **Password Hashing**: bcrypt 加密

## 📊 数据同步

### 同步策略

- **增量同步**: 基于时间戳
- **冲突解决**: Last-Write-Wins
- **批量处理**: 提高性能
- **事务保证**: 数据一致性

### 同步流程

1. 客户端发送本地更改
2. 服务器检测冲突
3. 应用合并策略
4. 返回最新数据
5. 记录同步日志

## 🛠️ 开发工具

### Prisma Studio

可视化数据库管理界面：

```bash
npm run db:studio
```

访问 http://localhost:5555

### 日志查看

```bash
# 查看服务器日志
npm run dev

# 查看数据库查询
# 在 .env 中设置 DATABASE_URL 包含 logging=true
```

## 🚀 部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel

# 添加环境变量
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

### Railway 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 部署
railway up

# 添加 PostgreSQL
railway add postgresql
```

## 📝 环境变量

必需的环境变量：

```env
# 数据库
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET="your-secret-key"

# OAuth (可选)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
APPLE_CLIENT_ID="com.your-app.bundle-id"
```

## 🔧 故障排除

### 数据库连接问题

```bash
# 测试数据库连接
npm run db:generate

# 重置数据库
npm run db:reset
```

### 权限错误

```sql
-- 检查数据库权限
\du your_username

-- 重新授权
GRANT ALL PRIVILEGES ON DATABASE momiq_db TO your_username;
```

### 迁移失败

```bash
# 查看迁移状态
npx prisma migrate status

# 强制重置
npx prisma migrate reset --force
```

## 📚 文档

- [生产环境数据库设置](../../docs/PRODUCTION_DATABASE_SETUP.md)
- [用户系统实现文档](../../docs/USER_SYSTEM_IMPLEMENTATION.md)
- [API 文档](./docs/api.md)

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

此项目使用 MIT 许可证。

---

如有问题请查看 [故障排除文档](../../docs/PRODUCTION_DATABASE_SETUP.md#故障排除) 或提交 Issue。
