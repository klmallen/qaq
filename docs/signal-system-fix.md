# QAQ引擎信号系统修复文档

## 🔧 **问题修复**

### **问题描述**
在创建Viewport和ViewportManager时，错误地使用了Node.js的EventEmitter，但QAQ引擎有自己的信号系统。

### **修复方案**
将所有组件改为继承`QaqObject`，使用QAQ引擎的信号系统。

## 📡 **QAQ引擎信号系统**

### **核心架构**
```
QaqObject (基础对象类)
├── 信号系统 (QaqSignal)
├── 属性系统 (QaqProperty)  
└── 元数据系统
```

### **信号系统特点**
- ✅ **类型安全**：基于TypeScript的强类型信号
- ✅ **性能优化**：专为游戏引擎优化的信号机制
- ✅ **内存管理**：自动清理信号连接，防止内存泄漏
- ✅ **调试友好**：提供详细的信号调试信息

## 🔄 **修复对比**

### **修复前（错误）**
```typescript
import { EventEmitter } from 'events'

export class Viewport extends EventEmitter {
  constructor(config: ViewportConfig) {
    super()  // ❌ 使用Node.js EventEmitter
    // ...
  }
}
```

### **修复后（正确）**
```typescript
import { QaqObject } from '../object/QaqObject'

export class Viewport extends QaqObject {
  constructor(config: ViewportConfig) {
    super('Viewport')  // ✅ 使用QAQ信号系统
    // ...
  }

  protected initializeSignals(): void {
    super.initializeSignals()
    
    // 添加视口特有的信号
    this.addSignal('rect_changed')
    this.addSignal('world_rect_changed')
    this.addSignal('zoom_changed')
    // ...
  }
}
```

## 📋 **信号使用示例**

### **1. 基础信号操作**
```typescript
// 创建视口
const viewport = new Viewport(config)

// 监听信号
viewport.connect('rect_changed', (newRect) => {
  console.log('视口大小改变:', newRect)
})

// 发射信号（内部自动调用）
viewport.rect = { x: 0, y: 0, width: 1024, height: 768 }
// 自动触发 'rect_changed' 信号
```

### **2. 视口管理器信号**
```typescript
const viewportManager = ViewportManager.getInstance()

// 监听视口添加
viewportManager.connect('viewport_added', ({ name, viewport }) => {
  console.log(`视口 '${name}' 已添加`)
})

// 监听活动视口切换
viewportManager.connect('active_viewport_changed', ({ old, new: newViewport }) => {
  console.log('活动视口已切换')
})

// 监听画布大小变化
viewportManager.connect('canvas_size_changed', (size) => {
  console.log('画布大小变化:', size)
})
```

### **3. 节点间通信**
```typescript
// 在Node2D中使用信号
class Player extends Node2D {
  constructor() {
    super('Player')
  }

  protected initializeSignals(): void {
    super.initializeSignals()
    this.addSignal('health_changed')
    this.addSignal('died')
  }

  takeDamage(damage: number): void {
    this.health -= damage
    this.emit('health_changed', { health: this.health, damage })
    
    if (this.health <= 0) {
      this.emit('died')
    }
  }
}

// 监听玩家事件
const player = new Player()
player.connect('health_changed', ({ health, damage }) => {
  console.log(`玩家受到 ${damage} 点伤害，剩余生命值: ${health}`)
})

player.connect('died', () => {
  console.log('玩家死亡')
})
```

## 🎯 **最佳实践**

### **1. 信号命名规范**
```typescript
// ✅ 推荐的信号命名
this.addSignal('position_changed')    // 状态变化
this.addSignal('button_pressed')      // 动作事件
this.addSignal('animation_finished')  // 完成事件
this.addSignal('collision_detected')  // 检测事件

// ❌ 避免的命名
this.addSignal('change')              // 太模糊
this.addSignal('event')               // 太通用
this.addSignal('update')              // 不明确
```

### **2. 信号参数设计**
```typescript
// ✅ 结构化参数
this.emit('health_changed', {
  oldHealth: 80,
  newHealth: 60,
  damage: 20,
  source: 'enemy_attack'
})

// ✅ 简单参数
this.emit('button_pressed', buttonId)

// ❌ 过多参数
this.emit('complex_event', arg1, arg2, arg3, arg4, arg5)
```

### **3. 内存管理**
```typescript
class GameManager extends QaqObject {
  private player: Player | null = null

  setupPlayer(player: Player): void {
    this.player = player
    
    // 连接信号
    player.connect('died', this.onPlayerDied.bind(this))
  }

  cleanup(): void {
    if (this.player) {
      // QaqObject会自动清理信号连接
      this.player.destroy()
      this.player = null
    }
  }

  private onPlayerDied(): void {
    console.log('游戏结束')
  }
}
```

## 🔍 **调试工具**

### **信号调试**
```typescript
// 获取对象的所有信号
const signals = viewport.getSignalList()
console.log('可用信号:', signals)

// 检查信号连接数
const connectionCount = viewport.getSignalConnectionCount('rect_changed')
console.log('rect_changed 信号连接数:', connectionCount)

// 检查是否有特定信号
if (viewport.hasSignal('zoom_changed')) {
  console.log('支持缩放变化信号')
}
```

## 🎉 **总结**

### **修复成果**
- ✅ **统一信号系统**：所有组件使用QAQ引擎的信号系统
- ✅ **类型安全**：完整的TypeScript类型支持
- ✅ **性能优化**：专为游戏引擎优化的信号机制
- ✅ **内存安全**：自动清理，防止内存泄漏

### **架构优势**
- 🔧 **一致性**：整个引擎使用统一的通信机制
- 🚀 **性能**：比Node.js EventEmitter更适合游戏场景
- 🛡️ **安全性**：强类型检查和自动内存管理
- 🔍 **调试性**：丰富的调试和监控功能

现在QAQ引擎的视口系统完全符合引擎的设计理念，提供了现代2D游戏引擎所需的所有功能！
