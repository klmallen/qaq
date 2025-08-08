// ============================================================================
// QAQ Engine - Particle Physics Component (WebGPU Compute Shaders)
// ============================================================================

import Node3D from '../../Node3D'
import { Vector3, Matrix4 } from 'three'

/**
 * 物理力类型
 */
export enum ForceType {
  GRAVITY = 'gravity',
  WIND = 'wind',
  TURBULENCE = 'turbulence',
  VORTEX = 'vortex',
  ATTRACTOR = 'attractor',
  REPULSOR = 'repulsor',
  DRAG = 'drag',
  CUSTOM = 'custom'
}

/**
 * 碰撞类型
 */
export enum CollisionType {
  NONE = 'none',
  PLANE = 'plane',
  SPHERE = 'sphere',
  BOX = 'box',
  MESH = 'mesh'
}

/**
 * 物理力配置
 */
export interface PhysicsForce {
  id: string
  type: ForceType
  enabled: boolean
  
  // 通用属性
  strength: number
  position?: Vector3
  direction?: Vector3
  
  // 特定力类型属性
  radius?: number        // 用于吸引/排斥力
  frequency?: number     // 用于湍流
  amplitude?: number     // 用于湍流
  falloff?: number       // 衰减系数
}

/**
 * 碰撞器配置
 */
export interface PhysicsCollider {
  id: string
  type: CollisionType
  enabled: boolean
  
  // 几何属性
  position: Vector3
  rotation?: Vector3
  size?: Vector3
  radius?: number
  
  // 物理属性
  restitution: number    // 弹性系数
  friction: number       // 摩擦系数
  damping: number        // 阻尼系数
}

/**
 * 粒子物理配置
 */
export interface ParticlePhysicsConfig {
  // 全局物理属性
  gravity?: Vector3
  globalDamping?: number
  timeScale?: number
  
  // WebGPU计算着色器
  useComputeShaders?: boolean
  computeShaderPath?: string
  workgroupSize?: number
  
  // 碰撞检测
  enableCollision?: boolean
  collisionBounds?: Vector3
  
  // 性能设置
  maxForces?: number
  maxColliders?: number
  updateFrequency?: number
}

/**
 * 粒子物理组件 - WebGPU计算着色器优化
 * 
 * 设计理念：
 * - WebGPU优先：使用compute shaders进行并行计算
 * - 力场系统：支持多种物理力的组合
 * - 碰撞检测：高效的粒子-几何体碰撞
 * - 性能优化：LOD、空间分割、批处理
 * - 可扩展性：支持自定义力和碰撞器
 */
export default class ParticlePhysics extends Node3D {
  // 物理配置
  private _config: ParticlePhysicsConfig
  
  // 物理力系统
  private _forces: Map<string, PhysicsForce> = new Map()
  private _colliders: Map<string, PhysicsCollider> = new Map()
  
  // 计算着色器（回退到CPU实现）
  private _useComputeShaders: boolean = false
  
  // 物理状态
  private _particles: any[] = []
  private _velocities: Float32Array = new Float32Array()
  private _accelerations: Float32Array = new Float32Array()
  
  // 性能优化
  private _spatialGrid: Map<string, any[]> = new Map()
  private _updateCounter: number = 0
  private _lastUpdateTime: number = 0

  constructor(config: any) {
    super('ParticlePhysics')

    // 应用物理配置
    this._config = {
      gravity: new Vector3(0, -9.82, 0),
      globalDamping: 0.98,
      timeScale: 1.0,
      useComputeShaders: true,
      workgroupSize: 64,
      enableCollision: true,
      collisionBounds: new Vector3(100, 100, 100),
      maxForces: 16,
      maxColliders: 32,
      updateFrequency: 60,
      ...config.physics
    }

    this._useComputeShaders = this._config.useComputeShaders!

    // 初始化物理系统
    this._initializePhysics()

    console.log(`ParticlePhysics 初始化完成，使用计算着色器: ${this._useComputeShaders}`)
  }

  /**
   * 初始化物理系统
   */
  private _initializePhysics(): void {
    // 添加默认重力
    this.addForce({
      id: 'gravity',
      type: ForceType.GRAVITY,
      enabled: true,
      strength: 1.0,
      direction: this._config.gravity!.clone()
    })

    // 初始化WebGPU计算着色器
    if (this._useComputeShaders) {
      this._initializeComputeShaders()
    }
  }

  /**
   * 初始化计算着色器（回退到CPU实现）
   */
  private async _initializeComputeShaders(): Promise<void> {
    // 暂时禁用计算着色器，使用CPU计算
    this._useComputeShaders = false
    console.log('使用CPU物理计算（WebGPU已禁用）')
  }

  /**
   * 生成计算着色器代码
   */
  private _generateComputeShaderCode(): string {
    return `
      @group(0) @binding(0) var<storage, read_write> positions: array<vec3<f32>>;
      @group(0) @binding(1) var<storage, read_write> velocities: array<vec3<f32>>;
      @group(0) @binding(2) var<storage, read> forces: array<vec4<f32>>;
      @group(0) @binding(3) var<uniform> params: PhysicsParams;
      
      struct PhysicsParams {
        gravity: vec3<f32>,
        damping: f32,
        deltaTime: f32,
        particleCount: u32,
      };
      
      @compute @workgroup_size(${this._config.workgroupSize})
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let index = global_id.x;
        if (index >= params.particleCount) {
          return;
        }
        
        var position = positions[index];
        var velocity = velocities[index];
        var acceleration = vec3<f32>(0.0, 0.0, 0.0);
        
        // 应用重力
        acceleration += params.gravity;
        
        // 应用其他力
        // TODO: 遍历力数组并计算
        
        // 更新速度和位置
        velocity += acceleration * params.deltaTime;
        velocity *= params.damping;
        position += velocity * params.deltaTime;
        
        // 边界检查
        // TODO: 添加碰撞检测
        
        // 写回结果
        positions[index] = position;
        velocities[index] = velocity;
      }
    `
  }

  /**
   * 更新物理系统
   */
  update(deltaTime: number): void {
    this._updateCounter++
    
    // 控制更新频率
    const targetInterval = 1.0 / this._config.updateFrequency!
    if (this._updateCounter * deltaTime < targetInterval) {
      return
    }

    const physicsTime = deltaTime * this._config.timeScale!

    if (this._useComputeShaders) {
      // WebGPU计算是异步的，但我们不等待以避免阻塞主线程
      this._updateWithComputeShaders(physicsTime).catch(error => {
        console.error('WebGPU计算失败，回退到CPU:', error)
        this._useComputeShaders = false
        this._updateWithCPU(physicsTime)
      })
    } else {
      this._updateWithCPU(physicsTime)
    }

    this._updateCounter = 0
    this._lastUpdateTime = performance.now()
  }

  /**
   * 使用计算着色器更新（回退到CPU实现）
   */
  private async _updateWithComputeShaders(deltaTime: number): Promise<void> {
    // 回退到CPU计算
    this._updateWithCPU(deltaTime)
  }

  /**
   * 使用CPU更新
   */
  private _updateWithCPU(deltaTime: number): void {
    for (let i = 0; i < this._particles.length; i++) {
      const particle = this._particles[i]
      if (!particle.active) continue

      // 重置加速度
      particle.acceleration.set(0, 0, 0)

      // 应用所有力
      this._applyForces(particle)

      // 更新速度
      particle.velocity.add(
        particle.acceleration.clone().multiplyScalar(deltaTime)
      )

      // 应用阻尼
      particle.velocity.multiplyScalar(this._config.globalDamping!)

      // 更新位置
      particle.position.add(
        particle.velocity.clone().multiplyScalar(deltaTime)
      )

      // 碰撞检测
      if (this._config.enableCollision) {
        this._checkCollisions(particle)
      }

      // 边界检查
      this._checkBounds(particle)
    }
  }

  /**
   * 应用物理力
   */
  private _applyForces(particle: any): void {
    for (const force of this._forces.values()) {
      if (!force.enabled) continue

      switch (force.type) {
        case ForceType.GRAVITY:
          particle.acceleration.add(force.direction!)
          break

        case ForceType.WIND:
          const windForce = force.direction!.clone().multiplyScalar(force.strength)
          particle.acceleration.add(windForce)
          break

        case ForceType.ATTRACTOR:
          if (force.position) {
            const direction = force.position.clone().sub(particle.position)
            const distance = direction.length()
            if (distance > 0) {
              direction.normalize()
              const strength = force.strength / (distance * distance + 1)
              particle.acceleration.add(direction.multiplyScalar(strength))
            }
          }
          break

        case ForceType.TURBULENCE:
          // 简化的湍流实现
          const turbulence = new Vector3(
            (Math.random() - 0.5) * force.amplitude!,
            (Math.random() - 0.5) * force.amplitude!,
            (Math.random() - 0.5) * force.amplitude!
          )
          particle.acceleration.add(turbulence.multiplyScalar(force.strength))
          break

        case ForceType.DRAG:
          // 阻力与速度相反
          const drag = particle.velocity.clone().normalize().multiplyScalar(-force.strength)
          particle.acceleration.add(drag)
          break
      }
    }
  }

  /**
   * 检查碰撞
   */
  private _checkCollisions(particle: any): void {
    for (const collider of this._colliders.values()) {
      if (!collider.enabled) continue

      let collision = false
      let normal = new Vector3()

      switch (collider.type) {
        case CollisionType.PLANE:
          // 平面碰撞检测
          const planeY = collider.position.y
          if (particle.position.y <= planeY) {
            particle.position.y = planeY
            normal.set(0, 1, 0)
            collision = true
          }
          break

        case CollisionType.SPHERE:
          // 球体碰撞检测
          const distance = particle.position.distanceTo(collider.position)
          if (distance <= collider.radius!) {
            normal = particle.position.clone().sub(collider.position).normalize()
            particle.position.copy(
              collider.position.clone().add(normal.clone().multiplyScalar(collider.radius!))
            )
            collision = true
          }
          break

        case CollisionType.BOX:
          // 盒子碰撞检测（简化）
          const halfSize = collider.size!.clone().multiplyScalar(0.5)
          const localPos = particle.position.clone().sub(collider.position)
          
          if (Math.abs(localPos.x) <= halfSize.x &&
              Math.abs(localPos.y) <= halfSize.y &&
              Math.abs(localPos.z) <= halfSize.z) {
            // 简化的法线计算
            normal.set(
              localPos.x > 0 ? 1 : -1,
              localPos.y > 0 ? 1 : -1,
              localPos.z > 0 ? 1 : -1
            ).normalize()
            collision = true
          }
          break
      }

      if (collision) {
        // 应用碰撞响应
        this._applyCollisionResponse(particle, normal, collider)
      }
    }
  }

  /**
   * 应用碰撞响应
   */
  private _applyCollisionResponse(particle: any, normal: Vector3, collider: PhysicsCollider): void {
    // 反射速度
    const dotProduct = particle.velocity.dot(normal)
    if (dotProduct < 0) {
      const reflection = normal.clone().multiplyScalar(2 * dotProduct)
      particle.velocity.sub(reflection)
      
      // 应用弹性和摩擦
      particle.velocity.multiplyScalar(collider.restitution)
      
      // 简化的摩擦力
      const tangent = particle.velocity.clone().sub(
        normal.clone().multiplyScalar(particle.velocity.dot(normal))
      )
      tangent.multiplyScalar(1 - collider.friction)
      particle.velocity.copy(
        normal.clone().multiplyScalar(particle.velocity.dot(normal)).add(tangent)
      )
    }
  }

  /**
   * 检查边界
   */
  private _checkBounds(particle: any): void {
    const bounds = this._config.collisionBounds!
    const halfBounds = bounds.clone().multiplyScalar(0.5)

    // 简单的边界反弹
    if (Math.abs(particle.position.x) > halfBounds.x) {
      particle.position.x = Math.sign(particle.position.x) * halfBounds.x
      particle.velocity.x *= -0.8
    }
    if (Math.abs(particle.position.y) > halfBounds.y) {
      particle.position.y = Math.sign(particle.position.y) * halfBounds.y
      particle.velocity.y *= -0.8
    }
    if (Math.abs(particle.position.z) > halfBounds.z) {
      particle.position.z = Math.sign(particle.position.z) * halfBounds.z
      particle.velocity.z *= -0.8
    }
  }

  // ========================================================================
  // 公共API - 力场管理
  // ========================================================================

  /**
   * 添加物理力
   */
  addForce(force: PhysicsForce): void {
    this._forces.set(force.id, force)
    console.log(`添加物理力: ${force.id} (${force.type})`)
  }

  /**
   * 移除物理力
   */
  removeForce(forceId: string): void {
    this._forces.delete(forceId)
    console.log(`移除物理力: ${forceId}`)
  }

  /**
   * 更新物理力
   */
  updateForce(forceId: string, updates: Partial<PhysicsForce>): void {
    const force = this._forces.get(forceId)
    if (force) {
      Object.assign(force, updates)
      console.log(`更新物理力: ${forceId}`)
    }
  }

  /**
   * 添加碰撞器
   */
  addCollider(collider: PhysicsCollider): void {
    this._colliders.set(collider.id, collider)
    console.log(`添加碰撞器: ${collider.id} (${collider.type})`)
  }

  /**
   * 移除碰撞器
   */
  removeCollider(colliderId: string): void {
    this._colliders.delete(colliderId)
    console.log(`移除碰撞器: ${colliderId}`)
  }

  /**
   * 设置粒子数据
   */
  setParticles(particles: any[]): void {
    this._particles = particles
    
    // 重新分配缓冲区
    const count = particles.length
    this._velocities = new Float32Array(count * 3)
    this._accelerations = new Float32Array(count * 3)
  }

  /**
   * 获取物理统计
   */
  getPhysicsStatistics(): any {
    return {
      particleCount: this._particles.length,
      forceCount: this._forces.size,
      colliderCount: this._colliders.size,
      useComputeShaders: this._useComputeShaders,
      lastUpdateTime: this._lastUpdateTime,
      updateFrequency: this._config.updateFrequency
    }
  }

  /**
   * 销毁物理系统
   */
  override destroy(): void {
    this._forces.clear()
    this._colliders.clear()
    this._particles = []
    
    // 清理资源
    this._useComputeShaders = false

    super.destroy()
    console.log('ParticlePhysics 已销毁')
  }
}
