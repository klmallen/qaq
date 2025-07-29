/**
 * QAQ 游戏引擎基础对象类
 * 提供信号系统、属性系统和对象管理功能
 * 类似于 Godot 的 Object 类
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  Signal,
  SignalCallback,
  PropertyInfo,
  PropertyType
} from '../../types/core'
import { PropertyUsage } from '../../types/core'

// ============================================================================
// 信号类实现
// ============================================================================

export class QaqSignal implements Signal {
  public name: string
  public callbacks: SignalCallback[] = []

  constructor(name: string) {
    this.name = name
  }

  connect(callback: SignalCallback): void {
    if (!this.callbacks.includes(callback)) {
      this.callbacks.push(callback)
    }
  }

  disconnect(callback: SignalCallback): void {
    const index = this.callbacks.indexOf(callback)
    if (index !== -1) {
      this.callbacks.splice(index, 1)
    }
  }

  emit(...args: any[]): void {
    for (const callback of this.callbacks) {
      try {
        callback(...args)
      } catch (error) {
        console.error(`Error in signal callback for "${this.name}":`, error)
      }
    }
  }

  clear(): void {
    this.callbacks = []
  }

  getConnectionCount(): number {
    return this.callbacks.length
  }
}

// ============================================================================
// 属性类实现
// ============================================================================

export class QaqProperty {
  public info: PropertyInfo
  private _value: any
  private _defaultValue: any

  constructor(info: PropertyInfo, defaultValue: any = null) {
    this.info = info
    this._defaultValue = defaultValue
    this._value = defaultValue
  }

  get value(): any {
    return this._value
  }

  set value(newValue: any) {
    if (this.validateValue(newValue)) {
      this._value = newValue
    } else {
      console.warn(`Invalid value for property "${this.info.name}": ${newValue}`)
    }
  }

  get defaultValue(): any {
    return this._defaultValue
  }

  reset(): void {
    this._value = this._defaultValue
  }

  private validateValue(value: any): boolean {
    // 基础类型验证
    switch (this.info.type) {
      case 'bool':
        return typeof value === 'boolean'
      case 'int':
        return typeof value === 'number' && Number.isInteger(value)
      case 'float':
        return typeof value === 'number'
      case 'string':
        return typeof value === 'string'
      case 'vector2':
        return value && typeof value.x === 'number' && typeof value.y === 'number'
      case 'vector3':
        return value && typeof value.x === 'number' && typeof value.y === 'number' && typeof value.z === 'number'
      case 'array':
        return Array.isArray(value)
      default:
        return true // 其他类型暂时不验证
    }
  }
}

// ============================================================================
// QAQ 基础对象类
// ============================================================================

export class QaqObject {
  private _instanceId: string
  private _className: string
  private _signals: Map<string, QaqSignal> = new Map()
  private _properties: Map<string, QaqProperty> = new Map()
  private _metadata: Map<string, any> = new Map()

  constructor(className: string = 'QaqObject') {
    this._instanceId = uuidv4()
    this._className = className
    this.initializeSignals()
    this.initializeProperties()
  }

  // ========================================================================
  // 基础对象方法
  // ========================================================================

  getInstanceId(): string {
    return this._instanceId
  }

  setInstanceId(id: string): void {
    this._instanceId = id
  }

  getClassName(): string {
    return this._className
  }

  toString(): string {
    return `[${this._className}:${this._instanceId.substring(0, 8)}]`
  }

  // ========================================================================
  // 信号系统方法
  // ========================================================================

  protected addSignal(signalName: string): void {
    if (!this._signals.has(signalName)) {
      this._signals.set(signalName, new QaqSignal(signalName))
    }
  }

  hasSignal(signalName: string): boolean {
    return this._signals.has(signalName)
  }

  connect(signalName: string, callback: SignalCallback): boolean {
    const signal = this._signals.get(signalName)
    if (signal) {
      signal.connect(callback)
      return true
    }
    console.warn(`Signal "${signalName}" not found in ${this.toString()}`)
    return false
  }

  disconnect(signalName: string, callback: SignalCallback): boolean {
    const signal = this._signals.get(signalName)
    if (signal) {
      signal.disconnect(callback)
      return true
    }
    return false
  }

  emit(signalName: string, ...args: any[]): void {
    const signal = this._signals.get(signalName)
    if (signal) {
      signal.emit(...args)
    } else {
      console.warn(`Signal "${signalName}" not found in ${this.toString()}`)
    }
  }

  getSignalList(): string[] {
    return Array.from(this._signals.keys())
  }

  getSignalConnectionCount(signalName: string): number {
    const signal = this._signals.get(signalName)
    return signal ? signal.getConnectionCount() : 0
  }

  // ========================================================================
  // 属性系统方法
  // ========================================================================

  protected addProperty(info: PropertyInfo, defaultValue: any = null): void {
    this._properties.set(info.name, new QaqProperty(info, defaultValue))
  }

  hasProperty(propertyName: string): boolean {
    return this._properties.has(propertyName)
  }

  setProperty(propertyName: string, value: any): boolean {
    const property = this._properties.get(propertyName)
    if (property) {
      const oldValue = property.value
      property.value = value

      // 发射属性变化信号
      this.emit('property_changed', propertyName, oldValue, value)
      return true
    }
    console.warn(`Property "${propertyName}" not found in ${this.toString()}`)
    return false
  }

  getProperty(propertyName: string): any {
    const property = this._properties.get(propertyName)
    return property ? property.value : null
  }

  getPropertyInfo(propertyName: string): PropertyInfo | null {
    const property = this._properties.get(propertyName)
    return property ? property.info : null
  }

  getPropertyList(): PropertyInfo[] {
    return Array.from(this._properties.values()).map(prop => prop.info)
  }

  resetProperty(propertyName: string): boolean {
    const property = this._properties.get(propertyName)
    if (property) {
      property.reset()
      this.emit('property_changed', propertyName, property.value, property.defaultValue)
      return true
    }
    return false
  }

  // ========================================================================
  // 元数据系统方法
  // ========================================================================

  setMeta(name: string, value: any): void {
    this._metadata.set(name, value)
  }

  getMeta(name: string, defaultValue: any = null): any {
    return this._metadata.get(name) ?? defaultValue
  }

  hasMeta(name: string): boolean {
    return this._metadata.has(name)
  }

  removeMeta(name: string): boolean {
    return this._metadata.delete(name)
  }

  getMetaList(): string[] {
    return Array.from(this._metadata.keys())
  }

  // ========================================================================
  // 生命周期方法（子类可重写）
  // ========================================================================

  protected initializeSignals(): void {
    // 添加基础信号
    this.addSignal('property_changed')
    this.addSignal('destroyed')
  }

  protected initializeProperties(): void {
    // 子类可重写此方法来添加属性
  }

  // ========================================================================
  // 销毁方法
  // ========================================================================

  destroy(): void {
    // 发射销毁信号
    this.emit('destroyed')

    // 清理所有信号连接
    for (const signal of this._signals.values()) {
      signal.clear()
    }
    this._signals.clear()

    // 清理属性
    this._properties.clear()

    // 清理元数据
    this._metadata.clear()
  }

  // ========================================================================
  // 序列化支持
  // ========================================================================

  serialize(): any {
    const data: any = {
      className: this._className,
      properties: {}
    }

    // 序列化属性
    for (const [name, property] of this._properties) {
      if (property.info.usage !== undefined &&
          (property.info.usage & PropertyUsage.STORAGE) !== 0) {
        data.properties[name] = property.value
      }
    }

    return data
  }

  deserialize(data: any): void {
    if (data.properties) {
      for (const [name, value] of Object.entries(data.properties)) {
        this.setProperty(name, value)
      }
    }
  }
}

export default QaqObject
