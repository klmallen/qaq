/**
 * QAQ游戏引擎 - RigidBody3D 刚体物理节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 刚体物理节点，用于受物理力影响的动态物体
 * - 继承自Node3D，具有完整的3D变换功能
 * - 与PhysicsServer集成，提供完整的物理仿真
 * - 支持质量、重心、惯性等物理属性
 * - 支持力、冲量、速度控制
 * - 支持多种碰撞形状和物理材质
 *
 * 架构设计:
 * - 基于Godot的RigidBody3D设计
 * - 与PhysicsServer的深度集成
 * - 支持物理属性的动态调整
 * - 完整的生命周期管理
 *
 * 核心功能:
 * - 动态物理体的创建和管理
 * - 质量和惯性的配置
 * - 力和冲量的应用
 * - 速度和角速度控制
 * - 碰撞检测和响应
 * - 休眠和唤醒机制
 */

import Node3D from '../Node3D'
import PhysicsServer, { PhysicsBodyType, CollisionShapeType } from '../../physics/PhysicsServer'
import type { Vector3 } from '../../../types/core'

// ============================================================================
// RigidBody3D相关接口和枚举
// ============================================================================

/**
 * 刚体模式枚举
 */
export enum RigidBodyMode {
  /** 动态模式 - 受物理力影响 */
  DYNAMIC = 'dynamic',
  /** 运动学模式 - 可移动但不受力影响 */
  KINEMATIC = 'kinematic',
  /** 静态模式 - 不移动 */
  STATIC = 'static'
}

/**
 * 刚体配置接口
 */
export interface RigidBodyConfig {
  /** 刚体模式 */
  mode?: RigidBodyMode
  /** 质量 */
  mass?: number
  /** 是否启用物理体 */
  enabled?: boolean
  /** 碰撞层 */
  collisionLayer?: number
  /** 碰撞掩码 */
  collisionMask?: number
  /** 物理材质名称 */
  materialName?: string
  /** 重心偏移 */
  centerOfMass?: Vector3
  /** 线性阻尼 */
  linearDamping?: number
  /** 角阻尼 */
  angularDamping?: number
  /** 是否可以休眠 */
  canSleep?: boolean
  /** 是否锁定旋转 */
  lockRotation?: boolean
  /** 重力缩放 */
  gravityScale?: number
}

// ============================================================================
// RigidBody3D 类实现
// ============================================================================

/**
 * RigidBody3D 类 - 刚体物理节点
 *
 * 主要功能:
 * 1. 动态物理体的创建和管理
 * 2. 物理属性的配置和控制
 * 3. 力和运动的应用
 * 4. 碰撞检测和响应
 * 5. 与渲染系统的同步
 */
export class RigidBody3D extends Node3D {
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

  /** 刚体配置 */
  private _config: RigidBodyConfig

  /** 是否已初始化物理体 */
  private _physicsInitialized: boolean = false

  /** 是否正在休眠 */
  private _sleeping: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 刚体配置
   */
  constructor(name: string = 'RigidBody3D', config: RigidBodyConfig = {}) {
    super(name)

    this._physicsServer = PhysicsServer.getInstance()
    this._bodyId = `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this._config = {
      mode: RigidBodyMode.DYNAMIC,
      mass: 1.0,
      enabled: true,
      collisionLayer: 1,
      collisionMask: 1,
      materialName: 'default',
      centerOfMass: { x: 0, y: 0, z: 0 },
      linearDamping: 0.1,
      angularDamping: 0.1,
      canSleep: true,
      lockRotation: false,
      gravityScale: 1.0,
      ...config
    }

    // RigidBody3D节点初始化完成
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
   * 获取刚体模式
   * @returns 刚体模式
   */
  get mode(): RigidBodyMode {
    return this._config.mode || RigidBodyMode.DYNAMIC
  }

  /**
   * 设置刚体模式
   * @param value 刚体模式
   */
  set mode(value: RigidBodyMode) {
    this._config.mode = value
    if (this._physicsInitialized) {
      this._updatePhysicsMode()
    }
  }

  /**
   * 获取质量
   * @returns 质量
   */
  get mass(): number {
    return this._config.mass || 1.0
  }

  /**
   * 设置质量
   * @param value 质量
   */
  set mass(value: number) {
    this._config.mass = value
    if (this._physicsBody) {
      this._physicsBody.mass = value
      this._physicsBody.updateMassProperties()
    }
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
   * 获取线性速度
   * @returns 线性速度
   */
  get linearVelocity(): Vector3 {
    if (this._physicsBody) {
      return {
        x: this._physicsBody.velocity.x,
        y: this._physicsBody.velocity.y,
        z: this._physicsBody.velocity.z
      }
    }
    return { x: 0, y: 0, z: 0 }
  }

  /**
   * 设置线性速度
   * @param value 线性速度
   */
  set linearVelocity(value: Vector3) {
    if (this._physicsBody) {
      this._physicsBody.velocity.set(value.x, value.y, value.z)
    }
  }

  /**
   * 获取角速度
   * @returns 角速度
   */
  get angularVelocity(): Vector3 {
    if (this._physicsBody) {
      return {
        x: this._physicsBody.angularVelocity.x,
        y: this._physicsBody.angularVelocity.y,
        z: this._physicsBody.angularVelocity.z
      }
    }
    return { x: 0, y: 0, z: 0 }
  }

  /**
   * 设置角速度
   * @param value 角速度
   */
  set angularVelocity(value: Vector3) {
    if (this._physicsBody) {
      this._physicsBody.angularVelocity.set(value.x, value.y, value.z)
    }
  }

  /**
   * 获取是否正在休眠
   * @returns 是否休眠
   */
  get sleeping(): boolean {
    return this._sleeping
  }

  /**
   * 获取重力缩放
   * @returns 重力缩放
   */
  get gravityScale(): number {
    return this._config.gravityScale || 1.0
  }

  /**
   * 设置重力缩放
   * @param value 重力缩放
   */
  set gravityScale(value: number) {
    this._config.gravityScale = value
    // 在物理更新中应用重力缩放
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
      this._updatePhysicsState()
      // console.log(`${this.name} position:`, this._physicsBody.position)
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

      // 根据模式确定物理体类型
      let bodyType = PhysicsBodyType.DYNAMIC
      let mass = this.mass

      switch (this.mode) {
        case RigidBodyMode.STATIC:
          bodyType = PhysicsBodyType.STATIC
          mass = 0
          break
        case RigidBodyMode.KINEMATIC:
          bodyType = PhysicsBodyType.KINEMATIC
          mass = 0
          break
        case RigidBodyMode.DYNAMIC:
          bodyType = PhysicsBodyType.DYNAMIC
          break
      }

      // 创建物理体
      this._physicsBody = this._physicsServer.createBody(
        this._bodyId,
        bodyType,
        firstShape,
        this.position,
        mass
      )

      // 设置物理属性
      this._applyPhysicsProperties()

      // 同步初始变换
      this._syncToPhysics()

      this._physicsInitialized = true
      console.log(`RigidBody3D physics initialized: ${this.name}`)

    } catch (error) {
      console.error(`Failed to initialize RigidBody3D physics: ${this.name}`, error)
    }
  }

  /**
   * 应用物理属性
   */
  private _applyPhysicsProperties(): void {
    if (!this._physicsBody) return

    // 设置碰撞过滤
    this._physicsBody.collisionFilterGroup = this._config.collisionLayer
    this._physicsBody.collisionFilterMask = this._config.collisionMask

    // 设置阻尼
    this._physicsBody.linearDamping = this._config.linearDamping
    this._physicsBody.angularDamping = this._config.angularDamping

    // 设置休眠
    this._physicsBody.allowSleep = this._config.canSleep

    // 设置材质
    this._physicsServer.setBodyMaterial(this._bodyId, this._config.materialName || 'default')
  }

  /**
   * 更新物理模式
   */
  private _updatePhysicsMode(): void {
    if (!this._physicsBody) return

    switch (this.mode) {
      case RigidBodyMode.STATIC:
        this._physicsBody.type = 0 // STATIC
        this._physicsBody.mass = 0
        break
      case RigidBodyMode.KINEMATIC:
        this._physicsBody.type = 1 // KINEMATIC
        this._physicsBody.mass = 0
        break
      case RigidBodyMode.DYNAMIC:
        this._physicsBody.type = 2 // DYNAMIC
        this._physicsBody.mass = this.mass
        break
    }

    this._physicsBody.updateMassProperties()
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
   * 更新物理状态
   */
  private _updatePhysicsState(): void {
    if (!this._physicsBody) return

    // 检查休眠状态
    this._sleeping = this._physicsBody.sleepState === 2 // SLEEPING

    // 应用重力缩放
    if (this._config.gravityScale !== 1.0) {
      const gravity = this._physicsServer.gravity
      const scaledGravity = {
        x: gravity.x * this._config.gravityScale!,
        y: gravity.y * this._config.gravityScale!,
        z: gravity.z * this._config.gravityScale!
      }
      // 应用额外的重力力
      this.applyForce(scaledGravity)
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
      console.log(`RigidBody3D physics cleaned up: ${this.name}`)
    }
  }

  /**
   * 同步变换到物理体
   */
  private _syncToPhysics(): void {
    if (!this._physicsBody) return

    try {
      // 直接使用QAQ节点的位置和旋转
      if (this._physicsBody.position && this.position) {
        this._physicsBody.position.set(this.position.x, this.position.y, this.position.z)
      }

      // 如果有旋转信息，也同步（简化版，避免Three.js依赖）
      if (this._physicsBody.quaternion && this.rotation) {
        // 简单的欧拉角到四元数转换（仅Y轴旋转）
        const halfY = this.rotation.y * 0.5
        this._physicsBody.quaternion.set(0, Math.sin(halfY), 0, Math.cos(halfY))
      }

      console.log(`🔄 同步QAQ位置到物理体 ${this.name}: ${JSON.stringify(this.position)}`)
    } catch (error) {
      console.warn(`Failed to sync to physics for ${this.name}:`, error)
    }
  }

  /**
   * 从物理体同步变换（自动化同步机制）
   */
  private _syncFromPhysics(): void {
    if (!this._physicsBody || !this._physicsInitialized) {
      return
    }

    try {
      // 获取CANNON物理体的实际位置和旋转
      const cannonBody = this._physicsBody
      if (!cannonBody || !cannonBody.position) {
        return
      }

      const newPosition = {
        x: cannonBody.position.x,
        y: cannonBody.position.y,
        z: cannonBody.position.z
      }

      const newQuaternion = {
        x: cannonBody.quaternion.x,
        y: cannonBody.quaternion.y,
        z: cannonBody.quaternion.z,
        w: cannonBody.quaternion.w
      }

      // 1. 同步到父对象（通常是MeshInstance3D）
      if (this.parent && this.parent.object3D) {
        // 更新Three.js对象位置
        this.parent.object3D.position.set(newPosition.x, newPosition.y, newPosition.z)
        this.parent.object3D.quaternion.set(newQuaternion.x, newQuaternion.y, newQuaternion.z, newQuaternion.w)

        // 更新父对象的QAQ位置属性
        this.parent.position = { ...newPosition }

        // 如果父对象有rotation属性，也更新它（简化版四元数到欧拉角转换）
        if ('rotation' in this.parent) {
          // 简化的四元数到欧拉角转换（主要处理Y轴旋转）
          const { x, y, z, w } = newQuaternion
          const yRotation = Math.atan2(2 * (w * y + x * z), 1 - 2 * (y * y + z * z))
          this.parent.rotation = {
            x: 0, // 简化处理
            y: yRotation,
            z: 0  // 简化处理
          }
        }
      }

      // 2. 备用：同步到自己的object3D
      if (this.object3D) {
        this.object3D.position.set(newPosition.x, newPosition.y, newPosition.z)
        this.object3D.quaternion.set(newQuaternion.x, newQuaternion.y, newQuaternion.z, newQuaternion.w)
      }

      // 3. 更新自己的位置属性
      this.position = { ...newPosition }

    } catch (error) {
      console.warn(`Physics sync error for ${this.name}:`, error)
    }
  }

  // ========================================================================
  // 力和运动控制方法
  // ========================================================================

  /**
   * 应用力到刚体
   * @param force 力向量
   * @param relativePoint 相对作用点（可选）
   */
  applyForce(force: Vector3, relativePoint?: Vector3): void {
    if (!this._physicsInitialized || this.mode !== RigidBodyMode.DYNAMIC) {
      return
    }

    this._physicsServer.applyForce(this._bodyId, force, relativePoint)
    this._wakeUp()
  }

  /**
   * 应用冲量到刚体
   * @param impulse 冲量向量
   * @param relativePoint 相对作用点（可选）
   */
  applyImpulse(impulse: Vector3, relativePoint?: Vector3): void {
    if (!this._physicsInitialized || this.mode !== RigidBodyMode.DYNAMIC) {
      return
    }

    this._physicsServer.applyImpulse(this._bodyId, impulse, relativePoint)
    this._wakeUp()
  }

  /**
   * 应用中心力
   * @param force 力向量
   */
  applyCentralForce(force: Vector3): void {
    this.applyForce(force)
  }

  /**
   * 应用中心冲量
   * @param impulse 冲量向量
   */
  applyCentralImpulse(impulse: Vector3): void {
    this.applyImpulse(impulse)
  }

  /**
   * 唤醒刚体
   */
  private _wakeUp(): void {
    if (this._physicsBody && this._physicsBody.wakeUp) {
      this._physicsBody.wakeUp()
      this._sleeping = false
    }
  }

  /**
   * 让刚体休眠
   */
  sleep(): void {
    if (this._physicsBody && this._physicsBody.sleep) {
      this._physicsBody.sleep()
      this._sleeping = true
    }
  }

  /**
   * 唤醒刚体
   */
  wakeUp(): void {
    this._wakeUp()
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

    // 更新质量属性
    this._physicsBody.updateMassProperties()
  }

  /**
   * 获取刚体统计信息
   * @returns 统计信息
   */
  getStats(): {
    bodyId: string
    mode: RigidBodyMode
    mass: number
    enabled: boolean
    sleeping: boolean
    linearVelocity: Vector3
    angularVelocity: Vector3
    shapeCount: number
  } {
    return {
      bodyId: this._bodyId,
      mode: this.mode,
      mass: this.mass,
      enabled: this.enabled,
      sleeping: this.sleeping,
      linearVelocity: this.linearVelocity,
      angularVelocity: this.angularVelocity,
      shapeCount: this._collisionShapes.size
    }
  }

  /**
   * 销毁刚体
   */
  destroy(): void {
    this._cleanupPhysics()
    this._collisionShapes.clear()
    super.destroy()
  }

  /**
   * 智能推断并添加碰撞形状
   * 从父节点的MeshInstance3D自动推断碰撞形状和位置
   * 支持基于实际几何体数据的精确碰撞检测
   */
  addAutoCollisionShape(options?: {
    scale?: Vector3
    useTrimesh?: boolean
    excludeNames?: string[]
    simplifyThreshold?: number
  }): void {
    const opts = {
      useTrimesh: false,
      excludeNames: [],
      simplifyThreshold: 1000,
      ...options
    }

    // 查找父节点中的MeshInstance3D
    let meshInstance: any = null

    // 检查父节点
    if (this.parent && this.parent.constructor.name === 'MeshInstance3D') {
      meshInstance = this.parent
    }

    if (!meshInstance) {
      console.warn('无法找到MeshInstance3D父节点，无法自动推断碰撞形状')
      return
    }

    // 自动同步世界坐标位置和旋转
    this._syncWorldTransform(meshInstance)

    // 获取实际的Three.js几何体数据
    const geometryData = this._extractGeometryData(meshInstance, opts.excludeNames)

    if (!geometryData) {
      console.warn('无法提取几何体数据，使用默认BOX形状')
      this.addBoxShape({ x: 1, y: 1, z: 1 })
      return
    }

    console.log(`自动推断动态碰撞形状，顶点数: ${geometryData.vertexCount}`)

    // 根据几何体复杂度选择碰撞形状
    this._createOptimalCollisionShape(geometryData, opts)

    // 启用持续位置同步（仅在初始化时）
    this._enableAutoSync()
  }

  /**
   * 同步世界坐标变换
   */
  private _syncWorldTransform(meshInstance: any): void {
    const threeObject = meshInstance.object3D

    // 检查THREE.js是否可用
    const THREE = (window as any).THREE
    if (!THREE) {
      console.warn('THREE.js未加载，使用本地坐标')
      this.position = { ...meshInstance.position }
      this.rotation = { ...meshInstance.rotation }
      return
    }

    if (threeObject && typeof threeObject.getWorldPosition === 'function') {
      try {
        // 获取世界位置
        const worldPosition = new THREE.Vector3()
        threeObject.getWorldPosition(worldPosition)
        this.position = { x: worldPosition.x, y: worldPosition.y, z: worldPosition.z }

        // 获取世界旋转
        const worldQuaternion = new THREE.Quaternion()
        threeObject.getWorldQuaternion(worldQuaternion)

        // 转换四元数为欧拉角
        const euler = new THREE.Euler()
        euler.setFromQuaternion(worldQuaternion)
        this.rotation = { x: euler.x, y: euler.y, z: euler.z }

        console.log(`同步世界坐标 - 位置: ${JSON.stringify(this.position)}, 旋转: ${JSON.stringify(this.rotation)}`)
      } catch (error) {
        console.warn('获取世界坐标失败，使用本地坐标:', error)
        this.position = { ...meshInstance.position }
        this.rotation = { ...meshInstance.rotation }
      }
    } else {
      // 回退到本地坐标
      this.position = { ...meshInstance.position }
      this.rotation = { ...meshInstance.rotation }
      console.log(`使用本地坐标 - 位置: ${JSON.stringify(this.position)}`)
    }
  }

  /**
   * 提取几何体数据
   */
  private _extractGeometryData(meshInstance: any, excludeNames: string[]): any {
    const threeObject = meshInstance.object3D
    if (!threeObject) {
      return null
    }

    let geometryData: any = null

    // 遍历Three.js对象树，提取几何体数据
    threeObject.traverse((child: any) => {
      if (child.isMesh && child.geometry) {
        // 检查是否在排除列表中
        const shouldExclude = excludeNames.some(name =>
          child.name.includes(name) || child.name.search(name) !== -1
        )

        if (shouldExclude) {
          console.log(`跳过排除的网格: ${child.name}`)
          return
        }

        const geometry = child.geometry
        const positions = geometry.attributes.position?.array
        const indices = geometry.index?.array

        if (positions) {
          geometryData = {
            positions: positions,
            indices: indices,
            vertexCount: positions.length / 3,
            hasIndices: !!indices,
            name: child.name || 'unnamed',
            geometry: geometry
          }

          console.log(`提取几何体数据: ${geometryData.name}, 顶点数: ${geometryData.vertexCount}`)
        }
      }
    })

    return geometryData
  }

  /**
   * 根据几何体复杂度创建最优碰撞形状
   */
  private _createOptimalCollisionShape(geometryData: any, options: any): void {
    const { positions, indices, vertexCount, geometry } = geometryData
    const { scale, useTrimesh, simplifyThreshold } = options

    // 动态刚体通常不使用Trimesh（性能考虑），除非明确指定
    const shouldUseTrimesh = useTrimesh && indices && vertexCount <= simplifyThreshold

    if (shouldUseTrimesh) {
      // 使用Trimesh进行精确碰撞（谨慎使用）
      this._createTrimeshShape(positions, indices, scale)
    } else {
      // 使用简化的基础形状（推荐）
      this._createSimplifiedShape(geometry, scale)
    }
  }

  /**
   * 创建Trimesh碰撞形状（动态刚体慎用）
   */
  private _createTrimeshShape(positions: Float32Array, indices: Uint16Array | Uint32Array, scale?: Vector3): void {
    console.warn('动态刚体使用Trimesh可能影响性能，建议使用简化形状')

    try {
      const CANNON = (window as any).CANNON
      if (!CANNON) {
        console.warn('CANNON物理引擎未加载，无法创建Trimesh')
        return
      }

      // 应用缩放
      let scaledPositions = positions
      if (scale) {
        scaledPositions = new Float32Array(positions.length)
        for (let i = 0; i < positions.length; i += 3) {
          scaledPositions[i] = positions[i] * scale.x
          scaledPositions[i + 1] = positions[i + 1] * scale.y
          scaledPositions[i + 2] = positions[i + 2] * scale.z
        }
      }

      // 创建Trimesh
      const trimesh = new CANNON.Trimesh(scaledPositions, indices)

      // 添加到物理体
      this.addCustomShape(trimesh)

      console.log(`创建动态Trimesh碰撞形状，顶点数: ${positions.length / 3}, 索引数: ${indices.length}`)
    } catch (error) {
      console.error('创建Trimesh失败:', error)
      // 回退到简化形状
      this.addBoxShape({ x: 1, y: 1, z: 1 })
    }
  }

  /**
   * 创建简化的基础碰撞形状
   */
  private _createSimplifiedShape(geometry: any, scale?: Vector3): void {
    // 计算包围盒
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox()
    }

    const boundingBox = geometry.boundingBox
    if (!boundingBox) {
      console.warn('无法计算包围盒，使用默认BOX形状')
      this.addBoxShape({ x: 1, y: 1, z: 1 })
      return
    }

    // 计算尺寸
    let size = {
      x: (boundingBox.max.x - boundingBox.min.x) / 2,
      y: (boundingBox.max.y - boundingBox.min.y) / 2,
      z: (boundingBox.max.z - boundingBox.min.z) / 2
    }

    // 应用缩放
    if (scale) {
      size = {
        x: size.x * scale.x,
        y: size.y * scale.y,
        z: size.z * scale.z
      }
    }

    // 智能形状选择
    const minDimension = Math.min(size.x, size.y, size.z)
    const maxDimension = Math.max(size.x, size.y, size.z)
    const dimensionRatio = minDimension / maxDimension

    if (minDimension < 0.1) {
      // 平面形状 - 动态刚体使用扁平BOX
      const flatBoxSize = { x: size.x, y: 0.1, z: size.z }
      this.addBoxShape(flatBoxSize)
      console.log(`创建扁平BOX碰撞形状，尺寸: ${JSON.stringify(flatBoxSize)}`)
    } else if (dimensionRatio > 0.8) {
      // 球体形状
      const radius = (size.x + size.y + size.z) / 3
      this.addSphereShape(radius)
      console.log(`创建SPHERE碰撞形状，半径: ${radius}`)
    } else {
      // 盒子形状
      this.addBoxShape(size)
      console.log(`创建BOX碰撞形状，尺寸: ${JSON.stringify(size)}`)
    }
  }

  /**
   * 添加自定义形状（如Trimesh）
   */
  private addCustomShape(shape: any): void {
    if (!this._physicsInitialized) {
      console.warn('物理系统未初始化，无法添加自定义形状')
      return
    }

    try {
      // 直接添加到CANNON物理体
      if (this._physicsBody && this._physicsBody.addShape) {
        this._physicsBody.addShape(shape)
        console.log('成功添加自定义碰撞形状')
      }
    } catch (error) {
      console.error('添加自定义形状失败:', error)
    }
  }

  /**
   * 启用与父节点的自动位置同步
   */
  private _enableAutoSync(): void {
    if (!this.parent || this.parent.constructor.name !== 'MeshInstance3D') {
      return
    }

    // 监听父节点的位置变化
    const meshInstance = this.parent as any

    // 重写父节点的position setter来同步物理体
    const originalPositionDescriptor = Object.getOwnPropertyDescriptor(meshInstance, 'position')
    if (!originalPositionDescriptor) {
      // 如果没有现有的setter，创建一个
      let _position = meshInstance.position
      Object.defineProperty(meshInstance, 'position', {
        get: () => _position,
        set: (value) => {
          _position = value
          // 同步到物理体
          if (this._physicsInitialized) {
            this.position = { ...value }
          }
        },
        enumerable: true,
        configurable: true
      })
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export { CollisionShapeType }
export default RigidBody3D
