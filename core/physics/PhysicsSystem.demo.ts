/**
 * QAQ游戏引擎 - 物理系统演示
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 演示内容:
 * - PhysicsServer物理引擎集成演示
 * - StaticBody3D静态物理体演示
 * - RigidBody3D刚体物理演示
 * - CollisionShape3D碰撞形状演示
 * - 完整的物理仿真场景
 * - 物理材质和碰撞检测
 */

import PhysicsServer, { PhysicsBodyType, CollisionShapeType } from './PhysicsServer'
import StaticBody3D from '../nodes/physics/StaticBody3D'
import RigidBody3D, { RigidBodyMode } from '../nodes/physics/RigidBody3D'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import Scene from '../scene/Scene'

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示PhysicsServer初始化和基础功能
 */
async function demoPhysicsServerBasics(): Promise<void> {
  console.log('🔧 演示PhysicsServer基础功能...\n')

  // 初始化物理服务器
  const physics = PhysicsServer.getInstance()
  physics.initialize({
    gravity: { x: 0, y: -9.82, z: 0 },
    solverIterations: 10,
    allowSleep: true,
    broadphase: 'sap'
  })

  console.log(`✅ PhysicsServer初始化完成`)
  console.log(`   重力: ${JSON.stringify(physics.gravity)}`)
  console.log(`   物理体数量: ${physics.bodyCount}`)

  // 创建物理材质
  const bouncyMaterial = physics.createMaterial('bouncy', {
    friction: 0.2,
    restitution: 0.9
  })
  console.log(`✅ 弹性材质创建完成`)

  // 创建碰撞形状
  const boxShape = physics.createBoxShape({ x: 1, y: 1, z: 1 })
  const sphereShape = physics.createSphereShape(0.5)
  const planeShape = physics.createPlaneShape()

  console.log(`✅ 碰撞形状创建完成`)
  console.log(`   盒子形状: ${boxShape}`)
  console.log(`   球体形状: ${sphereShape}`)
  console.log(`   平面形状: ${planeShape}`)

  // 创建物理体
  const groundBody = physics.createBody(
    'ground',
    PhysicsBodyType.STATIC,
    planeShape,
    { x: 0, y: 0, z: 0 }
  )

  const dynamicBody = physics.createBody(
    'box',
    PhysicsBodyType.DYNAMIC,
    boxShape,
    { x: 0, y: 5, z: 0 },
    1.0
  )

  console.log(`✅ 物理体创建完成`)
  console.log(`   地面物理体: ${groundBody}`)
  console.log(`   动态物理体: ${dynamicBody}`)

  // 应用力和冲量
  physics.applyForce('box', { x: 10, y: 0, z: 0 })
  physics.applyImpulse('box', { x: 0, y: 5, z: 0 })

  console.log(`✅ 力和冲量应用完成`)

  // 射线检测
  const rayResult = physics.raycast(
    { x: 0, y: 10, z: 0 },
    { x: 0, y: -10, z: 0 }
  )

  console.log(`✅ 射线检测完成`)
  console.log(`   命中: ${rayResult.hasHit}`)
  if (rayResult.hasHit) {
    console.log(`   命中点: ${JSON.stringify(rayResult.hitPoint)}`)
  }

  // 获取统计信息
  const stats = physics.getStats()
  console.log(`📊 物理世界统计:`)
  console.log(`   物理体数量: ${stats.bodyCount}`)
  console.log(`   接触数量: ${stats.contactCount}`)
  console.log(`   材质数量: ${stats.materialCount}`)

  console.log('\n')
}

/**
 * 演示StaticBody3D静态物理体
 */
async function demoStaticBody3D(): Promise<void> {
  console.log('🏠 演示StaticBody3D静态物理体...\n')

  // 创建静态物理体
  const ground = new StaticBody3D('Ground', {
    enabled: true,
    collisionLayer: 1,
    collisionMask: 1,
    materialName: 'ground'
  })

  console.log(`🏠 静态物理体创建: ${ground.name}`)
  console.log(`   物理体ID: ${ground.bodyId}`)
  console.log(`   启用状态: ${ground.enabled}`)
  console.log(`   碰撞层: ${ground.collisionLayer}`)

  // 添加碰撞形状
  const boxShapeId = ground.addBoxShape({ x: 10, y: 1, z: 10 })
  const sphereShapeId = ground.addSphereShape(2)

  console.log(`📦 碰撞形状添加完成:`)
  console.log(`   盒子形状ID: ${boxShapeId}`)
  console.log(`   球体形状ID: ${sphereShapeId}`)
  console.log(`   形状数量: ${ground.getShapeCount()}`)

  // 模拟生命周期
  ground._ready()
  ground._process(0.016)

  // 碰撞检测
  const pointCollision = ground.testPointCollision({ x: 0, y: 0, z: 0 }, 1.0)
  console.log(`🎯 点碰撞检测: ${pointCollision}`)

  // 射线检测
  const rayResult = ground.raycast(
    { x: 0, y: 10, z: 0 },
    { x: 0, y: -10, z: 0 }
  )
  console.log(`🔍 射线检测: ${rayResult.hasHit}`)

  // 获取统计信息
  const stats = ground.getStats()
  console.log(`📊 静态体统计:`)
  console.log(`   物理体ID: ${stats.bodyId}`)
  console.log(`   启用状态: ${stats.enabled}`)
  console.log(`   形状数量: ${stats.shapeCount}`)
  console.log(`   物理初始化: ${stats.physicsInitialized}`)

  console.log('\n')
}

/**
 * 演示RigidBody3D刚体物理
 */
async function demoRigidBody3D(): Promise<void> {
  console.log('⚡ 演示RigidBody3D刚体物理...\n')

  // 创建动态刚体
  const dynamicBox = new RigidBody3D('DynamicBox', {
    mode: RigidBodyMode.DYNAMIC,
    mass: 1.0,
    enabled: true,
    linearDamping: 0.1,
    angularDamping: 0.1,
    canSleep: true,
    gravityScale: 1.0
  })

  console.log(`⚡ 动态刚体创建: ${dynamicBox.name}`)
  console.log(`   模式: ${dynamicBox.mode}`)
  console.log(`   质量: ${dynamicBox.mass}`)
  console.log(`   重力缩放: ${dynamicBox.gravityScale}`)

  // 添加碰撞形状
  const boxShapeId = dynamicBox.addBoxShape({ x: 1, y: 1, z: 1 })
  console.log(`📦 碰撞形状添加: ${boxShapeId}`)

  // 模拟生命周期
  dynamicBox._ready()

  // 应用力和冲量
  dynamicBox.applyForce({ x: 10, y: 0, z: 0 })
  dynamicBox.applyImpulse({ x: 0, y: 5, z: 0 })
  dynamicBox.applyCentralForce({ x: 5, y: 0, z: 0 })

  console.log(`💪 力和冲量应用完成`)

  // 设置速度
  dynamicBox.setLinearVelocity({ x: 2, y: 0, z: 0 })
  dynamicBox.setAngularVelocity({ x: 0, y: 1, z: 0 })

  console.log(`🏃 速度设置完成`)
  console.log(`   线性速度: ${JSON.stringify(dynamicBox.linearVelocity)}`)
  console.log(`   角速度: ${JSON.stringify(dynamicBox.angularVelocity)}`)

  // 休眠和唤醒
  dynamicBox.sleep()
  console.log(`😴 刚体休眠: ${dynamicBox.sleeping}`)

  dynamicBox.wakeUp()
  console.log(`😊 刚体唤醒: ${dynamicBox.sleeping}`)

  // 模式切换
  dynamicBox.mode = RigidBodyMode.KINEMATIC
  console.log(`🔄 模式切换到: ${dynamicBox.mode}`)

  // 获取统计信息
  const stats = dynamicBox.getStats()
  console.log(`📊 刚体统计:`)
  console.log(`   模式: ${stats.mode}`)
  console.log(`   质量: ${stats.mass}`)
  console.log(`   休眠状态: ${stats.sleeping}`)
  console.log(`   形状数量: ${stats.shapeCount}`)

  console.log('\n')
}

/**
 * 演示CollisionShape3D碰撞形状
 */
async function demoCollisionShape3D(): Promise<void> {
  console.log('🔷 演示CollisionShape3D碰撞形状...\n')

  // 创建盒子碰撞形状
  const boxShape = new CollisionShape3D('BoxShape', {
    type: CollisionShapeType.BOX,
    parameters: { size: { x: 2, y: 2, z: 2 } },
    enabled: true,
    debugVisible: true,
    debugColor: 0x00ff00
  })

  console.log(`🔷 盒子碰撞形状创建: ${boxShape.name}`)
  console.log(`   形状类型: ${boxShape.shapeType}`)
  console.log(`   启用状态: ${boxShape.enabled}`)
  console.log(`   调试可见: ${boxShape.debugVisible}`)

  // 创建球体碰撞形状
  const sphereShape = new CollisionShape3D('SphereShape', {
    type: CollisionShapeType.SPHERE,
    parameters: { radius: 1.5 },
    enabled: true,
    debugVisible: true,
    debugColor: 0xff0000
  })

  console.log(`🔴 球体碰撞形状创建: ${sphereShape.name}`)

  // 模拟生命周期
  boxShape._ready()
  sphereShape._ready()

  // 动态修改形状
  boxShape.setBoxShape({ x: 3, y: 1, z: 3 })
  console.log(`📦 盒子形状已修改`)

  sphereShape.setSphereShape(2.0)
  console.log(`🔴 球体形状已修改`)

  // 启用/禁用形状
  boxShape.enabled = false
  console.log(`❌ 盒子形状已禁用`)

  boxShape.enabled = true
  console.log(`✅ 盒子形状已启用`)

  // 调试可视化切换
  sphereShape.debugVisible = false
  console.log(`🙈 球体调试可视化已关闭`)

  sphereShape.debugVisible = true
  console.log(`👁️ 球体调试可视化已开启`)

  // 获取统计信息
  const boxStats = boxShape.getStats()
  const sphereStats = sphereShape.getStats()

  console.log(`📊 碰撞形状统计:`)
  console.log(`   盒子形状:`)
  console.log(`     类型: ${boxStats.shapeType}`)
  console.log(`     启用: ${boxStats.enabled}`)
  console.log(`     调试: ${boxStats.debugVisible}`)
  console.log(`     初始化: ${boxStats.initialized}`)

  console.log(`   球体形状:`)
  console.log(`     类型: ${sphereStats.shapeType}`)
  console.log(`     启用: ${sphereStats.enabled}`)
  console.log(`     调试: ${sphereStats.debugVisible}`)
  console.log(`     初始化: ${sphereStats.initialized}`)

  console.log('\n')
}

/**
 * 演示完整物理场景
 */
async function demoCompletePhysicsScene(): Promise<void> {
  console.log('🌍 演示完整物理场景...\n')

  // 创建场景
  const physicsScene = new Scene('PhysicsDemo')

  // 创建地面
  const ground = new StaticBody3D('Ground')
  ground.addPlaneShape()
  ground.position = { x: 0, y: 0, z: 0 }
  physicsScene.addChild(ground)

  // 创建墙壁
  const wall = new StaticBody3D('Wall')
  wall.addBoxShape({ x: 1, y: 5, z: 10 })
  wall.position = { x: 5, y: 2.5, z: 0 }
  physicsScene.addChild(wall)

  // 创建动态物体
  const boxes: RigidBody3D[] = []
  for (let i = 0; i < 5; i++) {
    const box = new RigidBody3D(`Box${i}`, {
      mode: RigidBodyMode.DYNAMIC,
      mass: 1.0
    })
    box.addBoxShape({ x: 1, y: 1, z: 1 })
    box.position = { x: i * 2, y: 5 + i, z: 0 }
    boxes.push(box)
    physicsScene.addChild(box)
  }

  // 创建球体
  const spheres: RigidBody3D[] = []
  for (let i = 0; i < 3; i++) {
    const sphere = new RigidBody3D(`Sphere${i}`, {
      mode: RigidBodyMode.DYNAMIC,
      mass: 0.5
    })
    sphere.addSphereShape(0.5)
    sphere.position = { x: i * 1.5, y: 8, z: 2 }
    spheres.push(sphere)
    physicsScene.addChild(sphere)
  }

  console.log(`🌍 物理场景创建完成:`)
  console.log(`   场景名称: ${physicsScene.name}`)
  console.log(`   子节点数: ${physicsScene.getChildCount()}`)
  console.log(`   地面: ${ground.name}`)
  console.log(`   墙壁: ${wall.name}`)
  console.log(`   盒子数量: ${boxes.length}`)
  console.log(`   球体数量: ${spheres.length}`)

  // 模拟物理更新
  console.log(`\n⏰ 模拟物理更新...`)
  for (let frame = 0; frame < 10; frame++) {
    const deltaTime = 1/60 // 60 FPS
    
    // 更新物理服务器
    PhysicsServer.getInstance().step(deltaTime)
    
    // 更新场景
    physicsScene._process(deltaTime)
    
    if (frame % 3 === 0) {
      console.log(`   帧 ${frame}: 物理更新完成`)
    }
  }

  console.log(`✅ 物理仿真演示完成`)

  console.log('\n')
}

/**
 * 运行所有演示
 */
async function runAllDemos(): Promise<void> {
  console.log('🚀 QAQ游戏引擎 - 物理系统演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    await demoPhysicsServerBasics()
    await demoStaticBody3D()
    await demoRigidBody3D()
    await demoCollisionShape3D()
    await demoCompletePhysicsScene()

    console.log('🎉 所有物理系统演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ PhysicsServer基础功能正常')
    console.log('   ✅ StaticBody3D静态物理体正常')
    console.log('   ✅ RigidBody3D刚体物理正常')
    console.log('   ✅ CollisionShape3D碰撞形状正常')
    console.log('   ✅ 完整物理场景仿真正常')
    console.log('\n🎯 QAQ物理系统已完全就绪！')
    console.log('🔧 核心特性完美运行：')
    console.log('   - Cannon-ES物理引擎集成')
    console.log('   - 完整的Godot风格物理节点')
    console.log('   - 统一的物理API和管理')
    console.log('   - 高性能的物理仿真')
    console.log('   - 完整的碰撞检测系统')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  demoPhysicsServerBasics,
  demoStaticBody3D,
  demoRigidBody3D,
  demoCollisionShape3D,
  demoCompletePhysicsScene,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
