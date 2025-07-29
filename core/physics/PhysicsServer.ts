/**
 * QAQ游戏引擎 - PhysicsServer 物理引擎统一接口
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 物理引擎的统一接口和封装层
 * - 基于Cannon.js的物理世界管理
 * - 提供Godot风格的物理API
 * - 与Three.js渲染系统的同步
 * - 物理体和碰撞形状的管理
 * - 射线检测和物理查询
 *
 * 架构设计:
 * - 单例模式管理全局物理世界
 * - 统一的物理体生命周期管理
 * - 与Engine渲染循环集成
 * - 完整的碰撞检测和响应
 *
 * 核心功能:
 * - 物理世界创建和配置
 * - 物理体添加和移除
 * - 碰撞形状管理
 * - 物理仿真步进
 * - 射线检测和查询
 */

import * as THREE from 'three'
import type { Vector3 } from '../../types/core'

// 简化的Cannon-ES类型声明 - 在实际项目中应该导入真实的cannon-es模块
declare const CANNON: any

// ============================================================================
// 物理系统相关枚举和接口
// ============================================================================

/**
 * 物理体类型枚举
 */
export enum PhysicsBodyType {
  /** 静态物体 - 不移动，不受力影响 */
  STATIC = 0,
  /** 运动学物体 - 可移动，不受力影响 */
  KINEMATIC = 1,
  /** 动态物体 - 受物理力影响 */
  DYNAMIC = 2
}

/**
 * 碰撞形状类型枚举
 */
export enum CollisionShapeType {
  /** 盒子形状 */
  BOX = 'box',
  /** 球体形状 */
  SPHERE = 'sphere',
  /** 胶囊形状 */
  CAPSULE = 'capsule',
  /** 圆柱形状 */
  CYLINDER = 'cylinder',
  /** 平面形状 */
  PLANE = 'plane',
  /** 网格形状 */
  MESH = 'mesh',
  /** 高度场形状 */
  HEIGHTFIELD = 'heightfield'
}

/**
 * 物理材质属性接口
 */
export interface PhysicsMaterial {
  /** 摩擦系数 */
  friction?: number
  /** 弹性系数 */
  restitution?: number
  /** 接触刚度 */
  contactEquationStiffness?: number
  /** 接触阻尼 */
  contactEquationRelaxation?: number
  /** 摩擦刚度 */
  frictionEquationStiffness?: number
  /** 摩擦阻尼 */
  frictionEquationRelaxation?: number
}

/**
 * 射线检测结果接口
 */
export interface RaycastResult {
  /** 是否命中 */
  hasHit: boolean
  /** 命中点 */
  hitPoint?: Vector3
  /** 命中法线 */
  hitNormal?: Vector3
  /** 命中距离 */
  distance?: number
  /** 命中的物理体 */
  body?: any
  /** 命中的形状 */
  shape?: any
}

/**
 * 物理世界配置接口
 */
export interface PhysicsWorldConfig {
  /** 重力向量 */
  gravity?: Vector3
  /** 求解器迭代次数 */
  solverIterations?: number
  /** 允许休眠 */
  allowSleep?: boolean
  /** 宽相检测算法 */
  broadphase?: 'naive' | 'sap' | 'grid'
  /** 时间步长 */
  timeStep?: number
}

// ============================================================================
// PhysicsServer 类实现
// ============================================================================

/**
 * PhysicsServer 类 - 物理引擎统一接口
 *
 * 主要功能:
 * 1. 物理世界的创建和管理
 * 2. 物理体的添加和移除
 * 3. 碰撞检测和响应
 * 4. 射线检测和查询
 * 5. 与渲染系统的同步
 */
export class PhysicsServer {
  // ========================================================================
  // 私有属性 - 物理世界管理
  // ========================================================================

  /** 单例实例 */
  private static _instance: PhysicsServer | null = null

  /** Cannon.js物理世界 */
  private _world: any = null

  /** 物理体映射表 */
  private _bodies: Map<string, any> = new Map()

  /** 物理材质映射表 */
  private _materials: Map<string, any> = new Map()

  /** 是否已初始化 */
  private _initialized: boolean = false

  /** 物理世界配置 */
  private _config: PhysicsWorldConfig = {}

  /** 固定时间步长 */
  private _fixedTimeStep: number = 1 / 60

  /** 最大子步数 */
  private _maxSubSteps: number = 3

  /** 上次更新时间 */
  private _lastTime: number = 0

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 私有构造函数 - 单例模式
   */
  private constructor() {}

  /**
   * 获取PhysicsServer单例实例
   * @returns PhysicsServer实例
   */
  static getInstance(): PhysicsServer {
    if (!PhysicsServer._instance) {
      PhysicsServer._instance = new PhysicsServer()
    }
    return PhysicsServer._instance
  }

  /**
   * 初始化物理服务器
   * @param config 物理世界配置
   */
  initialize(config: PhysicsWorldConfig = {}): void {
    if (this._initialized) {
      console.warn('PhysicsServer already initialized')
      return
    }

    this._config = {
      gravity: { x: 0, y: -9.82, z: 0 },
      solverIterations: 10,
      allowSleep: true,
      broadphase: 'sap',
      timeStep: 1 / 60,
      ...config
    }

    // 创建Cannon-ES物理世界
    this._world = new CANNON.World()

    // 设置重力
    this._world.gravity.set(
      this._config.gravity!.x,
      this._config.gravity!.y,
      this._config.gravity!.z
    )

    // 配置求解器
    this._world.solver.iterations = this._config.solverIterations!
    this._world.allowSleep = this._config.allowSleep!

    // 设置宽相检测算法
    switch (this._config.broadphase) {
      case 'naive':
        this._world.broadphase = new CANNON.NaiveBroadphase()
        break
      case 'sap':
        this._world.broadphase = new CANNON.SAPBroadphase(this._world)
        break
      case 'grid':
        this._world.broadphase = new CANNON.GridBroadphase()
        break
    }

    // 设置时间步长
    this._fixedTimeStep = this._config.timeStep!

    // 创建默认材质
    this._createDefaultMaterials()

    this._initialized = true
    console.log('✅ PhysicsServer initialized with Cannon.js')
  }



  /**
   * 创建默认物理材质
   */
  private _createDefaultMaterials(): void {
    // 默认材质
    const defaultMaterial = new CANNON.Material('default')
    defaultMaterial.friction = 0.4
    defaultMaterial.restitution = 0.3
    this._materials.set('default', defaultMaterial)

    // 地面材质
    const groundMaterial = new CANNON.Material('ground')
    groundMaterial.friction = 0.8
    groundMaterial.restitution = 0.1
    this._materials.set('ground', groundMaterial)

    // 弹性材质
    const bouncyMaterial = new CANNON.Material('bouncy')
    bouncyMaterial.friction = 0.2
    bouncyMaterial.restitution = 0.9
    this._materials.set('bouncy', bouncyMaterial)

    // 冰面材质
    const iceMaterial = new CANNON.Material('ice')
    iceMaterial.friction = 0.05
    iceMaterial.restitution = 0.1
    this._materials.set('ice', iceMaterial)
  }

  /**
   * 检查是否已初始化
   */
  private ensureInitialized(): void {
    if (!this._initialized || !this._world) {
      throw new Error('PhysicsServer not initialized. Call initialize() first.')
    }
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取物理世界实例
   * @returns Cannon.js世界实例
   */
  get world(): any {
    this.ensureInitialized()
    return this._world!
  }

  /**
   * 获取是否已初始化
   * @returns 是否已初始化
   */
  get initialized(): boolean {
    return this._initialized
  }

  /**
   * 获取物理体数量
   * @returns 物理体数量
   */
  get bodyCount(): number {
    return this._bodies.size
  }

  /**
   * 获取重力向量
   * @returns 重力向量
   */
  get gravity(): Vector3 {
    this.ensureInitialized()
    return {
      x: this._world!.gravity.x,
      y: this._world!.gravity.y,
      z: this._world!.gravity.z
    }
  }

  /**
   * 设置重力向量
   * @param gravity 重力向量
   */
  set gravity(gravity: Vector3) {
    this.ensureInitialized()
    this._world!.gravity.set(gravity.x, gravity.y, gravity.z)
  }

  // ========================================================================
  // 核心方法 - 物理体管理
  // ========================================================================

  /**
   * 创建物理体
   * @param id 物理体唯一标识
   * @param type 物理体类型
   * @param shape 碰撞形状
   * @param position 初始位置
   * @param mass 质量（静态体为0）
   * @returns 创建的物理体
   */
  createBody(
    id: string,
    type: PhysicsBodyType,
    shape: any,
    position: Vector3 = { x: 0, y: 0, z: 0 },
    mass: number = 1
  ): any {
    this.ensureInitialized()

    if (this._bodies.has(id)) {
      throw new Error(`Physics body with id "${id}" already exists`)
    }

    // 根据类型设置质量
    let bodyMass = mass
    if (type === PhysicsBodyType.STATIC) {
      bodyMass = 0
    }

    // 创建物理体
    const body = new CANNON.Body({ mass: bodyMass })
    body.addShape(shape)
    body.position.set(position.x, position.y, position.z)

    // 设置物理体类型
    switch (type) {
      case PhysicsBodyType.STATIC:
        body.type = CANNON.Body.STATIC
        break
      case PhysicsBodyType.KINEMATIC:
        body.type = CANNON.Body.KINEMATIC
        break
      case PhysicsBodyType.DYNAMIC:
        body.type = CANNON.Body.DYNAMIC
        break
    }

    // 设置默认材质
    body.material = this._materials.get('default')!

    // 添加到物理世界
    this._world!.addBody(body)
    this._bodies.set(id, body)

    console.log(`Physics body created: ${id} (${PhysicsBodyType[type]})`)
    return body
  }

  /**
   * 移除物理体
   * @param id 物理体标识
   */
  removeBody(id: string): void {
    this.ensureInitialized()

    const body = this._bodies.get(id)
    if (!body) {
      console.warn(`Physics body "${id}" not found`)
      return
    }

    this._world!.removeBody(body)
    this._bodies.delete(id)

    console.log(`Physics body removed: ${id}`)
  }

  /**
   * 获取物理体
   * @param id 物理体标识
   * @returns 物理体实例
   */
  getBody(id: string): any {
    return this._bodies.get(id) || null
  }

  /**
   * 获取所有物理体
   * @returns 物理体数组
   */
  getAllBodies(): any[] {
    return Array.from(this._bodies.values())
  }

  // ========================================================================
  // 碰撞形状创建方法
  // ========================================================================

  /**
   * 创建盒子碰撞形状
   * @param size 盒子尺寸
   * @returns 盒子形状
   */
  createBoxShape(size: Vector3): any {
    return new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2))
  }

  /**
   * 创建球体碰撞形状
   * @param radius 球体半径
   * @returns 球体形状
   */
  createSphereShape(radius: number): any {
    return new CANNON.Sphere(radius)
  }

  /**
   * 创建胶囊碰撞形状
   * @param radius 胶囊半径
   * @param height 胶囊高度
   * @returns 胶囊形状
   */
  createCapsuleShape(radius: number, height: number): any {
    // Cannon-ES没有原生胶囊形状，使用盒子近似
    return new CANNON.Box(new CANNON.Vec3(radius, height / 2, radius))
  }

  /**
   * 创建圆柱碰撞形状
   * @param radiusTop 顶部半径
   * @param radiusBottom 底部半径
   * @param height 高度
   * @param numSegments 分段数
   * @returns 圆柱形状
   */
  createCylinderShape(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    numSegments: number = 8
  ): any {
    return new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments)
  }

  /**
   * 创建平面碰撞形状
   * @returns 平面形状
   */
  createPlaneShape(): any {
    return new CANNON.Plane()
  }

  /**
   * 从Three.js几何体创建网格碰撞形状
   * @param geometry Three.js几何体
   * @returns 网格形状
   */
  createMeshShape(geometry: THREE.BufferGeometry): any {
    const vertices: number[] = []
    const indices: number[] = []

    // 提取顶点
    const positionAttribute = geometry.getAttribute('position')
    for (let i = 0; i < positionAttribute.count; i++) {
      vertices.push(
        positionAttribute.getX(i),
        positionAttribute.getY(i),
        positionAttribute.getZ(i)
      )
    }

    // 提取索引
    const indexAttribute = geometry.getIndex()
    if (indexAttribute) {
      for (let i = 0; i < indexAttribute.count; i++) {
        indices.push(indexAttribute.getX(i))
      }
    } else {
      // 如果没有索引，生成默认索引
      for (let i = 0; i < positionAttribute.count; i++) {
        indices.push(i)
      }
    }

    return new CANNON.Trimesh(vertices, indices)
  }

  // ========================================================================
  // 物理材质管理
  // ========================================================================

  /**
   * 创建物理材质
   * @param name 材质名称
   * @param properties 材质属性
   * @returns 物理材质
   */
  createMaterial(name: string, properties: PhysicsMaterial = {}): any {
    const material = new CANNON.Material(name)

    if (properties.friction !== undefined) {
      material.friction = properties.friction
    }
    if (properties.restitution !== undefined) {
      material.restitution = properties.restitution
    }
    if (properties.contactEquationStiffness !== undefined) {
      material.contactEquationStiffness = properties.contactEquationStiffness
    }
    if (properties.contactEquationRelaxation !== undefined) {
      material.contactEquationRelaxation = properties.contactEquationRelaxation
    }
    if (properties.frictionEquationStiffness !== undefined) {
      material.frictionEquationStiffness = properties.frictionEquationStiffness
    }
    if (properties.frictionEquationRelaxation !== undefined) {
      material.frictionEquationRelaxation = properties.frictionEquationRelaxation
    }

    this._materials.set(name, material)
    return material
  }

  /**
   * 获取物理材质
   * @param name 材质名称
   * @returns 物理材质
   */
  getMaterial(name: string): any {
    return this._materials.get(name) || null
  }

  /**
   * 设置物理体材质
   * @param bodyId 物理体标识
   * @param materialName 材质名称
   */
  setBodyMaterial(bodyId: string, materialName: string): void {
    const body = this._bodies.get(bodyId)
    const material = this._materials.get(materialName)

    if (!body) {
      console.warn(`Physics body "${bodyId}" not found`)
      return
    }

    if (!material) {
      console.warn(`Physics material "${materialName}" not found`)
      return
    }

    body.material = material
  }

  // ========================================================================
  // 物理仿真和更新
  // ========================================================================

  /**
   * 步进物理仿真
   * @param deltaTime 时间增量（秒）
   */
  step(deltaTime: number): void {
    this.ensureInitialized()

    const currentTime = Date.now() / 1000
    if (this._lastTime === 0) {
      this._lastTime = currentTime
    }

    const dt = currentTime - this._lastTime
    this._lastTime = currentTime

    // 使用固定时间步长进行仿真
    this._world!.step(this._fixedTimeStep, dt, this._maxSubSteps)
  }

  /**
   * 同步物理体到Three.js对象
   * @param physicsBody 物理体
   * @param threeObject Three.js对象
   */
  syncToThreeObject(physicsBody: any, threeObject: THREE.Object3D): void {
    // 同步位置
    threeObject.position.copy(physicsBody.position as any)

    // 同步旋转
    threeObject.quaternion.copy(physicsBody.quaternion as any)
  }

  /**
   * 从Three.js对象同步到物理体
   * @param threeObject Three.js对象
   * @param physicsBody 物理体
   */
  syncFromThreeObject(threeObject: THREE.Object3D, physicsBody: any): void {
    // 同步位置
    physicsBody.position.copy(threeObject.position as any)

    // 同步旋转
    physicsBody.quaternion.copy(threeObject.quaternion as any)
  }

  // ========================================================================
  // 射线检测和查询
  // ========================================================================

  /**
   * 射线检测
   * @param from 射线起点
   * @param to 射线终点
   * @param options 检测选项
   * @returns 检测结果
   */
  raycast(
    from: Vector3,
    to: Vector3,
    options: {
      skipBackfaces?: boolean
      collisionFilterMask?: number
      collisionFilterGroup?: number
    } = {}
  ): RaycastResult {
    this.ensureInitialized()

    const raycastResult = new CANNON.RaycastResult()
    const ray = new CANNON.Ray(
      new CANNON.Vec3(from.x, from.y, from.z),
      new CANNON.Vec3(to.x, to.y, to.z)
    )

    // 设置射线选项
    ray.skipBackfaces = options.skipBackfaces || false
    ray.collisionFilterMask = options.collisionFilterMask || -1
    ray.collisionFilterGroup = options.collisionFilterGroup || 1

    // 执行射线检测
    ray.intersectWorld(this._world!, raycastResult)

    // 转换结果
    const result: RaycastResult = {
      hasHit: raycastResult.hasHit
    }

    if (raycastResult.hasHit) {
      result.hitPoint = {
        x: raycastResult.hitPointWorld.x,
        y: raycastResult.hitPointWorld.y,
        z: raycastResult.hitPointWorld.z
      }
      result.hitNormal = {
        x: raycastResult.hitNormalWorld.x,
        y: raycastResult.hitNormalWorld.y,
        z: raycastResult.hitNormalWorld.z
      }
      result.distance = raycastResult.distance
      result.body = raycastResult.body
      result.shape = raycastResult.shape
    }

    return result
  }

  /**
   * 点查询 - 查找指定点处的物理体
   * @param point 查询点
   * @param radius 查询半径
   * @returns 查询到的物理体数组
   */
  pointQuery(point: Vector3, radius: number = 0.1): any[] {
    this.ensureInitialized()

    const results: any[] = []
    const queryPoint = new CANNON.Vec3(point.x, point.y, point.z)

    // 遍历所有物理体进行距离检查
    this._world!.bodies.forEach(body => {
      const distance = body.position.distanceTo(queryPoint)
      if (distance <= radius) {
        results.push(body)
      }
    })

    return results
  }

  // ========================================================================
  // 力和冲量应用
  // ========================================================================

  /**
   * 对物理体应用力
   * @param bodyId 物理体标识
   * @param force 力向量
   * @param relativePoint 相对作用点（可选）
   */
  applyForce(bodyId: string, force: Vector3, relativePoint?: Vector3): void {
    const body = this._bodies.get(bodyId)
    if (!body) {
      console.warn(`Physics body "${bodyId}" not found`)
      return
    }

    const forceVec = new CANNON.Vec3(force.x, force.y, force.z)

    if (relativePoint) {
      const pointVec = new CANNON.Vec3(relativePoint.x, relativePoint.y, relativePoint.z)
      body.applyForce(forceVec, pointVec)
    } else {
      body.applyForce(forceVec, body.position)
    }
  }

  /**
   * 对物理体应用冲量
   * @param bodyId 物理体标识
   * @param impulse 冲量向量
   * @param relativePoint 相对作用点（可选）
   */
  applyImpulse(bodyId: string, impulse: Vector3, relativePoint?: Vector3): void {
    const body = this._bodies.get(bodyId)
    if (!body) {
      console.warn(`Physics body "${bodyId}" not found`)
      return
    }

    const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z)

    if (relativePoint) {
      const pointVec = new CANNON.Vec3(relativePoint.x, relativePoint.y, relativePoint.z)
      body.applyImpulse(impulseVec, pointVec)
    } else {
      body.applyImpulse(impulseVec, body.position)
    }
  }

  /**
   * 设置物理体速度
   * @param bodyId 物理体标识
   * @param velocity 速度向量
   */
  setBodyVelocity(bodyId: string, velocity: Vector3): void {
    const body = this._bodies.get(bodyId)
    if (!body) {
      console.warn(`Physics body "${bodyId}" not found`)
      return
    }

    body.velocity.set(velocity.x, velocity.y, velocity.z)
  }

  /**
   * 设置物理体角速度
   * @param bodyId 物理体标识
   * @param angularVelocity 角速度向量
   */
  setBodyAngularVelocity(bodyId: string, angularVelocity: Vector3): void {
    const body = this._bodies.get(bodyId)
    if (!body) {
      console.warn(`Physics body "${bodyId}" not found`)
      return
    }

    body.angularVelocity.set(angularVelocity.x, angularVelocity.y, angularVelocity.z)
  }

  // ========================================================================
  // 工具方法和统计
  // ========================================================================

  /**
   * 获取物理世界统计信息
   * @returns 统计信息
   */
  getStats(): {
    bodyCount: number
    contactCount: number
    materialCount: number
    gravity: Vector3
    timeStep: number
  } {
    this.ensureInitialized()

    return {
      bodyCount: this._bodies.size,
      contactCount: this._world!.contacts.length,
      materialCount: this._materials.size,
      gravity: this.gravity,
      timeStep: this._fixedTimeStep
    }
  }

  /**
   * 清理物理世界
   */
  clear(): void {
    this.ensureInitialized()

    // 移除所有物理体
    this._bodies.forEach((body, id) => {
      this._world!.removeBody(body)
    })
    this._bodies.clear()

    // 清除所有约束
    this._world!.constraints.length = 0

    console.log('Physics world cleared')
  }

  /**
   * 销毁物理服务器
   */
  destroy(): void {
    if (this._initialized) {
      this.clear()
      this._materials.clear()
      this._world = null
      this._initialized = false
      PhysicsServer._instance = null
      console.log('PhysicsServer destroyed')
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default PhysicsServer
