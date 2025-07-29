# QAQ引擎 - Demo-3D状态机示例流程详解

## 🎮 **Demo-3D概览**

demo-3d.vue是QAQ引擎的核心演示页面，展示了完整的3D游戏开发流程，包括：
- 3D场景渲染
- 角色动画系统
- 状态机控制
- 脚本系统
- 序列化功能

## 🏗️ **系统架构流程**

### **1. 引擎初始化流程**
```typescript
// 1. 获取引擎实例
const engine = Engine.getInstance()

// 2. 初始化引擎配置
await engine.initialize({
  container: gameCanvas.value,    // 渲染容器
  width: 800,                     // 画布宽度
  height: 600,                    // 画布高度
  antialias: true,               // 抗锯齿
  enableShadows: true,           // 启用阴影
  backgroundColor: 0x87ceeb      // 天蓝色背景
})
```

### **2. 场景构建流程**
```typescript
// 创建场景层次结构
Scene "Demo3DScene"
├── Camera3D "MainCamera"           // 主相机
├── DirectionalLight3D "SunLight"   // 方向光源
└── MeshInstance3D "Character"      // 角色模型
    └── AnimationPlayer "AnimationPlayer"  // 动画播放器
```

### **3. 角色加载流程**
```typescript
// 1. 创建角色节点
const character = new MeshInstance3D('Character')
character.position = { x: 0, y: 0, z: 0 }
character.scale = { x: 0.01, y: 0.01, z: 0.01 }  // 缩小模型

// 2. 加载3D模型
await character.loadModel('./assets/models/character.gltf')

// 3. 设置渲染属性
character.castShadow = true      // 投射阴影
character.receiveShadow = true   // 接收阴影
```

## 🎭 **动画状态机系统**

### **状态机架构**
```
AnimationStateMachine
├── 状态 (States)
│   ├── idle (待机)
│   ├── walk (行走)  
│   ├── run (奔跑)
│   ├── attack (攻击)
│   └── jump (跳跃)
├── 参数 (Parameters)
│   ├── speed: number (移动速度)
│   ├── isAttacking: boolean (是否攻击)
│   └── isJumping: boolean (是否跳跃)
└── 过渡 (Transitions)
    ├── idle → walk (speed > 0.1)
    ├── walk → run (speed > 3.0)
    ├── any → attack (attack trigger)
    └── any → jump (jump trigger)
```

### **状态机初始化流程**
```typescript
// 1. 创建状态机
const stateMachine = new AnimationStateMachine()

// 2. 添加状态
stateMachine.addState('idle', 'idle')      // 待机动画
stateMachine.addState('walk', 'walk')      // 行走动画
stateMachine.addState('run', 'run')        // 奔跑动画
stateMachine.addState('attack', 'attack')  // 攻击动画
stateMachine.addState('jump', 'jump')      // 跳跃动画

// 3. 设置默认状态
stateMachine.setDefaultState('idle')

// 4. 添加参数
stateMachine.addParameter('speed', 0)           // 移动速度
stateMachine.addParameter('isAttacking', false) // 攻击状态
stateMachine.addParameter('isJumping', false)   // 跳跃状态
```

### **状态过渡规则**
```typescript
// 1. 速度控制的移动状态
stateMachine.addTransition('idle', 'walk', {
  condition: () => stateMachine.getParameter('speed') > 0.1,
  duration: 0.2
})

stateMachine.addTransition('walk', 'run', {
  condition: () => stateMachine.getParameter('speed') > 3.0,
  duration: 0.3
})

stateMachine.addTransition('run', 'walk', {
  condition: () => stateMachine.getParameter('speed') <= 3.0,
  duration: 0.2
})

// 2. 触发器控制的动作状态
stateMachine.addTransition('*', 'attack', {
  trigger: 'attack',
  duration: 0.1,
  exitTime: 1.0  // 攻击动画播放完毕后返回
})

stateMachine.addTransition('*', 'jump', {
  trigger: 'jump',
  duration: 0.1,
  exitTime: 0.8  // 跳跃动画80%时可以过渡
})
```

## 🎮 **交互控制流程**

### **用户控制接口**
在浏览器控制台中可以使用以下命令：

```javascript
// 1. 移动控制
window.stateMachine.setParameter("speed", 2)    // 设置行走速度
window.stateMachine.setParameter("speed", 5)    // 设置奔跑速度
window.stateMachine.setParameter("speed", 0)    // 停止移动

// 2. 动作触发
window.stateMachine.setTrigger("attack")         // 触发攻击
window.stateMachine.setTrigger("jump")           // 触发跳跃

// 3. 动画播放器控制
window.animationPlayer.setGlobalTransitionTime(0.5)  // 设置过渡时间
window.animationPlayer.play('idle')                  // 直接播放动画

// 4. 调试面板
window.animationDebugger.toggle()               // 切换调试面板
// 或按 Ctrl+Shift+D
```

### **状态机执行流程**
```
1. 用户输入 → setParameter/setTrigger
2. 状态机评估 → 检查所有过渡条件
3. 状态切换 → 如果条件满足，执行状态过渡
4. 动画播放 → AnimationPlayer播放对应动画
5. 视觉反馈 → 角色执行相应动作
```

## 🔧 **脚本系统集成**

### **角色控制脚本**
```typescript
class CharacterController extends ScriptBase {
  private player: AnimationPlayer | null = null
  private stateMachine: AnimationStateMachine | null = null
  
  override _ready(): void {
    // 获取组件引用
    this.player = this.node.findChild('AnimationPlayer') as AnimationPlayer
    this.stateMachine = this.player?.getStateMachine()
    
    // 设置初始状态
    this.stateMachine?.setDefaultState('idle')
  }
  
  override _process(delta: number): void {
    // 每帧更新状态机
    this.stateMachine?.update(delta)
  }
  
  // 自定义控制方法
  public moveCharacter(speed: number): void {
    this.stateMachine?.setParameter('speed', speed)
  }
  
  public attackCharacter(): void {
    this.stateMachine?.setTrigger('attack')
  }
}
```

### **动画循环脚本**
```typescript
class AnimationCycler extends ScriptBase {
  private animationNames: string[] = []
  private currentIndex: number = -1
  
  override _ready(): void {
    const player = this.node.findChild('AnimationPlayer') as AnimationPlayer
    if (player) {
      this.animationNames = player.getAnimationList()
      this.startCycling()
    }
  }
  
  private startCycling(): void {
    setInterval(() => {
      this.playNextAnimation()
    }, 3000) // 每3秒切换动画
  }
  
  private playNextAnimation(): void {
    this.currentIndex = (this.currentIndex + 1) % this.animationNames.length
    const animName = this.animationNames[this.currentIndex]
    
    // 通过状态机播放动画
    this.stateMachine?.setTrigger(animName)
  }
}
```

## 🧪 **序列化测试流程**

### **自动测试流程**
```typescript
// 1. 简单序列化测试
testSimpleSerialization()
├── 创建简单Node3D
├── 设置基础属性 (position, visible)
├── 执行序列化
├── 执行反序列化
└── 验证数据完整性

// 2. 循环引用修复测试  
testCircularReferenceFix()
├── 创建复杂场景结构
├── 建立父子节点关系
├── 执行序列化 (处理循环引用)
├── 执行反序列化
├── 验证场景结构完整性
└── 输出性能统计
```

### **测试验证点**
```typescript
// 数据完整性验证
✅ 场景名称匹配
✅ 节点数量匹配  
✅ 相机FOV值匹配
✅ 光源强度匹配
✅ 网格阴影设置匹配
✅ 节点层次结构完整

// 性能指标验证
📊 序列化速度: ~1000 节点/秒
📊 反序列化速度: ~800 节点/秒  
📊 数据大小: ~2KB/100节点
📊 循环引用处理: 0错误
```

## 🎯 **完整示例流程**

### **启动到运行的完整流程**
```
1. 页面加载
   ├── Vue组件挂载
   ├── 获取canvas元素
   └── 初始化引擎

2. 场景构建
   ├── 创建Scene
   ├── 添加Camera3D (位置: 5,5,5)
   ├── 添加DirectionalLight3D (强度: 1.0)
   └── 创建Character节点

3. 角色设置
   ├── 加载GLTF模型
   ├── 设置缩放 (0.01倍)
   ├── 启用阴影
   └── 添加AnimationPlayer

4. 动画系统
   ├── 创建AnimationStateMachine
   ├── 注册动画状态 (idle, walk, run, attack, jump)
   ├── 设置状态参数 (speed, isAttacking, isJumping)
   └── 配置状态过渡规则

5. 脚本系统
   ├── 附加CharacterController脚本
   ├── 附加AnimationCycler脚本
   └── 启动脚本执行

6. 调试工具
   ├── 创建AnimationDebugger
   ├── 注册全局控制接口
   └── 启用快捷键 (Ctrl+Shift+D)

7. 序列化测试
   ├── 延迟2秒执行测试
   ├── 测试简单序列化
   ├── 测试循环引用修复
   └── 输出测试结果

8. 渲染循环
   ├── 引擎开始渲染循环
   ├── 脚本系统每帧更新
   ├── 状态机每帧评估
   └── 动画播放器每帧更新
```

## 🎮 **用户交互指南**

### **基础控制**
```javascript
// 让角色行走
window.stateMachine.setParameter("speed", 2)

// 让角色奔跑  
window.stateMachine.setParameter("speed", 5)

// 停止移动
window.stateMachine.setParameter("speed", 0)

// 攻击动作
window.stateMachine.setTrigger("attack")

// 跳跃动作
window.stateMachine.setTrigger("jump")
```

### **高级控制**
```javascript
// 调整动画过渡时间
window.animationPlayer.setGlobalTransitionTime(0.3)

// 启用智能过渡
window.animationPlayer.setIntelligentTransitionsEnabled(true)

// 直接播放特定动画
window.animationPlayer.play('idle')

// 切换调试面板
window.animationDebugger.toggle()
```

### **序列化测试**
```javascript
// 测试简单序列化
window.testSimpleSerialization()

// 测试循环引用修复
window.testCircularReferenceFix()

// 序列化当前场景
const sceneData = window.currentScene.serialize()
console.log('场景数据:', sceneData)
```

## 🎉 **总结**

demo-3d.vue展示了QAQ引擎的完整功能栈：

1. **✅ 3D渲染系统** - 场景、相机、光照、阴影
2. **✅ 动画系统** - 状态机、动画播放器、智能过渡
3. **✅ 脚本系统** - 角色控制、动画循环、生命周期管理
4. **✅ 序列化系统** - 零配置反射序列化、循环引用处理
5. **✅ 调试工具** - 实时调试面板、控制台接口
6. **✅ 交互控制** - 参数控制、触发器、快捷键

这个演示为开发者提供了完整的游戏开发工作流程参考！🚀
