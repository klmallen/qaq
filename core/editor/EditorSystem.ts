/**
 * QAQ游戏引擎 - 编辑器系统
 * 
 * 统一的编辑器接口，整合模式管理、状态管理、序列化等功能
 */

import { QaqObject } from '../object/QaqObject'
import EditorModeManager, { EngineMode } from './EditorModeManager'
import NodeReflectionSerializer from './NodeReflectionSerializer'
import StateManager from './StateManager'
import Scene from '../nodes/Scene'
import Node from '../nodes/Node'

// ============================================================================
// 编辑器接口定义
// ============================================================================

/**
 * 编辑器操作结果
 */
export interface EditorOperationResult {
  success: boolean
  message: string
  data?: any
  error?: Error
}

/**
 * 场景文件信息
 */
export interface SceneFileInfo {
  path: string
  name: string
  size: number
  modified: number
  version: string
  metadata: Record<string, any>
}

/**
 * 编辑器配置
 */
export interface EditorConfig {
  /** 自动保存间隔（毫秒） */
  autoSaveInterval: number
  /** 最大撤销步数 */
  maxUndoSteps: number
  /** 最大快照数量 */
  maxSnapshots: number
  /** 是否启用状态跟踪 */
  enableStateTracking: boolean
  /** 默认场景保存路径 */
  defaultScenePath: string
}

// ============================================================================
// 编辑器系统类
// ============================================================================

export class EditorSystem extends QaqObject {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 模式管理器 */
  private _modeManager: EditorModeManager

  /** 场景序列化器 */
  private _sceneSerializer: NodeReflectionSerializer

  /** 状态管理器 */
  private _stateManager: StateManager

  /** 当前场景 */
  private _currentScene: Scene | null = null

  /** 当前场景文件路径 */
  private _currentScenePath: string | null = null

  /** 编辑器配置 */
  private _config: EditorConfig

  /** 自动保存定时器 */
  private _autoSaveTimer: number | null = null

  /** 是否有未保存的更改 */
  private _hasUnsavedChanges: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  constructor(config?: Partial<EditorConfig>) {
    super()
    
    // 初始化子系统
    this._modeManager = new EditorModeManager()
    this._sceneSerializer = new NodeReflectionSerializer()
    this._stateManager = new StateManager()

    // 设置默认配置
    this._config = {
      autoSaveInterval: 30000, // 30秒
      maxUndoSteps: 100,
      maxSnapshots: 50,
      enableStateTracking: true,
      defaultScenePath: './scenes/',
      ...config
    }

    this.initializeSystem()
  }

  /**
   * 初始化编辑器系统
   */
  private initializeSystem(): void {
    // 配置子系统
    this._stateManager.setMaxUndoSteps(this._config.maxUndoSteps)
    this._stateManager.setMaxSnapshots(this._config.maxSnapshots)
    this._stateManager.setStateTrackingEnabled(this._config.enableStateTracking)

    // 连接信号
    this.connectSignals()

    // 启动自动保存
    if (this._config.autoSaveInterval > 0) {
      this.startAutoSave()
    }

    this.initializeEditorSignals()
    console.log('🎨 编辑器系统初始化完成')
  }

  /**
   * 初始化编辑器信号
   */
  private initializeEditorSignals(): void {
    this.addUserSignal('scene_loaded', ['scene_path', 'scene'])
    this.addUserSignal('scene_saved', ['scene_path', 'scene'])
    this.addUserSignal('scene_created', ['scene'])
    this.addUserSignal('scene_modified', ['scene'])
    this.addUserSignal('mode_switched', ['from_mode', 'to_mode'])
    this.addUserSignal('auto_save_performed', ['scene_path'])
  }

  /**
   * 连接子系统信号
   */
  private connectSignals(): void {
    // 模式管理器信号
    this._modeManager.connect('mode_changed', (fromMode: EngineMode, toMode: EngineMode, success: boolean) => {
      if (success) {
        this.emit('mode_switched', fromMode, toMode)
        console.log(`🔄 模式切换: ${fromMode} -> ${toMode}`)
      }
    })

    // 状态管理器信号
    this._stateManager.connect('state_changed', (change: any) => {
      this._hasUnsavedChanges = true
      this.emit('scene_modified', this._currentScene)
    })
  }

  // ========================================================================
  // 公共API - 场景管理
  // ========================================================================

  /**
   * 创建新场景
   */
  async createNewScene(name: string = 'NewScene'): Promise<EditorOperationResult> {
    try {
      // 检查是否有未保存的更改
      if (this._hasUnsavedChanges) {
        const shouldContinue = await this.promptSaveChanges()
        if (!shouldContinue) {
          return { success: false, message: '用户取消操作' }
        }
      }

      // 创建新场景
      const scene = new Scene(name)
      this._currentScene = scene
      this._currentScenePath = null
      this._hasUnsavedChanges = false

      // 设置到模式管理器
      this._modeManager.setCurrentScene(scene)

      // 创建初始快照
      this._stateManager.createSnapshot('Initial Scene', await this._sceneSerializer.serialize(scene), 'editor')

      this.emit('scene_created', scene)
      console.log(`🎬 创建新场景: ${name}`)

      return { success: true, message: `场景 "${name}" 创建成功`, data: scene }

    } catch (error) {
      console.error('创建场景失败:', error)
      return { 
        success: false, 
        message: `创建场景失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 加载场景文件
   */
  async loadScene(scenePath: string): Promise<EditorOperationResult> {
    try {
      // 检查是否有未保存的更改
      if (this._hasUnsavedChanges) {
        const shouldContinue = await this.promptSaveChanges()
        if (!shouldContinue) {
          return { success: false, message: '用户取消操作' }
        }
      }

      console.log(`📂 加载场景: ${scenePath}`)

      // 这里应该从文件系统加载场景数据
      // 暂时模拟加载过程
      const sceneData = await this.loadSceneFromFile(scenePath)
      const scene = await this._sceneSerializer.deserialize(sceneData)

      this._currentScene = scene
      this._currentScenePath = scenePath
      this._hasUnsavedChanges = false

      // 设置到模式管理器
      this._modeManager.setCurrentScene(scene)

      // 创建加载后快照
      this._stateManager.createSnapshot('Scene Loaded', sceneData, 'editor')

      this.emit('scene_loaded', scenePath, scene)
      console.log(`✅ 场景加载完成: ${scenePath}`)

      return { success: true, message: `场景 "${scenePath}" 加载成功`, data: scene }

    } catch (error) {
      console.error('加载场景失败:', error)
      return { 
        success: false, 
        message: `加载场景失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 保存当前场景
   */
  async saveScene(scenePath?: string): Promise<EditorOperationResult> {
    if (!this._currentScene) {
      return { success: false, message: '没有当前场景可保存' }
    }

    try {
      const savePath = scenePath || this._currentScenePath
      
      if (!savePath) {
        return { success: false, message: '请指定保存路径' }
      }

      console.log(`💾 保存场景: ${savePath}`)

      // 序列化场景
      const sceneData = await this._sceneSerializer.serialize(this._currentScene)

      // 保存到文件
      await this.saveSceneToFile(savePath, sceneData)

      this._currentScenePath = savePath
      this._hasUnsavedChanges = false

      // 创建保存后快照
      this._stateManager.createSnapshot('Scene Saved', sceneData, 'checkpoint')

      this.emit('scene_saved', savePath, this._currentScene)
      console.log(`✅ 场景保存完成: ${savePath}`)

      return { success: true, message: `场景保存到 "${savePath}"`, data: sceneData }

    } catch (error) {
      console.error('保存场景失败:', error)
      return { 
        success: false, 
        message: `保存场景失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 另存为场景
   */
  async saveSceneAs(scenePath: string): Promise<EditorOperationResult> {
    return this.saveScene(scenePath)
  }

  // ========================================================================
  // 公共API - 模式管理
  // ========================================================================

  /**
   * 切换到播放模式
   */
  async enterPlayMode(): Promise<EditorOperationResult> {
    try {
      const success = await this._modeManager.switchToPlayMode()
      
      if (success) {
        return { success: true, message: '已进入播放模式' }
      } else {
        return { success: false, message: '进入播放模式失败' }
      }

    } catch (error) {
      return { 
        success: false, 
        message: `进入播放模式失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 切换到编辑器模式
   */
  async enterEditorMode(): Promise<EditorOperationResult> {
    try {
      const success = await this._modeManager.switchToEditorMode()
      
      if (success) {
        return { success: true, message: '已进入编辑器模式' }
      } else {
        return { success: false, message: '进入编辑器模式失败' }
      }

    } catch (error) {
      return { 
        success: false, 
        message: `进入编辑器模式失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 暂停播放模式
   */
  async pausePlayMode(): Promise<EditorOperationResult> {
    try {
      const success = await this._modeManager.switchToPauseMode()
      
      if (success) {
        return { success: true, message: '播放模式已暂停' }
      } else {
        return { success: false, message: '暂停播放模式失败' }
      }

    } catch (error) {
      return { 
        success: false, 
        message: `暂停播放模式失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  // ========================================================================
  // 公共API - 撤销/重做
  // ========================================================================

  /**
   * 撤销操作
   */
  undo(): EditorOperationResult {
    if (!this._stateManager.canUndo()) {
      return { success: false, message: '没有可撤销的操作' }
    }

    const success = this._stateManager.undo()
    
    if (success) {
      this._hasUnsavedChanges = true
      return { success: true, message: '撤销操作成功' }
    } else {
      return { success: false, message: '撤销操作失败' }
    }
  }

  /**
   * 重做操作
   */
  redo(): EditorOperationResult {
    if (!this._stateManager.canRedo()) {
      return { success: false, message: '没有可重做的操作' }
    }

    const success = this._stateManager.redo()
    
    if (success) {
      this._hasUnsavedChanges = true
      return { success: true, message: '重做操作成功' }
    } else {
      return { success: false, message: '重做操作失败' }
    }
  }

  // ========================================================================
  // 公共API - 节点操作
  // ========================================================================

  /**
   * 添加节点到场景
   */
  addNodeToScene(node: Node, parent?: Node): EditorOperationResult {
    if (!this._currentScene) {
      return { success: false, message: '没有当前场景' }
    }

    try {
      const targetParent = parent || this._currentScene
      
      // 记录撤销操作
      this._stateManager.addUndoOperation(
        `添加节点 ${node.name}`,
        () => targetParent.addChild(node),
        () => targetParent.removeChild(node)
      )

      // 执行操作
      targetParent.addChild(node)
      
      // 记录状态变更
      this._stateManager.recordStateChange(
        'hierarchy',
        targetParent.getInstanceId(),
        `添加子节点 ${node.name}`,
        null,
        node.getInstanceId()
      )

      this._hasUnsavedChanges = true
      console.log(`➕ 添加节点: ${node.name} 到 ${targetParent.name}`)

      return { success: true, message: `节点 "${node.name}" 添加成功` }

    } catch (error) {
      return { 
        success: false, 
        message: `添加节点失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  /**
   * 从场景移除节点
   */
  removeNodeFromScene(node: Node): EditorOperationResult {
    if (!this._currentScene) {
      return { success: false, message: '没有当前场景' }
    }

    try {
      const parent = node.parent
      if (!parent) {
        return { success: false, message: '节点没有父节点' }
      }

      // 记录撤销操作
      this._stateManager.addUndoOperation(
        `移除节点 ${node.name}`,
        () => parent.removeChild(node),
        () => parent.addChild(node)
      )

      // 执行操作
      parent.removeChild(node)
      
      // 记录状态变更
      this._stateManager.recordStateChange(
        'hierarchy',
        parent.getInstanceId(),
        `移除子节点 ${node.name}`,
        node.getInstanceId(),
        null
      )

      this._hasUnsavedChanges = true
      console.log(`➖ 移除节点: ${node.name} 从 ${parent.name}`)

      return { success: true, message: `节点 "${node.name}" 移除成功` }

    } catch (error) {
      return { 
        success: false, 
        message: `移除节点失败: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      }
    }
  }

  // ========================================================================
  // 状态查询方法
  // ========================================================================

  /**
   * 获取当前模式
   */
  getCurrentMode(): EngineMode {
    return this._modeManager.getCurrentMode()
  }

  /**
   * 获取当前场景
   */
  getCurrentScene(): Scene | null {
    return this._currentScene
  }

  /**
   * 获取当前场景路径
   */
  getCurrentScenePath(): string | null {
    return this._currentScenePath
  }

  /**
   * 检查是否有未保存的更改
   */
  hasUnsavedChanges(): boolean {
    return this._hasUnsavedChanges
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this._stateManager.canUndo()
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this._stateManager.canRedo()
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer)
    }

    this._autoSaveTimer = window.setInterval(async () => {
      if (this._hasUnsavedChanges && this._currentScenePath) {
        console.log('🔄 执行自动保存...')
        const result = await this.saveScene()
        if (result.success) {
          this.emit('auto_save_performed', this._currentScenePath)
        }
      }
    }, this._config.autoSaveInterval)
  }

  /**
   * 停止自动保存
   */
  private stopAutoSave(): void {
    if (this._autoSaveTimer) {
      clearInterval(this._autoSaveTimer)
      this._autoSaveTimer = null
    }
  }

  /**
   * 提示保存更改
   */
  private async promptSaveChanges(): Promise<boolean> {
    // 这里应该显示一个对话框询问用户是否保存
    // 暂时返回true表示继续操作
    console.log('⚠️ 检测到未保存的更改')
    return true
  }

  /**
   * 从文件加载场景数据
   */
  private async loadSceneFromFile(scenePath: string): Promise<any> {
    // 这里应该实现实际的文件加载逻辑
    // 暂时返回模拟数据
    console.log(`📂 从文件加载场景: ${scenePath}`)
    return {
      version: '1.0.0',
      metadata: { name: 'LoadedScene', created: Date.now(), modified: Date.now() },
      root: { type: 'Scene', name: 'LoadedScene', id: 'scene_1', properties: {}, children: [] },
      resources: [],
      settings: {}
    }
  }

  /**
   * 保存场景数据到文件
   */
  private async saveSceneToFile(scenePath: string, sceneData: any): Promise<void> {
    // 这里应该实现实际的文件保存逻辑
    console.log(`💾 保存场景到文件: ${scenePath}`)
    console.log('场景数据大小:', JSON.stringify(sceneData).length, '字节')
  }

  /**
   * 销毁编辑器系统
   */
  destroy(): void {
    this.stopAutoSave()
    console.log('🎨 编辑器系统已销毁')
  }
}

export default EditorSystem
