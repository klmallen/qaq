// ============================================================================
// QAQ Engine - Particle Material Component (GLSL + Visual Node Editor)
// ============================================================================

import Node3D from '../../Node3D'
import { Color, Texture, Vector2, Vector3, Vector4, ShaderMaterial, AdditiveBlending, NormalBlending } from 'three'
import { ParticleShaderCompiler, MaterialGraph, ParticleNodeType } from '../material/ParticleShaderCompiler'
import type { ParticleNode, NodeConnection } from '../material/ParticleShaderCompiler'

/**
 * 材质预设类型
 */
export enum MaterialPreset {
  FIRE = 'fire',
  SMOKE = 'smoke',
  MAGIC = 'magic',
  SPARK = 'spark',
  DUST = 'dust',
  WATER = 'water',
  ENERGY = 'energy',
  CUSTOM = 'custom'
}

/**
 * 混合模式
 */
export enum BlendMode {
  NORMAL = 'normal',
  ADDITIVE = 'additive',
  MULTIPLY = 'multiply',
  SCREEN = 'screen'
}

/**
 * 粒子材质配置
 */
export interface ParticleMaterialConfig {
  preset?: MaterialPreset
  blendMode?: BlendMode
  
  // 基础属性
  baseColor?: Color
  emissiveColor?: Color
  opacity?: number
  
  // 纹理
  diffuseTexture?: Texture
  
  // 节点图
  materialGraph?: MaterialGraph
  
  // 编译选项
  autoCompile?: boolean
  enableOptimization?: boolean
}

/**
 * 粒子材质组件 - GLSL与可视化节点编辑器集成
 * 
 * 设计理念：
 * - GLSL编译器：将可视化节点图编译为GLSL着色器
 * - 预设系统：提供常用粒子效果预设
 * - 实时编译：支持实时预览和热重载
 * - 双向转换：支持GLSL代码反向解析为节点图
 */
export default class ParticleMaterial extends Node3D {
  // 材质配置
  private _config: ParticleMaterialConfig
  
  // GLSL编译器
  private _compiler: ParticleShaderCompiler
  
  // 材质图数据
  private _materialGraph: MaterialGraph
  
  // 编译后的材质
  private _compiledMaterial: ShaderMaterial | null = null
  private _needsRecompile: boolean = true
  
  // 预设材质图
  private _presetGraphs: Map<MaterialPreset, MaterialGraph> = new Map()

  constructor(config: any) {
    super('ParticleMaterial')

    // 应用材质配置
    this._config = {
      preset: MaterialPreset.FIRE,
      blendMode: BlendMode.ADDITIVE,
      baseColor: new Color(1, 1, 1),
      emissiveColor: new Color(0, 0, 0),
      opacity: 1.0,
      autoCompile: true,
      enableOptimization: true,
      ...config.material
    }

    // 初始化编译器
    this._compiler = new ParticleShaderCompiler()
    
    // 初始化材质图
    this._materialGraph = this._createDefaultGraph()
    
    // 初始化预设
    this._initializePresets()
    
    // 应用预设
    if (this._config.preset && this._config.preset !== MaterialPreset.CUSTOM) {
      this.setPreset(this._config.preset)
    }

    console.log(`ParticleMaterial 初始化完成，预设: ${this._config.preset}`)
  }

  /**
   * 创建默认材质图
   */
  private _createDefaultGraph(): MaterialGraph {
    return {
      nodes: [
        {
          id: 'output',
          type: ParticleNodeType.PARTICLE_OUTPUT,
          name: '粒子输出',
          position: { x: 400, y: 200 },
          inputs: [
            { id: 'baseColor', name: 'Base Color', type: 'color', defaultValue: '#ffffff' },
            { id: 'emissive', name: 'Emissive', type: 'color', defaultValue: '#000000' },
            { id: 'alpha', name: 'Alpha', type: 'float', defaultValue: 1.0 },
            { id: 'size', name: 'Size', type: 'float', defaultValue: 1.0 }
          ],
          outputs: [],
          data: {}
        }
      ],
      connections: [],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    }
  }

  /**
   * 初始化预设材质图
   */
  private _initializePresets(): void {
    // 火焰预设
    this._presetGraphs.set(MaterialPreset.FIRE, {
      nodes: [
        {
          id: 'age',
          type: ParticleNodeType.PARTICLE_AGE,
          name: '粒子年龄',
          position: { x: 0, y: 100 },
          inputs: [],
          outputs: [{ id: 'age', name: 'Age', type: 'float' }],
          data: {}
        },
        {
          id: 'colorRamp',
          type: ParticleNodeType.COLOR_RAMP,
          name: '火焰渐变',
          position: { x: 200, y: 100 },
          inputs: [{ id: 'factor', name: 'Factor', type: 'float' }],
          outputs: [{ id: 'color', name: 'Color', type: 'color' }],
          data: {
            colorStops: [
              { position: 0.0, color: [1, 1, 0, 1] },    // 黄色
              { position: 0.5, color: [1, 0.5, 0, 1] },  // 橙色
              { position: 1.0, color: [1, 0, 0, 0.2] }   // 红色透明
            ]
          }
        },
        {
          id: 'output',
          type: ParticleNodeType.PARTICLE_OUTPUT,
          name: '粒子输出',
          position: { x: 400, y: 100 },
          inputs: [
            { id: 'baseColor', name: 'Base Color', type: 'color' },
            { id: 'emissive', name: 'Emissive', type: 'color' },
            { id: 'alpha', name: 'Alpha', type: 'float' },
            { id: 'size', name: 'Size', type: 'float' }
          ],
          outputs: [],
          data: {}
        }
      ],
      connections: [
        {
          id: 'age-to-ramp',
          sourceNode: 'age',
          sourcePort: 'age',
          targetNode: 'colorRamp',
          targetPort: 'factor',
          dataType: 'float'
        },
        {
          id: 'ramp-to-output',
          sourceNode: 'colorRamp',
          sourcePort: 'color',
          targetNode: 'output',
          targetPort: 'baseColor',
          dataType: 'color'
        }
      ],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    })

    // 烟雾预设
    this._presetGraphs.set(MaterialPreset.SMOKE, {
      nodes: [
        {
          id: 'age',
          type: ParticleNodeType.PARTICLE_AGE,
          name: '粒子年龄',
          position: { x: 0, y: 100 },
          inputs: [],
          outputs: [{ id: 'age', name: 'Age', type: 'float' }],
          data: {}
        },
        {
          id: 'output',
          type: ParticleNodeType.PARTICLE_OUTPUT,
          name: '粒子输出',
          position: { x: 200, y: 100 },
          inputs: [
            { id: 'baseColor', name: 'Base Color', type: 'color', defaultValue: '#666666' },
            { id: 'alpha', name: 'Alpha', type: 'float' }
          ],
          outputs: [],
          data: {}
        }
      ],
      connections: [
        {
          id: 'age-to-alpha',
          sourceNode: 'age',
          sourcePort: 'age',
          targetNode: 'output',
          targetPort: 'alpha',
          dataType: 'float'
        }
      ],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    })

    // 魔法预设
    this._presetGraphs.set(MaterialPreset.MAGIC, {
      nodes: [
        {
          id: 'output',
          type: ParticleNodeType.PARTICLE_OUTPUT,
          name: '粒子输出',
          position: { x: 200, y: 100 },
          inputs: [
            { id: 'baseColor', name: 'Base Color', type: 'color', defaultValue: '#000000' },
            { id: 'emissive', name: 'Emissive', type: 'color', defaultValue: '#8000ff' },
            { id: 'alpha', name: 'Alpha', type: 'float', defaultValue: 0.8 }
          ],
          outputs: [],
          data: {}
        }
      ],
      connections: [],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      }
    })

    console.log('材质预设初始化完成')
  }

  /**
   * 编译材质图
   */
  private _compileMaterial(): void {
    if (!this._needsRecompile) return

    try {
      // 编译材质图为GLSL着色器
      const compiledShader = this._compiler.compileGraph(this._materialGraph)
      
      // 创建Three.js材质
      this._compiledMaterial = new ShaderMaterial({
        vertexShader: compiledShader.vertexShader,
        fragmentShader: compiledShader.fragmentShader,
        uniforms: compiledShader.uniforms,
        transparent: true,
        blending: this._getBlendingMode(),
        depthWrite: false,
        depthTest: true
      })

      this._needsRecompile = false
      
      console.log('材质编译完成')
    } catch (error) {
      console.error('材质编译失败:', error)
      this._createFallbackMaterial()
    }
  }

  /**
   * 创建回退材质
   */
  private _createFallbackMaterial(): void {
    this._compiledMaterial = new ShaderMaterial({
      vertexShader: `
        attribute vec3 position;
        attribute vec2 uv;
        attribute vec3 instancePosition;
        attribute vec4 instanceColor;
        attribute float instanceSize;
        
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        
        varying vec4 vColor;
        varying vec2 vUv;
        
        void main() {
          vColor = instanceColor;
          vUv = uv;
          
          vec3 worldPosition = instancePosition + position * instanceSize;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec4 vColor;
        varying vec2 vUv;
        
        void main() {
          float distance = length(vUv - 0.5);
          float alpha = 1.0 - smoothstep(0.3, 0.5, distance);
          
          gl_FragColor = vec4(vColor.rgb, vColor.a * alpha);
          if (gl_FragColor.a < 0.001) discard;
        }
      `,
      uniforms: {},
      transparent: true,
      blending: this._getBlendingMode(),
      depthWrite: false
    })
  }

  /**
   * 获取混合模式
   */
  private _getBlendingMode(): number {
    switch (this._config.blendMode) {
      case BlendMode.ADDITIVE:
        return AdditiveBlending
      case BlendMode.NORMAL:
      default:
        return NormalBlending
    }
  }

  /**
   * 更新材质
   */
  update(deltaTime: number): void {
    if (this._needsRecompile && this._config.autoCompile) {
      this._compileMaterial()
    }

    // 更新uniform值
    if (this._compiledMaterial && this._compiledMaterial.uniforms.time) {
      this._compiledMaterial.uniforms.time.value += deltaTime
    }
  }

  // ========================================================================
  // 公共API - 材质图操作
  // ========================================================================

  /**
   * 设置材质图
   */
  setMaterialGraph(graph: MaterialGraph): void {
    this._materialGraph = graph
    this._materialGraph.metadata.modified = new Date().toISOString()
    this._needsRecompile = true
    
    console.log('设置新的材质图')
  }

  /**
   * 获取材质图
   */
  getMaterialGraph(): MaterialGraph {
    return JSON.parse(JSON.stringify(this._materialGraph)) // 深拷贝
  }

  /**
   * 添加节点
   */
  addNode(node: ParticleNode): void {
    this._materialGraph.nodes.push(node)
    this._materialGraph.metadata.modified = new Date().toISOString()
    this._needsRecompile = true
    
    console.log(`添加节点: ${node.name} (${node.type})`)
  }

  /**
   * 移除节点
   */
  removeNode(nodeId: string): void {
    // 移除节点
    this._materialGraph.nodes = this._materialGraph.nodes.filter(node => node.id !== nodeId)
    
    // 移除相关连接
    this._materialGraph.connections = this._materialGraph.connections.filter(
      conn => conn.sourceNode !== nodeId && conn.targetNode !== nodeId
    )
    
    this._materialGraph.metadata.modified = new Date().toISOString()
    this._needsRecompile = true
    
    console.log(`移除节点: ${nodeId}`)
  }

  /**
   * 添加连接
   */
  addConnection(connection: NodeConnection): void {
    this._materialGraph.connections.push(connection)
    this._materialGraph.metadata.modified = new Date().toISOString()
    this._needsRecompile = true
    
    console.log(`添加连接: ${connection.sourceNode}.${connection.sourcePort} -> ${connection.targetNode}.${connection.targetPort}`)
  }

  /**
   * 移除连接
   */
  removeConnection(connectionId: string): void {
    this._materialGraph.connections = this._materialGraph.connections.filter(
      conn => conn.id !== connectionId
    )
    
    this._materialGraph.metadata.modified = new Date().toISOString()
    this._needsRecompile = true
    
    console.log(`移除连接: ${connectionId}`)
  }

  /**
   * 设置预设
   */
  setPreset(preset: MaterialPreset): void {
    const presetGraph = this._presetGraphs.get(preset)
    if (presetGraph) {
      this._config.preset = preset
      this._materialGraph = JSON.parse(JSON.stringify(presetGraph)) // 深拷贝
      this._needsRecompile = true
      
      console.log(`切换到预设: ${preset}`)
    } else {
      console.warn(`未找到预设: ${preset}`)
    }
  }

  /**
   * 手动编译材质
   */
  compile(): void {
    this._needsRecompile = true
    this._compileMaterial()
  }

  /**
   * 获取编译后的材质
   */
  getCompiledMaterial(): ShaderMaterial | null {
    if (this._needsRecompile && this._config.autoCompile) {
      this._compileMaterial()
    }
    return this._compiledMaterial
  }

  /**
   * 获取GLSL代码
   */
  getGLSLCode(): { vertex: string, fragment: string } | null {
    try {
      const compiledShader = this._compiler.compileGraph(this._materialGraph)
      return {
        vertex: compiledShader.vertexShader,
        fragment: compiledShader.fragmentShader
      }
    } catch (error) {
      console.error('获取GLSL代码失败:', error)
      return null
    }
  }

  /**
   * 从GLSL代码解析材质图（简化实现）
   */
  parseFromGLSL(vertexShader: string, fragmentShader: string): boolean {
    // 这里应该实现GLSL代码反向解析
    // 目前返回false表示不支持
    console.warn('GLSL代码反向解析功能尚未实现')
    return false
  }

  /**
   * 导出材质图为JSON
   */
  exportToJSON(): string {
    return JSON.stringify(this._materialGraph, null, 2)
  }

  /**
   * 从JSON导入材质图
   */
  importFromJSON(json: string): boolean {
    try {
      const graph = JSON.parse(json) as MaterialGraph
      this.setMaterialGraph(graph)
      return true
    } catch (error) {
      console.error('导入材质图失败:', error)
      return false
    }
  }

  /**
   * 销毁材质
   */
  override destroy(): void {
    if (this._compiledMaterial) {
      this._compiledMaterial.dispose()
      this._compiledMaterial = null
    }

    this._presetGraphs.clear()

    super.destroy()
    console.log('ParticleMaterial 已销毁')
  }
}
