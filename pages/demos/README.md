# 🎮 QAQ Engine - 演示模块系统

## 📋 **概述**

这是QAQ引擎的模块化演示系统，将原本臃肿的demo-3d.vue文件拆分为清晰的功能模块，便于维护和扩展。

## 🏗️ **目录结构**

```
pages/demos/
├── README.md                    # 本文档
├── DemoManager.ts              # 演示管理器（统一入口）
├── particles/                  # 粒子系统演示模块
│   └── ParticleDemo.ts
├── physics/                    # 物理系统演示模块
│   └── PhysicsDemo.ts
└── lighting/                   # 光照系统演示模块
    └── LightingDemo.ts
```

## 🎯 **设计原则**

### **模块化分离**
- 每个功能模块独立管理自己的状态和逻辑
- 通过DemoManager统一协调各个模块
- 清晰的接口定义，便于扩展新模块

### **职责分工**
- **DemoManager**: 统一管理器，协调各个演示模块
- **ParticleDemo**: 专门处理粒子系统演示
- **PhysicsDemo**: 专门处理物理系统演示
- **LightingDemo**: 专门处理光照系统演示

### **易于扩展**
- 添加新演示只需创建新的模块文件
- 在DemoManager中注册新模块即可
- 不影响现有模块的功能

## 🔧 **核心模块详解**

### **DemoManager.ts - 演示管理器**

统一的演示管理入口，负责：

```typescript
class DemoManager {
  // 初始化所有演示模块
  async initialize(): Promise<void>
  
  // 更新所有模块
  update(deltaTime: number): void
  
  // 粒子系统控制
  switchParticleEffect(type: ParticleDemoType): void
  resetParticles(): void
  
  // 物理系统控制
  addFallingCube(): void
  togglePhysicsDebugger(): void
  
  // 光照系统控制
  switchLightingEffect(type: LightingDemoType): void
  
  // 统计信息
  getStats(): DemoStats
  
  // 资源清理
  dispose(): void
}
```

**使用示例：**
```typescript
// 在demo-3d.vue中
const demoManager = createDemoManager(scene)
await demoManager.initialize()

// 切换粒子效果
demoManager.switchParticleEffect(ParticleDemoType.FIRE)

// 添加物理对象
demoManager.addFallingCube()

// 切换光照
demoManager.switchLightingEffect(LightingDemoType.SUNSET)
```

### **ParticleDemo.ts - 粒子演示模块**

专门处理粒子系统演示：

```typescript
class ParticleDemo {
  // 创建不同类型的粒子系统
  createParticleSystem(type: ParticleDemoType): GPUParticles3D
  
  // 支持的粒子类型
  enum ParticleDemoType {
    FIRE = 'fire',        // 🔥 火焰效果
    MAGIC = 'magic',      // ✨ 魔法效果
    EXPLOSION = 'explosion', // 💥 爆炸效果
    SMOKE = 'smoke',      // 💨 烟雾效果
    HEAL = 'heal',        // 💚 治疗效果
    CUSTOM = 'custom'     // 🌈 自定义效果
  }
}
```

**特色功能：**
- 6种预设粒子效果
- 自定义GLSL着色器支持
- 实时参数调整
- 性能统计

### **PhysicsDemo.ts - 物理演示模块**

专门处理物理系统演示：

```typescript
class PhysicsDemo {
  // 初始化物理世界
  async initialize(): Promise<void>
  
  // 添加动态物理对象
  addFallingCube(): void
  
  // 清理动态对象
  clearDynamicObjects(): void
  
  // 切换调试器
  toggleDebugger(): void
}
```

**特色功能：**
- CANNON.js物理引擎集成
- 可视化调试器
- 动态物理对象管理
- 碰撞检测演示

### **LightingDemo.ts - 光照演示模块**

专门处理光照系统演示：

```typescript
class LightingDemo {
  // 切换光照场景
  switchTo(type: LightingDemoType): void
  
  // 支持的光照类型
  enum LightingDemoType {
    BASIC = 'basic',      // 💡 基础光照
    DYNAMIC = 'dynamic',  // 🔄 动态光照
    COLORFUL = 'colorful', // 🌈 彩色光照
    SUNSET = 'sunset',    // 🌅 日落光照
    NIGHT = 'night'       // 🌙 夜晚光照
  }
}
```

**特色功能：**
- 5种预设光照场景
- 动态光照动画
- 多光源管理
- 环境光配置

## 🎮 **在demo-3d.vue中的使用**

### **简化的主文件**

新的demo-3d.vue文件变得非常简洁：

```vue
<script setup lang="ts">
import { DemoManager, createDemoManager } from './demos/DemoManager'

let demoManager: DemoManager | null = null

// 粒子控制
function switchParticle(type: string) {
  demoManager?.switchParticleEffect(type as ParticleDemoType)
}

// 物理控制
function addFallingCube() {
  demoManager?.addFallingCube()
}

// 光照控制
function switchLighting(type: string) {
  demoManager?.switchLightingEffect(type as LightingDemoType)
}

// 初始化
async function init3DDemo() {
  // ... 基础场景设置
  demoManager = createDemoManager(scene)
  await demoManager.initialize()
}
</script>
```

### **丰富的控制界面**

- **粒子系统**: 火焰、魔法、爆炸、治疗效果切换
- **物理系统**: 添加立方体、清理对象、调试器开关
- **光照系统**: 基础、动态、彩色、日落、夜晚场景
- **统计信息**: 实时显示活跃粒子数、物理对象数、光源数量

## 🚀 **扩展新演示模块**

### **1. 创建新模块**

```typescript
// pages/demos/audio/AudioDemo.ts
export class AudioDemo {
  constructor(scene: Scene) {
    this.scene = scene
  }
  
  async initialize(): Promise<void> {
    // 初始化音频系统
  }
  
  update(deltaTime: number): void {
    // 更新音频
  }
  
  dispose(): void {
    // 清理资源
  }
}
```

### **2. 注册到DemoManager**

```typescript
// DemoManager.ts
import { AudioDemo } from './audio/AudioDemo'

class DemoManager {
  private audioDemo: AudioDemo | null = null
  
  async initialize(): Promise<void> {
    // ... 其他模块初始化
    await this.initializeAudioDemo()
  }
  
  private async initializeAudioDemo(): Promise<void> {
    this.audioDemo = new AudioDemo(this.scene)
    await this.audioDemo.initialize()
  }
}
```

### **3. 添加到UI界面**

```vue
<!-- demo-3d.vue -->
<div class="control-group">
  <h3>🔊 音频系统</h3>
  <button @click="playSound('explosion')">💥 爆炸音效</button>
  <button @click="playMusic('ambient')">🎵 环境音乐</button>
</div>
```

## 📊 **优势对比**

### **重构前 vs 重构后**

| 方面 | 重构前 | 重构后 |
|------|--------|--------|
| **文件大小** | 700+ 行单文件 | 多个 < 300行 模块 |
| **可维护性** | 难以维护 | 模块化，易维护 |
| **可扩展性** | 添加功能困难 | 轻松添加新模块 |
| **代码复用** | 功能耦合 | 模块独立，可复用 |
| **团队协作** | 容易冲突 | 模块分工，减少冲突 |
| **测试** | 难以单元测试 | 模块独立测试 |

### **性能优化**

- **按需加载**: 模块可以按需动态导入
- **资源管理**: 每个模块独立管理自己的资源
- **内存优化**: 不使用的模块可以完全卸载

## 🎯 **最佳实践**

### **模块设计原则**

1. **单一职责**: 每个模块只负责一个功能领域
2. **接口清晰**: 提供简洁明确的公共API
3. **状态封装**: 模块内部状态不对外暴露
4. **资源管理**: 模块负责自己的资源生命周期
5. **错误处理**: 模块内部处理错误，不影响其他模块

### **命名规范**

- **文件名**: PascalCase + Demo后缀 (如: `ParticleDemo.ts`)
- **类名**: PascalCase + Demo后缀 (如: `class ParticleDemo`)
- **方法名**: camelCase，动词开头 (如: `switchParticleEffect`)
- **枚举**: PascalCase + Type后缀 (如: `ParticleDemoType`)

### **目录组织**

```
demos/
├── [功能名]/
│   ├── [功能名]Demo.ts      # 主演示类
│   ├── types.ts            # 类型定义
│   ├── utils.ts            # 工具函数
│   └── examples/           # 示例代码
└── shared/                 # 共享工具
    ├── BaseDemo.ts         # 基础演示类
    └── constants.ts        # 共享常量
```

## 🎉 **总结**

通过模块化重构，我们实现了：

✅ **代码组织清晰** - 功能模块分离，职责明确  
✅ **易于维护扩展** - 添加新功能只需创建新模块  
✅ **团队协作友好** - 不同开发者可以独立开发不同模块  
✅ **性能优化** - 按需加载，资源独立管理  
✅ **用户体验提升** - 丰富的交互界面，实时统计信息  

这个模块化演示系统为QAQ引擎提供了一个可扩展、可维护的演示平台，便于展示引擎的各种功能特性！🚀
