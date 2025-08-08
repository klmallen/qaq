# GPUParticles3D 增强功能指南

## 🎯 概述

本文档介绍了GPUParticles3D系统的三个关键增强功能：

1. **高级粒子大小控制** - 动态大小调整、生命周期变化、距离缩放
2. **高级粒子运动模式** - 爆炸、内爆、龙卷风、轨道、波浪、群体、力场
3. **粒子形状/网格支持** - 基础形状、自定义网格、模型加载、实例化渲染

## 🔧 功能详解

### 1. 高级粒子大小控制

#### 基础API
```typescript
// 设置大小控制
particles.setSizeControl({
  sizeOverLifetime: true,    // 启用生命周期大小变化
  startSize: 0.2,           // 初始大小
  endSize: 0.05,            // 结束大小
  sizeRandomness: 0.3,      // 大小随机性 (0-1)
  sizeDistanceScaling: true, // 启用距离缩放
  maxViewDistance: 100      // 最大可见距离
})
```

#### 特性说明
- **生命周期大小变化**: 粒子从startSize平滑过渡到endSize
- **随机性**: 每个粒子的大小会有随机变化
- **距离缩放**: 根据与相机的距离自动调整粒子大小
- **性能优化**: 超出最大距离的粒子会被剔除

### 2. 高级粒子运动模式

#### 运动模式枚举
```typescript
enum ParticleMovementMode {
  GRAVITY = 'gravity',           // 标准重力
  EXPLOSION = 'explosion',       // 爆炸扩散
  IMPLOSION = 'implosion',      // 向心聚合
  TORNADO = 'tornado',          // 龙卷风螺旋
  ORBITAL = 'orbital',          // 轨道运动
  WAVE = 'wave',               // 波浪运动
  FLOCKING = 'flocking',       // 群体行为
  FORCE_FIELD = 'force_field'  // 力场系统
}
```

#### 使用示例

**爆炸效果**
```typescript
particles.setMovementMode(ParticleMovementMode.EXPLOSION, {
  attractionPoint: new THREE.Vector3(0, 0, 0),
  attractionStrength: 5.0
})
```

**龙卷风效果**
```typescript
particles.setMovementMode(ParticleMovementMode.TORNADO, {
  attractionPoint: new THREE.Vector3(0, 0, 0),
  tornadoAxis: new THREE.Vector3(0, 1, 0),
  attractionStrength: 3.0
})
```

**轨道运动**
```typescript
particles.setMovementMode(ParticleMovementMode.ORBITAL, {
  attractionPoint: new THREE.Vector3(0, 0, 0),
  orbitalRadius: 2.0,
  orbitalSpeed: 1.0
})
```

**波浪运动**
```typescript
particles.setMovementMode(ParticleMovementMode.WAVE, {
  waveAmplitude: 1.0,
  waveFrequency: 1.0
})
```

#### 快速效果方法
```typescript
// 创建爆炸效果
particles.createExplosion(center, strength)

// 创建龙卷风效果
particles.createTornado(center, radius, strength)

// 创建轨道效果
particles.createOrbital(center, radius, speed)
```

### 3. 粒子形状/网格支持

#### 形状类型枚举
```typescript
enum ParticleShapeType {
  POINT = 'point',
  CIRCLE = 'circle',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  STAR = 'star',
  DIAMOND = 'diamond',
  CUSTOM_MESH = 'custom_mesh',
  LOADED_MODEL = 'loaded_model'
}
```

#### 基础形状使用
```typescript
// 设置基础形状
particles.setParticleShape(ParticleShapeType.STAR)
particles.setParticleShape(ParticleShapeType.DIAMOND)
particles.setParticleShape(ParticleShapeType.TRIANGLE)
```

#### 自定义网格
```typescript
// 创建自定义几何体
const customGeometry = new THREE.SphereGeometry(0.1, 8, 6)
particles.setCustomMesh(customGeometry)
```

#### 模型加载
```typescript
// 加载外部模型作为粒子形状
await particles.loadParticleModel('/models/particle.glb')
```

#### 纹理支持
```typescript
// 设置粒子纹理
const texture = new THREE.TextureLoader().load('/textures/particle.png')
particles.setParticleTexture(texture)
```

## 🎮 Demo界面功能

### 高级大小控制面板
- **生命周期大小变化**: 复选框启用/禁用
- **起始大小**: 滑块控制 (0.01-0.5)
- **结束大小**: 滑块控制 (0.01-0.5)
- **大小随机性**: 滑块控制 (0-1)

### 运动模式面板
- **运动模式**: 下拉选择8种模式
- **效果强度**: 滑块控制力的强度
- **波浪振幅**: 波浪模式专用
- **波浪频率**: 波浪模式专用

### 粒子形状面板
- **形状类型**: 下拉选择6种基础形状
- **实例化渲染**: 复选框启用高性能渲染

### 快速效果按钮
- **💥 爆炸**: 创建爆炸效果
- **🌪️ 龙卷风**: 创建龙卷风效果
- **🪐 轨道**: 创建轨道运动
- **🎆 烟花**: 创建烟花效果
- **✨ 魔法**: 创建魔法轨道效果

## 🚀 性能优化

### 实例化渲染
- 对于复杂形状，使用`THREE.InstancedMesh`进行高效渲染
- 支持数千个复杂粒子的实时渲染
- 自动批处理和GPU优化

### 距离剔除
- 超出`maxViewDistance`的粒子自动隐藏
- 减少不必要的渲染开销
- 动态LOD系统

### 内存管理
- 粒子对象池复用
- 几何体和材质缓存
- 自动资源清理

## 🎯 最佳实践

### 1. 选择合适的运动模式
- **爆炸/烟花**: 使用EXPLOSION模式
- **魔法效果**: 使用ORBITAL或TORNADO模式
- **环境粒子**: 使用WAVE或GRAVITY模式
- **群体效果**: 使用FLOCKING模式

### 2. 优化粒子数量
- 复杂形状: 建议50-200个粒子
- 简单点粒子: 可支持1000+个粒子
- 根据设备性能动态调整

### 3. 合理使用形状
- 远距离效果: 使用POINT或CIRCLE
- 近距离特效: 使用复杂形状或模型
- 移动设备: 优先使用基础形状

## 🔮 未来扩展

### 计划中的功能
1. **GPU计算着色器**: 完全GPU驱动的粒子系统
2. **物理碰撞**: 与场景几何体的碰撞检测
3. **粒子间交互**: 粒子之间的相互作用力
4. **高级材质**: PBR材质和光照交互
5. **VFX图编辑器**: 可视化粒子效果编辑器

### 扩展接口
```typescript
// 未来API预览
particles.enablePhysics(true)
particles.addCollisionMesh(sceneMesh)
particles.setInterParticleForces(['attraction', 'repulsion'])
particles.loadVFXGraph('/effects/magic.vfx')
```

这个增强的GPUParticles3D系统为创建复杂、美观的粒子效果提供了强大的工具集，同时保持了良好的性能和易用性。
