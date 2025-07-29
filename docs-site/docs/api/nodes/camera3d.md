# Camera3D API 文档

Camera3D是QAQ游戏引擎中的3D相机节点，继承自[Node3D](/api/nodes/node3d)，提供完整的3D视角控制和渲染功能。

## 类定义

```typescript
class Camera3D extends Node3D {
  constructor(name?: string)
  
  // 相机属性
  current: boolean
  fov: number
  near: number
  far: number
  size: number
  projection: ProjectionMode
  keepAspect: KeepAspect
  
  // 视口属性
  viewport: Rect2
  enabled: boolean
  
  // 渲染属性
  clearMode: ClearMode
  clearColor: Color
  clearColorAlpha: number
  
  // 环境属性
  environment: THREE.Texture | null
  
  // 相机控制
  makeCurrent(): void
  clearCurrent(): void
  isCurrent(): boolean
  
  // 投影控制
  setPerspective(fov: number, near: number, far: number): void
  setOrthogonal(size: number, near: number, far: number): void
  setFrustum(size: number, offset: Vector2, near: number, far: number): void
  
  // 视口控制
  setViewport(x: number, y: number, width: number, height: number): void
  getViewport(): Rect2
  
  // 坐标转换
  projectPosition(worldPos: Vector3): Vector2
  unprojectPosition(screenPos: Vector2, depth: number): Vector3
  screenToWorld(screenPos: Vector2): Vector3
  worldToScreen(worldPos: Vector3): Vector2
  
  // 射线投射
  getRayFromScreen(screenPos: Vector2): THREE.Ray
  
  // 视锥体
  getFrustum(): THREE.Frustum
  isPositionInFrustum(position: Vector3): boolean
  
  // Three.js相机访问
  getThreeCamera(): THREE.Camera
  getPerspectiveCamera(): THREE.PerspectiveCamera
  getOrthographicCamera(): THREE.OrthographicCamera
}
```

## 构造函数

### constructor()

创建一个新的Camera3D实例。

```typescript
constructor(name?: string)
```

**参数**
- `name?: string` - 相机名称，默认为"Camera3D"

**示例**
```typescript
const camera = new Camera3D('MainCamera')
```

## 相机属性

### current

是否为当前活动相机。

```typescript
current: boolean
```

**示例**
```typescript
camera.current = true // 设置为当前相机
console.log(camera.current) // true
```

### fov

透视相机的视野角度（度）。

```typescript
fov: number
```

**示例**
```typescript
camera.fov = 75 // 设置视野角度为75度
```

### near

近裁剪面距离。

```typescript
near: number
```

**示例**
```typescript
camera.near = 0.1 // 设置近裁剪面
```

### far

远裁剪面距离。

```typescript
far: number
```

**示例**
```typescript
camera.far = 1000 // 设置远裁剪面
```

### size

正交相机的尺寸。

```typescript
size: number
```

**示例**
```typescript
camera.size = 10 // 设置正交相机尺寸
```

### projection

投影模式。

```typescript
projection: ProjectionMode
```

**ProjectionMode枚举**
```typescript
enum ProjectionMode {
  PERSPECTIVE = 'PERSPECTIVE',
  ORTHOGONAL = 'ORTHOGONAL',
  FRUSTUM = 'FRUSTUM'
}
```

**示例**
```typescript
camera.projection = ProjectionMode.PERSPECTIVE
```

### keepAspect

宽高比保持模式。

```typescript
keepAspect: KeepAspect
```

**KeepAspect枚举**
```typescript
enum KeepAspect {
  KEEP_WIDTH = 'KEEP_WIDTH',
  KEEP_HEIGHT = 'KEEP_HEIGHT',
  KEEP_SMALLER = 'KEEP_SMALLER',
  KEEP_LARGER = 'KEEP_LARGER'
}
```

## 视口属性

### viewport

相机视口矩形。

```typescript
viewport: Rect2
```

**Rect2接口**
```typescript
interface Rect2 {
  x: number      // 左上角X坐标（0-1）
  y: number      // 左上角Y坐标（0-1）
  width: number  // 宽度（0-1）
  height: number // 高度（0-1）
}
```

**示例**
```typescript
camera.viewport = { x: 0, y: 0, width: 1, height: 1 } // 全屏
camera.viewport = { x: 0.5, y: 0, width: 0.5, height: 1 } // 右半屏
```

### enabled

相机是否启用。

```typescript
enabled: boolean
```

**示例**
```typescript
camera.enabled = false // 禁用相机
```

## 渲染属性

### clearMode

清除模式。

```typescript
clearMode: ClearMode
```

**ClearMode枚举**
```typescript
enum ClearMode {
  SKY = 'SKY',
  COLOR = 'COLOR',
  COLOR_DEPTH = 'COLOR_DEPTH',
  DEPTH = 'DEPTH',
  NEVER = 'NEVER'
}
```

### clearColor

清除颜色。

```typescript
clearColor: Color
```

**示例**
```typescript
camera.clearColor = { r: 0.2, g: 0.3, b: 0.8, a: 1.0 } // 蓝色背景
```

### clearColorAlpha

清除颜色的透明度。

```typescript
clearColorAlpha: number
```

### environment

环境贴图。

```typescript
environment: THREE.Texture | null
```

## 相机控制方法

### makeCurrent()

设置为当前活动相机。

```typescript
makeCurrent(): void
```

**示例**
```typescript
camera.makeCurrent()
```

### clearCurrent()

清除当前相机状态。

```typescript
clearCurrent(): void
```

### isCurrent()

检查是否为当前相机。

```typescript
isCurrent(): boolean
```

**返回值**
- `boolean` - 是否为当前相机

## 投影控制方法

### setPerspective()

设置透视投影。

```typescript
setPerspective(fov: number, near: number, far: number): void
```

**参数**
- `fov: number` - 视野角度（度）
- `near: number` - 近裁剪面
- `far: number` - 远裁剪面

**示例**
```typescript
camera.setPerspective(75, 0.1, 1000)
```

### setOrthogonal()

设置正交投影。

```typescript
setOrthogonal(size: number, near: number, far: number): void
```

**参数**
- `size: number` - 正交尺寸
- `near: number` - 近裁剪面
- `far: number` - 远裁剪面

**示例**
```typescript
camera.setOrthogonal(10, 0.1, 100)
```

### setFrustum()

设置视锥体投影。

```typescript
setFrustum(size: number, offset: Vector2, near: number, far: number): void
```

**参数**
- `size: number` - 视锥体尺寸
- `offset: Vector2` - 偏移量
- `near: number` - 近裁剪面
- `far: number` - 远裁剪面

## 视口控制方法

### setViewport()

设置视口。

```typescript
setViewport(x: number, y: number, width: number, height: number): void
```

**参数**
- `x: number` - X坐标（0-1）
- `y: number` - Y坐标（0-1）
- `width: number` - 宽度（0-1）
- `height: number` - 高度（0-1）

**示例**
```typescript
camera.setViewport(0, 0, 1, 1) // 全屏
camera.setViewport(0, 0, 0.5, 0.5) // 左上角四分之一
```

### getViewport()

获取视口。

```typescript
getViewport(): Rect2
```

**返回值**
- `Rect2` - 视口矩形

## 坐标转换方法

### projectPosition()

将世界坐标投影到屏幕坐标。

```typescript
projectPosition(worldPos: Vector3): Vector2
```

**参数**
- `worldPos: Vector3` - 世界坐标

**返回值**
- `Vector2` - 屏幕坐标

**示例**
```typescript
const worldPos = { x: 0, y: 0, z: 0 }
const screenPos = camera.projectPosition(worldPos)
console.log('屏幕坐标:', screenPos)
```

### unprojectPosition()

将屏幕坐标反投影到世界坐标。

```typescript
unprojectPosition(screenPos: Vector2, depth: number): Vector3
```

**参数**
- `screenPos: Vector2` - 屏幕坐标
- `depth: number` - 深度值

**返回值**
- `Vector3` - 世界坐标

### screenToWorld()

屏幕坐标转世界坐标。

```typescript
screenToWorld(screenPos: Vector2): Vector3
```

**参数**
- `screenPos: Vector2` - 屏幕坐标

**返回值**
- `Vector3` - 世界坐标

### worldToScreen()

世界坐标转屏幕坐标。

```typescript
worldToScreen(worldPos: Vector3): Vector2
```

**参数**
- `worldPos: Vector3` - 世界坐标

**返回值**
- `Vector2` - 屏幕坐标

## 射线投射方法

### getRayFromScreen()

从屏幕坐标获取射线。

```typescript
getRayFromScreen(screenPos: Vector2): THREE.Ray
```

**参数**
- `screenPos: Vector2` - 屏幕坐标

**返回值**
- `THREE.Ray` - 射线对象

**示例**
```typescript
const screenPos = { x: 400, y: 300 }
const ray = camera.getRayFromScreen(screenPos)
console.log('射线:', ray)
```

## 视锥体方法

### getFrustum()

获取视锥体。

```typescript
getFrustum(): THREE.Frustum
```

**返回值**
- `THREE.Frustum` - 视锥体对象

### isPositionInFrustum()

检查位置是否在视锥体内。

```typescript
isPositionInFrustum(position: Vector3): boolean
```

**参数**
- `position: Vector3` - 世界坐标位置

**返回值**
- `boolean` - 是否在视锥体内

**示例**
```typescript
const position = { x: 5, y: 2, z: -10 }
const inFrustum = camera.isPositionInFrustum(position)
console.log('在视锥体内:', inFrustum)
```

## Three.js相机访问

### getThreeCamera()

获取当前活动的Three.js相机。

```typescript
getThreeCamera(): THREE.Camera
```

**返回值**
- `THREE.Camera` - Three.js相机对象

### getPerspectiveCamera()

获取透视相机。

```typescript
getPerspectiveCamera(): THREE.PerspectiveCamera
```

**返回值**
- `THREE.PerspectiveCamera` - 透视相机对象

### getOrthographicCamera()

获取正交相机。

```typescript
getOrthographicCamera(): THREE.OrthographicCamera
```

**返回值**
- `THREE.OrthographicCamera` - 正交相机对象

## 事件

Camera3D继承自Node3D，支持所有Node3D事件，并添加了相机特定事件：

```typescript
// 相机参数变化
camera.on('camera_params_changed', (params) => {
  console.log('相机参数变化:', params)
})

// 投影模式变化
camera.on('projection_changed', (projection) => {
  console.log('投影模式变化:', projection)
})

// 视口变化
camera.on('viewport_changed', (viewport) => {
  console.log('视口变化:', viewport)
})

// 成为当前相机
camera.on('became_current', () => {
  console.log('成为当前相机')
})

// 不再是当前相机
camera.on('no_longer_current', () => {
  console.log('不再是当前相机')
})
```

## 完整示例

```typescript
import { Camera3D, MeshInstance3D, Engine, Scene, Node3D } from 'qaq-game-engine'

async function createCameraDemo() {
  // 初始化引擎
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  // 创建场景
  const scene = new Scene('CameraDemo')
  const root = new Node3D('Root')
  scene.addChild(root)
  
  // 创建主相机
  const mainCamera = new Camera3D('MainCamera')
  mainCamera.position = { x: 0, y: 5, z: 10 }
  mainCamera.lookAt({ x: 0, y: 0, z: 0 })
  mainCamera.setPerspective(75, 0.1, 1000)
  mainCamera.makeCurrent()
  root.addChild(mainCamera)
  
  // 创建俯视相机
  const topCamera = new Camera3D('TopCamera')
  topCamera.position = { x: 0, y: 20, z: 0 }
  topCamera.lookAt({ x: 0, y: 0, z: 0 })
  topCamera.setOrthogonal(15, 0.1, 100)
  topCamera.setViewport(0.7, 0.7, 0.3, 0.3) // 右上角小窗口
  root.addChild(topCamera)
  
  // 创建一些3D对象用于观察
  const cube = new MeshInstance3D('Cube')
  cube.createBoxMesh(2, 2, 2)
  cube.position = { x: 0, y: 1, z: 0 }
  root.addChild(cube)
  
  const sphere = new MeshInstance3D('Sphere')
  sphere.createSphereMesh(1, 32)
  sphere.position = { x: 4, y: 1, z: 0 }
  root.addChild(sphere)
  
  const ground = new MeshInstance3D('Ground')
  ground.createPlaneMesh(20, 20)
  ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
  root.addChild(ground)
  
  // 相机控制
  let currentCameraIndex = 0
  const cameras = [mainCamera, topCamera]
  
  // 切换相机
  const switchCamera = () => {
    cameras[currentCameraIndex].clearCurrent()
    currentCameraIndex = (currentCameraIndex + 1) % cameras.length
    cameras[currentCameraIndex].makeCurrent()
    console.log('切换到相机:', cameras[currentCameraIndex].name)
  }
  
  // 键盘控制
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'c':
      case 'C':
        switchCamera()
        break
      case 'ArrowUp':
        mainCamera.translateLocal({ x: 0, y: 0, z: -1 })
        break
      case 'ArrowDown':
        mainCamera.translateLocal({ x: 0, y: 0, z: 1 })
        break
      case 'ArrowLeft':
        mainCamera.translateLocal({ x: -1, y: 0, z: 0 })
        break
      case 'ArrowRight':
        mainCamera.translateLocal({ x: 1, y: 0, z: 0 })
        break
    }
  })
  
  // 鼠标控制相机旋转
  let isMouseDown = false
  let lastMouseX = 0
  let lastMouseY = 0
  
  document.addEventListener('mousedown', (event) => {
    isMouseDown = true
    lastMouseX = event.clientX
    lastMouseY = event.clientY
  })
  
  document.addEventListener('mouseup', () => {
    isMouseDown = false
  })
  
  document.addEventListener('mousemove', (event) => {
    if (!isMouseDown) return
    
    const deltaX = event.clientX - lastMouseX
    const deltaY = event.clientY - lastMouseY
    
    // 旋转主相机
    if (mainCamera.isCurrent()) {
      mainCamera.rotateY(-deltaX * 0.01)
      mainCamera.rotateX(-deltaY * 0.01)
    }
    
    lastMouseX = event.clientX
    lastMouseY = event.clientY
  })
  
  // 监听相机事件
  mainCamera.on('became_current', () => {
    console.log('主相机激活')
  })
  
  topCamera.on('became_current', () => {
    console.log('俯视相机激活')
  })
  
  // 射线投射演示
  document.addEventListener('click', (event) => {
    const rect = engine.getConfig().container.getBoundingClientRect()
    const screenPos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    const ray = mainCamera.getRayFromScreen(screenPos)
    console.log('点击射线:', ray)
    
    // 检查射线与物体的交点
    const intersections = cube.raycast(ray)
    if (intersections.length > 0) {
      console.log('点击了立方体')
    }
  })
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 启动渲染
  engine.switchTo3D()
  engine.startRendering()
  
  console.log('相机演示创建完成')
  console.log('按C键切换相机，方向键移动相机，鼠标拖拽旋转相机')
}

// 启动演示
createCameraDemo().catch(console.error)
```

## 最佳实践

1. **相机管理**：合理管理多个相机，避免同时激活多个相机
2. **投影设置**：根据场景需求选择合适的投影模式
3. **视口设置**：使用视口实现分屏效果和小地图
4. **坐标转换**：充分利用坐标转换方法实现UI交互
5. **射线投射**：使用射线投射实现鼠标拾取和交互
6. **性能优化**：合理设置近远裁剪面，避免不必要的渲染

---

Camera3D是QAQ引擎中3D视角控制的核心节点，掌握其用法对于创建丰富的3D交互体验至关重要。
