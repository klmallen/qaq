# RigidBody3D - 智能动态物理体系统

## 概述

RigidBody3D 是 QAQ 引擎中的动态物理体节点，支持基于实际几何体数据的智能碰撞形状生成。专为动态物体设计，在保证物理精度的同时优化性能表现。

## 核心特性

- **智能形状推断**：自动从 Three.js 几何体中提取数据并选择最优碰撞形状
- **性能优化**：针对动态物体的特殊优化，谨慎使用 Trimesh
- **自动同步**：与父节点的位置和旋转自动同步
- **世界坐标支持**：准确处理复杂场景图中的坐标变换
- **智能回退**：多层错误处理确保系统稳定性

## API 参考

### addAutoCollisionShape(options?)

智能推断并添加碰撞形状的主要方法。

#### 参数

```typescript
interface AutoCollisionOptions {
  scale?: Vector3              // 碰撞体缩放
  useTrimesh?: boolean         // 强制使用 Trimesh（谨慎使用）
  excludeNames?: string[]      // 排除的网格名称
  simplifyThreshold?: number   // 复杂度阈值
}
```

#### 默认值

```typescript
{
  useTrimesh: false,           // 动态物体默认不使用 Trimesh
  excludeNames: [],
  simplifyThreshold: 1000
}
```

## 使用示例

### 1. 基础动态物体（推荐）

```typescript
// 创建立方体
const cube = new MeshInstance3D('Cube')
cube.createBoxMesh({ x: 2, y: 2, z: 2 })
cube.position = { x: 0, y: 5, z: 0 }
scene.addChild(cube)

// 创建动态物理体 - 完全自动化
const rigidBody = new RigidBody3D('CubePhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 5,
  restitution: 0.3,
  friction: 0.7
})
cube.addChild(rigidBody)
rigidBody.addAutoCollisionShape()  // 自动推断为 BOX 形状
```

### 2. 球体物理体

```typescript
// 创建球体
const sphere = new MeshInstance3D('Sphere')
sphere.createSphereMesh(1.5, 32)
sphere.position = { x: 2, y: 8, z: 0 }
scene.addChild(sphere)

// 自动推断为 SPHERE 形状
const sphereBody = new RigidBody3D('SpherePhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 3,
  restitution: 0.8,  // 高弹性
  friction: 0.2
})
sphere.addChild(sphereBody)
sphereBody.addAutoCollisionShape()
```

### 3. 复杂动态物体（性能优化）

```typescript
// 复杂模型的动态物理体
const complexObject = new MeshInstance3D('ComplexObject')
// ... 加载复杂模型

const dynamicBody = new RigidBody3D('ComplexPhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 10
})
complexObject.addChild(dynamicBody)

// 使用简化形状确保性能
dynamicBody.addAutoCollisionShape({
  scale: { x: 0.9, y: 0.9, z: 0.9 },  // 稍微缩小避免卡顿
  useTrimesh: false,                   // 强制使用简化形状
  excludeNames: ['Detail', 'Decoration'],
  simplifyThreshold: 100               // 低阈值强制简化
})
```

### 4. 高精度动态物体（谨慎使用）

```typescript
// 仅在必要时使用 Trimesh
const precisionBody = new RigidBody3D('PrecisionPhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 2
})
precisionMesh.addChild(precisionBody)

// 警告：动态 Trimesh 可能影响性能
precisionBody.addAutoCollisionShape({
  useTrimesh: true,                    // 强制精确碰撞
  simplifyThreshold: 200,              // 限制复杂度
  excludeNames: ['NonEssential']
})
```

### 5. 车辆物理体示例

```typescript
// 车辆主体
const carBody = new MeshInstance3D('CarBody')
carBody.createBoxMesh({ x: 4, y: 1.5, z: 2 })
carBody.position = { x: 0, y: 2, z: 0 }
scene.addChild(carBody)

const carPhysics = new RigidBody3D('CarPhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 1000,
  restitution: 0.1,
  friction: 0.8,
  linearDamping: 0.1,   // 线性阻尼
  angularDamping: 0.3   // 角度阻尼
})
carBody.addChild(carPhysics)

// 自动推断为适合车辆的 BOX 形状
carPhysics.addAutoCollisionShape({
  scale: { x: 0.95, y: 0.9, z: 0.95 }  // 稍微缩小避免边缘碰撞
})
```

## 动态物体特殊处理

### 1. 平面形状转换
```typescript
// 对于平面几何体，动态物体自动转换为扁平 BOX
case 'PLANE':
  const flatBoxSize = { x: size.x, y: 0.1, z: size.z }
  this.addBoxShape(flatBoxSize)
  console.log('PLANE 转换为扁平 BOX，适合动态物体')
```

### 2. Trimesh 性能警告
```typescript
// 系统会自动发出性能警告
console.warn('动态刚体使用 Trimesh 可能影响性能，建议使用简化形状')
```

### 3. 自动位置同步
```typescript
// 启用与父节点的持续同步
this._enableAutoSync()  // 监听父节点位置变化
```

## 性能优化建议

### 1. 形状选择优先级
1. **BOX** - 最佳性能，适合大多数情况
2. **SPHERE** - 良好性能，适合球形物体
3. **简化 BOX** - 用于复杂几何体的近似
4. **Trimesh** - 最低性能，仅在必要时使用

### 2. 质量设置建议
```typescript
// 轻量物体
mass: 0.5 - 2.0      // 小球、碎片

// 中等物体  
mass: 2.0 - 10.0     // 箱子、角色

// 重型物体
mass: 10.0 - 100.0   // 车辆、大型物体

// 超重物体
mass: 100.0+         // 建筑、巨型物体
```

### 3. 阻尼参数调优
```typescript
// 快速移动物体
linearDamping: 0.01   // 低阻尼
angularDamping: 0.05

// 普通物体
linearDamping: 0.1    // 中等阻尼
angularDamping: 0.3

// 缓慢物体
linearDamping: 0.5    // 高阻尼
angularDamping: 0.8
```

## 调试和监控

### 1. 性能监控
```javascript
// 监控物理体数量
console.log('动态物理体数量:', world.bodies.filter(b => b.type === CANNON.Body.DYNAMIC).length)

// 监控 Trimesh 使用
console.log('Trimesh 数量:', world.bodies.filter(b => 
  b.shapes.some(s => s.type === CANNON.Shape.types.TRIMESH)
).length)
```

### 2. 碰撞调试
```javascript
// 监听碰撞事件
world.addEventListener('beginContact', (event) => {
  console.log('动态碰撞:', event.bodyA.id, 'vs', event.bodyB.id)
})
```

## 常见问题和解决方案

### 1. 物体穿透地面
```typescript
// 确保地面是静态物体
const groundBody = new StaticBody3D('Ground')
// 确保动态物体有足够的质量
const dynamicBody = new RigidBody3D('Object', { mass: 5 })  // 不要使用 mass: 0
```

### 2. 物体运动不自然
```typescript
// 调整材质属性
const dynamicBody = new RigidBody3D('Object', {
  mass: 5,
  restitution: 0.3,  // 弹性系数 0-1
  friction: 0.7,     // 摩擦系数 0-1
  linearDamping: 0.1, // 线性阻尼
  angularDamping: 0.3 // 角度阻尼
})
```

### 3. 性能问题
```typescript
// 减少 Trimesh 使用
dynamicBody.addAutoCollisionShape({
  useTrimesh: false,
  simplifyThreshold: 50  // 强制简化
})

// 合并小物体
// 使用对象池重用物理体
// 定期清理不活跃的物体
```

## 最佳实践

1. **优先使用基础形状**：BOX、SPHERE 性能最佳
2. **谨慎使用 Trimesh**：仅在精度要求极高时使用
3. **合理设置质量**：避免质量差异过大的物体碰撞
4. **适当的阻尼**：防止物体无限运动
5. **定期清理**：移除不再需要的动态物体
6. **批量处理**：避免每帧创建/销毁物理体
