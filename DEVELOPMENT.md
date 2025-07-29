# QAQ游戏引擎开发指南

QAQ游戏引擎支持两种开发模式，你可以根据需要选择最适合的开发环境。

## 🚀 开发模式概览

### 1. Vite模式 - TypeScript核心调试
**适用场景**: 引擎核心功能开发、TypeScript调试、性能优化

**特点**:
- ✅ 纯TypeScript环境，无Vue/Nuxt依赖
- ✅ 极快的热重载 (HMR)
- ✅ 专注引擎核心功能测试
- ✅ THREE.js集成调试
- ✅ 实时性能监控
- ✅ 现代化的调试界面

### 2. Nuxt模式 - 完整应用开发
**适用场景**: 完整游戏应用开发、UI界面设计、生产环境部署

**特点**:
- ✅ 完整的Vue.js应用框架
- ✅ SSR/SPA支持
- ✅ 组件化开发
- ✅ 路由管理
- ✅ 状态管理 (Pinia)
- ✅ 生产环境就绪

## 📋 快速开始

### 方式1: 使用npm脚本 (推荐)

```bash
# Vite模式 - TypeScript核心调试
npm run debug
# 或
npm run dev:vite

# Nuxt模式 - 完整应用开发
npm run dev:nuxt

# 纯HTML调试模式
npm run test:browser
```

### 方式2: 使用开发模式切换器

```bash
# 安装依赖
npm install

# Vite模式
node scripts/dev-mode.js vite

# Nuxt模式
node scripts/dev-mode.js nuxt

# Debug模式
node scripts/dev-mode.js debug

# 查看帮助
node scripts/dev-mode.js --help
```

### 方式3: 直接使用工具

```bash
# Vite模式
npx vite --config vite.config.ts

# Nuxt模式
npx nuxt dev
```

## 🔧 详细配置

### Vite模式配置

**端口和主机**:
```bash
# 自定义端口
npm run dev:vite -- --port 5174

# 自定义主机
npm run dev:vite -- --host 0.0.0.0
```

**配置文件**: `vite.config.ts`
**TypeScript配置**: `tsconfig.vite.json`
**入口文件**: `debug-vite/main.ts`
**HTML模板**: `debug-vite/index.html`

### Nuxt模式配置

**端口和主机**:
```bash
# 自定义端口
npm run dev:nuxt -- --port 3001

# 自定义主机
npm run dev:nuxt -- --host 0.0.0.0
```

**配置文件**: `nuxt.config.ts`
**TypeScript配置**: `tsconfig.json`
**页面目录**: `pages/`
**组件目录**: `components/`

## 📁 项目结构

```
qaq-game-engine/
├── core/                    # 引擎核心代码
│   ├── engine/             # 引擎主类
│   ├── nodes/              # 节点系统
│   ├── camera/             # 相机系统
│   └── ...
├── debug-vite/             # Vite模式文件
│   ├── index.html          # Vite入口HTML
│   ├── main.ts             # Vite入口TypeScript
│   └── styles/             # 样式文件
├── debug/                  # 纯HTML调试文件
│   ├── index.html          # 调试控制台
│   ├── camera-debug.html   # 3D相机调试
│   └── core-test.js        # 核心功能测试
├── pages/                  # Nuxt页面 (Nuxt模式)
├── components/             # Vue组件 (Nuxt模式)
├── vite.config.ts          # Vite配置
├── nuxt.config.ts          # Nuxt配置
└── scripts/                # 开发脚本
    └── dev-mode.js         # 模式切换器
```

## 🎯 使用场景指南

### 何时使用Vite模式

✅ **引擎核心开发**
```bash
npm run debug
# 访问 http://localhost:5173
```

✅ **TypeScript调试**
- 类型检查
- 接口设计
- 模块导入测试

✅ **性能优化**
- 实时FPS监控
- 内存使用分析
- 渲染性能测试

✅ **THREE.js集成**
- 3D场景调试
- 相机系统测试
- 材质和光照调试

### 何时使用Nuxt模式

✅ **完整应用开发**
```bash
npm run dev:nuxt
# 访问 http://localhost:3000
```

✅ **UI界面设计**
- Vue组件开发
- 响应式布局
- 用户交互设计

✅ **游戏逻辑实现**
- 游戏状态管理
- 路由导航
- 数据持久化

✅ **生产环境部署**
- SSR优化
- 构建优化
- SEO支持

## 🔄 模式切换

### 从Nuxt切换到Vite
```bash
# 停止Nuxt服务 (Ctrl+C)
# 启动Vite模式
npm run debug
```

### 从Vite切换到Nuxt
```bash
# 停止Vite服务 (Ctrl+C)
# 启动Nuxt模式
npm run dev:nuxt
```

### 同时运行两种模式
```bash
# 终端1: Vite模式
npm run dev:vite

# 终端2: Nuxt模式 (不同端口)
npm run dev:nuxt -- --port 3001
```

## 🧪 测试和调试

### Vite模式调试功能

**核心功能测试**:
- Engine单例模式测试
- Camera3D位置映射测试
- THREE.js同步验证
- 性能基准测试

**3D场景调试**:
- 轨道控制器 (鼠标拖拽、滚轮缩放)
- 实时相机状态监控
- 场景对象管理
- 光照和材质调试

**性能监控**:
- 实时FPS显示
- 内存使用统计
- 绘制调用次数
- 渲染性能分析

### Nuxt模式调试功能

**Vue开发工具**:
- 组件状态检查
- Pinia状态管理
- 路由调试
- 热重载

**网络调试**:
- API请求监控
- SSR渲染调试
- 静态资源优化

## 🛠️ 开发工具推荐

### VS Code扩展
- **Vite模式**:
  - TypeScript Importer
  - Error Lens
  - Thunder Client (API测试)

- **Nuxt模式**:
  - Vetur (Vue支持)
  - Nuxt TypeScript
  - Vue VSCode Snippets

### 浏览器工具
- **Chrome DevTools**: 性能分析、内存调试
- **Vue DevTools**: Vue组件调试 (Nuxt模式)
- **Three.js Inspector**: 3D场景调试

## 🚨 故障排除

### 常见问题

**1. Vite模式启动失败**
```bash
# 清理缓存
npm run clean:vite
npm install

# 检查端口占用
lsof -i :5173
```

**2. Nuxt模式启动失败**
```bash
# 清理Nuxt缓存
npm run clean:nuxt
npm install

# 重新生成类型
npm run postinstall
```

**3. TypeScript错误**
```bash
# 检查TypeScript配置
npx tsc --noEmit

# Vite模式类型检查
npx tsc --noEmit --project tsconfig.vite.json
```

**4. 依赖冲突**
```bash
# 完全重置
npm run clean:all
rm -rf node_modules package-lock.json
npm install
```

### 调试技巧

**1. 启用详细日志**
```bash
# Vite模式
DEBUG=vite:* npm run dev:vite

# Nuxt模式
NUXT_DEBUG=true npm run dev:nuxt
```

**2. 性能分析**
```bash
# 构建分析
npm run build:vite -- --analyze
npm run build:nuxt -- --analyze
```

**3. 内存监控**
```bash
# Node.js内存监控
NODE_OPTIONS="--max-old-space-size=4096" npm run dev:nuxt
```

## 📚 进阶使用

### 自定义Vite插件
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    // 自定义插件
    {
      name: 'qaq-engine-debug',
      configureServer(server) {
        // 自定义中间件
      }
    }
  ]
})
```

### 自定义Nuxt模块
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    // 自定义模块
    '~/modules/qaq-engine'
  ]
})
```

### 环境变量配置
```bash
# .env.local
VITE_DEBUG_MODE=true
NUXT_DEBUG_MODE=true
QAQ_ENGINE_LOG_LEVEL=debug
```

---

**选择建议**:
- 🚀 **开发引擎核心功能** → 使用Vite模式
- 🌐 **开发完整游戏应用** → 使用Nuxt模式
- 🔧 **快速原型测试** → 使用Debug模式

两种模式可以随时切换，选择最适合当前开发任务的模式即可！
