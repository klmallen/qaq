/**
 * QAQ游戏引擎 - Camera2D 2D相机节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 2D场景的相机节点，继承自Camera基类
 * - 提供2D场景的视图控制和坐标转换
 * - 支持缩放、平移、旋转等变换
 * - 提供平滑跟随和限制功能
 * - 支持屏幕震动效果
 * - 与CanvasItem渲染系统集成
 *
 * 继承关系:
 * Node -> Camera -> Camera2D
 */

import Camera, { CameraType, CameraState } from '../base/Camera'
import Node2D from '../Node2D'
import type { Vector2, Transform2D, Rect2, PropertyInfo } from '../../../types/core'

// ============================================================================
// Camera2D相关枚举和接口
// ============================================================================

/**
 * 2D相机锚点模式枚举
 * 定义相机的锚定方式
 */
export enum AnchorMode {
  /** 固定到左上角 */
  FIXED_TOP_LEFT = 0,
  /** 拖拽中心 */
  DRAG_CENTER = 1
}

/**
 * 2D相机处理模式枚举
 * 定义相机的处理方式
 */
export enum Camera2DProcessCallback {
  /** 物理处理 */
  PHYSICS = 0,
  /** 空闲处理 */
  IDLE = 1
}

/**
 * 相机限制接口
 * 定义相机移动的边界限制
 */
export interface CameraLimits {
  /** 左边界 */
  left: number
  /** 上边界 */
  top: number
  /** 右边界 */
  right: number
  /** 下边界 */
  bottom: number
}

/**
 * 平滑参数接口
 * 定义相机平滑移动的参数
 */
export interface SmoothingParams {
  /** 是否启用平滑 */
  enabled: boolean
  /** 平滑速度 */
  speed: number
}

/**
 * 屏幕震动参数接口
 * 定义屏幕震动效果的参数
 */
export interface ShakeParams {
  /** 震动强度 */
  intensity: number
  /** 震动持续时间 */
  duration: number
  /** 震动频率 */
  frequency: number
  /** 震动衰减 */
  decay: number
}

// ============================================================================
// Camera2D 类实现
// ============================================================================

/**
 * Camera2D 类 - 2D相机节点
 *
 * 主要功能:
 * 1. 2D场景视图控制
 * 2. 坐标转换 (屏幕坐标 ↔ 世界坐标)
 * 3. 缩放和平移控制
 * 4. 平滑跟随目标
 * 5. 相机边界限制
 * 6. 屏幕震动效果
 */
export class Camera2D extends Camera {
  // ========================================================================
  // 私有属性 - 2D相机参数
  // ========================================================================

  /** 相机偏移 */
  private _offset: Vector2 = { x: 0, y: 0 }

  /** 锚点模式 */
  private _anchorMode: AnchorMode = AnchorMode.DRAG_CENTER

  /** 是否旋转跟随 */
  private _rotating: boolean = false

  /** 缩放值 */
  private _zoom: Vector2 = { x: 1, y: 1 }

  /** 处理回调模式 */
  private _processCallback: Camera2DProcessCallback = Camera2DProcessCallback.IDLE

  /** 是否启用 */
  private _enabled2D: boolean = true

  // ========================================================================
  // 私有属性 - 平滑和限制
  // ========================================================================

  /** 位置平滑参数 */
  private _positionSmoothing: SmoothingParams = {
    enabled: false,
    speed: 5.0
  }

  /** 旋转平滑参数 */
  private _rotationSmoothing: SmoothingParams = {
    enabled: false,
    speed: 5.0
  }

  /** 相机限制 */
  private _limits: CameraLimits = {
    left: -10000000,
    top: -10000000,
    right: 10000000,
    bottom: 10000000
  }

  /** 是否启用限制 */
  private _limitSmoothing: boolean = false

  /** 边距 */
  private _dragMargin: {
    left: number
    top: number
    right: number
    bottom: number
  } = {
    left: 0.2,
    top: 0.2,
    right: 0.2,
    bottom: 0.2
  }

  // ========================================================================
  // 私有属性 - 震动效果
  // ========================================================================

  /** 当前震动参数 */
  private _currentShake: ShakeParams | null = null

  /** 震动开始时间 */
  private _shakeStartTime: number = 0

  /** 震动偏移 */
  private _shakeOffset: Vector2 = { x: 0, y: 0 }

  // ========================================================================
  // 私有属性 - 变换缓存
  // ========================================================================

  /** 相机变换矩阵缓存 */
  private _cameraTransform: Transform2D | null = null

  /** 变换是否需要更新 */
  private _transformDirty: boolean = true

  /** 全局位置缓存 */
  private _globalPositionCache: Vector2 | null = null

  // ========================================================================
  // 私有属性 - 跟随系统
  // ========================================================================

  /** 跟随目标位置 */
  private _followTarget: Vector2 | null = null

  /** 跟随速度 */
  private _followSpeed: number = 5.0

  /** 视口尺寸 */
  private _viewportSize: Vector2 = { x: 800, y: 600 }

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称，默认为'Camera2D'
   */
  constructor(name: string = 'Camera2D') {
    super(name, CameraType.CAMERA_2D)

    // 初始化Camera2D特有的信号
    this.initializeCamera2DSignals()

    // 初始化Camera2D特有的属性
    this.initializeCamera2DProperties()

    // 监听变换变化
    this.connect('transform_changed', () => {
      this._transformDirty = true
      this._globalPositionCache = null
    })
  }

  /**
   * 初始化Camera2D特有的信号
   */
  private initializeCamera2DSignals(): void {
    // 缩放变化信号
    this.addSignal('zoom_changed')

    // 震动开始/结束信号
    this.addSignal('shake_started')
    this.addSignal('shake_finished')
  }

  /**
   * 初始化Camera2D特有的属性
   */
  private initializeCamera2DProperties(): void {
    const properties: PropertyInfo[] = [
      // 基础属性
      {
        name: 'offset',
        type: 'vector2',
        hint: '相机偏移'
      },
      {
        name: 'anchor_mode',
        type: 'enum',
        hint: '锚点模式',
        className: 'AnchorMode'
      },
      {
        name: 'rotating',
        type: 'bool',
        hint: '是否旋转跟随'
      },
      {
        name: 'zoom',
        type: 'vector2',
        hint: '缩放值'
      },
      {
        name: 'process_callback',
        type: 'enum',
        hint: '处理回调模式',
        className: 'Camera2DProcessCallback'
      },
      {
        name: 'enabled',
        type: 'bool',
        hint: '是否启用2D相机'
      },

      // 平滑属性
      {
        name: 'position_smoothing_enabled',
        type: 'bool',
        hint: '是否启用位置平滑'
      },
      {
        name: 'position_smoothing_speed',
        type: 'float',
        hint: '位置平滑速度'
      },
      {
        name: 'rotation_smoothing_enabled',
        type: 'bool',
        hint: '是否启用旋转平滑'
      },
      {
        name: 'rotation_smoothing_speed',
        type: 'float',
        hint: '旋转平滑速度'
      },

      // 限制属性
      {
        name: 'limit_left',
        type: 'int',
        hint: '左边界限制'
      },
      {
        name: 'limit_top',
        type: 'int',
        hint: '上边界限制'
      },
      {
        name: 'limit_right',
        type: 'int',
        hint: '右边界限制'
      },
      {
        name: 'limit_bottom',
        type: 'int',
        hint: '下边界限制'
      },
      {
        name: 'limit_smoothed',
        type: 'bool',
        hint: '是否启用限制平滑'
      },

      // 拖拽边距
      {
        name: 'drag_margin_left',
        type: 'float',
        hint: '左拖拽边距'
      },
      {
        name: 'drag_margin_top',
        type: 'float',
        hint: '上拖拽边距'
      },
      {
        name: 'drag_margin_right',
        type: 'float',
        hint: '右拖拽边距'
      },
      {
        name: 'drag_margin_bottom',
        type: 'float',
        hint: '下拖拽边距'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取相机偏移
   * @returns 偏移向量
   */
  get offset(): Vector2 {
    return { ...this._offset }
  }

  /**
   * 设置相机偏移
   * @param value 偏移向量
   */
  set offset(value: Vector2) {
    this._offset = { ...value }
    this._transformDirty = true
    this.emit('camera_transform_changed')
  }

  /**
   * 获取锚点模式
   * @returns 锚点模式
   */
  get anchorMode(): AnchorMode {
    return this._anchorMode
  }

  /**
   * 设置锚点模式
   * @param value 锚点模式
   */
  set anchorMode(value: AnchorMode) {
    this._anchorMode = value
    this._transformDirty = true
  }

  /**
   * 获取是否旋转跟随
   * @returns 是否旋转跟随
   */
  get rotating(): boolean {
    return this._rotating
  }

  /**
   * 设置是否旋转跟随
   * @param value 是否旋转跟随
   */
  set rotating(value: boolean) {
    this._rotating = value
  }

  /**
   * 获取缩放值
   * @returns 缩放向量
   */
  get zoom(): Vector2 {
    return { ...this._zoom }
  }

  /**
   * 设置缩放值
   * @param value 缩放向量
   */
  set zoom(value: Vector2) {
    this._zoom = { ...value }
    this._transformDirty = true
    this.emit('zoom_changed', this._zoom)
    this.emit('camera_transform_changed')
  }

  /**
   * 获取是否启用2D相机
   * @returns 是否启用
   */
  get enabled2D(): boolean {
    return this._enabled2D
  }

  /**
   * 设置是否启用2D相机
   * @param value 是否启用
   */
  set enabled2D(value: boolean) {
    this._enabled2D = value
  }

  /**
   * 获取位置平滑是否启用
   * @returns 是否启用位置平滑
   */
  get positionSmoothingEnabled(): boolean {
    return this._positionSmoothing.enabled
  }

  /**
   * 设置位置平滑是否启用
   * @param value 是否启用位置平滑
   */
  set positionSmoothingEnabled(value: boolean) {
    this._positionSmoothing.enabled = value
  }

  /**
   * 获取位置平滑速度
   * @returns 位置平滑速度
   */
  get positionSmoothingSpeed(): number {
    return this._positionSmoothing.speed
  }

  /**
   * 设置位置平滑速度
   * @param value 位置平滑速度
   */
  set positionSmoothingSpeed(value: number) {
    this._positionSmoothing.speed = Math.max(0, value)
  }

  /**
   * 获取相机限制
   * @returns 相机限制对象
   */
  get limits(): CameraLimits {
    return { ...this._limits }
  }

  /**
   * 设置左边界限制
   * @param value 左边界值
   */
  set limitLeft(value: number) {
    this._limits.left = value
  }

  /**
   * 获取左边界限制
   * @returns 左边界值
   */
  get limitLeft(): number {
    return this._limits.left
  }

  /**
   * 设置上边界限制
   * @param value 上边界值
   */
  set limitTop(value: number) {
    this._limits.top = value
  }

  /**
   * 获取上边界限制
   * @returns 上边界值
   */
  get limitTop(): number {
    return this._limits.top
  }

  /**
   * 设置右边界限制
   * @param value 右边界值
   */
  set limitRight(value: number) {
    this._limits.right = value
  }

  /**
   * 获取右边界限制
   * @returns 右边界值
   */
  get limitRight(): number {
    return this._limits.right
  }

  /**
   * 设置下边界限制
   * @param value 下边界值
   */
  set limitBottom(value: number) {
    this._limits.bottom = value
  }

  /**
   * 获取下边界限制
   * @returns 下边界值
   */
  get limitBottom(): number {
    return this._limits.bottom
  }

  /**
   * 获取跟随目标
   * @returns 跟随目标位置
   */
  get followTarget(): Vector2 | null {
    return this._followTarget ? { ...this._followTarget } : null
  }

  /**
   * 获取跟随速度
   * @returns 跟随速度
   */
  get followSpeed(): number {
    return this._followSpeed
  }

  /**
   * 获取视口尺寸
   * @returns 视口尺寸
   */
  get viewportSize(): Vector2 {
    return { ...this._viewportSize }
  }

  // ========================================================================
  // 核心方法实现 - 坐标转换
  // ========================================================================

  /**
   * 屏幕坐标转世界坐标
   * @param screenPoint 屏幕坐标点
   * @returns 世界坐标点
   */
  screenToWorld(screenPoint: Vector2): Vector2 {
    const viewport = this.viewportInfo
    const transform = this.getCameraTransform()

    // 将屏幕坐标转换为相机空间坐标
    const cameraSpaceX = (screenPoint.x - viewport.width / 2) / this._zoom.x
    const cameraSpaceY = (screenPoint.y - viewport.height / 2) / this._zoom.y

    // 应用相机变换
    const cos = Math.cos(transform.rotation)
    const sin = Math.sin(transform.rotation)

    const worldX = transform.position.x + (cameraSpaceX * cos - cameraSpaceY * sin)
    const worldY = transform.position.y + (cameraSpaceX * sin + cameraSpaceY * cos)

    return { x: worldX, y: worldY }
  }

  /**
   * 世界坐标转屏幕坐标
   * @param worldPoint 世界坐标点
   * @returns 屏幕坐标点
   */
  worldToScreen(worldPoint: Vector2): Vector2 {
    const viewport = this.viewportInfo
    const transform = this.getCameraTransform()

    // 计算相对于相机的位置
    const relativeX = worldPoint.x - transform.position.x
    const relativeY = worldPoint.y - transform.position.y

    // 应用相机旋转
    const cos = Math.cos(-transform.rotation)
    const sin = Math.sin(-transform.rotation)

    const rotatedX = relativeX * cos - relativeY * sin
    const rotatedY = relativeX * sin + relativeY * cos

    // 应用缩放并转换到屏幕坐标
    const screenX = viewport.width / 2 + rotatedX * this._zoom.x
    const screenY = viewport.height / 2 + rotatedY * this._zoom.y

    return { x: screenX, y: screenY }
  }

  /**
   * 获取相机变换矩阵
   * @returns 2D变换矩阵
   */
  getCameraTransform(): Transform2D {
    if (this._transformDirty || !this._cameraTransform) {
      this._updateCameraTransform()
    }
    return this._cameraTransform!
  }

  /**
   * 更新相机变换矩阵
   */
  private _updateCameraTransform(): void {
    // 获取相机的全局位置
    const globalPos = this._getGlobalPosition()

    // 应用偏移
    const finalPos = {
      x: globalPos.x + this._offset.x + this._shakeOffset.x,
      y: globalPos.y + this._offset.y + this._shakeOffset.y
    }

    // 获取旋转（如果启用旋转跟随）
    let rotation = 0
    if (this._rotating && this.parent instanceof Node2D) {
      rotation = this.parent.globalRotation
    }

    this._cameraTransform = {
      position: finalPos,
      rotation: rotation,
      scale: { x: 1, y: 1 }
    }

    this._transformDirty = false
  }

  /**
   * 获取全局位置
   * @returns 全局位置
   */
  private _getGlobalPosition(): Vector2 {
    if (!this._globalPositionCache) {
      if (this.parent instanceof Node2D) {
        this._globalPositionCache = this.parent.globalPosition
      } else {
        this._globalPositionCache = { x: 0, y: 0 }
      }
    }
    return this._globalPositionCache
  }

  // ========================================================================
  // 相机控制方法
  // ========================================================================

  /**
   * 强制更新相机位置到目标
   * @param target 目标位置
   */
  forceUpdateScrollTo(target: Vector2): void {
    if (this.parent instanceof Node2D) {
      this.parent.globalPosition = target
    }
    this._globalPositionCache = null
    this._transformDirty = true
  }

  /**
   * 重置平滑
   */
  resetSmoothing(): void {
    // 清除平滑状态，立即跳转到目标位置
    this._globalPositionCache = null
    this._transformDirty = true
  }

  /**
   * 获取相机屏幕中心的世界坐标
   * @returns 屏幕中心的世界坐标
   */
  getScreenCenterPosition(): Vector2 {
    const viewport = this.viewportInfo
    return this.screenToWorld({
      x: viewport.width / 2,
      y: viewport.height / 2
    })
  }

  /**
   * 设置相机位置限制
   * @param left 左边界
   * @param top 上边界
   * @param right 右边界
   * @param bottom 下边界
   */
  setLimits(left: number, top: number, right: number, bottom: number): void {
    this._limits = { left, top, right, bottom }
  }

  /**
   * 清除相机位置限制
   */
  clearLimits(): void {
    this._limits = {
      left: -10000000,
      top: -10000000,
      right: 10000000,
      bottom: 10000000
    }
  }

  // ========================================================================
  // 新增的核心方法
  // ========================================================================

  /**
   * 设置视口尺寸
   * @param width 视口宽度
   * @param height 视口高度
   */
  setViewportSize(width: number, height: number): void {
    this._viewportSize = { x: width, y: height }
    this._transformDirty = true
    this.emit('viewport_size_changed', this._viewportSize)
    console.log(`Camera2D: 视口尺寸设置为 ${width}x${height}`)
  }

  /**
   * 设置跟随速度
   * @param speed 跟随速度（值越大跟随越快）
   */
  setFollowSpeed(speed: number): void {
    this._followSpeed = Math.max(0.1, speed)
    console.log(`Camera2D: 跟随速度设置为 ${this._followSpeed}`)
  }

  /**
   * 设置跟随目标
   * @param target 目标位置或节点位置
   */
  setFollowTarget(target: Vector2): void {
    this._followTarget = { ...target }
    console.log(`Camera2D: 跟随目标设置为 (${target.x}, ${target.y})`)
  }

  /**
   * 清除跟随目标
   */
  clearFollowTarget(): void {
    this._followTarget = null
    console.log('Camera2D: 跟随目标已清除')
  }

  /**
   * 设置相机位置（用于手动控制）
   * @param position 目标位置
   */
  setPosition(position: Vector2): void {
    if (this.parent instanceof Node2D) {
      this.parent.position = { x: position.x, y: position.y, z: this.parent.position.z }
    }
    this._globalPositionCache = null
    this._transformDirty = true
    this.emit('position_changed', position)
  }

  // ========================================================================
  // 震动效果方法
  // ========================================================================

  /**
   * 开始屏幕震动
   * @param intensity 震动强度
   * @param duration 持续时间（秒）
   * @param frequency 震动频率
   * @param decay 衰减系数
   */
  startShake(intensity: number, duration: number, frequency: number = 10, decay: number = 1): void {
    this._currentShake = {
      intensity,
      duration,
      frequency,
      decay
    }

    this._shakeStartTime = Date.now() / 1000
    this.emit('shake_started', this._currentShake)
  }

  /**
   * 停止屏幕震动
   */
  stopShake(): void {
    if (this._currentShake) {
      this._currentShake = null
      this._shakeOffset = { x: 0, y: 0 }
      this._transformDirty = true
      this.emit('shake_finished')
    }
  }

  /**
   * 更新震动效果
   * @param delta 时间增量
   */
  private _updateShake(delta: number): void {
    if (!this._currentShake) return

    const currentTime = Date.now() / 1000
    const elapsed = currentTime - this._shakeStartTime

    // 检查震动是否结束
    if (elapsed >= this._currentShake.duration) {
      this.stopShake()
      return
    }

    // 计算衰减
    const progress = elapsed / this._currentShake.duration
    const decayFactor = Math.pow(1 - progress, this._currentShake.decay)

    // 计算震动偏移
    const angle = elapsed * this._currentShake.frequency * Math.PI * 2
    const currentIntensity = this._currentShake.intensity * decayFactor

    this._shakeOffset = {
      x: Math.cos(angle) * currentIntensity,
      y: Math.sin(angle * 1.3) * currentIntensity // 稍微不同的频率产生更自然的效果
    }

    this._transformDirty = true
  }

  // ========================================================================
  // 生命周期方法重写
  // ========================================================================

  /**
   * 相机激活时调用
   */
  protected onActivated(): void {
    super.onActivated()

    // 更新变换
    this._transformDirty = true
    this.updateCameraParams()
  }

  /**
   * 相机停用时调用
   */
  protected onDeactivated(): void {
    super.onDeactivated()

    // 停止震动效果
    this.stopShake()
  }

  /**
   * 每帧更新时调用
   * @param delta 时间增量（秒）
   */
  public _process(delta: number): void {
    super._process(delta)

    if (!this._enabled2D || !this.current) return

    // 更新跟随系统
    this._updateFollow(delta)

    // 更新震动效果
    this._updateShake(delta)

    // 应用位置限制
    this._applyLimits()

    // 更新相机参数
    if (this._transformDirty) {
      this.updateCameraParams()
    }
  }

  /**
   * 更新跟随系统
   * @param delta 时间增量
   */
  private _updateFollow(delta: number): void {
    if (!this._followTarget || !(this.parent instanceof Node2D)) return

    const currentPos = this._getGlobalPosition()
    const targetPos = this._followTarget

    // 计算距离
    const dx = targetPos.x - currentPos.x
    const dy = targetPos.y - currentPos.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 如果距离很小，直接设置位置
    if (distance < 1.0) {
      this.parent.globalPosition = { x: targetPos.x, y: targetPos.y }
      this._globalPositionCache = null
      this._transformDirty = true
      return
    }

    // 平滑跟随
    const followFactor = Math.min(1.0, this._followSpeed * delta)
    const newX = currentPos.x + dx * followFactor
    const newY = currentPos.y + dy * followFactor

    this.parent.globalPosition = { x: newX, y: newY }
    this._globalPositionCache = null
    this._transformDirty = true

    // 发射位置变化信号
    this.emit('position_changed', { x: newX, y: newY })
  }

  /**
   * 应用位置限制
   */
  private _applyLimits(): void {
    if (!(this.parent instanceof Node2D)) return

    const globalPos = this._getGlobalPosition()
    const viewport = this.viewportInfo

    // 计算相机视口在世界坐标中的边界
    const halfWidth = (viewport.width / 2) / this._zoom.x
    const halfHeight = (viewport.height / 2) / this._zoom.y

    let newX = globalPos.x
    let newY = globalPos.y

    // 应用水平限制
    if (globalPos.x - halfWidth < this._limits.left) {
      newX = this._limits.left + halfWidth
    } else if (globalPos.x + halfWidth > this._limits.right) {
      newX = this._limits.right - halfWidth
    }

    // 应用垂直限制
    if (globalPos.y - halfHeight < this._limits.top) {
      newY = this._limits.top + halfHeight
    } else if (globalPos.y + halfHeight > this._limits.bottom) {
      newY = this._limits.bottom - halfHeight
    }

    // 如果位置发生变化，更新父节点位置
    if (newX !== globalPos.x || newY !== globalPos.y) {
      if (this.parent instanceof Node2D) {
        this.parent.globalPosition = { x: newX, y: newY }
      }
      this._globalPositionCache = null
      this._transformDirty = true
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 获取相机可视区域的世界坐标边界
   * @returns 可视区域边界
   */
  getVisibleRect(): Rect2 {
    const viewport = this.viewportInfo
    const transform = this.getCameraTransform()

    const halfWidth = (viewport.width / 2) / this._zoom.x
    const halfHeight = (viewport.height / 2) / this._zoom.y

    return {
      position: {
        x: transform.position.x - halfWidth,
        y: transform.position.y - halfHeight
      },
      size: {
        x: halfWidth * 2,
        y: halfHeight * 2
      }
    }
  }

  /**
   * 检查世界坐标点是否在相机视野内
   * @param worldPoint 世界坐标点
   * @returns 是否在视野内
   */
  isPointVisible(worldPoint: Vector2): boolean {
    const visibleRect = this.getVisibleRect()

    return worldPoint.x >= visibleRect.position.x &&
           worldPoint.x <= visibleRect.position.x + visibleRect.size.x &&
           worldPoint.y >= visibleRect.position.y &&
           worldPoint.y <= visibleRect.position.y + visibleRect.size.y
  }

  /**
   * 检查矩形区域是否与相机视野相交
   * @param rect 矩形区域
   * @returns 是否相交
   */
  isRectVisible(rect: Rect2): boolean {
    const visibleRect = this.getVisibleRect()

    return !(rect.position.x + rect.size.x < visibleRect.position.x ||
             visibleRect.position.x + visibleRect.size.x < rect.position.x ||
             rect.position.y + rect.size.y < visibleRect.position.y ||
             visibleRect.position.y + visibleRect.size.y < rect.position.y)
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Camera2D
