/**
 * QAQ游戏引擎 - Panel 面板节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - UI容器面板，类似于Godot的Panel
 * - 提供背景绘制和边框样式
 * - 支持圆角、阴影、渐变等视觉效果
 * - 作为其他UI控件的容器
 * - 支持自定义样式和主题
 * - 优化的批量渲染
 *
 * 继承关系:
 * Node -> CanvasItem -> Control -> Panel
 */

import Control from '../ui/Control'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Panel相关枚举和接口
// ============================================================================

/**
 * 渐变类型
 */
export enum GradientType {
  /** 无渐变 */
  NONE = 0,
  /** 线性渐变 */
  LINEAR = 1,
  /** 径向渐变 */
  RADIAL = 2
}

/**
 * 渐变配置接口
 */
export interface GradientConfig {
  /** 渐变类型 */
  type: GradientType
  /** 起始颜色 */
  startColor: string
  /** 结束颜色 */
  endColor: string
  /** 渐变角度（线性渐变） */
  angle?: number
  /** 渐变中心点（径向渐变） */
  center?: Vector2
  /** 渐变半径（径向渐变） */
  radius?: number
}

/**
 * 阴影配置接口
 */
export interface ShadowConfig {
  /** 阴影颜色 */
  color: string
  /** 阴影偏移 */
  offset: Vector2
  /** 阴影模糊半径 */
  blur: number
  /** 阴影扩散 */
  spread?: number
}

/**
 * 面板样式接口
 */
export interface PanelStyle {
  /** 背景颜色 */
  backgroundColor?: string
  /** 边框颜色 */
  borderColor?: string
  /** 边框宽度 */
  borderWidth?: number
  /** 圆角半径 */
  borderRadius?: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }
  /** 渐变配置 */
  gradient?: GradientConfig
  /** 阴影配置 */
  shadow?: ShadowConfig
  /** 透明度 */
  opacity?: number
}

/**
 * 面板配置接口
 */
export interface PanelConfig {
  /** 面板样式 */
  style?: PanelStyle
  /** 是否可见 */
  visible?: boolean
}

// ============================================================================
// Panel 主类
// ============================================================================

/**
 * Panel 面板节点类
 *
 * 提供UI容器功能，包括背景绘制、边框样式等
 */
export default class Panel extends Control {
  // 样式属性
  private _style: PanelStyle = {}

  // 渲染相关
  private _canvas: HTMLCanvasElement | null = null
  private _context: CanvasRenderingContext2D | null = null
  private _texture: THREE.CanvasTexture | null = null
  private _material: THREE.MeshBasicMaterial | null = null
  private _mesh: THREE.Mesh | null = null
  private _geometry: THREE.PlaneGeometry | null = null

  // 状态
  private _needsRedraw: boolean = true

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 面板配置
   */
  constructor(name: string = 'Panel', config: PanelConfig = {}) {
    super(name)

    // 应用配置
    this._style = { ...this._getDefaultStyle(), ...config.style }

    if (config.visible !== undefined) {
      this.visible = config.visible
    }

    // 初始化渲染对象
    this._initializeRenderObjects()

    // 初始渲染
    this._updatePanel()

    console.log(`✅ Panel节点创建: ${this.name}`)
  }

  // ============================================================================
  // 属性访问器
  // ============================================================================

  /**
   * 获取面板样式
   */
  get style(): PanelStyle {
    return { ...this._style }
  }

  /**
   * 设置面板样式
   */
  set style(value: PanelStyle) {
    this._style = { ...this._style, ...value }
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 获取背景颜色
   */
  get backgroundColor(): string | undefined {
    return this._style.backgroundColor
  }

  /**
   * 设置背景颜色
   */
  set backgroundColor(value: string | undefined) {
    if (this._style.backgroundColor !== value) {
      this._style.backgroundColor = value
      this._needsRedraw = true
      this._updatePanel()
    }
  }

  /**
   * 获取边框颜色
   */
  get borderColor(): string | undefined {
    return this._style.borderColor
  }

  /**
   * 设置边框颜色
   */
  set borderColor(value: string | undefined) {
    if (this._style.borderColor !== value) {
      this._style.borderColor = value
      this._needsRedraw = true
      this._updatePanel()
    }
  }

  /**
   * 获取边框宽度
   */
  get borderWidth(): number | undefined {
    return this._style.borderWidth
  }

  /**
   * 设置边框宽度
   */
  set borderWidth(value: number | undefined) {
    if (this._style.borderWidth !== value) {
      this._style.borderWidth = value
      this._needsRedraw = true
      this._updatePanel()
    }
  }

  /**
   * 获取圆角半径
   */
  get borderRadius(): number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number } | undefined {
    return this._style.borderRadius
  }

  /**
   * 设置圆角半径
   */
  set borderRadius(value: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number } | undefined) {
    this._style.borderRadius = value
    this._needsRedraw = true
    this._updatePanel()
  }

  // ============================================================================
  // 公共方法
  // ============================================================================

  /**
   * 设置渐变背景
   * @param config 渐变配置
   */
  setGradient(config: GradientConfig): void {
    this._style.gradient = config
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 清除渐变背景
   */
  clearGradient(): void {
    this._style.gradient = undefined
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 设置阴影
   * @param config 阴影配置
   */
  setShadow(config: ShadowConfig): void {
    this._style.shadow = config
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 清除阴影
   */
  clearShadow(): void {
    this._style.shadow = undefined
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 设置边框样式
   * @param color 边框颜色
   * @param width 边框宽度
   * @param radius 圆角半径
   */
  setBorder(color: string, width: number, radius?: number): void {
    this._style.borderColor = color
    this._style.borderWidth = width
    if (radius !== undefined) {
      this._style.borderRadius = radius
    }
    this._needsRedraw = true
    this._updatePanel()
  }

  /**
   * 清除边框
   */
  clearBorder(): void {
    this._style.borderColor = undefined
    this._style.borderWidth = undefined
    this._needsRedraw = true
    this._updatePanel()
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 获取默认样式
   */
  private _getDefaultStyle(): PanelStyle {
    return {
      backgroundColor: '#f0f0f0',
      borderColor: '#cccccc',
      borderWidth: 1,
      borderRadius: 0,
      opacity: 1.0
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
    this._mesh.name = `${this.name}_PanelMesh`

    // 添加到场景图
    if (this.object3D) {
      this.object3D.add(this._mesh)
    }
  }

  /**
   * 更新面板显示
   */
  private _updatePanel(): void {
    if (!this._context || !this._canvas || !this._needsRedraw) return

    // 更新Canvas大小
    this._updateCanvasSize()

    // 清除Canvas
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height)

    // 绘制面板
    this._drawPanel()

    // 更新纹理
    if (this._texture) {
      this._texture.needsUpdate = true
    }

    // 更新几何体
    this._updateGeometry()

    // 更新材质透明度
    if (this._material && this._style.opacity !== undefined) {
      this._material.opacity = this._style.opacity
    }

    this._needsRedraw = false
  }

  /**
   * 更新Canvas大小
   */
  private _updateCanvasSize(): void {
    if (!this._canvas) return

    // 考虑阴影扩展
    let extraWidth = 0
    let extraHeight = 0

    if (this._style.shadow) {
      extraWidth = Math.abs(this._style.shadow.offset.x) + this._style.shadow.blur + (this._style.shadow.spread || 0)
      extraHeight = Math.abs(this._style.shadow.offset.y) + this._style.shadow.blur + (this._style.shadow.spread || 0)
    }

    this._canvas.width = this.size.x + extraWidth * 2
    this._canvas.height = this.size.y + extraHeight * 2
  }

  /**
   * 绘制面板
   */
  private _drawPanel(): void {
    if (!this._context || !this._canvas) return

    const width = this.size.x
    const height = this.size.y

    // 计算绘制偏移（考虑阴影）
    let offsetX = 0
    let offsetY = 0

    if (this._style.shadow) {
      offsetX = Math.abs(this._style.shadow.offset.x) + this._style.shadow.blur + (this._style.shadow.spread || 0)
      offsetY = Math.abs(this._style.shadow.offset.y) + this._style.shadow.blur + (this._style.shadow.spread || 0)
    }

    // 绘制阴影
    if (this._style.shadow) {
      this._drawShadow(offsetX, offsetY, width, height)
    }

    // 绘制背景
    this._drawBackground(offsetX, offsetY, width, height)

    // 绘制边框
    if (this._style.borderColor && this._style.borderWidth && this._style.borderWidth > 0) {
      this._drawBorder(offsetX, offsetY, width, height)
    }
  }

  /**
   * 绘制阴影
   */
  private _drawShadow(x: number, y: number, width: number, height: number): void {
    if (!this._context || !this._style.shadow) return

    const shadow = this._style.shadow

    this._context.save()

    // 设置阴影样式
    this._context.shadowColor = shadow.color
    this._context.shadowOffsetX = shadow.offset.x
    this._context.shadowOffsetY = shadow.offset.y
    this._context.shadowBlur = shadow.blur

    // 绘制阴影形状
    this._context.fillStyle = shadow.color
    this._drawRoundedRect(x, y, width, height, this._style.borderRadius || 0)
    this._context.fill()

    this._context.restore()
  }

  /**
   * 绘制背景
   */
  private _drawBackground(x: number, y: number, width: number, height: number): void {
    if (!this._context) return

    // 创建路径
    this._drawRoundedRect(x, y, width, height, this._style.borderRadius || 0)

    // 设置填充样式
    if (this._style.gradient) {
      this._context.fillStyle = this._createGradient(x, y, width, height)
    } else if (this._style.backgroundColor) {
      this._context.fillStyle = this._style.backgroundColor
    }

    // 填充背景
    if (this._style.backgroundColor || this._style.gradient) {
      this._context.fill()
    }
  }

  /**
   * 绘制边框
   */
  private _drawBorder(x: number, y: number, width: number, height: number): void {
    if (!this._context || !this._style.borderColor || !this._style.borderWidth) return

    this._context.strokeStyle = this._style.borderColor
    this._context.lineWidth = this._style.borderWidth

    // 调整位置以避免边框被裁剪
    const borderOffset = this._style.borderWidth / 2
    this._drawRoundedRect(
      x + borderOffset,
      y + borderOffset,
      width - this._style.borderWidth,
      height - this._style.borderWidth,
      this._style.borderRadius || 0
    )

    this._context.stroke()
  }

  /**
   * 绘制圆角矩形路径
   */
  private _drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number | { topLeft: number; topRight: number; bottomLeft: number; bottomRight: number }
  ): void {
    if (!this._context) return

    let topLeft = 0, topRight = 0, bottomLeft = 0, bottomRight = 0

    if (typeof radius === 'number') {
      topLeft = topRight = bottomLeft = bottomRight = radius
    } else if (radius) {
      topLeft = radius.topLeft
      topRight = radius.topRight
      bottomLeft = radius.bottomLeft
      bottomRight = radius.bottomRight
    }

    this._context.beginPath()
    this._context.moveTo(x + topLeft, y)
    this._context.lineTo(x + width - topRight, y)
    this._context.quadraticCurveTo(x + width, y, x + width, y + topRight)
    this._context.lineTo(x + width, y + height - bottomRight)
    this._context.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height)
    this._context.lineTo(x + bottomLeft, y + height)
    this._context.quadraticCurveTo(x, y + height, x, y + height - bottomLeft)
    this._context.lineTo(x, y + topLeft)
    this._context.quadraticCurveTo(x, y, x + topLeft, y)
    this._context.closePath()
  }

  /**
   * 创建渐变
   */
  private _createGradient(x: number, y: number, width: number, height: number): CanvasGradient {
    if (!this._context || !this._style.gradient) {
      throw new Error('无法创建渐变')
    }

    const gradient = this._style.gradient
    let canvasGradient: CanvasGradient

    switch (gradient.type) {
      case GradientType.LINEAR:
        const angle = (gradient.angle || 0) * Math.PI / 180
        const x1 = x + width / 2 - Math.cos(angle) * width / 2
        const y1 = y + height / 2 - Math.sin(angle) * height / 2
        const x2 = x + width / 2 + Math.cos(angle) * width / 2
        const y2 = y + height / 2 + Math.sin(angle) * height / 2
        canvasGradient = this._context.createLinearGradient(x1, y1, x2, y2)
        break

      case GradientType.RADIAL:
        const centerX = x + (gradient.center?.x || width / 2)
        const centerY = y + (gradient.center?.y || height / 2)
        const radius = gradient.radius || Math.max(width, height) / 2
        canvasGradient = this._context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        break

      default:
        throw new Error('不支持的渐变类型')
    }

    canvasGradient.addColorStop(0, gradient.startColor)
    canvasGradient.addColorStop(1, gradient.endColor)

    return canvasGradient
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
   * 重写大小变化处理
   */
  protected override _onSizeChanged(): void {
    super._onSizeChanged()
    this._needsRedraw = true
    this._updatePanel()
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
