# ScriptBase API 文档

ScriptBase是QAQ游戏引擎中所有脚本的基类，提供了类型安全的脚本开发环境和完整的生命周期管理。

## 类定义

```typescript
abstract class ScriptBase {
  // 节点访问
  readonly node: Node
  
  // 便捷属性访问器
  get position(): Vector3
  set position(value: Vector3)
  get global_position(): Vector3
  set global_position(value: Vector3)
  get visible(): boolean
  set visible(value: boolean)
  
  // 生命周期方法（需要子类实现）
  abstract _ready(): void
  abstract _process(delta: number): void
  abstract _physics_process(delta: number): void
  abstract _input(event: any): void
  abstract _exit_tree(): void
  
  // 工具方法
  print(message: string): void
  randf(): number
  randi_range(min: number, max: number): number
  getTime(): number
  
  // 节点查找方法
  getNode(path: string): Node | null
  findNode(name: string, recursive?: boolean): Node | null
  findNodes(pattern: string, recursive?: boolean): Node[]
  
  // 信号方法
  emit(signal: string, data?: any): void
  connect(signal: string, callback: Function): void
  disconnect(signal: string, callback: Function): void
  
  // 定时器方法
  setTimeout(callback: Function, delay: number): number
  setInterval(callback: Function, interval: number): number
  clearTimeout(id: number): void
  clearInterval(id: number): void
  
  // 协程方法
  startCoroutine(generator: Generator): void
  stopCoroutine(generator: Generator): void
  yield(frames?: number): Promise<void>
  
  // 内部方法（不要直接调用）
  _initialize(node: Node): void
  _cleanup(): void
}
```

## 构造函数

ScriptBase是抽象类，不能直接实例化，需要继承使用：

```typescript
export class MyScript extends ScriptBase {
  _ready(): void {
    this.print('脚本准备就绪')
  }
  
  _process(delta: number): void {
    // 每帧更新逻辑
  }
  
  _physics_process(delta: number): void {
    // 物理更新逻辑
  }
  
  _input(event: any): void {
    // 输入处理逻辑
  }
  
  _exit_tree(): void {
    this.print('脚本退出')
  }
}
```

## 节点访问

### node

获取脚本附加的节点实例。

```typescript
readonly node: Node
```

**示例**
```typescript
_ready(): void {
  console.log('节点名称:', this.node.name)
  console.log('节点类型:', this.node.getClassName())
}
```

## 便捷属性访问器

### position

节点的位置属性。

```typescript
get position(): Vector3
set position(value: Vector3)
```

**示例**
```typescript
_ready(): void {
  // 获取位置
  const pos = this.position
  console.log('当前位置:', pos)
  
  // 设置位置
  this.position = { x: 100, y: 200, z: 0 }
}
```

### global_position

节点的全局位置属性。

```typescript
get global_position(): Vector3
set global_position(value: Vector3)
```

**示例**
```typescript
_process(delta: number): void {
  // 获取全局位置
  const globalPos = this.global_position
  
  // 设置全局位置
  this.global_position = { x: 500, y: 300, z: 0 }
}
```

### visible

节点的可见性属性。

```typescript
get visible(): boolean
set visible(value: boolean)
```

**示例**
```typescript
_ready(): void {
  // 隐藏节点
  this.visible = false
  
  // 2秒后显示
  this.setTimeout(() => {
    this.visible = true
  }, 2000)
}
```

## 生命周期方法

### _ready()

脚本初始化时调用，节点已准备就绪。

```typescript
abstract _ready(): void
```

**示例**
```typescript
_ready(): void {
  this.print('脚本初始化完成')
  this.print(`挂载到节点: ${this.node.name}`)
  
  // 初始化脚本变量
  this.speed = 200
  this.health = 100
}
```

### _process()

每帧调用，用于游戏逻辑更新。

```typescript
abstract _process(delta: number): void
```

**参数**
- `delta: number` - 帧时间增量（秒）

**示例**
```typescript
_process(delta: number): void {
  // 移动节点
  const pos = this.position
  this.position = {
    x: pos.x + this.speed * delta,
    y: pos.y,
    z: pos.z
  }
  
  // 边界检查
  if (pos.x > 800) {
    this.position = { x: 0, y: pos.y, z: pos.z }
  }
}
```

### _physics_process()

物理帧调用，用于物理相关的更新。

```typescript
abstract _physics_process(delta: number): void
```

**参数**
- `delta: number` - 物理帧时间增量（秒）

**示例**
```typescript
_physics_process(delta: number): void {
  // 应用重力
  this.velocity.y += this.gravity * delta
  
  // 更新位置
  const pos = this.position
  this.position = {
    x: pos.x + this.velocity.x * delta,
    y: pos.y + this.velocity.y * delta,
    z: pos.z
  }
}
```

### _input()

输入事件处理。

```typescript
abstract _input(event: any): void
```

**参数**
- `event: any` - 输入事件对象

**示例**
```typescript
_input(event: any): void {
  if (event.type === 'keydown') {
    switch (event.key) {
      case 'ArrowLeft':
        this.moveLeft()
        break
      case 'ArrowRight':
        this.moveRight()
        break
      case ' ':
        this.jump()
        break
    }
  }
}
```

### _exit_tree()

脚本销毁时调用，用于清理资源。

```typescript
abstract _exit_tree(): void
```

**示例**
```typescript
_exit_tree(): void {
  this.print('脚本正在销毁')
  
  // 清理定时器
  this.clearAllTimers()
  
  // 断开信号连接
  this.disconnectAllSignals()
  
  // 停止协程
  this.stopAllCoroutines()
}
```

## 工具方法

### print()

输出调试信息，会自动包含节点名称。

```typescript
print(message: string): void
```

**参数**
- `message: string` - 要输出的消息

**示例**
```typescript
_ready(): void {
  this.print('脚本已准备就绪')
  // 输出: [NodeName] 脚本已准备就绪
}
```

### randf()

生成0到1之间的随机浮点数。

```typescript
randf(): number
```

**返回值**
- `number` - 0到1之间的随机数

**示例**
```typescript
_ready(): void {
  const randomValue = this.randf()
  this.print(`随机值: ${randomValue}`)
}
```

### randi_range()

生成指定范围内的随机整数。

```typescript
randi_range(min: number, max: number): number
```

**参数**
- `min: number` - 最小值（包含）
- `max: number` - 最大值（包含）

**返回值**
- `number` - 范围内的随机整数

**示例**
```typescript
_ready(): void {
  const randomInt = this.randi_range(1, 10)
  this.print(`随机整数: ${randomInt}`)
}
```

### getTime()

获取当前时间戳（秒）。

```typescript
getTime(): number
```

**返回值**
- `number` - 当前时间戳

**示例**
```typescript
_process(delta: number): void {
  const currentTime = this.getTime()
  this.print(`当前时间: ${currentTime.toFixed(2)}秒`)
}
```

## 节点查找方法

### getNode()

通过路径获取节点。

```typescript
getNode(path: string): Node | null
```

**参数**
- `path: string` - 节点路径

**返回值**
- `Node | null` - 找到的节点或null

**示例**
```typescript
_ready(): void {
  const player = this.getNode('/Root/Player')
  if (player) {
    this.print(`找到玩家节点: ${player.name}`)
  }
}
```

### findNode()

通过名称查找节点。

```typescript
findNode(name: string, recursive?: boolean): Node | null
```

**参数**
- `name: string` - 节点名称
- `recursive?: boolean` - 是否递归查找，默认false

**返回值**
- `Node | null` - 找到的节点或null

**示例**
```typescript
_ready(): void {
  const enemy = this.findNode('Enemy', true)
  if (enemy) {
    this.print(`找到敌人: ${enemy.name}`)
  }
}
```

### findNodes()

查找多个节点。

```typescript
findNodes(pattern: string, recursive?: boolean): Node[]
```

**参数**
- `pattern: string` - 名称模式，支持*通配符
- `recursive?: boolean` - 是否递归查找，默认false

**返回值**
- `Node[]` - 找到的节点数组

**示例**
```typescript
_ready(): void {
  const enemies = this.findNodes('Enemy*', true)
  this.print(`找到${enemies.length}个敌人`)
}
```

## 信号方法

### emit()

发射信号。

```typescript
emit(signal: string, data?: any): void
```

**参数**
- `signal: string` - 信号名称
- `data?: any` - 信号数据

**示例**
```typescript
_process(delta: number): void {
  if (this.health <= 0) {
    this.emit('died', { position: this.position })
  }
}
```

### connect()

连接信号。

```typescript
connect(signal: string, callback: Function): void
```

**参数**
- `signal: string` - 信号名称
- `callback: Function` - 回调函数

**示例**
```typescript
_ready(): void {
  const player = this.getNode('/Root/Player')
  if (player) {
    this.connect('health_changed', (data) => {
      this.print(`玩家生命值: ${data.health}`)
    })
  }
}
```

### disconnect()

断开信号连接。

```typescript
disconnect(signal: string, callback: Function): void
```

**参数**
- `signal: string` - 信号名称
- `callback: Function` - 回调函数

## 定时器方法

### setTimeout()

设置单次定时器。

```typescript
setTimeout(callback: Function, delay: number): number
```

**参数**
- `callback: Function` - 回调函数
- `delay: number` - 延迟时间（毫秒）

**返回值**
- `number` - 定时器ID

**示例**
```typescript
_ready(): void {
  this.setTimeout(() => {
    this.print('3秒后执行')
  }, 3000)
}
```

### setInterval()

设置重复定时器。

```typescript
setInterval(callback: Function, interval: number): number
```

**参数**
- `callback: Function` - 回调函数
- `interval: number` - 间隔时间（毫秒）

**返回值**
- `number` - 定时器ID

**示例**
```typescript
_ready(): void {
  this.setInterval(() => {
    this.print('每秒执行一次')
  }, 1000)
}
```

### clearTimeout()

清除单次定时器。

```typescript
clearTimeout(id: number): void
```

**参数**
- `id: number` - 定时器ID

### clearInterval()

清除重复定时器。

```typescript
clearInterval(id: number): void
```

**参数**
- `id: number` - 定时器ID

## 协程方法

### startCoroutine()

启动协程。

```typescript
startCoroutine(generator: Generator): void
```

**参数**
- `generator: Generator` - 生成器函数

**示例**
```typescript
_ready(): void {
  this.startCoroutine(this.moveSequence())
}

private *moveSequence() {
  this.position = { x: 0, y: 0, z: 0 }
  yield* this.yield(60) // 等待60帧
  
  this.position = { x: 100, y: 0, z: 0 }
  yield* this.yield(60)
  
  this.position = { x: 100, y: 100, z: 0 }
}
```

### stopCoroutine()

停止协程。

```typescript
stopCoroutine(generator: Generator): void
```

### yield()

协程中的等待方法。

```typescript
yield(frames?: number): Promise<void>
```

**参数**
- `frames?: number` - 等待的帧数，默认1

**返回值**
- `Promise<void>` - Promise对象

## 完整示例

```typescript
import { ScriptBase } from 'qaq-game-engine'

export class PlayerController extends ScriptBase {
  private speed: number = 200
  private health: number = 100
  private maxHealth: number = 100
  private jumpForce: number = 500
  private isGrounded: boolean = false
  
  _ready(): void {
    this.print('玩家控制器初始化')
    this.print(`节点名称: ${this.node.name}`)
    
    // 设置初始位置
    this.position = { x: 400, y: 300, z: 0 }
    
    // 连接信号
    this.connect('health_changed', this.onHealthChanged.bind(this))
    
    // 启动生命值恢复协程
    this.startCoroutine(this.healthRegeneration())
  }
  
  _process(delta: number): void {
    // 检查边界
    const pos = this.position
    if (pos.x < 0 || pos.x > 800) {
      this.takeDamage(10)
    }
  }
  
  _physics_process(delta: number): void {
    // 物理更新逻辑
    this.updateMovement(delta)
  }
  
  _input(event: any): void {
    if (event.type === 'keydown') {
      switch (event.key) {
        case 'ArrowLeft':
        case 'a':
          this.moveLeft()
          break
        case 'ArrowRight':
        case 'd':
          this.moveRight()
          break
        case ' ':
        case 'ArrowUp':
        case 'w':
          this.jump()
          break
      }
    }
  }
  
  _exit_tree(): void {
    this.print('玩家控制器销毁')
  }
  
  private moveLeft(): void {
    const pos = this.position
    this.position = {
      x: Math.max(0, pos.x - this.speed * 0.016),
      y: pos.y,
      z: pos.z
    }
  }
  
  private moveRight(): void {
    const pos = this.position
    this.position = {
      x: Math.min(800, pos.x + this.speed * 0.016),
      y: pos.y,
      z: pos.z
    }
  }
  
  private jump(): void {
    if (this.isGrounded) {
      this.print('跳跃！')
      // 跳跃逻辑
      this.isGrounded = false
    }
  }
  
  private takeDamage(damage: number): void {
    this.health = Math.max(0, this.health - damage)
    this.emit('health_changed', {
      health: this.health,
      maxHealth: this.maxHealth
    })
    
    if (this.health <= 0) {
      this.die()
    }
  }
  
  private die(): void {
    this.print('玩家死亡')
    this.emit('player_died', { position: this.position })
    this.visible = false
    
    // 3秒后重生
    this.setTimeout(() => {
      this.respawn()
    }, 3000)
  }
  
  private respawn(): void {
    this.health = this.maxHealth
    this.position = { x: 400, y: 300, z: 0 }
    this.visible = true
    this.print('玩家重生')
  }
  
  private onHealthChanged(data: any): void {
    this.print(`生命值: ${data.health}/${data.maxHealth}`)
  }
  
  private updateMovement(delta: number): void {
    // 物理移动更新
  }
  
  private *healthRegeneration() {
    while (true) {
      yield* this.yield(300) // 等待5秒（60fps * 5）
      
      if (this.health < this.maxHealth) {
        this.health = Math.min(this.maxHealth, this.health + 1)
        this.emit('health_changed', {
          health: this.health,
          maxHealth: this.maxHealth
        })
      }
    }
  }
}
```

## 最佳实践

1. **生命周期管理**：正确实现所有必需的生命周期方法
2. **资源清理**：在_exit_tree中清理定时器、协程和信号连接
3. **错误处理**：使用try-catch包装可能出错的代码
4. **性能优化**：避免在_process中进行重复的昂贵操作
5. **类型安全**：充分利用TypeScript的类型检查
6. **模块化**：将复杂逻辑拆分为私有方法

---

ScriptBase是QAQ引擎脚本系统的核心，掌握其用法是开发游戏逻辑的基础。
