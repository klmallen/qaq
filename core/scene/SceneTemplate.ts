/**
 * QAQ游戏引擎 - SceneTemplate 场景模板系统
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 将Scene作为可复用的模板
 * - 支持场景的深拷贝实例化
 * - 提供场景构建器模式
 * - 支持嵌套场景模板
 * - 类似Godot的场景系统
 */

import Scene from './Scene'
import Node from '../nodes/Node'
import type { Vector2, Vector3 } from '../../types/core'

// ============================================================================
// 场景模板相关接口
// ============================================================================

/**
 * 场景模板配置接口
 */
export interface SceneTemplateConfig {
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description?: string
  /** 模板版本 */
  version?: string
  /** 模板标签 */
  tags?: string[]
  /** 是否为根场景模板 */
  isRootTemplate?: boolean
  /** 依赖的其他模板 */
  dependencies?: string[]
}

/**
 * 节点模板数据接口
 */
export interface NodeTemplateData {
  /** 节点类名 */
  className: string
  /** 节点名称 */
  name: string
  /** 节点属性 */
  properties: Record<string, any>
  /** 子节点模板 */
  children: NodeTemplateData[]
  /** 脚本代码 */
  script?: string
  /** 信号连接 */
  signals?: Array<{
    signal: string
    target: string
    method: string
  }>
}

/**
 * 场景模板数据接口
 */
export interface SceneTemplateData {
  /** 配置信息 */
  config: SceneTemplateConfig
  /** 根节点模板 */
  rootNode: NodeTemplateData
  /** 场景属性 */
  sceneProperties: Record<string, any>
  /** 创建时间戳 */
  createdAt: number
  /** 修改时间戳 */
  modifiedAt: number
}

// ============================================================================
// SceneTemplate 类实现
// ============================================================================

/**
 * SceneTemplate 类 - 场景模板
 *
 * 主要功能:
 * 1. 场景结构的模板化定义
 * 2. 支持场景的实例化
 * 3. 提供构建器模式API
 * 4. 支持模板的序列化和反序列化
 * 5. 管理模板依赖关系
 */
export default class SceneTemplate {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 模板配置 */
  private _config: SceneTemplateConfig

  /** 模板数据 */
  private _templateData: SceneTemplateData

  /** 是否已构建 */
  private _isBuilt: boolean = false

  /** 构建器函数 */
  private _builderFunction: (() => Scene) | null = null

  // ========================================================================
  // 构造函数
  // ========================================================================

  /**
   * 构造函数
   * @param config 模板配置
   */
  constructor(config: SceneTemplateConfig) {
    this._config = { ...config }

    this._templateData = {
      config: this._config,
      rootNode: {
        className: 'Node',
        name: 'Root',
        properties: {},
        children: []
      },
      sceneProperties: {},
      createdAt: Date.now(),
      modifiedAt: Date.now()
    }
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取模板名称
   */
  get name(): string {
    return this._config.name
  }

  /**
   * 获取模板配置
   */
  get config(): SceneTemplateConfig {
    return { ...this._config }
  }

  /**
   * 获取模板数据
   */
  get templateData(): SceneTemplateData {
    return JSON.parse(JSON.stringify(this._templateData))
  }

  /**
   * 是否已构建
   */
  get isBuilt(): boolean {
    return this._isBuilt
  }

  // ========================================================================
  // 构建器模式API
  // ========================================================================

  /**
   * 设置构建器函数
   * @param builderFn 构建器函数
   * @returns 当前模板实例
   */
  setBuilder(builderFn: () => Scene): this {
    this._builderFunction = builderFn
    return this
  }

  /**
   * 添加根节点
   * @param nodeClass 节点类
   * @param name 节点名称
   * @param properties 节点属性
   * @returns 当前模板实例
   */
  addRootNode(nodeClass: string, name: string, properties: Record<string, any> = {}): this {
    this._templateData.rootNode = {
      className: nodeClass,
      name,
      properties: { ...properties },
      children: []
    }
    this._updateModifiedTime()
    return this
  }

  /**
   * 添加子节点到指定路径
   * @param parentPath 父节点路径
   * @param nodeClass 节点类
   * @param name 节点名称
   * @param properties 节点属性
   * @returns 当前模板实例
   */
  addChildNode(parentPath: string, nodeClass: string, name: string, properties: Record<string, any> = {}): this {
    const parentNode = this._findNodeByPath(parentPath)
    if (parentNode) {
      parentNode.children.push({
        className: nodeClass,
        name,
        properties: { ...properties },
        children: []
      })
      this._updateModifiedTime()
    }
    return this
  }

  /**
   * 设置节点脚本
   * @param nodePath 节点路径
   * @param script 脚本代码
   * @returns 当前模板实例
   */
  setNodeScript(nodePath: string, script: string): this {
    const node = this._findNodeByPath(nodePath)
    if (node) {
      node.script = script
      this._updateModifiedTime()
    }
    return this
  }

  /**
   * 连接信号
   * @param nodePath 节点路径
   * @param signal 信号名称
   * @param targetPath 目标节点路径
   * @param method 目标方法
   * @returns 当前模板实例
   */
  connectSignal(nodePath: string, signal: string, targetPath: string, method: string): this {
    const node = this._findNodeByPath(nodePath)
    if (node) {
      if (!node.signals) {
        node.signals = []
      }
      node.signals.push({ signal, target: targetPath, method })
      this._updateModifiedTime()
    }
    return this
  }

  /**
   * 设置场景属性
   * @param properties 场景属性
   * @returns 当前模板实例
   */
  setSceneProperties(properties: Record<string, any>): this {
    Object.assign(this._templateData.sceneProperties, properties)
    this._updateModifiedTime()
    return this
  }

  // ========================================================================
  // 实例化方法
  // ========================================================================

  /**
   * 实例化场景
   * @param instanceName 实例名称
   * @param overrideProperties 覆盖属性
   * @returns 场景实例
   */
  async instantiate(instanceName?: string, overrideProperties?: Record<string, any>): Promise<Scene> {
    // 如果有构建器函数，优先使用
    if (this._builderFunction) {
      const scene = this._builderFunction()
      if (instanceName) {
        scene.name = instanceName
      }
      return scene
    }

    // 否则从模板数据构建
    return this._buildFromTemplate(instanceName, overrideProperties)
  }

  /**
   * 从模板数据构建场景
   * @param instanceName 实例名称
   * @param overrideProperties 覆盖属性
   * @returns 场景实例
   */
  private async _buildFromTemplate(instanceName?: string, overrideProperties?: Record<string, any>): Promise<Scene> {
    const sceneName = instanceName || `${this._config.name}_Instance_${Date.now()}`

    // 创建场景实例
    const scene = new Scene(sceneName, {
      type: 'MAIN',
      persistent: false,
      autoStart: true,
      ...this._templateData.sceneProperties,
      ...overrideProperties
    })

    // 构建节点树
    if (this._templateData.rootNode) {
      const rootNode = await this._buildNodeFromTemplate(this._templateData.rootNode)
      scene.addChild(rootNode)
    }

    return scene
  }

  /**
   * 从模板构建节点
   * @param nodeTemplate 节点模板
   * @returns 节点实例
   */
  private async _buildNodeFromTemplate(nodeTemplate: NodeTemplateData): Promise<Node> {
    // 动态创建节点实例
    const NodeClass = await this._getNodeClass(nodeTemplate.className)
    const node = new NodeClass(nodeTemplate.name)

    // 设置节点属性
    Object.assign(node, nodeTemplate.properties)

    // 设置脚本
    if (nodeTemplate.script) {
      node.setScript(nodeTemplate.script)
    }

    // 递归构建子节点
    for (const childTemplate of nodeTemplate.children) {
      const childNode = await this._buildNodeFromTemplate(childTemplate)
      node.addChild(childNode)
    }

    return node
  }

  /**
   * 获取节点类
   * @param className 类名
   * @returns 节点类
   */
  private async _getNodeClass(className: string): Promise<any> {
    // 这里需要根据类名动态导入对应的节点类
    // 简化实现，实际应该有一个节点类注册表
    try {
      switch (className) {
        case 'Node':
          return (await import('../nodes/Node')).default
        case 'Node2D':
          return (await import('../nodes/Node2D')).default
        case 'Sprite2D':
          return (await import('../nodes/2d/Sprite2D')).default
        case 'TileMap2D':
          return (await import('../nodes/2d/TileMap2D')).default
        case 'Button2D':
          return (await import('../nodes/2d/Button2D')).default
        case 'Label2D':
          return (await import('../nodes/2d/Label2D')).default
        default:
          return (await import('../nodes/Node')).default
      }
    } catch (error) {
      console.warn(`Failed to import node class ${className}, using Node as fallback:`, error)
      return (await import('../nodes/Node')).default
    }
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  /**
   * 根据路径查找节点模板
   * @param path 节点路径
   * @returns 节点模板
   */
  private _findNodeByPath(path: string): NodeTemplateData | null {
    const parts = path.split('/')
    let current = this._templateData.rootNode

    for (const part of parts) {
      if (part === '' || part === current.name) continue

      const child = current.children.find(c => c.name === part)
      if (!child) return null

      current = child
    }

    return current
  }

  /**
   * 更新修改时间
   */
  private _updateModifiedTime(): void {
    this._templateData.modifiedAt = Date.now()
  }

  /**
   * 构建模板
   */
  build(): this {
    this._isBuilt = true
    return this
  }

  /**
   * 克隆模板
   * @param newName 新模板名称
   * @returns 新模板实例
   */
  clone(newName: string): SceneTemplate {
    const newConfig = { ...this._config, name: newName }
    const newTemplate = new SceneTemplate(newConfig)
    newTemplate._templateData = JSON.parse(JSON.stringify(this._templateData))
    newTemplate._templateData.config = newConfig
    newTemplate._templateData.createdAt = Date.now()
    newTemplate._templateData.modifiedAt = Date.now()
    return newTemplate
  }

  /**
   * 设置模板数据（用于序列化器）
   * @param data 模板数据
   */
  setTemplateData(data: SceneTemplateData): void {
    this._templateData = data
  }
}
