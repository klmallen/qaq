// ============================================================================
// QAQ Engine - 粒子系统示例索引 (Particle System Examples Index)
// ============================================================================

// 节点图示例
export * from './node-graph/BasicNodeGraphExamples'

// 代码驱动示例
export * from './code-driven/PresetEffect_Examples'

// 游戏特效示例
export * from './game-effects/SkillEffects'

// 完整使用示例
export * from './CompleteUsageExample'

/**
 * 快速开始指南
 */
export const QuickStartGuide = {
  /**
   * 1. 最简单的使用方式 - 预设效果
   */
  simple: {
    description: '使用预设效果快速创建粒子',
    code: `
import { createFireParticles } from '@/core/nodes/particles/examples'

// 创建火焰粒子材质
const fireMaterial = createFireParticles({
  speed: new Vector2(0.1, 0.2),
  intensity: 1.5
})

// 在Three.js中使用
const geometry = new PlaneGeometry(2, 2)
const mesh = new Mesh(geometry, fireMaterial)
scene.add(mesh)
    `
  },

  /**
   * 2. 游戏技能特效
   */
  gameSkills: {
    description: '创建游戏中的技能特效',
    code: `
import { createFireballEffect, createHealingEffect } from '@/core/nodes/particles/examples'

// 火球术
const fireballMaterial = createFireballEffect({
  size: 1.2,
  intensity: 2.0,
  trailLength: 0.4
})

// 治疗术
const healingMaterial = createHealingEffect({
  warmth: 0.3,
  purity: 0.9,
  sparkles: true
})
    `
  },

  /**
   * 3. 节点图方式
   */
  nodeGraph: {
    description: '使用节点图创建复杂效果',
    code: `
import { createSimpleAgeGradient } from '@/core/nodes/particles/examples'
import { GLSLCodeGenerator } from '@/core/nodes/particles/material/GLSLCodeGenerator'

// 创建节点图
const graph = createSimpleAgeGradient()

// 生成GLSL材质
const generator = new GLSLCodeGenerator(graph)
const material = generator.createThreeMaterial()
    `
  },

  /**
   * 4. 完整演示
   */
  fullDemo: {
    description: '完整的粒子系统演示',
    code: `
import { initQAQParticleDemo } from '@/core/nodes/particles/examples'

// 在HTML容器中初始化演示
const container = document.getElementById('particle-container')
const demo = initQAQParticleDemo(container)

// 获取性能统计
console.log(demo.getStats())
    `
  }
}

/**
 * 示例分类
 */
export const ExampleCategories = {
  /**
   * 基础示例
   */
  basic: [
    'createFireParticles',
    'createSmokeParticles', 
    'createMagicParticles'
  ],

  /**
   * 游戏特效
   */
  gameEffects: [
    'createFireballEffect',
    'createFrostboltEffect',
    'createHealingEffect',
    'createLightningEffect',
    'createPoisonCloudEffect',
    'createShieldEffect'
  ],

  /**
   * 节点图示例
   */
  nodeGraphs: [
    'createSimpleAgeGradient',
    'createUVFlowTexture',
    'createMathOperations',
    'createMultiOutputExample'
  ],

  /**
   * 高级示例
   */
  advanced: [
    'CompleteUsageExample',
    'initQAQParticleDemo'
  ]
}

/**
 * 使用场景推荐
 */
export const UseCaseRecommendations = {
  /**
   * 新手开发者
   */
  beginner: {
    recommended: ['createFireParticles', 'createSmokeParticles', 'createMagicParticles'],
    description: '从预设效果开始，快速上手粒子系统'
  },

  /**
   * 游戏开发者
   */
  gamedev: {
    recommended: ['createFireballEffect', 'createHealingEffect', 'createLightningEffect'],
    description: '专为游戏设计的技能特效，开箱即用'
  },

  /**
   * 视觉设计师
   */
  designer: {
    recommended: ['createSimpleAgeGradient', 'createUVFlowTexture', 'CompleteUsageExample'],
    description: '可视化节点图编辑，直观的效果创建'
  },

  /**
   * 高级开发者
   */
  advanced: {
    recommended: ['GLSLCodeGenerator', 'CodeDrivenParticleMaterial', 'MaterialGraph'],
    description: '完全自定义的GLSL着色器和节点图系统'
  }
}

/**
 * 性能优化建议
 */
export const PerformanceGuide = {
  /**
   * 材质复用
   */
  materialReuse: `
// ✅ 好的做法：复用相同的材质
const sharedFireMaterial = createFireParticles()
particleSystem1.material = sharedFireMaterial
particleSystem2.material = sharedFireMaterial

// ❌ 避免：为每个粒子系统创建新材质
particleSystem1.material = createFireParticles()
particleSystem2.material = createFireParticles()
  `,

  /**
   * Uniform优化
   */
  uniformOptimization: `
// ✅ 好的做法：只在值改变时更新
if (material.uniforms.uTime.value !== time) {
  material.uniforms.uTime.value = time
}

// ❌ 避免：每帧都更新所有uniform
material.uniforms.uTime.value = time
material.uniforms.uIntensity.value = intensity
  `,

  /**
   * 几何体优化
   */
  geometryOptimization: `
// ✅ 好的做法：使用实例化几何体
const instancedGeometry = new InstancedBufferGeometry()
instancedGeometry.copy(baseGeometry)
instancedGeometry.instanceCount = particleCount

// ❌ 避免：为每个粒子创建单独的几何体
particles.forEach(() => {
  const geometry = new PlaneGeometry(1, 1)
  const mesh = new Mesh(geometry, material)
})
  `
}

/**
 * 常见问题解答
 */
export const FAQ = {
  /**
   * 如何选择合适的粒子创建方式？
   */
  choosingMethod: {
    question: '如何选择合适的粒子创建方式？',
    answer: `
1. **预设效果**: 适合快速原型和常见效果
2. **游戏技能**: 适合游戏开发，专业化效果
3. **节点图**: 适合可视化编辑和复杂组合
4. **直接GLSL**: 适合完全自定义和高性能需求
    `
  },

  /**
   * 如何优化粒子系统性能？
   */
  performance: {
    question: '如何优化粒子系统性能？',
    answer: `
1. **材质复用**: 相同效果使用同一材质实例
2. **批处理**: 使用实例化渲染大量粒子
3. **LOD系统**: 根据距离调整粒子质量
4. **Uniform缓存**: 避免重复设置相同值
5. **几何体优化**: 使用简单的几何体形状
    `
  },

  /**
   * 如何调试粒子效果？
   */
  debugging: {
    question: '如何调试粒子效果？',
    answer: `
1. **GLSL错误**: 检查浏览器控制台的着色器编译错误
2. **Uniform值**: 使用Three.js DevTools查看uniform值
3. **性能监控**: 使用Stats.js监控帧率和渲染调用
4. **可视化调试**: 临时修改着色器输出调试信息
5. **分步测试**: 逐个添加效果组件进行测试
    `
  }
}

/**
 * 版本更新日志
 */
export const ChangeLog = {
  'v1.0.0': {
    date: '2024-01-01',
    changes: [
      '初始版本发布',
      '基础节点图系统',
      '代码驱动粒子创建',
      '预设效果库'
    ]
  },
  'v1.1.0': {
    date: '2024-01-15', 
    changes: [
      '添加游戏技能特效库',
      '性能优化和批处理支持',
      'Vue Flow集成',
      '完整使用示例'
    ]
  },
  'v1.2.0': {
    date: '2024-02-01',
    changes: [
      'Unity风格节点支持',
      '高级GLSL功能',
      '材质编辑器集成',
      '性能分析工具'
    ]
  }
}

// 默认导出所有示例
export default {
  QuickStartGuide,
  ExampleCategories,
  UseCaseRecommendations,
  PerformanceGuide,
  FAQ,
  ChangeLog
}
