/**
 * QAQ游戏引擎 - 编辑器模式管理器
 * 
 * 负责管理编辑器模式和运行时模式的切换，确保状态隔离和数据完整性
 */

import { QaqObject } from '../object/QaqObject'
import { SceneSerializer } from './SceneSerializer'
import { StateManager } from './StateManager'
import Scene from '../nodes/Scene'

// ============================================================================
// 模式枚举和接口定义
// ============================================================================

/**
 * 引擎运行模式
 */
export enum EngineMode {
  /** 编辑器模式 - 可以修改场景，不运行游戏逻辑 */
  EDITOR = 'editor',
  /** 播放模式 - 运行游戏逻辑，修改不会保存到编辑器 */
  PLAY = 'play',
  /** 暂停模式 - 游戏逻辑暂停，但保持播放状态 */
  PAUSE = 'pause'
}

/**
 * 模式切换事件数据
 */
export interface ModeChangeEvent {
  fromMode: EngineMode
  toMode: EngineMode
  timestamp: number
  success: boolean
  error?: string
}

/**
 * 编辑器状态快照
 */
export interface EditorSnapshot {
  sceneData: any
  timestamp: number
  version: string
  metadata: {
    nodeCount: number
    sceneSize: number
    checksum: string
  }
}

// ============================================================================
// 编辑器模式管理器类
// ============================================================================

export class EditorModeManager extends QaqObject {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 当前运行模式 */
  private _currentMode: EngineMode = EngineMode.EDITOR

  /** 场景序列化器 */
  private _sceneSerializer: SceneSerializer

  /** 状态管理器 */
  private _stateManager: StateManager

  /** 当前活动场景 */
  private _currentScene: Scene | null = null

  /** 编辑器状态快照 */
  private _editorSnapshot: EditorSnapshot | null = null

  /** 运行时场景实例 */
  private _runtimeScene: Scene | null = null

  /** 模式切换历史 */
  private _modeHistory: ModeChangeEvent[] = []

  /** 是否正在切换模式 */
  private _isSwitching: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  constructor() {
    super()
    this._sceneSerializer = new SceneSerializer()
    this._stateManager = new StateManager()
    this.initializeSignals()
  }

  /**
   * 初始化信号系统
   */
  private initializeSignals(): void {
    this.addUserSignal('mode_changed', ['from_mode', 'to_mode', 'success'])
    this.addUserSignal('mode_change_started', ['from_mode', 'to_mode'])
    this.addUserSignal('mode_change_failed', ['from_mode', 'to_mode', 'error'])
    this.addUserSignal('editor_state_saved', ['snapshot'])
    this.addUserSignal('editor_state_restored', ['snapshot'])
  }

  // ========================================================================
  // 公共API - 模式管理
  // ========================================================================

  /**
   * 获取当前运行模式
   */
  getCurrentMode(): EngineMode {
    return this._currentMode
  }

  /**
   * 检查是否在编辑器模式
   */
  isEditorMode(): boolean {
    return this._currentMode === EngineMode.EDITOR
  }

  /**
   * 检查是否在播放模式
   */
  isPlayMode(): boolean {
    return this._currentMode === EngineMode.PLAY
  }

  /**
   * 检查是否在暂停模式
   */
  isPauseMode(): boolean {
    return this._currentMode === EngineMode.PAUSE
  }

  /**
   * 检查是否正在切换模式
   */
  isSwitching(): boolean {
    return this._isSwitching
  }

  /**
   * 设置当前场景
   */
  setCurrentScene(scene: Scene): void {
    this._currentScene = scene
    console.log(`🎬 设置当前场景: ${scene.name}`)
  }

  // ========================================================================
  // 模式切换核心方法
  // ========================================================================

  /**
   * 切换到播放模式
   */
  async switchToPlayMode(): Promise<boolean> {
    if (this._currentMode === EngineMode.PLAY) {
      console.warn('已经在播放模式中')
      return true
    }

    return this.performModeSwitch(EngineMode.PLAY)
  }

  /**
   * 切换到编辑器模式
   */
  async switchToEditorMode(): Promise<boolean> {
    if (this._currentMode === EngineMode.EDITOR) {
      console.warn('已经在编辑器模式中')
      return true
    }

    return this.performModeSwitch(EngineMode.EDITOR)
  }

  /**
   * 切换到暂停模式
   */
  async switchToPauseMode(): Promise<boolean> {
    if (this._currentMode !== EngineMode.PLAY) {
      console.warn('只能从播放模式切换到暂停模式')
      return false
    }

    return this.performModeSwitch(EngineMode.PAUSE)
  }

  /**
   * 执行模式切换的核心逻辑
   */
  private async performModeSwitch(targetMode: EngineMode): Promise<boolean> {
    if (this._isSwitching) {
      console.warn('正在切换模式中，请等待完成')
      return false
    }

    const fromMode = this._currentMode
    this._isSwitching = true

    try {
      console.log(`🔄 开始模式切换: ${fromMode} -> ${targetMode}`)
      this.emit('mode_change_started', fromMode, targetMode)

      // 执行具体的切换逻辑
      let success = false
      
      switch (targetMode) {
        case EngineMode.PLAY:
          success = await this.enterPlayMode()
          break
        case EngineMode.EDITOR:
          success = await this.enterEditorMode()
          break
        case EngineMode.PAUSE:
          success = await this.enterPauseMode()
          break
      }

      if (success) {
        this._currentMode = targetMode
        this.recordModeChange(fromMode, targetMode, true)
        this.emit('mode_changed', fromMode, targetMode, true)
        console.log(`✅ 模式切换成功: ${fromMode} -> ${targetMode}`)
      } else {
        this.emit('mode_change_failed', fromMode, targetMode, 'Mode switch failed')
        console.error(`❌ 模式切换失败: ${fromMode} -> ${targetMode}`)
      }

      return success

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.recordModeChange(fromMode, targetMode, false, errorMessage)
      this.emit('mode_change_failed', fromMode, targetMode, errorMessage)
      console.error(`❌ 模式切换异常: ${fromMode} -> ${targetMode}`, error)
      return false

    } finally {
      this._isSwitching = false
    }
  }

  // ========================================================================
  // 具体模式切换实现
  // ========================================================================

  /**
   * 进入播放模式
   */
  private async enterPlayMode(): Promise<boolean> {
    if (!this._currentScene) {
      throw new Error('没有当前场景，无法进入播放模式')
    }

    try {
      // 1. 保存编辑器状态快照
      console.log('📸 保存编辑器状态快照...')
      this._editorSnapshot = await this.createEditorSnapshot()
      this.emit('editor_state_saved', this._editorSnapshot)

      // 2. 创建运行时场景副本
      console.log('🎮 创建运行时场景副本...')
      this._runtimeScene = await this.createRuntimeSceneCopy()

      // 3. 切换到运行时场景
      console.log('🔄 切换到运行时场景...')
      await this.activateRuntimeScene()

      // 4. 启动游戏逻辑
      console.log('▶️ 启动游戏逻辑...')
      this.startGameLogic()

      return true

    } catch (error) {
      console.error('进入播放模式失败:', error)
      await this.cleanupFailedPlayMode()
      throw error
    }
  }

  /**
   * 进入编辑器模式
   */
  private async enterEditorMode(): Promise<boolean> {
    try {
      // 1. 停止游戏逻辑
      console.log('⏹️ 停止游戏逻辑...')
      this.stopGameLogic()

      // 2. 清理运行时场景
      console.log('🧹 清理运行时场景...')
      await this.cleanupRuntimeScene()

      // 3. 恢复编辑器状态
      console.log('🔄 恢复编辑器状态...')
      await this.restoreEditorState()

      // 4. 重新激活编辑器场景
      console.log('📝 重新激活编辑器场景...')
      await this.activateEditorScene()

      return true

    } catch (error) {
      console.error('进入编辑器模式失败:', error)
      throw error
    }
  }

  /**
   * 进入暂停模式
   */
  private async enterPauseMode(): Promise<boolean> {
    try {
      // 暂停游戏逻辑但保持运行时场景
      console.log('⏸️ 暂停游戏逻辑...')
      this.pauseGameLogic()
      return true

    } catch (error) {
      console.error('进入暂停模式失败:', error)
      throw error
    }
  }

  // ========================================================================
  // 状态管理辅助方法
  // ========================================================================

  /**
   * 创建编辑器状态快照
   */
  private async createEditorSnapshot(): Promise<EditorSnapshot> {
    if (!this._currentScene) {
      throw new Error('没有当前场景')
    }

    const sceneData = await this._sceneSerializer.serialize(this._currentScene)
    const serializedData = JSON.stringify(sceneData)
    
    return {
      sceneData,
      timestamp: Date.now(),
      version: '1.0.0',
      metadata: {
        nodeCount: this.countNodesInScene(this._currentScene),
        sceneSize: serializedData.length,
        checksum: this.calculateChecksum(serializedData)
      }
    }
  }

  /**
   * 创建运行时场景副本
   */
  private async createRuntimeSceneCopy(): Promise<Scene> {
    if (!this._editorSnapshot) {
      throw new Error('没有编辑器快照')
    }

    // 从快照数据反序列化创建新场景
    const runtimeScene = await this._sceneSerializer.deserialize(this._editorSnapshot.sceneData)
    runtimeScene.name = `${this._currentScene?.name}_Runtime`
    
    return runtimeScene
  }

  /**
   * 激活运行时场景
   */
  private async activateRuntimeScene(): Promise<void> {
    if (!this._runtimeScene) {
      throw new Error('没有运行时场景')
    }

    // 这里需要与引擎的场景管理系统集成
    // 暂时用日志表示
    console.log(`🎮 激活运行时场景: ${this._runtimeScene.name}`)
  }

  /**
   * 启动游戏逻辑
   */
  private startGameLogic(): void {
    // 启动物理系统、动画系统、脚本系统等
    console.log('▶️ 游戏逻辑已启动')
  }

  /**
   * 停止游戏逻辑
   */
  private stopGameLogic(): void {
    // 停止所有游戏系统
    console.log('⏹️ 游戏逻辑已停止')
  }

  /**
   * 暂停游戏逻辑
   */
  private pauseGameLogic(): void {
    // 暂停游戏系统
    console.log('⏸️ 游戏逻辑已暂停')
  }

  /**
   * 清理运行时场景
   */
  private async cleanupRuntimeScene(): Promise<void> {
    if (this._runtimeScene) {
      // 清理运行时场景资源
      this._runtimeScene.destroy()
      this._runtimeScene = null
      console.log('🧹 运行时场景已清理')
    }
  }

  /**
   * 恢复编辑器状态
   */
  private async restoreEditorState(): Promise<void> {
    if (!this._editorSnapshot) {
      console.warn('没有编辑器快照，无法恢复状态')
      return
    }

    // 从快照恢复编辑器场景
    this._currentScene = await this._sceneSerializer.deserialize(this._editorSnapshot.sceneData)
    this.emit('editor_state_restored', this._editorSnapshot)
    console.log('🔄 编辑器状态已恢复')
  }

  /**
   * 激活编辑器场景
   */
  private async activateEditorScene(): Promise<void> {
    if (!this._currentScene) {
      throw new Error('没有编辑器场景')
    }

    console.log(`📝 激活编辑器场景: ${this._currentScene.name}`)
  }

  /**
   * 清理失败的播放模式
   */
  private async cleanupFailedPlayMode(): Promise<void> {
    await this.cleanupRuntimeScene()
    this._editorSnapshot = null
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 记录模式切换历史
   */
  private recordModeChange(fromMode: EngineMode, toMode: EngineMode, success: boolean, error?: string): void {
    const event: ModeChangeEvent = {
      fromMode,
      toMode,
      timestamp: Date.now(),
      success,
      error
    }
    
    this._modeHistory.push(event)
    
    // 保持历史记录在合理范围内
    if (this._modeHistory.length > 100) {
      this._modeHistory.shift()
    }
  }

  /**
   * 计算场景中的节点数量
   */
  private countNodesInScene(scene: Scene): number {
    let count = 1 // 场景本身
    
    const countChildren = (node: any): void => {
      if (node.children) {
        count += node.children.length
        node.children.forEach(countChildren)
      }
    }
    
    countChildren(scene)
    return count
  }

  /**
   * 计算数据校验和
   */
  private calculateChecksum(data: string): string {
    // 简单的校验和算法
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString(16)
  }

  /**
   * 获取模式切换历史
   */
  getModeHistory(): ModeChangeEvent[] {
    return [...this._modeHistory]
  }

  /**
   * 获取当前编辑器快照信息
   */
  getEditorSnapshotInfo(): EditorSnapshot | null {
    return this._editorSnapshot ? { ...this._editorSnapshot } : null
  }
}

export default EditorModeManager
