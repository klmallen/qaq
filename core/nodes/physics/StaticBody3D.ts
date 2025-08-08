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
      // console.log(`${this.name} position:`, this._physicsBody)
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

    console.log(`自动推断静态碰撞形状，顶点数: ${geometryData.vertexCount}`)

    // 根据几何体复杂度选择碰撞形状
    this._createOptimalCollisionShape(geometryData, opts)
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

    // 判断是否使用Trimesh
    const shouldUseTrimesh = useTrimesh || vertexCount > simplifyThreshold

    if (shouldUseTrimesh && indices) {
      // 使用Trimesh进行精确碰撞
      this._createTrimeshShape(positions, indices, scale)
    } else {
      // 使用简化的基础形状
      this._createSimplifiedShape(geometry, scale)
    }
  }

  /**
   * 创建Trimesh碰撞形状
   */
  private _createTrimeshShape(positions: Float32Array, indices: Uint16Array | Uint32Array, scale?: Vector3): void {
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

      console.log(`创建Trimesh碰撞形状，顶点数: ${positions.length / 3}, 索引数: ${indices.length}`)
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
      // 平面形状
      this.addPlaneShape()
      console.log('创建PLANE碰撞形状')
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
}

// ============================================================================
// 导出
// ============================================================================

export { CollisionShapeType }
export default StaticBody3D
