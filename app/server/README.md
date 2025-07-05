# MomiQ Backend Server

MomiQ 记账应用的后端服务，基于 Next.js 构建，使用 SQLite + Turso 作为数据库解决方案。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm
- Turso CLI (生产环境)

### 本地开发

1. **克隆项目并进入目录**

   ```bash
   cd app/server
   ```

2. **一键设置开发环境**

   ```bash
   npm run setup:dev
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

4. **访问应用**
   - API: http://localhost:3000/api
   - 健康检查: http://localhost:3000/api/health

## 📁 项目结构

```
app/server/
├── src/app/                 # Next.js App Router
│   ├── api/                # API 路由
│   │   ├── auth/          # 认证相关 API
│   │   ├── sync/          # 数据同步 API
│   │   └── chat/          # 聊天相关 API
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── lib/                    # 核心库文件
│   ├── database.ts        # 数据库连接和工具
│   ├── auth.ts           # 认证服务
│   ├── sync.ts           # 数据同步服务
│   └── turso.ts          # Turso 配置
├── scripts/               # 部署和设置脚本
│   ├── dev-setup.sh      # 开发环境设置
│   └── setup-turso.sh    # Turso 生产环境设置
├── data/                  # SQLite 数据库文件目录
└── package.json          # 项目配置
```

## 🗄️ 数据库

### 本地开发 (SQLite)

开发环境使用本地 SQLite 文件数据库：

```bash
# 数据库文件位置
./data/momiq.db

# 初始化数据库
npm run db:setup
```

### 生产环境 (Turso)

生产环境使用 Turso 托管的 libSQL 数据库：

```bash
# 设置 Turso
npm run setup:turso

# 获取连接信息
turso db show momiq-prod
```

## 🔧 可用命令

### 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建应用
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # TypeScript 类型检查
```

### 数据库命令

```bash
npm run db:setup     # 初始化数据库
npm run setup:turso  # 设置 Turso 生产数据库
npm run setup:dev    # 设置开发环境
```

## 🔐 环境变量

在 `.env` 文件中配置以下变量：

```bash
# 数据库配置
DATABASE_URL="file:./data/momiq.db"           # 开发环境
# DATABASE_URL="libsql://your-db.turso.io"    # 生产环境
# TURSO_AUTH_TOKEN="your-turso-token"         # 生产环境

# JWT 配置
JWT_SECRET="your-super-secret-jwt-key"

# OAuth 提供商 (可选)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_PRIVATE_KEY=""
WECHAT_APP_ID=""
WECHAT_APP_SECRET=""

# API 配置
API_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

## 📡 API 端点

### 认证 API

- `POST /api/auth/login` - 邮箱密码登录
- `POST /api/auth/google` - Google OAuth 登录
- `POST /api/auth/apple` - Apple Sign In 登录
- `POST /api/auth/wechat` - 微信登录

### 数据同步 API

- `POST /api/sync` - 同步用户数据
- `GET /api/sync/stats` - 获取同步统计

### 聊天 API

- `POST /api/chat` - AI 聊天和账单分析

## 🚀 部署

### 使用 Turso 部署

1. **安装 Turso CLI**

   ```bash
   npm install -g @turso/cli
   ```

2. **注册并创建数据库**

   ```bash
   turso auth signup
   turso db create momiq-prod
   ```

3. **获取连接信息**

   ```bash
   turso db show momiq-prod
   ```

4. **更新环境变量**

   ```bash
   DATABASE_URL="libsql://momiq-prod.turso.io"
   TURSO_AUTH_TOKEN="your-token-here"
   ```

5. **初始化生产数据库**
   ```bash
   npm run setup:turso
   ```

### 其他平台部署

该应用可以部署到任何支持 Node.js 的平台：

- **Vercel**: 零配置部署
- **Railway**: 一键部署
- **Heroku**: 支持 SQLite + Turso
- **Docker**: 容器化部署

## 🔍 数据库查询

### 使用 Turso CLI 查询

```bash
# 连接到数据库
turso db shell momiq-prod

# 查看表结构
.schema

# 查询数据
SELECT * FROM users LIMIT 10;
SELECT * FROM bills ORDER BY created_at DESC LIMIT 5;
```

### 应用内查询

```typescript
import { db } from "./lib/database";

// 查询示例
const users = await db.execute("SELECT * FROM users");
const bills = await db.execute({
  sql: "SELECT * FROM bills WHERE user_id = ?",
  args: [userId],
});
```

## 🛠️ 开发工具

### 数据库工具

- **Turso CLI**: 官方命令行工具
- **SQLite Browser**: 可视化数据库工具
- **TablePlus**: 数据库客户端 (支持 SQLite)

### API 测试

- **Thunder Client**: VS Code 插件
- **Postman**: API 测试工具
- **curl**: 命令行测试

## 📊 监控和日志

### 数据库监控

```bash
# 查看数据库状态
turso db show momiq-prod

# 查看使用统计
turso db usage momiq-prod

# 实时监控
turso db shell momiq-prod --dump
```

### 应用日志

```bash
# 开发环境日志
npm run dev

# 生产环境日志
npm run start
```

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**

   ```bash
   # 检查环境变量
   echo $DATABASE_URL

   # 测试连接
   turso db shell momiq-prod
   ```

2. **认证问题**

   ```bash
   # 检查 JWT 密钥
   echo $JWT_SECRET

   # 重新生成密钥
   openssl rand -base64 32
   ```

3. **同步错误**
   ```bash
   # 查看同步日志
   SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
   ```

### 数据备份

```bash
# 备份数据库
turso db dump momiq-prod > backup.sql

# 恢复数据库
turso db restore momiq-prod < backup.sql
```

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

---

如有问题请查看 [故障排除文档](../../docs/PRODUCTION_DATABASE_SETUP.md#故障排除) 或提交 Issue。
