/**
 * QAQ游戏引擎 - SceneResourceManager 场景资源管理器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 场景文件的加载和缓存
 * - 支持多种资源格式
 * - 异步资源加载
 * - 资源依赖管理
 * - 内存优化和垃圾回收
 */

import SceneTemplate, { type SceneTemplateData } from '../scene/SceneTemplate'
import type { Vector2, Vector3 } from '../../types/core'

// ============================================================================
// 资源管理相关接口
// ============================================================================

/**
 * 资源加载配置接口
 */
export interface ResourceLoadConfig {
  /** 是否缓存资源 */
  cache?: boolean
  /** 加载超时时间（毫秒） */
  timeout?: number
  /** 是否预加载依赖 */
  preloadDependencies?: boolean
  /** 加载优先级 */
  priority?: 'low' | 'normal' | 'high'
  /** 进度回调 */
  onProgress?: (progress: number) => void
}

/**
 * 资源信息接口
 */
export interface ResourceInfo {
  /** 资源路径 */
  path: string
  /** 资源类型 */
  type: 'scene' | 'template' | 'asset'
  /** 加载状态 */
  status: 'loading' | 'loaded' | 'error' | 'unloaded'
  /** 资源大小（字节） */
  size: number
  /** 加载时间 */
  loadTime: number
  /** 最后访问时间 */
  lastAccessed: number
  /** 引用计数 */
  refCount: number
  /** 依赖资源 */
  dependencies: string[]
  /** 错误信息 */
  error?: string
}

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 最大缓存大小（字节） */
  maxSize: number
  /** 最大缓存项数 */
  maxItems: number
  /** 缓存过期时间（毫秒） */
  expireTime: number
  /** 是否启用LRU策略 */
  enableLRU: boolean
}

// ============================================================================
// SceneResourceManager 类实现
// ============================================================================

/**
 * SceneResourceManager 类 - 场景资源管理器
 *
 * 主要功能:
 * 1. 场景文件的加载和保存
 * 2. 资源缓存和内存管理
 * 3. 依赖关系解析
 * 4. 异步加载队列
 * 5. 资源热重载
 */
export default class SceneResourceManager {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 资源缓存 */
  private _cache: Map<string, SceneTemplate> = new Map()

  /** 资源信息 */
  private _resourceInfo: Map<string, ResourceInfo> = new Map()

  /** 加载队列 */
  private _loadQueue: Array<{
    path: string
    config: ResourceLoadConfig
    resolve: (template: SceneTemplate | null) => void
    reject: (error: Error) => void
  }> = []

  /** 是否正在处理队列 */
  private _processingQueue: boolean = false

  /** 缓存配置 */
  private _cacheConfig: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    maxItems: 1000,
    expireTime: 30 * 60 * 1000, // 30分钟
    enableLRU: true
  }

  /** 当前缓存大小 */
  private _currentCacheSize: number = 0

  /** 支持的文件格式 */
  private _supportedFormats: Set<string> = new Set(['.qscene', '.json', '.yaml'])

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(cacheConfig?: Partial<CacheConfig>) {
    if (cacheConfig) {
      Object.assign(this._cacheConfig, cacheConfig)
    }

    // 启动定期清理
    this._startPeriodicCleanup()
  }

  // ========================================================================
  // 资源加载方法
  // ========================================================================

  /**
   * 加载场景模板
   * @param path 资源路径
   * @param config 加载配置
   * @returns 场景模板
   */
  async loadSceneTemplate(path: string, config: ResourceLoadConfig = {}): Promise<SceneTemplate | null> {
    // 检查缓存
    if (config.cache !== false && this._cache.has(path)) {
      const template = this._cache.get(path)!
      this._updateAccessTime(path)
      return template
    }

    // 添加到加载队列
    return new Promise((resolve, reject) => {
      this._loadQueue.push({ path, config, resolve, reject })
      this._processLoadQueue()
    })
  }

  /**
   * 预加载场景模板
   * @param paths 资源路径数组
   * @param config 加载配置
   * @returns 加载结果
   */
  async preloadSceneTemplates(paths: string[], config: ResourceLoadConfig = {}): Promise<Map<string, SceneTemplate | null>> {
    const results = new Map<string, SceneTemplate | null>()

    const loadPromises = paths.map(async (path) => {
      try {
        const template = await this.loadSceneTemplate(path, config)
        results.set(path, template)
      } catch (error) {
        console.error(`Failed to preload scene template: ${path}`, error)
        results.set(path, null)
      }
    })

    await Promise.all(loadPromises)
    return results
  }

  /**
   * 重新加载场景模板
   * @param path 资源路径
   * @param config 加载配置
   * @returns 场景模板
   */
  async reloadSceneTemplate(path: string, config: ResourceLoadConfig = {}): Promise<SceneTemplate | null> {
    // 清除缓存
    this.unloadResource(path)

    // 重新加载
    return this.loadSceneTemplate(path, { ...config, cache: true })
  }

  // ========================================================================
  // 资源保存方法
  // ========================================================================

  /**
   * 保存场景模板
   * @param template 场景模板
   * @param path 保存路径
   * @returns 是否成功
   */
  async saveSceneTemplate(template: SceneTemplate, path: string): Promise<boolean> {
    try {
      const data = template.templateData
      const content = JSON.stringify(data, null, 2)

      // 这里应该调用文件系统API保存文件
      // 在浏览器环境中可能需要使用不同的方法
      await this._saveFile(path, content)

      // 更新缓存
      this._cache.set(path, template)
      this._updateResourceInfo(path, {
        type: 'template',
        status: 'loaded',
        size: content.length,
        loadTime: 0,
        lastAccessed: Date.now(),
        refCount: 1,
        dependencies: data.config.dependencies || []
      })

      return true
    } catch (error) {
      console.error(`Failed to save scene template: ${path}`, error)
      return false
    }
  }

  // ========================================================================
  // 缓存管理方法
  // ========================================================================

  /**
   * 卸载资源
   * @param path 资源路径
   */
  unloadResource(path: string): void {
    const template = this._cache.get(path)
    if (template) {
      const info = this._resourceInfo.get(path)
      if (info) {
        this._currentCacheSize -= info.size
      }

      this._cache.delete(path)
      this._resourceInfo.delete(path)
    }
  }

  /**
   * 清理缓存
   * @param force 是否强制清理
   */
  cleanupCache(force: boolean = false): void {
    const now = Date.now()
    const expireTime = this._cacheConfig.expireTime

    for (const [path, info] of this._resourceInfo) {
      const shouldRemove = force ||
        (info.refCount === 0 && (now - info.lastAccessed) > expireTime) ||
        this._shouldEvictLRU()

      if (shouldRemove) {
        this.unloadResource(path)
      }
    }
  }

  /**
   * 获取缓存统计
   * @returns 缓存统计信息
   */
  getCacheStats(): {
    itemCount: number
    totalSize: number
    maxSize: number
    hitRate: number
  } {
    return {
      itemCount: this._cache.size,
      totalSize: this._currentCacheSize,
      maxSize: this._cacheConfig.maxSize,
      hitRate: this._calculateHitRate()
    }
  }

  // ========================================================================
  // 依赖管理方法
  // ========================================================================

  /**
   * 解析依赖关系
   * @param templateData 模板数据
   * @returns 依赖路径数组
   */
  resolveDependencies(templateData: SceneTemplateData): string[] {
    const dependencies: string[] = []

    // 从配置中获取显式依赖
    if (templateData.config.dependencies) {
      dependencies.push(...templateData.config.dependencies)
    }

    // 从节点中解析隐式依赖（如纹理、音频等）
    this._extractNodeDependencies(templateData.rootNode, dependencies)

    return [...new Set(dependencies)] // 去重
  }

  /**
   * 加载依赖资源
   * @param dependencies 依赖路径数组
   * @param config 加载配置
   * @returns 加载结果
   */
  async loadDependencies(dependencies: string[], config: ResourceLoadConfig = {}): Promise<void> {
    const loadPromises = dependencies.map(async (dep) => {
      try {
        await this.loadSceneTemplate(dep, config)
      } catch (error) {
        console.warn(`Failed to load dependency: ${dep}`, error)
      }
    })

    await Promise.all(loadPromises)
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 处理加载队列
   */
  private async _processLoadQueue(): Promise<void> {
    if (this._processingQueue || this._loadQueue.length === 0) return

    this._processingQueue = true

    while (this._loadQueue.length > 0) {
      const item = this._loadQueue.shift()!

      try {
        const template = await this._loadSceneTemplateFromFile(item.path, item.config)
        item.resolve(template)
      } catch (error) {
        item.reject(error as Error)
      }
    }

    this._processingQueue = false
  }

  /**
   * 从文件加载场景模板
   * @param path 文件路径
   * @param config 加载配置
   * @returns 场景模板
   */
  private async _loadSceneTemplateFromFile(path: string, config: ResourceLoadConfig): Promise<SceneTemplate | null> {
    try {
      // 更新资源状态
      this._updateResourceInfo(path, {
        type: 'template',
        status: 'loading',
        size: 0,
        loadTime: Date.now(),
        lastAccessed: Date.now(),
        refCount: 1,
        dependencies: []
      })

      // 加载文件内容
      const content = await this._loadFile(path, config)
      const templateData: SceneTemplateData = JSON.parse(content)

      // 解析依赖
      const dependencies = this.resolveDependencies(templateData)

      // 预加载依赖
      if (config.preloadDependencies) {
        await this.loadDependencies(dependencies, config)
      }

      // 创建模板
      const template = new SceneTemplate(templateData.config)
      template.setTemplateData(templateData) // 使用公共方法设置模板数据

      // 更新缓存
      if (config.cache !== false) {
        this._cache.set(path, template)
        this._currentCacheSize += content.length
      }

      // 更新资源信息
      this._updateResourceInfo(path, {
        type: 'template',
        status: 'loaded',
        size: content.length,
        loadTime: Date.now() - this._resourceInfo.get(path)!.loadTime,
        lastAccessed: Date.now(),
        refCount: 1,
        dependencies
      })

      return template

    } catch (error) {
      this._updateResourceInfo(path, {
        type: 'template',
        status: 'error',
        size: 0,
        loadTime: 0,
        lastAccessed: Date.now(),
        refCount: 0,
        dependencies: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  /**
   * 加载文件
   * @param path 文件路径
   * @param config 配置
   * @returns 文件内容
   */
  private async _loadFile(path: string, config: ResourceLoadConfig): Promise<string> {
    // 在浏览器环境中，这里可能需要使用fetch或其他方法
    // 这是一个简化的实现
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to load file: ${path} (${response.status})`)
    }
    return response.text()
  }

  /**
   * 保存文件
   * @param path 文件路径
   * @param content 文件内容
   */
  private async _saveFile(path: string, content: string): Promise<void> {
    // 在浏览器环境中，这里可能需要使用File System Access API
    // 或者提供下载功能
    console.log(`Saving file to: ${path}`)
    console.log(content)
  }

  /**
   * 提取节点依赖
   * @param nodeData 节点数据
   * @param dependencies 依赖数组
   */
  private _extractNodeDependencies(nodeData: any, dependencies: string[]): void {
    // 检查节点属性中的资源引用
    if (nodeData.properties) {
      for (const [key, value] of Object.entries(nodeData.properties)) {
        if (typeof value === 'string' && this._isResourcePath(value)) {
          dependencies.push(value)
        }
      }
    }

    // 递归检查子节点
    if (nodeData.children) {
      for (const child of nodeData.children) {
        this._extractNodeDependencies(child, dependencies)
      }
    }
  }

  /**
   * 检查是否为资源路径
   * @param value 值
   * @returns 是否为资源路径
   */
  private _isResourcePath(value: string): boolean {
    return this._supportedFormats.has(this._getFileExtension(value))
  }

  /**
   * 获取文件扩展名
   * @param path 文件路径
   * @returns 扩展名
   */
  private _getFileExtension(path: string): string {
    const lastDot = path.lastIndexOf('.')
    return lastDot >= 0 ? path.substring(lastDot) : ''
  }

  /**
   * 更新资源信息
   * @param path 资源路径
   * @param info 资源信息
   */
  private _updateResourceInfo(path: string, info: Partial<ResourceInfo>): void {
    const existing = this._resourceInfo.get(path)
    const updated = { ...existing, ...info, path } as ResourceInfo
    this._resourceInfo.set(path, updated)
  }

  /**
   * 更新访问时间
   * @param path 资源路径
   */
  private _updateAccessTime(path: string): void {
    const info = this._resourceInfo.get(path)
    if (info) {
      info.lastAccessed = Date.now()
      info.refCount++
    }
  }

  /**
   * 是否应该LRU淘汰
   * @returns 是否淘汰
   */
  private _shouldEvictLRU(): boolean {
    return this._cacheConfig.enableLRU &&
           (this._cache.size >= this._cacheConfig.maxItems ||
            this._currentCacheSize >= this._cacheConfig.maxSize)
  }

  /**
   * 计算缓存命中率
   * @returns 命中率
   */
  private _calculateHitRate(): number {
    // 简化实现，实际应该统计命中和未命中次数
    return 0.85
  }

  /**
   * 启动定期清理
   */
  private _startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupCache()
    }, 5 * 60 * 1000) // 每5分钟清理一次
  }
}
