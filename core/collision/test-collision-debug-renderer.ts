/**
 * QAQ游戏引擎 - CollisionDebugRenderer 测试用例
 * 
 * 测试内容：
 * - 几何体创建功能
 * - 线框管理功能
 * - 材质复用机制
 * - 性能基准测试
 */

import * as THREE from 'three'
import CollisionDebugRenderer from './CollisionDebugRenderer'
import DebugMaterialManager from './DebugMaterialManager'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 测试工具函数
// ============================================================================

function createTestScene(): THREE.Scene {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  camera.position.set(0, 0, 10)
  return scene
}

function assertGeometryValid(geometry: THREE.BufferGeometry, expectedVertexCount?: number): void {
  if (!geometry.attributes.position) {
    throw new Error('Geometry missing position attribute')
  }
  
  const vertexCount = geometry.attributes.position.count
  if (vertexCount === 0) {
    throw new Error('Geometry has no vertices')
  }
  
  if (expectedVertexCount && vertexCount !== expectedVertexCount) {
    throw new Error(`Expected ${expectedVertexCount} vertices, got ${vertexCount}`)
  }
  
  console.log(`✓ Geometry valid with ${vertexCount} vertices`)
}

function assertMaterialValid(material: THREE.Material): void {
  if (!(material instanceof THREE.LineBasicMaterial) && !(material instanceof THREE.LineDashedMaterial)) {
    throw new Error('Material is not a line material')
  }
  
  console.log('✓ Material valid')
}

function measurePerformance<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
  return result
}

// ============================================================================
// CollisionDebugRenderer 测试
// ============================================================================

export function testCollisionDebugRenderer(): void {
  console.log('🧪 开始 CollisionDebugRenderer 测试')
  
  // 测试单例模式
  testSingletonPattern()
  
  // 测试几何体创建
  testGeometryCreation()
  
  // 测试线框管理
  testWireframeManagement()
  
  // 测试变换更新
  testTransformUpdates()
  
  // 测试全局控制
  testGlobalControls()
  
  // 性能基准测试
  testPerformanceBenchmark()
  
  console.log('✅ CollisionDebugRenderer 测试完成')
}

function testSingletonPattern(): void {
  console.log('📋 测试单例模式')
  
  const renderer1 = CollisionDebugRenderer.getInstance()
  const renderer2 = CollisionDebugRenderer.getInstance()
  
  if (renderer1 !== renderer2) {
    throw new Error('Singleton pattern failed')
  }
  
  console.log('✓ 单例模式正常')
}

function testGeometryCreation(): void {
  console.log('📋 测试几何体创建')
  
  const renderer = CollisionDebugRenderer.getInstance()
  
  // 测试盒子线框
  const boxWireframe = measurePerformance('Box wireframe creation', () => 
    renderer.createBoxWireframe({ x: 2, y: 2, z: 2 })
  )
  assertGeometryValid(boxWireframe.geometry, 24) // 12条边 * 2个顶点
  assertMaterialValid(boxWireframe.material as THREE.Material)
  
  // 测试球体线框
  const sphereWireframe = measurePerformance('Sphere wireframe creation', () =>
    renderer.createSphereWireframe(1, 8)
  )
  assertGeometryValid(sphereWireframe.geometry)
  assertMaterialValid(sphereWireframe.material as THREE.Material)
  
  // 测试胶囊线框
  const capsuleWireframe = measurePerformance('Capsule wireframe creation', () =>
    renderer.createCapsuleWireframe(0.5, 2)
  )
  assertGeometryValid(capsuleWireframe.geometry)
  assertMaterialValid(capsuleWireframe.material as THREE.Material)
  
  // 测试圆柱线框
  const cylinderWireframe = measurePerformance('Cylinder wireframe creation', () =>
    renderer.createCylinderWireframe(1, 1, 2, 8)
  )
  assertGeometryValid(cylinderWireframe.geometry)
  assertMaterialValid(cylinderWireframe.material as THREE.Material)
  
  // 测试网格线框
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
  const meshWireframe = measurePerformance('Mesh wireframe creation', () =>
    renderer.createMeshWireframe(boxGeometry)
  )
  assertGeometryValid(meshWireframe.geometry)
  assertMaterialValid(meshWireframe.material as THREE.Material)
  
  console.log('✓ 几何体创建测试通过')
}

function testWireframeManagement(): void {
  console.log('📋 测试线框管理')
  
  const renderer = CollisionDebugRenderer.getInstance()
  renderer.clear() // 清理之前的测试数据
  
  // 测试添加线框
  const wireframe1 = renderer.createBoxWireframe({ x: 1, y: 1, z: 1 })
  renderer.addWireframe('test1', wireframe1)
  
  if (renderer.getWireframeCount() !== 1) {
    throw new Error('Wireframe count should be 1')
  }
  
  // 测试获取线框
  const retrieved = renderer.getWireframe('test1')
  if (retrieved !== wireframe1) {
    throw new Error('Retrieved wireframe should match added wireframe')
  }
  
  // 测试添加多个线框
  const wireframe2 = renderer.createSphereWireframe(1)
  renderer.addWireframe('test2', wireframe2)
  
  if (renderer.getWireframeCount() !== 2) {
    throw new Error('Wireframe count should be 2')
  }
  
  // 测试移除线框
  renderer.removeWireframe('test1')
  
  if (renderer.getWireframeCount() !== 1) {
    throw new Error('Wireframe count should be 1 after removal')
  }
  
  if (renderer.getWireframe('test1') !== undefined) {
    throw new Error('Removed wireframe should not be retrievable')
  }
  
  // 测试清理所有线框
  renderer.clear()
  
  if (renderer.getWireframeCount() !== 0) {
    throw new Error('Wireframe count should be 0 after clear')
  }
  
  console.log('✓ 线框管理测试通过')
}

function testTransformUpdates(): void {
  console.log('📋 测试变换更新')
  
  const renderer = CollisionDebugRenderer.getInstance()
  const wireframe = renderer.createBoxWireframe({ x: 1, y: 1, z: 1 })
  renderer.addWireframe('transform_test', wireframe)
  
  // 测试位置更新
  const position: Vector3 = { x: 1, y: 2, z: 3 }
  const rotation: Vector3 = { x: 0.1, y: 0.2, z: 0.3 }
  const scale: Vector3 = { x: 2, y: 2, z: 2 }
  
  renderer.updateWireframeTransform('transform_test', position, rotation, scale)
  
  const updatedWireframe = renderer.getWireframe('transform_test')!
  
  // 验证变换是否正确应用
  const pos = updatedWireframe.position
  const rot = updatedWireframe.rotation
  const scl = updatedWireframe.scale
  
  if (Math.abs(pos.x - position.x) > 0.001 ||
      Math.abs(pos.y - position.y) > 0.001 ||
      Math.abs(pos.z - position.z) > 0.001) {
    throw new Error('Position update failed')
  }
  
  if (Math.abs(rot.x - rotation.x) > 0.001 ||
      Math.abs(rot.y - rotation.y) > 0.001 ||
      Math.abs(rot.z - rotation.z) > 0.001) {
    throw new Error('Rotation update failed')
  }
  
  if (Math.abs(scl.x - scale.x) > 0.001 ||
      Math.abs(scl.y - scale.y) > 0.001 ||
      Math.abs(scl.z - scale.z) > 0.001) {
    throw new Error('Scale update failed')
  }
  
  console.log('✓ 变换更新测试通过')
}

function testGlobalControls(): void {
  console.log('📋 测试全局控制')
  
  const renderer = CollisionDebugRenderer.getInstance()
  
  // 测试启用/禁用
  renderer.setEnabled(false)
  if (renderer.isEnabled()) {
    throw new Error('Renderer should be disabled')
  }
  
  renderer.setEnabled(true)
  if (!renderer.isEnabled()) {
    throw new Error('Renderer should be enabled')
  }
  
  // 测试调试场景获取
  const debugScene = renderer.getDebugScene()
  if (!(debugScene instanceof THREE.Scene)) {
    throw new Error('Debug scene should be a THREE.Scene')
  }
  
  console.log('✓ 全局控制测试通过')
}

function testPerformanceBenchmark(): void {
  console.log('📋 性能基准测试')
  
  const renderer = CollisionDebugRenderer.getInstance()
  renderer.clear()
  
  // 测试批量创建性能
  const wireframeCount = 100
  const wireframes: THREE.LineSegments[] = []
  
  const creationTime = measurePerformance(`Creating ${wireframeCount} wireframes`, () => {
    for (let i = 0; i < wireframeCount; i++) {
      const wireframe = renderer.createBoxWireframe({ x: 1, y: 1, z: 1 })
      wireframes.push(wireframe)
      renderer.addWireframe(`perf_test_${i}`, wireframe)
    }
  })
  
  if (renderer.getWireframeCount() !== wireframeCount) {
    throw new Error(`Expected ${wireframeCount} wireframes, got ${renderer.getWireframeCount()}`)
  }
  
  // 测试批量更新性能
  measurePerformance(`Updating ${wireframeCount} wireframes`, () => {
    for (let i = 0; i < wireframeCount; i++) {
      renderer.updateWireframeTransform(
        `perf_test_${i}`,
        { x: Math.random(), y: Math.random(), z: Math.random() },
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1 }
      )
    }
  })
  
  // 测试批量清理性能
  measurePerformance(`Clearing ${wireframeCount} wireframes`, () => {
    renderer.clear()
  })
  
  if (renderer.getWireframeCount() !== 0) {
    throw new Error('All wireframes should be cleared')
  }
  
  // 性能要求验证
  if (creationTime > 100) { // 100ms for 100 wireframes
    console.warn(`⚠️ Creation performance warning: ${creationTime.toFixed(2)}ms for ${wireframeCount} wireframes`)
  }
  
  console.log('✓ 性能基准测试通过')
}

// ============================================================================
// DebugMaterialManager 测试
// ============================================================================

export function testDebugMaterialManager(): void {
  console.log('🧪 开始 DebugMaterialManager 测试')
  
  testMaterialCaching()
  testMaterialUpdates()
  testReferencecounting()
  testBatchOperations()
  testMaterialStats()
  
  console.log('✅ DebugMaterialManager 测试完成')
}

function testMaterialCaching(): void {
  console.log('📋 测试材质缓存')
  
  const manager = DebugMaterialManager.getInstance()
  manager.clear()
  
  // 测试相同配置的材质复用
  const material1 = manager.getMaterial({ color: 0xff0000, opacity: 1.0 })
  const material2 = manager.getMaterial({ color: 0xff0000, opacity: 1.0 })
  
  if (material1 !== material2) {
    throw new Error('Same configuration should return same material')
  }
  
  // 测试不同配置的材质创建
  const material3 = manager.getMaterial({ color: 0x00ff00, opacity: 0.5 })
  
  if (material1 === material3) {
    throw new Error('Different configuration should return different material')
  }
  
  console.log('✓ 材质缓存测试通过')
}

function testMaterialUpdates(): void {
  console.log('📋 测试材质更新')
  
  const manager = DebugMaterialManager.getInstance()
  const material = manager.getMaterial({ color: 0xff0000, opacity: 1.0 })
  
  // 测试颜色更新
  manager.updateMaterialColor(material, 0x00ff00)
  if (material.color.getHex() !== 0x00ff00) {
    throw new Error('Material color update failed')
  }
  
  // 测试透明度更新
  manager.updateMaterialOpacity(material, 0.5)
  if (Math.abs(material.opacity - 0.5) > 0.001) {
    throw new Error('Material opacity update failed')
  }
  
  if (!material.transparent) {
    throw new Error('Material should be transparent when opacity < 1.0')
  }
  
  console.log('✓ 材质更新测试通过')
}

function testReferencecounting(): void {
  console.log('📋 测试引用计数')
  
  const manager = DebugMaterialManager.getInstance()
  manager.clear()
  
  const config = { color: 0xff0000, opacity: 1.0 }
  
  // 获取材质应该增加引用计数
  const material1 = manager.getMaterial(config)
  const material2 = manager.getMaterial(config)
  
  const stats = manager.getStats()
  if (stats.totalMaterials !== 1) {
    throw new Error('Should have 1 total material')
  }
  
  if (stats.activeMaterials !== 1) {
    throw new Error('Should have 1 active material')
  }
  
  console.log('✓ 引用计数测试通过')
}

function testBatchOperations(): void {
  console.log('📋 测试批量操作')
  
  const manager = DebugMaterialManager.getInstance()
  manager.clear()
  
  // 测试批量创建
  const configs = [
    { color: 0xff0000, opacity: 1.0 },
    { color: 0x00ff00, opacity: 0.8 },
    { color: 0x0000ff, opacity: 0.6 }
  ]
  
  const materials = manager.createMaterialSet(configs)
  
  if (materials.length !== configs.length) {
    throw new Error('Material set length should match config length')
  }
  
  // 测试全局透明度设置
  manager.setGlobalOpacity(0.5)
  
  materials.forEach(material => {
    if (Math.abs(material.opacity - 0.5) > 0.001) {
      throw new Error('Global opacity update failed')
    }
  })
  
  console.log('✓ 批量操作测试通过')
}

function testMaterialStats(): void {
  console.log('📋 测试材质统计')
  
  const manager = DebugMaterialManager.getInstance()
  manager.clear()
  
  // 创建一些材质
  manager.getMaterial({ color: 0xff0000, opacity: 1.0 })
  manager.getMaterial({ color: 0x00ff00, opacity: 0.8 })
  
  const stats = manager.getStats()
  
  if (stats.totalMaterials !== 2) {
    throw new Error('Should have 2 total materials')
  }
  
  if (stats.memoryUsage <= 0) {
    throw new Error('Memory usage should be positive')
  }
  
  console.log('✓ 材质统计测试通过')
}

// ============================================================================
// 运行所有测试
// ============================================================================

export function runAllCollisionDebugTests(): void {
  console.log('🚀 开始碰撞调试系统测试')
  
  testCollisionDebugRenderer()
  testDebugMaterialManager()
  
  console.log('🎉 所有碰撞调试系统测试通过！')
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  (window as any).runCollisionDebugTests = runAllCollisionDebugTests
  console.log('💡 在控制台运行 runCollisionDebugTests() 来执行测试')
}
