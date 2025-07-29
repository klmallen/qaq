/**
 * QAQ游戏引擎 - 简化场景序列化器
 * 
 * 基于自动属性注册系统的简化序列化器，类似Godot的方式
 */

import Node from '../nodes/Node'
import Scene from '../nodes/Scene'
import Node3D from '../nodes/Node3D'
import MeshInstance3D from '../nodes/MeshInstance3D'
import Camera3D from '../nodes/Camera3D'
import DirectionalLight3D from '../nodes/DirectionalLight3D'
import AnimationPlayer from '../nodes/animation/AnimationPlayer'
import { AutoSerializer } from './AutoSerializer'
import { registerAllNodeProperties, getNodeSerializableProperties } from './NodePropertyRegistry'

// ============================================================================
// 序列化数据接口
// ============================================================================

export interface SimpleSerializedNode {
  type: string
  name: string
  id: string
  properties: Record<string, any>
  children: SimpleSerializedNode[]
}

export interface SimpleSerializedScene {
  version: string
  metadata: {
    name: string
    created: number
    modified: number
  }
  root: SimpleSerializedNode
}

// ============================================================================
// 简化场景序列化器
// ============================================================================

export class SimpleSceneSerializer {
  private nodeTypeRegistry: Map<string, typeof Node> = new Map()
  private initialized: boolean = false

  constructor() {
    this.initialize()
  }

  /**
   * 初始化序列化器
   */
  private initialize(): void {
    if (this.initialized) return

    // 注册所有节点属性
    registerAllNodeProperties()

    // 注册节点类型
    this.registerNodeType('Node', Node)
    this.registerNodeType('Scene', Scene)
    this.registerNodeType('Node3D', Node3D)
    this.registerNodeType('MeshInstance3D', MeshInstance3D)
    this.registerNodeType('Camera3D', Camera3D)
    this.registerNodeType('DirectionalLight3D', DirectionalLight3D)
    this.registerNodeType('AnimationPlayer', AnimationPlayer)

    this.initialized = true
    console.log('✅ 简化序列化器初始化完成')
  }

  /**
   * 注册节点类型
   */
  registerNodeType(typeName: string, NodeClass: typeof Node): void {
    this.nodeTypeRegistry.set(typeName, NodeClass)
  }

  /**
   * 序列化场景
   */
  async serialize(scene: Scene): Promise<SimpleSerializedScene> {
    console.log(`📦 开始序列化场景: ${scene.name}`)

    const rootData = this.serializeNode(scene)

    const sceneData: SimpleSerializedScene = {
      version: '2.0.0', // 新版本，使用自动序列化
      metadata: {
        name: scene.name,
        created: Date.now(),
        modified: Date.now()
      },
      root: rootData
    }

    console.log(`✅ 场景序列化完成: ${scene.name}`)
    return sceneData
  }

  /**
   * 反序列化场景
   */
  async deserialize(sceneData: SimpleSerializedScene): Promise<Scene> {
    console.log(`📦 开始反序列化场景: ${sceneData.metadata.name}`)

    const scene = this.deserializeNode(sceneData.root) as Scene

    console.log(`✅ 场景反序列化完成: ${scene.name}`)
    return scene
  }

  /**
   * 序列化单个节点（自动化）
   */
  private serializeNode(node: Node): SimpleSerializedNode {
    const nodeClass = node.constructor as any
    const properties = getNodeSerializableProperties(nodeClass)

    const result: SimpleSerializedNode = {
      type: node.constructor.name,
      name: node.name,
      id: node.getInstanceId(),
      properties: {},
      children: []
    }

    // 自动序列化所有注册的属性
    for (const [key, descriptor] of properties.entries()) {
      if (descriptor.serializable) {
        const value = this.getPropertyValue(node, descriptor)
        if (value !== undefined && !this.isDefaultValue(value, descriptor)) {
          result.properties[key] = this.serializeValue(value, descriptor.type)
        }
      }
    }

    // 序列化子节点
    for (const child of node.children) {
      result.children.push(this.serializeNode(child))
    }

    return result
  }

  /**
   * 反序列化单个节点（自动化）
   */
  private deserializeNode(data: SimpleSerializedNode): Node {
    const NodeClass = this.nodeTypeRegistry.get(data.type)
    
    if (!NodeClass) {
      throw new Error(`未注册的节点类型: ${data.type}`)
    }

    const node = new NodeClass(data.name)
    node.setInstanceId(data.id)

    const nodeClass = NodeClass as any
    const properties = getNodeSerializableProperties(nodeClass)

    // 自动反序列化所有属性
    if (data.properties) {
      for (const [key, descriptor] of properties.entries()) {
        if (descriptor.serializable && data.properties[key] !== undefined) {
          const value = this.deserializeValue(data.properties[key], descriptor.type)
          this.setPropertyValue(node, descriptor, value)
        }
      }
    }

    // 反序列化子节点
    for (const childData of data.children) {
      const child = this.deserializeNode(childData)
      node.addChild(child)
    }

    // 特殊处理：相机当前状态
    if (node instanceof Camera3D && data.properties.isCurrent) {
      setTimeout(() => node.makeCurrent(), 0)
    }

    return node
  }

  /**
   * 获取属性值
   */
  private getPropertyValue(node: Node, descriptor: any): any {
    // 优先使用getter方法
    if (descriptor.getter && typeof (node as any)[descriptor.getter] === 'function') {
      return (node as any)[descriptor.getter]()
    }

    // 直接访问属性
    return (node as any)[descriptor.name]
  }

  /**
   * 设置属性值
   */
  private setPropertyValue(node: Node, descriptor: any, value: any): void {
    try {
      // 优先使用setter方法
      if (descriptor.setter && typeof (node as any)[descriptor.setter] === 'function') {
        (node as any)[descriptor.setter](value)
        return
      }

      // 直接设置属性
      (node as any)[descriptor.name] = value
    } catch (error) {
      console.warn(`⚠️ 设置属性失败: ${descriptor.name} = ${value}`, error)
    }
  }

  /**
   * 序列化值
   */
  private serializeValue(value: any, type: string): any {
    switch (type) {
      case 'vector3':
        return value ? { x: value.x, y: value.y, z: value.z } : null
      case 'color':
        return value ? { r: value.r, g: value.g, b: value.b, a: value.a || 1 } : null
      case 'object':
        if (value && typeof value.serialize === 'function') {
          return value.serialize()
        }
        return value
      default:
        return value
    }
  }

  /**
   * 反序列化值
   */
  private deserializeValue(value: any, type: string): any {
    switch (type) {
      case 'vector3':
      case 'color':
        return value // 已经是正确格式
      case 'object':
        // 这里可以添加复杂对象的反序列化逻辑
        return value
      default:
        return value
    }
  }

  /**
   * 检查是否为默认值
   */
  private isDefaultValue(value: any, descriptor: any): boolean {
    if (descriptor.defaultValue !== undefined) {
      return value === descriptor.defaultValue
    }

    // 一些常见的默认值检查
    switch (descriptor.type) {
      case 'vector3':
        return value && value.x === 0 && value.y === 0 && value.z === 0
      case 'boolean':
        return value === false
      case 'number':
        return value === 0
      case 'string':
        return value === ''
      default:
        return false
    }
  }

  /**
   * 获取序列化统计信息
   */
  getSerializationStats(scene: Scene): {
    nodeCount: number
    propertyCount: number
    supportedTypes: string[]
    unsupportedNodes: string[]
  } {
    let nodeCount = 0
    let propertyCount = 0
    const supportedTypes = new Set<string>()
    const unsupportedNodes: string[] = []

    const countNode = (node: Node) => {
      nodeCount++
      const typeName = node.constructor.name
      
      if (this.nodeTypeRegistry.has(typeName)) {
        supportedTypes.add(typeName)
        const properties = getNodeSerializableProperties(node.constructor as any)
        propertyCount += properties.size
      } else {
        unsupportedNodes.push(`${node.name} (${typeName})`)
      }

      for (const child of node.children) {
        countNode(child)
      }
    }

    countNode(scene)

    return {
      nodeCount,
      propertyCount,
      supportedTypes: Array.from(supportedTypes),
      unsupportedNodes
    }
  }
}

// ============================================================================
// 使用示例和测试
// ============================================================================

/**
 * 测试简化序列化器
 */
export async function testSimpleSerializer(): Promise<void> {
  console.log('🧪 测试简化序列化器...')

  const serializer = new SimpleSceneSerializer()

  // 创建测试场景
  const scene = new Scene('TestScene')
  
  const camera = new Camera3D('MainCamera')
  camera.position = { x: 5, y: 5, z: 5 }
  camera.fov = 60
  camera.makeCurrent()
  scene.addChild(camera)

  const light = new DirectionalLight3D('SunLight')
  light.position = { x: 10, y: 10, z: 5 }
  light.intensity = 1.5
  light.color = { r: 1, g: 0.9, b: 0.8 }
  scene.addChild(light)

  const mesh = new MeshInstance3D('TestMesh')
  mesh.position = { x: 0, y: 0, z: 0 }
  mesh.scale = { x: 0.01, y: 0.01, z: 0.01 }
  mesh.castShadow = true
  scene.addChild(mesh)

  try {
    // 序列化
    const serializedData = await serializer.serialize(scene)
    console.log('✅ 序列化成功')
    console.log('序列化数据大小:', JSON.stringify(serializedData).length, '字节')

    // 反序列化
    const restoredScene = await serializer.deserialize(serializedData)
    console.log('✅ 反序列化成功')

    // 验证
    const stats = serializer.getSerializationStats(restoredScene)
    console.log('📊 序列化统计:', stats)

    // 检查关键属性
    const restoredCamera = restoredScene.findChild('MainCamera') as Camera3D
    const restoredLight = restoredScene.findChild('SunLight') as DirectionalLight3D
    const restoredMesh = restoredScene.findChild('TestMesh') as MeshInstance3D

    console.log('验证结果:')
    console.log('- 相机FOV:', restoredCamera?.fov, '(期望: 60)')
    console.log('- 光源强度:', restoredLight?.intensity, '(期望: 1.5)')
    console.log('- 网格阴影:', restoredMesh?.castShadow, '(期望: true)')

  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).SimpleSceneSerializer = SimpleSceneSerializer
    (window as any).testSimpleSerializer = testSimpleSerializer
    console.log('💡 在控制台中运行 window.testSimpleSerializer() 来测试简化序列化器')
  } catch (error) {
    console.warn('⚠️ 无法设置全局简化序列化函数:', error)
  }
}

export default SimpleSceneSerializer
