# MomiQ 数据库管理指南

## 概述

MomiQ 项目提供了一套完整的数据库管理工具，支持本地开发环境（SQLite）和生产环境（Turso）的数据库操作。

## 快速修复

如果遇到数据库结构问题（如缺少列或表），使用以下命令快速修复：

```bash
# 一键修复数据库结构
npm run db:fix

# 或者使用更详细的更新命令
npm run db:update
```

## 可用命令

### 基础命令

```bash
# 检查数据库状态和表结构
npm run db:check

# 更新数据库结构（安全的增量更新）
npm run db:update

# 一键修复（等同于 db:update）
npm run db:fix

# 初始化数据库（首次设置）
npm run db:setup
```

### 高级管理命令

```bash
# 使用数据库管理工具
npm run db:manage <command>

# 可用的管理命令：
npm run db:manage check    # 详细检查数据库状态
npm run db:manage update   # 更新数据库结构
npm run db:manage migrate  # 运行数据库迁移
npm run db:manage backup   # 备份数据库（仅本地）
npm run db:manage reset    # 重置数据库（危险操作）
npm run db:manage help     # 显示帮助信息
```

## 常见问题解决

### 1. "no such column: family_space_id" 错误

**问题**: API 查询时出现缺少 `family_space_id` 列的错误。

**解决方案**:
```bash
npm run db:fix
```

这个命令会：
- 检查当前数据库结构
- 添加缺失的 `family_space_id` 列
- 创建必要的索引
- 验证表结构完整性

### 2. 表不存在错误

**问题**: 数据库中缺少某些表。

**解决方案**:
```bash
npm run db:update
```

### 3. 数据库连接问题

**问题**: 无法连接到数据库。

**检查步骤**:
1. 确认环境变量设置正确
2. 检查网络连接（Turso）
3. 验证数据库文件存在（本地SQLite）

```bash
# 检查数据库连接和状态
npm run db:manage check
```

## 环境配置

### 开发环境（本地SQLite）

```bash
# .env 文件
DATABASE_URL=file:./data/momiq.db
```

### 生产环境（Turso）

```bash
# .env 文件
TURSO_DATABASE_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-auth-token
```

## 数据库结构

### 核心表

- **users**: 用户信息
- **user_sessions**: 用户会话
- **bills**: 账单记录（包含 `family_space_id` 列）
- **family_spaces**: 家庭空间
- **family_members**: 家庭成员
- **family_join_requests**: 家庭加入请求

### 重要列

- `bills.family_space_id`: 关联家庭空间的外键
- `bills.user_id`: 创建账单的用户ID
- `family_members.family_id`: 家庭空间ID
- `family_members.user_id`: 用户ID

## 最佳实践

### 1. 定期检查

```bash
# 每次部署前检查数据库状态
npm run db:manage check
```

### 2. 安全更新

```bash
# 使用安全的增量更新，不会丢失数据
npm run db:update
```

### 3. 备份（本地开发）

```bash
# 在重要操作前备份本地数据库
npm run db:manage backup
```

### 4. 生产环境注意事项

- 生产环境使用 Turso 数据库
- 不允许在生产环境执行 `reset` 操作
- 建议在维护窗口期间执行数据库更新

## 故障排除

### 1. 权限问题

确保有足够的权限访问数据库文件或 Turso 服务。

### 2. 网络问题

Turso 数据库需要网络连接，确保网络畅通。

### 3. 环境变量

检查 `.env` 文件中的数据库配置是否正确。

### 4. 版本兼容性

确保使用的 `@libsql/client` 版本与 Turso 服务兼容。

## 开发工作流

### 新功能开发

1. 在本地开发环境测试
2. 使用 `npm run db:update` 更新本地数据库
3. 测试 API 功能
4. 部署到生产环境
5. 在生产环境运行 `npm run db:update`

### 数据库迁移

1. 修改 `scripts/update-database.js` 中的迁移逻辑
2. 在本地测试迁移
3. 部署到生产环境
4. 运行生产环境迁移

## 联系支持

如果遇到无法解决的数据库问题，请：

1. 运行 `npm run db:manage check` 收集诊断信息
2. 检查应用日志
3. 联系开发团队并提供详细的错误信息

---

**注意**: 在生产环境中执行数据库操作时请格外小心，建议在维护窗口期间进行。