/**
 * QAQ游戏引擎 - SceneInstancer 场景实例化器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 深拷贝场景结构的能力
 * - 管理场景实例的生命周期
 * - 提供实例池优化
 * - 支持异步实例化
 * - 处理实例间的依赖关系
 */

import Scene from './Scene'
import SceneTemplate from './SceneTemplate'
import Node from '../nodes/Node'
import type { Vector2, Vector3 } from '../../types/core'

// ============================================================================
// 实例化相关接口
// ============================================================================

/**
 * 实例化配置接口
 */
export interface InstantiationConfig {
  /** 实例名称 */
  instanceName?: string
  /** 父场景 */
  parentScene?: Scene
  /** 父节点 */
  parentNode?: Node
  /** 位置偏移 */
  position?: Vector2 | Vector3
  /** 旋转偏移 */
  rotation?: number
  /** 缩放偏移 */
  scale?: Vector2 | Vector3
  /** 属性覆盖 */
  propertyOverrides?: Record<string, any>
  /** 是否立即激活 */
  autoActivate?: boolean
  /** 实例化后的回调 */
  onInstantiated?: (instance: Scene) => void
}

/**
 * 实例信息接口
 */
export interface SceneInstanceInfo {
  /** 实例ID */
  id: string
  /** 模板名称 */
  templateName: string
  /** 场景实例 */
  scene: Scene
  /** 创建时间 */
  createdAt: number
  /** 是否激活 */
  isActive: boolean
  /** 父场景ID */
  parentSceneId?: string
  /** 实例化配置 */
  config: InstantiationConfig
}

/**
 * 实例池配置接口
 */
export interface InstancePoolConfig {
  /** 最大实例数 */
  maxInstances: number
  /** 预创建数量 */
  preCreateCount: number
  /** 是否启用池化 */
  enablePooling: boolean
  /** 自动清理间隔（毫秒） */
  cleanupInterval: number
}

// ============================================================================
// SceneInstancer 类实现
// ============================================================================

/**
 * SceneInstancer 类 - 场景实例化器
 *
 * 主要功能:
 * 1. 深拷贝场景结构
 * 2. 管理场景实例生命周期
 * 3. 提供实例池优化
 * 4. 处理实例依赖关系
 * 5. 支持批量实例化
 */
export default class SceneInstancer {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 实例映射表 */
  private _instances: Map<string, SceneInstanceInfo> = new Map()

  /** 模板映射表 */
  private _templates: Map<string, SceneTemplate> = new Map()

  /** 实例池 */
  private _instancePools: Map<string, Scene[]> = new Map()

  /** 池配置 */
  private _poolConfigs: Map<string, InstancePoolConfig> = new Map()

  /** 下一个实例ID */
  private _nextInstanceId: number = 1

  /** 清理定时器 */
  private _cleanupTimer: NodeJS.Timeout | null = null

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor() {
    this._startCleanupTimer()
  }

  // ========================================================================
  // 模板管理
  // ========================================================================

  /**
   * 注册场景模板
   * @param template 场景模板
   */
  registerTemplate(template: SceneTemplate): void {
    this._templates.set(template.name, template)
    
    // 初始化实例池
    this._initializePool(template.name)
  }

  /**
   * 注销场景模板
   * @param templateName 模板名称
   */
  unregisterTemplate(templateName: string): void {
    this._templates.delete(templateName)
    this._clearPool(templateName)
    this._poolConfigs.delete(templateName)
  }

  /**
   * 获取场景模板
   * @param templateName 模板名称
   * @returns 场景模板
   */
  getTemplate(templateName: string): SceneTemplate | null {
    return this._templates.get(templateName) || null
  }

  /**
   * 获取所有模板名称
   * @returns 模板名称数组
   */
  getTemplateNames(): string[] {
    return Array.from(this._templates.keys())
  }

  // ========================================================================
  // 实例化方法
  // ========================================================================

  /**
   * 实例化场景
   * @param templateName 模板名称
   * @param config 实例化配置
   * @returns 场景实例信息
   */
  async instantiate(templateName: string, config: InstantiationConfig = {}): Promise<SceneInstanceInfo | null> {
    const template = this._templates.get(templateName)
    if (!template) {
      console.error(`Template "${templateName}" not found`)
      return null
    }

    try {
      // 从池中获取或创建新实例
      const scene = await this._getOrCreateInstance(templateName, config)
      
      // 应用配置
      this._applyInstanceConfig(scene, config)
      
      // 创建实例信息
      const instanceInfo: SceneInstanceInfo = {
        id: this._generateInstanceId(),
        templateName,
        scene,
        createdAt: Date.now(),
        isActive: config.autoActivate !== false,
        parentSceneId: config.parentScene?.name,
        config
      }

      // 注册实例
      this._instances.set(instanceInfo.id, instanceInfo)

      // 添加到父场景或节点
      if (config.parentScene) {
        config.parentScene.addChild(scene.rootNode)
      } else if (config.parentNode) {
        config.parentNode.addChild(scene.rootNode)
      }

      // 调用回调
      if (config.onInstantiated) {
        config.onInstantiated(scene)
      }

      return instanceInfo

    } catch (error) {
      console.error(`Failed to instantiate scene "${templateName}":`, error)
      return null
    }
  }

  /**
   * 批量实例化
   * @param templateName 模板名称
   * @param configs 实例化配置数组
   * @returns 实例信息数组
   */
  async instantiateBatch(templateName: string, configs: InstantiationConfig[]): Promise<SceneInstanceInfo[]> {
    const results: SceneInstanceInfo[] = []
    
    for (const config of configs) {
      const instance = await this.instantiate(templateName, config)
      if (instance) {
        results.push(instance)
      }
    }

    return results
  }

  /**
   * 销毁实例
   * @param instanceId 实例ID
   */
  destroyInstance(instanceId: string): void {
    const instanceInfo = this._instances.get(instanceId)
    if (!instanceInfo) return

    // 从父场景移除
    if (instanceInfo.config.parentScene) {
      instanceInfo.config.parentScene.removeChild(instanceInfo.scene.rootNode)
    } else if (instanceInfo.config.parentNode) {
      instanceInfo.config.parentNode.removeChild(instanceInfo.scene.rootNode)
    }

    // 回收到池中或销毁
    this._recycleOrDestroy(instanceInfo.templateName, instanceInfo.scene)

    // 移除实例记录
    this._instances.delete(instanceId)
  }

  /**
   * 销毁所有实例
   * @param templateName 模板名称（可选）
   */
  destroyAllInstances(templateName?: string): void {
    const instancesToDestroy = Array.from(this._instances.values())
      .filter(info => !templateName || info.templateName === templateName)

    for (const instanceInfo of instancesToDestroy) {
      this.destroyInstance(instanceInfo.id)
    }
  }

  // ========================================================================
  // 实例池管理
  // ========================================================================

  /**
   * 配置实例池
   * @param templateName 模板名称
   * @param config 池配置
   */
  configurePool(templateName: string, config: InstancePoolConfig): void {
    this._poolConfigs.set(templateName, config)
    this._initializePool(templateName)
  }

  /**
   * 预热实例池
   * @param templateName 模板名称
   * @param count 预创建数量
   */
  async warmupPool(templateName: string, count: number): Promise<void> {
    const template = this._templates.get(templateName)
    if (!template) return

    const pool = this._getPool(templateName)
    
    for (let i = 0; i < count; i++) {
      const scene = await template.instantiate()
      pool.push(scene)
    }
  }

  // ========================================================================
  // 查询方法
  // ========================================================================

  /**
   * 获取实例信息
   * @param instanceId 实例ID
   * @returns 实例信息
   */
  getInstance(instanceId: string): SceneInstanceInfo | null {
    return this._instances.get(instanceId) || null
  }

  /**
   * 获取所有实例
   * @param templateName 模板名称（可选）
   * @returns 实例信息数组
   */
  getAllInstances(templateName?: string): SceneInstanceInfo[] {
    const instances = Array.from(this._instances.values())
    return templateName 
      ? instances.filter(info => info.templateName === templateName)
      : instances
  }

  /**
   * 获取实例数量
   * @param templateName 模板名称（可选）
   * @returns 实例数量
   */
  getInstanceCount(templateName?: string): number {
    return this.getAllInstances(templateName).length
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 获取或创建实例
   * @param templateName 模板名称
   * @param config 配置
   * @returns 场景实例
   */
  private async _getOrCreateInstance(templateName: string, config: InstantiationConfig): Promise<Scene> {
    const poolConfig = this._poolConfigs.get(templateName)
    
    if (poolConfig?.enablePooling) {
      const pool = this._getPool(templateName)
      if (pool.length > 0) {
        return pool.pop()!
      }
    }

    // 创建新实例
    const template = this._templates.get(templateName)!
    return await template.instantiate(config.instanceName, config.propertyOverrides)
  }

  /**
   * 应用实例配置
   * @param scene 场景实例
   * @param config 配置
   */
  private _applyInstanceConfig(scene: Scene, config: InstantiationConfig): void {
    const rootNode = scene.rootNode
    if (!rootNode) return

    // 应用位置
    if (config.position) {
      Object.assign(rootNode.position, config.position)
    }

    // 应用旋转
    if (config.rotation !== undefined) {
      rootNode.rotation = config.rotation
    }

    // 应用缩放
    if (config.scale) {
      Object.assign(rootNode.scale, config.scale)
    }
  }

  /**
   * 回收或销毁实例
   * @param templateName 模板名称
   * @param scene 场景实例
   */
  private _recycleOrDestroy(templateName: string, scene: Scene): void {
    const poolConfig = this._poolConfigs.get(templateName)
    
    if (poolConfig?.enablePooling) {
      const pool = this._getPool(templateName)
      if (pool.length < poolConfig.maxInstances) {
        // 重置场景状态
        this._resetScene(scene)
        pool.push(scene)
        return
      }
    }

    // 销毁场景
    scene.destroy()
  }

  /**
   * 重置场景状态
   * @param scene 场景实例
   */
  private _resetScene(scene: Scene): void {
    // 重置根节点状态
    const rootNode = scene.rootNode
    if (rootNode) {
      rootNode.position = { x: 0, y: 0, z: 0 }
      rootNode.rotation = 0
      rootNode.scale = { x: 1, y: 1, z: 1 }
      rootNode.visible = true
    }
  }

  /**
   * 获取实例池
   * @param templateName 模板名称
   * @returns 实例池
   */
  private _getPool(templateName: string): Scene[] {
    if (!this._instancePools.has(templateName)) {
      this._instancePools.set(templateName, [])
    }
    return this._instancePools.get(templateName)!
  }

  /**
   * 初始化实例池
   * @param templateName 模板名称
   */
  private _initializePool(templateName: string): void {
    const poolConfig = this._poolConfigs.get(templateName)
    if (!poolConfig?.enablePooling) return

    // 预创建实例
    if (poolConfig.preCreateCount > 0) {
      this.warmupPool(templateName, poolConfig.preCreateCount)
    }
  }

  /**
   * 清理实例池
   * @param templateName 模板名称
   */
  private _clearPool(templateName: string): void {
    const pool = this._instancePools.get(templateName)
    if (pool) {
      pool.forEach(scene => scene.destroy())
      pool.length = 0
    }
    this._instancePools.delete(templateName)
  }

  /**
   * 生成实例ID
   * @returns 实例ID
   */
  private _generateInstanceId(): string {
    return `instance_${this._nextInstanceId++}_${Date.now()}`
  }

  /**
   * 启动清理定时器
   */
  private _startCleanupTimer(): void {
    this._cleanupTimer = setInterval(() => {
      this._performCleanup()
    }, 30000) // 每30秒清理一次
  }

  /**
   * 执行清理
   */
  private _performCleanup(): void {
    // 清理过期的非活动实例
    const now = Date.now()
    const expireTime = 5 * 60 * 1000 // 5分钟

    for (const [id, info] of this._instances) {
      if (!info.isActive && (now - info.createdAt) > expireTime) {
        this.destroyInstance(id)
      }
    }
  }

  /**
   * 销毁实例化器
   */
  destroy(): void {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer)
      this._cleanupTimer = null
    }

    this.destroyAllInstances()
    this._templates.clear()
    this._instancePools.clear()
    this._poolConfigs.clear()
  }
}
