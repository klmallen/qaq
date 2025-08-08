// ============================================================================
// QAQ Engine - 基础节点图示例 (Basic Node Graph Examples)
// ============================================================================

import { MaterialGraph, NodeInstance, ConnectionInstance, DataType } from '../../material/DataStructureDefinition'
import { NodeType, NodeCategory } from '../../material/DataStructureDefinition'

/**
 * 基础节点图示例集合
 */
export class BasicNodeGraphExamples {

  /**
   * 示例1：简单的粒子年龄渐变
   * 
   * 节点连接：粒子年龄 → 颜色渐变 → 输出
   */
  static createSimpleAgeGradient(): MaterialGraph {
    const nodes: NodeInstance[] = [
      // 粒子年龄节点
      {
        id: 'particle_age',
        type: 'particle-age',
        position: { x: 0, y: 0 },
        data: {
          label: '粒子年龄',
          nodeType: NodeType.PARTICLE_AGE,
          inputValues: {},
          outputValues: { age: 0 },
          inputConnections: {},
          outputConnections: { age: 1 },
          properties: {}
        }
      },

      // 颜色渐变节点
      {
        id: 'color_ramp',
        type: 'color-ramp',
        position: { x: 200, y: 0 },
        data: {
          label: '颜色渐变',
          nodeType: NodeType.COLOR_RAMP,
          inputValues: {},
          outputValues: { color: [1, 1, 1, 1] },
          inputConnections: { factor: true },
          outputConnections: { color: 1 },
          properties: {
            colorStops: [
              { position: 0.0, color: [1, 1, 1, 1] },    // 白色
              { position: 0.5, color: [1, 0.5, 0, 1] },  // 橙色
              { position: 1.0, color: [0, 0, 0, 0] }     // 透明
            ]
          }
        }
      },

      // 输出节点
      {
        id: 'output',
        type: 'particle-output',
        position: { x: 400, y: 0 },
        data: {
          label: '粒子输出',
          nodeType: NodeType.PARTICLE_OUTPUT,
          inputValues: {},
          outputValues: {},
          inputConnections: { baseColor: true },
          outputConnections: {},
          properties: {}
        }
      }
    ]

    const connections: ConnectionInstance[] = [
      {
        id: 'age_to_ramp',
        source: 'particle_age',
        target: 'color_ramp',
        sourceHandle: 'age',
        targetHandle: 'factor',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'ramp_to_output',
        source: 'color_ramp',
        target: 'output',
        sourceHandle: 'color',
        targetHandle: 'baseColor',
        dataType: DataType.COLOR,
        valid: true
      }
    ]

    return {
      id: 'simple_age_gradient',
      name: '简单年龄渐变',
      description: '基于粒子年龄的颜色渐变效果',
      nodes,
      connections,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 示例2：UV流动纹理效果
   * 
   * 节点连接：时间 + UV坐标 → UV流动 → 纹理采样 → 输出
   */
  static createUVFlowTexture(): MaterialGraph {
    const nodes: NodeInstance[] = [
      // 时间节点
      {
        id: 'time',
        type: 'input-float',
        position: { x: 0, y: 0 },
        data: {
          label: '时间',
          nodeType: NodeType.INPUT_FLOAT,
          inputValues: { value: 0 },
          outputValues: { value: 0 },
          inputConnections: {},
          outputConnections: { value: 1 },
          properties: {
            isTimeNode: true,
            glslCode: 'uniform float uTime;'
          }
        }
      },

      // UV坐标节点
      {
        id: 'uv_coord',
        type: 'input-vector2',
        position: { x: 0, y: 100 },
        data: {
          label: 'UV坐标',
          nodeType: NodeType.INPUT_VECTOR3, // 使用VEC3类型，实际输出VEC2
          inputValues: {},
          outputValues: { vector: [0, 0] },
          inputConnections: {},
          outputConnections: { vector: 1 },
          properties: {
            isUVNode: true,
            glslCode: 'varying vec2 vUv;'
          }
        }
      },

      // UV流动节点
      {
        id: 'uv_panner',
        type: 'math-add',
        position: { x: 200, y: 50 },
        data: {
          label: 'UV流动',
          nodeType: NodeType.MATH_ADD,
          inputValues: {
            speed: [0.1, 0.2] // 流动速度
          },
          outputValues: { result: [0, 0] },
          inputConnections: { a: true, b: true },
          outputConnections: { result: 1 },
          properties: {
            isUVPanner: true,
            glslCode: `
              vec2 uvPanner(vec2 uv, float time, vec2 speed) {
                return uv + time * speed;
              }
            `
          }
        }
      },

      // 纹理采样节点
      {
        id: 'texture_sample',
        type: 'texture-sample',
        position: { x: 400, y: 50 },
        data: {
          label: '纹理采样',
          nodeType: NodeType.TEXTURE_SAMPLE,
          inputValues: {
            texture: 'particle_texture.jpg'
          },
          outputValues: { color: [1, 1, 1, 1] },
          inputConnections: { uv: true },
          outputConnections: { color: 1, alpha: 1 },
          properties: {}
        }
      },

      // 输出节点
      {
        id: 'output',
        type: 'particle-output',
        position: { x: 600, y: 50 },
        data: {
          label: '粒子输出',
          nodeType: NodeType.PARTICLE_OUTPUT,
          inputValues: {},
          outputValues: {},
          inputConnections: { baseColor: true },
          outputConnections: {},
          properties: {}
        }
      }
    ]

    const connections: ConnectionInstance[] = [
      {
        id: 'time_to_panner',
        source: 'time',
        target: 'uv_panner',
        sourceHandle: 'value',
        targetHandle: 'b',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'uv_to_panner',
        source: 'uv_coord',
        target: 'uv_panner',
        sourceHandle: 'vector',
        targetHandle: 'a',
        dataType: DataType.VEC2,
        valid: true
      },
      {
        id: 'panner_to_texture',
        source: 'uv_panner',
        target: 'texture_sample',
        sourceHandle: 'result',
        targetHandle: 'uv',
        dataType: DataType.VEC2,
        valid: true
      },
      {
        id: 'texture_to_output',
        source: 'texture_sample',
        target: 'output',
        sourceHandle: 'color',
        targetHandle: 'baseColor',
        dataType: DataType.COLOR,
        valid: true
      }
    ]

    return {
      id: 'uv_flow_texture',
      name: 'UV流动纹理',
      description: 'UV坐标随时间流动的纹理效果',
      nodes,
      connections,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 示例3：数学运算组合
   * 
   * 节点连接：Float输入 → 乘法 → 加法 → 输出
   */
  static createMathOperations(): MaterialGraph {
    const nodes: NodeInstance[] = [
      // Float输入1
      {
        id: 'float1',
        type: 'input-float',
        position: { x: 0, y: 0 },
        data: {
          label: '数值1',
          nodeType: NodeType.INPUT_FLOAT,
          inputValues: { value: 2.0 },
          outputValues: { value: 2.0 },
          inputConnections: {},
          outputConnections: { value: 1 },
          properties: {}
        }
      },

      // Float输入2
      {
        id: 'float2',
        type: 'input-float',
        position: { x: 0, y: 100 },
        data: {
          label: '数值2',
          nodeType: NodeType.INPUT_FLOAT,
          inputValues: { value: 3.0 },
          outputValues: { value: 3.0 },
          inputConnections: {},
          outputConnections: { value: 1 },
          properties: {}
        }
      },

      // Float输入3
      {
        id: 'float3',
        type: 'input-float',
        position: { x: 0, y: 200 },
        data: {
          label: '数值3',
          nodeType: NodeType.INPUT_FLOAT,
          inputValues: { value: 1.5 },
          outputValues: { value: 1.5 },
          inputConnections: {},
          outputConnections: { value: 1 },
          properties: {}
        }
      },

      // 乘法节点
      {
        id: 'multiply',
        type: 'math-multiply',
        position: { x: 200, y: 50 },
        data: {
          label: '乘法',
          nodeType: NodeType.MATH_MULTIPLY,
          inputValues: {},
          outputValues: { result: 0 },
          inputConnections: { a: true, b: true },
          outputConnections: { result: 1 },
          properties: {}
        }
      },

      // 加法节点
      {
        id: 'add',
        type: 'math-add',
        position: { x: 400, y: 100 },
        data: {
          label: '加法',
          nodeType: NodeType.MATH_ADD,
          inputValues: {},
          outputValues: { result: 0 },
          inputConnections: { a: true, b: true },
          outputConnections: { result: 1 },
          properties: {}
        }
      },

      // 输出节点
      {
        id: 'output',
        type: 'particle-output',
        position: { x: 600, y: 100 },
        data: {
          label: '粒子输出',
          nodeType: NodeType.PARTICLE_OUTPUT,
          inputValues: {},
          outputValues: {},
          inputConnections: { alpha: true },
          outputConnections: {},
          properties: {}
        }
      }
    ]

    const connections: ConnectionInstance[] = [
      {
        id: 'float1_to_multiply',
        source: 'float1',
        target: 'multiply',
        sourceHandle: 'value',
        targetHandle: 'a',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'float2_to_multiply',
        source: 'float2',
        target: 'multiply',
        sourceHandle: 'value',
        targetHandle: 'b',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'multiply_to_add',
        source: 'multiply',
        target: 'add',
        sourceHandle: 'result',
        targetHandle: 'a',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'float3_to_add',
        source: 'float3',
        target: 'add',
        sourceHandle: 'value',
        targetHandle: 'b',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'add_to_output',
        source: 'add',
        target: 'output',
        sourceHandle: 'result',
        targetHandle: 'alpha',
        dataType: DataType.FLOAT,
        valid: true
      }
    ]

    return {
      id: 'math_operations',
      name: '数学运算组合',
      description: '展示基础数学节点的组合使用',
      nodes,
      connections,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 示例4：多输出节点连接
   * 
   * 节点连接：粒子年龄 → 多个输出 → 不同的处理 → 合并输出
   */
  static createMultiOutputExample(): MaterialGraph {
    const nodes: NodeInstance[] = [
      // 粒子年龄节点
      {
        id: 'particle_age',
        type: 'particle-age',
        position: { x: 0, y: 100 },
        data: {
          label: '粒子年龄',
          nodeType: NodeType.PARTICLE_AGE,
          inputValues: {},
          outputValues: { age: 0 },
          inputConnections: {},
          outputConnections: { age: 3 }, // 连接到3个节点
          properties: {}
        }
      },

      // 颜色渐变节点
      {
        id: 'color_ramp',
        type: 'color-ramp',
        position: { x: 200, y: 0 },
        data: {
          label: '颜色渐变',
          nodeType: NodeType.COLOR_RAMP,
          inputValues: {},
          outputValues: { color: [1, 1, 1, 1] },
          inputConnections: { factor: true },
          outputConnections: { color: 1 },
          properties: {
            colorStops: [
              { position: 0.0, color: [1, 0, 0, 1] },
              { position: 1.0, color: [0, 0, 1, 1] }
            ]
          }
        }
      },

      // 大小缩放节点
      {
        id: 'size_scale',
        type: 'math-multiply',
        position: { x: 200, y: 100 },
        data: {
          label: '大小缩放',
          nodeType: NodeType.MATH_MULTIPLY,
          inputValues: { b: 2.0 }, // 缩放因子
          outputValues: { result: 0 },
          inputConnections: { a: true },
          outputConnections: { result: 1 },
          properties: {}
        }
      },

      // 透明度计算节点
      {
        id: 'alpha_calc',
        type: 'math-subtract',
        position: { x: 200, y: 200 },
        data: {
          label: '透明度计算',
          nodeType: NodeType.MATH_SUBTRACT,
          inputValues: { a: 1.0 }, // 1.0 - age
          outputValues: { result: 0 },
          inputConnections: { b: true },
          outputConnections: { result: 1 },
          properties: {}
        }
      },

      // 输出节点
      {
        id: 'output',
        type: 'particle-output',
        position: { x: 400, y: 100 },
        data: {
          label: '粒子输出',
          nodeType: NodeType.PARTICLE_OUTPUT,
          inputValues: {},
          outputValues: {},
          inputConnections: {
            baseColor: true,
            size: true,
            alpha: true
          },
          outputConnections: {},
          properties: {}
        }
      }
    ]

    const connections: ConnectionInstance[] = [
      {
        id: 'age_to_color',
        source: 'particle_age',
        target: 'color_ramp',
        sourceHandle: 'age',
        targetHandle: 'factor',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'age_to_size',
        source: 'particle_age',
        target: 'size_scale',
        sourceHandle: 'age',
        targetHandle: 'a',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'age_to_alpha',
        source: 'particle_age',
        target: 'alpha_calc',
        sourceHandle: 'age',
        targetHandle: 'b',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'color_to_output',
        source: 'color_ramp',
        target: 'output',
        sourceHandle: 'color',
        targetHandle: 'baseColor',
        dataType: DataType.COLOR,
        valid: true
      },
      {
        id: 'size_to_output',
        source: 'size_scale',
        target: 'output',
        sourceHandle: 'result',
        targetHandle: 'size',
        dataType: DataType.FLOAT,
        valid: true
      },
      {
        id: 'alpha_to_output',
        source: 'alpha_calc',
        target: 'output',
        sourceHandle: 'result',
        targetHandle: 'alpha',
        dataType: DataType.FLOAT,
        valid: true
      }
    ]

    return {
      id: 'multi_output_example',
      name: '多输出节点连接',
      description: '展示一个节点连接到多个目标节点的用法',
      nodes,
      connections,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 获取所有基础示例
   */
  static getAllExamples(): { [key: string]: MaterialGraph } {
    return {
      simpleAgeGradient: this.createSimpleAgeGradient(),
      uvFlowTexture: this.createUVFlowTexture(),
      mathOperations: this.createMathOperations(),
      multiOutputExample: this.createMultiOutputExample()
    }
  }
}

// 便捷导出函数
export function createSimpleAgeGradient(): MaterialGraph {
  return BasicNodeGraphExamples.createSimpleAgeGradient()
}

export function createUVFlowTexture(): MaterialGraph {
  return BasicNodeGraphExamples.createUVFlowTexture()
}

export function createMathOperations(): MaterialGraph {
  return BasicNodeGraphExamples.createMathOperations()
}

export function createMultiOutputExample(): MaterialGraph {
  return BasicNodeGraphExamples.createMultiOutputExample()
}
