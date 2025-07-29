/**
 * QAQ游戏引擎 - PackedScene 场景序列化系统
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 场景的保存/加载机制，类似于Godot的PackedScene
 * - 支持场景预制件(scene prefab)的创建和复用
 * - 实现场景节点的深度克隆和引用管理
 * - 场景序列化和反序列化
 * - 场景资源依赖管理
 * - 场景版本控制和兼容性
 *
 * 架构设计:
 * - 基于JSON的场景序列化格式
 * - 支持节点树的完整序列化
 * - 资源引用的智能管理
 * - 场景实例化的优化
 *
 * 核心功能:
 * - pack() - 打包场景为PackedScene
 * - instantiate() - 实例化场景
 * - save() / load() - 保存/加载场景文件
 * - 场景预制件管理
 */

import Scene, { SceneType, SceneState } from './Scene'
import Node from '../nodes/Node'
import ResourceLoader from '../resources/ResourceLoader'
import type { PropertyInfo } from '../../types/core'

// ============================================================================
// PackedScene相关枚举和接口
// ============================================================================

/**
 * 场景序列化格式版本
 */
const PACKED_SCENE_VERSION = '1.0.0'

/**
 * 节点序列化数据接口
 */
export interface SerializedNode {
  /** 节点类名 */
  className: string
  /** 节点名称 */
  name: string
  /** 节点属性 */
  properties: Record<string, any>
  /** 子节点数据 */
  children: SerializedNode[]
  /** 节点脚本路径 */
  script?: string
  /** 节点组 */
  groups?: string[]
  /** 自定义数据 */
  userData?: any
}

/**
 * 场景序列化数据接口
 */
export interface SerializedScene {
  /** 格式版本 */
  version: string
  /** 场景元数据 */
  metadata: {
    name: string
    type: SceneType
    description?: string
    author?: string
    createdAt: number
    modifiedAt: number
    tags?: string[]
  }
  /** 根节点数据 */
  rootNode: SerializedNode
  /** 资源依赖 */
  dependencies: string[]
  /** 外部资源引用 */
  externalResources: Record<string, string>
  /** 场景配置 */
  config: {
    autoStart?: boolean
    persistent?: boolean
    preload?: boolean
  }
}

/**
 * 实例化选项接口
 */
export interface InstantiateOptions {
  /** 实例名称 */
  name?: string
  /** 是否保持原始名称 */
  keepOriginalNames?: boolean
  /** 是否深度克隆资源 */
  deepCloneResources?: boolean
  /** 自定义属性覆盖 */
  propertyOverrides?: Record<string, any>
  /** 实例化完成回调 */
  onComplete?: (scene: Scene) => void
  /** 实例化失败回调 */
  onError?: (error: Error) => void
}

/**
 * 打包选项接口
 */
export interface PackOptions {
  /** 是否包含脚本 */
  includeScripts?: boolean
  /** 是否包含用户数据 */
  includeUserData?: boolean
  /** 是否压缩数据 */
  compress?: boolean
  /** 排除的属性列表 */
  excludeProperties?: string[]
  /** 自定义序列化器 */
  customSerializers?: Map<string, (node: Node) => any>
}

// ============================================================================
// PackedScene 类实现
// ============================================================================

/**
 * PackedScene 类 - 场景序列化和实例化
 *
 * 主要功能:
 * 1. 场景的序列化和反序列化
 * 2. 场景预制件的创建和管理
 * 3. 场景实例化和克隆
 * 4. 资源依赖管理
 * 5. 场景文件的保存和加载
 */
export class PackedScene {
  // ========================================================================
  // 私有属性 - 序列化数据
  // ========================================================================

  /** 序列化的场景数据 */
  private _serializedData: SerializedScene | null = null

  /** 场景文件路径 */
  private _scenePath: string = ''

  /** 是否已加载 */
  private _loaded: boolean = false

  /** 资源依赖缓存 */
  private _dependencyCache: Map<string, any> = new Map()

  /** 实例化计数器 */
  private _instanceCounter: number = 0

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param scenePath 可选的场景文件路径
   */
  constructor(scenePath?: string) {
    if (scenePath) {
      this._scenePath = scenePath
    }
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取场景路径
   * @returns 场景路径
   */
  get scenePath(): string {
    return this._scenePath
  }

  /**
   * 设置场景路径
   * @param value 场景路径
   */
  set scenePath(value: string) {
    this._scenePath = value
  }

  /**
   * 获取是否已加载
   * @returns 是否已加载
   */
  get loaded(): boolean {
    return this._loaded
  }

  /**
   * 获取序列化数据
   * @returns 序列化数据
   */
  get serializedData(): SerializedScene | null {
    return this._serializedData
  }

  /**
   * 获取场景元数据
   * @returns 场景元数据
   */
  get metadata(): SerializedScene['metadata'] | null {
    return this._serializedData?.metadata || null
  }

  /**
   * 获取资源依赖列表
   * @returns 依赖列表
   */
  get dependencies(): string[] {
    return this._serializedData?.dependencies || []
  }

  // ========================================================================
  // 核心方法 - 场景打包
  // ========================================================================

  /**
   * 打包场景为PackedScene
   * @param scene 要打包的场景
   * @param options 打包选项
   * @returns 打包后的PackedScene
   */
  static pack(scene: Scene, options: PackOptions = {}): PackedScene {
    const packedScene = new PackedScene()

    // 序列化场景数据
    const serializedData: SerializedScene = {
      version: PACKED_SCENE_VERSION,
      metadata: {
        name: scene.name,
        type: scene.sceneType,
        description: scene.metadata.description,
        author: scene.metadata.author,
        createdAt: scene.metadata.createdAt,
        modifiedAt: Date.now(),
        tags: scene.metadata.tags
      },
      rootNode: packedScene.serializeNode(scene, options),
      dependencies: [],
      externalResources: {},
      config: {
        autoStart: true,
        persistent: scene.persistent,
        preload: false
      }
    }

    // 收集依赖
    packedScene.collectDependencies(scene, serializedData)

    packedScene._serializedData = serializedData
    packedScene._loaded = true

    console.log(`📦 Scene packed: ${scene.name}`)
    return packedScene
  }

  /**
   * 序列化节点
   * @param node 要序列化的节点
   * @param options 打包选项
   * @returns 序列化的节点数据
   */
  private serializeNode(node: Node, options: PackOptions): SerializedNode {
    const serializedNode: SerializedNode = {
      className: node.constructor.name,
      name: node.name,
      properties: this.serializeProperties(node, options),
      children: []
    }

    // 序列化脚本（如果节点有script属性）
    if (options.includeScripts && 'script' in node && (node as any).script) {
      serializedNode.script = (node as any).script
    }

    // 序列化组（如果节点有groups属性）
    if ('groups' in node && (node as any).groups && (node as any).groups.length > 0) {
      serializedNode.groups = [...(node as any).groups]
    }

    // 序列化用户数据（如果节点有userData属性）
    if (options.includeUserData && 'userData' in node && (node as any).userData) {
      serializedNode.userData = JSON.parse(JSON.stringify((node as any).userData))
    }

    // 递归序列化子节点
    node.children.forEach(child => {
      serializedNode.children.push(this.serializeNode(child, options))
    })

    return serializedNode
  }

  /**
   * 序列化节点属性
   * @param node 节点
   * @param options 打包选项
   * @returns 序列化的属性
   */
  private serializeProperties(node: Node, options: PackOptions): Record<string, any> {
    const properties: Record<string, any> = {}
    const excludeList = options.excludeProperties || []

    // 基础属性
    if (!excludeList.includes('position')) {
      properties.position = { ...node.position }
    }

    if (!excludeList.includes('rotation') && 'rotation' in node) {
      properties.rotation = { ...(node as any).rotation }
    }

    if (!excludeList.includes('scale') && 'scale' in node) {
      properties.scale = { ...(node as any).scale }
    }

    if (!excludeList.includes('visible')) {
      properties.visible = node.visible
    }

    if (!excludeList.includes('processMode')) {
      properties.processMode = node.processMode
    }

    // 使用自定义序列化器
    if (options.customSerializers?.has(node.constructor.name)) {
      const customSerializer = options.customSerializers.get(node.constructor.name)!
      const customProperties = customSerializer(node)
      Object.assign(properties, customProperties)
    }

    return properties
  }

  /**
   * 收集场景依赖
   * @param scene 场景
   * @param serializedData 序列化数据
   */
  private collectDependencies(scene: Scene, serializedData: SerializedScene): void {
    const dependencies = new Set<string>()
    const externalResources: Record<string, string> = {}

    // 递归收集节点依赖
    this.collectNodeDependencies(scene, dependencies, externalResources)

    serializedData.dependencies = Array.from(dependencies)
    serializedData.externalResources = externalResources
  }

  /**
   * 收集节点依赖
   * @param node 节点
   * @param dependencies 依赖集合
   * @param externalResources 外部资源
   */
  private collectNodeDependencies(
    node: Node,
    dependencies: Set<string>,
    externalResources: Record<string, string>
  ): void {
    // 收集脚本依赖
    if ('script' in node && (node as any).script) {
      dependencies.add((node as any).script)
    }

    // 这里可以添加更多特定节点类型的依赖收集逻辑
    // 例如：MeshInstance3D的模型文件、AudioStreamPlayer的音频文件等

    // 递归收集子节点依赖
    node.children.forEach(child => {
      this.collectNodeDependencies(child, dependencies, externalResources)
    })
  }

  // ========================================================================
  // 核心方法 - 场景实例化
  // ========================================================================

  /**
   * 实例化场景
   * @param options 实例化选项
   * @returns 实例化的场景
   */
  instantiate(options: InstantiateOptions = {}): Scene {
    if (!this._serializedData) {
      throw new Error('PackedScene not loaded. Call load() first.')
    }

    try {
      // 创建场景实例
      const scene = this.instantiateNode(this._serializedData.rootNode, options) as Scene

      // 设置场景属性
      scene.sceneType = this._serializedData.metadata.type
      scene.scenePath = this._scenePath

      // 应用配置
      if (this._serializedData.config.persistent !== undefined) {
        scene.persistent = this._serializedData.config.persistent
      }

      // 生成实例名称
      if (options.name) {
        scene.name = options.name
      } else if (!options.keepOriginalNames) {
        this._instanceCounter++
        scene.name = `${scene.name}_${this._instanceCounter}`
      }

      // 应用属性覆盖
      if (options.propertyOverrides) {
        this.applyPropertyOverrides(scene, options.propertyOverrides)
      }

      // 调用完成回调
      if (options.onComplete) {
        options.onComplete(scene)
      }

      console.log(`🎬 Scene instantiated: ${scene.name}`)
      return scene

    } catch (error) {
      if (options.onError) {
        options.onError(error as Error)
      }
      throw error
    }
  }

  /**
   * 实例化节点
   * @param serializedNode 序列化的节点数据
   * @param options 实例化选项
   * @returns 实例化的节点
   */
  private instantiateNode(serializedNode: SerializedNode, options: InstantiateOptions): Node {
    // 创建节点实例
    const node = this.createNodeInstance(serializedNode.className, serializedNode.name)

    // 应用属性
    this.applyNodeProperties(node, serializedNode.properties)

    // 设置脚本（如果节点支持）
    if (serializedNode.script && 'script' in node) {
      (node as any).script = serializedNode.script
    }

    // 设置组（如果节点支持）
    if (serializedNode.groups && 'groups' in node) {
      (node as any).groups = [...serializedNode.groups]
    }

    // 设置用户数据（如果节点支持）
    if (serializedNode.userData && 'userData' in node) {
      (node as any).userData = JSON.parse(JSON.stringify(serializedNode.userData))
    }

    // 递归实例化子节点
    serializedNode.children.forEach(childData => {
      const childNode = this.instantiateNode(childData, options)
      node.addChild(childNode)
    })

    return node
  }

  /**
   * 创建节点实例
   * @param className 类名
   * @param name 节点名称
   * @returns 节点实例
   */
  private createNodeInstance(className: string, name: string): Node {
    // 这里需要一个节点类型注册系统
    // 目前简化处理，根据类名创建对应的节点
    switch (className) {
      case 'Scene':
        return new Scene(name)
      case 'Node':
        return new Node(name)
      // 这里可以添加更多节点类型
      default:
        console.warn(`Unknown node class: ${className}, creating base Node`)
        return new Node(name)
    }
  }

  /**
   * 应用节点属性
   * @param node 节点
   * @param properties 属性数据
   */
  private applyNodeProperties(node: Node, properties: Record<string, any>): void {
    // 应用基础属性
    if (properties.position) {
      node.position = { ...properties.position }
    }

    if (properties.rotation && 'rotation' in node) {
      (node as any).rotation = { ...properties.rotation }
    }

    if (properties.scale && 'scale' in node) {
      (node as any).scale = { ...properties.scale }
    }

    if (properties.visible !== undefined) {
      node.visible = properties.visible
    }

    if (properties.processMode !== undefined) {
      node.processMode = properties.processMode
    }

    // 这里可以添加更多特定节点类型的属性应用逻辑
  }

  /**
   * 应用属性覆盖
   * @param scene 场景
   * @param overrides 属性覆盖
   */
  private applyPropertyOverrides(scene: Scene, overrides: Record<string, any>): void {
    Object.entries(overrides).forEach(([key, value]) => {
      if (key in scene) {
        (scene as any)[key] = value
      }
    })
  }

  // ========================================================================
  // 文件操作方法
  // ========================================================================

  /**
   * 从文件加载PackedScene
   * @param scenePath 场景文件路径
   * @returns 加载的PackedScene
   */
  static async load(scenePath: string): Promise<PackedScene> {
    const packedScene = new PackedScene(scenePath)
    await packedScene.loadFromFile()
    return packedScene
  }

  /**
   * 从文件加载场景数据
   */
  private async loadFromFile(): Promise<void> {
    if (!this._scenePath) {
      throw new Error('Scene path not set')
    }

    try {
      // 这里应该实现实际的文件加载逻辑
      // 目前模拟加载过程
      const fileContent = await this.readSceneFile(this._scenePath)
      this._serializedData = JSON.parse(fileContent)

      // 验证数据格式
      this.validateSerializedData(this._serializedData!)

      // 预加载依赖
      await this.preloadDependencies()

      this._loaded = true
      console.log(`📁 PackedScene loaded: ${this._scenePath}`)

    } catch (error) {
      console.error(`Failed to load PackedScene: ${this._scenePath}`, error)
      throw error
    }
  }

  /**
   * 读取场景文件
   * @param scenePath 场景路径
   * @returns 文件内容
   */
  private async readSceneFile(scenePath: string): Promise<string> {
    // 这里应该实现实际的文件读取逻辑
    // 目前返回模拟数据
    const mockSceneData: SerializedScene = {
      version: PACKED_SCENE_VERSION,
      metadata: {
        name: 'MockScene',
        type: SceneType.MAIN,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      },
      rootNode: {
        className: 'Scene',
        name: 'MockScene',
        properties: {
          position: { x: 0, y: 0, z: 0 },
          visible: true
        },
        children: []
      },
      dependencies: [],
      externalResources: {},
      config: {
        autoStart: true,
        persistent: false
      }
    }

    return JSON.stringify(mockSceneData, null, 2)
  }

  /**
   * 验证序列化数据
   * @param data 序列化数据
   */
  private validateSerializedData(data: SerializedScene): void {
    if (!data.version) {
      throw new Error('Invalid scene data: missing version')
    }

    if (!data.metadata) {
      throw new Error('Invalid scene data: missing metadata')
    }

    if (!data.rootNode) {
      throw new Error('Invalid scene data: missing root node')
    }

    // 检查版本兼容性
    if (data.version !== PACKED_SCENE_VERSION) {
      console.warn(`Scene version mismatch: ${data.version} vs ${PACKED_SCENE_VERSION}`)
    }
  }

  /**
   * 预加载依赖
   */
  private async preloadDependencies(): Promise<void> {
    if (!this._serializedData) return

    const resourceLoader = ResourceLoader.getInstance()

    for (const dependency of this._serializedData.dependencies) {
      try {
        const resource = await resourceLoader.load(dependency)
        this._dependencyCache.set(dependency, resource)
      } catch (error) {
        console.warn(`Failed to preload dependency: ${dependency}`, error)
      }
    }
  }

  /**
   * 保存PackedScene到文件
   * @param scenePath 保存路径
   */
  async save(scenePath?: string): Promise<void> {
    if (!this._serializedData) {
      throw new Error('No data to save')
    }

    const savePath = scenePath || this._scenePath
    if (!savePath) {
      throw new Error('No save path specified')
    }

    try {
      // 更新修改时间
      this._serializedData.metadata.modifiedAt = Date.now()

      // 序列化数据
      const jsonData = JSON.stringify(this._serializedData, null, 2)

      // 这里应该实现实际的文件写入逻辑
      await this.writeSceneFile(savePath, jsonData)

      this._scenePath = savePath
      console.log(`💾 PackedScene saved: ${savePath}`)

    } catch (error) {
      console.error(`Failed to save PackedScene: ${savePath}`, error)
      throw error
    }
  }

  /**
   * 写入场景文件
   * @param scenePath 场景路径
   * @param content 文件内容
   */
  private async writeSceneFile(scenePath: string, content: string): Promise<void> {
    // 这里应该实现实际的文件写入逻辑
    // 目前只是模拟
    console.log(`Writing scene file: ${scenePath}`)
    console.log(`Content length: ${content.length} characters`)
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 克隆PackedScene
   * @returns 克隆的PackedScene
   */
  clone(): PackedScene {
    if (!this._serializedData) {
      throw new Error('Cannot clone unloaded PackedScene')
    }

    const clonedPackedScene = new PackedScene()
    clonedPackedScene._serializedData = JSON.parse(JSON.stringify(this._serializedData))
    clonedPackedScene._loaded = true

    return clonedPackedScene
  }

  /**
   * 获取场景统计信息
   * @returns 统计信息
   */
  getStats(): {
    nodeCount: number
    dependencyCount: number
    dataSize: number
    version: string
  } {
    if (!this._serializedData) {
      return {
        nodeCount: 0,
        dependencyCount: 0,
        dataSize: 0,
        version: 'unknown'
      }
    }

    const nodeCount = this.countNodes(this._serializedData.rootNode)
    const dataSize = JSON.stringify(this._serializedData).length

    return {
      nodeCount,
      dependencyCount: this._serializedData.dependencies.length,
      dataSize,
      version: this._serializedData.version
    }
  }

  /**
   * 递归计算节点数量
   * @param node 节点数据
   * @returns 节点数量
   */
  private countNodes(node: SerializedNode): number {
    let count = 1 // 当前节点

    node.children.forEach(child => {
      count += this.countNodes(child)
    })

    return count
  }

  /**
   * 验证场景完整性
   * @returns 验证结果
   */
  validate(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!this._serializedData) {
      errors.push('PackedScene not loaded')
      return { valid: false, errors, warnings }
    }

    // 验证版本
    if (this._serializedData.version !== PACKED_SCENE_VERSION) {
      warnings.push(`Version mismatch: ${this._serializedData.version} vs ${PACKED_SCENE_VERSION}`)
    }

    // 验证根节点
    if (!this._serializedData.rootNode) {
      errors.push('Missing root node')
    }

    // 验证依赖
    this._serializedData.dependencies.forEach(dep => {
      if (!this._dependencyCache.has(dep)) {
        warnings.push(`Dependency not cached: ${dep}`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取依赖资源
   * @param dependencyPath 依赖路径
   * @returns 依赖资源
   */
  getDependency(dependencyPath: string): any {
    return this._dependencyCache.get(dependencyPath)
  }

  /**
   * 清理资源缓存
   */
  clearCache(): void {
    this._dependencyCache.clear()
    console.log('📦 PackedScene cache cleared')
  }

  /**
   * 重新加载场景
   */
  async reload(): Promise<void> {
    if (!this._scenePath) {
      throw new Error('Cannot reload: no scene path')
    }

    this.clearCache()
    this._loaded = false
    this._serializedData = null

    await this.loadFromFile()
  }

  /**
   * 检查是否可以实例化
   * @returns 是否可以实例化
   */
  canInstantiate(): boolean {
    return this._loaded && this._serializedData !== null
  }

  /**
   * 获取场景预览信息
   * @returns 预览信息
   */
  getPreview(): {
    name: string
    type: SceneType
    nodeCount: number
    hasScript: boolean
    dependencies: string[]
    size: string
  } | null {
    if (!this._serializedData) {
      return null
    }

    const stats = this.getStats()

    return {
      name: this._serializedData.metadata.name,
      type: this._serializedData.metadata.type,
      nodeCount: stats.nodeCount,
      hasScript: this.hasScripts(this._serializedData.rootNode),
      dependencies: this._serializedData.dependencies,
      size: `${(stats.dataSize / 1024).toFixed(2)} KB`
    }
  }

  /**
   * 检查是否包含脚本
   * @param node 节点数据
   * @returns 是否包含脚本
   */
  private hasScripts(node: SerializedNode): boolean {
    if (node.script) {
      return true
    }

    return node.children.some(child => this.hasScripts(child))
  }

  /**
   * 导出为JSON字符串
   * @param pretty 是否格式化
   * @returns JSON字符串
   */
  toJSON(pretty: boolean = false): string {
    if (!this._serializedData) {
      throw new Error('No data to export')
    }

    return JSON.stringify(this._serializedData, null, pretty ? 2 : 0)
  }

  /**
   * 从JSON字符串导入
   * @param jsonString JSON字符串
   */
  fromJSON(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString)
      this.validateSerializedData(data)
      this._serializedData = data
      this._loaded = true
    } catch (error) {
      throw new Error(`Failed to import from JSON: ${error}`)
    }
  }

  /**
   * 销毁PackedScene
   */
  destroy(): void {
    this.clearCache()
    this._serializedData = null
    this._loaded = false
    this._scenePath = ''
    this._instanceCounter = 0

    console.log('🗑️ PackedScene destroyed')
  }
}

// ============================================================================
// 导出
// ============================================================================

export { PACKED_SCENE_VERSION }
export default PackedScene
