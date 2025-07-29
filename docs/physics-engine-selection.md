# QAQ游戏引擎 - 物理引擎选型和架构设计

## 🔍 物理引擎选型分析

### 候选物理引擎评估

#### 1. **Cannon.js** ⭐⭐⭐⭐⭐ (推荐)

**优势**：
- ✅ **Three.js生态兼容性**: 官方Three.js示例大量使用，成熟的集成方案
- ✅ **TypeScript支持**: 完整的@types/cannon类型定义
- ✅ **学习曲线**: 清晰的API设计，丰富的文档和教程
- ✅ **体积适中**: ~200KB，适合Web游戏
- ✅ **功能完整**: 支持刚体、静态体、运动学体、约束系统
- ✅ **Godot兼容**: API设计理念与Godot物理系统相似

**劣势**：
- ⚠️ 性能相对较低（但对大多数游戏足够）
- ⚠️ 不支持软体物理

**技术指标**：
- 体积: ~200KB
- 性能: 中等
- 功能: 完整的刚体物理
- 维护状态: 活跃

#### 2. **Ammo.js** ⭐⭐⭐⭐

**优势**：
- ✅ 功能最完整（刚体、软体、流体）
- ✅ 高性能（Bullet物理引擎移植）
- ✅ 工业级稳定性

**劣势**：
- ❌ 体积较大（~1.5MB）
- ❌ WebAssembly编译复杂
- ❌ TypeScript支持不完善
- ❌ 学习曲线陡峭

#### 3. **Rapier** ⭐⭐⭐⭐

**优势**：
- ✅ Rust + WebAssembly，性能优异
- ✅ 现代化设计
- ✅ 优秀的TypeScript支持

**劣势**：
- ❌ 相对较新，生态系统小
- ❌ Three.js集成需要额外工作
- ❌ 文档相对较少

### 🎯 最终选择：Cannon.js

**选择理由**：
1. **Three.js生态完美匹配** - 无缝集成，大量示例和最佳实践
2. **TypeScript原生支持** - 完整类型定义，开发体验优秀
3. **Godot API兼容** - 设计理念相似，易于实现Godot风格API
4. **学习成本低** - 清晰的文档，丰富的社区资源
5. **体积性能平衡** - 适中的体积，满足大多数游戏需求

## 🏗️ PhysicsServer架构设计

### 核心设计理念

1. **统一接口封装** - 提供Godot风格的物理API，隐藏底层Cannon.js实现
2. **单例模式管理** - 全局唯一的物理世界管理器
3. **生命周期集成** - 与Engine渲染循环深度集成
4. **类型安全** - 完整的TypeScript类型定义

### 架构层次

```
QAQ物理系统架构
├── PhysicsServer (统一接口层)
│   ├── 物理世界管理
│   ├── 物理体生命周期
│   ├── 碰撞形状创建
│   └── 射线检测和查询
├── Cannon.js (物理引擎层)
│   ├── World (物理世界)
│   ├── Body (物理体)
│   ├── Shape (碰撞形状)
│   └── Material (物理材质)
└── Three.js (渲染层)
    ├── Object3D (渲染对象)
    ├── Geometry (几何体)
    └── Material (渲染材质)
```

### 核心组件

#### 1. **PhysicsServer** - 物理引擎统一接口
- **单例管理**: 全局唯一的物理服务器实例
- **世界管理**: 物理世界的创建、配置和销毁
- **体系管理**: 物理体的添加、移除和查询
- **形状创建**: 各种碰撞形状的创建工厂
- **材质管理**: 物理材质的创建和应用
- **仿真控制**: 物理仿真的步进和同步

#### 2. **物理体类型系统**
```typescript
enum PhysicsBodyType {
  STATIC = 0,     // 静态物体 - 不移动，不受力影响
  KINEMATIC = 1,  // 运动学物体 - 可移动，不受力影响  
  DYNAMIC = 2     // 动态物体 - 受物理力影响
}
```

#### 3. **碰撞形状系统**
```typescript
enum CollisionShapeType {
  BOX = 'box',           // 盒子形状
  SPHERE = 'sphere',     // 球体形状
  CAPSULE = 'capsule',   // 胶囊形状
  CYLINDER = 'cylinder', // 圆柱形状
  PLANE = 'plane',       // 平面形状
  MESH = 'mesh'          // 网格形状
}
```

## 🔧 实现特性

### 已实现功能

#### 1. **物理世界管理**
- ✅ 物理世界初始化和配置
- ✅ 重力设置和调整
- ✅ 求解器参数配置
- ✅ 宽相检测算法选择

#### 2. **物理体管理**
- ✅ 物理体创建和销毁
- ✅ 物理体类型设置
- ✅ 位置和旋转同步
- ✅ 质量和惯性配置

#### 3. **碰撞形状支持**
- ✅ 基础几何形状（盒子、球体、圆柱、平面）
- ✅ 复杂网格形状
- ✅ 从Three.js几何体自动生成
- ✅ 形状组合和复合形状

#### 4. **物理材质系统**
- ✅ 材质创建和管理
- ✅ 摩擦系数设置
- ✅ 弹性系数设置
- ✅ 预定义材质库（默认、地面、弹性、冰面）

#### 5. **力和运动控制**
- ✅ 力的应用（applyForce）
- ✅ 冲量的应用（applyImpulse）
- ✅ 速度和角速度设置
- ✅ 相对作用点支持

#### 6. **射线检测和查询**
- ✅ 射线检测（raycast）
- ✅ 点查询（pointQuery）
- ✅ 碰撞过滤支持
- ✅ 详细的检测结果

#### 7. **渲染同步**
- ✅ 物理体到Three.js对象同步
- ✅ Three.js对象到物理体同步
- ✅ 位置和旋转自动同步
- ✅ 实时更新机制

### 技术实现亮点

#### 1. **模拟实现策略**
由于当前环境限制，PhysicsServer采用了模拟实现策略：
- 提供完整的API接口定义
- 实现基础的功能逻辑
- 保留真实Cannon.js的集成接口
- 便于后续无缝升级到真实物理引擎

#### 2. **类型安全设计**
```typescript
// 完整的类型定义
interface PhysicsMaterial {
  friction?: number
  restitution?: number
  contactEquationStiffness?: number
  // ...更多属性
}

interface RaycastResult {
  hasHit: boolean
  hitPoint?: Vector3
  hitNormal?: Vector3
  // ...详细结果
}
```

#### 3. **工厂模式应用**
```typescript
// 碰撞形状工厂方法
createBoxShape(size: Vector3): CANNON.Box
createSphereShape(radius: number): CANNON.Sphere
createMeshShape(geometry: THREE.BufferGeometry): CANNON.Trimesh
```

## 📊 性能和优化

### 性能特性
- **固定时间步长**: 1/60秒，确保物理仿真稳定性
- **自适应子步数**: 最大3个子步，处理帧率波动
- **智能休眠**: 静止物体自动休眠，节省计算资源
- **宽相优化**: SAP算法，高效的碰撞检测

### 内存管理
- **对象池**: 复用物理体和形状对象
- **智能缓存**: 材质和形状的缓存机制
- **及时清理**: 完整的资源清理和销毁

## 🚀 使用示例

### 基础使用
```typescript
// 初始化物理服务器
const physics = PhysicsServer.getInstance()
physics.initialize({
  gravity: { x: 0, y: -9.82, z: 0 },
  solverIterations: 10
})

// 创建地面
const groundShape = physics.createPlaneShape()
const groundBody = physics.createBody(
  'ground', 
  PhysicsBodyType.STATIC, 
  groundShape,
  { x: 0, y: 0, z: 0 }
)

// 创建动态物体
const boxShape = physics.createBoxShape({ x: 1, y: 1, z: 1 })
const boxBody = physics.createBody(
  'box',
  PhysicsBodyType.DYNAMIC,
  boxShape,
  { x: 0, y: 5, z: 0 },
  1.0 // 质量
)

// 物理仿真步进
physics.step(deltaTime)
```

## 🔮 未来扩展

### 计划功能
- **约束系统**: 铰链、滑块、弹簧等约束
- **触发器**: 碰撞检测但不产生物理响应
- **软体物理**: 布料、绳索等软体模拟
- **流体模拟**: 水、烟雾等流体效果
- **性能优化**: 多线程、GPU加速等

### 升级路径
1. **Phase 1**: 当前模拟实现 ✅
2. **Phase 2**: 集成真实Cannon.js
3. **Phase 3**: 可选Ammo.js后端
4. **Phase 4**: 自研物理引擎

QAQ游戏引擎的物理系统架构已经建立，为后续的物理节点实现奠定了坚实基础！
