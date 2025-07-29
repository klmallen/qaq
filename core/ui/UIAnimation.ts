/**
 * QAQ游戏引擎 - UI动画系统
 * 
 * 将动画系统与UI控件集成，提供流畅的UI动画效果
 * 支持状态机驱动的UI动画和Tween补间动画
 */

import Tween, { TransitionType, EaseType } from '../nodes/animation/Tween'
import AnimationTree from '../nodes/animation/AnimationTree'
import { StateMachine } from '../animation/StateMachine'
import type { Vector2, Vector3 } from '../../types/core'

/**
 * UI动画状态枚举
 */
export enum UIAnimationState {
  IDLE = 'idle',
  HOVER = 'hover',
  PRESSED = 'pressed',
  FOCUSED = 'focused',
  DISABLED = 'disabled',
  SELECTED = 'selected',
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success'
}

/**
 * UI动画配置接口
 */
export interface UIAnimationConfig {
  duration?: number
  transition?: TransitionType
  ease?: EaseType
  delay?: number
  loop?: boolean
  autoReverse?: boolean
}

/**
 * UI状态动画配置接口
 */
export interface UIStateAnimationConfig {
  [UIAnimationState.IDLE]?: UIAnimationConfig
  [UIAnimationState.HOVER]?: UIAnimationConfig
  [UIAnimationState.PRESSED]?: UIAnimationConfig
  [UIAnimationState.FOCUSED]?: UIAnimationConfig
  [UIAnimationState.DISABLED]?: UIAnimationConfig
  [UIAnimationState.SELECTED]?: UIAnimationConfig
  [UIAnimationState.LOADING]?: UIAnimationConfig
  [UIAnimationState.ERROR]?: UIAnimationConfig
  [UIAnimationState.SUCCESS]?: UIAnimationConfig
}

/**
 * UI动画系统
 * 提供UI控件的动画功能
 */
export class UIAnimation {
  private static instance: UIAnimation | null = null

  /** 活跃的UI动画映射 */
  private activeAnimations: Map<string, Tween> = new Map()
  
  /** UI状态机映射 */
  private stateMachines: Map<string, StateMachine> = new Map()
  
  /** UI动画树映射 */
  private animationTrees: Map<string, AnimationTree> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): UIAnimation {
    if (!this.instance) {
      this.instance = new UIAnimation()
    }
    return this.instance
  }

  // ========================================================================
  // 基础动画方法
  // ========================================================================

  /**
   * 淡入动画
   * @param target 目标对象
   * @param config 动画配置
   */
  static fadeIn(target: any, config: UIAnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`fadeIn_${target.name || 'unknown'}`)
      
      tween.tweenProperty(target, 'modulate.a', 1, config.duration || 0.3)
        .setTransition(config.transition || TransitionType.SINE)
        .setEase(config.ease || EaseType.OUT)
        .setDelay(config.delay || 0)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      // 存储活跃动画
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 淡出动画
   * @param target 目标对象
   * @param config 动画配置
   */
  static fadeOut(target: any, config: UIAnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`fadeOut_${target.name || 'unknown'}`)
      
      tween.tweenProperty(target, 'modulate.a', 0, config.duration || 0.3)
        .setTransition(config.transition || TransitionType.SINE)
        .setEase(config.ease || EaseType.IN)
        .setDelay(config.delay || 0)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 滑入动画
   * @param target 目标对象
   * @param direction 滑入方向
   * @param config 动画配置
   */
  static slideIn(
    target: any, 
    direction: 'left' | 'right' | 'up' | 'down', 
    config: UIAnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`slideIn_${target.name || 'unknown'}`)
      
      // 计算起始位置
      const originalPosition = { ...target.position }
      const startPosition = { ...originalPosition }
      const distance = config.duration ? config.duration * 200 : 100 // 根据持续时间调整距离
      
      switch (direction) {
        case 'left':
          startPosition.x -= distance
          break
        case 'right':
          startPosition.x += distance
          break
        case 'up':
          startPosition.y -= distance
          break
        case 'down':
          startPosition.y += distance
          break
      }
      
      // 设置起始位置
      target.position = startPosition
      
      // 动画到目标位置
      tween.tweenProperty(target, 'position', originalPosition, config.duration || 0.5)
        .setTransition(config.transition || TransitionType.BACK)
        .setEase(config.ease || EaseType.OUT)
        .setDelay(config.delay || 0)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 缩放动画
   * @param target 目标对象
   * @param fromScale 起始缩放
   * @param toScale 目标缩放
   * @param config 动画配置
   */
  static scale(
    target: any, 
    fromScale: Vector2, 
    toScale: Vector2, 
    config: UIAnimationConfig = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`scale_${target.name || 'unknown'}`)
      
      // 设置起始缩放
      target.scale = fromScale
      
      tween.tweenProperty(target, 'scale', toScale, config.duration || 0.3)
        .setTransition(config.transition || TransitionType.ELASTIC)
        .setEase(config.ease || EaseType.OUT)
        .setDelay(config.delay || 0)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 弹跳动画
   * @param target 目标对象
   * @param config 动画配置
   */
  static bounce(target: any, config: UIAnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`bounce_${target.name || 'unknown'}`)
      
      const originalScale = { ...target.scale }
      const bounceScale = { 
        x: originalScale.x * 1.2, 
        y: originalScale.y * 1.2 
      }
      
      // 放大
      tween.tweenProperty(target, 'scale', bounceScale, (config.duration || 0.6) * 0.3)
        .setTransition(TransitionType.QUAD)
        .setEase(EaseType.OUT)
      
      // 缩回
      tween.tweenProperty(target, 'scale', originalScale, (config.duration || 0.6) * 0.7)
        .setTransition(TransitionType.BOUNCE)
        .setEase(EaseType.OUT)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 摇摆动画
   * @param target 目标对象
   * @param config 动画配置
   */
  static shake(target: any, config: UIAnimationConfig = {}): Promise<void> {
    return new Promise((resolve) => {
      const tween = new Tween(`shake_${target.name || 'unknown'}`)
      
      const originalPosition = { ...target.position }
      const shakeDistance = 10
      const duration = config.duration || 0.5
      const steps = 8
      const stepDuration = duration / steps
      
      // 创建摇摆序列
      for (let i = 0; i < steps; i++) {
        const offset = (i % 2 === 0 ? shakeDistance : -shakeDistance) * (1 - i / steps)
        const shakePosition = {
          x: originalPosition.x + offset,
          y: originalPosition.y
        }
        
        tween.tweenProperty(target, 'position', shakePosition, stepDuration)
          .setTransition(TransitionType.LINEAR)
      }
      
      // 回到原位置
      tween.tweenProperty(target, 'position', originalPosition, stepDuration)
        .setTransition(TransitionType.LINEAR)
      
      tween.tweenCallback(() => resolve())
      
      tween.play()
      
      UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    })
  }

  /**
   * 脉冲动画（循环）
   * @param target 目标对象
   * @param config 动画配置
   */
  static pulse(target: any, config: UIAnimationConfig = {}): Tween {
    const tween = new Tween(`pulse_${target.name || 'unknown'}`)
    
    const originalScale = { ...target.scale }
    const pulseScale = { 
      x: originalScale.x * 1.1, 
      y: originalScale.y * 1.1 
    }
    
    // 放大
    tween.tweenProperty(target, 'scale', pulseScale, (config.duration || 1.0) * 0.5)
      .setTransition(TransitionType.SINE)
      .setEase(EaseType.IN_OUT)
    
    // 缩回
    tween.tweenProperty(target, 'scale', originalScale, (config.duration || 1.0) * 0.5)
      .setTransition(TransitionType.SINE)
      .setEase(EaseType.IN_OUT)
    
    // 如果需要循环，重新播放
    if (config.loop !== false) {
      tween.tweenCallback(() => {
        if (UIAnimation.getInstance().activeAnimations.has(tween.name)) {
          tween.play()
        }
      })
    }
    
    tween.play()
    
    UIAnimation.getInstance().activeAnimations.set(tween.name, tween)
    return tween
  }

  // ========================================================================
  // 状态机动画
  // ========================================================================

  /**
   * 创建UI状态机
   * @param elementId UI元素ID
   * @param stateConfigs 状态动画配置
   */
  createUIStateMachine(
    elementId: string, 
    stateConfigs: UIStateAnimationConfig
  ): StateMachine {
    const stateMachine = new StateMachine(`ui_${elementId}`)
    
    // 为每个状态创建动画状态
    for (const [stateName, config] of Object.entries(stateConfigs)) {
      if (config) {
        const state = stateMachine.addState(stateName)
        // 这里可以根据需要添加状态特定的动画逻辑
      }
    }
    
    // 设置默认状态
    stateMachine.setInitialState(UIAnimationState.IDLE)
    
    this.stateMachines.set(elementId, stateMachine)
    return stateMachine
  }

  /**
   * 切换UI状态
   * @param elementId UI元素ID
   * @param newState 新状态
   * @param target 目标对象
   */
  transitionToState(elementId: string, newState: UIAnimationState, target: any): void {
    const stateMachine = this.stateMachines.get(elementId)
    if (!stateMachine) return
    
    // 停止当前动画
    this.stopAnimation(elementId)
    
    // 执行状态转换
    stateMachine.transitionTo(newState)
    
    // 根据新状态播放相应动画
    this.playStateAnimation(elementId, newState, target)
  }

  /**
   * 播放状态动画
   * @param elementId UI元素ID
   * @param state 状态
   * @param target 目标对象
   */
  private playStateAnimation(elementId: string, state: UIAnimationState, target: any): void {
    switch (state) {
      case UIAnimationState.HOVER:
        UIAnimation.scale(target, target.scale, { x: 1.05, y: 1.05 }, { duration: 0.2 })
        break
      case UIAnimationState.PRESSED:
        UIAnimation.scale(target, target.scale, { x: 0.95, y: 0.95 }, { duration: 0.1 })
        break
      case UIAnimationState.FOCUSED:
        UIAnimation.pulse(target, { duration: 2.0, loop: true })
        break
      case UIAnimationState.DISABLED:
        UIAnimation.fadeOut(target, { duration: 0.3 })
        break
      case UIAnimationState.LOADING:
        // 可以添加旋转动画或其他加载动画
        break
      case UIAnimationState.ERROR:
        UIAnimation.shake(target, { duration: 0.5 })
        break
      case UIAnimationState.SUCCESS:
        UIAnimation.bounce(target, { duration: 0.6 })
        break
      case UIAnimationState.IDLE:
      default:
        // 回到默认状态
        UIAnimation.scale(target, target.scale, { x: 1, y: 1 }, { duration: 0.2 })
        UIAnimation.fadeIn(target, { duration: 0.3 })
        break
    }
  }

  // ========================================================================
  // 动画管理
  // ========================================================================

  /**
   * 停止指定动画
   * @param animationId 动画ID
   */
  stopAnimation(animationId: string): void {
    const tween = this.activeAnimations.get(animationId)
    if (tween) {
      tween.stop()
      this.activeAnimations.delete(animationId)
    }
  }

  /**
   * 停止所有动画
   */
  stopAllAnimations(): void {
    for (const [id, tween] of this.activeAnimations) {
      tween.stop()
    }
    this.activeAnimations.clear()
  }

  /**
   * 暂停指定动画
   * @param animationId 动画ID
   */
  pauseAnimation(animationId: string): void {
    const tween = this.activeAnimations.get(animationId)
    if (tween) {
      tween.pause()
    }
  }

  /**
   * 恢复指定动画
   * @param animationId 动画ID
   */
  resumeAnimation(animationId: string): void {
    const tween = this.activeAnimations.get(animationId)
    if (tween) {
      tween.play()
    }
  }

  /**
   * 检查动画是否正在运行
   * @param animationId 动画ID
   */
  isAnimationRunning(animationId: string): boolean {
    const tween = this.activeAnimations.get(animationId)
    return tween ? tween.isRunning() : false
  }

  /**
   * 获取活跃动画数量
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size
  }

  // ========================================================================
  // 预设动画组合
  // ========================================================================

  /**
   * 按钮点击动画组合
   * @param target 目标按钮
   */
  static buttonClick(target: any): Promise<void> {
    return UIAnimation.scale(
      target, 
      { x: 1, y: 1 }, 
      { x: 0.95, y: 0.95 }, 
      { duration: 0.1, transition: TransitionType.QUAD, ease: EaseType.OUT }
    ).then(() => 
      UIAnimation.scale(
        target, 
        { x: 0.95, y: 0.95 }, 
        { x: 1, y: 1 }, 
        { duration: 0.1, transition: TransitionType.BACK, ease: EaseType.OUT }
      )
    )
  }

  /**
   * 模态对话框出现动画
   * @param target 目标对话框
   */
  static modalAppear(target: any): Promise<void> {
    return Promise.all([
      UIAnimation.fadeIn(target, { duration: 0.3 }),
      UIAnimation.scale(
        target, 
        { x: 0.8, y: 0.8 }, 
        { x: 1, y: 1 }, 
        { duration: 0.3, transition: TransitionType.BACK, ease: EaseType.OUT }
      )
    ]).then(() => {})
  }

  /**
   * 通知消息动画
   * @param target 目标通知
   */
  static notification(target: any): Promise<void> {
    return UIAnimation.slideIn(target, 'right', { 
      duration: 0.5, 
      transition: TransitionType.BACK, 
      ease: EaseType.OUT 
    })
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  /**
   * 清理所有资源
   */
  destroy(): void {
    this.stopAllAnimations()
    this.stateMachines.clear()
    this.animationTrees.clear()
    UIAnimation.instance = null
  }
}

export default UIAnimation
