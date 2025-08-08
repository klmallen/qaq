# MeshInstance3D - 智能碰撞体集成

## 概述

MeshInstance3D 现在内置了智能碰撞体支持，能够记录网格创建时的类型和参数信息，为物理体提供精确的碰撞形状推断数据。

## 新增特性

### 网格信息记录
每个 MeshInstance3D 实例现在会自动记录：
- **网格类型**：BOX、SPHERE、PLANE、CUSTOM
- **创建参数**：尺寸、半径等几何参数
- **Three.js 几何体**：实际的顶点和索引数据

### getMeshInfo() 方法
```typescript
interface MeshInfo {
  type: 'BOX' | 'SPHERE' | 'PLANE' | 'CUSTOM'
  parameters: any
}

const meshInfo = meshInstance.getMeshInfo()
```

## 支持的网格类型

### 1. BOX 网格
```typescript
const cube = new MeshInstance3D('Cube')
cube.createBoxMesh({ x: 2, y: 1, z: 3 })

// 自动记录信息
console.log(cube.getMeshInfo())
// 输出: { type: 'BOX', parameters: { size: { x: 2, y: 1, z: 3 } } }
```

### 2. SPHERE 网格
```typescript
const sphere = new MeshInstance3D('Sphere')
sphere.createSphereMesh(1.5, 32)

// 自动记录信息
console.log(sphere.getMeshInfo())
// 输出: { type: 'SPHERE', parameters: { radius: 1.5, segments: 32 } }
```

### 3. PLANE 网格
```typescript
const plane = new MeshInstance3D('Plane')
plane.createPlaneMesh({ x: 10, y: 10 })

// 自动记录信息
console.log(plane.getMeshInfo())
// 输出: { type: 'PLANE', parameters: { size: { x: 10, y: 10 } } }
```

## 与物理体的集成

### 自动碰撞形状生成
```typescript
// 1. 创建网格
const box = new MeshInstance3D('Box')
box.createBoxMesh({ x: 2, y: 2, z: 2 })
box.position = { x: 0, y: 5, z: 0 }
scene.addChild(box)

// 2. 添加物理体
const rigidBody = new RigidBody3D('BoxPhysics', {
  mode: RigidBodyMode.DYNAMIC,
  mass: 5
})
box.addChild(rigidBody)

// 3. 自动推断碰撞形状
rigidBody.addAutoCollisionShape()  // 自动使用 BOX(2,2,2)
```

### 智能推断流程
1. **获取网格信息**：从 `getMeshInfo()` 获取类型和参数
2. **提取几何体数据**：从 Three.js 几何体获取顶点/索引
3. **选择最优形状**：根据复杂度和类型选择碰撞形状
4. **应用变换**：同步世界坐标和旋转

## 外部模型支持

### GLTF/FBX 模型
```typescript
// 加载外部模型
gltfLoader.load('./model/complex.glb', (gltf) => {
  const model = gltf.scene
  scene.add(model)
  
  // 创建 MeshInstance3D 包装器
  const meshWrapper = new MeshInstance3D('ComplexModel')
  meshWrapper.object3D = model  // 直接关联 Three.js 对象
  
  // 添加物理体
  const staticBody = new StaticBody3D('ComplexPhysics')
  meshWrapper.addChild(staticBody)
  
  // 自动从实际几何体推断
  staticBody.addAutoCollisionShape({
    useTrimesh: true,
    excludeNames: ['Decoration', 'Detail']
  })
})
```

### 自定义几何体
```typescript
// 自定义几何体
const custom = new MeshInstance3D('Custom')
const geometry = new THREE.BufferGeometry()
// ... 设置自定义几何体
custom.geometry = geometry
custom.materials = [material]

// 物理体会自动从实际几何体数据推断
const customBody = new RigidBody3D('CustomPhysics')
custom.addChild(customBody)
customBody.addAutoCollisionShape()  // 基于实际顶点数据
```

## 高级用法示例

### 1. 地形网格
```typescript
// 创建地形
const terrain = new MeshInstance3D('Terrain')
terrain.createPlaneMesh({ x: 100, y: 100 })
terrain.rotation = { x: -Math.PI / 2, y: 0, z: 0 }

// 地形物理体
const terrainBody = new StaticBody3D('TerrainPhysics')
terrain.addChild(terrainBody)
terrainBody.addAutoCollisionShape({
  scale: { x: 1.0, y: 0.1, z: 1.0 }  // 压扁 Y 轴
})
```

### 2. 建筑物集合
```typescript
// 建筑物模型
const building = new MeshInstance3D('Building')
// ... 加载复杂建筑模型

const buildingBody = new StaticBody3D('BuildingPhysics')
building.addChild(buildingBody)
buildingBody.addAutoCollisionShape({
  useTrimesh: true,
  excludeNames: [
    'Window',     // 排除窗户
    'Door',       // 排除门
    'Decoration', // 排除装饰
    'Light'       // 排除灯具
  ],
  simplifyThreshold: 2000
})
```

### 3. 车辆组件
```typescript
// 车身
const carBody = new MeshInstance3D('CarBody')
carBody.createBoxMesh({ x: 4, y: 1.5, z: 2 })

// 车轮（球体近似）
const wheel = new MeshInstance3D('Wheel')
wheel.createSphereMesh(0.5)

// 自动推断不同的碰撞形状
const carPhysics = new RigidBody3D('CarPhysics')
carBody.addChild(carPhysics)
carPhysics.addAutoCollisionShape()  // BOX 形状

const wheelPhysics = new RigidBody3D('WheelPhysics')
wheel.addChild(wheelPhysics)
wheelPhysics.addAutoCollisionShape()  // SPHERE 形状
```

## 调试和验证

### 查看网格信息
```javascript
// 在浏览器控制台中
testAutoCollision('meshName')

// 或直接调用
const meshInfo = meshInstance.getMeshInfo()
console.log('网格类型:', meshInfo.type)
console.log('参数:', meshInfo.parameters)
```

### 验证几何体数据
```javascript
// 检查 Three.js 几何体
const geometry = meshInstance.object3D.geometry
console.log('顶点数:', geometry.attributes.position.count)
console.log('是否有索引:', !!geometry.index)
console.log('包围盒:', geometry.boundingBox)
```

## 性能考虑

### 1. 网格复杂度
- **简单网格**（< 100 顶点）：使用基础形状
- **中等网格**（100-1000 顶点）：可选择 Trimesh
- **复杂网格**（> 1000 顶点）：建议简化或分块

### 2. 内存使用
```typescript
// 大型场景优化
const optimizedBody = new StaticBody3D('Optimized')
largeMesh.addChild(optimizedBody)
optimizedBody.addAutoCollisionShape({
  useTrimesh: false,        // 避免大量内存使用
  simplifyThreshold: 100,   // 强制简化
  excludeNames: ['Detail']  // 排除细节网格
})
```

### 3. 批量处理
```typescript
// 批量创建相似物体
const boxTemplate = { x: 1, y: 1, z: 1 }
for (let i = 0; i < 100; i++) {
  const box = new MeshInstance3D(`Box_${i}`)
  box.createBoxMesh(boxTemplate)  // 重用相同参数
  
  const body = new RigidBody3D(`BoxPhysics_${i}`)
  box.addChild(body)
  body.addAutoCollisionShape()  // 自动推断相同形状
}
```

## 最佳实践

1. **合理命名**：为网格使用描述性名称，便于调试
2. **参数复用**：相同类型的网格使用相同参数
3. **分层设计**：复杂模型分解为多个简单组件
4. **测试验证**：使用调试工具验证碰撞形状
5. **性能监控**：定期检查物理体数量和复杂度

## 错误处理

系统具有完善的错误处理：

1. **网格信息缺失**：回退到包围盒计算
2. **几何体数据无效**：使用默认 BOX 形状
3. **Three.js 对象缺失**：使用记录的创建参数
4. **内存不足**：自动降级到简化形状

## 未来扩展

计划支持的功能：
- **LOD 碰撞**：根据距离自动调整碰撞精度
- **动态简化**：运行时根据性能自动调整
- **碰撞缓存**：缓存常用的碰撞形状
- **材质感知**：根据材质类型选择碰撞属性
