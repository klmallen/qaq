/**
 * QAQ引擎 - 序列化修复验证测试
 * 
 * 验证setInstanceId方法和反序列化修复是否有效
 */

import { Node, Scene, Node3D } from '../index'

/**
 * 测试setInstanceId方法
 */
export function testSetInstanceId(): void {
  console.log('🧪 测试setInstanceId方法...')

  try {
    // 创建节点
    const node = new Node3D('TestNode')
    const originalId = node.getInstanceId()
    console.log(`原始ID: ${originalId}`)

    // 测试setInstanceId方法
    const newId = 'custom_test_id_123'
    node.setInstanceId(newId)
    const updatedId = node.getInstanceId()
    
    console.log(`新ID: ${updatedId}`)

    if (updatedId === newId) {
      console.log('✅ setInstanceId方法工作正常')
    } else {
      console.error('❌ setInstanceId方法失败')
    }

  } catch (error) {
    console.error('❌ setInstanceId测试失败:', error)
  }
}

/**
 * 测试基础序列化和反序列化
 */
export function testBasicSerialization(): void {
  console.log('🧪 测试基础序列化和反序列化...')

  try {
    // 创建简单节点
    const node = new Node3D('BasicTestNode')
    node.position = { x: 1, y: 2, z: 3 }
    node.visible = true

    console.log('📦 序列化节点...')
    const serialized = node.serialize()
    console.log('✅ 序列化成功')
    console.log('序列化数据:', JSON.stringify(serialized, null, 2))

    console.log('🔄 反序列化节点...')
    const restored = Node.deserialize(serialized, Node3D) as Node3D
    console.log('✅ 反序列化成功')

    // 验证数据
    console.log('🔍 验证数据完整性...')
    const issues: string[] = []

    if (restored.name !== node.name) {
      issues.push(`名称不匹配: ${node.name} vs ${restored.name}`)
    }

    if (restored.getInstanceId() !== node.getInstanceId()) {
      issues.push(`ID不匹配: ${node.getInstanceId()} vs ${restored.getInstanceId()}`)
    }

    const restoredPos = (restored as any).position
    const originalPos = (node as any).position
    if (!restoredPos || 
        Math.abs(restoredPos.x - originalPos.x) > 0.001 ||
        Math.abs(restoredPos.y - originalPos.y) > 0.001 ||
        Math.abs(restoredPos.z - originalPos.z) > 0.001) {
      issues.push(`位置不匹配: ${JSON.stringify(originalPos)} vs ${JSON.stringify(restoredPos)}`)
    }

    if (issues.length === 0) {
      console.log('✅ 基础序列化测试通过')
    } else {
      console.warn('⚠️ 发现问题:', issues)
    }

  } catch (error) {
    console.error('❌ 基础序列化测试失败:', error)
  }
}

/**
 * 测试场景序列化
 */
export function testSceneSerialization(): void {
  console.log('🧪 测试场景序列化...')

  try {
    // 创建场景
    const scene = new Scene('TestScene')
    
    // 添加子节点
    const child1 = new Node3D('Child1')
    child1.position = { x: 1, y: 0, z: 0 }
    scene.addChild(child1)

    const child2 = new Node3D('Child2')
    child2.position = { x: 0, y: 1, z: 0 }
    scene.addChild(child2)

    console.log('📦 序列化场景...')
    const serialized = scene.serialize()
    console.log('✅ 场景序列化成功')
    console.log(`数据大小: ${JSON.stringify(serialized).length} 字节`)

    console.log('🔄 反序列化场景...')
    const restored = Node.deserialize(serialized, Scene) as Scene
    console.log('✅ 场景反序列化成功')

    // 验证场景结构
    console.log('🔍 验证场景结构...')
    const issues: string[] = []

    if (restored.name !== scene.name) {
      issues.push(`场景名称不匹配: ${scene.name} vs ${restored.name}`)
    }

    if (restored.children.length !== scene.children.length) {
      issues.push(`子节点数量不匹配: ${scene.children.length} vs ${restored.children.length}`)
    }

    // 检查子节点
    for (let i = 0; i < Math.min(scene.children.length, restored.children.length); i++) {
      const originalChild = scene.children[i]
      const restoredChild = restored.children[i]

      if (originalChild.name !== restoredChild.name) {
        issues.push(`子节点${i}名称不匹配: ${originalChild.name} vs ${restoredChild.name}`)
      }
    }

    if (issues.length === 0) {
      console.log('✅ 场景序列化测试通过')
    } else {
      console.warn('⚠️ 发现问题:', issues)
    }

  } catch (error) {
    console.error('❌ 场景序列化测试失败:', error)
  }
}

/**
 * 运行所有修复验证测试
 */
export function runSerializationFixTests(): void {
  console.log('🚀 开始运行序列化修复验证测试...\n')

  testSetInstanceId()
  console.log('')

  testBasicSerialization()
  console.log('')

  testSceneSerialization()
  console.log('')

  console.log('🎉 序列化修复验证测试完成！')
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testSetInstanceId = testSetInstanceId
    (window as any).testBasicSerialization = testBasicSerialization
    (window as any).testSceneSerialization = testSceneSerialization
    (window as any).runSerializationFixTests = runSerializationFixTests
    console.log('💡 可用测试命令:')
    console.log('  - window.testSetInstanceId() // 测试setInstanceId方法')
    console.log('  - window.testBasicSerialization() // 测试基础序列化')
    console.log('  - window.testSceneSerialization() // 测试场景序列化')
    console.log('  - window.runSerializationFixTests() // 运行所有测试')
  } catch (error) {
    console.warn('⚠️ 无法设置全局测试函数:', error)
  }
}
