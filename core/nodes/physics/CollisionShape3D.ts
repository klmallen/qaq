/**
 * QAQ游戏引擎 - CollisionShape3D 碰撞形状节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 碰撞形状节点，用于定义物理体的碰撞边界
 * - 继承自Node3D，具有完整的3D变换功能
 * - 支持多种碰撞形状类型（盒子、球体、圆柱、平面、网格等）
 * - 可以作为StaticBody3D或RigidBody3D的子节点
 * - 支持形状参数的动态调整
 * - 提供可视化调试功能
 *
 * 架构设计:
 * - 基于Godot的CollisionShape3D设计
 * - 与PhysicsServer的深度集成
 * - 支持形状的动态创建和更新
 * - 完整的生命周期管理
 *
 * 核心功能:
 * - 碰撞形状的创建和管理
 * - 形状参数的配置和更新
 * - 与父物理体的自动关联
 * - 调试可视化显示
 * - 形状变换的同步
 */

import Node3D from '../Node3D'
import PhysicsServer, { CollisionShapeType } from '../../physics/PhysicsServer'
import CollisionDebugRenderer from '../../collision/CollisionDebugRenderer'
import type { Vector3 } from '../../../types/core'
import * as THREE from 'three'

// ============================================================================
// CollisionShape3D相关接口和枚举
// ============================================================================

/**
 * 形状配置接口
 */
export interface ShapeConfig {
  /** 形状类型 */
  type: CollisionShapeType
  /** 形状参数 */
  parameters: any
  /** 是否启用 */
  enabled?: boolean
  /** 是否显示调试线框 */
  debugVisible?: boolean
  /** 调试线框颜色 */
  debugColor?: number
}

/**
 * 盒子形状参数
 */
export interface BoxShapeParams {
  /** 盒子尺寸 */
  size: Vector3
}

/**
 * 球体形状参数
 */
export interface SphereShapeParams {
  /** 球体半径 */
  radius: number
}

/**
 * 圆柱形状参数
 */
export interface CylinderShapeParams {
  /** 顶部半径 */
  radiusTop: number
  /** 底部半径 */
  radiusBottom: number
  /** 高度 */
  height: number
  /** 分段数 */
  segments?: number
}

/**
 * 网格形状参数
 */
export interface MeshShapeParams {
  /** Three.js几何体 */
  geometry: THREE.BufferGeometry
}

// ============================================================================
// CollisionShape3D 类实现
// ============================================================================

/**
 * CollisionShape3D 类 - 碰撞形状节点
 *
 * 主要功能:
 * 1. 碰撞形状的创建和管理
 * 2. 形状参数的配置和更新
 * 3. 与父物理体的关联
 * 4. 调试可视化显示
 * 5. 形状变换的同步
 */
export class CollisionShape3D extends Node3D {
  // ========================================================================
  // 私有属性 - 形状管理
  // ========================================================================

  /** 物理服务器引用 */
  private _physicsServer: PhysicsServer

  /** 形状配置 */
  private _config: ShapeConfig

  /** 物理形状实例 */
  private _physicsShape: any = null

  /** 调试网格 */
  private _debugMesh: THREE.Mesh | null = null

  /** 是否已初始化 */
  private _initialized: boolean = false

  /** 父物理体引用 */
  private _parentPhysicsBody: any = null

  // 调试可视化属性
  private _debugEnabled: boolean = false
  private _debugWireframe: THREE.LineSegments | null = null
  private _debugColor: number = 0x00ff00
  private _debugOpacity: number = 0.5
  private _debugRenderer: CollisionDebugRenderer

  // 新增：碰撞状态管理
  private _currentCollisions: Array<CollisionShape3D> = []
  private _isColliding: boolean = false
  private _latestCollision: CollisionShape3D | null = null

  // 新增：碰撞回调
  private _onCollisionEnter: ((other: CollisionShape3D) => void) | null = null
  private _onCollisionExit: ((other: CollisionShape3D) => void) | null = null
  private _onCollisionStay: ((other: CollisionShape3D) => void) | null = null

  // 新增：调试可视化网格（独立于调试线框）
  private _debugVisualizationMesh: THREE.Mesh | null = null
  private _debugVisible: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 形状配置
   */
  constructor(name: string = 'CollisionShape3D', config: ShapeConfig) {
    super(name)

    this._physicsServer = PhysicsServer.getInstance()
    this._debugRenderer = CollisionDebugRenderer.getInstance()

    this._config = {
      enabled: true,
      debugVisible: false,
      debugColor: 0x00ff00,
      ...config
    }

    // 初始化调试可视化属性
    this._debugEnabled = this._config.debugVisible || false
    this._debugColor = this._config.debugColor || 0x00ff00
    this._debugVisible = this._config.debugVisible || false

    // CollisionShape3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取形状类型
   * @returns 形状类型
   */
  get shapeType(): CollisionShapeType {
    return this._config.type
  }

  /**
   * 获取形状参数
   * @returns 形状参数
   */
  get parameters(): any {
    return this._config.parameters
  }

  /**
   * 设置形状参数
   * @param value 形状参数
   */
  set parameters(value: any) {
    this._config.parameters = value
    if (this._initialized) {
      this._updateShape()
    }
  }

  /**
   * 获取是否启用
   * @returns 是否启用
   */
  get enabled(): boolean {
    return this._config.enabled || false
  }

  /**
   * 设置是否启用
   * @param value 是否启用
   */
  set enabled(value: boolean) {
    this._config.enabled = value
    if (this._initialized) {
      this._updateShapeEnabled()
    }
  }

  /**
   * 获取是否显示调试
   * @returns 是否显示调试
   */
  get debugVisible(): boolean {
    return this._config.debugVisible || false
  }

  /**
   * 设置是否显示调试
   * @param value 是否显示调试
   */
  set debugVisible(value: boolean) {
    this._config.debugVisible = value
    if (this._initialized) {
      this._updateDebugVisibility()
    }
  }

  /**
   * 获取物理形状实例
   * @returns 物理形状实例
   */
  get physicsShape(): any {
    return this._physicsShape
  }

  // ========================================================================
  // 调试可视化方法
  // ========================================================================

  /**
   * 设置调试可视化启用状态
   * @param enabled 是否启用调试可视化
   */
  setDebugEnabled(enabled: boolean): void {
    if (this._debugEnabled === enabled) return

    this._debugEnabled = enabled
    if (enabled) {
      this._createDebugWireframe()
    } else {
      this._destroyDebugWireframe()
    }
  }

  /**
   * 获取调试可视化启用状态
   * @returns 是否启用调试可视化
   */
  isDebugEnabled(): boolean {
    return this._debugEnabled
  }

  /**
   * 设置调试线框颜色
   * @param color 颜色值 (十六进制)
   */
  setDebugColor(color: number): void {
    this._debugColor = color
    if (this._debugWireframe) {
      this._debugRenderer.updateWireframeColor(this.id, color)
    }
  }

  /**
   * 获取调试线框颜色
   * @returns 颜色值
   */
  getDebugColor(): number {
    return this._debugColor
  }

  /**
   * 设置调试线框透明度
   * @param opacity 透明度 (0-1)
   */
  setDebugOpacity(opacity: number): void {
    this._debugOpacity = Math.max(0, Math.min(1, opacity))
    if (this._debugWireframe) {
      this._debugRenderer.updateWireframeOpacity(this.id, this._debugOpacity)
    }
  }

  /**
   * 获取调试线框透明度
   * @returns 透明度值
   */
  getDebugOpacity(): number {
    return this._debugOpacity
  }

  // ========================================================================
  // 新增：碰撞形状可视化网格方法
  // ========================================================================

  /**
   * 设置调试可视化网格显示状态
   * @param visible 是否显示调试网格
   */
  setDebugVisible(visible: boolean): void {
    if (this._debugVisible === visible) return

    this._debugVisible = visible
    if (visible) {
      this._createDebugVisualizationMesh()
    } else {
      this._removeDebugVisualizationMesh()
    }
  }

  /**
   * 获取调试可视化网格显示状态
   * @returns 是否显示调试网格
   */
  isDebugVisible(): boolean {
    return this._debugVisible
  }

  /**
   * 设置调试网格颜色（基于碰撞状态）
   * @param color 颜色值
   */
  setDebugMeshColor(color: number): void {
    if (this._debugVisualizationMesh && this._debugVisualizationMesh.material instanceof THREE.MeshBasicMaterial) {
      this._debugVisualizationMesh.material.color.setHex(color)
    }
  }

  /**
   * 设置调试网格透明度
   * @param opacity 透明度 (0-1)
   */
  setDebugMeshOpacity(opacity: number): void {
    if (this._debugVisualizationMesh && this._debugVisualizationMesh.material instanceof THREE.MeshBasicMaterial) {
      this._debugVisualizationMesh.material.opacity = Math.max(0, Math.min(1, opacity))
    }
  }

  // ========================================================================
  // 新增：碰撞回调和数据管理方法
  // ========================================================================

  /**
   * 设置碰撞进入回调
   * @param callback 碰撞进入时的回调函数
   */
  setOnCollisionEnter(callback: (other: CollisionShape3D) => void): void {
    this._onCollisionEnter = callback
  }

  /**
   * 设置碰撞退出回调
   * @param callback 碰撞退出时的回调函数
   */
  setOnCollisionExit(callback: (other: CollisionShape3D) => void): void {
    this._onCollisionExit = callback
  }

  /**
   * 设置碰撞持续回调
   * @param callback 碰撞持续时的回调函数
   */
  setOnCollisionStay(callback: (other: CollisionShape3D) => void): void {
    this._onCollisionStay = callback
  }

  /**
   * 获取当前碰撞对象列表
   * @returns 当前碰撞的对象数组
   */
  getCurrentCollisions(): Array<CollisionShape3D> {
    return [...this._currentCollisions]
  }

  /**
   * 获取最近的碰撞对象
   * @returns 最近碰撞的对象，如果没有则返回null
   */
  getLatestCollision(): CollisionShape3D | null {
    return this._latestCollision
  }

  /**
   * 检查是否正在碰撞
   * @returns 是否正在与其他对象碰撞
   */
  isColliding(): boolean {
    return this._isColliding
  }

  /**
   * 检查是否与特定对象碰撞
   * @param other 要检查的碰撞对象
   * @returns 是否与指定对象碰撞
   */
  isCollidingWith(other: CollisionShape3D): boolean {
    return this._currentCollisions.includes(other)
  }

  // ========================================================================
  // 新增：内部碰撞处理方法
  // ========================================================================

  /**
   * 处理碰撞进入事件
   * @param other 碰撞的其他对象
   */
  _handleCollisionEnter(other: CollisionShape3D): void {
    if (!this._currentCollisions.includes(other)) {
      this._currentCollisions.push(other)
      this._latestCollision = other
      this._isColliding = true

      // 更新调试网格颜色为红色（碰撞状态）
      this._updateDebugMeshForCollision(true)

      // 触发碰撞进入回调
      if (this._onCollisionEnter) {
        this._onCollisionEnter(other)
      }

      console.log(`🔴 碰撞进入: ${this.name} <-> ${other.name}`)
    }
  }

  /**
   * 处理碰撞退出事件
   * @param other 退出碰撞的其他对象
   */
  _handleCollisionExit(other: CollisionShape3D): void {
    const index = this._currentCollisions.indexOf(other)
    if (index !== -1) {
      this._currentCollisions.splice(index, 1)

      // 如果没有其他碰撞，更新状态
      if (this._currentCollisions.length === 0) {
        this._isColliding = false
        this._latestCollision = null

        // 更新调试网格颜色为绿色（正常状态）
        this._updateDebugMeshForCollision(false)
      } else {
        // 更新最新碰撞为列表中的最后一个
        this._latestCollision = this._currentCollisions[this._currentCollisions.length - 1]
      }

      // 触发碰撞退出回调
      if (this._onCollisionExit) {
        this._onCollisionExit(other)
      }

      console.log(`🟢 碰撞退出: ${this.name} <-> ${other.name}`)
    }
  }

  /**
   * 处理碰撞持续事件
   * @param other 持续碰撞的其他对象
   */
  _handleCollisionStay(other: CollisionShape3D): void {
    if (this._currentCollisions.includes(other)) {
      // 触发碰撞持续回调
      if (this._onCollisionStay) {
        this._onCollisionStay(other)
      }
    }
  }

  /**
   * 更新调试网格的碰撞状态颜色
   * @param isColliding 是否正在碰撞
   */
  private _updateDebugMeshForCollision(isColliding: boolean): void {
    if (this._debugVisualizationMesh && this._debugVisible) {
      const color = isColliding ? 0xff0000 : 0x00ff00 // 红色：碰撞，绿色：正常
      this.setDebugMeshColor(color)
    }
  }

  /**
   * 获取调试线框对象
   * @returns 调试线框对象
   */
  getDebugWireframe(): THREE.LineSegments | null {
    return this._debugWireframe
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  _ready(): void {
    super._ready()
    this._initializeShape()
  }

  /**
   * 每帧更新时调用
   * @param deltaTime 时间增量
   */
  _process(deltaTime: number): void {
    super._process(deltaTime)

    // 调试：检查 _process 是否被调用
    if (Math.random() < 0.001) { // 0.1%概率输出，减少日志
      console.log(`🔄 ${this.name}: _process 被调用，初始化=${this._initialized}，启用=${this._config.enabled}`)
    }

    if (this._initialized && this._config.enabled) {
      // 更新调试可视化网格
      this._updateDebugVisualizationMesh()

      // 更新调试线框
      if (this._debugEnabled && this._debugWireframe) {
        this._updateDebugWireframe()
      }

      // 执行碰撞检测
      this._performCollisionDetection()
    }
  }

  /**
   * 节点退出场景树时调用
   */
  _exitTree(): void {
    this._destroyDebugWireframe()
    this._removeDebugVisualizationMesh()
    this._cleanupShape()

    // 清理碰撞状态
    this._currentCollisions = []
    this._isColliding = false
    this._latestCollision = null

    super._exitTree()
  }

  // ========================================================================
  // 形状管理方法
  // ========================================================================

  /**
   * 初始化碰撞形状
   */
  private _initializeShape(): void {
    if (this._initialized) {
      console.log(`⚠️ ${this.name}: 已经初始化，跳过`)
      return
    }

    // 检查 PhysicsServer 状态
    if (!this._physicsServer.initialized) {
      console.log(`⚠️ ${this.name}: PhysicsServer 未初始化，跳过初始化`)
      return
    }

    console.log(`🔧 ${this.name}: 开始初始化碰撞形状...`)

    try {
      // 创建物理形状
      this._createPhysicsShape()
      console.log(`✅ ${this.name}: 物理形状创建成功`)

      // 查找父物理体
      this._findParentPhysicsBody()
      console.log(`✅ ${this.name}: 父物理体查找完成`)

      // 创建调试可视化网格
      if (this._debugVisible) {
        this._createDebugVisualizationMesh()
        console.log(`✅ ${this.name}: 调试可视化网格创建完成`)
      }

      // 创建调试线框
      if (this._debugEnabled) {
        this._createDebugWireframe()
        console.log(`✅ ${this.name}: 调试线框创建完成`)
      }

      this._initialized = true
      console.log(`🎉 ${this.name}: 碰撞形状初始化完成！`)

    } catch (error) {
      console.error(`❌ ${this.name}: 碰撞形状初始化失败:`, error)
    }
  }

  /**
   * 创建物理形状
   */
  private _createPhysicsShape(): void {
    switch (this._config.type) {
      case CollisionShapeType.BOX:
        const boxParams = this._config.parameters as BoxShapeParams
        this._physicsShape = this._physicsServer.createBoxShape(boxParams.size)
        break

      case CollisionShapeType.SPHERE:
        const sphereParams = this._config.parameters as SphereShapeParams
        this._physicsShape = this._physicsServer.createSphereShape(sphereParams.radius)
        break

      case CollisionShapeType.CYLINDER:
        const cylinderParams = this._config.parameters as CylinderShapeParams
        this._physicsShape = this._physicsServer.createCylinderShape(
          cylinderParams.radiusTop,
          cylinderParams.radiusBottom,
          cylinderParams.height,
          cylinderParams.segments || 8
        )
        break

      case CollisionShapeType.CAPSULE:
        const capsuleParams = this._config.parameters as { radius: number, height: number }
        // 使用圆柱体作为胶囊的替代（临时解决方案）
        this._physicsShape = this._physicsServer.createCylinderShape(
          capsuleParams.radius,
          capsuleParams.radius,
          capsuleParams.height
        )
        console.log(`⚠️ ${this.name}: CAPSULE 形状使用圆柱体替代`)
        break

      case CollisionShapeType.PLANE:
        this._physicsShape = this._physicsServer.createPlaneShape()
        break

      case CollisionShapeType.MESH:
        const meshParams = this._config.parameters as MeshShapeParams
        this._physicsShape = this._physicsServer.createMeshShape(meshParams.geometry)
        break

      default:
        throw new Error(`Unsupported shape type: ${this._config.type}`)
    }
  }

  /**
   * 查找父物理体
   */
  private _findParentPhysicsBody(): void {
    let parent = this.parent
    while (parent) {
      // 检查是否是 RigidBody3D 或 StaticBody3D
      if (parent.constructor.name === 'RigidBody3D' || parent.constructor.name === 'StaticBody3D') {
        this._parentPhysicsBody = parent
        console.log(`✅ ${this.name}: 找到父物理体 ${parent.name} (${parent.constructor.name})`)

        // 将形状添加到父物理体
        if (this._physicsShape && this._config.enabled) {
          try {
            // 检查父物理体是否有 addCollisionShape 方法
            if (typeof parent.addCollisionShape === 'function') {
              parent.addCollisionShape(this._physicsShape)
              console.log(`✅ ${this.name}: 碰撞形状已添加到父物理体`)
            } else {
              console.warn(`⚠️ ${this.name}: 父物理体没有 addCollisionShape 方法`)
            }
          } catch (error) {
            console.error(`❌ ${this.name}: 添加碰撞形状到父物理体失败:`, error)
          }
        }
        break
      }

      // 检查是否有 physicsBody 属性（备用方案）
      if ('physicsBody' in parent && parent.physicsBody) {
        this._parentPhysicsBody = parent.physicsBody
        console.log(`✅ ${this.name}: 找到父物理体属性 ${parent.physicsBody.name}`)
        break
      }

      parent = parent.parent
    }

    if (!this._parentPhysicsBody) {
      console.warn(`⚠️ ${this.name}: 未找到父物理体`)
    }
  }

  /**
   * 创建调试可视化网格
   */
  private _createDebugVisualizationMesh(): void {
    if (!this.object3D || this._debugVisualizationMesh) return

    let geometry: THREE.BufferGeometry

    switch (this._config.type) {
      case CollisionShapeType.BOX:
        const boxParams = this._config.parameters as BoxShapeParams
        geometry = new THREE.BoxGeometry(boxParams.size.x, boxParams.size.y, boxParams.size.z)
        break

      case CollisionShapeType.SPHERE:
        const sphereParams = this._config.parameters as SphereShapeParams
        geometry = new THREE.SphereGeometry(sphereParams.radius, 16, 12)
        break

      case CollisionShapeType.CYLINDER:
        const cylinderParams = this._config.parameters as CylinderShapeParams
        geometry = new THREE.CylinderGeometry(
          cylinderParams.radiusTop,
          cylinderParams.radiusBottom,
          cylinderParams.height,
          cylinderParams.segments || 8
        )
        break

      case CollisionShapeType.CAPSULE:
        const capsuleParams = this._config.parameters as { radius: number, height: number }
        geometry = new THREE.CapsuleGeometry(capsuleParams.radius, capsuleParams.height - 2 * capsuleParams.radius, 4, 8)
        break

      case CollisionShapeType.PLANE:
        geometry = new THREE.PlaneGeometry(10, 10)
        break

      case CollisionShapeType.MESH:
        const meshParams = this._config.parameters as MeshShapeParams
        geometry = meshParams.geometry.clone()
        break

      default:
        console.warn(`Unsupported collision shape type for debug visualization: ${this._config.type}`)
        return
    }

    // 创建材质，默认绿色（正常状态）
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // 绿色：正常状态
      wireframe: true,
      transparent: true,
      opacity: 0.3
    })

    this._debugVisualizationMesh = new THREE.Mesh(geometry, material)
    this._debugVisualizationMesh.name = `${this.name}_DebugVisualization`
    this.object3D.add(this._debugVisualizationMesh)

    console.log(`🔍 创建碰撞调试可视化网格: ${this.name}`)
  }

  /**
   * 移除调试可视化网格
   */
  private _removeDebugVisualizationMesh(): void {
    if (this._debugVisualizationMesh && this.object3D) {
      this.object3D.remove(this._debugVisualizationMesh)
      this._debugVisualizationMesh.geometry.dispose()
      if (this._debugVisualizationMesh.material instanceof THREE.Material) {
        this._debugVisualizationMesh.material.dispose()
      }
      this._debugVisualizationMesh = null
      console.log(`🗑️ 移除碰撞调试可视化网格: ${this.name}`)
    }
  }

  /**
   * 更新调试可视化网格
   */
  private _updateDebugVisualizationMesh(): void {
    if (this._debugVisualizationMesh && this.object3D) {
      // 同步变换
      this._debugVisualizationMesh.position.copy(this.object3D.position)
      this._debugVisualizationMesh.rotation.copy(this.object3D.rotation)
      this._debugVisualizationMesh.scale.copy(this.object3D.scale)
    }
  }

  /**
   * 执行碰撞检测
   */
  private _performCollisionDetection(): void {
    if (!this._physicsShape || !this.object3D) {
      console.log(`⚠️ ${this.name}: 碰撞检测跳过 - 缺少物理形状或3D对象`)
      return
    }

    // 获取场景根节点 - 通过向上遍历找到场景根节点
    const sceneRoot = this._findSceneRoot()
    if (!sceneRoot) {
      console.log(`⚠️ ${this.name}: 碰撞检测跳过 - 未找到场景根节点`)
      return
    }

    const allCollisionShapes = this._findAllCollisionShapes(sceneRoot)
    const previousCollisions = [...this._currentCollisions]

    // 调试日志（仅在第一次或有变化时输出）
    if (allCollisionShapes.length > 1 && Math.random() < 0.01) { // 1%概率输出，减少日志
      console.log(`🔍 ${this.name}: 开始碰撞检测，找到 ${allCollisionShapes.length} 个碰撞形状`)
    }

    // 清空当前碰撞列表，重新检测
    this._currentCollisions = []

    for (const other of allCollisionShapes) {
      if (other === this || !other._config.enabled) continue

      // 简单的包围盒碰撞检测
      const isColliding = this._checkCollisionWith(other)

      if (isColliding) {
        console.log(`💥 ${this.name} 检测到与 ${other.name} 的碰撞`)
        this._currentCollisions.push(other)

        // 检查是否是新的碰撞
        if (!previousCollisions.includes(other)) {
          console.log(`🔴 ${this.name} 开始碰撞 ${other.name}`)
          this._handleCollisionEnter(other)
          other._handleCollisionEnter(this)
        } else {
          // 持续碰撞
          this._handleCollisionStay(other)
          other._handleCollisionStay(this)
        }
      }
    }

    // 检查退出的碰撞
    for (const previousCollision of previousCollisions) {
      if (!this._currentCollisions.includes(previousCollision)) {
        console.log(`🟢 ${this.name} 结束碰撞 ${previousCollision.name}`)
        this._handleCollisionExit(previousCollision)
        previousCollision._handleCollisionExit(this)
      }
    }

    // 更新碰撞状态
    this._isColliding = this._currentCollisions.length > 0
    if (this._isColliding && this._currentCollisions.length > 0) {
      this._latestCollision = this._currentCollisions[this._currentCollisions.length - 1]
    }
  }

  /**
   * 查找场景根节点
   * @returns 场景根节点
   */
  private _findSceneRoot(): Node | null {
    let current: Node | null = this
    let depth = 0

    // 向上遍历直到找到没有父节点的根节点
    while (current && current.parent) {
      current = current.parent
      depth++

      // 防止无限循环
      if (depth > 100) {
        console.warn(`⚠️ ${this.name}: 场景树深度超过100层，可能存在循环引用`)
        break
      }
    }

    if (current && Math.random() < 0.01) { // 1%概率输出调试信息
      console.log(`🌳 ${this.name}: 找到场景根节点 "${current.name}"，深度=${depth}`)
    }

    return current
  }

  /**
   * 查找场景中的所有碰撞形状
   * @param node 要搜索的节点
   * @returns 碰撞形状数组
   */
  private _findAllCollisionShapes(node: Node): CollisionShape3D[] {
    const collisionShapes: CollisionShape3D[] = []

    // 检查当前节点
    if (node instanceof CollisionShape3D) {
      collisionShapes.push(node)
    }

    // 递归检查子节点
    for (const child of node.children) {
      collisionShapes.push(...this._findAllCollisionShapes(child))
    }

    return collisionShapes
  }

  /**
   * 检查与另一个碰撞形状的碰撞
   * @param other 另一个碰撞形状
   * @returns 是否发生碰撞
   */
  private _checkCollisionWith(other: CollisionShape3D): boolean {
    if (!this.object3D || !other.object3D) {
      console.log(`⚠️ 碰撞检测失败: ${this.name} 或 ${other.name} 缺少3D对象`)
      return false
    }

    try {
      // 获取世界坐标系下的包围盒
      const thisBox = new THREE.Box3().setFromObject(this.object3D)
      const otherBox = new THREE.Box3().setFromObject(other.object3D)

      // 简单的AABB碰撞检测
      const isIntersecting = thisBox.intersectsBox(otherBox)

      // 调试信息（仅在发生碰撞时输出）
      if (isIntersecting) {
        console.log(`🔍 检查碰撞: ${this.name} vs ${other.name}`)
        console.log(`  ${this.name} 包围盒:`, {
          min: { x: thisBox.min.x.toFixed(2), y: thisBox.min.y.toFixed(2), z: thisBox.min.z.toFixed(2) },
          max: { x: thisBox.max.x.toFixed(2), y: thisBox.max.y.toFixed(2), z: thisBox.max.z.toFixed(2) }
        })
        console.log(`  ${other.name} 包围盒:`, {
          min: { x: otherBox.min.x.toFixed(2), y: otherBox.min.y.toFixed(2), z: otherBox.min.z.toFixed(2) },
          max: { x: otherBox.max.x.toFixed(2), y: otherBox.max.y.toFixed(2), z: otherBox.max.z.toFixed(2) }
        })
        console.log(`  碰撞结果: ${isIntersecting}`)
      }

      return isIntersecting
    } catch (error) {
      console.error(`❌ 碰撞检测错误: ${this.name} vs ${other.name}`, error)
      return false
    }
  }

  /**
   * 更新调试网格
   */
  private _updateDebugMesh(): void {
    if (this._debugMesh && this.object3D) {
      // 同步变换
      this._debugMesh.position.copy(this.object3D.position)
      this._debugMesh.rotation.copy(this.object3D.rotation)
      this._debugMesh.scale.copy(this.object3D.scale)
    }
  }

  /**
   * 更新形状
   */
  private _updateShape(): void {
    if (!this._initialized) return

    // 重新创建物理形状
    this._createPhysicsShape()

    // 更新父物理体中的形状
    if (this._parentPhysicsBody && this._physicsShape) {
      // 移除旧形状，添加新形状
      this._parentPhysicsBody.addShape(this._physicsShape)
    }

    // 更新调试可视化网格
    if (this._debugVisible) {
      this._removeDebugVisualizationMesh()
      this._createDebugVisualizationMesh()
    }
  }

  /**
   * 更新形状启用状态
   */
  private _updateShapeEnabled(): void {
    if (!this._initialized || !this._parentPhysicsBody) return

    if (this._config.enabled) {
      // 添加形状到父物理体
      if (this._physicsShape) {
        this._parentPhysicsBody.addShape(this._physicsShape)
      }
    } else {
      // 从父物理体移除形状
      if (this._physicsShape) {
        const shapeIndex = this._parentPhysicsBody.shapes.indexOf(this._physicsShape)
        if (shapeIndex !== -1) {
          this._parentPhysicsBody.shapes.splice(shapeIndex, 1)
        }
      }
    }
  }

  /**
   * 更新调试可视化
   */
  private _updateDebugVisibility(): void {
    if (this._debugVisible) {
      if (!this._debugVisualizationMesh) {
        this._createDebugVisualizationMesh()
      }
    } else {
      this._removeDebugVisualizationMesh()
    }
  }

  /**
   * 移除调试网格
   */
  private _removeDebugMesh(): void {
    if (this._debugMesh && this.object3D) {
      this.object3D.remove(this._debugMesh)
      this._debugMesh.geometry.dispose()
      if (this._debugMesh.material instanceof THREE.Material) {
        this._debugMesh.material.dispose()
      }
      this._debugMesh = null
    }
  }

  /**
   * 清理形状
   */
  private _cleanupShape(): void {
    if (this._initialized) {
      // 从父物理体移除形状
      if (this._parentPhysicsBody && this._physicsShape) {
        const shapeIndex = this._parentPhysicsBody.shapes.indexOf(this._physicsShape)
        if (shapeIndex !== -1) {
          this._parentPhysicsBody.shapes.splice(shapeIndex, 1)
        }
      }

      // 移除调试网格
      this._removeDebugMesh()

      this._physicsShape = null
      this._parentPhysicsBody = null
      this._initialized = false
      console.log(`CollisionShape3D cleaned up: ${this.name}`)
    }
  }

  /**
   * 设置碰撞形状
   * @param type 形状类型
   * @param parameters 形状参数
   */
  setShape(type: CollisionShapeType, parameters: any): void {
    this._config.type = type
    this._config.parameters = parameters
    if (this._initialized) {
      this._updateShape()
      // 重新创建调试线框
      if (this._debugEnabled) {
        this._destroyDebugWireframe()
        this._createDebugWireframe()
      }
    }
  }

  /**
   * 设置盒子形状
   * @param size 盒子尺寸
   */
  setBoxShape(size: Vector3): void {
    this.setShape(CollisionShapeType.BOX, { size })
  }

  /**
   * 设置球体形状
   * @param radius 球体半径
   */
  setSphereShape(radius: number): void {
    this.setShape(CollisionShapeType.SPHERE, { radius })
  }

  /**
   * 获取形状统计信息
   * @returns 统计信息
   */
  getStats(): {
    shapeType: CollisionShapeType
    enabled: boolean
    debugVisible: boolean
    hasParentPhysicsBody: boolean
    initialized: boolean
  } {
    return {
      shapeType: this._config.type,
      enabled: this.enabled,
      debugVisible: this.debugVisible,
      hasParentPhysicsBody: this._parentPhysicsBody !== null,
      initialized: this._initialized
    }
  }

  // ========================================================================
  // 私有方法 - 调试线框管理
  // ========================================================================

  /**
   * 创建调试线框
   */
  private _createDebugWireframe(): void {
    if (!this._initialized || this._debugWireframe) return

    const wireframe = this._createWireframeForShape()
    if (wireframe) {
      this._debugWireframe = wireframe
      this._debugRenderer.addWireframe(this.id, wireframe)
      this._updateDebugWireframe()
    }
  }

  /**
   * 更新调试线框
   */
  private _updateDebugWireframe(): void {
    if (!this._debugWireframe) return

    // 同步变换
    const globalTransform = this.getGlobalTransform()
    this._debugRenderer.updateWireframeTransform(
      this.id,
      globalTransform.position,
      globalTransform.rotation,
      globalTransform.scale
    )
  }

  /**
   * 销毁调试线框
   */
  private _destroyDebugWireframe(): void {
    if (this._debugWireframe) {
      this._debugRenderer.removeWireframe(this.id)
      this._debugWireframe = null
    }
  }

  /**
   * 根据形状类型创建对应的线框
   */
  private _createWireframeForShape(): THREE.LineSegments | null {
    const config = {
      color: this._debugColor,
      opacity: this._debugOpacity
    }

    switch (this._config.type) {
      case CollisionShapeType.BOX:
        const boxSize = this._config.parameters.size
        return this._debugRenderer.createBoxWireframe(boxSize, config)

      case CollisionShapeType.SPHERE:
        const sphereRadius = this._config.parameters.radius
        return this._debugRenderer.createSphereWireframe(sphereRadius, 16, config)

      case CollisionShapeType.CAPSULE:
        const capsuleParams = this._config.parameters
        return this._debugRenderer.createCapsuleWireframe(capsuleParams.radius, capsuleParams.height, config)

      case CollisionShapeType.CYLINDER:
        const cylinderParams = this._config.parameters
        return this._debugRenderer.createCylinderWireframe(
          cylinderParams.radiusTop,
          cylinderParams.radiusBottom,
          cylinderParams.height,
          16,
          config
        )

      case CollisionShapeType.MESH:
        const meshGeometry = this._config.parameters.geometry
        return this._debugRenderer.createMeshWireframe(meshGeometry, config)

      default:
        console.warn(`Unsupported collision shape type for debug wireframe: ${this._config.type}`)
        return null
    }
  }

  /**
   * 销毁碰撞形状
   */
  destroy(): void {
    this._destroyDebugWireframe()
    this._cleanupShape()
    super.destroy()
  }
}

// ============================================================================
// 导出
// ============================================================================

export default CollisionShape3D
