/**
 * QAQ游戏引擎 - AnimationPlayer 动画播放器节点
 *
 * 基于Godot引擎的AnimationPlayer设计，提供关键帧动画播放功能
 * 支持多轨道动画、混合、循环和事件回调
 */

import Node from '../Node'
import type { MeshInstance3D } from '../MeshInstance3D'
import type { Vector3, PropertyInfo } from '../../../types/core'
import { AnimationClip } from '../../animation/AnimationClip'
import * as THREE from 'three'

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
 * 动画方法调用模式枚举
 */
export enum AnimationMethodCallMode {
  /** 立即调用方法 */
  IMMEDIATE = 0,
  /** 延迟到帧结束调用 */
  DEFERRED = 1,
  /** 在物理帧中调用 */
  PHYSICS = 2
}

/**
 * 动画播放器配置接口
 */
export interface AnimationPlayerConfig {
  processMode?: AnimationProcessMode
  methodCallMode?: AnimationMethodCallMode
  autoplay?: string
  playbackSpeed?: number
  enableBlending?: boolean
  defaultBlendTime?: number
}

/**
 * 动画轨道数据接口
 */
interface AnimationTrackData {
  nodePath: string
  property: string
  keyframes: Array<{
    time: number
    value: any
    interpolation: 'linear' | 'step' | 'cubic'
  }>
}

/**
 * AnimationPlayer 类 - 动画播放器节点
 *
 * 主要功能：
 * 1. 管理和播放AnimationClip
 * 2. 支持动画混合和过渡
 * 3. 提供动画事件和回调
 * 4. 集成Three.js动画系统
 */
export class AnimationPlayer extends Node {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 动画片段集合 */
  private _animations: Map<string, AnimationClip> = new Map()

  /** Three.js动画混合器 */
  private _mixer: THREE.AnimationMixer | null = null

  /** Three.js动画动作集合 */
  private _actions: Map<string, THREE.AnimationAction> = new Map()

  /** 当前播放的动画名称 */
  private _currentAnimation: string | null = null

  /** 是否正在播放 */
  private _isPlaying: boolean = false

  /** 播放速度 */
  private _speed: number = 1.0

  /** 当前播放时间 */
  private _currentTime: number = 0.0

  /** 播放方向 (1: 正向, -1: 反向) */
  private _playbackDirection: number = 1

  /** 动画处理模式 */
  private _processMode: AnimationProcessMode = AnimationProcessMode.IDLE

  /** 方法调用模式 */
  private _methodCallMode: AnimationMethodCallMode = AnimationMethodCallMode.DEFERRED

  /** 自动播放的动画名称 */
  private _autoplay: string = ''

  /** 是否启用动画混合 */
  private _enableBlending: boolean = true

  /** 默认混合时间 */
  private _defaultBlendTime: number = 0.3

  /** 全局默认过渡时间 */
  private _globalTransitionTime: number = 0.3

  /** 是否启用智能过渡 */
  private _enableIntelligentTransitions: boolean = true

  /** 当前过渡状态 */
  private _currentTransition: {
    fromAnimation: string
    toAnimation: string
    startTime: number
    duration: number
    fromAction: THREE.AnimationAction
    toAction: THREE.AnimationAction
  } | null = null

  /** 上一帧的时间戳 */
  private _lastFrameTime: number = 0

  /** 动画根节点 */
  private _animationRoot: Node | null = null

  /** 动画根节点路径 */
  private _animationRootPath: string = '..'

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 动画播放器配置
   */
  constructor(name: string = 'AnimationPlayer', config: AnimationPlayerConfig = {}) {
    super(name)

    // 应用配置
    this._processMode = config.processMode || AnimationProcessMode.IDLE
    this._methodCallMode = config.methodCallMode || AnimationMethodCallMode.DEFERRED
    this._autoplay = config.autoplay || ''
    this._speed = config.playbackSpeed || 1.0
    this._enableBlending = config.enableBlending !== false
    this._defaultBlendTime = config.defaultBlendTime || 0.3

    // 初始化信号
    this.initializeAnimationPlayerSignals()
  }

  /**
   * 初始化动画播放器特有的信号
   */
  private initializeAnimationPlayerSignals(): void {
    this.addUserSignal('animation_started', ['animation_name'])
    this.addUserSignal('animation_finished', ['animation_name'])
    this.addUserSignal('animation_changed', ['old_name', 'new_name'])
    this.addUserSignal('animation_looped', ['animation_name'])
    this.addUserSignal('animation_step', ['animation_name', 'time'])
  }


  /**
   * 查找动画根节点
   */
  private findAnimationRoot(): void {
    if (this._animationRootPath === '..') {
      this._animationRoot = this.parent
    } else if (this._animationRootPath === '.') {
      this._animationRoot = this
    } else {
      this._animationRoot = this.getNode(this._animationRootPath)
    }
  }

  /**
   * 初始化Three.js动画混合器
   */
  private initializeThreeMixer(): void {
    if (!this._animationRoot) return

    // 查找具有Three.js对象的节点
    const threeObject = this.findThreeObject(this._animationRoot)
    if (threeObject) {
      this._mixer = new THREE.AnimationMixer(threeObject)

      // 监听动画事件
      this._mixer.addEventListener('finished', (event) => {
        const action = event.action as THREE.AnimationAction
        const animationName = this.getAnimationNameByAction(action)
        if (animationName) {
          this.emit('animation_finished', animationName)
        }
      })

      this._mixer.addEventListener('loop', (event) => {
        const action = event.action as THREE.AnimationAction
        const animationName = this.getAnimationNameByAction(action)
        if (animationName) {
          this.emit('animation_looped', animationName)
        }
      })
    }
  }

  /**
   * 查找Three.js对象
   */
  private findThreeObject(node: Node): THREE.Object3D | null {
    // 检查节点是否有Three.js对象
    if ((node as any).object3D) {
      return (node as any).object3D
    }

    // 递归查找子节点
    for (const child of node.getChildren()) {
      const threeObject = this.findThreeObject(child)
      if (threeObject) return threeObject
    }

    return null
  }

  /**
   * 根据动作获取动画名称
   */
  private getAnimationNameByAction(action: THREE.AnimationAction): string | null {
    for (const [name, storedAction] of this._actions) {
      if (storedAction === action) {
        return name
      }
    }
    return null
  }

  setTargetModel(modelNode: MeshInstance3D): void {
    this._animationRoot = modelNode

    // 尝试使用MeshInstance3D的动画混合器（如果有的话）
    this.initializeThreeMixer()

    // 从MeshInstance3D获取动画映射并复制到AnimationPlayer
    const animationMap = modelNode.getAnimationMap()
    if (animationMap.size > 0) {
      console.log(`🎬 从MeshInstance3D发现 ${animationMap.size} 个动画`)

      // 清空现有动画
      this._animations.clear()
      this._actions.clear()

      // 复制动画到AnimationPlayer
      for (const [name, clip] of animationMap.entries()) {
        this.addClip(clip)
        console.log(`🎬 添加动画: ${name}`)
      }
    } else {
      // 向后兼容：使用旧的importedAnimations
      if (modelNode.importedAnimations && modelNode.importedAnimations.length > 0) {
        console.log(`🎬 使用向后兼容模式，发现 ${modelNode.importedAnimations.length} 个动画`)
        for (const clip of modelNode.importedAnimations) {
          this.addClip(clip)
        }
      }
    }

    console.log(`🎬 AnimationPlayer初始化完成，总共 ${this._animations.size} 个动画`)
  }

  // ========================================================================
  // 智能过渡系统配置
  // ========================================================================

  /**
   * 设置全局默认过渡时间
   * @param time 过渡时间（秒）
   */
  setGlobalTransitionTime(time: number): void {
    this._globalTransitionTime = Math.max(0, time)
  }

  /**
   * 获取全局默认过渡时间
   */
  getGlobalTransitionTime(): number {
    return this._globalTransitionTime
  }

  /**
   * 启用或禁用智能过渡
   * @param enabled 是否启用
   */
  setIntelligentTransitionsEnabled(enabled: boolean): void {
    this._enableIntelligentTransitions = enabled
  }

  /**
   * 检查智能过渡是否启用
   */
  isIntelligentTransitionsEnabled(): boolean {
    return this._enableIntelligentTransitions
  }

  /**
   * 获取当前动画名称（供调试器使用）
   */
  getCurrentAnimation(): string | null {
    return this._currentAnimation
  }

  /**
   * 检查是否正在播放
   */
  isPlaying(): boolean {
    return this._isPlaying
  }

  /**
   * 获取播放速度
   */
  getSpeed(): number {
    return this._speed
  }

  /**
   * 检查是否正在过渡
   */
  isTransitioning(): boolean {
    return this._currentTransition !== null
  }

  /**
   * 获取当前过渡信息
   */
  getCurrentTransitionInfo(): {
    from: string | null
    to: string | null
    progress: number
  } {
    if (!this._currentTransition) {
      return { from: null, to: null, progress: 0 }
    }

    const elapsed = (performance.now() / 1000) - this._currentTransition.startTime
    const progress = Math.min(elapsed / this._currentTransition.duration, 1.0)

    return {
      from: this._currentTransition.fromAnimation,
      to: this._currentTransition.toAnimation,
      progress
    }
  }

  /**
   * 启动智能过渡
   * @param fromAnimation 源动画名称
   * @param toAnimation 目标动画名称
   * @param customBlendTime 自定义混合时间
   */
  private startIntelligentTransition(fromAnimation: string, toAnimation: string, customBlendTime?: number): void {
    const fromAction = this._actions.get(fromAnimation)
    const toAction = this._actions.get(toAnimation)

    if (!fromAction || !toAction) {
      console.warn(`智能过渡失败: 找不到动画动作 ${fromAnimation} -> ${toAnimation}`)
      return
    }

    // 计算过渡时间
    const transitionTime = customBlendTime !== undefined ? customBlendTime : this._globalTransitionTime

    console.log(`🔄 开始智能过渡: ${fromAnimation} -> ${toAnimation} (${transitionTime}s)`)

    // 设置过渡状态
    this._currentTransition = {
      fromAnimation,
      toAnimation,
      startTime: performance.now() / 1000,
      duration: transitionTime,
      fromAction,
      toAction
    }

    // 更新当前动画状态
    this._currentAnimation = toAnimation
    this._isPlaying = true

    // 开始播放目标动画
    toAction.reset()
    toAction.setEffectiveWeight(0) // 开始时权重为0
    toAction.play()

    // 发送过渡开始信号
    this.emit('transition_started', fromAnimation, toAnimation, transitionTime)
  }

  /**
   * 更新智能过渡状态
   * @param currentTime 当前时间
   */
  private updateIntelligentTransition(currentTime: number): void {
    if (!this._currentTransition) return

    const elapsed = currentTime - this._currentTransition.startTime
    const progress = Math.min(elapsed / this._currentTransition.duration, 1.0)

    // 计算权重
    const toWeight = progress
    const fromWeight = 1.0 - progress

    // 更新动作权重
    this._currentTransition.fromAction.setEffectiveWeight(fromWeight)
    this._currentTransition.toAction.setEffectiveWeight(toWeight)

    // 过渡完成
    if (progress >= 1.0) {
      const transition = this._currentTransition

      // 停止源动画
      transition.fromAction.stop()

      // 确保目标动画权重为1
      transition.toAction.setEffectiveWeight(1.0)

      console.log(`✅ 智能过渡完成: ${transition.fromAnimation} -> ${transition.toAnimation}`)

      // 发送过渡完成信号
      this.emit('transition_finished', transition.fromAnimation, transition.toAnimation)

      // 清除过渡状态
      this._currentTransition = null
    }
  }

  // ========================================================================
  // 动画管理
  // ========================================================================

  /**
   * 添加动画片段
   * @param name 动画名称
   * @param animation 动画片段
   */
  addAnimation(name: string, animation: AnimationClip): void {
    this._animations.set(name, animation)

    // 如果有Three.js混合器，创建对应的动作
    if (this._mixer) {
      this.createThreeAction(name, animation)
    }

    this.emit('animation_added', name, animation)
  }

  /**
   * 添加一个原生的THREE.AnimationClip
   * @param clip The THREE.AnimationClip to add.
   * @param name The name to assign to the animation. If not provided, the clip's name will be used.
   */
  addClip(clip: THREE.AnimationClip, name?: string): void {
    const animationName = name || clip.name;
    if (!this._mixer) {
      console.warn('AnimationPlayer: Mixer not initialized. Cannot add clip.');
      return;
    }

    // 创建并存储Action
    const action = this._mixer.clipAction(clip);
    this._actions.set(animationName, action);

    // 创建一个轻量级的AnimationClip包装器以保持API一致性
    const qaqClip = new AnimationClip(animationName, clip.duration);
    this._animations.set(animationName, qaqClip);

    this.emit('animation_added', animationName, qaqClip);
  }

  /**
   * 创建Three.js动画动作
   */
  private createThreeAction(name: string, animation: AnimationClip): void {
    if (!this._mixer) return

    // 将AnimationClip转换为Three.js AnimationClip
    const threeClip = this.convertToThreeClip(animation)
    if (threeClip) {
      const action = this._mixer.clipAction(threeClip)
      this._actions.set(name, action)
    }
  }

  /**
   * 将AnimationClip转换为Three.js AnimationClip
   */
  private convertToThreeClip(animation: AnimationClip): THREE.AnimationClip | null {
    const tracks: THREE.KeyframeTrack[] = []

    // 遍历所有轨道
    for (const [boneName, animTracks] of animation.getAllTracks()) {
      for (const track of animTracks) {
        const threeTrack = this.convertTrackToThree(boneName, track)
        if (threeTrack) {
          tracks.push(threeTrack)
        }
      }
    }

    if (tracks.length === 0) return null

    return new THREE.AnimationClip(animation.name, animation.duration, tracks)
  }

  /**
   * 将动画轨道转换为Three.js轨道
   */
  private convertTrackToThree(boneName: string, track: any): THREE.KeyframeTrack | null {
    const times: number[] = []
    const values: number[] = []

    // 提取关键帧数据
    for (const keyframe of track.keyframes) {
      times.push(keyframe.time)

      if (track.property === 'position' || track.property === 'scale') {
        const vec = keyframe.value as THREE.Vector3
        values.push(vec.x, vec.y, vec.z)
      } else if (track.property === 'rotation') {
        const quat = keyframe.value as THREE.Quaternion
        values.push(quat.x, quat.y, quat.z, quat.w)
      }
    }

    if (times.length === 0) return null

    // 创建对应类型的轨道
    const trackName = `${boneName}.${track.property}`

    switch (track.property) {
      case 'position':
        return new THREE.VectorKeyframeTrack(trackName, times, values)
      case 'rotation':
        return new THREE.QuaternionKeyframeTrack(trackName, times, values)
      case 'scale':
        return new THREE.VectorKeyframeTrack(trackName, times, values)
      default:
        return null
    }
  }

  /**
   * 移除动画片段
   * @param name 动画名称
   */
  removeAnimation(name: string): boolean {
    if (!this._animations.has(name)) return false

    // 如果正在播放该动画，停止播放
    if (this._currentAnimation === name) {
      this.stop()
    }

    // 移除Three.js动作
    if (this._actions.has(name)) {
      const action = this._actions.get(name)!
      action.stop()
      this._actions.delete(name)
    }

    this._animations.delete(name)
    this.emit('animation_removed', name)
    return true
  }

  /**
   * 获取动画片段
   * @param name 动画名称
   */
  getAnimation(name: string): AnimationClip | null {
    return this._animations.get(name) || null
  }

  /**
   * 获取所有动画名称
   */
  getAnimationList(): string[] {
    return Array.from(this._animations.keys())
  }

  /**
   * 检查是否有指定动画
   * @param name 动画名称
   */
  hasAnimation(name: string): boolean {
    return this._animations.has(name)
  }

  // ========================================================================
  // 动画播放控制
  // ========================================================================

  /**
   * 播放动画
   * @param name 动画名称，如果为空则播放当前动画
   * @param customBlend 自定义混合时间
   * @param customSpeed 自定义播放速度
   * @param fromEnd 是否从末尾开始播放
   */
  play(name?: string, customBlend?: number, customSpeed?: number, fromEnd: boolean = false): void {
    const animationName = name || this._currentAnimation
    if (!animationName || !this._animations.has(animationName)) {
      console.warn(`AnimationPlayer: Animation "${animationName}" not found`)
      return
    }

    // 如果启用智能过渡且有当前动画，启动智能过渡
    if (this._enableIntelligentTransitions &&
        this._currentAnimation &&
        this._currentAnimation !== animationName &&
        this._actions.has(this._currentAnimation) &&
        this._actions.has(animationName)) {

      this.startIntelligentTransition(this._currentAnimation, animationName, customBlend)
      return
    }

    const previousAnimation = this._currentAnimation
    this._currentAnimation = animationName
    this._isPlaying = true
    this._speed = customSpeed !== undefined ? customSpeed : this._speed
    this._playbackDirection = fromEnd ? -1 : 1

    // 设置播放时间
    const animation = this._animations.get(animationName)!
    if (fromEnd) {
      this._currentTime = animation.duration
    } else if (previousAnimation !== animationName) {
      this._currentTime = 0.0
    }

    // Three.js动画播放
    if (this._enableBlending && this._mixer && this._actions.has(animationName)) {
      const action = this._actions.get(animationName)!
      const blendTime = customBlend !== undefined ? customBlend : this._defaultBlendTime

      // 停止其他动画
      for (const [otherName, otherAction] of this._actions) {
        if (otherName !== animationName && otherAction.isRunning()) {
          otherAction.fadeOut(blendTime)
        }
      }

      // 播放当前动画
      const animation = this._animations.get(animationName)!
      action.setLoop(animation.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity).reset().fadeIn(blendTime).play()

      if (customSpeed !== undefined) {
        action.setEffectiveTimeScale(customSpeed)
      }
    }

    this._lastFrameTime = performance.now() / 1000
    this.emit('animation_started', animationName)

    if (previousAnimation !== animationName) {
      this.emit('animation_changed', previousAnimation, animationName)
    }
  }

  /**
   * 反向播放动画
   * @param name 动画名称
   * @param customBlend 自定义混合时间
   */
  playBackwards(name?: string, customBlend?: number): void {
    this.play(name, customBlend, -Math.abs(this._speed), true)
  }

  /**
   * 暂停动画
   */
  pause(): void {
    this._isPlaying = false

    if (this._mixer) {
      for (const action of this._actions.values()) {
        action.paused = true
      }
    }
  }

  /**
   * 停止动画
   */
  stop(): void {
    this._isPlaying = false
    this._currentTime = 0.0

    if (this._mixer) {
      for (const action of this._actions.values()) {
        action.stop()
      }
    }

    if (this._currentAnimation) {
      this.emit('animation_finished', this._currentAnimation)
    }
  }

  /**
   * 跳转到指定时间
   * @param time 时间（秒）
   */
  seek(time: number): void {
    if (!this._currentAnimation) return

    const animation = this._animations.get(this._currentAnimation)!
    this._currentTime = Math.max(0, Math.min(time, animation.duration))

    // 更新Three.js动画时间
    if (this._mixer && this._actions.has(this._currentAnimation)) {
      const action = this._actions.get(this._currentAnimation)!
      action.time = this._currentTime
    }
  }

  // ========================================================================
  // 属性访问器
  // ========================================================================

  /**
   * 获取当前动画名称
   */
  get currentAnimation(): string | null {
    return this._currentAnimation
  }

  /**
   * 获取当前动画名称（兼容Godot API）
   */
  getCurrentAnimationName(): string {
    return this._currentAnimation || ''
  }



  /**
   * 获取播放速度
   */
  get speed(): number {
    return this._speed
  }

  /**
   * 设置播放速度
   */
  set speed(value: number) {
    this._speed = value

    // 更新Three.js动画速度
    if (this._mixer) {
      this._mixer.timeScale = value
    }
  }

  /**
   * 获取当前播放时间
   */
  get currentTime(): number {
    return this._currentTime
  }

  /**
   * 获取当前动画长度
   */
  getCurrentAnimationLength(): number {
    if (!this._currentAnimation) return 0
    const animation = this._animations.get(this._currentAnimation)
    return animation ? animation.duration : 0
  }

  /**
   * 获取当前播放位置（0-1）
   */
  getCurrentAnimationPosition(): number {
    const length = this.getCurrentAnimationLength()
    return length > 0 ? this._currentTime / length : 0
  }

  /**
   * 设置当前播放位置（0-1）
   */
  setCurrentAnimationPosition(position: number): void {
    const length = this.getCurrentAnimationLength()
    if (length > 0) {
      this.seek(position * length)
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 处理帧更新
   */
  override _process(delta: number): void {
    super._process(delta)

    if (this._processMode === AnimationProcessMode.IDLE) {
      this.updateAnimation(delta)
    }
  }

  /**
   * 处理物理帧更新
   */
  override _physicsProcess(delta: number): void {
    super._physicsProcess(delta)

    if (this._processMode === AnimationProcessMode.PHYSICS) {
      this.updateAnimation(delta)
    }
  }

  /**
   * 更新动画
   */
  private updateAnimation(delta: number): void {
    if (!this._isPlaying || !this._currentAnimation) return

    // 更新智能过渡
    if (this._currentTransition) {
      this.updateIntelligentTransition(performance.now() / 1000)
    }

    // 更新Three.js动画混合器
    if (this._mixer) {
      this._mixer.update(delta * this._speed)
    }

    // 更新播放时间
    this._currentTime += delta * this._speed * this._playbackDirection

    // 处理循环和结束
    const animation = this._animations.get(this._currentAnimation)!
    if (this._playbackDirection > 0 && this._currentTime >= animation.duration) {
      if (animation.loop) {
        this._currentTime = this._currentTime % animation.duration
        this.emit('animation_looped', this._currentAnimation)
      } else {
        this._currentTime = animation.duration
        this.stop()
      }
    } else if (this._playbackDirection < 0 && this._currentTime <= 0) {
      if (animation.loop) {
        this._currentTime = animation.duration + (this._currentTime % animation.duration)
        this.emit('animation_looped', this._currentAnimation)
      } else {
        this._currentTime = 0
        this.stop()
      }
    }

    this.emit('animation_step', this._currentAnimation, this._currentTime)
  }

  /**
   * 销毁节点时清理资源
   */
  destroy(): void {
    // 停止所有动画
    this.stop()

    // 清理Three.js资源
    if (this._mixer) {
      this._mixer.stopAllAction()
      this._mixer = null
    }

    this._actions.clear()
    this._animations.clear()

    super.destroy()
  }
}

export default AnimationPlayer
