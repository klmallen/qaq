/**
 * QAQ游戏引擎 - Scene 场景类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 场景系统的核心类，类似于Godot的Scene
 * - Scene继承自Node，作为节点树的根节点
 * - 管理场景的生命周期和状态
 * - 支持场景的保存、加载和实例化
 * - 与SceneTree深度集成
 * - 支持主场景和子场景管理
 *
 * 架构设计:
 * - Scene是特殊的Node，具有场景管理功能
 * - 支持场景预制件(Scene Prefab)机制
 * - 完整的场景生命周期管理
 * - 与Engine渲染系统集成
 *
 * 继承关系:
 * Node -> Scene
 */

import Node from '../nodes/Node'
import Engine from '../engine/Engine'
import type { PropertyInfo } from '../../types/core'

// ============================================================================
// 场景相关枚举和接口
// ============================================================================

/**
 * 场景状态枚举
 */
export enum SceneState {
  /** 未初始化 */
  UNINITIALIZED = 0,
  /** 已初始化 */
  INITIALIZED = 1,
  /** 正在加载 */
  LOADING = 2,
  /** 已加载 */
  LOADED = 3,
  /** 运行中 */
  RUNNING = 4,
  /** 已暂停 */
  PAUSED = 5,
  /** 正在卸载 */
  UNLOADING = 6,
  /** 已卸载 */
  UNLOADED = 7,
  /** 错误状态 */
  ERROR = 8
}

/**
 * 场景类型枚举
 */
export enum SceneType {
  /** 主场景 */
  MAIN = 'main',
  /** 子场景 */
  SUB = 'sub',
  /** 预制件场景 */
  PREFAB = 'prefab',
  /** 临时场景 */
  TEMPORARY = 'temporary'
}

/**
 * 场景配置接口
 */
export interface SceneConfig {
  /** 场景名称 */
  name?: string
  /** 场景类型 */
  type?: SceneType
  /** 是否自动启动 */
  autoStart?: boolean
  /** 是否持久化 */
  persistent?: boolean
  /** 场景文件路径 */
  scenePath?: string
  /** 自定义数据 */
  userData?: any
}

/**
 * 场景元数据接口
 */
export interface SceneMetadata {
  /** 场景ID */
  id: string
  /** 场景名称 */
  name: string
  /** 场景类型 */
  type: SceneType
  /** 创建时间 */
  createdAt: number
  /** 最后修改时间 */
  modifiedAt: number
  /** 场景版本 */
  version: string
  /** 场景描述 */
  description?: string
  /** 作者信息 */
  author?: string
  /** 标签 */
  tags?: string[]
}

// ============================================================================
// Scene 类实现
// ============================================================================

/**
 * Scene 类 - 场景根节点
 *
 * 主要功能:
 * 1. 作为节点树的根节点
 * 2. 管理场景生命周期
 * 3. 支持场景保存和加载
 * 4. 与SceneTree集成
 * 5. 场景状态管理
 */
export class Scene extends Node {
  // ========================================================================
  // 私有属性 - 场景状态管理
  // ========================================================================

  /** 场景状态 */
  private _state: SceneState = SceneState.UNINITIALIZED

  /** 场景类型 */
  private _sceneType: SceneType = SceneType.MAIN

  /** 场景配置 */
  private _config: SceneConfig = {}

  /** 场景元数据 */
  private _sceneMetadata: SceneMetadata

  /** 是否为主场景 */
  private _isMainScene: boolean = false

  /** 是否持久化 */
  private _persistent: boolean = false

  /** 场景文件路径 */
  private _scenePath: string = ''

  /** 父场景引用 */
  private _parentScene: Scene | null = null

  /** 子场景列表 */
  private _childScenes: Scene[] = []

  /** 场景启动时间 */
  private _startTime: number = 0

  /** 场景运行时间 */
  private _runTime: number = 0

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 场景名称，默认为'Scene'
   * @param config 场景配置
   */
  constructor(name: string = 'Scene', config: SceneConfig = {}) {
    super(name)

    // 应用配置
    this._config = { ...config }
    this._sceneType = config.type || SceneType.MAIN
    this._persistent = config.persistent || false
    this._scenePath = config.scenePath || ''

    // 初始化元数据
    this._sceneMetadata = {
      id: this.generateSceneId(),
      name: name,
      type: this._sceneType,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      version: '1.0.0'
    }

    // 初始化Scene特有的信号
    this.initializeSceneSignals()

    // 初始化Scene特有的属性
    this.initializeSceneProperties()

    // 设置状态为已初始化
    this._state = SceneState.INITIALIZED

    console.log(`✅ Scene created: ${name} (${this._sceneType})`)
  }

  /**
   * 生成唯一的场景ID
   * @returns 场景ID
   */
  private generateSceneId(): string {
    return `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 初始化Scene特有的信号
   */
  private initializeSceneSignals(): void {
    // 场景生命周期信号
    this.addSignal('scene_loaded')
    this.addSignal('scene_started')
    this.addSignal('scene_paused')
    this.addSignal('scene_resumed')
    this.addSignal('scene_stopped')
    this.addSignal('scene_unloaded')

    // 场景状态变化信号
    this.addSignal('scene_state_changed')

    // 子场景管理信号
    this.addSignal('child_scene_added')
    this.addSignal('child_scene_removed')

    // 场景错误信号
    this.addSignal('scene_error')
  }

  /**
   * 初始化Scene特有的属性
   */
  private initializeSceneProperties(): void {
    const properties: PropertyInfo[] = [
      {
        name: 'scene_type',
        type: 'enum',
        hint: '场景类型',
        className: 'SceneType'
      },
      {
        name: 'persistent',
        type: 'bool',
        hint: '是否持久化场景'
      },
      {
        name: 'scene_path',
        type: 'string',
        hint: '场景文件路径'
      },
      {
        name: 'auto_start',
        type: 'bool',
        hint: '是否自动启动'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取场景状态
   * @returns 场景状态
   */
  get state(): SceneState {
    return this._state
  }

  /**
   * 获取场景类型
   * @returns 场景类型
   */
  get sceneType(): SceneType {
    return this._sceneType
  }

  /**
   * 设置场景类型
   * @param value 场景类型
   */
  set sceneType(value: SceneType) {
    if (this._sceneType !== value) {
      this._sceneType = value
      this._sceneMetadata.type = value
      this._sceneMetadata.modifiedAt = Date.now()
    }
  }

  /**
   * 获取是否为主场景
   * @returns 是否为主场景
   */
  get isMainScene(): boolean {
    return this._isMainScene
  }

  /**
   * 设置是否为主场景
   * @param value 是否为主场景
   */
  set isMainScene(value: boolean) {
    this._isMainScene = value
  }

  /**
   * 获取是否持久化
   * @returns 是否持久化
   */
  get persistent(): boolean {
    return this._persistent
  }

  /**
   * 设置是否持久化
   * @param value 是否持久化
   */
  set persistent(value: boolean) {
    this._persistent = value
  }

  /**
   * 获取场景文件路径
   * @returns 场景文件路径
   */
  get scenePath(): string {
    return this._scenePath
  }

  /**
   * 设置场景文件路径
   * @param value 场景文件路径
   */
  set scenePath(value: string) {
    this._scenePath = value
  }

  /**
   * 获取场景元数据
   * @returns 场景元数据
   */
  get metadata(): SceneMetadata {
    return { ...this._sceneMetadata }
  }

  /**
   * 获取场景运行时间
   * @returns 运行时间（毫秒）
   */
  get runTime(): number {
    if (this._state === SceneState.RUNNING) {
      return Date.now() - this._startTime
    }
    return this._runTime
  }

  /**
   * 获取父场景
   * @returns 父场景
   */
  get parentScene(): Scene | null {
    return this._parentScene
  }

  /**
   * 获取子场景列表
   * @returns 子场景数组
   */
  get childScenes(): Scene[] {
    return [...this._childScenes]
  }

  // ========================================================================
  // 场景生命周期管理
  // ========================================================================

  /**
   * 加载场景
   */
  async load(): Promise<void> {
    if (this._state !== SceneState.INITIALIZED) {
      throw new Error(`Cannot load scene in state: ${this._state}`)
    }

    this.setState(SceneState.LOADING)

    try {
      // 执行场景加载逻辑
      await this.onLoad()

      this.setState(SceneState.LOADED)
      this.emit('scene_loaded')

    } catch (error) {
      this.setState(SceneState.ERROR)
      this.emit('scene_error', error)
      throw error
    }
  }

  /**
   * 启动场景
   */
  start(): void {
    if (this._state !== SceneState.LOADED) {
      throw new Error(`Cannot start scene in state: ${this._state}`)
    }

    this._startTime = Date.now()
    this.setState(SceneState.RUNNING)

    // 执行场景启动逻辑
    this.onStart()

    this.emit('scene_started')
  }

  /**
   * 暂停场景
   */
  pause(): void {
    if (this._state !== SceneState.RUNNING) {
      throw new Error(`Cannot pause scene in state: ${this._state}`)
    }

    this._runTime += Date.now() - this._startTime
    this.setState(SceneState.PAUSED)

    // 执行场景暂停逻辑
    this.onPause()

    this.emit('scene_paused')
  }

  /**
   * 恢复场景
   */
  resume(): void {
    if (this._state !== SceneState.PAUSED) {
      throw new Error(`Cannot resume scene in state: ${this._state}`)
    }

    this._startTime = Date.now()
    this.setState(SceneState.RUNNING)

    // 执行场景恢复逻辑
    this.onResume()

    this.emit('scene_resumed')
  }

  /**
   * 停止场景
   */
  stop(): void {
    if (this._state !== SceneState.RUNNING && this._state !== SceneState.PAUSED) {
      throw new Error(`Cannot stop scene in state: ${this._state}`)
    }

    if (this._state === SceneState.RUNNING) {
      this._runTime += Date.now() - this._startTime
    }

    this.setState(SceneState.LOADED)

    // 执行场景停止逻辑
    this.onStop()

    this.emit('scene_stopped')
  }

  /**
   * 卸载场景
   */
  async unload(): Promise<void> {
    if (this._state === SceneState.UNLOADED) {
      return
    }

    // 如果场景正在运行，先停止
    if (this._state === SceneState.RUNNING || this._state === SceneState.PAUSED) {
      this.stop()
    }

    this.setState(SceneState.UNLOADING)

    try {
      // 执行场景卸载逻辑
      await this.onUnload()

      this.setState(SceneState.UNLOADED)
      this.emit('scene_unloaded')

    } catch (error) {
      this.setState(SceneState.ERROR)
      this.emit('scene_error', error)
      throw error
    }
  }

  // ========================================================================
  // 场景生命周期钩子方法 - 子类可重写
  // ========================================================================

  /**
   * 场景加载时调用 - 子类可重写
   */
  protected async onLoad(): Promise<void> {
    // 默认实现：确保场景在树中
    if (!this.isInsideTree) {
      this._enterTree()
    }
  }

  /**
   * 场景启动时调用 - 子类可重写
   */
  protected onStart(): void {
    // 默认实现：启动所有子节点
    this.processMode = 0 // ProcessMode.INHERIT
  }

  /**
   * 场景暂停时调用 - 子类可重写
   */
  protected onPause(): void {
    // 默认实现：暂停处理
    this.processMode = 3 // ProcessMode.DISABLED
  }

  /**
   * 场景恢复时调用 - 子类可重写
   */
  protected onResume(): void {
    // 默认实现：恢复处理
    this.processMode = 0 // ProcessMode.INHERIT
  }

  /**
   * 场景停止时调用 - 子类可重写
   */
  protected onStop(): void {
    // 默认实现：停止处理
    this.processMode = 3 // ProcessMode.DISABLED
  }

  /**
   * 场景卸载时调用 - 子类可重写
   */
  protected async onUnload(): Promise<void> {
    // 默认实现：从树中移除
    if (this.isInsideTree) {
      this._exitTree()
    }

    // 清理子场景
    for (const childScene of this._childScenes) {
      await childScene.unload()
    }
    this._childScenes.length = 0
  }

  // ========================================================================
  // 子场景管理
  // ========================================================================

  /**
   * 添加子场景
   * @param childScene 子场景
   */
  addChildScene(childScene: Scene): void {
    if (childScene._parentScene) {
      throw new Error(`Scene "${childScene.name}" already has a parent scene`)
    }

    childScene._parentScene = this
    this._childScenes.push(childScene)

    // 将子场景作为子节点添加
    this.addChild(childScene)

    this.emit('child_scene_added', childScene)
  }

  /**
   * 移除子场景
   * @param childScene 子场景
   */
  removeChildScene(childScene: Scene): void {
    const index = this._childScenes.indexOf(childScene)
    if (index === -1) {
      throw new Error(`Scene "${childScene.name}" is not a child scene`)
    }

    // 从子节点中移除
    this.removeChild(childScene)

    childScene._parentScene = null
    this._childScenes.splice(index, 1)

    this.emit('child_scene_removed', childScene)
  }

  /**
   * 根据名称查找子场景
   * @param name 场景名称
   * @returns 子场景或null
   */
  findChildScene(name: string): Scene | null {
    return this._childScenes.find(scene => scene.name === name) || null
  }

  /**
   * 获取所有子场景
   * @returns 子场景数组
   */
  getAllChildScenes(): Scene[] {
    return [...this._childScenes]
  }

  // ========================================================================
  // 场景状态管理
  // ========================================================================

  /**
   * 设置场景状态
   * @param newState 新状态
   */
  private setState(newState: SceneState): void {
    if (this._state !== newState) {
      const oldState = this._state
      this._state = newState
      this._sceneMetadata.modifiedAt = Date.now()

      this.emit('scene_state_changed', newState, oldState)

      console.log(`Scene "${this.name}" state changed: ${SceneState[oldState]} -> ${SceneState[newState]}`)
    }
  }

  /**
   * 检查场景是否处于指定状态
   * @param state 要检查的状态
   * @returns 是否处于指定状态
   */
  isInState(state: SceneState): boolean {
    return this._state === state
  }

  /**
   * 检查场景是否正在运行
   * @returns 是否正在运行
   */
  isRunning(): boolean {
    return this._state === SceneState.RUNNING
  }

  /**
   * 检查场景是否已加载
   * @returns 是否已加载
   */
  isLoaded(): boolean {
    return this._state === SceneState.LOADED || this._state === SceneState.RUNNING || this._state === SceneState.PAUSED
  }

  // ========================================================================
  // 场景工具方法
  // ========================================================================

  /**
   * 更新场景元数据
   * @param metadata 部分元数据
   */
  updateMetadata(metadata: Partial<SceneMetadata>): void {
    Object.assign(this._sceneMetadata, metadata)
    this._sceneMetadata.modifiedAt = Date.now()
  }

  /**
   * 获取场景统计信息
   * @returns 场景统计信息
   */
  getSceneStats(): {
    nodeCount: number
    childSceneCount: number
    runTime: number
    state: string
    memoryUsage?: number
  } {
    return {
      nodeCount: this.getChildCount(), // 计算直接子节点数量
      childSceneCount: this._childScenes.length,
      runTime: this.runTime,
      state: SceneState[this._state],
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * 估算内存使用量
   * @returns 估算的内存使用量（字节）
   */
  private estimateMemoryUsage(): number {
    // 这里可以实现更精确的内存使用量计算
    // 目前返回一个基础估算值
    const baseSize = 1024 // 基础对象大小
    const nodeSize = this.getChildCount() * 512 // 每个节点估算512字节
    return baseSize + nodeSize
  }

  /**
   * 克隆场景
   * @param newName 新场景名称
   * @returns 克隆的场景
   */
  clone(newName?: string): Scene {
    const clonedScene = new Scene(newName || `${this.name}_clone`, {
      type: this._sceneType,
      persistent: this._persistent,
      autoStart: this._config.autoStart
    })

    // 克隆所有子节点
    this.children.forEach(child => {
      const clonedChild = this.cloneNode(child)
      clonedScene.addChild(clonedChild)
    })

    return clonedScene
  }

  /**
   * 递归克隆节点
   * @param node 要克隆的节点
   * @returns 克隆的节点
   */
  private cloneNode(node: Node): Node {
    // 这里需要实现节点的深度克隆
    // 目前返回一个基础的节点克隆
    const clonedNode = new Node(node.name + '_clone')

    // 克隆子节点
    node.children.forEach(child => {
      const clonedChild = this.cloneNode(child)
      clonedNode.addChild(clonedChild)
    })

    return clonedNode
  }

  /**
   * 销毁场景
   */
  override destroy(): void {
    // 卸载场景
    if (this._state !== SceneState.UNLOADED) {
      this.unload().catch(error => {
        console.error('Error unloading scene during destroy:', error)
      })
    }

    // 清理子场景
    this._childScenes.forEach(childScene => {
      childScene.destroy()
    })
    this._childScenes.length = 0

    // 调用父类销毁方法
    super.destroy()
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Scene
