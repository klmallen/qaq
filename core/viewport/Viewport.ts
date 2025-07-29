/**
 * QAQ游戏引擎 - 视口系统
 *
 * 提供独立的视口概念，支持视口与渲染画布的分离
 * 符合现代2D游戏引擎的标准架构
 */

import type { Vector2, Rect2 } from '../../types/core'
import { QaqObject } from '../object/QaqObject'

/**
 * 视口配置接口
 */
export interface ViewportConfig {
  /** 视口在画布中的位置和大小 */
  rect: Rect2
  /** 视口的世界坐标范围 */
  worldRect: Rect2
  /** 是否启用视口裁剪 */
  clipContents: boolean
  /** 视口的渲染优先级 */
  renderPriority: number
}

/**
 * 视口类
 *
 * 负责定义游戏世界的可视区域，支持：
 * - 独立的视口大小和位置
 * - 世界坐标到视口坐标的转换
 * - 视口缩放和偏移
 * - 多视口支持
 */
export class Viewport extends QaqObject {
  private _rect: Rect2
  private _worldRect: Rect2
  private _clipContents: boolean
  private _renderPriority: number
  private _enabled: boolean = true

  // 变换相关
  private _zoom: Vector2 = { x: 1, y: 1 }
  private _offset: Vector2 = { x: 0, y: 0 }

  // 缓存的变换矩阵
  private _transformDirty: boolean = true
  private _viewMatrix: DOMMatrix | null = null
  private _projectionMatrix: DOMMatrix | null = null

  constructor(config: ViewportConfig) {
    super('Viewport')

    this._rect = { ...config.rect }
    this._worldRect = { ...config.worldRect }
    this._clipContents = config.clipContents
    this._renderPriority = config.renderPriority

    this._markTransformDirty()
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  protected initializeSignals(): void {
    super.initializeSignals()

    // 添加视口特有的信号
    this.addSignal('rect_changed')
    this.addSignal('world_rect_changed')
    this.addSignal('zoom_changed')
    this.addSignal('offset_changed')
    this.addSignal('enabled_changed')
    this.addSignal('clip_contents_changed')
    this.addSignal('render_priority_changed')
  }

  // ========================================================================
  // 属性访问器
  // ========================================================================

  /** 视口在画布中的矩形区域 */
  get rect(): Rect2 {
    return { ...this._rect }
  }

  set rect(value: Rect2) {
    if (!this._rectEquals(this._rect, value)) {
      this._rect = { ...value }
      this._markTransformDirty()
      this.emit('rect_changed', this._rect)
    }
  }

  /** 视口对应的世界坐标矩形区域 */
  get worldRect(): Rect2 {
    return { ...this._worldRect }
  }

  set worldRect(value: Rect2) {
    if (!this._rectEquals(this._worldRect, value)) {
      this._worldRect = { ...value }
      this._markTransformDirty()
      this.emit('world_rect_changed', this._worldRect)
    }
  }

  /** 视口缩放 */
  get zoom(): Vector2 {
    return { ...this._zoom }
  }

  set zoom(value: Vector2) {
    if (this._zoom.x !== value.x || this._zoom.y !== value.y) {
      this._zoom = { ...value }
      this._markTransformDirty()
      this.emit('zoom_changed', this._zoom)
    }
  }

  /** 视口偏移 */
  get offset(): Vector2 {
    return { ...this._offset }
  }

  set offset(value: Vector2) {
    if (this._offset.x !== value.x || this._offset.y !== value.y) {
      this._offset = { ...value }
      this._markTransformDirty()
      this.emit('offset_changed', this._offset)
    }
  }

  /** 是否启用视口 */
  get enabled(): boolean {
    return this._enabled
  }

  set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value
      this.emit('enabled_changed', this._enabled)
    }
  }

  /** 是否裁剪内容 */
  get clipContents(): boolean {
    return this._clipContents
  }

  set clipContents(value: boolean) {
    if (this._clipContents !== value) {
      this._clipContents = value
      this.emit('clip_contents_changed', this._clipContents)
    }
  }

  /** 渲染优先级 */
  get renderPriority(): number {
    return this._renderPriority
  }

  set renderPriority(value: number) {
    if (this._renderPriority !== value) {
      this._renderPriority = value
      this.emit('render_priority_changed', this._renderPriority)
    }
  }

  // ========================================================================
  // 坐标转换方法
  // ========================================================================

  /**
   * 世界坐标转视口坐标
   */
  worldToViewport(worldPoint: Vector2): Vector2 {
    const transform = this._getViewMatrix()
    const point = new DOMPoint(worldPoint.x, worldPoint.y)
    const transformed = transform.transformPoint(point)

    return {
      x: transformed.x,
      y: transformed.y
    }
  }

  /**
   * 视口坐标转世界坐标
   */
  viewportToWorld(viewportPoint: Vector2): Vector2 {
    const transform = this._getViewMatrix().inverse()
    const point = new DOMPoint(viewportPoint.x, viewportPoint.y)
    const transformed = transform.transformPoint(point)

    return {
      x: transformed.x,
      y: transformed.y
    }
  }

  /**
   * 屏幕坐标转视口坐标
   */
  screenToViewport(screenPoint: Vector2): Vector2 {
    return {
      x: screenPoint.x - this._rect.x,
      y: screenPoint.y - this._rect.y
    }
  }

  /**
   * 视口坐标转屏幕坐标
   */
  viewportToScreen(viewportPoint: Vector2): Vector2 {
    return {
      x: viewportPoint.x + this._rect.x,
      y: viewportPoint.y + this._rect.y
    }
  }

  /**
   * 屏幕坐标直接转世界坐标
   */
  screenToWorld(screenPoint: Vector2): Vector2 {
    const viewportPoint = this.screenToViewport(screenPoint)
    return this.viewportToWorld(viewportPoint)
  }

  /**
   * 世界坐标直接转屏幕坐标
   */
  worldToScreen(worldPoint: Vector2): Vector2 {
    const viewportPoint = this.worldToViewport(worldPoint)
    return this.viewportToScreen(viewportPoint)
  }

  // ========================================================================
  // 视口操作方法
  // ========================================================================

  /**
   * 设置视口以显示指定的世界区域
   */
  setWorldView(worldRect: Rect2): void {
    this.worldRect = worldRect
  }

  /**
   * 缩放视口以适应指定的世界区域
   */
  fitWorldRect(worldRect: Rect2, maintainAspect: boolean = true): void {
    if (maintainAspect) {
      const viewportAspect = this._rect.width / this._rect.height
      const worldAspect = worldRect.width / worldRect.height

      if (worldAspect > viewportAspect) {
        // 世界更宽，以宽度为准
        const height = worldRect.width / viewportAspect
        const yOffset = (height - worldRect.height) / 2
        this.worldRect = {
          x: worldRect.x,
          y: worldRect.y - yOffset,
          width: worldRect.width,
          height: height
        }
      } else {
        // 世界更高，以高度为准
        const width = worldRect.height * viewportAspect
        const xOffset = (width - worldRect.width) / 2
        this.worldRect = {
          x: worldRect.x - xOffset,
          y: worldRect.y,
          width: width,
          height: worldRect.height
        }
      }
    } else {
      this.worldRect = worldRect
    }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _markTransformDirty(): void {
    this._transformDirty = true
    this._viewMatrix = null
    this._projectionMatrix = null
  }

  private _getViewMatrix(): DOMMatrix {
    if (this._transformDirty || !this._viewMatrix) {
      this._updateViewMatrix()
    }
    return this._viewMatrix!
  }

  private _updateViewMatrix(): void {
    const matrix = new DOMMatrix()

    // 应用缩放
    matrix.scaleSelf(
      this._rect.width / this._worldRect.width * this._zoom.x,
      this._rect.height / this._worldRect.height * this._zoom.y
    )

    // 应用平移
    matrix.translateSelf(
      -this._worldRect.x + this._offset.x,
      -this._worldRect.y + this._offset.y
    )

    this._viewMatrix = matrix
    this._transformDirty = false
  }

  private _rectEquals(a: Rect2, b: Rect2): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
  }

  // ========================================================================
  // 静态工厂方法
  // ========================================================================

  /**
   * 创建全屏视口
   */
  static createFullscreen(canvasWidth: number, canvasHeight: number): Viewport {
    return new Viewport({
      rect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      worldRect: { x: 0, y: 0, width: canvasWidth, height: canvasHeight },
      clipContents: true,
      renderPriority: 0
    })
  }

  /**
   * 创建分屏视口
   */
  static createSplitScreen(
    canvasWidth: number,
    canvasHeight: number,
    index: number,
    totalSplits: number
  ): Viewport {
    const splitWidth = canvasWidth / totalSplits
    return new Viewport({
      rect: { x: index * splitWidth, y: 0, width: splitWidth, height: canvasHeight },
      worldRect: { x: 0, y: 0, width: splitWidth, height: canvasHeight },
      clipContents: true,
      renderPriority: index
    })
  }
}

export default Viewport
