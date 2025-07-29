/**
 * QAQ 游戏引擎 AST 序列化系统
 * 用于将场景和节点序列化为 AST 格式，支持项目保存和加载
 */

import type { Node } from '../nodes/Node'
import type { SceneTree } from '../scenes/SceneTree'
import type { PropertyMetadata } from '../decorators/PropertyDecorators'
import { PropertyMetadataRegistry } from '../decorators/PropertyDecorators'

// ============================================================================
// AST 节点类型定义
// ============================================================================

export interface ASTNode {
  type: 'scene' | 'node' | 'property' | 'signal' | 'script'
  name: string
  className: string
  id: string
  properties: Record<string, any>
  children: ASTNode[]
  metadata?: Record<string, any>
}

export interface ASTScene {
  version: string
  name: string
  type: '2d' | '3d' | 'ui'
  root: ASTNode | null
  metadata: {
    created: string
    modified: string
    author?: string
    description?: string
  }
}

export interface ASTProject {
  version: string
  name: string
  scenes: string[]  // 场景文件路径列表
  mainScene?: string
  settings: {
    renderSettings: Record<string, any>
    inputMap: Record<string, any>
    autoloads: Record<string, string>
  }
  metadata: {
    created: string
    modified: string
    author?: string
    description?: string
  }
}

// ============================================================================
// AST 序列化器
// ============================================================================

export class ASTSerializer {
  private static readonly VERSION = '1.0.0'
  
  /**
   * 将场景树序列化为 AST
   */
  static serializeScene(sceneTree: SceneTree, sceneName: string, sceneType: '2d' | '3d' | 'ui' = '3d'): ASTScene {
    const now = new Date().toISOString()
    
    return {
      version: this.VERSION,
      name: sceneName,
      type: sceneType,
      root: sceneTree.root ? this.serializeNode(sceneTree.root) : null,
      metadata: {
        created: now,
        modified: now
      }
    }
  }
  
  /**
   * 将节点序列化为 AST 节点
   */
  static serializeNode(node: Node): ASTNode {
    const astNode: ASTNode = {
      type: 'node',
      name: node.name,
      className: node.className,
      id: node.id,
      properties: {},
      children: []
    }
    
    // 序列化属性
    astNode.properties = this.serializeNodeProperties(node)
    
    // 序列化子节点
    for (const child of node.children) {
      astNode.children.push(this.serializeNode(child))
    }
    
    return astNode
  }
  
  /**
   * 序列化节点属性
   */
  static serializeNodeProperties(node: Node): Record<string, any> {
    const properties: Record<string, any> = {}
    const constructor = node.constructor as any
    
    // 获取属性元数据
    const propertyMetadata = PropertyMetadataRegistry.getClassProperties(constructor)
    
    // 序列化每个属性
    for (const [propertyName, metadata] of propertyMetadata) {
      if (this.shouldSerializeProperty(metadata)) {
        const value = this.getPropertyValue(node, propertyName)
        if (value !== undefined) {
          properties[propertyName] = this.serializePropertyValue(value, metadata.type)
        }
      }
    }
    
    return properties
  }
  
  /**
   * 获取节点属性值
   */
  private static getPropertyValue(node: Node, propertyName: string): any {
    // 尝试直接访问属性
    if (propertyName in node) {
      return (node as any)[propertyName]
    }
    
    // 尝试通过 getter 访问
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), propertyName)
    if (descriptor && descriptor.get) {
      return descriptor.get.call(node)
    }
    
    // 尝试通过属性系统访问
    if (node.hasProperty && node.hasProperty(propertyName)) {
      return node.getProperty(propertyName)
    }
    
    return undefined
  }
  
  /**
   * 序列化属性值
   */
  private static serializePropertyValue(value: any, type: string): any {
    switch (type) {
      case 'vector2':
      case 'vector3':
      case 'vector4':
        return { ...value } // 复制向量对象
      
      case 'color':
        return typeof value === 'object' ? { ...value } : value
      
      case 'node_path':
        return value?.toString() || value
      
      case 'array':
        return Array.isArray(value) ? [...value] : value
      
      case 'dictionary':
        return typeof value === 'object' ? { ...value } : value
      
      default:
        return value
    }
  }
  
  /**
   * 判断属性是否应该被序列化
   */
  private static shouldSerializeProperty(metadata: PropertyMetadata): boolean {
    // 检查 usage 标志
    if (metadata.usage !== undefined) {
      const STORAGE = 1 // PropertyUsage.STORAGE
      return (metadata.usage & STORAGE) !== 0
    }
    
    return true // 默认序列化
  }
  
  /**
   * 序列化项目配置
   */
  static serializeProject(projectName: string, scenes: string[], settings: any = {}): ASTProject {
    const now = new Date().toISOString()
    
    return {
      version: this.VERSION,
      name: projectName,
      scenes,
      settings: {
        renderSettings: {},
        inputMap: {},
        autoloads: {},
        ...settings
      },
      metadata: {
        created: now,
        modified: now
      }
    }
  }
}

// ============================================================================
// AST 反序列化器
// ============================================================================

export class ASTDeserializer {
  /**
   * 从 AST 反序列化场景
   */
  static async deserializeScene(astScene: ASTScene): Promise<SceneTree> {
    const sceneTree = new SceneTree()
    
    if (astScene.root) {
      const rootNode = await this.deserializeNode(astScene.root)
      sceneTree.setRoot(rootNode)
    }
    
    return sceneTree
  }
  
  /**
   * 从 AST 反序列化节点
   */
  static async deserializeNode(astNode: ASTNode): Promise<Node> {
    // 动态导入节点类
    const NodeClass = await this.getNodeClass(astNode.className)
    
    // 创建节点实例
    const node = new NodeClass(astNode.name)
    
    // 设置属性
    await this.deserializeNodeProperties(node, astNode.properties)
    
    // 递归创建子节点
    for (const childAst of astNode.children) {
      const childNode = await this.deserializeNode(childAst)
      node.addChild(childNode)
    }
    
    return node
  }
  
  /**
   * 反序列化节点属性
   */
  static async deserializeNodeProperties(node: Node, properties: Record<string, any>): Promise<void> {
    for (const [propertyName, value] of Object.entries(properties)) {
      try {
        // 尝试直接设置属性
        if (propertyName in node) {
          (node as any)[propertyName] = value
        }
        // 尝试通过属性系统设置
        else if (node.setProperty && node.hasProperty(propertyName)) {
          node.setProperty(propertyName, value)
        }
      } catch (error) {
        console.warn(`Failed to set property "${propertyName}" on node "${node.name}":`, error)
      }
    }
  }
  
  /**
   * 获取节点类构造函数
   */
  private static async getNodeClass(className: string): Promise<any> {
    try {
      // 动态导入节点类
      const module = await import(`../nodes/${className}`)
      return module.default || module[className]
    } catch (error) {
      console.warn(`Failed to import node class "${className}", using base Node class`)
      const { default: Node } = await import('../nodes/Node')
      return Node
    }
  }
}

// ============================================================================
// 文件系统接口
// ============================================================================

export interface FileSystemAdapter {
  writeFile(path: string, content: string): Promise<void>
  readFile(path: string): Promise<string>
  exists(path: string): Promise<boolean>
  mkdir(path: string): Promise<void>
  readdir(path: string): Promise<string[]>
}

// ============================================================================
// 项目管理器
// ============================================================================

export class ProjectManager {
  private fileSystem: FileSystemAdapter
  private projectPath: string = ''
  private projectConfig: ASTProject | null = null
  
  constructor(fileSystem: FileSystemAdapter) {
    this.fileSystem = fileSystem
  }
  
  /**
   * 创建新项目
   */
  async createProject(projectPath: string, projectName: string): Promise<void> {
    this.projectPath = projectPath
    
    // 创建项目目录结构
    await this.fileSystem.mkdir(`${projectPath}/scenes`)
    await this.fileSystem.mkdir(`${projectPath}/scripts`)
    await this.fileSystem.mkdir(`${projectPath}/assets`)
    
    // 创建项目配置
    this.projectConfig = ASTSerializer.serializeProject(projectName, [])
    await this.saveProjectConfig()
    
    // 创建默认场景
    await this.createDefaultScene()
  }
  
  /**
   * 加载项目
   */
  async loadProject(projectPath: string): Promise<ASTProject> {
    this.projectPath = projectPath
    
    const configContent = await this.fileSystem.readFile(`${projectPath}/project.qaq`)
    this.projectConfig = JSON.parse(configContent)
    
    return this.projectConfig
  }
  
  /**
   * 保存场景
   */
  async saveScene(sceneName: string, sceneTree: SceneTree, sceneType: '2d' | '3d' | 'ui' = '3d'): Promise<void> {
    const astScene = ASTSerializer.serializeScene(sceneTree, sceneName, sceneType)
    const sceneContent = JSON.stringify(astScene, null, 2)
    const scenePath = `${this.projectPath}/scenes/${sceneName}.tscn`
    
    await this.fileSystem.writeFile(scenePath, sceneContent)
    
    // 更新项目配置
    if (this.projectConfig && !this.projectConfig.scenes.includes(`scenes/${sceneName}.tscn`)) {
      this.projectConfig.scenes.push(`scenes/${sceneName}.tscn`)
      await this.saveProjectConfig()
    }
  }
  
  /**
   * 加载场景
   */
  async loadScene(sceneName: string): Promise<SceneTree> {
    const scenePath = `${this.projectPath}/scenes/${sceneName}.tscn`
    const sceneContent = await this.fileSystem.readFile(scenePath)
    const astScene: ASTScene = JSON.parse(sceneContent)
    
    return ASTDeserializer.deserializeScene(astScene)
  }
  
  /**
   * 保存项目配置
   */
  private async saveProjectConfig(): Promise<void> {
    if (this.projectConfig) {
      const configContent = JSON.stringify(this.projectConfig, null, 2)
      await this.fileSystem.writeFile(`${this.projectPath}/project.qaq`, configContent)
    }
  }
  
  /**
   * 创建默认场景
   */
  private async createDefaultScene(): Promise<void> {
    const sceneTree = new SceneTree()
    await this.saveScene('Main', sceneTree, '3d')
    
    if (this.projectConfig) {
      this.projectConfig.mainScene = 'scenes/Main.tscn'
      await this.saveProjectConfig()
    }
  }
}
