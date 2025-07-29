/**
 * QAQ游戏引擎 - 场景序列化器
 * 
 * 负责场景和节点的序列化/反序列化，支持完整的场景状态保存和恢复
 */

import Node from '../nodes/Node'
import Scene from '../nodes/Scene'
import Node3D from '../nodes/Node3D'
import MeshInstance3D from '../nodes/MeshInstance3D'
import AnimationPlayer from '../nodes/animation/AnimationPlayer'
import Camera3D from '../nodes/Camera3D'
import DirectionalLight3D from '../nodes/DirectionalLight3D'

// ============================================================================
// 序列化接口定义
// ============================================================================

/**
 * 序列化数据格式版本
 */
export const SERIALIZATION_VERSION = '1.0.0'

/**
 * 节点序列化数据
 */
export interface SerializedNode {
  /** 节点类型 */
  type: string
  /** 节点名称 */
  name: string
  /** 节点ID */
  id: string
  /** 节点属性 */
  properties: Record<string, any>
  /** 子节点列表 */
  children: SerializedNode[]
  /** 组件数据 */
  components?: SerializedComponent[]
  /** 脚本数据 */
  scripts?: SerializedScript[]
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 组件序列化数据
 */
export interface SerializedComponent {
  type: string
  properties: Record<string, any>
  enabled: boolean
}

/**
 * 脚本序列化数据
 */
export interface SerializedScript {
  className: string
  filePath: string
  properties: Record<string, any>
  enabled: boolean
}

/**
 * 场景序列化数据
 */
export interface SerializedScene {
  /** 序列化版本 */
  version: string
  /** 场景元数据 */
  metadata: {
    name: string
    created: number
    modified: number
    author?: string
    description?: string
  }
  /** 根节点数据 */
  root: SerializedNode
  /** 资源引用 */
  resources: SerializedResource[]
  /** 全局设置 */
  settings: Record<string, any>
}

/**
 * 资源引用数据
 */
export interface SerializedResource {
  id: string
  type: string
  path: string
  metadata?: Record<string, any>
}

// ============================================================================
// 序列化器类
// ============================================================================

export class SceneSerializer {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 节点类型注册表 */
  private _nodeTypeRegistry: Map<string, typeof Node> = new Map()

  /** 序列化处理器注册表 */
  private _serializationHandlers: Map<string, SerializationHandler> = new Map()

  /** 资源引用映射 */
  private _resourceMap: Map<string, SerializedResource> = new Map()

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  constructor() {
    this.registerBuiltinTypes()
    this.registerBuiltinHandlers()
  }

  /**
   * 注册内置节点类型
   */
  private registerBuiltinTypes(): void {
    this.registerNodeType('Node', Node)
    this.registerNodeType('Scene', Scene)
    this.registerNodeType('Node3D', Node3D)
    this.registerNodeType('MeshInstance3D', MeshInstance3D)
    this.registerNodeType('AnimationPlayer', AnimationPlayer)
    this.registerNodeType('Camera3D', Camera3D)
    this.registerNodeType('DirectionalLight3D', DirectionalLight3D)
  }

  /**
   * 注册内置序列化处理器
   */
  private registerBuiltinHandlers(): void {
    // Node基类处理器
    this.registerSerializationHandler('Node', {
      serialize: (node: Node) => this.serializeNodeBase(node),
      deserialize: (data: SerializedNode, node: Node) => this.deserializeNodeBase(data, node)
    })

    // Node3D处理器
    this.registerSerializationHandler('Node3D', {
      serialize: (node: Node3D) => ({
        ...this.serializeNodeBase(node),
        position: node.position,
        rotation: node.rotation,
        scale: node.scale,
        visible: node.visible
      }),
      deserialize: (data: SerializedNode, node: Node3D) => {
        this.deserializeNodeBase(data, node)
        if (data.properties.position) node.position = data.properties.position
        if (data.properties.rotation) node.rotation = data.properties.rotation
        if (data.properties.scale) node.scale = data.properties.scale
        if (data.properties.visible !== undefined) node.visible = data.properties.visible
      }
    })

    // MeshInstance3D处理器（增强版）
    this.registerSerializationHandler('MeshInstance3D', {
      serialize: (node: MeshInstance3D) => {
        const gltfResource = node.getGLTFResource()
        const animationMap = node.getAnimationMap()

        return {
          ...this.serializeNodeBase(node),
          // 3D变换属性
          position: node.position,
          rotation: node.rotation,
          scale: node.scale,
          visible: node.visible,

          // 渲染属性
          castShadow: node.castShadow,
          receiveShadow: node.receiveShadow,
          materialType: node.materialType,

          // 网格资源信息
          meshPath: node.getProperty('meshPath') || null,

          // GLTF资源状态
          gltfResourceState: gltfResource ? {
            loaded: true,
            animationCount: gltfResource.animations.length,
            materialCount: gltfResource.materials.length,
            textureCount: gltfResource.textures.length,
            sceneLoaded: !!gltfResource.scene
          } : null,

          // 动画数据
          animationNames: node.getAnimationNames(),
          hasAnimationMixer: !!node.getAnimationMixer(),
          animationMapSize: animationMap.size,

          // 导入状态
          importedAnimationsCount: node.importedAnimations ? node.importedAnimations.length : 0
        }
      },
      deserialize: (data: SerializedNode, node: MeshInstance3D) => {
        this.deserializeNodeBase(data, node)

        // 恢复3D变换
        if (data.properties.position) node.position = data.properties.position
        if (data.properties.rotation) node.rotation = data.properties.rotation
        if (data.properties.scale) node.scale = data.properties.scale
        if (data.properties.visible !== undefined) node.visible = data.properties.visible

        // 恢复渲染属性
        if (data.properties.castShadow !== undefined) node.castShadow = data.properties.castShadow
        if (data.properties.receiveShadow !== undefined) node.receiveShadow = data.properties.receiveShadow
        if (data.properties.materialType !== undefined) node.materialType = data.properties.materialType

        // 异步加载网格资源
        if (data.properties.meshPath) {
          this.loadMeshAsync(node, data.properties.meshPath, data.properties.gltfResourceState)
        }
      }
    })

    // AnimationPlayer处理器
    this.registerSerializationHandler('AnimationPlayer', {
      serialize: (node: AnimationPlayer) => ({
        ...this.serializeNodeBase(node),
        autoplay: node.getProperty('autoplay'),
        speed: node.getProperty('speed'),
        processMode: node.getProperty('processMode'),
        currentAnimation: node.getCurrentAnimation(),
        globalTransitionTime: node.getGlobalTransitionTime(),
        intelligentTransitionsEnabled: node.isIntelligentTransitionsEnabled()
      }),
      deserialize: (data: SerializedNode, node: AnimationPlayer) => {
        this.deserializeNodeBase(data, node)
        if (data.properties.autoplay !== undefined) node.setProperty('autoplay', data.properties.autoplay)
        if (data.properties.speed !== undefined) node.setProperty('speed', data.properties.speed)
        if (data.properties.processMode !== undefined) node.setProperty('processMode', data.properties.processMode)
        if (data.properties.globalTransitionTime !== undefined) {
          node.setGlobalTransitionTime(data.properties.globalTransitionTime)
        }
        if (data.properties.intelligentTransitionsEnabled !== undefined) {
          node.setIntelligentTransitionsEnabled(data.properties.intelligentTransitionsEnabled)
        }
      }
    })

    // Camera3D处理器
    this.registerSerializationHandler('Camera3D', {
      serialize: (node: Camera3D) => ({
        ...this.serializeNodeBase(node),
        position: node.position,
        rotation: node.rotation,
        scale: node.scale,
        visible: node.visible,
        fov: node.fov,
        near: node.near,
        far: node.far,
        projectionMode: node.projectionMode,
        isCurrent: node.isCurrent(),
        clearColor: node.clearColor,
        clearFlags: node.clearFlags
      }),
      deserialize: (data: SerializedNode, node: Camera3D) => {
        this.deserializeNodeBase(data, node)
        if (data.properties.position) node.position = data.properties.position
        if (data.properties.rotation) node.rotation = data.properties.rotation
        if (data.properties.scale) node.scale = data.properties.scale
        if (data.properties.visible !== undefined) node.visible = data.properties.visible
        if (data.properties.fov !== undefined) node.fov = data.properties.fov
        if (data.properties.near !== undefined) node.near = data.properties.near
        if (data.properties.far !== undefined) node.far = data.properties.far
        if (data.properties.projectionMode !== undefined) node.projectionMode = data.properties.projectionMode
        if (data.properties.clearColor) node.clearColor = data.properties.clearColor
        if (data.properties.clearFlags !== undefined) node.clearFlags = data.properties.clearFlags

        // 恢复相机当前状态（需要延迟执行，避免冲突）
        if (data.properties.isCurrent) {
          setTimeout(() => node.makeCurrent(), 0)
        }
      }
    })

    // DirectionalLight3D处理器
    this.registerSerializationHandler('DirectionalLight3D', {
      serialize: (node: DirectionalLight3D) => ({
        ...this.serializeNodeBase(node),
        position: node.position,
        rotation: node.rotation,
        scale: node.scale,
        visible: node.visible,
        color: node.color,
        intensity: node.intensity,
        enabled: node.enabled,
        castShadow: node.castShadow,
        shadowMapSize: node.shadowMapSize,
        shadowBias: node.shadowBias,
        shadowRadius: node.shadowRadius
      }),
      deserialize: (data: SerializedNode, node: DirectionalLight3D) => {
        this.deserializeNodeBase(data, node)
        if (data.properties.position) node.position = data.properties.position
        if (data.properties.rotation) node.rotation = data.properties.rotation
        if (data.properties.scale) node.scale = data.properties.scale
        if (data.properties.visible !== undefined) node.visible = data.properties.visible
        if (data.properties.color) node.color = data.properties.color
        if (data.properties.intensity !== undefined) node.intensity = data.properties.intensity
        if (data.properties.enabled !== undefined) node.enabled = data.properties.enabled
        if (data.properties.castShadow !== undefined) node.castShadow = data.properties.castShadow
        if (data.properties.shadowMapSize !== undefined) node.shadowMapSize = data.properties.shadowMapSize
        if (data.properties.shadowBias !== undefined) node.shadowBias = data.properties.shadowBias
        if (data.properties.shadowRadius !== undefined) node.shadowRadius = data.properties.shadowRadius
      }
    })
  }

  // ========================================================================
  // 公共API - 序列化
  // ========================================================================

  /**
   * 序列化场景
   */
  async serialize(scene: Scene): Promise<SerializedScene> {
    console.log(`📦 开始序列化场景: ${scene.name}`)
    
    // 清空资源映射
    this._resourceMap.clear()

    try {
      // 序列化根节点
      const rootData = await this.serializeNode(scene)

      // 创建场景数据
      const sceneData: SerializedScene = {
        version: SERIALIZATION_VERSION,
        metadata: {
          name: scene.name,
          created: Date.now(),
          modified: Date.now(),
          description: `Serialized scene: ${scene.name}`
        },
        root: rootData,
        resources: Array.from(this._resourceMap.values()),
        settings: {
          // 这里可以添加全局场景设置
        }
      }

      console.log(`✅ 场景序列化完成，节点数: ${this.countNodes(rootData)}, 资源数: ${sceneData.resources.length}`)
      return sceneData

    } catch (error) {
      console.error('❌ 场景序列化失败:', error)
      throw error
    }
  }

  /**
   * 反序列化场景
   */
  async deserialize(sceneData: SerializedScene): Promise<Scene> {
    console.log(`📦 开始反序列化场景: ${sceneData.metadata.name}`)

    try {
      // 验证版本兼容性
      this.validateVersion(sceneData.version)

      // 预加载资源
      await this.preloadResources(sceneData.resources)

      // 反序列化根节点
      const scene = await this.deserializeNode(sceneData.root) as Scene

      console.log(`✅ 场景反序列化完成: ${scene.name}`)
      return scene

    } catch (error) {
      console.error('❌ 场景反序列化失败:', error)
      throw error
    }
  }

  // ========================================================================
  // 节点序列化/反序列化
  // ========================================================================

  /**
   * 序列化单个节点
   */
  private async serializeNode(node: Node): Promise<SerializedNode> {
    const nodeType = node.constructor.name
    const handler = this._serializationHandlers.get(nodeType)

    if (!handler) {
      console.warn(`⚠️ 未找到节点类型 ${nodeType} 的序列化处理器，使用默认处理器`)
      return this.serializeNodeDefault(node)
    }

    try {
      // 使用专用处理器序列化
      const nodeData = handler.serialize(node)

      // 序列化子节点
      const children: SerializedNode[] = []
      for (const child of node.children) {
        const childData = await this.serializeNode(child)
        children.push(childData)
      }

      return {
        ...nodeData,
        type: nodeType,
        children
      }

    } catch (error) {
      console.error(`❌ 序列化节点失败: ${node.name} (${nodeType})`, error)
      throw error
    }
  }

  /**
   * 反序列化单个节点
   */
  private async deserializeNode(nodeData: SerializedNode): Promise<Node> {
    const NodeClass = this._nodeTypeRegistry.get(nodeData.type)
    
    if (!NodeClass) {
      throw new Error(`未注册的节点类型: ${nodeData.type}`)
    }

    try {
      // 创建节点实例
      const node = new NodeClass(nodeData.name)
      node.setInstanceId(nodeData.id)

      // 使用处理器反序列化
      const handler = this._serializationHandlers.get(nodeData.type)
      if (handler) {
        handler.deserialize(nodeData, node)
      } else {
        this.deserializeNodeBase(nodeData, node)
      }

      // 反序列化子节点
      for (const childData of nodeData.children) {
        const child = await this.deserializeNode(childData)
        node.addChild(child)
      }

      return node

    } catch (error) {
      console.error(`❌ 反序列化节点失败: ${nodeData.name} (${nodeData.type})`, error)
      throw error
    }
  }

  // ========================================================================
  // 基础序列化方法
  // ========================================================================

  /**
   * 序列化节点基础数据
   */
  private serializeNodeBase(node: Node): Partial<SerializedNode> {
    return {
      name: node.name,
      id: node.getInstanceId(),
      properties: this.serializeProperties(node),
      metadata: {
        className: node.getClassName(),
        created: Date.now()
      }
    }
  }

  /**
   * 反序列化节点基础数据
   */
  private deserializeNodeBase(data: SerializedNode, node: Node): void {
    node.name = data.name
    
    // 恢复属性
    if (data.properties) {
      for (const [key, value] of Object.entries(data.properties)) {
        try {
          node.setProperty(key, value)
        } catch (error) {
          console.warn(`⚠️ 设置属性失败: ${key} = ${value}`, error)
        }
      }
    }
  }

  /**
   * 序列化节点属性
   */
  private serializeProperties(node: Node): Record<string, any> {
    const properties: Record<string, any> = {}
    
    // 获取所有属性
    const propertyMap = (node as any)._properties
    if (propertyMap instanceof Map) {
      for (const [key, value] of propertyMap.entries()) {
        if (this.isSerializableValue(value)) {
          properties[key] = this.serializeValue(value)
        }
      }
    }

    return properties
  }

  /**
   * 检查值是否可序列化
   */
  private isSerializableValue(value: any): boolean {
    if (value === null || value === undefined) return true
    
    const type = typeof value
    if (type === 'string' || type === 'number' || type === 'boolean') return true
    
    if (Array.isArray(value)) return true
    
    if (type === 'object' && value.constructor === Object) return true
    
    // 检查是否有自定义序列化方法
    if (typeof value.serialize === 'function') return true
    
    return false
  }

  /**
   * 序列化值
   */
  private serializeValue(value: any): any {
    if (value === null || value === undefined) return value
    
    if (typeof value.serialize === 'function') {
      return {
        __serialized: true,
        type: value.constructor.name,
        data: value.serialize()
      }
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.serializeValue(item))
    }
    
    if (typeof value === 'object' && value.constructor === Object) {
      const result: Record<string, any> = {}
      for (const [key, val] of Object.entries(value)) {
        if (this.isSerializableValue(val)) {
          result[key] = this.serializeValue(val)
        }
      }
      return result
    }
    
    return value
  }

  /**
   * 默认节点序列化
   */
  private serializeNodeDefault(node: Node): SerializedNode {
    return {
      type: node.constructor.name,
      name: node.name,
      id: node.getInstanceId(),
      properties: this.serializeProperties(node),
      children: []
    }
  }

  // ========================================================================
  // 注册和管理方法
  // ========================================================================

  /**
   * 注册节点类型
   */
  registerNodeType(typeName: string, NodeClass: typeof Node): void {
    this._nodeTypeRegistry.set(typeName, NodeClass)
    console.log(`📝 注册节点类型: ${typeName}`)
  }

  /**
   * 注册序列化处理器
   */
  registerSerializationHandler(typeName: string, handler: SerializationHandler): void {
    this._serializationHandlers.set(typeName, handler)
    console.log(`📝 注册序列化处理器: ${typeName}`)
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 验证序列化版本
   */
  private validateVersion(version: string): void {
    if (version !== SERIALIZATION_VERSION) {
      console.warn(`⚠️ 序列化版本不匹配: 期望 ${SERIALIZATION_VERSION}, 实际 ${version}`)
      // 这里可以添加版本兼容性处理逻辑
    }
  }

  /**
   * 预加载资源
   */
  private async preloadResources(resources: SerializedResource[]): Promise<void> {
    console.log(`📦 预加载 ${resources.length} 个资源...`)
    
    for (const resource of resources) {
      try {
        // 这里应该调用资源管理器加载资源
        console.log(`📦 加载资源: ${resource.path}`)
      } catch (error) {
        console.warn(`⚠️ 资源加载失败: ${resource.path}`, error)
      }
    }
  }

  /**
   * 异步加载网格（增强版）
   */
  private async loadMeshAsync(
    meshInstance: MeshInstance3D,
    meshPath: string,
    expectedState?: any
  ): Promise<void> {
    try {
      console.log(`📦 异步加载网格: ${meshPath}`)

      // 这里应该调用MeshInstance3D的loadModel方法
      // await meshInstance.loadModel(meshPath)

      // 验证加载结果与期望状态是否匹配
      if (expectedState) {
        setTimeout(() => {
          this.validateMeshLoadingResult(meshInstance, expectedState)
        }, 1000) // 给加载一些时间
      }

    } catch (error) {
      console.warn(`⚠️ 网格加载失败: ${meshPath}`, error)
    }
  }

  /**
   * 验证网格加载结果
   */
  private validateMeshLoadingResult(meshInstance: MeshInstance3D, expectedState: any): void {
    const gltfResource = meshInstance.getGLTFResource()

    if (!gltfResource && expectedState.loaded) {
      console.warn('⚠️ 期望加载GLTF资源，但加载失败')
      return
    }

    if (gltfResource) {
      const actualAnimationCount = gltfResource.animations.length
      const expectedAnimationCount = expectedState.animationCount || 0

      if (actualAnimationCount !== expectedAnimationCount) {
        console.warn(`⚠️ 动画数量不匹配: 期望${expectedAnimationCount}, 实际${actualAnimationCount}`)
      }

      const actualMaterialCount = gltfResource.materials.length
      const expectedMaterialCount = expectedState.materialCount || 0

      if (actualMaterialCount !== expectedMaterialCount) {
        console.warn(`⚠️ 材质数量不匹配: 期望${expectedMaterialCount}, 实际${actualMaterialCount}`)
      }

      console.log(`✅ 网格加载验证完成: ${meshInstance.name}`)
    }
  }

  /**
   * 计算节点数量
   */
  private countNodes(nodeData: SerializedNode): number {
    let count = 1
    for (const child of nodeData.children) {
      count += this.countNodes(child)
    }
    return count
  }
}

// ============================================================================
// 序列化处理器接口
// ============================================================================

export interface SerializationHandler {
  serialize(node: Node): Partial<SerializedNode>
  deserialize(data: SerializedNode, node: Node): void
}

export default SceneSerializer
