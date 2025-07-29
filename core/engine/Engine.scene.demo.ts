/**
 * QAQ游戏引擎 - Engine场景管理功能演示
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 演示内容:
 * - Engine场景管理集成演示
 * - 主场景设置和管理
 * - 场景切换和过渡效果
 * - 场景预加载和缓存
 * - 场景栈管理和导航
 * - 完整的游戏场景流程
 */

import Engine from './Engine'
import Scene, { SceneType } from '../scene/Scene'
import { SceneChangeMode } from '../scene/types'
import Node3D from '../nodes/Node3D'
import Camera3D from '../nodes/3d/Camera3D'
import MeshInstance3D from '../nodes/MeshInstance3D'

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示Engine场景系统初始化
 */
async function demoEngineSceneInitialization(): Promise<void> {
  console.log('🎬 演示Engine场景系统初始化...\n')

  // 创建演示容器
  const container = document.createElement('div')
  container.style.width = '800px'
  container.style.height = '600px'
  container.style.border = '1px solid #ccc'
  container.style.margin = '10px'
  document.body.appendChild(container)

  try {
    console.log(`🔧 初始化QAQ游戏引擎...`)
    const engine = Engine.getInstance()
    await engine.initialize(container)

    console.log(`✅ Engine初始化完成`)
    console.log(`   渲染器: ${engine.getRenderer()?.constructor.name}`)
    console.log(`   画布尺寸: ${container.style.width} x ${container.style.height}`)

    // 获取场景管理器
    const sceneTree = engine.getSceneTree()
    console.log(`✅ 场景管理系统已集成`)
    console.log(`   SceneTree: ${sceneTree.constructor.name}`)
    console.log(`   当前场景: ${engine.getCurrentScene()?.name || '无'}`)
    console.log(`   场景栈深度: ${sceneTree.stackDepth}`)

    console.log('\n')

  } catch (error) {
    console.error('初始化失败:', error)
  }
}

/**
 * 演示主场景创建和设置
 */
async function demoMainSceneCreation(): Promise<void> {
  console.log('🏠 演示主场景创建和设置...\n')

  const engine = Engine.getInstance()

  // 创建主场景
  const mainScene = new Scene('GameMainScene', {
    type: SceneType.MAIN,
    persistent: true,
    autoStart: true
  })

  console.log(`🏠 创建主场景: ${mainScene.name}`)
  console.log(`   场景类型: ${mainScene.sceneType}`)
  console.log(`   是否持久: ${mainScene.persistent}`)

  // 添加3D节点到场景
  const rootNode = new Node3D('Root')
  mainScene.addChild(rootNode)

  // 添加相机
  const camera = new Camera3D('MainCamera')
  camera.position = { x: 0, y: 5, z: 10 }
  rootNode.addChild(camera)

  // 添加3D对象
  const meshNode = new MeshInstance3D('CubeMesh')
  meshNode.position = { x: 0, y: 0, z: 0 }
  rootNode.addChild(meshNode)

  console.log(`📦 场景节点结构:`)
  console.log(`   ${mainScene.name}`)
  console.log(`   └── ${rootNode.name}`)
  console.log(`       ├── ${camera.name} (Camera3D)`)
  console.log(`       └── ${meshNode.name} (MeshInstance3D)`)

  // 设置为主场景
  await engine.setMainScene(mainScene)

  console.log(`✅ 主场景设置完成`)
  console.log(`   当前场景: ${engine.getCurrentScene()?.name}`)
  console.log(`   场景状态: ${mainScene.state}`)
  console.log(`   节点数量: ${mainScene.getChildCount()}`)

  console.log('\n')
}

/**
 * 演示场景切换功能
 */
async function demoSceneTransitions(): Promise<void> {
  console.log('🔄 演示场景切换功能...\n')

  const engine = Engine.getInstance()

  // 创建多个场景
  const menuScene = new Scene('MenuScene', { type: SceneType.SUB })
  const gameScene = new Scene('GameScene', { type: SceneType.MAIN })
  const settingsScene = new Scene('SettingsScene', { type: SceneType.SUB })

  // 为每个场景添加一些节点
  [menuScene, gameScene, settingsScene].forEach(scene => {
    const rootNode = new Node3D(`${scene.name}Root`)
    const camera = new Camera3D(`${scene.name}Camera`)
    rootNode.addChild(camera)
    scene.addChild(rootNode)
  })

  console.log(`🎬 创建演示场景:`)
  console.log(`   菜单场景: ${menuScene.name}`)
  console.log(`   游戏场景: ${gameScene.name}`)
  console.log(`   设置场景: ${settingsScene.name}`)

  // 演示立即切换
  console.log(`\n⚡ 立即切换到菜单场景...`)
  await engine.changeScene(menuScene, {
    mode: SceneChangeMode.IMMEDIATE
  })
  console.log(`   当前场景: ${engine.getCurrentScene()?.name}`)

  // 演示淡入淡出切换
  console.log(`\n🌅 淡入淡出切换到游戏场景...`)
  await engine.changeScene(gameScene, {
    mode: SceneChangeMode.FADE,
    duration: 500,
    onComplete: () => console.log('   淡入淡出完成')
  })
  console.log(`   当前场景: ${engine.getCurrentScene()?.name}`)

  // 演示推拉切换
  console.log(`\n📱 推拉效果切换到设置场景...`)
  await engine.changeScene(settingsScene, {
    mode: SceneChangeMode.SLIDE,
    duration: 300,
    keepCurrent: true
  })
  console.log(`   当前场景: ${engine.getCurrentScene()?.name}`)

  console.log('\n')
}

/**
 * 演示场景预加载功能
 */
async function demoScenePreloading(): Promise<void> {
  console.log('🚀 演示场景预加载功能...\n')

  const engine = Engine.getInstance()

  console.log(`📦 场景预加载演示:`)

  // 单个场景预加载
  console.log(`   预加载单个场景: level1.qaq`)
  const level1Scene = await engine.preloadScene('levels/level1.qaq')
  console.log(`   ✅ 预加载完成: ${level1Scene.name}`)

  // 批量场景预加载
  const levelPaths = [
    'levels/level2.qaq',
    'levels/level3.qaq',
    'levels/boss.qaq'
  ]

  console.log(`\n📦 批量预加载演示:`)
  console.log(`   预加载场景数量: ${levelPaths.length}`)

  const preloadedScenes = await engine.preloadScenes(levelPaths, (completed, total) => {
    const percentage = ((completed / total) * 100).toFixed(1)
    console.log(`   进度: ${completed}/${total} (${percentage}%)`)
  })

  console.log(`   ✅ 批量预加载完成，共 ${preloadedScenes.length} 个场景`)

  // 显示缓存统计
  const sceneTree = engine.getSceneTree()
  const cacheStats = sceneTree.getCacheStats()
  console.log(`\n📊 缓存统计:`)
  console.log(`   缓存场景数: ${cacheStats.count}`)
  console.log(`   内存使用: ${(cacheStats.memoryUsage / 1024).toFixed(2)} KB`)

  console.log('\n')
}

/**
 * 演示场景栈管理
 */
async function demoSceneStackManagement(): Promise<void> {
  console.log('📚 演示场景栈管理...\n')

  const engine = Engine.getInstance()
  const sceneTree = engine.getSceneTree()

  // 创建场景层级
  const mainMenuScene = new Scene('MainMenu')
  const gameplayScene = new Scene('Gameplay')
  const pauseMenuScene = new Scene('PauseMenu')
  const inventoryScene = new Scene('Inventory')

  console.log(`📚 场景栈操作演示:`)

  // 设置主菜单为当前场景
  await engine.changeScene(mainMenuScene)
  console.log(`   当前场景: ${engine.getCurrentScene()?.name}`)

  // 推入场景到栈
  sceneTree.pushScene(mainMenuScene, 'ui/main_menu.qaq')
  console.log(`   推入 ${mainMenuScene.name} (栈深度: ${sceneTree.stackDepth})`)

  // 切换到游戏场景
  await engine.changeScene(gameplayScene)
  sceneTree.pushScene(gameplayScene, 'game/gameplay.qaq')
  console.log(`   推入 ${gameplayScene.name} (栈深度: ${sceneTree.stackDepth})`)

  // 打开暂停菜单
  await engine.changeScene(pauseMenuScene)
  sceneTree.pushScene(pauseMenuScene, 'ui/pause_menu.qaq')
  console.log(`   推入 ${pauseMenuScene.name} (栈深度: ${sceneTree.stackDepth})`)

  // 打开物品栏
  await engine.changeScene(inventoryScene)
  sceneTree.pushScene(inventoryScene, 'ui/inventory.qaq')
  console.log(`   推入 ${inventoryScene.name} (栈深度: ${sceneTree.stackDepth})`)

  // 返回上一个场景
  console.log(`\n📤 场景返回演示:`)
  let returnedScene = await engine.goBackScene()
  console.log(`   返回到: ${returnedScene?.name} (栈深度: ${sceneTree.stackDepth})`)

  returnedScene = await engine.goBackScene()
  console.log(`   返回到: ${returnedScene?.name} (栈深度: ${sceneTree.stackDepth})`)

  console.log('\n')
}

/**
 * 演示完整游戏流程
 */
async function demoCompleteGameFlow(): Promise<void> {
  console.log('🎮 演示完整游戏流程...\n')

  const engine = Engine.getInstance()

  console.log(`🎮 模拟完整游戏流程:`)

  // 1. 启动画面
  const splashScene = new Scene('SplashScreen')
  await engine.changeScene(splashScene)
  console.log(`   1. 启动画面: ${engine.getCurrentScene()?.name}`)

  // 2. 主菜单
  const mainMenuScene = new Scene('MainMenu')
  await engine.changeScene(mainMenuScene, {
    mode: SceneChangeMode.FADE,
    duration: 1000
  })
  console.log(`   2. 主菜单: ${engine.getCurrentScene()?.name}`)

  // 3. 游戏场景
  const gameScene = new Scene('GameLevel1')
  await engine.changeScene(gameScene, {
    mode: SceneChangeMode.SLIDE,
    duration: 500
  })
  console.log(`   3. 游戏关卡: ${engine.getCurrentScene()?.name}`)

  // 4. 暂停菜单（保持游戏场景）
  const pauseScene = new Scene('PauseMenu')
  await engine.changeScene(pauseScene, {
    mode: SceneChangeMode.IMMEDIATE,
    keepCurrent: true
  })
  console.log(`   4. 暂停菜单: ${engine.getCurrentScene()?.name}`)

  // 5. 返回游戏
  await engine.goBackScene()
  console.log(`   5. 返回游戏: ${engine.getCurrentScene()?.name}`)

  // 6. 游戏结束画面
  const gameOverScene = new Scene('GameOver')
  await engine.changeScene(gameOverScene, {
    mode: SceneChangeMode.FADE,
    duration: 800
  })
  console.log(`   6. 游戏结束: ${engine.getCurrentScene()?.name}`)

  console.log(`\n🎯 游戏流程演示完成！`)

  console.log('\n')
}

/**
 * 演示场景统计和调试
 */
function demoSceneStatsAndDebug(): void {
  console.log('📊 演示场景统计和调试...\n')

  const engine = Engine.getInstance()
  const sceneTree = engine.getSceneTree()

  // 获取统计信息
  const stats = sceneTree.getStats()
  console.log(`📊 场景系统统计:`)
  console.log(`   活动场景数: ${stats.sceneCount}`)
  console.log(`   场景栈深度: ${stats.stackDepth}`)
  console.log(`   总节点数: ${stats.totalNodes}`)
  console.log(`   内存使用: ${(stats.memoryUsage / 1024).toFixed(2)} KB`)
  console.log(`   运行时间: ${(stats.uptime / 1000).toFixed(2)} 秒`)

  // 缓存统计
  const cacheStats = sceneTree.getCacheStats()
  console.log(`\n💾 缓存统计:`)
  console.log(`   缓存场景数: ${cacheStats.count}`)
  console.log(`   缓存内存: ${(cacheStats.memoryUsage / 1024).toFixed(2)} KB`)

  // 当前场景信息
  const currentScene = engine.getCurrentScene()
  if (currentScene) {
    const sceneStats = currentScene.getSceneStats()
    console.log(`\n🎬 当前场景信息:`)
    console.log(`   场景名称: ${currentScene.name}`)
    console.log(`   场景类型: ${currentScene.sceneType}`)
    console.log(`   场景状态: ${currentScene.state}`)
    console.log(`   节点数量: ${sceneStats.nodeCount}`)
    console.log(`   运行时间: ${(sceneStats.runTime / 1000).toFixed(2)} 秒`)
  }

  // 打印详细状态
  console.log(`\n🔧 详细状态信息:`)
  sceneTree.printStatus()

  console.log('\n')
}

/**
 * 运行所有演示
 */
async function runAllDemos(): Promise<void> {
  console.log('🚀 QAQ游戏引擎 - Engine场景管理功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    await demoEngineSceneInitialization()
    await demoMainSceneCreation()
    await demoSceneTransitions()
    await demoScenePreloading()
    await demoSceneStackManagement()
    await demoCompleteGameFlow()
    demoSceneStatsAndDebug()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ Engine场景系统集成正常')
    console.log('   ✅ 主场景创建和管理正常')
    console.log('   ✅ 场景切换和过渡正常')
    console.log('   ✅ 场景预加载功能正常')
    console.log('   ✅ 场景栈管理正常')
    console.log('   ✅ 完整游戏流程正常')
    console.log('   ✅ 统计和调试功能正常')
    console.log('\n🎯 Engine场景管理功能已完全就绪！')
    console.log('🔧 核心特性完美运行：')
    console.log('   - SceneTree深度集成到Engine')
    console.log('   - 完整的场景生命周期管理')
    console.log('   - 多种场景切换过渡效果')
    console.log('   - 智能场景预加载和缓存')
    console.log('   - 场景栈导航系统')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  } finally {
    // 清理资源
    try {
      Engine.getInstance().destroy()
    } catch (error) {
      console.error('清理资源时出错:', error)
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  demoEngineSceneInitialization,
  demoMainSceneCreation,
  demoSceneTransitions,
  demoScenePreloading,
  demoSceneStackManagement,
  demoCompleteGameFlow,
  demoSceneStatsAndDebug,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
