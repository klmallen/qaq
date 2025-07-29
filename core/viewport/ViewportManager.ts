/**
 * QAQ游戏引擎 - 视口管理器
 *
 * 管理多个视口，提供视口切换和协调功能
 */

import Viewport from './Viewport'
import type { Vector2, Rect2 } from '../../types/core'
import { QaqObject } from '../object/QaqObject'

/**
 * 视口管理器
 *
 * 负责管理游戏中的所有视口，提供：
 * - 多视口管理
 * - 视口切换
 * - 坐标转换路由
 * - 渲染顺序管理
 */
export class ViewportManager extends QaqObject {
  private static _instance: ViewportManager | null = null

  private _viewports: Map<string, Viewport> = new Map()
  private _activeViewport: Viewport | null = null
  private _canvasSize: Vector2 = { x: 800, y: 600 }

  private constructor() {
    super('ViewportManager')
  }

  // ========================================================================
  // 信号初始化
  // ========================================================================

  protected initializeSignals(): void {
    super.initializeSignals()

    // 添加视口管理器特有的信号
    this.addSignal('viewport_added')
    this.addSignal('viewport_removed')
    this.addSignal('active_viewport_changed')
    this.addSignal('canvas_size_changed')
    this.addSignal('reset')
  }

  /**
   * 获取视口管理器单例
   */
  static getInstance(): ViewportManager {
    if (!ViewportManager._instance) {
      ViewportManager._instance = new ViewportManager()
    }
    return ViewportManager._instance
  }

  // ========================================================================
  // 视口管理
  // ========================================================================

  /**
   * 添加视口
   */
  addViewport(name: string, viewport: Viewport): void {
    if (this._viewports.has(name)) {
      console.warn(`Viewport '${name}' already exists, replacing...`)
    }

    this._viewports.set(name, viewport)

    // 如果没有活动视口，设置为活动视口
    if (!this._activeViewport) {
      this._activeViewport = viewport
    }

    this.emit('viewport_added', { name, viewport })
  }

  /**
   * 移除视口
   */
  removeViewport(name: string): boolean {
    const viewport = this._viewports.get(name)
    if (!viewport) {
      return false
    }

    this._viewports.delete(name)

    // 如果移除的是活动视口，切换到第一个可用视口
    if (this._activeViewport === viewport) {
      const firstViewport = this._viewports.values().next().value
      this._activeViewport = firstViewport || null
    }

    this.emit('viewport_removed', { name, viewport })
    return true
  }

  /**
   * 获取视口
   */
  getViewport(name: string): Viewport | null {
    return this._viewports.get(name) || null
  }

  /**
   * 获取所有视口
   */
  getAllViewports(): Map<string, Viewport> {
    return new Map(this._viewports)
  }

  /**
   * 设置活动视口
   */
  setActiveViewport(name: string): boolean {
    const viewport = this._viewports.get(name)
    if (!viewport) {
      console.warn(`Viewport '${name}' not found`)
      return false
    }

    if (this._activeViewport !== viewport) {
      const oldViewport = this._activeViewport
      this._activeViewport = viewport
      this.emit('active_viewport_changed', { old: oldViewport, new: viewport })
    }

    return true
  }

  /**
   * 获取活动视口
   */
  getActiveViewport(): Viewport | null {
    return this._activeViewport
  }

  // ========================================================================
  // 画布管理
  // ========================================================================

  /**
   * 设置画布大小
   */
  setCanvasSize(width: number, height: number): void {
    if (this._canvasSize.x !== width || this._canvasSize.y !== height) {
      this._canvasSize = { x: width, y: height }
      this.emit('canvas_size_changed', this._canvasSize)
    }
  }

  /**
   * 获取画布大小
   */
  getCanvasSize(): Vector2 {
    return { ...this._canvasSize }
  }

  // ========================================================================
  // 坐标转换（路由到活动视口）
  // ========================================================================

  /**
   * 屏幕坐标转世界坐标（使用活动视口）
   */
  screenToWorld(screenPoint: Vector2): Vector2 {
    if (!this._activeViewport) {
      return { ...screenPoint }
    }
    return this._activeViewport.screenToWorld(screenPoint)
  }

  /**
   * 世界坐标转屏幕坐标（使用活动视口）
   */
  worldToScreen(worldPoint: Vector2): Vector2 {
    if (!this._activeViewport) {
      return { ...worldPoint }
    }
    return this._activeViewport.worldToScreen(worldPoint)
  }

  /**
   * 根据屏幕坐标查找对应的视口
   */
  findViewportAtScreen(screenPoint: Vector2): Viewport | null {
    // 按渲染优先级排序（高优先级在前）
    const sortedViewports = Array.from(this._viewports.values())
      .filter(v => v.enabled)
      .sort((a, b) => b.renderPriority - a.renderPriority)

    for (const viewport of sortedViewports) {
      const rect = viewport.rect
      if (screenPoint.x >= rect.x && screenPoint.x < rect.x + rect.width &&
          screenPoint.y >= rect.y && screenPoint.y < rect.y + rect.height) {
        return viewport
      }
    }

    return null
  }

  // ========================================================================
  // 预设视口配置
  // ========================================================================

  /**
   * 创建默认的全屏视口
   */
  createDefaultViewport(): void {
    const viewport = Viewport.createFullscreen(this._canvasSize.x, this._canvasSize.y)
    this.addViewport('default', viewport)
    this.setActiveViewport('default')
  }

  /**
   * 创建分屏视口
   */
  createSplitScreenViewports(count: number): void {
    // 清除现有视口
    this._viewports.clear()
    this._activeViewport = null

    for (let i = 0; i < count; i++) {
      const viewport = Viewport.createSplitScreen(
        this._canvasSize.x,
        this._canvasSize.y,
        i,
        count
      )
      this.addViewport(`split_${i}`, viewport)
    }

    // 设置第一个为活动视口
    this.setActiveViewport('split_0')
  }

  /**
   * 创建小地图视口
   */
  createMinimapViewport(size: number = 200, position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right'): void {
    let x: number, y: number

    switch (position) {
      case 'top-left':
        x = 10
        y = 10
        break
      case 'top-right':
        x = this._canvasSize.x - size - 10
        y = 10
        break
      case 'bottom-left':
        x = 10
        y = this._canvasSize.y - size - 10
        break
      case 'bottom-right':
        x = this._canvasSize.x - size - 10
        y = this._canvasSize.y - size - 10
        break
    }

    const viewport = new Viewport({
      rect: { x, y, width: size, height: size },
      worldRect: { x: 0, y: 0, width: 1000, height: 1000 }, // 大范围世界视图
      clipContents: true,
      renderPriority: 100 // 高优先级，在最上层
    })

    this.addViewport('minimap', viewport)
  }

  // ========================================================================
  // 调试和工具方法
  // ========================================================================

  /**
   * 获取视口信息（用于调试）
   */
  getDebugInfo(): any {
    return {
      canvasSize: this._canvasSize,
      activeViewport: this._activeViewport ? 'active' : 'none',
      viewportCount: this._viewports.size,
      viewports: Array.from(this._viewports.entries()).map(([name, viewport]) => ({
        name,
        rect: viewport.rect,
        worldRect: viewport.worldRect,
        enabled: viewport.enabled,
        priority: viewport.renderPriority
      }))
    }
  }

  /**
   * 重置所有视口
   */
  reset(): void {
    this._viewports.clear()
    this._activeViewport = null
    this.emit('reset')
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.reset()
    this.removeAllListeners()
    ViewportManager._instance = null
  }
}

export default ViewportManager
