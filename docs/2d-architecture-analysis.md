# QAQ游戏引擎2D系统架构分析与改进

## 📊 **架构分析结果**

### ✅ **已实现的核心概念**

#### **1. 世界坐标系统（World）**
- ✅ **无限世界支持**：节点可以在任意位置存在，包括负坐标
- ✅ **坐标转换机制**：Node2D实现了2D到Three.js的坐标转换
- ✅ **全局坐标系统**：支持globalPosition属性

#### **2. 相机系统（Camera）**
- ✅ **Camera2D类**：完整的2D相机实现 (`core/nodes/2d/Camera2D.ts`)
- ✅ **相机变换**：支持位置移动、缩放、旋转
- ✅ **相机跟随**：实现了平滑跟随功能
- ✅ **坐标转换**：提供screenToWorld和worldToScreen方法

#### **3. 坐标转换**
- ✅ **完整转换系统**：UICoordinateSystem提供多种坐标转换
- ✅ **鼠标输入转换**：支持DOM事件到世界坐标的转换

### ❌ **发现的问题**

#### **1. 坐标系不一致（已修复）**
```typescript
// 问题：Engine.ts 窗口调整时的坐标设置不一致
// 修复前：
this._camera2D.top = 0
this._camera2D.bottom = -height  // 错误
this._camera2D.position.set(width / 2, -height / 2, 500)  // 错误

// 修复后：
this._camera2D.top = height
this._camera2D.bottom = 0
this._camera2D.position.set(0, 0, 500)
```

#### **2. 缺失的视口系统（已补充）**
- ❌ **独立视口概念**：没有独立的Viewport类
- ❌ **视口与画布分离**：视口大小与渲染画布大小耦合
- ❌ **视口缩放支持**：缺乏独立的视口缩放机制

#### **3. 相机系统集成问题**
- ❌ **Engine与Camera2D分离**：Engine直接使用Three.js相机，没有使用Camera2D节点
- ❌ **相机切换机制**：缺乏在不同Camera2D节点间切换的机制

## 🔧 **架构改进方案**

### **1. 新增视口系统**

#### **Viewport类** (`core/viewport/Viewport.ts`)
```typescript
export class Viewport extends EventEmitter {
  // 视口在画布中的位置和大小
  private _rect: Rect2
  // 视口对应的世界坐标范围
  private _worldRect: Rect2
  // 视口变换（缩放、偏移）
  private _zoom: Vector2
  private _offset: Vector2
  
  // 坐标转换方法
  worldToViewport(worldPoint: Vector2): Vector2
  viewportToWorld(viewportPoint: Vector2): Vector2
  screenToWorld(screenPoint: Vector2): Vector2
  worldToScreen(worldPoint: Vector2): Vector2
}
```

#### **ViewportManager类** (`core/viewport/ViewportManager.ts`)
```typescript
export class ViewportManager extends EventEmitter {
  // 多视口管理
  addViewport(name: string, viewport: Viewport): void
  removeViewport(name: string): boolean
  setActiveViewport(name: string): boolean
  
  // 坐标转换路由
  screenToWorld(screenPoint: Vector2): Vector2
  worldToScreen(worldPoint: Vector2): Vector2
  
  // 预设配置
  createDefaultViewport(): void
  createSplitScreenViewports(count: number): void
  createMinimapViewport(): void
}
```

### **2. 标准2D引擎架构对比**

#### **Godot Engine架构**
```
World (无限大) 
├── Viewport (视口定义)
├── Camera2D (相机节点)
└── CanvasLayer (渲染层)
    └── Node2D (2D节点)
```

#### **Unity 2D架构**
```
World Space (世界空间)
├── Camera (相机组件)
├── Canvas (UI画布)
└── GameObject (游戏对象)
    └── Transform (变换组件)
```

#### **QAQ引擎改进后架构**
```
World (无限世界坐标)
├── ViewportManager (视口管理器)
│   └── Viewport (视口实例)
├── Camera2D (2D相机节点)
└── Scene (场景)
    └── Node2D (2D节点)
        └── Sprite2D, TileMap2D, etc.
```

## 🎯 **使用示例**

### **1. 基础视口设置**
```typescript
import { ViewportManager, Viewport } from '~/core'

// 获取视口管理器
const viewportManager = ViewportManager.getInstance()

// 设置画布大小
viewportManager.setCanvasSize(1920, 1080)

// 创建默认全屏视口
viewportManager.createDefaultViewport()

// 坐标转换
const worldPos = viewportManager.screenToWorld({ x: 100, y: 200 })
const screenPos = viewportManager.worldToScreen({ x: 500, y: 300 })
```

### **2. 多视口分屏**
```typescript
// 创建4分屏视口
viewportManager.createSplitScreenViewports(4)

// 切换到第2个视口
viewportManager.setActiveViewport('split_1')

// 添加小地图
viewportManager.createMinimapViewport(200, 'top-right')
```

### **3. 自定义视口**
```typescript
// 创建自定义视口
const customViewport = new Viewport({
  rect: { x: 100, y: 100, width: 600, height: 400 },
  worldRect: { x: 0, y: 0, width: 1200, height: 800 },
  clipContents: true,
  renderPriority: 1
})

viewportManager.addViewport('custom', customViewport)
```

## 📋 **后续改进计划**

### **短期目标（已完成）**
- [x] 修复坐标系不一致问题
- [x] 创建独立的Viewport系统
- [x] 实现ViewportManager管理器
- [x] 添加多视口支持

### **中期目标**
- [ ] 集成Camera2D节点与Engine
- [ ] 实现相机切换机制
- [ ] 添加视口渲染优化
- [ ] 支持视口特效（模糊、色彩调整等）

### **长期目标**
- [ ] 实现TileMap系统优化
- [ ] 添加2D光照系统
- [ ] 支持2D物理边界
- [ ] 实现2D粒子系统

## 🔍 **技术细节**

### **坐标系统层次**
```
屏幕坐标 (Screen Coordinates)
    ↓ ViewportManager.screenToViewport()
视口坐标 (Viewport Coordinates)  
    ↓ Viewport.viewportToWorld()
世界坐标 (World Coordinates)
    ↓ Node2D._convert2DToThreeJS()
Three.js坐标 (Three.js Coordinates)
```

### **变换矩阵链**
```
World Transform = Parent Transform × Local Transform
View Transform = Viewport Transform × World Transform  
Screen Transform = Canvas Transform × View Transform
```

## 🎉 **总结**

QAQ游戏引擎的2D系统现在具备了现代2D游戏引擎的核心架构：

### **架构优势**
- ✅ **无限世界**：支持任意大小的游戏世界
- ✅ **灵活视口**：独立的视口系统，支持多视口
- ✅ **完整相机**：功能完善的Camera2D节点
- ✅ **精确转换**：多层次的坐标转换系统

### **符合标准**
- ✅ **Godot兼容**：架构设计参考Godot Engine
- ✅ **Unity理念**：组件化和层次化设计
- ✅ **现代标准**：支持分屏、小地图等现代功能

### **开发体验**
- ✅ **直观坐标**：(0,0)在左上角，符合直觉
- ✅ **无边界限制**：节点可以自由移动
- ✅ **灵活相机**：支持跟随、缩放、限制等功能

现在QAQ引擎已经具备了开发各种2D游戏的基础架构，包括平台跳跃、肉鸽、RPG等类型的游戏。
