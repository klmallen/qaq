# QAQ游戏引擎脚本系统演示

这个目录包含了QAQ游戏引擎全新脚本系统的完整演示，展示了如何创建类型安全、生命周期管理完善的游戏脚本。

## 🎯 脚本系统特性

### 1. 类型安全的脚本基类
- 所有脚本必须继承 `ScriptBase` 基类
- 提供完整的TypeScript类型支持
- 编译时错误检查，避免运行时错误

### 2. 标准生命周期管理
- `_ready()`: 脚本初始化时调用
- `_process(delta)`: 每帧更新时调用
- `_physics_process(delta)`: 物理帧更新时调用
- `_input(event)`: 输入事件处理
- `_exit_tree()`: 脚本销毁时调用

### 3. 游戏模式检测
- **编辑模式**: 脚本不执行，用于场景编辑
- **播放模式**: 脚本正常执行，用于游戏运行
- **暂停模式**: 脚本暂停执行
- **调试模式**: 脚本执行并提供调试信息

### 4. 便捷的Node访问
- 通过 `this.node` 访问挂载的节点
- 通过 `this.position` 直接访问/修改节点位置
- 通过 `this.visible` 控制节点可见性
- 内置 `getNode()`, `findNode()` 等查找方法

### 5. 实用工具API
- `print()`: 带节点名称的日志输出
- `randf()`: 生成随机浮点数
- `randi_range()`: 生成指定范围的随机整数
- `getTime()`: 获取当前时间戳

## 📁 文件结构

```
test-qaq-demo/
├── README.md                    # 本文档
├── ScriptSystemDemo.vue         # 完整的演示页面
└── scripts/                     # 示例脚本目录
    ├── ScriptRegistry.ts        # 脚本注册器
    ├── RotatingSprite.ts        # 旋转精灵脚本
    ├── MovingCharacter.ts       # 移动角色脚本
    └── InteractiveButton.ts     # 交互式按钮脚本
```

## 🚀 快速开始

### 1. 运行演示

访问演示页面：
```
http://localhost:3000/test-qaq-demo/ScriptSystemDemo
```

### 2. 创建自定义脚本

```typescript
import ScriptBase from '../../core/script/ScriptBase'

export class MyCustomScript extends ScriptBase {
  private speed: number = 100
  
  _ready(): void {
    this.print('我的自定义脚本已准备就绪！')
    this.print(`节点名称: ${this.node.name}`)
  }
  
  _process(delta: number): void {
    // 让节点向右移动
    const pos = this.position
    this.position = {
      x: pos.x + this.speed * delta,
      y: pos.y,
      z: pos.z
    }
  }
  
  _exit_tree(): void {
    this.print('脚本已销毁')
  }
}
```

### 3. 注册脚本类

```typescript
import ScriptManager from '../../core/script/ScriptManager'
import { MyCustomScript } from './MyCustomScript'

const scriptManager = ScriptManager.getInstance()
scriptManager.registerScriptClass('MyCustomScript', MyCustomScript)
```

### 4. 附加脚本到节点

```typescript
// 创建节点
const myNode = new Sprite2D('MySprite')

// 附加脚本
myNode.attachScript('MyCustomScript')

// 添加到场景
scene.addChild(myNode)
```

## 📋 示例脚本说明

### RotatingSprite.ts
- **功能**: 提供旋转和缩放动画效果
- **特点**: 随机化参数、可调节速度和幅度
- **方法**: `setRotationSpeed()`, `setScaleAnimation()`, `resetAnimation()`

### MovingCharacter.ts
- **功能**: 在场景中自动移动并处理边界反弹
- **特点**: 边界检测、悬浮效果、位置重置
- **方法**: `setMoveSpeed()`, `setBounds()`, `resetPosition()`

### InteractiveButton.ts
- **功能**: 提供悬停、点击等交互效果
- **特点**: 多种视觉效果、点击计数、状态管理
- **方法**: `setHoverEffect()`, `setPulseEffect()`, `resetEffects()`

## 🎮 游戏模式控制

### 通过Engine控制
```typescript
const engine = Engine.getInstance()

// 开始播放模式
await engine.startPlayMode()

// 暂停播放
await engine.pausePlayMode()

// 停止播放（回到编辑模式）
await engine.stopPlayMode()

// 获取当前模式
const mode = await engine.getCurrentGameMode()
```

### 通过ScriptManager控制
```typescript
import { GameMode } from '../../core/script/ScriptManager'

const scriptManager = ScriptManager.getInstance()

// 直接设置游戏模式
scriptManager.setGameMode(GameMode.PLAY)
scriptManager.setGameMode(GameMode.PAUSE)
scriptManager.setGameMode(GameMode.EDITOR)
```

## 🔧 高级用法

### 脚本间通信
```typescript
export class ScriptA extends ScriptBase {
  _ready(): void {
    // 查找其他节点的脚本
    const otherNode = this.findNode('OtherNode')
    if (otherNode) {
      const scriptInstance = otherNode.getScriptInstances()
        .find(s => s.className === 'ScriptB')
      
      if (scriptInstance) {
        // 调用其他脚本的方法
        (scriptInstance.instance as any).doSomething()
      }
    }
  }
}
```

### 动态脚本管理
```typescript
// 运行时附加脚本
node.attachScript('NewScript')

// 检查是否有特定脚本
if (node.hasScript('MyScript')) {
  console.log('节点已附加MyScript')
}

// 分离脚本
node.detachScript('OldScript')

// 获取所有脚本类名
const scriptNames = node.getScriptClassNames()
```

## 📊 性能监控

脚本管理器提供实时性能统计：

```typescript
const stats = scriptManager.getStats()
console.log(`总脚本数: ${stats.totalScripts}`)
console.log(`活动脚本数: ${stats.activeScripts}`)
console.log(`本帧处理的脚本数: ${stats.processedThisFrame}`)
```

## 🐛 调试技巧

1. **使用print()方法**: 自动包含节点名称的日志输出
2. **检查游戏模式**: 确保脚本在正确的模式下执行
3. **监控性能统计**: 观察脚本执行情况
4. **使用调试模式**: 获取更详细的执行信息

## 🔄 向后兼容

新脚本系统完全向后兼容旧的字符串脚本方式：

```typescript
// 旧方式（仍然支持）
node.setScript(`
  function _ready() {
    print("旧式脚本仍然可用");
  }
  
  function _process(delta) {
    // 更新逻辑
  }
`)

// 新方式（推荐）
node.attachScript('MyTypeSafeScript')
```

## 📝 最佳实践

1. **继承ScriptBase**: 始终继承ScriptBase基类
2. **类型安全**: 充分利用TypeScript的类型检查
3. **生命周期管理**: 正确实现_ready()和_exit_tree()方法
4. **性能考虑**: 避免在_process()中进行重复的昂贵操作
5. **错误处理**: 使用try-catch包装可能出错的代码
6. **模块化设计**: 将复杂逻辑拆分为多个小脚本

---

🎉 **开始创建你的第一个类型安全的游戏脚本吧！**
