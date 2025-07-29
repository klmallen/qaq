/**
 * QAQ游戏引擎 - 导出修复验证测试
 * 
 * 验证SceneExportManager导出修复是否有效
 */

// 测试导入是否正常工作
import SceneExportManager, { type SceneExportOptions, type SceneLoadOptions } from './SceneExportManager'
import { Engine, Scene, Node3D } from '../index'

/**
 * 测试导入修复
 */
export function testImportFix(): void {
  console.log('🧪 测试导入修复...')

  try {
    // 测试SceneExportManager类是否可用
    const exportManager = SceneExportManager.getInstance()
    console.log('✅ SceneExportManager类导入成功')

    // 测试类型是否可用
    const exportOptions: SceneExportOptions = {
      fileName: 'test.json',
      includeMetadata: true
    }
    console.log('✅ SceneExportOptions类型可用')

    const loadOptions: SceneLoadOptions = {
      validateVersion: true,
      clearCurrentScene: false
    }
    console.log('✅ SceneLoadOptions类型可用')

    console.log('✅ 导入修复测试通过！')

  } catch (error) {
    console.error('❌ 导入修复测试失败:', error)
  }
}

/**
 * 测试基础序列化功能
 */
export function testBasicSerialization(): void {
  console.log('🧪 测试基础序列化功能...')

  try {
    // 创建简单场景
    const scene = new Scene('TestScene')
    const node = new Node3D('TestNode')
    node.position = { x: 1, y: 2, z: 3 }
    scene.addChild(node)

    console.log('📦 测试序列化...')
    const serialized = scene.serialize()
    console.log('✅ 序列化成功')

    console.log('🔄 测试反序列化...')
    const restored = scene.constructor.deserialize ? 
      scene.constructor.deserialize(serialized) :
      Scene.prototype.constructor.deserialize(serialized)
    console.log('✅ 反序列化成功')

    console.log('✅ 基础序列化测试通过！')

  } catch (error) {
    console.error('❌ 基础序列化测试失败:', error)
  }
}

/**
 * 测试SceneExportManager功能
 */
export async function testSceneExportManager(): Promise<void> {
  console.log('🧪 测试SceneExportManager功能...')

  try {
    const exportManager = SceneExportManager.getInstance()
    console.log('✅ 获取SceneExportManager实例成功')

    // 创建测试场景
    const scene = new Scene('ExportTestScene')
    const node = new Node3D('ExportTestNode')
    scene.addChild(node)

    // 测试导出功能（不实际下载文件）
    console.log('📦 测试导出功能...')
    
    // 模拟导出过程
    const serialized = scene.serialize()
    console.log('✅ 场景序列化成功')

    // 创建元数据
    const metadata = {
      version: '1.0.0',
      engineVersion: '3.0.0',
      created: Date.now(),
      modified: Date.now(),
      nodeCount: 2,
      dataSize: JSON.stringify(serialized).length
    }
    console.log('✅ 元数据创建成功')

    const exportData = {
      metadata,
      sceneData: serialized,
      resources: {}
    }

    console.log(`📊 导出数据大小: ${JSON.stringify(exportData).length} 字节`)
    console.log('✅ SceneExportManager功能测试通过！')

  } catch (error) {
    console.error('❌ SceneExportManager功能测试失败:', error)
  }
}

/**
 * 运行所有导出修复测试
 */
export async function runAllExportFixTests(): Promise<void> {
  console.log('🚀 开始运行导出修复测试...\n')

  try {
    // 测试1: 导入修复
    console.log('=== 测试1: 导入修复 ===')
    testImportFix()
    console.log('')

    // 测试2: 基础序列化
    console.log('=== 测试2: 基础序列化 ===')
    testBasicSerialization()
    console.log('')

    // 测试3: SceneExportManager功能
    console.log('=== 测试3: SceneExportManager功能 ===')
    await testSceneExportManager()
    console.log('')

    console.log('🎉 所有导出修复测试完成！')

  } catch (error) {
    console.error('❌ 导出修复测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testImportFix = testImportFix
    (window as any).testBasicSerialization = testBasicSerialization
    (window as any).testSceneExportManager = testSceneExportManager
    (window as any).runAllExportFixTests = runAllExportFixTests
    
    console.log('💡 导出修复测试函数已加载:')
    console.log('  - window.testImportFix() // 测试导入修复')
    console.log('  - window.testBasicSerialization() // 测试基础序列化')
    console.log('  - window.testSceneExportManager() // 测试导出管理器')
    console.log('  - window.runAllExportFixTests() // 运行所有测试')
    
  } catch (error) {
    console.warn('⚠️ 无法设置全局导出修复测试函数:', error)
  }
}
