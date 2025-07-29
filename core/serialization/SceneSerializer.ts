/**
 * QAQ游戏引擎 - SceneSerializer 场景序列化器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 场景数据的保存和加载
 * - 支持多种序列化格式
 * - 版本兼容性处理
 * - 增量序列化优化
 * - 数据压缩和加密
 */

import Scene from '../scene/Scene'
import SceneTemplate, { type SceneTemplateData, type NodeTemplateData } from '../scene/SceneTemplate'
import Node from '../nodes/Node'
import type { Vector2, Vector3 } from '../../types/core'

// ============================================================================
// 序列化相关接口
// ============================================================================

/**
 * 序列化格式枚举
 */
export enum SerializationFormat {
  /** JSON格式 */
  JSON = 'json',
  /** 二进制格式 */
  BINARY = 'binary',
  /** YAML格式 */
  YAML = 'yaml',
  /** 压缩JSON格式 */
  COMPRESSED_JSON = 'compressed_json'
}

/**
 * 序列化配置接口
 */
export interface SerializationConfig {
  /** 序列化格式 */
  format: SerializationFormat
  /** 是否压缩 */
  compress?: boolean
  /** 是否加密 */
  encrypt?: boolean
  /** 是否包含元数据 */
  includeMetadata?: boolean
  /** 是否美化输出 */
  prettify?: boolean
  /** 版本号 */
  version?: string
  /** 自定义序列化器 */
  customSerializers?: Map<string, NodeSerializer>
}

/**
 * 节点序列化器接口
 */
export interface NodeSerializer {
  /** 序列化节点 */
  serialize(node: Node): any
  /** 反序列化节点 */
  deserialize(data: any): Node
  /** 支持的节点类型 */
  supportedTypes: string[]
}

/**
 * 序列化结果接口
 */
export interface SerializationResult {
  /** 序列化数据 */
  data: string | Uint8Array
  /** 数据大小 */
  size: number
  /** 序列化时间 */
  time: number
  /** 格式 */
  format: SerializationFormat
  /** 版本 */
  version: string
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 反序列化结果接口
 */
export interface DeserializationResult {
  /** 场景模板 */
  template: SceneTemplate
  /** 反序列化时间 */
  time: number
  /** 版本 */
  version: string
  /** 警告信息 */
  warnings: string[]
}

// ============================================================================
// SceneSerializer 类实现
// ============================================================================

/**
 * SceneSerializer 类 - 场景序列化器
 *
 * 主要功能:
 * 1. 场景和模板的序列化
 * 2. 多格式支持
 * 3. 版本兼容性
 * 4. 性能优化
 * 5. 数据完整性验证
 */
export default class SceneSerializer {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 当前版本 */
  private static readonly CURRENT_VERSION = '1.0.0'

  /** 支持的版本 */
  private static readonly SUPPORTED_VERSIONS = ['1.0.0']

  /** 自定义序列化器 */
  private _customSerializers: Map<string, NodeSerializer> = new Map()

  /** 默认配置 */
  private _defaultConfig: SerializationConfig = {
    format: SerializationFormat.JSON,
    compress: false,
    encrypt: false,
    includeMetadata: true,
    prettify: true,
    version: SceneSerializer.CURRENT_VERSION
  }

  // ========================================================================
  // 构造函数
  // ========================================================================

  constructor() {
    this._registerBuiltinSerializers()
  }

  // ========================================================================
  // 序列化方法
  // ========================================================================

  /**
   * 序列化场景模板
   * @param template 场景模板
   * @param config 序列化配置
   * @returns 序列化结果
   */
  async serializeTemplate(template: SceneTemplate, config?: Partial<SerializationConfig>): Promise<SerializationResult> {
    const startTime = Date.now()
    const finalConfig = { ...this._defaultConfig, ...config }

    try {
      // 获取模板数据
      const templateData = template.templateData

      // 添加元数据
      if (finalConfig.includeMetadata) {
        templateData.metadata = {
          serializedAt: Date.now(),
          serializerVersion: SceneSerializer.CURRENT_VERSION,
          engineVersion: '1.0.0', // 应该从引擎获取
          format: finalConfig.format
        }
      }

      // 根据格式序列化
      let serializedData: string | Uint8Array

      switch (finalConfig.format) {
        case SerializationFormat.JSON:
          serializedData = this._serializeToJSON(templateData, finalConfig.prettify)
          break
        case SerializationFormat.COMPRESSED_JSON:
          serializedData = await this._serializeToCompressedJSON(templateData)
          break
        case SerializationFormat.BINARY:
          serializedData = await this._serializeToBinary(templateData)
          break
        case SerializationFormat.YAML:
          serializedData = this._serializeToYAML(templateData)
          break
        default:
          throw new Error(`Unsupported serialization format: ${finalConfig.format}`)
      }

      // 加密（如果需要）
      if (finalConfig.encrypt) {
        serializedData = await this._encrypt(serializedData)
      }

      const endTime = Date.now()

      return {
        data: serializedData,
        size: typeof serializedData === 'string' ? serializedData.length : serializedData.byteLength,
        time: endTime - startTime,
        format: finalConfig.format,
        version: finalConfig.version!,
        metadata: finalConfig.includeMetadata ? templateData.metadata : undefined
      }

    } catch (error) {
      throw new Error(`Serialization failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 序列化场景实例
   * @param scene 场景实例
   * @param config 序列化配置
   * @returns 序列化结果
   */
  async serializeScene(scene: Scene, config?: Partial<SerializationConfig>): Promise<SerializationResult> {
    // 将场景转换为模板数据
    const templateData = this._sceneToTemplateData(scene)

    // 创建临时模板
    const template = new SceneTemplate({ name: scene.name })
    template.setTemplateData(templateData)

    return this.serializeTemplate(template, config)
  }

  // ========================================================================
  // 反序列化方法
  // ========================================================================

  /**
   * 反序列化场景模板
   * @param data 序列化数据
   * @param config 配置
   * @returns 反序列化结果
   */
  async deserializeTemplate(data: string | Uint8Array, config?: Partial<SerializationConfig>): Promise<DeserializationResult> {
    const startTime = Date.now()
    const finalConfig = { ...this._defaultConfig, ...config }
    const warnings: string[] = []

    try {
      // 解密（如果需要）
      let processedData = data
      if (finalConfig.encrypt) {
        processedData = await this._decrypt(processedData)
      }

      // 根据格式反序列化
      let templateData: SceneTemplateData

      if (typeof processedData === 'string') {
        if (processedData.trim().startsWith('{')) {
          templateData = JSON.parse(processedData)
        } else {
          templateData = this._deserializeFromYAML(processedData)
        }
      } else {
        templateData = await this._deserializeFromBinary(processedData)
      }

      // 版本兼容性检查
      const version = templateData.config.version || '1.0.0'
      if (!SceneSerializer.SUPPORTED_VERSIONS.includes(version)) {
        warnings.push(`Unsupported version: ${version}, attempting to load anyway`)
      }

      // 数据迁移（如果需要）
      templateData = this._migrateData(templateData, version, warnings)

      // 验证数据完整性
      this._validateTemplateData(templateData)

      // 创建模板
      const template = new SceneTemplate(templateData.config)
      template.setTemplateData(templateData)

      const endTime = Date.now()

      return {
        template,
        time: endTime - startTime,
        version,
        warnings
      }

    } catch (error) {
      throw new Error(`Deserialization failed: ${error instanceof Error ? error.message : error}`)
    }
  }

  /**
   * 反序列化为场景实例
   * @param data 序列化数据
   * @param config 配置
   * @returns 场景实例
   */
  async deserializeScene(data: string | Uint8Array, config?: Partial<SerializationConfig>): Promise<Scene> {
    const result = await this.deserializeTemplate(data, config)
    return result.template.instantiate()
  }

  // ========================================================================
  // 自定义序列化器管理
  // ========================================================================

  /**
   * 注册自定义序列化器
   * @param serializer 序列化器
   */
  registerSerializer(serializer: NodeSerializer): void {
    for (const type of serializer.supportedTypes) {
      this._customSerializers.set(type, serializer)
    }
  }

  /**
   * 注销自定义序列化器
   * @param type 节点类型
   */
  unregisterSerializer(type: string): void {
    this._customSerializers.delete(type)
  }

  // ========================================================================
  // 私有方法 - 序列化实现
  // ========================================================================

  /**
   * 序列化为JSON
   * @param data 数据
   * @param prettify 是否美化
   * @returns JSON字符串
   */
  private _serializeToJSON(data: any, prettify: boolean = true): string {
    return JSON.stringify(data, this._createJSONReplacer(), prettify ? 2 : undefined)
  }

  /**
   * 序列化为压缩JSON
   * @param data 数据
   * @returns 压缩数据
   */
  private async _serializeToCompressedJSON(data: any): Promise<Uint8Array> {
    const json = this._serializeToJSON(data, false)
    return this._compress(new TextEncoder().encode(json))
  }

  /**
   * 序列化为二进制
   * @param data 数据
   * @returns 二进制数据
   */
  private async _serializeToBinary(data: any): Promise<Uint8Array> {
    // 简化实现，实际可以使用MessagePack等二进制格式
    const json = this._serializeToJSON(data, false)
    return new TextEncoder().encode(json)
  }

  /**
   * 序列化为YAML
   * @param data 数据
   * @returns YAML字符串
   */
  private _serializeToYAML(data: any): string {
    // 简化实现，实际应该使用YAML库
    return JSON.stringify(data, null, 2)
  }

  /**
   * 从YAML反序列化
   * @param yaml YAML字符串
   * @returns 数据
   */
  private _deserializeFromYAML(yaml: string): any {
    // 简化实现
    return JSON.parse(yaml)
  }

  /**
   * 从二进制反序列化
   * @param binary 二进制数据
   * @returns 数据
   */
  private async _deserializeFromBinary(binary: Uint8Array): Promise<any> {
    // 简化实现
    const json = new TextDecoder().decode(binary)
    return JSON.parse(json)
  }

  /**
   * 创建JSON替换器
   * @returns 替换器函数
   */
  private _createJSONReplacer(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      // 处理特殊类型
      if (value instanceof Map) {
        return { __type: 'Map', data: Array.from(value.entries()) }
      }
      if (value instanceof Set) {
        return { __type: 'Set', data: Array.from(value) }
      }
      if (value instanceof Date) {
        return { __type: 'Date', data: value.toISOString() }
      }
      return value
    }
  }

  /**
   * 创建JSON恢复器
   * @returns 恢复器函数
   */
  private _createJSONReviver(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      if (value && typeof value === 'object' && value.__type) {
        switch (value.__type) {
          case 'Map':
            return new Map(value.data)
          case 'Set':
            return new Set(value.data)
          case 'Date':
            return new Date(value.data)
        }
      }
      return value
    }
  }

  // ========================================================================
  // 私有方法 - 数据处理
  // ========================================================================

  /**
   * 场景转模板数据
   * @param scene 场景
   * @returns 模板数据
   */
  private _sceneToTemplateData(scene: Scene): SceneTemplateData {
    const rootNodeData = scene.rootNode ? this._nodeToTemplateData(scene.rootNode) : {
      className: 'Node',
      name: 'Root',
      properties: {},
      children: []
    }

    return {
      config: {
        name: scene.name,
        description: `Serialized scene: ${scene.name}`,
        version: SceneSerializer.CURRENT_VERSION
      },
      rootNode: rootNodeData,
      sceneProperties: {
        type: scene.type,
        persistent: scene.persistent,
        autoStart: scene.autoStart
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    }
  }

  /**
   * 节点转模板数据
   * @param node 节点
   * @returns 节点模板数据
   */
  private _nodeToTemplateData(node: Node): NodeTemplateData {
    // 使用自定义序列化器（如果有）
    const customSerializer = this._customSerializers.get(node.constructor.name)
    if (customSerializer) {
      return customSerializer.serialize(node)
    }

    // 默认序列化
    const data: NodeTemplateData = {
      className: node.constructor.name,
      name: node.name,
      properties: this._extractNodeProperties(node),
      children: []
    }

    // 序列化脚本
    const script = node.getScript()
    if (script) {
      data.script = script
    }

    // 递归序列化子节点
    for (const child of node.children) {
      data.children.push(this._nodeToTemplateData(child))
    }

    return data
  }

  /**
   * 提取节点属性
   * @param node 节点
   * @returns 属性对象
   */
  private _extractNodeProperties(node: Node): Record<string, any> {
    const properties: Record<string, any> = {}

    // 基础属性
    properties.position = node.position
    properties.rotation = node.rotation
    properties.scale = node.scale
    properties.visible = node.visible

    // 其他可序列化属性可以在这里添加

    return properties
  }

  /**
   * 数据迁移
   * @param data 模板数据
   * @param version 版本
   * @param warnings 警告数组
   * @returns 迁移后的数据
   */
  private _migrateData(data: SceneTemplateData, version: string, warnings: string[]): SceneTemplateData {
    // 这里可以实现版本间的数据迁移逻辑
    return data
  }

  /**
   * 验证模板数据
   * @param data 模板数据
   */
  private _validateTemplateData(data: SceneTemplateData): void {
    if (!data.config || !data.config.name) {
      throw new Error('Invalid template data: missing config or name')
    }
    if (!data.rootNode) {
      throw new Error('Invalid template data: missing root node')
    }
  }

  /**
   * 压缩数据
   * @param data 数据
   * @returns 压缩后的数据
   */
  private async _compress(data: Uint8Array): Promise<Uint8Array> {
    // 简化实现，实际应该使用压缩算法
    return data
  }

  /**
   * 解压数据
   * @param data 压缩数据
   * @returns 解压后的数据
   */
  private async _decompress(data: Uint8Array): Promise<Uint8Array> {
    // 简化实现
    return data
  }

  /**
   * 加密数据
   * @param data 数据
   * @returns 加密后的数据
   */
  private async _encrypt(data: string | Uint8Array): Promise<Uint8Array> {
    // 简化实现，实际应该使用加密算法
    if (typeof data === 'string') {
      return new TextEncoder().encode(data)
    }
    return data
  }

  /**
   * 解密数据
   * @param data 加密数据
   * @returns 解密后的数据
   */
  private async _decrypt(data: string | Uint8Array): Promise<string | Uint8Array> {
    // 简化实现
    return data
  }

  /**
   * 注册内置序列化器
   */
  private _registerBuiltinSerializers(): void {
    // 这里可以注册内置节点类型的序列化器
  }
}
