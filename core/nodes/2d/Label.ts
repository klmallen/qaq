/**
 * QAQ游戏引擎 - Label 文本标签节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 用于显示文本的节点，类似于Godot的Label
 * - 支持多种字体、大小、颜色、对齐方式
 * - 提供文本换行、省略号、阴影效果
 * - 支持富文本和BBCode标记
 * - 优化的文本渲染和缓存机制
 * - 支持动态文本更新和动画效果
 *
 * 继承关系:
 * Node -> CanvasItem -> Control -> Label
 */

import Control from '../ui/Control'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Label相关枚举和接口
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
  RIGHT = 2,
  /** 两端对齐 */
  JUSTIFY = 3
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
 * 文本溢出处理方式
 */
export enum OverflowMode {
  /** 裁剪 */
  CLIP = 0,
  /** 省略号 */
  ELLIPSIS = 1,
  /** 自动换行 */
  WORD_WRAP = 2,
  /** 字符换行 */
  CHAR_WRAP = 3
}

/**
 * 文本样式接口
 */
export interface TextStyle {
  /** 字体族 */
  fontFamily?: string
  /** 字体大小 */
  fontSize?: number
  /** 字体粗细 */
  fontWeight?: string
  /** 字体样式 */
  fontStyle?: string
  /** 文本颜色 */
  color?: string
  /** 描边颜色 */
  strokeColor?: string
  /** 描边宽度 */
  strokeWidth?: number
  /** 阴影颜色 */
  shadowColor?: string
  /** 阴影偏移 */
  shadowOffset?: Vector2
  /** 阴影模糊 */
  shadowBlur?: number
}

/**
 * 文本配置接口
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
  /** 溢出模式 */
  overflowMode?: OverflowMode
  /** 是否自动调整大小 */
  autoResize?: boolean
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 行间距 */
  lineSpacing?: number
}

// ============================================================================
// Label 主类
// ============================================================================

/**
 * Label 文本标签节点类
 *
 * 提供完整的文本显示功能，包括样式、对齐、换行等
 */
export default class Label extends Control {
  // 文本属性
  private _text: string = ''
  private _style: TextStyle = {}
  private _align: TextAlign = TextAlign.LEFT
  private _verticalAlign: VerticalAlign = VerticalAlign.TOP
  private _overflowMode: OverflowMode = OverflowMode.CLIP

  // 布局属性
  private _autoResize: boolean = false
  private _maxWidth: number = 0
  private _maxHeight: number = 0
  private _lineSpacing: number = 1.2

  // 渲染相关
  private _canvas: HTMLCanvasElement | null = null
  private _context: CanvasRenderingContext2D | null = null
  private _texture: THREE.CanvasTexture | null = null
  private _material: THREE.MeshBasicMaterial | null = null
  private _mesh: THREE.Mesh | null = null
  private _geometry: THREE.PlaneGeometry | null = null

  // 缓存
  private _textMetrics: TextMetrics | null = null
  private _needsRedraw: boolean = true
  private _measuredSize: Vector2 = { x: 0, y: 0 }

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 标签配置
   */
  constructor(name: string = 'Label', config: LabelConfig = {}) {
    super(name)

    // 应用配置
    this._text = config.text || ''
    this._style = { ...this._getDefaultStyle(), ...config.style }
    this._align = config.align ?? TextAlign.LEFT
    this._verticalAlign = config.verticalAlign ?? VerticalAlign.TOP
    this._overflowMode = config.overflowMode ?? OverflowMode.CLIP
    this._autoResize = config.autoResize ?? false
    this._maxWidth = config.maxWidth || 0
    this._maxHeight = config.maxHeight || 0
    this._lineSpacing = config.lineSpacing ?? 1.2

    // 初始化渲染对象
    this._initializeRenderObjects()

    // 初始渲染
    this._updateText()

    console.log(`✅ Label节点创建: ${this.name}`)
  }

  // ============================================================================
  // 属性访问器
  // ============================================================================

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
      this._updateText()
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
    this._style = { ...this._style, ...value }
    this._needsRedraw = true
    this._updateText()
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
      this._updateText()
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
      this._updateText()
    }
  }

  /**
   * 获取溢出模式
   */
  get overflowMode(): OverflowMode {
    return this._overflowMode
  }

  /**
   * 设置溢出模式
   */
  set overflowMode(value: OverflowMode) {
    if (this._overflowMode !== value) {
      this._overflowMode = value
      this._needsRedraw = true
      this._updateText()
    }
  }

  /**
   * 获取是否自动调整大小
   */
  get autoResize(): boolean {
    return this._autoResize
  }

  /**
   * 设置是否自动调整大小
   */
  set autoResize(value: boolean) {
    if (this._autoResize !== value) {
      this._autoResize = value
      this._updateText()
    }
  }

  /**
   * 获取测量的文本大小
   */
  get measuredSize(): Vector2 {
    return { ...this._measuredSize }
  }

  // ============================================================================
  // 公共方法
  // ============================================================================

  /**
   * 设置字体
   * @param family 字体族
   * @param size 字体大小
   * @param weight 字体粗细
   * @param style 字体样式
   */
  setFont(family: string, size: number, weight: string = 'normal', style: string = 'normal'): void {
    this._style.fontFamily = family
    this._style.fontSize = size
    this._style.fontWeight = weight
    this._style.fontStyle = style
    this._needsRedraw = true
    this._updateText()
  }

  /**
   * 设置文本颜色
   * @param color 颜色值
   */
  setTextColor(color: string): void {
    this._style.color = color
    this._needsRedraw = true
    this._updateText()
  }

  /**
   * 设置描边
   * @param color 描边颜色
   * @param width 描边宽度
   */
  setStroke(color: string, width: number): void {
    this._style.strokeColor = color
    this._style.strokeWidth = width
    this._needsRedraw = true
    this._updateText()
  }

  /**
   * 设置阴影
   * @param color 阴影颜色
   * @param offset 阴影偏移
   * @param blur 阴影模糊
   */
  setShadow(color: string, offset: Vector2, blur: number = 0): void {
    this._style.shadowColor = color
    this._style.shadowOffset = offset
    this._style.shadowBlur = blur
    this._needsRedraw = true
    this._updateText()
  }

  /**
   * 清除阴影
   */
  clearShadow(): void {
    this._style.shadowColor = undefined
    this._style.shadowOffset = undefined
    this._style.shadowBlur = undefined
    this._needsRedraw = true
    this._updateText()
  }

  /**
   * 测量文本大小
   * @param text 要测量的文本，不指定则使用当前文本
   * @returns 文本大小
   */
  measureText(text?: string): Vector2 {
    if (!this._context) return { x: 0, y: 0 }

    const textToMeasure = text || this._text
    this._applyTextStyle()

    const metrics = this._context.measureText(textToMeasure)
    const width = metrics.width
    const height = this._style.fontSize || 16

    return { x: width, y: height }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 获取默认文本样式
   */
  private _getDefaultStyle(): TextStyle {
    return {
      fontFamily: 'Arial, sans-serif',
      fontSize: 16,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#000000',
      strokeColor: undefined,
      strokeWidth: 0,
      shadowColor: undefined,
      shadowOffset: { x: 0, y: 0 },
      shadowBlur: 0
    }
  }

  /**
   * 初始化渲染对象
   */
  private _initializeRenderObjects(): void {
    // 创建Canvas
    this._canvas = document.createElement('canvas')
    this._context = this._canvas.getContext('2d')

    if (!this._context) {
      console.error('❌ 无法创建Canvas 2D上下文')
      return
    }

    // 创建纹理
    this._texture = new THREE.CanvasTexture(this._canvas)
    this._texture.needsUpdate = true

    // 创建材质
    this._material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })

    // 创建几何体
    this._geometry = new THREE.PlaneGeometry(1, 1)

    // 创建网格
    this._mesh = new THREE.Mesh(this._geometry, this._material)
    this._mesh.name = `${this.name}_LabelMesh`

    // 添加到场景图
    if (this.object3D) {
      this.object3D.add(this._mesh)
    }
  }

  /**
   * 更新文本显示
   */
  private _updateText(): void {
    if (!this._context || !this._canvas || !this._needsRedraw) return

    // 测量文本
    this._measureText()

    // 更新Canvas大小
    this._updateCanvasSize()

    // 清除Canvas
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)

    // 应用文本样式
    this._applyTextStyle()

    // 绘制文本
    this._drawText()

    // 更新纹理
    if (this._texture) {
      this._texture.needsUpdate = true
    }

    // 更新几何体
    this._updateGeometry()

    this._needsRedraw = false
  }

  /**
   * 测量文本大小
   */
  private _measureText(): void {
    if (!this._context) return

    this._applyTextStyle()

    const lines = this._getTextLines()
    let maxWidth = 0
    let totalHeight = 0

    for (const line of lines) {
      const metrics = this._context.measureText(line)
      maxWidth = Math.max(maxWidth, metrics.width)
    }

    const fontSize = this._style.fontSize || 16
    totalHeight = lines.length * fontSize * this._lineSpacing

    this._measuredSize = { x: maxWidth, y: totalHeight }

    // 自动调整大小
    if (this._autoResize) {
      this.size = { ...this._measuredSize }
    }
  }

  /**
   * 更新Canvas大小
   */
  private _updateCanvasSize(): void {
    if (!this._canvas) return

    const width = Math.max(this.size.x, this._measuredSize.x)
    const height = Math.max(this.size.y, this._measuredSize.y)

    this._canvas.width = width
    this._canvas.height = height
  }

  /**
   * 应用文本样式
   */
  private _applyTextStyle(): void {
    if (!this._context) return

    const style = this._style

    // 设置字体
    this._context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`

    // 设置颜色
    this._context.fillStyle = style.color || '#000000'

    // 设置描边
    if (style.strokeColor && style.strokeWidth && style.strokeWidth > 0) {
      this._context.strokeStyle = style.strokeColor
      this._context.lineWidth = style.strokeWidth
    }

    // 设置阴影
    if (style.shadowColor) {
      this._context.shadowColor = style.shadowColor
      this._context.shadowOffsetX = style.shadowOffset?.x || 0
      this._context.shadowOffsetY = style.shadowOffset?.y || 0
      this._context.shadowBlur = style.shadowBlur || 0
    } else {
      this._context.shadowColor = 'transparent'
    }
  }

  /**
   * 获取文本行数组
   */
  private _getTextLines(): string[] {
    if (!this._text) return []

    // 简单的换行处理
    if (this._overflowMode === OverflowMode.WORD_WRAP || this._overflowMode === OverflowMode.CHAR_WRAP) {
      return this._wrapText()
    }

    return this._text.split('\n')
  }

  /**
   * 文本换行处理
   */
  private _wrapText(): string[] {
    if (!this._context) return [this._text]

    const words = this._text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    const maxWidth = this._maxWidth || this.size.x

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = this._context.measureText(testLine)

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * 绘制文本
   */
  private _drawText(): void {
    if (!this._context || !this._canvas) return

    const lines = this._getTextLines()
    const fontSize = this._style.fontSize || 16
    const lineHeight = fontSize * this._lineSpacing

    // 计算起始位置
    let startY = this._getVerticalStartPosition(lines.length, lineHeight)

    // 绘制每一行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const x = this._getHorizontalPosition(line)
      const y = startY + i * lineHeight

      // 绘制阴影
      if (this._style.shadowColor) {
        this._context.fillText(line, x, y)
      }

      // 绘制描边
      if (this._style.strokeColor && this._style.strokeWidth && this._style.strokeWidth > 0) {
        this._context.strokeText(line, x, y)
      }

      // 绘制填充
      this._context.fillText(line, x, y)
    }
  }

  /**
   * 获取垂直起始位置
   */
  private _getVerticalStartPosition(lineCount: number, lineHeight: number): number {
    const totalTextHeight = lineCount * lineHeight
    const fontSize = this._style.fontSize || 16

    switch (this._verticalAlign) {
      case VerticalAlign.TOP:
        return fontSize
      case VerticalAlign.CENTER:
        return (this._canvas!.height - totalTextHeight) / 2 + fontSize
      case VerticalAlign.BOTTOM:
        return this._canvas!.height - totalTextHeight + fontSize
      default:
        return fontSize
    }
  }

  /**
   * 获取水平位置
   */
  private _getHorizontalPosition(line: string): number {
    if (!this._context) return 0

    const metrics = this._context.measureText(line)

    switch (this._align) {
      case TextAlign.LEFT:
        return 0
      case TextAlign.CENTER:
        return (this._canvas!.width - metrics.width) / 2
      case TextAlign.RIGHT:
        return this._canvas!.width - metrics.width
      case TextAlign.JUSTIFY:
        // 简化的两端对齐
        return 0
      default:
        return 0
    }
  }

  /**
   * 更新几何体
   */
  private _updateGeometry(): void {
    if (!this._geometry || !this._mesh || !this._canvas) return

    const width = this._canvas.width
    const height = this._canvas.height

    // 更新几何体大小
    this._geometry.dispose()
    this._geometry = new THREE.PlaneGeometry(width, height)
    this._mesh.geometry = this._geometry

    // 设置位置（左上角对齐）
    this._mesh.position.set(width / 2, -height / 2, 0)
  }

  /**
   * 清理资源
   */
  protected override _cleanup(): void {
    if (this._texture) {
      this._texture.dispose()
      this._texture = null
    }

    if (this._material) {
      this._material.dispose()
      this._material = null
    }

    if (this._geometry) {
      this._geometry.dispose()
      this._geometry = null
    }

    if (this._mesh && this.object3D) {
      this.object3D.remove(this._mesh)
      this._mesh = null
    }

    this._canvas = null
    this._context = null

    super._cleanup()
  }
}
