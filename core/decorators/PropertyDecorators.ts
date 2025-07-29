/**
 * QAQ 游戏引擎属性装饰器系统
 * 用于自动映射类属性到编辑器 UI 控件
 * 支持分组、验证、UI 控件类型等功能
 */

import type { PropertyInfo, PropertyType, PropertyUsage } from '../../types/core'

// ============================================================================
// 装饰器元数据接口
// ============================================================================

export interface PropertyMetadata extends PropertyInfo {
  // UI 相关
  group?: string           // 属性分组名称
  order?: number          // 在组内的排序
  label?: string          // 显示标签（如果不同于属性名）
  description?: string    // 属性描述/提示
  
  // 控件类型
  controlType?: UIControlType
  
  // 验证和约束
  min?: number           // 数值最小值
  max?: number           // 数值最大值
  step?: number          // 数值步长
  precision?: number     // 浮点数精度
  
  // 枚举选项
  enumOptions?: Array<{ label: string, value: any }>
  
  // 向量组件标签
  vectorLabels?: string[] // 如 ['X', 'Y', 'Z'] 或 ['Width', 'Height']
  
  // 条件显示
  showIf?: string        // 条件属性名
  showIfValue?: any      // 条件值
  
  // 只读状态
  readonly?: boolean
  
  // 自定义验证函数
  validator?: (value: any) => boolean | string
}

export type UIControlType = 
  | 'input'           // 基础输入框
  | 'number'          // 数字输入框
  | 'slider'          // 滑块
  | 'range'           // 范围滑块
  | 'toggle'          // 开关
  | 'select'          // 下拉选择
  | 'radio'           // 单选按钮组
  | 'checkbox'        // 复选框
  | 'textarea'        // 多行文本
  | 'color'           // 颜色选择器
  | 'vector2'         // 2D 向量输入
  | 'vector3'         // 3D 向量输入
  | 'vector4'         // 4D 向量输入
  | 'file'            // 文件选择
  | 'node_path'       // 节点路径选择
  | 'resource'        // 资源选择
  | 'custom'          // 自定义控件

// ============================================================================
// 属性装饰器
// ============================================================================

/**
 * 主要的属性装饰器
 * @param metadata 属性元数据配置
 */
export function Property(metadata: Partial<PropertyMetadata> = {}) {
  return function (target: any, propertyKey: string) {
    // 获取属性类型信息
    const type = Reflect.getMetadata('design:type', target, propertyKey)
    
    // 推断 PropertyType
    const propertyType = inferPropertyType(type, metadata.type)
    
    // 推断 UI 控件类型
    const controlType = metadata.controlType || inferControlType(propertyType, metadata)
    
    // 构建完整的元数据
    const fullMetadata: PropertyMetadata = {
      name: propertyKey,
      type: propertyType,
      usage: PropertyUsage.STORAGE | PropertyUsage.EDITOR,
      group: 'General',
      order: 0,
      label: propertyKey,
      controlType,
      ...metadata
    }
    
    // 存储元数据
    if (!target.constructor._propertyMetadata) {
      target.constructor._propertyMetadata = new Map()
    }
    target.constructor._propertyMetadata.set(propertyKey, fullMetadata)
    
    // 注册属性到类的属性列表
    if (!target.constructor._properties) {
      target.constructor._properties = []
    }
    target.constructor._properties.push(propertyKey)
  }
}

/**
 * 分组装饰器 - 为后续属性设置默认分组
 */
export function Group(groupName: string, order: number = 0) {
  return function (target: any) {
    target._defaultGroup = groupName
    target._defaultGroupOrder = order
  }
}

/**
 * 范围装饰器 - 为数值属性设置范围
 */
export function Range(min: number, max: number, step: number = 1) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreatePropertyMetadata(target, propertyKey)
    metadata.min = min
    metadata.max = max
    metadata.step = step
    metadata.controlType = metadata.controlType || 'slider'
  }
}

/**
 * 枚举装饰器 - 为属性设置枚举选项
 */
export function Enum(options: Array<{ label: string, value: any }>) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreatePropertyMetadata(target, propertyKey)
    metadata.type = 'enum'
    metadata.enumOptions = options
    metadata.controlType = 'select'
  }
}

/**
 * 向量标签装饰器
 */
export function VectorLabels(...labels: string[]) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreatePropertyMetadata(target, propertyKey)
    metadata.vectorLabels = labels
  }
}

/**
 * 只读装饰器
 */
export function ReadOnly() {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreatePropertyMetadata(target, propertyKey)
    metadata.readonly = true
  }
}

/**
 * 条件显示装饰器
 */
export function ShowIf(propertyName: string, value: any) {
  return function (target: any, propertyKey: string) {
    const metadata = getOrCreatePropertyMetadata(target, propertyKey)
    metadata.showIf = propertyName
    metadata.showIfValue = value
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

function getOrCreatePropertyMetadata(target: any, propertyKey: string): PropertyMetadata {
  if (!target.constructor._propertyMetadata) {
    target.constructor._propertyMetadata = new Map()
  }
  
  let metadata = target.constructor._propertyMetadata.get(propertyKey)
  if (!metadata) {
    metadata = {
      name: propertyKey,
      type: 'string',
      usage: PropertyUsage.STORAGE | PropertyUsage.EDITOR,
      group: target.constructor._defaultGroup || 'General',
      order: target.constructor._defaultGroupOrder || 0,
      label: propertyKey,
      controlType: 'input'
    }
    target.constructor._propertyMetadata.set(propertyKey, metadata)
  }
  
  return metadata
}

function inferPropertyType(reflectType: any, explicitType?: PropertyType): PropertyType {
  if (explicitType) return explicitType
  
  if (reflectType === Boolean) return 'bool'
  if (reflectType === Number) return 'float'
  if (reflectType === String) return 'string'
  
  return 'string' // 默认类型
}

function inferControlType(propertyType: PropertyType, metadata: Partial<PropertyMetadata>): UIControlType {
  // 如果有枚举选项，使用选择控件
  if (metadata.enumOptions) return 'select'
  
  // 根据属性类型推断控件类型
  switch (propertyType) {
    case 'bool': return 'toggle'
    case 'int': 
    case 'float': 
      return metadata.min !== undefined && metadata.max !== undefined ? 'slider' : 'number'
    case 'string': return 'input'
    case 'vector2': return 'vector2'
    case 'vector3': return 'vector3'
    case 'vector4': return 'vector4'
    case 'color': return 'color'
    case 'node_path': return 'node_path'
    case 'enum': return 'select'
    default: return 'input'
  }
}

// ============================================================================
// 元数据访问器
// ============================================================================

export class PropertyMetadataRegistry {
  /**
   * 获取类的所有属性元数据
   */
  static getClassProperties(constructor: any): Map<string, PropertyMetadata> {
    return constructor._propertyMetadata || new Map()
  }
  
  /**
   * 获取特定属性的元数据
   */
  static getPropertyMetadata(constructor: any, propertyName: string): PropertyMetadata | undefined {
    const metadata = constructor._propertyMetadata
    return metadata ? metadata.get(propertyName) : undefined
  }
  
  /**
   * 获取按分组组织的属性
   */
  static getPropertiesByGroup(constructor: any): Map<string, PropertyMetadata[]> {
    const properties = this.getClassProperties(constructor)
    const groups = new Map<string, PropertyMetadata[]>()
    
    for (const [name, metadata] of properties) {
      const groupName = metadata.group || 'General'
      if (!groups.has(groupName)) {
        groups.set(groupName, [])
      }
      groups.get(groupName)!.push(metadata)
    }
    
    // 对每个分组内的属性进行排序
    for (const [groupName, groupProperties] of groups) {
      groupProperties.sort((a, b) => (a.order || 0) - (b.order || 0))
    }
    
    return groups
  }
}
