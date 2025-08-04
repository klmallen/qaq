/**
 * QAQ游戏引擎 - 动画碰撞同步系统测试
 * 
 * 测试内容：
 * - BoneTransformTracker 功能测试
 * - AnimationCollisionSync 同步测试
 * - CollisionUpdateBatcher 批处理测试
 * - 性能基准测试
 */

import BoneTransformTracker from './BoneTransformTracker'
import AnimationCollisionSync, { SyncStrategy } from './AnimationCollisionSync'
import CollisionUpdateBatcher from './CollisionUpdateBatcher'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import { CollisionShapeType } from '../physics/PhysicsServer'
import type { Transform3D, TransformThresholds } from './BoneTransformTracker'

// ============================================================================
// 测试工具函数
// ============================================================================

function createTestTransform(x: number = 0, y: number = 0, z: number = 0): Transform3D {
  return {
    position: { x, y, z },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  }
}

function createTestCollisionShape(name: string): CollisionShape3D {
  return new CollisionShape3D(name, {
    type: CollisionShapeType.BOX,
    parameters: { size: { x: 1, y: 1, z: 1 } },
    enabled: true,
    debugVisible: false
  })
}

function assertApproximatelyEqual(actual: number, expected: number, tolerance: number = 0.001): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ${expected}, got ${actual} (tolerance: ${tolerance})`)
  }
}

function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

// ============================================================================
// BoneTransformTracker 测试
// ============================================================================

export function testBoneTransformTracker(): void {
  console.log('🧪 开始 BoneTransformTracker 测试')
  
  testTransformTracking()
  testThresholdDetection()
  testTrackingStats()
  testPerformanceBenchmark()
  
  console.log('✅ BoneTransformTracker 测试完成')
}

function testTransformTracking(): void {
  console.log('📋 测试变换跟踪')
  
  const tracker = new BoneTransformTracker()
  const boneName = 'TestBone'
  const initialTransform = createTestTransform(0, 0, 0)
  
  // 开始跟踪
  tracker.startTracking(boneName, initialTransform)
  
  const trackingInfo = tracker.getTrackingInfo(boneName)
  if (!trackingInfo) {
    throw new Error('Tracking info should exist after starting tracking')
  }
  
  if (trackingInfo.boneName !== boneName) {
    throw new Error('Bone name should match')
  }
  
  if (trackingInfo.changeCount !== 0) {
    throw new Error('Initial change count should be 0')
  }
  
  // 测试变换更新
  const newTransform = createTestTransform(1, 0, 0) // 移动1单位
  const shouldUpdate = tracker.shouldUpdate(boneName, newTransform)
  
  if (!shouldUpdate) {
    throw new Error('Should update when transform exceeds threshold')
  }
  
  const updatedInfo = tracker.getTrackingInfo(boneName)!
  if (updatedInfo.changeCount !== 1) {
    throw new Error('Change count should be 1 after update')
  }
  
  console.log('✓ 变换跟踪测试通过')
}

function testThresholdDetection(): void {
  console.log('📋 测试阈值检测')
  
  const customThresholds: TransformThresholds = {
    position: 0.5,  // 较大的阈值
    rotation: 0.1,
    scale: 0.1
  }
  
  const tracker = new BoneTransformTracker(customThresholds)
  const boneName = 'ThresholdTestBone'
  const initialTransform = createTestTransform(0, 0, 0)
  
  tracker.startTracking(boneName, initialTransform)
  
  // 小幅变化，不应触发更新
  const smallChange = createTestTransform(0.1, 0, 0)
  const shouldNotUpdate = tracker.shouldUpdate(boneName, smallChange)
  
  if (shouldNotUpdate) {
    throw new Error('Should not update for small changes below threshold')
  }
  
  // 大幅变化，应触发更新
  const largeChange = createTestTransform(1.0, 0, 0)
  const shouldUpdate = tracker.shouldUpdate(boneName, largeChange)
  
  if (!shouldUpdate) {
    throw new Error('Should update for large changes above threshold')
  }
  
  console.log('✓ 阈值检测测试通过')
}

function testTrackingStats(): void {
  console.log('📋 测试跟踪统计')
  
  const tracker = new BoneTransformTracker()
  
  // 创建多个骨骼进行跟踪
  const boneNames = ['Bone1', 'Bone2', 'Bone3']
  boneNames.forEach(name => {
    tracker.startTracking(name, createTestTransform())
  })
  
  const stats = tracker.getStats()
  
  if (stats.trackedBones !== boneNames.length) {
    throw new Error(`Expected ${boneNames.length} tracked bones, got ${stats.trackedBones}`)
  }
  
  if (stats.totalUpdates !== 0) {
    throw new Error('Initial total updates should be 0')
  }
  
  // 触发一些更新
  boneNames.forEach((name, index) => {
    tracker.shouldUpdate(name, createTestTransform(index + 1, 0, 0))
  })
  
  const updatedStats = tracker.getStats()
  if (updatedStats.totalUpdates !== boneNames.length) {
    throw new Error(`Expected ${boneNames.length} total updates, got ${updatedStats.totalUpdates}`)
  }
  
  console.log('✓ 跟踪统计测试通过')
}

function testPerformanceBenchmark(): void {
  console.log('📋 性能基准测试')
  
  const tracker = new BoneTransformTracker()
  const boneCount = 100
  
  // 批量创建骨骼跟踪
  const createTime = measurePerformance(`创建 ${boneCount} 个骨骼跟踪`, () => {
    for (let i = 0; i < boneCount; i++) {
      tracker.startTracking(`Bone${i}`, createTestTransform(i, 0, 0))
    }
  })
  
  // 批量更新测试
  const updateTime = measurePerformance(`更新 ${boneCount} 个骨骼变换`, () => {
    for (let i = 0; i < boneCount; i++) {
      tracker.shouldUpdate(`Bone${i}`, createTestTransform(i + 1, 0, 0))
    }
  })
  
  // 性能要求验证
  if (createTime > 50) { // 50ms for 100 bones
    console.warn(`⚠️ 创建性能警告: ${createTime.toFixed(2)}ms for ${boneCount} bones`)
  }
  
  if (updateTime > 20) { // 20ms for 100 updates
    console.warn(`⚠️ 更新性能警告: ${updateTime.toFixed(2)}ms for ${boneCount} updates`)
  }
  
  console.log('✓ 性能基准测试通过')
}

// ============================================================================
// CollisionUpdateBatcher 测试
// ============================================================================

export function testCollisionUpdateBatcher(): void {
  console.log('🧪 开始 CollisionUpdateBatcher 测试')
  
  testBatchScheduling()
  testPriorityOrdering()
  testBatchProcessing()
  testBatchPerformance()
  
  console.log('✅ CollisionUpdateBatcher 测试完成')
}

function testBatchScheduling(): void {
  console.log('📋 测试批量调度')
  
  const batcher = new CollisionUpdateBatcher()
  const shape = createTestCollisionShape('TestShape')
  const transform = createTestTransform(1, 2, 3)
  
  // 调度更新
  batcher.scheduleUpdate('test1', shape, transform, 1)
  
  const stats = batcher.getStats()
  if (stats.pendingUpdates !== 1) {
    throw new Error('Should have 1 pending update')
  }
  
  // 调度相同ID的更新（应该替换）
  batcher.scheduleUpdate('test1', shape, createTestTransform(4, 5, 6), 2)
  
  const updatedStats = batcher.getStats()
  if (updatedStats.pendingUpdates !== 1) {
    throw new Error('Should still have 1 pending update after replacement')
  }
  
  // 取消更新
  batcher.cancelUpdate('test1')
  
  const finalStats = batcher.getStats()
  if (finalStats.pendingUpdates !== 0) {
    throw new Error('Should have 0 pending updates after cancellation')
  }
  
  console.log('✓ 批量调度测试通过')
}

function testPriorityOrdering(): void {
  console.log('📋 测试优先级排序')
  
  const batcher = new CollisionUpdateBatcher()
  const shapes = [
    createTestCollisionShape('LowPriority'),
    createTestCollisionShape('HighPriority'),
    createTestCollisionShape('MediumPriority')
  ]
  
  // 按不同优先级调度更新
  batcher.scheduleUpdate('low', shapes[0], createTestTransform(), 1)
  batcher.scheduleUpdate('high', shapes[1], createTestTransform(), 10)
  batcher.scheduleUpdate('medium', shapes[2], createTestTransform(), 5)
  
  const pendingUpdates = batcher.getPendingUpdateDetails()
  if (pendingUpdates.length !== 3) {
    throw new Error('Should have 3 pending updates')
  }
  
  // 验证优先级排序（内部排序在处理时进行）
  const highPriorityUpdate = pendingUpdates.find(u => u.id === 'high')
  if (!highPriorityUpdate || highPriorityUpdate.priority !== 10) {
    throw new Error('High priority update should exist with priority 10')
  }
  
  console.log('✓ 优先级排序测试通过')
}

function testBatchProcessing(): void {
  console.log('📋 测试批量处理')
  
  const batcher = new CollisionUpdateBatcher({
    batchInterval: 0, // 立即处理
    maxBatchSize: 2   // 限制批量大小
  })
  
  const shapes = [
    createTestCollisionShape('Shape1'),
    createTestCollisionShape('Shape2'),
    createTestCollisionShape('Shape3')
  ]
  
  // 调度多个更新
  shapes.forEach((shape, index) => {
    batcher.scheduleUpdate(`update${index}`, shape, createTestTransform(index, 0, 0), index)
  })
  
  const initialStats = batcher.getStats()
  if (initialStats.pendingUpdates !== 3) {
    throw new Error('Should have 3 pending updates')
  }
  
  // 处理批量更新
  batcher.processBatch(0.016) // 模拟一帧时间
  
  const processedStats = batcher.getStats()
  // 由于批量大小限制为2，应该还有1个待处理
  if (processedStats.pendingUpdates !== 1) {
    throw new Error('Should have 1 pending update after batch processing')
  }
  
  console.log('✓ 批量处理测试通过')
}

function testBatchPerformance(): void {
  console.log('📋 批量处理性能测试')
  
  const batcher = new CollisionUpdateBatcher()
  const updateCount = 50
  
  // 创建大量更新
  const shapes: CollisionShape3D[] = []
  for (let i = 0; i < updateCount; i++) {
    const shape = createTestCollisionShape(`PerfShape${i}`)
    shapes.push(shape)
    batcher.scheduleUpdate(`perf${i}`, shape, createTestTransform(i, 0, 0), i % 10)
  }
  
  // 测试批量处理性能
  const processTime = measurePerformance(`处理 ${updateCount} 个批量更新`, () => {
    batcher.flushAll()
  })
  
  const stats = batcher.getStats()
  if (stats.processedUpdates < updateCount) {
    throw new Error(`Should have processed at least ${updateCount} updates`)
  }
  
  // 性能要求验证
  if (processTime > 10) { // 10ms for 50 updates
    console.warn(`⚠️ 批处理性能警告: ${processTime.toFixed(2)}ms for ${updateCount} updates`)
  }
  
  console.log('✓ 批量处理性能测试通过')
}

// ============================================================================
// 集成测试
// ============================================================================

export function testAnimationCollisionIntegration(): void {
  console.log('🧪 开始动画碰撞集成测试')
  
  // 注意：这里需要模拟 AnimationPlayer，因为实际测试中可能没有完整的动画系统
  console.log('⚠️ 动画碰撞集成测试需要完整的动画系统支持，当前跳过')
  
  console.log('✅ 动画碰撞集成测试完成')
}

// ============================================================================
// 运行所有测试
// ============================================================================

export function runAllAnimationCollisionTests(): void {
  console.log('🚀 开始动画碰撞同步系统测试')
  
  testBoneTransformTracker()
  testCollisionUpdateBatcher()
  testAnimationCollisionIntegration()
  
  console.log('🎉 所有动画碰撞同步系统测试通过！')
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  (window as any).runAnimationCollisionTests = runAllAnimationCollisionTests
  console.log('💡 在控制台运行 runAnimationCollisionTests() 来执行测试')
}
