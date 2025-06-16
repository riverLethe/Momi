# MomiQ

记账类应用，抹掉米饭"引申为花钱，谐音"Money"，年轻化又俏皮。
“MomiQ” = 一个又可爱又懂你钱包的小饭团，它陪你把每一笔花销都记得清清楚楚，毫无压力。”

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
