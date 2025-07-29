/**
 * QAQ游戏引擎 - Label2D 2D文本标签节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 继承自Sprite2D的2D文本标签
 * - 使用THREE.Sprite渲染到3D场景中
 * - 支持多种字体、大小、颜色、对齐方式
 * - 支持文本换行和自动尺寸调整
 * - 适用于2.5D游戏（如饥荒风格）
 *
 * 继承关系:
 * Node -> Node2D -> Sprite2D -> Label2D
 */

import Sprite2D from './Sprite2D'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Label2D相关枚举和接口
// ============================================================================

/**
 * 文本对齐方式
 */
export enum TextAlign {
  /** 左对齐 */
  LEFT = 0,
  /** 居中对齐 */
  CENTER = 1,
  /** 右对齐 */
  RIGHT = 2
}

/**
 * 垂直对齐方式
 */
export enum VerticalAlign {
  /** 顶部对齐 */
  TOP = 0,
  /** 居中对齐 */
  CENTER = 1,
  /** 底部对齐 */
  BOTTOM = 2
}

/**
 * 文本样式接口
 */
export interface TextStyle {
  /** 字体大小 */
  fontSize?: number
  /** 字体族 */
  fontFamily?: string
  /** 字体颜色 */
  color?: string
  /** 字体粗细 */
  fontWeight?: string
  /** 字体样式 */
  fontStyle?: string
  /** 行高 */
  lineHeight?: number
  /** 文本阴影 */
  textShadow?: {
    offsetX: number
    offsetY: number
    blur: number
    color: string
  }
}

/**
 * 标签配置接口
 */
export interface LabelConfig {
  /** 文本内容 */
  text?: string
  /** 文本样式 */
  style?: TextStyle
  /** 水平对齐 */
  align?: TextAlign
  /** 垂直对齐 */
  verticalAlign?: VerticalAlign
  /** 是否自动换行 */
  autowrap?: boolean
  /** 最大宽度（用于换行） */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
}

// ============================================================================
// Label2D 类实现
// ============================================================================

/**
 * Label2D 类 - 2D文本标签
 *
 * 主要功能:
 * 1. 继承Sprite2D的所有2D渲染功能
 * 2. 提供文本渲染和样式控制
 * 3. 支持多行文本和自动换行
 * 4. 使用Canvas渲染文本内容
 * 5. 自动调整尺寸以适应文本
 */
export default class Label2D extends Sprite2D {
  // ========================================================================
  // 私有属性 - 文本和样式
  // ========================================================================

  /** 文本内容 */
  private _text: string = ''

  /** 文本样式 */
  private _style: Required<TextStyle> = {
    fontSize: 16,
    fontFamily: 'Arial',
    color: '#ffffff',
    fontWeight: 'normal',
    fontStyle: 'normal',
    lineHeight: 1.2,
    textShadow: {
      offsetX: 0,
      offsetY: 0,
      blur: 0,
      color: 'transparent'
    }
  }

  /** 水平对齐方式 */
  private _align: TextAlign = TextAlign.LEFT

  /** 垂直对齐方式 */
  private _verticalAlign: VerticalAlign = VerticalAlign.TOP

  /** 是否自动换行 */
  private _autowrap: boolean = false

  /** 最大宽度 */
  private _maxWidth: number = 0

  /** 最大高度 */
  private _maxHeight: number = 0

  /** Canvas元素用于渲染文本 */
  private _canvas: HTMLCanvasElement | null = null

  /** Canvas 2D上下文 */
  private _context: CanvasRenderingContext2D | null = null

  /** 是否需要重新渲染 */
  private _needsRedraw: boolean = true

  /** 文本行数组（用于多行文本） */
  private _textLines: string[] = []

  /** 实际文本尺寸 */
  private _textSize: Vector2 = { x: 0, y: 0 }

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 标签配置
   */
  constructor(name: string = 'Label2D', config: LabelConfig = {}) {
    super(name)

    // 应用配置
    this._text = config.text || ''
    this._align = config.align || TextAlign.LEFT
    this._verticalAlign = config.verticalAlign || VerticalAlign.TOP
    this._autowrap = config.autowrap || false
    this._maxWidth = config.maxWidth || 0
    this._maxHeight = config.maxHeight || 0

    // 合并样式配置
    if (config.style) {
      Object.assign(this._style, config.style)
    }

    // 初始化标签
    this._initializeLabel()
    this._updateTextTexture()

    // 初始化标签信号
    this.initializeLabelSignals()
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取文本内容
   */
  get text(): string {
    return this._text
  }

  /**
   * 设置文本内容
   */
  set text(value: string) {
    if (this._text !== value) {
      this._text = value
      this._needsRedraw = true
      this._updateTextTexture()
    }
  }

  /**
   * 获取文本样式
   */
  get style(): TextStyle {
    return { ...this._style }
  }

  /**
   * 设置文本样式
   */
  set style(value: TextStyle) {
    Object.assign(this._style, value)
    this._needsRedraw = true
    this._updateTextTexture()
  }

  /**
   * 获取水平对齐方式
   */
  get align(): TextAlign {
    return this._align
  }

  /**
   * 设置水平对齐方式
   */
  set align(value: TextAlign) {
    if (this._align !== value) {
      this._align = value
      this._needsRedraw = true
      this._updateTextTexture()
    }
  }

  /**
   * 获取垂直对齐方式
   */
  get verticalAlign(): VerticalAlign {
    return this._verticalAlign
  }

  /**
   * 设置垂直对齐方式
   */
  set verticalAlign(value: VerticalAlign) {
    if (this._verticalAlign !== value) {
      this._verticalAlign = value
      this._needsRedraw = true
      this._updateTextTexture()
    }
  }

  /**
   * 获取是否自动换行
   */
  get autowrap(): boolean {
    return this._autowrap
  }

  /**
   * 设置是否自动换行
   */
  set autowrap(value: boolean) {
    if (this._autowrap !== value) {
      this._autowrap = value
      this._needsRedraw = true
      this._updateTextTexture()
    }
  }

  // ========================================================================
  // 私有方法 - 初始化和渲染
  // ========================================================================

  /**
   * 初始化标签
   */
  private _initializeLabel(): void {
    // 创建Canvas
    this._canvas = document.createElement('canvas')
    this._context = this._canvas.getContext('2d')

    if (!this._context) {
      console.error('❌ 无法创建Canvas 2D上下文')
      return
    }
  }

  /**
   * 初始化标签信号
   */
  private initializeLabelSignals(): void {
    this.addSignal('text_changed')
    this.addSignal('style_changed')
  }

  /**
   * 更新文本纹理
   */
  private _updateTextTexture(): void {
    if (!this._canvas || !this._context || !this._needsRedraw) return

    // 准备文本行
    this._prepareTextLines()

    // 计算文本尺寸
    this._calculateTextSize()

    // 设置Canvas尺寸
    this._setupCanvasSize()

    // 清空画布
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)

    // 绘制文本
    this._drawText()

    // 创建或更新纹理
    const texture = new THREE.CanvasTexture(this._canvas)
    texture.needsUpdate = true
    this.texture = texture

    this._needsRedraw = false
  }

  /**
   * 准备文本行
   */
  private _prepareTextLines(): void {
    if (!this._context) return

    this._textLines = []

    if (!this._text) {
      return
    }

    // 设置字体以便测量
    this._context.font = this._getFontString()

    if (this._autowrap && this._maxWidth > 0) {
      // 自动换行
      const words = this._text.split(' ')
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const metrics = this._context.measureText(testLine)

        if (metrics.width > this._maxWidth && currentLine) {
          this._textLines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        this._textLines.push(currentLine)
      }
    } else {
      // 按换行符分割
      this._textLines = this._text.split('\n')
    }
  }

  /**
   * 计算文本尺寸
   */
  private _calculateTextSize(): void {
    if (!this._context || this._textLines.length === 0) {
      this._textSize = { x: 0, y: 0 }
      return
    }

    this._context.font = this._getFontString()

    let maxWidth = 0
    for (const line of this._textLines) {
      const metrics = this._context.measureText(line)
      maxWidth = Math.max(maxWidth, metrics.width)
    }

    const lineHeight = this._style.fontSize * this._style.lineHeight
    const totalHeight = this._textLines.length * lineHeight

    this._textSize = {
      x: Math.ceil(maxWidth),
      y: Math.ceil(totalHeight)
    }
  }

  /**
   * 设置Canvas尺寸
   */
  private _setupCanvasSize(): void {
    if (!this._canvas) return

    const pixelRatio = window.devicePixelRatio || 1
    const width = Math.max(this._textSize.x, 1)
    const height = Math.max(this._textSize.y, 1)

    this._canvas.width = width * pixelRatio
    this._canvas.height = height * pixelRatio

    if (this._context) {
      this._context.scale(pixelRatio, pixelRatio)
    }
  }

  /**
   * 绘制文本
   */
  private _drawText(): void {
    if (!this._context || this._textLines.length === 0) return

    // 设置字体和样式
    this._context.font = this._getFontString()
    this._context.fillStyle = this._style.color
    this._context.textBaseline = 'top'

    // 设置文本对齐
    switch (this._align) {
      case TextAlign.LEFT:
        this._context.textAlign = 'left'
        break
      case TextAlign.CENTER:
        this._context.textAlign = 'center'
        break
      case TextAlign.RIGHT:
        this._context.textAlign = 'right'
        break
    }

    // 绘制文本阴影（如果有）
    if (this._style.textShadow.color !== 'transparent') {
      this._drawTextShadow()
    }

    // 绘制文本
    const lineHeight = this._style.fontSize * this._style.lineHeight
    let startY = 0

    // 计算垂直对齐偏移
    switch (this._verticalAlign) {
      case VerticalAlign.CENTER:
        startY = (this._textSize.y - this._textLines.length * lineHeight) / 2
        break
      case VerticalAlign.BOTTOM:
        startY = this._textSize.y - this._textLines.length * lineHeight
        break
    }

    for (let i = 0; i < this._textLines.length; i++) {
      const line = this._textLines[i]
      const y = startY + i * lineHeight

      let x = 0
      switch (this._align) {
        case TextAlign.CENTER:
          x = this._textSize.x / 2
          break
        case TextAlign.RIGHT:
          x = this._textSize.x
          break
      }

      this._context.fillText(line, x, y)
    }
  }

  /**
   * 绘制文本阴影
   */
  private _drawTextShadow(): void {
    if (!this._context) return

    const shadow = this._style.textShadow
    this._context.save()

    this._context.fillStyle = shadow.color
    this._context.filter = `blur(${shadow.blur}px)`

    const lineHeight = this._style.fontSize * this._style.lineHeight
    let startY = 0

    switch (this._verticalAlign) {
      case VerticalAlign.CENTER:
        startY = (this._textSize.y - this._textLines.length * lineHeight) / 2
        break
      case VerticalAlign.BOTTOM:
        startY = this._textSize.y - this._textLines.length * lineHeight
        break
    }

    for (let i = 0; i < this._textLines.length; i++) {
      const line = this._textLines[i]
      const y = startY + i * lineHeight + shadow.offsetY

      let x = shadow.offsetX
      switch (this._align) {
        case TextAlign.CENTER:
          x = this._textSize.x / 2 + shadow.offsetX
          break
        case TextAlign.RIGHT:
          x = this._textSize.x + shadow.offsetX
          break
      }

      this._context.fillText(line, x, y)
    }

    this._context.restore()
  }

  /**
   * 获取字体字符串
   */
  private _getFontString(): string {
    return `${this._style.fontStyle} ${this._style.fontWeight} ${this._style.fontSize}px ${this._style.fontFamily}`
  }

  // ========================================================================
  // 公共方法
  // ========================================================================

  /**
   * 获取文本实际尺寸
   */
  getTextSize(): Vector2 {
    return { ...this._textSize }
  }

  /**
   * 设置文本颜色
   */
  setTextColor(color: string): void {
    this._style.color = color
    this._needsRedraw = true
    this._updateTextTexture()
  }

  /**
   * 设置字体大小
   */
  setFontSize(size: number): void {
    this._style.fontSize = size
    this._needsRedraw = true
    this._updateTextTexture()
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 销毁标签
   */
  destroy(): void {
    this._canvas = null
    this._context = null
    super.destroy()
  }
}
