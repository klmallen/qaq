/**
 * QAQ游戏引擎 - CanvasItem 2D渲染基类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有2D渲染节点的基类，类似于Godot的CanvasItem
 * - 基于新架构：通过Three.js Plane几何体在3D空间中渲染2D内容
 * - 每个CanvasItem对应一个Three.js Mesh，使用Canvas纹理
 * - 提供2D渲染管道的基础功能：可见性、层级、材质、变换等
 * - 管理2D渲染状态和渲染顺序
 * - 支持自定义绘制和渲染优化
 * - 与Three.js渲染管道深度集成
 *
 * 继承关系:
 * Node -> CanvasItem -> Node2D/Control
 *
 * 新架构特性:
 * - 每个CanvasItem创建Three.js Mesh对象
 * - 使用Canvas 2D API进行内容绘制
 * - Canvas内容作为纹理映射到3D平面
 * - 自动处理2D到3D坐标转换
 * - 支持Z-index排序和层级管理
 */

import Node from '../Node'
import Engine from '../../engine/Engine'
import * as THREE from 'three'
import type { Vector2, Transform2D, Rect2, PropertyInfo } from '../../../types/core'

// ============================================================================
// 2D渲染相关枚举和接口
// ============================================================================

/**
 * 混合模式枚举
 * 定义2D渲染时的颜色混合方式
 */
export enum BlendMode {
  /** 正常混合模式 - 标准的alpha混合 */
  NORMAL = 0,
  /** 相加混合模式 - 颜色值相加，产生更亮的效果 */
  ADD = 1,
  /** 相减混合模式 - 颜色值相减，产生更暗的效果 */
  SUBTRACT = 2,
  /** 相乘混合模式 - 颜色值相乘，产生更暗的效果 */
  MULTIPLY = 3,
  /** 预乘Alpha混合模式 - 用于优化的alpha混合 */
  PREMULT_ALPHA = 4
}

/**
 * 纹理过滤模式枚举
 * 定义纹理采样时的过滤方式
 */
export enum TextureFilter {
  /** 最近邻过滤 - 像素化效果，适合像素艺术 */
  NEAREST = 0,
  /** 线性过滤 - 平滑效果，适合高分辨率图像 */
  LINEAR = 1
}

/**
 * 纹理重复模式枚举
 * 定义纹理超出边界时的处理方式
 */
export enum TextureRepeat {
  /** 禁用重复 - 超出部分透明 */
  DISABLED = 0,
  /** 启用重复 - 平铺纹理 */
  ENABLED = 1,
  /** 镜像重复 - 镜像平铺纹理 */
  MIRROR = 2
}

/**
 * 2D渲染命令接口
 * 用于存储和执行2D渲染操作
 */
export interface RenderCommand2D {
  /** 渲染命令类型 */
  type: 'draw_texture' | 'draw_rect' | 'draw_line' | 'draw_polygon' | 'custom'
  /** 渲染层级 - 数值越大越靠前 */
  zIndex: number
  /** 渲染数据 */
  data: any
  /** 变换矩阵 */
  transform: Transform2D
  /** 混合模式 */
  blendMode: BlendMode
  /** 透明度 */
  modulate: { r: number, g: number, b: number, a: number }
}

/**
 * 2D材质接口
 * 定义2D渲染的材质属性
 */
export interface Material2D {
  /** 材质名称 */
  name: string
  /** 着色器程序 */
  shader?: WebGLProgram
  /** 纹理过滤模式 */
  textureFilter: TextureFilter
  /** 纹理重复模式 */
  textureRepeat: TextureRepeat
  /** 混合模式 */
  blendMode: BlendMode
  /** 自定义参数 */
  parameters: { [key: string]: any }
}

// ============================================================================
// CanvasItem 基类实现
// ============================================================================

/**
 * CanvasItem 类 - 所有2D渲染节点的基类
 *
 * 主要功能:
 * 1. 管理2D渲染状态（可见性、透明度、层级等）
 * 2. 提供2D变换和坐标转换功能
 * 3. 处理2D渲染命令的生成和排序
 * 4. 支持自定义绘制和材质系统
 * 5. 管理渲染优化（剔除、批处理等）
 */
export class CanvasItem extends Node {
  // ========================================================================
  // 私有属性 - 渲染状态管理
  // ========================================================================

  /** 是否可见 - 控制节点及其子节点的渲染 */
  protected _canvasVisible: boolean = true

  /** 调制颜色 - 影响节点及其子节点的颜色 */
  private _modulate: { r: number, g: number, b: number, a: number } = { r: 1, g: 1, b: 1, a: 1 }

  /** 自身调制颜色 - 仅影响当前节点的颜色 */
  private _selfModulate: { r: number, g: number, b: number, a: number } = { r: 1, g: 1, b: 1, a: 1 }

  /** Z索引 - 控制渲染顺序，数值越大越靠前 */
  private _zIndex: number = 0

  /** Z索引是否相对于父节点 */
  private _zAsRelative: boolean = true

  /** 是否显示在顶层 - 忽略父节点的Z索引 */
  private _showOnTop: boolean = false

  /** 是否显示在所有顶层之后 */
  private _showBehindParent: boolean = false

  /** 2D材质 - 控制渲染效果 */
  private _material: Material2D | null = null

  /** 是否使用父节点的材质 */
  private _useParentMaterial: boolean = false

  /** 光照遮罩 - 控制哪些光源影响此节点 */
  private _lightMask: number = 1

  /** 渲染命令列表 - 存储待执行的渲染操作 */
  private _renderCommands: RenderCommand2D[] = []

  /** 是否需要重新排序渲染命令 */
  private _needsSortRenderCommands: boolean = false

  /** 全局变换矩阵缓存 */
  private _globalTransformCache: Transform2D | null = null

  /** 全局变换是否需要更新 */
  private _globalTransformDirty: boolean = true

  // ========================================================================
  // Three.js 集成属性 - 新架构
  // ========================================================================

  /** Canvas元素 - 用于2D绘制 */
  protected _canvas: HTMLCanvasElement | null = null

  /** Canvas 2D渲染上下文 */
  protected _canvasContext: CanvasRenderingContext2D | null = null

  /** Three.js纹理 - Canvas内容映射到3D */
  protected _canvasTexture: THREE.CanvasTexture | null = null

  /** Three.js几何体 - 2D平面 */
  protected _planeGeometry: THREE.PlaneGeometry | null = null

  /** Three.js材质 - 包含Canvas纹理 */
  protected _planeMaterial: THREE.MeshBasicMaterial | null = null

  /** Three.js网格 - 最终的渲染对象 */
  protected _planeMesh: THREE.Mesh | null = null

  /** 2D内容尺寸 */
  protected _contentSize: Vector2 = { x: 100, y: 100 }

  /** 是否需要重新绘制Canvas */
  protected _needsCanvasRedraw: boolean = true

  /** 像素密度 - 用于高DPI显示 */
  protected _pixelRatio: number = 1

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称，默认为'CanvasItem'
   */
  constructor(name: string = 'CanvasItem') {
    super(name)

    // 设置渲染层为2D
    this.renderLayer = '2D'

    // 初始化Three.js组件
    this.initializeThreeJSComponents()

    // 初始化CanvasItem特有的信号
    this.initializeCanvasItemSignals()

    // 初始化CanvasItem特有的属性
    this.initializeCanvasItemProperties()

    // 监听变换变化，标记全局变换为脏
    this.connect('transform_changed', () => {
      this._globalTransformDirty = true
      this.markRenderCommandsDirty()
      this._needsCanvasRedraw = true
    })
  }

  /**
   * 重写createObject3D方法以创建Three.js Mesh
   * @returns Three.js Mesh对象
   */
  protected createObject3D(): THREE.Object3D {
    // 如果已经创建了Mesh，直接返回
    if (this._planeMesh) {
      return this._planeMesh
    }

    // 创建平面几何体
    this._planeGeometry = new THREE.PlaneGeometry(
      this._contentSize.x,
      this._contentSize.y
    )

    // 创建基础材质（稍后会设置纹理）
    this._planeMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })

    // 创建网格
    this._planeMesh = new THREE.Mesh(this._planeGeometry, this._planeMaterial)
    this._planeMesh.name = this.name + '_Mesh'

    return this._planeMesh
  }

  /**
   * 初始化Three.js组件
   */
  private initializeThreeJSComponents(): void {
    // 获取像素密度
    this._pixelRatio = (typeof window !== 'undefined') ?
      (window.devicePixelRatio || 1) : 1

    // 创建Canvas元素
    this._canvas = document.createElement('canvas')
    this._canvasContext = this._canvas.getContext('2d')

    if (!this._canvasContext) {
      console.error('Failed to get 2D canvas context')
      return
    }

    // 设置Canvas尺寸
    this.updateCanvasSize()

    // 创建Three.js纹理
    this._canvasTexture = new THREE.CanvasTexture(this._canvas)
    this._canvasTexture.generateMipmaps = false
    this._canvasTexture.wrapS = THREE.ClampToEdgeWrapping
    this._canvasTexture.wrapT = THREE.ClampToEdgeWrapping
    this._canvasTexture.minFilter = THREE.LinearFilter
    this._canvasTexture.magFilter = THREE.LinearFilter

    // 设置材质纹理
    if (this._planeMaterial) {
      this._planeMaterial.map = this._canvasTexture
    }
  }

  /**
   * 更新Canvas尺寸
   */
  private updateCanvasSize(): void {
    if (!this._canvas || !this._canvasContext) return

    const width = Math.max(1, Math.floor(this._contentSize.x * this._pixelRatio))
    const height = Math.max(1, Math.floor(this._contentSize.y * this._pixelRatio))

    // 设置Canvas实际尺寸
    this._canvas.width = width
    this._canvas.height = height

    // 设置Canvas显示尺寸
    this._canvas.style.width = this._contentSize.x + 'px'
    this._canvas.style.height = this._contentSize.y + 'px'

    // 缩放上下文以适应像素密度
    this._canvasContext.scale(this._pixelRatio, this._pixelRatio)

    // 更新几何体尺寸
    if (this._planeGeometry) {
      this._planeGeometry.dispose()
      this._planeGeometry = new THREE.PlaneGeometry(
        this._contentSize.x,
        this._contentSize.y
      )

      if (this._planeMesh) {
        this._planeMesh.geometry = this._planeGeometry
      }
    }

    this._needsCanvasRedraw = true
  }

  /**
   * 设置内容尺寸
   * @param size 新的内容尺寸
   */
  setContentSize(size: Vector2): void {
    if (this._contentSize.x !== size.x || this._contentSize.y !== size.y) {
      this._contentSize = { ...size }
      this.updateCanvasSize()
    }
  }

  /**
   * 获取内容尺寸
   * @returns 内容尺寸
   */
  getContentSize(): Vector2 {
    return { ...this._contentSize }
  }

  /**
   * 标记需要重新绘制Canvas
   */
  markCanvasDirty(): void {
    this._needsCanvasRedraw = true
  }

  /**
   * 更新Canvas内容并同步到Three.js纹理
   */
  private updateCanvasContent(): void {
    if (!this._needsCanvasRedraw || !this._canvas || !this._canvasContext) {
      return
    }

    // 清空Canvas
    this._canvasContext.clearRect(0, 0, this._contentSize.x, this._contentSize.y)

    // 调用子类的绘制方法
    this.drawCanvas(this._canvasContext)

    // 更新Three.js纹理
    if (this._canvasTexture) {
      this._canvasTexture.needsUpdate = true
    }

    this._needsCanvasRedraw = false
  }

  /**
   * 绘制Canvas内容 - 子类重写此方法
   * @param ctx Canvas 2D渲染上下文
   */
  protected drawCanvas(ctx: CanvasRenderingContext2D): void {
    // 基类默认绘制一个半透明矩形作为占位符
    ctx.fillStyle = 'rgba(100, 100, 100, 0.1)'
    ctx.fillRect(0, 0, this._contentSize.x, this._contentSize.y)

    // 绘制边框用于调试
    if (process.env.NODE_ENV === 'development') {
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, this._contentSize.x, this._contentSize.y)
    }
  }

  /**
   * 初始化CanvasItem特有的信号
   * 这些信号用于通知渲染状态的变化
   */
  private initializeCanvasItemSignals(): void {
    // 可见性变化信号
    this.addSignal('visibility_changed')

    // 绘制信号 - 用于自定义绘制
    this.addSignal('draw')

    // 材质变化信号
    this.addSignal('material_changed')

    // 渲染顺序变化信号
    this.addSignal('z_index_changed')

    // 调制颜色变化信号
    this.addSignal('modulate_changed')
  }

  /**
   * 初始化CanvasItem特有的属性
   * 这些属性可以在编辑器中修改
   */
  private initializeCanvasItemProperties(): void {
    const properties: PropertyInfo[] = [
      {
        name: 'visible',
        type: 'bool',
        hint: '控制节点是否可见'
      },
      {
        name: 'modulate',
        type: 'color',
        hint: '调制颜色，影响节点及其子节点'
      },
      {
        name: 'self_modulate',
        type: 'color',
        hint: '自身调制颜色，仅影响当前节点'
      },
      {
        name: 'z_index',
        type: 'int',
        hint: 'Z索引，控制渲染顺序'
      },
      {
        name: 'z_as_relative',
        type: 'bool',
        hint: 'Z索引是否相对于父节点'
      },
      {
        name: 'show_on_top',
        type: 'bool',
        hint: '是否显示在顶层'
      },
      {
        name: 'show_behind_parent',
        type: 'bool',
        hint: '是否显示在父节点后面'
      },
      {
        name: 'light_mask',
        type: 'int',
        hint: '光照遮罩，控制光源影响'
      },
      {
        name: 'material',
        type: 'resource',
        hint: '2D材质资源',
        className: 'Material2D'
      },
      {
        name: 'use_parent_material',
        type: 'bool',
        hint: '是否使用父节点的材质'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))
  }

  // ========================================================================
  // 公共属性访问器 - 渲染状态管理
  // ========================================================================

  /**
   * 获取Canvas可见性状态
   * @returns 是否可见
   */
  get canvasVisible(): boolean {
    return this._canvasVisible
  }

  /**
   * 设置Canvas可见性状态
   * @param value 是否可见
   */
  set canvasVisible(value: boolean) {
    if (this._canvasVisible !== value) {
      this._canvasVisible = value
      this.emit('visibility_changed', value)
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取调制颜色
   * @returns 调制颜色对象
   */
  get modulate(): { r: number, g: number, b: number, a: number } {
    return { ...this._modulate }
  }

  /**
   * 设置调制颜色
   * @param value 调制颜色对象
   */
  set modulate(value: { r: number, g: number, b: number, a: number }) {
    this._modulate = { ...value }
    this.emit('modulate_changed', this._modulate)
    this.markRenderCommandsDirty()
  }

  /**
   * 获取自身调制颜色
   * @returns 自身调制颜色对象
   */
  get selfModulate(): { r: number, g: number, b: number, a: number } {
    return { ...this._selfModulate }
  }

  /**
   * 设置自身调制颜色
   * @param value 自身调制颜色对象
   */
  set selfModulate(value: { r: number, g: number, b: number, a: number }) {
    this._selfModulate = { ...value }
    this.emit('modulate_changed', this._selfModulate)
    this.markRenderCommandsDirty()
  }

  /**
   * 获取Z索引
   * @returns Z索引值
   */
  get zIndex(): number {
    return this._zIndex
  }

  /**
   * 设置Z索引
   * @param value Z索引值
   */
  set zIndex(value: number) {
    if (this._zIndex !== value) {
      this._zIndex = value
      this.emit('z_index_changed', value)
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取Z索引是否相对于父节点
   * @returns 是否相对
   */
  get zAsRelative(): boolean {
    return this._zAsRelative
  }

  /**
   * 设置Z索引是否相对于父节点
   * @param value 是否相对
   */
  set zAsRelative(value: boolean) {
    if (this._zAsRelative !== value) {
      this._zAsRelative = value
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取是否显示在顶层
   * @returns 是否显示在顶层
   */
  get showOnTop(): boolean {
    return this._showOnTop
  }

  /**
   * 设置是否显示在顶层
   * @param value 是否显示在顶层
   */
  set showOnTop(value: boolean) {
    if (this._showOnTop !== value) {
      this._showOnTop = value
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取是否显示在父节点后面
   * @returns 是否显示在父节点后面
   */
  get showBehindParent(): boolean {
    return this._showBehindParent
  }

  /**
   * 设置是否显示在父节点后面
   * @param value 是否显示在父节点后面
   */
  set showBehindParent(value: boolean) {
    if (this._showBehindParent !== value) {
      this._showBehindParent = value
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取光照遮罩
   * @returns 光照遮罩值
   */
  get lightMask(): number {
    return this._lightMask
  }

  /**
   * 设置光照遮罩
   * @param value 光照遮罩值
   */
  set lightMask(value: number) {
    this._lightMask = value
  }

  /**
   * 获取2D材质
   * @returns 2D材质对象或null
   */
  get material(): Material2D | null {
    return this._material
  }

  /**
   * 设置2D材质
   * @param value 2D材质对象或null
   */
  set material(value: Material2D | null) {
    if (this._material !== value) {
      this._material = value
      this.emit('material_changed', value)
      this.markRenderCommandsDirty()
    }
  }

  /**
   * 获取是否使用父节点材质
   * @returns 是否使用父节点材质
   */
  get useParentMaterial(): boolean {
    return this._useParentMaterial
  }

  /**
   * 设置是否使用父节点材质
   * @param value 是否使用父节点材质
   */
  set useParentMaterial(value: boolean) {
    if (this._useParentMaterial !== value) {
      this._useParentMaterial = value
      this.markRenderCommandsDirty()
    }
  }

  // ========================================================================
  // 核心功能方法 - 渲染管理
  // ========================================================================

  /**
   * 标记渲染命令需要重新排序
   * 当渲染状态发生变化时调用此方法
   */
  private markRenderCommandsDirty(): void {
    this._needsSortRenderCommands = true

    // 通知父节点也需要重新排序
    const parent = this.parent
    if (parent && parent instanceof CanvasItem) {
      parent.markRenderCommandsDirty()
    }
  }

  /**
   * 获取全局变换矩阵
   * 计算从根节点到当前节点的累积变换
   * @returns 全局变换矩阵
   */
  getGlobalTransform(): Transform2D {
    // 如果缓存有效，直接返回
    if (!this._globalTransformDirty && this._globalTransformCache) {
      return this._globalTransformCache
    }

    // 计算全局变换
    let globalTransform: Transform2D = { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } }

    // 从当前节点向上遍历到根节点，累积变换
    let currentNode: CanvasItem | null = this
    const transformStack: Transform2D[] = []

    while (currentNode && currentNode instanceof CanvasItem) {
      // 如果节点有getTransform方法（如Node2D），获取其变换
      if ('getTransform' in currentNode && typeof currentNode.getTransform === 'function') {
        transformStack.push((currentNode as any).getTransform())
      }
      const parent = currentNode.parent
      currentNode = parent instanceof CanvasItem ? parent : null
    }

    // 从根节点开始应用变换
    for (let i = transformStack.length - 1; i >= 0; i--) {
      globalTransform = this.multiplyTransforms(globalTransform, transformStack[i])
    }

    // 缓存结果
    this._globalTransformCache = globalTransform
    this._globalTransformDirty = false

    return globalTransform
  }

  /**
   * 变换矩阵乘法
   * @param a 第一个变换矩阵
   * @param b 第二个变换矩阵
   * @returns 乘法结果
   */
  private multiplyTransforms(a: Transform2D, b: Transform2D): Transform2D {
    const cos = Math.cos(a.rotation)
    const sin = Math.sin(a.rotation)

    return {
      position: {
        x: a.position.x + (b.position.x * cos - b.position.y * sin) * a.scale.x,
        y: a.position.y + (b.position.x * sin + b.position.y * cos) * a.scale.y
      },
      rotation: a.rotation + b.rotation,
      scale: {
        x: a.scale.x * b.scale.x,
        y: a.scale.y * b.scale.y
      }
    }
  }

  /**
   * 检查节点是否在屏幕可见区域内
   * 用于渲染剔除优化
   * @param viewportRect 视口矩形区域
   * @returns 是否可见
   */
  isVisibleInViewport(viewportRect: Rect2): boolean {
    // 如果节点不可见，直接返回false
    if (!this._visible) {
      return false
    }

    // 获取节点的边界矩形（子类需要重写此方法）
    const bounds = this.getBounds()
    if (!bounds) {
      return true // 如果无法获取边界，假设可见
    }

    // 将边界变换到全局坐标系
    const globalTransform = this.getGlobalTransform()
    const globalBounds = this.transformRect(bounds, globalTransform)

    // 检查是否与视口相交
    return this.rectsIntersect(globalBounds, viewportRect)
  }

  /**
   * 获取节点的边界矩形
   * 子类应该重写此方法以提供准确的边界信息
   * @returns 边界矩形或null
   */
  protected getBounds(): Rect2 | null {
    // 基类返回null，子类需要重写
    return null
  }

  /**
   * 将矩形应用变换
   * @param rect 原始矩形
   * @param transform 变换矩阵
   * @returns 变换后的矩形
   */
  private transformRect(rect: Rect2, transform: Transform2D): Rect2 {
    // 简化实现：只考虑位置和缩放，忽略旋转
    return {
      position: {
        x: rect.position.x * transform.scale.x + transform.position.x,
        y: rect.position.y * transform.scale.y + transform.position.y
      },
      size: {
        x: rect.size.x * transform.scale.x,
        y: rect.size.y * transform.scale.y
      }
    }
  }

  /**
   * 检查两个矩形是否相交
   * @param rect1 第一个矩形
   * @param rect2 第二个矩形
   * @returns 是否相交
   */
  private rectsIntersect(rect1: Rect2, rect2: Rect2): boolean {
    return !(rect1.position.x + rect1.size.x < rect2.position.x ||
             rect2.position.x + rect2.size.x < rect1.position.x ||
             rect1.position.y + rect1.size.y < rect2.position.y ||
             rect2.position.y + rect2.size.y < rect1.position.y)
  }

  /**
   * 添加渲染命令
   * @param command 渲染命令
   */
  protected addRenderCommand(command: RenderCommand2D): void {
    this._renderCommands.push(command)
    this._needsSortRenderCommands = true
  }

  /**
   * 清空渲染命令
   */
  protected clearRenderCommands(): void {
    this._renderCommands.length = 0
    this._needsSortRenderCommands = false
  }

  /**
   * 获取排序后的渲染命令列表
   * @returns 渲染命令数组
   */
  getRenderCommands(): RenderCommand2D[] {
    if (this._needsSortRenderCommands) {
      this.sortRenderCommands()
      this._needsSortRenderCommands = false
    }
    return this._renderCommands
  }

  /**
   * 对渲染命令进行排序
   * 按照Z索引和添加顺序排序
   */
  private sortRenderCommands(): void {
    this._renderCommands.sort((a, b) => {
      // 首先按Z索引排序
      if (a.zIndex !== b.zIndex) {
        return a.zIndex - b.zIndex
      }
      // Z索引相同时保持原有顺序（稳定排序）
      return 0
    })
  }

  // ========================================================================
  // 绘制方法 - 子类可重写
  // ========================================================================

  /**
   * 绘制方法 - 子类重写以实现自定义绘制
   * 此方法在每帧渲染时被调用
   *
   * 使用示例:
   * ```typescript
   * class MyCanvasItem extends CanvasItem {
   *   protected draw(): void {
   *     // 绘制一个红色矩形
   *     this.drawRect(
   *       { position: { x: 0, y: 0 }, size: { x: 100, y: 100 } },
   *       { r: 1, g: 0, b: 0, a: 1 }
   *     )
   *   }
   * }
   * ```
   */
  protected draw(): void {
    // 基类不执行任何绘制操作
    // 子类重写此方法以实现具体的绘制逻辑
  }

  /**
   * 绘制矩形
   * @param rect 矩形区域
   * @param color 颜色
   * @param filled 是否填充，默认为true
   */
  protected drawRect(
    rect: Rect2,
    color: { r: number, g: number, b: number, a: number },
    filled: boolean = true
  ): void {
    const command: RenderCommand2D = {
      type: 'draw_rect',
      zIndex: this._zIndex,
      data: { rect, color, filled },
      transform: this.getGlobalTransform(),
      blendMode: this._material?.blendMode || BlendMode.NORMAL,
      modulate: this.getEffectiveModulate()
    }
    this.addRenderCommand(command)
  }

  /**
   * 绘制线条
   * @param from 起点
   * @param to 终点
   * @param color 颜色
   * @param width 线宽，默认为1
   */
  protected drawLine(
    from: Vector2,
    to: Vector2,
    color: { r: number, g: number, b: number, a: number },
    width: number = 1
  ): void {
    const command: RenderCommand2D = {
      type: 'draw_line',
      zIndex: this._zIndex,
      data: { from, to, color, width },
      transform: this.getGlobalTransform(),
      blendMode: this._material?.blendMode || BlendMode.NORMAL,
      modulate: this.getEffectiveModulate()
    }
    this.addRenderCommand(command)
  }





  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 隐藏节点
   * 等同于设置 visible = false
   */
  hide(): void {
    this.visible = false
  }

  /**
   * 显示节点
   * 等同于设置 visible = true
   */
  show(): void {
    this.visible = true
  }

  /**
   * 检查节点是否在全局可见状态
   * 考虑父节点的可见性
   * @returns 是否全局可见
   */
  isVisibleInTree(): boolean {
    if (!this._visible) {
      return false
    }

    const parent = this.parent
    if (parent && parent instanceof CanvasItem) {
      return parent.isVisibleInTree()
    }

    return true
  }

  /**
   * 获取有效的Z索引
   * 考虑相对性和父节点的Z索引
   * @returns 有效的Z索引
   */
  getEffectiveZIndex(): number {
    let effectiveZIndex = this._zIndex

    if (this._zAsRelative) {
      const parent = this.parent
      if (parent && parent instanceof CanvasItem) {
        effectiveZIndex += parent.getEffectiveZIndex()
      }
    }

    return effectiveZIndex
  }

  /**
   * 强制更新全局变换
   * 清除缓存并重新计算
   */
  updateGlobalTransform(): void {
    this._globalTransformDirty = true
    this._globalTransformCache = null

    // 递归更新子节点
    for (const child of this.children) {
      if (child instanceof CanvasItem) {
        child.updateGlobalTransform()
      }
    }
  }

  // ========================================================================
  // 生命周期方法重写 - 新架构集成
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  public _enterTree(): void {
    super._enterTree()

    // 初始化Three.js组件（如果还没有初始化）
    if (!this._canvas) {
      this.initializeThreeJSComponents()
    }

    // 标记需要重新绘制
    this._needsCanvasRedraw = true
  }

  /**
   * 节点退出场景树时调用
   */
  public _exitTree(): void {
    super._exitTree()

    // 清理Three.js资源
    this.cleanupThreeJSResources()
  }

  /**
   * 每帧更新时调用
   * @param delta 时间增量（秒）
   */
  public _process(delta: number): void {
    super._process(delta)

    // 更新Canvas内容
    this.updateCanvasContent()

    // 调用传统的绘制方法（向后兼容）
    this.draw()

    // 同步变换到Three.js
    this.syncTransformToThreeJS()
  }

  /**
   * 同步变换到Three.js对象
   */
  protected syncTransformToThreeJS(): void {
    super.syncTransformToThreeJS()

    if (this._planeMesh && this._transformDirty) {
      // 更新Z位置以反映Z索引
      const zOffset = this._zIndex * 0.001 // 每个Z索引间隔0.001单位
      this._planeMesh.position.z = zOffset

      // 更新可见性
      this._planeMesh.visible = this.visible && this._canvasVisible

      // 更新调制颜色
      if (this._planeMaterial) {
        const modulate = this.getEffectiveModulate()
        this._planeMaterial.color.setRGB(modulate.r, modulate.g, modulate.b)
        this._planeMaterial.opacity = modulate.a
      }
    }
  }

  /**
   * 清理Three.js资源
   */
  private cleanupThreeJSResources(): void {
    // 清理几何体
    if (this._planeGeometry) {
      this._planeGeometry.dispose()
      this._planeGeometry = null
    }

    // 清理材质
    if (this._planeMaterial) {
      this._planeMaterial.dispose()
      this._planeMaterial = null
    }

    // 清理纹理
    if (this._canvasTexture) {
      this._canvasTexture.dispose()
      this._canvasTexture = null
    }

    // 清理Canvas
    this._canvas = null
    this._canvasContext = null
    this._planeMesh = null
  }

  /**
   * 获取有效的调制颜色（包含父节点影响）
   * @returns 有效的调制颜色
   */
  private getEffectiveModulate(): { r: number, g: number, b: number, a: number } {
    let effectiveModulate = { ...this._modulate }

    // 如果有父CanvasItem，应用其调制颜色
    const parent = this.parent
    if (parent instanceof CanvasItem) {
      const parentModulate = parent.getEffectiveModulate()
      effectiveModulate.r *= parentModulate.r
      effectiveModulate.g *= parentModulate.g
      effectiveModulate.b *= parentModulate.b
      effectiveModulate.a *= parentModulate.a
    }

    return effectiveModulate
  }
}

// ============================================================================
// 导出
// ============================================================================

export default CanvasItem
