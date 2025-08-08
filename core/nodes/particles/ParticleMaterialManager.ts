// ============================================================================
// QAQ Engine - 粒子材质管理器 (Particle Material Manager)
// 统一管理粒子材质的创建、配置和切换
// ============================================================================

import * as THREE from 'three'
import { 
  createFireParticles, 
  createSmokeParticles, 
  createMagicParticles,
  createWaterParticles,
  createElectricParticles 
} from './examples/code-driven/PresetEffect_Examples'
import { GLSLCodeGenerator } from './material/GLSLCodeGenerator'
import type { MaterialGraph } from './material/DataStructureDefinition'

/**
 * 预设材质类型枚举
 */
export enum PresetMaterialType {
  FIRE = 'fire',
  SMOKE = 'smoke',
  MAGIC = 'magic',
  WATER = 'water',
  ELECTRIC = 'electric',
  SPARKLE = 'sparkle',
  EXPLOSION = 'explosion',
  HEAL = 'heal'
}

/**
 * 材质创建模式枚举
 */
export enum MaterialCreationMode {
  PRESET = 'preset',           // 预设材质
  CODE_DRIVEN = 'code_driven', // 代码驱动
  NODE_GRAPH = 'node_graph',   // 节点图
  CUSTOM_GLSL = 'custom_glsl'  // 自定义GLSL
}

/**
 * 材质配置接口
 */
export interface MaterialConfig {
  mode: MaterialCreationMode
  
  // 预设材质配置
  presetType?: PresetMaterialType
  presetParams?: any
  
  // 代码驱动配置
  codeDrivenFunction?: () => THREE.ShaderMaterial
  
  // 节点图配置
  nodeGraph?: MaterialGraph
  
  // 自定义GLSL配置
  vertexShader?: string
  fragmentShader?: string
  uniforms?: { [key: string]: any }
  
  // 通用属性
  blending?: THREE.Blending
  transparent?: boolean
  depthWrite?: boolean
  texture?: THREE.Texture
}

/**
 * 粒子材质管理器
 * 
 * 负责统一管理粒子材质的创建、配置和生命周期
 */
export class ParticleMaterialManager {
  private static instance: ParticleMaterialManager
  private materialCache: Map<string, THREE.ShaderMaterial | THREE.PointsMaterial> = new Map()
  private glslGenerator: GLSLCodeGenerator | null = null

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ParticleMaterialManager {
    if (!ParticleMaterialManager.instance) {
      ParticleMaterialManager.instance = new ParticleMaterialManager()
    }
    return ParticleMaterialManager.instance
  }

  /**
   * 创建粒子材质
   */
  public createMaterial(config: MaterialConfig): THREE.ShaderMaterial | THREE.PointsMaterial {
    const cacheKey = this.generateCacheKey(config)
    
    // 检查缓存
    if (this.materialCache.has(cacheKey)) {
      const cachedMaterial = this.materialCache.get(cacheKey)!
      return cachedMaterial.clone()
    }

    let material: THREE.ShaderMaterial | THREE.PointsMaterial

    switch (config.mode) {
      case MaterialCreationMode.PRESET:
        material = this.createPresetMaterial(config)
        break
        
      case MaterialCreationMode.CODE_DRIVEN:
        material = this.createCodeDrivenMaterial(config)
        break
        
      case MaterialCreationMode.NODE_GRAPH:
        material = this.createNodeGraphMaterial(config)
        break
        
      case MaterialCreationMode.CUSTOM_GLSL:
        material = this.createCustomGLSLMaterial(config)
        break
        
      default:
        material = this.createDefaultMaterial(config)
    }

    // 应用通用属性
    this.applyCommonProperties(material, config)
    
    // 缓存材质
    this.materialCache.set(cacheKey, material)
    
    return material.clone()
  }

  /**
   * 创建预设材质
   */
  private createPresetMaterial(config: MaterialConfig): THREE.ShaderMaterial {
    const params = config.presetParams || {}
    
    switch (config.presetType) {
      case PresetMaterialType.FIRE:
        return createFireParticles(params)
        
      case PresetMaterialType.SMOKE:
        return createSmokeParticles(params)
        
      case PresetMaterialType.MAGIC:
        return createMagicParticles(params)
        
      case PresetMaterialType.WATER:
        return createWaterParticles(params)
        
      case PresetMaterialType.ELECTRIC:
        return createElectricParticles(params)
        
      case PresetMaterialType.SPARKLE:
        return this.createSparkleMaterial(params)
        
      case PresetMaterialType.EXPLOSION:
        return this.createExplosionMaterial(params)
        
      case PresetMaterialType.HEAL:
        return this.createHealMaterial(params)
        
      default:
        return createFireParticles(params)
    }
  }

  /**
   * 创建代码驱动材质
   */
  private createCodeDrivenMaterial(config: MaterialConfig): THREE.ShaderMaterial {
    if (config.codeDrivenFunction) {
      return config.codeDrivenFunction()
    }
    
    console.warn('代码驱动材质函数未提供，使用默认材质')
    return this.createDefaultMaterial(config) as THREE.ShaderMaterial
  }

  /**
   * 创建节点图材质
   */
  private createNodeGraphMaterial(config: MaterialConfig): THREE.ShaderMaterial {
    if (!config.nodeGraph) {
      console.warn('节点图数据未提供，使用默认材质')
      return this.createDefaultMaterial(config) as THREE.ShaderMaterial
    }

    try {
      if (!this.glslGenerator) {
        this.glslGenerator = new GLSLCodeGenerator(config.nodeGraph)
      }
      
      return this.glslGenerator.createThreeMaterial()
    } catch (error) {
      console.error('节点图材质创建失败:', error)
      return this.createDefaultMaterial(config) as THREE.ShaderMaterial
    }
  }

  /**
   * 创建自定义GLSL材质
   */
  private createCustomGLSLMaterial(config: MaterialConfig): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      vertexShader: config.vertexShader || this.getDefaultVertexShader(),
      fragmentShader: config.fragmentShader || this.getDefaultFragmentShader(),
      uniforms: {
        uTime: { value: 0.0 },
        uTexture: { value: config.texture || null },
        ...config.uniforms
      },
      transparent: config.transparent !== false,
      blending: config.blending || THREE.AdditiveBlending,
      depthWrite: config.depthWrite !== undefined ? config.depthWrite : false,
      vertexColors: true
    })
  }

  /**
   * 创建默认材质
   */
  private createDefaultMaterial(config: MaterialConfig): THREE.PointsMaterial {
    return new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: config.transparent !== false,
      blending: config.blending || THREE.AdditiveBlending,
      depthWrite: config.depthWrite !== undefined ? config.depthWrite : false,
      vertexColors: true,
      sizeAttenuation: true,
      map: config.texture || null
    })
  }

  /**
   * 创建闪烁材质
   */
  private createSparkleMaterial(params: any): THREE.ShaderMaterial {
    const color = params.color || new THREE.Color(1, 1, 1)
    const intensity = params.intensity || 2.0
    const sparkleSpeed = params.sparkleSpeed || 5.0

    return new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vColor = color;
          vUv = uv;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uSparkleSpeed;
        
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vec2 center = vec2(0.5);
          float distance = length(gl_PointCoord - center);
          
          if (distance > 0.5) discard;
          
          // 闪烁效果
          float sparkle = sin(uTime * uSparkleSpeed + distance * 20.0) * 0.5 + 0.5;
          sparkle = pow(sparkle, 3.0);
          
          // 星形效果
          float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
          float star = sin(angle * 4.0) * 0.3 + 0.7;
          
          float alpha = (1.0 - distance * 2.0) * sparkle * star;
          vec3 finalColor = uColor * uIntensity * sparkle;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: color },
        uIntensity: { value: intensity },
        uSparkleSpeed: { value: sparkleSpeed }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    })
  }

  /**
   * 创建爆炸材质
   */
  private createExplosionMaterial(params: any): THREE.ShaderMaterial {
    const coreColor = params.coreColor || new THREE.Color(1, 1, 0.8)
    const outerColor = params.outerColor || new THREE.Color(1, 0.2, 0)
    const intensity = params.intensity || 3.0

    return new THREE.ShaderMaterial({
      vertexShader: this.getDefaultVertexShader(),
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCoreColor;
        uniform vec3 uOuterColor;
        uniform float uIntensity;
        
        varying vec3 vColor;
        
        void main() {
          vec2 center = vec2(0.5);
          float distance = length(gl_PointCoord - center);
          
          if (distance > 0.5) discard;
          
          // 爆炸扩散效果
          float expansion = sin(uTime * 10.0) * 0.5 + 0.5;
          float ring = 1.0 - smoothstep(expansion - 0.1, expansion + 0.1, distance);
          
          // 颜色混合
          vec3 explosionColor = mix(uCoreColor, uOuterColor, distance * 2.0);
          explosionColor *= uIntensity;
          
          float alpha = ring * (1.0 - distance * 2.0);
          
          gl_FragColor = vec4(explosionColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uCoreColor: { value: coreColor },
        uOuterColor: { value: outerColor },
        uIntensity: { value: intensity }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    })
  }

  /**
   * 创建治疗材质
   */
  private createHealMaterial(params: any): THREE.ShaderMaterial {
    const color = params.color || new THREE.Color(0.2, 1.0, 0.3)
    const purity = params.purity || 0.9
    const warmth = params.warmth || 0.3

    return new THREE.ShaderMaterial({
      vertexShader: this.getDefaultVertexShader(),
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uPurity;
        uniform float uWarmth;
        
        varying vec3 vColor;
        
        void main() {
          vec2 center = vec2(0.5);
          float distance = length(gl_PointCoord - center);
          
          if (distance > 0.5) discard;
          
          // 柔和的光晕
          float glow = 1.0 / (1.0 + distance * 3.0);
          glow = pow(glow, 1.5);
          
          // 脉冲效果
          float pulse = sin(uTime * 4.0) * 0.3 + 0.7;
          
          // 治疗颜色
          vec3 healColor = mix(uColor, vec3(1.0, 1.0, 0.6), uWarmth);
          
          float alpha = glow * pulse * uPurity;
          
          gl_FragColor = vec4(healColor, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: color },
        uPurity: { value: purity },
        uWarmth: { value: warmth }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    })
  }

  /**
   * 应用通用材质属性
   */
  private applyCommonProperties(
    material: THREE.ShaderMaterial | THREE.PointsMaterial, 
    config: MaterialConfig
  ): void {
    if (config.blending !== undefined) {
      material.blending = config.blending
    }
    if (config.transparent !== undefined) {
      material.transparent = config.transparent
    }
    if (config.depthWrite !== undefined) {
      material.depthWrite = config.depthWrite
    }
    if (config.texture && 'map' in material) {
      material.map = config.texture
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(config: MaterialConfig): string {
    return JSON.stringify({
      mode: config.mode,
      presetType: config.presetType,
      // 简化的参数哈希
      paramsHash: config.presetParams ? Object.keys(config.presetParams).length : 0
    })
  }

  /**
   * 获取默认顶点着色器
   */
  private getDefaultVertexShader(): string {
    return `
      attribute float size;
      varying vec3 vColor;
      
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `
  }

  /**
   * 获取默认片段着色器
   */
  private getDefaultFragmentShader(): string {
    return `
      varying vec3 vColor;
      
      void main() {
        vec2 center = vec2(0.5);
        float distance = length(gl_PointCoord - center);
        
        if (distance > 0.5) discard;
        
        float alpha = 1.0 - distance * 2.0;
        gl_FragColor = vec4(vColor, alpha);
      }
    `
  }

  /**
   * 清理缓存
   */
  public clearCache(): void {
    this.materialCache.forEach(material => material.dispose())
    this.materialCache.clear()
  }

  /**
   * 销毁管理器
   */
  public dispose(): void {
    this.clearCache()
    if (this.glslGenerator) {
      this.glslGenerator = null
    }
  }
}
