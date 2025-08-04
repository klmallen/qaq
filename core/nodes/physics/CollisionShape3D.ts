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

    if (this._initialized && this._config.enabled) {
      this._updateDebugMesh()

      // 更新调试线框
      if (this._debugEnabled && this._debugWireframe) {
        this._updateDebugWireframe()
      }
    }
  }

  /**
   * 节点退出场景树时调用
   */
  _exitTree(): void {
    this._destroyDebugWireframe()
    this._cleanupShape()
    super._exitTree()
  }

  // ========================================================================
  // 形状管理方法
  // ========================================================================

  /**
   * 初始化碰撞形状
   */
  private _initializeShape(): void {
    if (this._initialized || !this._physicsServer.initialized) {
      return
    }

    try {
      // 创建物理形状
      this._createPhysicsShape()

      // 查找父物理体
      this._findParentPhysicsBody()

      // 创建调试网格
      if (this._config.debugVisible) {
        this._createDebugMesh()
      }

      // 创建调试线框
      if (this._debugEnabled) {
        this._createDebugWireframe()
      }

      this._initialized = true

    } catch (error) {
      console.error(`Failed to initialize CollisionShape3D: ${this.name}`, error)
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
      if ('physicsBody' in parent && parent.physicsBody) {
        this._parentPhysicsBody = parent.physicsBody
        // 将形状添加到父物理体
        if (this._physicsShape && this._config.enabled) {
          this._parentPhysicsBody.addShape(this._physicsShape)
        }
        break
      }
      parent = parent.parent
    }
  }

  /**
   * 创建调试网格
   */
  private _createDebugMesh(): void {
    if (!this.object3D) return

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

      case CollisionShapeType.PLANE:
        geometry = new THREE.PlaneGeometry(10, 10)
        break

      case CollisionShapeType.MESH:
        const meshParams = this._config.parameters as MeshShapeParams
        geometry = meshParams.geometry.clone()
        break

      default:
        return
    }

    const material = new THREE.MeshBasicMaterial({
      color: this._config.debugColor,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    })

    this._debugMesh = new THREE.Mesh(geometry, material)
    this.object3D.add(this._debugMesh)
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

    // 更新调试网格
    if (this._config.debugVisible) {
      this._removeDebugMesh()
      this._createDebugMesh()
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
    if (this._config.debugVisible) {
      if (!this._debugMesh) {
        this._createDebugMesh()
      }
    } else {
      this._removeDebugMesh()
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
