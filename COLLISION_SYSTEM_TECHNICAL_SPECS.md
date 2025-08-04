# QAQ游戏引擎 - 碰撞系统技术规范

## 🔧 **核心技术实现细节**

### **1. 碰撞可视化渲染技术**

#### **1.1 线框几何体生成算法**

**盒子线框生成**:
```typescript
private createBoxWireframe(size: Vector3): THREE.BufferGeometry {
  const { x, y, z } = size
  const vertices = new Float32Array([
    // 底面
    -x/2, -y/2, -z/2,  x/2, -y/2, -z/2,
     x/2, -y/2, -z/2,  x/2, -y/2,  z/2,
     x/2, -y/2,  z/2, -x/2, -y/2,  z/2,
    -x/2, -y/2,  z/2, -x/2, -y/2, -z/2,
    // 顶面
    -x/2,  y/2, -z/2,  x/2,  y/2, -z/2,
     x/2,  y/2, -z/2,  x/2,  y/2,  z/2,
     x/2,  y/2,  z/2, -x/2,  y/2,  z/2,
    -x/2,  y/2,  z/2, -x/2,  y/2, -z/2,
    // 垂直边
    -x/2, -y/2, -z/2, -x/2,  y/2, -z/2,
     x/2, -y/2, -z/2,  x/2,  y/2, -z/2,
     x/2, -y/2,  z/2,  x/2,  y/2,  z/2,
    -x/2, -y/2,  z/2, -x/2,  y/2,  z/2
  ])
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  return geometry
}
```

**球体线框生成**:
```typescript
private createSphereWireframe(radius: number, segments: number = 16): THREE.BufferGeometry {
  const vertices: number[] = []
  
  // 经线 (Meridians)
  for (let i = 0; i < segments; i++) {
    const phi = (i / segments) * Math.PI * 2
    for (let j = 0; j < segments; j++) {
      const theta1 = (j / segments) * Math.PI
      const theta2 = ((j + 1) / segments) * Math.PI
      
      // 第一个点
      vertices.push(
        radius * Math.sin(theta1) * Math.cos(phi),
        radius * Math.cos(theta1),
        radius * Math.sin(theta1) * Math.sin(phi)
      )
      
      // 第二个点
      vertices.push(
        radius * Math.sin(theta2) * Math.cos(phi),
        radius * Math.cos(theta2),
        radius * Math.sin(theta2) * Math.sin(phi)
      )
    }
  }
  
  // 纬线 (Parallels)
  for (let j = 1; j < segments; j++) {
    const theta = (j / segments) * Math.PI
    const y = radius * Math.cos(theta)
    const r = radius * Math.sin(theta)
    
    for (let i = 0; i < segments; i++) {
      const phi1 = (i / segments) * Math.PI * 2
      const phi2 = ((i + 1) / segments) * Math.PI * 2
      
      vertices.push(
        r * Math.cos(phi1), y, r * Math.sin(phi1),
        r * Math.cos(phi2), y, r * Math.sin(phi2)
      )
    }
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  return geometry
}
```

#### **1.2 材质管理系统**

**调试材质缓存**:
```typescript
export class DebugMaterialManager {
  private static _instance: DebugMaterialManager | null = null
  private _materials: Map<string, THREE.LineBasicMaterial> = new Map()
  
  static getInstance(): DebugMaterialManager {
    if (!this._instance) {
      this._instance = new DebugMaterialManager()
    }
    return this._instance
  }
  
  getMaterial(color: number, opacity: number = 1.0): THREE.LineBasicMaterial {
    const key = `${color.toString(16)}_${opacity.toFixed(2)}`
    
    if (!this._materials.has(key)) {
      const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: opacity < 1.0,
        depthTest: true,
        depthWrite: false
      })
      this._materials.set(key, material)
    }
    
    return this._materials.get(key)!
  }
  
  updateMaterialColor(material: THREE.LineBasicMaterial, color: number): void {
    material.color.setHex(color)
    material.needsUpdate = true
  }
  
  dispose(): void {
    this._materials.forEach(material => material.dispose())
    this._materials.clear()
  }
}
```

### **2. 动画碰撞同步技术**

#### **2.1 骨骼变换跟踪算法**

**变换差异检测**:
```typescript
interface TransformDelta {
  position: number  // 位置变化量
  rotation: number  // 旋转变化量 (弧度)
  scale: number     // 缩放变化量
}

export class BoneTransformTracker {
  private _lastTransforms: Map<string, Transform3D> = new Map()
  private _thresholds: TransformDelta = {
    position: 0.01,  // 1cm
    rotation: 0.017, // ~1度
    scale: 0.01      // 1%
  }
  
  shouldUpdate(boneName: string, currentTransform: Transform3D): boolean {
    const lastTransform = this._lastTransforms.get(boneName)
    if (!lastTransform) {
      this._lastTransforms.set(boneName, this.cloneTransform(currentTransform))
      return true
    }
    
    const delta = this.calculateDelta(lastTransform, currentTransform)
    
    if (delta.position > this._thresholds.position ||
        delta.rotation > this._thresholds.rotation ||
        delta.scale > this._thresholds.scale) {
      this._lastTransforms.set(boneName, this.cloneTransform(currentTransform))
      return true
    }
    
    return false
  }
  
  private calculateDelta(a: Transform3D, b: Transform3D): TransformDelta {
    const positionDelta = Math.sqrt(
      Math.pow(a.position.x - b.position.x, 2) +
      Math.pow(a.position.y - b.position.y, 2) +
      Math.pow(a.position.z - b.position.z, 2)
    )
    
    const rotationDelta = Math.sqrt(
      Math.pow(a.rotation.x - b.rotation.x, 2) +
      Math.pow(a.rotation.y - b.rotation.y, 2) +
      Math.pow(a.rotation.z - b.rotation.z, 2)
    )
    
    const scaleDelta = Math.sqrt(
      Math.pow(a.scale.x - b.scale.x, 2) +
      Math.pow(a.scale.y - b.scale.y, 2) +
      Math.pow(a.scale.z - b.scale.z, 2)
    )
    
    return { position: positionDelta, rotation: rotationDelta, scale: scaleDelta }
  }
  
  private cloneTransform(transform: Transform3D): Transform3D {
    return {
      position: { ...transform.position },
      rotation: { ...transform.rotation },
      scale: { ...transform.scale }
    }
  }
}
```

#### **2.2 高效同步策略**

**批量更新机制**:
```typescript
export class CollisionUpdateBatcher {
  private _pendingUpdates: Map<string, CollisionUpdateInfo> = new Map()
  private _updateTimer: number = 0
  private _batchInterval: number = 16.67 // 60 FPS
  
  interface CollisionUpdateInfo {
    shape: CollisionShape3D
    transform: Transform3D
    priority: number
  }
  
  scheduleUpdate(shapeId: string, shape: CollisionShape3D, transform: Transform3D, priority: number = 0): void {
    this._pendingUpdates.set(shapeId, { shape, transform, priority })
  }
  
  processBatch(deltaTime: number): void {
    this._updateTimer += deltaTime * 1000
    
    if (this._updateTimer >= this._batchInterval) {
      this._updateTimer = 0
      
      // 按优先级排序
      const updates = Array.from(this._pendingUpdates.values())
        .sort((a, b) => b.priority - a.priority)
      
      // 批量处理更新
      updates.forEach(update => {
        this.applyCollisionUpdate(update.shape, update.transform)
      })
      
      this._pendingUpdates.clear()
    }
  }
  
  private applyCollisionUpdate(shape: CollisionShape3D, transform: Transform3D): void {
    // 更新物理体变换
    const physicsBody = shape.getPhysicsBody()
    if (physicsBody) {
      physicsBody.position.set(transform.position.x, transform.position.y, transform.position.z)
      physicsBody.quaternion.setFromEuler(transform.rotation.x, transform.rotation.y, transform.rotation.z)
    }
    
    // 更新调试可视化
    if (shape.isDebugEnabled()) {
      const wireframe = shape.getDebugWireframe()
      if (wireframe) {
        wireframe.position.copy(transform.position as any)
        wireframe.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z)
        wireframe.scale.copy(transform.scale as any)
      }
    }
  }
}
```

### **3. 性能优化技术**

#### **3.1 空间分割优化**

**空间哈希网格**:
```typescript
export class SpatialHashGrid {
  private _cellSize: number
  private _grid: Map<string, Set<CollisionShape3D>> = new Map()
  
  constructor(cellSize: number = 10) {
    this._cellSize = cellSize
  }
  
  private getGridKey(x: number, y: number, z: number): string {
    const gx = Math.floor(x / this._cellSize)
    const gy = Math.floor(y / this._cellSize)
    const gz = Math.floor(z / this._cellSize)
    return `${gx},${gy},${gz}`
  }
  
  insert(shape: CollisionShape3D): void {
    const bounds = shape.getBoundingBox()
    const keys = this.getBoundingKeys(bounds)
    
    keys.forEach(key => {
      if (!this._grid.has(key)) {
        this._grid.set(key, new Set())
      }
      this._grid.get(key)!.add(shape)
    })
  }
  
  remove(shape: CollisionShape3D): void {
    const bounds = shape.getBoundingBox()
    const keys = this.getBoundingKeys(bounds)
    
    keys.forEach(key => {
      const cell = this._grid.get(key)
      if (cell) {
        cell.delete(shape)
        if (cell.size === 0) {
          this._grid.delete(key)
        }
      }
    })
  }
  
  query(bounds: BoundingBox): CollisionShape3D[] {
    const keys = this.getBoundingKeys(bounds)
    const results = new Set<CollisionShape3D>()
    
    keys.forEach(key => {
      const cell = this._grid.get(key)
      if (cell) {
        cell.forEach(shape => results.add(shape))
      }
    })
    
    return Array.from(results)
  }
  
  private getBoundingKeys(bounds: BoundingBox): string[] {
    const keys: string[] = []
    const minKey = this.getGridKey(bounds.min.x, bounds.min.y, bounds.min.z)
    const maxKey = this.getGridKey(bounds.max.x, bounds.max.y, bounds.max.z)
    
    const [minX, minY, minZ] = minKey.split(',').map(Number)
    const [maxX, maxY, maxZ] = maxKey.split(',').map(Number)
    
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          keys.push(`${x},${y},${z}`)
        }
      }
    }
    
    return keys
  }
}
```

#### **3.2 渲染优化技术**

**视锥剔除**:
```typescript
export class CollisionFrustumCuller {
  private _camera: THREE.Camera
  private _frustum: THREE.Frustum = new THREE.Frustum()
  private _matrix: THREE.Matrix4 = new THREE.Matrix4()
  
  constructor(camera: THREE.Camera) {
    this._camera = camera
  }
  
  updateFrustum(): void {
    this._matrix.multiplyMatrices(this._camera.projectionMatrix, this._camera.matrixWorldInverse)
    this._frustum.setFromProjectionMatrix(this._matrix)
  }
  
  cullCollisionShapes(shapes: CollisionShape3D[]): CollisionShape3D[] {
    this.updateFrustum()
    
    return shapes.filter(shape => {
      if (!shape.isDebugEnabled()) return false
      
      const bounds = shape.getBoundingBox()
      const box = new THREE.Box3(
        new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
        new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
      )
      
      return this._frustum.intersectsBox(box)
    })
  }
}
```

### **4. 事件系统集成**

#### **4.1 碰撞事件分发**

**事件管理器**:
```typescript
export class CollisionEventManager {
  private _eventQueue: CollisionEvent[] = []
  private _listeners: Map<string, Set<CollisionEventListener>> = new Map()
  
  interface CollisionEvent {
    type: 'enter' | 'exit' | 'stay'
    shapeA: CollisionShape3D
    shapeB: CollisionShape3D
    contactPoint?: Vector3
    contactNormal?: Vector3
    timestamp: number
  }
  
  interface CollisionEventListener {
    callback: (event: CollisionEvent) => void
    filter?: (event: CollisionEvent) => boolean
  }
  
  addEventListener(eventType: string, listener: CollisionEventListener): void {
    if (!this._listeners.has(eventType)) {
      this._listeners.set(eventType, new Set())
    }
    this._listeners.get(eventType)!.add(listener)
  }
  
  removeEventListener(eventType: string, listener: CollisionEventListener): void {
    const listeners = this._listeners.get(eventType)
    if (listeners) {
      listeners.delete(listener)
    }
  }
  
  dispatchEvent(event: CollisionEvent): void {
    this._eventQueue.push(event)
  }
  
  processEvents(): void {
    while (this._eventQueue.length > 0) {
      const event = this._eventQueue.shift()!
      const listeners = this._listeners.get(event.type)
      
      if (listeners) {
        listeners.forEach(listener => {
          if (!listener.filter || listener.filter(event)) {
            listener.callback(event)
          }
        })
      }
    }
  }
}
```

---

## 🔍 **调试和诊断工具**

### **性能监控**
```typescript
export class CollisionPerformanceMonitor {
  private _metrics: {
    updateTime: number
    renderTime: number
    collisionChecks: number
    visibleShapes: number
  } = { updateTime: 0, renderTime: 0, collisionChecks: 0, visibleShapes: 0 }
  
  startFrame(): void {
    this._metrics = { updateTime: 0, renderTime: 0, collisionChecks: 0, visibleShapes: 0 }
  }
  
  recordUpdateTime(time: number): void {
    this._metrics.updateTime += time
  }
  
  recordRenderTime(time: number): void {
    this._metrics.renderTime += time
  }
  
  incrementCollisionChecks(): void {
    this._metrics.collisionChecks++
  }
  
  setVisibleShapes(count: number): void {
    this._metrics.visibleShapes = count
  }
  
  getMetrics(): typeof this._metrics {
    return { ...this._metrics }
  }
}
```

**技术规范文档完成！** 📋
