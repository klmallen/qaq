# DirectionalLight3D API 文档

## 概述

`DirectionalLight3D` 是QAQ游戏引擎中的方向光节点，用于模拟太阳光等平行光源。它继承自 `Light3D` 基类，提供了完整的方向光功能，包括阴影投射、方向控制和调试可视化。

## 特性

- ✅ **平行光照效果** - 模拟无限远处的光源
- ✅ **正交阴影映射** - 支持高质量阴影投射
- ✅ **方向控制** - 精确控制光照方向
- ✅ **阴影相机配置** - 灵活的阴影范围设置
- ✅ **Three.js集成** - 与Three.js DirectionalLight完美集成
- ✅ **调试可视化** - 内置调试辅助工具
- ✅ **性能优化** - 高效的光照计算

## 构造函数

```typescript
constructor(name: string = 'DirectionalLight3D', config: DirectionalLightConfig = {})
```

### 参数

- `name` - 节点名称
- `config` - 方向光配置对象

### 配置选项 (DirectionalLightConfig)

```typescript
interface DirectionalLightConfig extends LightConfig {
  shadowCameraLeft?: number      // 阴影相机左边界 (默认: -10)
  shadowCameraRight?: number     // 阴影相机右边界 (默认: 10)
  shadowCameraTop?: number       // 阴影相机顶部边界 (默认: 10)
  shadowCameraBottom?: number    // 阴影相机底部边界 (默认: -10)
  target?: Vector3               // 目标位置 (默认: {x:0, y:0, z:0})
}
```

## 基本属性

### 继承自Light3D的属性

- `color: number` - 光照颜色 (十六进制)
- `intensity: number` - 光照强度
- `enabled: boolean` - 是否启用
- `castShadow: boolean` - 是否投射阴影
- `shadowType: ShadowType` - 阴影类型
- `debugVisible: boolean` - 是否显示调试辅助

### DirectionalLight3D特有属性

- `shadowCameraLeft: number` - 阴影相机左边界
- `shadowCameraRight: number` - 阴影相机右边界
- `shadowCameraTop: number` - 阴影相机顶部边界
- `shadowCameraBottom: number` - 阴影相机底部边界
- `target: Vector3` - 光照目标位置
- `directionalLight: THREE.DirectionalLight | null` - Three.js方向光对象

## 核心方法

### 阴影相机配置

```typescript
// 设置阴影相机范围
setShadowCameraBox(left: number, right: number, top: number, bottom: number): void

// 设置正方形阴影相机
setShadowCameraSize(size: number): void
```

### 方向控制

```typescript
// 设置光照方向（通过目标点）
setDirection(target: Vector3): void

// 设置光照方向（通过方向向量）
setDirectionVector(direction: Vector3): void

// 获取光照方向向量
getDirectionVector(): Vector3
```

### 信息获取

```typescript
// 获取方向光统计信息
getDirectionalStats(): {
  shadowCameraLeft: number
  shadowCameraRight: number
  shadowCameraTop: number
  shadowCameraBottom: number
  target: Vector3
  direction: Vector3
}

// 克隆方向光节点
clone(name?: string): DirectionalLight3D
```

## 使用示例

### 基本用法

```typescript
import { DirectionalLight3D } from './core/nodes/lights/DirectionalLight3D'

// 创建基本方向光
const sunLight = new DirectionalLight3D('SunLight')
sunLight.color = 0xffffff
sunLight.intensity = 1.0
sunLight.position = { x: 10, y: 10, z: 10 }
sunLight.target = { x: 0, y: 0, z: 0 }

// 添加到场景
scene.addChild(sunLight)
```

### 带阴影的方向光

```typescript
const shadowLight = new DirectionalLight3D('ShadowLight', {
  color: 0xfff8dc,
  intensity: 1.2,
  castShadow: true,
  shadowType: ShadowType.PCF,
  shadowMapSize: 2048,
  shadowCameraLeft: -20,
  shadowCameraRight: 20,
  shadowCameraTop: 20,
  shadowCameraBottom: -20
})

shadowLight.position = { x: 20, y: 30, z: 20 }
```

### 动态光照控制

```typescript
const dynamicLight = new DirectionalLight3D('DynamicLight')

// 设置阴影相机为正方形
dynamicLight.setShadowCameraSize(30)

// 通过方向向量控制光照
dynamicLight.setDirectionVector({ x: 1, y: -1, z: 0 })

// 获取当前方向
const direction = dynamicLight.getDirectionVector()
console.log('光照方向:', direction)
```

### 调试模式

```typescript
const debugLight = new DirectionalLight3D('DebugLight', {
  debugVisible: true,  // 显示调试辅助
  castShadow: true
})

// 获取详细统计信息
const stats = debugLight.getDirectionalStats()
console.log('光照统计:', stats)
```

## 最佳实践

### 1. 阴影优化

```typescript
// 根据场景大小调整阴影相机范围
const sceneSize = 50
sunLight.setShadowCameraBox(-sceneSize/2, sceneSize/2, sceneSize/2, -sceneSize/2)

// 使用合适的阴影映射分辨率
sunLight.setShadowMapSize(2048) // 高质量
// sunLight.setShadowMapSize(1024) // 标准质量
// sunLight.setShadowMapSize(512)  // 低质量
```

### 2. 性能考虑

```typescript
// 只在需要时启用阴影
sunLight.castShadow = isHighQuality

// 合理设置阴影相机范围，避免过大
sunLight.setShadowCameraSize(Math.min(sceneSize, 100))

// 在不需要时禁用调试显示
sunLight.debugVisible = false
```

### 3. 光照组合

```typescript
// 主光源 - 太阳光
const mainLight = new DirectionalLight3D('MainLight', {
  color: 0xfff8dc,
  intensity: 1.0,
  castShadow: true
})

// 补光 - 天空光
const fillLight = new DirectionalLight3D('FillLight', {
  color: 0x87ceeb,
  intensity: 0.3,
  castShadow: false
})
```

## 生命周期

1. **创建** - `new DirectionalLight3D()`
2. **配置** - 设置属性和参数
3. **初始化** - `_ready()` 自动调用，创建Three.js对象
4. **更新** - 属性变化时自动同步到Three.js
5. **销毁** - `destroy()` 清理资源

## 注意事项

- 方向光的位置不影响光照效果，只影响阴影投射
- 阴影相机范围应该覆盖所有需要接收阴影的对象
- 过大的阴影相机范围会降低阴影质量
- 调试模式会影响性能，发布时应禁用

## 相关类型

```typescript
interface Vector3 {
  x: number
  y: number
  z: number
}

enum ShadowType {
  NONE = 'none',
  BASIC = 'basic',
  PCF = 'pcf',
  PCF_SOFT = 'pcf_soft',
  VSM = 'vsm'
}
```

## 测试

项目包含完整的测试套件：

- `__tests__/DirectionalLight3D.test.ts` - 单元测试
- `examples/lights/directional-light-example.ts` - 使用示例
- `test-directional-light.html` - 交互式测试页面
- `test-directional-light-integration.js` - 集成测试

运行测试：
```bash
# 运行集成测试
node test-directional-light-integration.js

# 打开交互式测试页面
open test-directional-light.html
```
