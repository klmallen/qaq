# QAQ游戏引擎文档站点

这是QAQ游戏引擎的官方中文文档站点，基于VitePress构建，采用黑绿配色主题。

## 特性

- 🌟 **中文文档**：完整的中文API文档和使用指南
- 🎨 **黑绿主题**：专为QAQ引擎设计的深色主题
- 📱 **响应式设计**：支持桌面和移动设备
- 🔍 **本地搜索**：内置搜索功能
- 📖 **完整覆盖**：涵盖所有核心模块和节点类型
- 🎯 **实用导向**：专注于引擎使用方法和Node文档

## 文档结构

```
docs/
├── guide/                    # 使用指南
│   ├── getting-started.md    # 快速开始
│   ├── engine.md            # 引擎核心
│   ├── nodes/               # 节点系统
│   │   ├── node.md          # 基础节点
│   │   └── node2d.md        # 2D节点
│   └── scripting/           # 脚本系统
│       └── basics.md        # 脚本基础
├── api/                     # API文档
│   ├── core/                # 核心API
│   │   ├── engine.md        # Engine API
│   │   ├── node.md          # Node API
│   │   └── scene.md         # Scene API
│   ├── nodes/               # 节点API
│   │   ├── sprite2d.md      # Sprite2D API
│   │   ├── button2d.md      # Button2D API
│   │   └── ...              # 其他节点
│   └── scripting/           # 脚本API
│       ├── script-base.md   # ScriptBase API
│       └── script-manager.md # ScriptManager API
└── .vitepress/              # VitePress配置
    ├── config.ts            # 站点配置
    ├── theme/               # 自定义主题
    └── components/          # 自定义组件
```

## 快速开始

### 安装依赖

```bash
cd qaq-game-engine/docs-site
npm install
```

### 开发模式

```bash
npm run dev
```

访问 `http://localhost:5173` 查看文档站点。

### 构建生产版本

```bash
npm run build
```

构建后的文件在 `docs/.vitepress/dist` 目录中。

### 预览生产版本

```bash
npm run preview
```

## 自定义主题

文档站点使用了专为QAQ引擎设计的黑绿主题：

### 颜色变量

```css
:root {
  /* QAQ品牌绿色调色板 */
  --qaq-green-400: #4ade80;
  --qaq-green-500: #22c55e;
  --qaq-green-600: #16a34a;

  /* 背景色 - 纯黑主题 */
  --vp-c-bg: #000000;
  --vp-c-bg-alt: #0a0a0a;
  --vp-c-bg-elv: #111111;

  /* 品牌色 */
  --vp-c-brand-1: var(--qaq-green-400);
  --vp-c-brand-2: var(--qaq-green-500);
  --vp-c-brand-3: var(--qaq-green-600);
}
```

### 自定义组件

文档站点包含以下自定义组件：

- **QaqLogo**: QAQ引擎Logo组件
- **CodeExample**: 代码示例组件，支持语法高亮和复制
- **ApiReference**: API参考组件，格式化显示API信息
- **NodeDiagram**: 节点层次结构图组件

## 内容编写指南

### Markdown扩展

支持VitePress的所有Markdown扩展：

```markdown
::: tip 提示
这是一个提示框
:::

::: warning 警告
这是一个警告框
:::

::: danger 危险
这是一个危险提示框
:::
```

### 代码块

支持语法高亮：

```typescript
import { Engine, Scene, Node2D } from 'qaq-game-engine'

const engine = Engine.getInstance()
```

### 自定义组件使用

```markdown
<!-- Logo组件 -->
<QaqLogo :animation="true" />

<!-- 代码示例组件 -->
<CodeExample
  title="基础示例"
  :code="`console.log('Hello QAQ')`"
  language="typescript"
  description="这是一个简单的示例"
/>

<!-- API参考组件 -->
<ApiReference
  title="initialize()"
  description="初始化引擎"
  signature="initialize(config: EngineConfig): Promise<boolean>"
  :parameters="[
    { name: 'config', type: 'EngineConfig', required: true, description: '引擎配置' }
  ]"
  :returns="{ type: 'Promise<boolean>', description: '是否初始化成功' }"
/>

<!-- 节点图组件 -->
<NodeDiagram
  title="节点层次结构"
  :nodes="[
    { name: 'Node', level: 0, description: '基础节点' },
    { name: 'Node2D', level: 1, description: '2D节点' },
    { name: 'Sprite2D', level: 2, description: '2D精灵' }
  ]"
/>
```

## 部署

### GitHub Pages

1. 在GitHub仓库设置中启用GitHub Pages
2. 选择GitHub Actions作为源
3. 创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy VitePress site to Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: docs-site/package-lock.json
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Install dependencies
        run: npm ci
        working-directory: docs-site
      - name: Build with VitePress
        run: npm run build
        working-directory: docs-site
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs-site/docs/.vitepress/dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    needs: build
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### Vercel

1. 连接GitHub仓库到Vercel
2. 设置构建配置：
   - Build Command: `cd docs-site && npm run build`
   - Output Directory: `docs-site/docs/.vitepress/dist`
   - Install Command: `cd docs-site && npm install`

### Netlify

1. 连接GitHub仓库到Netlify
2. 设置构建配置：
   - Build command: `cd docs-site && npm run build`
   - Publish directory: `docs-site/docs/.vitepress/dist`

## 贡献指南

### 添加新文档

1. 在相应目录下创建Markdown文件
2. 更新 `docs/.vitepress/config.ts` 中的导航和侧边栏配置
3. 遵循现有的文档结构和风格

### 文档规范

- 使用中文编写
- 提供完整的代码示例
- 包含参数说明和返回值
- 添加实际使用场景的示例
- 保持API文档的准确性

### 主题定制

主题文件位于 `docs/.vitepress/theme/` 目录：

- `index.ts`: 主题入口文件
- `custom.css`: 自定义样式
- `components/`: 自定义组件

## 技术栈

- **VitePress**: 静态站点生成器
- **Vue 3**: 组件框架
- **TypeScript**: 类型支持
- **Three.js**: 3D图形库（用于Logo动画）

## 已完成的文档

### 📋 **文档完成情况**

1. **引擎核心**
   - Engine 引擎类完整API
   - 初始化、渲染控制、场景管理
   - 游戏模式控制、事件系统

2. **节点系统**
   - Node 基础节点完整API
   - Node2D 2D节点完整API
   - Node3D 3D节点完整API
   - 层次结构、生命周期、脚本系统

3. **2D节点**
   - Sprite2D 精灵节点完整API
   - Button2D 按钮节点完整API
   - 纹理管理、交互系统、样式控制

4. **3D节点**
   - Node3D 3D基础节点完整API
   - MeshInstance3D 网格渲染节点完整API
   - Camera3D 3D相机节点完整API
   - Light3D 光源系统完整API（方向光、点光源、聚光灯）

5. **脚本系统**
   - ScriptBase 脚本基类完整API
   - 生命周期、节点访问、工具方法
   - 信号系统、定时器、协程

### 🎯 **文档特色**

- **完整的中文文档**：所有内容都是中文，便于中文开发者使用
- **黑绿主题设计**：专为QAQ引擎设计的深色主题
- **实用导向**：专注于引擎使用方法和Node文档
- **丰富的示例**：每个API都有完整的代码示例
- **自定义组件**：QaqLogo、CodeExample、ApiReference、NodeDiagram等

## 许可证

本文档站点遵循MIT许可证。

---

如有问题或建议，请提交Issue或Pull Request。
