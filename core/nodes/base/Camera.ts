/**
 * QAQ游戏引擎 - Camera 相机基类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有相机节点的基类，提供通用的相机功能
 * - 定义相机的基础接口和共同属性
 * - 管理相机的激活状态和视口关联
 * - 提供坐标转换的基础框架
 * - 支持相机切换和管理
 *
 * 继承关系:
 * Node -> Camera -> Camera2D/Camera3D
 */

import Node from '../Node'
import type { Vector2, Vector3, PropertyInfo } from '../../../types/core'
import Engine from '../../engine/Engine'
// ============================================================================
// 相机相关枚举和接口
// ============================================================================

/**
 * 相机类型枚举
 * 定义相机的类型
 */
export enum CameraType {
  /** 2D相机 */
  CAMERA_2D = 0,
  /** 3D相机 */
  CAMERA_3D = 1
}

/**
 * 相机状态枚举
 * 定义相机的当前状态
 */
export enum CameraState {
  /** 非活动状态 */
  INACTIVE = 0,
  /** 活动状态 */
  ACTIVE = 1,
  /** 正在切换状态 */
  SWITCHING = 2
}

/**
 * 视口信息接口
 * 定义视口的基本信息
 */
export interface ViewportInfo {
  /** 视口宽度 */
  width: number
  /** 视口高度 */
  height: number
  /** 视口位置X */
  x: number
  /** 视口位置Y */
  y: number
  /** 设备像素比 */
  devicePixelRatio: number
}

/**
 * 相机事件接口
 * 定义相机相关的事件数据
 */
export interface CameraEvent {
  /** 事件类型 */
  type: 'activated' | 'deactivated' | 'viewport_changed' | 'transform_changed'
  /** 相机实例 */
  camera: Camera
  /** 事件时间戳 */
  timestamp: number
  /** 附加数据 */
  data?: any
}

// ============================================================================
// Camera 基类实现
// ============================================================================

/**
 * Camera 类 - 所有相机节点的基类
 *
 * 主要功能:
 * 1. 相机激活状态管理
 * 2. 视口关联和管理
 * 3. 坐标转换基础框架
 * 4. 相机切换和事件处理
 * 5. 渲染参数管理
 */
export abstract class Camera extends Node {
  // ========================================================================
  // 私有属性 - 相机状态管理
  // ========================================================================

  /** 相机类型 */
  protected _cameraType: CameraType

  /** 是否为当前活动相机 */
  protected _current: boolean = false

  /** 相机状态 */
  protected _state: CameraState = CameraState.INACTIVE

  /** 是否启用相机 */
  protected _enabled: boolean = true

  /** 关联的视口信息 */
  protected _viewportInfo: ViewportInfo = {
    width: 1920,
    height: 1080,
    x: 0,
    y: 0,
    devicePixelRatio: 1
  }

  /** 自定义视口节点 */
  protected _customViewport: Node | null = null

  /** 相机优先级 - 数值越高优先级越高 */
  protected _priority: number = 0

  /** 相机标签 - 用于分组和查找 */
  protected _cameraTag: string = ''

  // ========================================================================
  // 静态属性 - 全局相机管理
  // ========================================================================

  /** 当前活动的2D相机 */
  private static _currentCamera2D: Camera | null = null

  /** 当前活动的3D相机 */
  private static _currentCamera3D: Camera | null = null

  /** 所有注册的相机列表 */
  private static _allCameras: Set<Camera> = new Set()

  /** 相机事件监听器 */
  private static _eventListeners: Array<(event: CameraEvent) => void> = []

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param cameraType 相机类型
   */
  constructor(name: string, cameraType: CameraType) {
    super(name)

    this._cameraType = cameraType

    // 初始化相机特有的信号
    this.initializeCameraSignals()

    // 初始化相机特有的属性
    this.initializeCameraProperties()

    // 注册到全局相机管理器
    Camera._allCameras.add(this)
  }

  /**
   * 初始化相机特有的信号
   */
  private initializeCameraSignals(): void {
    // 相机激活/停用信号
    this.addSignal('camera_activated')
    this.addSignal('camera_deactivated')

    // 视口变化信号
    this.addSignal('viewport_changed')

    // 相机变换变化信号
    this.addSignal('camera_transform_changed')

    // 渲染参数变化信号
    this.addSignal('render_params_changed')
  }

  /**
   * 初始化相机特有的属性
   */
  private initializeCameraProperties(): void {
    const properties: PropertyInfo[] = [
      {
        name: 'current',
        type: 'bool',
        hint: '是否为当前活动相机'
      },
      {
        name: 'enabled',
        type: 'bool',
        hint: '是否启用相机'
      },
      {
        name: 'priority',
        type: 'int',
        hint: '相机优先级'
      },
      {
        name: 'camera_tag',
        type: 'string',
        hint: '相机标签'
      },
      {
        name: 'custom_viewport',
        type: 'node_path',
        hint: '自定义视口节点'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取相机类型
   * @returns 相机类型
   */
  get cameraType(): CameraType {
    return this._cameraType
  }

  /**
   * 获取是否为当前活动相机
   * @returns 是否为当前活动相机
   */
  get current(): boolean {
    return this._current
  }

  /**
   * 设置是否为当前活动相机
   * @param value 是否为当前活动相机
   */
  set current(value: boolean) {
    if (this._current !== value) {
      if (value) {
        this.makeCurrent()
      } else {
        this.clearCurrent()
      }
    }
  }

  /**
   * 获取是否启用相机
   * @returns 是否启用相机
   */
  get enabled(): boolean {
    return this._enabled
  }

  /**
   * 设置是否启用相机
   * @param value 是否启用相机
   */
  set enabled(value: boolean) {
    if (this._enabled !== value) {
      this._enabled = value

      if (!value && this._current) {
        // 如果禁用当前活动相机，尝试切换到下一个可用相机
        this.clearCurrent(true)
      }
    }
  }

  /**
   * 获取相机优先级
   * @returns 相机优先级
   */
  get priority(): number {
    return this._priority
  }

  /**
   * 设置相机优先级
   * @param value 相机优先级
   */
  set priority(value: number) {
    this._priority = value
  }

  /**
   * 获取相机标签
   * @returns 相机标签
   */
  get cameraTag(): string {
    return this._cameraTag
  }

  /**
   * 设置相机标签
   * @param value 相机标签
   */
  set cameraTag(value: string) {
    this._cameraTag = value
  }

  /**
   * 获取相机状态
   * @returns 相机状态
   */
  get state(): CameraState {
    return this._state
  }

  /**
   * 获取视口信息
   * @returns 视口信息
   */
  get viewportInfo(): ViewportInfo {
    return { ...this._viewportInfo }
  }

  /**
   * 获取自定义视口节点
   * @returns 自定义视口节点
   */
  get customViewport(): Node | null {
    return this._customViewport
  }

  /**
   * 设置自定义视口节点
   * @param value 自定义视口节点
   */
  set customViewport(value: Node | null) {
    if (this._customViewport !== value) {
      this._customViewport = value
      this.updateViewportInfo()
      this.emit('viewport_changed', this._viewportInfo)
    }
  }

  // ========================================================================
  // 核心相机管理方法
  // ========================================================================

  /**
   * 使此相机成为当前活动相机
   */
  makeCurrent(): void {
    if (!this._enabled) {
      console.warn(`Cannot make disabled camera ${this.name} current`)
      return
    }

    // 获取当前同类型的活动相机
    const currentCamera = this._cameraType === CameraType.CAMERA_2D
      ? Camera._currentCamera2D
      : Camera._currentCamera3D

    // 如果已经是当前相机，直接返回
    if (currentCamera === this) {
      return
    }

    // 停用之前的相机
    if (currentCamera) {
      currentCamera._deactivate()
    }

    // 激活当前相机
    this._activate()
    // 更新全局当前相机引用
    if (this._cameraType === CameraType.CAMERA_2D) {
      Camera._currentCamera2D = this
    } else {
      Camera._currentCamera3D = this
    }

    // 通知Engine设置当前相机
    try {
      // 动态导入Engine避免循环依赖
      const Engine = (globalThis as any).Engine
      if (Engine) {
        const engine = Engine.getInstance()
        if (engine && typeof engine.setCurrentCamera === 'function') {
          engine.setCurrentCamera(this)
        }
      }
    } catch (error) {
      console.warn('Failed to notify Engine about camera change:', error)
    }

    // 发送全局相机事件
    this._emitCameraEvent('activated')
  }

  /**
   * 清除当前相机状态
   * @param enableNext 是否启用下一个可用相机
   */
  clearCurrent(enableNext: boolean = true): void {
    if (!this._current) {
      return
    }

    // 停用当前相机
    this._deactivate()

    // 清除全局当前相机引用
    if (this._cameraType === CameraType.CAMERA_2D) {
      Camera._currentCamera2D = null
    } else {
      Camera._currentCamera3D = null
    }

    // 如果需要，尝试启用下一个可用相机
    if (enableNext) {
      const nextCamera = this._findNextAvailableCamera()
      if (nextCamera) {
        nextCamera.makeCurrent()
      }
    }

    // 发送全局相机事件
    this._emitCameraEvent('deactivated')
  }

  /**
   * 激活相机
   */
  private _activate(): void {
    this._current = true
    this._state = CameraState.ACTIVE

    // 更新视口信息
    this.updateViewportInfo()

    // 调用子类的激活方法
    this.onActivated()

    // 发送信号
    this.emit('camera_activated')
  }

  /**
   * 停用相机
   */
  private _deactivate(): void {
    this._current = false
    this._state = CameraState.INACTIVE

    // 调用子类的停用方法
    this.onDeactivated()

    // 发送信号
    this.emit('camera_deactivated')
  }

  /**
   * 查找下一个可用的相机
   * @returns 下一个可用的相机或null
   */
  private _findNextAvailableCamera(): Camera | null {
    const cameras = Array.from(Camera._allCameras)
      .filter(camera =>
        camera._cameraType === this._cameraType &&
        camera._enabled &&
        camera !== this
      )
      .sort((a, b) => b._priority - a._priority) // 按优先级降序排列

    return cameras.length > 0 ? cameras[0] : null
  }

  /**
   * 发送相机事件
   * @param type 事件类型
   * @param data 附加数据
   */
  private _emitCameraEvent(type: CameraEvent['type'], data?: any): void {
    const event: CameraEvent = {
      type,
      camera: this,
      timestamp: Date.now(),
      data
    }

    // 通知所有事件监听器
    Camera._eventListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Camera event listener error:', error)
      }
    })
  }

  // ========================================================================
  // 视口管理方法
  // ========================================================================

  /**
   * 更新视口信息
   */
  protected updateViewportInfo(): void {
    // 如果有自定义视口，从自定义视口获取信息
    if (this._customViewport) {
      // 这里应该从自定义视口节点获取实际信息
      // 暂时使用默认值
    } else {
      // 从浏览器窗口获取视口信息
      if (typeof window !== 'undefined') {
        this._viewportInfo = {
          width: window.innerWidth,
          height: window.innerHeight,
          x: 0,
          y: 0,
          devicePixelRatio: window.devicePixelRatio || 1
        }
      }
    }
  }

  /**
   * 获取视口宽高比
   * @returns 宽高比
   */
  getViewportAspectRatio(): number {
    return this._viewportInfo.width / this._viewportInfo.height
  }

  /**
   * 检查点是否在视口内
   * @param point 屏幕坐标点
   * @returns 是否在视口内
   */
  isPointInViewport(point: Vector2): boolean {
    return point.x >= this._viewportInfo.x &&
           point.x <= this._viewportInfo.x + this._viewportInfo.width &&
           point.y >= this._viewportInfo.y &&
           point.y <= this._viewportInfo.y + this._viewportInfo.height
  }

  // ========================================================================
  // 抽象方法 - 子类必须实现
  // ========================================================================

  /**
   * 相机激活时调用 - 子类可重写
   */
  protected onActivated(): void {
    // 子类可重写此方法
  }

  /**
   * 相机停用时调用 - 子类可重写
   */
  protected onDeactivated(): void {
    // 子类可重写此方法
  }

  /**
   * 屏幕坐标转世界坐标 - 子类必须实现
   * @param screenPoint 屏幕坐标点
   * @returns 世界坐标点
   */
  abstract screenToWorld(screenPoint: Vector2): Vector2 | Vector3

  /**
   * 世界坐标转屏幕坐标 - 子类必须实现
   * @param worldPoint 世界坐标点
   * @returns 屏幕坐标点
   */
  abstract worldToScreen(worldPoint: Vector2 | Vector3): Vector2

  /**
   * 获取相机变换矩阵 - 子类必须实现
   * @returns 变换矩阵
   */
  abstract getCameraTransform(): any

  /**
   * 更新相机参数 - 子类可重写
   */
  protected updateCameraParams(): void {
    // 子类可重写此方法
    this.emit('render_params_changed')
  }

  // ========================================================================
  // 静态方法 - 全局相机管理
  // ========================================================================

  /**
   * 获取当前活动的2D相机
   * @returns 当前2D相机或null
   */
  static getCurrentCamera2D(): Camera | null {
    return Camera._currentCamera2D
  }

  /**
   * 获取当前活动的3D相机
   * @returns 当前3D相机或null
   */
  static getCurrentCamera3D(): Camera | null {
    return Camera._currentCamera3D
  }

  /**
   * 根据类型获取当前活动相机
   * @param type 相机类型
   * @returns 当前相机或null
   */
  static getCurrentCamera(type: CameraType): Camera | null {
    return type === CameraType.CAMERA_2D
      ? Camera._currentCamera2D
      : Camera._currentCamera3D
  }

  /**
   * 获取所有相机列表
   * @param type 可选的相机类型过滤
   * @returns 相机数组
   */
  static getAllCameras(type?: CameraType): Camera[] {
    const cameras = Array.from(Camera._allCameras)
    return type !== undefined
      ? cameras.filter(camera => camera._cameraType === type)
      : cameras
  }

  /**
   * 根据标签查找相机
   * @param tag 相机标签
   * @returns 匹配的相机数组
   */
  static findCamerasByTag(tag: string): Camera[] {
    return Array.from(Camera._allCameras)
      .filter(camera => camera._cameraTag === tag)
  }

  /**
   * 根据名称查找相机
   * @param name 相机名称
   * @returns 匹配的相机或null
   */
  static findCameraByName(name: string): Camera | null {
    for (const camera of Camera._allCameras) {
      if (camera.name === name) {
        return camera
      }
    }
    return null
  }

  /**
   * 添加相机事件监听器
   * @param listener 事件监听器函数
   */
  static addEventListener(listener: (event: CameraEvent) => void): void {
    Camera._eventListeners.push(listener)
  }

  /**
   * 移除相机事件监听器
   * @param listener 要移除的事件监听器函数
   */
  static removeEventListener(listener: (event: CameraEvent) => void): void {
    const index = Camera._eventListeners.indexOf(listener)
    if (index !== -1) {
      Camera._eventListeners.splice(index, 1)
    }
  }

  /**
   * 清除所有相机事件监听器
   */
  static clearEventListeners(): void {
    Camera._eventListeners.length = 0
  }

  // ========================================================================
  // 生命周期方法重写
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  public _enterTree(): void {
    super._enterTree()

    // 更新视口信息
    this.updateViewportInfo()

    // 如果是启用状态且没有同类型的当前相机，自动成为当前相机
    if (this._enabled) {
      const currentCamera = this._cameraType === CameraType.CAMERA_2D
        ? Camera._currentCamera2D
        : Camera._currentCamera3D

      if (!currentCamera) {
        this.makeCurrent()
      }
    }

    // 监听窗口尺寸变化
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this._onWindowResize)
    }
  }

  /**
   * 节点退出场景树时调用
   */
  public _exitTree(): void {
    super._exitTree()

    // 如果是当前相机，清除当前状态
    if (this._current) {
      this.clearCurrent(true)
    }

    // 从全局相机列表中移除
    Camera._allCameras.delete(this)

    // 移除窗口事件监听
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this._onWindowResize)
    }
  }

  /**
   * 窗口尺寸变化处理
   */
  private _onWindowResize = (): void => {
    this.updateViewportInfo()
    this.emit('viewport_changed', this._viewportInfo)
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 检查相机是否可用
   * @returns 是否可用
   */
  isAvailable(): boolean {
    return this._enabled && this.isInsideTree
  }

  /**
   * 获取相机信息字符串
   * @returns 相机信息
   */
  getCameraInfo(): string {
    const typeStr = this._cameraType === CameraType.CAMERA_2D ? '2D' : '3D'
    const stateStr = this._current ? 'ACTIVE' : 'INACTIVE'
    return `Camera[${this.name}] Type:${typeStr} State:${stateStr} Priority:${this._priority}`
  }

  /**
   * 复制相机设置到另一个相机
   * @param target 目标相机
   */
  copySettingsTo(target: Camera): void {
    if (target._cameraType !== this._cameraType) {
      console.warn('Cannot copy settings between different camera types')
      return
    }

    target._enabled = this._enabled
    target._priority = this._priority
    target._cameraTag = this._cameraTag
    target._customViewport = this._customViewport
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Camera
