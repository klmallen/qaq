// ============================================================================
// QAQ Engine - 材质节点连连看示例 (Material Node Graph Examples)
// ============================================================================

import {
  DataType,
  NodeType,
  NodeCategory
} from './DataStructureDefinition'
import type {
  MaterialGraph,
  NodeInstance,
  ConnectionInstance
} from './DataStructureDefinition'

/**
 * Unity风格特效节点类型
 */
export enum UnityEffectNodeType {
  // 时间节点
  TIME = 'time',
  SINE_TIME = 'sine_time',
  COSINE_TIME = 'cosine_time',
  
  // UV操作节点
  UV_COORDINATE = 'uv_coordinate',
  UV_PANNER = 'uv_panner',
  UV_ROTATOR = 'uv_rotator',
  UV_SCALER = 'uv_scaler',
  UV_TILING_OFFSET = 'uv_tiling_offset',
  
  // 纹理节点
  TEXTURE_SAMPLE = 'texture_sample',
  TEXTURE_SAMPLE_2D_LOD = 'texture_sample_2d_lod',
  
  // 噪声节点
  SIMPLE_NOISE = 'simple_noise',
  GRADIENT_NOISE = 'gradient_noise',
  VORONOI = 'voronoi',
  
  // 数学节点
  FRESNEL = 'fresnel',
  POWER = 'power',
  STEP = 'step',
  SMOOTHSTEP = 'smoothstep',
  REMAP = 'remap',
  
  // 粒子专用节点
  PARTICLE_AGE = 'particle_age',
  PARTICLE_VELOCITY = 'particle_velocity',
  VERTEX_COLOR = 'vertex_color',
  
  // 特效节点
  DISSOLVE = 'dissolve',
  DISTORTION = 'distortion',
  FLOW_MAP = 'flow_map'
}

/**
 * 材质节点图示例：UV流动火焰效果
 */
export function createUVFlowFireExample(): MaterialGraph {
  const nodes: NodeInstance[] = [
    // 时间节点
    {
      id: 'time_node',
      type: 'time',
      position: { x: 0, y: 0 },
      data: {
        label: 'Time',
        nodeType: NodeType.INPUT_FLOAT,
        inputValues: {},
        outputValues: { time: 0 },
        inputConnections: {},
        outputConnections: { time: 2 },
        properties: {
          glslCode: 'uniform float uTime;',
          glslFunction: 'getTime',
          outputValue: 'uTime'
        }
      }
    },

    // UV坐标节点
    {
      id: 'uv_node',
      type: 'uv_coordinate',
      position: { x: 0, y: 100 },
      data: {
        label: 'UV Coordinate',
        nodeType: NodeType.INPUT_VECTOR3,
        inputValues: {},
        outputValues: { uv: [0, 0] },
        inputConnections: {},
        outputConnections: { uv: 1 },
        properties: {
          glslCode: 'varying vec2 vUv;',
          glslFunction: 'getUV',
          outputValue: 'vUv'
        }
      }
    },

    // UV流动节点（Panner）
    {
      id: 'uv_panner',
      type: 'uv_panner',
      position: { x: 200, y: 50 },
      data: {
        label: 'UV Panner',
        nodeType: NodeType.MATH_ADD,
        inputValues: {
          speed: [0.1, 0.2] // X和Y方向的流动速度
        },
        outputValues: { result: [0, 0] },
        inputConnections: { uv: true, time: true },
        outputConnections: { result: 1 },
        properties: {
          glslFunction: 'uvPanner',
          glslCode: `
            vec2 uvPanner(vec2 uv, float time, vec2 speed) {
              return uv + time * speed;
            }
          `
        }
      }
    },

    // 火焰纹理节点
    {
      id: 'fire_texture',
      type: 'texture_sample',
      position: { x: 400, y: 50 },
      data: {
        label: 'Fire Texture',
        nodeType: NodeType.TEXTURE_SAMPLE,
        inputValues: {
          texture: 'fire_texture.jpg'
        },
        outputValues: { color: [1, 1, 1, 1] },
        inputConnections: { uv: true },
        outputConnections: { color: 1, alpha: 1 },
        properties: {
          glslFunction: 'sampleTexture',
          glslCode: `
            uniform sampler2D uFireTexture;
            vec4 sampleTexture(vec2 uv) {
              return texture2D(uFireTexture, uv);
            }
          `
        }
      }
    },

    // 粒子年龄节点
    {
      id: 'particle_age',
      type: 'particle_age',
      position: { x: 0, y: 200 },
      data: {
        label: 'Particle Age',
        nodeType: NodeType.PARTICLE_AGE,
        inputValues: {},
        outputValues: { age: 0 },
        inputConnections: {},
        outputConnections: { age: 1 },
        properties: {
          glslCode: 'varying float vParticleAge;',
          glslFunction: 'getParticleAge',
          outputValue: 'vParticleAge'
        }
      }
    },

    // 颜色渐变节点
    {
      id: 'color_ramp',
      type: 'color_ramp',
      position: { x: 200, y: 200 },
      data: {
        label: 'Fire Color Ramp',
        nodeType: NodeType.COLOR_RAMP,
        inputValues: {},
        outputValues: { color: [1, 1, 1, 1] },
        inputConnections: { factor: true },
        outputConnections: { color: 1 },
        properties: {
          colorStops: [
            { position: 0.0, color: [1, 1, 0, 1] },    // 黄色
            { position: 0.5, color: [1, 0.5, 0, 1] },  // 橙色
            { position: 1.0, color: [1, 0, 0, 0.2] }   // 红色透明
          ],
          glslFunction: 'fireColorRamp',
          glslCode: `
            vec4 fireColorRamp(float factor) {
              factor = clamp(factor, 0.0, 1.0);
              
              if (factor < 0.5) {
                float t = factor * 2.0;
                return mix(vec4(1.0, 1.0, 0.0, 1.0), vec4(1.0, 0.5, 0.0, 1.0), t);
              } else {
                float t = (factor - 0.5) * 2.0;
                return mix(vec4(1.0, 0.5, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 0.2), t);
              }
            }
          `
        }
      }
    },

    // 乘法节点（纹理 × 颜色）
    {
      id: 'multiply_node',
      type: 'multiply',
      position: { x: 600, y: 125 },
      data: {
        label: 'Multiply',
        nodeType: NodeType.MATH_MULTIPLY,
        inputValues: {},
        outputValues: { result: [1, 1, 1, 1] },
        inputConnections: { a: true, b: true },
        outputConnections: { result: 1 },
        properties: {
          glslFunction: 'multiply',
          glslCode: `
            vec4 multiply(vec4 a, vec4 b) {
              return a * b;
            }
          `
        }
      }
    },

    // 粒子输出节点
    {
      id: 'particle_output',
      type: 'particle_output',
      position: { x: 800, y: 125 },
      data: {
        label: 'Particle Output',
        nodeType: NodeType.PARTICLE_OUTPUT,
        inputValues: {},
        outputValues: {},
        inputConnections: {
          baseColor: true,
          emissive: false,
          alpha: false,
          size: false
        },
        outputConnections: {},
        properties: {}
      }
    }
  ]

  const connections: ConnectionInstance[] = [
    // 时间 → UV流动
    {
      id: 'time_to_panner',
      source: 'time_node',
      target: 'uv_panner',
      sourceHandle: 'time',
      targetHandle: 'time',
      dataType: DataType.FLOAT
    },

    // UV坐标 → UV流动
    {
      id: 'uv_to_panner',
      source: 'uv_node',
      target: 'uv_panner',
      sourceHandle: 'uv',
      targetHandle: 'uv',
      dataType: DataType.VEC2
    },

    // UV流动 → 纹理采样
    {
      id: 'panner_to_texture',
      source: 'uv_panner',
      target: 'fire_texture',
      sourceHandle: 'result',
      targetHandle: 'uv',
      dataType: DataType.VEC2
    },

    // 粒子年龄 → 颜色渐变
    {
      id: 'age_to_ramp',
      source: 'particle_age',
      target: 'color_ramp',
      sourceHandle: 'age',
      targetHandle: 'factor',
      dataType: DataType.FLOAT
    },

    // 纹理 → 乘法
    {
      id: 'texture_to_multiply',
      source: 'fire_texture',
      target: 'multiply_node',
      sourceHandle: 'color',
      targetHandle: 'a',
      dataType: DataType.COLOR
    },

    // 颜色渐变 → 乘法
    {
      id: 'ramp_to_multiply',
      source: 'color_ramp',
      target: 'multiply_node',
      sourceHandle: 'color',
      targetHandle: 'b',
      dataType: DataType.COLOR
    },

    // 乘法结果 → 输出
    {
      id: 'multiply_to_output',
      source: 'multiply_node',
      target: 'particle_output',
      sourceHandle: 'result',
      targetHandle: 'baseColor',
      dataType: DataType.COLOR
    }
  ]

  return {
    id: 'uv_flow_fire_graph',
    name: 'UV Flow Fire Effect',
    description: 'UV流动火焰特效',
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
 * 溶解效果示例
 */
export function createDissolveExample(): MaterialGraph {
  const nodes: NodeInstance[] = [
    // 噪声纹理节点
    {
      id: 'noise_texture',
      type: 'texture_sample',
      position: { x: 0, y: 0 },
      data: {
        label: 'Noise Texture',
        nodeType: NodeType.TEXTURE_SAMPLE,
        inputValues: { texture: 'noise.jpg' },
        outputValues: { color: [1, 1, 1, 1] },
        inputConnections: { uv: false },
        outputConnections: { color: 1 },
        properties: {
          glslFunction: 'sampleNoise',
          glslCode: `
            uniform sampler2D uNoiseTexture;
            vec4 sampleNoise(vec2 uv) {
              return texture2D(uNoiseTexture, uv);
            }
          `
        }
      }
    },

    // 溶解阈值节点
    {
      id: 'dissolve_threshold',
      type: 'input_float',
      position: { x: 0, y: 100 },
      data: {
        label: 'Dissolve Threshold',
        nodeType: NodeType.INPUT_FLOAT,
        inputValues: { value: 0.5 },
        outputValues: { value: 0.5 },
        inputConnections: {},
        outputConnections: { value: 1 },
        properties: {
          glslCode: 'uniform float uDissolveThreshold;',
          outputValue: 'uDissolveThreshold'
        }
      }
    },

    // Step函数节点
    {
      id: 'step_node',
      type: 'step',
      position: { x: 200, y: 50 },
      data: {
        label: 'Step',
        nodeType: NodeType.MATH_CLAMP,
        inputValues: {},
        outputValues: { result: 0 },
        inputConnections: { edge: true, x: true },
        outputConnections: { result: 1 },
        properties: {
          glslFunction: 'stepFunction',
          glslCode: `
            float stepFunction(float edge, float x) {
              return step(edge, x);
            }
          `
        }
      }
    },

    // 粒子输出
    {
      id: 'output',
      type: 'particle_output',
      position: { x: 400, y: 50 },
      data: {
        label: 'Output',
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
      id: 'noise_to_step',
      source: 'noise_texture',
      target: 'step_node',
      sourceHandle: 'color',
      targetHandle: 'x',
      dataType: DataType.COLOR
    },
    {
      id: 'threshold_to_step',
      source: 'dissolve_threshold',
      target: 'step_node',
      sourceHandle: 'value',
      targetHandle: 'edge',
      dataType: DataType.FLOAT
    },
    {
      id: 'step_to_output',
      source: 'step_node',
      target: 'output',
      sourceHandle: 'result',
      targetHandle: 'alpha',
      dataType: DataType.FLOAT
    }
  ]

  return {
    id: 'dissolve_graph',
    name: 'Dissolve Effect',
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
 * Unity风格节点定义
 */
export const UnityStyleNodeDefinitions = {
  // 时间节点
  [UnityEffectNodeType.TIME]: {
    name: 'Time',
    category: NodeCategory.INPUT,
    inputs: [],
    outputs: [
      { id: 'time', name: 'Time', type: DataType.FLOAT },
      { id: 'sinTime', name: 'Sin Time', type: DataType.FLOAT },
      { id: 'cosTime', name: 'Cos Time', type: DataType.FLOAT },
      { id: 'deltaTime', name: 'Delta Time', type: DataType.FLOAT }
    ],
    glslCode: `
      uniform float uTime;
      uniform float uDeltaTime;
      
      float getTime() { return uTime; }
      float getSinTime() { return sin(uTime); }
      float getCosTime() { return cos(uTime); }
      float getDeltaTime() { return uDeltaTime; }
    `
  },

  // UV流动节点
  [UnityEffectNodeType.UV_PANNER]: {
    name: 'UV Panner',
    category: NodeCategory.UTILITY,
    inputs: [
      { id: 'uv', name: 'UV', type: DataType.VEC2 },
      { id: 'time', name: 'Time', type: DataType.FLOAT },
      { id: 'speed', name: 'Speed', type: DataType.VEC2, defaultValue: [0.1, 0.1] }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: DataType.VEC2 }
    ],
    glslCode: `
      vec2 uvPanner(vec2 uv, float time, vec2 speed) {
        return uv + time * speed;
      }
    `
  },

  // UV旋转节点
  [UnityEffectNodeType.UV_ROTATOR]: {
    name: 'UV Rotator',
    category: NodeCategory.UTILITY,
    inputs: [
      { id: 'uv', name: 'UV', type: DataType.VEC2 },
      { id: 'center', name: 'Center', type: DataType.VEC2, defaultValue: [0.5, 0.5] },
      { id: 'rotation', name: 'Rotation', type: DataType.FLOAT, defaultValue: 0 }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: DataType.VEC2 }
    ],
    glslCode: `
      vec2 uvRotator(vec2 uv, vec2 center, float rotation) {
        float c = cos(rotation);
        float s = sin(rotation);
        mat2 rotMatrix = mat2(c, -s, s, c);
        return rotMatrix * (uv - center) + center;
      }
    `
  },

  // 简单噪声节点
  [UnityEffectNodeType.SIMPLE_NOISE]: {
    name: 'Simple Noise',
    category: NodeCategory.UTILITY,
    inputs: [
      { id: 'uv', name: 'UV', type: DataType.VEC2 },
      { id: 'scale', name: 'Scale', type: DataType.FLOAT, defaultValue: 1.0 }
    ],
    outputs: [
      { id: 'noise', name: 'Noise', type: DataType.FLOAT }
    ],
    glslCode: `
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float simpleNoise(vec2 uv, float scale) {
        vec2 p = uv * scale;
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
    `
  },

  // Fresnel节点
  [UnityEffectNodeType.FRESNEL]: {
    name: 'Fresnel',
    category: NodeCategory.UTILITY,
    inputs: [
      { id: 'normal', name: 'Normal', type: DataType.VEC3 },
      { id: 'viewDir', name: 'View Dir', type: DataType.VEC3 },
      { id: 'power', name: 'Power', type: DataType.FLOAT, defaultValue: 1.0 }
    ],
    outputs: [
      { id: 'fresnel', name: 'Fresnel', type: DataType.FLOAT }
    ],
    glslCode: `
      float fresnelEffect(vec3 normal, vec3 viewDir, float power) {
        float fresnel = dot(normal, viewDir);
        fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
        return pow(fresnel, power);
      }
    `
  },

  // 重映射节点
  [UnityEffectNodeType.REMAP]: {
    name: 'Remap',
    category: NodeCategory.MATH,
    inputs: [
      { id: 'input', name: 'Input', type: DataType.FLOAT },
      { id: 'inMin', name: 'In Min', type: DataType.FLOAT, defaultValue: 0.0 },
      { id: 'inMax', name: 'In Max', type: DataType.FLOAT, defaultValue: 1.0 },
      { id: 'outMin', name: 'Out Min', type: DataType.FLOAT, defaultValue: 0.0 },
      { id: 'outMax', name: 'Out Max', type: DataType.FLOAT, defaultValue: 1.0 }
    ],
    outputs: [
      { id: 'result', name: 'Result', type: DataType.FLOAT }
    ],
    glslCode: `
      float remap(float input, float inMin, float inMax, float outMin, float outMax) {
        float t = clamp((input - inMin) / (inMax - inMin), 0.0, 1.0);
        return mix(outMin, outMax, t);
      }
    `
  }
}

/**
 * 复杂水流效果示例
 */
export function createWaterFlowExample(): MaterialGraph {
  // 这里会创建一个包含多个UV操作、噪声、时间动画的复杂水流效果
  // 包括：主UV流动、细节噪声、法线扰动、菲涅尔反射等
  
  return {
    id: 'water_flow_graph',
    name: 'Water Flow Effect',
    description: '复杂水流特效，包含UV流动、噪声扰动、菲涅尔效果',
    nodes: [], // 实际实现会包含10+个节点
    connections: [],
    metadata: {
      version: '1.0.0',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      nodeCount: 0,
      connectionCount: 0
    },
    settings: {
      autoCompile: true,
      enableOptimization: true,
      targetShaderModel: 'webgl2',
      enableDebugging: false
    }
  }
}
