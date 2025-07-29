/**
 * QAQ游戏引擎 - Button2D 2D按钮节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 继承自Sprite2D的2D按钮控件
 * - 使用THREE.Sprite渲染到3D场景中
 * - 支持点击、悬停、按下等交互
 * - 支持文本显示和样式定制
 * - 适用于2.5D游戏（如饥荒风格）
 *
 * 继承关系:
 * Node -> Node2D -> Sprite2D -> Button2D
 */

import Sprite2D from './Sprite2D'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Button2D相关枚举和接口
// ============================================================================

/**
 * 按钮状态枚举
 */
export enum ButtonState {
  /** 正常状态 */
  NORMAL = 0,
  /** 悬停状态 */
  HOVER = 1,
  /** 按下状态 */
  PRESSED = 2,
  /** 禁用状态 */
  DISABLED = 3
}

/**
 * 按钮样式接口
 */
export interface ButtonStyle {
  /** 背景颜色 */
  backgroundColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框宽度 */
  borderWidth?: number
  /** 文本颜色 */
  textColor?: string
  /** 字体大小 */
  fontSize?: number
  /** 字体族 */
  fontFamily?: string
  /** 圆角半径 */
  borderRadius?: number
}

/**
 * 按钮配置接口
 */
export interface ButtonConfig {
  /** 按钮文本 */
  text?: string
  /** 按钮宽度 */
  width?: number
  /** 按钮高度 */
  height?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 各状态样式 */
  styles?: {
    normal?: ButtonStyle
    hover?: ButtonStyle
    pressed?: ButtonStyle
    disabled?: ButtonStyle
  }
}

// ============================================================================
// Button2D 类实现
// ============================================================================

/**
 * Button2D 类 - 2D按钮控件
 *
 * 主要功能:
 * 1. 继承Sprite2D的所有2D渲染功能
 * 2. 提供按钮交互逻辑
 * 3. 支持多种按钮状态和样式
 * 4. 使用Canvas渲染按钮外观
 * 5. 集成鼠标事件处理
 */
export default class Button2D extends Sprite2D {
  // ========================================================================
  // 私有属性 - 按钮状态和配置
  // ========================================================================

  /** 按钮文本 */
  private _text: string = ''

  /** 按钮宽度 */
  private _width: number = 120

  /** 按钮高度 */
  private _height: number = 40

  /** 是否禁用 */
  private _disabled: boolean = false

  /** 当前按钮状态 */
  private _currentState: ButtonState = ButtonState.NORMAL

  /** 按钮样式配置 */
  private _styles: Required<ButtonConfig['styles']> = {
    normal: {
      backgroundColor: '#007bff',
      borderColor: '#0056b3',
      borderWidth: 2,
      textColor: '#ffffff',
      fontSize: 16,
      fontFamily: 'Arial',
      borderRadius: 4
    },
    hover: {
      backgroundColor: '#0056b3',
      borderColor: '#004085',
      borderWidth: 2,
      textColor: '#ffffff',
      fontSize: 16,
      fontFamily: 'Arial',
      borderRadius: 4
    },
    pressed: {
      backgroundColor: '#004085',
      borderColor: '#002752',
      borderWidth: 2,
      textColor: '#ffffff',
      fontSize: 16,
      fontFamily: 'Arial',
      borderRadius: 4
    },
    disabled: {
      backgroundColor: '#6c757d',
      borderColor: '#545b62',
      borderWidth: 2,
      textColor: '#ffffff',
      fontSize: 16,
      fontFamily: 'Arial',
      borderRadius: 4
    }
  }

  /** Canvas元素用于渲染按钮 */
  private _canvas: HTMLCanvasElement | null = null

  /** Canvas 2D上下文 */
  private _context: CanvasRenderingContext2D | null = null

  /** 是否需要重新渲染 */
  private _needsRedraw: boolean = true

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 按钮配置
   */
  constructor(name: string = 'Button2D', config: ButtonConfig = {}) {
    super(name)

    // 应用配置
    this._text = config.text || 'Button'
    this._width = config.width || 120
    this._height = config.height || 40
    this._disabled = config.disabled || false

    // 合并样式配置
    if (config.styles) {
      Object.assign(this._styles.normal, config.styles.normal)
      Object.assign(this._styles.hover, config.styles.hover)
      Object.assign(this._styles.pressed, config.styles.pressed)
      Object.assign(this._styles.disabled, config.styles.disabled)
    }

    // 初始化按钮
    this._initializeButton()
    this._setupEventListeners()
    this._updateButtonTexture()

    // 初始化按钮信号
    this.initializeButtonSignals()
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
      this._needsRedraw = true
      this._updateButtonTexture()
    }
  }

  /**
   * 获取按钮宽度
   */
  get width(): number {
    return this._width
  }

  /**
   * 设置按钮宽度
   */
  set width(value: number) {
    if (this._width !== value) {
      this._width = value
      this._needsRedraw = true
      this._updateButtonTexture()
    }
  }

  /**
   * 获取按钮高度
   */
  get height(): number {
    return this._height
  }

  /**
   * 设置按钮高度
   */
  set height(value: number) {
    if (this._height !== value) {
      this._height = value
      this._needsRedraw = true
      this._updateButtonTexture()
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
      this._currentState = value ? ButtonState.DISABLED : ButtonState.NORMAL
      this._needsRedraw = true
      this._updateButtonTexture()
    }
  }

  // ========================================================================
  // 私有方法 - 初始化和渲染
  // ========================================================================

  /**
   * 初始化按钮
   */
  private _initializeButton(): void {
    // 创建Canvas
    this._canvas = document.createElement('canvas')
    this._context = this._canvas.getContext('2d')

    if (!this._context) {
      console.error('❌ 无法创建Canvas 2D上下文')
      return
    }

    // 设置Canvas尺寸（使用高分辨率）
    const pixelRatio = window.devicePixelRatio || 1
    this._canvas.width = this._width * pixelRatio * 2
    this._canvas.height = this._height * pixelRatio * 2
    this._context.scale(pixelRatio * 2, pixelRatio * 2)
  }

  /**
   * 初始化按钮信号
   */
  private initializeButtonSignals(): void {
    this.addSignal('pressed')
    this.addSignal('button_down')
    this.addSignal('button_up')
    this.addSignal('mouse_entered')
    this.addSignal('mouse_exited')
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    // 这里需要与引擎的事件系统集成
    // 暂时使用简单的实现
  }

  /**
   * 更新按钮纹理
   */
  private _updateButtonTexture(): void {
    if (!this._canvas || !this._context || !this._needsRedraw) return

    // 获取当前状态的样式
    const style = this._getCurrentStyle()

    // 清空画布
    this._context.clearRect(0, 0, this._width, this._height)

    // 绘制按钮背景
    this._drawButtonBackground(style)

    // 绘制按钮边框
    this._drawButtonBorder(style)

    // 绘制按钮文本
    this._drawButtonText(style)

    // 创建或更新纹理
    const texture = new THREE.CanvasTexture(this._canvas)
    texture.needsUpdate = true
    this.texture = texture

    this._needsRedraw = false
  }

  /**
   * 获取当前状态的样式
   */
  private _getCurrentStyle(): ButtonStyle {
    switch (this._currentState) {
      case ButtonState.HOVER:
        return this._styles.hover
      case ButtonState.PRESSED:
        return this._styles.pressed
      case ButtonState.DISABLED:
        return this._styles.disabled
      default:
        return this._styles.normal
    }
  }

  /**
   * 绘制按钮背景
   */
  private _drawButtonBackground(style: ButtonStyle): void {
    if (!this._context) return

    this._context.fillStyle = style.backgroundColor || '#007bff'
    
    if (style.borderRadius && style.borderRadius > 0) {
      this._drawRoundedRect(0, 0, this._width, this._height, style.borderRadius)
      this._context.fill()
    } else {
      this._context.fillRect(0, 0, this._width, this._height)
    }
  }

  /**
   * 绘制按钮边框
   */
  private _drawButtonBorder(style: ButtonStyle): void {
    if (!this._context || !style.borderWidth || style.borderWidth <= 0) return

    this._context.strokeStyle = style.borderColor || '#0056b3'
    this._context.lineWidth = style.borderWidth

    if (style.borderRadius && style.borderRadius > 0) {
      this._drawRoundedRect(
        style.borderWidth / 2,
        style.borderWidth / 2,
        this._width - style.borderWidth,
        this._height - style.borderWidth,
        style.borderRadius
      )
      this._context.stroke()
    } else {
      this._context.strokeRect(
        style.borderWidth / 2,
        style.borderWidth / 2,
        this._width - style.borderWidth,
        this._height - style.borderWidth
      )
    }
  }

  /**
   * 绘制按钮文本
   */
  private _drawButtonText(style: ButtonStyle): void {
    if (!this._context || !this._text) return

    this._context.fillStyle = style.textColor || '#ffffff'
    this._context.font = `${style.fontSize || 16}px ${style.fontFamily || 'Arial'}`
    this._context.textAlign = 'center'
    this._context.textBaseline = 'middle'

    this._context.fillText(
      this._text,
      this._width / 2,
      this._height / 2
    )
  }

  /**
   * 绘制圆角矩形路径
   */
  private _drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    if (!this._context) return

    this._context.beginPath()
    this._context.moveTo(x + radius, y)
    this._context.lineTo(x + width - radius, y)
    this._context.quadraticCurveTo(x + width, y, x + width, y + radius)
    this._context.lineTo(x + width, y + height - radius)
    this._context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this._context.lineTo(x + radius, y + height)
    this._context.quadraticCurveTo(x, y + height, x, y + height - radius)
    this._context.lineTo(x, y + radius)
    this._context.quadraticCurveTo(x, y, x + radius, y)
    this._context.closePath()
  }

  // ========================================================================
  // 公共方法 - 交互处理
  // ========================================================================

  /**
   * 处理鼠标进入
   */
  onMouseEnter(): void {
    if (!this._disabled && this._currentState !== ButtonState.PRESSED) {
      this._currentState = ButtonState.HOVER
      this._needsRedraw = true
      this._updateButtonTexture()
      this.emit('mouse_entered')
    }
  }

  /**
   * 处理鼠标离开
   */
  onMouseExit(): void {
    if (!this._disabled) {
      this._currentState = ButtonState.NORMAL
      this._needsRedraw = true
      this._updateButtonTexture()
      this.emit('mouse_exited')
    }
  }

  /**
   * 处理鼠标按下
   */
  onMouseDown(): void {
    if (!this._disabled) {
      this._currentState = ButtonState.PRESSED
      this._needsRedraw = true
      this._updateButtonTexture()
      this.emit('button_down')
    }
  }

  /**
   * 处理鼠标释放
   */
  onMouseUp(): void {
    if (!this._disabled) {
      this._currentState = ButtonState.HOVER
      this._needsRedraw = true
      this._updateButtonTexture()
      this.emit('button_up')
      this.emit('pressed')
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 销毁按钮
   */
  destroy(): void {
    this._canvas = null
    this._context = null
    super.destroy()
  }
}
