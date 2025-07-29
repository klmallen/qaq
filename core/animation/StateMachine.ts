/**
 * QAQ 游戏引擎 动画状态机
 * 管理动画状态转换和混合逻辑
 * 类似于 Godot 的 AnimationTree + AnimationStateMachine
 */

import { QaqObject } from '../object/QaqObject'
import { AnimationClip } from './AnimationClip'

// ============================================================================
// 状态机数据结构
// ============================================================================

export interface StateTransition {
  id: string
  fromState: string
  toState: string
  conditions: TransitionCondition[]
  duration: number // 过渡时间
  priority: number // 优先级，数值越高优先级越高
}

export interface TransitionCondition {
  parameter: string
  operator: '>' | '<' | '==' | '!=' | '>=' | '<='
  value: number | string | boolean
}

export interface AnimationState {
  id: string
  name: string
  animationClip: AnimationClip | null
  speed: number
  loop: boolean
  position: { x: number, y: number } // 在状态机编辑器中的位置
}

export interface StateMachineParameters {
  [key: string]: number | string | boolean
}

// ============================================================================
// 运行时上下文
// ============================================================================

export interface AnimationContext {
  currentState: string
  previousState: string | null
  transitionProgress: number // 0-1，过渡进度
  transitionDuration: number
  isTransitioning: boolean
  currentTime: number
  parameters: StateMachineParameters
  blendWeights: Map<string, number> // 状态混合权重
}

// ============================================================================
// 动画状态机类
// ============================================================================

export class StateMachine extends QaqObject {
  private _name: string
  private _states: Map<string, AnimationState> = new Map()
  private _transitions: Map<string, StateTransition> = new Map()
  private _parameters: StateMachineParameters = {}
  private _context: AnimationContext
  private _entryState: string | null = null

  constructor(name: string = 'StateMachine') {
    super()
    this._name = name
    this._context = this._createInitialContext()
    this.initializeStateMachineSignals()
  }

  // ========================================================================
  // 基础属性
  // ========================================================================

  get name(): string {
    return this._name
  }

  set name(value: string) {
    if (this._name !== value) {
      this._name = value
      this.emit('name_changed', value)
    }
  }

  get currentState(): string {
    return this._context.currentState
  }

  get isTransitioning(): boolean {
    return this._context.isTransitioning
  }

  get parameters(): Readonly<StateMachineParameters> {
    return this._parameters
  }

  get context(): Readonly<AnimationContext> {
    return this._context
  }

  // ========================================================================
  // 状态管理
  // ========================================================================

  addState(id: string, name: string, animationClip: AnimationClip | null = null): AnimationState {
    const state: AnimationState = {
      id,
      name,
      animationClip,
      speed: 1.0,
      loop: true,
      position: { x: 0, y: 0 }
    }

    this._states.set(id, state)

    // 如果是第一个状态，设为入口状态
    if (this._entryState === null) {
      this._entryState = id
      this._context.currentState = id
    }

    this.emit('state_added', state)
    return state
  }

  removeState(id: string): boolean {
    if (!this._states.has(id)) return false

    // 移除相关的过渡
    const transitionsToRemove: string[] = []
    for (const [transitionId, transition] of this._transitions) {
      if (transition.fromState === id || transition.toState === id) {
        transitionsToRemove.push(transitionId)
      }
    }

    transitionsToRemove.forEach(transitionId => {
      this._transitions.delete(transitionId)
    })

    const removedState = this._states.get(id)!
    this._states.delete(id)

    // 如果删除的是入口状态，选择新的入口状态
    if (this._entryState === id) {
      const remainingStates = Array.from(this._states.keys())
      this._entryState = remainingStates.length > 0 ? remainingStates[0] : null
      this._context.currentState = this._entryState || ''
    }

    this.emit('state_removed', removedState)
    return true
  }

  getState(id: string): AnimationState | null {
    return this._states.get(id) || null
  }

  getAllStates(): AnimationState[] {
    return Array.from(this._states.values())
  }

  setEntryState(id: string): boolean {
    if (!this._states.has(id)) return false
    
    this._entryState = id
    if (!this._context.isTransitioning) {
      this._context.currentState = id
    }
    
    this.emit('entry_state_changed', id)
    return true
  }

  // ========================================================================
  // 过渡管理
  // ========================================================================

  addTransition(
    fromState: string,
    toState: string,
    conditions: TransitionCondition[] = [],
    duration: number = 0.2,
    priority: number = 0
  ): StateTransition {
    if (!this._states.has(fromState) || !this._states.has(toState)) {
      throw new Error(`Invalid state reference in transition: ${fromState} -> ${toState}`)
    }

    const id = `${fromState}_to_${toState}_${Date.now()}`
    const transition: StateTransition = {
      id,
      fromState,
      toState,
      conditions,
      duration,
      priority
    }

    this._transitions.set(id, transition)
    this.emit('transition_added', transition)
    return transition
  }

  removeTransition(id: string): boolean {
    if (!this._transitions.has(id)) return false

    const removedTransition = this._transitions.get(id)!
    this._transitions.delete(id)
    this.emit('transition_removed', removedTransition)
    return true
  }

  getTransition(id: string): StateTransition | null {
    return this._transitions.get(id) || null
  }

  getTransitionsFromState(stateId: string): StateTransition[] {
    return Array.from(this._transitions.values())
      .filter(transition => transition.fromState === stateId)
      .sort((a, b) => b.priority - a.priority) // 按优先级排序
  }

  getAllTransitions(): StateTransition[] {
    return Array.from(this._transitions.values())
  }

  // ========================================================================
  // 参数管理
  // ========================================================================

  setParameter(name: string, value: number | string | boolean): void {
    if (this._parameters[name] !== value) {
      this._parameters[name] = value
      this.emit('parameter_changed', name, value)
    }
  }

  getParameter(name: string): number | string | boolean | undefined {
    return this._parameters[name]
  }

  hasParameter(name: string): boolean {
    return name in this._parameters
  }

  removeParameter(name: string): boolean {
    if (!(name in this._parameters)) return false
    
    delete this._parameters[name]
    this.emit('parameter_removed', name)
    return true
  }

  // ========================================================================
  // 状态机更新逻辑
  // ========================================================================

  update(deltaTime: number): Map<string, { position?: THREE.Vector3, rotation?: THREE.Quaternion, scale?: THREE.Vector3 }> {
    this._context.currentTime += deltaTime

    // 检查状态转换
    if (!this._context.isTransitioning) {
      this._checkTransitions()
    }

    // 更新过渡进度
    if (this._context.isTransitioning) {
      this._updateTransition(deltaTime)
    }

    // 采样动画数据
    return this._sampleAnimations()
  }

  private _checkTransitions(): void {
    const currentStateId = this._context.currentState
    const availableTransitions = this.getTransitionsFromState(currentStateId)

    for (const transition of availableTransitions) {
      if (this._evaluateConditions(transition.conditions)) {
        this._startTransition(transition)
        break
      }
    }
  }

  private _evaluateConditions(conditions: TransitionCondition[]): boolean {
    if (conditions.length === 0) return false

    return conditions.every(condition => {
      const paramValue = this._parameters[condition.parameter]
      if (paramValue === undefined) return false

      switch (condition.operator) {
        case '>': return Number(paramValue) > Number(condition.value)
        case '<': return Number(paramValue) < Number(condition.value)
        case '>=': return Number(paramValue) >= Number(condition.value)
        case '<=': return Number(paramValue) <= Number(condition.value)
        case '==': return paramValue === condition.value
        case '!=': return paramValue !== condition.value
        default: return false
      }
    })
  }

  private _startTransition(transition: StateTransition): void {
    this._context.previousState = this._context.currentState
    this._context.currentState = transition.toState
    this._context.isTransitioning = true
    this._context.transitionProgress = 0
    this._context.transitionDuration = transition.duration

    this.emit('transition_started', transition)
  }

  private _updateTransition(deltaTime: number): void {
    this._context.transitionProgress += deltaTime / this._context.transitionDuration
    
    if (this._context.transitionProgress >= 1.0) {
      this._context.transitionProgress = 1.0
      this._context.isTransitioning = false
      this._context.previousState = null
      this.emit('transition_completed', this._context.currentState)
    }
  }

  private _sampleAnimations(): Map<string, any> {
    const result = new Map()

    if (this._context.isTransitioning && this._context.previousState) {
      // 混合两个状态的动画
      const currentState = this._states.get(this._context.currentState)
      const previousState = this._states.get(this._context.previousState)

      if (currentState?.animationClip && previousState?.animationClip) {
        const currentSample = currentState.animationClip.sampleAt(this._context.currentTime * currentState.speed)
        const previousSample = previousState.animationClip.sampleAt(this._context.currentTime * previousState.speed)
        
        // 简单的线性混合
        const blendFactor = this._context.transitionProgress
        return this._blendAnimationSamples(previousSample, currentSample, blendFactor)
      }
    } else {
      // 单一状态动画
      const currentState = this._states.get(this._context.currentState)
      if (currentState?.animationClip) {
        return currentState.animationClip.sampleAt(this._context.currentTime * currentState.speed)
      }
    }

    return result
  }

  private _blendAnimationSamples(
    sample1: Map<string, any>,
    sample2: Map<string, any>,
    blendFactor: number
  ): Map<string, any> {
    const result = new Map()
    
    // 获取所有骨骼名称
    const allBones = new Set([...sample1.keys(), ...sample2.keys()])
    
    for (const boneName of allBones) {
      const transform1 = sample1.get(boneName) || {}
      const transform2 = sample2.get(boneName) || {}
      const blendedTransform: any = {}

      // 混合位置
      if (transform1.position && transform2.position) {
        blendedTransform.position = transform1.position.clone().lerp(transform2.position, blendFactor)
      } else if (transform2.position) {
        blendedTransform.position = transform2.position.clone()
      } else if (transform1.position) {
        blendedTransform.position = transform1.position.clone()
      }

      // 混合旋转
      if (transform1.rotation && transform2.rotation) {
        blendedTransform.rotation = transform1.rotation.clone().slerp(transform2.rotation, blendFactor)
      } else if (transform2.rotation) {
        blendedTransform.rotation = transform2.rotation.clone()
      } else if (transform1.rotation) {
        blendedTransform.rotation = transform1.rotation.clone()
      }

      // 混合缩放
      if (transform1.scale && transform2.scale) {
        blendedTransform.scale = transform1.scale.clone().lerp(transform2.scale, blendFactor)
      } else if (transform2.scale) {
        blendedTransform.scale = transform2.scale.clone()
      } else if (transform1.scale) {
        blendedTransform.scale = transform1.scale.clone()
      }

      if (Object.keys(blendedTransform).length > 0) {
        result.set(boneName, blendedTransform)
      }
    }

    return result
  }

  private _createInitialContext(): AnimationContext {
    return {
      currentState: '',
      previousState: null,
      transitionProgress: 0,
      transitionDuration: 0,
      isTransitioning: false,
      currentTime: 0,
      parameters: {},
      blendWeights: new Map()
    }
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  private initializeStateMachineSignals(): void {
    this.addSignal('name_changed')
    this.addSignal('state_added')
    this.addSignal('state_removed')
    this.addSignal('transition_added')
    this.addSignal('transition_removed')
    this.addSignal('entry_state_changed')
    this.addSignal('parameter_changed')
    this.addSignal('parameter_removed')
    this.addSignal('transition_started')
    this.addSignal('transition_completed')
  }
}

export default StateMachine
