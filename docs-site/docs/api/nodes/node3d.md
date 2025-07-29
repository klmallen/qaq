# Node3D API 文档

Node3D是QAQ游戏引擎中所有3D节点的基类，继承自[Node](/api/core/node)，提供完整的3D变换、空间计算和渲染功能。

## 类定义

```typescript
class Node3D extends Node {
  constructor(name?: string)
  
  // 3D变换属性
  position: Vector3
  rotation: Vector3
  rotationDegrees: Vector3
  quaternion: Quaternion
  scale: Vector3
  readonly globalPosition: Vector3
  readonly globalRotation: Vector3
  readonly globalScale: Vector3
  
  // 3D变换方法
  translate(offset: Vector3): void
  translateLocal(offset: Vector3): void
  rotate(euler: Vector3): void
  rotateDegrees(euler: Vector3): void
  rotateX(angle: number): void
  rotateY(angle: number): void
  rotateZ(angle: number): void
  scaleBy(factor: Vector3 | number): void
  setScale(scale: number): void
  
  // 空间操作
  lookAt(target: Vector3, up?: Vector3): void
  moveForward(distance: number): void
  moveRight(distance: number): void
  moveUp(distance: number): void
  
  // 方向向量
  getForward(): Vector3
  getRight(): Vector3
  getUp(): Vector3
  
  // 坐标转换
  toGlobal(localPoint: Vector3): Vector3
  toLocal(globalPoint: Vector3): Vector3
  
  // 距离和角度计算
  distanceTo(other: Node3D): number
  distanceToPoint(point: Vector3): number
  angleTo(other: Node3D): number
  
  // 变换矩阵
  getTransform(): Transform3D
  getGlobalTransform(): Transform3D
  applyTransform(transform: Transform3D): void
  
  // 状态管理
  isTransformDirty(): boolean
  markTransformDirty(): void
  updateTransform(): void
}
```

## 构造函数

### constructor()

创建一个新的Node3D实例。

```typescript
constructor(name?: string)
```

**参数**
- `name?: string` - 节点名称，默认为"Node3D"

**示例**
```typescript
const node3d = new Node3D('MyNode3D')
```

## 3D变换属性

### position

节点在3D空间中的位置。

```typescript
position: Vector3
```

**Vector3接口**
```typescript
interface Vector3 {
  x: number
  y: number
  z: number
}
```

**示例**
```typescript
node3d.position = { x: 10, y: 5, z: -2 }
console.log(node3d.position) // { x: 10, y: 5, z: -2 }
```

### rotation

节点的欧拉角旋转（弧度）。

```typescript
rotation: Vector3
```

**示例**
```typescript
node3d.rotation = { x: 0, y: Math.PI / 4, z: 0 } // Y轴旋转45度
```

### rotationDegrees

节点的欧拉角旋转（角度）。

```typescript
rotationDegrees: Vector3
```

**示例**
```typescript
node3d.rotationDegrees = { x: 0, y: 45, z: 0 } // Y轴旋转45度
```

### quaternion

节点的四元数旋转。

```typescript
quaternion: Quaternion
```

**Quaternion接口**
```typescript
interface Quaternion {
  x: number
  y: number
  z: number
  w: number
}
```

**示例**
```typescript
node3d.quaternion = { x: 0, y: 0.383, z: 0, w: 0.924 }
```

### scale

节点的3D缩放。

```typescript
scale: Vector3
```

**示例**
```typescript
node3d.scale = { x: 2, y: 1, z: 0.5 }
```

### globalPosition

节点在全局坐标系中的位置（只读）。

```typescript
readonly globalPosition: Vector3
```

### globalRotation

节点在全局坐标系中的旋转（只读）。

```typescript
readonly globalRotation: Vector3
```

### globalScale

节点在全局坐标系中的缩放（只读）。

```typescript
readonly globalScale: Vector3
```

## 3D变换方法

### translate()

相对移动节点。

```typescript
translate(offset: Vector3): void
```

**参数**
- `offset: Vector3` - 移动偏移量

**示例**
```typescript
node3d.translate({ x: 1, y: 0, z: -1 })
```

### translateLocal()

沿本地坐标轴移动节点。

```typescript
translateLocal(offset: Vector3): void
```

**参数**
- `offset: Vector3` - 本地坐标系下的移动偏移量

**示例**
```typescript
node3d.translateLocal({ x: 0, y: 2, z: 0 }) // 沿本地Y轴向上移动
```

### rotate()

相对旋转节点（弧度）。

```typescript
rotate(euler: Vector3): void
```

**参数**
- `euler: Vector3` - 欧拉角旋转量（弧度）

**示例**
```typescript
node3d.rotate({ x: 0, y: Math.PI / 8, z: 0 })
```

### rotateDegrees()

相对旋转节点（角度）。

```typescript
rotateDegrees(euler: Vector3): void
```

**参数**
- `euler: Vector3` - 欧拉角旋转量（角度）

**示例**
```typescript
node3d.rotateDegrees({ x: 0, y: 22.5, z: 0 })
```

### rotateX()

绕X轴旋转。

```typescript
rotateX(angle: number): void
```

**参数**
- `angle: number` - 旋转角度（弧度）

**示例**
```typescript
node3d.rotateX(Math.PI / 4) // 绕X轴旋转45度
```

### rotateY()

绕Y轴旋转。

```typescript
rotateY(angle: number): void
```

**参数**
- `angle: number` - 旋转角度（弧度）

### rotateZ()

绕Z轴旋转。

```typescript
rotateZ(angle: number): void
```

**参数**
- `angle: number` - 旋转角度（弧度）

### scaleBy()

相对缩放节点。

```typescript
scaleBy(factor: Vector3 | number): void
```

**参数**
- `factor: Vector3 | number` - 缩放因子，可以是向量或标量

**示例**
```typescript
node3d.scaleBy({ x: 1.2, y: 1.2, z: 1.2 })
node3d.scaleBy(1.5) // 等比例缩放
```

### setScale()

设置等比例缩放。

```typescript
setScale(scale: number): void
```

**参数**
- `scale: number` - 缩放因子

**示例**
```typescript
node3d.setScale(2) // 所有轴都缩放2倍
```

## 空间操作方法

### lookAt()

让节点朝向目标点。

```typescript
lookAt(target: Vector3, up?: Vector3): void
```

**参数**
- `target: Vector3` - 目标点
- `up?: Vector3` - 上方向向量，默认为(0,1,0)

**示例**
```typescript
node3d.lookAt({ x: 0, y: 0, z: 0 }) // 看向原点
node3d.lookAt({ x: 5, y: 2, z: -3 }, { x: 0, y: 1, z: 0 })
```

### moveForward()

向前移动（沿-Z轴）。

```typescript
moveForward(distance: number): void
```

**参数**
- `distance: number` - 移动距离

**示例**
```typescript
node3d.moveForward(5) // 向前移动5个单位
```

### moveRight()

向右移动（沿X轴）。

```typescript
moveRight(distance: number): void
```

**参数**
- `distance: number` - 移动距离

### moveUp()

向上移动（沿Y轴）。

```typescript
moveUp(distance: number): void
```

**参数**
- `distance: number` - 移动距离

## 方向向量方法

### getForward()

获取节点的前方向向量。

```typescript
getForward(): Vector3
```

**返回值**
- `Vector3` - 前方向向量（-Z方向）

**示例**
```typescript
const forward = node3d.getForward()
console.log('前方向:', forward)
```

### getRight()

获取节点的右方向向量。

```typescript
getRight(): Vector3
```

**返回值**
- `Vector3` - 右方向向量（X方向）

### getUp()

获取节点的上方向向量。

```typescript
getUp(): Vector3
```

**返回值**
- `Vector3` - 上方向向量（Y方向）

## 坐标转换方法

### toGlobal()

将本地坐标转换为全局坐标。

```typescript
toGlobal(localPoint: Vector3): Vector3
```

**参数**
- `localPoint: Vector3` - 本地坐标点

**返回值**
- `Vector3` - 全局坐标点

**示例**
```typescript
const localPoint = { x: 1, y: 0, z: 0 }
const globalPoint = node3d.toGlobal(localPoint)
```

### toLocal()

将全局坐标转换为本地坐标。

```typescript
toLocal(globalPoint: Vector3): Vector3
```

**参数**
- `globalPoint: Vector3` - 全局坐标点

**返回值**
- `Vector3` - 本地坐标点

## 距离和角度计算

### distanceTo()

计算到另一个Node3D的距离。

```typescript
distanceTo(other: Node3D): number
```

**参数**
- `other: Node3D` - 目标节点

**返回值**
- `number` - 距离

**示例**
```typescript
const distance = node3d.distanceTo(otherNode)
console.log('距离:', distance)
```

### distanceToPoint()

计算到指定点的距离。

```typescript
distanceToPoint(point: Vector3): number
```

**参数**
- `point: Vector3` - 目标点

**返回值**
- `number` - 距离

### angleTo()

计算到另一个Node3D的角度。

```typescript
angleTo(other: Node3D): number
```

**参数**
- `other: Node3D` - 目标节点

**返回值**
- `number` - 角度（弧度）

## 变换矩阵方法

### getTransform()

获取本地变换矩阵。

```typescript
getTransform(): Transform3D
```

**返回值**
- `Transform3D` - 本地变换矩阵

**Transform3D接口**
```typescript
interface Transform3D {
  position: Vector3
  rotation: Vector3
  scale: Vector3
  matrix: THREE.Matrix4
}
```

### getGlobalTransform()

获取全局变换矩阵。

```typescript
getGlobalTransform(): Transform3D
```

**返回值**
- `Transform3D` - 全局变换矩阵

### applyTransform()

应用变换矩阵。

```typescript
applyTransform(transform: Transform3D): void
```

**参数**
- `transform: Transform3D` - 要应用的变换矩阵

## 状态管理方法

### isTransformDirty()

检查变换是否需要更新。

```typescript
isTransformDirty(): boolean
```

**返回值**
- `boolean` - 是否需要更新

### markTransformDirty()

标记变换为需要更新。

```typescript
markTransformDirty(): void
```

### updateTransform()

更新变换。

```typescript
updateTransform(): void
```

## 事件

Node3D继承自Node，支持所有Node事件，并添加了3D特定事件：

```typescript
// 位置变化
node3d.on('position_changed', (position: Vector3) => {
  console.log('位置变化:', position)
})

// 旋转变化
node3d.on('rotation_changed', (rotation: Vector3) => {
  console.log('旋转变化:', rotation)
})

// 缩放变化
node3d.on('scale_changed', (scale: Vector3) => {
  console.log('缩放变化:', scale)
})

// 变换矩阵变化
node3d.on('transform_changed', (transform: Transform3D) => {
  console.log('变换变化:', transform)
})

// 四元数变化
node3d.on('quaternion_changed', (quaternion: Quaternion) => {
  console.log('四元数变化:', quaternion)
})
```

## 完整示例

```typescript
import { Node3D, Engine, Scene } from 'qaq-game-engine'

// 创建自定义3D节点
class RotatingCube extends Node3D {
  private rotationSpeed: Vector3 = { x: 0.5, y: 1.0, z: 0.3 }
  private orbitRadius: number = 5
  private orbitSpeed: number = 0.8
  private orbitTime: number = 0
  
  constructor() {
    super('RotatingCube')
    this.position = { x: 5, y: 0, z: 0 }
  }
  
  _ready(): void {
    console.log('旋转立方体准备就绪')
    
    // 监听变换变化
    this.on('position_changed', (pos) => {
      console.log('立方体位置:', pos)
    })
    
    this.on('rotation_changed', (rot) => {
      console.log('立方体旋转:', rot)
    })
  }
  
  _process(delta: number): void {
    // 自转
    this.rotate({
      x: this.rotationSpeed.x * delta,
      y: this.rotationSpeed.y * delta,
      z: this.rotationSpeed.z * delta
    })
    
    // 公转
    this.orbitTime += delta * this.orbitSpeed
    this.position = {
      x: Math.cos(this.orbitTime) * this.orbitRadius,
      y: Math.sin(this.orbitTime * 0.5) * 2,
      z: Math.sin(this.orbitTime) * this.orbitRadius
    }
    
    // 始终看向原点
    this.lookAt({ x: 0, y: 0, z: 0 })
  }
  
  // 自定义方法
  public setOrbitRadius(radius: number): void {
    this.orbitRadius = radius
  }
  
  public setRotationSpeed(speed: Vector3): void {
    this.rotationSpeed = speed
  }
}

// 使用自定义3D节点
async function create3DDemo() {
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  const scene = new Scene('3DDemo')
  const root = new Node3D('Root')
  scene.addChild(root)
  
  // 创建多个旋转立方体
  for (let i = 0; i < 3; i++) {
    const cube = new RotatingCube()
    cube.setOrbitRadius(3 + i * 2)
    cube.setRotationSpeed({
      x: 0.5 + i * 0.2,
      y: 1.0 + i * 0.3,
      z: 0.3 + i * 0.1
    })
    root.addChild(cube)
  }
  
  // 创建中心参考点
  const center = new Node3D('Center')
  center.position = { x: 0, y: 0, z: 0 }
  root.addChild(center)
  
  await engine.setMainScene(scene)
  engine.switchTo3D()
  engine.startRendering()
  
  console.log('3D演示创建完成')
}

create3DDemo().catch(console.error)
```

## 最佳实践

1. **坐标系统**：熟悉右手坐标系，合理使用3D空间
2. **变换顺序**：注意旋转、缩放、平移的应用顺序
3. **性能优化**：避免频繁的变换计算和矩阵操作
4. **空间计算**：使用内置方法进行3D空间计算
5. **事件监听**：合理使用变换事件，避免过度监听
6. **层次结构**：合理组织3D节点的父子关系

---

Node3D是QAQ引擎中3D游戏开发的核心基类，掌握其API对于创建复杂的3D场景至关重要。
