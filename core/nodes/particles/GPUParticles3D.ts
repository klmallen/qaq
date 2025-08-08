// ============================================================================
// QAQ Engine - GPU粒子系统3D节点 (GPU Particles 3D Node)
// 参考Godot GPUParticles3D设计，完全封装Three.js实现
// ============================================================================

import Node3D from '../Node3D'
import * as THREE from 'three'
import { ParticleMaterialManager, MaterialCreationMode, PresetMaterialType } from './ParticleMaterialManager'
import { ParticleShapeManager } from './ParticleShapeManager'
import type { MaterialConfig } from './ParticleMaterialManager'

import { EmissionShape } from './ParticleShapeManager'
import ModelManager from '../../managers/ModelManager'

/**
 * 粒子材质模式枚举（兼容旧API）
 */
export enum ParticleMaterialMode {
  PRESET_FIRE = 'preset_fire',
  PRESET_SMOKE = 'preset_smoke',
  PRESET_MAGIC = 'preset_magic',
  CUSTOM_SHADER = 'custom_shader',
  NODE_GRAPH = 'node_graph'
}

/**
 * 高级粒子运动模式
 */
export enum ParticleMovementMode {
  GRAVITY = 'gravity',           // 标准重力
  EXPLOSION = 'explosion',       // 爆炸扩散
  IMPLOSION = 'implosion',      // 向心聚合
  TORNADO = 'tornado',          // 龙卷风螺旋
  ORBITAL = 'orbital',          // 轨道运动
  WAVE = 'wave',               // 波浪运动
  FLOCKING = 'flocking',       // 群体行为
  FORCE_FIELD = 'force_field'  // 力场系统
}

/**
 * 粒子形状类型
 */
export enum ParticleShapeType {
  POINT = 'point',
  CIRCLE = 'circle',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  STAR = 'star',
  DIAMOND = 'diamond',
  CUSTOM_MESH = 'custom_mesh',
  LOADED_MODEL = 'loaded_model'
}

/**
 * 粒子发射器配置接口
 */
export interface ParticleEmissionConfig {
  // 基础参数
  amount: number
  lifetime: number
  emissionRate: number

  // 发射形状
  shape: EmissionShape
  shapeRadius: number
  shapeSize: THREE.Vector3

  // 初始属性
  direction: THREE.Vector3
  initialVelocity: number
  velocityRandom: number
  angularVelocity: number

  // 物理属性
  gravity: THREE.Vector3
  damping: number

  // 视觉属性
  scale: number
  scaleRandom: number
  color: THREE.Color
  colorRandom: number
}

/**
 * 粒子材质配置接口
 */
export interface ParticleMaterialConfig {
  mode: ParticleMaterialMode

  // 预设材质参数
  presetParams?: any

  // 自定义着色器
  customVertexShader?: string
  customFragmentShader?: string
  customUniforms?: { [key: string]: any }

  // 节点图材质
  nodeGraphData?: any

  // 通用材质属性
  texture?: THREE.Texture
  blending: THREE.Blending
  transparent: boolean
  depthWrite: boolean
}

/**
 * GPU粒子系统3D节点
 *
 * 完全封装的粒子系统节点，参考Godot GPUParticles3D设计
 * 支持多种使用方式：链式调用、节点图连接、属性配置
 */
export default class GPUParticles3D extends Node3D {
  // 核心属性
  public emitting: boolean = true
  public amount: number = 100
  public lifetime: number = 3.0
  public preprocess: number = 0.0
  public speedScale: number = 1.0
  public explosiveness: number = 0.0
  public randomness: number = 0.0
  public fixedFps: number = 60
  public fractDelta: boolean = true

  // 发射控制
  public oneShot: boolean = false // 是否单次发射
  public emissionShape: EmissionShape = EmissionShape.POINT // 发射形状
  public particleColor: string = 'fire' // 粒子颜色主题
  public particleSize: number = 0.1 // 粒子大小

  // 高级大小控制
  public sizeOverLifetime: boolean = false // 是否启用生命周期大小变化
  public startSize: number = 0.1 // 初始大小
  public endSize: number = 0.05 // 结束大小
  public sizeRandomness: number = 0.0 // 大小随机性 (0-1)
  public sizeDistanceScaling: boolean = true // 是否启用距离缩放
  public maxViewDistance: number = 100 // 最大可见距离

  // 高级运动控制
  public movementMode: ParticleMovementMode = ParticleMovementMode.GRAVITY
  public attractionPoint: THREE.Vector3 = new THREE.Vector3(0, 0, 0) // 吸引点
  public attractionStrength: number = 1.0 // 吸引强度
  public tornadoAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0) // 龙卷风轴
  public tornadoRadius: number = 2.0 // 龙卷风半径
  public waveAmplitude: number = 1.0 // 波浪振幅
  public waveFrequency: number = 1.0 // 波浪频率
  public orbitalRadius: number = 2.0 // 轨道半径
  public orbitalSpeed: number = 1.0 // 轨道速度

  // 粒子形状控制
  public particleShapeType: ParticleShapeType = ParticleShapeType.POINT
  public customMesh: THREE.BufferGeometry | null = null
  public particleTexture: THREE.Texture | null = null
  public instancedRendering: boolean = true // 是否使用实例化渲染

  // 发射器配置
  private emissionConfig: ParticleEmissionConfig
  private materialConfig: ParticleMaterialConfig

  // 管理器实例
  private materialManager: ParticleMaterialManager
  private shapeManager: ParticleShapeManager

  // Three.js内部对象（完全封装，用户不直接访问）
  private particleSystem: THREE.Points | THREE.InstancedMesh | null = null
  private particleGeometry: THREE.BufferGeometry | null = null
  private particleMaterial: THREE.ShaderMaterial | THREE.PointsMaterial | null = null

  // 粒子数据
  private particles: Array<{
    position: THREE.Vector3
    velocity: THREE.Vector3
    age: number
    lifetime: number
    size: number
    color: THREE.Color
    alive: boolean
  }> = []

  // 缓冲区数组
  private positionArray: Float32Array | null = null
  private colorArray: Float32Array | null = null
  private sizeArray: Float32Array | null = null

  // 内部状态
  private emissionTimer: number = 0
  private lastUpdateTime: number = 0
  private hasEmitted: boolean = false // 是否已经发射过（用于单次发射）
  private emissionCount: number = 0 // 已发射的粒子数量

  constructor() {
    super()

    try {
      // 初始化管理器
      this.materialManager = ParticleMaterialManager.getInstance()
      this.shapeManager = ParticleShapeManager.getInstance()

      // 默认发射器配置
      this.emissionConfig = {
        amount: 100,
        lifetime: 3.0,
        emissionRate: 30,

        shape: EmissionShape.POINT,
        shapeRadius: 1.0,
        shapeSize: new THREE.Vector3(1, 1, 1),

        direction: new THREE.Vector3(0, 1, 0),
        initialVelocity: 2.0,
        velocityRandom: 1.0,
        angularVelocity: 0.0,

        gravity: new THREE.Vector3(0, -9.8, 0),
        damping: 0.0,

        scale: 1.0,
        scaleRandom: 0.0,
        color: new THREE.Color(1, 1, 1),
        colorRandom: 0.0
      }

      // 默认材质配置
      this.materialConfig = {
        mode: ParticleMaterialMode.PRESET_FIRE,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      }

      // 异步初始化粒子系统
      this.initializeParticleSystem().catch(error => {
        console.error('❌ 异步初始化失败:', error)
      })

      console.log('✅ GPUParticles3D构造函数完成')
    } catch (error) {
      console.error('❌ GPUParticles3D构造函数失败:', error)
      throw error
    }
  }

  /**
   * 初始化粒子系统
   */
  private async initializeParticleSystem(): Promise<void> {
    try {
      console.log('🔧 开始初始化GPUParticles3D（使用基础材质）...')

      // 如果使用模型形状，先加载模型
      const shape = (this as any).emissionShape || 'point'
      if (shape === 'model') {
        await this.loadModelForEmission()
      }

      this.createParticleGeometry()
      console.log('✅ 粒子几何体创建完成')

      this.createParticleMaterial()
      console.log('✅ 粒子材质创建完成')

      this.createParticleSystem()
      console.log('✅ 粒子系统创建完成')

      console.log('✅ GPUParticles3D节点初始化完成')
    } catch (error) {
      console.error('❌ GPUParticles3D初始化失败:', error)
      throw error
    }
  }

  /**
   * 创建粒子几何体
   */
  private createParticleGeometry(): void {
    this.particleGeometry = new THREE.BufferGeometry()

    // 初始化粒子数组
    this.particles = []

    // 创建缓冲区数组
    this.positionArray = new Float32Array(this.amount * 3)
    this.colorArray = new Float32Array(this.amount * 3)
    this.sizeArray = new Float32Array(this.amount)

    // 初始化粒子数据，使用演示方法
    for (let i = 0; i < this.amount; i++) {
      // 使用演示方法获取初始位置、速度和颜色
      const emissionPos = this.getEmissionPosition()
      const emissionVel = this.getEmissionVelocity()
      const particleColor = this.getParticleColor()

      // 创建粒子对象
      this.particles.push({
        position: new THREE.Vector3(emissionPos.x, emissionPos.y, emissionPos.z),
        velocity: new THREE.Vector3(emissionVel.x, emissionVel.y, emissionVel.z),
        age: Math.random() * this.emissionConfig.lifetime,
        lifetime: this.emissionConfig.lifetime,
        size: 1.0,
        color: new THREE.Color(particleColor.r, particleColor.g, particleColor.b),
        alive: true,
        randomSeed: Math.random() // 添加固定随机种子
      })

      // 初始化缓冲区数组
      this.positionArray[i * 3] = emissionPos.x
      this.positionArray[i * 3 + 1] = emissionPos.y
      this.positionArray[i * 3 + 2] = emissionPos.z

      this.colorArray[i * 3] = particleColor.r
      this.colorArray[i * 3 + 1] = particleColor.g
      this.colorArray[i * 3 + 2] = particleColor.b

      this.sizeArray[i] = 1.0
    }

    // 设置几何体属性
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(this.positionArray, 3))
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(this.colorArray, 3))
    this.particleGeometry.setAttribute('size', new THREE.BufferAttribute(this.sizeArray, 1))

    console.log(`✅ 创建了 ${this.amount} 个粒子的几何体`)
  }

  /**
   * 创建粒子材质
   */
  private createParticleMaterial(): void {
    try {
      // 对于基础粒子系统，使用简单的PointsMaterial避免着色器兼容性问题
      if (this.materialConfig.mode === ParticleMaterialMode.PRESET_FIRE) {
        // 使用基础PointsMaterial，避免复杂着色器问题
        this.particleMaterial = new THREE.PointsMaterial({
          size: 0.1,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true
        })
        console.log('✅ 使用基础PointsMaterial创建粒子材质')
      } else {
        // 对于其他模式，尝试使用材质管理器
        try {
          const materialConfig: MaterialConfig = this.convertToMaterialConfig()
          this.particleMaterial = this.materialManager.createMaterial(materialConfig)
          console.log('✅ 使用材质管理器创建粒子材质')
        } catch (shaderError) {
          console.warn('⚠️ 着色器材质创建失败，回退到基础材质:', shaderError)
          // 回退到基础材质
          this.particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
          })
        }
      }
    } catch (error) {
      console.error('❌ 粒子材质创建失败:', error)
      // 最终回退方案
      this.particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0xff4444,
        transparent: true,
        opacity: 0.8
      })
    }
  }

  /**
   * 转换为材质配置
   */
  private convertToMaterialConfig(): MaterialConfig {
    const config: MaterialConfig = {
      mode: MaterialCreationMode.PRESET,
      blending: this.materialConfig.blending,
      transparent: this.materialConfig.transparent,
      depthWrite: this.materialConfig.depthWrite,
      texture: this.materialConfig.texture
    }

    switch (this.materialConfig.mode) {
      case ParticleMaterialMode.PRESET_FIRE:
        config.presetType = PresetMaterialType.FIRE
        break
      case ParticleMaterialMode.PRESET_SMOKE:
        config.presetType = PresetMaterialType.SMOKE
        break
      case ParticleMaterialMode.PRESET_MAGIC:
        config.presetType = PresetMaterialType.MAGIC
        break
      case ParticleMaterialMode.CUSTOM_SHADER:
        config.mode = MaterialCreationMode.CUSTOM_GLSL
        config.vertexShader = this.materialConfig.customVertexShader
        config.fragmentShader = this.materialConfig.customFragmentShader
        config.uniforms = this.materialConfig.customUniforms
        break
      case ParticleMaterialMode.NODE_GRAPH:
        config.mode = MaterialCreationMode.NODE_GRAPH
        config.nodeGraph = this.materialConfig.nodeGraphData
        break
      default:
        config.presetType = PresetMaterialType.FIRE
    }

    if (this.materialConfig.presetParams) {
      config.presetParams = this.materialConfig.presetParams
    }

    return config
  }

  /**
   * 创建粒子系统
   */
  private createParticleSystem(): void {
    if (this.particleGeometry && this.particleMaterial) {
      // 根据粒子形状类型创建不同的渲染对象
      if (this.particleShapeType === ParticleShapeType.POINT) {
        // 使用Points渲染器
        this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial)
      } else {
        // 使用实例化网格渲染器
        this.particleSystem = this.createInstancedMeshSystem()
      }

      if (this.particleSystem) {
        this.object3D.add(this.particleSystem)
      }
    }
  }

  /**
   * 创建实例化网格系统
   */
  private createInstancedMeshSystem(): THREE.InstancedMesh | null {
    const shapeGeometry = this.createShapeGeometry()
    if (!shapeGeometry) return null

    // 创建实例化材质
    const instancedMaterial = this.createInstancedMaterial()

    // 创建实例化网格
    const instancedMesh = new THREE.InstancedMesh(shapeGeometry, instancedMaterial, this.amount)

    // 初始化实例矩阵
    this.updateInstancedMeshes(instancedMesh)

    return instancedMesh
  }

  /**
   * 创建形状几何体
   */
  private createShapeGeometry(): THREE.BufferGeometry | null {
    switch (this.particleShapeType) {
      case ParticleShapeType.CIRCLE:
        return new THREE.CircleGeometry(0.1, 8)

      case ParticleShapeType.SQUARE:
        return new THREE.PlaneGeometry(0.2, 0.2)

      case ParticleShapeType.TRIANGLE:
        return this.createTriangleGeometry()

      case ParticleShapeType.STAR:
        return this.createStarGeometry()

      case ParticleShapeType.DIAMOND:
        return this.createDiamondGeometry()

      case ParticleShapeType.CUSTOM_MESH:
        return this.customMesh ? this.customMesh.clone() : null

      case ParticleShapeType.LOADED_MODEL:
        return this.extractModelGeometry()

      default:
        return new THREE.CircleGeometry(0.1, 8)
    }
  }

  /**
   * 创建三角形几何体
   */
  private createTriangleGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      0, 0.1, 0,    // 顶点
      -0.1, -0.1, 0, // 左下
      0.1, -0.1, 0   // 右下
    ])
    const indices = [0, 1, 2]

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  /**
   * 创建星形几何体
   */
  private createStarGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []
    const indices: number[] = []

    const outerRadius = 0.1
    const innerRadius = 0.05
    const points = 5

    // 中心点
    vertices.push(0, 0, 0)

    // 外部和内部点
    for (let i = 0; i < points * 2; i++) {
      const angle = (i / (points * 2)) * Math.PI * 2
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      )
    }

    // 创建三角形索引
    for (let i = 1; i <= points * 2; i++) {
      const next = i === points * 2 ? 1 : i + 1
      indices.push(0, i, next)
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  /**
   * 创建钻石几何体
   */
  private createDiamondGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array([
      0, 0.1, 0,     // 顶点
      -0.1, 0, 0,    // 左
      0, -0.1, 0,    // 底
      0.1, 0, 0      // 右
    ])
    const indices = [0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }

  /**
   * 从加载的模型提取几何体
   */
  private extractModelGeometry(): THREE.BufferGeometry | null {
    if (!this.loadedModel) return null

    let geometry: THREE.BufferGeometry | null = null

    this.loadedModel.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry && !geometry) {
        geometry = child.geometry.clone()
        // 缩放到合适大小
        if (geometry) {
          geometry.scale(0.1, 0.1, 0.1)
        }
      }
    })

    return geometry
  }

  /**
   * 创建实例化材质
   */
  private createInstancedMaterial(): THREE.Material {
    if (this.particleTexture) {
      return new THREE.MeshBasicMaterial({
        map: this.particleTexture,
        transparent: true,
        alphaTest: 0.1
      })
    } else {
      return new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8
      })
    }
  }

  /**
   * 更新实例化网格
   */
  private updateInstancedMeshes(instancedMesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Euler()
    const scale = new THREE.Vector3(1, 1, 1)

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]

      if (particle.alive) {
        position.copy(particle.position)
        scale.setScalar(particle.size)

        matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
        instancedMesh.setMatrixAt(i, matrix)

        // 设置颜色
        instancedMesh.setColorAt(i, particle.color)
      } else {
        // 隐藏死亡粒子
        scale.setScalar(0)
        matrix.compose(position, new THREE.Quaternion(), scale)
        instancedMesh.setMatrixAt(i, matrix)
      }
    }

    instancedMesh.instanceMatrix.needsUpdate = true
    if (instancedMesh.instanceColor) {
      instancedMesh.instanceColor.needsUpdate = true
    }
  }





  /**
   * 更新粒子系统
   */
  public override _process(deltaTime: number): void {
    if (!this.emitting) return

    deltaTime *= this.speedScale

    // 发射新粒子
    this.updateEmission(deltaTime)

    // 更新现有粒子
    this.updateParticlesInternal(deltaTime)

    // 更新缓冲区
    this.updateBuffers()

    // 更新材质
    this.updateMaterial(deltaTime)
  }

  /**
   * 更新粒子发射
   */
  private updateEmission(deltaTime: number): void {
    // 单次发射模式
    if (this.oneShot) {
      if (!this.hasEmitted && this.emitting) {
        // 发射指定数量的粒子
        for (let i = 0; i < this.amount; i++) {
          this.emitParticle()
        }
        this.hasEmitted = true
        this.emitting = false // 发射完成后停止
        console.log(`🎯 单次发射完成: ${this.amount} 个粒子`)
      }
      return
    }

    // 连续发射模式
    if (!this.emitting) return

    this.emissionTimer += deltaTime
    const emissionInterval = 1.0 / this.emissionConfig.emissionRate

    while (this.emissionTimer >= emissionInterval && this.emissionCount < this.amount) {
      this.emitParticle()
      this.emissionTimer -= emissionInterval
      this.emissionCount++
    }

    // 如果达到最大粒子数，重置计数器
    if (this.emissionCount >= this.amount) {
      this.emissionCount = 0
    }
  }

  /**
   * 发射新粒子
   */
  private emitParticle(): void {
    const particle = this.particles.find(p => !p.alive)
    if (!particle) return

    // 初始化粒子
    particle.alive = true
    particle.age = 0
    particle.lifetime = this.emissionConfig.lifetime * (1 + (Math.random() - 0.5) * this.randomness)

    // 为粒子分配固定的随机种子（用于一致的随机效果）
    ;(particle as any).randomSeed = Math.random()

    // 使用修复的方法设置发射位置
    const emissionPos = this.getEmissionPosition()
    particle.position.copy(emissionPos)

    // 使用修复的方法设置初始速度
    const emissionVel = this.getEmissionVelocity()
    particle.velocity.copy(emissionVel)

    // 使用修复的方法设置颜色
    const particleColor = this.getParticleColor()
    particle.color.setRGB(particleColor.r, particleColor.g, particleColor.b)

    // 设置视觉属性
    particle.size = this.emissionConfig.scale * (1 + ((particle as any).randomSeed - 0.5) * this.emissionConfig.scaleRandom)
  }



  /**
   * 更新现有粒子
   */
  private updateParticlesInternal(deltaTime: number): void {
    for (const particle of this.particles) {
      if (!particle.alive) continue

      // 更新年龄
      particle.age += deltaTime

      // 检查生命周期
      if (particle.age >= particle.lifetime) {
        particle.alive = false
        continue
      }

      // 更新位置
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))

      // 应用重力
      particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime))

      // 应用阻尼
      particle.velocity.multiplyScalar(1.0 - this.emissionConfig.damping * deltaTime)
    }
  }

  /**
   * 更新缓冲区数组
   */
  private updateBuffers(): void {
    if (!this.positionArray || !this.colorArray || !this.sizeArray) return

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      const i3 = i * 3

      if (particle.alive) {
        // 位置
        this.positionArray[i3] = particle.position.x
        this.positionArray[i3 + 1] = particle.position.y
        this.positionArray[i3 + 2] = particle.position.z

        // 颜色（基于年龄衰减）
        const ageRatio = particle.age / particle.lifetime
        const alpha = 1.0 - ageRatio

        this.colorArray[i3] = particle.color.r * alpha
        this.colorArray[i3 + 1] = particle.color.g * alpha
        this.colorArray[i3 + 2] = particle.color.b * alpha

        // 高级大小计算
        this.sizeArray[i] = this.calculateParticleSize(particle, ageRatio)
      } else {
        // 隐藏死亡粒子
        this.positionArray[i3] = 0
        this.positionArray[i3 + 1] = 0
        this.positionArray[i3 + 2] = 0
        this.colorArray[i3] = 0
        this.colorArray[i3 + 1] = 0
        this.colorArray[i3 + 2] = 0
        this.sizeArray[i] = 0
      }
    }

    // 标记需要更新
    if (this.particleGeometry) {
      this.particleGeometry.attributes.position.needsUpdate = true
      this.particleGeometry.attributes.color.needsUpdate = true
      this.particleGeometry.attributes.size.needsUpdate = true
    }

    // 更新实例化网格
    if (this.particleSystem instanceof THREE.InstancedMesh) {
      this.updateInstancedMeshes(this.particleSystem)
    }
  }

  /**
   * 应用高级运动模式
   */
  private applyAdvancedMovement(particle: any, deltaTime: number): void {
    // 添加调试信息（仅在第一个粒子上打印，避免日志过多）
    if (particle === this.particles[0] && Math.random() < 0.01) {
      console.log(`🔧 应用运动模式: ${this.movementMode}`)
    }

    switch (this.movementMode) {
      case ParticleMovementMode.GRAVITY:
        // 标准重力模式
        particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime))
        break

      case ParticleMovementMode.EXPLOSION:
        // 爆炸模式 - 从中心向外扩散
        const explosionDirection = particle.position.clone().sub(this.attractionPoint)
        const explosionDistance = explosionDirection.length()
        if (explosionDistance > 0.01) {
          explosionDirection.normalize()
          const explosionForce = explosionDirection.multiplyScalar(this.attractionStrength * deltaTime * 10)
          particle.velocity.add(explosionForce)
        }
        // 添加基础重力
        particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime * 0.3))
        break

      case ParticleMovementMode.IMPLOSION:
        // 内爆模式 - 向中心聚合
        const implosionDirection = this.attractionPoint.clone().sub(particle.position)
        const implosionDistance = implosionDirection.length()
        if (implosionDistance > 0.01) {
          implosionDirection.normalize()
          const implosionForce = implosionDirection.multiplyScalar(this.attractionStrength * deltaTime * 5)
          particle.velocity.add(implosionForce)
        }
        break

      case ParticleMovementMode.TORNADO:
        // 龙卷风模式 - 螺旋上升
        const toCenter = this.attractionPoint.clone().sub(particle.position)
        const distanceToAxis = toCenter.length()

        if (distanceToAxis > 0.01) {
          // 向心力（保持在龙卷风半径内）
          const radialDirection = toCenter.clone()
          radialDirection.y = 0 // 只考虑水平方向
          const radialDistance = radialDirection.length()

          if (radialDistance > 0.01) {
            radialDirection.normalize()
            const centripetal = radialDirection.multiplyScalar(this.attractionStrength * deltaTime * 3)
            particle.velocity.add(centripetal)
          }

          // 切向力（旋转）
          const tangential = new THREE.Vector3()
          tangential.crossVectors(this.tornadoAxis, radialDirection.normalize())
          tangential.multiplyScalar(this.orbitalSpeed * deltaTime * 8)
          particle.velocity.add(tangential)

          // 向上力
          const upward = this.tornadoAxis.clone().multiplyScalar(deltaTime * 4)
          particle.velocity.add(upward)
        }
        break

      case ParticleMovementMode.ORBITAL:
        // 轨道运动
        const toOrbitCenter = this.attractionPoint.clone().sub(particle.position)
        const orbitDistance = toOrbitCenter.length()

        if (orbitDistance > 0.1) {
          // 向心力保持轨道（强度与距离成反比）
          const centripetalStrength = this.attractionStrength / (orbitDistance * orbitDistance) * deltaTime * 50
          const centripetalForce = toOrbitCenter.clone().normalize().multiplyScalar(centripetalStrength)

          // 切向力产生轨道运动
          const tangentialForce = new THREE.Vector3()
          tangentialForce.crossVectors(new THREE.Vector3(0, 1, 0), toOrbitCenter.normalize())
          tangentialForce.multiplyScalar(this.orbitalSpeed * deltaTime * 5)

          particle.velocity.add(centripetalForce).add(tangentialForce)
        }
        break

      case ParticleMovementMode.WAVE:
        // 波浪运动
        const time = performance.now() * 0.001
        const waveOffset = Math.sin(time * this.waveFrequency + particle.position.x) * this.waveAmplitude
        particle.velocity.y += waveOffset * deltaTime

        // 基础重力
        particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime * 0.5))
        break

      case ParticleMovementMode.FLOCKING:
        // 群体行为（简化版）
        this.applyFlockingBehavior(particle, deltaTime)
        break

      case ParticleMovementMode.FORCE_FIELD:
        // 力场系统
        this.applyForceField(particle, deltaTime)
        break

      default:
        // 默认重力
        particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime))
        break
    }
  }

  /**
   * 应用群体行为
   */
  private applyFlockingBehavior(particle: any, deltaTime: number): void {
    const neighbors = this.particles.filter(p =>
      p.alive && p !== particle &&
      p.position.distanceTo(particle.position) < 2.0
    )

    if (neighbors.length === 0) {
      // 没有邻居时应用基础重力
      particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime))
      return
    }

    // 分离力 - 避免过于接近
    const separation = new THREE.Vector3()
    neighbors.forEach(neighbor => {
      const diff = particle.position.clone().sub(neighbor.position)
      const distance = diff.length()
      if (distance < 1.0 && distance > 0) {
        separation.add(diff.normalize().multiplyScalar(1.0 / distance))
      }
    })

    // 聚合力 - 向群体中心移动
    const cohesion = new THREE.Vector3()
    neighbors.forEach(neighbor => {
      cohesion.add(neighbor.position)
    })
    cohesion.divideScalar(neighbors.length).sub(particle.position).normalize()

    // 对齐力 - 与邻居速度对齐
    const alignment = new THREE.Vector3()
    neighbors.forEach(neighbor => {
      alignment.add(neighbor.velocity)
    })
    alignment.divideScalar(neighbors.length).normalize()

    // 应用力
    const separationForce = separation.multiplyScalar(2.0 * deltaTime)
    const cohesionForce = cohesion.multiplyScalar(0.5 * deltaTime)
    const alignmentForce = alignment.multiplyScalar(1.0 * deltaTime)

    particle.velocity.add(separationForce).add(cohesionForce).add(alignmentForce)

    // 基础重力
    particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime * 0.3))
  }

  /**
   * 计算粒子大小
   */
  private calculateParticleSize(particle: any, ageRatio: number): number {
    let size = particle.size

    // 生命周期大小变化
    if (this.sizeOverLifetime) {
      // 从startSize到endSize的插值
      size = this.startSize + (this.endSize - this.startSize) * ageRatio
    } else {
      // 使用基础大小
      size = this.particleSize
    }

    // 应用随机性（使用粒子的固定随机种子）
    if (this.sizeRandomness > 0 && (particle as any).randomSeed !== undefined) {
      const randomFactor = 1 + ((particle as any).randomSeed - 0.5) * this.sizeRandomness
      size *= randomFactor
    }

    // 距离缩放
    if (this.sizeDistanceScaling && this.object3D.parent) {
      // 获取相机位置
      const camera = this.findCamera()
      if (camera) {
        const worldPosition = new THREE.Vector3()
        this.object3D.getWorldPosition(worldPosition)
        worldPosition.add(particle.position)

        const distance = camera.position.distanceTo(worldPosition)
        const scaleFactor = Math.max(0.1, Math.min(2.0, this.maxViewDistance / distance))
        size *= scaleFactor
      }
    }

    // 不要应用透明度衰减到大小，这应该只影响颜色
    // const alpha = 1.0 - ageRatio
    // size *= alpha

    return Math.max(0.01, size) // 确保最小大小
  }

  /**
   * 查找场景中的相机
   */
  private findCamera(): THREE.Camera | null {
    let current = this.object3D.parent
    while (current) {
      if (current instanceof THREE.Camera) {
        return current
      }
      // 查找子节点中的相机
      const camera = current.children.find(child => child instanceof THREE.Camera)
      if (camera) {
        return camera as THREE.Camera
      }
      current = current.parent
    }
    return null
  }

  /**
   * 应用力场系统
   */
  private applyForceField(particle: any, deltaTime: number): void {
    // 多个力场点的影响
    const forceFields = [
      { position: this.attractionPoint, strength: this.attractionStrength },
      { position: new THREE.Vector3(2, 0, 2), strength: -0.5 }, // 排斥点
      { position: new THREE.Vector3(-2, 0, -2), strength: 0.8 }  // 吸引点
    ]

    forceFields.forEach(field => {
      const direction = field.position.clone().sub(particle.position)
      const distance = direction.length()

      if (distance > 0.1) {
        const force = direction.normalize().multiplyScalar(
          field.strength / (distance * distance) * deltaTime
        )
        particle.velocity.add(force)
      }
    })

    // 基础重力
    particle.velocity.add(this.emissionConfig.gravity.clone().multiplyScalar(deltaTime * 0.2))
  }

  /**
   * 更新材质（自动集成到节点生命周期）
   */
  private updateMaterial(deltaTime: number): void {
    if (!this.particleMaterial) return

    // 只有ShaderMaterial才有uniforms需要更新
    if (this.particleMaterial instanceof THREE.ShaderMaterial && this.particleMaterial.uniforms) {
      const time = performance.now() * 0.001

      // 安全地更新uniforms
      try {
        if (this.particleMaterial.uniforms.uTime) {
          this.particleMaterial.uniforms.uTime.value = time
        }

        if (this.particleMaterial.uniforms.uDeltaTime) {
          this.particleMaterial.uniforms.uDeltaTime.value = deltaTime
        }
      } catch (error) {
        console.warn('⚠️ 材质uniform更新失败:', error)
      }
    }

    // 对于PointsMaterial，可以更新基础属性
    if (this.particleMaterial instanceof THREE.PointsMaterial) {
      // 可以根据需要动态调整材质属性
      // 例如：基于时间的透明度变化
      const timeBasedOpacity = 0.8 + 0.2 * Math.sin(performance.now() * 0.001)
      this.particleMaterial.opacity = Math.max(0.6, Math.min(1.0, timeBasedOpacity))
    }
  }

  // ============================================================================
  // 公共API - 链式调用支持
  // ============================================================================

  /**
   * 设置发射形状
   */
  public setEmissionShape(shape: EmissionShape, radius?: number, size?: THREE.Vector3): this {
    this.emissionShape = shape
    this.emissionConfig.shape = shape
    if (radius !== undefined) this.emissionConfig.shapeRadius = radius
    if (size !== undefined) this.emissionConfig.shapeSize.copy(size)
    return this
  }

  /**
   * 设置单次发射模式（适用于刀光等效果）
   */
  public setOneShot(oneShot: boolean): this {
    this.oneShot = oneShot
    if (oneShot) {
      this.hasEmitted = false // 重置发射状态
    }
    return this
  }

  /**
   * 重新开始发射（用于单次发射模式）
   */
  public restart(): this {
    this.hasEmitted = false
    this.emitting = true
    this.emissionCount = 0
    this.emissionTimer = 0

    // 清除所有现有粒子
    if (this.particles) {
      this.particles.forEach(particle => particle.alive = false)
    }

    console.log('🔄 粒子系统已重启')
    return this
  }

  /**
   * 设置发射方向和速度
   */
  public setEmissionDirection(direction: THREE.Vector3, speed?: number, randomness?: number): this {
    this.emissionConfig.direction.copy(direction).normalize()
    if (speed !== undefined) this.emissionConfig.initialVelocity = speed
    if (randomness !== undefined) this.emissionConfig.velocityRandom = randomness
    return this
  }

  /**
   * 设置粒子颜色主题
   */
  public setColorTheme(theme: string): this {
    this.particleColor = theme
    return this
  }

  /**
   * 设置自定义颜色
   */
  public setCustomColor(color: THREE.Color, randomness: number = 0): this {
    this.particleColor = 'custom'
    this.emissionConfig.color.copy(color)
    this.emissionConfig.colorRandom = randomness
    return this
  }

  // ============================================================================
  // 高级功能API
  // ============================================================================

  /**
   * 设置粒子大小控制
   */
  public setSizeControl(config: {
    sizeOverLifetime?: boolean
    startSize?: number
    endSize?: number
    sizeRandomness?: number
    sizeDistanceScaling?: boolean
    maxViewDistance?: number
  }): this {
    if (config.sizeOverLifetime !== undefined) this.sizeOverLifetime = config.sizeOverLifetime
    if (config.startSize !== undefined) this.startSize = config.startSize
    if (config.endSize !== undefined) this.endSize = config.endSize
    if (config.sizeRandomness !== undefined) this.sizeRandomness = config.sizeRandomness
    if (config.sizeDistanceScaling !== undefined) this.sizeDistanceScaling = config.sizeDistanceScaling
    if (config.maxViewDistance !== undefined) this.maxViewDistance = config.maxViewDistance
    return this
  }

  /**
   * 设置运动模式
   */
  public setMovementMode(mode: ParticleMovementMode, config?: {
    attractionPoint?: THREE.Vector3
    attractionStrength?: number
    tornadoAxis?: THREE.Vector3
    tornadoRadius?: number
    waveAmplitude?: number
    waveFrequency?: number
    orbitalRadius?: number
    orbitalSpeed?: number
  }): this {
    this.movementMode = mode

    if (config) {
      if (config.attractionPoint) this.attractionPoint.copy(config.attractionPoint)
      if (config.attractionStrength !== undefined) this.attractionStrength = config.attractionStrength
      if (config.tornadoAxis) this.tornadoAxis.copy(config.tornadoAxis)
      if (config.tornadoRadius !== undefined) this.tornadoRadius = config.tornadoRadius
      if (config.waveAmplitude !== undefined) this.waveAmplitude = config.waveAmplitude
      if (config.waveFrequency !== undefined) this.waveFrequency = config.waveFrequency
      if (config.orbitalRadius !== undefined) this.orbitalRadius = config.orbitalRadius
      if (config.orbitalSpeed !== undefined) this.orbitalSpeed = config.orbitalSpeed
    }

    console.log(`🎯 运动模式已设置为: ${mode}`)
    console.log(`   - 吸引点: (${this.attractionPoint.x}, ${this.attractionPoint.y}, ${this.attractionPoint.z})`)
    console.log(`   - 吸引强度: ${this.attractionStrength}`)
    console.log(`   - 轨道速度: ${this.orbitalSpeed}`)
    return this
  }

  /**
   * 设置粒子形状
   */
  public setParticleShape(shapeType: ParticleShapeType): this {
    this.particleShapeType = shapeType

    // 重新创建粒子系统以应用新形状
    if (this.particleSystem) {
      this.object3D.remove(this.particleSystem)
      this.createParticleSystem()
    }

    console.log(`🔷 粒子形状已设置为: ${shapeType}`)
    return this
  }

  /**
   * 设置自定义网格
   */
  public setCustomMesh(geometry: THREE.BufferGeometry): this {
    this.customMesh = geometry.clone()
    this.particleShapeType = ParticleShapeType.CUSTOM_MESH

    // 重新创建粒子系统
    if (this.particleSystem) {
      this.object3D.remove(this.particleSystem)
      this.createParticleSystem()
    }

    console.log('🎨 自定义网格已设置')
    return this
  }

  /**
   * 加载粒子模型
   */
  public async loadParticleModel(modelPath: string): Promise<this> {
    try {
      const modelManager = ModelManager.getInstance()
      this.loadedModel = await modelManager.loadModel(modelPath)
      this.particleShapeType = ParticleShapeType.LOADED_MODEL

      // 重新创建粒子系统
      if (this.particleSystem) {
        this.object3D.remove(this.particleSystem)
        this.createParticleSystem()
      }

      console.log(`📦 粒子模型已加载: ${modelPath}`)
    } catch (error) {
      console.error('❌ 粒子模型加载失败:', error)
    }

    return this
  }

  /**
   * 设置粒子纹理
   */
  public setParticleTexture(texture: THREE.Texture): this {
    this.particleTexture = texture

    // 重新创建材质
    if (this.particleSystem instanceof THREE.InstancedMesh) {
      this.particleSystem.material = this.createInstancedMaterial()
    }

    console.log('🖼️ 粒子纹理已设置')
    return this
  }

  /**
   * 创建爆炸效果
   */
  public createExplosion(center: THREE.Vector3, strength: number = 5.0): this {
    this.setMovementMode(ParticleMovementMode.EXPLOSION, {
      attractionPoint: center,
      attractionStrength: strength
    })
    this.setOneShot(true)
    this.restart()
    return this
  }

  /**
   * 创建龙卷风效果
   */
  public createTornado(center: THREE.Vector3, radius: number = 2.0, strength: number = 3.0): this {
    this.setMovementMode(ParticleMovementMode.TORNADO, {
      attractionPoint: center,
      tornadoRadius: radius,
      attractionStrength: strength
    })
    return this
  }

  /**
   * 创建轨道效果
   */
  public createOrbital(center: THREE.Vector3, radius: number = 2.0, speed: number = 1.0): this {
    this.setMovementMode(ParticleMovementMode.ORBITAL, {
      attractionPoint: center,
      orbitalRadius: radius,
      orbitalSpeed: speed
    })
    return this
  }

  /**
   * 设置材质模式
   */
  public setMaterialMode(mode: ParticleMaterialMode, config?: Partial<ParticleMaterialConfig>): this {
    this.materialConfig.mode = mode
    if (config) {
      Object.assign(this.materialConfig, config)
    }

    // 重新创建材质
    try {
      this.createParticleMaterial()
      if (this.particleSystem && this.particleMaterial) {
        this.particleSystem.material = this.particleMaterial
        console.log(`✅ 材质模式已切换到: ${mode}`)
      }
    } catch (error) {
      console.error('❌ 材质模式切换失败:', error)
    }

    return this
  }

  /**
   * 重新初始化材质系统（公共方法）
   */
  public reinitializeMaterial(): this {
    try {
      console.log('🔄 重新初始化材质系统...')

      // 清理旧材质
      if (this.particleMaterial) {
        this.particleMaterial.dispose()
        this.particleMaterial = null
      }

      // 重新创建材质
      this.createParticleMaterial()

      // 更新粒子系统
      if (this.particleSystem && this.particleMaterial) {
        this.particleSystem.material = this.particleMaterial
      }

      console.log('✅ 材质系统重新初始化完成')
    } catch (error) {
      console.error('❌ 材质系统重新初始化失败:', error)
    }

    return this
  }

  /**
   * 更新粒子系统（公共方法，用于外部调用）
   */
  public updateParticles(deltaTime: number = 0.016): void {
    if (!this.particles || !this.particleGeometry) return

    const positions = this.particleGeometry.attributes.position.array as Float32Array
    const colors = this.particleGeometry.attributes.color.array as Float32Array

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]

      if (particle.alive) {
        // 更新年龄
        particle.age += deltaTime

        // 检查生命周期
        if (particle.age >= particle.lifetime) {
          // 重生粒子 - 使用正确的发射逻辑
          particle.age = 0

          // 使用配置的发射位置和速度
          const emissionPos = this.getEmissionPosition()
          particle.position.copy(emissionPos)

          const emissionVel = this.getEmissionVelocity()
          particle.velocity.copy(emissionVel)

          // 重新设置颜色
          const particleColor = this.getParticleColor()
          particle.color.setRGB(particleColor.r, particleColor.g, particleColor.b)
        } else {
          // 更新位置
          particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime * 60))

          // 应用高级运动模式
          this.applyAdvancedMovement(particle, deltaTime)
        }

        // 更新几何体位置
        positions[i * 3] = particle.position.x
        positions[i * 3 + 1] = particle.position.y
        positions[i * 3 + 2] = particle.position.z

        // 根据年龄更新颜色（淡出效果）
        const ageRatio = particle.age / particle.lifetime
        const alpha = 1.0 - ageRatio

        // 使用粒子的原始颜色而不是硬编码
        colors[i * 3] = particle.color.r * alpha
        colors[i * 3 + 1] = particle.color.g * alpha
        colors[i * 3 + 2] = particle.color.b * alpha
      }
    }

    // 标记需要更新
    this.particleGeometry.attributes.position.needsUpdate = true
    this.particleGeometry.attributes.color.needsUpdate = true
  }

  /**
   * 设置粒子数量
   */
  public setAmount(amount: number): this {
    this.amount = amount
    this.emissionConfig.amount = amount
    return this
  }

  /**
   * 设置生命周期
   */
  public setLifetime(lifetime: number): this {
    this.lifetime = lifetime
    this.emissionConfig.lifetime = lifetime
    return this
  }

  /**
   * 设置发射速率
   */
  public setEmissionRate(rate: number): this {
    this.emissionConfig.emissionRate = rate
    return this
  }

  /**
   * 重新初始化粒子系统（公共方法）
   */
  public reinitialize(): this {
    // 清理旧的粒子系统
    if (this.particleSystem) {
      this.object3D.remove(this.particleSystem)
      this.particleSystem = null
    }

    // 异步重新初始化
    this.initializeParticleSystem().catch(error => {
      console.error('❌ 异步重新初始化失败:', error)
    })

    return this
  }

  /**
   * 设置重力
   */
  public setGravity(gravity: THREE.Vector3): this {
    this.emissionConfig.gravity.copy(gravity)
    return this
  }

  /**
   * 诊断粒子系统状态（调试用）
   */
  public diagnose(): void {
    console.log('🔍 GPUParticles3D诊断信息:')
    console.log('  - 粒子数量:', this.amount)
    console.log('  - 发射状态:', this.emitting)
    console.log('  - 材质模式:', this.materialConfig.mode)
    console.log('  - 粒子系统:', this.particleSystem ? '已创建' : '未创建')
    console.log('  - 几何体:', this.particleGeometry ? '已创建' : '未创建')
    console.log('  - 材质:', this.particleMaterial ? `已创建 (${this.particleMaterial.type})` : '未创建')

    if (this.particleMaterial instanceof THREE.ShaderMaterial) {
      console.log('  - 着色器材质uniforms:', Object.keys(this.particleMaterial.uniforms || {}))
    }

    if (this.particles) {
      const aliveCount = this.particles.filter(p => p.alive).length
      console.log('  - 活跃粒子:', `${aliveCount}/${this.particles.length}`)
    }

    console.log('  - 管理器状态:')
    console.log('    - 材质管理器:', this.materialManager ? '已初始化' : '未初始化')
    console.log('    - 形状管理器:', this.shapeManager ? '已初始化' : '未初始化')
  }

  /**
   * 强制使用安全材质（调试用）
   */
  public useSafeMaterial(): this {
    console.log('🛡️ 切换到安全材质模式')

    // 清理旧材质
    if (this.particleMaterial) {
      this.particleMaterial.dispose()
    }

    // 创建最基础的安全材质
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xff4444,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    // 更新粒子系统
    if (this.particleSystem) {
      this.particleSystem.material = this.particleMaterial
    }

    console.log('✅ 安全材质已应用')
    return this
  }

  /**
   * 配置为刀光效果
   */
  public setupSwordTrail(config?: {
    direction?: THREE.Vector3
    speed?: number
    lifetime?: number
    color?: THREE.Color
    size?: number
  }): this {
    console.log('⚔️ 配置刀光效果...')

    // 设置单次发射
    this.setOneShot(true)
    this.setAmount(1) // 每次只发射一个粒子

    // 设置生命周期
    this.setLifetime(config?.lifetime || 3.0)

    // 设置发射方向和速度
    const direction = config?.direction || new THREE.Vector3(1, 0, 0)
    const speed = config?.speed || 5.0
    this.setEmissionDirection(direction, speed, 0.1)

    // 设置颜色
    if (config?.color) {
      this.setCustomColor(config.color, 0.1)
    } else {
      this.setColorTheme('sword')
    }

    // 设置粒子大小
    this.particleSize = config?.size || 0.2

    // 设置发射形状为点
    this.setEmissionShape(EmissionShape.POINT)

    // 禁用重力（刀光不受重力影响）
    this.setGravity(new THREE.Vector3(0, 0, 0))

    console.log('✅ 刀光效果配置完成')
    return this
  }

  /**
   * 触发刀光效果
   */
  public triggerSwordTrail(): this {
    if (this.oneShot) {
      this.restart() // 重新开始发射
      console.log('⚔️ 刀光效果已触发')
    } else {
      console.warn('⚠️ 请先调用 setupSwordTrail() 配置刀光效果')
    }
    return this
  }

  /**
   * 获取活跃粒子数量
   */
  public getActiveParticleCount(): number {
    if (this.particles && this.particles.length > 0) {
      return this.particles.filter(particle => particle.alive).length
    }
    return 0
  }



  // ============================================================================
  // 基础粒子系统方法（简化版本）
  // ============================================================================



  // ============================================================================
  // 模型支持
  // ============================================================================

  private modelPath?: string
  private loadedModel?: THREE.Object3D

  /**
   * 设置模型路径
   */
  public setModelPath(path: string): this {
    this.modelPath = path
    return this
  }

  /**
   * 设置已加载的模型对象
   */
  public setLoadedModel(model: THREE.Object3D): this {
    this.loadedModel = model
    return this
  }

  /**
   * 加载模型并提取顶点
   */
  private async loadModelForEmission(): Promise<void> {
    if (this.modelLoaded) return

    try {
      if (this.loadedModel) {
        // 使用已加载的模型
        this.extractModelVertices(this.loadedModel)
        this.modelLoaded = true
        return
      }

      if (!this.modelPath) {
        this.createFallbackVertices()
        return
      }

      // 使用ModelManager加载模型
      const modelManager = ModelManager.getInstance()
      const model = await modelManager.loadModel(this.modelPath)

      // 提取模型顶点
      this.extractModelVertices(model)
      this.modelLoaded = true
    } catch (error) {
      // 使用默认顶点作为后备
      this.createFallbackVertices()
    }
  }

  // 模型形状发射相关属性
  private modelVertices: THREE.Vector3[] = []
  private modelLoaded: boolean = false

  /**
   * 从模型场景中提取顶点
   */
  private extractModelVertices(scene: THREE.Object3D): void {
    this.modelVertices = []

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry
        const positionAttribute = geometry.attributes.position

        if (positionAttribute) {
          // 应用世界变换矩阵
          child.updateMatrixWorld()

          for (let i = 0; i < positionAttribute.count; i++) {
            const vertex = new THREE.Vector3()
            vertex.fromBufferAttribute(positionAttribute, i)

            // 应用对象的世界变换
            vertex.applyMatrix4(child.matrixWorld)

            // 缩放到合适的大小
            vertex.multiplyScalar(0.5)

            this.modelVertices.push(vertex)
          }
        }
      }
    })
  }

  /**
   * 创建后备顶点（如果模型加载失败）
   */
  private createFallbackVertices(): void {
    this.modelVertices = []

    // 创建一个简单的立方体顶点作为后备
    const size = 0.5
    for (let x = -size; x <= size; x += 0.1) {
      for (let y = -size; y <= size; y += 0.1) {
        for (let z = -size; z <= size; z += 0.1) {
          this.modelVertices.push(new THREE.Vector3(x, y, z))
        }
      }
    }

    this.modelLoaded = true
  }

  /**
   * 从模型顶点获取发射位置
   */
  private getModelEmissionPosition(): THREE.Vector3 {
    if (!this.modelLoaded || this.modelVertices.length === 0) {
      // 如果模型未加载，返回默认位置
      return new THREE.Vector3(0, 0, 0)
    }

    // 随机选择一个模型顶点
    const randomIndex = Math.floor(Math.random() * this.modelVertices.length)
    return this.modelVertices[randomIndex].clone()
  }

  /**
   * 根据发射形状获取发射位置
   */
  private getEmissionPosition(): THREE.Vector3 {
    const shape = this.emissionShape

    switch (shape) {
      case EmissionShape.SPHERE:
        // 球形发射
        const phi = Math.random() * Math.PI * 2
        const costheta = Math.random() * 2 - 1
        const u = Math.random()
        const theta = Math.acos(costheta)
        const r = Math.cbrt(u) * this.emissionConfig.shapeRadius
        return new THREE.Vector3(
          r * Math.sin(theta) * Math.cos(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(theta)
        )

      case EmissionShape.BOX:
        // 立方体发射
        const size = this.emissionConfig.shapeSize
        return new THREE.Vector3(
          (Math.random() - 0.5) * size.x,
          (Math.random() - 0.5) * size.y,
          (Math.random() - 0.5) * size.z
        )

      case EmissionShape.DISC:
        // 圆盘发射
        const angle = Math.random() * Math.PI * 2
        const radius = Math.sqrt(Math.random()) * this.emissionConfig.shapeRadius
        return new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        )

      case EmissionShape.CONE:
        // 锥形发射
        const coneAngle = Math.random() * Math.PI * 2
        const coneRadius = Math.random() * this.emissionConfig.shapeRadius
        const coneHeight = Math.random() * this.emissionConfig.shapeSize.y
        return new THREE.Vector3(
          Math.cos(coneAngle) * coneRadius,
          coneHeight,
          Math.sin(coneAngle) * coneRadius
        )

      case EmissionShape.CYLINDER:
        // 圆柱形发射
        const cylAngle = Math.random() * Math.PI * 2
        const cylRadius = Math.sqrt(Math.random()) * this.emissionConfig.shapeRadius
        const cylHeight = (Math.random() - 0.5) * this.emissionConfig.shapeSize.y
        return new THREE.Vector3(
          Math.cos(cylAngle) * cylRadius,
          cylHeight,
          Math.sin(cylAngle) * cylRadius
        )

      case EmissionShape.CUSTOM_MESH:
        // 模型形状发射
        return this.getModelEmissionPosition()

      default: // EmissionShape.POINT
        // 点发射
        return new THREE.Vector3(0, 0, 0)
    }
  }

  /**
   * 根据发射形状获取发射速度
   */
  private getEmissionVelocity(): THREE.Vector3 {
    const shape = this.emissionShape
    const baseSpeed = this.emissionConfig.initialVelocity
    const randomFactor = this.emissionConfig.velocityRandom

    switch (shape) {
      case EmissionShape.SPHERE: {
        // 球形发射 - 向外发射
        const phi = Math.random() * Math.PI * 2
        const costheta = Math.random() * 2 - 1
        const theta = Math.acos(costheta)
        const sphereSpeed = baseSpeed * (1 + (Math.random() - 0.5) * randomFactor)
        return new THREE.Vector3(
          sphereSpeed * Math.sin(theta) * Math.cos(phi),
          sphereSpeed * Math.sin(theta) * Math.sin(phi),
          sphereSpeed * Math.cos(theta)
        )
      }

      case EmissionShape.CONE: {
        // 锥形发射 - 向配置方向扩散
        const coneAngle = Math.random() * Math.PI * 2
        const coneSpread = Math.random() * 0.5 // 锥形扩散角度
        const coneDirection = this.emissionConfig.direction.clone().normalize()
        const coneSpeed = baseSpeed * (1 + (Math.random() - 0.5) * randomFactor)

        // 创建垂直于主方向的随机偏移
        const perpendicular = new THREE.Vector3()
        if (Math.abs(coneDirection.y) < 0.9) {
          perpendicular.crossVectors(coneDirection, new THREE.Vector3(0, 1, 0))
        } else {
          perpendicular.crossVectors(coneDirection, new THREE.Vector3(1, 0, 0))
        }
        perpendicular.normalize()

        const another = new THREE.Vector3().crossVectors(coneDirection, perpendicular)
        const spreadX = Math.cos(coneAngle) * coneSpread
        const spreadY = Math.sin(coneAngle) * coneSpread

        const finalDirection = coneDirection.clone()
        finalDirection.add(perpendicular.clone().multiplyScalar(spreadX))
        finalDirection.add(another.multiplyScalar(spreadY))
        finalDirection.normalize()

        return finalDirection.multiplyScalar(coneSpeed)
      }

      case EmissionShape.DISC:
      case EmissionShape.RING: {
        // 圆盘/环形发射 - 向上发射
        const discDirection = this.emissionConfig.direction.clone().normalize()
        const discSpeed = baseSpeed * (1 + (Math.random() - 0.5) * randomFactor)
        return discDirection.multiplyScalar(discSpeed)
      }

      default: {
        // 默认按配置方向发射
        const defaultDirection = this.emissionConfig.direction.clone().normalize()
        const defaultSpeed = baseSpeed * (1 + (Math.random() - 0.5) * randomFactor)

        // 添加一些随机性
        defaultDirection.add(new THREE.Vector3(
          (Math.random() - 0.5) * randomFactor,
          (Math.random() - 0.5) * randomFactor,
          (Math.random() - 0.5) * randomFactor
        ))
        defaultDirection.normalize()

        return defaultDirection.multiplyScalar(defaultSpeed)
      }
    }
  }

  /**
   * 根据颜色主题获取粒子颜色
   */
  private getParticleColor(): { r: number, g: number, b: number } {
    const colorTheme = this.particleColor
    const baseColor = this.emissionConfig.color
    const randomness = this.emissionConfig.colorRandom

    switch (colorTheme) {
      case 'ice':
        // 冰霜色彩 (蓝白)
        return {
          r: Math.random() * 0.3 + 0.7, // 白色为主
          g: Math.random() * 0.3 + 0.7,
          b: 1.0 // 蓝色
        }

      case 'magic':
        // 魔法色彩 (紫粉)
        return {
          r: Math.random() * 0.5 + 0.5, // 紫红
          g: Math.random() * 0.3,
          b: Math.random() * 0.5 + 0.5
        }

      case 'nature':
        // 自然色彩 (绿色)
        return {
          r: Math.random() * 0.3,
          g: Math.random() * 0.5 + 0.5, // 绿色为主
          b: Math.random() * 0.3
        }

      case 'rainbow':
        // 彩虹色彩 (随机)
        return {
          r: Math.random(),
          g: Math.random(),
          b: Math.random()
        }

      case 'sword':
        // 刀光色彩 (白蓝)
        return {
          r: 0.8 + Math.random() * 0.2,
          g: 0.9 + Math.random() * 0.1,
          b: 1.0
        }

      case 'custom':
        // 使用配置的基础颜色加上随机性
        return {
          r: Math.max(0, Math.min(1, baseColor.r + (Math.random() - 0.5) * randomness)),
          g: Math.max(0, Math.min(1, baseColor.g + (Math.random() - 0.5) * randomness)),
          b: Math.max(0, Math.min(1, baseColor.b + (Math.random() - 0.5) * randomness))
        }

      default: // 'fire'
        // 火焰色彩 (红橙黄)
        return {
          r: 1.0,
          g: Math.random() * 0.5 + 0.5,
          b: Math.random() * 0.3
        }
    }
  }

  /**
   * 节点进入场景树
   */
  override _enterTree(): void {
    super._enterTree()
    console.log('🎨 GPUParticles3D节点已进入场景树')
  }

  /**
   * 节点退出场景树
   */
  override _exitTree(): void {
    this.dispose()
    super._exitTree()
    console.log('🧹 GPUParticles3D节点已退出场景树')
  }

  /**
   * 销毁资源
   */
  public dispose(): void {
    if (this.particleGeometry) {
      this.particleGeometry.dispose()
    }
    if (this.particleMaterial) {
      this.particleMaterial.dispose()
    }
    if (this.particleSystem) {
      this.object3D.remove(this.particleSystem)
    }
  }
}
