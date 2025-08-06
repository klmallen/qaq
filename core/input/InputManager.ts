/**
 * QAQ游戏引擎 - 输入管理器
 * 
 * 基于UE5 Enhanced Input System设计的现代化输入系统
 * 提供简洁、直观、可扩展的输入处理方案
 * 
 * @author QAQ Engine Team
 * @version 1.0.0
 */

import type { 
  InputAction, 
  InputActionValue, 
  InputMappingContext, 
  InputSettings,
  GamepadState,
  Vector2,
  Vector3 
} from '../../types/core'
import { QaqObject } from '../object/QaqObject'

/**
 * 输入触发事件类型
 */
export enum InputTriggerEvent {
  STARTED = 'started',     // 输入开始
  ONGOING = 'ongoing',     // 输入持续
  TRIGGERED = 'triggered', // 输入触发
  COMPLETED = 'completed', // 输入完成
  CANCELED = 'canceled'    // 输入取消
}

/**
 * 输入动作值类型
 */
export enum InputActionValueType {
  BOOLEAN = 'boolean',
  FLOAT = 'float',
  VECTOR2D = 'vector2d',
  VECTOR3D = 'vector3d'
}

/**
 * 输入动作配置
 */
export interface InputActionConfig {
  name: string
  valueType: InputActionValueType
  deadzone?: number
  sensitivity?: number
  smoothing?: number
  description?: string
}

/**
 * 输入映射配置
 */
export interface InputMappingConfig {
  action: string
  key?: string
  mouseButton?: number
  gamepadButton?: number
  gamepadAxis?: number
  modifiers?: string[]
  scale?: number
  negate?: boolean
}

/**
 * 输入管理器
 * 
 * 提供类似UE5 Enhanced Input System的功能：
 * - 输入动作映射
 * - 多设备支持（键盘、鼠标、手柄）
 * - 输入平滑和死区处理
 * - 运行时动态配置
 * - 输入事件系统
 */
export class InputManager extends QaqObject {
  private static _instance: InputManager | null = null

  // 输入动作和映射
  private _actions: Map<string, InputActionConfig> = new Map()
  private _mappings: Map<string, InputMappingConfig[]> = new Map()
  private _actionValues: Map<string, InputActionValue> = new Map()
  private _previousActionValues: Map<string, InputActionValue> = new Map()

  // 设备状态
  private _keyStates: Map<string, boolean> = new Map()
  private _mouseStates: Map<number, boolean> = new Map()
  private _mousePosition: Vector2 = { x: 0, y: 0 }
  private _mouseDelta: Vector2 = { x: 0, y: 0 }
  private _gamepadStates: Map<number, GamepadState> = new Map()

  // 配置
  private _settings: InputSettings = {
    globalDeadzone: 0.1,
    mouseSensitivity: 1.0,
    gamepadSensitivity: 1.0,
    smoothingFactor: 0.1,
    enableGamepad: true,
    enableMouse: true,
    enableKeyboard: true
  }

  // 事件监听器
  private _actionListeners: Map<string, Array<(value: InputActionValue, event: InputTriggerEvent) => void>> = new Map()
  private _isInitialized: boolean = false

  private constructor() {
    super('InputManager')
  }

  /**
   * 获取单例实例
   */
  static getInstance(): InputManager {
    if (!this._instance) {
      this._instance = new InputManager()
    }
    return this._instance
  }

  /**
   * 初始化输入管理器
   */
  async initialize(settings?: Partial<InputSettings>): Promise<void> {
    if (this._isInitialized) {
      console.warn('InputManager already initialized')
      return
    }

    // 应用设置
    if (settings) {
      this._settings = { ...this._settings, ...settings }
    }

    // 设置事件监听器
    this._setupEventListeners()

    // 加载默认输入映射
    await this._loadDefaultMappings()

    // 检测游戏手柄
    if (this._settings.enableGamepad) {
      this._setupGamepadDetection()
    }

    this._isInitialized = true
    console.log('✅ InputManager initialized')
  }

  /**
   * 销毁输入管理器
   */
  destroy(): void {
    this._removeEventListeners()
    this._actions.clear()
    this._mappings.clear()
    this._actionValues.clear()
    this._actionListeners.clear()
    this._isInitialized = false
    console.log('🗑️ InputManager destroyed')
  }

  // ========================================================================
  // 输入动作管理
  // ========================================================================

  /**
   * 注册输入动作
   */
  registerAction(config: InputActionConfig): void {
    this._actions.set(config.name, config)
    this._actionValues.set(config.name, this._createDefaultValue(config.valueType))
    console.log(`📝 Registered input action: ${config.name}`)
  }

  /**
   * 添加输入映射
   */
  addMapping(mapping: InputMappingConfig): void {
    if (!this._mappings.has(mapping.action)) {
      this._mappings.set(mapping.action, [])
    }
    this._mappings.get(mapping.action)!.push(mapping)
    console.log(`🔗 Added input mapping: ${mapping.key || mapping.mouseButton || mapping.gamepadButton} -> ${mapping.action}`)
  }

  /**
   * 移除输入映射
   */
  removeMapping(action: string, key?: string): void {
    const mappings = this._mappings.get(action)
    if (!mappings) return

    if (key) {
      const index = mappings.findIndex(m => m.key === key)
      if (index !== -1) {
        mappings.splice(index, 1)
        console.log(`🗑️ Removed input mapping: ${key} -> ${action}`)
      }
    } else {
      this._mappings.delete(action)
      console.log(`🗑️ Removed all mappings for action: ${action}`)
    }
  }

  // ========================================================================
  // 输入值获取（类似UE5 API）
  // ========================================================================

  /**
   * 获取输入动作值（类似UE5的GetInputActionValue）
   */
  getActionValue(actionName: string): InputActionValue {
    return this._actionValues.get(actionName) || this._createDefaultValue(InputActionValueType.FLOAT)
  }

  /**
   * 检查输入动作是否被触发（类似UE5的IsInputActionTriggered）
   */
  isActionTriggered(actionName: string): boolean {
    const current = this._actionValues.get(actionName)
    const previous = this._previousActionValues.get(actionName)
    
    if (!current || !previous) return false
    
    // 检查是否从false变为true，或从0变为非0
    if (typeof current.value === 'boolean') {
      return current.value && !previous.value
    } else if (typeof current.value === 'number') {
      return current.value !== 0 && previous.value === 0
    }
    
    return false
  }

  /**
   * 检查输入动作是否正在进行（类似UE5的IsInputActionOngoing）
   */
  isActionOngoing(actionName: string): boolean {
    const value = this._actionValues.get(actionName)
    if (!value) return false
    
    if (typeof value.value === 'boolean') {
      return value.value
    } else if (typeof value.value === 'number') {
      return Math.abs(value.value) > this._settings.globalDeadzone
    }
    
    return false
  }

  /**
   * 获取2D移动向量（便捷方法）
   */
  getMoveVector(forwardAction: string = 'MoveForward', backwardAction: string = 'MoveBackward', 
                leftAction: string = 'MoveLeft', rightAction: string = 'MoveRight'): Vector2 {
    const forward = this.getActionValue(forwardAction).value as number || 0
    const backward = this.getActionValue(backwardAction).value as number || 0
    const left = this.getActionValue(leftAction).value as number || 0
    const right = this.getActionValue(rightAction).value as number || 0
    
    return {
      x: right - left,
      y: forward - backward
    }
  }

  /**
   * 获取鼠标位置
   */
  getMousePosition(): Vector2 {
    return { ...this._mousePosition }
  }

  /**
   * 获取鼠标移动增量
   */
  getMouseDelta(): Vector2 {
    return { ...this._mouseDelta }
  }

  // ========================================================================
  // 事件监听
  // ========================================================================

  /**
   * 监听输入动作事件
   */
  onAction(actionName: string, callback: (value: InputActionValue, event: InputTriggerEvent) => void): void {
    if (!this._actionListeners.has(actionName)) {
      this._actionListeners.set(actionName, [])
    }
    this._actionListeners.get(actionName)!.push(callback)
  }

  /**
   * 移除输入动作监听器
   */
  offAction(actionName: string, callback?: (value: InputActionValue, event: InputTriggerEvent) => void): void {
    const listeners = this._actionListeners.get(actionName)
    if (!listeners) return

    if (callback) {
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    } else {
      this._actionListeners.delete(actionName)
    }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 创建默认输入值
   */
  private _createDefaultValue(type: InputActionValueType): InputActionValue {
    switch (type) {
      case InputActionValueType.BOOLEAN:
        return { value: false, type }
      case InputActionValueType.FLOAT:
        return { value: 0, type }
      case InputActionValueType.VECTOR2D:
        return { value: { x: 0, y: 0 }, type }
      case InputActionValueType.VECTOR3D:
        return { value: { x: 0, y: 0, z: 0 }, type }
      default:
        return { value: 0, type: InputActionValueType.FLOAT }
    }
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    if (this._settings.enableKeyboard) {
      window.addEventListener('keydown', this._onKeyDown.bind(this))
      window.addEventListener('keyup', this._onKeyUp.bind(this))
    }

    if (this._settings.enableMouse) {
      window.addEventListener('mousedown', this._onMouseDown.bind(this))
      window.addEventListener('mouseup', this._onMouseUp.bind(this))
      window.addEventListener('mousemove', this._onMouseMove.bind(this))
    }
  }

  /**
   * 移除事件监听器
   */
  private _removeEventListeners(): void {
    window.removeEventListener('keydown', this._onKeyDown.bind(this))
    window.removeEventListener('keyup', this._onKeyUp.bind(this))
    window.removeEventListener('mousedown', this._onMouseDown.bind(this))
    window.removeEventListener('mouseup', this._onMouseUp.bind(this))
    window.removeEventListener('mousemove', this._onMouseMove.bind(this))
  }

  /**
   * 键盘按下事件
   */
  private _onKeyDown(event: KeyboardEvent): void {
    this._keyStates.set(event.code, true)
    this._updateActionValues()
  }

  /**
   * 键盘释放事件
   */
  private _onKeyUp(event: KeyboardEvent): void {
    this._keyStates.set(event.code, false)
    this._updateActionValues()
  }

  /**
   * 鼠标按下事件
   */
  private _onMouseDown(event: MouseEvent): void {
    this._mouseStates.set(event.button, true)
    this._updateActionValues()
  }

  /**
   * 鼠标释放事件
   */
  private _onMouseUp(event: MouseEvent): void {
    this._mouseStates.set(event.button, false)
    this._updateActionValues()
  }

  /**
   * 鼠标移动事件
   */
  private _onMouseMove(event: MouseEvent): void {
    const newPosition = { x: event.clientX, y: event.clientY }
    this._mouseDelta = {
      x: newPosition.x - this._mousePosition.x,
      y: newPosition.y - this._mousePosition.y
    }
    this._mousePosition = newPosition
    this._updateActionValues()
  }

  /**
   * 更新输入动作值
   */
  private _updateActionValues(): void {
    // 保存上一帧的值
    this._previousActionValues.clear()
    for (const [action, value] of this._actionValues) {
      this._previousActionValues.set(action, { ...value })
    }

    // 更新当前值
    for (const [actionName, mappings] of this._mappings) {
      const actionConfig = this._actions.get(actionName)
      if (!actionConfig) continue

      let newValue = this._createDefaultValue(actionConfig.valueType)

      // 处理所有映射
      for (const mapping of mappings) {
        const inputValue = this._getInputValue(mapping)
        newValue = this._combineValues(newValue, inputValue, mapping)
      }

      // 应用死区和平滑
      newValue = this._applyDeadzone(newValue, actionConfig.deadzone || this._settings.globalDeadzone)
      newValue = this._applySmoothing(newValue, this._actionValues.get(actionName)!, actionConfig.smoothing || this._settings.smoothingFactor)

      this._actionValues.set(actionName, newValue)

      // 触发事件
      this._triggerActionEvents(actionName, newValue)
    }

    // 重置鼠标增量
    this._mouseDelta = { x: 0, y: 0 }
  }

  /**
   * 获取输入值
   */
  private _getInputValue(mapping: InputMappingConfig): number {
    let value = 0

    // 键盘输入
    if (mapping.key && this._keyStates.get(mapping.key)) {
      value = 1
    }

    // 鼠标按钮
    if (mapping.mouseButton !== undefined && this._mouseStates.get(mapping.mouseButton)) {
      value = 1
    }

    // 鼠标轴（特殊处理）
    if (mapping.key === 'MouseX') {
      value = this._mouseDelta.x * this._settings.mouseSensitivity
    } else if (mapping.key === 'MouseY') {
      value = this._mouseDelta.y * this._settings.mouseSensitivity
    }

    // 游戏手柄（TODO: 实现游戏手柄支持）
    // if (mapping.gamepadButton !== undefined || mapping.gamepadAxis !== undefined) {
    //   value = this._getGamepadValue(mapping)
    // }

    // 应用缩放和取反
    if (mapping.scale !== undefined) {
      value *= mapping.scale
    }
    if (mapping.negate) {
      value = -value
    }

    return value
  }

  /**
   * 组合输入值
   */
  private _combineValues(current: InputActionValue, input: number, mapping: InputMappingConfig): InputActionValue {
    const result = { ...current }

    switch (current.type) {
      case InputActionValueType.BOOLEAN:
        result.value = (result.value as boolean) || (input > 0.5)
        break
      case InputActionValueType.FLOAT:
        result.value = Math.max(result.value as number, Math.abs(input))
        break
      case InputActionValueType.VECTOR2D:
        // TODO: 实现2D向量组合
        break
      case InputActionValueType.VECTOR3D:
        // TODO: 实现3D向量组合
        break
    }

    return result
  }

  /**
   * 应用死区
   */
  private _applyDeadzone(value: InputActionValue, deadzone: number): InputActionValue {
    const result = { ...value }

    if (typeof result.value === 'number') {
      if (Math.abs(result.value) < deadzone) {
        result.value = 0
      }
    }

    return result
  }

  /**
   * 应用平滑
   */
  private _applySmoothing(newValue: InputActionValue, oldValue: InputActionValue, smoothing: number): InputActionValue {
    if (smoothing <= 0) return newValue

    const result = { ...newValue }

    if (typeof result.value === 'number' && typeof oldValue.value === 'number') {
      result.value = oldValue.value + (result.value - oldValue.value) * (1 - smoothing)
    }

    return result
  }

  /**
   * 触发动作事件
   */
  private _triggerActionEvents(actionName: string, value: InputActionValue): void {
    const listeners = this._actionListeners.get(actionName)
    if (!listeners || listeners.length === 0) return

    const previous = this._previousActionValues.get(actionName)
    if (!previous) return

    // 确定事件类型
    let eventType: InputTriggerEvent = InputTriggerEvent.ONGOING

    if (this.isActionTriggered(actionName)) {
      eventType = InputTriggerEvent.TRIGGERED
    } else if (this.isActionOngoing(actionName)) {
      eventType = InputTriggerEvent.ONGOING
    } else if (previous.value !== 0 && value.value === 0) {
      eventType = InputTriggerEvent.COMPLETED
    }

    // 触发监听器
    for (const listener of listeners) {
      try {
        listener(value, eventType)
      } catch (error) {
        console.error('Error in input action listener:', error)
      }
    }
  }

  /**
   * 加载默认输入映射
   */
  private async _loadDefaultMappings(): Promise<void> {
    // 注册默认动作
    this.registerAction({ name: 'MoveForward', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'MoveBackward', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'MoveLeft', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'MoveRight', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'TurnLeft', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'TurnRight', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'Jump', valueType: InputActionValueType.BOOLEAN })
    this.registerAction({ name: 'LookX', valueType: InputActionValueType.FLOAT })
    this.registerAction({ name: 'LookY', valueType: InputActionValueType.FLOAT })

    // 添加默认映射
    this.addMapping({ action: 'MoveForward', key: 'KeyW' })
    this.addMapping({ action: 'MoveBackward', key: 'KeyS' })
    this.addMapping({ action: 'MoveLeft', key: 'KeyA' })
    this.addMapping({ action: 'MoveRight', key: 'KeyD' })
    this.addMapping({ action: 'TurnLeft', key: 'KeyQ' })
    this.addMapping({ action: 'TurnRight', key: 'KeyE' })
    this.addMapping({ action: 'Jump', key: 'Space' })
    this.addMapping({ action: 'LookX', key: 'MouseX' })
    this.addMapping({ action: 'LookY', key: 'MouseY' })

    console.log('✅ Default input mappings loaded')
  }

  /**
   * 设置游戏手柄检测
   */
  private _setupGamepadDetection(): void {
    // TODO: 实现游戏手柄检测和支持
    console.log('🎮 Gamepad detection setup (TODO)')
  }

  /**
   * 每帧更新（由Engine调用）
   */
  update(deltaTime: number): void {
    if (!this._isInitialized) return

    // 更新游戏手柄状态
    if (this._settings.enableGamepad) {
      this._updateGamepadStates()
    }

    // 更新输入值
    this._updateActionValues()
  }

  /**
   * 更新游戏手柄状态
   */
  private _updateGamepadStates(): void {
    // TODO: 实现游戏手柄状态更新
  }
}
