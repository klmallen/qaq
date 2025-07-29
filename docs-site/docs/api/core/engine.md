# Engine API 文档

Engine是QAQ游戏引擎的核心类，采用单例模式，负责管理整个游戏的生命周期、渲染管道和系统协调。

## 类定义

```typescript
class Engine extends QaqObject {
  static getInstance(): Engine
  
  // 初始化和配置
  initialize(config: EngineConfig): Promise<boolean>
  getConfig(): EngineConfig | null
  isInitialized(): boolean
  
  // 渲染控制
  startRendering(): void
  stopRendering(): void
  isRendering(): boolean
  renderFrame(): void
  
  // 渲染模式
  switchTo2D(): void
  switchTo3D(): void
  switchToMixed(): void
  getCurrentRenderMode(): RenderMode
  
  // 场景管理
  setMainScene(scene: Scene): Promise<void>
  switchToScene(sceneName: string, options?: SceneTransitionOptions): Promise<void>
  getCurrentScene(): Scene | null
  
  // 游戏模式控制
  startPlayMode(): Promise<void>
  pausePlayMode(): Promise<void>
  resumePlayMode(): Promise<void>
  stopPlayMode(): Promise<void>
  getCurrentGameMode(): Promise<string>
  
  // 工具方法
  isWebGLSupported(): boolean
  getRenderStats(): RenderStats
  enablePerformanceMonitoring(enabled: boolean): void
  destroy(): void
}
```

## 静态方法

### getInstance()

获取Engine的单例实例。

```typescript
static getInstance(): Engine
```

**返回值**
- `Engine` - 引擎单例实例

**示例**
```typescript
const engine = Engine.getInstance()
```

## 初始化方法

### initialize()

初始化引擎，必须在使用其他功能前调用。

```typescript
initialize(config: EngineConfig): Promise<boolean>
```

**参数**
- `config: EngineConfig` - 引擎配置对象

**返回值**
- `Promise<boolean>` - 初始化是否成功

**EngineConfig接口**
```typescript
interface EngineConfig {
  container: HTMLElement          // 游戏容器元素
  width: number                  // 画布宽度
  height: number                 // 画布高度
  antialias?: boolean           // 抗锯齿，默认false
  enableShadows?: boolean       // 启用阴影，默认false
  shadowMapSize?: number        // 阴影贴图大小，默认1024
  pixelRatio?: number          // 像素比，默认1
  backgroundColor?: number      // 背景色，默认0x000000
  alpha?: boolean              // 透明背景，默认false
  preserveDrawingBuffer?: boolean // 保留绘图缓冲区，默认false
}
```

**示例**
```typescript
await engine.initialize({
  container: document.getElementById('game-canvas'),
  width: 1280,
  height: 720,
  antialias: true,
  enableShadows: true
})
```

### getConfig()

获取当前引擎配置。

```typescript
getConfig(): EngineConfig | null
```

**返回值**
- `EngineConfig | null` - 当前配置或null（如果未初始化）

### isInitialized()

检查引擎是否已初始化。

```typescript
isInitialized(): boolean
```

**返回值**
- `boolean` - 是否已初始化

## 渲染控制

### startRendering()

启动渲染循环。

```typescript
startRendering(): void
```

**示例**
```typescript
engine.startRendering()
```

### stopRendering()

停止渲染循环。

```typescript
stopRendering(): void
```

### isRendering()

检查是否正在渲染。

```typescript
isRendering(): boolean
```

**返回值**
- `boolean` - 是否正在渲染

### renderFrame()

手动渲染一帧，通常用于暂停状态下的更新。

```typescript
renderFrame(): void
```

## 渲染模式

### switchTo2D()

切换到2D渲染模式。

```typescript
switchTo2D(): void
```

**特点**
- 使用正交相机
- 2D坐标系（左上角原点）
- 优化的2D渲染管道

### switchTo3D()

切换到3D渲染模式。

```typescript
switchTo3D(): void
```

**特点**
- 使用透视相机
- 标准3D坐标系
- 支持光照和阴影

### switchToMixed()

切换到混合渲染模式。

```typescript
switchToMixed(): void
```

**特点**
- 同时支持2D和3D内容
- 灵活的层级管理

### getCurrentRenderMode()

获取当前渲染模式。

```typescript
getCurrentRenderMode(): RenderMode
```

**返回值**
- `RenderMode` - 当前渲染模式（'2D' | '3D' | 'MIXED'）

## 场景管理

### setMainScene()

设置主场景。

```typescript
setMainScene(scene: Scene): Promise<void>
```

**参数**
- `scene: Scene` - 要设置的场景

**示例**
```typescript
const scene = new Scene('MainScene')
await engine.setMainScene(scene)
```

### switchToScene()

切换到指定场景。

```typescript
switchToScene(sceneName: string, options?: SceneTransitionOptions): Promise<void>
```

**参数**
- `sceneName: string` - 场景名称
- `options?: SceneTransitionOptions` - 过渡选项

**SceneTransitionOptions接口**
```typescript
interface SceneTransitionOptions {
  transition?: 'fade' | 'slide' | 'none'
  duration?: number
}
```

### getCurrentScene()

获取当前场景。

```typescript
getCurrentScene(): Scene | null
```

**返回值**
- `Scene | null` - 当前场景或null

## 游戏模式控制

### startPlayMode()

开始播放模式，脚本开始执行。

```typescript
startPlayMode(): Promise<void>
```

### pausePlayMode()

暂停播放模式，脚本暂停执行。

```typescript
pausePlayMode(): Promise<void>
```

### resumePlayMode()

恢复播放模式。

```typescript
resumePlayMode(): Promise<void>
```

### stopPlayMode()

停止播放模式，回到编辑模式。

```typescript
stopPlayMode(): Promise<void>
```

### getCurrentGameMode()

获取当前游戏模式。

```typescript
getCurrentGameMode(): Promise<string>
```

**返回值**
- `Promise<string>` - 游戏模式（'editor' | 'play' | 'pause' | 'debug'）

## 工具方法

### isWebGLSupported()

检查浏览器是否支持WebGL。

```typescript
isWebGLSupported(): boolean
```

**返回值**
- `boolean` - 是否支持WebGL

### getRenderStats()

获取渲染统计信息。

```typescript
getRenderStats(): RenderStats
```

**RenderStats接口**
```typescript
interface RenderStats {
  fps: number           // 帧率
  drawCalls: number     // 绘制调用次数
  triangles: number     // 三角形数量
  geometries: number    // 几何体数量
  textures: number      // 纹理数量
}
```

### enablePerformanceMonitoring()

启用或禁用性能监控。

```typescript
enablePerformanceMonitoring(enabled: boolean): void
```

**参数**
- `enabled: boolean` - 是否启用

### destroy()

销毁引擎实例，清理所有资源。

```typescript
destroy(): void
```

## 事件

Engine继承自QaqObject，支持事件系统：

```typescript
// 渲染模式变化
engine.on('render_mode_changed', (data: { mode: RenderMode }) => {
  console.log('渲染模式变更:', data.mode)
})

// 场景变化
engine.on('scene_changed', (data: { sceneName: string }) => {
  console.log('场景变更:', data.sceneName)
})

// 窗口大小变化
engine.on('window_resize', (data: { width: number, height: number }) => {
  console.log('窗口大小变化:', data.width, 'x', data.height)
})

// 游戏模式变化
engine.on('play_mode_started', () => {
  console.log('播放模式开始')
})

engine.on('edit_mode_started', () => {
  console.log('编辑模式开始')
})

engine.on('play_mode_paused', () => {
  console.log('播放模式暂停')
})

engine.on('play_mode_resumed', () => {
  console.log('播放模式恢复')
})
```

## 完整示例

```typescript
import { Engine, Scene, Node2D, Sprite2D } from 'qaq-game-engine'

async function initializeGame() {
  // 获取引擎实例
  const engine = Engine.getInstance()
  
  // 检查WebGL支持
  if (!engine.isWebGLSupported()) {
    throw new Error('浏览器不支持WebGL')
  }
  
  // 初始化引擎
  const success = await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 1280,
    height: 720,
    antialias: true,
    enableShadows: true,
    backgroundColor: 0x222222
  })
  
  if (!success) {
    throw new Error('引擎初始化失败')
  }
  
  // 监听事件
  engine.on('render_mode_changed', (data) => {
    console.log('渲染模式:', data.mode)
  })
  
  // 创建场景
  const scene = new Scene('MainScene')
  const root = new Node2D('Root')
  scene.addChild(root)
  
  // 创建游戏对象
  const player = new Sprite2D('Player')
  player.position = { x: 640, y: 360, z: 0 }
  root.addChild(player)
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 切换到2D模式
  engine.switchTo2D()
  
  // 启动渲染
  engine.startRendering()
  
  // 启动播放模式
  await engine.startPlayMode()
  
  // 启用性能监控
  engine.enablePerformanceMonitoring(true)
  
  console.log('游戏初始化完成')
  console.log('配置:', engine.getConfig())
  console.log('渲染模式:', engine.getCurrentRenderMode())
}

// 启动游戏
initializeGame().catch(console.error)
```
