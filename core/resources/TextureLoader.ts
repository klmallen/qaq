/**
 * QAQ游戏引擎 - TextureLoader 纹理加载器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 类似Godot的资源加载系统
 * - 支持多种图片格式加载
 * - 提供纹理缓存和管理
 * - 支持异步加载和进度回调
 * - 预设纹理库支持
 */

import * as THREE from 'three'

// ============================================================================
// 纹理加载相关接口
// ============================================================================

/**
 * 加载配置接口
 */
export interface LoadConfig {
  /** 是否缓存纹理 */
  cache?: boolean
  /** 加载超时时间（毫秒） */
  timeout?: number
  /** 进度回调 */
  onProgress?: (progress: number) => void
  /** 纹理过滤方式 */
  filter?: THREE.TextureFilter
  /** 纹理包装方式 */
  wrap?: THREE.Wrapping
  /** 是否翻转Y轴 */
  flipY?: boolean
}

/**
 * 预设纹理类型
 */
export enum PresetTextureType {
  /** 纯色 */
  SOLID_COLOR = 'solid_color',
  /** 渐变 */
  GRADIENT = 'gradient',
  /** 棋盘格 */
  CHECKERBOARD = 'checkerboard',
  /** 网格 */
  GRID = 'grid',
  /** 噪声 */
  NOISE = 'noise',
  /** 圆形 */
  CIRCLE = 'circle',
  /** 默认精灵 */
  DEFAULT_SPRITE = 'default_sprite'
}

/**
 * 预设纹理配置
 */
export interface PresetConfig {
  /** 纹理尺寸 */
  size?: { width: number, height: number }
  /** 主颜色 */
  color?: string
  /** 次要颜色 */
  secondaryColor?: string
  /** 特定参数 */
  params?: Record<string, any>
}

// ============================================================================
// TextureLoader 类实现
// ============================================================================

/**
 * TextureLoader 类 - 纹理加载器
 *
 * 主要功能:
 * 1. 图片文件加载
 * 2. 纹理缓存管理
 * 3. 预设纹理生成
 * 4. 异步加载支持
 * 5. 精灵表处理
 */
export default class TextureLoader {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 纹理缓存 */
  private static _cache: Map<string, THREE.Texture> = new Map()

  /** THREE.js纹理加载器 */
  private static _loader: THREE.TextureLoader = new THREE.TextureLoader()

  /** 支持的图片格式 */
  private static readonly SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp']

  // ========================================================================
  // 静态方法 - 图片加载
  // ========================================================================

  /**
   * 从文件路径加载纹理
   * @param path 图片路径
   * @param config 加载配置
   * @returns Promise<THREE.Texture>
   */
  static async loadFromFile(path: string, config: LoadConfig = {}): Promise<THREE.Texture> {
    // 检查缓存
    if (config.cache !== false && this._cache.has(path)) {
      return this._cache.get(path)!.clone()
    }

    return new Promise((resolve, reject) => {
      const timeout = config.timeout || 10000
      let timeoutId: NodeJS.Timeout

      // 设置超时
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          reject(new Error(`Texture loading timeout: ${path}`))
        }, timeout)
      }

      // 加载纹理
      this._loader.load(
        path,
        // 成功回调
        (texture) => {
          if (timeoutId) clearTimeout(timeoutId)
          
          // 配置纹理
          this._configureTexture(texture, config)
          
          // 缓存纹理
          if (config.cache !== false) {
            this._cache.set(path, texture.clone())
          }
          
          resolve(texture)
        },
        // 进度回调
        (progress) => {
          if (config.onProgress) {
            const percent = (progress.loaded / progress.total) * 100
            config.onProgress(percent)
          }
        },
        // 错误回调
        (error) => {
          if (timeoutId) clearTimeout(timeoutId)
          reject(new Error(`Failed to load texture: ${path} - ${error}`))
        }
      )
    })
  }

  /**
   * 从Base64数据加载纹理
   * @param base64Data Base64数据
   * @param config 加载配置
   * @returns THREE.Texture
   */
  static loadFromBase64(base64Data: string, config: LoadConfig = {}): THREE.Texture {
    const texture = this._loader.load(base64Data)
    this._configureTexture(texture, config)
    return texture
  }

  /**
   * 从Canvas元素创建纹理
   * @param canvas Canvas元素
   * @param config 加载配置
   * @returns THREE.Texture
   */
  static loadFromCanvas(canvas: HTMLCanvasElement, config: LoadConfig = {}): THREE.Texture {
    const texture = new THREE.CanvasTexture(canvas)
    this._configureTexture(texture, config)
    return texture
  }

  // ========================================================================
  // 静态方法 - 预设纹理
  // ========================================================================

  /**
   * 创建预设纹理
   * @param type 预设类型
   * @param config 配置
   * @returns THREE.Texture
   */
  static createPreset(type: PresetTextureType, config: PresetConfig = {}): THREE.Texture {
    const size = config.size || { width: 64, height: 64 }
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')!

    switch (type) {
      case PresetTextureType.SOLID_COLOR:
        return this._createSolidColor(ctx, canvas, config)
      
      case PresetTextureType.GRADIENT:
        return this._createGradient(ctx, canvas, config)
      
      case PresetTextureType.CHECKERBOARD:
        return this._createCheckerboard(ctx, canvas, config)
      
      case PresetTextureType.GRID:
        return this._createGrid(ctx, canvas, config)
      
      case PresetTextureType.CIRCLE:
        return this._createCircle(ctx, canvas, config)
      
      case PresetTextureType.DEFAULT_SPRITE:
        return this._createDefaultSprite(ctx, canvas, config)
      
      default:
        return this._createSolidColor(ctx, canvas, { color: '#ff00ff' })
    }
  }

  // ========================================================================
  // 静态方法 - 精灵表处理
  // ========================================================================

  /**
   * 从精灵表创建纹理数组
   * @param spriteSheetPath 精灵表路径
   * @param frameWidth 帧宽度
   * @param frameHeight 帧高度
   * @param config 加载配置
   * @returns Promise<THREE.Texture[]>
   */
  static async loadSpriteSheet(
    spriteSheetPath: string, 
    frameWidth: number, 
    frameHeight: number, 
    config: LoadConfig = {}
  ): Promise<THREE.Texture[]> {
    const spriteSheet = await this.loadFromFile(spriteSheetPath, config)
    const textures: THREE.Texture[] = []
    
    const image = spriteSheet.image
    const cols = Math.floor(image.width / frameWidth)
    const rows = Math.floor(image.height / frameHeight)
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const canvas = document.createElement('canvas')
        canvas.width = frameWidth
        canvas.height = frameHeight
        const ctx = canvas.getContext('2d')!
        
        ctx.drawImage(
          image,
          col * frameWidth, row * frameHeight, frameWidth, frameHeight,
          0, 0, frameWidth, frameHeight
        )
        
        const texture = new THREE.CanvasTexture(canvas)
        this._configureTexture(texture, config)
        textures.push(texture)
      }
    }
    
    return textures
  }

  // ========================================================================
  // 静态方法 - 缓存管理
  // ========================================================================

  /**
   * 清除纹理缓存
   * @param path 特定路径（可选）
   */
  static clearCache(path?: string): void {
    if (path) {
      const texture = this._cache.get(path)
      if (texture) {
        texture.dispose()
        this._cache.delete(path)
      }
    } else {
      this._cache.forEach(texture => texture.dispose())
      this._cache.clear()
    }
  }

  /**
   * 获取缓存统计
   * @returns 缓存信息
   */
  static getCacheStats(): { count: number, paths: string[] } {
    return {
      count: this._cache.size,
      paths: Array.from(this._cache.keys())
    }
  }

  // ========================================================================
  // 私有方法 - 纹理配置
  // ========================================================================

  /**
   * 配置纹理属性
   * @param texture 纹理对象
   * @param config 配置
   */
  private static _configureTexture(texture: THREE.Texture, config: LoadConfig): void {
    // 设置过滤方式
    if (config.filter !== undefined) {
      texture.magFilter = config.filter
      texture.minFilter = config.filter
    } else {
      texture.magFilter = THREE.NearestFilter
      texture.minFilter = THREE.NearestFilter
    }

    // 设置包装方式
    if (config.wrap !== undefined) {
      texture.wrapS = config.wrap
      texture.wrapT = config.wrap
    }

    // 设置Y轴翻转
    if (config.flipY !== undefined) {
      texture.flipY = config.flipY
    }

    texture.needsUpdate = true
  }

  // ========================================================================
  // 私有方法 - 预设纹理生成
  // ========================================================================

  /**
   * 创建纯色纹理
   */
  private static _createSolidColor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const color = config.color || '#ffffff'
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建渐变纹理
   */
  private static _createGradient(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const color1 = config.color || '#ffffff'
    const color2 = config.secondaryColor || '#000000'
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建棋盘格纹理
   */
  private static _createCheckerboard(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const color1 = config.color || '#ffffff'
    const color2 = config.secondaryColor || '#cccccc'
    const tileSize = config.params?.tileSize || 8
    
    for (let x = 0; x < canvas.width; x += tileSize) {
      for (let y = 0; y < canvas.height; y += tileSize) {
        const isEven = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 2 === 0
        ctx.fillStyle = isEven ? color1 : color2
        ctx.fillRect(x, y, tileSize, tileSize)
      }
    }
    
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建网格纹理
   */
  private static _createGrid(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const bgColor = config.color || '#ffffff'
    const lineColor = config.secondaryColor || '#000000'
    const gridSize = config.params?.gridSize || 16
    
    // 背景
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 网格线
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 1
    
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建圆形纹理
   */
  private static _createCircle(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const color = config.color || '#ffffff'
    const bgColor = config.secondaryColor || 'transparent'
    const radius = config.params?.radius || Math.min(canvas.width, canvas.height) / 2 - 2
    
    // 背景
    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    // 圆形
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2)
    ctx.fill()
    
    return new THREE.CanvasTexture(canvas)
  }

  /**
   * 创建默认精灵纹理
   */
  private static _createDefaultSprite(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: PresetConfig): THREE.Texture {
    const color = config.color || '#ff6b35'
    
    // 背景
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 边框
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)
    
    // 文字
    ctx.fillStyle = '#ffffff'
    ctx.font = `${Math.floor(canvas.width / 4)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('QAQ', canvas.width / 2, canvas.height / 2)
    
    return new THREE.CanvasTexture(canvas)
  }
}
