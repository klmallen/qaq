# QAQ游戏引擎 - 碰撞系统开发计划

## 📊 **项目概述**

基于对QAQ游戏引擎现有架构的深入分析，制定完整的碰撞系统开发方案。该方案将在现有动画系统和Node架构基础上，构建高性能、易用的碰撞检测和可视化系统。

---

## 🎯 **开发目标**

### **主要目标**
1. **完整的碰撞节点系统** - Area3D, CharacterBody3D, CollisionManager
2. **实时碰撞可视化** - 开发时显示碰撞盒的调试系统
3. **动画碰撞同步** - 动画播放时碰撞体的实时更新机制
4. **高性能碰撞检测** - 与Cannon.js深度集成的优化方案
5. **易用的开发工具** - 直观的调试界面和配置选项

### **技术指标**
- **性能**: 支持100+碰撞体同时检测
- **兼容性**: 完全兼容现有动画和物理系统
- **易用性**: 提供可视化碰撞调试工具
- **扩展性**: 支持自定义碰撞形状和行为

---

## 🏗️ **技术架构设计**

### **碰撞系统层次结构**

```
碰撞节点层 (Collision Nodes)
├── Area3D.ts              🔄 新建 - 碰撞区域检测
├── CharacterBody3D.ts     🔄 新建 - 角色控制器
├── CollisionManager.ts    🔄 新建 - 碰撞管理器
├── CollisionShape3D.ts    ✅ 已存在 - 需扩展可视化
├── RigidBody3D.ts         ✅ 已存在 - 需集成调试
└── StaticBody3D.ts        ✅ 已存在 - 需集成调试

碰撞可视化层 (Visualization)
├── CollisionDebugRenderer.ts  🔄 新建 - 调试渲染器
├── CollisionVisualizer.ts     🔄 新建 - 可视化管理
└── DebugMaterialManager.ts    🔄 新建 - 调试材质管理

动画同步层 (Animation Sync)
├── AnimationCollisionSync.ts  🔄 新建 - 动画碰撞同步
├── BoneCollisionTracker.ts    🔄 新建 - 骨骼碰撞跟踪
└── CollisionUpdateManager.ts  🔄 新建 - 碰撞更新管理

物理集成层 (Physics Integration)
├── PhysicsServer.ts       ✅ 已存在 - 需扩展功能
├── CollisionEventSystem.ts    🔄 新建 - 碰撞事件系统
└── SpatialHashGrid.ts     🔄 新建 - 空间分割优化
```

### **核心设计原则**
1. **无侵入集成** - 不破坏现有动画和渲染系统
2. **性能优先** - 使用空间分割和批量处理优化
3. **调试友好** - 提供丰富的可视化和调试信息
4. **类型安全** - 完整的TypeScript类型定义
5. **事件驱动** - 基于信号系统的碰撞事件处理

---

## 📋 **开发阶段规划**

### **Phase 1: 碰撞可视化系统 (优先级: 🔥 最高)**

#### **1.1 CollisionDebugRenderer - 碰撞调试渲染器**
**文件**: `core/collision/CollisionDebugRenderer.ts`

**功能需求**:
- 为不同碰撞形状创建线框几何体
- 支持动态颜色和透明度调整
- 与Three.js渲染管道集成
- 提供性能优化的批量渲染

**技术实现**:
```typescript
export class CollisionDebugRenderer {
  // 核心方法
  createBoxWireframe(size: Vector3): THREE.LineSegments
  createSphereWireframe(radius: number): THREE.LineSegments
  createCapsuleWireframe(radius: number, height: number): THREE.LineSegments
  createMeshWireframe(geometry: THREE.BufferGeometry): THREE.LineSegments
  
  // 材质管理
  getDebugMaterial(color: number, opacity: number): THREE.LineBasicMaterial
  updateMaterialColor(material: THREE.Material, color: number): void
  
  // 渲染管理
  addToDebugLayer(wireframe: THREE.LineSegments): void
  removeFromDebugLayer(wireframe: THREE.LineSegments): void
  setDebugLayerVisible(visible: boolean): void
}
```

#### **1.2 CollisionVisualizer - 可视化管理器**
**文件**: `core/collision/CollisionVisualizer.ts`

**功能需求**:
- 管理所有碰撞形状的可视化状态
- 提供全局开关和配置选项
- 支持不同类型碰撞体的颜色区分
- 实时更新可视化状态

**配置选项**:
```typescript
interface VisualizationConfig {
  enabled: boolean                    // 全局开关
  showStaticBodies: boolean          // 显示静态体
  showRigidBodies: boolean           // 显示刚体
  showAreas: boolean                 // 显示区域
  showCharacterBodies: boolean       // 显示角色体
  
  colors: {
    staticBody: number               // 静态体颜色
    rigidBody: number                // 刚体颜色
    area: number                     // 区域颜色
    characterBody: number            // 角色体颜色
    sleeping: number                 // 休眠状态颜色
  }
  
  opacity: number                    // 透明度
  wireframeOnly: boolean             // 仅显示线框
}
```

#### **1.3 扩展现有CollisionShape3D**
**文件**: `core/nodes/physics/CollisionShape3D.ts` (扩展)

**新增功能**:
- 添加调试可视化支持
- 集成CollisionDebugRenderer
- 提供可视化配置接口
- 实现形状变化时的可视化更新

### **Phase 2: 动画碰撞同步机制 (优先级: 🔥 高)**

#### **2.1 AnimationCollisionSync - 动画碰撞同步器**
**文件**: `core/collision/AnimationCollisionSync.ts`

**功能需求**:
- 监听动画播放状态变化
- 检测骨骼变换对碰撞体的影响
- 提供高效的同步策略
- 支持选择性同步（仅同步需要的骨骼）

**同步策略**:
1. **实时同步** - 每帧更新（高精度，高开销）
2. **关键帧同步** - 仅在关键帧更新（平衡方案）
3. **阈值同步** - 变化超过阈值时更新（性能优先）
4. **手动同步** - 开发者控制更新时机（最灵活）

#### **2.2 BoneCollisionTracker - 骨骼碰撞跟踪器**
**文件**: `core/collision/BoneCollisionTracker.ts`

**功能需求**:
- 跟踪特定骨骼的变换
- 计算碰撞边界的变化
- 提供骨骼-碰撞体的映射关系
- 优化不必要的计算

### **Phase 3: 碰撞节点系统扩展 (优先级: 🔥 中)**

#### **3.1 Area3D - 碰撞区域节点**
**文件**: `core/nodes/physics/Area3D.ts`

**功能需求**:
- 检测物体进入/离开区域
- 不参与物理仿真
- 支持多种触发条件
- 提供丰富的事件回调

**事件系统**:
```typescript
// 信号定义
area.connect('body_entered', (body: Node3D) => {})
area.connect('body_exited', (body: Node3D) => {})
area.connect('area_entered', (area: Area3D) => {})
area.connect('area_exited', (area: Area3D) => {})
```

#### **3.2 CharacterBody3D - 角色控制器**
**文件**: `core/nodes/physics/CharacterBody3D.ts`

**功能需求**:
- 运动学角色控制
- 地面检测和斜坡处理
- 墙壁滑动和碰撞响应
- 支持多种移动模式

**移动功能**:
```typescript
export class CharacterBody3D extends Node3D {
  // 移动控制
  moveAndSlide(velocity: Vector3): Vector3
  moveAndCollide(motion: Vector3): CollisionInfo | null
  
  // 地面检测
  isOnFloor(): boolean
  isOnWall(): boolean
  isOnCeiling(): boolean
  
  // 配置选项
  setFloorMaxAngle(angle: number): void
  setWallMinSlideAngle(angle: number): void
  setMaxSlides(maxSlides: number): void
}
```

#### **3.3 CollisionManager - 碰撞管理器**
**文件**: `core/collision/CollisionManager.ts`

**功能需求**:
- 全局碰撞事件分发
- 性能监控和优化
- 空间分割管理
- 批量碰撞处理

### **Phase 4: 高级功能和优化 (优先级: 🔥 低)**

#### **4.1 性能优化系统**
- 空间哈希网格 (SpatialHashGrid)
- 八叉树空间分割 (Octree)
- 碰撞检测LOD系统
- 批量渲染优化

#### **4.2 调试工具扩展**
- 碰撞统计面板
- 性能分析器
- 实时配置界面
- 碰撞事件日志

---

## 🎮 **Demo-3D集成计划**

### **集成目标**
在现有demo-3d.vue中展示碰撞系统的完整功能：

1. **角色碰撞体可视化** - 显示角色的胶囊碰撞体
2. **攻击范围显示** - 使用Area3D显示攻击检测范围
3. **地面碰撞检测** - 角色与地面的碰撞交互
4. **动画同步演示** - 攻击动画时碰撞体的变化
5. **调试界面集成** - 提供碰撞可视化的开关控制

### **实现步骤**
1. 为现有角色添加CharacterBody3D
2. 创建攻击检测的Area3D
3. 启用碰撞可视化调试
4. 添加UI控制面板
5. 集成动画-碰撞同步

---

## 📊 **开发时间估算**

| 阶段 | 功能模块 | 预估时间 | 优先级 |
|------|----------|----------|--------|
| Phase 1 | 碰撞可视化系统 | 3-4天 | 🔥 最高 |
| Phase 2 | 动画碰撞同步 | 2-3天 | 🔥 高 |
| Phase 3 | 节点系统扩展 | 4-5天 | 🔥 中 |
| Phase 4 | 高级功能优化 | 3-4天 | 🔥 低 |
| **总计** | **完整碰撞系统** | **12-16天** | - |

---

## 🔧 **技术决策记录**

### **物理引擎选择: Cannon.js ✅**
- **理由**: 现有系统已集成，轻量级，JavaScript原生
- **优势**: 与Three.js集成良好，性能适中
- **劣势**: 功能相对简单，不如Bullet物理引擎强大

### **可视化方案: Three.js LineSegments ✅**
- **理由**: GPU加速，与现有渲染管道集成
- **优势**: 性能好，支持动态更新
- **劣势**: 需要手动管理几何体

### **事件系统: 基于现有信号系统 ✅**
- **理由**: 保持架构一致性
- **优势**: 类型安全，易于调试
- **劣势**: 需要扩展现有信号系统

---

## 📝 **下一步行动**

1. **立即开始**: Phase 1 碰撞可视化系统开发
2. **创建文件**: CollisionDebugRenderer.ts
3. **扩展现有**: CollisionShape3D.ts 添加可视化支持
4. **集成测试**: 在demo-3d.vue中验证效果
5. **迭代优化**: 根据测试结果调整实现

---

**准备开始实现！** 🚀

---

## 📋 **详细实现规范**

### **Phase 1 详细实现计划**

#### **1.1 CollisionDebugRenderer 实现细节**

**核心类结构**:
```typescript
export class CollisionDebugRenderer {
  private static _instance: CollisionDebugRenderer | null = null
  private _debugScene: THREE.Scene
  private _debugMaterials: Map<string, THREE.LineBasicMaterial>
  private _wireframes: Map<string, THREE.LineSegments>
  private _enabled: boolean = true

  // 单例模式
  static getInstance(): CollisionDebugRenderer

  // 几何体创建方法
  createBoxWireframe(size: Vector3, color?: number): THREE.LineSegments
  createSphereWireframe(radius: number, segments?: number, color?: number): THREE.LineSegments
  createCapsuleWireframe(radius: number, height: number, color?: number): THREE.LineSegments
  createCylinderWireframe(radiusTop: number, radiusBottom: number, height: number, color?: number): THREE.LineSegments
  createMeshWireframe(geometry: THREE.BufferGeometry, color?: number): THREE.LineSegments

  // 材质管理
  getDebugMaterial(color: number, opacity?: number): THREE.LineBasicMaterial
  updateWireframeColor(wireframe: THREE.LineSegments, color: number): void
  updateWireframeOpacity(wireframe: THREE.LineSegments, opacity: number): void

  // 渲染管理
  addWireframe(id: string, wireframe: THREE.LineSegments): void
  removeWireframe(id: string): void
  updateWireframeTransform(id: string, position: Vector3, rotation: Vector3, scale: Vector3): void

  // 全局控制
  setEnabled(enabled: boolean): void
  setGlobalOpacity(opacity: number): void
  clear(): void
}
```

**几何体创建算法**:
1. **盒子线框**: 使用EdgesGeometry + BoxGeometry
2. **球体线框**: 手动创建经纬线网格
3. **胶囊线框**: 组合球体和圆柱体线框
4. **网格线框**: 使用EdgesGeometry提取边缘

#### **1.2 CollisionVisualizer 实现细节**

**配置管理**:
```typescript
export interface CollisionVisualizationConfig {
  // 全局设置
  enabled: boolean
  globalOpacity: number
  wireframeLineWidth: number

  // 显示控制
  showStaticBodies: boolean
  showRigidBodies: boolean
  showAreas: boolean
  showCharacterBodies: boolean
  showSleepingBodies: boolean

  // 颜色配置
  colors: {
    staticBody: number      // 0x00ff00 (绿色)
    rigidBody: number       // 0xff0000 (红色)
    area: number           // 0x0000ff (蓝色)
    characterBody: number   // 0xffff00 (黄色)
    sleeping: number       // 0x888888 (灰色)
    collision: number      // 0xff00ff (紫色，碰撞时)
  }

  // 动画设置
  animateOnCollision: boolean
  collisionFlashDuration: number

  // 性能设置
  maxVisibleDistance: number
  updateFrequency: number  // 更新频率 (Hz)
}
```

**可视化管理器**:
```typescript
export class CollisionVisualizer {
  private _config: CollisionVisualizationConfig
  private _renderer: CollisionDebugRenderer
  private _trackedShapes: Map<string, CollisionShapeInfo>
  private _updateTimer: number = 0

  // 形状跟踪
  trackCollisionShape(shape: CollisionShape3D): void
  untrackCollisionShape(shape: CollisionShape3D): void

  // 配置管理
  updateConfig(config: Partial<CollisionVisualizationConfig>): void
  getConfig(): CollisionVisualizationConfig

  // 实时更新
  update(deltaTime: number): void
  forceUpdate(): void

  // 事件处理
  onCollisionEnter(shapeA: CollisionShape3D, shapeB: CollisionShape3D): void
  onCollisionExit(shapeA: CollisionShape3D, shapeB: CollisionShape3D): void
}
```

#### **1.3 CollisionShape3D 扩展实现**

**新增属性和方法**:
```typescript
export class CollisionShape3D extends Node3D {
  // 现有属性...

  // 新增调试可视化属性
  private _debugEnabled: boolean = false
  private _debugWireframe: THREE.LineSegments | null = null
  private _debugColor: number = 0x00ff00
  private _debugOpacity: number = 0.5

  // 可视化控制
  setDebugEnabled(enabled: boolean): void
  isDebugEnabled(): boolean
  setDebugColor(color: number): void
  getDebugColor(): number
  setDebugOpacity(opacity: number): void
  getDebugOpacity(): number

  // 内部方法
  private _createDebugWireframe(): void
  private _updateDebugWireframe(): void
  private _destroyDebugWireframe(): void

  // 重写现有方法以支持可视化更新
  override setShape(type: CollisionShapeType, parameters: any): void
  override _enterTree(): void
  override _exitTree(): void
}
```

### **Phase 2 详细实现计划**

#### **2.1 AnimationCollisionSync 实现细节**

**同步策略枚举**:
```typescript
export enum SyncStrategy {
  REALTIME = 'realtime',        // 每帧同步
  KEYFRAME = 'keyframe',        // 关键帧同步
  THRESHOLD = 'threshold',      // 阈值触发同步
  MANUAL = 'manual'             // 手动同步
}

export interface SyncConfig {
  strategy: SyncStrategy
  updateFrequency: number       // 更新频率 (仅REALTIME模式)
  positionThreshold: number     // 位置变化阈值 (THRESHOLD模式)
  rotationThreshold: number     // 旋转变化阈值 (THRESHOLD模式)
  scaleThreshold: number        // 缩放变化阈值 (THRESHOLD模式)
  enabledBones: string[]        // 需要同步的骨骼名称列表
}
```

**同步器实现**:
```typescript
export class AnimationCollisionSync {
  private _animationPlayer: AnimationPlayer
  private _collisionShapes: CollisionShape3D[]
  private _config: SyncConfig
  private _lastTransforms: Map<string, Transform3D>
  private _syncTimer: number = 0

  constructor(animationPlayer: AnimationPlayer, config: SyncConfig)

  // 形状管理
  addCollisionShape(shape: CollisionShape3D, boneName?: string): void
  removeCollisionShape(shape: CollisionShape3D): void

  // 同步控制
  startSync(): void
  stopSync(): void
  forceSyncAll(): void

  // 配置管理
  updateConfig(config: Partial<SyncConfig>): void

  // 内部同步逻辑
  private _updateSync(deltaTime: number): void
  private _shouldSync(boneName: string, currentTransform: Transform3D): boolean
  private _syncCollisionShape(shape: CollisionShape3D, transform: Transform3D): void
}
```

### **Demo-3D 集成实现细节**

#### **集成步骤详细说明**

**步骤1: 为角色添加碰撞体**
```typescript
// 在demo-3d.vue的角色创建部分添加
const characterBody = new CharacterBody3D('CharacterBody')
const characterShape = new CollisionShape3D('CharacterCollision')
characterShape.setShape(CollisionShapeType.CAPSULE, {
  radius: 0.5,
  height: 1.8
})
characterShape.setDebugEnabled(true)
characterShape.setDebugColor(0xffff00) // 黄色

character.addChild(characterBody)
characterBody.addChild(characterShape)
```

**步骤2: 创建攻击检测区域**
```typescript
const attackArea = new Area3D('AttackArea')
const attackShape = new CollisionShape3D('AttackCollision')
attackShape.setShape(CollisionShapeType.SPHERE, { radius: 2.0 })
attackShape.setDebugEnabled(true)
attackShape.setDebugColor(0xff0000) // 红色
attackShape.setDebugOpacity(0.3)

attackArea.addChild(attackShape)
character.addChild(attackArea)

// 连接攻击事件
attackArea.connect('body_entered', (body: Node3D) => {
  console.log('攻击命中:', body.name)
})
```

**步骤3: 启用动画-碰撞同步**
```typescript
const animationSync = new AnimationCollisionSync(animationPlayer, {
  strategy: SyncStrategy.KEYFRAME,
  updateFrequency: 30,
  enabledBones: ['RightHand', 'LeftHand', 'RightFoot', 'LeftFoot']
})

animationSync.addCollisionShape(attackShape, 'RightHand')
animationSync.startSync()
```

**步骤4: 添加调试UI控制**
```vue
<!-- 在demo-3d.vue模板中添加 -->
<div class="collision-debug-panel">
  <h4>碰撞调试</h4>
  <label>
    <input type="checkbox" v-model="collisionDebugEnabled" @change="toggleCollisionDebug">
    显示碰撞体
  </label>
  <label>
    <input type="range" min="0" max="1" step="0.1" v-model="collisionOpacity" @input="updateCollisionOpacity">
    透明度: {{ collisionOpacity }}
  </label>
  <label>
    <select v-model="collisionSyncStrategy" @change="updateSyncStrategy">
      <option value="realtime">实时同步</option>
      <option value="keyframe">关键帧同步</option>
      <option value="threshold">阈值同步</option>
      <option value="manual">手动同步</option>
    </select>
  </label>
</div>
```

**步骤5: 实现控制逻辑**
```typescript
// 在demo-3d.vue的script部分添加
const collisionDebugEnabled = ref(true)
const collisionOpacity = ref(0.5)
const collisionSyncStrategy = ref('keyframe')

const toggleCollisionDebug = () => {
  const visualizer = CollisionVisualizer.getInstance()
  visualizer.updateConfig({ enabled: collisionDebugEnabled.value })
}

const updateCollisionOpacity = () => {
  const visualizer = CollisionVisualizer.getInstance()
  visualizer.updateConfig({ globalOpacity: collisionOpacity.value })
}

const updateSyncStrategy = () => {
  if (animationSync) {
    animationSync.updateConfig({
      strategy: collisionSyncStrategy.value as SyncStrategy
    })
  }
}
```

---

## 🧪 **测试验证计划**

### **功能测试**
1. **可视化测试**: 验证各种形状的线框显示正确
2. **同步测试**: 验证动画播放时碰撞体正确更新
3. **性能测试**: 验证大量碰撞体时的渲染性能
4. **交互测试**: 验证碰撞检测和事件触发正确

### **集成测试**
1. **Demo-3D集成**: 在现有演示中验证完整功能
2. **动画兼容性**: 确保不影响现有动画系统
3. **渲染兼容性**: 确保不影响现有渲染效果
4. **脚本兼容性**: 确保与现有脚本系统正常工作

---

## 📚 **文档和示例**

### **API文档**
- CollisionDebugRenderer API参考
- CollisionVisualizer 配置指南
- AnimationCollisionSync 使用教程
- 最佳实践和性能优化建议

### **示例代码**
- 基础碰撞检测示例
- 角色控制器使用示例
- 动画同步配置示例
- 自定义碰撞形状示例

---

**开发计划制定完成！准备开始Phase 1实现** 🎯
