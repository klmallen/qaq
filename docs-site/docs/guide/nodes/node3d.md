# Node3D 3D节点

Node3D是QAQ游戏引擎中所有3D节点的基类，继承自[Node](/guide/nodes/node)，专门用于3D游戏开发。它提供了3D变换、渲染和空间计算功能。

## 基本概念

Node3D专为3D游戏设计，提供：

- **3D变换**：位置、旋转、缩放（完整的3D空间变换）
- **3D坐标系**：标准的3D笛卡尔坐标系
- **空间计算**：3D空间中的距离、角度、变换计算
- **渲染层管理**：3D渲染层的管理
- **Three.js集成**：与Three.js Object3D的深度集成

## 创建Node3D

```typescript
import { Node3D } from 'qaq-game-engine'

// 创建基础3D节点
const node3d = new Node3D('MyNode3D')

// 设置3D位置
node3d.position = { x: 1, y: 2, z: 3 }
```

## 3D变换属性

### 位置

```typescript
// 设置3D位置
node3d.position = { x: 10, y: 5, z: -2 }
console.log(node3d.position) // { x: 10, y: 5, z: -2 }

// 获取全局位置
const globalPos = node3d.globalPosition
console.log(globalPos) // 世界坐标系中的位置

// 设置全局位置
node3d.globalPosition = { x: 0, y: 10, z: 5 }
```

### 旋转

Node3D支持多种旋转表示方式：

```typescript
// 欧拉角旋转（弧度）
node3d.rotation = { x: 0, y: Math.PI / 4, z: 0 } // Y轴旋转45度

// 欧拉角旋转（角度）
node3d.rotationDegrees = { x: 0, y: 45, z: 0 }

// 四元数旋转
node3d.quaternion = { x: 0, y: 0.383, z: 0, w: 0.924 }

// 获取旋转信息
console.log(node3d.rotation)        // 欧拉角（弧度）
console.log(node3d.rotationDegrees) // 欧拉角（角度）
console.log(node3d.quaternion)      // 四元数
```

### 缩放

```typescript
// 设置3D缩放
node3d.scale = { x: 2, y: 1, z: 0.5 }
console.log(node3d.scale) // { x: 2, y: 1, z: 0.5 }

// 等比例缩放
node3d.setScale(1.5) // 所有轴都缩放1.5倍
```

## 3D空间操作

### 移动节点

```typescript
// 相对移动
node3d.translate({ x: 1, y: 0, z: -1 })

// 沿本地坐标轴移动
node3d.translateLocal({ x: 0, y: 2, z: 0 }) // 沿本地Y轴向上移动2单位

// 向前移动（沿-Z轴）
node3d.moveForward(5)

// 向右移动（沿X轴）
node3d.moveRight(3)

// 向上移动（沿Y轴）
node3d.moveUp(2)
```

### 旋转节点

```typescript
// 相对旋转（弧度）
node3d.rotate({ x: 0, y: Math.PI / 8, z: 0 })

// 相对旋转（角度）
node3d.rotateDegrees({ x: 0, y: 22.5, z: 0 })

// 绕轴旋转
node3d.rotateX(Math.PI / 4)  // 绕X轴旋转45度
node3d.rotateY(Math.PI / 2)  // 绕Y轴旋转90度
node3d.rotateZ(Math.PI / 6)  // 绕Z轴旋转30度

// 看向目标点
node3d.lookAt({ x: 0, y: 0, z: 0 }) // 看向原点
```

### 缩放节点

```typescript
// 相对缩放
node3d.scaleBy({ x: 1.2, y: 1.2, z: 1.2 })

// 等比例缩放
node3d.scaleBy(1.5)
```

## 3D变换矩阵

```typescript
// 获取本地变换矩阵
const localTransform = node3d.getTransform()

// 获取全局变换矩阵
const globalTransform = node3d.getGlobalTransform()

// 应用变换矩阵
node3d.applyTransform(localTransform)

// 获取Three.js世界矩阵
const worldMatrix = node3d.getWorldMatrix()
```

## 3D空间计算

### 坐标转换

```typescript
// 本地坐标转全局坐标
const localPoint = { x: 1, y: 0, z: 0 }
const globalPoint = node3d.toGlobal(localPoint)

// 全局坐标转本地坐标
const globalPoint2 = { x: 5, y: 3, z: -2 }
const localPoint2 = node3d.toLocal(globalPoint2)
```

### 方向向量

```typescript
// 获取节点的方向向量
const forward = node3d.getForward()   // -Z方向
const right = node3d.getRight()       // X方向
const up = node3d.getUp()             // Y方向

console.log('前方向量:', forward)
console.log('右方向量:', right)
console.log('上方向量:', up)
```

### 距离和角度计算

```typescript
// 计算到另一个节点的距离
const otherNode = new Node3D('Other')
otherNode.position = { x: 5, y: 0, z: 0 }

const distance = node3d.distanceTo(otherNode)
console.log('距离:', distance)

// 计算到点的距离
const pointDistance = node3d.distanceToPoint({ x: 10, y: 5, z: -3 })
console.log('到点的距离:', pointDistance)

// 计算角度
const angle = node3d.angleTo(otherNode)
console.log('角度:', angle)
```

## 3D节点信号

Node3D提供了3D特定的信号：

```typescript
// 位置变化
node3d.on('position_changed', (position) => {
  console.log('3D位置变化:', position)
})

// 旋转变化
node3d.on('rotation_changed', (rotation) => {
  console.log('旋转变化:', rotation)
})

// 缩放变化
node3d.on('scale_changed', (scale) => {
  console.log('缩放变化:', scale)
})

// 变换矩阵变化
node3d.on('transform_changed', (transform) => {
  console.log('变换矩阵变化:', transform)
})
```

## 3D节点层次结构

```typescript
// 创建3D场景层次结构
const scene3D = new Node3D('Scene3D')

// 环境节点
const environment = new Node3D('Environment')
scene3D.addChild(environment)

// 几何体节点
const geometry = new Node3D('Geometry')
scene3D.addChild(geometry)

// 光照节点
const lighting = new Node3D('Lighting')
scene3D.addChild(lighting)

// 相机节点
const cameras = new Node3D('Cameras')
scene3D.addChild(cameras)
```

## 与Three.js的集成

Node3D与Three.js Object3D深度集成：

```typescript
// 获取Three.js对象
const threeObject = node3d.object3D
console.log(threeObject) // THREE.Object3D

// 直接操作Three.js对象
threeObject.position.set(1, 2, 3)
threeObject.rotation.set(0, Math.PI / 4, 0)
threeObject.scale.setScalar(2)

// 添加Three.js对象到节点
const mesh = new THREE.Mesh(geometry, material)
node3d.object3D.add(mesh)
```

## 3D坐标系统

QAQ引擎使用右手坐标系：

```
     Y轴 (向上)
     |
     |
     |______ X轴 (向右)
    /
   /
  Z轴 (向外，朝向观察者)
```

- **X轴**：向右为正
- **Y轴**：向上为正  
- **Z轴**：向外（朝向观察者）为正

## 3D节点的子类

Node3D是多种3D节点的基类：

- **MeshInstance3D**：3D网格渲染
- **Camera3D**：3D相机
- **Light3D**：3D光源基类
  - **DirectionalLight3D**：方向光
  - **PointLight3D**：点光源
  - **SpotLight3D**：聚光灯
- **RigidBody3D**：3D刚体物理
- **CharacterBody3D**：3D角色控制器

## 完整示例

```typescript
import { Node3D, Scene, Engine } from 'qaq-game-engine'

// 创建自定义3D节点
class Orbiter extends Node3D {
  private orbitRadius: number = 5
  private orbitSpeed: number = 1
  private orbitTime: number = 0
  private center: Node3D
  
  constructor(center: Node3D) {
    super('Orbiter')
    this.center = center
    this.position = { x: this.orbitRadius, y: 0, z: 0 }
  }
  
  _ready(): void {
    console.log('轨道节点准备就绪')
    
    // 监听变换变化
    this.on('position_changed', (pos) => {
      console.log('轨道位置:', pos)
    })
  }
  
  _process(delta: number): void {
    // 更新轨道时间
    this.orbitTime += delta * this.orbitSpeed
    
    // 计算轨道位置
    const centerPos = this.center.position
    this.position = {
      x: centerPos.x + Math.cos(this.orbitTime) * this.orbitRadius,
      y: centerPos.y,
      z: centerPos.z + Math.sin(this.orbitTime) * this.orbitRadius
    }
    
    // 始终看向中心
    this.lookAt(centerPos)
  }
}

// 使用自定义3D节点
async function create3DScene() {
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  const scene = new Scene('3DScene')
  const root = new Node3D('Root')
  scene.addChild(root)
  
  // 创建中心节点
  const center = new Node3D('Center')
  center.position = { x: 0, y: 0, z: 0 }
  root.addChild(center)
  
  // 创建轨道节点
  const orbiter = new Orbiter(center)
  root.addChild(orbiter)
  
  // 创建多个轨道节点
  for (let i = 0; i < 3; i++) {
    const orbiter = new Orbiter(center)
    orbiter.orbitRadius = 3 + i * 2
    orbiter.orbitSpeed = 0.5 + i * 0.3
    orbiter.position = { 
      x: orbiter.orbitRadius, 
      y: i * 2, 
      z: 0 
    }
    root.addChild(orbiter)
  }
  
  await engine.setMainScene(scene)
  engine.switchTo3D()
  engine.startRendering()
}

create3DScene().catch(console.error)
```

## 最佳实践

1. **坐标系统**：熟悉右手坐标系，Z轴向外为正
2. **变换顺序**：注意旋转、缩放、平移的应用顺序
3. **性能优化**：避免频繁的变换计算
4. **层次结构**：合理组织3D节点的父子关系
5. **空间计算**：使用内置方法进行3D空间计算
6. **Three.js集成**：充分利用Three.js的3D功能

---

Node3D是QAQ引擎中3D游戏开发的基础，掌握它的用法对于创建3D游戏至关重要。接下来可以学习具体的3D节点类型，如[MeshInstance3D](/api/nodes/mesh-instance3d)和[Camera3D](/api/nodes/camera3d)。
