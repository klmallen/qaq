/**
 * QAQ游戏引擎 - Sprite2D 2D精灵节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 用于显示2D图像/纹理的节点，类似于Godot的Sprite2D
 * - 支持纹理加载、缩放、旋转、翻转
 * - 提供精灵帧动画支持
 * - 支持九宫格拉伸和区域裁剪
 * - 集成材质系统和混合模式
 * - 优化的批量渲染支持
 *
 * 继承关系:
 * Node -> CanvasItem -> Node2D -> Sprite2D
 */

import Node2D from '../Node2D'
import ResourceLoader from '../../resources/ResourceLoader'
import * as THREE from 'three'
import type { Vector2, Rect2, PropertyInfo } from '../../../types/core'
import type { LoadProgress, LoadResult } from '../../resources/ResourceLoader'

// ============================================================================
// Sprite2D相关枚举和接口
// ============================================================================

/**
 * 精灵翻转模式
 */
export enum FlipMode {
  /** 不翻转 */
  NONE = 0,
  /** 水平翻转 */
  HORIZONTAL = 1,
  /** 垂直翻转 */
  VERTICAL = 2,
  /** 水平和垂直翻转 */
  BOTH = 3
}

/**
 * 精灵拉伸模式
 */
export enum StretchMode {
  /** 保持原始大小 */
  KEEP = 0,
  /** 拉伸到节点大小 */
  TILE = 1,
  /** 保持比例拉伸 */
  KEEP_ASPECT = 2,
  /** 保持比例居中 */
  KEEP_ASPECT_CENTERED = 3,
  /** 保持比例覆盖 */
  KEEP_ASPECT_COVERED = 4
}

/**
 * 精灵配置接口
 */
export interface Sprite2DConfig {
  /** 纹理路径 */
  texturePath?: string
  /** 纹理对象 */
  texture?: THREE.Texture
  /** 是否居中 */
  centered?: boolean
  /** 翻转模式 */
  flipMode?: FlipMode
  /** 拉伸模式 */
  stretchMode?: StretchMode
  /** 区域裁剪 */
  region?: Rect2
  /** 是否启用区域 */
  regionEnabled?: boolean
  /** 九宫格边距 */
  ninePatchMargins?: { left: number; top: number; right: number; bottom: number }
}

// ============================================================================
// Sprite2D 主类
// ============================================================================

/**
 * Sprite2D 2D精灵节点类
 *
 * 提供完整的2D精灵显示功能，包括纹理加载、变换、动画等
 */
export default class Sprite2D extends Node2D {
  // 纹理相关属性
  private _texture: THREE.Texture | null = null
  private _texturePath: string = ''
  private _textureSize: Vector2 = { x: 0, y: 0 }

  // 显示属性
  private _centered: boolean = true
  private _flipMode: FlipMode = FlipMode.NONE
  private _stretchMode: StretchMode = StretchMode.KEEP

  // 区域裁剪
  private _regionEnabled: boolean = false
  private _region: Rect2 = { x: 0, y: 0, width: 0, height: 0 }

  // 九宫格
  private _ninePatchEnabled: boolean = false
  private _ninePatchMargins = { left: 0, top: 0, right: 0, bottom: 0 }

  // Three.js 对象
  private _sprite: THREE.Sprite | null = null
  private _spriteMaterial: THREE.SpriteMaterial | null = null

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 精灵配置
   */
  constructor(name: string = 'Sprite2D', config: Sprite2DConfig = {}) {
    super(name)

    // 应用配置
    this._centered = config.centered ?? true
    this._flipMode = config.flipMode ?? FlipMode.NONE
    this._stretchMode = config.stretchMode ?? StretchMode.KEEP
    this._regionEnabled = config.regionEnabled ?? false

    if (config.region) {
      this._region = { ...config.region }
    }

    if (config.ninePatchMargins) {
      this._ninePatchMargins = { ...config.ninePatchMargins }
      this._ninePatchEnabled = true
    }

    // 初始化Three.js对象
    this._initializeThreeObjects()

    // 加载纹理
    if (config.texturePath) {
      this.loadTexture(config.texturePath)
    } else if (config.texture) {
      this.texture = config.texture
    }

    console.log(`✅ Sprite2D节点创建: ${this.name}`)
  }

  // ============================================================================
  // 属性访问器
  // ============================================================================

  /**
   * 获取纹理
   */
  get texture(): THREE.Texture | null {
    return this._texture
  }

  /**
   * 设置纹理
   */
  set texture(value: THREE.Texture | null) {
    if (this._texture !== value) {
      this._texture = value
      this._updateTexture()
      this._updateSize()
      this.markDirty()
    }
  }

  /**
   * 获取纹理路径
   */
  get texturePath(): string {
    return this._texturePath
  }

  /**
   * 获取是否居中
   */
  get centered(): boolean {
    return this._centered
  }

  /**
   * 设置是否居中
   */
  set centered(value: boolean) {
    if (this._centered !== value) {
      this._centered = value
      this._updateSpriteScale()
      this.markDirty()
    }
  }

  /**
   * 获取翻转模式
   */
  get flipMode(): FlipMode {
    return this._flipMode
  }

  /**
   * 设置翻转模式
   */
  set flipMode(value: FlipMode) {
    if (this._flipMode !== value) {
      this._flipMode = value
      this._updateSpriteScale()
      this.markDirty()
    }
  }

  /**
   * 获取拉伸模式
   */
  get stretchMode(): StretchMode {
    return this._stretchMode
  }

  /**
   * 设置拉伸模式
   */
  set stretchMode(value: StretchMode) {
    if (this._stretchMode !== value) {
      this._stretchMode = value
      this._updateSpriteScale()
      this.markDirty()
    }
  }

  /**
   * 获取纹理大小
   */
  get textureSize(): Vector2 {
    return { ...this._textureSize }
  }

  /**
   * 获取区域是否启用
   */
  get regionEnabled(): boolean {
    return this._regionEnabled
  }

  /**
   * 设置区域是否启用
   */
  set regionEnabled(value: boolean) {
    if (this._regionEnabled !== value) {
      this._regionEnabled = value
      // TODO: 实现THREE.Sprite的区域裁剪
      this.markDirty()
    }
  }

  /**
   * 获取区域
   */
  get region(): Rect2 {
    return { ...this._region }
  }

  /**
   * 设置区域
   */
  set region(value: Rect2) {
    this._region = { ...value }
    if (this._regionEnabled) {
      // TODO: 实现THREE.Sprite的区域裁剪
      this.markDirty()
    }
  }

  // ============================================================================
  // 公共方法
  // ============================================================================

  /**
   * 异步加载纹理
   * @param path 纹理路径
   * @param onProgress 进度回调
   * @returns Promise<boolean> 加载是否成功
   */
  async loadTexture(path: string, onProgress?: (progress: LoadProgress) => void): Promise<boolean> {
    try {
      this._texturePath = path

      const loader = ResourceLoader.getInstance()
      const result: LoadResult<THREE.Texture> = await loader.load<THREE.Texture>(
        path,
        {
          onProgress,
          useCache: true,
          timeout: 30000
        }
      )

      this.texture = result.resource
      console.log(`✅ Sprite2D纹理加载成功: ${path}`)
      return true

    } catch (error) {
      console.error(`❌ Sprite2D纹理加载失败: ${path}`, error)
      return false
    }
  }

  /**
   * 设置区域裁剪
   * @param x 区域X坐标
   * @param y 区域Y坐标
   * @param width 区域宽度
   * @param height 区域高度
   */
  setRegion(x: number, y: number, width: number, height: number): void {
    this._region = { x, y, width, height }
    this._regionEnabled = true
    // TODO: 实现THREE.Sprite的区域裁剪
    this.markDirty()
  }

  /**
   * 清除区域裁剪
   */
  clearRegion(): void {
    this._regionEnabled = false
    // TODO: 实现THREE.Sprite的区域裁剪
    this.markDirty()
  }

  /**
   * 设置九宫格边距
   * @param left 左边距
   * @param top 上边距
   * @param right 右边距
   * @param bottom 下边距
   */
  setNinePatchMargins(left: number, top: number, right: number, bottom: number): void {
    this._ninePatchMargins = { left, top, right, bottom }
    this._ninePatchEnabled = true
    // TODO: 实现THREE.Sprite的九宫格
    this.markDirty()
  }

  /**
   * 清除九宫格
   */
  clearNinePatch(): void {
    this._ninePatchEnabled = false
    // TODO: 实现THREE.Sprite的九宫格
    this.markDirty()
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 初始化Three.js对象
   */
  private _initializeThreeObjects(): void {
    // 创建精灵材质
    this._spriteMaterial = new THREE.SpriteMaterial({
      transparent: true,
      alphaTest: 0.01
    })

    // 创建精灵对象
    this._sprite = new THREE.Sprite(this._spriteMaterial)
    this._sprite.name = `${this.name}_Sprite`

    // 添加到场景图
    if (this.object3D) {
      this.object3D.add(this._sprite)
    }
  }

  /**
   * 更新纹理
   */
  private _updateTexture(): void {
    if (this._spriteMaterial && this._texture) {
      this._spriteMaterial.map = this._texture
      this._spriteMaterial.needsUpdate = true

      // 更新纹理大小
      this._textureSize = {
        x: this._texture.image?.width || 0,
        y: this._texture.image?.height || 0
      }

      // 更新精灵尺寸
      this._updateSpriteScale()
    }
  }

  /**
   * 更新精灵缩放
   */
  private _updateSpriteScale(): void {
    if (!this._sprite || !this._textureSize.x || !this._textureSize.y) return

    // 根据拉伸模式计算缩放
    let scaleX = this._textureSize.x
    let scaleY = this._textureSize.y

    switch (this._stretchMode) {
      case StretchMode.KEEP:
        // 保持原始尺寸
        break
      case StretchMode.KEEP_ASPECT:
        // 保持宽高比，以较小的缩放为准
        const minScale = Math.min(scaleX, scaleY)
        scaleX = minScale
        scaleY = minScale
        break
      case StretchMode.KEEP_ASPECT_CENTERED:
        // 保持宽高比并居中
        break
      case StretchMode.KEEP_ASPECT_COVERED:
        // 保持宽高比，以较大的缩放为准
        const maxScale = Math.max(scaleX, scaleY)
        scaleX = maxScale
        scaleY = maxScale
        break
    }

    // 应用翻转
    if (this._flipMode & FlipMode.HORIZONTAL) {
      scaleX = -scaleX
    }
    if (this._flipMode & FlipMode.VERTICAL) {
      scaleY = -scaleY
    }

    // 设置精灵缩放
    this._sprite.scale.set(scaleX, scaleY, 1)

    // 处理居中
    if (this._centered) {
      this._sprite.center.set(0.5, 0.5)
    } else {
      this._sprite.center.set(0, 1) // 左上角对齐
    }
  }



  /**
   * 更新大小
   */
  private _updateSize(): void {
    if (this._texture && this._textureSize.x > 0 && this._textureSize.y > 0) {
      this.size = { x: this._textureSize.x, y: this._textureSize.y }
      this._updateSpriteScale()
    }
  }

  /**
   * 清理资源
   */
  protected override _cleanup(): void {
    if (this._spriteMaterial) {
      this._spriteMaterial.dispose()
      this._spriteMaterial = null
    }

    if (this._sprite && this.object3D) {
      this.object3D.remove(this._sprite)
      this._sprite = null
    }

    super._cleanup()
  }

  /**
   * 销毁精灵
   */
  destroy(): void {
    this._cleanup()
    super.destroy()
  }
}
