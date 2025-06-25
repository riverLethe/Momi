# MomiQ 用户系统实现文档

## 概述

本文档描述了 MomiQ 应用的完整用户认证和数据同步系统的实现，支持三种登录方式：邮箱登录、Google OAuth 和 Apple Sign In。

## 功能特性

### 认证方式

1. **邮箱密码登录** - 传统的用户名密码认证
2. **Google OAuth** - 使用 Google 账户快速登录
3. **Apple Sign In** - iOS 平台的原生登录方式

### 数据同步

1. **在线同步** - 当网络可用时自动同步数据到服务器
2. **离线模式** - 网络不可用时本地存储数据
3. **智能合并** - 处理本地和服务器数据的冲突
4. **同步状态显示** - 实时显示同步状态和最后同步时间

## 技术架构

### 前端 (React Native + Expo)

#### 认证组件

- `AuthProvider.tsx` - 认证状态管理
- `login.tsx` - 登录界面
- `GoogleIcon.tsx` - Google 图标组件

#### 数据同步

- `useDataSync.ts` - 数据同步 Hook
- `api.ts` - API 客户端封装

#### UI 组件

- `profile.tsx` - 个人资料页面，显示同步状态

### 后端 (Next.js API Routes)

#### 认证端点

- `/api/auth/login` - 邮箱密码登录
- `/api/auth/google` - Google OAuth 验证
- `/api/auth/apple` - Apple Sign In 验证
- `/api/auth/profile` - 获取用户信息
- `/api/auth/logout` - 用户登出

#### 数据同步端点

- `/api/sync` - 数据同步主入口
- `/api/sync/bills` - 账单数据同步

## 安装和配置

### 前端依赖

```bash
# 安装认证相关依赖
npx expo install @react-native-google-signin/google-signin expo-auth-session expo-crypto expo-web-browser

# 安装网络状态监测
npx expo install @react-native-community/netinfo
```

### 后端依赖

```bash
# 在 app/server 目录下安装
npm install jsonwebtoken bcryptjs google-auth-library @types/jsonwebtoken @types/bcryptjs
```

### 环境变量配置

#### 前端 (.env)

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SCHEME=momiq

# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id

# Apple Sign In Configuration
EXPO_PUBLIC_APPLE_CLIENT_ID=com.momiq.app
```

#### 后端 (.env)

```env
# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
```

## 使用方法

### 认证流程

1. **邮箱登录**

   ```typescript
   const { login } = useAuth();
   await login("user@example.com", "password");
   ```

2. **Google 登录**

   ```typescript
   const { loginWithGoogle } = useAuth();
   await loginWithGoogle();
   ```

3. **Apple 登录**
   ```typescript
   const { loginWithApple } = useAuth();
   await loginWithApple();
   ```

### 数据同步

```typescript
const {
  isOnline,
  isSyncing,
  syncData,
  getSyncStatusText,
  incrementPendingChanges,
} = useDataSync();

// 手动触发同步
await syncData();

// 标记有待同步的更改
await incrementPendingChanges();
```

### 同步状态显示

```typescript
const syncStatusText = getSyncStatusText();
const syncStatusColor = getSyncStatusColor();

// 可能的状态：
// - "Not signed in"
// - "Syncing..."
// - "Offline"
// - "3 changes pending"
// - "Synced 5 minutes ago"
// - "Never synced"
```

## 核心特性详解

### 认证状态管理

`AuthProvider` 提供全局认证状态管理：

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithApple: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  syncData: () => Promise<void>;
  lastSyncTime: Date | null;
}
```

### 数据同步机制

1. **网络状态监测** - 使用 `@react-native-community/netinfo` 监测网络连接
2. **自动同步** - 网络恢复时自动触发同步
3. **冲突处理** - 基于时间戳的简单冲突解决策略
4. **本地存储** - 使用 MMKV 存储同步状态

### 安全考虑

1. **JWT Token** - 使用 JSON Web Token 进行身份验证
2. **密码加密** - 使用 bcrypt 加密存储密码
3. **OAuth 验证** - Google 和 Apple 的官方 SDK 验证
4. **HTTPS** - 生产环境强制使用 HTTPS

## 部署注意事项

### Google OAuth 配置

1. 在 Google Cloud Console 创建 OAuth 2.0 客户端
2. 配置回调 URL 和包名
3. 下载配置文件并设置环境变量

### Apple Sign In 配置

1. 在 Apple Developer 账户中启用 Sign In with Apple
2. 配置 App ID 和服务标识符
3. 设置重定向 URL

### 生产环境配置

1. 设置强密码的 JWT 密钥
2. 配置 HTTPS 证书
3. 设置数据库连接（替换 Mock 数据）
4. 配置错误监控和日志记录

## 测试用户

系统包含一个测试用户用于开发：

- **邮箱**: demo@momiq.com
- **密码**: password123

## 后续改进

1. **数据库集成** - 替换 Mock 数据为真实数据库
2. **冲突解决** - 实现更智能的数据冲突解决机制
3. **离线队列** - 实现离线操作队列和批量同步
4. **加密存储** - 对本地敏感数据进行加密
5. **多设备同步** - 支持多设备间的数据同步
6. **实时同步** - 使用 WebSocket 实现实时数据更新

## 故障排除

### 常见问题

1. **Google 登录失败**

   - 检查 OAuth 客户端配置
   - 确认包名和 SHA-1 指纹匹配

2. **Apple 登录不可用**

   - 确认在 iOS 设备上测试
   - 检查 App ID 配置

3. **同步失败**

   - 检查网络连接
   - 确认服务器运行状态
   - 查看控制台错误日志

4. **Token 过期**
   - 实现 Token 刷新机制
   - 处理 401 错误并重新登录

---

这个实现提供了一个完整的用户认证和数据同步系统，支持现代移动应用的基本需求。系统设计考虑了可扩展性和安全性，为后续功能扩展奠定了良好的基础。
