# 数据库选择专业指南

## 🎯 你的需求分析

**应用类型：** ToC 记账应用  
**预期用户：** 多用户并发访问  
**数据特点：** 账单记录 + 同步需求  
**技术要求：** 轻量但可扩展

## 📊 数据库方案深度对比

### 1. SQLite + Turso ⭐⭐⭐⭐⭐ (强烈推荐)

**📋 方案描述**

- **本地开发**：纯 SQLite 文件数据库
- **生产环境**：Turso 托管 SQLite（libSQL）
- **架构**：边缘分布式 + 自动同步

```typescript
// 开发配置
DATABASE_URL = "file:./data/momiq.db";

// 生产配置
DATABASE_URL = "libsql://your-db.turso.io";
TURSO_AUTH_TOKEN = "your-token";
```

**✅ 优势**

- **极简部署**：文件数据库，零配置
- **性能卓越**：边缘部署，延迟 <50ms
- **成本极低**：免费额度非常大
- **渐进式扩展**：SQLite → Turso → 多地域
- **兼容性好**：标准 SQL，易于迁移
- **备份简单**：文件复制即备份

**❌ 劣势**

- 服务相对较新（2023年开始）
- 复杂分析查询性能一般

**💰 成本分析**

```
免费额度：
- 数据库：3个
- 存储：1GB
- 读取：10亿次/月
- 写入：1000万次/月

付费版：$29/月起
- 无限数据库
- 8GB 存储
- 更高 QPS
```

**🎯 适用场景**

- ✅ 中小型 ToC 应用（完美匹配）
- ✅ 需要快速开发和部署
- ✅ 预算有限的创业项目
- ✅ 注重用户体验（低延迟）

---

### 2. PlanetScale (MySQL) ⭐⭐⭐⭐

**📋 方案描述**

- **类型**：无服务器 MySQL
- **特色**：数据库分支功能
- **架构**：全球分布式 + 自动扩展

```typescript
DATABASE_URL = "mysql://user:pass@gateway.planetscale.com/db?sslaccept=strict";
```

**✅ 优势**

- **无服务器**：按需付费，自动扩展
- **分支功能**：类似 Git 的数据库版本控制
- **零停机迁移**：schema 变更无需停机
- **性能优秀**：读写分离 + 连接池
- **安全性高**：自动备份 + 加密

**❌ 劣势**

- 成本相对较高
- MySQL 功能限制（无外键约束）
- 学习曲线（分支概念）

**💰 成本分析**

```
免费额度：
- 1个数据库
- 1GB 存储
- 1亿行读取/月
- 1000万行写入/月

付费版：$39/月起
- 无限数据库
- 10GB 存储
- 更高性能
```

**🎯 适用场景**

- ✅ 需要团队协作开发
- ✅ 频繁的 schema 变更
- ✅ 中高并发应用
- ❌ 预算有限的项目

---

### 3. Supabase (PostgreSQL) ⭐⭐⭐⭐

**📋 方案描述**

- **类型**：开源 BaaS 平台
- **数据库**：托管 PostgreSQL
- **特色**：全栈解决方案

```typescript
DATABASE_URL = "postgresql://postgres:pass@host.supabase.co:5432/postgres";
```

**✅ 优势**

- **功能丰富**：认证、实时、存储一体化
- **开源**：可自托管，避免厂商锁定
- **实时功能**：原生支持数据实时同步
- **PostgreSQL**：功能强大，SQL 标准
- **社区活跃**：文档完善，生态丰富

**❌ 劣势**

- 功能过多，可能过度设计
- PostgreSQL 相对重量级
- 自托管运维复杂

**💰 成本分析**

```
免费额度：
- 2个项目
- 500MB 数据库
- 5GB 文件存储
- 2GB 带宽/月

付费版：$25/月起
- 无限项目
- 8GB 数据库
- 100GB 文件存储
```

**🎯 适用场景**

- ✅ 需要实时功能的应用
- ✅ 快速原型开发
- ✅ 全栈 JavaScript 项目
- ❌ 简单的 CRUD 应用

---

### 4. Railway PostgreSQL ⭐⭐⭐

**📋 方案描述**

- **类型**：简化部署平台
- **数据库**：托管 PostgreSQL
- **特色**：一键部署 + 监控

```typescript
DATABASE_URL = "postgresql://user:pass@monorail.proxy.railway.app:5432/db";
```

**✅ 优势**

- **部署简单**：一键部署应用+数据库
- **监控完善**：内置性能监控面板
- **价格合理**：按使用量付费
- **开发友好**：Git 集成，自动部署

**❌ 劣势**

- PostgreSQL 对简单应用过重
- 功能相对基础
- 主要面向欧美市场

**💰 成本分析**

```
免费额度：
- 500小时运行时间/月
- 1GB 内存
- 1GB 磁盘

付费版：$5/月起
- 无限运行时间
- 按资源使用付费
```

---

## 🏆 专业推荐

### 首选方案：SQLite + Turso

**为什么是最佳选择？**

1. **完美匹配需求**

   - 轻量级：SQLite 是最轻量的关系型数据库
   - 高并发：Turso 提供分布式架构支持
   - 易同步：边缘复制天然支持同步

2. **开发体验极佳**

   ```bash
   # 本地开发（零配置）
   DATABASE_URL="file:./data/momiq.db"

   # 生产部署（一键切换）
   DATABASE_URL="libsql://your-db.turso.io"
   ```

3. **成本优势明显**

   - 免费额度足够支撑早期用户增长
   - 付费版本价格合理
   - 无需数据库管理员

4. **技术风险低**
   - 基于成熟的 SQLite
   - 标准 SQL，易于迁移
   - 可随时切换到 PostgreSQL

### 次选方案：PlanetScale

如果你的团队熟悉 MySQL，且需要更强的企业级功能：

```typescript
// 配置简单
DATABASE_URL="mysql://..."

// 分支开发
pscale branch create main feature-branch
pscale deploy-request create feature-branch
```

### 备选方案：Supabase

如果需要快速构建全栈应用，且重视实时功能：

```typescript
// 不仅仅是数据库
const { data } = await supabase
  .from("bills")
  .select("*")
  .eq("userId", userId)
  .order("billDate", { ascending: false });
```

## 🚀 实施建议

### 1. 立即开始（Turso 方案）

```bash
# 1. 克隆项目
cd app/server

# 2. 一键设置开发环境
npm run quick-start

# 3. 5分钟后开始开发
# SQLite 文件自动创建在 ./data/momiq.db
```

### 2. 生产部署（2分钟）

```bash
# 1. 注册 Turso
npm install -g @turso/cli
turso auth signup

# 2. 创建数据库
turso db create momiq-prod

# 3. 获取连接信息
turso db show momiq-prod

# 4. 更新环境变量
DATABASE_URL="libsql://momiq-prod.turso.io"
TURSO_AUTH_TOKEN="your-token"

# 5. 部署迁移
npm run db:deploy
```

### 3. 监控和维护

```bash
# 查看数据库状态
turso db list

# 备份数据库
turso db dump momiq-prod > backup.sql

# 查看使用统计
turso db usage momiq-prod
```

## 📈 扩展路径

### 阶段1：MVP (0-1000 用户)

- ✅ 本地 SQLite 开发
- ✅ Turso 生产环境
- ✅ 单地域部署

### 阶段2：增长期 (1000-10000 用户)

- ✅ 多地域 Turso 部署
- ✅ 添加 Redis 缓存
- ✅ 开启监控告警

### 阶段3：规模化 (10000+ 用户)

- ✅ 考虑迁移到 PostgreSQL
- ✅ 读写分离架构
- ✅ 数据分片策略

## 🎯 最终建议

**选择 SQLite + Turso**，理由：

1. **风险最低**：成熟技术 + 现代基础设施
2. **成本最优**：免费额度充足，付费合理
3. **体验最佳**：开发简单，部署快速
4. **未来友好**：可平滑迁移到其他方案

**立即行动：**

```bash
cd app/server
npm run quick-start
```

5分钟后你就有一个完全可用的记账应用后端！🚀
