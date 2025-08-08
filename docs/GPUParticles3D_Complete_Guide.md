# 🎨 QAQ Engine - GPUParticles3D完整指南

## 📋 **概述**

我们成功创建了一个完整的、统一的粒子节点系统，参考Godot的GPUParticles3D设计理念，完全封装Three.js实现细节，提供简洁易用的API接口。

## 🏗️ **架构设计**

### **核心组件**
```
GPUParticles3D (主节点)
├── ParticleMaterialManager (材质管理器)
├── ParticleShapeManager (形状管理器)
└── GPUParticles3D_Usage_Examples (使用示例)
```

### **设计原则**
1. **完全封装**: 用户无需直接操作Three.js对象
2. **统一接口**: 一个节点类包含所有粒子功能
3. **多种使用方式**: 支持链式调用、属性配置、节点图连接
4. **高度可扩展**: 易于添加新的材质和形状类型
5. **性能优化**: GPU加速渲染，批量处理

## ✨ **核心特性**

### **🎯 生命周期管理**
- 完整的粒子生成、更新、销毁流程
- 自动内存管理和资源清理
- 可配置的发射速率和生命周期

### **🔷 形状系统**
支持多种发射形状：
- `POINT` - 点发射
- `SPHERE` - 球体发射
- `HEMISPHERE` - 半球发射
- `BOX` - 立方体发射
- `CYLINDER` - 圆柱体发射
- `CONE` - 圆锥发射
- `RING` - 环形发射
- `DISC` - 圆盘发射
- `EDGE_RING` - 环形边缘发射
- `CUSTOM_MESH` - 自定义网格发射

### **🎨 材质系统**
支持多种材质模式：
- **预设材质**: 火焰、烟雾、魔法、水、电、闪烁、爆炸、治疗
- **代码驱动**: 使用函数创建自定义材质
- **节点图**: 可视化材质编辑器（集成中）
- **自定义GLSL**: 完全自定义着色器

### **⚡ 着色器模式**
- **预设着色器**: 内置高质量效果
- **自定义着色器**: 完全控制视觉效果
- **动态uniform**: 实时参数调整
- **GPU优化**: 高性能渲染

## 🚀 **使用方式**

### **1. 链式调用方式**
```typescript
const fireParticles = new GPUParticles3D()
  .setAmount(200)                                    // 200个粒子
  .setLifetime(3.0)                                  // 3秒生命周期
  .setEmissionRate(50)                               // 每秒发射50个
  .setEmissionShape(EmissionShape.SPHERE, 0.5)       // 球形发射
  .setMaterialMode(ParticleMaterialMode.PRESET_FIRE) // 火焰材质
  .setInitialVelocity(2.0, new THREE.Vector3(0, 1, 0)) // 向上发射
  .setGravity(new THREE.Vector3(0, -3, 0))           // 轻微重力
  .restart()                                         // 立即开始

// 添加到场景
scene.addChild(fireParticles)
```

### **2. 属性配置方式**
```typescript
const magicParticles = new GPUParticles3D()

// 基础属性
magicParticles.emitting = true
magicParticles.amount = 150
magicParticles.lifetime = 4.0
magicParticles.speedScale = 1.2
magicParticles.explosiveness = 0.3
magicParticles.randomness = 0.4

// 发射器配置
magicParticles.setEmissionShape(EmissionShape.RING, 1.0)
magicParticles.setEmissionRate(30)

// 材质配置
magicParticles.setMaterialMode(ParticleMaterialMode.PRESET_MAGIC, {
  presetParams: {
    color: new THREE.Color(0.5, 0.2, 1.0),
    sparkleIntensity: 2.0
  }
})

scene.addChild(magicParticles)
```

### **3. 自定义着色器方式**
```typescript
const customParticles = new GPUParticles3D()
  .setAmount(300)
  .setMaterialMode(ParticleMaterialMode.CUSTOM_SHADER, {
    customVertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float uTime;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        
        // 动态大小变化
        float dynamicSize = size * (1.0 + sin(uTime * 5.0) * 0.3);
        gl_PointSize = dynamicSize * (300.0 / -mvPosition.z);
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    customFragmentShader: `
      uniform float uTime;
      varying vec3 vColor;
      
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(gl_PointCoord - center);
        
        if (distance > 0.5) discard;
        
        // 脉冲效果
        float pulse = sin(uTime * 8.0) * 0.5 + 0.5;
        vec3 finalColor = vColor * (1.0 + pulse);
        float alpha = (1.0 - distance * 2.0) * pulse;
        
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    customUniforms: {
      uIntensity: { value: 2.0 }
    }
  })

scene.addChild(customParticles)
```

### **4. 预设快速创建**
```typescript
import { 
  createFireParticles, 
  createMagicParticles, 
  createExplosionParticles 
} from '~/core/nodes/particles/examples/GPUParticles3D_Usage_Examples'

// 快速创建预设效果
const fire = createFireParticles()
const magic = createMagicParticles()
const explosion = createExplosionParticles()

scene.addChild(fire)
scene.addChild(magic)
scene.addChild(explosion)
```

## 🔧 **API参考**

### **核心属性**
```typescript
class GPUParticles3D extends Node3D {
  // 基础控制
  emitting: boolean = true          // 是否发射
  amount: number = 100              // 粒子数量
  lifetime: number = 3.0            // 生命周期
  speedScale: number = 1.0          // 速度缩放
  explosiveness: number = 0.0       // 爆发性(0-1)
  randomness: number = 0.0          // 随机性(0-1)
  
  // 链式调用方法
  setAmount(amount: number): this
  setLifetime(lifetime: number): this
  setEmissionRate(rate: number): this
  setEmissionShape(shape: EmissionShape, ...params): this
  setMaterialMode(mode: ParticleMaterialMode, config?): this
  setInitialVelocity(velocity: number, direction?: Vector3): this
  setGravity(gravity: Vector3): this
  restart(): this
}
```

### **材质管理器**
```typescript
class ParticleMaterialManager {
  createMaterial(config: MaterialConfig): ShaderMaterial | PointsMaterial
  
  // 支持的材质模式
  enum MaterialCreationMode {
    PRESET,      // 预设材质
    CODE_DRIVEN, // 代码驱动
    NODE_GRAPH,  // 节点图
    CUSTOM_GLSL  // 自定义GLSL
  }
  
  // 预设材质类型
  enum PresetMaterialType {
    FIRE, SMOKE, MAGIC, WATER, ELECTRIC,
    SPARKLE, EXPLOSION, HEAL
  }
}
```

### **形状管理器**
```typescript
class ParticleShapeManager {
  generateSpawnData(shape: EmissionShape, params: ShapeParameters): ParticleSpawnData
  getShapeBounds(shape: EmissionShape, params: ShapeParameters): Box3
  validateShapeParameters(shape: EmissionShape, params: ShapeParameters): boolean
}
```

## 🎮 **在demo-3d中的使用**

我们已经在`pages/demo-3d.vue`中集成了新的GPUParticles3D系统：

```typescript
// 创建粒子系统
function createQAQParticleSystem() {
  qaqParticleSystem = createFireParticles()
  qaqParticleSystem.name = 'QAQ_ParticleSystem'
  qaqParticleSystem.position.y = 2.0
  scene.addChild(qaqParticleSystem)
}

// 更新粒子系统
function updateQAQParticleSystem() {
  if (qaqParticleSystem) {
    qaqParticleSystem.rotation.y += 0.005
  }
}

// 重置粒子系统
function resetParticleSystem() {
  if (qaqParticleSystem) {
    qaqParticleSystem.restart()
  }
}
```

## 🔮 **扩展指南**

### **添加新的预设材质**
1. 在`ParticleMaterialManager`中添加新的`PresetMaterialType`
2. 实现对应的创建方法
3. 在`GPUParticles3D_Usage_Examples`中添加使用示例

### **添加新的发射形状**
1. 在`ParticleShapeManager`中添加新的`EmissionShape`
2. 实现对应的生成逻辑
3. 添加参数验证和边界计算

### **集成节点图系统**
1. 完善`MaterialConfig`中的`nodeGraph`支持
2. 实现`GLSLCodeGenerator`的Three.js材质生成
3. 添加可视化编辑器界面

## 🎯 **性能特点**

### **优化措施**
- **GPU渲染**: 所有计算在GPU上执行
- **批量处理**: 单次draw call渲染所有粒子
- **材质缓存**: 避免重复创建相同材质
- **内存管理**: 固定大小的粒子池
- **LOD系统**: 可根据距离调整质量

### **性能指标**
- **粒子数量**: 支持数百到数千个粒子
- **渲染开销**: 每个粒子系统1次draw call
- **内存使用**: 固定大小，无动态分配
- **帧率影响**: 在现代GPU上影响极小

## 🎓 **最佳实践**

### **使用建议**
1. **选择合适的粒子数量**: 根据设备性能调整
2. **合理使用材质**: 复用相同材质的粒子系统
3. **优化着色器**: 避免过于复杂的计算
4. **控制生命周期**: 及时清理不需要的粒子系统
5. **批量操作**: 同时创建多个相关效果时考虑组合

### **调试技巧**
1. 使用`console.log`查看粒子系统状态
2. 调整`speedScale`来观察动画效果
3. 使用`explosiveness`测试瞬间效果
4. 通过`randomness`增加自然感

## 🎉 **总结**

我们成功创建了一个完整的、统一的粒子节点系统，具有以下优势：

✅ **完全封装**: 用户无需了解Three.js细节  
✅ **多种使用方式**: 链式调用、属性配置、预设创建  
✅ **高度可扩展**: 易于添加新材质和形状  
✅ **性能优化**: GPU加速，批量渲染  
✅ **符合QAQ架构**: 继承Node3D，集成引擎系统  
✅ **参考Godot设计**: 熟悉的API和概念  

这个系统为QAQ引擎提供了强大而灵活的粒子效果能力，支持从简单的火焰效果到复杂的自定义着色器，满足各种游戏开发需求！🚀
