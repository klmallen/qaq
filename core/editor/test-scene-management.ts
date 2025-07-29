/**
 * QAQ游戏引擎 - 场景管理系统测试
 * 
 * 测试场景导出、加载和数据清除功能
 */

import { Engine, Scene, Node3D, Camera3D, DirectionalLight3D, Node } from '../index'

/**
 * 测试场景导出功能
 */
export function testSceneExport(): void {
  console.log('🧪 测试场景导出功能...')

  try {
    // 创建测试场景
    const scene = new Scene('TestExportScene')
    
    // 添加相机
    const camera = new Camera3D('TestCamera')
    camera.position = { x: 10, y: 10, z: 10 }
    camera.fov = 60
    scene.addChild(camera)

    // 添加光源
    const light = new DirectionalLight3D('TestLight')
    light.position = { x: 5, y: 5, z: 5 }
    light.intensity = 1.2
    scene.addChild(light)

    // 添加3D节点
    const node = new Node3D('TestNode')
    node.position = { x: 1, y: 2, z: 3 }
    node.visible = true
    scene.addChild(node)

    console.log('✅ 测试场景创建完成')
    console.log(`📊 场景统计: ${scene.children.length} 个子节点`)

    // 测试序列化
    console.log('📦 开始序列化测试...')
    const serialized = scene.serialize()
    
    console.log('✅ 场景序列化成功')
    console.log(`📊 序列化数据大小: ${JSON.stringify(serialized).length} 字节`)
    console.log(`📊 场景类型: ${serialized.type}`)
    console.log(`📊 子节点数量: ${serialized.children.length}`)

    // 测试反序列化
    console.log('🔄 开始反序列化测试...')
    const restored = Node.deserialize(serialized, Scene) as Scene
    
    console.log('✅ 场景反序列化成功')
    console.log(`📊 恢复的场景名称: ${restored.name}`)
    console.log(`📊 恢复的子节点数量: ${restored.children.length}`)

    // 验证数据完整性
    console.log('🔍 验证数据完整性...')
    const issues: string[] = []

    if (restored.name !== scene.name) {
      issues.push(`场景名称不匹配: ${scene.name} vs ${restored.name}`)
    }

    if (restored.children.length !== scene.children.length) {
      issues.push(`子节点数量不匹配: ${scene.children.length} vs ${restored.children.length}`)
    }

    // 检查相机
    const restoredCamera = restored.children.find(child => child.name === 'TestCamera') as Camera3D
    if (!restoredCamera) {
      issues.push('相机节点丢失')
    } else if (Math.abs(restoredCamera.fov - camera.fov) > 0.001) {
      issues.push(`相机FOV不匹配: ${camera.fov} vs ${restoredCamera.fov}`)
    }

    // 检查光源
    const restoredLight = restored.children.find(child => child.name === 'TestLight') as DirectionalLight3D
    if (!restoredLight) {
      issues.push('光源节点丢失')
    } else if (Math.abs(restoredLight.intensity - light.intensity) > 0.001) {
      issues.push(`光源强度不匹配: ${light.intensity} vs ${restoredLight.intensity}`)
    }

    // 检查3D节点
    const restoredNode = restored.children.find(child => child.name === 'TestNode') as Node3D
    if (!restoredNode) {
      issues.push('3D节点丢失')
    } else {
      const originalPos = (node as any).position
      const restoredPos = (restoredNode as any).position
      if (!restoredPos || 
          Math.abs(restoredPos.x - originalPos.x) > 0.001 ||
          Math.abs(restoredPos.y - originalPos.y) > 0.001 ||
          Math.abs(restoredPos.z - originalPos.z) > 0.001) {
        issues.push(`节点位置不匹配: ${JSON.stringify(originalPos)} vs ${JSON.stringify(restoredPos)}`)
      }
    }

    // 输出验证结果
    if (issues.length === 0) {
      console.log('✅ 场景导出测试通过！')
    } else {
      console.warn('⚠️ 发现问题:')
      issues.forEach(issue => console.warn(`  - ${issue}`))
    }

    return {
      success: issues.length === 0,
      originalScene: scene,
      restoredScene: restored,
      serializedData: serialized,
      issues
    }

  } catch (error) {
    console.error('❌ 场景导出测试失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * 测试引擎数据清除功能
 */
export async function testEngineClearData(): Promise<void> {
  console.log('🧪 测试引擎数据清除功能...')

  try {
    const engine = Engine.getInstance()
    
    // 检查clearAllData方法是否存在
    if (typeof engine.clearAllData !== 'function') {
      throw new Error('Engine.clearAllData方法不存在')
    }

    console.log('📊 清除前状态检查...')
    const beforeState = {
      isRunning: (engine as any)._state === 'RUNNING',
      hasScene: !!(engine as any)._currentQAQScene,
      hasRenderer: !!(engine as any)._renderer
    }
    console.log('清除前状态:', beforeState)

    // 执行清除
    console.log('🧹 开始清除引擎数据...')
    await engine.clearAllData((progress, message) => {
      console.log(`清除进度 ${progress}%: ${message}`)
    })

    console.log('📊 清除后状态检查...')
    const afterState = {
      isRunning: (engine as any)._state === 'RUNNING',
      hasScene: !!(engine as any)._currentQAQScene,
      hasRenderer: !!(engine as any)._renderer
    }
    console.log('清除后状态:', afterState)

    console.log('✅ 引擎数据清除测试完成')

  } catch (error) {
    console.error('❌ 引擎数据清除测试失败:', error)
    throw error
  }
}

/**
 * 测试场景管理API可用性
 */
export function testSceneManagementAPI(): void {
  console.log('🧪 测试场景管理API可用性...')
  const requiredFunctions = [
    'exportCurrentScene',
    'loadSceneFromFile', 
    'clearEngineData',
    'createNewScene',
    'getCurrentSceneInfo',
    'setupDragAndDropLoader',
    'showSceneManagementHelp'
  ]

  const availableFunctions: string[] = []
  const missingFunctions: string[] = []

  for (const funcName of requiredFunctions) {
    if (typeof (window as any)[funcName] === 'function') {
      availableFunctions.push(funcName)
    } else {
      missingFunctions.push(funcName)
    }
  }

  console.log(`✅ 可用函数 (${availableFunctions.length}/${requiredFunctions.length}):`)
  availableFunctions.forEach(func => console.log(`  - window.${func}()`))

  if (missingFunctions.length > 0) {
    console.warn(`⚠️ 缺失函数 (${missingFunctions.length}):`)
    missingFunctions.forEach(func => console.warn(`  - window.${func}()`))
  }

  return {
    total: requiredFunctions.length,
    available: availableFunctions.length,
    missing: missingFunctions.length,
    success: missingFunctions.length === 0
  }
}

/**
 * 运行所有场景管理测试
 */
export async function runAllSceneManagementTests(): Promise<void> {
  console.log('🚀 开始运行场景管理系统测试...\n')

  try {
    // 测试1: 场景导出
    console.log('=== 测试1: 场景导出功能 ===')
    const exportResult = testSceneExport()
    console.log(`结果: ${exportResult.success ? '✅ 通过' : '❌ 失败'}\n`)

    // 测试2: API可用性
    console.log('=== 测试2: API可用性检查 ===')
    const apiResult = testSceneManagementAPI()
    console.log(`结果: ${apiResult.success ? '✅ 通过' : '❌ 失败'}\n`)

    // 测试3: 引擎数据清除
    console.log('=== 测试3: 引擎数据清除 ===')
    await testEngineClearData()
    console.log('结果: ✅ 通过\n')

    console.log('🎉 所有场景管理测试完成！')

  } catch (error) {
    console.error('❌ 场景管理测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testSceneExport = testSceneExport
    (window as any).testEngineClearData = testEngineClearData
    (window as any).testSceneManagementAPI = testSceneManagementAPI
    (window as any).runAllSceneManagementTests = runAllSceneManagementTests
    
    console.log('💡 场景管理测试函数已加载:')
    console.log('  - window.testSceneExport() // 测试场景导出')
    console.log('  - window.testEngineClearData() // 测试数据清除')
    console.log('  - window.testSceneManagementAPI() // 测试API可用性')
    console.log('  - window.runAllSceneManagementTests() // 运行所有测试')
    
  } catch (error) {
    console.warn('⚠️ 无法设置全局场景管理测试函数:', error)
  }
}
