// ============================================================================
// QAQ Engine - 材质图使用示例 (Material Graph Usage Examples)
// ============================================================================

import { createUVFlowFireExample, createDissolveExample } from './MaterialNodeExamples'
import { GLSLCodeGenerator } from './GLSLCodeGenerator'
import { VueFlowAdapter } from './VueFlowAdapter'
import { graphValidator } from './TypeSystem'
import { ShaderMaterial, TextureLoader, Vector2 } from 'three'

/**
 * 完整的材质图使用示例
 */
export class MaterialGraphUsageExample {

  /**
   * 示例1：UV流动火焰效果
   */
  static createFireEffect(): {
    material: ShaderMaterial,
    updateFunction: (time: number) => void,
    glslCode: { vertex: string, fragment: string }
  } {
    console.log('🔥 创建UV流动火焰效果...')

    // 1. 创建材质图
    const fireGraph = createUVFlowFireExample()
    
    // 2. 验证图结构
    const validation = graphValidator.validateGraph(fireGraph)
    if (!validation.valid) {
      console.error('图验证失败:', validation)
      throw new Error('材质图验证失败')
    }
    
    console.log('✅ 材质图验证通过')

    // 3. 生成GLSL代码
    const codeGenerator = new GLSLCodeGenerator(fireGraph)
    const { vertexShader, fragmentShader, uniforms } = codeGenerator.generateShaders()
    
    console.log('✅ GLSL代码生成完成')
    console.log('📄 生成的片段着色器代码:')
    console.log(fragmentShader)

    // 4. 创建Three.js材质
    const material = codeGenerator.createThreeMaterial()
    
    // 5. 设置纹理
    const textureLoader = new TextureLoader()
    
    // 火焰纹理
    textureLoader.load('/textures/fire.jpg', (texture) => {
      // 找到对应的uniform
      for (const [key, uniform] of Object.entries(material.uniforms)) {
        if (key.includes('fire_texture') && key.includes('Texture')) {
          uniform.value = texture
          console.log(`🖼️ 设置火焰纹理: ${key}`)
        }
      }
    })

    // 6. 创建更新函数
    const updateFunction = (time: number) => {
      // 更新时间uniform
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = time
      }
      if (material.uniforms.uDeltaTime) {
        material.uniforms.uDeltaTime.value = 0.016 // 假设60FPS
      }
    }

    return {
      material,
      updateFunction,
      glslCode: {
        vertex: vertexShader,
        fragment: fragmentShader
      }
    }
  }

  /**
   * 示例2：溶解效果
   */
  static createDissolveEffect(): {
    material: ShaderMaterial,
    setDissolveAmount: (amount: number) => void,
    glslCode: { vertex: string, fragment: string }
  } {
    console.log('💫 创建溶解效果...')

    // 1. 创建溶解材质图
    const dissolveGraph = createDissolveExample()
    
    // 2. 生成材质
    const codeGenerator = new GLSLCodeGenerator(dissolveGraph)
    const { vertexShader, fragmentShader, uniforms } = codeGenerator.generateShaders()
    const material = codeGenerator.createThreeMaterial()
    
    // 3. 设置噪声纹理
    const textureLoader = new TextureLoader()
    textureLoader.load('/textures/noise.jpg', (texture) => {
      for (const [key, uniform] of Object.entries(material.uniforms)) {
        if (key.includes('noise') && key.includes('Texture')) {
          uniform.value = texture
        }
      }
    })

    // 4. 溶解控制函数
    const setDissolveAmount = (amount: number) => {
      // 查找溶解阈值uniform
      for (const [key, uniform] of Object.entries(material.uniforms)) {
        if (key.includes('dissolve_threshold')) {
          uniform.value = amount
          break
        }
      }
    }

    return {
      material,
      setDissolveAmount,
      glslCode: {
        vertex: vertexShader,
        fragment: fragmentShader
      }
    }
  }

  /**
   * 示例3：从Vue Flow数据创建材质
   */
  static createFromVueFlowData(): ShaderMaterial {
    console.log('🔄 从Vue Flow数据创建材质...')

    // 1. 模拟Vue Flow编辑器数据
    const vueFlowNodes = [
      {
        id: 'time1',
        type: 'time',
        position: { x: 0, y: 0 },
        data: {
          label: 'Time',
          nodeType: 'time'
        }
      },
      {
        id: 'uv1',
        type: 'uv_coordinate',
        position: { x: 0, y: 100 },
        data: {
          label: 'UV Coordinate',
          nodeType: 'uv_coordinate'
        }
      },
      {
        id: 'panner1',
        type: 'uv_panner',
        position: { x: 200, y: 50 },
        data: {
          label: 'UV Panner',
          nodeType: 'uv_panner',
          properties: {
            speed: [0.2, 0.1]
          }
        }
      },
      {
        id: 'noise1',
        type: 'simple_noise',
        position: { x: 400, y: 50 },
        data: {
          label: 'Simple Noise',
          nodeType: 'simple_noise',
          properties: {
            scale: 5.0
          }
        }
      },
      {
        id: 'output1',
        type: 'particle_output',
        position: { x: 600, y: 50 },
        data: {
          label: 'Particle Output',
          nodeType: 'particle_output'
        }
      }
    ]

    const vueFlowEdges = [
      {
        id: 'edge1',
        source: 'time1',
        target: 'panner1',
        sourceHandle: 'time',
        targetHandle: 'time'
      },
      {
        id: 'edge2',
        source: 'uv1',
        target: 'panner1',
        sourceHandle: 'uv',
        targetHandle: 'uv'
      },
      {
        id: 'edge3',
        source: 'panner1',
        target: 'noise1',
        sourceHandle: 'result',
        targetHandle: 'uv'
      },
      {
        id: 'edge4',
        source: 'noise1',
        target: 'output1',
        sourceHandle: 'noise',
        targetHandle: 'baseColor'
      }
    ]

    // 2. 转换为QAQ材质图格式
    const { graph, errors } = VueFlowAdapter.validateAndConvert(vueFlowNodes, vueFlowEdges)
    
    if (errors.length > 0) {
      console.error('转换错误:', errors)
      throw new Error('Vue Flow数据转换失败')
    }

    console.log('✅ Vue Flow数据转换成功')

    // 3. 生成材质
    const codeGenerator = new GLSLCodeGenerator(graph)
    const material = codeGenerator.createThreeMaterial()

    return material
  }

  /**
   * 示例4：复杂水流效果
   */
  static createWaterFlowEffect(): {
    material: ShaderMaterial,
    updateFunction: (time: number) => void
  } {
    console.log('🌊 创建复杂水流效果...')

    // 手动构建复杂的水流材质图
    const waterGraph = {
      id: 'water_flow_complex',
      name: 'Complex Water Flow',
      nodes: [
        // 主UV流动
        {
          id: 'main_uv',
          type: 'uv_coordinate',
          position: { x: 0, y: 0 },
          data: {
            label: 'Main UV',
            nodeType: 'uv_coordinate' as any,
            inputValues: {},
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 时间节点
        {
          id: 'time',
          type: 'time',
          position: { x: 0, y: 100 },
          data: {
            label: 'Time',
            nodeType: 'time' as any,
            inputValues: {},
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 主流动
        {
          id: 'main_flow',
          type: 'uv_panner',
          position: { x: 200, y: 0 },
          data: {
            label: 'Main Flow',
            nodeType: 'uv_panner' as any,
            inputValues: { speed: [0.1, 0.05] },
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 细节流动
        {
          id: 'detail_flow',
          type: 'uv_panner',
          position: { x: 200, y: 100 },
          data: {
            label: 'Detail Flow',
            nodeType: 'uv_panner' as any,
            inputValues: { speed: [-0.05, 0.08] },
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 主噪声
        {
          id: 'main_noise',
          type: 'simple_noise',
          position: { x: 400, y: 0 },
          data: {
            label: 'Main Noise',
            nodeType: 'simple_noise' as any,
            inputValues: { scale: 3.0 },
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 细节噪声
        {
          id: 'detail_noise',
          type: 'simple_noise',
          position: { x: 400, y: 100 },
          data: {
            label: 'Detail Noise',
            nodeType: 'simple_noise' as any,
            inputValues: { scale: 8.0 },
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 噪声混合
        {
          id: 'noise_mix',
          type: 'multiply',
          position: { x: 600, y: 50 },
          data: {
            label: 'Noise Mix',
            nodeType: 'multiply' as any,
            inputValues: {},
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        },
        // 水流颜色
        {
          id: 'water_color',
          type: 'color_ramp',
          position: { x: 800, y: 50 },
          data: {
            label: 'Water Color',
            nodeType: 'color_ramp' as any,
            inputValues: {},
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {
              colorStops: [
                { position: 0.0, color: [0.1, 0.3, 0.8, 0.6] },  // 深蓝
                { position: 0.5, color: [0.3, 0.6, 1.0, 0.8] },  // 中蓝
                { position: 1.0, color: [0.8, 0.9, 1.0, 0.9] }   // 浅蓝
              ]
            }
          }
        },
        // 输出
        {
          id: 'output',
          type: 'particle_output',
          position: { x: 1000, y: 50 },
          data: {
            label: 'Output',
            nodeType: 'particle_output' as any,
            inputValues: {},
            outputValues: {},
            inputConnections: {},
            outputConnections: {},
            properties: {}
          }
        }
      ],
      connections: [
        // 连接逻辑...
      ],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: 9,
        connectionCount: 0
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }

    // 生成材质
    const codeGenerator = new GLSLCodeGenerator(waterGraph as any)
    const material = codeGenerator.createThreeMaterial()

    // 更新函数
    const updateFunction = (time: number) => {
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = time
      }
    }

    return { material, updateFunction }
  }

  /**
   * 运行所有示例
   */
  static runAllExamples(): void {
    console.log('🚀 运行所有材质图示例...')

    try {
      // 示例1：火焰效果
      const fireEffect = this.createFireEffect()
      console.log('✅ 火焰效果创建成功')

      // 示例2：溶解效果
      const dissolveEffect = this.createDissolveEffect()
      console.log('✅ 溶解效果创建成功')

      // 示例3：Vue Flow转换
      const vueFlowMaterial = this.createFromVueFlowData()
      console.log('✅ Vue Flow转换成功')

      // 示例4：水流效果
      const waterEffect = this.createWaterFlowEffect()
      console.log('✅ 水流效果创建成功')

      console.log('🎉 所有示例运行完成！')

      // 返回示例结果供外部使用
      return {
        fireEffect,
        dissolveEffect,
        vueFlowMaterial,
        waterEffect
      }

    } catch (error) {
      console.error('❌ 示例运行失败:', error)
      throw error
    }
  }

  /**
   * 性能测试
   */
  static performanceTest(): void {
    console.log('⚡ 开始性能测试...')

    const startTime = performance.now()

    // 创建多个复杂材质
    for (let i = 0; i < 100; i++) {
      const fireGraph = createUVFlowFireExample()
      const codeGenerator = new GLSLCodeGenerator(fireGraph)
      codeGenerator.generateShaders()
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`✅ 性能测试完成`)
    console.log(`📊 生成100个复杂材质耗时: ${duration.toFixed(2)}ms`)
    console.log(`📊 平均每个材质: ${(duration / 100).toFixed(2)}ms`)
  }
}

// 导出便捷函数
export function createFireMaterial(): ShaderMaterial {
  return MaterialGraphUsageExample.createFireEffect().material
}

export function createDissolveMaterial(): ShaderMaterial {
  return MaterialGraphUsageExample.createDissolveEffect().material
}

export function runMaterialExamples() {
  return MaterialGraphUsageExample.runAllExamples()
}
