# Light3D API 文档

Light3D是QAQ游戏引擎中3D光源的基类，继承自[Node3D](/api/nodes/node3d)，提供完整的3D光照功能。

## 类定义

```typescript
class Light3D extends Node3D {
  constructor(name?: string)
  
  // 光源属性
  lightType: LightType
  color: Color
  intensity: number
  enabled: boolean
  
  // 阴影属性
  shadowEnabled: boolean
  shadowMapSize: number
  shadowBias: number
  shadowNormalBias: number
  shadowRadius: number
  shadowBlurSamples: number
  
  // 光源控制
  setColor(color: Color): void
  setIntensity(intensity: number): void
  enable(): void
  disable(): void
  
  // 阴影控制
  enableShadows(): void
  disableShadows(): void
  setShadowMapSize(size: number): void
  setShadowBias(bias: number): void
  
  // Three.js光源访问
  getThreeLight(): THREE.Light
  
  // 工具方法
  getLightDirection(): Vector3
  getIlluminationAt(position: Vector3): number
}

// 方向光
class DirectionalLight3D extends Light3D {
  constructor(name?: string)
  
  // 方向光特有属性
  target: Vector3
  shadowCameraSize: number
  shadowCameraNear: number
  shadowCameraFar: number
  
  // 方向光方法
  setTarget(target: Vector3): void
  setShadowCamera(size: number, near: number, far: number): void
}

// 点光源
class PointLight3D extends Light3D {
  constructor(name?: string)
  
  // 点光源特有属性
  range: number
  decay: number
  shadowCameraNear: number
  shadowCameraFar: number
  
  // 点光源方法
  setRange(range: number): void
  setDecay(decay: number): void
  setShadowCamera(near: number, far: number): void
}

// 聚光灯
class SpotLight3D extends Light3D {
  constructor(name?: string)
  
  // 聚光灯特有属性
  range: number
  decay: number
  angle: number
  penumbra: number
  target: Vector3
  shadowCameraNear: number
  shadowCameraFar: number
  
  // 聚光灯方法
  setRange(range: number): void
  setDecay(decay: number): void
  setAngle(angle: number): void
  setPenumbra(penumbra: number): void
  setTarget(target: Vector3): void
  setShadowCamera(near: number, far: number): void
}
```

## 基类 Light3D

### 构造函数

```typescript
constructor(name?: string)
```

**参数**
- `name?: string` - 光源名称，默认为"Light3D"

### 光源属性

#### lightType

光源类型。

```typescript
lightType: LightType
```

**LightType枚举**
```typescript
enum LightType {
  DIRECTIONAL = 'DIRECTIONAL',
  POINT = 'POINT',
  SPOT = 'SPOT',
  AMBIENT = 'AMBIENT'
}
```

#### color

光源颜色。

```typescript
color: Color
```

**示例**
```typescript
light.color = { r: 1, g: 0.8, b: 0.6, a: 1 } // 暖白光
```

#### intensity

光源强度。

```typescript
intensity: number
```

**示例**
```typescript
light.intensity = 1.5 // 增强光照强度
```

#### enabled

光源是否启用。

```typescript
enabled: boolean
```

### 阴影属性

#### shadowEnabled

是否启用阴影。

```typescript
shadowEnabled: boolean
```

#### shadowMapSize

阴影贴图尺寸。

```typescript
shadowMapSize: number
```

**示例**
```typescript
light.shadowMapSize = 2048 // 高质量阴影
```

#### shadowBias

阴影偏移。

```typescript
shadowBias: number
```

#### shadowNormalBias

法线阴影偏移。

```typescript
shadowNormalBias: number
```

#### shadowRadius

阴影半径。

```typescript
shadowRadius: number
```

#### shadowBlurSamples

阴影模糊采样数。

```typescript
shadowBlurSamples: number
```

### 光源控制方法

#### setColor()

设置光源颜色。

```typescript
setColor(color: Color): void
```

**参数**
- `color: Color` - 光源颜色

#### setIntensity()

设置光源强度。

```typescript
setIntensity(intensity: number): void
```

**参数**
- `intensity: number` - 光源强度

#### enable()

启用光源。

```typescript
enable(): void
```

#### disable()

禁用光源。

```typescript
disable(): void
```

### 阴影控制方法

#### enableShadows()

启用阴影。

```typescript
enableShadows(): void
```

#### disableShadows()

禁用阴影。

```typescript
disableShadows(): void
```

#### setShadowMapSize()

设置阴影贴图尺寸。

```typescript
setShadowMapSize(size: number): void
```

**参数**
- `size: number` - 阴影贴图尺寸（通常为2的幂次方）

#### setShadowBias()

设置阴影偏移。

```typescript
setShadowBias(bias: number): void
```

**参数**
- `bias: number` - 阴影偏移值

### 工具方法

#### getThreeLight()

获取Three.js光源对象。

```typescript
getThreeLight(): THREE.Light
```

**返回值**
- `THREE.Light` - Three.js光源对象

#### getLightDirection()

获取光源方向。

```typescript
getLightDirection(): Vector3
```

**返回值**
- `Vector3` - 光源方向向量

#### getIlluminationAt()

获取指定位置的光照强度。

```typescript
getIlluminationAt(position: Vector3): number
```

**参数**
- `position: Vector3` - 世界坐标位置

**返回值**
- `number` - 光照强度

## DirectionalLight3D 方向光

方向光模拟远距离光源（如太阳光），光线平行且没有衰减。

### 构造函数

```typescript
constructor(name?: string)
```

**示例**
```typescript
const sunLight = new DirectionalLight3D('SunLight')
```

### 方向光属性

#### target

光照目标点。

```typescript
target: Vector3
```

**示例**
```typescript
sunLight.target = { x: 0, y: 0, z: 0 } // 照向原点
```

#### shadowCameraSize

阴影相机尺寸。

```typescript
shadowCameraSize: number
```

#### shadowCameraNear

阴影相机近裁剪面。

```typescript
shadowCameraNear: number
```

#### shadowCameraFar

阴影相机远裁剪面。

```typescript
shadowCameraFar: number
```

### 方向光方法

#### setTarget()

设置光照目标。

```typescript
setTarget(target: Vector3): void
```

**参数**
- `target: Vector3` - 目标位置

#### setShadowCamera()

设置阴影相机参数。

```typescript
setShadowCamera(size: number, near: number, far: number): void
```

**参数**
- `size: number` - 相机尺寸
- `near: number` - 近裁剪面
- `far: number` - 远裁剪面

## PointLight3D 点光源

点光源从一个点向所有方向发光，有距离衰减。

### 构造函数

```typescript
constructor(name?: string)
```

**示例**
```typescript
const bulb = new PointLight3D('Bulb')
```

### 点光源属性

#### range

光源照射范围。

```typescript
range: number
```

**示例**
```typescript
bulb.range = 10 // 照射范围10个单位
```

#### decay

光源衰减系数。

```typescript
decay: number
```

**示例**
```typescript
bulb.decay = 2 // 物理正确的衰减
```

### 点光源方法

#### setRange()

设置照射范围。

```typescript
setRange(range: number): void
```

#### setDecay()

设置衰减系数。

```typescript
setDecay(decay: number): void
```

## SpotLight3D 聚光灯

聚光灯从一个点向锥形区域发光。

### 构造函数

```typescript
constructor(name?: string)
```

**示例**
```typescript
const spotlight = new SpotLight3D('Spotlight')
```

### 聚光灯属性

#### angle

聚光灯锥角（弧度）。

```typescript
angle: number
```

**示例**
```typescript
spotlight.angle = Math.PI / 6 // 30度锥角
```

#### penumbra

聚光灯边缘软化。

```typescript
penumbra: number
```

**示例**
```typescript
spotlight.penumbra = 0.1 // 10%的边缘软化
```

### 聚光灯方法

#### setAngle()

设置锥角。

```typescript
setAngle(angle: number): void
```

#### setPenumbra()

设置边缘软化。

```typescript
setPenumbra(penumbra: number): void
```

## 事件

Light3D支持光源特定事件：

```typescript
// 光源参数变化
light.on('light_params_changed', (params) => {
  console.log('光源参数变化:', params)
})

// 阴影设置变化
light.on('shadow_settings_changed', (settings) => {
  console.log('阴影设置变化:', settings)
})

// 光源启用/禁用
light.on('enabled_changed', (enabled) => {
  console.log('光源状态:', enabled ? '启用' : '禁用')
})
```

## 完整示例

```typescript
import { 
  DirectionalLight3D, 
  PointLight3D, 
  SpotLight3D,
  MeshInstance3D,
  Engine, 
  Scene, 
  Node3D 
} from 'qaq-game-engine'

async function createLightingDemo() {
  // 初始化引擎（启用阴影）
  const engine = Engine.getInstance()
  await engine.initialize({
    container: document.getElementById('game-canvas'),
    width: 800,
    height: 600,
    enableShadows: true,
    shadowMapSize: 2048
  })
  
  // 创建场景
  const scene = new Scene('LightingDemo')
  const root = new Node3D('Root')
  scene.addChild(root)
  
  // 创建方向光（太阳光）
  const sunLight = new DirectionalLight3D('SunLight')
  sunLight.position = { x: 10, y: 10, z: 5 }
  sunLight.setTarget({ x: 0, y: 0, z: 0 })
  sunLight.setColor({ r: 1, g: 0.95, b: 0.8, a: 1 })
  sunLight.setIntensity(1.0)
  sunLight.enableShadows()
  sunLight.setShadowCamera(20, 0.1, 50)
  root.addChild(sunLight)
  
  // 创建点光源（灯泡）
  const bulb = new PointLight3D('Bulb')
  bulb.position = { x: -5, y: 3, z: 2 }
  bulb.setColor({ r: 1, g: 0.6, b: 0.2, a: 1 }) // 暖黄光
  bulb.setIntensity(2.0)
  bulb.setRange(8)
  bulb.setDecay(2)
  bulb.enableShadows()
  root.addChild(bulb)
  
  // 创建聚光灯
  const spotlight = new SpotLight3D('Spotlight')
  spotlight.position = { x: 5, y: 8, z: 5 }
  spotlight.setTarget({ x: 2, y: 0, z: 2 })
  spotlight.setColor({ r: 0.2, g: 0.8, b: 1, a: 1 }) // 冷蓝光
  spotlight.setIntensity(3.0)
  spotlight.setRange(15)
  spotlight.setAngle(Math.PI / 4) // 45度锥角
  spotlight.setPenumbra(0.2)
  spotlight.enableShadows()
  root.addChild(spotlight)
  
  // 创建场景对象
  const ground = new MeshInstance3D('Ground')
  ground.createPlaneMesh(20, 20)
  ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
  ground.receiveShadow = true
  
  const groundMaterial = ground.createStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.1
  })
  ground.setMaterial(groundMaterial)
  root.addChild(ground)
  
  // 创建一些物体来展示光照效果
  const objects = []
  
  // 立方体
  const cube = new MeshInstance3D('Cube')
  cube.createBoxMesh(2, 2, 2)
  cube.position = { x: 0, y: 1, z: 0 }
  cube.castShadow = true
  cube.receiveShadow = true
  
  const cubeMaterial = cube.createStandardMaterial({
    color: 0xff4444,
    roughness: 0.3,
    metalness: 0.7
  })
  cube.setMaterial(cubeMaterial)
  root.addChild(cube)
  objects.push(cube)
  
  // 球体
  const sphere = new MeshInstance3D('Sphere')
  sphere.createSphereMesh(1.2, 32)
  sphere.position = { x: -3, y: 1.2, z: -2 }
  sphere.castShadow = true
  sphere.receiveShadow = true
  
  const sphereMaterial = sphere.createStandardMaterial({
    color: 0x44ff44,
    roughness: 0.1,
    metalness: 0.9
  })
  sphere.setMaterial(sphereMaterial)
  root.addChild(sphere)
  objects.push(sphere)
  
  // 圆柱体
  const cylinder = new MeshInstance3D('Cylinder')
  cylinder.createCylinderMesh(0.8, 0.8, 3)
  cylinder.position = { x: 3, y: 1.5, z: -1 }
  cylinder.castShadow = true
  cylinder.receiveShadow = true
  
  const cylinderMaterial = cylinder.createStandardMaterial({
    color: 0x4444ff,
    roughness: 0.5,
    metalness: 0.5
  })
  cylinder.setMaterial(cylinderMaterial)
  root.addChild(cylinder)
  objects.push(cylinder)
  
  // 光源控制
  let time = 0
  const animate = () => {
    time += 0.016
    
    // 旋转点光源
    bulb.position = {
      x: Math.cos(time) * 6,
      y: 3 + Math.sin(time * 2) * 1,
      z: Math.sin(time) * 6
    }
    
    // 聚光灯跟踪立方体
    spotlight.setTarget(cube.position)
    
    // 改变聚光灯颜色
    const hue = (time * 50) % 360
    const color = hslToRgb(hue / 360, 0.8, 0.6)
    spotlight.setColor({ r: color.r, g: color.g, b: color.b, a: 1 })
    
    requestAnimationFrame(animate)
  }
  animate()
  
  // HSL转RGB辅助函数
  function hslToRgb(h: number, s: number, l: number) {
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h * 6) % 2 - 1))
    const m = l - c / 2
    
    let r = 0, g = 0, b = 0
    
    if (h < 1/6) {
      r = c; g = x; b = 0
    } else if (h < 2/6) {
      r = x; g = c; b = 0
    } else if (h < 3/6) {
      r = 0; g = c; b = x
    } else if (h < 4/6) {
      r = 0; g = x; b = c
    } else if (h < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    return {
      r: r + m,
      g: g + m,
      b: b + m
    }
  }
  
  // 键盘控制
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case '1':
        sunLight.enabled = !sunLight.enabled
        console.log('太阳光:', sunLight.enabled ? '开启' : '关闭')
        break
      case '2':
        bulb.enabled = !bulb.enabled
        console.log('点光源:', bulb.enabled ? '开启' : '关闭')
        break
      case '3':
        spotlight.enabled = !spotlight.enabled
        console.log('聚光灯:', spotlight.enabled ? '开启' : '关闭')
        break
      case 's':
      case 'S':
        const shadowsEnabled = !sunLight.shadowEnabled
        sunLight.shadowEnabled = shadowsEnabled
        bulb.shadowEnabled = shadowsEnabled
        spotlight.shadowEnabled = shadowsEnabled
        console.log('阴影:', shadowsEnabled ? '开启' : '关闭')
        break
    }
  })
  
  // 监听光源事件
  sunLight.on('enabled_changed', (enabled) => {
    console.log('太阳光状态变化:', enabled)
  })
  
  bulb.on('light_params_changed', (params) => {
    console.log('点光源参数变化:', params)
  })
  
  // 设置场景
  await engine.setMainScene(scene)
  scene._enterTree()
  
  // 启动渲染
  engine.switchTo3D()
  engine.startRendering()
  
  console.log('光照演示创建完成')
  console.log('按键控制: 1-太阳光, 2-点光源, 3-聚光灯, S-阴影开关')
}

// 启动演示
createLightingDemo().catch(console.error)
```

## 最佳实践

1. **光源数量**：合理控制场景中的光源数量，避免性能问题
2. **阴影质量**：根据需要调整阴影贴图尺寸和质量
3. **光源类型**：选择合适的光源类型模拟真实光照
4. **颜色温度**：使用合适的颜色温度营造氛围
5. **光照强度**：合理设置光照强度，避免过曝或过暗
6. **阴影偏移**：调整阴影偏移解决阴影瑕疵问题

---

Light3D及其子类是QAQ引擎中3D光照系统的核心，掌握其用法对于创建逼真的3D场景至关重要。
