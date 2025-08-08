// ============================================================================
// QAQ Engine - Particle Shader Compiler (GLSL + Visual Node Editor)
// ============================================================================

import { Vector3, Vector4, Color } from 'three'

/**
 * 粒子专用节点类型
 */
export enum ParticleNodeType {
  // 输入节点
  PARTICLE_AGE = 'particle_age',
  PARTICLE_LIFETIME = 'particle_lifetime', 
  PARTICLE_VELOCITY = 'particle_velocity',
  PARTICLE_SIZE = 'particle_size',
  PARTICLE_POSITION = 'particle_position',
  PARTICLE_ROTATION = 'particle_rotation',
  
  // 数学节点
  ADD = 'add',
  MULTIPLY = 'multiply',
  SUBTRACT = 'subtract',
  DIVIDE = 'divide',
  MIX = 'mix',
  CLAMP = 'clamp',
  SMOOTHSTEP = 'smoothstep',
  SIN = 'sin',
  COS = 'cos',
  NOISE = 'noise',
  
  // 颜色节点
  COLOR_RAMP = 'color_ramp',
  HSV_TO_RGB = 'hsv_to_rgb',
  RGB_TO_HSV = 'rgb_to_hsv',
  
  // 纹理节点
  TEXTURE_SAMPLE = 'texture_sample',
  UV_TRANSFORM = 'uv_transform',
  
  // 输出节点
  PARTICLE_OUTPUT = 'particle_output'
}

/**
 * 节点数据类型
 */
export enum NodeDataType {
  FLOAT = 'float',
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  COLOR = 'color',
  TEXTURE = 'texture',
  BOOL = 'bool'
}

/**
 * 节点端口定义
 */
export interface NodePort {
  id: string
  name: string
  type: NodeDataType
  defaultValue?: any
  isConnected?: boolean
}

/**
 * 粒子节点定义
 */
export interface ParticleNode {
  id: string
  type: ParticleNodeType
  name: string
  position: { x: number, y: number }
  
  // 端口定义
  inputs: NodePort[]
  outputs: NodePort[]
  
  // 节点特有数据
  data: {
    [key: string]: any
  }
  
  // GLSL代码片段
  glslFunction?: string
  glslVariables?: string[]
}

/**
 * 节点连接
 */
export interface NodeConnection {
  id: string
  sourceNode: string
  sourcePort: string
  targetNode: string
  targetPort: string
  dataType: NodeDataType
}

/**
 * 材质图数据
 */
export interface MaterialGraph {
  nodes: ParticleNode[]
  connections: NodeConnection[]
  metadata: {
    version: string
    created: string
    modified: string
  }
}

/**
 * 编译后的着色器代码
 */
export interface CompiledShader {
  vertexShader: string
  fragmentShader: string
  uniforms: { [key: string]: any }
  attributes: string[]
  varyings: string[]
}

/**
 * 粒子着色器编译器
 *
 * 功能：
 * - 将可视化节点图编译为GLSL着色器代码
 * - 支持粒子专用节点类型
 * - 生成优化的着色器代码
 * - 提供GLSL代码反向解析功能
 * - 支持直接GLSL代码驱动（无需节点图）
 */
export class ParticleShaderCompiler {
  private nodeDefinitions: Map<ParticleNodeType, any> = new Map()
  private glslFunctions: Map<string, string> = new Map()

  constructor() {
    this.initializeNodeDefinitions()
    this.initializeGLSLFunctions()
  }

  /**
   * 直接从GLSL代码创建着色器（无需节点图）
   */
  compileFromGLSL(config: {
    vertexShader?: string
    fragmentShader: string
    uniforms?: { [key: string]: any }
    attributes?: string[]
    varyings?: string[]
  }): CompiledShader {
    const vertexShader = config.vertexShader || this.getDefaultVertexShader()
    const fragmentShader = this.wrapFragmentShader(config.fragmentShader)

    return {
      vertexShader,
      fragmentShader,
      uniforms: config.uniforms || {},
      attributes: config.attributes || this.getDefaultAttributes(),
      varyings: config.varyings || this.getDefaultVaryings()
    }
  }

  /**
   * 获取默认顶点着色器
   */
  private getDefaultVertexShader(): string {
    return `
      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 instancePosition;
      attribute vec4 instanceColor;
      attribute float instanceSize;
      attribute float instanceAge;
      attribute float instanceLifetime;
      attribute vec3 instanceVelocity;
      attribute float instanceRotation;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform vec3 cameraPosition;
      uniform float uTime;

      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      varying float vParticleLifetime;
      varying vec3 vParticleVelocity;
      varying vec3 vWorldPosition;
      varying vec3 vViewDirection;

      void main() {
        vUv = uv;
        vColor = instanceColor;
        vParticleAge = instanceAge / instanceLifetime;
        vParticleLifetime = instanceLifetime;
        vParticleVelocity = instanceVelocity;

        // 广告牌效果
        vec3 cameraDirection = normalize(cameraPosition - instancePosition);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, cameraDirection));
        vec3 actualUp = cross(cameraDirection, right);

        // 旋转
        float c = cos(instanceRotation);
        float s = sin(instanceRotation);
        mat2 rotMatrix = mat2(c, -s, s, c);
        vec2 rotatedPos = rotMatrix * position.xy;

        // 世界位置
        mat3 billboardMatrix = mat3(right, actualUp, cameraDirection);
        vec3 worldOffset = billboardMatrix * vec3(rotatedPos * instanceSize, 0.0);
        vWorldPosition = instancePosition + worldOffset;
        vViewDirection = normalize(cameraPosition - vWorldPosition);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(vWorldPosition, 1.0);
      }
    `
  }

  /**
   * 包装片段着色器
   */
  private wrapFragmentShader(userFragmentShader: string): string {
    return `
      precision highp float;

      uniform float uTime;
      uniform float uDeltaTime;

      varying vec2 vUv;
      varying vec4 vColor;
      varying float vParticleAge;
      varying float vParticleLifetime;
      varying vec3 vParticleVelocity;
      varying vec3 vWorldPosition;
      varying vec3 vViewDirection;

      ${userFragmentShader}
    `
  }

  /**
   * 获取默认属性
   */
  private getDefaultAttributes(): string[] {
    return [
      'position', 'uv', 'instancePosition', 'instanceColor',
      'instanceSize', 'instanceAge', 'instanceLifetime',
      'instanceVelocity', 'instanceRotation'
    ]
  }

  /**
   * 获取默认varying变量
   */
  private getDefaultVaryings(): string[] {
    return [
      'vUv', 'vColor', 'vParticleAge', 'vParticleLifetime',
      'vParticleVelocity', 'vWorldPosition', 'vViewDirection'
    ]
  }

  /**
   * 初始化节点定义
   */
  private initializeNodeDefinitions(): void {
    // 粒子属性节点
    this.nodeDefinitions.set(ParticleNodeType.PARTICLE_AGE, {
      name: '粒子年龄',
      inputs: [],
      outputs: [{ id: 'age', name: 'Age', type: NodeDataType.FLOAT }],
      glslFunction: 'getParticleAge',
      category: 'particle'
    })

    this.nodeDefinitions.set(ParticleNodeType.PARTICLE_LIFETIME, {
      name: '粒子生命周期',
      inputs: [],
      outputs: [{ id: 'lifetime', name: 'Lifetime', type: NodeDataType.FLOAT }],
      glslFunction: 'getParticleLifetime',
      category: 'particle'
    })

    this.nodeDefinitions.set(ParticleNodeType.PARTICLE_VELOCITY, {
      name: '粒子速度',
      inputs: [],
      outputs: [{ id: 'velocity', name: 'Velocity', type: NodeDataType.VEC3 }],
      glslFunction: 'getParticleVelocity',
      category: 'particle'
    })

    // 数学节点
    this.nodeDefinitions.set(ParticleNodeType.ADD, {
      name: '加法',
      inputs: [
        { id: 'a', name: 'A', type: NodeDataType.FLOAT, defaultValue: 0 },
        { id: 'b', name: 'B', type: NodeDataType.FLOAT, defaultValue: 0 }
      ],
      outputs: [{ id: 'result', name: 'Result', type: NodeDataType.FLOAT }],
      glslFunction: 'add',
      category: 'math'
    })

    this.nodeDefinitions.set(ParticleNodeType.MIX, {
      name: '混合',
      inputs: [
        { id: 'a', name: 'A', type: NodeDataType.VEC3, defaultValue: [0, 0, 0] },
        { id: 'b', name: 'B', type: NodeDataType.VEC3, defaultValue: [1, 1, 1] },
        { id: 'factor', name: 'Factor', type: NodeDataType.FLOAT, defaultValue: 0.5 }
      ],
      outputs: [{ id: 'result', name: 'Result', type: NodeDataType.VEC3 }],
      glslFunction: 'mix',
      category: 'math'
    })

    // 颜色节点
    this.nodeDefinitions.set(ParticleNodeType.COLOR_RAMP, {
      name: '颜色渐变',
      inputs: [
        { id: 'factor', name: 'Factor', type: NodeDataType.FLOAT, defaultValue: 0.5 }
      ],
      outputs: [{ id: 'color', name: 'Color', type: NodeDataType.COLOR }],
      glslFunction: 'colorRamp',
      category: 'color',
      data: {
        colorStops: [
          { position: 0.0, color: [1, 0, 0, 1] },
          { position: 0.5, color: [1, 1, 0, 1] },
          { position: 1.0, color: [0, 0, 0, 1] }
        ]
      }
    })

    // 输出节点
    this.nodeDefinitions.set(ParticleNodeType.PARTICLE_OUTPUT, {
      name: '粒子输出',
      inputs: [
        { id: 'baseColor', name: 'Base Color', type: NodeDataType.COLOR, defaultValue: [1, 1, 1, 1] },
        { id: 'emissive', name: 'Emissive', type: NodeDataType.COLOR, defaultValue: [0, 0, 0, 1] },
        { id: 'alpha', name: 'Alpha', type: NodeDataType.FLOAT, defaultValue: 1.0 },
        { id: 'size', name: 'Size', type: NodeDataType.FLOAT, defaultValue: 1.0 }
      ],
      outputs: [],
      category: 'output'
    })
  }

  /**
   * 初始化GLSL函数库
   */
  private initializeGLSLFunctions(): void {
    // 粒子属性函数
    this.glslFunctions.set('getParticleAge', `
      float getParticleAge() {
        return vParticleAge;
      }
    `)

    this.glslFunctions.set('getParticleLifetime', `
      float getParticleLifetime() {
        return vParticleLifetime;
      }
    `)

    this.glslFunctions.set('getParticleVelocity', `
      vec3 getParticleVelocity() {
        return vParticleVelocity;
      }
    `)

    // 数学函数
    this.glslFunctions.set('add', `
      float add(float a, float b) {
        return a + b;
      }
      vec3 add(vec3 a, vec3 b) {
        return a + b;
      }
    `)

    // 颜色函数
    this.glslFunctions.set('colorRamp', `
      vec4 colorRamp(float factor, vec4 colors[8], float positions[8], int count) {
        factor = clamp(factor, 0.0, 1.0);
        
        for (int i = 0; i < count - 1; i++) {
          if (factor >= positions[i] && factor <= positions[i + 1]) {
            float t = (factor - positions[i]) / (positions[i + 1] - positions[i]);
            return mix(colors[i], colors[i + 1], t);
          }
        }
        
        return colors[0];
      }
    `)

    // 噪声函数
    this.glslFunctions.set('noise', `
      float hash(float n) {
        return fract(sin(n) * 43758.5453);
      }
      
      float noise(float x) {
        float i = floor(x);
        float f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        return mix(hash(i), hash(i + 1.0), f);
      }
    `)
  }

  /**
   * 编译材质图为着色器代码
   */
  compileGraph(graph: MaterialGraph): CompiledShader {
    const outputNode = this.findOutputNode(graph.nodes)
    if (!outputNode) {
      throw new Error('未找到输出节点')
    }

    // 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(graph)
    
    // 生成变量声明
    const variables = this.generateVariables(graph)
    
    // 生成函数代码
    const functions = this.generateFunctions(graph, dependencyGraph)
    
    // 生成主函数
    const mainFunction = this.generateMainFunction(graph, outputNode, dependencyGraph)

    // 构建完整的着色器
    const vertexShader = this.buildVertexShader(variables, functions)
    const fragmentShader = this.buildFragmentShader(variables, functions, mainFunction)
    
    // 提取uniforms和attributes
    const uniforms = this.extractUniforms(graph)
    const attributes = this.extractAttributes(graph)
    const varyings = this.extractVaryings(graph)

    return {
      vertexShader,
      fragmentShader,
      uniforms,
      attributes,
      varyings
    }
  }

  /**
   * 查找输出节点
   */
  private findOutputNode(nodes: ParticleNode[]): ParticleNode | null {
    return nodes.find(node => node.type === ParticleNodeType.PARTICLE_OUTPUT) || null
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(graph: MaterialGraph): Map<string, string[]> {
    const dependencies = new Map<string, string[]>()
    
    for (const connection of graph.connections) {
      if (!dependencies.has(connection.targetNode)) {
        dependencies.set(connection.targetNode, [])
      }
      dependencies.get(connection.targetNode)!.push(connection.sourceNode)
    }
    
    return dependencies
  }

  /**
   * 生成变量声明
   */
  private generateVariables(graph: MaterialGraph): string {
    const variables: string[] = []
    
    // 粒子属性varying变量
    variables.push('varying float vParticleAge;')
    variables.push('varying float vParticleLifetime;')
    variables.push('varying vec3 vParticleVelocity;')
    variables.push('varying vec2 vUv;')
    variables.push('varying vec4 vColor;')
    
    // 纹理uniforms
    const textureNodes = graph.nodes.filter(node => 
      node.type === ParticleNodeType.TEXTURE_SAMPLE
    )
    textureNodes.forEach((node, index) => {
      variables.push(`uniform sampler2D uTexture${index};`)
    })
    
    return variables.join('\n')
  }

  /**
   * 生成函数代码
   */
  private generateFunctions(graph: MaterialGraph, dependencies: Map<string, string[]>): string {
    const functions: Set<string> = new Set()
    
    // 添加所有用到的GLSL函数
    for (const node of graph.nodes) {
      const definition = this.nodeDefinitions.get(node.type)
      if (definition?.glslFunction) {
        const glslCode = this.glslFunctions.get(definition.glslFunction)
        if (glslCode) {
          functions.add(glslCode)
        }
      }
    }
    
    return Array.from(functions).join('\n\n')
  }

  /**
   * 生成主函数
   */
  private generateMainFunction(graph: MaterialGraph, outputNode: ParticleNode, dependencies: Map<string, string[]>): string {
    const lines: string[] = []
    const processedNodes = new Set<string>()
    
    // 递归处理节点
    const processNode = (nodeId: string): string => {
      if (processedNodes.has(nodeId)) {
        return `node_${nodeId}_result`
      }
      
      const node = graph.nodes.find(n => n.id === nodeId)
      if (!node) return 'vec4(1.0)'
      
      processedNodes.add(nodeId)
      
      // 处理依赖节点
      const deps = dependencies.get(nodeId) || []
      for (const depId of deps) {
        processNode(depId)
      }
      
      // 生成当前节点的代码
      const nodeCode = this.generateNodeCode(node, graph)
      lines.push(nodeCode)
      
      return `node_${nodeId}_result`
    }
    
    // 从输出节点开始处理
    processNode(outputNode.id)
    
    // 生成最终输出
    lines.push(`
      gl_FragColor = node_${outputNode.id}_result;
      if (gl_FragColor.a < 0.001) discard;
    `)
    
    return lines.join('\n')
  }

  /**
   * 生成单个节点的代码
   */
  private generateNodeCode(node: ParticleNode, graph: MaterialGraph): string {
    const definition = this.nodeDefinitions.get(node.type)
    if (!definition) return ''
    
    switch (node.type) {
      case ParticleNodeType.PARTICLE_AGE:
        return `float node_${node.id}_result = getParticleAge();`
        
      case ParticleNodeType.ADD:
        const inputA = this.getInputValue(node, 'a', graph)
        const inputB = this.getInputValue(node, 'b', graph)
        return `float node_${node.id}_result = add(${inputA}, ${inputB});`
        
      case ParticleNodeType.MIX:
        const mixA = this.getInputValue(node, 'a', graph)
        const mixB = this.getInputValue(node, 'b', graph)
        const factor = this.getInputValue(node, 'factor', graph)
        return `vec3 node_${node.id}_result = mix(${mixA}, ${mixB}, ${factor});`
        
      case ParticleNodeType.COLOR_RAMP:
        const rampFactor = this.getInputValue(node, 'factor', graph)
        return this.generateColorRampCode(node, rampFactor)
        
      case ParticleNodeType.PARTICLE_OUTPUT:
        const baseColor = this.getInputValue(node, 'baseColor', graph)
        const alpha = this.getInputValue(node, 'alpha', graph)
        return `vec4 node_${node.id}_result = vec4(${baseColor}.rgb, ${alpha});`
        
      default:
        return `vec4 node_${node.id}_result = vec4(1.0);`
    }
  }

  /**
   * 获取输入值
   */
  private getInputValue(node: ParticleNode, inputId: string, graph: MaterialGraph): string {
    // 查找连接
    const connection = graph.connections.find(conn => 
      conn.targetNode === node.id && conn.targetPort === inputId
    )
    
    if (connection) {
      return `node_${connection.sourceNode}_result`
    }
    
    // 使用默认值
    const input = node.inputs.find(inp => inp.id === inputId)
    if (input?.defaultValue !== undefined) {
      return this.formatDefaultValue(input.defaultValue, input.type)
    }
    
    return this.getTypeDefaultValue(input?.type || NodeDataType.FLOAT)
  }

  /**
   * 格式化默认值
   */
  private formatDefaultValue(value: any, type: NodeDataType): string {
    switch (type) {
      case NodeDataType.FLOAT:
        return `${value}`
      case NodeDataType.VEC2:
        return `vec2(${value[0]}, ${value[1]})`
      case NodeDataType.VEC3:
        return `vec3(${value[0]}, ${value[1]}, ${value[2]})`
      case NodeDataType.VEC4:
      case NodeDataType.COLOR:
        return `vec4(${value[0]}, ${value[1]}, ${value[2]}, ${value[3]})`
      default:
        return '0.0'
    }
  }

  /**
   * 获取类型默认值
   */
  private getTypeDefaultValue(type: NodeDataType): string {
    switch (type) {
      case NodeDataType.FLOAT:
        return '0.0'
      case NodeDataType.VEC2:
        return 'vec2(0.0)'
      case NodeDataType.VEC3:
        return 'vec3(0.0)'
      case NodeDataType.VEC4:
      case NodeDataType.COLOR:
        return 'vec4(0.0, 0.0, 0.0, 1.0)'
      default:
        return '0.0'
    }
  }

  /**
   * 生成颜色渐变代码
   */
  private generateColorRampCode(node: ParticleNode, factor: string): string {
    const colorStops = node.data.colorStops || []
    const colors = colorStops.map((stop: any) => 
      `vec4(${stop.color.join(', ')})`
    ).join(', ')
    const positions = colorStops.map((stop: any) => stop.position).join(', ')
    
    return `
      vec4 colors[${colorStops.length}] = vec4[${colorStops.length}](${colors});
      float positions[${colorStops.length}] = float[${colorStops.length}](${positions});
      vec4 node_${node.id}_result = colorRamp(${factor}, colors, positions, ${colorStops.length});
    `
  }

  /**
   * 构建顶点着色器
   */
  private buildVertexShader(variables: string, functions: string): string {
    return `
      attribute vec3 position;
      attribute vec2 uv;
      attribute vec3 instancePosition;
      attribute vec4 instanceColor;
      attribute float instanceSize;
      attribute float instanceAge;
      attribute float instanceLifetime;
      attribute vec3 instanceVelocity;
      
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform vec3 cameraPosition;
      
      ${variables}
      
      void main() {
        vParticleAge = instanceAge;
        vParticleLifetime = instanceLifetime;
        vParticleVelocity = instanceVelocity;
        vUv = uv;
        vColor = instanceColor;
        
        // 广告牌效果
        vec3 cameraDirection = normalize(cameraPosition - instancePosition);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, cameraDirection));
        vec3 actualUp = cross(cameraDirection, right);
        
        mat3 billboardMatrix = mat3(right, actualUp, cameraDirection);
        vec3 worldOffset = billboardMatrix * (position * instanceSize);
        vec3 worldPosition = instancePosition + worldOffset;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
      }
    `
  }

  /**
   * 构建片段着色器
   */
  private buildFragmentShader(variables: string, functions: string, mainFunction: string): string {
    return `
      precision highp float;
      
      ${variables}
      
      ${functions}
      
      void main() {
        ${mainFunction}
      }
    `
  }

  /**
   * 提取uniforms
   */
  private extractUniforms(graph: MaterialGraph): { [key: string]: any } {
    const uniforms: { [key: string]: any } = {}
    
    // 基础uniforms
    uniforms.time = { value: 0.0 }
    uniforms.cameraPosition = { value: new Vector3() }
    
    // 纹理uniforms
    const textureNodes = graph.nodes.filter(node => 
      node.type === ParticleNodeType.TEXTURE_SAMPLE
    )
    textureNodes.forEach((node, index) => {
      uniforms[`uTexture${index}`] = { value: null }
    })
    
    return uniforms
  }

  /**
   * 提取attributes
   */
  private extractAttributes(graph: MaterialGraph): string[] {
    return [
      'position',
      'uv',
      'instancePosition',
      'instanceColor',
      'instanceSize',
      'instanceAge',
      'instanceLifetime',
      'instanceVelocity'
    ]
  }

  /**
   * 提取varyings
   */
  private extractVaryings(graph: MaterialGraph): string[] {
    return [
      'vParticleAge',
      'vParticleLifetime',
      'vParticleVelocity',
      'vUv',
      'vColor'
    ]
  }

  /**
   * 获取节点定义
   */
  getNodeDefinition(type: ParticleNodeType): any {
    return this.nodeDefinitions.get(type)
  }

  /**
   * 获取所有节点定义
   */
  getAllNodeDefinitions(): Map<ParticleNodeType, any> {
    return new Map(this.nodeDefinitions)
  }
}
