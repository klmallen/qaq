# 🎯 QAQ粒子系统示例集合

这个文件夹包含了QAQ粒子系统的完整示例，展示了从节点图到代码驱动的各种粒子效果创建方式。

## 📁 **文件结构**

```
examples/
├── README.md                           # 本文件
├── node-graph/                         # 节点图示例
│   ├── BasicNodeGraphExamples.ts       # 基础节点图示例
│   ├── UnityStyleNodeExamples.ts       # Unity风格节点示例
│   ├── ComplexEffectExamples.ts        # 复杂特效示例
│   └── NodeGraphToGLSL_Demo.ts         # 节点图转GLSL演示
├── code-driven/                        # 代码驱动示例
│   ├── DirectGLSL_Examples.ts          # 直接GLSL代码示例
│   ├── PresetEffect_Examples.ts        # 预设效果示例
│   ├── FunctionalStyle_Examples.ts     # 函数式编程示例
│   ├── TemplateSystem_Examples.ts      # 模板系统示例
│   └── FactoryFunction_Examples.ts     # 工厂函数示例
├── game-effects/                       # 游戏特效示例
│   ├── SkillEffects.ts                 # 技能特效
│   ├── EnvironmentEffects.ts           # 环境特效
│   ├── UIEffects.ts                    # UI特效
│   └── WeatherEffects.ts               # 天气特效
├── performance/                        # 性能优化示例
│   ├── OptimizedShaders.ts             # 优化着色器
│   ├── BatchingExamples.ts             # 批处理示例
│   └── LODSystem_Examples.ts           # LOD系统示例
├── interactive/                        # 交互式示例
│   ├── MouseInteraction.ts             # 鼠标交互
│   ├── PhysicsBasedParticles.ts        # 基于物理的粒子
│   └── RealtimeControls.ts             # 实时控制
└── integration/                        # 集成示例
    ├── ThreeJS_Integration.ts          # Three.js集成
    ├── VueFlow_Integration.ts          # Vue Flow集成
    └── MaterialEditor_Integration.ts   # 材质编辑器集成
```

## 🚀 **快速开始**

### **1. 节点图方式**
```typescript
import { createUVFlowFireExample } from './node-graph/BasicNodeGraphExamples'
import { GLSLCodeGenerator } from '../material/GLSLCodeGenerator'

// 创建火焰节点图
const fireGraph = createUVFlowFireExample()

// 生成Three.js材质
const generator = new GLSLCodeGenerator(fireGraph)
const material = generator.createThreeMaterial()
```

### **2. 代码驱动方式**
```typescript
import { createFireParticles } from './code-driven/PresetEffect_Examples'

// 直接创建火焰材质
const fireMaterial = createFireParticles({
  speed: new Vector2(0.2, 0.3),
  intensity: 1.5,
  colorStart: new Color(1, 1, 0),
  colorEnd: new Color(1, 0, 0)
})
```

### **3. 游戏特效**
```typescript
import { SkillEffectLibrary } from './game-effects/SkillEffects'

// 创建技能特效
const fireballMaterial = SkillEffectLibrary.createFireball()
const healingMaterial = SkillEffectLibrary.createHealing()
const lightningMaterial = SkillEffectLibrary.createLightning()
```

## 📚 **示例分类说明**

### **🎨 节点图示例 (node-graph/)**
- **BasicNodeGraphExamples**: 基础的节点连接示例
- **UnityStyleNodeExamples**: Unity ShaderGraph风格的节点
- **ComplexEffectExamples**: 复杂的多节点组合效果
- **NodeGraphToGLSL_Demo**: 完整的节点图到GLSL转换演示

### **💻 代码驱动示例 (code-driven/)**
- **DirectGLSL_Examples**: 直接编写GLSL着色器代码
- **PresetEffect_Examples**: 使用预设效果和参数配置
- **FunctionalStyle_Examples**: 函数式编程风格的粒子创建
- **TemplateSystem_Examples**: 基于模板的粒子效果
- **FactoryFunction_Examples**: 工厂函数模式的粒子创建

### **🎮 游戏特效示例 (game-effects/)**
- **SkillEffects**: 各种技能特效（火球、冰霜、治疗等）
- **EnvironmentEffects**: 环境特效（火焰、烟雾、水流等）
- **UIEffects**: UI特效（按钮点击、加载动画等）
- **WeatherEffects**: 天气特效（雨、雪、雾等）

### **⚡ 性能优化示例 (performance/)**
- **OptimizedShaders**: 高性能着色器编写技巧
- **BatchingExamples**: 粒子批处理和实例化
- **LODSystem_Examples**: 距离级别细节系统

### **🖱️ 交互式示例 (interactive/)**
- **MouseInteraction**: 鼠标交互控制粒子
- **PhysicsBasedParticles**: 基于物理的粒子行为
- **RealtimeControls**: 实时参数调节

### **🔗 集成示例 (integration/)**
- **ThreeJS_Integration**: 与Three.js场景的完整集成
- **VueFlow_Integration**: 与Vue Flow编辑器的集成
- **MaterialEditor_Integration**: 与材质编辑器的集成

## 🎯 **使用建议**

### **初学者路径**
1. 从 `code-driven/PresetEffect_Examples.ts` 开始
2. 尝试 `game-effects/SkillEffects.ts` 中的技能特效
3. 学习 `node-graph/BasicNodeGraphExamples.ts` 的节点图概念

### **进阶开发者路径**
1. 研究 `code-driven/FunctionalStyle_Examples.ts` 的函数式编程
2. 深入 `node-graph/ComplexEffectExamples.ts` 的复杂效果
3. 优化性能：`performance/OptimizedShaders.ts`

### **专业开发者路径**
1. 自定义节点：`node-graph/UnityStyleNodeExamples.ts`
2. 直接GLSL：`code-driven/DirectGLSL_Examples.ts`
3. 系统集成：`integration/` 文件夹下的所有示例

## 🔧 **运行示例**

### **在Three.js场景中使用**
```typescript
import * as THREE from 'three'
import { createFireParticles } from './code-driven/PresetEffect_Examples'

// 创建场景
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer()

// 创建粒子系统
const particleGeometry = new THREE.PlaneGeometry(1, 1)
const particleMaterial = createFireParticles()
const particleMesh = new THREE.Mesh(particleGeometry, particleMaterial)

scene.add(particleMesh)

// 动画循环
function animate() {
  requestAnimationFrame(animate)
  
  // 更新时间uniform
  particleMaterial.uniforms.uTime.value = performance.now() * 0.001
  
  renderer.render(scene, camera)
}
animate()
```

### **在Vue组件中使用**
```vue
<template>
  <div ref="container" class="particle-container"></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { createMagicParticles } from './code-driven/PresetEffect_Examples'

const container = ref()

onMounted(() => {
  // 初始化Three.js场景
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer()
  
  renderer.setSize(800, 600)
  container.value.appendChild(renderer.domElement)
  
  // 创建魔法粒子
  const magicMaterial = createMagicParticles(new THREE.Color(0.5, 0, 1))
  const particleGeometry = new THREE.PlaneGeometry(2, 2)
  const particleMesh = new THREE.Mesh(particleGeometry, magicMaterial)
  
  scene.add(particleMesh)
  camera.position.z = 5
  
  // 动画
  function animate() {
    requestAnimationFrame(animate)
    magicMaterial.uniforms.uTime.value = performance.now() * 0.001
    renderer.render(scene, camera)
  }
  animate()
})
</script>
```

## 📖 **学习资源**

- **GLSL基础**: 学习着色器编程基础知识
- **Three.js文档**: 了解Three.js的材质系统
- **Unity ShaderGraph**: 参考Unity的节点图设计
- **Blender Shader Nodes**: 学习节点图的设计模式

## 🤝 **贡献指南**

欢迎贡献新的示例！请遵循以下规范：

1. **文件命名**: 使用PascalCase，描述性命名
2. **代码注释**: 详细的中文注释说明
3. **示例完整性**: 包含完整的可运行代码
4. **性能考虑**: 注明性能特点和适用场景
5. **文档更新**: 更新相应的README文档

## 🎉 **开始探索**

选择一个感兴趣的示例文件，开始你的QAQ粒子系统之旅吧！每个示例都包含详细的注释和使用说明。
