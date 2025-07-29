# Node 基础节点

Node是QAQ游戏引擎中所有节点的基类，提供了场景图的基础功能，包括层次结构、变换、生命周期管理等。

## 基本概念

在QAQ引擎中，一切都是节点。Node提供了：

- **层次结构**：父子关系管理
- **变换系统**：位置、旋转、缩放
- **生命周期**：_ready、_process等回调
- **事件系统**：信号和事件处理
- **脚本支持**：脚本附加和管理

## 节点层次结构

```
Scene (根节点)
├── Node2D (UI层)
│   ├── Button2D
│   └── Label
├── Node3D (游戏世界)
│   ├── Camera3D
│   ├── MeshInstance3D
│   └── Light3D
└── Node2D (HUD层)
    └── Sprite2D
```

## 创建节点

```typescript
import { Node } from 'qaq-game-engine'

// 创建基础节点
const node = new Node('MyNode')

// 设置节点属性
node.position = { x: 100, y: 200, z: 0 }
node.visible = true
```

## 节点属性

### 基础属性

```typescript
// 节点名称
node.name = 'PlayerNode'
console.log(node.name) // 'PlayerNode'

// 节点ID（只读）
console.log(node.id) // 自动生成的唯一ID

// 节点类名（只读）
console.log(node.getClassName()) // 'Node'

// 可见性
node.visible = false
console.log(node.visible) // false

// 渲染层
node.renderLayer = '2D'
console.log(node.renderLayer) // '2D'
```

### 变换属性

```typescript
// 位置（3D坐标）
node.position = { x: 100, y: 200, z: 0 }
console.log(node.position) // { x: 100, y: 200, z: 0 }

// 全局位置
node.globalPosition = { x: 500, y: 300, z: 0 }
console.log(node.globalPosition)

// 处理模式
node.processMode = 'INHERIT' // 'INHERIT' | 'PAUSABLE' | 'WHEN_PAUSED' | 'ALWAYS' | 'DISABLED'

// 处理优先级
node.processPriority = 0
```

## 层次结构管理

### 添加子节点

```typescript
const parent = new Node('Parent')
const child = new Node('Child')

// 添加子节点
parent.addChild(child)

// 在指定位置插入子节点
parent.addChild(child, 0) // 插入到第一个位置

// 批量添加子节点
const child2 = new Node('Child2')
const child3 = new Node('Child3')
parent.addChildren([child2, child3])
```

### 移除子节点

```typescript
// 移除指定子节点
parent.removeChild(child)

// 移除所有子节点
parent.removeAllChildren()

// 从父节点移除自己
child.removeFromParent()
```

### 查找节点

```typescript
// 通过名称查找直接子节点
const foundChild = parent.findChild('Child')

// 递归查找子节点
const foundNode = parent.findChild('DeepChild', true)

// 通过路径查找节点
const nodeByPath = parent.getNode('Child/GrandChild')

// 查找多个节点
const allButtons = parent.findChildren('Button*', undefined, true)

// 检查是否包含子节点
if (parent.hasChild(child)) {
  console.log('包含该子节点')
}
```

### 节点关系

```typescript
// 获取父节点
console.log(child.parent) // parent节点或null

// 获取所有子节点
console.log(parent.children) // Node[]

// 获取子节点数量
console.log(parent.getChildCount()) // number

// 获取指定索引的子节点
const firstChild = parent.getChild(0)

// 获取节点在父节点中的索引
const index = parent.getChildIndex(child)

// 获取节点路径
console.log(child.getPath()) // '/Parent/Child'
```

## 生命周期

Node提供了完整的生命周期回调：

```typescript
class MyNode extends Node {
  // 节点准备完成时调用
  _ready(): void {
    console.log('节点已准备就绪')
    // 初始化逻辑
  }
  
  // 每帧调用
  _process(delta: number): void {
    // 更新逻辑
    console.log('帧时间:', delta)
  }
  
  // 物理帧调用
  _physics_process(delta: number): void {
    // 物理更新逻辑
  }
  
  // 输入事件处理
  _input(event: any): void {
    // 处理输入
  }
  
  // 未处理的输入事件
  _unhandled_input(event: any): void {
    // 处理未被其他节点处理的输入
  }
  
  // 节点退出场景树时调用
  _exit_tree(): void {
    console.log('节点退出场景树')
    // 清理逻辑
  }
}
```

### 生命周期状态

```typescript
// 检查节点是否在场景树中
if (node.isInsideTree) {
  console.log('节点在场景树中')
}

// 检查节点是否已准备
if (node.isReady) {
  console.log('节点已准备就绪')
}

// 手动触发准备状态
node._ready()
```

## 脚本系统

### 附加脚本

```typescript
// 附加脚本类到节点
node.attachScript('PlayerController')

// 分离脚本
node.detachScript('PlayerController')

// 检查是否有指定脚本
if (node.hasScript('PlayerController')) {
  console.log('节点有PlayerController脚本')
}

// 获取所有脚本实例
const scripts = node.getScriptInstances()

// 获取脚本类名列表
const scriptNames = node.getScriptClassNames()
```

### 旧版脚本支持

```typescript
// 设置字符串脚本（向后兼容）
node.setScript(`
  function _ready() {
    print("旧版脚本准备就绪");
  }
  
  function _process(delta) {
    // 更新逻辑
  }
`)

// 获取脚本代码
const scriptCode = node.getScript()
```

## 事件系统

### 信号发射和监听

```typescript
// 发射信号
node.emit('health_changed', { health: 100, maxHealth: 100 })

// 监听信号
node.on('health_changed', (data) => {
  console.log('生命值变化:', data.health)
})

// 一次性监听
node.once('died', () => {
  console.log('角色死亡')
})

// 移除监听器
const listener = (data) => console.log(data)
node.on('custom_event', listener)
node.off('custom_event', listener)
```

### 内置信号

Node提供了一些内置信号：

```typescript
// 位置变化
node.on('position_changed', (position) => {
  console.log('位置变化:', position)
})

// 可见性变化
node.on('visibility_changed', (visible) => {
  console.log('可见性变化:', visible)
})

// 准备完成
node.on('ready', () => {
  console.log('节点准备完成')
})

// 子节点添加
node.on('child_added', (child) => {
  console.log('添加子节点:', child.name)
})

// 子节点移除
node.on('child_removed', (child) => {
  console.log('移除子节点:', child.name)
})
```

## Three.js集成

Node与Three.js对象紧密集成：

```typescript
// 获取Three.js对象
const threeObject = node.object3D
console.log(threeObject) // THREE.Object3D

// 直接操作Three.js对象
threeObject.position.set(100, 200, 0)
threeObject.rotation.z = Math.PI / 4
threeObject.scale.setScalar(2)

// 获取世界变换矩阵
const worldMatrix = node.getWorldMatrix()
```

## 实用方法

### 节点遍历

```typescript
// 遍历所有子节点
node.traverse((child) => {
  console.log('遍历到节点:', child.name)
})

// 遍历特定类型的节点
node.traverse((child) => {
  if (child.getClassName() === 'Sprite2D') {
    console.log('找到精灵:', child.name)
  }
})
```

### 节点查询

```typescript
// 通过ID查找节点
const nodeById = node.findNodeById('some-id')

// 检查节点是否有指定路径
if (node.hasNode('Child/GrandChild')) {
  console.log('路径存在')
}

// 获取实例ID
console.log(node.getInstanceId())
```

### 状态管理

```typescript
// 标记为脏（需要更新）
node.markDirty()

// 检查是否为脏
if (node.isDirty()) {
  console.log('节点需要更新')
}

// 清除脏标记
node.clearDirty()
```

## 完整示例

```typescript
import { Node } from 'qaq-game-engine'

// 创建自定义节点类
class GameManager extends Node {
  private score: number = 0
  private gameTime: number = 0
  
  constructor() {
    super('GameManager')
    this.processPriority = 100 // 高优先级
  }
  
  _ready(): void {
    console.log('游戏管理器准备就绪')
    
    // 查找玩家节点
    const player = this.getNode('/Root/Player')
    if (player) {
      // 监听玩家事件
      player.on('score_changed', (newScore) => {
        this.updateScore(newScore)
      })
    }
    
    // 发射游戏开始信号
    this.emit('game_started')
  }
  
  _process(delta: number): void {
    // 更新游戏时间
    this.gameTime += delta
    
    // 每秒发射时间更新信号
    if (Math.floor(this.gameTime) !== Math.floor(this.gameTime - delta)) {
      this.emit('time_updated', { time: Math.floor(this.gameTime) })
    }
  }
  
  private updateScore(newScore: number): void {
    this.score = newScore
    this.emit('score_updated', { score: this.score })
  }
  
  _exit_tree(): void {
    console.log('游戏管理器退出，最终得分:', this.score)
  }
}

// 使用自定义节点
const gameManager = new GameManager()
```

## 最佳实践

1. **合理命名**：给节点起有意义的名称
2. **层次结构**：保持清晰的父子关系
3. **生命周期**：正确使用_ready和_exit_tree
4. **事件通信**：使用信号进行节点间通信
5. **脚本分离**：将复杂逻辑放在脚本中
6. **性能考虑**：避免在_process中进行重复的昂贵操作

---

Node是QAQ引擎的基础，理解其工作原理对于开发QAQ游戏至关重要。接下来可以学习[Node2D](/guide/nodes/node2d)和[Node3D](/guide/nodes/node3d)的专门功能。
