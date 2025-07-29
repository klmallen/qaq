/**
 * QAQ游戏引擎 - StaticBody3D 静态物理体节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 静态物理体节点，用于不移动的物体（如地面、墙壁、建筑物）
 * - 继承自Node3D，具有完整的3D变换功能
 * - 与PhysicsServer集成，提供物理碰撞检测
 * - 支持多种碰撞形状（盒子、球体、平面、网格等）
 * - 自动与Three.js渲染对象同步
 *
 * 架构设计:
 * - 基于Godot的StaticBody3D设计
 * - 与PhysicsServer的深度集成
 * - 支持碰撞形状的动态添加和移除
 * - 完整的生命周期管理
 *
 * 核心功能:
 * - 静态物理体的创建和管理
 * - 碰撞形状的配置和更新
 * - 物理材质的设置和管理
 * - 碰撞检测和响应
 * - 与渲染系统的同步
 */

import Node3D from '../Node3D'
import PhysicsServer, { PhysicsBodyType, CollisionShapeType } from '../../physics/PhysicsServer'
import type { Vector3 } from '../../../types/core'

// ============================================================================
// StaticBody3D相关接口和枚举
// ============================================================================

/**
 * 静态体配置接口
 */
export interface StaticBodyConfig {
  /** 是否启用物理体 */
  enabled?: boolean
  /** 碰撞层 */
  collisionLayer?: number
  /** 碰撞掩码 */
  collisionMask?: number
  /** 物理材质名称 */
  materialName?: string
  /** 是否可见（调试用） */
  debugVisible?: boolean
}

/**
 * 碰撞形状配置接口
 */
export interface CollisionShapeConfig {
  /** 形状类型 */
  type: CollisionShapeType
  /** 形状参数 */
  parameters: any
  /** 相对位置 */
  position?: Vector3
  /** 相对旋转 */
  rotation?: Vector3
  /** 是否启用 */
  enabled?: boolean
}

// ============================================================================
// StaticBody3D 类实现
// ============================================================================

/**
 * StaticBody3D 类 - 静态物理体节点
 *
 * 主要功能:
 * 1. 静态物理体的创建和管理
 * 2. 碰撞形状的配置和更新
 * 3. 物理材质的设置
 * 4. 与渲染系统的同步
 * 5. 碰撞检测和查询
 */
export class StaticBody3D extends Node3D {
  // ========================================================================
  // 私有属性 - 物理体管理
  // ========================================================================

  /** 物理服务器引用 */
  private _physicsServer: PhysicsServer

  /** 物理体ID */
  private _bodyId: string

  /** 物理体实例 */
  private _physicsBody: any = null

  /** 碰撞形状列表 */
  private _collisionShapes: Map<string, any> = new Map()

  /** 静态体配置 */
  private _config: StaticBodyConfig

  /** 是否已初始化物理体 */
  private _physicsInitialized: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 静态体配置
   */
  constructor(name: string = 'StaticBody3D', config: StaticBodyConfig = {}) {
    super(name)

    this._physicsServer = PhysicsServer.getInstance()
    this._bodyId = `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this._config = {
      enabled: true,
      collisionLayer: 1,
      collisionMask: 1,
      materialName: 'default',
      debugVisible: false,
      ...config
    }

    // StaticBody3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取物理体ID
   * @returns 物理体ID
   */
  get bodyId(): string {
    return this._bodyId
  }

  /**
   * 获取物理体实例
   * @returns 物理体实例
   */
  get physicsBody(): any {
    return this._physicsBody
  }

  /**
   * 获取是否启用物理
   * @returns 是否启用
   */
  get enabled(): boolean {
    return this._config.enabled || false
  }

  /**
   * 设置是否启用物理
   * @param value 是否启用
   */
  set enabled(value: boolean) {
    this._config.enabled = value
    if (this._physicsInitialized) {
      this._updatePhysicsEnabled()
    }
  }

  /**
   * 获取碰撞层
   * @returns 碰撞层
   */
  get collisionLayer(): number {
    return this._config.collisionLayer || 1
  }

  /**
   * 设置碰撞层
   * @param value 碰撞层
   */
  set collisionLayer(value: number) {
    this._config.collisionLayer = value
    if (this._physicsBody) {
      // 更新物理体的碰撞层
      this._physicsBody.collisionFilterGroup = value
    }
  }

  /**
   * 获取碰撞掩码
   * @returns 碰撞掩码
   */
  get collisionMask(): number {
    return this._config.collisionMask || 1
  }

  /**
   * 设置碰撞掩码
   * @param value 碰撞掩码
   */
  set collisionMask(value: number) {
    this._config.collisionMask = value
    if (this._physicsBody) {
      // 更新物理体的碰撞掩码
      this._physicsBody.collisionFilterMask = value
    }
  }

  /**
   * 获取物理材质名称
   * @returns 材质名称
   */
  get materialName(): string {
    return this._config.materialName || 'default'
  }

  /**
   * 设置物理材质名称
   * @param value 材质名称
   */
  set materialName(value: string) {
    this._config.materialName = value
    if (this._physicsInitialized) {
      this._physicsServer.setBodyMaterial(this._bodyId, value)
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  _ready(): void {
    super._ready()
    this._initializePhysics()
  }

  /**
   * 每帧更新时调用
   * @param deltaTime 时间增量
   */
  _process(deltaTime: number): void {
    super._process(deltaTime)

    if (this._physicsInitialized && this._config.enabled) {
      this._syncFromPhysics()
    }
  }

  /**
   * 节点退出场景树时调用
   */
  _exitTree(): void {
    this._cleanupPhysics()
    super._exitTree()
  }

  // ========================================================================
  // 物理体管理方法
  // ========================================================================

  /**
   * 初始化物理体
   */
  private _initializePhysics(): void {
    if (this._physicsInitialized || !this._physicsServer.initialized) {
      return
    }

    try {
      // 创建默认的盒子碰撞形状（如果没有手动添加形状）
      if (this._collisionShapes.size === 0) {
        this.addBoxShape({ x: 1, y: 1, z: 1 })
      }

      // 获取第一个碰撞形状作为主形状
      const firstShape = this._collisionShapes.values().next().value

      // 创建静态物理体
      this._physicsBody = this._physicsServer.createBody(
        this._bodyId,
        PhysicsBodyType.STATIC,
        firstShape,
        this.position,
        0 // 静态体质量为0
      )

      // 设置碰撞过滤
      this._physicsBody.collisionFilterGroup = this.collisionLayer
      this._physicsBody.collisionFilterMask = this.collisionMask

      // 设置材质
      this._physicsServer.setBodyMaterial(this._bodyId, this.materialName)

      // 同步初始变换
      this._syncToPhysics()

      this._physicsInitialized = true
      console.log(`StaticBody3D physics initialized: ${this.name}`)

    } catch (error) {
      console.error(`Failed to initialize StaticBody3D physics: ${this.name}`, error)
    }
  }

  /**
   * 清理物理体
   */
  private _cleanupPhysics(): void {
    if (this._physicsInitialized) {
      this._physicsServer.removeBody(this._bodyId)
      this._physicsBody = null
      this._physicsInitialized = false
      console.log(`StaticBody3D physics cleaned up: ${this.name}`)
    }
  }

  /**
   * 更新物理启用状态
   */
  private _updatePhysicsEnabled(): void {
    if (!this._physicsInitialized) return

    if (this._config.enabled) {
      // 重新添加到物理世界
      if (!this._physicsServer.getBody(this._bodyId)) {
        this._initializePhysics()
      }
    } else {
      // 从物理世界移除
      this._physicsServer.removeBody(this._bodyId)
    }
  }

  /**
   * 同步变换到物理体
   */
  private _syncToPhysics(): void {
    if (this._physicsBody && this.object3D) {
      this._physicsServer.syncFromThreeObject(this.object3D, this._physicsBody)
    }
  }

  /**
   * 从物理体同步变换
   */
  private _syncFromPhysics(): void {
    if (this._physicsBody && this.object3D) {
      this._physicsServer.syncToThreeObject(this._physicsBody, this.object3D)
    }
  }

  // ========================================================================
  // 碰撞形状管理方法
  // ========================================================================

  /**
   * 添加盒子碰撞形状
   * @param size 盒子尺寸
   * @param position 相对位置
   * @param id 形状ID（可选）
   * @returns 形状ID
   */
  addBoxShape(size: Vector3, position?: Vector3, id?: string): string {
    const shapeId = id || `box_${Date.now()}`
    const shape = this._physicsServer.createBoxShape(size)

    this._collisionShapes.set(shapeId, shape)

    if (this._physicsInitialized) {
      this._updatePhysicsShapes()
    }

    console.log(`Box shape added to ${this.name}: ${shapeId}`)
    return shapeId
  }

  /**
   * 添加球体碰撞形状
   * @param radius 球体半径
   * @param position 相对位置
   * @param id 形状ID（可选）
   * @returns 形状ID
   */
  addSphereShape(radius: number, position?: Vector3, id?: string): string {
    const shapeId = id || `sphere_${Date.now()}`
    const shape = this._physicsServer.createSphereShape(radius)

    this._collisionShapes.set(shapeId, shape)

    if (this._physicsInitialized) {
      this._updatePhysicsShapes()
    }

    console.log(`Sphere shape added to ${this.name}: ${shapeId}`)
    return shapeId
  }

  /**
   * 添加平面碰撞形状
   * @param position 相对位置
   * @param id 形状ID（可选）
   * @returns 形状ID
   */
  addPlaneShape(position?: Vector3, id?: string): string {
    const shapeId = id || `plane_${Date.now()}`
    const shape = this._physicsServer.createPlaneShape()

    this._collisionShapes.set(shapeId, shape)

    if (this._physicsInitialized) {
      this._updatePhysicsShapes()
    }

    console.log(`Plane shape added to ${this.name}: ${shapeId}`)
    return shapeId
  }

  /**
   * 移除碰撞形状
   * @param shapeId 形状ID
   */
  removeShape(shapeId: string): void {
    if (this._collisionShapes.has(shapeId)) {
      this._collisionShapes.delete(shapeId)

      if (this._physicsInitialized) {
        this._updatePhysicsShapes()
      }

      console.log(`Shape removed from ${this.name}: ${shapeId}`)
    } else {
      console.warn(`Shape not found in ${this.name}: ${shapeId}`)
    }
  }

  /**
   * 更新物理体的碰撞形状
   */
  private _updatePhysicsShapes(): void {
    if (!this._physicsBody) return

    // 清除现有形状
    this._physicsBody.shapes = []

    // 添加所有形状
    this._collisionShapes.forEach(shape => {
      this._physicsBody.addShape(shape)
    })
  }

  /**
   * 获取静态体统计信息
   * @returns 统计信息
   */
  getStats(): {
    bodyId: string
    enabled: boolean
    shapeCount: number
    collisionLayer: number
    collisionMask: number
    materialName: string
    physicsInitialized: boolean
  } {
    return {
      bodyId: this._bodyId,
      enabled: this.enabled,
      shapeCount: this._collisionShapes.size,
      collisionLayer: this.collisionLayer,
      collisionMask: this.collisionMask,
      materialName: this.materialName,
      physicsInitialized: this._physicsInitialized
    }
  }

  /**
   * 销毁静态体
   */
  destroy(): void {
    this._cleanupPhysics()
    this._collisionShapes.clear()
    super.destroy()
  }
}

// ============================================================================
// 导出
// ============================================================================

export { CollisionShapeType }
export default StaticBody3D
