# Node API 文档

Node是QAQ游戏引擎中所有节点的基类，提供了场景图的基础功能，包括层次结构、变换、生命周期管理等。

## 类定义

```typescript
class Node extends QaqObject {
  constructor(name?: string)
  
  // 基础属性
  name: string
  readonly id: string
  position: Vector3
  readonly globalPosition: Vector3
  visible: boolean
  renderLayer: string
  processMode: ProcessMode
  processPriority: number
  readonly parent: Node | null
  readonly children: Node[]
  readonly isInsideTree: boolean
  readonly isReady: boolean
  readonly object3D: THREE.Object3D
  
  // 层次结构方法
  addChild(child: Node, index?: number): void
  addChildren(children: Node[]): void
  removeChild(child: Node): void
  removeAllChildren(): void
  removeFromParent(): void
  getChild(index: number): Node | null
  getChildCount(): number
  getChildIndex(child: Node): number
  hasChild(child: Node): boolean
  
  // 节点查找
  findChild(name: string, recursive?: boolean): Node | null
  findChildren(pattern: string, type?: string, recursive?: boolean, includeInternal?: boolean): Node[]
  getNode(path: string): Node | null
  hasNode(path: string): boolean
  findNodeById(id: string): Node | null
  
  // 生命周期方法
  _ready(): void
  _process(delta: number): void
  _physics_process(delta: number): void
  _input(event: any): void
  _unhandled_input(event: any): void
  _exit_tree(): void
  
  // 脚本系统
  attachScript(scriptClassName: string): boolean
  detachScript(scriptClassName: string): boolean
  hasScript(scriptClassName: string): boolean
  getScriptInstances(): ScriptInstance[]
  getScriptClassNames(): string[]
  setScript(scriptCode: string): void
  getScript(): string
  getScriptInstance(): NodeScript | null
  
  // 变换方法
  getWorldMatrix(): THREE.Matrix4
  getClassName(): string
  getInstanceId(): number
  getPath(): string
  
  // 状态管理
  markDirty(): void
  isDirty(): boolean
  clearDirty(): void
  
  // 遍历
  traverse(callback: (node: Node) => void): void
  
  // 销毁
  destroy(): void
}
```

## 构造函数

### constructor()

创建一个新的Node实例。

```typescript
constructor(name?: string)
```

**参数**
- `name?: string` - 节点名称，默认为"Node"

**示例**
```typescript
const node = new Node('MyNode')
```

## 基础属性

### name

节点名称。

```typescript
name: string
```

**示例**
```typescript
node.name = 'PlayerNode'
console.log(node.name) // 'PlayerNode'
```

### id

节点唯一标识符（只读）。

```typescript
readonly id: string
```

### position

节点在父节点坐标系中的位置。

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
node.position = { x: 100, y: 200, z: 0 }
console.log(node.position) // { x: 100, y: 200, z: 0 }
```

### globalPosition

节点在全局坐标系中的位置（只读）。

```typescript
readonly globalPosition: Vector3
```

### visible

节点是否可见。

```typescript
visible: boolean
```

**示例**
```typescript
node.visible = false
console.log(node.visible) // false
```

### renderLayer

节点的渲染层。

```typescript
renderLayer: string
```

**可选值**
- `'2D'` - 2D渲染层
- `'3D'` - 3D渲染层
- `'UI'` - UI渲染层

**示例**
```typescript
node.renderLayer = '2D'
```

### processMode

节点的处理模式。

```typescript
processMode: ProcessMode
```

**ProcessMode枚举**
```typescript
type ProcessMode = 'INHERIT' | 'PAUSABLE' | 'WHEN_PAUSED' | 'ALWAYS' | 'DISABLED'
```

**示例**
```typescript
node.processMode = 'PAUSABLE'
```

### processPriority

节点的处理优先级。

```typescript
processPriority: number
```

**示例**
```typescript
node.processPriority = 10 // 较高优先级
```

### parent

节点的父节点（只读）。

```typescript
readonly parent: Node | null
```

### children

节点的子节点数组（只读）。

```typescript
readonly children: Node[]
```

### isInsideTree

节点是否在场景树中（只读）。

```typescript
readonly isInsideTree: boolean
```

### isReady

节点是否已准备就绪（只读）。

```typescript
readonly isReady: boolean
```

### object3D

节点对应的Three.js对象（只读）。

```typescript
readonly object3D: THREE.Object3D
```

## 层次结构方法

### addChild()

添加子节点。

```typescript
addChild(child: Node, index?: number): void
```

**参数**
- `child: Node` - 要添加的子节点
- `index?: number` - 插入位置，默认添加到末尾

**示例**
```typescript
const parent = new Node('Parent')
const child = new Node('Child')
parent.addChild(child)
```

### addChildren()

批量添加子节点。

```typescript
addChildren(children: Node[]): void
```

**参数**
- `children: Node[]` - 要添加的子节点数组

**示例**
```typescript
const parent = new Node('Parent')
const child1 = new Node('Child1')
const child2 = new Node('Child2')
parent.addChildren([child1, child2])
```

### removeChild()

移除子节点。

```typescript
removeChild(child: Node): void
```

**参数**
- `child: Node` - 要移除的子节点

**示例**
```typescript
parent.removeChild(child)
```

### removeAllChildren()

移除所有子节点。

```typescript
removeAllChildren(): void
```

**示例**
```typescript
parent.removeAllChildren()
```

### removeFromParent()

从父节点中移除自己。

```typescript
removeFromParent(): void
```

**示例**
```typescript
child.removeFromParent()
```

### getChild()

获取指定索引的子节点。

```typescript
getChild(index: number): Node | null
```

**参数**
- `index: number` - 子节点索引

**返回值**
- `Node | null` - 子节点或null

**示例**
```typescript
const firstChild = parent.getChild(0)
```

### getChildCount()

获取子节点数量。

```typescript
getChildCount(): number
```

**返回值**
- `number` - 子节点数量

### getChildIndex()

获取子节点的索引。

```typescript
getChildIndex(child: Node): number
```

**参数**
- `child: Node` - 子节点

**返回值**
- `number` - 子节点索引，如果不是子节点则返回-1

### hasChild()

检查是否包含指定子节点。

```typescript
hasChild(child: Node): boolean
```

**参数**
- `child: Node` - 要检查的节点

**返回值**
- `boolean` - 是否包含该子节点

## 节点查找

### findChild()

通过名称查找子节点。

```typescript
findChild(name: string, recursive?: boolean): Node | null
```

**参数**
- `name: string` - 节点名称
- `recursive?: boolean` - 是否递归查找，默认false

**返回值**
- `Node | null` - 找到的节点或null

**示例**
```typescript
const child = parent.findChild('Player', true)
```

### findChildren()

查找多个子节点。

```typescript
findChildren(pattern: string, type?: string, recursive?: boolean, includeInternal?: boolean): Node[]
```

**参数**
- `pattern: string` - 名称模式，支持*通配符
- `type?: string` - 节点类型
- `recursive?: boolean` - 是否递归查找，默认false
- `includeInternal?: boolean` - 是否包含内部节点，默认false

**返回值**
- `Node[]` - 找到的节点数组

**示例**
```typescript
const buttons = parent.findChildren('Button*', 'Button2D', true)
```

### getNode()

通过路径获取节点。

```typescript
getNode(path: string): Node | null
```

**参数**
- `path: string` - 节点路径，如"Parent/Child"

**返回值**
- `Node | null` - 找到的节点或null

**示例**
```typescript
const node = root.getNode('UI/MainMenu/PlayButton')
```

### hasNode()

检查是否存在指定路径的节点。

```typescript
hasNode(path: string): boolean
```

**参数**
- `path: string` - 节点路径

**返回值**
- `boolean` - 是否存在该节点

### findNodeById()

通过ID查找节点。

```typescript
findNodeById(id: string): Node | null
```

**参数**
- `id: string` - 节点ID

**返回值**
- `Node | null` - 找到的节点或null

## 生命周期方法

### _ready()

节点准备就绪时调用。

```typescript
_ready(): void
```

**示例**
```typescript
class MyNode extends Node {
  _ready(): void {
    console.log('节点已准备就绪')
  }
}
```

### _process()

每帧处理时调用。

```typescript
_process(delta: number): void
```

**参数**
- `delta: number` - 帧时间增量（秒）

**示例**
```typescript
class MyNode extends Node {
  _process(delta: number): void {
    console.log('帧时间:', delta)
  }
}
```

### _physics_process()

物理帧处理时调用。

```typescript
_physics_process(delta: number): void
```

**参数**
- `delta: number` - 物理帧时间增量（秒）

### _input()

输入事件处理。

```typescript
_input(event: any): void
```

**参数**
- `event: any` - 输入事件

### _unhandled_input()

未处理的输入事件处理。

```typescript
_unhandled_input(event: any): void
```

**参数**
- `event: any` - 未处理的输入事件

### _exit_tree()

节点退出场景树时调用。

```typescript
_exit_tree(): void
```

**示例**
```typescript
class MyNode extends Node {
  _exit_tree(): void {
    console.log('节点退出场景树')
  }
}
```

## 脚本系统

### attachScript()

附加脚本类到节点。

```typescript
attachScript(scriptClassName: string): boolean
```

**参数**
- `scriptClassName: string` - 脚本类名

**返回值**
- `boolean` - 是否成功附加

**示例**
```typescript
node.attachScript('PlayerController')
```

### detachScript()

分离脚本类从节点。

```typescript
detachScript(scriptClassName: string): boolean
```

**参数**
- `scriptClassName: string` - 脚本类名

**返回值**
- `boolean` - 是否成功分离

### hasScript()

检查是否附加了指定脚本类。

```typescript
hasScript(scriptClassName: string): boolean
```

**参数**
- `scriptClassName: string` - 脚本类名

**返回值**
- `boolean` - 是否附加了该脚本类

### getScriptInstances()

获取所有脚本实例。

```typescript
getScriptInstances(): ScriptInstance[]
```

**返回值**
- `ScriptInstance[]` - 脚本实例列表

**ScriptInstance接口**
```typescript
interface ScriptInstance {
  className: string
  instance: any
  initialized: boolean
}
```

### getScriptClassNames()

获取附加的脚本类名列表。

```typescript
getScriptClassNames(): string[]
```

**返回值**
- `string[]` - 脚本类名列表

### setScript()

设置节点脚本（旧版本，保持向后兼容）。

```typescript
setScript(scriptCode: string): void
```

**参数**
- `scriptCode: string` - JavaScript脚本代码

### getScript()

获取节点脚本代码（旧版本，保持向后兼容）。

```typescript
getScript(): string
```

**返回值**
- `string` - 脚本代码

### getScriptInstance()

获取脚本实例（旧版本，保持向后兼容）。

```typescript
getScriptInstance(): NodeScript | null
```

**返回值**
- `NodeScript | null` - 脚本实例

## 变换方法

### getWorldMatrix()

获取世界变换矩阵。

```typescript
getWorldMatrix(): THREE.Matrix4
```

**返回值**
- `THREE.Matrix4` - 世界变换矩阵

### getClassName()

获取节点类名。

```typescript
getClassName(): string
```

**返回值**
- `string` - 节点类名

**示例**
```typescript
console.log(node.getClassName()) // 'Node'
```

### getInstanceId()

获取实例ID。

```typescript
getInstanceId(): number
```

**返回值**
- `number` - 实例ID

### getPath()

获取节点路径。

```typescript
getPath(): string
```

**返回值**
- `string` - 节点路径，如"/Root/Player"

## 状态管理

### markDirty()

标记节点为脏（需要更新）。

```typescript
markDirty(): void
```

### isDirty()

检查节点是否为脏。

```typescript
isDirty(): boolean
```

**返回值**
- `boolean` - 是否为脏

### clearDirty()

清除脏标记。

```typescript
clearDirty(): void
```

## 遍历

### traverse()

遍历节点及其所有子节点。

```typescript
traverse(callback: (node: Node) => void): void
```

**参数**
- `callback: (node: Node) => void` - 遍历回调函数

**示例**
```typescript
node.traverse((child) => {
  console.log('遍历到节点:', child.name)
})
```

## 销毁

### destroy()

销毁节点及其所有子节点。

```typescript
destroy(): void
```

**示例**
```typescript
node.destroy()
```

## 事件

Node继承自QaqObject，支持事件系统：

```typescript
// 位置变化
node.on('position_changed', (position: Vector3) => {
  console.log('位置变化:', position)
})

// 可见性变化
node.on('visibility_changed', (visible: boolean) => {
  console.log('可见性变化:', visible)
})

// 子节点添加
node.on('child_added', (child: Node) => {
  console.log('添加子节点:', child.name)
})

// 子节点移除
node.on('child_removed', (child: Node) => {
  console.log('移除子节点:', child.name)
})

// 准备完成
node.on('ready', () => {
  console.log('节点准备完成')
})
```

## 完整示例

```typescript
import { Node, Engine, Scene } from 'qaq-game-engine'

// 创建自定义节点
class GameManager extends Node {
  private score: number = 0
  
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
    // 更新游戏逻辑
    console.log('游戏更新:', delta)
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
async function createGame() {
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600
  })
  
  const scene = new Scene('GameScene')
  const root = new Node('Root')
  scene.addChild(root)
  
  const gameManager = new GameManager()
  root.addChild(gameManager)
  
  const player = new Node('Player')
  root.addChild(player)
  
  await engine.setMainScene(scene)
  engine.startRendering()
}

createGame().catch(console.error)
```
