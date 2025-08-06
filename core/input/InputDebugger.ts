/**
 * QAQ游戏引擎 - 输入调试工具
 * 
 * 提供输入系统的调试和可视化功能：
 * - 实时显示输入状态
 * - 输入事件日志
 * - 性能监控
 * - 输入录制和回放
 * 
 * @author QAQ Engine Team
 * @version 1.0.0
 */

import { InputManager, InputTriggerEvent } from './InputManager'
import type { InputActionValue } from '../../types/core'

/**
 * 输入调试器配置
 */
export interface InputDebuggerConfig {
  showOverlay: boolean
  showActionValues: boolean
  showEventLog: boolean
  maxLogEntries: number
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity: number
}

/**
 * 输入事件日志条目
 */
export interface InputLogEntry {
  timestamp: number
  action: string
  event: InputTriggerEvent
  value: InputActionValue
}

/**
 * 输入调试器
 * 
 * 提供输入系统的实时调试和监控功能
 */
export class InputDebugger {
  private static _instance: InputDebugger | null = null

  private _inputManager: InputManager | null = null
  private _config: InputDebuggerConfig
  private _isEnabled: boolean = false
  
  // UI元素
  private _overlayElement: HTMLDivElement | null = null
  private _actionValuesElement: HTMLDivElement | null = null
  private _eventLogElement: HTMLDivElement | null = null
  
  // 数据
  private _eventLog: InputLogEntry[] = []
  private _updateInterval: number | null = null

  private constructor() {
    this._config = {
      showOverlay: true,
      showActionValues: true,
      showEventLog: true,
      maxLogEntries: 50,
      position: 'top-right',
      opacity: 0.8
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(): InputDebugger {
    if (!this._instance) {
      this._instance = new InputDebugger()
    }
    return this._instance
  }

  /**
   * 初始化调试器
   */
  initialize(inputManager: InputManager, config?: Partial<InputDebuggerConfig>): void {
    this._inputManager = inputManager
    
    if (config) {
      this._config = { ...this._config, ...config }
    }

    this._setupEventListeners()
    console.log('✅ InputDebugger initialized')
  }

  /**
   * 启用调试器
   */
  enable(): void {
    if (this._isEnabled) return

    this._isEnabled = true
    this._createOverlay()
    this._startUpdateLoop()
    console.log('🔍 InputDebugger enabled')
  }

  /**
   * 禁用调试器
   */
  disable(): void {
    if (!this._isEnabled) return

    this._isEnabled = false
    this._destroyOverlay()
    this._stopUpdateLoop()
    console.log('🔍 InputDebugger disabled')
  }

  /**
   * 切换调试器状态
   */
  toggle(): void {
    if (this._isEnabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<InputDebuggerConfig>): void {
    this._config = { ...this._config, ...config }
    
    if (this._isEnabled) {
      this._updateOverlayStyle()
    }
  }

  /**
   * 清除事件日志
   */
  clearLog(): void {
    this._eventLog = []
    this._updateEventLogDisplay()
  }

  /**
   * 导出事件日志
   */
  exportLog(): string {
    return JSON.stringify(this._eventLog, null, 2)
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    if (!this._inputManager) return

    // 监听所有输入动作
    const actions = ['MoveForward', 'MoveBackward', 'MoveLeft', 'MoveRight', 'TurnLeft', 'TurnRight', 'Jump', 'LookX', 'LookY']
    
    for (const action of actions) {
      this._inputManager.onAction(action, (value, event) => {
        this._logEvent(action, event, value)
      })
    }
  }

  /**
   * 记录输入事件
   */
  private _logEvent(action: string, event: InputTriggerEvent, value: InputActionValue): void {
    const entry: InputLogEntry = {
      timestamp: Date.now(),
      action,
      event,
      value: { ...value }
    }

    this._eventLog.push(entry)

    // 限制日志条目数量
    if (this._eventLog.length > this._config.maxLogEntries) {
      this._eventLog.shift()
    }

    // 更新显示
    if (this._isEnabled) {
      this._updateEventLogDisplay()
    }
  }

  /**
   * 创建调试覆盖层
   */
  private _createOverlay(): void {
    if (this._overlayElement) return

    // 创建主容器
    this._overlayElement = document.createElement('div')
    this._overlayElement.id = 'qaq-input-debugger'
    this._updateOverlayStyle()

    // 创建标题
    const titleElement = document.createElement('div')
    titleElement.innerHTML = '<strong>🎮 Input Debugger</strong>'
    titleElement.style.cssText = `
      padding: 8px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      font-size: 14px;
      border-bottom: 1px solid #333;
    `
    this._overlayElement.appendChild(titleElement)

    // 创建动作值显示区域
    if (this._config.showActionValues) {
      this._actionValuesElement = document.createElement('div')
      this._actionValuesElement.style.cssText = `
        padding: 8px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-family: monospace;
        font-size: 12px;
        max-height: 200px;
        overflow-y: auto;
      `
      this._overlayElement.appendChild(this._actionValuesElement)
    }

    // 创建事件日志区域
    if (this._config.showEventLog) {
      const logTitle = document.createElement('div')
      logTitle.innerHTML = '<strong>Event Log</strong>'
      logTitle.style.cssText = `
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 12px;
        border-top: 1px solid #333;
      `
      this._overlayElement.appendChild(logTitle)

      this._eventLogElement = document.createElement('div')
      this._eventLogElement.style.cssText = `
        padding: 8px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-family: monospace;
        font-size: 11px;
        max-height: 150px;
        overflow-y: auto;
      `
      this._overlayElement.appendChild(this._eventLogElement)
    }

    document.body.appendChild(this._overlayElement)
  }

  /**
   * 更新覆盖层样式
   */
  private _updateOverlayStyle(): void {
    if (!this._overlayElement) return

    const position = this._getPositionStyle()
    
    this._overlayElement.style.cssText = `
      position: fixed;
      ${position}
      width: 300px;
      background: rgba(0, 0, 0, ${this._config.opacity});
      border: 1px solid #333;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    `
  }

  /**
   * 获取位置样式
   */
  private _getPositionStyle(): string {
    switch (this._config.position) {
      case 'top-left':
        return 'top: 10px; left: 10px;'
      case 'top-right':
        return 'top: 10px; right: 10px;'
      case 'bottom-left':
        return 'bottom: 10px; left: 10px;'
      case 'bottom-right':
        return 'bottom: 10px; right: 10px;'
      default:
        return 'top: 10px; right: 10px;'
    }
  }

  /**
   * 销毁覆盖层
   */
  private _destroyOverlay(): void {
    if (this._overlayElement) {
      document.body.removeChild(this._overlayElement)
      this._overlayElement = null
      this._actionValuesElement = null
      this._eventLogElement = null
    }
  }

  /**
   * 开始更新循环
   */
  private _startUpdateLoop(): void {
    this._updateInterval = window.setInterval(() => {
      this._updateActionValuesDisplay()
    }, 100) // 10 FPS更新频率
  }

  /**
   * 停止更新循环
   */
  private _stopUpdateLoop(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval)
      this._updateInterval = null
    }
  }

  /**
   * 更新动作值显示
   */
  private _updateActionValuesDisplay(): void {
    if (!this._actionValuesElement || !this._inputManager) return

    const actions = ['MoveForward', 'MoveBackward', 'MoveLeft', 'MoveRight', 'TurnLeft', 'TurnRight', 'Jump', 'LookX', 'LookY']
    const lines: string[] = []

    for (const action of actions) {
      const value = this._inputManager.getActionValue(action)
      const isTriggered = this._inputManager.isActionTriggered(action)
      const isOngoing = this._inputManager.isActionOngoing(action)
      
      let status = ''
      if (isTriggered) status = ' [TRIGGERED]'
      else if (isOngoing) status = ' [ONGOING]'
      
      lines.push(`${action}: ${this._formatValue(value.value)}${status}`)
    }

    // 添加鼠标信息
    const mousePos = this._inputManager.getMousePosition()
    const mouseDelta = this._inputManager.getMouseDelta()
    lines.push(`Mouse: (${mousePos.x.toFixed(0)}, ${mousePos.y.toFixed(0)})`)
    lines.push(`Delta: (${mouseDelta.x.toFixed(1)}, ${mouseDelta.y.toFixed(1)})`)

    this._actionValuesElement.innerHTML = lines.join('<br>')
  }

  /**
   * 更新事件日志显示
   */
  private _updateEventLogDisplay(): void {
    if (!this._eventLogElement) return

    const lines = this._eventLog.slice(-10).map(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString()
      const value = this._formatValue(entry.value.value)
      return `${time} ${entry.action} [${entry.event}] ${value}`
    })

    this._eventLogElement.innerHTML = lines.join('<br>')
    this._eventLogElement.scrollTop = this._eventLogElement.scrollHeight
  }

  /**
   * 格式化值显示
   */
  private _formatValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false'
    } else if (typeof value === 'number') {
      return value.toFixed(2)
    } else if (typeof value === 'object' && value !== null) {
      if ('x' in value && 'y' in value) {
        return `(${value.x.toFixed(2)}, ${value.y.toFixed(2)})`
      }
    }
    return String(value)
  }
}
