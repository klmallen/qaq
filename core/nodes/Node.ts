/**
 * QAQ 游戏引擎节点基类
 * 提供节点树结构、生命周期管理和基础功能
 * 类似于 Godot 的 Node 类
 */

import QaqObject from '../object/QaqObject'
import Engine from '../engine/Engine'
import * as THREE from 'three'
import type { NodeID, NodePath, Vector3 } from '../../types/core'
import { ProcessMode } from '../../types/core'
import type ScriptBase from '../script/ScriptBase'
import type { ScriptInstance } from '../script/ScriptManager'

export class QaqNodePath {
  public path: string
  public subname: string
  public absolute: boolean

  constructor(path: string) {
    this.path = path
    this.subname = ''
    this.absolute = path.startsWith('/')
    const colonIndex = path.indexOf(':')
    if (colonIndex !== -1) {
      this.subname = path.substring(colonIndex + 1)
      this.path = path.substring(0, colonIndex)
    }
  }

  toString(): string {
    return this.subname ? `${this.path}:${this.subname}` : this.path
  }

  isEmpty(): boolean {
    return this.path === '' || this.path === '.'
  }

  getNames(): string[] {
    if (this.isEmpty()) return []
    const cleanPath = this.absolute ? this.path.substring(1) : this.path
    return cleanPath.split('/').filter(name => name !== '')
  }
}

export class Node extends QaqObject {
  private _name: string = 'Node'
  private _parent: Node | null = null
  private _children: Node[] = []
  private _owner: Node | null = null
  private _processMode: ProcessMode = ProcessMode.INHERIT
  private _processPriority: number = 0
  private _isInsideTree: boolean = false
  private _dirty: boolean = false
  private _isReady: boolean = false
  private _canProcess: boolean = true

  protected _object3D: THREE.Object3D
  protected _renderLayer: '2D' | '3D' | 'UI' = '3D'
  protected _visible: boolean = true
  protected _transformDirty: boolean = true

  private _scriptInstances: ScriptInstance[] = []
  private _scriptClassNames: string[] = []

  constructor(name: string = 'Node') {
    super('Node')
    this._name = name
    this._object3D = this.createObject3D()
    this._object3D.name = name
    this._object3D.userData.qaqNode = this
    this.initializeNodeSignals()
    this.initializeNodeProperties()
  }

  protected createObject3D(): THREE.Object3D {
    return new THREE.Group()
  }

  get id(): string {
    return this.getInstanceId()
  }

  get name(): string {
    return this._name
  }

  set name(value: string) {
    if (value !== this._name) {
      const oldName = this._name
      this._name = value
      this.emit('renamed', oldName, value)
    }
  }

  get parent(): Node | null {
    return this._parent
  }

  get children(): readonly Node[] {
    return this._children
  }

  get owner(): Node | null {
    return this._owner
  }

  set owner(value: Node | null) {
    this._owner = value
  }

  get processMode(): ProcessMode {
    return this._processMode
  }

  set processMode(value: ProcessMode) {
    this._processMode = value
  }

  get processPriority(): number {
    return this._processPriority
  }

  set processPriority(value: number) {
    this._processPriority = value
  }

  getEngine(): Engine {
    const engine = Engine.getInstance()
    if (!engine) {
      throw new Error('Engine not initialized')
    }
    return engine
  }

  get object3D(): THREE.Object3D {
    return this._object3D
  }

  get renderLayer(): '2D' | '3D' | 'UI' {
    return this._renderLayer
  }

  set renderLayer(value: '2D' | '3D' | 'UI') {
    if (this._renderLayer !== value) {
      const oldLayer = this._renderLayer
      this._renderLayer = value
      this._updateRenderLayer(oldLayer, value)
    }
  }

  get visible(): boolean {
    return this._visible
  }

  set visible(value: boolean) {
    if (this._visible !== value) {
      this._visible = value
      this._object3D.visible = value
      this.emit('visibility_changed', value)
    }
  }

  get globalPosition(): Vector3 {
    const worldPos = new THREE.Vector3()
    this._object3D.getWorldPosition(worldPos)
    return { x: worldPos.x, y: worldPos.y, z: worldPos.z }
  }

  set globalPosition(value: Vector3) {
    const parent = this._object3D.parent
    if (parent) {
      const worldPos = new THREE.Vector3(value.x, value.y, value.z)
      const localPos = parent.worldToLocal(worldPos)
      this._object3D.position.copy(localPos)
    } else {
      this._object3D.position.set(value.x, value.y, value.z)
    }
    this._transformDirty = false
  }

  get position(): Vector3 {
    const pos = this._object3D.position
    return { x: pos.x, y: pos.y, z: pos.z }
  }

  set position(value: Vector3) {
    this._object3D.position.set(value.x, value.y, value.z)
    this._transformDirty = false
  }

  get isInsideTree(): boolean {
    return this._isInsideTree
  }

  get isReady(): boolean {
    return this._isReady
  }

  addChild(child: Node, forceReadableName: boolean = false): void {
    if (child._parent) {
      throw new Error(`Node "${child.name}" already has a parent`)
    }
    if (forceReadableName) {
      child.name = this.getUniqueChildName(child.name)
    }
    child._parent = this
    this._children.push(child)
    this._object3D.add(child._object3D)
    if (!child._owner) {
      child._owner = this._owner || this
    }
    if (this._isInsideTree) {
      child._enterTree()
    }
    this.emit('child_added', child)
    child.emit('parent_changed', this)
  }

  removeChild(child: Node): void {
    const index = this._children.indexOf(child)
    if (index === -1) {
      throw new Error(`Node "${child.name}" is not a child of "${this.name}"`)
    }
    if (child._isInsideTree) {
      child._exitTree()
    }
    this._object3D.remove(child._object3D)
    child._parent = null
    this._children.splice(index, 1)
    this.emit('child_removed', child)
    child.emit('parent_changed', null)
  }

  getChild(index: number): Node | null {
    return this._children[index] || null
  }

  getChildCount(): number {
    return this._children.length
  }

  getChildIndex(child: Node): number {
    return this._children.indexOf(child)
  }

  hasChild(child: Node): boolean {
    return this._children.includes(child)
  }

  moveChild(child: Node, toIndex: number): void {
    const fromIndex = this.getChildIndex(child)
    if (fromIndex === -1) {
      throw new Error(`Node "${child.name}" is not a child of "${this.name}"`)
    }
    if (toIndex < 0 || toIndex >= this._children.length) {
      throw new Error(`Invalid child index: ${toIndex}`)
    }
    this._children.splice(fromIndex, 1)
    this._children.splice(toIndex, 0, child)
    this.emit('child_order_changed')
  }

  getNode(path: string): Node | null {
    const nodePath = new QaqNodePath(path)
    return this._getNodeByPath(nodePath)
  }

  hasNode(path: string): boolean {
    return this.getNode(path) !== null
  }

  findChild(name: string, recursive: boolean = true, owned: boolean = true): Node | null {
    for (const child of this._children) {
      if (child.name === name && (!owned || child._owner === this._owner)) {
        return child
      }
    }
    if (recursive) {
      for (const child of this._children) {
        const found = child.findChild(name, true, owned)
        if (found) return found
      }
    }
    return null
  }

  findChildren(pattern: string, type?: string, recursive: boolean = true, owned: boolean = true): Node[] {
    const results: Node[] = []
    this._findChildrenRecursive(pattern, type, recursive, owned, results)
    return results
  }

  getPath(): string {
    if (!this._parent) return this.name
    const parentPath = this._parent.getPath()
    return parentPath === '' ? this.name : `${parentPath}/${this.name}`
  }

  getPathTo(node: Node): string {
    return node.getPath()
  }

  _enterTree(): void {
    this._isInsideTree = true
    if (!this._parent) {
      const engine = Engine.getInstance()
      const scene = engine.getScene()
      if (scene) {
        engine.addToLayer(this._object3D, this._renderLayer)
      }
    }
    this.emit('tree_entered')
    for (const child of this._children) {
      child._enterTree()
    }
    if (!this._isReady) {
      this._ready()
      this._isReady = true
    }
  }

  _exitTree(): void {
    this._isInsideTree = false
    if (!this._parent) {
      const engine = Engine.getInstance()
      engine.removeFromLayer(this._object3D, this._renderLayer)
    }
    this.emit('tree_exiting')
    for (const child of this._children) {
      child._exitTree()
    }
    this.emit('tree_exited')
  }

  _ready(): void {
    this.emit('ready')
  }

  _process(delta: number): void {
    if (this._canProcess) {
      for (const child of this._children) {
        if (child._shouldProcess()) {
          child._process(delta)
        }
      }
    }
  }

  _physicsProcess(delta: number): void {
    if (this._canProcess) {
      for (const child of this._children) {
        if (child._shouldProcess()) {
          child._physicsProcess(delta)
        }
      }
    }
  }

  protected initializeNodeSignals(): void {
    this.addSignal('ready')
    this.addSignal('tree_entered')
    this.addSignal('tree_exiting')
    this.addSignal('tree_exited')
    this.addSignal('child_added')
    this.addSignal('child_removed')
    this.addSignal('child_order_changed')
    this.addSignal('parent_changed')
    this.addSignal('renamed')
  }

  addUserSignal(name: string, params: string[] = []): void {
    this.addSignal(name, params)
  }

  protected initializeNodeProperties(): void {
    this.addProperty({ name: 'name', type: 'string', usage: 1 }, this._name)
    this.addProperty({ name: 'process_mode', type: 'enum', usage: 1 }, this._processMode)
    this.addProperty({ name: 'process_priority', type: 'int', usage: 1 }, this._processPriority)
  }

  attachScript(scriptClassName: string, scriptInstance: ScriptInstance): void {
    this._scriptInstances.push(scriptInstance)
    this._scriptClassNames.push(scriptClassName)
  }

  detachScript(scriptClassName: string): boolean {
    const index = this._scriptClassNames.indexOf(scriptClassName)
    if (index !== -1) {
      this._scriptClassNames.splice(index, 1)
      this._scriptInstances.splice(index, 1)
      return true
    }
    return false
  }

  getScriptInstances(): ScriptInstance[] {
    return [...this._scriptInstances]
  }

  getScriptClassNames(): string[] {
    return [...this._scriptClassNames]
  }

  hasScript(scriptClassName: string): boolean {
    return this._scriptClassNames.includes(scriptClassName)
  }

  destroy(): void {
    while (this._children.length > 0) {
      const child = this._children[0]
      this.removeChild(child)
      child.destroy()
    }
    if (this._parent) {
      this._parent.removeChild(this)
    }
    super.destroy()
  }

  private _updateRenderLayer(oldLayer: '2D' | '3D' | 'UI', newLayer: '2D' | '3D' | 'UI'): void {
    if (!this._parent && this._isInsideTree) {
      const engine = Engine.getInstance()
      engine.removeFromLayer(this._object3D, oldLayer)
      engine.addToLayer(this._object3D, newLayer)
    }
  }

  private getUniqueChildName(baseName: string): string {
    let name = baseName
    let counter = 1
    while (this._children.some(child => child.name === name)) {
      name = `${baseName}${counter}`
      counter++
    }
    return name
  }

  private _getNodeByPath(nodePath: QaqNodePath): Node | null {
    if (nodePath.isEmpty()) return this
    const names = nodePath.getNames()
    let current: Node = nodePath.absolute ? this.getRoot() : this
    for (const name of names) {
      if (name === '..') {
        current = current._parent || current
      } else {
        const child = current._children.find(c => c.name === name)
        if (!child) return null
        current = child
      }
    }
    return current
  }

  private getRoot(): Node {
    let root: Node = this
    while (root._parent) {
      root = root._parent
    }
    return root
  }

  private _shouldProcess(): boolean {
    switch (this._processMode) {
      case ProcessMode.INHERIT:
        return this._parent ? this._parent._shouldProcess() : true
      case ProcessMode.PAUSABLE:
        return true
      case ProcessMode.WHEN_PAUSED:
        return false
      case ProcessMode.ALWAYS:
        return true
      case ProcessMode.DISABLED:
        return false
      default:
        return true
    }
  }

  private _findChildrenRecursive(pattern: string, type: string | undefined, recursive: boolean, owned: boolean, results: Node[]): void {
    for (const child of this._children) {
      const nameMatches = pattern === '*' || child.name.includes(pattern)
      const typeMatches = !type || child.getClassName() === type
      const ownerMatches = !owned || child._owner === this._owner
      if (nameMatches && typeMatches && ownerMatches) {
        results.push(child)
      }
      if (recursive) {
        child._findChildrenRecursive(pattern, type, true, owned, results)
      }
    }
  }

  // ========================================================================
  // 反射序列化支持
  // ========================================================================

  /**
   * 获取所有可序列化属性（反射方式）
   */
  getSerializableProperties(): Map<string, any> {
    const properties = new Map()
    const visited = new Set()

    // 遍历原型链
    let current = this
    while (current && current !== Object.prototype) {
      const propertyNames = Object.getOwnPropertyNames(current)

      for (const name of propertyNames) {
        // 跳过已访问的属性
        if (visited.has(name)) continue
        visited.add(name)

        // 跳过特殊属性
        if (this.shouldSkipProperty(name, (this as any)[name])) continue

        // 推断属性类型
        const type = this.inferPropertyType((this as any)[name])

        properties.set(name, {
          name,
          type,
          value: (this as any)[name]
        })
      }

      current = Object.getPrototypeOf(current)
    }

    return properties
  }

  /**
   * 判断是否应该跳过属性
   */
  private shouldSkipProperty(name: string, value: any): boolean {
    // 跳过构造函数
    if (name === 'constructor') return true

    // 跳过方法
    if (typeof value === 'function') return true

    // 跳过私有属性（以_开头）
    if (name.startsWith('_')) return true

    // 跳过特殊属性
    const skipList = [
      'children', 'parent', 'owner', // 节点关系属性（会导致循环引用）
      '_children', '_parent', '_owner', // 私有节点关系属性
      'object3D', 'mesh', 'material', // Three.js对象
      'signals', 'connections', // 信号系统
      'properties', 'propertyMetadata', // 属性系统
      'engine', 'renderer', 'scene', // 引擎相关对象
      'camera', 'light', 'mixer' // 其他可能导致循环引用的对象
    ]

    if (skipList.includes(name)) return true

    // 跳过undefined和null
    if (value === undefined || value === null) return true

    // 跳过可能导致循环引用的对象类型
    if (value && typeof value === 'object') {
      // 跳过DOM元素
      if (value instanceof Element || value instanceof HTMLElement) return true

      // 跳过Three.js对象
      if (value.isObject3D || value.isMaterial || value.isGeometry || value.isTexture) return true

      // 跳过包含循环引用的复杂对象
      if (value.constructor && value.constructor.name &&
          ['WebGLRenderer', 'Scene', 'Camera', 'Light', 'Mesh'].includes(value.constructor.name)) {
        return true
      }
    }

    return false
  }

  /**
   * 从值推断类型
   */
  private inferPropertyType(value: any): string {
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

  /**
   * 自动序列化节点
   */
  serialize(visited?: Set<string>): any {
    // 初始化访问集合，防止循环引用
    if (!visited) {
      visited = new Set<string>()
    }

    // 检查是否已经访问过此节点
    const nodeId = this.getInstanceId()
    if (visited.has(nodeId)) {
      // 返回引用而不是完整对象，避免循环引用
      return {
        type: this.constructor.name,
        name: this.name,
        id: nodeId,
        isReference: true
      }
    }

    // 标记此节点为已访问
    visited.add(nodeId)

    const result: any = {
      type: this.constructor.name,
      name: this.name,
      id: nodeId,
      properties: {},
      children: []
    }

    // 自动发现所有可序列化属性
    const properties = this.getSerializableProperties()

    console.log(`🔍 自动发现 ${this.constructor.name} 的 ${properties.size} 个属性`)

    for (const [key, descriptor] of properties.entries()) {
      const value = descriptor.value

      if (!this.isDefaultValue(value, descriptor.type)) {
        try {
          result.properties[key] = this.serializeValue(value, descriptor.type, visited)
          console.log(`  📝 序列化属性: ${key} (${descriptor.type})`)
        } catch (error) {
          console.warn(`  ⚠️ 跳过属性 ${key}: ${error}`)
        }
      }
    }

    // 序列化子节点
    for (const child of this._children) {
      try {
        result.children.push(child.serialize(visited))
      } catch (error) {
        console.warn(`⚠️ 跳过子节点 ${child.name}: ${error}`)
      }
    }

    return result
  }

  /**
   * 序列化值
   */
  private serializeValue(value: any, type: string, visited?: Set<string>): any {
    switch (type) {
      case 'vector3':
        return { x: value.x, y: value.y, z: value.z }
      case 'color':
        return { r: value.r, g: value.g, b: value.b, a: value.a || 1 }
      case 'array':
        return value.map((item: any) => {
          if (typeof item === 'object' && item !== null) {
            // 如果数组项是Node类型，使用serialize方法
            if (typeof item.serialize === 'function') {
              return item.serialize(visited)
            }
            // 对于其他对象，尝试安全序列化
            return this.safeSerializeObject(item, visited)
          }
          return item
        })
      case 'object':
        return this.safeSerializeObject(value, visited)
      default:
        // 对于基础类型，直接返回
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return value
        }
        // 对于复杂对象，使用安全序列化
        return this.safeSerializeObject(value, visited)
    }
  }

  /**
   * 安全序列化对象，避免循环引用
   */
  private safeSerializeObject(obj: any, visited?: Set<string>): any {
    if (!obj || typeof obj !== 'object') {
      return obj
    }

    // 对于简单的值对象（如vector3, color），直接返回
    if (this.isSimpleValueObject(obj)) {
      return obj
    }

    // 对于复杂对象，只序列化基础属性
    const result: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]

        // 跳过可能导致循环引用的属性
        if (this.shouldSkipProperty(key, value)) {
          continue
        }

        // 只序列化基础类型
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          result[key] = value
        } else if (this.isSimpleValueObject(value)) {
          result[key] = value
        }
      }
    }

    return result
  }

  /**
   * 检查是否是简单值对象（如vector3, color）
   */
  private isSimpleValueObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false

    // Vector3类型
    if ('x' in obj && 'y' in obj && 'z' in obj &&
        typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.z === 'number') {
      return Object.keys(obj).length <= 3
    }

    // Color类型
    if ('r' in obj && 'g' in obj && 'b' in obj &&
        typeof obj.r === 'number' && typeof obj.g === 'number' && typeof obj.b === 'number') {
      return Object.keys(obj).length <= 4 // r, g, b, a
    }

    return false
  }

  /**
   * 检查是否为默认值
   */
  private isDefaultValue(value: any, type: string): boolean {
    switch (type) {
      case 'string': return value === '' || value === 'Node'
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
   * 自动反序列化节点
   */
  static deserialize(data: any, NodeClass?: typeof Node, nodeRegistry?: Map<string, Node>): Node {
    // 初始化节点注册表，用于处理引用
    if (!nodeRegistry) {
      nodeRegistry = new Map<string, Node>()
    }

    // 如果是引用，返回已存在的节点
    if (data.isReference) {
      const existingNode = nodeRegistry.get(data.id)
      if (existingNode) {
        return existingNode
      }
      // 如果引用的节点不存在，创建一个占位符
      console.warn(`⚠️ 引用的节点不存在: ${data.id}`)
    }

    // 确定目标类
    const TargetClass = NodeClass || Node

    // 创建节点实例，确保传递name参数
    let node: Node
    try {
      node = new TargetClass(data.name || 'UnnamedNode')
    } catch (error) {
      console.warn(`⚠️ 创建节点失败，使用Node基类: ${data.type}`, error)
      node = new Node(data.name || 'UnnamedNode')
    }

    // 设置实例ID
    if (data.id && typeof node.setInstanceId === 'function') {
      node.setInstanceId(data.id)
    }

    // 将节点添加到注册表
    nodeRegistry.set(data.id, node)

    // 自动恢复所有属性
    if (data.properties) {
      for (const [key, value] of Object.entries(data.properties)) {
        try {
          // 推断目标类型
          const targetType = node.inferTargetType(key, value)
          const deserializedValue = node.deserializeValue(value, targetType)

          // 直接设置属性
          ;(node as any)[key] = deserializedValue
          console.log(`  🔄 恢复属性: ${key}`)

        } catch (error) {
          console.warn(`⚠️ 恢复属性失败: ${key}`, error)
        }
      }
    }

    // 反序列化子节点
    if (data.children && Array.isArray(data.children)) {
      for (const childData of data.children) {
        try {
          // 尝试根据类型创建正确的节点类
          let ChildNodeClass = NodeClass

          // 简单的类型映射
          if (childData.type === 'Scene') {
            // Scene需要特殊处理，因为它在不同的文件中
            const child = Node.deserialize(childData, Node, nodeRegistry)
            node.addChild(child)
            continue
          }

          const child = Node.deserialize(childData, ChildNodeClass, nodeRegistry)
          node.addChild(child)
        } catch (error) {
          console.warn(`⚠️ 反序列化子节点失败: ${childData.type}`, error)
        }
      }
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
    return this.inferPropertyType(value)
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
}

export default Node