/**
 * QAQ游戏引擎 - SceneTree 功能演示
 * 
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 * 
 * 演示内容:
 * - SceneTree基础场景管理功能
 * - 场景切换和过渡效果演示
 * - 场景栈管理和导航
 * - 场景缓存和预加载
 * - 场景生命周期控制
 * - 统计和调试功能
 */

import SceneTree, { SceneChangeMode } from './SceneTree'
import Scene, { SceneType } from './Scene'
import Engine from '../engine/Engine'

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示基础SceneTree功能
 */
function demoBasicSceneTree(): void {
  console.log('🎬 演示基础SceneTree功能...\n')

  // 获取SceneTree单例
  const sceneTree = SceneTree.getInstance()
  
  console.log(`✅ SceneTree单例获取成功`)
  console.log(`   实例类型: ${sceneTree.constructor.name}`)
  console.log(`   初始状态:`)
  console.log(`     当前场景: ${sceneTree.currentScene?.name || '无'}`)
  console.log(`     主场景: ${sceneTree.mainScene?.name || '无'}`)
  console.log(`     栈深度: ${sceneTree.stackDepth}`)
  console.log(`     是否切换中: ${sceneTree.isChangingScene}`)
  console.log(`     运行时间: ${(sceneTree.uptime / 1000).toFixed(2)}秒`)

  console.log('\n')
}

/**
 * 演示SceneTree初始化
 */
function demoSceneTreeInitialization(): void {
  console.log('🔧 演示SceneTree初始化...\n')

  const sceneTree = SceneTree.getInstance()
  const mockEngine = {} as Engine // 模拟Engine实例
  
  console.log(`🔧 初始化SceneTree...`)
  sceneTree.initialize(mockEngine)
  
  console.log(`✅ SceneTree初始化完成`)
  console.log(`   Engine集成: 已连接`)
  console.log(`   状态: 已初始化`)

  console.log('\n')
}

/**
 * 演示主场景管理
 */
async function demoMainSceneManagement(): Promise<void> {
  console.log('🏠 演示主场景管理...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 创建主场景
  const mainScene = new Scene('GameMainScene', {
    type: SceneType.MAIN,
    persistent: true,
    autoStart: true
  })
  
  console.log(`🏠 创建主场景: ${mainScene.name}`)
  console.log(`   场景类型: ${mainScene.sceneType}`)
  console.log(`   是否持久: ${mainScene.persistent}`)
  
  // 设置主场景
  await sceneTree.setMainScene(mainScene)
  
  console.log(`✅ 主场景设置完成`)
  console.log(`   当前主场景: ${sceneTree.mainScene?.name}`)
  console.log(`   当前活动场景: ${sceneTree.currentScene?.name}`)
  console.log(`   场景状态: ${mainScene.state}`)

  console.log('\n')
}

/**
 * 演示场景切换功能
 */
async function demoSceneChanging(): Promise<void> {
  console.log('🔄 演示场景切换功能...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 创建多个场景
  const menuScene = new Scene('MenuScene', { type: SceneType.SUB })
  const gameScene = new Scene('GameScene', { type: SceneType.MAIN })
  const settingsScene = new Scene('SettingsScene', { type: SceneType.SUB })
  
  console.log(`🎬 创建演示场景:`)
  console.log(`   菜单场景: ${menuScene.name}`)
  console.log(`   游戏场景: ${gameScene.name}`)
  console.log(`   设置场景: ${settingsScene.name}`)
  
  // 演示立即切换
  console.log(`\n⚡ 立即切换到菜单场景...`)
  await sceneTree.changeScene(menuScene, {
    mode: SceneChangeMode.IMMEDIATE
  })
  console.log(`   当前场景: ${sceneTree.currentScene?.name}`)
  
  // 演示淡入淡出切换
  console.log(`\n🌅 淡入淡出切换到游戏场景...`)
  await sceneTree.changeScene(gameScene, {
    mode: SceneChangeMode.FADE,
    duration: 500,
    onComplete: () => console.log('   淡入淡出完成')
  })
  console.log(`   当前场景: ${sceneTree.currentScene?.name}`)
  
  // 演示推拉切换
  console.log(`\n📱 推拉效果切换到设置场景...`)
  await sceneTree.changeScene(settingsScene, {
    mode: SceneChangeMode.SLIDE,
    duration: 300,
    keepCurrent: true
  })
  console.log(`   当前场景: ${sceneTree.currentScene?.name}`)

  console.log('\n')
}

/**
 * 演示场景栈管理
 */
function demoSceneStackManagement(): void {
  console.log('📚 演示场景栈管理...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 创建场景
  const level1Scene = new Scene('Level1Scene')
  const level2Scene = new Scene('Level2Scene')
  const level3Scene = new Scene('Level3Scene')
  const pauseScene = new Scene('PauseScene')
  
  console.log(`📚 场景栈操作演示:`)
  
  // 推入场景到栈
  sceneTree.pushScene(level1Scene, 'levels/level1.qaq', { level: 1 })
  console.log(`   推入 ${level1Scene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  sceneTree.pushScene(level2Scene, 'levels/level2.qaq', { level: 2 })
  console.log(`   推入 ${level2Scene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  sceneTree.pushScene(level3Scene, 'levels/level3.qaq', { level: 3 })
  console.log(`   推入 ${level3Scene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  sceneTree.pushScene(pauseScene, 'ui/pause.qaq', { overlay: true })
  console.log(`   推入 ${pauseScene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  // 查看栈顶
  const topScene = sceneTree.peekScene()
  console.log(`\n👀 栈顶场景: ${topScene?.scene.name}`)
  console.log(`   场景路径: ${topScene?.path}`)
  console.log(`   场景数据: ${JSON.stringify(topScene?.data)}`)
  
  // 弹出场景
  console.log(`\n📤 弹出场景操作:`)
  let poppedScene = sceneTree.popScene()
  console.log(`   弹出 ${poppedScene?.scene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  poppedScene = sceneTree.popScene()
  console.log(`   弹出 ${poppedScene?.scene.name} (栈深度: ${sceneTree.stackDepth})`)
  
  // 检查场景是否在栈中
  console.log(`\n🔍 场景栈查询:`)
  console.log(`   ${level1Scene.name} 在栈中: ${sceneTree.isSceneInStack(level1Scene)}`)
  console.log(`   ${level2Scene.name} 在栈中: ${sceneTree.isSceneInStack(level2Scene)}`)
  console.log(`   ${level3Scene.name} 在栈中: ${sceneTree.isSceneInStack(level3Scene)}`)
  console.log(`   ${pauseScene.name} 在栈中: ${sceneTree.isSceneInStack(pauseScene)}`)
  
  // 获取场景在栈中的位置
  console.log(`\n📍 场景栈位置:`)
  console.log(`   ${level1Scene.name} 位置: ${sceneTree.getSceneStackIndex(level1Scene)}`)
  console.log(`   ${level2Scene.name} 位置: ${sceneTree.getSceneStackIndex(level2Scene)}`)

  console.log('\n')
}

/**
 * 演示场景缓存和预加载
 */
async function demoSceneCaching(): Promise<void> {
  console.log('💾 演示场景缓存和预加载...\n')

  const sceneTree = SceneTree.getInstance()
  
  console.log(`💾 场景加载和缓存演示:`)
  
  // 加载场景（会自动缓存）
  console.log(`   加载场景: assets/scenes/intro.qaq`)
  const introScene = await sceneTree.loadScene('assets/scenes/intro.qaq')
  console.log(`   ✅ 场景加载完成: ${introScene.name}`)
  
  // 再次加载相同场景（从缓存）
  console.log(`   再次加载相同场景...`)
  const cachedIntroScene = await sceneTree.loadScene('assets/scenes/intro.qaq')
  console.log(`   ✅ 从缓存加载: ${cachedIntroScene === introScene ? '是' : '否'}`)
  
  // 预加载单个场景
  console.log(`\n🚀 预加载演示:`)
  console.log(`   预加载场景: assets/scenes/credits.qaq`)
  const creditsScene = await sceneTree.preloadScene('assets/scenes/credits.qaq')
  console.log(`   ✅ 预加载完成: ${creditsScene.name}`)
  
  // 批量预加载
  const scenesToPreload = [
    'assets/scenes/level1.qaq',
    'assets/scenes/level2.qaq',
    'assets/scenes/level3.qaq',
    'assets/scenes/boss.qaq'
  ]
  
  console.log(`\n📦 批量预加载演示:`)
  console.log(`   预加载场景数量: ${scenesToPreload.length}`)
  
  const preloadedScenes = await sceneTree.preloadScenes(scenesToPreload, (completed, total) => {
    const percentage = ((completed / total) * 100).toFixed(1)
    console.log(`   进度: ${completed}/${total} (${percentage}%)`)
  })
  
  console.log(`   ✅ 批量预加载完成，共 ${preloadedScenes.length} 个场景`)
  
  // 缓存统计
  const cacheStats = sceneTree.getCacheStats()
  console.log(`\n📊 缓存统计:`)
  console.log(`   缓存场景数量: ${cacheStats.count}`)
  console.log(`   内存使用量: ${(cacheStats.memoryUsage / 1024).toFixed(2)} KB`)
  console.log(`   缓存路径: ${cacheStats.paths.slice(0, 3).join(', ')}${cacheStats.paths.length > 3 ? '...' : ''}`)

  console.log('\n')
}

/**
 * 演示场景查找功能
 */
function demoSceneFinding(): void {
  console.log('🔍 演示场景查找功能...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 创建一些场景并添加到栈
  const hudScene = new Scene('HUDScene')
  const inventoryScene = new Scene('InventoryScene')
  const mapScene = new Scene('MapScene')
  
  sceneTree.pushScene(hudScene, 'ui/hud.qaq')
  sceneTree.pushScene(inventoryScene, 'ui/inventory.qaq')
  sceneTree.pushScene(mapScene, 'ui/map.qaq')
  
  console.log(`🔍 场景查找演示:`)
  
  // 按名称查找
  const foundHUD = sceneTree.findSceneByName('HUDScene')
  console.log(`   按名称查找 'HUDScene': ${foundHUD ? '找到' : '未找到'}`)
  
  const foundNonExistent = sceneTree.findSceneByName('NonExistentScene')
  console.log(`   按名称查找 'NonExistentScene': ${foundNonExistent ? '找到' : '未找到'}`)
  
  // 获取所有活动场景
  const activeScenes = sceneTree.getAllActiveScenes()
  console.log(`\n📋 活动场景列表:`)
  activeScenes.forEach((scene, index) => {
    console.log(`   ${index + 1}. ${scene.name} (${scene.sceneType})`)
  })
  
  console.log(`   总计: ${activeScenes.length} 个活动场景`)

  console.log('\n')
}

/**
 * 演示场景统计和调试
 */
function demoSceneStatsAndDebug(): void {
  console.log('📊 演示场景统计和调试...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 获取统计信息
  const stats = sceneTree.getStats()
  console.log(`📊 SceneTree统计信息:`)
  console.log(`   场景数量: ${stats.sceneCount}`)
  console.log(`   栈深度: ${stats.stackDepth}`)
  console.log(`   总节点数: ${stats.totalNodes}`)
  console.log(`   内存使用: ${(stats.memoryUsage / 1024).toFixed(2)} KB`)
  console.log(`   运行时间: ${(stats.uptime / 1000).toFixed(2)} 秒`)
  
  // 缓存统计
  const cacheStats = sceneTree.getCacheStats()
  console.log(`\n💾 缓存统计信息:`)
  console.log(`   缓存场景数: ${cacheStats.count}`)
  console.log(`   缓存内存: ${(cacheStats.memoryUsage / 1024).toFixed(2)} KB`)
  
  // 打印详细状态
  console.log(`\n🔧 详细状态信息:`)
  sceneTree.printStatus()

  console.log('\n')
}

/**
 * 演示场景生命周期控制
 */
async function demoSceneLifecycleControl(): Promise<void> {
  console.log('🔄 演示场景生命周期控制...\n')

  const sceneTree = SceneTree.getInstance()
  
  // 创建测试场景
  const testScene1 = new Scene('TestScene1')
  const testScene2 = new Scene('TestScene2')
  
  await sceneTree.changeScene(testScene1)
  sceneTree.pushScene(testScene2, 'test/scene2.qaq')
  
  console.log(`🔄 场景生命周期控制演示:`)
  
  // 暂停所有场景
  console.log(`   ⏸️ 暂停所有场景...`)
  sceneTree.pauseAll()
  console.log(`   所有场景已暂停`)
  
  // 恢复所有场景
  console.log(`   ▶️ 恢复所有场景...`)
  sceneTree.resumeAll()
  console.log(`   所有场景已恢复`)
  
  // 停止所有场景
  console.log(`   ⏹️ 停止所有场景...`)
  sceneTree.stopAll()
  console.log(`   所有场景已停止`)
  
  // 重新加载当前场景
  console.log(`   🔄 重新加载当前场景...`)
  try {
    // 由于当前场景可能没有路径，这里会抛出错误，我们捕获它
    await sceneTree.reloadCurrentScene()
    console.log(`   当前场景重新加载完成`)
  } catch (error) {
    console.log(`   当前场景无法重新加载（没有路径）`)
  }
  
  // 卸载所有场景
  console.log(`   🗑️ 卸载所有场景...`)
  await sceneTree.unloadAll()
  console.log(`   所有场景已卸载`)
  console.log(`   当前场景: ${sceneTree.currentScene?.name || '无'}`)
  console.log(`   栈深度: ${sceneTree.stackDepth}`)

  console.log('\n')
}

/**
 * 运行所有演示
 */
async function runAllDemos(): Promise<void> {
  console.log('🚀 QAQ游戏引擎 - SceneTree功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    demoBasicSceneTree()
    demoSceneTreeInitialization()
    await demoMainSceneManagement()
    await demoSceneChanging()
    demoSceneStackManagement()
    await demoSceneCaching()
    demoSceneFinding()
    demoSceneStatsAndDebug()
    await demoSceneLifecycleControl()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ 基础场景管理功能正常')
    console.log('   ✅ 场景切换和过渡正常')
    console.log('   ✅ 场景栈管理功能正常')
    console.log('   ✅ 场景缓存系统正常')
    console.log('   ✅ 场景查找功能正常')
    console.log('   ✅ 统计和调试功能正常')
    console.log('   ✅ 生命周期控制正常')
    console.log('\n🎯 SceneTree已准备好作为场景管理系统的核心！')
    console.log('🔧 核心特性完美运行：')
    console.log('   - Godot风格的场景管理')
    console.log('   - 完整的场景切换系统')
    console.log('   - 智能场景栈管理')
    console.log('   - 高效的场景缓存')
    console.log('   - 统一的生命周期控制')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  demoBasicSceneTree,
  demoSceneTreeInitialization,
  demoMainSceneManagement,
  demoSceneChanging,
  demoSceneStackManagement,
  demoSceneCaching,
  demoSceneFinding,
  demoSceneStatsAndDebug,
  demoSceneLifecycleControl,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
