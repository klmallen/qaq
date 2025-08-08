# StaticBody3D - 智能碰撞体系统

## 概述

StaticBody3D 是 QAQ 引擎中的静态物理体节点，支持基于实际几何体数据的智能碰撞形状生成。它能够自动从父节点的 MeshInstance3D 中提取几何体信息，生成最优的碰撞形状。

## 核心特性

- **智能形状推断**：自动从 Three.js 几何体中提取顶点和索引数据
- **世界坐标同步**：使用 `getWorldPosition()` 和 `getWorldQuaternion()` 获取准确坐标
- **Trimesh 支持**：为复杂几何体提供精确的 Trimesh 碰撞检测
- **性能优化**：支持 LOD 和网格过滤机制
- **自动回退**：在无法获取复杂数据时自动使用简化形状

## API 参考

### addAutoCollisionShape(options?)

智能推断并添加碰撞形状的主要方法。

#### 参数

```typescript
interface AutoCollisionOptions {
  scale?: Vector3              // 碰撞体缩放
  useTrimesh?: boolean         // 强制使用 Trimesh
  excludeNames?: string[]      // 排除的网格名称
  simplifyThreshold?: number   // 复杂度阈值
}
```

#### 默认值

```typescript
{
  useTrimesh: false,
  excludeNames: [],
  simplifyThreshold: 1000
}
```

## 使用示例

### 1. 基础用法（完全自动）

```typescript
// 创建地面网格
const ground = new MeshInstance3D('Ground')
ground.createPlaneMesh({ x: 20, y: 20 })
ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
ground.position = { x: 0, y: 0, z: 0 }
scene.addChild(ground)

// 创建静态物理体 - 完全自动化
const groundPhysicsBody = new StaticBody3D('GroundPhysics')
ground.addChild(groundPhysicsBody)
groundPhysicsBody.addAutoCollisionShape()  // 自动推断形状和位置
```

### 2. 高级用法（精确控制）

```typescript
// 复杂模型的精确碰撞
const staticBody = new StaticBody3D('ComplexModel')
complexModel.addChild(staticBody)
staticBody.addAutoCollisionShape({
  scale: { x: 1.1, y: 1.0, z: 1.1 },     // 稍微放大碰撞体
  useTrimesh: true,                       // 使用精确 Trimesh
  excludeNames: ['Solid', 'Decoration'],  // 排除装饰性网格
  simplifyThreshold: 500                  // 降低复杂度阈值
})
```

### 3. GLTF 模型碰撞（参考 playground02.glb）

```typescript
// 加载 GLTF 模型并创建碰撞体
gltfLoader.load('./model/playground02.glb', (gltf) => {
  const model = gltf.scene
  scene.add(model)
  
  // 为整个模型创建静态碰撞体
  const staticBody = new StaticBody3D('PlaygroundPhysics')
  model.add(staticBody)  // 添加到 Three.js 场景图
  
  staticBody.addAutoCollisionShape({
    useTrimesh: true,
    excludeNames: [
      'Solid',      // 排除足球模型
      'Cube019',    // 排除外围模型
      'Cube020',    // 排除外围模型
      'Plane009'    // 排除特定平面
    ],
    simplifyThreshold: 1000
  })
})
```

### 4. 性能优化示例

```typescript
// 大型场景的性能优化
const terrainBody = new StaticBody3D('TerrainPhysics')
terrainMesh.addChild(terrainBody)
terrainBody.addAutoCollisionShape({
  scale: { x: 1.0, y: 0.8, z: 1.0 },     // 压缩 Y 轴
  useTrimesh: false,                      // 强制使用简化形状
  simplifyThreshold: 100                  // 低复杂度阈值
})
```

## 智能形状选择逻辑

系统会根据几何体特征自动选择最优碰撞形状：

### 1. 平面检测
```typescript
if (minDimension < 0.1) {
  // 创建 PLANE 碰撞形状
  this.addPlaneShape()
}
```

### 2. 球体检测
```typescript
const dimensionRatio = minDimension / maxDimension
if (dimensionRatio > 0.8) {
  // 创建 SPHERE 碰撞形状
  const radius = (size.x + size.y + size.z) / 3
  this.addSphereShape(radius)
}
```

### 3. 盒子形状（默认）
```typescript
// 创建 BOX 碰撞形状
this.addBoxShape(size)
```

### 4. Trimesh（复杂几何体）
```typescript
if (useTrimesh && indices && vertexCount > simplifyThreshold) {
  // 创建精确 Trimesh 碰撞形状
  const trimesh = new CANNON.Trimesh(positions, indices)
  this.addCustomShape(trimesh)
}
```

## 调试工具

### 1. 网格信息查看
```javascript
// 在浏览器控制台中
testAutoCollision('meshName')  // 查看网格类型和参数
```

### 2. 物理调试器
```javascript
// 切换物理调试器显示
togglePhysicsDebugger()  // 显示/隐藏绿色线框

// 查看详细物理状态
debugPhysics()  // 显示所有物理体信息
```

## 性能建议

### 1. 静态场景
- 优先使用 Trimesh 获得精确碰撞
- 合理使用 `excludeNames` 排除不必要的网格
- 对于大型场景，考虑分块处理

### 2. 复杂模型
- 设置合适的 `simplifyThreshold`
- 使用 `scale` 参数微调碰撞体大小
- 排除纯装饰性的网格元素

### 3. 内存优化
- 避免为每个小物件创建 Trimesh
- 合并相似的静态物体
- 定期清理不再需要的物理体

## 错误处理

系统具有完善的错误处理机制：

1. **THREE.js 未加载**：自动回退到本地坐标
2. **几何体数据缺失**：使用默认 BOX 形状
3. **Trimesh 创建失败**：自动回退到简化形状
4. **世界坐标获取失败**：使用本地坐标

## 注意事项

1. **父节点要求**：必须是 MeshInstance3D 类型
2. **坐标系统**：自动处理世界坐标转换
3. **性能影响**：Trimesh 适用于静态物体，动态物体请谨慎使用
4. **网格命名**：合理命名网格以便使用排除功能
