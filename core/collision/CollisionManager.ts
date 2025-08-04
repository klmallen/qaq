/**
 * QAQ游戏引擎 - 碰撞管理器
 * 
 * 功能：全局碰撞事件分发、性能监控、空间分割管理
 * 特性：事件系统、批量处理、性能优化
 */

import Area3D from '../nodes/physics/Area3D'
import CharacterBody3D from '../nodes/physics/CharacterBody3D'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import RigidBody3D from '../nodes/physics/RigidBody3D'
import StaticBody3D from '../nodes/physics/StaticBody3D'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface CollisionEvent {
  type: 'enter' | 'exit' | 'stay'
  objectA: CollisionObject
  objectB: CollisionObject
  contactPoint?: Vector3
  contactNormal?: Vector3
  penetrationDepth?: number
  timestamp: number
}

export interface CollisionObject {
  id: string
  node: Area3D | CharacterBody3D | RigidBody3D | StaticBody3D
  type: 'area' | 'character' | 'rigid' | 'static'
  layer: number
  mask: number
  priority: number
}

export interface CollisionEventListener {
  id: string
  callback: (event: CollisionEvent) => void
  filter?: (event: CollisionEvent) => boolean
  priority: number
}

export interface SpatialCell {
  x: number
  y: number
  z: number
  objects: Set<CollisionObject>
}

export interface CollisionManagerConfig {
  enabled: boolean
  spatialHashEnabled: boolean
  cellSize: number
  maxObjectsPerCell: number
  eventQueueSize: number
  processEventsPerFrame: number
  debugMode: boolean
}

export interface CollisionStats {
  totalObjects: number
  activeCollisions: number
  eventsPerSecond: number
  averageProcessTime: number
  spatialCells: number
  memoryUsage: number
}

// ============================================================================
// CollisionManager 实现
// ============================================================================

export class CollisionManager {
  private static _instance: CollisionManager | null = null
  
  private _config: CollisionManagerConfig
  private _collisionObjects: Map<string, CollisionObject> = new Map()
  private _eventListeners: Map<string, CollisionEventListener[]> = new Map()
  private _eventQueue: CollisionEvent[] = []
  private _spatialHash: Map<string, SpatialCell> = new Map()
  
  // 统计信息
  private _stats: CollisionStats = {
    totalObjects: 0,
    activeCollisions: 0,
    eventsPerSecond: 0,
    averageProcessTime: 0,
    spatialCells: 0,
    memoryUsage: 0
  }
  
  private _lastUpdateTime: number = 0
  private _eventHistory: number[] = []

  // 默认配置
  static readonly DEFAULT_CONFIG: CollisionManagerConfig = {
    enabled: true,
    spatialHashEnabled: true,
    cellSize: 10,
    maxObjectsPerCell: 50,
    eventQueueSize: 1000,
    processEventsPerFrame: 100,
    debugMode: false
  }

  private constructor(config: Partial<CollisionManagerConfig> = {}) {
    this._config = { ...CollisionManager.DEFAULT_CONFIG, ...config }
    this._lastUpdateTime = performance.now()
  }

  static getInstance(config?: Partial<CollisionManagerConfig>): CollisionManager {
    if (!CollisionManager._instance) {
      CollisionManager._instance = new CollisionManager(config)
    }
    return CollisionManager._instance
  }

  // ========================================================================
  // 对象管理
  // ========================================================================

  /**
   * 注册碰撞对象
   * @param node 碰撞节点
   */
  registerObject(node: Area3D | CharacterBody3D | RigidBody3D | StaticBody3D): void {
    if (!this._config.enabled) return

    const collisionObject: CollisionObject = {
      id: node.id,
      node,
      type: this._getObjectType(node),
      layer: this._getObjectLayer(node),
      mask: this._getObjectMask(node),
      priority: this._getObjectPriority(node)
    }

    this._collisionObjects.set(node.id, collisionObject)
    this._stats.totalObjects++

    // 添加到空间哈希
    if (this._config.spatialHashEnabled) {
      this._addToSpatialHash(collisionObject)
    }

    if (this._config.debugMode) {
      console.log(`Registered collision object: ${node.name} (${collisionObject.type})`)
    }
  }

  /**
   * 注销碰撞对象
   * @param nodeId 节点ID
   */
  unregisterObject(nodeId: string): void {
    const collisionObject = this._collisionObjects.get(nodeId)
    if (collisionObject) {
      // 从空间哈希中移除
      if (this._config.spatialHashEnabled) {
        this._removeFromSpatialHash(collisionObject)
      }

      this._collisionObjects.delete(nodeId)
      this._stats.totalObjects--

      if (this._config.debugMode) {
        console.log(`Unregistered collision object: ${collisionObject.node.name}`)
      }
    }
  }

  /**
   * 更新对象位置（用于空间哈希）
   * @param nodeId 节点ID
   */
  updateObjectPosition(nodeId: string): void {
    if (!this._config.spatialHashEnabled) return

    const collisionObject = this._collisionObjects.get(nodeId)
    if (collisionObject) {
      this._removeFromSpatialHash(collisionObject)
      this._addToSpatialHash(collisionObject)
    }
  }

  // ========================================================================
  // 事件系统
  // ========================================================================

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 监听器
   */
  addEventListener(eventType: string, listener: CollisionEventListener): void {
    if (!this._eventListeners.has(eventType)) {
      this._eventListeners.set(eventType, [])
    }

    const listeners = this._eventListeners.get(eventType)!
    listeners.push(listener)
    
    // 按优先级排序
    listeners.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listenerId 监听器ID
   */
  removeEventListener(eventType: string, listenerId: string): void {
    const listeners = this._eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.findIndex(l => l.id === listenerId)
      if (index >= 0) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * 分发碰撞事件
   * @param event 碰撞事件
   */
  dispatchEvent(event: CollisionEvent): void {
    if (this._eventQueue.length >= this._config.eventQueueSize) {
      // 队列满了，移除最旧的事件
      this._eventQueue.shift()
    }

    this._eventQueue.push(event)
  }

  // ========================================================================
  // 碰撞检测
  // ========================================================================

  /**
   * 查询指定区域内的碰撞对象
   * @param center 中心点
   * @param radius 半径
   * @param layerMask 层掩码
   * @returns 碰撞对象列表
   */
  queryArea(center: Vector3, radius: number, layerMask: number = 0xFFFFFFFF): CollisionObject[] {
    if (this._config.spatialHashEnabled) {
      return this._queryAreaSpatial(center, radius, layerMask)
    } else {
      return this._queryAreaBruteForce(center, radius, layerMask)
    }
  }

  /**
   * 射线检测
   * @param origin 起点
   * @param direction 方向
   * @param maxDistance 最大距离
   * @param layerMask 层掩码
   * @returns 碰撞结果
   */
  raycast(origin: Vector3, direction: Vector3, maxDistance: number, layerMask: number = 0xFFFFFFFF): CollisionObject[] {
    const results: CollisionObject[] = []
    
    // 简化实现，实际项目中需要精确的射线-几何体相交测试
    this._collisionObjects.forEach(obj => {
      if ((obj.layer & layerMask) === 0) return
      
      const objPosition = obj.node.position
      const distance = this._vectorDistance(origin, objPosition)
      
      if (distance <= maxDistance) {
        results.push(obj)
      }
    })

    return results.sort((a, b) => {
      const distA = this._vectorDistance(origin, a.node.position)
      const distB = this._vectorDistance(origin, b.node.position)
      return distA - distB
    })
  }

  // ========================================================================
  // 更新和处理
  // ========================================================================

  /**
   * 更新碰撞管理器（每帧调用）
   * @param deltaTime 时间增量
   */
  update(deltaTime: number): void {
    if (!this._config.enabled) return

    const startTime = performance.now()

    // 处理事件队列
    this._processEventQueue()

    // 更新空间哈希
    if (this._config.spatialHashEnabled) {
      this._updateSpatialHash()
    }

    // 更新统计信息
    this._updateStats(startTime)
  }

  /**
   * 获取统计信息
   * @returns 统计信息
   */
  getStats(): CollisionStats {
    return { ...this._stats }
  }

  /**
   * 获取配置
   * @returns 配置信息
   */
  getConfig(): CollisionManagerConfig {
    return { ...this._config }
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<CollisionManagerConfig>): void {
    this._config = { ...this._config, ...config }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _getObjectType(node: any): 'area' | 'character' | 'rigid' | 'static' {
    if (node instanceof Area3D) return 'area'
    if (node instanceof CharacterBody3D) return 'character'
    if (node instanceof RigidBody3D) return 'rigid'
    if (node instanceof StaticBody3D) return 'static'
    return 'static' // 默认
  }

  private _getObjectLayer(node: any): number {
    return node.getCollisionLayer?.() || 1
  }

  private _getObjectMask(node: any): number {
    return node.getCollisionMask?.() || 1
  }

  private _getObjectPriority(node: any): number {
    return node.getPriority?.() || 0
  }

  private _getSpatialKey(x: number, y: number, z: number): string {
    const cellX = Math.floor(x / this._config.cellSize)
    const cellY = Math.floor(y / this._config.cellSize)
    const cellZ = Math.floor(z / this._config.cellSize)
    return `${cellX},${cellY},${cellZ}`
  }

  private _addToSpatialHash(obj: CollisionObject): void {
    const position = obj.node.position
    const key = this._getSpatialKey(position.x, position.y, position.z)
    
    if (!this._spatialHash.has(key)) {
      this._spatialHash.set(key, {
        x: Math.floor(position.x / this._config.cellSize),
        y: Math.floor(position.y / this._config.cellSize),
        z: Math.floor(position.z / this._config.cellSize),
        objects: new Set()
      })
      this._stats.spatialCells++
    }

    this._spatialHash.get(key)!.objects.add(obj)
  }

  private _removeFromSpatialHash(obj: CollisionObject): void {
    const position = obj.node.position
    const key = this._getSpatialKey(position.x, position.y, position.z)
    const cell = this._spatialHash.get(key)
    
    if (cell) {
      cell.objects.delete(obj)
      if (cell.objects.size === 0) {
        this._spatialHash.delete(key)
        this._stats.spatialCells--
      }
    }
  }

  private _queryAreaSpatial(center: Vector3, radius: number, layerMask: number): CollisionObject[] {
    const results: CollisionObject[] = []
    const cellRadius = Math.ceil(radius / this._config.cellSize)
    
    const centerCellX = Math.floor(center.x / this._config.cellSize)
    const centerCellY = Math.floor(center.y / this._config.cellSize)
    const centerCellZ = Math.floor(center.z / this._config.cellSize)

    for (let x = centerCellX - cellRadius; x <= centerCellX + cellRadius; x++) {
      for (let y = centerCellY - cellRadius; y <= centerCellY + cellRadius; y++) {
        for (let z = centerCellZ - cellRadius; z <= centerCellZ + cellRadius; z++) {
          const key = `${x},${y},${z}`
          const cell = this._spatialHash.get(key)
          
          if (cell) {
            cell.objects.forEach(obj => {
              if ((obj.layer & layerMask) === 0) return
              
              const distance = this._vectorDistance(center, obj.node.position)
              if (distance <= radius) {
                results.push(obj)
              }
            })
          }
        }
      }
    }

    return results
  }

  private _queryAreaBruteForce(center: Vector3, radius: number, layerMask: number): CollisionObject[] {
    const results: CollisionObject[] = []
    
    this._collisionObjects.forEach(obj => {
      if ((obj.layer & layerMask) === 0) return
      
      const distance = this._vectorDistance(center, obj.node.position)
      if (distance <= radius) {
        results.push(obj)
      }
    })

    return results
  }

  private _processEventQueue(): void {
    const maxEvents = Math.min(this._eventQueue.length, this._config.processEventsPerFrame)
    
    for (let i = 0; i < maxEvents; i++) {
      const event = this._eventQueue.shift()!
      this._dispatchEventToListeners(event)
    }
  }

  private _dispatchEventToListeners(event: CollisionEvent): void {
    const listeners = this._eventListeners.get(event.type) || []
    
    listeners.forEach(listener => {
      if (!listener.filter || listener.filter(event)) {
        listener.callback(event)
      }
    })
  }

  private _updateSpatialHash(): void {
    // 重新构建空间哈希（简化实现）
    // 实际项目中应该只更新移动的对象
    this._spatialHash.clear()
    this._stats.spatialCells = 0
    
    this._collisionObjects.forEach(obj => {
      this._addToSpatialHash(obj)
    })
  }

  private _updateStats(startTime: number): void {
    const processTime = performance.now() - startTime
    this._stats.averageProcessTime = processTime
    
    // 更新事件频率统计
    const currentTime = performance.now()
    this._eventHistory.push(currentTime)
    
    // 保留最近1秒的事件
    this._eventHistory = this._eventHistory.filter(time => currentTime - time < 1000)
    this._stats.eventsPerSecond = this._eventHistory.length
    
    // 估算内存使用
    this._stats.memoryUsage = 
      this._collisionObjects.size * 200 + // 每个对象约200字节
      this._spatialHash.size * 100 +      // 每个空间格约100字节
      this._eventQueue.length * 150       // 每个事件约150字节
  }

  private _vectorDistance(a: Vector3, b: Vector3): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    const dz = a.z - b.z
    return Math.sqrt(dx * dx + dy * dy + dz * dz)
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  clear(): void {
    this._collisionObjects.clear()
    this._eventListeners.clear()
    this._eventQueue.length = 0
    this._spatialHash.clear()
    this._eventHistory.length = 0
    
    this._stats = {
      totalObjects: 0,
      activeCollisions: 0,
      eventsPerSecond: 0,
      averageProcessTime: 0,
      spatialCells: 0,
      memoryUsage: 0
    }
  }

  dispose(): void {
    this.clear()
    CollisionManager._instance = null
  }
}

export default CollisionManager
