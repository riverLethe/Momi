# Google OAuth 配置指南

## 概述

本指南将帮助您配置 Google Sign-In 功能，使用户能够通过 Google 账户登录 MomiQ 应用。

## 前提条件

- Google Cloud Console 账户
- 应用的 Bundle ID (iOS) 和 Package Name (Android)

## 步骤 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击右上角的 "Select a project" 下拉菜单
3. 点击 "NEW PROJECT"
4. 输入项目名称 (例如: "MomiQ App")
5. 点击 "CREATE"

## 步骤 2: 启用 Google+ API

1. 在 Google Cloud Console 中，导航到 "APIs & Services" > "Library"
2. 搜索 "Google+ API"
3. 点击 "Google+ API" 结果
4. 点击 "ENABLE"

## 步骤 3: 创建 OAuth 2.0 凭据

### 3.1 配置 OAuth 同意屏幕

1. 导航到 "APIs & Services" > "OAuth consent screen"
2. 选择 "External" 用户类型
3. 填写必填信息：
   - App name: MomiQ
   - User support email: 您的邮箱
   - Developer contact information: 您的邮箱
4. 点击 "SAVE AND CONTINUE"
5. 跳过 "Scopes" 页面（点击 "SAVE AND CONTINUE"）
6. 添加测试用户（开发阶段）
7. 点击 "SAVE AND CONTINUE"

### 3.2 创建 OAuth 2.0 客户端 ID

1. 导航到 "APIs & Services" > "Credentials"
2. 点击 "+ CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"

#### Web 应用程序（用于 React Native）

1. 应用程序类型：选择 "Web application"
2. 名称：输入 "MomiQ Web Client"
3. 点击 "CREATE"
4. 复制生成的 "Client ID"（这将是您的 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`）

#### iOS 应用程序

1. 再次点击 "+ CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"
2. 应用程序类型：选择 "iOS"
3. 名称：输入 "MomiQ iOS"
4. Bundle ID：输入 `com.momiq.app`
5. 点击 "CREATE"
6. 复制生成的 "Client ID"（这将是您的 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`）

#### Android 应用程序（如果需要）

1. 再次点击 "+ CREATE CREDENTIALS" > "OAuth 2.0 Client IDs"
2. 应用程序类型：选择 "Android"
3. 名称：输入 "MomiQ Android"
4. Package name：输入 `com.momiq.app`
5. SHA-1 证书指纹：
   - 开发版本：运行 `expo credentials:manager` 获取
   - 生产版本：从 Google Play Console 获取
6. 点击 "CREATE"

## 步骤 4: 配置环境变量

1. 在 `app/expo/` 目录下创建 `.env` 文件：

\`\`\`bash

# Google OAuth Configuration

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.googleusercontent.com

# Apple Sign In Configuration

EXPO_PUBLIC_APPLE_CLIENT_ID=com.momiq.app

# App Configuration

EXPO_PUBLIC_SCHEME=momiq

# API Configuration

EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
\`\`\`

2. 将从 Google Cloud Console 获取的实际 Client ID 替换到环境变量中

## 步骤 5: 重启开发服务器

配置完成后，重启 Expo 开发服务器：

\`\`\`bash
cd app/expo
npx expo start --clear
\`\`\`

## 步骤 6: 测试 Google 登录

1. 在应用中导航到登录页面
2. 点击 "Continue with Google" 按钮
3. 完成 Google OAuth 流程
4. 验证用户能够成功登录

## 故障排除

### 常见错误

1. **"RNGoogleSignin: offline use requires server web ClientID"**

   - 确保 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` 已正确设置
   - 重启开发服务器

2. **"DEVELOPER_ERROR"**

   - 验证 Bundle ID/Package Name 是否与 Google Cloud Console 中的配置一致
   - 确保使用了正确的 SHA-1 指纹（Android）

3. **"SIGN_IN_CANCELLED"**

   - 用户取消了登录流程（正常行为）

4. **"SIGN_IN_CURRENTLY_IN_PROGRESS"**
   - 避免在登录过程中重复调用登录函数

### 调试技巧

1. 检查控制台日志中的详细错误信息
2. 验证环境变量是否正确加载：
   \`\`\`javascript
   console.log(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
   \`\`\`
3. 使用 Google Cloud Console 中的 "APIs & Services" > "Usage" 监控 API 调用

## 生产部署注意事项

1. 将应用提交到应用商店后，从商店下载的版本将有不同的 SHA-1 指纹
2. 需要将生产版本的 SHA-1 指纹添加到 Google Cloud Console
3. 考虑在生产环境中使用不同的 Google Cloud 项目

## 相关链接

- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo Google Sign-In Guide](https://docs.expo.dev/guides/google-authentication/)
