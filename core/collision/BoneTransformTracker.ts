/**
 * QAQ游戏引擎 - 骨骼变换跟踪器
 * 
 * 功能：高效跟踪骨骼变换变化，支持阈值检测和历史记录
 * 特性：差异检测、内存优化、可配置阈值
 */

import type { Vector3 } from '../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface Transform3D {
  position: Vector3
  rotation: Vector3
  scale: Vector3
}

export interface TransformDelta {
  position: number  // 位置变化量
  rotation: number  // 旋转变化量 (弧度)
  scale: number     // 缩放变化量
}

export interface TransformThresholds {
  position: number  // 位置变化阈值 (单位)
  rotation: number  // 旋转变化阈值 (弧度)
  scale: number     // 缩放变化阈值
}

export interface BoneTrackingInfo {
  boneName: string
  lastTransform: Transform3D
  lastUpdateTime: number
  changeCount: number
  totalDelta: TransformDelta
}

export interface TrackingStats {
  trackedBones: number
  totalUpdates: number
  averageUpdateFrequency: number
  memoryUsage: number
}

// ============================================================================
// BoneTransformTracker 实现
// ============================================================================

export class BoneTransformTracker {
  private _trackedBones: Map<string, BoneTrackingInfo> = new Map()
  private _thresholds: TransformThresholds
  private _maxHistorySize: number
  private _updateHistory: number[] = []
  private _totalUpdates: number = 0

  // 默认阈值配置
  static readonly DEFAULT_THRESHOLDS: TransformThresholds = {
    position: 0.01,  // 1cm
    rotation: 0.017, // ~1度
    scale: 0.01      // 1%
  }

  constructor(thresholds: Partial<TransformThresholds> = {}, maxHistorySize: number = 100) {
    this._thresholds = { ...BoneTransformTracker.DEFAULT_THRESHOLDS, ...thresholds }
    this._maxHistorySize = maxHistorySize
  }

  // ========================================================================
  // 骨骼跟踪方法
  // ========================================================================

  /**
   * 开始跟踪指定骨骼
   * @param boneName 骨骼名称
   * @param initialTransform 初始变换
   */
  startTracking(boneName: string, initialTransform: Transform3D): void {
    const trackingInfo: BoneTrackingInfo = {
      boneName,
      lastTransform: this._cloneTransform(initialTransform),
      lastUpdateTime: performance.now(),
      changeCount: 0,
      totalDelta: { position: 0, rotation: 0, scale: 0 }
    }
    
    this._trackedBones.set(boneName, trackingInfo)
  }

  /**
   * 停止跟踪指定骨骼
   * @param boneName 骨骼名称
   */
  stopTracking(boneName: string): void {
    this._trackedBones.delete(boneName)
  }

  /**
   * 检查骨骼是否需要更新
   * @param boneName 骨骼名称
   * @param currentTransform 当前变换
   * @returns 是否需要更新
   */
  shouldUpdate(boneName: string, currentTransform: Transform3D): boolean {
    const trackingInfo = this._trackedBones.get(boneName)
    if (!trackingInfo) {
      // 如果没有跟踪记录，自动开始跟踪并返回需要更新
      this.startTracking(boneName, currentTransform)
      return true
    }

    const delta = this._calculateDelta(trackingInfo.lastTransform, currentTransform)
    const needsUpdate = this._exceedsThreshold(delta)

    if (needsUpdate) {
      this._updateTrackingInfo(trackingInfo, currentTransform, delta)
    }

    return needsUpdate
  }

  /**
   * 强制更新骨骼变换记录
   * @param boneName 骨骼名称
   * @param currentTransform 当前变换
   */
  forceUpdate(boneName: string, currentTransform: Transform3D): void {
    const trackingInfo = this._trackedBones.get(boneName)
    if (trackingInfo) {
      const delta = this._calculateDelta(trackingInfo.lastTransform, currentTransform)
      this._updateTrackingInfo(trackingInfo, currentTransform, delta)
    } else {
      this.startTracking(boneName, currentTransform)
    }
  }

  /**
   * 获取骨骼的变换增量
   * @param boneName 骨骼名称
   * @param currentTransform 当前变换
   * @returns 变换增量
   */
  getDelta(boneName: string, currentTransform: Transform3D): TransformDelta | null {
    const trackingInfo = this._trackedBones.get(boneName)
    if (!trackingInfo) return null

    return this._calculateDelta(trackingInfo.lastTransform, currentTransform)
  }

  /**
   * 获取骨骼跟踪信息
   * @param boneName 骨骼名称
   * @returns 跟踪信息
   */
  getTrackingInfo(boneName: string): BoneTrackingInfo | null {
    const info = this._trackedBones.get(boneName)
    return info ? { ...info, lastTransform: this._cloneTransform(info.lastTransform) } : null
  }

  // ========================================================================
  // 配置管理
  // ========================================================================

  /**
   * 更新阈值配置
   * @param thresholds 新的阈值配置
   */
  updateThresholds(thresholds: Partial<TransformThresholds>): void {
    this._thresholds = { ...this._thresholds, ...thresholds }
  }

  /**
   * 获取当前阈值配置
   * @returns 阈值配置
   */
  getThresholds(): TransformThresholds {
    return { ...this._thresholds }
  }

  /**
   * 重置所有跟踪数据
   */
  reset(): void {
    this._trackedBones.clear()
    this._updateHistory.length = 0
    this._totalUpdates = 0
  }

  // ========================================================================
  // 统计和调试
  // ========================================================================

  /**
   * 获取跟踪统计信息
   * @returns 统计信息
   */
  getStats(): TrackingStats {
    const now = performance.now()
    const recentUpdates = this._updateHistory.filter(time => now - time < 1000).length
    const memoryUsage = this._trackedBones.size * 200 // 估算每个跟踪信息约200字节

    return {
      trackedBones: this._trackedBones.size,
      totalUpdates: this._totalUpdates,
      averageUpdateFrequency: recentUpdates, // 每秒更新次数
      memoryUsage
    }
  }

  /**
   * 获取所有被跟踪的骨骼名称
   * @returns 骨骼名称列表
   */
  getTrackedBoneNames(): string[] {
    return Array.from(this._trackedBones.keys())
  }

  /**
   * 获取最活跃的骨骼（变化最频繁）
   * @param count 返回数量
   * @returns 骨骼名称和变化次数
   */
  getMostActiveBones(count: number = 5): Array<{ boneName: string; changeCount: number }> {
    return Array.from(this._trackedBones.values())
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, count)
      .map(info => ({ boneName: info.boneName, changeCount: info.changeCount }))
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _calculateDelta(oldTransform: Transform3D, newTransform: Transform3D): TransformDelta {
    const positionDelta = Math.sqrt(
      Math.pow(oldTransform.position.x - newTransform.position.x, 2) +
      Math.pow(oldTransform.position.y - newTransform.position.y, 2) +
      Math.pow(oldTransform.position.z - newTransform.position.z, 2)
    )

    const rotationDelta = Math.sqrt(
      Math.pow(oldTransform.rotation.x - newTransform.rotation.x, 2) +
      Math.pow(oldTransform.rotation.y - newTransform.rotation.y, 2) +
      Math.pow(oldTransform.rotation.z - newTransform.rotation.z, 2)
    )

    const scaleDelta = Math.sqrt(
      Math.pow(oldTransform.scale.x - newTransform.scale.x, 2) +
      Math.pow(oldTransform.scale.y - newTransform.scale.y, 2) +
      Math.pow(oldTransform.scale.z - newTransform.scale.z, 2)
    )

    return { position: positionDelta, rotation: rotationDelta, scale: scaleDelta }
  }

  private _exceedsThreshold(delta: TransformDelta): boolean {
    return delta.position > this._thresholds.position ||
           delta.rotation > this._thresholds.rotation ||
           delta.scale > this._thresholds.scale
  }

  private _updateTrackingInfo(info: BoneTrackingInfo, newTransform: Transform3D, delta: TransformDelta): void {
    info.lastTransform = this._cloneTransform(newTransform)
    info.lastUpdateTime = performance.now()
    info.changeCount++
    info.totalDelta.position += delta.position
    info.totalDelta.rotation += delta.rotation
    info.totalDelta.scale += delta.scale

    // 更新全局统计
    this._totalUpdates++
    this._updateHistory.push(info.lastUpdateTime)
    
    // 限制历史记录大小
    if (this._updateHistory.length > this._maxHistorySize) {
      this._updateHistory.shift()
    }
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
    this.reset()
  }
}

export default BoneTransformTracker
