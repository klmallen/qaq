/**
 * QAQ游戏引擎 - Tween 补间动画节点
 *
 * 基于Godot引擎的Tween设计，提供属性补间动画功能
 * 支持多种缓动函数、链式调用和并行动画
 */

import Node from '../Node'
import type { Vector2, Vector3, PropertyInfo } from '../../../types/core'

/**
 * 补间处理模式枚举
 */
export enum TweenProcessMode {
  /** 在_process中更新补间 */
  IDLE = 0,
  /** 在_physics_process中更新补间 */
  PHYSICS = 1
}

/**
 * 补间暂停模式枚举
 */
export enum TweenPauseMode {
  /** 绑定到场景树暂停状态 */
  BOUND = 0,
  /** 暂停时停止补间 */
  STOP = 1,
  /** 暂停时继续处理补间 */
  PROCESS = 2
}

/**
 * 过渡类型枚举
 */
export enum TransitionType {
  LINEAR = 0,
  SINE = 1,
  QUINT = 2,
  QUART = 3,
  QUAD = 4,
  EXPO = 5,
  ELASTIC = 6,
  CUBIC = 7,
  CIRC = 8,
  BOUNCE = 9,
  BACK = 10,
  SPRING = 11
}

/**
 * 缓动类型枚举
 */
export enum EaseType {
  IN = 0,
  OUT = 1,
  IN_OUT = 2,
  OUT_IN = 3
}

/**
 * 补间器基类接口
 */
export interface Tweener {
  /** 补间器是否有效 */
  isValid(): boolean
  /** 执行补间步骤 */
  step(delta: number): boolean
  /** 设置延迟 */
  setDelay(delay: number): Tweener
  /** 获取补间对象 */
  getTween(): Tween | null
  /** 设置补间对象 */
  setTween(tween: Tween): void
  /** 开始补间 */
  start(): void
  /** 完成补间 */
  finish(): void
}

/**
 * 属性补间器
 */
export class PropertyTweener implements Tweener {
  private _tween: Tween | null = null
  private _target: any = null
  private _property: string = ''
  private _initialValue: any = null
  private _targetValue: any = null
  private _duration: number = 0
  private _delay: number = 0
  private _elapsed: number = 0
  private _delayElapsed: number = 0
  private _transitionType: TransitionType = TransitionType.LINEAR
  private _easeType: EaseType = EaseType.IN_OUT
  private _isRelative: boolean = false
  private _isValid: boolean = true
  private _hasStarted: boolean = false

  constructor(target: any, property: string, to: any, duration: number) {
    this._target = target
    this._property = property
    this._targetValue = to
    this._duration = duration
  }

  isValid(): boolean {
    return this._isValid && this._target !== null
  }

  step(delta: number): boolean {
    if (!this.isValid()) return false

    // 处理延迟
    if (this._delayElapsed < this._delay) {
      this._delayElapsed += delta
      return true
    }

    // 首次开始时获取初始值
    if (!this._hasStarted) {
      this.start()
    }

    this._elapsed += delta
    const progress = Math.min(this._elapsed / this._duration, 1.0)

    // 应用缓动函数
    const easedProgress = this.applyEasing(progress)

    // 插值并设置属性值
    const currentValue = this.interpolateValue(this._initialValue, this._targetValue, easedProgress)
    this.setPropertyValue(currentValue)

    // 检查是否完成
    if (progress >= 1.0) {
      this.finish()
      return false
    }

    return true
  }

  start(): void {
    if (this._hasStarted) return

    this._hasStarted = true
    this._initialValue = this.getPropertyValue()

    // 处理相对值
    if (this._isRelative) {
      this._targetValue = this.addValues(this._initialValue, this._targetValue)
    }
  }

  finish(): void {
    if (this.isValid()) {
      this.setPropertyValue(this._targetValue)
    }
  }

  // 缓动函数设置
  setTransition(type: TransitionType): PropertyTweener {
    this._transitionType = type
    return this
  }

  setEase(type: EaseType): PropertyTweener {
    this._easeType = type
    return this
  }

  setDelay(delay: number): PropertyTweener {
    this._delay = delay
    return this
  }

  asRelative(): PropertyTweener {
    this._isRelative = true
    return this
  }

  from(value: any): PropertyTweener {
    this._initialValue = value
    this._hasStarted = true
    return this
  }

  getTween(): Tween | null {
    return this._tween
  }

  setTween(tween: Tween): void {
    this._tween = tween
  }

  // 私有方法
  private getPropertyValue(): any {
    if (!this._target || !this._property) return null

    const properties = this._property.split('.')
    let current = this._target

    for (const prop of properties) {
      if (current && typeof current === 'object' && prop in current) {
        current = current[prop]
      } else {
        return null
      }
    }

    return current
  }

  private setPropertyValue(value: any): void {
    if (!this._target || !this._property) return

    const properties = this._property.split('.')
    let current = this._target

    for (let i = 0; i < properties.length - 1; i++) {
      const prop = properties[i]
      if (current && typeof current === 'object' && prop in current) {
        current = current[prop]
      } else {
        return
      }
    }

    const finalProp = properties[properties.length - 1]
    if (current && typeof current === 'object') {
      current[finalProp] = value
    }
  }

  private interpolateValue(from: any, to: any, t: number): any {
    if (typeof from === 'number' && typeof to === 'number') {
      return from + (to - from) * t
    }

    if (from && to && typeof from === 'object') {
      if (from.x !== undefined && from.y !== undefined) {
        // Vector2/Vector3
        const result: any = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }
        if (from.z !== undefined) {
          result.z = from.z + (to.z - from.z) * t
        }
        return result
      }

      if (from.r !== undefined && from.g !== undefined && from.b !== undefined) {
        // Color
        return {
          r: from.r + (to.r - from.r) * t,
          g: from.g + (to.g - from.g) * t,
          b: from.b + (to.b - from.b) * t,
          a: from.a !== undefined ? from.a + (to.a - from.a) * t : 1
        }
      }
    }

    // 默认情况：在t >= 0.5时切换到目标值
    return t >= 0.5 ? to : from
  }

  private addValues(a: any, b: any): any {
    if (typeof a === 'number' && typeof b === 'number') {
      return a + b
    }

    if (a && b && typeof a === 'object' && typeof b === 'object') {
      if (a.x !== undefined && a.y !== undefined) {
        const result: any = { x: a.x + b.x, y: a.y + b.y }
        if (a.z !== undefined) {
          result.z = a.z + b.z
        }
        return result
      }
    }

    return b
  }

  private applyEasing(t: number): number {
    // 应用过渡类型
    let transitioned = this.applyTransition(t, this._transitionType)

    // 应用缓动类型
    return this.applyEaseType(transitioned, this._easeType)
  }

  private applyTransition(t: number, type: TransitionType): number {
    switch (type) {
      case TransitionType.LINEAR:
        return t
      case TransitionType.SINE:
        return Math.sin(t * Math.PI / 2)
      case TransitionType.QUAD:
        return t * t
      case TransitionType.CUBIC:
        return t * t * t
      case TransitionType.QUART:
        return t * t * t * t
      case TransitionType.QUINT:
        return t * t * t * t * t
      case TransitionType.EXPO:
        return t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
      case TransitionType.CIRC:
        return 1 - Math.sqrt(1 - t * t)
      case TransitionType.BACK:
        const c1 = 1.70158
        const c3 = c1 + 1
        return c3 * t * t * t - c1 * t * t
      case TransitionType.ELASTIC:
        const c4 = (2 * Math.PI) / 3
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4)
      case TransitionType.BOUNCE:
        const n1 = 7.5625
        const d1 = 2.75
        if (t < 1 / d1) {
          return n1 * t * t
        } else if (t < 2 / d1) {
          return n1 * (t -= 1.5 / d1) * t + 0.75
        } else if (t < 2.5 / d1) {
          return n1 * (t -= 2.25 / d1) * t + 0.9375
        } else {
          return n1 * (t -= 2.625 / d1) * t + 0.984375
        }
      case TransitionType.SPRING:
        return 1 - Math.cos(t * Math.PI * 2) * Math.pow(2, -10 * t)
      default:
        return t
    }
  }

  private applyEaseType(t: number, ease: EaseType): number {
    switch (ease) {
      case EaseType.IN:
        return t
      case EaseType.OUT:
        return 1 - this.applyTransition(1 - t, this._transitionType)
      case EaseType.IN_OUT:
        if (t < 0.5) {
          return this.applyTransition(t * 2, this._transitionType) / 2
        } else {
          return 1 - this.applyTransition((1 - t) * 2, this._transitionType) / 2
        }
      case EaseType.OUT_IN:
        if (t < 0.5) {
          return (1 - this.applyTransition(1 - t * 2, this._transitionType)) / 2
        } else {
          return 0.5 + this.applyTransition((t - 0.5) * 2, this._transitionType) / 2
        }
      default:
        return t
    }
  }
}

/**
 * 间隔补间器
 */
export class IntervalTweener implements Tweener {
  private _tween: Tween | null = null
  private _duration: number = 0
  private _elapsed: number = 0
  private _isValid: boolean = true

  constructor(duration: number) {
    this._duration = duration
  }

  isValid(): boolean {
    return this._isValid
  }

  step(delta: number): boolean {
    if (!this.isValid()) return false

    this._elapsed += delta
    return this._elapsed < this._duration
  }

  setDelay(delay: number): IntervalTweener {
    // 间隔补间器本身就是延迟，不需要额外延迟
    return this
  }

  getTween(): Tween | null {
    return this._tween
  }

  setTween(tween: Tween): void {
    this._tween = tween
  }

  start(): void {
    // 间隔补间器不需要特殊的开始逻辑
  }

  finish(): void {
    // 间隔补间器不需要特殊的完成逻辑
  }
}

/**
 * 回调补间器
 */
export class CallbackTweener implements Tweener {
  private _tween: Tween | null = null
  private _callback: Function
  private _isValid: boolean = true
  private _hasExecuted: boolean = false

  constructor(callback: Function) {
    this._callback = callback
  }

  isValid(): boolean {
    return this._isValid && typeof this._callback === 'function'
  }

  step(delta: number): boolean {
    if (!this.isValid() || this._hasExecuted) return false

    try {
      this._callback()
    } catch (error) {
      console.error('Tween callback error:', error)
    }

    this._hasExecuted = true
    return false
  }

  setDelay(delay: number): CallbackTweener {
    // 可以通过在前面添加IntervalTweener来实现延迟
    return this
  }

  getTween(): Tween | null {
    return this._tween
  }

  setTween(tween: Tween): void {
    this._tween = tween
  }

  start(): void {
    // 回调补间器不需要特殊的开始逻辑
  }

  finish(): void {
    if (!this._hasExecuted) {
      this.step(0)
    }
  }
}

/**
 * Tween 类 - 补间动画节点
 *
 * 主要功能：
 * 1. 管理多个补间器的执行
 * 2. 提供链式调用API
 * 3. 支持并行和串行动画
 * 4. 集成到节点系统的更新循环
 */
export class Tween extends Node {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 补间器队列 */
  private _tweeners: Tweener[] = []

  /** 当前执行的补间器索引 */
  private _currentIndex: number = 0

  /** 是否正在运行 */
  private _isRunning: boolean = false

  /** 是否暂停 */
  private _isPaused: boolean = false

  /** 处理模式 */
  private _processMode: TweenProcessMode = TweenProcessMode.IDLE

  /** 暂停模式 */
  private _pauseMode: TweenPauseMode = TweenPauseMode.BOUND

  /** 播放速度倍率 */
  private _speedScale: number = 1.0

  /** 是否并行执行所有补间器 */
  private _parallel: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'Tween') {
    super(name)
    this.initializeTweenSignals()
  }

  /**
   * 初始化补间动画特有的信号
   */
  private initializeTweenSignals(): void {
    this.addUserSignal('tween_started')
    this.addUserSignal('tween_step')
    this.addUserSignal('tween_completed')
    this.addUserSignal('tween_all_completed')
  }

  // ========================================================================
  // 补间器创建方法
  // ========================================================================

  /**
   * 创建属性补间
   * @param target 目标对象
   * @param property 属性路径
   * @param to 目标值
   * @param duration 持续时间
   */
  tweenProperty(target: any, property: string, to: any, duration: number): PropertyTweener {
    const tweener = new PropertyTweener(target, property, to, duration)
    this.append(tweener)
    return tweener
  }

  /**
   * 创建间隔补间
   * @param duration 间隔时间
   */
  tweenInterval(duration: number): IntervalTweener {
    const tweener = new IntervalTweener(duration)
    this.append(tweener)
    return tweener
  }

  /**
   * 创建回调补间
   * @param callback 回调函数
   */
  tweenCallback(callback: Function): CallbackTweener {
    const tweener = new CallbackTweener(callback)
    this.append(tweener)
    return tweener
  }

  /**
   * 添加补间器到队列
   * @param tweener 补间器
   */
  append(tweener: Tweener): void {
    tweener.setTween(this)
    this._tweeners.push(tweener)
  }

  // ========================================================================
  // 播放控制方法
  // ========================================================================

  /**
   * 开始播放补间
   */
  play(): void {
    if (this._tweeners.length === 0) return

    this._isRunning = true
    this._isPaused = false
    this._currentIndex = 0

    // 启动所有补间器（如果是并行模式）
    if (this._parallel) {
      for (const tweener of this._tweeners) {
        tweener.start()
      }
    } else if (this._tweeners.length > 0) {
      // 启动第一个补间器（串行模式）
      this._tweeners[0].start()
    }

    this.emit('tween_started')
  }

  /**
   * 暂停补间
   */
  pause(): void {
    this._isPaused = true
  }

  /**
   * 停止补间
   */
  stop(): void {
    this._isRunning = false
    this._isPaused = false
    this._currentIndex = 0
  }

  /**
   * 完成所有补间
   */
  kill(): void {
    // 完成所有剩余的补间器
    for (let i = this._currentIndex; i < this._tweeners.length; i++) {
      if (this._tweeners[i].isValid()) {
        this._tweeners[i].finish()
      }
    }

    this.stop()
    this.emit('tween_all_completed')
  }

  /**
   * 清除所有补间器
   */
  clear(): void {
    this.stop()
    this._tweeners = []
  }

  // ========================================================================
  // 状态查询方法
  // ========================================================================

  /**
   * 是否正在运行
   */
  isRunning(): boolean {
    return this._isRunning && !this._isPaused
  }

  /**
   * 是否有效（有补间器且正在运行）
   */
  isValid(): boolean {
    return this._tweeners.length > 0 && this._isRunning
  }

  // ========================================================================
  // 配置方法
  // ========================================================================

  /**
   * 设置并行模式
   * @param parallel 是否并行执行
   */
  setParallel(parallel: boolean = true): Tween {
    this._parallel = parallel
    return this
  }

  /**
   * 设置播放速度
   * @param speed 速度倍率
   */
  setSpeedScale(speed: number): Tween {
    this._speedScale = speed
    return this
  }

  /**
   * 设置处理模式
   * @param mode 处理模式
   */
  setProcessMode(mode: TweenProcessMode): Tween {
    this._processMode = mode
    return this
  }

  /**
   * 设置暂停模式
   * @param mode 暂停模式
   */
  setPauseMode(mode: TweenPauseMode): Tween {
    this._pauseMode = mode
    return this
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 处理帧更新
   */
  _process(delta: number): void {
    super._process(delta)

    if (this._processMode === TweenProcessMode.IDLE) {
      this.updateTween(delta)
    }
  }

  /**
   * 处理物理帧更新
   */
  _physicsProcess(delta: number): void {
    super._physicsProcess(delta)

    if (this._processMode === TweenProcessMode.PHYSICS) {
      this.updateTween(delta)
    }
  }

  /**
   * 更新补间动画
   */
  private updateTween(delta: number): void {
    if (!this.isRunning()) return

    const scaledDelta = delta * this._speedScale

    if (this._parallel) {
      this.updateParallelTweeners(scaledDelta)
    } else {
      this.updateSequentialTweeners(scaledDelta)
    }

    this.emit('tween_step')
  }

  /**
   * 更新并行补间器
   */
  private updateParallelTweeners(delta: number): void {
    let activeCount = 0

    for (const tweener of this._tweeners) {
      if (tweener.isValid() && tweener.step(delta)) {
        activeCount++
      }
    }

    // 如果没有活跃的补间器，完成补间
    if (activeCount === 0) {
      this.stop()
      this.emit('tween_all_completed')
    }
  }

  /**
   * 更新串行补间器
   */
  private updateSequentialTweeners(delta: number): void {
    if (this._currentIndex >= this._tweeners.length) {
      this.stop()
      this.emit('tween_all_completed')
      return
    }

    const currentTweener = this._tweeners[this._currentIndex]

    if (!currentTweener.isValid()) {
      this._currentIndex++
      return
    }

    // 更新当前补间器
    if (!currentTweener.step(delta)) {
      // 当前补间器完成，移动到下一个
      this.emit('tween_completed')
      this._currentIndex++

      // 启动下一个补间器
      if (this._currentIndex < this._tweeners.length) {
        this._tweeners[this._currentIndex].start()
      }
    }
  }

  /**
   * 销毁节点时清理资源
   */
  destroy(): void {
    this.clear()
    super.destroy()
  }
}

export default Tween
