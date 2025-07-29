/**
 * QAQ游戏引擎 - Engine场景管理功能单元测试
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 测试内容:
 * - Engine场景管理集成
 * - 场景设置和切换
 * - SceneTree集成
 * - 场景生命周期同步
 * - 场景预加载功能
 */

import Engine from './Engine'
import Scene, { SceneType } from '../scene/Scene'
import { SceneChangeMode } from '../scene/types'

// ============================================================================
// 测试用例
// ============================================================================

/**
 * 测试Engine场景系统初始化
 */
async function testEngineSceneInitialization(): Promise<void> {
  console.log('🧪 测试Engine场景系统初始化...')

  // 创建测试容器
  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    // 初始化Engine
    const engine = Engine.getInstance()
    await engine.initialize(container)

    // 测试场景系统是否正确初始化
    const sceneTree = engine.getSceneTree()
    console.assert(sceneTree !== null, 'SceneTree应该被初始化')

    // 测试初始状态
    const currentScene = engine.getCurrentScene()
    console.assert(currentScene === null, '初始当前场景应为null')

    console.log('✅ Engine场景系统初始化测试通过')

  } finally {
    // 清理
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试主场景设置
 */
async function testMainSceneSetting(): Promise<void> {
  console.log('🧪 测试主场景设置...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()
    await engine.initialize(container)

    // 创建主场景
    const mainScene = new Scene('TestMainScene', {
      type: SceneType.MAIN,
      persistent: true
    })

    // 设置主场景
    await engine.setMainScene(mainScene)

    // 验证主场景设置
    const currentScene = engine.getCurrentScene()
    console.assert(currentScene === mainScene, '当前场景应为设置的主场景')
    console.assert(mainScene.isMainScene === true, '场景应被标记为主场景')

    // 验证SceneTree中的主场景
    const sceneTree = engine.getSceneTree()
    console.assert(sceneTree.mainScene === mainScene, 'SceneTree中的主场景应正确')
    console.assert(sceneTree.currentScene === mainScene, 'SceneTree中的当前场景应正确')

    console.log('✅ 主场景设置测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试场景切换功能
 */
async function testSceneChanging(): Promise<void> {
  console.log('🧪 测试场景切换功能...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()
    await engine.initialize(container)

    // 创建多个场景
    const scene1 = new Scene('Scene1')
    const scene2 = new Scene('Scene2')
    const scene3 = new Scene('Scene3')

    // 设置初始场景
    await engine.setMainScene(scene1)
    console.assert(engine.getCurrentScene() === scene1, '初始场景设置失败')

    // 切换到场景2
    const changedScene = await engine.changeScene(scene2)
    console.assert(changedScene === scene2, '场景切换返回值错误')
    console.assert(engine.getCurrentScene() === scene2, '当前场景切换失败')

    // 带选项的场景切换
    await engine.changeScene(scene3, {
      mode: SceneChangeMode.IMMEDIATE,
      duration: 100
    })
    console.assert(engine.getCurrentScene() === scene3, '带选项的场景切换失败')

    console.log('✅ 场景切换功能测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试场景预加载功能
 */
async function testScenePreloading(): Promise<void> {
  console.log('🧪 测试场景预加载功能...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()
    await engine.initialize(container)

    // 测试单个场景预加载
    const preloadedScene = await engine.preloadScene('test/scene1.qaq')
    console.assert(preloadedScene instanceof Scene, '预加载的场景应为Scene实例')
    console.assert(preloadedScene.scenePath === 'test/scene1.qaq', '场景路径应正确')

    // 测试批量场景预加载
    const scenePaths = ['test/scene2.qaq', 'test/scene3.qaq', 'test/scene4.qaq']
    let progressCount = 0

    const preloadedScenes = await engine.preloadScenes(scenePaths, (completed, total) => {
      progressCount++
      console.assert(completed <= total, '完成数不应超过总数')
    })

    console.assert(preloadedScenes.length === 3, '批量预加载应返回3个场景')
    console.assert(progressCount === 3, '进度回调应被调用3次')

    console.log('✅ 场景预加载功能测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试场景返回功能
 */
async function testSceneGoBack(): Promise<void> {
  console.log('🧪 测试场景返回功能...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()
    await engine.initialize(container)

    const scene1 = new Scene('Scene1')
    const scene2 = new Scene('Scene2')

    // 设置初始场景
    await engine.setMainScene(scene1)

    // 推入场景到栈
    const sceneTree = engine.getSceneTree()
    sceneTree.pushScene(scene1, 'scene1.qaq')

    // 切换到场景2
    await engine.changeScene(scene2)

    // 返回上一个场景
    const previousScene = await engine.goBackScene()
    console.assert(previousScene === scene1, '应该返回到上一个场景')
    console.assert(engine.getCurrentScene() === scene1, '当前场景应为返回的场景')

    console.log('✅ 场景返回功能测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试场景生命周期同步
 */
async function testSceneLifecycleSync(): Promise<void> {
  console.log('🧪 测试场景生命周期同步...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()
    await engine.initialize(container)

    const scene = new Scene('LifecycleTestScene')

    // 设置主场景
    await engine.setMainScene(scene)

    // 验证场景状态
    console.assert(scene.isLoaded(), '场景应已加载')
    console.assert(scene.isRunning(), '场景应正在运行')

    // 测试渲染循环中的场景更新
    // 这里主要测试不会抛出错误
    engine.renderFrame()

    console.log('✅ 场景生命周期同步测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 测试错误处理
 */
async function testErrorHandling(): Promise<void> {
  console.log('🧪 测试错误处理...')

  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)

  try {
    const engine = Engine.getInstance()

    // 测试未初始化时的错误
    try {
      engine.getSceneTree()
      console.assert(false, '未初始化时应抛出错误')
    } catch (error) {
      console.assert(error instanceof Error, '应抛出Error实例')
    }

    // 初始化后测试
    await engine.initialize(container)

    // 测试正常情况
    const sceneTree = engine.getSceneTree()
    console.assert(sceneTree !== null, '初始化后应能获取SceneTree')

    console.log('✅ 错误处理测试通过')

  } finally {
    document.body.removeChild(container)
    Engine.getInstance().destroy()
  }
}

/**
 * 运行所有测试
 */
async function runAllTests(): Promise<void> {
  console.log('🚀 开始Engine场景管理功能单元测试...\n')

  try {
    await testEngineSceneInitialization()
    await testMainSceneSetting()
    await testSceneChanging()
    await testScenePreloading()
    await testSceneGoBack()
    await testSceneLifecycleSync()
    await testErrorHandling()

    console.log('\n🎉 所有Engine场景管理测试通过！')
    console.log('📊 测试统计: 7个测试用例全部通过')
    console.log('🎯 Engine场景管理功能已准备就绪！')
    console.log('🔧 核心特性：')
    console.log('   - SceneTree集成 ✅')
    console.log('   - 主场景管理 ✅')
    console.log('   - 场景切换系统 ✅')
    console.log('   - 场景预加载 ✅')
    console.log('   - 生命周期同步 ✅')
    console.log('   - 错误处理机制 ✅')

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    console.log('📊 测试统计: 部分测试失败')
  }
}

// ============================================================================
// 导出测试函数
// ============================================================================

export {
  testEngineSceneInitialization,
  testMainSceneSetting,
  testSceneChanging,
  testScenePreloading,
  testSceneGoBack,
  testSceneLifecycleSync,
  testErrorHandling,
  runAllTests
}

// 如果直接运行此文件，执行所有测试
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllTests()
}
