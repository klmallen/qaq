# QAQ 游戏引擎项目结构

## 📁 完整项目目录结构

```
qaq-game-engine/
├── 📄 README.md                    # 项目说明文档
├── 📄 package.json                 # 项目依赖配置
├── 📄 tsconfig.json                # TypeScript 配置
├── 📄 vite.config.ts               # Vite 构建配置
├── 📄 tailwind.config.js           # Tailwind CSS 配置
├── 📄 .eslintrc.js                 # ESLint 配置
├── 📄 .prettierrc                  # Prettier 配置
├── 📄 .gitignore                   # Git 忽略文件
│
├── 📁 docs/                        # 📚 项目文档
│   ├── 📄 work-plan.md             # 工作计划
│   ├── 📄 detailed-tasks.md        # 详细任务拆分
│   ├── 📄 editor-design.md         # 编辑器设计
│   ├── 📄 resource-system.md       # 资源系统设计
│   ├── 📄 workflow-diagrams.md     # 工作流程图
│   ├── 📄 project-structure.md     # 项目结构说明
│   ├── 📄 api-reference.md         # API 参考文档
│   └── 📄 development-guide.md     # 开发指南
│
├── 📁 src/                         # 🎯 源代码目录
│   ├── 📄 main.ts                  # 应用入口文件
│   ├── 📄 App.vue                  # 根组件
│   │
│   ├── 📁 components/              # 🧩 Vue 组件
│   │   ├── 📁 editor/              # 编辑器核心组件
│   │   │   ├── 📄 EditorLayout.vue         # 主编辑器布局
│   │   │   ├── 📄 EditorMenuBar.vue        # 菜单栏
│   │   │   ├── 📄 SceneTreeDock.vue        # 场景树面板
│   │   │   ├── 📄 InspectorDock.vue        # 属性检查器
│   │   │   ├── 📄 FileSystemDock.vue       # 文件系统面板
│   │   │   ├── 📄 EditorViewport3D.vue     # 3D视口
│   │   │   ├── 📄 EditorViewport2D.vue     # 2D视口
│   │   │   ├── 📄 ViewportToolbar.vue      # 视口工具栏
│   │   │   ├── 📄 BottomPanelDock.vue      # 底部面板
│   │   │   └── 📄 ResizablePanel.vue       # 可调整大小面板
│   │   │
│   │   ├── 📁 dialogs/             # 对话框组件
│   │   │   ├── 📄 CreateProjectDialog.vue  # 创建项目对话框
│   │   │   ├── 📄 ImportProjectDialog.vue  # 导入项目对话框
│   │   │   ├── 📄 CreateNodeDialog.vue     # 创建节点对话框
│   │   │   ├── 📄 ProjectSettingsDialog.vue # 项目设置对话框
│   │   │   └── 📄 AboutDialog.vue          # 关于对话框
│   │   │
│   │   ├── 📁 property-editors/    # 属性编辑器组件
│   │   │   ├── 📄 BoolEditor.vue           # 布尔值编辑器
│   │   │   ├── 📄 NumberEditor.vue         # 数字编辑器
│   │   │   ├── 📄 StringEditor.vue         # 字符串编辑器
│   │   │   ├── 📄 Vector2Editor.vue        # Vector2编辑器
│   │   │   ├── 📄 Vector3Editor.vue        # Vector3编辑器
│   │   │   ├── 📄 ColorEditor.vue          # 颜色编辑器
│   │   │   ├── 📄 ResourceEditor.vue       # 资源编辑器
│   │   │   └── 📄 EnumEditor.vue           # 枚举编辑器
│   │   │
│   │   ├── 📁 ui/                  # 通用UI组件
│   │   │   ├── 📄 IconButton.vue           # 图标按钮
│   │   │   ├── 📄 TreeView.vue             # 树形视图
│   │   │   ├── 📄 FileTree.vue             # 文件树
│   │   │   ├── 📄 PropertyList.vue         # 属性列表
│   │   │   ├── 📄 TabContainer.vue         # 标签容器
│   │   │   └── 📄 SplitContainer.vue       # 分割容器
│   │   │
│   │   └── 📁 icons/               # 图标组件
│   │       ├── 📄 QaqIcon.vue              # 统一图标组件 (基于Iconify)
│   │       ├── 📄 NodeIcon.vue             # 节点图标组件
│   │       ├── 📄 FileIcon.vue             # 文件图标组件
│   │       └── 📄 IconPickerDialog.vue     # 图标选择器对话框
│   │
│   ├── 📁 stores/                  # 🗄️ Pinia 状态管理
│   │   ├── 📄 index.ts                     # Store 入口
│   │   ├── 📄 projectManager.ts            # 项目管理状态
│   │   ├── 📄 editorState.ts               # 编辑器状态
│   │   ├── 📄 sceneManager.ts              # 场景管理状态
│   │   ├── 📄 resourceManager.ts           # 资源管理状态
│   │   ├── 📄 selectionManager.ts          # 选择管理状态
│   │   └── 📄 undoRedoManager.ts           # 撤销重做状态
│   │
│   ├── 📁 core/                    # 🎮 核心游戏引擎
│   │   ├── 📁 object/              # 基础对象系统
│   │   │   ├── 📄 QaqObject.ts             # 基础对象类
│   │   │   ├── 📄 Signal.ts                # 信号系统
│   │   │   ├── 📄 Property.ts              # 属性系统
│   │   │   └── 📄 ObjectRegistry.ts        # 对象注册表
│   │   │
│   │   ├── 📁 nodes/               # 节点系统
│   │   │   ├── 📄 Node.ts                  # 基础节点类
│   │   │   ├── 📄 Node2D.ts                # 2D节点类
│   │   │   ├── 📄 Node3D.ts                # 3D节点类
│   │   │   ├── 📄 Control.ts               # UI控件基类
│   │   │   ├── 📄 CanvasItem.ts            # 2D渲染基类
│   │   │   ├── 📄 NodeRegistry.ts          # 节点注册表
│   │   │   └── 📁 builtin/         # 内置节点类型
│   │   │       ├── 📄 Label.ts             # 标签控件
│   │   │       ├── 📄 Button.ts            # 按钮控件
│   │   │       ├── 📄 Sprite2D.ts          # 2D精灵
│   │   │       ├── 📄 MeshInstance3D.ts    # 3D网格实例
│   │   │       ├── 📄 Camera3D.ts          # 3D相机
│   │   │       └── 📄 DirectionalLight3D.ts # 3D方向光
│   │   │
│   │   ├── 📁 scenes/              # 场景系统
│   │   │   ├── 📄 SceneTree.ts             # 场景树管理器
│   │   │   ├── 📄 PackedScene.ts           # 打包场景资源
│   │   │   ├── 📄 SceneState.ts            # 场景状态
│   │   │   └── 📄 SceneLoader.ts           # 场景加载器
│   │   │
│   │   ├── 📁 resources/           # 资源系统
│   │   │   ├── 📄 Resource.ts              # 基础资源类
│   │   │   ├── 📄 ResourceManager.ts       # 资源管理器
│   │   │   ├── 📄 ResourceLoader.ts        # 资源加载器
│   │   │   ├── 📄 ResourceCache.ts         # 资源缓存
│   │   │   ├── 📄 ResourceImporter.ts      # 资源导入器
│   │   │   └── 📁 types/           # 资源类型
│   │   │       ├── 📄 Texture.ts           # 纹理资源
│   │   │       ├── 📄 Mesh.ts              # 网格资源
│   │   │       ├── 📄 AudioStream.ts       # 音频流资源
│   │   │       ├── 📄 Font.ts              # 字体资源
│   │   │       └── 📄 Material.ts          # 材质资源
│   │   │
│   │   ├── 📁 math/                # 数学库
│   │   │   ├── 📄 Vector2.ts               # 2D向量
│   │   │   ├── 📄 Vector3.ts               # 3D向量
│   │   │   ├── 📄 Transform2D.ts           # 2D变换
│   │   │   ├── 📄 Transform3D.ts           # 3D变换
│   │   │   ├── 📄 Rect2.ts                 # 2D矩形
│   │   │   ├── 📄 AABB.ts                  # 3D包围盒
│   │   │   └── 📄 Color.ts                 # 颜色类
│   │   │
│   │   ├── 📁 input/               # 输入系统
│   │   │   ├── 📄 InputManager.ts          # 输入管理器
│   │   │   ├── 📄 InputEvent.ts            # 输入事件
│   │   │   └── 📄 InputMap.ts              # 输入映射
│   │   │
│   │   └── 📁 rendering/           # 渲染系统
│   │       ├── 📄 RenderingServer.ts       # 渲染服务器
│   │       ├── 📄 Viewport.ts              # 视口
│   │       ├── 📄 Camera.ts                # 相机
│   │       └── 📄 RenderingDevice.ts       # 渲染设备
│   │
│   ├── 📁 editor/                  # 🛠️ 编辑器专用代码
│   │   ├── 📁 tools/               # 编辑器工具
│   │   │   ├── 📄 SelectTool.ts            # 选择工具
│   │   │   ├── 📄 MoveTool.ts              # 移动工具
│   │   │   ├── 📄 RotateTool.ts            # 旋转工具
│   │   │   ├── 📄 ScaleTool.ts             # 缩放工具
│   │   │   └── 📄 ToolManager.ts           # 工具管理器
│   │   │
│   │   ├── 📁 gizmos/              # 变换手柄
│   │   │   ├── 📄 Gizmo.ts                 # 基础手柄类
│   │   │   ├── 📄 MoveGizmo.ts             # 移动手柄
│   │   │   ├── 📄 RotateGizmo.ts           # 旋转手柄
│   │   │   └── 📄 ScaleGizmo.ts            # 缩放手柄
│   │   │
│   │   ├── 📁 inspectors/          # 检查器插件
│   │   │   ├── 📄 NodeInspector.ts         # 节点检查器
│   │   │   ├── 📄 ResourceInspector.ts     # 资源检查器
│   │   │   └── 📄 SceneInspector.ts        # 场景检查器
│   │   │
│   │   └── 📁 importers/           # 导入器插件
│   │       ├── 📄 ImageImporter.ts         # 图片导入器
│   │       ├── 📄 ModelImporter.ts         # 模型导入器
│   │       ├── 📄 AudioImporter.ts         # 音频导入器
│   │       └── 📄 FontImporter.ts          # 字体导入器
│   │
│   ├── 📁 utils/                   # 🔧 工具函数
│   │   ├── 📄 fileSystem.ts                # 文件系统工具
│   │   ├── 📄 pathUtils.ts                 # 路径工具
│   │   ├── 📄 stringUtils.ts               # 字符串工具
│   │   ├── 📄 mathUtils.ts                 # 数学工具
│   │   ├── 📄 colorUtils.ts                # 颜色工具
│   │   ├── 📄 debounce.ts                  # 防抖函数
│   │   ├── 📄 throttle.ts                  # 节流函数
│   │   ├── 📄 eventBus.ts                  # 事件总线
│   │   └── 📄 iconCache.ts                 # 图标缓存工具
│   │
│   ├── 📁 types/                   # 📝 TypeScript 类型定义
│   │   ├── 📄 index.ts                     # 类型入口
│   │   ├── 📄 project.ts                   # 项目相关类型
│   │   ├── 📄 editor.ts                    # 编辑器相关类型
│   │   ├── 📄 nodes.ts                     # 节点相关类型
│   │   ├── 📄 resources.ts                 # 资源相关类型
│   │   ├── 📄 events.ts                    # 事件相关类型
│   │   └── 📄 global.d.ts                  # 全局类型声明
│   │
│   ├── 📁 assets/                  # 🎨 静态资源
│   │   ├── 📁 icons/               # 自定义图标资源 (SVG)
│   │   │   ├── 📄 qaq-custom.json          # 自定义图标集合定义
│   │   │   ├── 📁 nodes/           # 节点自定义图标
│   │   │   ├── 📁 files/           # 文件自定义图标
│   │   │   ├── 📁 tools/           # 工具自定义图标
│   │   │   └── 📁 brand/           # 品牌图标 (Logo等)
│   │   ├── 📁 images/              # 图片资源
│   │   ├── 📁 fonts/               # 字体资源
│   │   └── 📁 styles/              # 样式文件
│   │       ├── 📄 main.css                 # 主样式文件
│   │       ├── 📄 editor.css               # 编辑器样式
│   │       ├── 📄 themes.css               # 主题样式
│   │       └── 📄 icons.css                # 图标样式
│   │
│   └── 📁 composables/             # 🎣 Vue 组合式函数
│       ├── 📄 useProject.ts                # 项目管理组合函数
│       ├── 📄 useEditor.ts                 # 编辑器状态组合函数
│       ├── 📄 useSelection.ts              # 选择管理组合函数
│       ├── 📄 useViewport.ts               # 视口管理组合函数
│       ├── 📄 useFileSystem.ts             # 文件系统组合函数
│       ├── 📄 useTheme.ts                  # 主题管理组合函数
│       └── 📄 useIcons.ts                  # 图标管理组合函数
│
├── 📁 public/                      # 🌐 公共静态资源
│   ├── 📄 favicon.ico                      # 网站图标
│   ├── 📄 index.html                       # HTML 模板
│   └── 📁 assets/                          # 公共资源
│
├── 📁 tests/                       # 🧪 测试文件
│   ├── 📁 unit/                    # 单元测试
│   │   ├── 📄 core/                        # 核心系统测试
│   │   ├── 📄 components/                  # 组件测试
│   │   └── 📄 utils/                       # 工具函数测试
│   ├── 📁 integration/             # 集成测试
│   └── 📁 e2e/                     # 端到端测试
│
├── 📁 tools/                       # 🔨 开发工具
│   ├── 📄 build.js                         # 构建脚本
│   ├── 📄 dev-server.js                    # 开发服务器
│   └── 📄 generate-icons.js                # 图标生成脚本
│
└── 📁 examples/                    # 📚 示例项目
    ├── 📁 hello-world/             # Hello World 示例
    ├── 📁 2d-platformer/           # 2D 平台游戏示例
    └── 📁 3d-scene/                # 3D 场景示例
```

## 📋 关键文件说明

### 配置文件

#### package.json
```json
{
  "name": "qaq-game-engine",
  "version": "0.1.0",
  "description": "Modern game engine editor built with Vue 3",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts",
    "format": "prettier --write ."
  },
  "dependencies": {
    "vue": "^3.4.0",
    "@nuxt/ui-pro": "^1.0.0",
    "@nuxt/icon": "^1.0.0",
    "pinia": "^2.1.0",
    "three": "^0.160.0",
    "@iconify/vue": "^4.1.0",
    "@iconify/json": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vue-tsc": "^1.8.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "unplugin-icons": "^0.18.0",
    "@iconify/tools": "^4.0.0"
  }
}
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/core/*": ["src/core/*"],
      "@/stores/*": ["src/stores/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 核心入口文件

#### src/main.ts
```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles/main.css'

// 创建应用实例
const app = createApp(App)

// 安装 Pinia
app.use(createPinia())

// 挂载应用
app.mount('#app')
```

#### src/App.vue
```vue
<template>
  <div id="app" class="qaq-editor">
    <EditorLayout v-if="hasProject" />
    <WelcomeScreen v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useProjectManager } from '@/stores/projectManager'
import EditorLayout from '@/components/editor/EditorLayout.vue'
import WelcomeScreen from '@/components/WelcomeScreen.vue'

const projectManager = useProjectManager()
const hasProject = computed(() => !!projectManager.currentProject)
</script>
```

## 🚀 开发流程

### 1. 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd qaq-game-engine

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 开发规范
- **代码风格**: 使用 ESLint + Prettier
- **提交规范**: 使用 Conventional Commits
- **分支策略**: Git Flow
- **测试要求**: 单元测试覆盖率 > 80%

### 3. 构建部署
```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 运行测试
npm run test

# 代码检查
npm run lint
```

这个项目结构提供了完整的开发框架，支持从核心引擎到编辑器界面的全栈开发，具有良好的可维护性和扩展性。
