/**
 * QAQ游戏引擎 - 编辑器系统演示
 * 
 * 展示如何使用编辑器/运行时模式分离系统
 */

import EditorSystem from '../core/editor/EditorSystem'
import Scene from '../core/nodes/Scene'
import Node3D from '../core/nodes/Node3D'
import MeshInstance3D from '../core/nodes/MeshInstance3D'
import AnimationPlayer from '../core/nodes/animation/AnimationPlayer'

// ============================================================================
// 编辑器系统演示类
// ============================================================================

export class EditorSystemDemo {
  private editorSystem: EditorSystem
  private demoScene: Scene | null = null

  constructor() {
    // 创建编辑器系统实例
    this.editorSystem = new EditorSystem({
      autoSaveInterval: 10000, // 10秒自动保存
      maxUndoSteps: 50,
      maxSnapshots: 20,
      enableStateTracking: true,
      defaultScenePath: './demo-scenes/'
    })

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听场景事件
    this.editorSystem.connect('scene_created', (scene: Scene) => {
      console.log('🎬 场景创建事件:', scene.name)
    })

    this.editorSystem.connect('scene_loaded', (path: string, scene: Scene) => {
      console.log('📂 场景加载事件:', path, scene.name)
    })

    this.editorSystem.connect('scene_saved', (path: string, scene: Scene) => {
      console.log('💾 场景保存事件:', path, scene.name)
    })

    // 监听模式切换事件
    this.editorSystem.connect('mode_switched', (fromMode: string, toMode: string) => {
      console.log('🔄 模式切换事件:', fromMode, '->', toMode)
    })

    // 监听自动保存事件
    this.editorSystem.connect('auto_save_performed', (path: string) => {
      console.log('🔄 自动保存执行:', path)
    })
  }

  /**
   * 演示1: 创建和编辑场景
   */
  async demonstrateSceneCreation(): Promise<void> {
    console.log('\n🎬 === 演示1: 创建和编辑场景 ===')

    // 创建新场景
    const createResult = await this.editorSystem.createNewScene('DemoScene')
    if (!createResult.success) {
      console.error('创建场景失败:', createResult.message)
      return
    }

    this.demoScene = createResult.data as Scene
    console.log('✅ 场景创建成功:', this.demoScene.name)

    // 添加一些节点到场景
    await this.addDemoNodes()

    // 保存场景
    const saveResult = await this.editorSystem.saveScene('./demo-scenes/demo-scene.json')
    if (saveResult.success) {
      console.log('✅ 场景保存成功')
    } else {
      console.error('场景保存失败:', saveResult.message)
    }
  }

  /**
   * 添加演示节点
   */
  private async addDemoNodes(): Promise<void> {
    if (!this.demoScene) return

    console.log('➕ 添加演示节点...')

    // 创建根节点
    const rootNode = new Node3D('Root')
    const addRootResult = this.editorSystem.addNodeToScene(rootNode)
    console.log('添加根节点:', addRootResult.message)

    // 创建角色节点
    const characterNode = new MeshInstance3D('Character')
    characterNode.position = { x: 0, y: 0, z: 0 }
    characterNode.scale = { x: 1, y: 1, z: 1 }
    const addCharacterResult = this.editorSystem.addNodeToScene(characterNode, rootNode)
    console.log('添加角色节点:', addCharacterResult.message)

    // 创建动画播放器
    const animationPlayer = new AnimationPlayer('CharacterAnimator')
    const addAnimatorResult = this.editorSystem.addNodeToScene(animationPlayer, characterNode)
    console.log('添加动画播放器:', addAnimatorResult.message)

    // 创建环境节点
    const environmentNode = new Node3D('Environment')
    const addEnvResult = this.editorSystem.addNodeToScene(environmentNode, rootNode)
    console.log('添加环境节点:', addEnvResult.message)

    console.log('✅ 演示节点添加完成')
  }

  /**
   * 演示2: 模式切换
   */
  async demonstrateModeSwitching(): Promise<void> {
    console.log('\n🔄 === 演示2: 模式切换 ===')

    console.log('当前模式:', this.editorSystem.getCurrentMode())

    // 切换到播放模式
    console.log('🎮 切换到播放模式...')
    const playResult = await this.editorSystem.enterPlayMode()
    console.log('播放模式结果:', playResult.message)
    console.log('当前模式:', this.editorSystem.getCurrentMode())

    // 等待一段时间模拟游戏运行
    await this.sleep(2000)

    // 暂停播放模式
    console.log('⏸️ 暂停播放模式...')
    const pauseResult = await this.editorSystem.pausePlayMode()
    console.log('暂停结果:', pauseResult.message)
    console.log('当前模式:', this.editorSystem.getCurrentMode())

    // 等待一段时间
    await this.sleep(1000)

    // 切换回编辑器模式
    console.log('📝 切换回编辑器模式...')
    const editorResult = await this.editorSystem.enterEditorMode()
    console.log('编辑器模式结果:', editorResult.message)
    console.log('当前模式:', this.editorSystem.getCurrentMode())
  }

  /**
   * 演示3: 撤销/重做功能
   */
  async demonstrateUndoRedo(): Promise<void> {
    console.log('\n↶ === 演示3: 撤销/重做功能 ===')

    if (!this.demoScene) {
      console.log('需要先创建场景')
      return
    }

    // 执行一些操作
    console.log('执行一些编辑操作...')

    // 添加节点
    const testNode1 = new Node3D('TestNode1')
    this.editorSystem.addNodeToScene(testNode1)
    console.log('✅ 添加 TestNode1')

    const testNode2 = new Node3D('TestNode2')
    this.editorSystem.addNodeToScene(testNode2)
    console.log('✅ 添加 TestNode2')

    const testNode3 = new Node3D('TestNode3')
    this.editorSystem.addNodeToScene(testNode3)
    console.log('✅ 添加 TestNode3')

    console.log('当前可撤销:', this.editorSystem.canUndo())
    console.log('当前可重做:', this.editorSystem.canRedo())

    // 执行撤销操作
    console.log('\n执行撤销操作...')
    for (let i = 0; i < 2; i++) {
      const undoResult = this.editorSystem.undo()
      console.log(`撤销 ${i + 1}:`, undoResult.message)
    }

    console.log('撤销后 - 可撤销:', this.editorSystem.canUndo())
    console.log('撤销后 - 可重做:', this.editorSystem.canRedo())

    // 执行重做操作
    console.log('\n执行重做操作...')
    const redoResult = this.editorSystem.redo()
    console.log('重做:', redoResult.message)

    console.log('重做后 - 可撤销:', this.editorSystem.canUndo())
    console.log('重做后 - 可重做:', this.editorSystem.canRedo())
  }

  /**
   * 演示4: 场景序列化
   */
  async demonstrateSerialization(): Promise<void> {
    console.log('\n📦 === 演示4: 场景序列化 ===')

    if (!this.demoScene) {
      console.log('需要先创建场景')
      return
    }

    // 保存当前场景
    console.log('保存当前场景...')
    const saveResult = await this.editorSystem.saveScene('./demo-scenes/serialization-test.json')
    console.log('保存结果:', saveResult.message)

    // 创建新场景
    console.log('创建新的空场景...')
    await this.editorSystem.createNewScene('EmptyScene')

    // 加载之前保存的场景
    console.log('加载之前保存的场景...')
    const loadResult = await this.editorSystem.loadScene('./demo-scenes/serialization-test.json')
    console.log('加载结果:', loadResult.message)

    if (loadResult.success) {
      const loadedScene = loadResult.data as Scene
      console.log('✅ 场景加载成功:', loadedScene.name)
      console.log('场景子节点数量:', loadedScene.children.length)
    }
  }

  /**
   * 演示5: 状态管理
   */
  async demonstrateStateManagement(): Promise<void> {
    console.log('\n📊 === 演示5: 状态管理 ===')

    // 这里可以展示状态快照、变更跟踪等功能
    console.log('当前编辑器状态:')
    console.log('- 当前场景:', this.editorSystem.getCurrentScene()?.name || 'None')
    console.log('- 当前模式:', this.editorSystem.getCurrentMode())
    console.log('- 未保存更改:', this.editorSystem.hasUnsavedChanges())
    console.log('- 可撤销操作:', this.editorSystem.canUndo())
    console.log('- 可重做操作:', this.editorSystem.canRedo())
  }

  /**
   * 运行完整演示
   */
  async runFullDemo(): Promise<void> {
    console.log('🚀 开始QAQ编辑器系统完整演示...\n')

    try {
      await this.demonstrateSceneCreation()
      await this.sleep(1000)

      await this.demonstrateModeSwitching()
      await this.sleep(1000)

      await this.demonstrateUndoRedo()
      await this.sleep(1000)

      await this.demonstrateSerialization()
      await this.sleep(1000)

      await this.demonstrateStateManagement()

      console.log('\n🎉 编辑器系统演示完成！')

    } catch (error) {
      console.error('❌ 演示过程中发生错误:', error)
    }
  }

  /**
   * 工具方法：等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.editorSystem.destroy()
    console.log('🧹 演示资源已清理')
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 在浏览器控制台中运行编辑器系统演示
 */
export async function runEditorSystemDemo(): Promise<void> {
  const demo = new EditorSystemDemo()
  
  try {
    await demo.runFullDemo()
  } finally {
    // 清理资源
    setTimeout(() => {
      demo.destroy()
    }, 5000) // 5秒后清理
  }
}

// 导出到全局，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).runEditorSystemDemo = runEditorSystemDemo
  console.log('💡 在控制台中运行 window.runEditorSystemDemo() 来开始演示')
}

export default EditorSystemDemo
