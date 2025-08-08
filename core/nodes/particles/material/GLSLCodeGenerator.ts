// ============================================================================
// QAQ Engine - GLSL代码生成器 (GLSL Code Generator)
// ============================================================================

import { DataType } from './DataStructureDefinition'
import type { MaterialGraph, NodeInstance, ConnectionInstance } from './DataStructureDefinition'
import { typeConverter, nodeRegistry } from './TypeSystem'
import { ShaderMaterial, Vector2, Vector3, Color, Texture } from 'three'

/**
 * GLSL代码生成器
 * 将材质节点图编译成Three.js可用的着色器代码
 */
export class GLSLCodeGenerator {
  private graph: MaterialGraph
  private generatedFunctions: Set<string> = new Set()
  private uniforms: { [key: string]: any } = {}
  private varyings: string[] = []
  private attributes: string[] = []

  constructor(graph: MaterialGraph) {
    this.graph = graph
  }

  /**
   * 生成完整的着色器代码
   */
  generateShaders(): { vertexShader: string, fragmentShader: string, uniforms: any } {
    this.reset()
    
    // 分析图结构
    const outputNode = this.findOutputNode()
    if (!outputNode) {
      throw new Error('未找到输出节点')
    }

    // 构建依赖图
    const dependencies = this.buildDependencyGraph()
    
    // 生成代码
    const vertexShader = this.generateVertexShader()
    const fragmentShader = this.generateFragmentShader(outputNode, dependencies)
    
    return {
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms
    }
  }

  /**
   * 重置生成器状态
   */
  private reset(): void {
    this.generatedFunctions.clear()
    this.uniforms = {}
    this.varyings = []
    this.attributes = []
  }

  /**
   * 查找输出节点
   */
  private findOutputNode(): NodeInstance | null {
    return this.graph.nodes.find(node => 
      node.data.nodeType.toString().includes('OUTPUT')
    ) || null
  }

  /**
   * 构建依赖图
   */
  private buildDependencyGraph(): Map<string, string[]> {
    const dependencies = new Map<string, string[]>()
    
    for (const connection of this.graph.connections) {
      if (!dependencies.has(connection.target)) {
        dependencies.set(connection.target, [])
      }
      dependencies.get(connection.target)!.push(connection.source)
    }
    
    return dependencies
  }

  /**
   * 生成顶点着色器
   */
  private generateVertexShader(): string {
    // 基础顶点着色器，支持粒子实例化
    return `
      // 基础属性
      attribute vec3 position;
      attribute vec2 uv;
      
      // 实例化属性
      attribute vec3 instancePosition;
      attribute vec4 instanceColor;
      attribute float instanceSize;
      attribute float instanceAge;
      attribute float instanceLifetime;
      attribute vec3 instanceVelocity;
      attribute float instanceRotation;
      
      // 矩阵
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform vec3 cameraPosition;
      
      // 时间
      uniform float uTime;
      uniform float uDeltaTime;
      
      // 传递给片段着色器的变量
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vParticleAge;
      varying float vParticleLifetime;
      varying vec3 vParticleVelocity;
      
      void main() {
        // 基础UV
        vUv = uv;
        
        // 粒子属性
        vColor = instanceColor;
        vParticleAge = instanceAge / instanceLifetime; // 归一化年龄
        vParticleLifetime = instanceLifetime;
        vParticleVelocity = instanceVelocity;
        
        // 广告牌效果（粒子始终面向相机）
        vec3 cameraDirection = normalize(cameraPosition - instancePosition);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, cameraDirection));
        vec3 actualUp = cross(cameraDirection, right);
        
        // 应用旋转
        float c = cos(instanceRotation);
        float s = sin(instanceRotation);
        mat2 rotMatrix = mat2(c, -s, s, c);
        vec2 rotatedPos = rotMatrix * position.xy;
        
        // 构建广告牌矩阵
        mat3 billboardMatrix = mat3(right, actualUp, cameraDirection);
        
        // 计算世界位置
        vec3 worldOffset = billboardMatrix * vec3(rotatedPos * instanceSize, 0.0);
        vec3 worldPosition = instancePosition + worldOffset;
        
        vWorldPosition = worldPosition;
        vPosition = (modelViewMatrix * vec4(worldPosition, 1.0)).xyz;
        vViewPosition = -vPosition;
        vNormal = normalize(mat3(modelViewMatrix) * cameraDirection);
        
        // 最终位置
        gl_Position = projectionMatrix * vec4(vPosition, 1.0);
      }
    `
  }

  /**
   * 生成片段着色器
   */
  private generateFragmentShader(outputNode: NodeInstance, dependencies: Map<string, string[]>): string {
    const functions: string[] = []
    const mainCode: string[] = []
    
    // 添加基础varying声明
    const varyingDeclarations = `
      varying vec2 vUv;
      varying vec4 vColor;
      varying vec3 vPosition;
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vParticleAge;
      varying float vParticleLifetime;
      varying vec3 vParticleVelocity;
    `
    
    // 添加时间uniform
    this.uniforms.uTime = { value: 0.0 }
    this.uniforms.uDeltaTime = { value: 0.016 }
    
    // 生成节点函数
    const processedNodes = new Set<string>()
    this.generateNodeFunctions(outputNode.id, dependencies, processedNodes, functions, mainCode)
    
    // 构建完整的片段着色器
    const uniformDeclarations = this.generateUniformDeclarations()
    const functionDeclarations = functions.join('\n\n')
    const mainFunction = this.generateMainFunction(mainCode, outputNode)
    
    return `
      precision highp float;
      
      ${uniformDeclarations}
      
      ${varyingDeclarations}
      
      ${functionDeclarations}
      
      ${mainFunction}
    `
  }

  /**
   * 递归生成节点函数
   */
  private generateNodeFunctions(
    nodeId: string, 
    dependencies: Map<string, string[]>, 
    processedNodes: Set<string>,
    functions: string[],
    mainCode: string[]
  ): void {
    if (processedNodes.has(nodeId)) return
    
    const node = this.graph.nodes.find(n => n.id === nodeId)
    if (!node) return
    
    // 先处理依赖节点
    const deps = dependencies.get(nodeId) || []
    for (const depId of deps) {
      this.generateNodeFunctions(depId, dependencies, processedNodes, functions, mainCode)
    }
    
    // 生成当前节点的代码
    this.generateSingleNodeCode(node, functions, mainCode)
    processedNodes.add(nodeId)
  }

  /**
   * 生成单个节点的代码
   */
  private generateSingleNodeCode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    const nodeType = node.data.nodeType.toString()
    
    switch (nodeType) {
      case 'time':
        this.generateTimeNode(node, functions, mainCode)
        break
      case 'uv_coordinate':
        this.generateUVNode(node, functions, mainCode)
        break
      case 'uv_panner':
        this.generateUVPannerNode(node, functions, mainCode)
        break
      case 'texture_sample':
        this.generateTextureNode(node, functions, mainCode)
        break
      case 'particle_age':
        this.generateParticleAgeNode(node, functions, mainCode)
        break
      case 'color_ramp':
        this.generateColorRampNode(node, functions, mainCode)
        break
      case 'multiply':
        this.generateMultiplyNode(node, functions, mainCode)
        break
      case 'simple_noise':
        this.generateNoiseNode(node, functions, mainCode)
        break
      default:
        this.generateGenericNode(node, functions, mainCode)
    }
  }

  /**
   * 生成时间节点代码
   */
  private generateTimeNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    if (!this.generatedFunctions.has('getTime')) {
      functions.push(`
        float getTime() {
          return uTime;
        }
        
        float getSinTime() {
          return sin(uTime);
        }
        
        float getCosTime() {
          return cos(uTime);
        }
      `)
      this.generatedFunctions.add('getTime')
    }
    
    mainCode.push(`float node_${node.id}_time = getTime();`)
  }

  /**
   * 生成UV坐标节点代码
   */
  private generateUVNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    mainCode.push(`vec2 node_${node.id}_uv = vUv;`)
  }

  /**
   * 生成UV流动节点代码
   */
  private generateUVPannerNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    if (!this.generatedFunctions.has('uvPanner')) {
      functions.push(`
        vec2 uvPanner(vec2 uv, float time, vec2 speed) {
          return uv + time * speed;
        }
      `)
      this.generatedFunctions.add('uvPanner')
    }
    
    const speed = node.data.inputValues.speed || [0.1, 0.1]
    const uvInput = this.getInputValue(node, 'uv')
    const timeInput = this.getInputValue(node, 'time')
    
    mainCode.push(`vec2 node_${node.id}_result = uvPanner(${uvInput}, ${timeInput}, vec2(${speed[0]}, ${speed[1]}));`)
  }

  /**
   * 生成纹理采样节点代码
   */
  private generateTextureNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    const textureName = node.data.inputValues.texture || 'defaultTexture'
    const uniformName = `u${node.id}Texture`
    
    // 添加纹理uniform
    this.uniforms[uniformName] = { value: null }
    
    const uvInput = this.getInputValue(node, 'uv')
    
    mainCode.push(`
      vec4 node_${node.id}_color = texture2D(${uniformName}, ${uvInput});
      float node_${node.id}_alpha = node_${node.id}_color.a;
    `)
  }

  /**
   * 生成粒子年龄节点代码
   */
  private generateParticleAgeNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    mainCode.push(`float node_${node.id}_age = vParticleAge;`)
  }

  /**
   * 生成颜色渐变节点代码
   */
  private generateColorRampNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    const colorStops = node.data.properties?.colorStops || [
      { position: 0.0, color: [1, 0, 0, 1] },
      { position: 1.0, color: [0, 0, 1, 1] }
    ]
    
    if (!this.generatedFunctions.has('colorRamp')) {
      functions.push(`
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
      this.generatedFunctions.add('colorRamp')
    }
    
    const factorInput = this.getInputValue(node, 'factor')
    
    // 生成颜色数组
    const colors = colorStops.map(stop => 
      `vec4(${stop.color[0]}, ${stop.color[1]}, ${stop.color[2]}, ${stop.color[3]})`
    ).join(', ')
    
    const positions = colorStops.map(stop => stop.position.toString()).join(', ')
    
    mainCode.push(`
      vec4 colors_${node.id}[${colorStops.length}] = vec4[${colorStops.length}](${colors});
      float positions_${node.id}[${colorStops.length}] = float[${colorStops.length}](${positions});
      vec4 node_${node.id}_color = colorRamp(${factorInput}, colors_${node.id}, positions_${node.id}, ${colorStops.length});
    `)
  }

  /**
   * 生成乘法节点代码
   */
  private generateMultiplyNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    const inputA = this.getInputValue(node, 'a')
    const inputB = this.getInputValue(node, 'b')
    
    mainCode.push(`vec4 node_${node.id}_result = ${inputA} * ${inputB};`)
  }

  /**
   * 生成噪声节点代码
   */
  private generateNoiseNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    if (!this.generatedFunctions.has('simpleNoise')) {
      functions.push(`
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
      `)
      this.generatedFunctions.add('simpleNoise')
    }
    
    const uvInput = this.getInputValue(node, 'uv')
    const scale = node.data.inputValues.scale || 1.0
    
    mainCode.push(`float node_${node.id}_noise = simpleNoise(${uvInput}, ${scale});`)
  }

  /**
   * 生成通用节点代码
   */
  private generateGenericNode(node: NodeInstance, functions: string[], mainCode: string[]): void {
    // 从节点属性中获取自定义GLSL代码
    const glslCode = node.data.properties?.glslCode
    if (glslCode && node.data.properties?.glslFunction) {
      const functionName = node.data.properties.glslFunction
      
      if (!this.generatedFunctions.has(functionName)) {
        functions.push(glslCode)
        this.generatedFunctions.add(functionName)
      }
    }
    
    // 生成默认输出
    mainCode.push(`vec4 node_${node.id}_result = vec4(1.0);`)
  }

  /**
   * 获取输入值
   */
  private getInputValue(node: NodeInstance, inputId: string): string {
    // 查找连接
    const connection = this.graph.connections.find(conn => 
      conn.target === node.id && conn.targetHandle === inputId
    )
    
    if (connection) {
      const sourceNode = this.graph.nodes.find(n => n.id === connection.source)
      if (sourceNode) {
        return `node_${connection.source}_${connection.sourceHandle}`
      }
    }
    
    // 使用默认值
    const defaultValue = node.data.inputValues[inputId]
    if (defaultValue !== undefined) {
      if (typeof defaultValue === 'number') {
        return defaultValue.toString()
      } else if (Array.isArray(defaultValue)) {
        if (defaultValue.length === 2) {
          return `vec2(${defaultValue[0]}, ${defaultValue[1]})`
        } else if (defaultValue.length === 3) {
          return `vec3(${defaultValue[0]}, ${defaultValue[1]}, ${defaultValue[2]})`
        } else if (defaultValue.length === 4) {
          return `vec4(${defaultValue[0]}, ${defaultValue[1]}, ${defaultValue[2]}, ${defaultValue[3]})`
        }
      }
    }
    
    return '0.0'
  }

  /**
   * 生成uniform声明
   */
  private generateUniformDeclarations(): string {
    const declarations: string[] = []
    
    // 基础uniforms
    declarations.push('uniform float uTime;')
    declarations.push('uniform float uDeltaTime;')
    
    // 纹理uniforms
    for (const [name, uniform] of Object.entries(this.uniforms)) {
      if (name.includes('Texture')) {
        declarations.push(`uniform sampler2D ${name};`)
      } else {
        declarations.push(`uniform float ${name};`)
      }
    }
    
    return declarations.join('\n')
  }

  /**
   * 生成主函数
   */
  private generateMainFunction(mainCode: string[], outputNode: NodeInstance): string {
    const nodeCode = mainCode.join('\n  ')
    
    // 获取输出节点的输入
    const baseColorInput = this.getInputValue(outputNode, 'baseColor')
    const emissiveInput = this.getInputValue(outputNode, 'emissive')
    const alphaInput = this.getInputValue(outputNode, 'alpha')
    
    return `
      void main() {
        ${nodeCode}
        
        // 最终输出
        vec4 finalColor = ${baseColorInput};
        vec4 emissive = ${emissiveInput};
        float alpha = ${alphaInput};
        
        // 合并颜色
        finalColor.rgb += emissive.rgb;
        finalColor.a *= alpha;
        
        // Alpha测试
        if (finalColor.a < 0.001) discard;
        
        gl_FragColor = finalColor;
      }
    `
  }

  /**
   * 创建Three.js材质
   */
  createThreeMaterial(): ShaderMaterial {
    const { vertexShader, fragmentShader, uniforms } = this.generateShaders()
    
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: true
    })
  }
}
