# Sprite2D API 文档

Sprite2D是QAQ游戏引擎中用于显示2D图像的节点，继承自[Node2D](/api/nodes/node2d)，专门用于2D精灵渲染。

## 类定义

```typescript
class Sprite2D extends Node2D {
  constructor(name?: string, options?: Sprite2DOptions)
  
  // 纹理属性
  texture: THREE.Texture | null
  textureUrl: string
  
  // 显示属性
  flipH: boolean
  flipV: boolean
  centered: boolean
  offset: Vector2
  
  // 区域属性
  regionEnabled: boolean
  regionRect: Rect2
  
  // 材质属性
  material: THREE.Material
  opacity: number
  blendMode: BlendMode
  
  // 方法
  loadTexture(url: string): Promise<THREE.Texture>
  setTextureFromCanvas(canvas: HTMLCanvasElement): void
  setTextureFromImageData(imageData: ImageData): void
  getTextureSize(): Vector2
  setRegion(x: number, y: number, width: number, height: number): void
  clearRegion(): void
  
  // 动画方法
  playAnimation(name: string, loop?: boolean): void
  stopAnimation(): void
  pauseAnimation(): void
  resumeAnimation(): void
  isAnimationPlaying(): boolean
  getCurrentAnimationName(): string
  
  // 工具方法
  getGlobalRect(): Rect2
  getRect(): Rect2
  isPixelOpaque(x: number, y: number): boolean
}
```

## 构造函数

### constructor()

创建一个新的Sprite2D实例。

```typescript
constructor(name?: string, options?: Sprite2DOptions)
```

**参数**
- `name?: string` - 精灵名称，默认为"Sprite2D"
- `options?: Sprite2DOptions` - 精灵配置选项

**Sprite2DOptions接口**
```typescript
interface Sprite2DOptions {
  texture?: string | THREE.Texture    // 纹理URL或纹理对象
  width?: number                      // 宽度
  height?: number                     // 高度
  centered?: boolean                  // 是否居中，默认true
  flipH?: boolean                     // 水平翻转，默认false
  flipV?: boolean                     // 垂直翻转，默认false
  opacity?: number                    // 不透明度，默认1.0
  blendMode?: BlendMode              // 混合模式
}
```

**示例**
```typescript
// 基础创建
const sprite = new Sprite2D('MySprite')

// 带选项创建
const sprite = new Sprite2D('Player', {
  texture: '/assets/player.png',
  width: 64,
  height: 64,
  centered: true
})
```

## 纹理属性

### texture

精灵的纹理对象。

```typescript
texture: THREE.Texture | null
```

**示例**
```typescript
// 设置纹理
sprite.texture = someTexture

// 获取纹理
const currentTexture = sprite.texture
```

### textureUrl

纹理的URL路径。

```typescript
textureUrl: string
```

**示例**
```typescript
sprite.textureUrl = '/assets/player.png'
```

## 显示属性

### flipH

是否水平翻转。

```typescript
flipH: boolean
```

**示例**
```typescript
sprite.flipH = true // 水平翻转精灵
```

### flipV

是否垂直翻转。

```typescript
flipV: boolean
```

**示例**
```typescript
sprite.flipV = true // 垂直翻转精灵
```

### centered

是否以中心点为锚点。

```typescript
centered: boolean
```

**示例**
```typescript
sprite.centered = false // 以左上角为锚点
```

### offset

精灵的偏移量。

```typescript
offset: Vector2
```

**Vector2接口**
```typescript
interface Vector2 {
  x: number
  y: number
}
```

**示例**
```typescript
sprite.offset = { x: 10, y: -5 }
```

## 区域属性

### regionEnabled

是否启用纹理区域。

```typescript
regionEnabled: boolean
```

**示例**
```typescript
sprite.regionEnabled = true
```

### regionRect

纹理区域矩形。

```typescript
regionRect: Rect2
```

**Rect2接口**
```typescript
interface Rect2 {
  x: number      // 左上角X坐标
  y: number      // 左上角Y坐标
  width: number  // 宽度
  height: number // 高度
}
```

**示例**
```typescript
sprite.regionRect = { x: 0, y: 0, width: 32, height: 32 }
```

## 材质属性

### material

精灵的材质对象。

```typescript
material: THREE.Material
```

### opacity

精灵的不透明度。

```typescript
opacity: number
```

**示例**
```typescript
sprite.opacity = 0.5 // 半透明
```

### blendMode

混合模式。

```typescript
blendMode: BlendMode
```

**BlendMode枚举**
```typescript
type BlendMode = 'NORMAL' | 'ADD' | 'MULTIPLY' | 'SCREEN' | 'OVERLAY'
```

**示例**
```typescript
sprite.blendMode = 'ADD' // 加法混合
```

## 纹理方法

### loadTexture()

从URL加载纹理。

```typescript
loadTexture(url: string): Promise<THREE.Texture>
```

**参数**
- `url: string` - 纹理文件URL

**返回值**
- `Promise<THREE.Texture>` - 加载的纹理对象

**示例**
```typescript
const texture = await sprite.loadTexture('/assets/player.png')
console.log('纹理加载完成:', texture)
```

### setTextureFromCanvas()

从Canvas设置纹理。

```typescript
setTextureFromCanvas(canvas: HTMLCanvasElement): void
```

**参数**
- `canvas: HTMLCanvasElement` - Canvas元素

**示例**
```typescript
const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
// ... 绘制到canvas
sprite.setTextureFromCanvas(canvas)
```

### setTextureFromImageData()

从ImageData设置纹理。

```typescript
setTextureFromImageData(imageData: ImageData): void
```

**参数**
- `imageData: ImageData` - 图像数据

**示例**
```typescript
const imageData = ctx.getImageData(0, 0, 100, 100)
sprite.setTextureFromImageData(imageData)
```

### getTextureSize()

获取纹理尺寸。

```typescript
getTextureSize(): Vector2
```

**返回值**
- `Vector2` - 纹理尺寸

**示例**
```typescript
const size = sprite.getTextureSize()
console.log('纹理尺寸:', size.x, 'x', size.y)
```

## 区域方法

### setRegion()

设置纹理区域。

```typescript
setRegion(x: number, y: number, width: number, height: number): void
```

**参数**
- `x: number` - 区域左上角X坐标
- `y: number` - 区域左上角Y坐标
- `width: number` - 区域宽度
- `height: number` - 区域高度

**示例**
```typescript
// 设置精灵表中的一个帧
sprite.setRegion(64, 0, 32, 32)
```

### clearRegion()

清除纹理区域，使用整个纹理。

```typescript
clearRegion(): void
```

**示例**
```typescript
sprite.clearRegion()
```

## 动画方法

### playAnimation()

播放动画。

```typescript
playAnimation(name: string, loop?: boolean): void
```

**参数**
- `name: string` - 动画名称
- `loop?: boolean` - 是否循环播放，默认true

**示例**
```typescript
sprite.playAnimation('walk', true)
```

### stopAnimation()

停止动画。

```typescript
stopAnimation(): void
```

### pauseAnimation()

暂停动画。

```typescript
pauseAnimation(): void
```

### resumeAnimation()

恢复动画。

```typescript
resumeAnimation(): void
```

### isAnimationPlaying()

检查动画是否正在播放。

```typescript
isAnimationPlaying(): boolean
```

**返回值**
- `boolean` - 是否正在播放动画

### getCurrentAnimationName()

获取当前播放的动画名称。

```typescript
getCurrentAnimationName(): string
```

**返回值**
- `string` - 当前动画名称

## 工具方法

### getGlobalRect()

获取精灵在全局坐标系中的矩形。

```typescript
getGlobalRect(): Rect2
```

**返回值**
- `Rect2` - 全局矩形

### getRect()

获取精灵在本地坐标系中的矩形。

```typescript
getRect(): Rect2
```

**返回值**
- `Rect2` - 本地矩形

### isPixelOpaque()

检查指定像素是否不透明。

```typescript
isPixelOpaque(x: number, y: number): boolean
```

**参数**
- `x: number` - 像素X坐标
- `y: number` - 像素Y坐标

**返回值**
- `boolean` - 像素是否不透明

## 事件

Sprite2D继承自Node2D，支持所有Node2D事件，并添加了一些特定事件：

```typescript
// 纹理加载完成
sprite.on('texture_loaded', (texture: THREE.Texture) => {
  console.log('纹理加载完成:', texture)
})

// 纹理变化
sprite.on('texture_changed', (texture: THREE.Texture | null) => {
  console.log('纹理变化:', texture)
})

// 动画开始
sprite.on('animation_started', (animationName: string) => {
  console.log('动画开始:', animationName)
})

// 动画结束
sprite.on('animation_finished', (animationName: string) => {
  console.log('动画结束:', animationName)
})

// 动画循环
sprite.on('animation_looped', (animationName: string) => {
  console.log('动画循环:', animationName)
})
```

## 完整示例

```typescript
import { Sprite2D, Engine, Scene, Node2D } from 'qaq-game-engine'

async function createSpriteDemo() {
  // 初始化引擎
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  // 创建场景
  const scene = new Scene('SpriteDemo')
  const root = new Node2D('Root')
  scene.addChild(root)
  
  // 创建精灵
  const player = new Sprite2D('Player', {
    texture: '/assets/player.png',
    width: 64,
    height: 64,
    centered: true
  })
  
  // 设置位置
  player.position = { x: 400, y: 300 }
  
  // 监听纹理加载
  player.on('texture_loaded', (texture) => {
    console.log('玩家纹理加载完成:', texture.image.width, 'x', texture.image.height)
  })
  
  // 添加到场景
  root.addChild(player)
  
  // 创建敌人精灵（使用精灵表）
  const enemy = new Sprite2D('Enemy')
  await enemy.loadTexture('/assets/enemies.png')
  enemy.setRegion(0, 0, 32, 32) // 使用精灵表的第一帧
  enemy.position = { x: 200, y: 200 }
  enemy.flipH = true // 水平翻转
  root.addChild(enemy)
  
  // 创建背景精灵
  const background = new Sprite2D('Background', {
    texture: '/assets/background.png',
    centered: false // 左上角对齐
  })
  background.position = { x: 0, y: 0 }
  background.zIndex = -10 // 放在最底层
  root.addChild(background)
  
  // 创建半透明精灵
  const overlay = new Sprite2D('Overlay')
  await overlay.loadTexture('/assets/overlay.png')
  overlay.opacity = 0.5
  overlay.blendMode = 'MULTIPLY'
  overlay.position = { x: 600, y: 100 }
  root.addChild(overlay)
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 启动渲染
  engine.switchTo2D()
  engine.startRendering()
  
  // 动画示例
  setTimeout(() => {
    // 播放玩家动画
    player.playAnimation('walk')
    
    // 改变敌人精灵表帧
    let frame = 0
    setInterval(() => {
      frame = (frame + 1) % 4
      enemy.setRegion(frame * 32, 0, 32, 32)
    }, 200)
  }, 1000)
  
  console.log('精灵演示创建完成')
}

// 启动演示
createSpriteDemo().catch(console.error)
```

## 最佳实践

1. **纹理管理**：合理使用纹理缓存，避免重复加载
2. **精灵表**：使用精灵表减少纹理数量和绘制调用
3. **透明度**：谨慎使用透明度，可能影响性能
4. **区域设置**：使用setRegion实现精灵动画
5. **事件监听**：监听texture_loaded确保纹理加载完成
6. **内存管理**：及时释放不需要的纹理资源

---

Sprite2D是QAQ引擎中最常用的2D节点之一，掌握其用法对于2D游戏开发至关重要。
