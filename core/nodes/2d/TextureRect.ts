/**
 * QAQ游戏引擎 - TextureRect 纹理矩形节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 用于显示纹理的UI控件，类似于Godot的TextureRect
 * - 支持多种拉伸模式和对齐方式
 * - 提供九宫格拉伸和纹理过滤
 * - 支持纹理动画和交互
 * - 优化的纹理渲染和内存管理
 * - 集成UI布局系统
 *
 * 继承关系:
 * Node -> CanvasItem -> Control -> TextureRect
 */

import Control from '../ui/Control'
import ResourceLoader from '../../resources/ResourceLoader'
import * as THREE from 'three'
import type { Vector2, Rect2, PropertyInfo } from '../../../types/core'
import type { LoadProgress, LoadResult } from '../../resources/ResourceLoader'

// ============================================================================
// TextureRect相关枚举和接口
// ============================================================================

/**
 * 纹理拉伸模式
 */
export enum StretchMode {
  /** 拉伸到控件大小 */
  STRETCH = 0,
  /** 平铺 */
  TILE = 1,
  /** 保持比例 */
  KEEP = 2,
  /** 保持比例居中 */
  KEEP_CENTERED = 3,
  /** 保持比例覆盖 */
  KEEP_ASPECT_COVERED = 4,
  /** 保持比例适应 */
  KEEP_ASPECT_FITTED = 5
}

/**
 * 纹理过滤模式
 */
export enum FilterMode {
  /** 最近邻过滤 */
  NEAREST = 0,
  /** 线性过滤 */
  LINEAR = 1
}

/**
 * 纹理配置接口
 */
export interface TextureRectConfig {
  /** 纹理路径 */
  texturePath?: string
  /** 纹理对象 */
  texture?: THREE.Texture
  /** 拉伸模式 */
  stretchMode?: StretchMode
  /** 过滤模式 */
  filterMode?: FilterMode
  /** 是否翻转水平 */
  flipH?: boolean
  /** 是否翻转垂直 */
  flipV?: boolean
  /** 九宫格边距 */
  ninePatchMargins?: { left: number; top: number; right: number; bottom: number }
  /** 纹理区域 */
  textureRegion?: Rect2
  /** 是否启用区域 */
  regionEnabled?: boolean
}

// ============================================================================
// TextureRect 主类
// ============================================================================

/**
 * TextureRect 纹理矩形节点类
 *
 * 提供完整的纹理显示功能，包括拉伸、过滤、九宫格等
 */
export default class TextureRect extends Control {
  // 纹理相关属性
  private _texture: THREE.Texture | null = null
  private _texturePath: string = ''
  private _textureSize: Vector2 = { x: 0, y: 0 }

  // 显示属性
  private _stretchMode: StretchMode = StretchMode.STRETCH
  private _filterMode: FilterMode = FilterMode.LINEAR
  private _flipH: boolean = false
  private _flipV: boolean = false

  // 九宫格
  private _ninePatchEnabled: boolean = false
  private _ninePatchMargins = { left: 0, top: 0, right: 0, bottom: 0 }

  // 区域裁剪
  private _regionEnabled: boolean = false
  private _textureRegion: Rect2 = { x: 0, y: 0, width: 0, height: 0 }

  // Three.js 对象
  private _mesh: THREE.Mesh | null = null
  private _material: THREE.MeshBasicMaterial | null = null
  private _geometry: THREE.PlaneGeometry | null = null

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 纹理配置
   */
  constructor(name: string = 'TextureRect', config: TextureRectConfig = {}) {
    super(name)

    // 应用配置
    this._stretchMode = config.stretchMode ?? StretchMode.STRETCH
    this._filterMode = config.filterMode ?? FilterMode.LINEAR
    this._flipH = config.flipH ?? false
    this._flipV = config.flipV ?? false
    this._regionEnabled = config.regionEnabled ?? false

    if (config.ninePatchMargins) {
      this._ninePatchMargins = { ...config.ninePatchMargins }
      this._ninePatchEnabled = true
    }

    if (config.textureRegion) {
      this._textureRegion = { ...config.textureRegion }
    }

    // 初始化Three.js对象
    this._initializeThreeObjects()

    // 加载纹理
    if (config.texturePath) {
      this.loadTexture(config.texturePath)
    } else if (config.texture) {
      this.texture = config.texture
    }

    console.log(`✅ TextureRect节点创建: ${this.name}`)
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
      this._updateGeometry()
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
      this._updateGeometry()
      this.markDirty()
    }
  }

  /**
   * 获取过滤模式
   */
  get filterMode(): FilterMode {
    return this._filterMode
  }

  /**
   * 设置过滤模式
   */
  set filterMode(value: FilterMode) {
    if (this._filterMode !== value) {
      this._filterMode = value
      this._updateTextureFilter()
      this.markDirty()
    }
  }

  /**
   * 获取水平翻转
   */
  get flipH(): boolean {
    return this._flipH
  }

  /**
   * 设置水平翻转
   */
  set flipH(value: boolean) {
    if (this._flipH !== value) {
      this._flipH = value
      this._updateUVMapping()
      this.markDirty()
    }
  }

  /**
   * 获取垂直翻转
   */
  get flipV(): boolean {
    return this._flipV
  }

  /**
   * 设置垂直翻转
   */
  set flipV(value: boolean) {
    if (this._flipV !== value) {
      this._flipV = value
      this._updateUVMapping()
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
   * 获取九宫格是否启用
   */
  get ninePatchEnabled(): boolean {
    return this._ninePatchEnabled
  }

  /**
   * 获取九宫格边距
   */
  get ninePatchMargins() {
    return { ...this._ninePatchMargins }
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
      this._updateUVMapping()
      this.markDirty()
    }
  }

  /**
   * 获取纹理区域
   */
  get textureRegion(): Rect2 {
    return { ...this._textureRegion }
  }

  /**
   * 设置纹理区域
   */
  set textureRegion(value: Rect2) {
    this._textureRegion = { ...value }
    if (this._regionEnabled) {
      this._updateUVMapping()
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
      const result: LoadResult<THREE.Texture> = await loader.loadResource(
        path,
        'texture',
        { onProgress }
      )

      this.texture = result.resource
      console.log(`✅ TextureRect纹理加载成功: ${path}`)
      return true

    } catch (error) {
      console.error(`❌ TextureRect纹理加载失败: ${path}`, error)
      return false
    }
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
    this._updateGeometry()
    this.markDirty()
  }

  /**
   * 清除九宫格
   */
  clearNinePatch(): void {
    this._ninePatchEnabled = false
    this._updateGeometry()
    this.markDirty()
  }

  /**
   * 设置纹理区域
   * @param x 区域X坐标
   * @param y 区域Y坐标
   * @param width 区域宽度
   * @param height 区域高度
   */
  setTextureRegion(x: number, y: number, width: number, height: number): void {
    this._textureRegion = { x, y, width, height }
    this._regionEnabled = true
    this._updateUVMapping()
    this.markDirty()
  }

  /**
   * 清除纹理区域
   */
  clearTextureRegion(): void {
    this._regionEnabled = false
    this._updateUVMapping()
    this.markDirty()
  }

  /**
   * 适应纹理大小
   */
  fitToTexture(): void {
    if (this._texture && this._textureSize.x > 0 && this._textureSize.y > 0) {
      this.size = { ...this._textureSize }
      this._updateGeometry()
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 初始化Three.js对象
   */
  private _initializeThreeObjects(): void {
    // 创建几何体
    this._geometry = new THREE.PlaneGeometry(1, 1)

    // 创建材质
    this._material = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })

    // 创建网格
    this._mesh = new THREE.Mesh(this._geometry, this._material)
    this._mesh.name = `${this.name}_TextureRectMesh`

    // 添加到场景图
    if (this.object3D) {
      this.object3D.add(this._mesh)
    }
  }

  /**
   * 更新纹理
   */
  private _updateTexture(): void {
    if (this._material && this._texture) {
      this._material.map = this._texture
      this._material.needsUpdate = true

      // 更新纹理大小
      this._textureSize = {
        x: this._texture.image?.width || 0,
        y: this._texture.image?.height || 0
      }

      // 应用过滤模式
      this._updateTextureFilter()
    }
  }

  /**
   * 更新纹理过滤
   */
  private _updateTextureFilter(): void {
    if (!this._texture) return

    switch (this._filterMode) {
      case FilterMode.NEAREST:
        this._texture.magFilter = THREE.NearestFilter
        this._texture.minFilter = THREE.NearestFilter
        break
      case FilterMode.LINEAR:
        this._texture.magFilter = THREE.LinearFilter
        this._texture.minFilter = THREE.LinearFilter
        break
    }

    this._texture.needsUpdate = true
  }

  /**
   * 更新几何体
   */
  private _updateGeometry(): void {
    if (!this._geometry || !this._mesh) return

    let width = this.size.x
    let height = this.size.y

    // 应用拉伸模式
    switch (this._stretchMode) {
      case StretchMode.KEEP:
        if (this._textureSize.x > 0 && this._textureSize.y > 0) {
          width = this._textureSize.x
          height = this._textureSize.y
        }
        break

      case StretchMode.KEEP_CENTERED:
        if (this._textureSize.x > 0 && this._textureSize.y > 0) {
          width = this._textureSize.x
          height = this._textureSize.y
        }
        break

      case StretchMode.KEEP_ASPECT_COVERED:
        if (this._textureSize.x > 0 && this._textureSize.y > 0) {
          const aspectRatio = this._textureSize.x / this._textureSize.y
          const controlAspectRatio = this.size.x / this.size.y

          if (controlAspectRatio > aspectRatio) {
            width = this.size.x
            height = this.size.x / aspectRatio
          } else {
            width = this.size.y * aspectRatio
            height = this.size.y
          }
        }
        break

      case StretchMode.KEEP_ASPECT_FITTED:
        if (this._textureSize.x > 0 && this._textureSize.y > 0) {
          const aspectRatio = this._textureSize.x / this._textureSize.y
          const controlAspectRatio = this.size.x / this.size.y

          if (controlAspectRatio > aspectRatio) {
            width = this.size.y * aspectRatio
            height = this.size.y
          } else {
            width = this.size.x
            height = this.size.x / aspectRatio
          }
        }
        break

      case StretchMode.STRETCH:
      case StretchMode.TILE:
      default:
        // 使用控件大小
        break
    }

    // 更新几何体大小
    this._geometry.dispose()
    this._geometry = new THREE.PlaneGeometry(width, height)
    this._mesh.geometry = this._geometry

    // 设置位置
    this._mesh.position.set(width / 2, -height / 2, 0)

    // 更新UV映射
    this._updateUVMapping()
  }

  /**
   * 更新UV映射
   */
  private _updateUVMapping(): void {
    if (!this._geometry) return

    let uvs = [0, 1, 1, 1, 0, 0, 1, 0] // 默认UV坐标

    // 应用区域裁剪
    if (this._regionEnabled && this._textureSize.x > 0 && this._textureSize.y > 0) {
      const u1 = this._textureRegion.x / this._textureSize.x
      const v1 = 1 - (this._textureRegion.y + this._textureRegion.height) / this._textureSize.y
      const u2 = (this._textureRegion.x + this._textureRegion.width) / this._textureSize.x
      const v2 = 1 - this._textureRegion.y / this._textureSize.y

      uvs = [u1, v2, u2, v2, u1, v1, u2, v1]
    }

    // 应用平铺模式
    if (this._stretchMode === StretchMode.TILE && this._textureSize.x > 0 && this._textureSize.y > 0) {
      const tilesX = this.size.x / this._textureSize.x
      const tilesY = this.size.y / this._textureSize.y

      uvs = [0, tilesY, tilesX, tilesY, 0, 0, tilesX, 0]

      // 设置纹理包装模式
      if (this._texture) {
        this._texture.wrapS = THREE.RepeatWrapping
        this._texture.wrapT = THREE.RepeatWrapping
        this._texture.needsUpdate = true
      }
    } else {
      // 重置包装模式
      if (this._texture) {
        this._texture.wrapS = THREE.ClampToEdgeWrapping
        this._texture.wrapT = THREE.ClampToEdgeWrapping
        this._texture.needsUpdate = true
      }
    }

    // 应用翻转
    if (this._flipH) {
      [uvs[0], uvs[2]] = [uvs[2], uvs[0]]
      [uvs[4], uvs[6]] = [uvs[6], uvs[4]]
    }

    if (this._flipV) {
      [uvs[1], uvs[5]] = [uvs[5], uvs[1]]
      [uvs[3], uvs[7]] = [uvs[7], uvs[3]]
    }

    // 更新UV属性
    this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }

  /**
   * 清理资源
   */
  protected override _cleanup(): void {
    if (this._geometry) {
      this._geometry.dispose()
      this._geometry = null
    }

    if (this._material) {
      this._material.dispose()
      this._material = null
    }

    if (this._mesh && this.object3D) {
      this.object3D.remove(this._mesh)
      this._mesh = null
    }

    super._cleanup()
  }
}
