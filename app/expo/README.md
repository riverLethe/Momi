# Momi - 智能记账应用

基于 Expo + React Native 开发的智能记账应用，支持AI记账和家庭共享功能。

## 功能特性

### 核心功能

- 🤖 **AI智能记账**: 通过聊天对话快速记录账单
- 👨‍👩‍👧‍👦 **家庭共享**: 自动共享家庭账单，无需手动操作
- 📊 **数据分析**: 个人和家庭消费分析报表
- 💰 **预算管理**: 个人预算设置和跟踪
- 📱 **多平台支持**: iOS、Android 原生体验

### 技术特性

- 基于 Expo Router 的文件路由系统
- NativeWind (Tailwind CSS) 样式方案
- Zustand 状态管理
- TypeScript 类型安全
- 响应式设计

## 开发环境

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Expo CLI
- iOS Simulator / Android Emulator

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 启动 Expo 开发服务器
pnpm dev

# 在 iOS 模拟器中运行
pnpm ios

# 在 Android 模拟器中运行
pnpm android

# 在 Web 浏览器中运行
pnpm web
```

### 构建应用

```bash
# 构建生产版本
pnpm build

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 项目结构

```
app/expo/
├── app/                    # Expo Router 页面
│   ├── (tabs)/            # 底部导航页面
│   │   ├── index.tsx      # 首页
│   │   ├── transactions.tsx # 账单列表
│   │   ├── reports.tsx    # 报表分析
│   │   └── profile.tsx    # 个人中心
│   ├── chat/              # AI聊天记账
│   └── _layout.tsx        # 根布局
├── components/            # 可复用组件
│   ├── ui/               # 基础UI组件
│   └── forms/            # 表单组件
├── hooks/                # 自定义Hooks
│   └── useStore.ts       # 状态管理
├── utils/                # 工具函数
│   ├── index.ts          # 通用工具
│   └── mockData.ts       # 模拟数据
├── types/                # TypeScript类型
├── constants/            # 常量定义
└── assets/               # 静态资源
```

## 核心功能说明

### 1. AI智能记账

- 支持自然语言输入，如"今天买菜花了58元"
- 支持图片识别（购物小票、发票）
- 支持文件导入（CSV、Excel）
- AI解析准确率目标90%

### 2. 家庭共享机制

- **隐式共享**: 在家庭空间中创建的账单自动共享给所有成员
- **权限控制**: 只有账单创建者可以编辑和删除
- **视图切换**: 支持个人视图和家庭视图切换

### 3. 数据分析

- 个人消费分析（基于用户创建的所有账单）
- 家庭消费分析（基于家庭空间内所有成员的账单）
- 多维度图表展示（饼图、柱状图、折线图）

### 4. 预算管理

- 个人预算设置（按类别或总额）
- 预算执行跟踪和提醒
- 超支预警

## 设计原则

### 用户体验

- **简化操作**: 减少用户手动操作，自动化程度高
- **直观界面**: 清晰的视觉层次和交互反馈
- **快速录入**: 多种录入方式，满足不同场景需求

### 技术架构

- **组件化**: 可复用的UI组件库
- **类型安全**: 完整的TypeScript类型定义
- **状态管理**: 清晰的数据流和状态管理
- **性能优化**: 列表虚拟化、图片懒加载等

## 开发规范

### 代码规范

- 使用 ESLint + Prettier 进行代码格式化
- 遵循 React Native 最佳实践
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### 提交规范

- 使用 Conventional Commits 规范
- 提交前自动运行 lint 和 type-check

## 部署

### 构建配置

- 支持 EAS Build 云构建
- 支持本地构建
- 自动化CI/CD流程

### 发布流程

1. 版本号更新
2. 代码检查和测试
3. 构建应用包
4. 应用商店发布

## 许可证

MIT License
