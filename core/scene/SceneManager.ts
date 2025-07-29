/**
 * QAQ游戏引擎 - SceneManager 场景管理器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 集成所有场景系统功能
 * - 统一的场景管理接口
 * - 场景模板和实例的生命周期管理
 * - 资源加载和缓存优化
 * - 序列化和持久化支持
 */

import Scene from './Scene'
import SceneTemplate, { type SceneTemplateConfig } from './SceneTemplate'
import SceneInstancer, { type InstantiationConfig, type SceneInstanceInfo } from './SceneInstancer'
import SceneResourceManager, { type ResourceLoadConfig } from '../resources/SceneResourceManager'
import SceneSerializer, { type SerializationConfig, type SerializationResult } from '../serialization/SceneSerializer'

// ============================================================================
// 场景管理器相关接口
// ============================================================================

/**
 * 场景管理器配置接口
 */
export interface SceneManagerConfig {
  /** 是否启用资源缓存 */
  enableResourceCache?: boolean
  /** 是否启用实例池 */
  enableInstancePooling?: boolean
  /** 默认序列化格式 */
  defaultSerializationFormat?: string
  /** 最大并发加载数 */
  maxConcurrentLoads?: number
  /** 是否启用热重载 */
  enableHotReload?: boolean
}

/**
 * 场景创建配置接口
 */
export interface SceneCreationConfig {
  /** 模板配置 */
  templateConfig?: SceneTemplateConfig
  /** 构建器函数 */
  builder?: () => Scene
  /** 是否立即注册 */
  autoRegister?: boolean
  /** 是否保存到文件 */
  saveToFile?: boolean
  /** 保存路径 */
  savePath?: string
}

// ============================================================================
// SceneManager 类实现
// ============================================================================

/**
 * SceneManager 类 - 场景管理器
 *
 * 主要功能:
 * 1. 统一的场景管理接口
 * 2. 模板和实例的生命周期管理
 * 3. 资源加载和缓存
 * 4. 序列化和持久化
 * 5. 性能优化和监控
 */
export default class SceneManager {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 场景实例化器 */
  private _instancer: SceneInstancer

  /** 资源管理器 */
  private _resourceManager: SceneResourceManager

  /** 序列化器 */
  private _serializer: SceneSerializer

  /** 管理器配置 */
  private _config: Required<SceneManagerConfig>

  /** 当前主场景 */
  private _currentMainScene: Scene | null = null

  /** 场景切换历史 */
  private _sceneHistory: string[] = []

  /** 性能统计 */
  private _stats = {
    templatesLoaded: 0,
    instancesCreated: 0,
    totalLoadTime: 0,
    totalInstantiationTime: 0
  }

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor(config: SceneManagerConfig = {}) {
    this._config = {
      enableResourceCache: true,
      enableInstancePooling: true,
      defaultSerializationFormat: 'json',
      maxConcurrentLoads: 5,
      enableHotReload: false,
      ...config
    }

    this._instancer = new SceneInstancer()
    this._resourceManager = new SceneResourceManager()
    this._serializer = new SceneSerializer()
  }

  // ========================================================================
  // 模板管理方法
  // ========================================================================

  /**
   * 创建场景模板
   * @param name 模板名称
   * @param config 创建配置
   * @returns 场景模板
   */
  createTemplate(name: string, config: SceneCreationConfig = {}): SceneTemplate {
    const templateConfig: SceneTemplateConfig = {
      name,
      description: `Scene template: ${name}`,
      version: '1.0.0',
      ...config.templateConfig
    }

    const template = new SceneTemplate(templateConfig)

    // 设置构建器函数
    if (config.builder) {
      template.setBuilder(config.builder)
    }

    // 自动注册
    if (config.autoRegister !== false) {
      this.registerTemplate(template)
    }

    // 保存到文件
    if (config.saveToFile && config.savePath) {
      this.saveTemplate(template, config.savePath)
    }

    return template
  }

  /**
   * 注册场景模板
   * @param template 场景模板
   */
  registerTemplate(template: SceneTemplate): void {
    this._instancer.registerTemplate(template)
    this._stats.templatesLoaded++
  }

  /**
   * 注销场景模板
   * @param templateName 模板名称
   */
  unregisterTemplate(templateName: string): void {
    this._instancer.unregisterTemplate(templateName)
  }

  /**
   * 加载场景模板
   * @param path 模板路径
   * @param config 加载配置
   * @returns 场景模板
   */
  async loadTemplate(path: string, config: ResourceLoadConfig = {}): Promise<SceneTemplate | null> {
    const startTime = Date.now()
    
    try {
      const template = await this._resourceManager.loadSceneTemplate(path, {
        cache: this._config.enableResourceCache,
        ...config
      })

      if (template) {
        this.registerTemplate(template)
        this._stats.totalLoadTime += Date.now() - startTime
      }

      return template
    } catch (error) {
      console.error(`Failed to load template from ${path}:`, error)
      return null
    }
  }

  /**
   * 保存场景模板
   * @param template 场景模板
   * @param path 保存路径
   * @param config 序列化配置
   * @returns 是否成功
   */
  async saveTemplate(template: SceneTemplate, path: string, config: SerializationConfig = {}): Promise<boolean> {
    try {
      const result = await this._serializer.serializeTemplate(template, config)
      
      // 这里应该将结果保存到文件系统
      console.log(`Template saved to ${path}:`, result)
      
      return true
    } catch (error) {
      console.error(`Failed to save template to ${path}:`, error)
      return false
    }
  }

  // ========================================================================
  // 场景实例化方法
  // ========================================================================

  /**
   * 实例化场景
   * @param templateName 模板名称
   * @param config 实例化配置
   * @returns 场景实例信息
   */
  async instantiateScene(templateName: string, config: InstantiationConfig = {}): Promise<SceneInstanceInfo | null> {
    const startTime = Date.now()
    
    try {
      const instanceInfo = await this._instancer.instantiate(templateName, config)
      
      if (instanceInfo) {
        this._stats.instancesCreated++
        this._stats.totalInstantiationTime += Date.now() - startTime
      }

      return instanceInfo
    } catch (error) {
      console.error(`Failed to instantiate scene ${templateName}:`, error)
      return null
    }
  }

  /**
   * 批量实例化场景
   * @param templateName 模板名称
   * @param configs 实例化配置数组
   * @returns 实例信息数组
   */
  async instantiateSceneBatch(templateName: string, configs: InstantiationConfig[]): Promise<SceneInstanceInfo[]> {
    return this._instancer.instantiateBatch(templateName, configs)
  }

  /**
   * 销毁场景实例
   * @param instanceId 实例ID
   */
  destroySceneInstance(instanceId: string): void {
    this._instancer.destroyInstance(instanceId)
  }

  /**
   * 销毁所有场景实例
   * @param templateName 模板名称（可选）
   */
  destroyAllSceneInstances(templateName?: string): void {
    this._instancer.destroyAllInstances(templateName)
  }

  // ========================================================================
  // 场景切换方法
  // ========================================================================

  /**
   * 切换到场景
   * @param templateName 模板名称
   * @param config 实例化配置
   * @returns 新的主场景
   */
  async switchToScene(templateName: string, config: InstantiationConfig = {}): Promise<Scene | null> {
    try {
      // 记录当前场景
      if (this._currentMainScene) {
        this._sceneHistory.push(this._currentMainScene.name)
      }

      // 实例化新场景
      const instanceInfo = await this.instantiateScene(templateName, {
        ...config,
        autoActivate: true
      })

      if (instanceInfo) {
        // 销毁旧的主场景（如果有）
        if (this._currentMainScene) {
          this._currentMainScene.destroy()
        }

        this._currentMainScene = instanceInfo.scene
        return instanceInfo.scene
      }

      return null
    } catch (error) {
      console.error(`Failed to switch to scene ${templateName}:`, error)
      return null
    }
  }

  /**
   * 返回上一个场景
   * @returns 上一个场景
   */
  async goBackToPreviousScene(): Promise<Scene | null> {
    if (this._sceneHistory.length === 0) {
      console.warn('No previous scene to go back to')
      return null
    }

    const previousSceneName = this._sceneHistory.pop()!
    return this.switchToScene(previousSceneName)
  }

  /**
   * 获取当前主场景
   * @returns 当前主场景
   */
  getCurrentMainScene(): Scene | null {
    return this._currentMainScene
  }

  // ========================================================================
  // 查询和统计方法
  // ========================================================================

  /**
   * 获取所有模板名称
   * @returns 模板名称数组
   */
  getTemplateNames(): string[] {
    return this._instancer.getTemplateNames()
  }

  /**
   * 获取所有场景实例
   * @param templateName 模板名称（可选）
   * @returns 实例信息数组
   */
  getAllSceneInstances(templateName?: string): SceneInstanceInfo[] {
    return this._instancer.getAllInstances(templateName)
  }

  /**
   * 获取场景实例数量
   * @param templateName 模板名称（可选）
   * @returns 实例数量
   */
  getSceneInstanceCount(templateName?: string): number {
    return this._instancer.getInstanceCount(templateName)
  }

  /**
   * 获取性能统计
   * @returns 性能统计信息
   */
  getPerformanceStats(): typeof this._stats & {
    averageLoadTime: number
    averageInstantiationTime: number
    cacheStats: any
  } {
    return {
      ...this._stats,
      averageLoadTime: this._stats.templatesLoaded > 0 
        ? this._stats.totalLoadTime / this._stats.templatesLoaded 
        : 0,
      averageInstantiationTime: this._stats.instancesCreated > 0 
        ? this._stats.totalInstantiationTime / this._stats.instancesCreated 
        : 0,
      cacheStats: this._resourceManager.getCacheStats()
    }
  }

  // ========================================================================
  // 高级功能方法
  // ========================================================================

  /**
   * 预加载场景模板
   * @param paths 模板路径数组
   * @param config 加载配置
   * @returns 加载结果
   */
  async preloadTemplates(paths: string[], config: ResourceLoadConfig = {}): Promise<Map<string, SceneTemplate | null>> {
    return this._resourceManager.preloadSceneTemplates(paths, config)
  }

  /**
   * 预热实例池
   * @param templateName 模板名称
   * @param count 预创建数量
   */
  async warmupInstancePool(templateName: string, count: number): Promise<void> {
    await this._instancer.warmupPool(templateName, count)
  }

  /**
   * 配置实例池
   * @param templateName 模板名称
   * @param config 池配置
   */
  configureInstancePool(templateName: string, config: any): void {
    this._instancer.configurePool(templateName, config)
  }

  /**
   * 清理资源缓存
   * @param force 是否强制清理
   */
  cleanupResourceCache(force: boolean = false): void {
    this._resourceManager.cleanupCache(force)
  }

  /**
   * 导出场景数据
   * @param scene 场景实例
   * @param config 序列化配置
   * @returns 序列化结果
   */
  async exportSceneData(scene: Scene, config: SerializationConfig = {}): Promise<SerializationResult> {
    return this._serializer.serializeScene(scene, config)
  }

  /**
   * 导入场景数据
   * @param data 序列化数据
   * @param config 配置
   * @returns 场景实例
   */
  async importSceneData(data: string | Uint8Array, config: SerializationConfig = {}): Promise<Scene> {
    return this._serializer.deserializeScene(data, config)
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 更新场景管理器
   * @param deltaTime 时间增量
   */
  update(deltaTime: number): void {
    // 更新当前主场景
    if (this._currentMainScene) {
      this._currentMainScene.update(deltaTime)
    }

    // 这里可以添加其他定期更新的逻辑
  }

  /**
   * 销毁场景管理器
   */
  destroy(): void {
    // 销毁当前主场景
    if (this._currentMainScene) {
      this._currentMainScene.destroy()
      this._currentMainScene = null
    }

    // 销毁所有实例
    this._instancer.destroyAllInstances()

    // 清理资源缓存
    this._resourceManager.cleanupCache(true)

    // 重置统计
    this._stats = {
      templatesLoaded: 0,
      instancesCreated: 0,
      totalLoadTime: 0,
      totalInstantiationTime: 0
    }

    this._sceneHistory = []
  }
}
