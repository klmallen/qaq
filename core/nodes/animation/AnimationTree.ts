/**
 * QAQ游戏引擎 - AnimationTree 动画树节点
 *
 * 基于Godot引擎的AnimationTree设计，提供高级动画混合和状态机功能
 * 支持动画状态机、混合树和参数驱动的动画控制
 */

import Node from '../Node'
import AnimationPlayer from './AnimationPlayer'
import { StateMachine } from '../../animation/StateMachine'
import type { PropertyInfo } from '../../../types/core'

/**
 * 动画节点类型枚举
 */
export enum AnimationNodeType {
  ANIMATION = 'animation',
  BLEND_TREE = 'blend_tree',
  STATE_MACHINE = 'state_machine',
  BLEND_SPACE_1D = 'blend_space_1d',
  BLEND_SPACE_2D = 'blend_space_2d',
  BLEND_2 = 'blend_2',
  BLEND_3 = 'blend_3',
  ONE_SHOT = 'one_shot',
  TRANSITION = 'transition'
}

/**
 * 动画处理模式枚举
 */
export enum AnimationProcessMode {
  /** 在_process中更新动画 */
  IDLE = 0,
  /** 在_physics_process中更新动画 */
  PHYSICS = 1,
  /** 手动更新动画 */
  MANUAL = 2
}

/**
 * 动画节点基类接口
 */
export interface AnimationNode {
  name: string
  type: AnimationNodeType
  children?: Map<string, AnimationNode>
  parameters?: Map<string, any>
  position?: { x: number; y: number }
}

/**
 * 动画节点 - 单个动画
 */
export interface AnimationNodeAnimation extends AnimationNode {
  type: AnimationNodeType.ANIMATION
  animationName: string
  playMode: 'forward' | 'backward' | 'ping_pong'
  loop: boolean
  speed: number
}

/**
 * 混合树节点
 */
export interface AnimationNodeBlendTree extends AnimationNode {
  type: AnimationNodeType.BLEND_TREE
  nodes: Map<string, AnimationNode>
  connections: Array<{
    from: string
    to: string
    fromPort: number
    toPort: number
  }>
}

/**
 * 混合空间1D节点
 */
export interface AnimationNodeBlendSpace1D extends AnimationNode {
  type: AnimationNodeType.BLEND_SPACE_1D
  blendPoints: Array<{
    position: number
    animation: AnimationNode
  }>
  minSpace: number
  maxSpace: number
  snap: number
  valueLabel: string
}

/**
 * 混合空间2D节点
 */
export interface AnimationNodeBlendSpace2D extends AnimationNode {
  type: AnimationNodeType.BLEND_SPACE_2D
  blendPoints: Array<{
    position: { x: number; y: number }
    animation: AnimationNode
  }>
  minSpace: { x: number; y: number }
  maxSpace: { x: number; y: number }
  snap: { x: number; y: number }
  xLabel: string
  yLabel: string
}

/**
 * 状态机播放控制器
 */
export class AnimationNodeStateMachinePlayback {
  private _tree: AnimationTree | null = null
  private _stateMachine: StateMachine | null = null
  private _currentState: string = ''
  private _isPlaying: boolean = false

  constructor(stateMachine: StateMachine) {
    this._stateMachine = stateMachine
  }

  /**
   * 设置动画树引用
   */
  setTree(tree: AnimationTree): void {
    this._tree = tree
  }

  /**
   * 获取当前状态
   */
  getCurrentNode(): string {
    return this._currentState
  }

  /**
   * 获取当前播放长度
   */
  getCurrentPlayPosition(): number {
    if (!this._stateMachine) return 0
    return this._stateMachine.getCurrentTime()
  }

  /**
   * 获取当前状态长度
   */
  getCurrentLength(): number {
    if (!this._stateMachine) return 0
    const currentState = this._stateMachine.getState(this._currentState)
    return currentState?.animationClip?.duration || 0
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return this._isPlaying
  }

  /**
   * 开始播放
   */
  start(node?: string): void {
    if (!this._stateMachine) return

    if (node) {
      this._stateMachine.transitionTo(node)
      this._currentState = node
    }

    this._isPlaying = true
  }

  /**
   * 停止播放
   */
  stop(): void {
    this._isPlaying = false
  }

  /**
   * 切换到指定状态
   */
  travel(toNode: string): void {
    if (!this._stateMachine) return

    this._stateMachine.transitionTo(toNode)
    this._currentState = toNode
  }

  /**
   * 获取可能的转换路径
   */
  getTravelPath(): string[] {
    // 简化实现，返回当前状态
    return this._currentState ? [this._currentState] : []
  }

  /**
   * 更新状态机
   */
  update(delta: number): void {
    if (!this._isPlaying || !this._stateMachine) return

    this._stateMachine.update(delta)
  }
}

/**
 * AnimationTree 类 - 动画树节点
 *
 * 主要功能：
 * 1. 管理复杂的动画状态机
 * 2. 提供动画混合和过渡
 * 3. 参数驱动的动画控制
 * 4. 与AnimationPlayer集成
 */
export class AnimationTree extends Node {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 关联的AnimationPlayer */
  private _animationPlayer: AnimationPlayer | null = null

  /** AnimationPlayer路径 */
  private _animationPlayerPath: string = '../AnimationPlayer'

  /** 动画树根节点 */
  private _treeRoot: AnimationNode | null = null

  /** 是否激活 */
  private _active: boolean = false

  /** 处理模式 */
  private _processMode: AnimationProcessMode = AnimationProcessMode.IDLE

  /** 动画参数 */
  private _parameters: Map<string, any> = new Map()

  /** 状态机播放控制器 */
  private _playback: AnimationNodeStateMachinePlayback | null = null

  /** 当前状态机 */
  private _currentStateMachine: StateMachine | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'AnimationTree') {
    super(name)
    this.initializeAnimationTreeSignals()
  }

  /**
   * 初始化动画树特有的信号
   */
  private initializeAnimationTreeSignals(): void {
    this.addUserSignal('animation_player_changed')
    this.addUserSignal('tree_changed')
    this.addUserSignal('state_changed', ['from_state', 'to_state'])
    this.addUserSignal('animation_finished', ['animation_name'])
  }

  /**
   * 节点准备就绪时调用
   */
  _ready(): void {
    super._ready()

    // 查找AnimationPlayer
    this.findAnimationPlayer()

    // 如果有状态机，初始化播放控制器
    if (this._currentStateMachine) {
      this.initializePlayback()
    }
  }

  /**
   * 查找AnimationPlayer
   */
  private findAnimationPlayer(): void {
    const player = this.getNode(this._animationPlayerPath)
    if (player instanceof AnimationPlayer) {
      this.setAnimationPlayer(player)
    }
  }

  /**
   * 初始化播放控制器
   */
  private initializePlayback(): void {
    if (!this._currentStateMachine) return

    this._playback = new AnimationNodeStateMachinePlayback(this._currentStateMachine)
    this._playback.setTree(this)
  }

  // ========================================================================
  // AnimationPlayer管理
  // ========================================================================

  /**
   * 设置AnimationPlayer
   * @param player AnimationPlayer实例
   */
  setAnimationPlayer(player: AnimationPlayer): void {
    if (this._animationPlayer === player) return

    this._animationPlayer = player
    this.emit('animation_player_changed')
  }

  /**
   * 获取AnimationPlayer
   */
  getAnimationPlayer(): AnimationPlayer | null {
    return this._animationPlayer
  }

  /**
   * 设置AnimationPlayer路径
   * @param path 节点路径
   */
  setAnimationPlayerPath(path: string): void {
    this._animationPlayerPath = path
    this.findAnimationPlayer()
  }

  /**
   * 获取AnimationPlayer路径
   */
  getAnimationPlayerPath(): string {
    return this._animationPlayerPath
  }

  // ========================================================================
  // 动画树管理
  // ========================================================================

  /**
   * 设置动画树根节点
   * @param root 根节点
   */
  setTreeRoot(root: AnimationNode): void {
    this._treeRoot = root
    this.emit('tree_changed')

    // 如果根节点是状态机，设置当前状态机
    if (root.type === AnimationNodeType.STATE_MACHINE) {
      // 这里需要将AnimationNode转换为StateMachine
      // 简化实现，假设已经有StateMachine实例
      this.initializePlayback()
    }
  }

  /**
   * 获取动画树根节点
   */
  getTreeRoot(): AnimationNode | null {
    return this._treeRoot
  }

  /**
   * 设置状态机
   * @param stateMachine 状态机实例
   */
  setStateMachine(stateMachine: StateMachine): void {
    this._currentStateMachine = stateMachine
    this.initializePlayback()
  }

  /**
   * 获取状态机
   */
  getStateMachine(): StateMachine | null {
    return this._currentStateMachine
  }

  // ========================================================================
  // 参数管理
  // ========================================================================

  /**
   * 设置参数值
   * @param name 参数名称
   * @param value 参数值
   */
  setParameter(name: string, value: any): void {
    this._parameters.set(name, value)

    // 如果有状态机，同步参数
    if (this._currentStateMachine) {
      this._currentStateMachine.setParameter(name, value)
    }
  }

  /**
   * 获取参数值
   * @param name 参数名称
   */
  getParameter(name: string): any {
    return this._parameters.get(name)
  }

  /**
   * 检查是否有参数
   * @param name 参数名称
   */
  hasParameter(name: string): boolean {
    return this._parameters.has(name)
  }

  /**
   * 获取所有参数
   */
  getAllParameters(): Map<string, any> {
    return new Map(this._parameters)
  }

  // ========================================================================
  // 播放控制
  // ========================================================================

  /**
   * 获取状态机播放控制器
   * @param path 状态机路径（可选）
   */
  getStateMachinePlayback(path: string = ''): AnimationNodeStateMachinePlayback | null {
    return this._playback
  }

  /**
   * 播放动画（供状态机调用）
   * @param animationName 动画名称
   */
  playAnimation(animationName: string): void {
    if (this._animationPlayer) {
      this._animationPlayer.play(animationName)
    }
  }

  /**
   * 激活动画树
   */
  setActive(active: boolean): void {
    this._active = active

    if (active && this._playback) {
      this._playback.start()
    } else if (this._playback) {
      this._playback.stop()
    }
  }

  /**
   * 获取是否激活
   */
  isActive(): boolean {
    return this._active
  }

  // ========================================================================
  // 动画处理
  // ========================================================================

  /**
   * 处理帧更新
   */
  _process(delta: number): void {
    super._process(delta)

    if (this._processMode === AnimationProcessMode.IDLE) {
      this.processAnimation(delta)
    }
  }

  /**
   * 处理物理帧更新
   */
  _physicsProcess(delta: number): void {
    super._physicsProcess(delta)

    if (this._processMode === AnimationProcessMode.PHYSICS) {
      this.processAnimation(delta)
    }
  }

  /**
   * 处理动画
   */
  private processAnimation(delta: number): void {
    if (!this._active || !this._treeRoot) return

    // 更新状态机
    if (this._playback) {
      this._playback.update(delta)
    }

    // 处理动画树节点
    this.processNode(this._treeRoot, delta)
  }

  /**
   * 处理动画节点
   */
  private processNode(node: AnimationNode, delta: number): void {
    switch (node.type) {
      case AnimationNodeType.ANIMATION:
        this.processAnimationNode(node as AnimationNodeAnimation, delta)
        break
      case AnimationNodeType.STATE_MACHINE:
        this.processStateMachine(delta)
        break
      case AnimationNodeType.BLEND_TREE:
        this.processBlendTree(node as AnimationNodeBlendTree, delta)
        break
      case AnimationNodeType.BLEND_SPACE_1D:
        this.processBlendSpace1D(node as AnimationNodeBlendSpace1D, delta)
        break
      case AnimationNodeType.BLEND_SPACE_2D:
        this.processBlendSpace2D(node as AnimationNodeBlendSpace2D, delta)
        break
    }
  }

  /**
   * 处理动画节点
   */
  private processAnimationNode(node: AnimationNodeAnimation, delta: number): void {
    if (!this._animationPlayer) return

    // 检查是否需要播放新动画
    if (!this._animationPlayer.isPlaying() ||
        this._animationPlayer.getCurrentAnimationName() !== node.animationName) {
      this._animationPlayer.play(node.animationName)
    }

    // 设置播放速度
    if (this._animationPlayer.speed !== node.speed) {
      this._animationPlayer.speed = node.speed
    }
  }

  /**
   * 处理状态机
   */
  private processStateMachine(delta: number): void {
    if (!this._currentStateMachine) return

    // 更新状态机
    const result = this._currentStateMachine.update(delta)

    // 应用动画结果到AnimationPlayer
    // 这里可以根据需要实现更复杂的混合逻辑
  }

  /**
   * 处理混合树
   */
  private processBlendTree(node: AnimationNodeBlendTree, delta: number): void {
    // 处理混合树中的所有节点
    for (const [name, childNode] of node.nodes) {
      this.processNode(childNode, delta)
    }
  }

  /**
   * 处理1D混合空间
   */
  private processBlendSpace1D(node: AnimationNodeBlendSpace1D, delta: number): void {
    const blendValue = this.getParameter(node.valueLabel) || 0

    // 找到相邻的混合点
    const blendPoints = node.blendPoints.sort((a, b) => a.position - b.position)

    for (let i = 0; i < blendPoints.length - 1; i++) {
      const point1 = blendPoints[i]
      const point2 = blendPoints[i + 1]

      if (blendValue >= point1.position && blendValue <= point2.position) {
        // 计算混合权重
        const t = (blendValue - point1.position) / (point2.position - point1.position)

        // 处理两个动画节点（这里简化处理）
        this.processNode(point1.animation, delta)
        this.processNode(point2.animation, delta)
        break
      }
    }
  }

  /**
   * 处理2D混合空间
   */
  private processBlendSpace2D(node: AnimationNodeBlendSpace2D, delta: number): void {
    const blendX = this.getParameter(node.xLabel) || 0
    const blendY = this.getParameter(node.yLabel) || 0

    // 简化实现：找到最近的混合点
    let closestPoint = node.blendPoints[0]
    let minDistance = Infinity

    for (const point of node.blendPoints) {
      const dx = blendX - point.position.x
      const dy = blendY - point.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    }

    if (closestPoint) {
      this.processNode(closestPoint.animation, delta)
    }
  }

  // ========================================================================
  // 属性访问器
  // ========================================================================

  /**
   * 设置处理模式
   */
  set processMode(mode: AnimationProcessMode) {
    this._processMode = mode
  }

  /**
   * 获取处理模式
   */
  get processMode(): AnimationProcessMode {
    return this._processMode
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 销毁节点时清理资源
   */
  destroy(): void {
    this.setActive(false)
    this._parameters.clear()
    this._playback = null
    this._currentStateMachine = null

    super.destroy()
  }
}

export default AnimationTree
