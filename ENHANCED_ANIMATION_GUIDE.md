# QAQ游戏引擎 - 增强动画系统使用指南

## 🚀 **新功能概览**

QAQ引擎现在具备了两个核心增强功能：

### 1. **智能默认动画过渡系统**
- ✅ 自动应用默认混合时间（0.3秒）
- ✅ 平滑的动画切换，无需手动配置
- ✅ 全局过渡时间控制
- ✅ 可选的智能过渡开关

### 2. **专业级动画状态机**
- ✅ 有限状态机 (FSM) 支持
- ✅ 参数驱动的状态转换
- ✅ 条件判断和触发器
- ✅ 状态回调和事件系统

### 3. **实时调试和可视化工具**
- ✅ 实时状态监控面板
- ✅ 参数控制界面
- ✅ 性能分析工具
- ✅ 快捷键支持 (Ctrl+Shift+D)

## 🎮 **实际使用示例**

### **基础动画播放（智能过渡）**

```typescript
// 创建动画播放器
const animationPlayer = new AnimationPlayer()
character.addChild(animationPlayer)
animationPlayer.setTargetModel(character)

// 配置智能过渡
animationPlayer.setGlobalTransitionTime(0.3) // 默认0.3秒过渡
animationPlayer.setIntelligentTransitionsEnabled(true)

// 现在所有动画切换都会自动应用平滑过渡
animationPlayer.play('idle')    // 立即播放
animationPlayer.play('walk')    // 0.3秒平滑过渡到walk
animationPlayer.play('run')     // 0.3秒平滑过渡到run

// 自定义过渡时间
animationPlayer.play('attack', 0.1) // 0.1秒快速过渡到攻击
```

### **动画状态机设置**

```typescript
// 创建状态机
const stateMachine = new AnimationStateMachine('CharacterStateMachine')
stateMachine.setAnimationPlayer(animationPlayer)
stateMachine.setDebugEnabled(true)

// 添加参数
stateMachine.addParameter('speed', 'float', 0)      // 移动速度
stateMachine.addParameter('isGrounded', 'bool', true) // 是否在地面
stateMachine.addParameter('attack', 'trigger', false) // 攻击触发器

// 添加状态
stateMachine.addState({
  name: 'Idle',
  animationName: 'Idle1',
  speed: 1.0,
  loop: true,
  onEnter: () => console.log('进入待机状态'),
  onExit: () => console.log('离开待机状态')
})

stateMachine.addState({
  name: 'Walk',
  animationName: 'Walk_Forward',
  speed: 1.0,
  loop: true
})

// 添加转换条件
stateMachine.addTransition({
  id: 'idle_to_walk',
  fromState: 'Idle',
  toState: 'Walk',
  conditions: [{ parameter: 'speed', operator: '>', value: 0.1 }],
  hasExitTime: false,
  exitTime: 0,
  transitionDuration: 0.3,
  interruptible: true
})

// 启动状态机
stateMachine.start()
```

### **游戏逻辑集成**

```typescript
// 角色控制器示例
class CharacterController {
  private stateMachine: AnimationStateMachine
  
  constructor(character: MeshInstance3D) {
    // 设置动画系统...
    this.stateMachine = setupCharacterStateMachine(animationPlayer)
  }
  
  // 处理移动输入
  handleMovement(inputVector: Vector2) {
    const speed = inputVector.length() * 10
    this.stateMachine.setParameter('speed', speed)
    
    // 状态机会自动根据速度切换 idle/walk/run
  }
  
  // 处理攻击输入
  handleAttack() {
    this.stateMachine.setTrigger('attack')
    // 状态机会自动切换到攻击状态
  }
  
  // 处理跳跃输入
  handleJump() {
    if (this.isGrounded) {
      this.stateMachine.setTrigger('jump')
    }
  }
}
```

## 🎯 **demo-3d.vue 中的实际应用**

在QAQ引擎的3D演示页面中，你可以看到完整的实现：

### **1. 自动设置**
- 动画播放器自动配置智能过渡
- 状态机自动创建并配置所有状态和转换
- 调试面板自动显示

### **2. 实时控制**
打开浏览器控制台，使用以下命令：

```javascript
// 控制角色移动
window.stateMachine.setParameter('speed', 0)  // 停止
window.stateMachine.setParameter('speed', 3)  // 行走
window.stateMachine.setParameter('speed', 8)  // 奔跑

// 触发动作
window.stateMachine.setTrigger('attack')      // 攻击
window.stateMachine.setTrigger('jump')        // 跳跃

// 调整过渡时间
window.animationPlayer.setGlobalTransitionTime(0.5) // 0.5秒过渡

// 切换调试面板
window.animationDebugger.toggle()
```

### **3. 快捷键控制**
- **Ctrl+Shift+D**: 切换调试面板
- 调试面板中的按钮可以直接控制角色动画

## 🔧 **调试和监控**

### **调试面板功能**
1. **实时状态显示**
   - 当前状态和动画
   - 播放状态和速度
   - 过渡状态和进度
   - 帧率监控

2. **参数控制**
   - 快速切换常用状态
   - 触发攻击和跳跃
   - 调整过渡时间

3. **性能监控**
   - 实时FPS显示
   - 更新时间统计

### **控制台命令**
```javascript
// 获取当前状态信息
window.stateMachine.getCurrentStateInfo()

// 导出调试数据
window.animationDebugger.exportDebugData()

// 获取所有可用动画
window.animationPlayer.getAnimationList()
```

## 🎨 **高级用法**

### **自定义状态回调**
```typescript
stateMachine.addState({
  name: 'Attack',
  animationName: 'Sword_Attack',
  speed: 1.0,
  loop: false,
  onEnter: () => {
    // 攻击开始时的逻辑
    this.weapon.setVisible(true)
    this.playSound('sword_whoosh')
  },
  onExit: () => {
    // 攻击结束时的逻辑
    this.weapon.setVisible(false)
  },
  onUpdate: (normalizedTime) => {
    // 攻击过程中的逻辑
    if (normalizedTime > 0.5) {
      this.checkHitTargets()
    }
  }
})
```

### **复杂转换条件**
```typescript
// 多条件转换
stateMachine.addTransition({
  id: 'ground_to_air_attack',
  fromState: 'Idle',
  toState: 'AirAttack',
  conditions: [
    { parameter: 'attack', operator: '==', value: true },
    { parameter: 'isGrounded', operator: '==', value: false },
    { parameter: 'airTime', operator: '>', value: 0.2 }
  ],
  hasExitTime: false,
  exitTime: 0,
  transitionDuration: 0.1,
  interruptible: false
})
```

### **动态过渡时间**
```typescript
// 根据游戏状态调整过渡时间
if (isInCombat) {
  animationPlayer.setGlobalTransitionTime(0.1) // 战斗中快速切换
} else {
  animationPlayer.setGlobalTransitionTime(0.3) // 平时平滑切换
}
```

## 🚀 **性能优化建议**

1. **合理设置过渡时间**
   - 战斗动画: 0.1-0.2秒
   - 移动动画: 0.2-0.4秒
   - 表情动画: 0.1-0.3秒

2. **状态机优化**
   - 避免过多的状态和转换
   - 使用合理的条件判断
   - 及时清理不需要的参数

3. **调试面板使用**
   - 开发时启用，发布时禁用
   - 使用快捷键而非常驻显示

## 🎯 **总结**

通过这两个核心增强功能，QAQ引擎的动画系统现在达到了专业游戏引擎的水准：

- ✅ **开发效率提升**: 智能过渡减少手动配置
- ✅ **专业级功能**: 状态机支持复杂游戏逻辑
- ✅ **调试友好**: 实时监控和控制工具
- ✅ **性能优化**: 高效的状态管理和过渡系统

现在你可以创建具有流畅动画和复杂行为的游戏角色，就像在Unity或Unreal Engine中一样！🎮
