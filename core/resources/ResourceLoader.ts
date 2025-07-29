/**
 * QAQ游戏引擎 - ResourceLoader 资源加载器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 统一的资源加载管理系统，类似于Godot的ResourceLoader
 * - 基于Three.js加载器的封装，提供QAQ统一API
 * - 支持多种3D模型格式（GLTF、OBJ、FBX等）
 * - 异步加载、进度回调、错误处理
 * - 资源缓存和内存管理
 * - 与MeshInstance3D节点深度集成
 *
 * 架构设计:
 * - 单例模式管理全局资源
 * - 支持多种加载器注册
 * - 统一的加载接口和回调
 * - 完整的错误处理机制
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import EnhancedGLTFLoader, { GLTFResourceAccessor } from './EnhancedGLTFLoader'
import type { GLTFResource, GLTFLoadOptions } from './GLTFResource'

// ============================================================================
// 资源加载相关接口和枚举
// ============================================================================

/**
 * 支持的资源类型枚举
 */
export enum ResourceType {
  /** GLTF模型 */
  GLTF = 'gltf',
  /** GLB模型 */
  GLB = 'glb',
  /** OBJ模型 */
  OBJ = 'obj',
  /** FBX模型 */
  FBX = 'fbx',
  /** 纹理图片 */
  TEXTURE = 'texture',
  /** 音频文件 */
  AUDIO = 'audio'
}

/**
 * 加载进度信息接口
 */
export interface LoadProgress {
  /** 已加载字节数 */
  loaded: number
  /** 总字节数 */
  total: number
  /** 加载进度百分比 (0-1) */
  progress: number
  /** 当前加载的资源路径 */
  url: string
}

/**
 * 加载选项接口
 */
export interface LoadOptions {
  /** 是否启用缓存 */
  useCache?: boolean
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否启用Draco压缩解码 */
  enableDraco?: boolean
  /** Draco解码器路径 */
  dracoDecoderPath?: string
  /** 自定义加载器配置 */
  loaderConfig?: any
}

/**
 * 资源信息接口
 */
export interface ResourceInfo {
  /** 资源路径 */
  path: string
  /** 资源类型 */
  type: ResourceType
  /** 加载时间戳 */
  loadTime: number
  /** 文件大小 */
  size: number
  /** 是否已缓存 */
  cached: boolean
}

/**
 * 加载结果接口
 */
export interface LoadResult<T = any> {
  /** 加载的资源对象 */
  resource: T
  /** 资源信息 */
  info: ResourceInfo
  /** 加载耗时（毫秒） */
  duration: number
}

/**
 * 加载器接口
 */
export interface IResourceLoader {
  /** 支持的文件扩展名 */
  supportedExtensions: string[]
  /** 加载资源 */
  load(url: string, options?: LoadOptions): Promise<any>
  /** 设置进度回调 */
  setProgressCallback(callback: (progress: LoadProgress) => void): void
}

// ============================================================================
// ResourceLoader 主类实现
// ============================================================================

/**
 * ResourceLoader 类 - 统一资源加载管理器
 *
 * 主要功能:
 * 1. 多格式3D模型加载
 * 2. 异步加载和进度管理
 * 3. 资源缓存和内存管理
 * 4. 错误处理和重试机制
 * 5. 与Three.js加载器集成
 */
export class ResourceLoader {
  // ========================================================================
  // 私有属性 - 单例和加载器管理
  // ========================================================================

  /** 单例实例 */
  private static _instance: ResourceLoader | null = null

  /** 注册的加载器映射 */
  private _loaders: Map<string, IResourceLoader> = new Map()

  /** 资源缓存 */
  private _cache: Map<string, any> = new Map()

  /** 资源信息缓存 */
  private _resourceInfo: Map<string, ResourceInfo> = new Map()

  /** 当前加载任务 */
  private _loadingTasks: Map<string, Promise<LoadResult>> = new Map()

  /** 全局进度回调 */
  private _globalProgressCallback: ((progress: LoadProgress) => void) | null = null

  /** 默认加载选项 */
  private _defaultOptions: LoadOptions = {
    useCache: true,
    timeout: 30000,
    enableDraco: true,
    dracoDecoderPath: '/draco/'
  }

  /** 增强的GLTF加载器 */
  private _enhancedGLTFLoader: EnhancedGLTFLoader

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 私有构造函数 - 单例模式
   */
  private constructor() {
    this._enhancedGLTFLoader = new EnhancedGLTFLoader()
    this.initializeDefaultLoaders()
  }

  /**
   * 获取ResourceLoader单例实例
   * @returns ResourceLoader实例
   */
  static getInstance(): ResourceLoader {
    if (!ResourceLoader._instance) {
      ResourceLoader._instance = new ResourceLoader()
    }
    return ResourceLoader._instance
  }

  /**
   * 初始化默认加载器
   */
  private initializeDefaultLoaders(): void {
    // 注册GLTF加载器
    this.registerLoader(new GLTFResourceLoader())

    // 注册OBJ加载器
    this.registerLoader(new OBJResourceLoader())

    // 注册FBX加载器
    this.registerLoader(new FBXResourceLoader())

    // 注册纹理加载器
    this.registerLoader(new TextureResourceLoader())

    console.log('✅ ResourceLoader initialized with default loaders')
  }

  // ========================================================================
  // 公共API - 加载器管理
  // ========================================================================

  /**
   * 注册资源加载器
   * @param loader 加载器实例
   */
  registerLoader(loader: IResourceLoader): void {
    loader.supportedExtensions.forEach(ext => {
      this._loaders.set(ext.toLowerCase(), loader)
    })
  }

  /**
   * 获取支持的文件扩展名列表
   * @returns 支持的扩展名数组
   */
  getSupportedExtensions(): string[] {
    return Array.from(this._loaders.keys())
  }

  /**
   * 检查是否支持指定文件类型
   * @param filePath 文件路径
   * @returns 是否支持
   */
  isSupported(filePath: string): boolean {
    const ext = this.getFileExtension(filePath)
    return this._loaders.has(ext)
  }

  // ========================================================================
  // 公共API - 资源加载
  // ========================================================================

  /**
   * 加载GLTF资源（增强版本，返回完整的GLTF资源对象）
   * @param url GLTF文件URL
   * @param options GLTF加载选项
   * @returns 完整的GLTF资源对象
   */
  async loadGLTF(url: string, options: GLTFLoadOptions = {}): Promise<GLTFResource> {
    const cacheKey = `gltf_${url}_${JSON.stringify(options)}`

    // 检查缓存
    if (options.resourceTypeFilter === undefined && this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    try {
      // 设置进度回调
      if (this._globalProgressCallback) {
        this._enhancedGLTFLoader.setProgressCallback(this._globalProgressCallback)
      }

      // 加载GLTF资源
      const gltfResource = await this._enhancedGLTFLoader.loadGLTF(url, options)

      // 缓存结果
      if (options.resourceTypeFilter === undefined) {
        this._cache.set(cacheKey, gltfResource)
      }

      return gltfResource
    } catch (error) {
      throw new Error(`Failed to load GLTF resource from ${url}: ${error}`)
    }
  }

  /**
   * 创建GLTF资源访问器
   * @param gltfResource GLTF资源对象
   * @returns GLTF资源访问器
   */
  createGLTFAccessor(gltfResource: GLTFResource): GLTFResourceAccessor {
    return new GLTFResourceAccessor(gltfResource)
  }

  /**
   * 加载资源
   * @param url 资源URL
   * @param options 加载选项
   * @returns 加载结果Promise
   */
  async load<T = any>(url: string, options?: LoadOptions): Promise<LoadResult<T>> {
    const mergedOptions = { ...this._defaultOptions, ...options }

    // 检查缓存
    if (mergedOptions.useCache && this._cache.has(url)) {
      return this.createLoadResult(url, this._cache.get(url))
    }

    // 检查是否正在加载
    if (this._loadingTasks.has(url)) {
      return this._loadingTasks.get(url)! as Promise<LoadResult<T>>
    }

    // 开始加载
    const loadPromise = this.performLoad<T>(url, mergedOptions)
    this._loadingTasks.set(url, loadPromise)

    try {
      const result = await loadPromise

      // 缓存结果
      if (mergedOptions.useCache) {
        this._cache.set(url, result.resource)
      }

      return result
    } finally {
      this._loadingTasks.delete(url)
    }
  }

  /**
   * 执行实际加载
   * @param url 资源URL
   * @param options 加载选项
   * @returns 加载结果Promise
   */
  private async performLoad<T>(url: string, options: LoadOptions): Promise<LoadResult<T>> {
    const startTime = Date.now()
    const ext = this.getFileExtension(url)
    const loader = this._loaders.get(ext)

    if (!loader) {
      throw new Error(`Unsupported file format: ${ext}`)
    }

    // 设置进度回调
    if (this._globalProgressCallback) {
      loader.setProgressCallback(this._globalProgressCallback)
    }

    try {
      // 执行加载
      const resource = await this.loadWithTimeout(loader, url, options)

      // 创建资源信息
      const info: ResourceInfo = {
        path: url,
        type: this.getResourceType(ext),
        loadTime: Date.now(),
        size: 0, // 这里可以从加载器获取实际大小
        cached: options.useCache || false
      }

      this._resourceInfo.set(url, info)

      return {
        resource,
        info,
        duration: Date.now() - startTime
      }
    } catch (error) {
      console.error(`Failed to load resource: ${url}`, error)
      throw error
    }
  }

  /**
   * 带超时的加载
   * @param loader 加载器
   * @param url 资源URL
   * @param options 加载选项
   * @returns 加载结果Promise
   */
  private loadWithTimeout(loader: IResourceLoader, url: string, options: LoadOptions): Promise<any> {
    const loadPromise = loader.load(url, options)

    if (options.timeout) {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Load timeout: ${url}`)), options.timeout)
      })

      return Promise.race([loadPromise, timeoutPromise])
    }

    return loadPromise
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 获取文件扩展名
   * @param filePath 文件路径
   * @returns 扩展名
   */
  private getFileExtension(filePath: string): string {
    return filePath.split('.').pop()?.toLowerCase() || ''
  }

  /**
   * 根据扩展名获取资源类型
   * @param ext 扩展名
   * @returns 资源类型
   */
  private getResourceType(ext: string): ResourceType {
    switch (ext) {
      case 'gltf': return ResourceType.GLTF
      case 'glb': return ResourceType.GLB
      case 'obj': return ResourceType.OBJ
      case 'fbx': return ResourceType.FBX
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp': return ResourceType.TEXTURE
      case 'mp3':
      case 'wav':
      case 'ogg': return ResourceType.AUDIO
      default: return ResourceType.GLTF
    }
  }

  /**
   * 创建加载结果
   * @param url 资源URL
   * @param resource 资源对象
   * @returns 加载结果
   */
  private createLoadResult<T>(url: string, resource: T): LoadResult<T> {
    const info = this._resourceInfo.get(url) || {
      path: url,
      type: ResourceType.GLTF,
      loadTime: Date.now(),
      size: 0,
      cached: true
    }

    return {
      resource,
      info,
      duration: 0
    }
  }

  /**
   * 设置全局进度回调
   * @param callback 进度回调函数
   */
  setGlobalProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._globalProgressCallback = callback
  }

  /**
   * 清除资源缓存
   * @param url 可选的特定资源URL，不提供则清除所有缓存
   */
  clearCache(url?: string): void {
    if (url) {
      this._cache.delete(url)
      this._resourceInfo.delete(url)
    } else {
      this._cache.clear()
      this._resourceInfo.clear()
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计
   */
  getCacheStats(): { count: number, urls: string[] } {
    return {
      count: this._cache.size,
      urls: Array.from(this._cache.keys())
    }
  }
}

// ============================================================================
// 具体加载器实现
// ============================================================================

/**
 * GLTF资源加载器
 */
class GLTFResourceLoader implements IResourceLoader {
  supportedExtensions = ['gltf', 'glb']
  private _loader: GLTFLoader
  private _progressCallback: ((progress: LoadProgress) => void) | null = null

  constructor() {
    this._loader = new GLTFLoader()

    // 配置Draco解码器
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('/draco/')
    this._loader.setDRACOLoader(dracoLoader)
  }

  setProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._progressCallback = callback
  }

  async load(url: string, options?: LoadOptions): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this._loader.load(
        url,
        (gltf) => {
          // GLTF加载成功，返回场景对象
          resolve(gltf.scene)
        },
        (progress) => {
          // 进度回调
          if (this._progressCallback) {
            this._progressCallback({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.total > 0 ? progress.loaded / progress.total : 0,
              url
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load GLTF: ${error}`))
        }
      )
    })
  }
}

/**
 * OBJ资源加载器
 */
class OBJResourceLoader implements IResourceLoader {
  supportedExtensions = ['obj']
  private _loader: OBJLoader
  private _progressCallback: ((progress: LoadProgress) => void) | null = null

  constructor() {
    this._loader = new OBJLoader()
  }

  setProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._progressCallback = callback
  }

  async load(url: string, options?: LoadOptions): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this._loader.load(
        url,
        (object) => {
          resolve(object)
        },
        (progress) => {
          if (this._progressCallback) {
            this._progressCallback({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.total > 0 ? progress.loaded / progress.total : 0,
              url
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load OBJ: ${error}`))
        }
      )
    })
  }
}

/**
 * FBX资源加载器
 */
class FBXResourceLoader implements IResourceLoader {
  supportedExtensions = ['fbx']
  private _loader: FBXLoader
  private _progressCallback: ((progress: LoadProgress) => void) | null = null

  constructor() {
    this._loader = new FBXLoader()
  }

  setProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._progressCallback = callback
  }

  async load(url: string, options?: LoadOptions): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this._loader.load(
        url,
        (object) => {
          resolve(object)
        },
        (progress) => {
          if (this._progressCallback) {
            this._progressCallback({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.total > 0 ? progress.loaded / progress.total : 0,
              url
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load FBX: ${error}`))
        }
      )
    })
  }
}

/**
 * 纹理资源加载器
 */
class TextureResourceLoader implements IResourceLoader {
  supportedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif']
  private _loader: THREE.TextureLoader
  private _progressCallback: ((progress: LoadProgress) => void) | null = null

  constructor() {
    this._loader = new THREE.TextureLoader()
  }

  setProgressCallback(callback: (progress: LoadProgress) => void): void {
    this._progressCallback = callback
  }

  async load(url: string, options?: LoadOptions): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      this._loader.load(
        url,
        (texture) => {
          resolve(texture)
        },
        (progress) => {
          if (this._progressCallback) {
            this._progressCallback({
              loaded: progress.loaded,
              total: progress.total,
              progress: progress.total > 0 ? progress.loaded / progress.total : 0,
              url
            })
          }
        },
        (error) => {
          reject(new Error(`Failed to load texture: ${error}`))
        }
      )
    })
  }
}

// ============================================================================
// 导出
// ============================================================================

export default ResourceLoader
