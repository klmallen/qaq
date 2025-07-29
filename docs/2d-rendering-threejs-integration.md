# QAQ游戏引擎 - 2D节点与Three.js渲染集成技术方案

## 目录
1. [技术挑战](#1-技术挑战)
2. [解决方案概述](#2-解决方案概述)
3. [Canvas纹理渲染方案](#3-canvas纹理渲染方案)
4. [坐标系转换](#4-坐标系转换)
5. [性能优化策略](#5-性能优化策略)
6. [实现细节](#6-实现细节)
7. [使用示例](#7-使用示例)

---

## 1. 技术挑战

### 1.1 核心问题
在Web环境中，QAQ游戏引擎需要同时支持：
- **3D渲染**: 使用Three.js进行3D场景渲染
- **2D UI渲染**: 支持复杂的2D UI界面和2D游戏对象
- **统一管理**: 在同一个场景树中管理2D和3D节点

### 1.2 技术难点
- **渲染管道差异**: Three.js专注3D，缺乏高效的2D UI渲染
- **坐标系不同**: 2D UI使用屏幕坐标，3D使用世界坐标
- **层级管理**: 2D UI需要精确的Z-order控制
- **性能要求**: 2D UI更新频繁，需要高效渲染
- **事件处理**: 2D UI需要精确的鼠标/触摸事件处理

---

## 2. 解决方案概述

### 2.1 混合渲染架构
```
QAQ游戏引擎渲染架构
├── Three.js 3D渲染层
│   ├── 3D场景对象 (Node3D, MeshInstance3D等)
│   └── 2D纹理平面 (Canvas纹理映射)
├── Canvas 2D渲染层
│   ├── UI控件渲染 (Control及其子类)
│   └── 2D游戏对象 (Sprite2D等)
└── 事件处理层
    ├── 3D射线检测
    └── 2D像素精确检测
```

### 2.2 核心技术方案
1. **Canvas纹理映射**: 将2D Canvas渲染结果作为Three.js纹理
2. **动态纹理更新**: 实时更新Canvas内容到GPU纹理
3. **坐标系转换**: 自动处理2D屏幕坐标到3D世界坐标的转换
4. **分层渲染**: 不同Z-index的2D节点使用不同的渲染层
5. **事件映射**: 将3D场景中的鼠标事件映射回2D坐标系

---

## 3. Canvas纹理渲染方案

### 3.1 基本原理
```typescript
// 1. 创建Canvas元素
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')

// 2. 在Canvas上绘制2D内容
ctx.fillStyle = '#4CAF50'
ctx.fillRect(0, 0, 100, 50)
ctx.fillStyle = '#FFFFFF'
ctx.fillText('Button', 50, 25)

// 3. 创建Three.js纹理
const texture = new THREE.CanvasTexture(canvas)
texture.needsUpdate = true

// 4. 创建3D平面几何体
const geometry = new THREE.PlaneGeometry(100, 50)
const material = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  alphaTest: 0.1
})

// 5. 创建网格并添加到3D场景
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
```

### 3.2 Control节点实现
```typescript
class Control extends CanvasItem {
  private create2DRenderContext(): void {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const size = this.size
    
    // 设置Canvas尺寸
    canvas.width = size.x
    canvas.height = size.y
    
    // 创建Three.js纹理和材质
    const texture = new THREE.CanvasTexture(canvas)
    const geometry = new THREE.PlaneGeometry(size.x, size.y)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.1
    })
    
    // 创建网格对象
    const mesh = new THREE.Mesh(geometry, material)
    
    // 存储渲染上下文
    this._renderContext = { canvas, ctx, texture, mesh }
  }
  
  protected render2D(ctx: CanvasRenderingContext2D): void {
    // 子类重写此方法实现具体绘制
    const size = this.size
    ctx.fillStyle = '#F0F0F0'
    ctx.fillRect(0, 0, size.x, size.y)
  }
}
```

### 3.3 动态更新机制
```typescript
private update2DRender(): void {
  const { canvas, context, texture, mesh } = this._renderContext
  
  // 清空Canvas
  context.clearRect(0, 0, canvas.width, canvas.height)
  
  // 重新绘制内容
  this.render2D(context)
  
  // 通知Three.js更新纹理
  texture.needsUpdate = true
  
  // 更新3D位置
  const globalPos = this.getGlobalPosition()
  mesh.position.set(globalPos.x, -globalPos.y, 0.1)
}
```

---

## 4. 坐标系转换

### 4.1 坐标系差异
| 坐标系 | 原点位置 | Y轴方向 | 单位 |
|--------|----------|---------|------|
| 2D UI | 左上角 | 向下 | 像素 |
| Three.js | 中心 | 向上 | 世界单位 |

### 4.2 转换算法
```typescript
// 2D UI坐标 → Three.js世界坐标
function ui2DToWorld3D(uiPos: Vector2, uiSize: Vector2): Vector3 {
  return {
    x: uiPos.x + uiSize.x / 2,  // 转换为中心点
    y: -(uiPos.y + uiSize.y / 2), // Y轴翻转
    z: 0.1  // 稍微向前，避免Z-fighting
  }
}

// Three.js世界坐标 → 2D UI坐标
function world3DToUI2D(worldPos: Vector3, uiSize: Vector2): Vector2 {
  return {
    x: worldPos.x - uiSize.x / 2,
    y: -worldPos.y - uiSize.y / 2
  }
}
```

### 4.3 自动坐标转换
```typescript
class Control extends CanvasItem {
  private updateMeshPosition(): void {
    const globalPos = this.getGlobalPosition()
    const size = this.size
    const mesh = this._renderContext.mesh
    
    // 自动转换坐标系
    mesh.position.set(
      globalPos.x + size.x / 2,    // 转换为中心点
      -(globalPos.y + size.y / 2), // Y轴翻转
      this.getEffectiveZIndex() * 0.001 // Z层级
    )
  }
}
```

---

## 5. 性能优化策略

### 5.1 纹理缓存和复用
```typescript
class TextureManager {
  private static textureCache = new Map<string, THREE.Texture>()
  
  static getOrCreateTexture(key: string, canvas: HTMLCanvasElement): THREE.Texture {
    if (!this.textureCache.has(key)) {
      const texture = new THREE.CanvasTexture(canvas)
      this.textureCache.set(key, texture)
    }
    return this.textureCache.get(key)!
  }
}
```

### 5.2 脏标记系统
```typescript
class Control extends CanvasItem {
  private _needsRedraw: boolean = false
  
  queueRedraw(): void {
    this._needsRedraw = true
  }
  
  public _process(delta: number): void {
    if (this._needsRedraw) {
      this.update2DRender()
      this._needsRedraw = false
    }
  }
}
```

### 5.3 批量渲染优化
```typescript
class UIRenderBatch {
  private static batches = new Map<number, Control[]>()
  
  static addToBatch(control: Control, zIndex: number): void {
    if (!this.batches.has(zIndex)) {
      this.batches.set(zIndex, [])
    }
    this.batches.get(zIndex)!.push(control)
  }
  
  static renderBatches(): void {
    // 按Z-index顺序渲染
    const sortedZIndices = Array.from(this.batches.keys()).sort()
    for (const zIndex of sortedZIndices) {
      const controls = this.batches.get(zIndex)!
      this.renderBatch(controls)
    }
  }
}
```

### 5.4 视口剔除
```typescript
class Control extends CanvasItem {
  isVisibleInViewport(camera: THREE.Camera): boolean {
    const mesh = this._renderContext.mesh
    if (!mesh) return false
    
    // 使用Three.js的视锥体剔除
    const frustum = new THREE.Frustum()
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustum.setFromProjectionMatrix(matrix)
    
    return frustum.intersectsObject(mesh)
  }
}
```

---

## 6. 实现细节

### 6.1 事件处理映射
```typescript
class UIEventHandler {
  static handleMouseEvent(event: MouseEvent, camera: THREE.Camera, scene: THREE.Scene): void {
    // 创建射线
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    raycaster.setFromCamera(mouse, camera)
    
    // 检测与UI网格的交集
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    for (const intersect of intersects) {
      const mesh = intersect.object
      const control = this.findControlByMesh(mesh)
      
      if (control) {
        // 转换为2D坐标
        const localPoint = this.worldToLocal(intersect.point, control)
        control.handleMouseEvent(event.type, localPoint)
        break
      }
    }
  }
}
```

### 6.2 多层渲染支持
```typescript
class LayeredUIRenderer {
  private layers: Map<number, THREE.Scene> = new Map()
  
  addControlToLayer(control: Control, layer: number): void {
    if (!this.layers.has(layer)) {
      this.layers.set(layer, new THREE.Scene())
    }
    
    const mesh = control.getRenderMesh()
    this.layers.get(layer)!.add(mesh)
  }
  
  render(renderer: THREE.WebGLRenderer, camera: THREE.Camera): void {
    // 按层级顺序渲染
    const sortedLayers = Array.from(this.layers.keys()).sort()
    
    for (const layerIndex of sortedLayers) {
      const scene = this.layers.get(layerIndex)!
      renderer.render(scene, camera)
    }
  }
}
```

---

## 7. 使用示例

### 7.1 创建2D UI界面
```typescript
import { Control, LayoutPreset } from '@qaq/engine-core'

// 创建根UI容器
const uiRoot = new Control('UIRoot')
uiRoot.setAnchorsPreset(LayoutPreset.FULL_RECT)

// 创建按钮
class Button extends Control {
  protected render2D(ctx: CanvasRenderingContext2D): void {
    const size = this.size
    
    // 绘制按钮背景
    ctx.fillStyle = '#4CAF50'
    ctx.fillRect(0, 0, size.x, size.y)
    
    // 绘制按钮文本
    ctx.fillStyle = '#FFFFFF'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Click Me', size.x / 2, size.y / 2)
  }
}

const button = new Button('MyButton')
button.setSize({ x: 120, y: 40 })
button.setPosition({ x: 100, y: 50 })
uiRoot.addChild(button)

// 添加到Three.js场景
const scene = new THREE.Scene()
const uiMesh = uiRoot.getRenderMesh()
scene.add(uiMesh)
```

### 7.2 响应式布局示例
```typescript
// 创建响应式面板
const panel = new Control('ResponsivePanel')
panel.anchorLeft = 0.2   // 左边距20%
panel.anchorTop = 0.1    // 上边距10%
panel.anchorRight = 0.8  // 右边距20%
panel.anchorBottom = 0.9 // 下边距10%

// 面板会自动适应父容器尺寸变化
uiRoot.addChild(panel)
```

### 7.3 事件处理示例
```typescript
button.connect('mouse_entered', () => {
  console.log('鼠标进入按钮')
})

button.connect('mouse_exited', () => {
  console.log('鼠标离开按钮')
})

button.connect('gui_input', (event) => {
  if (event.type === 'click') {
    console.log('按钮被点击')
  }
})
```

---

## 总结

通过Canvas纹理映射方案，QAQ游戏引擎成功解决了2D节点在Three.js中的渲染问题：

### ✅ 优势
- **完美集成**: 2D和3D内容在同一场景中无缝渲染
- **高性能**: 利用GPU加速的纹理渲染
- **灵活性**: 支持复杂的2D UI和游戏对象
- **兼容性**: 与现有Three.js生态系统完全兼容

### 🎯 应用场景
- **游戏UI**: HUD、菜单、对话框等
- **2D游戏**: 精灵、瓦片地图等
- **混合应用**: 3D场景中的2D元素
- **工具界面**: 编辑器、调试工具等

这个方案为QAQ游戏引擎提供了强大而灵活的2D渲染能力，使其能够支持从简单UI到复杂2D游戏的各种应用场景。
