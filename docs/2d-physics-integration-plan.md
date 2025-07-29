# QAQ游戏引擎 2D物理系统集成架构计划

## 概述

本文档详细描述了如何将2D物理系统集成到现有的QAQ游戏引擎架构中，确保与当前的Node -> Node2D -> SpecificNode2D层次结构兼容，并与THREE.js渲染系统无缝协作。

## 当前架构分析

### 现有节点层次结构
```
Node (基础节点)
├── Node2D (2D节点基类)
│   ├── Sprite2D (2D精灵)
│   ├── AnimatedSprite2D (动画精灵)
│   ├── TileMap2D (瓦片地图)
│   ├── Camera2D (2D相机)
│   └── [其他2D节点]
└── Node3D (3D节点基类)
    └── [3D节点...]
```

### 现有渲染系统
- 基于THREE.js的渲染管线
- 2D坐标系统：左上角原点(0,0)，Y轴向下
- 2D节点通过THREE.Object3D进行渲染
- 支持2D/3D模式切换

## 2D物理系统架构设计

### 1. 物理引擎选择

**推荐：Matter.js**
- 轻量级2D物理引擎
- 成熟稳定，文档完善
- 支持刚体、约束、碰撞检测
- 与JavaScript生态系统兼容性好

**备选：Box2D.js**
- 更强大的物理模拟
- 性能更好，但体积较大
- 适合复杂物理场景

### 2. 物理节点层次结构

```typescript
Node2D (基础2D节点)
├── PhysicsBody2D (物理体基类)
│   ├── RigidBody2D (刚体)
│   ├── StaticBody2D (静态体)
│   ├── KinematicBody2D (运动学体)
│   └── CharacterBody2D (角色体)
├── Area2D (触发区域)
├── CollisionShape2D (碰撞形状)
└── Joint2D (物理关节)
    ├── PinJoint2D (销关节)
    ├── SpringJoint2D (弹簧关节)
    └── DistanceJoint2D (距离关节)
```

### 3. 核心组件设计

#### PhysicsWorld2D (物理世界)
```typescript
class PhysicsWorld2D {
  private engine: Matter.Engine
  private world: Matter.World
  private runner: Matter.Runner
  
  // 物理参数
  gravity: Vector2 = { x: 0, y: 9.8 }
  timeScale: number = 1.0
  
  // 物理体管理
  private bodies: Map<string, Matter.Body>
  private constraints: Map<string, Matter.Constraint>
  
  // 碰撞检测
  private collisionCallbacks: Map<string, Function>
  
  // 核心方法
  step(deltaTime: number): void
  addBody(body: PhysicsBody2D): void
  removeBody(body: PhysicsBody2D): void
  raycast(from: Vector2, to: Vector2): RaycastResult[]
}
```

#### PhysicsBody2D (物理体基类)
```typescript
abstract class PhysicsBody2D extends Node2D {
  // Matter.js物理体
  protected matterBody: Matter.Body | null = null
  
  // 物理属性
  mass: number = 1.0
  friction: number = 0.1
  restitution: number = 0.0
  density: number = 1.0
  
  // 碰撞属性
  collisionLayer: number = 1
  collisionMask: number = 1
  isSensor: boolean = false
  
  // 运动状态
  velocity: Vector2 = { x: 0, y: 0 }
  angularVelocity: number = 0
  
  // 核心方法
  abstract createMatterBody(): Matter.Body
  applyForce(force: Vector2, point?: Vector2): void
  applyImpulse(impulse: Vector2, point?: Vector2): void
  setVelocity(velocity: Vector2): void
  
  // 生命周期
  _ready(): void
  _physics_process(delta: number): void
  _exit_tree(): void
}
```

### 4. 坐标系统转换

#### 问题分析
- QAQ引擎2D坐标系：左上角原点，Y轴向下
- Matter.js坐标系：左下角原点，Y轴向上
- THREE.js坐标系：中心原点，Y轴向上

#### 解决方案
```typescript
class CoordinateConverter {
  // QAQ 2D -> Matter.js
  static qaqToMatter(qaqPos: Vector2, worldHeight: number): Vector2 {
    return {
      x: qaqPos.x,
      y: worldHeight - qaqPos.y
    }
  }
  
  // Matter.js -> QAQ 2D
  static matterToQaq(matterPos: Vector2, worldHeight: number): Vector2 {
    return {
      x: matterPos.x,
      y: worldHeight - matterPos.y
    }
  }
  
  // QAQ 2D -> THREE.js
  static qaqToThree(qaqPos: Vector2): Vector3 {
    return {
      x: qaqPos.x,
      y: -qaqPos.y, // Y轴翻转
      z: 0
    }
  }
}
```

### 5. 碰撞形状系统

#### CollisionShape2D基类
```typescript
abstract class CollisionShape2D extends Node2D {
  // 形状属性
  abstract shapeType: CollisionShapeType
  disabled: boolean = false
  oneWayCollision: boolean = false
  
  // Matter.js形状数据
  protected shapeData: any = null
  
  // 核心方法
  abstract createMatterShape(): any
  updateShape(): void
  
  // 调试渲染
  debugDraw(context: CanvasRenderingContext2D): void
}
```

#### 具体形状实现
```typescript
// 矩形碰撞形状
class RectangleShape2D extends CollisionShape2D {
  size: Vector2 = { x: 32, y: 32 }
  
  createMatterShape() {
    return Matter.Bodies.rectangle(0, 0, this.size.x, this.size.y)
  }
}

// 圆形碰撞形状
class CircleShape2D extends CollisionShape2D {
  radius: number = 16
  
  createMatterShape() {
    return Matter.Bodies.circle(0, 0, this.radius)
  }
}

// 多边形碰撞形状
class PolygonShape2D extends CollisionShape2D {
  points: Vector2[] = []
  
  createMatterShape() {
    return Matter.Bodies.fromVertices(0, 0, [this.points])
  }
}
```

## 集成实施计划

### 阶段1：基础架构 (1-2周)

**任务列表：**
1. **PhysicsWorld2D实现**
   - 集成Matter.js引擎
   - 实现基础物理世界管理
   - 坐标系统转换

2. **PhysicsBody2D基类**
   - 定义物理体接口
   - 实现基础物理属性
   - 与Node2D集成

3. **碰撞形状系统**
   - CollisionShape2D基类
   - 基础形状实现（矩形、圆形）

**验收标准：**
- 物理世界可以正常初始化
- 基础物理体可以创建和销毁
- 坐标转换正确

### 阶段2：核心物理体 (2-3周)

**任务列表：**
1. **RigidBody2D实现**
   - 动态刚体物理模拟
   - 力和冲量应用
   - 碰撞响应

2. **StaticBody2D实现**
   - 静态物理体
   - 地形和障碍物

3. **KinematicBody2D实现**
   - 运动学体
   - 平台和移动物体

**验收标准：**
- 刚体物理模拟正确
- 碰撞检测和响应正常
- 性能满足要求

### 阶段3：高级功能 (2-3周)

**任务列表：**
1. **Area2D触发系统**
   - 触发区域检测
   - 进入/离开事件

2. **Joint2D关节系统**
   - 各种物理关节
   - 约束和连接

3. **CharacterBody2D角色控制**
   - 角色专用物理体
   - 移动和跳跃控制

**验收标准：**
- 触发系统工作正常
- 关节约束稳定
- 角色控制流畅

### 阶段4：优化和工具 (1-2周)

**任务列表：**
1. **性能优化**
   - 空间分割优化
   - 休眠机制
   - 批量处理

2. **调试工具**
   - 物理体可视化
   - 性能监控
   - 调试面板

3. **编辑器集成**
   - 物理属性编辑
   - 碰撞形状编辑
   - 实时预览

**验收标准：**
- 性能达到60FPS
- 调试工具完善
- 编辑器功能可用

## 技术挑战和解决方案

### 1. 坐标系统一致性
**挑战：** 三套不同的坐标系统需要保持同步
**解决方案：** 
- 统一的坐标转换工具类
- 自动同步机制
- 单元测试覆盖

### 2. 性能优化
**挑战：** 物理模拟可能影响渲染性能
**解决方案：**
- 固定时间步长物理更新
- 空间分割和剔除
- 物理体休眠机制

### 3. 渲染同步
**挑战：** 物理位置与渲染位置同步
**解决方案：**
- 插值和外推算法
- 双缓冲机制
- 平滑过渡

## 兼容性保证

### 1. 现有代码兼容
- 物理系统为可选功能
- 不影响现有2D节点
- 渐进式集成

### 2. API设计原则
- 遵循Godot风格API
- 保持一致的命名规范
- 提供TypeScript类型支持

### 3. 向后兼容
- 现有项目无需修改
- 物理功能按需启用
- 平滑升级路径

## 总结

本架构计划提供了一个完整的2D物理系统集成方案，确保与现有QAQ引擎架构的兼容性，同时提供强大的物理模拟功能。通过分阶段实施，可以逐步构建一个稳定、高性能的2D物理系统。
