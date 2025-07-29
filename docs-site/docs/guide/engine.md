# Engine 引擎

Engine是QAQ游戏引擎的核心类，负责管理整个游戏的生命周期、渲染管道和系统协调。

## 基本概念

Engine采用单例模式设计，确保整个应用程序中只有一个引擎实例。它负责：

- **渲染管理**：2D/3D/混合渲染模式切换
- **场景管理**：场景的加载、切换和生命周期
- **系统协调**：各个子系统的初始化和协调
- **资源管理**：纹理、模型等资源的加载和缓存

## 获取引擎实例

```typescript
import { Engine } from 'qaq-game-engine'

// 获取单例实例
const engine = Engine.getInstance()
```

## 初始化引擎

在使用引擎之前，必须先进行初始化：

```typescript
// 基本初始化
await engine.initialize({
  container: document.getElementById('game-canvas'),
  width: 800,
  height: 600
})

// 完整配置初始化
await engine.initialize({
  container: document.getElementById('game-canvas'),
  width: 1920,
  height: 1080,
  antialias: true,           // 抗锯齿
  enableShadows: true,       // 启用阴影
  shadowMapSize: 2048,       // 阴影贴图大小
  pixelRatio: window.devicePixelRatio, // 像素比
  backgroundColor: 0x000000,  // 背景色
  alpha: false,              // 透明背景
  preserveDrawingBuffer: false // 保留绘图缓冲区
})
```

### 初始化参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `container` | HTMLElement | ✅ | 游戏画布的容器元素 |
| `width` | number | ✅ | 画布宽度 |
| `height` | number | ✅ | 画布高度 |
| `antialias` | boolean | ❌ | 是否启用抗锯齿，默认false |
| `enableShadows` | boolean | ❌ | 是否启用阴影，默认false |
| `shadowMapSize` | number | ❌ | 阴影贴图大小，默认1024 |
| `pixelRatio` | number | ❌ | 像素比，默认1 |
| `backgroundColor` | number | ❌ | 背景色，默认0x000000 |
| `alpha` | boolean | ❌ | 是否透明背景，默认false |

## 渲染模式

QAQ引擎支持三种渲染模式：

### 2D模式

专为2D游戏优化，使用正交相机和2D坐标系：

```typescript
// 切换到2D模式
engine.switchTo2D()

// 2D模式特点：
// - 使用正交相机
// - 坐标系：(0,0)在左上角，Y轴向下
// - 优化的2D渲染管道
// - 支持精灵、UI控件等2D元素
```

### 3D模式

完整的3D渲染支持：

```typescript
// 切换到3D模式
engine.switchTo3D()

// 3D模式特点：
// - 使用透视相机
// - 标准3D坐标系
// - 支持光照、阴影、材质
// - 支持3D模型、网格等
```

### 混合模式

同时支持2D和3D内容：

```typescript
// 切换到混合模式
engine.switchToMixed()

// 混合模式特点：
// - 可以在3D场景中放置2D元素
// - 支持2D UI覆盖在3D场景上
// - 灵活的层级管理
```

## 场景管理

### 设置主场景

```typescript
import { Scene } from 'qaq-game-engine'

// 创建场景
const mainScene = new Scene('MainScene', {
  type: 'MAIN',
  persistent: false,
  autoStart: true
})

// 设置为主场景
await engine.setMainScene(mainScene)
```

### 场景切换

```typescript
// 切换到新场景
await engine.switchToScene('MenuScene')

// 带过渡效果的场景切换
await engine.switchToScene('GameScene', {
  transition: 'fade',
  duration: 1000
})
```

## 渲染控制

### 启动和停止渲染

```typescript
// 启动渲染循环
engine.startRendering()

// 停止渲染循环
engine.stopRendering()

// 检查渲染状态
if (engine.isRendering()) {
  console.log('引擎正在渲染')
}
```

### 手动渲染

```typescript
// 渲染单帧（用于暂停状态下的更新）
engine.renderFrame()
```

## 游戏模式控制

QAQ引擎支持不同的游戏模式，主要用于脚本系统：

```typescript
// 开始播放模式（脚本开始执行）
await engine.startPlayMode()

// 暂停播放模式
await engine.pausePlayMode()

// 恢复播放模式
await engine.resumePlayMode()

// 停止播放模式（回到编辑模式）
await engine.stopPlayMode()

// 获取当前游戏模式
const mode = await engine.getCurrentGameMode()
console.log('当前模式:', mode) // 'editor' | 'play' | 'pause' | 'debug'
```

## 事件系统

Engine提供了丰富的事件系统：

```typescript
// 监听渲染模式变化
engine.on('render_mode_changed', (data) => {
  console.log('渲染模式已切换到:', data.mode)
})

// 监听场景切换
engine.on('scene_changed', (data) => {
  console.log('场景已切换到:', data.sceneName)
})

// 监听窗口大小变化
engine.on('window_resize', (data) => {
  console.log('窗口大小:', data.width, 'x', data.height)
})

// 监听游戏模式变化
engine.on('play_mode_started', () => {
  console.log('播放模式已启动')
})

engine.on('edit_mode_started', () => {
  console.log('编辑模式已启动')
})
```

## 配置和状态

### 获取引擎配置

```typescript
const config = engine.getConfig()
console.log('引擎配置:', config)
```

### 获取引擎状态

```typescript
// 检查引擎是否已初始化
if (engine.isInitialized()) {
  console.log('引擎已初始化')
}

// 检查WebGL支持
if (engine.isWebGLSupported()) {
  console.log('支持WebGL')
}

// 获取当前渲染模式
const renderMode = engine.getCurrentRenderMode()
console.log('当前渲染模式:', renderMode) // '2D' | '3D' | 'MIXED'
```

## 性能监控

```typescript
// 获取渲染统计信息
const stats = engine.getRenderStats()
console.log('FPS:', stats.fps)
console.log('渲染调用次数:', stats.drawCalls)
console.log('三角形数量:', stats.triangles)

// 启用性能监控
engine.enablePerformanceMonitoring(true)
```

## 销毁引擎

```typescript
// 清理和销毁引擎实例
engine.destroy()
```

## 完整示例

```typescript
import { Engine, Scene, Node2D, Sprite2D } from 'qaq-game-engine'

async function initializeGame() {
  // 获取引擎实例
  const engine = Engine.getInstance()
  
  // 初始化引擎
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 1280,
    height: 720,
    antialias: true,
    enableShadows: true
  })
  
  // 监听事件
  engine.on('render_mode_changed', (data) => {
    console.log('渲染模式变更:', data.mode)
  })
  
  // 创建场景
  const scene = new Scene('MainScene')
  const rootNode = new Node2D('Root')
  scene.addChild(rootNode)
  
  // 创建游戏对象
  const player = new Sprite2D('Player')
  player.position = { x: 640, y: 360, z: 0 }
  rootNode.addChild(player)
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 切换到2D模式
  engine.switchTo2D()
  
  // 启动渲染
  engine.startRendering()
  
  // 启动播放模式
  await engine.startPlayMode()
  
  console.log('游戏初始化完成！')
}

// 启动游戏
initializeGame().catch(console.error)
```

## 最佳实践

1. **单例使用**：始终使用`Engine.getInstance()`获取引擎实例
2. **异步初始化**：确保在使用引擎功能前完成初始化
3. **事件监听**：合理使用事件系统来响应引擎状态变化
4. **资源清理**：在应用结束时调用`destroy()`方法
5. **错误处理**：使用try-catch包装异步操作

---

Engine是QAQ引擎的核心，掌握其用法是开发QAQ游戏的基础。接下来可以学习[场景管理](/guide/scene)和[节点系统](/guide/nodes/node)。
