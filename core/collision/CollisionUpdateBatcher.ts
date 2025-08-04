/**
 * QAQ游戏引擎 - 碰撞更新批处理器
 * 
 * 功能：批量处理碰撞体更新，优化单帧性能
 * 特性：优先级排序、批量处理、性能监控
 */

import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import type { Transform3D } from './BoneTransformTracker'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface CollisionUpdateInfo {
  id: string
  shape: CollisionShape3D
  transform: Transform3D
  priority: number
  timestamp: number
}

export interface BatchConfig {
  batchInterval: number      // 批处理间隔 (ms)
  maxBatchSize: number       // 单次批处理最大数量
  priorityThreshold: number  // 高优先级阈值
  timeoutThreshold: number   // 更新超时阈值 (ms)
}

export interface BatchStats {
  pendingUpdates: number
  processedUpdates: number
  averageBatchSize: number
  averageProcessTime: number
  droppedUpdates: number
  batchesPerSecond: number
}

// ============================================================================
// CollisionUpdateBatcher 实现
// ============================================================================

export class CollisionUpdateBatcher {
  private _pendingUpdates: Map<string, CollisionUpdateInfo> = new Map()
  private _config: BatchConfig
  private _updateTimer: number = 0
  private _lastBatchTime: number = 0
  
  // 统计信息
  private _stats: BatchStats = {
    pendingUpdates: 0,
    processedUpdates: 0,
    averageBatchSize: 0,
    averageProcessTime: 0,
    droppedUpdates: 0,
    batchesPerSecond: 0
  }
  
  private _batchHistory: number[] = []
  private _processTimeHistory: number[] = []
  private _maxHistorySize: number = 100

  // 默认配置
  static readonly DEFAULT_CONFIG: BatchConfig = {
    batchInterval: 16.67,     // 60 FPS
    maxBatchSize: 50,
    priorityThreshold: 5,
    timeoutThreshold: 100     // 100ms 超时
  }

  constructor(config: Partial<BatchConfig> = {}) {
    this._config = { ...CollisionUpdateBatcher.DEFAULT_CONFIG, ...config }
    this._lastBatchTime = performance.now()
  }

  // ========================================================================
  // 更新调度方法
  // ========================================================================

  /**
   * 调度碰撞更新
   * @param id 更新ID（唯一标识）
   * @param shape 碰撞形状
   * @param transform 目标变换
   * @param priority 优先级（数值越大优先级越高）
   */
  scheduleUpdate(id: string, shape: CollisionShape3D, transform: Transform3D, priority: number = 0): void {
    const updateInfo: CollisionUpdateInfo = {
      id,
      shape,
      transform: this._cloneTransform(transform),
      priority,
      timestamp: performance.now()
    }

    // 如果已存在相同ID的更新，替换为新的（保持最新状态）
    if (this._pendingUpdates.has(id)) {
      this._pendingUpdates.set(id, updateInfo)
    } else {
      this._pendingUpdates.set(id, updateInfo)
      this._stats.pendingUpdates++
    }
  }

  /**
   * 取消指定的更新
   * @param id 更新ID
   */
  cancelUpdate(id: string): void {
    if (this._pendingUpdates.delete(id)) {
      this._stats.pendingUpdates--
    }
  }

  /**
   * 立即处理指定更新（跳过批处理）
   * @param id 更新ID
   */
  processImmediately(id: string): void {
    const updateInfo = this._pendingUpdates.get(id)
    if (updateInfo) {
      this._applyCollisionUpdate(updateInfo)
      this._pendingUpdates.delete(id)
      this._stats.pendingUpdates--
      this._stats.processedUpdates++
    }
  }

  // ========================================================================
  // 批处理方法
  // ========================================================================

  /**
   * 处理批量更新
   * @param deltaTime 时间增量 (秒)
   */
  processBatch(deltaTime: number): void {
    this._updateTimer += deltaTime * 1000

    // 检查是否到达批处理时间
    if (this._updateTimer < this._config.batchInterval) {
      return
    }

    this._updateTimer = 0
    const startTime = performance.now()

    // 获取待处理的更新
    const updates = this._getPendingUpdates()
    if (updates.length === 0) {
      return
    }

    // 按优先级和时间排序
    const sortedUpdates = this._sortUpdates(updates)
    
    // 限制批处理大小
    const batchUpdates = sortedUpdates.slice(0, this._config.maxBatchSize)
    
    // 处理批量更新
    let processedCount = 0
    let droppedCount = 0

    batchUpdates.forEach(updateInfo => {
      // 检查更新是否超时
      if (this._isUpdateExpired(updateInfo)) {
        droppedCount++
        return
      }

      this._applyCollisionUpdate(updateInfo)
      processedCount++
    })

    // 清理已处理的更新
    batchUpdates.forEach(updateInfo => {
      this._pendingUpdates.delete(updateInfo.id)
    })

    // 更新统计信息
    this._updateStats(startTime, processedCount, droppedCount, batchUpdates.length)
  }

  /**
   * 强制处理所有待处理的更新
   */
  flushAll(): void {
    const startTime = performance.now()
    const updates = this._getPendingUpdates()
    
    let processedCount = 0
    let droppedCount = 0

    updates.forEach(updateInfo => {
      if (this._isUpdateExpired(updateInfo)) {
        droppedCount++
        return
      }

      this._applyCollisionUpdate(updateInfo)
      processedCount++
    })

    this._pendingUpdates.clear()
    this._updateStats(startTime, processedCount, droppedCount, updates.length)
    
    console.log(`🔄 强制刷新批处理: 处理 ${processedCount} 个更新, 丢弃 ${droppedCount} 个`)
  }

  // ========================================================================
  // 配置和统计
  // ========================================================================

  /**
   * 更新批处理配置
   * @param config 新配置
   */
  updateConfig(config: Partial<BatchConfig>): void {
    this._config = { ...this._config, ...config }
  }

  /**
   * 获取当前配置
   * @returns 批处理配置
   */
  getConfig(): BatchConfig {
    return { ...this._config }
  }

  /**
   * 获取统计信息
   * @returns 批处理统计
   */
  getStats(): BatchStats {
    return { ...this._stats }
  }

  /**
   * 获取待处理更新的详细信息
   * @returns 更新信息列表
   */
  getPendingUpdateDetails(): CollisionUpdateInfo[] {
    return Array.from(this._pendingUpdates.values()).map(info => ({
      ...info,
      transform: this._cloneTransform(info.transform)
    }))
  }

  /**
   * 清空所有待处理的更新
   */
  clear(): void {
    this._pendingUpdates.clear()
    this._stats.pendingUpdates = 0
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _getPendingUpdates(): CollisionUpdateInfo[] {
    return Array.from(this._pendingUpdates.values())
  }

  private _sortUpdates(updates: CollisionUpdateInfo[]): CollisionUpdateInfo[] {
    return updates.sort((a, b) => {
      // 首先按优先级排序（高优先级在前）
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      
      // 相同优先级按时间排序（早提交的在前）
      return a.timestamp - b.timestamp
    })
  }

  private _isUpdateExpired(updateInfo: CollisionUpdateInfo): boolean {
    const now = performance.now()
    return (now - updateInfo.timestamp) > this._config.timeoutThreshold
  }

  private _applyCollisionUpdate(updateInfo: CollisionUpdateInfo): void {
    const { shape, transform } = updateInfo

    // 更新碰撞形状的变换
    shape.position = transform.position
    shape.rotation = transform.rotation
    shape.scale = transform.scale

    // 如果启用了调试可视化，更新调试线框
    if (shape.isDebugEnabled && shape.isDebugEnabled()) {
      // 调试线框会在 CollisionShape3D 的 _process 方法中自动更新
    }
  }

  private _updateStats(startTime: number, processedCount: number, droppedCount: number, batchSize: number): void {
    const processTime = performance.now() - startTime
    const currentTime = performance.now()

    // 更新基础统计
    this._stats.pendingUpdates = this._pendingUpdates.size
    this._stats.processedUpdates += processedCount
    this._stats.droppedUpdates += droppedCount

    // 更新历史记录
    this._batchHistory.push(batchSize)
    this._processTimeHistory.push(processTime)

    // 限制历史记录大小
    if (this._batchHistory.length > this._maxHistorySize) {
      this._batchHistory.shift()
      this._processTimeHistory.shift()
    }

    // 计算平均值
    if (this._batchHistory.length > 0) {
      this._stats.averageBatchSize = this._batchHistory.reduce((a, b) => a + b, 0) / this._batchHistory.length
      this._stats.averageProcessTime = this._processTimeHistory.reduce((a, b) => a + b, 0) / this._processTimeHistory.length
    }

    // 计算批处理频率
    const timeDelta = currentTime - this._lastBatchTime
    if (timeDelta > 0) {
      this._stats.batchesPerSecond = 1000 / timeDelta
    }
    this._lastBatchTime = currentTime
  }

  private _cloneTransform(transform: Transform3D): Transform3D {
    return {
      position: { ...transform.position },
      rotation: { ...transform.rotation },
      scale: { ...transform.scale }
    }
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  dispose(): void {
    this.clear()
    this._batchHistory.length = 0
    this._processTimeHistory.length = 0
  }
}

export default CollisionUpdateBatcher
