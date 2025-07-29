/**
 * QAQ游戏引擎 - 装饰器自动序列化系统
 * 
 * 使用装饰器实现完全自动的属性注册和序列化
 */

// ============================================================================
// 装饰器定义
// ============================================================================

/**
 * 可序列化属性装饰器
 */
export function Serializable(type?: 'string' | 'number' | 'boolean' | 'vector3' | 'color' | 'object') {
  return function (target: any, propertyKey: string) {
    // 确保类有属性注册表
    if (!target.constructor._autoSerializableProperties) {
      target.constructor._autoSerializableProperties = new Map()
    }
    
    // 自动推断类型
    const inferredType = type || inferPropertyType(target, propertyKey)
    
    target.constructor._autoSerializableProperties.set(propertyKey, {
      name: propertyKey,
      type: inferredType,
      serializable: true
    })
    
    console.log(`🏷️ 自动注册属性: ${target.constructor.name}.${propertyKey} (${inferredType})`)
  }
}

/**
 * 可序列化类装饰器
 */
export function SerializableClass(target: any) {
  // 标记类为可序列化
  target._isSerializableClass = true
  
  // 自动扫描所有属性
  autoScanProperties(target)
  
  console.log(`📦 自动注册类: ${target.name}`)
  return target
}

/**
 * 推断属性类型
 */
function inferPropertyType(target: any, propertyKey: string): string {
  // 检查属性的初始值来推断类型
  const prototype = target.constructor.prototype
  const descriptor = Object.getOwnPropertyDescriptor(prototype, propertyKey)
  
  if (descriptor && descriptor.value !== undefined) {
    const value = descriptor.value
    
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    
    // 检查是否是Vector3类型
    if (value && typeof value === 'object' && 'x' in value && 'y' in value && 'z' in value) {
      return 'vector3'
    }
    
    // 检查是否是Color类型
    if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
      return 'color'
    }
  }
  
  // 默认为object类型
  return 'object'
}

/**
 * 自动扫描类的所有属性
 */
function autoScanProperties(target: any) {
  const prototype = target.prototype
  const propertyNames = Object.getOwnPropertyNames(prototype)
  
  for (const propertyName of propertyNames) {
    // 跳过构造函数和方法
    if (propertyName === 'constructor' || typeof prototype[propertyName] === 'function') {
      continue
    }
    
    // 跳过私有属性（以_开头）
    if (propertyName.startsWith('_')) {
      continue
    }
    
    // 自动注册公共属性
    if (!target._autoSerializableProperties) {
      target._autoSerializableProperties = new Map()
    }
    
    const inferredType = inferPropertyType(prototype, propertyName)
    
    target._autoSerializableProperties.set(propertyName, {
      name: propertyName,
      type: inferredType,
      serializable: true
    })
    
    console.log(`🔍 自动发现属性: ${target.name}.${propertyName} (${inferredType})`)
  }
}

// ============================================================================
// 自动序列化器
// ============================================================================

export class DecoratorAutoSerializer {
  /**
   * 自动序列化节点
   */
  static serialize(node: any): any {
    const nodeClass = node.constructor
    const properties = nodeClass._autoSerializableProperties as Map<string, any>
    
    const result: any = {
      type: nodeClass.name,
      name: node.name || 'Unnamed',
      id: node.getInstanceId ? node.getInstanceId() : `auto_${Date.now()}`,
      properties: {},
      children: []
    }
    
    // 序列化装饰器注册的属性
    if (properties) {
      for (const [key, descriptor] of properties.entries()) {
        const value = node[key]
        if (value !== undefined && !this.isDefaultValue(value, descriptor.type)) {
          result.properties[key] = this.serializeValue(value, descriptor.type)
        }
      }
    }
    
    // 序列化子节点
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        result.children.push(this.serialize(child))
      }
    }
    
    return result
  }
  
  /**
   * 自动反序列化节点
   */
  static deserialize(data: any, NodeClass: any): any {
    const node = new NodeClass(data.name)
    
    if (node.setInstanceId) {
      node.setInstanceId(data.id)
    }
    
    const properties = NodeClass._autoSerializableProperties as Map<string, any>
    
    // 反序列化属性
    if (properties && data.properties) {
      for (const [key, descriptor] of properties.entries()) {
        if (data.properties[key] !== undefined) {
          const value = this.deserializeValue(data.properties[key], descriptor.type)
          node[key] = value
        }
      }
    }
    
    return node
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
      default:
        return value
    }
  }
  
  /**
   * 反序列化值
   */
  private static deserializeValue(value: any, type: string): any {
    return value // 简化处理
  }
  
  /**
   * 检查是否为默认值
   */
  private static isDefaultValue(value: any, type: string): boolean {
    switch (type) {
      case 'string': return value === ''
      case 'number': return value === 0
      case 'boolean': return value === false
      case 'vector3': return value.x === 0 && value.y === 0 && value.z === 0
      default: return false
    }
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 示例：使用装饰器的自动序列化节点
 */
@SerializableClass
export class AutoNode3D {
  @Serializable('string')
  name: string = 'AutoNode3D'
  
  @Serializable('vector3')
  position = { x: 0, y: 0, z: 0 }
  
  @Serializable('vector3')
  rotation = { x: 0, y: 0, z: 0 }
  
  @Serializable('vector3')
  scale = { x: 1, y: 1, z: 1 }
  
  @Serializable('boolean')
  visible: boolean = true
  
  children: AutoNode3D[] = []
  
  constructor(name?: string) {
    if (name) this.name = name
  }
  
  getInstanceId(): string {
    return `auto_${this.name}_${Date.now()}`
  }
  
  addChild(child: AutoNode3D): void {
    this.children.push(child)
  }
}

/**
 * 示例：自动序列化的相机
 */
@SerializableClass
export class AutoCamera3D extends AutoNode3D {
  @Serializable('number')
  fov: number = 75
  
  @Serializable('number')
  near: number = 0.1
  
  @Serializable('number')
  far: number = 1000
  
  @Serializable('color')
  clearColor = { r: 0.5, g: 0.5, b: 0.5, a: 1 }
  
  constructor(name: string = 'AutoCamera3D') {
    super(name)
  }
}

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试装饰器自动序列化
 */
export function testDecoratorAutoSerialization(): void {
  console.log('🧪 测试装饰器自动序列化...')
  
  // 创建测试场景
  const root = new AutoNode3D('Root')
  root.position = { x: 1, y: 2, z: 3 }
  
  const camera = new AutoCamera3D('MainCamera')
  camera.position = { x: 5, y: 5, z: 5 }
  camera.fov = 60
  
  root.addChild(camera)
  
  try {
    // 序列化
    const serialized = DecoratorAutoSerializer.serialize(root)
    console.log('✅ 装饰器序列化成功')
    console.log('序列化数据:', JSON.stringify(serialized, null, 2))
    
    // 反序列化
    const restored = DecoratorAutoSerializer.deserialize(serialized, AutoNode3D)
    console.log('✅ 装饰器反序列化成功')
    console.log('恢复的节点:', restored)
    
    // 验证
    console.log('验证结果:')
    console.log('- 根节点位置:', restored.position)
    console.log('- 子节点数量:', restored.children.length)
    
  } catch (error) {
    console.error('❌ 装饰器序列化测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testDecoratorAutoSerialization = testDecoratorAutoSerialization
    (window as any).AutoNode3D = AutoNode3D
    (window as any).AutoCamera3D = AutoCamera3D
    console.log('💡 运行 window.testDecoratorAutoSerialization() 测试装饰器自动序列化')
  } catch (error) {
    console.warn('⚠️ 无法设置全局装饰器函数:', error)
  }
}

export default DecoratorAutoSerializer
