/**
 * QAQ游戏引擎 - AnimationTree编辑器适配器
 * 
 * 连接编辑器UI与AnimationTree运行时系统
 * 提供双向数据绑定和状态同步
 */

import { ref, reactive, computed, watch } from 'vue'
import AnimationTree, { AnimationNodeType, type AnimationNode } from '../../../core/nodes/animation/AnimationTree'
import { StateMachine, type AnimationState, type StateTransition } from '../../../core/animation/StateMachine'
import AnimationPlayer from '../../../core/nodes/animation/AnimationPlayer'

/**
 * 编辑器状态机节点接口
 */
export interface EditorStateMachineNode {
  id: string
  name: string
  type: 'state' | 'entry' | 'exit'
  position: { x: number; y: number }
  animationName?: string
  speed?: number
  loop?: boolean
}

/**
 * 编辑器状态转换接口
 */
export interface EditorStateTransition {
  id: string
  fromStateId: string
  toStateId: string
  conditions: Array<{
    parameter: string
    operator: string
    value: any
  }>
  duration: number
  priority: number
}

/**
 * 编辑器参数接口
 */
export interface EditorParameter {
  name: string
  type: 'float' | 'int' | 'bool' | 'trigger'
  defaultValue: any
  currentValue: any
}

/**
 * AnimationTree编辑器适配器类
 */
export class AnimationTreeAdapter {
  // 运行时对象
  private animationTree: AnimationTree | null = null
  private stateMachine: StateMachine | null = null
  private animationPlayer: AnimationPlayer | null = null

  // 编辑器响应式数据
  public readonly states = ref<EditorStateMachineNode[]>([])
  public readonly transitions = ref<EditorStateTransition[]>([])
  public readonly parameters = ref<EditorParameter[]>([])
  public readonly currentState = ref<string>('')
  public readonly isPlaying = ref<boolean>(false)

  // 编辑器配置
  public readonly editorConfig = reactive({
    gridSize: 20,
    snapToGrid: true,
    showGrid: true,
    autoLayout: false
  })

  constructor() {
    this.setupWatchers()
  }

  // ========================================================================
  // 初始化和连接
  // ========================================================================

  /**
   * 连接到AnimationTree实例
   * @param tree AnimationTree实例
   * @param player AnimationPlayer实例
   */
  connectToAnimationTree(tree: AnimationTree, player?: AnimationPlayer): void {
    this.animationTree = tree
    this.animationPlayer = player

    // 获取状态机
    this.stateMachine = tree.getStateMachine()
    
    if (this.stateMachine) {
      this.syncFromStateMachine()
      this.setupStateMachineListeners()
    }

    // 设置AnimationPlayer
    if (player) {
      tree.setAnimationPlayer(player)
    }
  }

  /**
   * 创建新的AnimationTree
   * @param name 动画树名称
   */
  createNewAnimationTree(name: string): AnimationTree {
    this.animationTree = new AnimationTree(name)
    this.stateMachine = new StateMachine(`${name}_StateMachine`)
    
    // 设置状态机到动画树
    this.animationTree.setStateMachine(this.stateMachine)
    
    // 创建默认状态
    this.createDefaultStates()
    
    this.syncFromStateMachine()
    this.setupStateMachineListeners()
    
    return this.animationTree
  }

  /**
   * 创建默认状态
   */
  private createDefaultStates(): void {
    if (!this.stateMachine) return

    // 创建入口状态
    const entryState = this.stateMachine.addState('Entry')
    entryState.position = { x: 100, y: 200 }

    // 创建默认空闲状态
    const idleState = this.stateMachine.addState('Idle')
    idleState.position = { x: 300, y: 200 }

    // 设置入口状态
    this.stateMachine.setEntryState('Entry')
  }

  // ========================================================================
  // 数据同步
  // ========================================================================

  /**
   * 从StateMachine同步数据到编辑器
   */
  private syncFromStateMachine(): void {
    if (!this.stateMachine) return

    // 同步状态
    this.syncStatesFromStateMachine()
    
    // 同步转换
    this.syncTransitionsFromStateMachine()
    
    // 同步参数
    this.syncParametersFromStateMachine()
    
    // 同步当前状态
    this.currentState.value = this.stateMachine.currentState
  }

  /**
   * 同步状态数据
   */
  private syncStatesFromStateMachine(): void {
    if (!this.stateMachine) return

    const editorStates: EditorStateMachineNode[] = []
    
    for (const [stateId, state] of this.stateMachine.getAllStates()) {
      editorStates.push({
        id: stateId,
        name: state.name,
        type: stateId === this.stateMachine.getEntryState() ? 'entry' : 'state',
        position: state.position || { x: 0, y: 0 },
        animationName: state.animationClip?.name,
        speed: state.speed,
        loop: state.loop
      })
    }
    
    this.states.value = editorStates
  }

  /**
   * 同步转换数据
   */
  private syncTransitionsFromStateMachine(): void {
    if (!this.stateMachine) return

    const editorTransitions: EditorStateTransition[] = []
    
    for (const [transitionId, transition] of this.stateMachine.getAllTransitions()) {
      editorTransitions.push({
        id: transitionId,
        fromStateId: transition.fromState,
        toStateId: transition.toState,
        conditions: transition.conditions.map(cond => ({
          parameter: cond.parameter,
          operator: cond.operator,
          value: cond.value
        })),
        duration: transition.duration,
        priority: transition.priority
      })
    }
    
    this.transitions.value = editorTransitions
  }

  /**
   * 同步参数数据
   */
  private syncParametersFromStateMachine(): void {
    if (!this.stateMachine) return

    const editorParams: EditorParameter[] = []
    const params = this.stateMachine.parameters
    
    for (const [name, value] of Object.entries(params)) {
      editorParams.push({
        name,
        type: this.inferParameterType(value),
        defaultValue: value,
        currentValue: value
      })
    }
    
    this.parameters.value = editorParams
  }

  /**
   * 推断参数类型
   */
  private inferParameterType(value: any): 'float' | 'int' | 'bool' | 'trigger' {
    if (typeof value === 'boolean') return 'bool'
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'int' : 'float'
    }
    return 'trigger'
  }

  // ========================================================================
  // 编辑器操作API
  // ========================================================================

  /**
   * 添加状态
   * @param name 状态名称
   * @param position 位置
   * @param animationName 动画名称
   */
  addState(name: string, position: { x: number; y: number }, animationName?: string): string {
    if (!this.stateMachine) throw new Error('StateMachine not connected')

    const state = this.stateMachine.addState(name)
    state.position = position
    
    if (animationName) {
      // 这里需要从AnimationPlayer获取AnimationClip
      // 简化实现，实际需要更复杂的逻辑
      state.animationClip = { name: animationName } as any
    }

    this.syncStatesFromStateMachine()
    return state.id
  }

  /**
   * 更新状态
   * @param stateId 状态ID
   * @param updates 更新数据
   */
  updateState(stateId: string, updates: Partial<EditorStateMachineNode>): void {
    if (!this.stateMachine) return

    const state = this.stateMachine.getState(stateId)
    if (!state) return

    if (updates.name) state.name = updates.name
    if (updates.position) state.position = updates.position
    if (updates.speed !== undefined) state.speed = updates.speed
    if (updates.loop !== undefined) state.loop = updates.loop

    this.syncStatesFromStateMachine()
  }

  /**
   * 删除状态
   * @param stateId 状态ID
   */
  removeState(stateId: string): void {
    if (!this.stateMachine) return

    this.stateMachine.removeState(stateId)
    this.syncFromStateMachine()
  }

  /**
   * 添加转换
   * @param fromStateId 源状态ID
   * @param toStateId 目标状态ID
   * @param conditions 转换条件
   */
  addTransition(
    fromStateId: string, 
    toStateId: string, 
    conditions: Array<{ parameter: string; operator: string; value: any }> = []
  ): string {
    if (!this.stateMachine) throw new Error('StateMachine not connected')

    const transition = this.stateMachine.addTransition(fromStateId, toStateId)
    transition.conditions = conditions.map(cond => ({
      parameter: cond.parameter,
      operator: cond.operator as any,
      value: cond.value
    }))

    this.syncTransitionsFromStateMachine()
    return transition.id
  }

  /**
   * 更新转换
   * @param transitionId 转换ID
   * @param updates 更新数据
   */
  updateTransition(transitionId: string, updates: Partial<EditorStateTransition>): void {
    if (!this.stateMachine) return

    const transition = this.stateMachine.getTransition(transitionId)
    if (!transition) return

    if (updates.conditions) {
      transition.conditions = updates.conditions.map(cond => ({
        parameter: cond.parameter,
        operator: cond.operator as any,
        value: cond.value
      }))
    }
    if (updates.duration !== undefined) transition.duration = updates.duration
    if (updates.priority !== undefined) transition.priority = updates.priority

    this.syncTransitionsFromStateMachine()
  }

  /**
   * 删除转换
   * @param transitionId 转换ID
   */
  removeTransition(transitionId: string): void {
    if (!this.stateMachine) return

    this.stateMachine.removeTransition(transitionId)
    this.syncTransitionsFromStateMachine()
  }

  /**
   * 设置参数值
   * @param name 参数名称
   * @param value 参数值
   */
  setParameter(name: string, value: any): void {
    if (!this.animationTree) return

    this.animationTree.setParameter(name, value)
    
    // 更新编辑器参数显示
    const param = this.parameters.value.find(p => p.name === name)
    if (param) {
      param.currentValue = value
    }
  }

  /**
   * 添加参数
   * @param name 参数名称
   * @param type 参数类型
   * @param defaultValue 默认值
   */
  addParameter(name: string, type: 'float' | 'int' | 'bool' | 'trigger', defaultValue: any): void {
    if (!this.stateMachine) return

    this.stateMachine.setParameter(name, defaultValue)
    
    this.parameters.value.push({
      name,
      type,
      defaultValue,
      currentValue: defaultValue
    })
  }

  // ========================================================================
  // 播放控制
  // ========================================================================

  /**
   * 开始播放状态机
   */
  play(): void {
    if (!this.animationTree) return

    this.animationTree.setActive(true)
    this.isPlaying.value = true
  }

  /**
   * 停止播放状态机
   */
  stop(): void {
    if (!this.animationTree) return

    this.animationTree.setActive(false)
    this.isPlaying.value = false
  }

  /**
   * 切换到指定状态
   * @param stateId 状态ID
   */
  travelToState(stateId: string): void {
    if (!this.animationTree) return

    const playback = this.animationTree.getStateMachinePlayback()
    if (playback) {
      playback.travel(stateId)
    }
  }

  // ========================================================================
  // 事件监听
  // ========================================================================

  /**
   * 设置状态机事件监听
   */
  private setupStateMachineListeners(): void {
    if (!this.stateMachine) return

    // 监听状态变化
    this.stateMachine.connect('state_changed', (fromState: string, toState: string) => {
      this.currentState.value = toState
    })

    // 监听参数变化
    this.stateMachine.connect('parameter_changed', (name: string, value: any) => {
      const param = this.parameters.value.find(p => p.name === name)
      if (param) {
        param.currentValue = value
      }
    })
  }

  /**
   * 设置响应式数据监听
   */
  private setupWatchers(): void {
    // 监听参数变化并同步到AnimationTree
    watch(this.parameters, (newParams) => {
      if (!this.animationTree) return
      
      for (const param of newParams) {
        if (param.currentValue !== param.defaultValue) {
          this.animationTree.setParameter(param.name, param.currentValue)
        }
      }
    }, { deep: true })
  }

  // ========================================================================
  // 导入导出
  // ========================================================================

  /**
   * 导出状态机数据
   */
  exportStateMachine(): any {
    return {
      states: this.states.value,
      transitions: this.transitions.value,
      parameters: this.parameters.value,
      editorConfig: this.editorConfig
    }
  }

  /**
   * 导入状态机数据
   * @param data 状态机数据
   */
  importStateMachine(data: any): void {
    if (!this.stateMachine) return

    // 清空现有数据
    this.stateMachine.clear()

    // 导入状态
    for (const stateData of data.states || []) {
      const state = this.stateMachine.addState(stateData.name)
      state.position = stateData.position
      if (stateData.animationName) {
        state.animationClip = { name: stateData.animationName } as any
      }
      state.speed = stateData.speed || 1
      state.loop = stateData.loop || false
    }

    // 导入转换
    for (const transitionData of data.transitions || []) {
      const transition = this.stateMachine.addTransition(
        transitionData.fromStateId,
        transitionData.toStateId
      )
      transition.conditions = transitionData.conditions || []
      transition.duration = transitionData.duration || 0
      transition.priority = transitionData.priority || 0
    }

    // 导入参数
    for (const paramData of data.parameters || []) {
      this.stateMachine.setParameter(paramData.name, paramData.defaultValue)
    }

    // 同步到编辑器
    this.syncFromStateMachine()
  }

  // ========================================================================
  // 清理
  // ========================================================================

  /**
   * 销毁适配器
   */
  destroy(): void {
    this.animationTree = null
    this.stateMachine = null
    this.animationPlayer = null
    
    this.states.value = []
    this.transitions.value = []
    this.parameters.value = []
  }
}

// 创建全局适配器实例
export const animationTreeAdapter = new AnimationTreeAdapter()
