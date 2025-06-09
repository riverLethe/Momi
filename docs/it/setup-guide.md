# 项目初始化指南

## 目录结构说明

本项目采用 `app/expo` 的目录结构，其中：
- `app/` 是应用程序的主目录
- `app/expo/` 是 Expo React Native 子项目

## 初始化步骤

### 1. 创建项目结构
```bash
# 在项目根目录执行
mkdir -p app
cd app
npx create-expo-app@latest expo --template blank-typescript
```

### 2. 安装依赖
```bash
# 在根目录安装 monorepo 依赖
pnpm install

# 进入 expo 目录安装移动端依赖
cd app/expo
npx expo install expo-router
npm install nativewind
npm install --save-dev tailwindcss
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native
npm install lucide-react-native
npm install react-native-gifted-chat
npx expo install expo-constants expo-linking expo-status-bar
```

### 3. 配置文件设置

#### app/expo/app.json
```json
{
  "expo": {
    "name": "Momi",
    "slug": "momi",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.momiq.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.momiq.app"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "scheme": "momi",
    "plugins": ["expo-router"]
  }
}
```

#### app/expo/package.json
确保 package.json 中包含正确的 name 字段：
```json
{
  "name": "app-expo",
  "version": "1.0.0",
  "scripts": {
    "dev": "expo start",
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

### 4. 验证设置

#### 检查工作区配置
确保根目录的 `pnpm-workspace.yaml` 包含：
```yaml
packages:
  - "app/expo"
  - "packages/*"
```

#### 测试开发服务器
```bash
# 在根目录执行
pnpm dev:expo
```

## 目录结构预览

```
Momi/
├── app/                   # 应用目录
│   └── expo/             # Expo React Native 应用
│       ├── app/          # Expo Router 页面
│       │   ├── (tabs)/   # 底部导航
│       │   ├── auth/     # 认证页面
│       │   └── _layout.tsx
│       ├── components/   # 可复用组件
│       │   ├── ui/       # 基础 UI 组件
│       │   ├── forms/    # 表单组件
│       │   └── charts/   # 图表组件
│       ├── hooks/        # 自定义 Hooks
│       ├── utils/        # 工具函数
│       ├── types/        # TypeScript 类型
│       ├── constants/    # 常量定义
│       ├── assets/       # 静态资源
│       └── package.json
├── packages/             # 共享包
├── docs/                # 项目文档
├── turbo.json          # Turbo 配置
├── package.json        # 根 package.json
└── pnpm-workspace.yaml # pnpm 工作区配置
```

## 常见问题

### Q: 为什么使用 app/expo 而不是直接使用 expo？
A: 这种结构有以下优势：
1. 更清晰的应用层级划分
2. 便于未来扩展其他应用类型（如 web、desktop）
3. 符合现代 monorepo 的最佳实践

### Q: 如何在不同目录间共享代码？
A: 通过 `packages/` 目录创建共享包：
```bash
# 创建共享 UI 包
mkdir -p packages/ui
cd packages/ui
npm init -y
```

### Q: 如何调试 Turbo 构建问题？
A: 使用以下命令：
```bash
# 查看构建图
pnpm turbo run build --graph

# 详细日志
pnpm turbo run dev:expo --verbose
``` 