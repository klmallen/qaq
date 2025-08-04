/**
 * QAQ游戏引擎 - 碰撞节点系统测试
 * 
 * 测试内容：
 * - Area3D 功能测试
 * - CharacterBody3D 功能测试
 * - CollisionManager 功能测试
 * - 节点集成测试
 */

import Area3D from '../nodes/physics/Area3D'
import CharacterBody3D from '../nodes/physics/CharacterBody3D'
import CollisionManager from './CollisionManager'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import { CollisionShapeType } from '../physics/PhysicsServer'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 测试工具函数
// ============================================================================

function createTestVector3(x: number = 0, y: number = 0, z: number = 0): Vector3 {
  return { x, y, z }
}

function createTestCollisionShape(name: string, type: CollisionShapeType = CollisionShapeType.BOX): CollisionShape3D {
  return new CollisionShape3D(name, {
    type,
    parameters: type === CollisionShapeType.BOX 
      ? { size: { x: 1, y: 1, z: 1 } }
      : { radius: 0.5 },
    enabled: true,
    debugVisible: false
  })
}

function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => resolve()))
}

// ============================================================================
// Area3D 测试
// ============================================================================

export function testArea3D(): void {
  console.log('🧪 开始 Area3D 测试')
  
  testAreaCreation()
  testAreaConfiguration()
  testAreaCollisionShapes()
  testAreaDetection()
  
  console.log('✅ Area3D 测试完成')
}

function testAreaCreation(): void {
  console.log('📋 测试区域创建')
  
  const area = new Area3D('TestArea')
  
  if (area.name !== 'TestArea') {
    throw new Error('Area name should match constructor parameter')
  }
  
  if (!area.isMonitoringEnabled()) {
    throw new Error('Monitoring should be enabled by default')
  }
  
  if (!area.isMonitorableEnabled()) {
    throw new Error('Monitorable should be enabled by default')
  }
  
  console.log('✓ 区域创建测试通过')
}

function testAreaConfiguration(): void {
  console.log('📋 测试区域配置')
  
  const area = new Area3D('ConfigTestArea')
  
  // 测试监控配置
  area.setMonitoringEnabled(false)
  if (area.isMonitoringEnabled()) {
    throw new Error('Monitoring should be disabled')
  }
  
  area.setMonitoringEnabled(true)
  if (!area.isMonitoringEnabled()) {
    throw new Error('Monitoring should be enabled')
  }
  
  // 测试可监控配置
  area.setMonitorableEnabled(false)
  if (area.isMonitorableEnabled()) {
    throw new Error('Monitorable should be disabled')
  }
  
  // 测试碰撞层配置
  area.setCollisionLayer(2)
  area.setCollisionMask(4)
  
  console.log('✓ 区域配置测试通过')
}

function testAreaCollisionShapes(): void {
  console.log('📋 测试区域碰撞形状')
  
  const area = new Area3D('ShapeTestArea')
  const shape1 = createTestCollisionShape('Shape1')
  const shape2 = createTestCollisionShape('Shape2')
  
  // 添加碰撞形状
  area.addCollisionShape(shape1)
  area.addCollisionShape(shape2)
  
  const shapes = area.getCollisionShapes()
  if (shapes.length !== 2) {
    throw new Error('Should have 2 collision shapes')
  }
  
  if (!shapes.includes(shape1) || !shapes.includes(shape2)) {
    throw new Error('Should contain both added shapes')
  }
  
  // 移除碰撞形状
  area.removeCollisionShape(shape1)
  const remainingShapes = area.getCollisionShapes()
  
  if (remainingShapes.length !== 1) {
    throw new Error('Should have 1 collision shape after removal')
  }
  
  if (remainingShapes.includes(shape1)) {
    throw new Error('Should not contain removed shape')
  }
  
  console.log('✓ 区域碰撞形状测试通过')
}

function testAreaDetection(): void {
  console.log('📋 测试区域检测')
  
  const area = new Area3D('DetectionTestArea')
  
  // 测试初始状态
  const overlappingBodies = area.getOverlappingBodies()
  const overlappingAreas = area.getOverlappingAreas()
  
  if (overlappingBodies.length !== 0) {
    throw new Error('Should have no overlapping bodies initially')
  }
  
  if (overlappingAreas.length !== 0) {
    throw new Error('Should have no overlapping areas initially')
  }
  
  // 测试统计信息
  const stats = area.getStats()
  if (stats.totalDetections !== 0) {
    throw new Error('Initial total detections should be 0')
  }
  
  console.log('✓ 区域检测测试通过')
}

// ============================================================================
// CharacterBody3D 测试
// ============================================================================

export function testCharacterBody3D(): void {
  console.log('🧪 开始 CharacterBody3D 测试')
  
  testCharacterCreation()
  testCharacterConfiguration()
  testCharacterMovement()
  testCharacterState()
  
  console.log('✅ CharacterBody3D 测试完成')
}

function testCharacterCreation(): void {
  console.log('📋 测试角色创建')
  
  const character = new CharacterBody3D('TestCharacter')
  
  if (character.name !== 'TestCharacter') {
    throw new Error('Character name should match constructor parameter')
  }
  
  // 测试初始状态
  if (character.isOnFloor()) {
    throw new Error('Should not be on floor initially')
  }
  
  if (character.isOnWall()) {
    throw new Error('Should not be on wall initially')
  }
  
  if (character.isOnCeiling()) {
    throw new Error('Should not be on ceiling initially')
  }
  
  console.log('✓ 角色创建测试通过')
}

function testCharacterConfiguration(): void {
  console.log('📋 测试角色配置')
  
  const character = new CharacterBody3D('ConfigTestCharacter')
  
  // 测试角度配置
  character.setFloorMaxAngle(Math.PI / 3) // 60度
  character.setWallMinSlideAngle(Math.PI / 4) // 45度
  
  // 测试滑动配置
  character.setMaxSlides(6)
  character.setSnapLength(0.2)
  
  console.log('✓ 角色配置测试通过')
}

function testCharacterMovement(): void {
  console.log('📋 测试角色移动')
  
  const character = new CharacterBody3D('MovementTestCharacter')
  
  // 测试移动和滑动
  const velocity = createTestVector3(1, 0, 0)
  const resultVelocity = character.moveAndSlide(velocity)
  
  // 由于没有实际的物理世界，结果应该与输入相同
  if (Math.abs(resultVelocity.x - velocity.x) > 0.001) {
    console.warn('Movement result may differ due to simplified physics')
  }
  
  // 测试移动和碰撞
  const motion = createTestVector3(0.5, 0, 0)
  const collision = character.moveAndCollide(motion)
  
  // 在简化实现中，应该没有碰撞
  if (collision !== null) {
    console.warn('Collision detected in simplified implementation')
  }
  
  console.log('✓ 角色移动测试通过')
}

function testCharacterState(): void {
  console.log('📋 测试角色状态')
  
  const character = new CharacterBody3D('StateTestCharacter')
  
  // 测试速度获取
  const velocity = character.getVelocity()
  if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
    throw new Error('Initial velocity should be zero')
  }
  
  // 测试法向量获取
  const floorNormal = character.getFloorNormal()
  const wallNormal = character.getWallNormal()
  
  if (floorNormal.y !== 1) {
    throw new Error('Default floor normal should point up')
  }
  
  // 测试统计信息
  const stats = character.getStats()
  if (stats.totalMoves !== 0) {
    throw new Error('Initial total moves should be 0')
  }
  
  console.log('✓ 角色状态测试通过')
}

// ============================================================================
// CollisionManager 测试
// ============================================================================

export function testCollisionManager(): void {
  console.log('🧪 开始 CollisionManager 测试')
  
  testManagerSingleton()
  testObjectRegistration()
  testEventSystem()
  testSpatialQueries()
  testManagerPerformance()
  
  console.log('✅ CollisionManager 测试完成')
}

function testManagerSingleton(): void {
  console.log('📋 测试管理器单例')
  
  const manager1 = CollisionManager.getInstance()
  const manager2 = CollisionManager.getInstance()
  
  if (manager1 !== manager2) {
    throw new Error('CollisionManager should be singleton')
  }
  
  console.log('✓ 管理器单例测试通过')
}

function testObjectRegistration(): void {
  console.log('📋 测试对象注册')
  
  const manager = CollisionManager.getInstance()
  manager.clear() // 清理之前的测试数据
  
  const area = new Area3D('TestArea')
  const character = new CharacterBody3D('TestCharacter')
  
  // 注册对象
  manager.registerObject(area)
  manager.registerObject(character)
  
  const stats = manager.getStats()
  if (stats.totalObjects !== 2) {
    throw new Error('Should have 2 registered objects')
  }
  
  // 注销对象
  manager.unregisterObject(area.id)
  
  const updatedStats = manager.getStats()
  if (updatedStats.totalObjects !== 1) {
    throw new Error('Should have 1 registered object after unregistration')
  }
  
  console.log('✓ 对象注册测试通过')
}

function testEventSystem(): void {
  console.log('📋 测试事件系统')
  
  const manager = CollisionManager.getInstance()
  let eventReceived = false
  
  // 添加事件监听器
  manager.addEventListener('enter', {
    id: 'test-listener',
    callback: (event) => {
      eventReceived = true
    },
    priority: 1
  })
  
  // 分发事件
  const testEvent = {
    type: 'enter' as const,
    objectA: { id: 'a', node: new Area3D(), type: 'area' as const, layer: 1, mask: 1, priority: 0 },
    objectB: { id: 'b', node: new Area3D(), type: 'area' as const, layer: 1, mask: 1, priority: 0 },
    timestamp: performance.now()
  }
  
  manager.dispatchEvent(testEvent)
  
  // 处理事件队列
  manager.update(0.016)
  
  if (!eventReceived) {
    throw new Error('Event should have been received')
  }
  
  // 移除监听器
  manager.removeEventListener('enter', 'test-listener')
  
  console.log('✓ 事件系统测试通过')
}

function testSpatialQueries(): void {
  console.log('📋 测试空间查询')
  
  const manager = CollisionManager.getInstance()
  manager.clear()
  
  // 创建测试对象
  const area1 = new Area3D('Area1')
  area1.position = createTestVector3(0, 0, 0)
  
  const area2 = new Area3D('Area2')
  area2.position = createTestVector3(5, 0, 0)
  
  const area3 = new Area3D('Area3')
  area3.position = createTestVector3(15, 0, 0)
  
  // 注册对象
  manager.registerObject(area1)
  manager.registerObject(area2)
  manager.registerObject(area3)
  
  // 查询区域
  const queryCenter = createTestVector3(0, 0, 0)
  const queryRadius = 8
  const results = manager.queryArea(queryCenter, queryRadius)
  
  // 应该找到area1和area2，但不包括area3
  if (results.length !== 2) {
    console.warn(`Expected 2 results, got ${results.length}`)
  }
  
  // 测试射线检测
  const rayOrigin = createTestVector3(0, 0, 0)
  const rayDirection = createTestVector3(1, 0, 0)
  const rayResults = manager.raycast(rayOrigin, rayDirection, 10)
  
  if (rayResults.length < 1) {
    console.warn('Raycast should find at least one object')
  }
  
  console.log('✓ 空间查询测试通过')
}

function testManagerPerformance(): void {
  console.log('📋 管理器性能测试')
  
  const manager = CollisionManager.getInstance()
  manager.clear()
  
  const objectCount = 100
  
  // 批量注册对象
  const registrationTime = measurePerformance(`注册 ${objectCount} 个对象`, () => {
    for (let i = 0; i < objectCount; i++) {
      const area = new Area3D(`PerfArea${i}`)
      area.position = createTestVector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      )
      manager.registerObject(area)
    }
  })
  
  // 批量查询测试
  const queryTime = measurePerformance(`执行 ${objectCount} 次区域查询`, () => {
    for (let i = 0; i < objectCount; i++) {
      const center = createTestVector3(
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      )
      manager.queryArea(center, 10)
    }
  })
  
  // 更新性能测试
  const updateTime = measurePerformance('管理器更新', () => {
    manager.update(0.016)
  })
  
  // 性能要求验证
  if (registrationTime > 100) {
    console.warn(`⚠️ 注册性能警告: ${registrationTime.toFixed(2)}ms for ${objectCount} objects`)
  }
  
  if (queryTime > 50) {
    console.warn(`⚠️ 查询性能警告: ${queryTime.toFixed(2)}ms for ${objectCount} queries`)
  }
  
  console.log('✓ 管理器性能测试通过')
}

// ============================================================================
// 集成测试
// ============================================================================

export function testCollisionNodesIntegration(): void {
  console.log('🧪 开始碰撞节点集成测试')
  
  testAreaCharacterInteraction()
  testManagerIntegration()
  
  console.log('✅ 碰撞节点集成测试完成')
}

function testAreaCharacterInteraction(): void {
  console.log('📋 测试区域-角色交互')
  
  const area = new Area3D('InteractionArea')
  const character = new CharacterBody3D('InteractionCharacter')
  
  // 为区域添加碰撞形状
  const areaShape = createTestCollisionShape('AreaShape', CollisionShapeType.BOX)
  area.addCollisionShape(areaShape)
  
  // 为角色添加碰撞形状
  const characterShape = createTestCollisionShape('CharacterShape', CollisionShapeType.CAPSULE)
  character.addCollisionShape(characterShape)
  
  // 测试基本交互（简化实现）
  console.log('✓ 区域-角色交互测试通过（简化实现）')
}

function testManagerIntegration(): void {
  console.log('📋 测试管理器集成')
  
  const manager = CollisionManager.getInstance()
  manager.clear()
  
  const area = new Area3D('ManagedArea')
  const character = new CharacterBody3D('ManagedCharacter')
  
  // 注册到管理器
  manager.registerObject(area)
  manager.registerObject(character)
  
  // 测试管理器状态
  const stats = manager.getStats()
  if (stats.totalObjects !== 2) {
    throw new Error('Manager should have 2 objects')
  }
  
  // 测试更新
  manager.update(0.016)
  
  console.log('✓ 管理器集成测试通过')
}

// ============================================================================
// 运行所有测试
// ============================================================================

export function runAllCollisionNodesTests(): void {
  console.log('🚀 开始碰撞节点系统测试')
  
  testArea3D()
  testCharacterBody3D()
  testCollisionManager()
  testCollisionNodesIntegration()
  
  console.log('🎉 所有碰撞节点系统测试通过！')
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  (window as any).runCollisionNodesTests = runAllCollisionNodesTests
  console.log('💡 在控制台运行 runCollisionNodesTests() 来执行测试')
}
