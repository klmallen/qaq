/**
 * QAQ游戏引擎 - 反射自动序列化系统
 * 
 * 使用反射机制自动发现和序列化所有属性，无需任何手动注册
 */

// ============================================================================
// 反射工具函数
// ============================================================================

/**
 * 获取对象的所有可序列化属性
 */
function getSerializableProperties(obj: any): Map<string, any> {
  const properties = new Map()
  const visited = new Set()
  
  // 遍历原型链
  let current = obj
  while (current && current !== Object.prototype) {
    const propertyNames = Object.getOwnPropertyNames(current)
    
    for (const name of propertyNames) {
      // 跳过已访问的属性
      if (visited.has(name)) continue
      visited.add(name)
      
      // 跳过特殊属性
      if (shouldSkipProperty(name, obj[name])) continue
      
      // 推断属性类型
      const type = inferTypeFromValue(obj[name])
      
      properties.set(name, {
        name,
        type,
        value: obj[name]
      })
    }
    
    current = Object.getPrototypeOf(current)
  }
  
  return properties
}

/**
 * 判断是否应该跳过属性
 */
function shouldSkipProperty(name: string, value: any): boolean {
  // 跳过构造函数
  if (name === 'constructor') return true
  
  // 跳过方法
  if (typeof value === 'function') return true
  
  // 跳过私有属性（以_开头）
  if (name.startsWith('_')) return true
  
  // 跳过特殊属性
  const skipList = [
    'children', 'parent', 'owner', // 节点关系属性
    'object3D', 'mesh', 'material', // Three.js对象
    'signals', 'connections', // 信号系统
    'properties', 'propertyMetadata' // 属性系统
  ]
  
  if (skipList.includes(name)) return true
  
  // 跳过undefined和null
  if (value === undefined || value === null) return true
  
  return false
}

/**
 * 从值推断类型
 */
function inferTypeFromValue(value: any): string {
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  
  if (value && typeof value === 'object') {
    // 检查Vector3类型
    if ('x' in value && 'y' in value && 'z' in value && 
        typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number') {
      return 'vector3'
    }
    
    // 检查Color类型
    if ('r' in value && 'g' in value && 'b' in value && 
        typeof value.r === 'number' && typeof value.g === 'number' && typeof value.b === 'number') {
      return 'color'
    }
    
    // 检查数组
    if (Array.isArray(value)) return 'array'
  }
  
  return 'object'
}

// ============================================================================
// 反射自动序列化器
// ============================================================================

export class ReflectionAutoSerializer {
  /**
   * 完全自动序列化（无需任何注册）
   */
  static serialize(node: any): any {
    const result: any = {
      type: node.constructor.name,
      name: node.name || 'Unnamed',
      id: this.getNodeId(node),
      properties: {},
      children: []
    }
    
    // 自动发现所有可序列化属性
    const properties = getSerializableProperties(node)
    
    console.log(`🔍 自动发现 ${node.constructor.name} 的 ${properties.size} 个属性`)
    
    for (const [key, descriptor] of properties.entries()) {
      const value = descriptor.value
      
      if (!this.isDefaultValue(value, descriptor.type)) {
        result.properties[key] = this.serializeValue(value, descriptor.type)
        console.log(`  📝 序列化属性: ${key} = ${JSON.stringify(value)} (${descriptor.type})`)
      }
    }
    
    // 自动序列化子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        result.children.push(this.serialize(child))
      }
    }
    
    return result
  }
  
  /**
   * 完全自动反序列化
   */
  static deserialize(data: any, NodeClass: any): any {
    const node = new NodeClass(data.name)
    
    // 设置ID
    if (node.setInstanceId) {
      node.setInstanceId(data.id)
    }
    
    // 自动恢复所有属性
    if (data.properties) {
      for (const [key, value] of Object.entries(data.properties)) {
        try {
          // 推断目标类型
          const targetType = this.inferTargetType(key, value)
          const deserializedValue = this.deserializeValue(value, targetType)
          
          // 直接设置属性
          node[key] = deserializedValue
          console.log(`  🔄 恢复属性: ${key} = ${JSON.stringify(deserializedValue)}`)
          
        } catch (error) {
          console.warn(`⚠️ 恢复属性失败: ${key}`, error)
        }
      }
    }
    
    // 自动反序列化子节点（需要节点类型注册表）
    if (data.children && Array.isArray(data.children)) {
      for (const childData of data.children) {
        try {
          // 这里需要一个简单的类型映射
          const ChildClass = this.getNodeClass(childData.type) || NodeClass
          const child = this.deserialize(childData, ChildClass)
          
          if (node.addChild) {
            node.addChild(child)
          } else if (node.children) {
            node.children.push(child)
          }
        } catch (error) {
          console.warn(`⚠️ 反序列化子节点失败: ${childData.type}`, error)
        }
      }
    }
    
    return node
  }
  
  /**
   * 获取节点ID
   */
  private static getNodeId(node: any): string {
    if (node.getInstanceId) return node.getInstanceId()
    if (node.id) return node.id
    return `auto_${node.constructor.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 推断目标类型
   */
  private static inferTargetType(key: string, value: any): string {
    // 根据属性名推断类型
    if (key === 'position' || key === 'rotation' || key === 'scale') return 'vector3'
    if (key === 'color' || key === 'clearColor') return 'color'
    if (key === 'visible' || key === 'enabled' || key === 'castShadow') return 'boolean'
    if (key === 'fov' || key === 'near' || key === 'far' || key === 'intensity') return 'number'
    if (key === 'name' || key === 'autoplay' || key === 'materialType') return 'string'
    
    // 根据值的结构推断类型
    return inferTypeFromValue(value)
  }
  
  /**
   * 序列化值
   */
  private static serializeValue(value: any, type: string): any {
    switch (type) {
      case 'vector3':
        return { x: value.x, y: value.y, z: value.z }
      case 'color':
        return { r: value.r, g: value.g, b: value.b, a: value.a || 1 }
      case 'array':
        return value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            return this.serialize(item)
          }
          return item
        })
      default:
        return value
    }
  }
  
  /**
   * 反序列化值
   */
  private static deserializeValue(value: any, type: string): any {
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
   * 检查是否为默认值
   */
  private static isDefaultValue(value: any, type: string): boolean {
    switch (type) {
      case 'string': return value === '' || value === 'Unnamed'
      case 'number': return value === 0
      case 'boolean': return value === false
      case 'vector3': 
        return value && value.x === 0 && value.y === 0 && value.z === 0
      case 'array':
        return Array.isArray(value) && value.length === 0
      default: 
        return false
    }
  }
  
  /**
   * 简单的节点类型映射
   */
  private static getNodeClass(typeName: string): any {
    // 这里可以扩展为完整的类型注册表
    const typeMap: Record<string, any> = {
      'ReflectionNode3D': ReflectionNode3D,
      'ReflectionCamera3D': ReflectionCamera3D
    }
    
    return typeMap[typeName]
  }
  
  /**
   * 分析节点的序列化信息
   */
  static analyzeNode(node: any): {
    className: string
    propertyCount: number
    properties: Array<{ name: string; type: string; value: any }>
    estimatedSize: number
  } {
    const properties = getSerializableProperties(node)
    const propertyList = Array.from(properties.entries()).map(([name, desc]) => ({
      name,
      type: desc.type,
      value: desc.value
    }))
    
    const serialized = this.serialize(node)
    const estimatedSize = JSON.stringify(serialized).length
    
    return {
      className: node.constructor.name,
      propertyCount: properties.size,
      properties: propertyList,
      estimatedSize
    }
  }
}

// ============================================================================
// 测试节点类（无需任何装饰器或注册）
// ============================================================================

/**
 * 普通的节点类，无需任何特殊处理
 */
export class ReflectionNode3D {
  name: string = 'ReflectionNode3D'
  position = { x: 0, y: 0, z: 0 }
  rotation = { x: 0, y: 0, z: 0 }
  scale = { x: 1, y: 1, z: 1 }
  visible: boolean = true
  children: ReflectionNode3D[] = []
  
  constructor(name?: string) {
    if (name) this.name = name
  }
  
  addChild(child: ReflectionNode3D): void {
    this.children.push(child)
  }
  
  getInstanceId(): string {
    return `reflection_${this.name}_${Date.now()}`
  }
}

/**
 * 相机节点，继承自ReflectionNode3D
 */
export class ReflectionCamera3D extends ReflectionNode3D {
  fov: number = 75
  near: number = 0.1
  far: number = 1000
  clearColor = { r: 0.5, g: 0.5, b: 0.5, a: 1 }
  isCurrent: boolean = false
  
  constructor(name: string = 'ReflectionCamera3D') {
    super(name)
  }
  
  makeCurrent(): void {
    this.isCurrent = true
  }
}

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试反射自动序列化
 */
export function testReflectionAutoSerialization(): void {
  console.log('🧪 测试反射自动序列化...')
  
  // 创建测试场景（无需任何注册！）
  const root = new ReflectionNode3D('Root')
  root.position = { x: 1, y: 2, z: 3 }
  root.visible = true
  
  const camera = new ReflectionCamera3D('MainCamera')
  camera.position = { x: 5, y: 5, z: 5 }
  camera.fov = 60
  camera.makeCurrent()
  
  root.addChild(camera)
  
  try {
    // 分析节点
    console.log('📊 节点分析:')
    const rootAnalysis = ReflectionAutoSerializer.analyzeNode(root)
    console.log('Root节点:', rootAnalysis)
    
    const cameraAnalysis = ReflectionAutoSerializer.analyzeNode(camera)
    console.log('Camera节点:', cameraAnalysis)
    
    // 序列化
    const serialized = ReflectionAutoSerializer.serialize(root)
    console.log('✅ 反射序列化成功')
    console.log('序列化数据大小:', JSON.stringify(serialized).length, '字节')
    
    // 反序列化
    const restored = ReflectionAutoSerializer.deserialize(serialized, ReflectionNode3D)
    console.log('✅ 反射反序列化成功')
    
    // 验证
    console.log('验证结果:')
    console.log('- 根节点位置:', restored.position)
    console.log('- 根节点可见性:', restored.visible)
    console.log('- 子节点数量:', restored.children.length)
    
    if (restored.children.length > 0) {
      const restoredCamera = restored.children[0] as ReflectionCamera3D
      console.log('- 相机FOV:', restoredCamera.fov)
      console.log('- 相机位置:', restoredCamera.position)
      console.log('- 相机当前状态:', restoredCamera.isCurrent)
    }
    
  } catch (error) {
    console.error('❌ 反射序列化测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testReflectionAutoSerialization = testReflectionAutoSerialization
    (window as any).ReflectionAutoSerializer = ReflectionAutoSerializer
    (window as any).ReflectionNode3D = ReflectionNode3D
    (window as any).ReflectionCamera3D = ReflectionCamera3D
    console.log('💡 运行 window.testReflectionAutoSerialization() 测试反射自动序列化')
  } catch (error) {
    console.warn('⚠️ 无法设置全局反射函数:', error)
  }
}

export default ReflectionAutoSerializer
