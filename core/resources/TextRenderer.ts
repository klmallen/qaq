/**
 * QAQ游戏引擎 - TextRenderer 文字渲染器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 专门的文字纹理生成器
 * - 支持字体、大小、颜色、描边等属性
 * - 参考Godot的Label节点设计
 * - 文字缓存和批量渲染优化
 */

import * as THREE from 'three'

// ============================================================================
// 文字渲染相关接口
// ============================================================================

/**
 * 文字样式配置
 */
export interface TextStyle {
  /** 字体名称 */
  fontFamily?: string
  /** 字体大小 */
  fontSize?: number
  /** 字体粗细 */
  fontWeight?: string | number
  /** 字体样式 */
  fontStyle?: string
  /** 文字颜色 */
  color?: string
  /** 背景颜色 */
  backgroundColor?: string
  /** 描边颜色 */
  strokeColor?: string
  /** 描边宽度 */
  strokeWidth?: number
  /** 阴影颜色 */
  shadowColor?: string
  /** 阴影偏移 */
  shadowOffset?: { x: number, y: number }
  /** 阴影模糊 */
  shadowBlur?: number
  /** 文字对齐 */
  textAlign?: CanvasTextAlign
  /** 垂直对齐 */
  textBaseline?: CanvasTextBaseline
  /** 行高 */
  lineHeight?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 内边距 */
  padding?: { top: number, right: number, bottom: number, left: number }
}

/**
 * 文字渲染结果
 */
export interface TextRenderResult {
  /** 生成的纹理 */
  texture: THREE.Texture
  /** 实际尺寸 */
  size: { width: number, height: number }
  /** 文字度量信息 */
  metrics: TextMetrics
}

// ============================================================================
// TextRenderer 类实现
// ============================================================================

/**
 * TextRenderer 类 - 文字渲染器
 *
 * 主要功能:
 * 1. 文字纹理生成
 * 2. 多样式支持
 * 3. 文字缓存管理
 * 4. 多行文字处理
 * 5. 性能优化
 */
export default class TextRenderer {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 文字纹理缓存 */
  private static _cache: Map<string, TextRenderResult> = new Map()

  /** 默认样式 */
  private static readonly DEFAULT_STYLE: Required<TextStyle> = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 16,
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#000000',
    backgroundColor: 'transparent',
    strokeColor: 'transparent',
    strokeWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: { x: 0, y: 0 },
    shadowBlur: 0,
    textAlign: 'left',
    textBaseline: 'top',
    lineHeight: 1.2,
    maxWidth: 0,
    padding: { top: 4, right: 4, bottom: 4, left: 4 }
  }

  // ========================================================================
  // 静态方法 - 文字渲染
  // ========================================================================

  /**
   * 渲染文字为纹理
   * @param text 文字内容
   * @param style 样式配置
   * @param useCache 是否使用缓存
   * @returns 渲染结果
   */
  static renderText(text: string, style: TextStyle = {}, useCache: boolean = true): TextRenderResult {
    const finalStyle = { ...this.DEFAULT_STYLE, ...style }
    const cacheKey = this._generateCacheKey(text, finalStyle)

    // 检查缓存
    if (useCache && this._cache.has(cacheKey)) {
      const cached = this._cache.get(cacheKey)!
      return {
        texture: cached.texture.clone(),
        size: { ...cached.size },
        metrics: cached.metrics
      }
    }

    // 创建临时canvas进行文字测量
    const measureCanvas = document.createElement('canvas')
    const measureCtx = measureCanvas.getContext('2d')!
    this._applyTextStyle(measureCtx, finalStyle)

    // 处理多行文字
    const lines = this._wrapText(measureCtx, text, finalStyle.maxWidth)
    const lineHeight = finalStyle.fontSize * finalStyle.lineHeight

    // 计算所需尺寸
    let maxWidth = 0
    const metrics = measureCtx.measureText(text)
    
    lines.forEach(line => {
      const lineMetrics = measureCtx.measureText(line)
      maxWidth = Math.max(maxWidth, lineMetrics.width)
    })

    const textWidth = maxWidth
    const textHeight = lines.length * lineHeight
    
    const canvasWidth = Math.ceil(textWidth + finalStyle.padding.left + finalStyle.padding.right + finalStyle.strokeWidth * 2)
    const canvasHeight = Math.ceil(textHeight + finalStyle.padding.top + finalStyle.padding.bottom + finalStyle.strokeWidth * 2)

    // 创建实际渲染canvas
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(canvasWidth, 1)
    canvas.height = Math.max(canvasHeight, 1)
    const ctx = canvas.getContext('2d')!

    // 绘制背景
    if (finalStyle.backgroundColor !== 'transparent') {
      ctx.fillStyle = finalStyle.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 应用文字样式
    this._applyTextStyle(ctx, finalStyle)

    // 计算文字起始位置
    let startX = finalStyle.padding.left + finalStyle.strokeWidth
    let startY = finalStyle.padding.top + finalStyle.strokeWidth + finalStyle.fontSize

    // 根据对齐方式调整位置
    if (finalStyle.textAlign === 'center') {
      startX = canvas.width / 2
    } else if (finalStyle.textAlign === 'right') {
      startX = canvas.width - finalStyle.padding.right - finalStyle.strokeWidth
    }

    // 绘制文字
    lines.forEach((line, index) => {
      const y = startY + index * lineHeight

      // 绘制阴影
      if (finalStyle.shadowColor !== 'transparent') {
        ctx.save()
        ctx.shadowColor = finalStyle.shadowColor
        ctx.shadowOffsetX = finalStyle.shadowOffset.x
        ctx.shadowOffsetY = finalStyle.shadowOffset.y
        ctx.shadowBlur = finalStyle.shadowBlur
        ctx.fillStyle = finalStyle.color
        ctx.fillText(line, startX, y)
        ctx.restore()
      }

      // 绘制描边
      if (finalStyle.strokeWidth > 0 && finalStyle.strokeColor !== 'transparent') {
        ctx.strokeStyle = finalStyle.strokeColor
        ctx.lineWidth = finalStyle.strokeWidth
        ctx.strokeText(line, startX, y)
      }

      // 绘制文字
      ctx.fillStyle = finalStyle.color
      ctx.fillText(line, startX, y)
    })

    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter
    texture.needsUpdate = true

    const result: TextRenderResult = {
      texture,
      size: { width: canvas.width, height: canvas.height },
      metrics
    }

    // 缓存结果
    if (useCache) {
      this._cache.set(cacheKey, {
        texture: texture.clone(),
        size: { ...result.size },
        metrics: result.metrics
      })
    }

    return result
  }

  /**
   * 创建简单文字纹理（快捷方法）
   * @param text 文字内容
   * @param fontSize 字体大小
   * @param color 文字颜色
   * @returns THREE.Texture
   */
  static createSimpleText(text: string, fontSize: number = 16, color: string = '#000000'): THREE.Texture {
    return this.renderText(text, { fontSize, color }).texture
  }

  /**
   * 创建带描边的文字纹理
   * @param text 文字内容
   * @param fontSize 字体大小
   * @param color 文字颜色
   * @param strokeColor 描边颜色
   * @param strokeWidth 描边宽度
   * @returns THREE.Texture
   */
  static createStrokedText(
    text: string, 
    fontSize: number = 16, 
    color: string = '#ffffff', 
    strokeColor: string = '#000000', 
    strokeWidth: number = 2
  ): THREE.Texture {
    return this.renderText(text, { 
      fontSize, 
      color, 
      strokeColor, 
      strokeWidth 
    }).texture
  }

  // ========================================================================
  // 静态方法 - 缓存管理
  // ========================================================================

  /**
   * 清除文字缓存
   * @param pattern 匹配模式（可选）
   */
  static clearCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern)
      for (const [key, result] of this._cache) {
        if (regex.test(key)) {
          result.texture.dispose()
          this._cache.delete(key)
        }
      }
    } else {
      this._cache.forEach(result => result.texture.dispose())
      this._cache.clear()
    }
  }

  /**
   * 获取缓存统计
   * @returns 缓存信息
   */
  static getCacheStats(): { count: number, keys: string[] } {
    return {
      count: this._cache.size,
      keys: Array.from(this._cache.keys())
    }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 应用文字样式到Canvas上下文
   * @param ctx Canvas上下文
   * @param style 样式配置
   */
  private static _applyTextStyle(ctx: CanvasRenderingContext2D, style: Required<TextStyle>): void {
    ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`
    ctx.fillStyle = style.color
    ctx.textAlign = style.textAlign
    ctx.textBaseline = style.textBaseline
  }

  /**
   * 文字换行处理
   * @param ctx Canvas上下文
   * @param text 文字内容
   * @param maxWidth 最大宽度
   * @returns 行数组
   */
  private static _wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    if (maxWidth <= 0) {
      return text.split('\n')
    }

    const lines: string[] = []
    const paragraphs = text.split('\n')

    paragraphs.forEach(paragraph => {
      if (ctx.measureText(paragraph).width <= maxWidth) {
        lines.push(paragraph)
        return
      }

      const words = paragraph.split(' ')
      let currentLine = ''

      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        if (ctx.measureText(testLine).width <= maxWidth) {
          currentLine = testLine
        } else {
          if (currentLine) {
            lines.push(currentLine)
          }
          currentLine = word
        }
      })

      if (currentLine) {
        lines.push(currentLine)
      }
    })

    return lines
  }

  /**
   * 生成缓存键
   * @param text 文字内容
   * @param style 样式配置
   * @returns 缓存键
   */
  private static _generateCacheKey(text: string, style: Required<TextStyle>): string {
    const styleStr = JSON.stringify(style)
    return `${text}|${styleStr}`
  }
}
