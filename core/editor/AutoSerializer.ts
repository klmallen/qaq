/**
 * QAQ游戏引擎 - 自动序列化系统
 * 
 * 参考Godot的设计，实现基于属性注册的自动序列化
 */

import Node from '../nodes/Node'

// ============================================================================
// 属性描述符接口
// ============================================================================

export interface PropertyDescriptor {
  /** 属性名称 */
  name: string
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'vector3' | 'color' | 'object'
  /** 是否可序列化 */
  serializable: boolean
  /** 默认值 */
  defaultValue?: any
  /** getter方法名 */
  getter?: string
  /** setter方法名 */
  setter?: string
}

// ============================================================================
// 属性注册装饰器
// ============================================================================

/**
 * 属性注册装饰器
 */
export function SerializableProperty(descriptor: Partial<PropertyDescriptor>) {
  return function (target: any, propertyKey: string) {
    if (!target.constructor._serializableProperties) {
      target.constructor._serializableProperties = new Map()
    }
    
    const fullDescriptor: PropertyDescriptor = {
      name: propertyKey,
      type: 'object',
      serializable: true,
      getter: `get${propertyKey.charAt(0).toUpperCase() + propertyKey.slice(1)}`,
      setter: `set${propertyKey.charAt(0).toUpperCase() + propertyKey.slice(1)}`,
      ...descriptor
    }
    
    target.constructor._serializableProperties.set(propertyKey, fullDescriptor)
  }
}

/**
 * 类级别的属性注册
 */
export function RegisterProperty(
  target: any, 
  name: string, 
  type: PropertyDescriptor['type'], 
  getter?: string, 
  setter?: string
) {
  if (!target._serializableProperties) {
    target._serializableProperties = new Map()
  }
  
  target._serializableProperties.set(name, {
    name,
    type,
    serializable: true,
    getter: getter || `get${name.charAt(0).toUpperCase() + name.slice(1)}`,
    setter: setter || `set${name.charAt(0).toUpperCase() + name.slice(1)}`
  })
}

// ============================================================================
// 自动序列化器类
// ============================================================================

export class AutoSerializer {
  /**
   * 自动序列化节点
   */
  static serialize(node: Node): any {
    const nodeClass = node.constructor as any
    const properties = nodeClass._serializableProperties as Map<string, PropertyDescriptor>
    
    const result: any = {
      type: node.constructor.name,
      name: node.name,
      id: node.getInstanceId(),
      properties: {},
      children: []
    }
    
    // 序列化注册的属性
    if (properties) {
      for (const [key, descriptor] of properties.entries()) {
        if (descriptor.serializable) {
          const value = this.getPropertyValue(node, descriptor)
          if (value !== undefined && value !== descriptor.defaultValue) {
            result.properties[key] = this.serializeValue(value, descriptor.type)
          }
        }
      }
    }
    
    // 序列化子节点
    for (const child of node.children) {
      result.children.push(this.serialize(child))
    }
    
    return result
  }
  
  /**
   * 自动反序列化节点
   */
  static deserialize(data: any, NodeClass: typeof Node): Node {
    const node = new NodeClass(data.name)
    node.setInstanceId(data.id)
    
    const nodeClass = NodeClass as any
    const properties = nodeClass._serializableProperties as Map<string, PropertyDescriptor>
    
    // 反序列化属性
    if (properties && data.properties) {
      for (const [key, descriptor] of properties.entries()) {
        if (descriptor.serializable && data.properties[key] !== undefined) {
          const value = this.deserializeValue(data.properties[key], descriptor.type)
          this.setPropertyValue(node, descriptor, value)
        }
      }
    }
    
    // 反序列化子节点（需要节点类型注册表）
    // 这里暂时跳过，由上层处理
    
    return node
  }
  
  /**
   * 获取属性值
   */
  private static getPropertyValue(node: Node, descriptor: PropertyDescriptor): any {
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
  private static setPropertyValue(node: Node, descriptor: PropertyDescriptor, value: any): void {
    // 优先使用setter方法
    if (descriptor.setter && typeof (node as any)[descriptor.setter] === 'function') {
      (node as any)[descriptor.setter](value)
      return
    }
    
    // 直接设置属性
    (node as any)[descriptor.name] = value
  }
  
  /**
   * 序列化值
   */
  private static serializeValue(value: any, type: PropertyDescriptor['type']): any {
    switch (type) {
      case 'vector3':
        return { x: value.x, y: value.y, z: value.z }
      case 'color':
        return { r: value.r, g: value.g, b: value.b, a: value.a }
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
  private static deserializeValue(value: any, type: PropertyDescriptor['type']): any {
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
}

// ============================================================================
// 节点基类扩展
// ============================================================================

/**
 * 为Node基类添加属性注册方法
 */
export function setupNodeSerialization() {
  // Node基类属性
  RegisterProperty(Node, 'name', 'string', 'getName', 'setName')
  RegisterProperty(Node, 'visible', 'boolean')
  
  // 为Node原型添加属性注册方法
  Node.prototype.registerProperty = function(
    name: string, 
    type: PropertyDescriptor['type'], 
    getter?: string, 
    setter?: string
  ) {
    RegisterProperty(this.constructor, name, type, getter, setter)
  }
  
  // 添加获取所有可序列化属性的方法
  Node.prototype.getSerializableProperties = function(): Map<string, PropertyDescriptor> {
    return (this.constructor as any)._serializableProperties || new Map()
  }
}

export default AutoSerializer
