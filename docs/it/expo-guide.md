# Expo 开发指南

## 项目设置

### 初始化 Expo 项目

```bash
# 在项目根目录下创建 app/expo 子项目
mkdir -p app
cd app
npx create-expo-app@latest expo --template blank-typescript
```

### 安装核心依赖

```bash
# 导航和路由
npx expo install expo-router

# 样式和 UI
npm install nativewind
npm install --save-dev tailwindcss
npm install @tamagui/core @tamagui/config @tamagui/animations-react-native

# 图标
npm install lucide-react-native

# 聊天组件
npm install react-native-gifted-chat

# 其他常用依赖
npx expo install expo-constants expo-linking expo-status-bar
```

## 配置文件设置

### app.json 配置

```json
{
  "expo": {
    "name": "MomiQ",
    "slug": "momiq",
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
    "scheme": "momiq",
    "plugins": ["expo-router"]
  }
}
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        secondary: {
          50: "#f8fafc",
          500: "#64748b",
          600: "#475569",
        },
      },
    },
  },
  plugins: [],
};
```

### metro.config.js

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

## 项目结构

### app/ 目录 (Expo Router)

```
app/
├── (tabs)/                 # 底部导航
│   ├── index.tsx          # 首页 (记账)
│   ├── statistics.tsx     # 统计页面
│   ├── chat.tsx          # 聊天助手
│   └── profile.tsx       # 个人中心
├── auth/                  # 认证页面
│   ├── login.tsx
│   └── register.tsx
├── transaction/           # 交易相关
│   ├── add.tsx           # 添加记账
│   └── [id].tsx          # 交易详情
├── _layout.tsx           # 根布局
└── +not-found.tsx        # 404 页面
```

### components/ 目录

```
components/
├── ui/                    # 基础 UI 组件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   └── index.ts
├── forms/                 # 表单组件
│   ├── TransactionForm.tsx
│   └── LoginForm.tsx
├── charts/                # 图表组件
│   ├── PieChart.tsx
│   └── LineChart.tsx
└── chat/                  # 聊天组件
    ├── ChatBubble.tsx
    └── ChatInput.tsx
```

## 开发最佳实践

### 1. 使用 Expo Router 进行导航

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}
```

### 2. NativeWind 样式开发

```typescript
// components/ui/Button.tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { cn } from '../../utils/cn';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
  className
}) => {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'px-4 py-3 rounded-lg',
        variant === 'primary' && 'bg-primary-500',
        variant === 'secondary' && 'bg-secondary-500',
        className
      )}
    >
      <Text className="text-white text-center font-semibold">
        {title}
      </Text>
    </Pressable>
  );
};
```

### 3. Tamagui 组件使用

```typescript
// components/ui/Card.tsx
import React from 'react';
import { Card as TamaguiCard, CardHeader, CardFooter } from 'tamagui';

interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, header, footer }) => {
  return (
    <TamaguiCard className="m-4 p-4">
      {header && <CardHeader>{header}</CardHeader>}
      {children}
      {footer && <CardFooter>{footer}</CardFooter>}
    </TamaguiCard>
  );
};
```

### 4. 聊天功能实现

```typescript
// app/(tabs)/chat.tsx
import React, { useState, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';

export default function ChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);

  const onSend = useCallback((messages: IMessage[] = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages)
    );
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{
        _id: 1,
        name: 'User',
      }}
      placeholder="输入消息..."
      alwaysShowSend
      showUserAvatar
    />
  );
}
```

## 调试和测试

### 开发工具

```bash
# 启动开发服务器
npx expo start

# 在 iOS 模拟器中打开
npx expo start --ios

# 在 Android 模拟器中打开
npx expo start --android

# 在网页中打开
npx expo start --web
```

### 性能监控

```typescript
// utils/performance.ts
import { InteractionManager } from "react-native";

export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(callback);
};

export const measurePerformance = (name: string, fn: () => void) => {
  const start = Date.now();
  fn();
  const end = Date.now();
  console.log(`${name} took ${end - start}ms`);
};
```

## 构建和部署

### 开发构建

```bash
# EAS 构建 (推荐)
npx eas build --platform ios --profile development
npx eas build --platform android --profile development
```

### 生产构建

```bash
# 生产构建
npx eas build --platform all --profile production

# 提交到应用商店
npx eas submit --platform ios
npx eas submit --platform android
```

## 常见问题

### 1. Metro 缓存问题

```bash
npx expo start --clear
```

### 2. 依赖版本冲突

```bash
npx expo install --fix
```

### 3. 类型错误

确保安装了正确的类型定义：

```bash
npm install --save-dev @types/react @types/react-native
```

## 有用的资源

- [Expo 官方文档](https://docs.expo.dev/)
- [Expo Router 文档](https://expo.github.io/router/)
- [NativeWind 文档](https://www.nativewind.dev/)
- [Tamagui 文档](https://tamagui.dev/)
- [React Native Gifted Chat](https://github.com/FaridSafi/react-native-gifted-chat)
