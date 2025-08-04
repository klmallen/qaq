/**
 * QAQ游戏引擎 - 动画碰撞同步器
 * 
 * 功能：实现动画播放时碰撞体的实时同步更新
 * 特性：多种同步策略、骨骼映射、性能优化
 */

import BoneTransformTracker from './BoneTransformTracker'
import CollisionUpdateBatcher from './CollisionUpdateBatcher'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import AnimationPlayer from '../nodes/animation/AnimationPlayer'
import type { Transform3D, TransformThresholds } from './BoneTransformTracker'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export enum SyncStrategy {
  REALTIME = 'realtime',        // 每帧同步
  KEYFRAME = 'keyframe',        // 关键帧同步
  THRESHOLD = 'threshold',      // 阈值触发同步
  MANUAL = 'manual'             // 手动同步
}

export interface SyncConfig {
  strategy: SyncStrategy
  updateFrequency: number       // 更新频率 (仅REALTIME模式)
  thresholds: TransformThresholds // 变化阈值 (THRESHOLD模式)
  enabledBones: string[]        // 需要同步的骨骼名称列表
  batchUpdates: boolean         // 是否启用批量更新
  maxUpdatesPerFrame: number    // 每帧最大更新数量
}

export interface BoneCollisionMapping {
  boneName: string
  collisionShape: CollisionShape3D
  offsetTransform?: Transform3D  // 相对骨骼的偏移变换
  syncPosition: boolean
  syncRotation: boolean
  syncScale: boolean
}

export interface SyncStats {
  totalMappings: number
  activeUpdates: number
  updatesPerSecond: number
  averageUpdateTime: number
  skippedUpdates: number
}

// ============================================================================
// AnimationCollisionSync 实现
// ============================================================================

export class AnimationCollisionSync {
  private _animationPlayer: AnimationPlayer
  private _config: SyncConfig
  private _transformTracker: BoneTransformTracker
  private _updateBatcher: CollisionUpdateBatcher
  
  private _boneMappings: Map<string, BoneCollisionMapping[]> = new Map()
  private _isActive: boolean = false
  private _syncTimer: number = 0
  private _lastUpdateTime: number = 0
  
  // 统计信息
  private _stats: SyncStats = {
    totalMappings: 0,
    activeUpdates: 0,
    updatesPerSecond: 0,
    averageUpdateTime: 0,
    skippedUpdates: 0
  }

  // 默认配置
  static readonly DEFAULT_CONFIG: SyncConfig = {
    strategy: SyncStrategy.THRESHOLD,
    updateFrequency: 60,
    thresholds: {
      position: 0.01,
      rotation: 0.017,
      scale: 0.01
    },
    enabledBones: [],
    batchUpdates: true,
    maxUpdatesPerFrame: 50
  }

  constructor(animationPlayer: AnimationPlayer, config: Partial<SyncConfig> = {}) {
    this._animationPlayer = animationPlayer
    this._config = { ...AnimationCollisionSync.DEFAULT_CONFIG, ...config }
    
    this._transformTracker = new BoneTransformTracker(this._config.thresholds)
    this._updateBatcher = new CollisionUpdateBatcher()
    
    this._lastUpdateTime = performance.now()
  }

  // ========================================================================
  // 骨骼碰撞映射管理
  // ========================================================================

  /**
   * 添加骨骼碰撞映射
   * @param mapping 骨骼碰撞映射配置
   */
  addBoneMapping(mapping: BoneCollisionMapping): void {
    const boneName = mapping.boneName
    
    if (!this._boneMappings.has(boneName)) {
      this._boneMappings.set(boneName, [])
    }
    
    this._boneMappings.get(boneName)!.push(mapping)
    this._stats.totalMappings++
    
    // 开始跟踪该骨骼
    const initialTransform = this._getBoneTransform(boneName)
    if (initialTransform) {
      this._transformTracker.startTracking(boneName, initialTransform)
    }
  }

  /**
   * 移除骨骼碰撞映射
   * @param boneName 骨骼名称
   * @param collisionShape 碰撞形状（可选，不指定则移除该骨骼的所有映射）
   */
  removeBoneMapping(boneName: string, collisionShape?: CollisionShape3D): void {
    const mappings = this._boneMappings.get(boneName)
    if (!mappings) return

    if (collisionShape) {
      const index = mappings.findIndex(m => m.collisionShape === collisionShape)
      if (index >= 0) {
        mappings.splice(index, 1)
        this._stats.totalMappings--
      }
      
      if (mappings.length === 0) {
        this._boneMappings.delete(boneName)
        this._transformTracker.stopTracking(boneName)
      }
    } else {
      this._stats.totalMappings -= mappings.length
      this._boneMappings.delete(boneName)
      this._transformTracker.stopTracking(boneName)
    }
  }

  /**
   * 获取骨骼的所有碰撞映射
   * @param boneName 骨骼名称
   * @returns 碰撞映射列表
   */
  getBoneMappings(boneName: string): BoneCollisionMapping[] {
    return this._boneMappings.get(boneName) || []
  }

  // ========================================================================
  // 同步控制
  // ========================================================================

  /**
   * 开始同步
   */
  startSync(): void {
    if (this._isActive) return
    
    this._isActive = true
    this._syncTimer = 0
    this._lastUpdateTime = performance.now()
    
    console.log(`🔄 动画碰撞同步已启动 (策略: ${this._config.strategy})`)
  }

  /**
   * 停止同步
   */
  stopSync(): void {
    if (!this._isActive) return
    
    this._isActive = false
    this._updateBatcher.clear()
    
    console.log('⏹️ 动画碰撞同步已停止')
  }

  /**
   * 强制同步所有映射
   */
  forceSyncAll(): void {
    const startTime = performance.now()
    let updateCount = 0

    this._boneMappings.forEach((mappings, boneName) => {
      const currentTransform = this._getBoneTransform(boneName)
      if (currentTransform) {
        this._transformTracker.forceUpdate(boneName, currentTransform)
        mappings.forEach(mapping => {
          this._syncCollisionShape(mapping, currentTransform)
          updateCount++
        })
      }
    })

    const updateTime = performance.now() - startTime
    console.log(`🔄 强制同步完成: ${updateCount} 个映射, 耗时 ${updateTime.toFixed(2)}ms`)
  }

  /**
   * 更新同步（每帧调用）
   * @param deltaTime 时间增量
   */
  update(deltaTime: number): void {
    if (!this._isActive) return

    const startTime = performance.now()
    this._syncTimer += deltaTime * 1000

    // 根据策略决定是否需要更新
    if (!this._shouldUpdateThisFrame()) {
      return
    }

    this._syncTimer = 0
    let updateCount = 0
    let skippedCount = 0

    // 遍历所有骨骼映射
    this._boneMappings.forEach((mappings, boneName) => {
      // 检查是否在启用列表中
      if (this._config.enabledBones.length > 0 && 
          !this._config.enabledBones.includes(boneName)) {
        skippedCount += mappings.length
        return
      }

      const currentTransform = this._getBoneTransform(boneName)
      if (!currentTransform) {
        skippedCount += mappings.length
        return
      }

      // 检查是否需要更新
      const needsUpdate = this._config.strategy === SyncStrategy.MANUAL ? 
        false : this._transformTracker.shouldUpdate(boneName, currentTransform)

      if (needsUpdate && updateCount < this._config.maxUpdatesPerFrame) {
        mappings.forEach(mapping => {
          if (this._config.batchUpdates) {
            this._updateBatcher.scheduleUpdate(
              `${boneName}_${mapping.collisionShape.id}`,
              mapping.collisionShape,
              this._calculateFinalTransform(mapping, currentTransform),
              1 // 优先级
            )
          } else {
            this._syncCollisionShape(mapping, currentTransform)
          }
          updateCount++
        })
      } else if (!needsUpdate) {
        skippedCount += mappings.length
      }
    })

    // 处理批量更新
    if (this._config.batchUpdates) {
      this._updateBatcher.processBatch(deltaTime)
    }

    // 更新统计信息
    this._updateStats(startTime, updateCount, skippedCount)
  }

  // ========================================================================
  // 配置管理
  // ========================================================================

  /**
   * 更新同步配置
   * @param config 新的配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this._config = { ...this._config, ...config }
    
    if (config.thresholds) {
      this._transformTracker.updateThresholds(config.thresholds)
    }
    
    console.log(`⚙️ 同步配置已更新: ${JSON.stringify(config)}`)
  }

  /**
   * 获取当前配置
   * @returns 同步配置
   */
  getConfig(): SyncConfig {
    return { ...this._config }
  }

  /**
   * 获取统计信息
   * @returns 同步统计
   */
  getStats(): SyncStats {
    return { ...this._stats }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _shouldUpdateThisFrame(): boolean {
    switch (this._config.strategy) {
      case SyncStrategy.REALTIME:
        const interval = 1000 / this._config.updateFrequency
        return this._syncTimer >= interval

      case SyncStrategy.KEYFRAME:
        // 检查动画是否在关键帧
        return this._isOnKeyframe()

      case SyncStrategy.THRESHOLD:
        // 阈值检测在 shouldUpdate 中处理
        return true

      case SyncStrategy.MANUAL:
        return false

      default:
        return true
    }
  }

  private _isOnKeyframe(): boolean {
    // 简化实现：检查动画播放时间是否接近整数秒
    const currentTime = this._animationPlayer.getCurrentTime()
    return Math.abs(currentTime - Math.round(currentTime)) < 0.016 // ~1帧的时间
  }

  private _getBoneTransform(boneName: string): Transform3D | null {
    // 从动画播放器获取骨骼变换
    // 这里需要根据实际的动画系统API进行实现
    const bone = this._animationPlayer.getBone?.(boneName)
    if (!bone) return null

    return {
      position: bone.position || { x: 0, y: 0, z: 0 },
      rotation: bone.rotation || { x: 0, y: 0, z: 0 },
      scale: bone.scale || { x: 1, y: 1, z: 1 }
    }
  }

  private _calculateFinalTransform(mapping: BoneCollisionMapping, boneTransform: Transform3D): Transform3D {
    const finalTransform: Transform3D = {
      position: mapping.syncPosition ? { ...boneTransform.position } : { x: 0, y: 0, z: 0 },
      rotation: mapping.syncRotation ? { ...boneTransform.rotation } : { x: 0, y: 0, z: 0 },
      scale: mapping.syncScale ? { ...boneTransform.scale } : { x: 1, y: 1, z: 1 }
    }

    // 应用偏移变换
    if (mapping.offsetTransform) {
      const offset = mapping.offsetTransform
      finalTransform.position.x += offset.position.x
      finalTransform.position.y += offset.position.y
      finalTransform.position.z += offset.position.z
      finalTransform.rotation.x += offset.rotation.x
      finalTransform.rotation.y += offset.rotation.y
      finalTransform.rotation.z += offset.rotation.z
      finalTransform.scale.x *= offset.scale.x
      finalTransform.scale.y *= offset.scale.y
      finalTransform.scale.z *= offset.scale.z
    }

    return finalTransform
  }

  private _syncCollisionShape(mapping: BoneCollisionMapping, boneTransform: Transform3D): void {
    const finalTransform = this._calculateFinalTransform(mapping, boneTransform)
    const shape = mapping.collisionShape

    // 更新碰撞形状的变换
    if (mapping.syncPosition) {
      shape.position = finalTransform.position
    }
    if (mapping.syncRotation) {
      shape.rotation = finalTransform.rotation
    }
    if (mapping.syncScale) {
      shape.scale = finalTransform.scale
    }
  }

  private _updateStats(startTime: number, updateCount: number, skippedCount: number): void {
    const updateTime = performance.now() - startTime
    const currentTime = performance.now()
    const timeDelta = currentTime - this._lastUpdateTime

    this._stats.activeUpdates = updateCount
    this._stats.skippedUpdates = skippedCount
    this._stats.averageUpdateTime = updateTime
    
    if (timeDelta > 0) {
      this._stats.updatesPerSecond = (updateCount / timeDelta) * 1000
    }

    this._lastUpdateTime = currentTime
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  dispose(): void {
    this.stopSync()
    this._boneMappings.clear()
    this._transformTracker.dispose()
    this._updateBatcher.dispose()
  }
}

export default AnimationCollisionSync
