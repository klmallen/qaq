/**
 * QAQ游戏引擎 - Button 按钮控件
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 可点击的按钮控件，继承自Control
 * - 支持文本、图标和多种按钮状态
 * - 提供完整的交互反馈和事件处理
 * - 支持主题系统和自定义样式
 * - 兼容键盘导航和无障碍访问
 * - 集成坐标转换和深度管理系统
 * - 解决UI事件与3D场景的冲突问题
 *
 * 继承关系:
 * Node -> CanvasItem -> Control -> Button
 */

import Control, { FocusMode, MouseFilter } from './Control'
import type { Vector2, PropertyInfo } from '../../../types/core'
import { UICoordinateSystem } from '../../ui/UICoordinateSystem'
import { UIDepthManager, DepthLayer } from '../../ui/UIDepthManager'
import { UIEventPriority } from '../../ui/UIEventPriority'

// ============================================================================
// Button相关枚举和接口
// ============================================================================

/**
 * 按钮动作模式枚举
 */
export enum ActionMode {
  /** 按下时触发 */
  BUTTON_PRESS = 0,
  /** 释放时触发 */
  BUTTON_RELEASE = 1
}

/**
 * 文本对齐方式枚举
 */
export enum TextAlignment {
  /** 左对齐 */
  LEFT = 0,
  /** 居中对齐 */
  CENTER = 1,
  /** 右对齐 */
  RIGHT = 2
}

/**
 * 图标对齐方式枚举
 */
export enum IconAlignment {
  /** 图标在左侧 */
  LEFT = 0,
  /** 图标在右侧 */
  RIGHT = 1,
  /** 图标在上方 */
  TOP = 2,
  /** 图标在下方 */
  BOTTOM = 3
}

/**
 * 按钮配置接口
 */
export interface ButtonConfig {
  text?: string
  icon?: string
  disabled?: boolean
  toggleMode?: boolean
  flat?: boolean
  actionMode?: ActionMode
  textAlignment?: TextAlignment
  iconAlignment?: IconAlignment
}

// ============================================================================
// Button 类实现
// ============================================================================

/**
 * Button 类 - 按钮控件
 *
 * 主要功能:
 * 1. 文本和图标显示
 * 2. 点击事件处理
 * 3. 状态管理（正常、悬停、按下、禁用）
 * 4. 切换模式支持
 * 5. 键盘导航支持
 */
export class Button extends Control {
  // ========================================================================
  // 私有属性 - 按钮状态和配置
  // ========================================================================

  /** 按钮文本 */
  private _text: string = ''

  /** 图标路径或名称 */
  private _icon: string = ''

  /** 是否禁用 */
  private _disabled: boolean = false

  /** 是否为切换模式 */
  private _toggleMode: boolean = false

  /** 是否为扁平样式 */
  private _flat: boolean = false

  /** 动作模式 */
  private _actionMode: ActionMode = ActionMode.BUTTON_RELEASE

  /** 文本对齐方式 */
  private _textAlignment: TextAlignment = TextAlignment.CENTER

  /** 图标对齐方式 */
  private _iconAlignment: IconAlignment = IconAlignment.LEFT

  /** 是否被按下（切换模式下） */
  private _buttonPressed: boolean = false

  /** 是否保持按下状态（即使鼠标移出） */
  private _keepPressedOutside: boolean = false

  /** 按钮掩码（哪些鼠标按键可以触发） */
  private _buttonMask: number = 1 // 左键

  // 内部状态
  private _isPressed: boolean = false
  private _isHovered: boolean = false

  // DOM元素
  private _buttonElement: HTMLButtonElement | null = null
  private _textElement: HTMLSpanElement | null = null
  private _iconElement: HTMLImageElement | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 按钮配置
   */
  constructor(name: string = 'Button', config: ButtonConfig = {}) {
    super(name)

    // 应用配置
    this._text = config.text || ''
    this._icon = config.icon || ''
    this._disabled = config.disabled || false
    this._toggleMode = config.toggleMode || false
    this._flat = config.flat || false
    this._actionMode = config.actionMode || ActionMode.BUTTON_RELEASE
    this._textAlignment = config.textAlignment || TextAlignment.CENTER
    this._iconAlignment = config.iconAlignment || IconAlignment.LEFT

    // 设置默认焦点模式
    this.focusMode = FocusMode.ALL
    this.mouseFilter = MouseFilter.STOP

    // 注册到UI事件优先级系统
    this.registerToUISystem()

    // 初始化按钮信号
    this.initializeButtonSignals()

    // 创建DOM元素
    this.createButtonElement()

    // 初始化按钮属性
    this.initializeButtonProperties()
  }

  /**
   * 注册到UI系统
   */
  private registerToUISystem(): void {
    // 注册到深度管理系统
    UIDepthManager.registerElement(this.name, this.zIndex || 0, DepthLayer.UI_CONTENT)

    // 注册到事件优先级系统
    UIEventPriority.registerUIElement(this.name, this.zIndex || 0, {
      x: this.position?.x || 0,
      y: this.position?.y || 0,
      width: this.size?.x || 100,
      height: this.size?.y || 30
    })
  }

  /**
   * 初始化按钮特有的信号
   */
  private initializeButtonSignals(): void {
    // 按钮特有信号
    this.addUserSignal('pressed')
    this.addUserSignal('button_down')
    this.addUserSignal('button_up')
    this.addUserSignal('toggled', ['button_pressed'])
  }

  /**
   * 创建按钮DOM元素
   */
  private createButtonElement(): void {
    // 获取Control的DOM容器
    const container = this.object3D?.userData?.domElement
    if (!container) return

    // 创建按钮元素
    this._buttonElement = document.createElement('button')
    this._buttonElement.className = 'qaq-button'
    this._buttonElement.type = 'button'

    // 创建文本元素
    this._textElement = document.createElement('span')
    this._textElement.className = 'qaq-button-text'
    this._textElement.textContent = this._text

    // 创建图标元素（如果有图标）
    if (this._icon) {
      this._iconElement = document.createElement('img')
      this._iconElement.className = 'qaq-button-icon'
      this._iconElement.src = this._icon
      this._iconElement.alt = ''
    }

    // 组装元素
    this.assembleButtonElements()

    // 设置事件监听
    this.setupButtonEvents()

    // 更新样式
    this.updateButtonStyle()

    // 添加到容器
    container.appendChild(this._buttonElement)
  }

  /**
   * 组装按钮元素
   */
  private assembleButtonElements(): void {
    if (!this._buttonElement || !this._textElement) return

    // 清空按钮内容
    this._buttonElement.innerHTML = ''

    // 根据图标对齐方式组装元素
    if (this._iconElement) {
      switch (this._iconAlignment) {
        case IconAlignment.LEFT:
          this._buttonElement.appendChild(this._iconElement)
          this._buttonElement.appendChild(this._textElement)
          break
        case IconAlignment.RIGHT:
          this._buttonElement.appendChild(this._textElement)
          this._buttonElement.appendChild(this._iconElement)
          break
        case IconAlignment.TOP:
          this._buttonElement.style.flexDirection = 'column'
          this._buttonElement.appendChild(this._iconElement)
          this._buttonElement.appendChild(this._textElement)
          break
        case IconAlignment.BOTTOM:
          this._buttonElement.style.flexDirection = 'column'
          this._buttonElement.appendChild(this._textElement)
          this._buttonElement.appendChild(this._iconElement)
          break
      }
    } else {
      this._buttonElement.appendChild(this._textElement)
    }
  }

  /**
   * 设置按钮事件监听
   */
  private setupButtonEvents(): void {
    if (!this._buttonElement) return

    // 鼠标按下事件 - 使用坐标转换系统
    this._buttonElement.addEventListener('mousedown', (e) => {
      if (this._disabled) return

      // 转换坐标并检查边界
      const uiPoint = UICoordinateSystem.domToUI(e, this._buttonElement!)
      if (!UICoordinateSystem.isPointInBounds(uiPoint, { x: this.size?.x || 100, y: this.size?.y || 30 })) {
        return
      }

      // 更新UI事件优先级状态
      UIEventPriority.updateUIElementState(this.name, { isPressed: true })

      this._isPressed = true
      this.updateButtonStyle()
      this.emit('button_down')

      if (this._actionMode === ActionMode.BUTTON_PRESS) {
        this.handlePress()
      }

      // 阻止事件冒泡到3D场景
      e.stopPropagation()
    })

    // 鼠标释放事件
    this._buttonElement.addEventListener('mouseup', (e) => {
      if (this._disabled) return

      const wasPressed = this._isPressed
      this._isPressed = false

      // 更新UI事件优先级状态
      UIEventPriority.updateUIElementState(this.name, { isPressed: false })

      this.updateButtonStyle()
      this.emit('button_up')

      if (wasPressed && this._actionMode === ActionMode.BUTTON_RELEASE) {
        this.handlePress()
      }

      e.stopPropagation()
    })

    // 鼠标进入事件
    this._buttonElement.addEventListener('mouseenter', (e) => {
      this._isHovered = true

      // 更新UI事件优先级状态
      UIEventPriority.updateUIElementState(this.name, { isHovered: true })

      this.updateButtonStyle()
      e.stopPropagation()
    })

    // 鼠标离开事件
    this._buttonElement.addEventListener('mouseleave', (e) => {
      this._isHovered = false
      if (!this._keepPressedOutside) {
        this._isPressed = false
      }

      // 更新UI事件优先级状态
      UIEventPriority.updateUIElementState(this.name, { isHovered: false, isPressed: false })

      this.updateButtonStyle()
      e.stopPropagation()
    })

    // 键盘事件
    this._buttonElement.addEventListener('keydown', (e) => {
      if (this._disabled) return

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.handlePress()
      }

      e.stopPropagation()
    })

    // 焦点事件
    this._buttonElement.addEventListener('focus', (e) => {
      UIEventPriority.setFocus(this.name)
      UIEventPriority.updateUIElementState(this.name, { hasFocus: true })
      this.emit('focus_entered')
      e.stopPropagation()
    })

    this._buttonElement.addEventListener('blur', (e) => {
      UIEventPriority.updateUIElementState(this.name, { hasFocus: false })
      this.emit('focus_exited')
      e.stopPropagation()
    })
  }

  /**
   * 处理按钮按下
   */
  private handlePress(): void {
    if (this._disabled) return

    if (this._toggleMode) {
      this._buttonPressed = !this._buttonPressed
      this.updateButtonStyle()
      this.emit('toggled', this._buttonPressed)
    }

    this.emit('pressed')
  }

  /**
   * 更新按钮样式
   */
  private updateButtonStyle(): void {
    if (!this._buttonElement) return

    // 基础样式
    this._buttonElement.style.display = 'flex'
    this._buttonElement.style.alignItems = 'center'
    this._buttonElement.style.justifyContent = this.getJustifyContent()
    this._buttonElement.style.gap = '4px'
    this._buttonElement.style.padding = '8px 16px'
    this._buttonElement.style.border = this._flat ? 'none' : '1px solid'
    this._buttonElement.style.borderRadius = '4px'
    this._buttonElement.style.fontSize = '14px'
    this._buttonElement.style.fontFamily = 'inherit'
    this._buttonElement.style.cursor = this._disabled ? 'not-allowed' : 'pointer'
    this._buttonElement.style.outline = 'none'
    this._buttonElement.style.transition = 'all 0.2s ease'

    // 状态相关样式
    this.applyStateStyles()
  }

  /**
   * 应用状态相关样式
   */
  private applyStateStyles(): void {
    if (!this._buttonElement) return

    let backgroundColor = '#4a4a4a'
    let borderColor = '#555'
    let textColor = '#ffffff'

    if (this._disabled) {
      backgroundColor = '#2a2a2a'
      borderColor = '#333'
      textColor = '#888'
    } else if (this._buttonPressed || this._isPressed) {
      backgroundColor = '#646cff'
      borderColor = '#535bf2'
    } else if (this._isHovered) {
      backgroundColor = '#5a5a5a'
      borderColor = '#666'
    }

    if (this._flat && !this._isPressed && !this._buttonPressed) {
      backgroundColor = 'transparent'
      borderColor = 'transparent'
    }

    this._buttonElement.style.backgroundColor = backgroundColor
    this._buttonElement.style.borderColor = borderColor
    this._buttonElement.style.color = textColor
  }

  /**
   * 获取文本对齐的justify-content值
   */
  private getJustifyContent(): string {
    switch (this._textAlignment) {
      case TextAlignment.LEFT:
        return 'flex-start'
      case TextAlignment.CENTER:
        return 'center'
      case TextAlignment.RIGHT:
        return 'flex-end'
      default:
        return 'center'
    }
  }

  /**
   * 初始化按钮属性
   */
  private initializeButtonProperties(): void {
    // 这里可以添加属性初始化逻辑
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取按钮文本
   */
  get text(): string {
    return this._text
  }

  /**
   * 设置按钮文本
   */
  set text(value: string) {
    if (this._text !== value) {
      this._text = value
      if (this._textElement) {
        this._textElement.textContent = value
      }
    }
  }

  /**
   * 获取图标
   */
  get icon(): string {
    return this._icon
  }

  /**
   * 设置图标
   */
  set icon(value: string) {
    if (this._icon !== value) {
      this._icon = value

      if (value && !this._iconElement) {
        this._iconElement = document.createElement('img')
        this._iconElement.className = 'qaq-button-icon'
        this._iconElement.alt = ''
      }

      if (this._iconElement) {
        this._iconElement.src = value
        this.assembleButtonElements()
      }
    }
  }

  /**
   * 获取是否禁用
   */
  get disabled(): boolean {
    return this._disabled
  }

  /**
   * 设置是否禁用
   */
  set disabled(value: boolean) {
    if (this._disabled !== value) {
      this._disabled = value
      if (this._buttonElement) {
        this._buttonElement.disabled = value
        this.updateButtonStyle()
      }
    }
  }

  /**
   * 获取是否为切换模式
   */
  get toggleMode(): boolean {
    return this._toggleMode
  }

  /**
   * 设置是否为切换模式
   */
  set toggleMode(value: boolean) {
    this._toggleMode = value
  }

  /**
   * 获取按钮是否被按下（切换模式）
   */
  get buttonPressed(): boolean {
    return this._buttonPressed
  }

  /**
   * 设置按钮是否被按下（切换模式）
   */
  set buttonPressed(value: boolean) {
    if (this._buttonPressed !== value) {
      this._buttonPressed = value
      this.updateButtonStyle()
    }
  }

  /**
   * 获取是否为扁平样式
   */
  get flat(): boolean {
    return this._flat
  }

  /**
   * 设置是否为扁平样式
   */
  set flat(value: boolean) {
    if (this._flat !== value) {
      this._flat = value
      this.updateButtonStyle()
    }
  }

  /**
   * 获取zIndex
   */
  get zIndex(): number {
    return super.zIndex || 0
  }

  /**
   * 设置zIndex并更新深度管理
   */
  set zIndex(value: number) {
    super.zIndex = value

    // 更新深度管理系统
    UIDepthManager.registerElement(this.name, value, DepthLayer.UI_CONTENT)

    // 更新3D位置
    if (this.object3D && this.position) {
      UIDepthManager.setUIPosition(this.object3D, this.position, value, DepthLayer.UI_CONTENT)
    }

    // 更新事件优先级系统
    UIEventPriority.updateUIElementState(this.name, { zIndex: value })
  }

  /**
   * 更新位置时同步到UI系统
   */
  updatePosition(): void {
    if (this.position) {
      // 更新事件优先级系统的边界信息
      UIEventPriority.updateUIElementState(this.name, {
        bounds: {
          x: this.position.x,
          y: this.position.y,
          width: this.size?.x || 100,
          height: this.size?.y || 30
        }
      })

      // 更新3D深度位置
      if (this.object3D) {
        UIDepthManager.setUIPosition(this.object3D, this.position, this.zIndex, DepthLayer.UI_CONTENT)
      }
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 节点准备就绪时调用
   */
  _ready(): void {
    super._ready()

    // 确保UI系统注册正确
    this.registerToUISystem()
    this.updatePosition()
  }

  /**
   * 节点销毁时清理资源
   */
  destroy(): void {
    // 从UI系统中注销
    UIDepthManager.unregisterElement(this.name)
    UIEventPriority.unregisterUIElement(this.name)

    if (this._buttonElement) {
      this._buttonElement.remove()
      this._buttonElement = null
    }
    this._textElement = null
    this._iconElement = null

    super.destroy()
  }
}

export default Button
