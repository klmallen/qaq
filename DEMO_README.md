# QAQ游戏引擎演示页面

这是QAQ游戏引擎的演示页面，展示了引擎的2D和3D核心功能。

## 🎯 演示内容

### 主页面 (`/`)
- 简洁的演示选择界面
- 两个主要演示入口：2D演示和3D演示
- 现代化的黑绿主题设计

### 2D演示 (`/demo-2d`)
**功能展示：**
- ✅ 2D精灵渲染
- ✅ WASD键盘控制
- ✅ 基础UI界面
- ✅ 2D渲染模式

**控制方式：**
- `W` - 向上移动
- `A` - 向左移动  
- `S` - 向下移动
- `D` - 向右移动

**技术实现：**
- 使用 `Sprite2D` 节点渲染精灵
- 使用 `icon.svg` 作为纹理（备用Canvas纹理）
- 自定义 `PlayerController` 脚本处理键盘输入
- 2D坐标系统和边界检测

### 3D演示 (`/demo-3d`)
**功能展示：**
- ✅ 3D模型加载
- ✅ 3D场景渲染
- ✅ 光照和阴影
- ✅ 3D渲染模式

**场景内容：**
- 🎭 3D角色模型（`saien.glb`）
- 💡 方向光照系统
- 📷 3D透视相机
- 🌍 3D环境（地面、装饰物体）

**技术实现：**
- 使用 `MeshInstance3D` 节点渲染3D模型
- 使用 `Camera3D` 控制视角
- 使用 `DirectionalLight3D` 提供光照
- 自定义 `ModelRotator` 脚本实现模型旋转
- 标准材质和阴影系统

## 🚀 快速开始

### 1. 检查演示环境
```bash
npm run test:demos
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问演示
- 主页：http://localhost:3000
- 2D演示：http://localhost:3000/demo-2d
- 3D演示：http://localhost:3000/demo-3d

## 📁 文件结构

```
qaq-game-engine/
├── pages/
│   ├── index.vue          # 主页面（演示选择）
│   ├── demo-2d.vue        # 2D演示页面
│   └── demo-3d.vue        # 3D演示页面
├── public/
│   ├── icon.svg           # 2D精灵纹理
│   └── saien.glb          # 3D角色模型
├── core/                  # QAQ引擎核心
│   ├── Engine.ts          # 引擎主类
│   ├── Scene.ts           # 场景管理
│   ├── nodes/             # 节点系统
│   └── scripting/         # 脚本系统
└── scripts/
    └── test-demos.js      # 演示测试脚本
```

## 🔧 技术架构

### 引擎核心
- **Engine**: 引擎主类，管理渲染和生命周期
- **Scene**: 场景管理，节点树结构
- **Node系统**: 层次化节点架构
  - `Node` - 基础节点
  - `Node2D` - 2D节点基类
  - `Node3D` - 3D节点基类
  - `Sprite2D` - 2D精灵节点
  - `MeshInstance3D` - 3D网格节点
  - `Camera3D` - 3D相机节点
  - `Light3D` - 3D光源节点

### 脚本系统
- **ScriptManager**: 脚本管理器
- **ScriptBase**: 脚本基类，提供生命周期方法
- 支持TypeScript脚本开发
- 完整的生命周期：`_ready()`, `_process()`, `_exit_tree()`

### 渲染系统
- 基于Three.js的现代渲染管道
- 支持2D/3D/混合渲染模式
- 材质系统：基础、标准、物理材质
- 光照系统：方向光、点光源、聚光灯
- 阴影映射支持

## 🎮 演示特色

### 2D演示亮点
1. **响应式控制**: 流畅的WASD键盘控制
2. **边界检测**: 精灵不会移出画布边界
3. **纹理加载**: 支持SVG纹理，带备用Canvas纹理
4. **脚本系统**: 展示完整的脚本生命周期

### 3D演示亮点
1. **模型加载**: 支持GLTF/GLB格式3D模型
2. **动态光照**: 实时光照和阴影效果
3. **材质系统**: 多种材质类型展示
4. **自动动画**: 模型自动旋转展示
5. **错误处理**: 模型加载失败时的备用方案

## 🛠️ 开发说明

### 添加新演示
1. 在 `pages/` 目录创建新的Vue页面
2. 导入QAQ引擎核心模块
3. 实现引擎初始化和场景构建
4. 添加到主页面的导航

### 自定义脚本
```typescript
import { ScriptBase } from '~/core'

export class MyScript extends ScriptBase {
  _ready(): void {
    // 初始化逻辑
  }
  
  _process(delta: number): void {
    // 每帧更新逻辑
  }
  
  _exit_tree(): void {
    // 清理逻辑
  }
}
```

### 材质创建
```typescript
const material = meshInstance.createMaterial(MaterialType.STANDARD, {
  color: 0xff0000,
  roughness: 0.5,
  metalness: 0.8
})
meshInstance.materials = [material]
```

## 🐛 故障排除

### 常见问题

1. **纹理加载失败**
   - 检查 `public/icon.svg` 文件是否存在
   - 演示会自动使用Canvas备用纹理

2. **3D模型加载失败**
   - 检查 `public/saien.glb` 文件是否存在
   - 演示会自动使用立方体几何体作为备用

3. **脚本错误**
   - 检查浏览器控制台的错误信息
   - 确保所有引擎模块正确导入

4. **渲染问题**
   - 检查WebGL支持
   - 确保引擎正确初始化

### 调试技巧
- 打开浏览器开发者工具查看控制台日志
- 使用 `npm run test:demos` 检查文件完整性
- 检查网络面板确认资源加载状态

## 📚 相关文档

- [QAQ引擎文档](./docs-site/README.md)
- [引擎API参考](./docs-site/docs/api/)
- [节点系统指南](./docs-site/docs/guide/nodes/)
- [脚本开发指南](./docs-site/docs/guide/scripting/)

---

🎉 享受QAQ游戏引擎的强大功能！
