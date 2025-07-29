/**
 * QAQ游戏引擎 - 基于Node反射的场景序列化器
 * 
 * 利用Node基类的反射序列化能力，实现零配置的场景序列化
 */

import { Node, Scene, Node3D, MeshInstance3D, Camera3D, DirectionalLight3D, AnimationPlayer } from '../index'

// ============================================================================
// 序列化数据接口
// ============================================================================

export interface NodeReflectionSerializedScene {
  version: string
  metadata: {
    name: string
    created: number
    modified: number
    serializer: string
  }
  root: any // 使用Node.serialize()的返回格式
}

// ============================================================================
// 基于Node反射的场景序列化器
// ============================================================================

export class NodeReflectionSerializer {
  private nodeTypeRegistry: Map<string, typeof Node> = new Map()

  constructor() {
    this.initialize()
  }

  /**
   * 初始化序列化器
   */
  private initialize(): void {
    // 注册节点类型（用于反序列化时创建正确的类实例）
    this.registerNodeType('Node', Node)
    this.registerNodeType('Scene', Scene)
    this.registerNodeType('Node3D', Node3D)
    this.registerNodeType('MeshInstance3D', MeshInstance3D)
    this.registerNodeType('Camera3D', Camera3D)
    this.registerNodeType('DirectionalLight3D', DirectionalLight3D)
    this.registerNodeType('AnimationPlayer', AnimationPlayer)

    console.log('✅ Node反射序列化器初始化完成')
  }

  /**
   * 注册节点类型
   */
  registerNodeType(typeName: string, NodeClass: typeof Node): void {
    this.nodeTypeRegistry.set(typeName, NodeClass)
    console.log(`📝 注册节点类型: ${typeName}`)
  }

  /**
   * 序列化场景（使用Node的反射能力）
   */
  async serialize(scene: Scene): Promise<NodeReflectionSerializedScene> {
    console.log(`📦 开始反射序列化场景: ${scene.name}`)

    // 直接使用Node的serialize方法
    const rootData = scene.serialize()

    const sceneData: NodeReflectionSerializedScene = {
      version: '3.0.0', // 反射序列化版本
      metadata: {
        name: scene.name,
        created: Date.now(),
        modified: Date.now(),
        serializer: 'NodeReflectionSerializer'
      },
      root: rootData
    }

    console.log(`✅ 反射序列化完成: ${scene.name}`)
    console.log(`📊 序列化统计: ${this.countNodes(rootData)} 个节点`)
    
    return sceneData
  }

  /**
   * 反序列化场景（使用Node的反射能力）
   */
  async deserialize(sceneData: NodeReflectionSerializedScene): Promise<Scene> {
    console.log(`📦 开始反射反序列化场景: ${sceneData.metadata.name}`)

    // 获取根节点的类型
    const rootType = sceneData.root.type
    const NodeClass = this.nodeTypeRegistry.get(rootType)
    
    if (!NodeClass) {
      throw new Error(`未注册的节点类型: ${rootType}`)
    }

    // 使用Node的静态deserialize方法
    const scene = this.deserializeNodeRecursive(sceneData.root) as Scene

    console.log(`✅ 反射反序列化完成: ${scene.name}`)
    return scene
  }

  /**
   * 递归反序列化节点
   */
  private deserializeNodeRecursive(data: any): Node {
    const NodeClass = this.nodeTypeRegistry.get(data.type)
    
    if (!NodeClass) {
      console.warn(`⚠️ 未注册的节点类型: ${data.type}，使用Node基类`)
      return Node.deserialize(data, Node)
    }

    // 创建节点实例
    const node = new NodeClass(data.name)
    node.setInstanceId(data.id)

    // 恢复属性
    if (data.properties) {
      for (const [key, value] of Object.entries(data.properties)) {
        try {
          const deserializedValue = this.deserializeValue(value, this.inferTargetType(key, value))
          ;(node as any)[key] = deserializedValue
        } catch (error) {
          console.warn(`⚠️ 恢复属性失败: ${key}`, error)
        }
      }
    }

    // 递归反序列化子节点
    if (data.children && Array.isArray(data.children)) {
      for (const childData of data.children) {
        try {
          const child = this.deserializeNodeRecursive(childData)
          node.addChild(child)
        } catch (error) {
          console.warn(`⚠️ 反序列化子节点失败: ${childData.type}`, error)
        }
      }
    }

    // 特殊处理：相机当前状态
    if (node instanceof Camera3D && data.properties.isCurrent) {
      setTimeout(() => node.makeCurrent(), 0)
    }

    return node
  }

  /**
   * 推断目标类型
   */
  private inferTargetType(key: string, value: any): string {
    // 根据属性名推断类型
    if (key === 'position' || key === 'rotation' || key === 'scale') return 'vector3'
    if (key === 'color' || key === 'clearColor') return 'color'
    if (key === 'visible' || key === 'enabled' || key === 'castShadow') return 'boolean'
    if (key === 'fov' || key === 'near' || key === 'far' || key === 'intensity') return 'number'
    if (key === 'name' || key === 'autoplay' || key === 'materialType') return 'string'
    
    // 根据值的结构推断类型
    if (value && typeof value === 'object') {
      if ('x' in value && 'y' in value && 'z' in value) return 'vector3'
      if ('r' in value && 'g' in value && 'b' in value) return 'color'
      if (Array.isArray(value)) return 'array'
    }
    
    return typeof value
  }

  /**
   * 反序列化值
   */
  private deserializeValue(value: any, type: string): any {
    switch (type) {
      case 'vector3':
      case 'color':
        return value // 已经是正确格式
      case 'array':
        return Array.isArray(value) ? value : []
      default:
        return value
    }
  }

  /**
   * 计算节点数量
   */
  private countNodes(nodeData: any): number {
    let count = 1
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        count += this.countNodes(child)
      }
    }
    return count
  }

  /**
   * 获取序列化统计信息
   */
  getSerializationStats(scene: Scene): {
    nodeCount: number
    totalProperties: number
    supportedTypes: string[]
    dataSize: number
  } {
    let nodeCount = 0
    let totalProperties = 0
    const supportedTypes = new Set<string>()

    const analyzeNode = (node: Node) => {
      nodeCount++
      supportedTypes.add(node.constructor.name)
      
      const properties = node.getSerializableProperties()
      totalProperties += properties.size

      for (const child of node.children) {
        analyzeNode(child)
      }
    }

    analyzeNode(scene)

    // 估算数据大小
    const serialized = scene.serialize()
    const dataSize = JSON.stringify(serialized).length

    return {
      nodeCount,
      totalProperties,
      supportedTypes: Array.from(supportedTypes),
      dataSize
    }
  }

  /**
   * 验证序列化完整性
   */
  async validateSerialization(scene: Scene): Promise<{
    success: boolean
    issues: string[]
    stats: any
  }> {
    const issues: string[] = []

    try {
      // 序列化
      const serialized = await this.serialize(scene)
      
      // 反序列化
      const restored = await this.deserialize(serialized)
      
      // 基本验证
      if (restored.name !== scene.name) {
        issues.push(`场景名称不匹配: ${scene.name} vs ${restored.name}`)
      }
      
      if (restored.children.length !== scene.children.length) {
        issues.push(`子节点数量不匹配: ${scene.children.length} vs ${restored.children.length}`)
      }

      // 获取统计信息
      const stats = this.getSerializationStats(scene)

      return {
        success: issues.length === 0,
        issues,
        stats
      }

    } catch (error) {
      issues.push(`序列化验证异常: ${error}`)
      return {
        success: false,
        issues,
        stats: null
      }
    }
  }
}

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试Node反射序列化
 */
export async function testNodeReflectionSerialization(): Promise<void> {
  console.log('🧪 测试Node反射序列化...')

  const serializer = new NodeReflectionSerializer()

  // 创建测试场景
  const scene = new Scene('NodeReflectionTestScene')
  
  // 添加相机
  const camera = new Camera3D('MainCamera')
  camera.position = { x: 5, y: 5, z: 5 }
  camera.fov = 60
  camera.makeCurrent()
  scene.addChild(camera)

  // 添加光源
  const light = new DirectionalLight3D('SunLight')
  light.position = { x: 10, y: 10, z: 5 }
  light.intensity = 1.5
  light.color = { r: 1, g: 0.9, b: 0.8 }
  scene.addChild(light)

  // 添加网格
  const mesh = new MeshInstance3D('TestMesh')
  mesh.position = { x: 0, y: 0, z: 0 }
  mesh.scale = { x: 0.01, y: 0.01, z: 0.01 }
  mesh.castShadow = true
  scene.addChild(mesh)

  // 添加动画播放器
  const animPlayer = new AnimationPlayer('Animator')
  animPlayer.setProperty('autoplay', 'idle')
  mesh.addChild(animPlayer)

  try {
    // 获取序列化前的统计信息
    const beforeStats = serializer.getSerializationStats(scene)
    console.log('📊 序列化前统计:', beforeStats)

    // 序列化
    const serialized = await serializer.serialize(scene)
    console.log('✅ Node反射序列化成功')
    console.log('序列化数据大小:', JSON.stringify(serialized).length, '字节')

    // 反序列化
    const restored = await serializer.deserialize(serialized)
    console.log('✅ Node反射反序列化成功')

    // 验证完整性
    const validation = await serializer.validateSerialization(scene)
    console.log('📋 序列化验证结果:', validation)

    // 详细验证
    console.log('🔍 详细验证:')
    const restoredCamera = restored.findChild('MainCamera') as Camera3D
    const restoredLight = restored.findChild('SunLight') as DirectionalLight3D
    const restoredMesh = restored.findChild('TestMesh') as MeshInstance3D
    const restoredAnimPlayer = restoredMesh?.findChild('Animator') as AnimationPlayer

    console.log('- 相机FOV:', restoredCamera?.fov, '(期望: 60)')
    console.log('- 相机位置:', restoredCamera?.position)
    console.log('- 光源强度:', restoredLight?.intensity, '(期望: 1.5)')
    console.log('- 光源颜色:', restoredLight?.color)
    console.log('- 网格阴影:', restoredMesh?.castShadow, '(期望: true)')
    console.log('- 网格缩放:', restoredMesh?.scale)
    console.log('- 动画自动播放:', restoredAnimPlayer?.getProperty('autoplay'), '(期望: idle)')

    if (validation.success) {
      console.log('🎉 Node反射序列化测试完全通过！')
    } else {
      console.warn('⚠️ 发现问题:', validation.issues)
    }

  } catch (error) {
    console.error('❌ Node反射序列化测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).NodeReflectionSerializer = NodeReflectionSerializer
    (window as any).testNodeReflectionSerialization = testNodeReflectionSerialization
    console.log('💡 运行 window.testNodeReflectionSerialization() 测试Node反射序列化')
  } catch (error) {
    console.warn('⚠️ 无法设置全局序列化函数:', error)
  }
}

export default NodeReflectionSerializer
