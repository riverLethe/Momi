# MomiQ - 智能记账应用

MomiQ是一个基于Turbo Monorepo架构的移动记账应用，集成了AI对账、预算管理、报表分析和家庭共享等功能。

## 项目架构

- **前端**: Expo (React Native) + Tamagui + NativeWind
- **后端**: Next.js API Routes
- **数据库**: Turso (分布式SQLite)
- **架构**: Turborepo Monorepo

## 性能优化

为提高应用性能，特别是本地数据加载速度，我们实现了以下优化:

### 内存缓存层

- 添加了高效的内存缓存(`memoryCache`)系统，位于MMKV上层
- 避免频繁的MMKV读取操作，显著减少I/O开销
- 为缓存项设置TTL(生存时间)，确保数据合理更新

### 分段式数据加载

- 实现了数据的分批加载机制，优先加载UI渲染所需的核心数据
- 次要数据和计算复杂的统计信息在后台异步处理
- 报表数据使用二阶段渲染，先显示基本图表，然后在不阻塞UI的情况下补充详细信息

### 全局数据状态优化

- 改进`DataProvider`实现细粒度加载状态，允许更精确的UI反馈
- 单独追踪每种数据类型(账单、交易、预算等)的加载状态
- 提供针对单一数据类型的刷新函数，避免全局数据重载

### UI体验改进

- 实现了平滑的列表加载效果，使用`FlatList`的`refreshControl`来管理刷新状态
- 优化了骨架屏和loading状态显示时机，减少用户等待感知
- 增强了ResponsiveUI反馈，确保即使在数据加载时也保持界面响应性

## 快速开始

1. 克隆项目

```bash
git clone https://github.com/your-username/momi.git
cd momi
```

2. 安装依赖

```bash
pnpm install
```

3. 启动应用

```bash
# 开启Expo开发服务器
pnpm dev:expo
```

## 🏗️ 技术架构

### 项目结构

- **整体框架**: Turbo Monorepo
- **包管理器**: pnpm
- **子项目**: app/expo (移动端应用)

### 技术栈

#### 移动端 (app/expo/)

- **框架**: Expo + React Native
- **样式方案**: NativeWind (Tailwind CSS for React Native)
- **图标库**: Lucide React Native
- **UI 组件库**: Tamagui
- **聊天组件**: react-native-gifted-chat

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Expo CLI

### 安装依赖

```bash
# 安装根目录依赖
pnpm install

# 安装所有工作区依赖
pnpm install --recursive
```

### 开发命令

```bash
# 启动开发服务器
pnpm dev

# 启动 expo 应用
pnpm dev:expo

# 构建项目
pnpm build

# 代码检查
pnpm lint

# 类型检查
pnpm type-check
```

## 📁 项目结构

```
MomiQ/
├── app/                   # 应用目录
│   └── expo/             # Expo React Native 应用
│       ├── app/          # 应用页面 (Expo Router)
│       ├── components/   # 可复用组件
│       ├── hooks/        # 自定义 Hooks
│       ├── utils/        # 工具函数
│       ├── types/        # TypeScript 类型定义
│       └── package.json
├── packages/             # 共享包
│   ├── ui/              # 共享 UI 组件
│   ├── utils/           # 共享工具函数
│   └── types/           # 共享类型定义
├── docs/                # 项目文档
├── turbo.json          # Turbo 配置
├── package.json        # 根 package.json
└── pnpm-workspace.yaml # pnpm 工作区配置
```

## 🎨 设计系统

### 样式规范

- 使用 NativeWind 进行样式开发
- 遵循 Tailwind CSS 设计原则
- 响应式设计适配不同屏幕尺寸

### 组件规范

- 基于 Tamagui 构建一致的 UI 组件
- 使用 Lucide React Native 图标
- 聊天界面使用 react-native-gifted-chat

## 📱 功能模块

### 核心功能

- [ ] 记账管理
- [ ] 分类统计
- [ ] 数据可视化
- [ ] 用户认证
- [ ] 数据同步

### 聊天功能

- [ ] 智能记账助手
- [ ] 语音输入记账
- [ ] 消费建议

## 🔧 开发规范

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件使用函数式组件 + Hooks

### 提交规范

- 使用 Conventional Commits 规范
- 提交前自动运行 lint 和 type-check

## 📚 相关文档

- [项目初始化指南](./docs/setup-guide.md)
- [Expo 开发指南](./docs/expo-guide.md)
- [组件库文档](./docs/components.md)
- [API 接口文档](./docs/api.md)
- [部署指南](./docs/deployment.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
