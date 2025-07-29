/**
 * QAQ游戏引擎 - 增强的AnimationPlayer
 * 
 * 实现专业游戏引擎级别的动画功能：
 * - 高级动画过渡和混合
 * - 帧事件回调系统
 * - 动画层和遮罩
 * - 动画队列和状态机
 * - 混合树支持
 */

import AnimationPlayer from './AnimationPlayer'
import * as THREE from 'three'

// ============================================================================
// 增强功能接口定义
// ============================================================================

/**
 * 动画过渡配置
 */
export interface AnimationTransition {
  /** 源动画名称 */
  from: string
  /** 目标动画名称 */
  to: string
  /** 过渡时间 */
  duration: number
  /** 过渡曲线 */
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  /** 是否等待源动画完成 */
  waitForCompletion?: boolean
}

/**
 * 帧事件配置
 */
export interface AnimationFrameEvent {
  /** 动画名称 */
  animationName: string
  /** 触发时间（秒） */
  time: number
  /** 事件名称 */
  eventName: string
  /** 事件参数 */
  parameters?: any[]
  /** 回调函数 */
  callback?: (...args: any[]) => void
}

/**
 * 动画层配置
 */
export interface AnimationLayer {
  /** 层名称 */
  name: string
  /** 层权重 */
  weight: number
  /** 骨骼遮罩（影响的骨骼名称列表） */
  boneMask?: string[]
  /** 是否叠加模式 */
  additive?: boolean
  /** 当前播放的动画 */
  currentAnimation?: string
}

/**
 * 动画元数据
 */
export interface AnimationMetadata {
  /** 动画名称 */
  name: string
  /** 循环设置 */
  loop: boolean
  /** 默认混合时间 */
  blendTime: number
  /** 优先级 */
  priority: number
  /** 动画分组 */
  group: string
  /** 自定义属性 */
  customProperties: Map<string, any>
}

/**
 * 混合参数
 */
export interface BlendParameter {
  /** 参数名称 */
  name: string
  /** 当前值 */
  value: number
  /** 最小值 */
  min: number
  /** 最大值 */
  max: number
}

// ============================================================================
// 增强的AnimationPlayer类
// ============================================================================

export class EnhancedAnimationPlayer extends AnimationPlayer {
  // ========================================================================
  // 增强功能属性
  // ========================================================================

  /** 动画过渡配置 */
  private _transitions: Map<string, AnimationTransition[]> = new Map()

  /** 帧事件列表 */
  private _frameEvents: AnimationFrameEvent[] = []

  /** 动画层系统 */
  private _layers: Map<string, AnimationLayer> = new Map()

  /** 动画元数据 */
  private _animationMetadata: Map<string, AnimationMetadata> = new Map()

  /** 动画队列 */
  private _animationQueue: string[] = []

  /** 混合参数 */
  private _blendParameters: Map<string, BlendParameter> = new Map()

  /** 当前过渡状态 */
  private _currentTransition: {
    from: string
    to: string
    progress: number
    duration: number
    curve: string
  } | null = null

  /** 帧事件检查的上一次时间 */
  private _lastEventCheckTime: number = 0

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(name: string = 'EnhancedAnimationPlayer') {
    super(name)
    
    // 初始化默认层
    this.addLayer('base', 1.0)
    
    // 初始化增强信号
    this.initializeEnhancedSignals()
  }

  /**
   * 初始化增强信号
   */
  private initializeEnhancedSignals(): void {
    this.addUserSignal('frame_event_triggered', ['event_name', 'animation_name', 'time', 'parameters'])
    this.addUserSignal('transition_started', ['from_animation', 'to_animation', 'duration'])
    this.addUserSignal('transition_finished', ['from_animation', 'to_animation'])
    this.addUserSignal('layer_weight_changed', ['layer_name', 'weight'])
    this.addUserSignal('blend_parameter_changed', ['parameter_name', 'value'])
  }

  // ========================================================================
  // 高级动画过渡系统
  // ========================================================================

  /**
   * 添加动画过渡配置
   */
  addTransition(transition: AnimationTransition): void {
    if (!this._transitions.has(transition.from)) {
      this._transitions.set(transition.from, [])
    }
    this._transitions.get(transition.from)!.push(transition)
  }

  /**
   * 平滑过渡到指定动画
   */
  transitionTo(animationName: string, customDuration?: number): void {
    const currentAnim = this._currentAnimation
    if (!currentAnim || currentAnim === animationName) {
      this.play(animationName)
      return
    }

    // 查找预配置的过渡
    const transitions = this._transitions.get(currentAnim)
    let transition = transitions?.find(t => t.to === animationName)

    if (!transition) {
      // 创建默认过渡
      transition = {
        from: currentAnim,
        to: animationName,
        duration: customDuration || this._defaultBlendTime,
        curve: 'ease-in-out'
      }
    }

    this.startTransition(transition)
  }

  /**
   * 开始动画过渡
   */
  private startTransition(transition: AnimationTransition): void {
    this._currentTransition = {
      from: transition.from,
      to: transition.to,
      progress: 0,
      duration: transition.duration,
      curve: transition.curve || 'linear'
    }

    // 开始播放目标动画
    this.play(transition.to, 0) // 0混合时间，我们手动控制

    this.emit('transition_started', transition.from, transition.to, transition.duration)
  }

  /**
   * 更新过渡状态
   */
  private updateTransition(deltaTime: number): void {
    if (!this._currentTransition) return

    this._currentTransition.progress += deltaTime / this._currentTransition.duration

    if (this._currentTransition.progress >= 1.0) {
      // 过渡完成
      const transition = this._currentTransition
      this._currentTransition = null
      this.emit('transition_finished', transition.from, transition.to)
    } else {
      // 更新混合权重
      const weight = this.calculateTransitionWeight(
        this._currentTransition.progress,
        this._currentTransition.curve
      )
      this.updateTransitionWeights(weight)
    }
  }

  /**
   * 计算过渡权重
   */
  private calculateTransitionWeight(progress: number, curve: string): number {
    switch (curve) {
      case 'ease-in':
        return progress * progress
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress)
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - 2 * (1 - progress) * (1 - progress)
      default:
        return progress
    }
  }

  /**
   * 更新过渡权重
   */
  private updateTransitionWeights(weight: number): void {
    if (!this._currentTransition) return

    const fromAction = this._actions.get(this._currentTransition.from)
    const toAction = this._actions.get(this._currentTransition.to)

    if (fromAction && toAction) {
      fromAction.setEffectiveWeight(1 - weight)
      toAction.setEffectiveWeight(weight)
    }
  }

  // ========================================================================
  // 帧事件系统
  // ========================================================================

  /**
   * 添加帧事件
   */
  addFrameEvent(event: AnimationFrameEvent): void {
    this._frameEvents.push(event)
    
    // 按时间排序
    this._frameEvents.sort((a, b) => a.time - b.time)
  }

  /**
   * 移除帧事件
   */
  removeFrameEvent(animationName: string, eventName: string, time?: number): void {
    this._frameEvents = this._frameEvents.filter(event => {
      if (event.animationName !== animationName || event.eventName !== eventName) {
        return true
      }
      if (time !== undefined && Math.abs(event.time - time) > 0.001) {
        return true
      }
      return false
    })
  }

  /**
   * 检查并触发帧事件
   */
  private checkFrameEvents(currentTime: number): void {
    if (!this._currentAnimation) return

    const relevantEvents = this._frameEvents.filter(
      event => event.animationName === this._currentAnimation
    )

    for (const event of relevantEvents) {
      // 检查是否在这一帧触发
      if (this._lastEventCheckTime < event.time && currentTime >= event.time) {
        this.triggerFrameEvent(event)
      }
    }

    this._lastEventCheckTime = currentTime
  }

  /**
   * 触发帧事件
   */
  private triggerFrameEvent(event: AnimationFrameEvent): void {
    // 调用回调函数
    if (event.callback) {
      event.callback(...(event.parameters || []))
    }

    // 发送信号
    this.emit('frame_event_triggered', 
      event.eventName, 
      event.animationName, 
      event.time, 
      event.parameters
    )
  }

  // ========================================================================
  // 动画层系统
  // ========================================================================

  /**
   * 添加动画层
   */
  addLayer(name: string, weight: number = 1.0, boneMask?: string[]): void {
    const layer: AnimationLayer = {
      name,
      weight,
      boneMask,
      additive: false
    }
    
    this._layers.set(name, layer)
  }

  /**
   * 设置层权重
   */
  setLayerWeight(layerName: string, weight: number): void {
    const layer = this._layers.get(layerName)
    if (layer) {
      layer.weight = Math.max(0, Math.min(1, weight))
      this.emit('layer_weight_changed', layerName, layer.weight)
    }
  }

  /**
   * 在指定层播放动画
   */
  playOnLayer(layerName: string, animationName: string, blendTime?: number): void {
    const layer = this._layers.get(layerName)
    if (!layer) {
      console.warn(`Layer "${layerName}" not found`)
      return
    }

    layer.currentAnimation = animationName
    
    // 这里需要实现层级动画播放逻辑
    // 由于Three.js的限制，这需要更复杂的实现
    this.play(animationName, blendTime)
  }

  // ========================================================================
  // 动画队列系统
  // ========================================================================

  /**
   * 将动画添加到队列
   */
  queueAnimation(animationName: string): void {
    this._animationQueue.push(animationName)
  }

  /**
   * 播放队列中的下一个动画
   */
  playNext(): void {
    if (this._animationQueue.length > 0) {
      const nextAnimation = this._animationQueue.shift()!
      this.play(nextAnimation)
    }
  }

  /**
   * 清空动画队列
   */
  clearQueue(): void {
    this._animationQueue = []
  }

  // ========================================================================
  // 动画元数据管理
  // ========================================================================

  /**
   * 设置动画元数据
   */
  setAnimationMetadata(name: string, metadata: Partial<AnimationMetadata>): void {
    const existing = this._animationMetadata.get(name) || {
      name,
      loop: true,
      blendTime: this._defaultBlendTime,
      priority: 0,
      group: 'default',
      customProperties: new Map()
    }

    const updated = { ...existing, ...metadata }
    this._animationMetadata.set(name, updated)
  }

  /**
   * 获取动画元数据
   */
  getAnimationMetadata(name: string): AnimationMetadata | null {
    return this._animationMetadata.get(name) || null
  }

  /**
   * 按组获取动画
   */
  getAnimationsByGroup(group: string): string[] {
    const animations: string[] = []
    for (const [name, metadata] of this._animationMetadata.entries()) {
      if (metadata.group === group) {
        animations.push(name)
      }
    }
    return animations
  }

  // ========================================================================
  // 混合树系统
  // ========================================================================

  /**
   * 添加混合参数
   */
  addBlendParameter(name: string, min: number = 0, max: number = 1, defaultValue: number = 0): void {
    this._blendParameters.set(name, {
      name,
      value: defaultValue,
      min,
      max
    })
  }

  /**
   * 设置混合参数值
   */
  setBlendParameter(name: string, value: number): void {
    const param = this._blendParameters.get(name)
    if (param) {
      param.value = Math.max(param.min, Math.min(param.max, value))
      this.emit('blend_parameter_changed', name, param.value)

      // 触发混合树更新
      this.updateBlendTree()
    }
  }

  /**
   * 获取混合参数值
   */
  getBlendParameter(name: string): number {
    const param = this._blendParameters.get(name)
    return param ? param.value : 0
  }

  /**
   * 更新混合树（简化版本）
   */
  private updateBlendTree(): void {
    // 这里实现基于参数的动画混合逻辑
    // 例如：根据速度参数混合walk和run动画

    const speed = this.getBlendParameter('speed')
    if (speed !== undefined) {
      if (speed < 0.5) {
        // 更倾向于walk动画
        this.blendAnimations('walk', 'run', speed * 2)
      } else {
        // 更倾向于run动画
        this.blendAnimations('walk', 'run', (speed - 0.5) * 2)
      }
    }
  }

  /**
   * 混合两个动画
   */
  private blendAnimations(anim1: string, anim2: string, weight: number): void {
    const action1 = this._actions.get(anim1)
    const action2 = this._actions.get(anim2)

    if (action1 && action2) {
      action1.setEffectiveWeight(1 - weight)
      action2.setEffectiveWeight(weight)

      if (!action1.isRunning()) action1.play()
      if (!action2.isRunning()) action2.play()
    }
  }

  // ========================================================================
  // 高级播放控制
  // ========================================================================

  /**
   * 播放动画并自动应用元数据设置
   */
  playWithMetadata(animationName: string): void {
    const metadata = this.getAnimationMetadata(animationName)
    if (metadata) {
      this.play(animationName, metadata.blendTime)
    } else {
      this.play(animationName)
    }
  }

  /**
   * 根据优先级播放动画
   */
  playByPriority(animationName: string): void {
    const newMetadata = this.getAnimationMetadata(animationName)
    const currentMetadata = this._currentAnimation ?
      this.getAnimationMetadata(this._currentAnimation) : null

    if (!currentMetadata ||
        !newMetadata ||
        newMetadata.priority >= currentMetadata.priority) {
      this.playWithMetadata(animationName)
    }
  }

  /**
   * 寻找到指定时间位置
   */
  seekTo(time: number): void {
    if (this._currentAnimation && this._actions.has(this._currentAnimation)) {
      const action = this._actions.get(this._currentAnimation)!
      action.time = Math.max(0, Math.min(time, action.getClip().duration))
    }
  }

  // ========================================================================
  // 重写更新方法
  // ========================================================================

  protected updateAnimation(delta: number): void {
    super.updateAnimation(delta)

    // 更新过渡
    this.updateTransition(delta)

    // 检查帧事件
    if (this._isPlaying && this._currentAnimation) {
      const action = this._actions.get(this._currentAnimation)
      if (action) {
        this.checkFrameEvents(action.time)
      }
    }
  }

  // ========================================================================
  // 调试和工具方法
  // ========================================================================

  /**
   * 获取当前动画状态信息
   */
  getAnimationState(): {
    currentAnimation: string | null
    isPlaying: boolean
    currentTime: number
    layers: string[]
    queueLength: number
    activeTransition: boolean
  } {
    const currentAction = this._currentAnimation ?
      this._actions.get(this._currentAnimation) : null

    return {
      currentAnimation: this._currentAnimation,
      isPlaying: this._isPlaying,
      currentTime: currentAction ? currentAction.time : 0,
      layers: Array.from(this._layers.keys()),
      queueLength: this._animationQueue.length,
      activeTransition: this._currentTransition !== null
    }
  }

  /**
   * 导出动画配置
   */
  exportConfiguration(): {
    transitions: AnimationTransition[]
    frameEvents: AnimationFrameEvent[]
    layers: AnimationLayer[]
    metadata: AnimationMetadata[]
    blendParameters: BlendParameter[]
  } {
    return {
      transitions: Array.from(this._transitions.values()).flat(),
      frameEvents: [...this._frameEvents],
      layers: Array.from(this._layers.values()),
      metadata: Array.from(this._animationMetadata.values()),
      blendParameters: Array.from(this._blendParameters.values())
    }
  }
}

export default EnhancedAnimationPlayer
