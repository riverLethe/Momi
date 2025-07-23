# 时间格式统一修改总结

## 修改概述

将客户端与服务端的时间格式统一为时间戳（timestamp），以解决时间处理不一致的问题。

## 时间格式策略

- **服务端存储**: 使用时间戳（毫秒级整数）
- **客户端使用**: 内部使用 Date 对象
- **数据传输**: 客户端上传时将 Date 转为时间戳，下载时将时间戳转为 Date

## 修改的文件和内容

### 1. 服务端修改

#### `database.ts`
- 将所有时间相关字段的数据类型从 `TEXT` 改为 `INTEGER`
- 将默认值从 `CURRENT_TIMESTAMP` 改为 `(strftime('%s', 'now') * 1000)`
- 修改 `cleanupExpiredSessions` 方法，使用 `Date.now()` 而不是 `new Date().toISOString()`

#### `sync.ts`
- 修改 `cleanupOldLogs` 方法，使用时间戳比较而不是 ISO 字符串
- 确认 `createSyncLog` 方法已使用 `Date.now()` 存储时间戳
- 确认 `getUserSyncData` 方法直接返回原始时间数据（时间戳）

#### `route.ts` (sync/bills)
- 服务端接收客户端上传的时间戳数据，直接存储到数据库
- 服务端下载时直接返回数据库中的时间戳数据
- `getUserSyncData` 方法使用 `lastSyncTimestamp` 参数进行增量同步

#### `update-database.js`
- 更新所有表的时间字段定义为 `INTEGER` 类型
- 添加迁移5：自动将现有 DATETIME 数据转换为时间戳
- 智能检测现有数据格式，仅在需要时进行转换
- 支持所有相关表的时间字段转换

### 2. 客户端修改

#### `useDataSync.ts`
- 修改上传逻辑：将 Date 对象转换为时间戳 (`getTime()`)
- 修改下载逻辑：将服务端返回的时间戳转换为 Date 对象
- 修改同步时间存储：使用 `getTime().toString()` 而不是 `toISOString()`
- 修改同步时间读取：支持时间戳格式的解析，兼容旧格式

#### `AuthProvider.tsx`
- 修改所有上传操作：将 Date 对象转换为时间戳
- 修改所有下载操作：将时间戳转换为 Date 对象
- 修改同步时间存储：使用 `getTime().toString()` 而不是 `toISOString()`
- 更新所有同步策略方法（merge、clearAndDownload、pushAndOverride）

#### `bills.utils.ts`
- 确认本地账单创建和更新时使用 Date 对象（符合策略）
- 离线队列操作正常工作

## 转换示例

### 上传时（客户端 → 服务端）
```javascript
// 修改前
billData.date.toISOString()

// 修改后
billData.date.getTime()
```

### 下载时（服务端 → 客户端）
```javascript
// 修改前
new Date(remote.date) // remote.date 是 ISO 字符串

// 修改后
new Date(remote.date) // remote.date 是时间戳
```

### 同步时间存储
```javascript
// 修改前
await storage.setItem("momiq_last_sync", newSyncTime.toISOString());

// 修改后
await storage.setItem("momiq_last_sync", newSyncTime.getTime().toString());
```

### 同步时间读取（兼容性处理）
```javascript
// 修改后 - 支持时间戳和ISO字符串格式
const lastSyncStr = await storage.getItem<string>(LAST_SYNC_KEY);
if (lastSyncStr) {
  // 尝试解析为时间戳，如果失败则回退到字符串解析
  const timestamp = parseInt(lastSyncStr, 10);
  const lastSyncTime = isNaN(timestamp) ? new Date(lastSyncStr) : new Date(timestamp);
}
```

## 数据流程验证

### 1. 客户端创建账单
- 使用 `new Date()` 创建时间字段
- 存储在本地时保持 Date 对象格式

### 2. 上传到服务端
- 将 Date 对象转换为时间戳：`date.getTime()`
- 服务端接收时间戳并直接存储到数据库

### 3. 从服务端下载
- 服务端返回数据库中的时间戳
- 客户端将时间戳转换为 Date 对象：`new Date(timestamp)`

### 4. 增量同步
- 客户端存储最后同步时间为时间戳字符串
- 服务端使用该时间戳进行 `updated_at > ?` 查询

## 兼容性处理
- 客户端读取同步时间时，先尝试解析为整数（时间戳），失败则回退到字符串解析
- 服务端直接返回原始时间数据，不进行格式转换
- 数据库字段类型已更改为 INTEGER，支持时间戳存储

## 优势
1. **一致性**: 统一使用时间戳作为存储和传输格式
2. **性能**: 时间戳比较比字符串比较更高效
3. **精度**: 毫秒级精度，适合冲突解决
4. **简化**: 减少时间格式转换的复杂性
5. **可靠性**: 避免时区和格式差异导致的问题

## 注意事项
- 确保所有时间比较操作都使用时间戳
- 客户端显示时需要将时间戳转换为用户友好的格式
- 数据库迁移时需要将现有的 ISO 字符串转换为时间戳
- 新的时间格式已在所有同步路径中实现和测试

## 完成状态
✅ 服务端数据库结构更新
✅ 服务端时间处理逻辑更新
✅ 客户端上传逻辑更新
✅ 客户端下载逻辑更新
✅ 同步时间存储和读取更新
✅ 兼容性处理实现
✅ 所有同步策略更新