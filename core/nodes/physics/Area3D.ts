/**
 * QAQ游戏引擎 - Area3D 碰撞区域节点
 * 
 * 功能：触发器类型的碰撞检测，不参与物理仿真
 * 特性：进入/离开事件、多重检测、信号系统
 */

import Node3D from '../Node3D'
import CollisionShape3D from './CollisionShape3D'
import PhysicsServer from '../../physics/PhysicsServer'
import type { Vector3 } from '../../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface AreaConfig {
  enabled: boolean
  monitoringEnabled: boolean    // 是否启用监控
  monitorableEnabled: boolean   // 是否可被监控
  priority: number              // 优先级
  collisionLayer: number        // 碰撞层
  collisionMask: number         // 碰撞掩码
}

export interface AreaDetection {
  node: Node3D
  enterTime: number
  contactPoints: Vector3[]
}

export interface AreaStats {
  totalDetections: number
  currentDetections: number
  enterEvents: number
  exitEvents: number
  averageDetectionTime: number
}

// ============================================================================
// Area3D 实现
// ============================================================================

export class Area3D extends Node3D {
  private _config: AreaConfig
  private _physicsServer: PhysicsServer
  private _collisionShapes: CollisionShape3D[] = []
  private _physicsArea: any = null
  
  // 检测状态
  private _detectedBodies: Map<string, AreaDetection> = new Map()
  private _detectedAreas: Map<string, AreaDetection> = new Map()
  private _isInitialized: boolean = false
  
  // 统计信息
  private _stats: AreaStats = {
    totalDetections: 0,
    currentDetections: 0,
    enterEvents: 0,
    exitEvents: 0,
    averageDetectionTime: 0
  }

  // 默认配置
  static readonly DEFAULT_CONFIG: AreaConfig = {
    enabled: true,
    monitoringEnabled: true,
    monitorableEnabled: true,
    priority: 0,
    collisionLayer: 1,
    collisionMask: 1
  }

  constructor(name: string = 'Area3D', config: Partial<AreaConfig> = {}) {
    super(name)
    
    this._physicsServer = PhysicsServer.getInstance()
    this._config = { ...Area3D.DEFAULT_CONFIG, ...config }
  }

  // ========================================================================
  // 配置管理
  // ========================================================================

  /**
   * 设置监控启用状态
   * @param enabled 是否启用监控
   */
  setMonitoringEnabled(enabled: boolean): void {
    this._config.monitoringEnabled = enabled
    if (this._physicsArea) {
      // 更新物理区域的监控状态
      this._updatePhysicsAreaConfig()
    }
  }

  /**
   * 获取监控启用状态
   * @returns 是否启用监控
   */
  isMonitoringEnabled(): boolean {
    return this._config.monitoringEnabled
  }

  /**
   * 设置可监控状态
   * @param enabled 是否可被监控
   */
  setMonitorableEnabled(enabled: boolean): void {
    this._config.monitorableEnabled = enabled
    if (this._physicsArea) {
      this._updatePhysicsAreaConfig()
    }
  }

  /**
   * 获取可监控状态
   * @returns 是否可被监控
   */
  isMonitorableEnabled(): boolean {
    return this._config.monitorableEnabled
  }

  /**
   * 设置碰撞层
   * @param layer 碰撞层
   */
  setCollisionLayer(layer: number): void {
    this._config.collisionLayer = layer
    if (this._physicsArea) {
      this._updatePhysicsAreaConfig()
    }
  }

  /**
   * 设置碰撞掩码
   * @param mask 碰撞掩码
   */
  setCollisionMask(mask: number): void {
    this._config.collisionMask = mask
    if (this._physicsArea) {
      this._updatePhysicsAreaConfig()
    }
  }

  // ========================================================================
  // 碰撞形状管理
  // ========================================================================

  /**
   * 添加碰撞形状
   * @param shape 碰撞形状
   */
  addCollisionShape(shape: CollisionShape3D): void {
    if (this._collisionShapes.includes(shape)) return
    
    this._collisionShapes.push(shape)
    this.addChild(shape)
    
    if (this._isInitialized) {
      this._updatePhysicsArea()
    }
  }

  /**
   * 移除碰撞形状
   * @param shape 碰撞形状
   */
  removeCollisionShape(shape: CollisionShape3D): void {
    const index = this._collisionShapes.indexOf(shape)
    if (index >= 0) {
      this._collisionShapes.splice(index, 1)
      this.removeChild(shape)
      
      if (this._isInitialized) {
        this._updatePhysicsArea()
      }
    }
  }

  /**
   * 获取所有碰撞形状
   * @returns 碰撞形状列表
   */
  getCollisionShapes(): CollisionShape3D[] {
    return [...this._collisionShapes]
  }

  // ========================================================================
  // 检测查询
  // ========================================================================

  /**
   * 获取当前检测到的所有物体
   * @returns 检测到的物体列表
   */
  getOverlappingBodies(): Node3D[] {
    return Array.from(this._detectedBodies.values()).map(detection => detection.node)
  }

  /**
   * 获取当前检测到的所有区域
   * @returns 检测到的区域列表
   */
  getOverlappingAreas(): Area3D[] {
    return Array.from(this._detectedAreas.values())
      .map(detection => detection.node)
      .filter(node => node instanceof Area3D) as Area3D[]
  }

  /**
   * 检查是否与指定物体重叠
   * @param body 要检查的物体
   * @returns 是否重叠
   */
  overlapsBody(body: Node3D): boolean {
    return this._detectedBodies.has(body.id)
  }

  /**
   * 检查是否与指定区域重叠
   * @param area 要检查的区域
   * @returns 是否重叠
   */
  overlapsArea(area: Area3D): boolean {
    return this._detectedAreas.has(area.id)
  }

  /**
   * 获取检测统计信息
   * @returns 统计信息
   */
  getStats(): AreaStats {
    return { ...this._stats }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  override _ready(): void {
    super._ready()
    this._initializePhysicsArea()
  }

  override _process(deltaTime: number): void {
    super._process(deltaTime)
    
    if (this._isInitialized && this._config.enabled) {
      this._updateDetections()
    }
  }

  override _exitTree(): void {
    this._cleanupPhysicsArea()
    super._exitTree()
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _initializePhysicsArea(): void {
    if (this._isInitialized) return

    // 创建物理区域
    this._physicsArea = this._physicsServer.createArea()
    if (!this._physicsArea) {
      console.error('Failed to create physics area')
      return
    }

    // 配置物理区域
    this._updatePhysicsAreaConfig()
    this._updatePhysicsArea()

    // 设置碰撞回调
    this._setupCollisionCallbacks()

    this._isInitialized = true
    console.log(`Area3D initialized: ${this.name}`)
  }

  private _updatePhysicsAreaConfig(): void {
    if (!this._physicsArea) return

    // 更新物理区域配置
    this._physicsArea.setMonitoringEnabled(this._config.monitoringEnabled)
    this._physicsArea.setMonitorableEnabled(this._config.monitorableEnabled)
    this._physicsArea.setCollisionLayer(this._config.collisionLayer)
    this._physicsArea.setCollisionMask(this._config.collisionMask)
    this._physicsArea.setPriority(this._config.priority)
  }

  private _updatePhysicsArea(): void {
    if (!this._physicsArea) return

    // 更新物理区域的形状
    this._physicsArea.clearShapes()
    
    this._collisionShapes.forEach(shape => {
      if (shape.physicsShape) {
        this._physicsArea.addShape(shape.physicsShape, shape.getGlobalTransform())
      }
    })

    // 更新区域变换
    this._physicsArea.setTransform(this.getGlobalTransform())
  }

  private _setupCollisionCallbacks(): void {
    if (!this._physicsArea) return

    // 物体进入回调
    this._physicsArea.onBodyEntered = (body: any) => {
      const node = this._findNodeByPhysicsBody(body)
      if (node) {
        this._onBodyEntered(node)
      }
    }

    // 物体离开回调
    this._physicsArea.onBodyExited = (body: any) => {
      const node = this._findNodeByPhysicsBody(body)
      if (node) {
        this._onBodyExited(node)
      }
    }

    // 区域进入回调
    this._physicsArea.onAreaEntered = (area: any) => {
      const node = this._findNodeByPhysicsArea(area)
      if (node instanceof Area3D) {
        this._onAreaEntered(node)
      }
    }

    // 区域离开回调
    this._physicsArea.onAreaExited = (area: any) => {
      const node = this._findNodeByPhysicsArea(area)
      if (node instanceof Area3D) {
        this._onAreaExited(node)
      }
    }
  }

  private _onBodyEntered(body: Node3D): void {
    const detection: AreaDetection = {
      node: body,
      enterTime: performance.now(),
      contactPoints: []
    }

    this._detectedBodies.set(body.id, detection)
    this._stats.enterEvents++
    this._stats.currentDetections++
    this._stats.totalDetections++

    // 发射信号
    this.emit('body_entered', body)
    console.log(`Body entered area: ${body.name} -> ${this.name}`)
  }

  private _onBodyExited(body: Node3D): void {
    const detection = this._detectedBodies.get(body.id)
    if (detection) {
      const detectionTime = performance.now() - detection.enterTime
      this._updateAverageDetectionTime(detectionTime)
      
      this._detectedBodies.delete(body.id)
      this._stats.exitEvents++
      this._stats.currentDetections--

      // 发射信号
      this.emit('body_exited', body)
      console.log(`Body exited area: ${body.name} -> ${this.name}`)
    }
  }

  private _onAreaEntered(area: Area3D): void {
    const detection: AreaDetection = {
      node: area,
      enterTime: performance.now(),
      contactPoints: []
    }

    this._detectedAreas.set(area.id, detection)
    this._stats.enterEvents++
    this._stats.currentDetections++
    this._stats.totalDetections++

    // 发射信号
    this.emit('area_entered', area)
    console.log(`Area entered area: ${area.name} -> ${this.name}`)
  }

  private _onAreaExited(area: Area3D): void {
    const detection = this._detectedAreas.get(area.id)
    if (detection) {
      const detectionTime = performance.now() - detection.enterTime
      this._updateAverageDetectionTime(detectionTime)
      
      this._detectedAreas.delete(area.id)
      this._stats.exitEvents++
      this._stats.currentDetections--

      // 发射信号
      this.emit('area_exited', area)
      console.log(`Area exited area: ${area.name} -> ${this.name}`)
    }
  }

  private _updateDetections(): void {
    // 更新物理区域变换
    if (this._physicsArea) {
      this._physicsArea.setTransform(this.getGlobalTransform())
    }
  }

  private _updateAverageDetectionTime(detectionTime: number): void {
    const totalEvents = this._stats.exitEvents
    if (totalEvents > 0) {
      this._stats.averageDetectionTime = 
        (this._stats.averageDetectionTime * (totalEvents - 1) + detectionTime) / totalEvents
    }
  }

  private _findNodeByPhysicsBody(physicsBody: any): Node3D | null {
    // 这里需要根据实际的物理系统实现来查找对应的节点
    // 简化实现，实际项目中需要维护物理体到节点的映射
    return null
  }

  private _findNodeByPhysicsArea(physicsArea: any): Node3D | null {
    // 这里需要根据实际的物理系统实现来查找对应的节点
    // 简化实现，实际项目中需要维护物理区域到节点的映射
    return null
  }

  private _cleanupPhysicsArea(): void {
    if (this._physicsArea) {
      this._physicsServer.destroyArea(this._physicsArea)
      this._physicsArea = null
    }
    
    this._detectedBodies.clear()
    this._detectedAreas.clear()
    this._isInitialized = false
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  override destroy(): void {
    this._cleanupPhysicsArea()
    super.destroy()
  }
}

export default Area3D
