# QAQ Game Engine Editor

基于 Vue3 + Nuxt UI Pro + Pinia 的现代化游戏引擎编辑器，复刻 Godot 核心架构。

## 🎯 项目概述

QAQ 是一个现代化的游戏引擎编辑器，采用 Web 技术栈构建，提供与 Godot 相似的开发体验。

### 核心特性
- 🎮 完整的节点系统和场景管理
- 🎨 现代化的编辑器界面
- 📁 智能的项目和资源管理
- 🔧 可视化的属性编辑器
- 🎬 3D/2D 视口系统
- 💾 编辑器状态持久化

## 🏗️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件**: Nuxt UI Pro
- **状态管理**: Pinia
- **3D 渲染**: Three.js
- **构建工具**: Vite
- **图标系统**: Heroicons + Lucide + 自定义 SVG

## 📁 项目结构

```
qaq-game-engine/
├── docs/                    # 文档和设计
├── src/                     # 源代码
├── public/                  # 静态资源
├── tests/                   # 测试文件
└── tools/                   # 开发工具
```

## 🚀 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd qaq-game-engine

# 安装依赖
npm install

# 选择开发模式

# 🔧 Vite模式 - TypeScript核心调试 (推荐用于引擎开发)
npm run debug          # 或 npm run dev:vite
# 访问: http://localhost:5173

# 🌐 Nuxt模式 - 完整应用开发 (推荐用于游戏开发)
npm run dev:nuxt       # 或 npm run dev
# 访问: http://localhost:3000

# 构建生产版本
npm run build
```

## 🎮 开发模式说明

### Vite模式特点
- ✅ 纯TypeScript环境，无Vue/Nuxt依赖
- ✅ 极快的热重载和构建速度
- ✅ 专注引擎核心功能测试
- ✅ 实时性能监控和调试
- ✅ THREE.js集成调试环境

### Nuxt模式特点
- ✅ 完整的Vue.js应用框架
- ✅ 组件化开发和路由管理
- ✅ SSR/SPA支持
- ✅ 生产环境就绪

详细开发指南请查看 [DEVELOPMENT.md](DEVELOPMENT.md)

## 📖 文档

详细文档请查看 `docs/` 目录：

- [工作计划](docs/work-plan.md)
- [编辑器设计](docs/editor-design.md)
- [核心架构](docs/core-architecture.md)
- [API 文档](docs/api-reference.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
# qaq
