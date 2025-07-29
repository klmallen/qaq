# Node2D 2D节点

Node2D是QAQ游戏引擎中所有2D节点的基类，继承自[Node](/guide/nodes/node)，专门用于2D游戏开发。它提供了2D变换、渲染和坐标系统。

## 基本概念

Node2D专为2D游戏设计，提供：

- **2D变换**：位置、旋转、缩放、倾斜
- **2D坐标系**：左上角为原点(0,0)，Y轴向下
- **Z索引**：控制2D元素的渲染顺序
- **可见性**：控制节点的显示/隐藏
- **调制颜色**：全局颜色调整

## 创建Node2D

```typescript
import { Node2D } from 'qaq-game-engine'

// 创建基础2D节点
const node2d = new Node2D('MyNode2D')

// 设置位置
node2d.position = { x: 100, y: 200 }
```

## 2D变换属性

### 位置

```typescript
// 设置位置（2D坐标）
node2d.position = { x: 100, y: 200 }
console.log(node2d.position) // { x: 100, y: 200 }

// 获取全局位置
const globalPos = node2d.globalPosition
console.log(globalPos) // { x: 100, y: 200 }（如果没有父节点）

// 设置全局位置
node2d.globalPosition = { x: 500, y: 300 }
```

### 旋转

```typescript
// 设置旋转（弧度）
node2d.rotation = Math.PI / 4 // 45度
console.log(node2d.rotation) // 0.7853981633974483

// 设置旋转（角度）
node2d.rotationDegrees = 45
console.log(node2d.rotationDegrees) // 45
```

### 缩放

```typescript
// 设置缩放
node2d.scale = { x: 2, y: 1.5 }
console.log(node2d.scale) // { x: 2, y: 1.5 }

// 等比例缩放
node2d.setScale(2) // 同时设置x和y为2
```

### 倾斜

```typescript
// 设置倾斜（弧度）
node2d.skew = 0.3
console.log(node2d.skew) // 0.3
```

## Z索引和渲染顺序

Z索引控制2D节点的渲染顺序，值越大越靠前（显示在上层）：

```typescript
// 设置Z索引
node2d.zIndex = 10
console.log(node2d.zIndex) // 10

// 设置Z索引是否相对于父节点
node2d.zAsRelative = true
console.log(node2d.zAsRelative) // true
```

## 可见性和颜色

```typescript
// 设置可见性
node2d.visible = false
console.log(node2d.visible) // false

// 设置调制颜色（影响节点及其子节点）
node2d.modulate = { r: 1, g: 0.5, b: 0.5, a: 1 } // 偏红色
console.log(node2d.modulate) // { r: 1, g: 0.5, b: 0.5, a: 1 }
```

## 2D变换操作

### 移动节点

```typescript
// 相对移动
node2d.translate({ x: 50, y: 30 })

// 向指定方向移动指定距离
node2d.moveLocal(45, 100) // 向45度方向移动100像素
```

### 旋转节点

```typescript
// 相对旋转（弧度）
node2d.rotate(Math.PI / 8) // 旋转22.5度

// 相对旋转（角度）
node2d.rotateDegrees(45) // 旋转45度
```

### 缩放节点

```typescript
// 相对缩放
node2d.scaleBy({ x: 1.5, y: 1.5 })

// 等比例缩放
node2d.scaleBy(1.5)
```

### 变换矩阵

```typescript
// 获取本地变换矩阵
const transform = node2d.getTransform()

// 获取全局变换矩阵
const globalTransform = node2d.getGlobalTransform()

// 应用变换
node2d.applyTransform(transform)
```

## 坐标转换

```typescript
// 将本地坐标转换为全局坐标
const localPoint = { x: 10, y: 20 }
const globalPoint = node2d.toGlobal(localPoint)

// 将全局坐标转换为本地坐标
const globalPoint2 = { x: 100, y: 200 }
const localPoint2 = node2d.toLocal(globalPoint2)
```

## 2D节点信号

Node2D提供了一些特定的信号：

```typescript
// 位置变化
node2d.on('position_changed', (position) => {
  console.log('2D位置变化:', position)
})

// 旋转变化
node2d.on('rotation_changed', (rotation) => {
  console.log('旋转变化:', rotation)
})

// 缩放变化
node2d.on('scale_changed', (scale) => {
  console.log('缩放变化:', scale)
})

// Z索引变化
node2d.on('z_index_changed', (zIndex) => {
  console.log('Z索引变化:', zIndex)
})

// 调制颜色变化
node2d.on('modulate_changed', (color) => {
  console.log('调制颜色变化:', color)
})
```

## 2D节点层次结构

```typescript
// 创建2D节点树
const root = new Node2D('Root')

const background = new Node2D('Background')
background.zIndex = -10 // 放在最底层
root.addChild(background)

const player = new Node2D('Player')
player.position = { x: 400, y: 300 }
player.zIndex = 10
root.addChild(player)

const ui = new Node2D('UI')
ui.zIndex = 100 // 放在最上层
root.addChild(ui)
```

## 2D变换状态

```typescript
// 检查变换是否为脏（需要更新）
if (node2d.isTransformDirty()) {
  console.log('变换需要更新')
}

// 标记变换为脏
node2d.markTransformDirty()

// 更新变换
node2d.updateTransform()
```

## 与Three.js的集成

Node2D内部使用Three.js实现渲染：

```typescript
// 获取Three.js对象
const threeObject = node2d.object3D
console.log(threeObject) // THREE.Object3D

// 直接操作Three.js对象（不推荐，除非有特殊需求）
threeObject.position.set(100, -200, 0) // 注意：Three.js中Y轴向上
```

## 2D坐标系统

QAQ引擎的2D坐标系统使用左上角作为原点(0,0)，Y轴向下：

```
(0,0) -----> X轴
   |
   |
   v
  Y轴
```

这与传统的UI坐标系统一致，便于2D游戏和UI开发。

## 2D节点的子类

Node2D是多种2D节点的基类：

- **Sprite2D**：显示2D图像
- **AnimatedSprite2D**：显示2D动画
- **TileMap2D**：瓦片地图
- **Button2D**：交互按钮
- **Label**：文本标签
- **Panel**：UI面板

## 完整示例

```typescript
import { Node2D, Scene, Engine } from 'qaq-game-engine'

// 创建自定义2D节点
class Player extends Node2D {
  private speed: number = 200
  private direction: { x: number, y: number } = { x: 1, y: 0 }
  
  constructor() {
    super('Player')
    this.position = { x: 400, y: 300 }
    this.scale = { x: 1.5, y: 1.5 }
    this.zIndex = 10
  }
  
  _ready(): void {
    console.log('玩家准备就绪')
    
    // 监听位置变化
    this.on('position_changed', (pos) => {
      console.log('玩家位置:', pos)
    })
  }
  
  _process(delta: number): void {
    // 移动玩家
    const movement = {
      x: this.direction.x * this.speed * delta,
      y: this.direction.y * this.speed * delta
    }
    
    this.translate(movement)
    
    // 边界检查
    const pos = this.position
    const bounds = { width: 800, height: 600 }
    
    if (pos.x < 0 || pos.x > bounds.width) {
      this.direction.x *= -1
    }
    
    if (pos.y < 0 || pos.y > bounds.height) {
      this.direction.y *= -1
    }
  }
}

// 使用自定义2D节点
async function createGame() {
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  const scene = new Scene('GameScene')
  const root = new Node2D('Root')
  scene.addChild(root)
  
  const player = new Player()
  root.addChild(player)
  
  await engine.setMainScene(scene)
  engine.switchTo2D()
  engine.startRendering()
}

createGame().catch(console.error)
```

## 最佳实践

1. **坐标系统**：记住2D坐标系以(0,0)为左上角，Y轴向下
2. **Z索引**：合理使用zIndex控制渲染顺序
3. **变换优化**：避免频繁改变变换属性
4. **层次结构**：使用清晰的节点层次结构组织2D元素
5. **信号使用**：使用信号响应变换变化

---

Node2D是QAQ引擎中2D游戏开发的基础，掌握它的用法对于创建2D游戏至关重要。接下来可以学习具体的2D节点类型，如[Sprite2D](/api/nodes/sprite2d)和[Button2D](/api/nodes/button2d)。
