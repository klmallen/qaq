# MeshInstance3D API 文档

MeshInstance3D是QAQ游戏引擎中用于渲染3D网格的节点，继承自[Node3D](/api/nodes/node3d)，提供完整的3D模型渲染功能。

## 类定义

```typescript
class MeshInstance3D extends Node3D {
  constructor(name?: string, options?: MeshInstance3DOptions)
  
  // 网格属性
  geometry: THREE.BufferGeometry | null
  materials: THREE.Material[]
  materialOverride: THREE.Material | null
  
  // 阴影属性
  castShadow: boolean
  receiveShadow: boolean
  
  // 模型属性
  modelPath: string
  skeleton: THREE.Skeleton | null
  animations: THREE.AnimationClip[]
  
  // 创建基础几何体
  createBoxMesh(width?: number, height?: number, depth?: number): void
  createSphereMesh(radius?: number, segments?: number): void
  createPlaneMesh(width?: number, height?: number): void
  createCylinderMesh(radiusTop?: number, radiusBottom?: number, height?: number): void
  createConeMesh(radius?: number, height?: number): void
  
  // 模型加载
  loadModel(path: string): Promise<void>
  loadGLTF(path: string): Promise<void>
  loadOBJ(path: string): Promise<void>
  
  // 材质管理
  setMaterial(material: THREE.Material, index?: number): void
  getMaterial(index?: number): THREE.Material | null
  createBasicMaterial(options?: BasicMaterialOptions): THREE.MeshBasicMaterial
  createStandardMaterial(options?: StandardMaterialOptions): THREE.MeshStandardMaterial
  createPhysicalMaterial(options?: PhysicalMaterialOptions): THREE.MeshPhysicalMaterial
  
  // 动画控制
  playAnimation(name: string, loop?: boolean): void
  stopAnimation(): void
  pauseAnimation(): void
  resumeAnimation(): void
  isAnimationPlaying(): boolean
  getCurrentAnimationName(): string
  
  // 工具方法
  getBoundingBox(): THREE.Box3
  getBoundingSphere(): THREE.Sphere
  raycast(ray: THREE.Ray): THREE.Intersection[]
  updateMesh(): void
}
```

## 构造函数

### constructor()

创建一个新的MeshInstance3D实例。

```typescript
constructor(name?: string, options?: MeshInstance3DOptions)
```

**参数**
- `name?: string` - 节点名称，默认为"MeshInstance3D"
- `options?: MeshInstance3DOptions` - 网格配置选项

**MeshInstance3DOptions接口**
```typescript
interface MeshInstance3DOptions {
  geometry?: THREE.BufferGeometry    // 几何体
  material?: THREE.Material         // 材质
  castShadow?: boolean              // 投射阴影，默认true
  receiveShadow?: boolean           // 接收阴影，默认true
  modelPath?: string                // 模型路径
}
```

**示例**
```typescript
// 基础创建
const mesh = new MeshInstance3D('MyMesh')

// 带选项创建
const mesh = new MeshInstance3D('Cube', {
  castShadow: true,
  receiveShadow: true
})
```

## 网格属性

### geometry

网格的几何体。

```typescript
geometry: THREE.BufferGeometry | null
```

**示例**
```typescript
// 设置几何体
const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
mesh.geometry = boxGeometry

// 获取几何体
const currentGeometry = mesh.geometry
```

### materials

网格的材质数组。

```typescript
materials: THREE.Material[]
```

**示例**
```typescript
// 设置材质
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
mesh.materials = [material]

// 获取材质
const currentMaterials = mesh.materials
```

### materialOverride

材质覆盖，用于临时替换所有材质。

```typescript
materialOverride: THREE.Material | null
```

**示例**
```typescript
// 设置材质覆盖
const overrideMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
mesh.materialOverride = overrideMaterial

// 清除材质覆盖
mesh.materialOverride = null
```

## 阴影属性

### castShadow

是否投射阴影。

```typescript
castShadow: boolean
```

**示例**
```typescript
mesh.castShadow = true
```

### receiveShadow

是否接收阴影。

```typescript
receiveShadow: boolean
```

**示例**
```typescript
mesh.receiveShadow = true
```

## 模型属性

### modelPath

加载的模型文件路径。

```typescript
modelPath: string
```

### skeleton

模型的骨骼系统。

```typescript
skeleton: THREE.Skeleton | null
```

### animations

模型的动画剪辑数组。

```typescript
animations: THREE.AnimationClip[]
```

## 基础几何体创建

### createBoxMesh()

创建立方体网格。

```typescript
createBoxMesh(width?: number, height?: number, depth?: number): void
```

**参数**
- `width?: number` - 宽度，默认1
- `height?: number` - 高度，默认1
- `depth?: number` - 深度，默认1

**示例**
```typescript
mesh.createBoxMesh(2, 1, 3) // 创建2x1x3的立方体
```

### createSphereMesh()

创建球体网格。

```typescript
createSphereMesh(radius?: number, segments?: number): void
```

**参数**
- `radius?: number` - 半径，默认1
- `segments?: number` - 分段数，默认32

**示例**
```typescript
mesh.createSphereMesh(1.5, 64) // 创建半径1.5，64分段的球体
```

### createPlaneMesh()

创建平面网格。

```typescript
createPlaneMesh(width?: number, height?: number): void
```

**参数**
- `width?: number` - 宽度，默认1
- `height?: number` - 高度，默认1

**示例**
```typescript
mesh.createPlaneMesh(10, 10) // 创建10x10的平面
```

### createCylinderMesh()

创建圆柱体网格。

```typescript
createCylinderMesh(radiusTop?: number, radiusBottom?: number, height?: number): void
```

**参数**
- `radiusTop?: number` - 顶部半径，默认1
- `radiusBottom?: number` - 底部半径，默认1
- `height?: number` - 高度，默认1

**示例**
```typescript
mesh.createCylinderMesh(1, 1, 2) // 创建圆柱体
mesh.createCylinderMesh(0, 1, 2) // 创建圆锥体
```

### createConeMesh()

创建圆锥体网格。

```typescript
createConeMesh(radius?: number, height?: number): void
```

**参数**
- `radius?: number` - 底面半径，默认1
- `height?: number` - 高度，默认1

**示例**
```typescript
mesh.createConeMesh(1.5, 3) // 创建底面半径1.5，高度3的圆锥
```

## 模型加载方法

### loadModel()

加载3D模型文件。

```typescript
loadModel(path: string): Promise<void>
```

**参数**
- `path: string` - 模型文件路径

**返回值**
- `Promise<void>` - 加载完成的Promise

**示例**
```typescript
await mesh.loadModel('/assets/models/character.glb')
```

### loadGLTF()

加载GLTF/GLB模型。

```typescript
loadGLTF(path: string): Promise<void>
```

**参数**
- `path: string` - GLTF/GLB文件路径

**示例**
```typescript
await mesh.loadGLTF('/assets/models/scene.gltf')
```

### loadOBJ()

加载OBJ模型。

```typescript
loadOBJ(path: string): Promise<void>
```

**参数**
- `path: string` - OBJ文件路径

**示例**
```typescript
await mesh.loadOBJ('/assets/models/object.obj')
```

## 材质管理方法

### setMaterial()

设置材质。

```typescript
setMaterial(material: THREE.Material, index?: number): void
```

**参数**
- `material: THREE.Material` - 材质对象
- `index?: number` - 材质索引，默认0

**示例**
```typescript
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
mesh.setMaterial(material, 0)
```

### getMaterial()

获取材质。

```typescript
getMaterial(index?: number): THREE.Material | null
```

**参数**
- `index?: number` - 材质索引，默认0

**返回值**
- `THREE.Material | null` - 材质对象或null

### createBasicMaterial()

创建基础材质。

```typescript
createBasicMaterial(options?: BasicMaterialOptions): THREE.MeshBasicMaterial
```

**BasicMaterialOptions接口**
```typescript
interface BasicMaterialOptions {
  color?: number | string
  map?: THREE.Texture
  transparent?: boolean
  opacity?: number
  wireframe?: boolean
}
```

**示例**
```typescript
const material = mesh.createBasicMaterial({
  color: 0xff0000,
  transparent: true,
  opacity: 0.8
})
```

### createStandardMaterial()

创建标准材质。

```typescript
createStandardMaterial(options?: StandardMaterialOptions): THREE.MeshStandardMaterial
```

**StandardMaterialOptions接口**
```typescript
interface StandardMaterialOptions {
  color?: number | string
  map?: THREE.Texture
  normalMap?: THREE.Texture
  roughnessMap?: THREE.Texture
  metalnessMap?: THREE.Texture
  roughness?: number
  metalness?: number
  transparent?: boolean
  opacity?: number
}
```

**示例**
```typescript
const material = mesh.createStandardMaterial({
  color: 0x888888,
  roughness: 0.5,
  metalness: 0.8
})
```

### createPhysicalMaterial()

创建物理材质。

```typescript
createPhysicalMaterial(options?: PhysicalMaterialOptions): THREE.MeshPhysicalMaterial
```

**PhysicalMaterialOptions接口**
```typescript
interface PhysicalMaterialOptions extends StandardMaterialOptions {
  clearcoat?: number
  clearcoatRoughness?: number
  transmission?: number
  thickness?: number
  ior?: number
}
```

## 动画控制方法

### playAnimation()

播放动画。

```typescript
playAnimation(name: string, loop?: boolean): void
```

**参数**
- `name: string` - 动画名称
- `loop?: boolean` - 是否循环播放，默认true

**示例**
```typescript
mesh.playAnimation('walk', true)
```

### stopAnimation()

停止动画。

```typescript
stopAnimation(): void
```

### pauseAnimation()

暂停动画。

```typescript
pauseAnimation(): void
```

### resumeAnimation()

恢复动画。

```typescript
resumeAnimation(): void
```

### isAnimationPlaying()

检查动画是否正在播放。

```typescript
isAnimationPlaying(): boolean
```

**返回值**
- `boolean` - 是否正在播放动画

### getCurrentAnimationName()

获取当前播放的动画名称。

```typescript
getCurrentAnimationName(): string
```

**返回值**
- `string` - 当前动画名称

## 工具方法

### getBoundingBox()

获取包围盒。

```typescript
getBoundingBox(): THREE.Box3
```

**返回值**
- `THREE.Box3` - 包围盒

**示例**
```typescript
const boundingBox = mesh.getBoundingBox()
console.log('包围盒:', boundingBox)
```

### getBoundingSphere()

获取包围球。

```typescript
getBoundingSphere(): THREE.Sphere
```

**返回值**
- `THREE.Sphere` - 包围球

### raycast()

射线检测。

```typescript
raycast(ray: THREE.Ray): THREE.Intersection[]
```

**参数**
- `ray: THREE.Ray` - 射线

**返回值**
- `THREE.Intersection[]` - 交点数组

**示例**
```typescript
const ray = new THREE.Ray(origin, direction)
const intersections = mesh.raycast(ray)
```

### updateMesh()

更新网格。

```typescript
updateMesh(): void
```

## 事件

MeshInstance3D继承自Node3D，支持所有Node3D事件，并添加了网格特定事件：

```typescript
// 模型加载完成
mesh.on('model_loaded', (model) => {
  console.log('模型加载完成:', model)
})

// 几何体变化
mesh.on('geometry_changed', (geometry) => {
  console.log('几何体变化:', geometry)
})

// 材质变化
mesh.on('material_changed', (materials) => {
  console.log('材质变化:', materials)
})

// 动画开始
mesh.on('animation_started', (animationName) => {
  console.log('动画开始:', animationName)
})

// 动画结束
mesh.on('animation_finished', (animationName) => {
  console.log('动画结束:', animationName)
})

// 阴影设置变化
mesh.on('shadow_changed', (shadowSettings) => {
  console.log('阴影设置变化:', shadowSettings)
})
```

## 完整示例

```typescript
import { MeshInstance3D, Engine, Scene, Node3D } from 'qaq-game-engine'

async function create3DMeshDemo() {
  // 初始化引擎
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600,
    enableShadows: true
  })
  
  // 创建场景
  const scene = new Scene('MeshDemo')
  const root = new Node3D('Root')
  scene.addChild(root)
  
  // 创建立方体
  const cube = new MeshInstance3D('Cube', {
    castShadow: true,
    receiveShadow: true
  })
  cube.createBoxMesh(2, 2, 2)
  cube.position = { x: -3, y: 1, z: 0 }
  
  // 创建标准材质
  const cubeMaterial = cube.createStandardMaterial({
    color: 0xff4444,
    roughness: 0.3,
    metalness: 0.7
  })
  cube.setMaterial(cubeMaterial)
  
  root.addChild(cube)
  
  // 创建球体
  const sphere = new MeshInstance3D('Sphere')
  sphere.createSphereMesh(1.5, 64)
  sphere.position = { x: 0, y: 1.5, z: 0 }
  
  // 创建物理材质
  const sphereMaterial = sphere.createPhysicalMaterial({
    color: 0x4444ff,
    roughness: 0.1,
    metalness: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  })
  sphere.setMaterial(sphereMaterial)
  
  root.addChild(sphere)
  
  // 创建地面
  const ground = new MeshInstance3D('Ground')
  ground.createPlaneMesh(20, 20)
  ground.position = { x: 0, y: 0, z: 0 }
  ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 } // 水平放置
  
  const groundMaterial = ground.createStandardMaterial({
    color: 0x888888,
    roughness: 0.8,
    metalness: 0.2
  })
  ground.setMaterial(groundMaterial)
  ground.receiveShadow = true
  
  root.addChild(ground)
  
  // 加载3D模型
  const character = new MeshInstance3D('Character')
  character.position = { x: 3, y: 0, z: 0 }
  
  try {
    await character.loadGLTF('/assets/models/character.glb')
    console.log('角色模型加载完成')
    
    // 播放动画
    if (character.animations.length > 0) {
      character.playAnimation('idle', true)
    }
  } catch (error) {
    console.error('模型加载失败:', error)
  }
  
  root.addChild(character)
  
  // 监听事件
  cube.on('model_loaded', () => {
    console.log('立方体准备完成')
  })
  
  sphere.on('material_changed', (materials) => {
    console.log('球体材质已更改')
  })
  
  character.on('animation_started', (name) => {
    console.log('角色动画开始:', name)
  })
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 启动渲染
  engine.switchTo3D()
  engine.startRendering()
  
  // 动画演示
  let time = 0
  const animate = () => {
    time += 0.016
    
    // 旋转立方体
    cube.rotation = { x: time, y: time * 0.7, z: time * 0.3 }
    
    // 上下移动球体
    sphere.position = { 
      x: 0, 
      y: 1.5 + Math.sin(time * 2) * 0.5, 
      z: 0 
    }
    
    requestAnimationFrame(animate)
  }
  animate()
  
  console.log('3D网格演示创建完成')
}

// 启动演示
create3DMeshDemo().catch(console.error)
```

## 最佳实践

1. **几何体管理**：合理使用几何体缓存，避免重复创建
2. **材质优化**：使用材质实例化减少内存占用
3. **阴影设置**：根据需要合理设置阴影，避免性能问题
4. **模型加载**：使用异步加载，提供加载进度反馈
5. **动画控制**：合理管理动画播放，避免内存泄漏
6. **包围盒计算**：使用包围盒进行碰撞检测和视锥剔除

---

MeshInstance3D是QAQ引擎中3D渲染的核心节点，掌握其用法对于创建丰富的3D场景至关重要。
