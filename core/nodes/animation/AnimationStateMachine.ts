/**
 * QAQ游戏引擎 - 动画状态机
 * 
 * 实现专业级动画状态机功能：
 * - 有限状态机 (FSM) 
 * - 状态转换条件
 * - 参数驱动的状态切换
 * - 状态混合和过渡
 */

import Node from '../Node'
import AnimationPlayer from './AnimationPlayer'

// ============================================================================
// 状态机接口定义
// ============================================================================

/**
 * 状态机参数类型
 */
export type ParameterType = 'bool' | 'int' | 'float' | 'trigger'

/**
 * 状态机参数
 */
export interface StateMachineParameter {
  name: string
  type: ParameterType
  value: boolean | number
  defaultValue: boolean | number
}

/**
 * 状态转换条件
 */
export interface TransitionCondition {
  parameter: string
  operator: '==' | '!=' | '>' | '<' | '>=' | '<='
  value: boolean | number
}

/**
 * 状态转换配置
 */
export interface StateTransition {
  id: string
  fromState: string
  toState: string
  conditions: TransitionCondition[]
  hasExitTime: boolean
  exitTime: number // 0-1之间，表示动画播放的百分比
  transitionDuration: number
  interruptible: boolean
}

/**
 * 动画状态
 */
export interface AnimationState {
  name: string
  animationName: string
  speed: number
  loop: boolean
  transitions: string[] // 转换ID列表
  onEnter?: () => void
  onExit?: () => void
  onUpdate?: (normalizedTime: number) => void
}

// ============================================================================
// 动画状态机类
// ============================================================================

export class AnimationStateMachine extends Node {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 关联的动画播放器 */
  private _animationPlayer: AnimationPlayer | null = null

  /** 状态定义 */
  private _states: Map<string, AnimationState> = new Map()

  /** 转换定义 */
  private _transitions: Map<string, StateTransition> = new Map()

  /** 状态机参数 */
  private _parameters: Map<string, StateMachineParameter> = new Map()

  /** 当前状态 */
  private _currentState: string | null = null

  /** 默认状态 */
  private _defaultState: string | null = null

  /** 当前转换 */
  private _currentTransition: {
    transition: StateTransition
    startTime: number
    normalizedTime: number
  } | null = null

  /** 是否启用调试日志 */
  private _debugEnabled: boolean = false

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  constructor(name: string = 'AnimationStateMachine') {
    super(name)
    this._className = 'AnimationStateMachine'
    this.initializeStateMachineSignals()
  }

  /**
   * 初始化状态机信号
   */
  private initializeStateMachineSignals(): void {
    this.addUserSignal('state_entered', ['state_name'])
    this.addUserSignal('state_exited', ['state_name'])
    this.addUserSignal('transition_started', ['from_state', 'to_state', 'transition_id'])
    this.addUserSignal('transition_finished', ['from_state', 'to_state'])
    this.addUserSignal('parameter_changed', ['parameter_name', 'old_value', 'new_value'])
  }

  /**
   * 设置关联的动画播放器
   */
  setAnimationPlayer(player: AnimationPlayer): void {
    this._animationPlayer = player
    this.log('动画播放器已设置')
  }

  /**
   * 启用或禁用调试日志
   */
  setDebugEnabled(enabled: boolean): void {
    this._debugEnabled = enabled
  }

  // ========================================================================
  // 参数管理
  // ========================================================================

  /**
   * 添加状态机参数
   */
  addParameter(name: string, type: ParameterType, defaultValue: boolean | number = false): void {
    this._parameters.set(name, {
      name,
      type,
      value: defaultValue,
      defaultValue
    })
    this.log(`添加参数: ${name} (${type}) = ${defaultValue}`)
  }

  /**
   * 设置参数值
   */
  setParameter(name: string, value: boolean | number): void {
    const param = this._parameters.get(name)
    if (!param) {
      console.warn(`状态机参数不存在: ${name}`)
      return
    }

    const oldValue = param.value
    
    // 类型检查
    if (param.type === 'bool' && typeof value !== 'boolean') {
      console.warn(`参数 ${name} 期望布尔值，但收到 ${typeof value}`)
      return
    }
    
    if ((param.type === 'int' || param.type === 'float') && typeof value !== 'number') {
      console.warn(`参数 ${name} 期望数值，但收到 ${typeof value}`)
      return
    }

    param.value = value
    this.emit('parameter_changed', name, oldValue, value)
    this.log(`参数变化: ${name} = ${oldValue} -> ${value}`)

    // 触发状态检查
    this.checkTransitions()
  }

  /**
   * 获取参数值
   */
  getParameter(name: string): boolean | number | null {
    const param = this._parameters.get(name)
    return param ? param.value : null
  }

  /**
   * 设置触发器参数
   */
  setTrigger(name: string): void {
    this.setParameter(name, true)
    
    // 触发器在下一帧自动重置
    setTimeout(() => {
      this.setParameter(name, false)
    }, 0)
  }

  // ========================================================================
  // 状态管理
  // ========================================================================

  /**
   * 添加动画状态
   */
  addState(config: Omit<AnimationState, 'transitions'>): void {
    const state: AnimationState = {
      ...config,
      transitions: []
    }
    
    this._states.set(config.name, state)
    this.log(`添加状态: ${config.name} -> ${config.animationName}`)

    // 如果是第一个状态，设为默认状态
    if (this._states.size === 1) {
      this._defaultState = config.name
    }
  }

  /**
   * 设置默认状态
   */
  setDefaultState(stateName: string): void {
    if (!this._states.has(stateName)) {
      console.warn(`状态不存在: ${stateName}`)
      return
    }
    
    this._defaultState = stateName
    this.log(`设置默认状态: ${stateName}`)
  }

  /**
   * 添加状态转换
   */
  addTransition(config: StateTransition): void {
    // 验证状态存在
    if (!this._states.has(config.fromState)) {
      console.warn(`源状态不存在: ${config.fromState}`)
      return
    }
    
    if (!this._states.has(config.toState)) {
      console.warn(`目标状态不存在: ${config.toState}`)
      return
    }

    this._transitions.set(config.id, config)
    
    // 将转换添加到源状态的转换列表
    const fromState = this._states.get(config.fromState)!
    fromState.transitions.push(config.id)
    
    this.log(`添加转换: ${config.fromState} -> ${config.toState} (${config.id})`)
  }

  // ========================================================================
  // 状态机控制
  // ========================================================================

  /**
   * 启动状态机
   */
  start(): void {
    if (!this._animationPlayer) {
      console.warn('状态机启动失败: 未设置动画播放器')
      return
    }

    if (!this._defaultState) {
      console.warn('状态机启动失败: 未设置默认状态')
      return
    }

    this.enterState(this._defaultState)
    this.log('状态机已启动')
  }

  /**
   * 停止状态机
   */
  stop(): void {
    if (this._currentState) {
      this.exitState(this._currentState)
    }
    this._currentState = null
    this._currentTransition = null
    this.log('状态机已停止')
  }

  /**
   * 强制切换到指定状态
   */
  forceState(stateName: string): void {
    if (!this._states.has(stateName)) {
      console.warn(`状态不存在: ${stateName}`)
      return
    }

    if (this._currentState) {
      this.exitState(this._currentState)
    }

    this.enterState(stateName)
    this.log(`强制切换到状态: ${stateName}`)
  }

  // ========================================================================
  // 内部状态管理
  // ========================================================================

  /**
   * 进入状态
   */
  private enterState(stateName: string): void {
    const state = this._states.get(stateName)
    if (!state) return

    this._currentState = stateName
    
    // 播放对应的动画
    if (this._animationPlayer) {
      this._animationPlayer.play(state.animationName)
    }

    // 调用状态回调
    if (state.onEnter) {
      state.onEnter()
    }

    this.emit('state_entered', stateName)
    this.log(`进入状态: ${stateName}`)
  }

  /**
   * 退出状态
   */
  private exitState(stateName: string): void {
    const state = this._states.get(stateName)
    if (!state) return

    // 调用状态回调
    if (state.onExit) {
      state.onExit()
    }

    this.emit('state_exited', stateName)
    this.log(`退出状态: ${stateName}`)
  }

  /**
   * 检查状态转换
   */
  private checkTransitions(): void {
    if (!this._currentState || this._currentTransition) return

    const currentState = this._states.get(this._currentState)
    if (!currentState) return

    // 检查所有可能的转换
    for (const transitionId of currentState.transitions) {
      const transition = this._transitions.get(transitionId)
      if (!transition) continue

      if (this.evaluateTransitionConditions(transition)) {
        this.startTransition(transition)
        break
      }
    }
  }

  /**
   * 评估转换条件
   */
  private evaluateTransitionConditions(transition: StateTransition): boolean {
    for (const condition of transition.conditions) {
      const paramValue = this.getParameter(condition.parameter)
      if (paramValue === null) continue

      let conditionMet = false
      
      switch (condition.operator) {
        case '==':
          conditionMet = paramValue === condition.value
          break
        case '!=':
          conditionMet = paramValue !== condition.value
          break
        case '>':
          conditionMet = (paramValue as number) > (condition.value as number)
          break
        case '<':
          conditionMet = (paramValue as number) < (condition.value as number)
          break
        case '>=':
          conditionMet = (paramValue as number) >= (condition.value as number)
          break
        case '<=':
          conditionMet = (paramValue as number) <= (condition.value as number)
          break
      }

      if (!conditionMet) {
        return false
      }
    }

    return true
  }

  /**
   * 开始状态转换
   */
  private startTransition(transition: StateTransition): void {
    this._currentTransition = {
      transition,
      startTime: performance.now() / 1000,
      normalizedTime: 0
    }

    this.emit('transition_started', transition.fromState, transition.toState, transition.id)
    this.log(`开始转换: ${transition.fromState} -> ${transition.toState}`)

    // 立即切换状态（简化版本）
    this.exitState(transition.fromState)
    this.enterState(transition.toState)
    
    // 设置转换完成定时器
    setTimeout(() => {
      if (this._currentTransition?.transition.id === transition.id) {
        this.finishTransition()
      }
    }, transition.transitionDuration * 1000)
  }

  /**
   * 完成状态转换
   */
  private finishTransition(): void {
    if (!this._currentTransition) return

    const transition = this._currentTransition.transition
    this.emit('transition_finished', transition.fromState, transition.toState)
    this.log(`转换完成: ${transition.fromState} -> ${transition.toState}`)

    this._currentTransition = null
  }

  // ========================================================================
  // 更新和调试
  // ========================================================================

  /**
   * 更新状态机（在Node的_process中自动调用）
   */
  override _process(deltaTime: number): void {
    super._process(deltaTime)

    if (!this._currentState) return

    // 检查转换条件
    this.checkTransitions()

    // 更新当前状态
    const currentState = this._states.get(this._currentState)
    if (currentState?.onUpdate && this._animationPlayer) {
      // 计算标准化时间（0-1）
      const normalizedTime = 0 // 这里需要从AnimationPlayer获取实际的播放进度
      currentState.onUpdate(normalizedTime)
    }
  }

  /**
   * 手动更新状态机（向后兼容）
   */
  update(deltaTime: number): void {
    this._process(deltaTime)
  }

  /**
   * 获取当前状态信息
   */
  getCurrentStateInfo(): {
    currentState: string | null
    isTransitioning: boolean
    transitionProgress: number
    parameters: Record<string, boolean | number>
  } {
    const parameters: Record<string, boolean | number> = {}
    for (const [name, param] of this._parameters.entries()) {
      parameters[name] = param.value
    }

    return {
      currentState: this._currentState,
      isTransitioning: this._currentTransition !== null,
      transitionProgress: this._currentTransition?.normalizedTime || 0,
      parameters
    }
  }

  /**
   * 调试日志
   */
  private log(message: string): void {
    if (this._debugEnabled) {
      console.log(`🎭 [StateMachine] ${message}`)
    }
  }
}

export default AnimationStateMachine
