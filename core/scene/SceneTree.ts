/**
 * QAQ游戏引擎 - SceneTree 场景管理器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 场景系统的核心管理器，类似于Godot的SceneTree
 * - 管理当前活动场景和场景切换
 * - 提供场景栈管理和场景生命周期控制
 * - 与Engine深度集成，统一管理场景渲染
 * - 支持主场景和子场景的层级管理
 * - 实现场景的异步加载和切换
 *
 * 架构设计:
 * - 单例模式管理全局场景状态
 * - 场景栈支持场景的推入和弹出
 * - 完整的场景生命周期管理
 * - 与Engine渲染循环集成
 *
 * 核心功能:
 * - changeScene() - 切换场景
 * - getCurrentScene() - 获取当前场景
 * - pushScene() / popScene() - 场景栈管理
 * - 场景预加载和缓存
 */

import Scene, { SceneState, SceneType } from './Scene'
import ResourceLoader from '../resources/ResourceLoader'
import Node from '../nodes/Node'
import type { PropertyInfo } from '../../types/core'
import { SceneChangeMode } from './types'
import  type { SceneChangeOptions } from  './types'

// 使用类型导入避免循环依赖
type Engine = any

// ============================================================================
// SceneTree相关接口
// ============================================================================

/**
 * 场景栈项接口
 */
export interface SceneStackItem {
  /** 场景实例 */
  scene: Scene
  /** 场景路径 */
  path: string
  /** 推入时间 */
  pushedAt: number
  /** 场景数据 */
  data?: any
}

/**
 * 场景统计信息接口
 */
export interface SceneTreeStats {
  /** 当前场景数量 */
  sceneCount: number
  /** 场景栈深度 */
  stackDepth: number
  /** 总节点数量 */
  totalNodes: number
  /** 内存使用量估算 */
  memoryUsage: number
  /** 运行时间 */
  uptime: number
}

// ============================================================================
// SceneTree 类实现
// ============================================================================

/**
 * SceneTree 类 - 场景管理器
 *
 * 主要功能:
 * 1. 管理当前活动场景
 * 2. 场景切换和过渡效果
 * 3. 场景栈管理
 * 4. 场景生命周期控制
 * 5. 与Engine集成
 */
export class SceneTree {
  // ========================================================================
  // 私有属性 - 场景管理状态
  // ========================================================================

  /** 单例实例 */
  private static _instance: SceneTree | null = null

  /** 当前活动场景 */
  private _currentScene: Scene | null = null

  /** 主场景 */
  private _mainScene: Scene | null = null

  /** 场景栈 */
  private _sceneStack: SceneStackItem[] = []

  /** 场景缓存 */
  private _sceneCache: Map<string, Scene> = new Map()

  /** 是否正在切换场景 */
  private _isChangingScene: boolean = false

  /** 场景树启动时间 */
  private _startTime: number = 0

  /** 是否已初始化 */
  private _initialized: boolean = false

  /** Engine实例引用 */
  private _engine: Engine | null = null

  /** 场景切换队列 */
  private _changeQueue: Array<{
    scenePath: string
    options: SceneChangeOptions
    resolve: (scene: Scene) => void
    reject: (error: Error) => void
  }> = []

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 私有构造函数 - 单例模式
   */
  private constructor() {
    this._startTime = Date.now()
  }

  /**
   * 获取SceneTree单例实例
   * @returns SceneTree实例
   */
  static getInstance(): SceneTree {
    if (!SceneTree._instance) {
      SceneTree._instance = new SceneTree()
    }
    return SceneTree._instance
  }

  /**
   * 初始化SceneTree
   * @param engine Engine实例
   */
  initialize(engine: Engine): void {
    if (this._initialized) {
      console.warn('SceneTree already initialized')
      return
    }

    this._engine = engine
    this._initialized = true

    console.log('✅ SceneTree initialized')
  }

  /**
   * 检查是否已初始化
   */
  private ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error('SceneTree not initialized. Call initialize() first.')
    }
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取当前活动场景
   * @returns 当前场景
   */
  get currentScene(): Scene | null {
    return this._currentScene
  }

  /**
   * 获取主场景
   * @returns 主场景
   */
  get mainScene(): Scene | null {
    return this._mainScene
  }

  /**
   * 获取场景栈深度
   * @returns 栈深度
   */
  get stackDepth(): number {
    return this._sceneStack.length
  }

  /**
   * 获取是否正在切换场景
   * @returns 是否正在切换
   */
  get isChangingScene(): boolean {
    return this._isChangingScene
  }

  /**
   * 获取运行时间
   * @returns 运行时间（毫秒）
   */
  get uptime(): number {
    return Date.now() - this._startTime
  }

  // ========================================================================
  // 核心场景管理方法
  // ========================================================================

  /**
   * 设置主场景
   * @param scene 主场景实例
   */
  async setMainScene(scene: Scene): Promise<void> {
    this.ensureInitialized()

    if (this._mainScene) {
      await this._mainScene.unload()
    }

    this._mainScene = scene
    scene.isMainScene = true
    scene.sceneType = SceneType.MAIN

    // 如果没有当前场景，将主场景设为当前场景
    if (!this._currentScene) {
      await this.setCurrentScene(scene)
    }

    console.log(`✅ Main scene set: ${scene.name}`)
  }

  /**
   * 设置当前场景（内部方法）
   * @param scene 场景实例
   */
  private async setCurrentScene(scene: Scene): Promise<void> {
    // 卸载当前场景
    if (this._currentScene && this._currentScene !== scene) {
      await this._currentScene.unload()
    }

    this._currentScene = scene

    // 确保场景已加载并启动
    if (!scene.isLoaded()) {
      await scene.load()
    }

    if (!scene.isRunning()) {
      scene.start()
    }

    // 将场景添加到Engine的渲染树
    if (this._engine) {
      // 这里需要Engine提供setRootNode方法，暂时注释
      // this._engine.setRootNode(scene)
      console.log(`🎬 Scene set as current: ${scene.name}`)
    }
  }

  /**
   * 切换场景
   * @param scenePath 场景路径或Scene实例
   * @param options 切换选项
   * @returns 切换后的场景
   */
  async changeScene(
    scenePath: string | Scene,
    options: SceneChangeOptions = {}
  ): Promise<Scene> {
    this.ensureInitialized()

    // 如果正在切换场景，加入队列
    if (this._isChangingScene) {
      return new Promise((resolve, reject) => {
        if (typeof scenePath === 'string') {
          this._changeQueue.push({
            scenePath,
            options,
            resolve,
            reject
          })
        } else {
          reject(new Error('Scene instance not supported in queue'))
        }
      })
    }

    this._isChangingScene = true

    try {
      let targetScene: Scene

      // 获取目标场景
      if (typeof scenePath === 'string') {
        targetScene = await this.loadScene(scenePath)
      } else {
        targetScene = scenePath
      }

      // 执行场景切换
      await this.performSceneChange(targetScene, options)

      // 处理队列中的下一个切换请求
      this.processChangeQueue()

      return targetScene

    } catch (error) {
      this._isChangingScene = false

      if (options.onError) {
        options.onError(error as Error)
      }

      throw error
    }
  }

  /**
   * 执行场景切换
   * @param targetScene 目标场景
   * @param options 切换选项
   */
  private async performSceneChange(
    targetScene: Scene,
    options: SceneChangeOptions
  ): Promise<void> {
    const currentScene = this._currentScene

    try {
      // 执行自定义过渡
      if (options.customTransition) {
        await options.customTransition(currentScene, targetScene)
      } else {
        // 执行默认过渡
        await this.performDefaultTransition(currentScene, targetScene, options)
      }

      // 设置新的当前场景
      await this.setCurrentScene(targetScene)

      // 如果不保留当前场景，将其从栈中移除
      if (!options.keepCurrent && currentScene) {
        this.removeFromStack(currentScene)
      }

      this._isChangingScene = false

      if (options.onComplete) {
        options.onComplete()
      }

      console.log(`✅ Scene changed to: ${targetScene.name}`)

    } catch (error) {
      this._isChangingScene = false
      throw error
    }
  }

  /**
   * 执行默认场景过渡
   * @param from 源场景
   * @param to 目标场景
   * @param options 切换选项
   */
  private async performDefaultTransition(
    from: Scene | null,
    to: Scene,
    options: SceneChangeOptions
  ): Promise<void> {
    const mode = options.mode || SceneChangeMode.IMMEDIATE
    const duration = options.duration || 300

    switch (mode) {
      case SceneChangeMode.IMMEDIATE:
        // 立即切换，无过渡效果
        break

      case SceneChangeMode.FADE:
        // 淡入淡出效果
        await this.performFadeTransition(from, to, duration)
        break

      case SceneChangeMode.SLIDE:
        // 推拉效果
        await this.performSlideTransition(from, to, duration)
        break

      default:
        // 默认立即切换
        break
    }
  }

  /**
   * 执行淡入淡出过渡
   * @param from 源场景
   * @param to 目标场景
   * @param duration 过渡时间
   */
  private async performFadeTransition(
    from: Scene | null,
    to: Scene,
    duration: number
  ): Promise<void> {
    // 这里可以实现具体的淡入淡出效果
    // 目前使用简单的延时模拟
    return new Promise(resolve => {
      setTimeout(resolve, duration)
    })
  }

  /**
   * 执行推拉过渡
   * @param from 源场景
   * @param to 目标场景
   * @param duration 过渡时间
   */
  private async performSlideTransition(
    from: Scene | null,
    to: Scene,
    duration: number
  ): Promise<void> {
    // 这里可以实现具体的推拉效果
    // 目前使用简单的延时模拟
    return new Promise(resolve => {
      setTimeout(resolve, duration)
    })
  }

  // ========================================================================
  // 场景栈管理
  // ========================================================================

  /**
   * 推入场景到栈
   * @param scene 场景实例
   * @param scenePath 场景路径
   * @param data 场景数据
   */
  pushScene(scene: Scene, scenePath: string = '', data?: any): void {
    const stackItem: SceneStackItem = {
      scene,
      path: scenePath,
      pushedAt: Date.now(),
      data
    }

    this._sceneStack.push(stackItem)
    console.log(`📚 Scene pushed to stack: ${scene.name} (depth: ${this._sceneStack.length})`)
  }

  /**
   * 从栈弹出场景
   * @returns 弹出的场景栈项
   */
  popScene(): SceneStackItem | null {
    const stackItem = this._sceneStack.pop()

    if (stackItem) {
      console.log(`📚 Scene popped from stack: ${stackItem.scene.name} (depth: ${this._sceneStack.length})`)
    }

    return stackItem || null
  }

  /**
   * 从栈中移除指定场景
   * @param scene 要移除的场景
   */
  private removeFromStack(scene: Scene): void {
    const index = this._sceneStack.findIndex(item => item.scene === scene)
    if (index !== -1) {
      this._sceneStack.splice(index, 1)
      console.log(`📚 Scene removed from stack: ${scene.name}`)
    }
  }

  /**
   * 获取栈顶场景
   * @returns 栈顶场景栈项
   */
  peekScene(): SceneStackItem | null {
    return this._sceneStack.length > 0 ? this._sceneStack[this._sceneStack.length - 1] : null
  }

  /**
   * 清空场景栈
   */
  clearStack(): void {
    this._sceneStack.length = 0
    console.log('📚 Scene stack cleared')
  }

  /**
   * 返回到上一个场景
   * @param options 切换选项
   * @returns 返回的场景
   */
  async goBack(options: SceneChangeOptions = {}): Promise<Scene | null> {
    const stackItem = this.popScene()

    if (stackItem) {
      return await this.changeScene(stackItem.scene, options)
    }

    return null
  }

  // ========================================================================
  // 场景加载和缓存管理
  // ========================================================================

  /**
   * 加载场景
   * @param scenePath 场景路径
   * @returns 加载的场景
   */
  async loadScene(scenePath: string): Promise<Scene> {
    // 检查缓存
    if (this._sceneCache.has(scenePath)) {
      const cachedScene = this._sceneCache.get(scenePath)!
      console.log(`📦 Scene loaded from cache: ${scenePath}`)
      return cachedScene
    }

    // 这里应该实现实际的场景文件加载
    // 目前创建一个基础场景作为示例
    const scene = new Scene(this.getSceneNameFromPath(scenePath))
    scene.scenePath = scenePath

    // 缓存场景
    this._sceneCache.set(scenePath, scene)

    console.log(`📦 Scene loaded: ${scenePath}`)
    return scene
  }

  /**
   * 预加载场景
   * @param scenePath 场景路径
   * @returns 预加载的场景
   */
  async preloadScene(scenePath: string): Promise<Scene> {
    return await this.loadScene(scenePath)
  }

  /**
   * 批量预加载场景
   * @param scenePaths 场景路径数组
   * @param onProgress 进度回调
   * @returns 预加载的场景数组
   */
  async preloadScenes(
    scenePaths: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<Scene[]> {
    const scenes: Scene[] = []

    for (let i = 0; i < scenePaths.length; i++) {
      const scene = await this.preloadScene(scenePaths[i])
      scenes.push(scene)

      if (onProgress) {
        onProgress(i + 1, scenePaths.length)
      }
    }

    return scenes
  }

  /**
   * 从路径获取场景名称
   * @param scenePath 场景路径
   * @returns 场景名称
   */
  private getSceneNameFromPath(scenePath: string): string {
    const parts = scenePath.split('/')
    const fileName = parts[parts.length - 1]
    return fileName.replace(/\.[^/.]+$/, '') // 移除扩展名
  }

  /**
   * 清除场景缓存
   * @param scenePath 可选的特定场景路径
   */
  clearSceneCache(scenePath?: string): void {
    if (scenePath) {
      this._sceneCache.delete(scenePath)
      console.log(`🗑️ Scene cache cleared for: ${scenePath}`)
    } else {
      this._sceneCache.clear()
      console.log('🗑️ All scene cache cleared')
    }
  }

  // ========================================================================
  // 场景切换队列处理
  // ========================================================================

  /**
   * 处理场景切换队列
   */
  private async processChangeQueue(): Promise<void> {
    if (this._changeQueue.length === 0) {
      return
    }

    const nextChange = this._changeQueue.shift()!

    try {
      const scene = await this.changeScene(nextChange.scenePath, nextChange.options)
      nextChange.resolve(scene)
    } catch (error) {
      nextChange.reject(error as Error)
    }
  }

  // ========================================================================
  // 场景查找和管理
  // ========================================================================

  /**
   * 根据名称查找场景
   * @param name 场景名称
   * @returns 找到的场景
   */
  findSceneByName(name: string): Scene | null {
    // 检查当前场景
    if (this._currentScene && this._currentScene.name === name) {
      return this._currentScene
    }

    // 检查场景栈
    for (const stackItem of this._sceneStack) {
      if (stackItem.scene.name === name) {
        return stackItem.scene
      }
    }

    // 检查缓存
    for (const scene of this._sceneCache.values()) {
      if (scene.name === name) {
        return scene
      }
    }

    return null
  }

  /**
   * 根据路径查找场景
   * @param path 场景路径
   * @returns 找到的场景
   */
  findSceneByPath(path: string): Scene | null {
    return this._sceneCache.get(path) || null
  }

  /**
   * 获取所有活动场景
   * @returns 活动场景数组
   */
  getAllActiveScenes(): Scene[] {
    const scenes: Scene[] = []

    if (this._currentScene) {
      scenes.push(this._currentScene)
    }

    this._sceneStack.forEach(item => {
      if (!scenes.includes(item.scene)) {
        scenes.push(item.scene)
      }
    })

    return scenes
  }

  // ========================================================================
  // 统计和工具方法
  // ========================================================================

  /**
   * 获取场景树统计信息
   * @returns 统计信息
   */
  getStats(): SceneTreeStats {
    let totalNodes = 0
    let memoryUsage = 0

    // 计算所有活动场景的节点数和内存使用
    const activeScenes = this.getAllActiveScenes()
    activeScenes.forEach(scene => {
      const sceneStats = scene.getSceneStats()
      totalNodes += sceneStats.nodeCount
      memoryUsage += sceneStats.memoryUsage || 0
    })

    return {
      sceneCount: activeScenes.length,
      stackDepth: this._sceneStack.length,
      totalNodes,
      memoryUsage,
      uptime: this.uptime
    }
  }

  /**
   * 获取场景缓存统计
   * @returns 缓存统计
   */
  getCacheStats(): { count: number, paths: string[], memoryUsage: number } {
    let memoryUsage = 0

    this._sceneCache.forEach(scene => {
      const sceneStats = scene.getSceneStats()
      memoryUsage += sceneStats.memoryUsage || 0
    })

    return {
      count: this._sceneCache.size,
      paths: Array.from(this._sceneCache.keys()),
      memoryUsage
    }
  }

  /**
   * 暂停所有场景
   */
  pauseAll(): void {
    const activeScenes = this.getAllActiveScenes()
    activeScenes.forEach(scene => {
      if (scene.isRunning()) {
        scene.pause()
      }
    })

    console.log('⏸️ All scenes paused')
  }

  /**
   * 恢复所有场景
   */
  resumeAll(): void {
    const activeScenes = this.getAllActiveScenes()
    activeScenes.forEach(scene => {
      if (scene.isInState(SceneState.PAUSED)) {
        scene.resume()
      }
    })

    console.log('▶️ All scenes resumed')
  }

  /**
   * 停止所有场景
   */
  stopAll(): void {
    const activeScenes = this.getAllActiveScenes()
    activeScenes.forEach(scene => {
      if (scene.isRunning() || scene.isInState(SceneState.PAUSED)) {
        scene.stop()
      }
    })

    console.log('⏹️ All scenes stopped')
  }

  /**
   * 卸载所有场景
   */
  async unloadAll(): Promise<void> {
    const activeScenes = this.getAllActiveScenes()

    for (const scene of activeScenes) {
      await scene.unload()
    }

    this._currentScene = null
    this._mainScene = null
    this.clearStack()
    this.clearSceneCache()

    console.log('🗑️ All scenes unloaded')
  }

  /**
   * 重新加载当前场景
   * @param options 切换选项
   * @returns 重新加载的场景
   */
  async reloadCurrentScene(options: SceneChangeOptions = {}): Promise<Scene | null> {
    if (!this._currentScene) {
      return null
    }

    const scenePath = this._currentScene.scenePath
    if (!scenePath) {
      throw new Error('Current scene has no path, cannot reload')
    }

    // 清除缓存中的当前场景
    this.clearSceneCache(scenePath)

    // 重新加载场景
    return await this.changeScene(scenePath, options)
  }

  /**
   * 检查场景是否存在于栈中
   * @param scene 场景实例
   * @returns 是否存在
   */
  isSceneInStack(scene: Scene): boolean {
    return this._sceneStack.some(item => item.scene === scene)
  }

  /**
   * 获取场景在栈中的位置
   * @param scene 场景实例
   * @returns 栈中的索引，-1表示不在栈中
   */
  getSceneStackIndex(scene: Scene): number {
    return this._sceneStack.findIndex(item => item.scene === scene)
  }

  /**
   * 清理和销毁SceneTree
   */
  async destroy(): Promise<void> {
    console.log('🗑️ Destroying SceneTree...')

    // 卸载所有场景
    await this.unloadAll()

    // 清理队列
    this._changeQueue.length = 0

    // 重置状态
    this._initialized = false
    this._engine = null

    console.log('✅ SceneTree destroyed')
  }

  /**
   * 打印场景树状态（调试用）
   */
  printStatus(): void {
    console.log('📊 SceneTree Status:')
    console.log(`   Current Scene: ${this._currentScene?.name || 'None'}`)
    console.log(`   Main Scene: ${this._mainScene?.name || 'None'}`)
    console.log(`   Stack Depth: ${this._sceneStack.length}`)
    console.log(`   Cache Size: ${this._sceneCache.size}`)
    console.log(`   Is Changing: ${this._isChangingScene}`)
    console.log(`   Queue Length: ${this._changeQueue.length}`)
    console.log(`   Uptime: ${(this.uptime / 1000).toFixed(2)}s`)

    if (this._sceneStack.length > 0) {
      console.log('   Scene Stack:')
      this._sceneStack.forEach((item, index) => {
        console.log(`     ${index}: ${item.scene.name} (${item.path})`)
      })
    }

    if (this._sceneCache.size > 0) {
      console.log('   Scene Cache:')
      this._sceneCache.forEach((scene, path) => {
        console.log(`     ${path}: ${scene.name}`)
      })
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default SceneTree
