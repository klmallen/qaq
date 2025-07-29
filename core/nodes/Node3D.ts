/**
 * QAQ 游戏引擎 3D 节点基类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有3D节点的基类，类似于Godot的Node3D类
 * - 基于新架构：深度集成Three.js Object3D
 * - 提供3D变换、渲染和交互功能
 * - 管理3D空间中的位置、旋转、缩放
 * - 与Engine的3D渲染管道完全集成
 *
 * 继承关系:
 * Node -> Node3D -> MeshInstance3D/Camera3D/Light3D等3D节点
 *
 * 新架构特性:
 * - 继承Node基类的Three.js Object3D集成
 * - 3D变换自动同步到Three.js对象
 * - 支持3D渲染层管理
 * - 完整的3D空间计算和变换
 */

import Node from './Node'
import Engine from '../engine/Engine'
import type { Vector3, Transform3D, Quaternion, PropertyInfo } from '../../types/core'
import * as THREE from 'three'

// 临时定义PropertyMetadata接口
interface PropertyMetadata {
  name: string
  type: string
  group?: string
  order?: number
  controlType?: string
  step?: number
  min?: number
  vectorLabels?: string[]
  description?: string
}

// ============================================================================
// Vector3 类 - 支持 Three.js 风格的 API
// ============================================================================

export class Vector3Proxy {
  private _target: Vector3
  private _onChange: () => void

  constructor(target: Vector3, onChange: () => void) {
    this._target = target
    this._onChange = onChange
  }

  get x(): number {
    return this._target.x
  }

  set x(value: number) {
    if (this._target.x !== value) {
      this._target.x = value
      this._onChange()
    }
  }

  get y(): number {
    return this._target.y
  }

  set y(value: number) {
    if (this._target.y !== value) {
      this._target.y = value
      this._onChange()
    }
  }

  get z(): number {
    return this._target.z
  }

  set z(value: number) {
    if (this._target.z !== value) {
      this._target.z = value
      this._onChange()
    }
  }

  // Three.js 风格的 set 方法
  set(x: number, y: number, z: number): Vector3Proxy {
    let changed = false
    if (this._target.x !== x) {
      this._target.x = x
      changed = true
    }
    if (this._target.y !== y) {
      this._target.y = y
      changed = true
    }
    if (this._target.z !== z) {
      this._target.z = z
      changed = true
    }
    if (changed) {
      this._onChange()
    }
    return this
  }

  // 复制方法
  copy(other: Vector3): Vector3Proxy {
    return this.set(other.x, other.y, other.z)
  }

  // 克隆方法
  clone(): Vector3 {
    return { x: this._target.x, y: this._target.y, z: this._target.z }
  }

  // 转换为普通对象
  toObject(): Vector3 {
    return { x: this._target.x, y: this._target.y, z: this._target.z }
  }

  // 长度计算
  length(): number {
    return Math.sqrt(this._target.x * this._target.x + this._target.y * this._target.y + this._target.z * this._target.z)
  }

  // 标准化
  normalize(): Vector3Proxy {
    const length = this.length()
    if (length > 0) {
      return this.set(this._target.x / length, this._target.y / length, this._target.z / length)
    }
    return this
  }
}

// ============================================================================
// 3D 变换工具类
// ============================================================================

export class Transform3DHelper {
  static identity(): Transform3D {
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    }
  }

  static fromThreeMatrix4(matrix: THREE.Matrix4): Transform3D {
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()

    matrix.decompose(position, quaternion, scale)

    const euler = new THREE.Euler().setFromQuaternion(quaternion)

    return {
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: euler.x, y: euler.y, z: euler.z },
      scale: { x: scale.x, y: scale.y, z: scale.z }
    }
  }

  static toThreeMatrix4(transform: Transform3D): THREE.Matrix4 {
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3(transform.position.x, transform.position.y, transform.position.z)
    const rotation = new THREE.Euler(transform.rotation.x, transform.rotation.y, transform.rotation.z)
    const scale = new THREE.Vector3(transform.scale.x, transform.scale.y, transform.scale.z)

    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    return matrix
  }

  static multiply(a: Transform3D, b: Transform3D): Transform3D {
    const matrixA = Transform3DHelper.toThreeMatrix4(a)
    const matrixB = Transform3DHelper.toThreeMatrix4(b)
    const result = matrixA.multiply(matrixB)
    return Transform3DHelper.fromThreeMatrix4(result)
  }

  static inverse(transform: Transform3D): Transform3D {
    const matrix = Transform3DHelper.toThreeMatrix4(transform)
    matrix.invert()
    return Transform3DHelper.fromThreeMatrix4(matrix)
  }

  static transformPoint(transform: Transform3D, point: Vector3): Vector3 {
    const matrix = Transform3DHelper.toThreeMatrix4(transform)
    const vector = new THREE.Vector3(point.x, point.y, point.z)
    vector.applyMatrix4(matrix)
    return { x: vector.x, y: vector.y, z: vector.z }
  }
}

// ============================================================================
// Node3D 类
// ============================================================================

export class Node3D extends Node {
  private _position: Vector3 = { x: 0, y: 0, z: 0 }
  private _rotation: Vector3 = { x: 0, y: 0, z: 0 }
  private _scale: Vector3 = { x: 1, y: 1, z: 1 }
  protected _node3DVisible: boolean = true

  // Vector3Proxy 实例
  private _positionProxy: Vector3Proxy
  private _rotationProxy: Vector3Proxy
  private _scaleProxy: Vector3Proxy

  // Three.js 对象 - 使用父类的object3D属性

  // 静态属性元数据定义
  static _propertyMetadata = new Map<string, PropertyMetadata>([
    ['position', {
      name: 'position',
      type: 'vector3',
      group: 'Transform',
      order: 0,
      controlType: 'vector3',
      step: 0.01,
      vectorLabels: ['X', 'Y', 'Z'],
      description: 'Local position of the node'
    }],
    ['rotation', {
      name: 'rotation',
      type: 'vector3',
      group: 'Transform',
      order: 1,
      controlType: 'vector3',
      step: 0.01,
      vectorLabels: ['X', 'Y', 'Z'],
      description: 'Local rotation of the node in radians'
    }],
    ['scale', {
      name: 'scale',
      type: 'vector3',
      group: 'Transform',
      order: 2,
      controlType: 'vector3',
      step: 0.01,
      min: 0.001,
      vectorLabels: ['X', 'Y', 'Z'],
      description: 'Local scale of the node'
    }],
    ['visible', {
      name: 'visible',
      type: 'bool',
      group: 'Visibility',
      order: 0,
      controlType: 'toggle',
      description: 'Whether the node is visible'
    }]
  ])

  // 缓存的变换矩阵
  private _localTransform: Transform3D | null = null
  private _globalTransform: Transform3D | null = null
  protected _node3DTransformDirty: boolean = true

  constructor(name: string = 'Node3D') {
    super(name)

    // 设置渲染层为3D
    this.renderLayer = '3D'

    // 初始化 Vector3Proxy 实例
    this._positionProxy = new Vector3Proxy(this._position, () => {
      this._markTransformDirty()
      this._updateThreeObject()
    })
    this._rotationProxy = new Vector3Proxy(this._rotation, () => {
      this._markTransformDirty()
      this._updateThreeObject()
    })
    this._scaleProxy = new Vector3Proxy(this._scale, () => {
      this._markTransformDirty()
      this._updateThreeObject()
    })

    this.initializeNode3DSignals()
    this.initializeNode3DProperties()
    this._updateThreeObject()
  }

  /**
   * 重写createObject3D方法以创建Three.js Object3D
   * 子类可以重写此方法创建特定类型的Three.js对象
   * @returns Three.js Object3D实例
   */
  protected createObject3D(): THREE.Object3D {
    return new THREE.Object3D()
  }

  // ========================================================================
  // Three.js 集成
  // ========================================================================

  get threeObject(): THREE.Object3D {
    return this.object3D
  }

  protected setThreeObject(object: THREE.Object3D): void {
    // 保存当前变换
    const currentTransform = this.getLocalTransform()

    // 移除旧对象的父子关系
    if (this.object3D.parent) {
      this.object3D.parent.remove(this.object3D)
    }

    // 设置新对象 - 需要更新父类的_object3D属性
    this._object3D = object
    this._object3D.name = this.name
    this._object3D.userData.qaqNode = this

    // 恢复变换
    this.setLocalTransform(currentTransform)

    // 重新建立父子关系
    if (this.parent && this.parent instanceof Node3D) {
      this.parent.object3D.add(this.object3D)
    }
  }

  // ========================================================================
  // 位置属性
  // ========================================================================

  get position(): Vector3Proxy {
    return this._positionProxy
  }

  set position(value: Vector3) {
    if (this._position.x !== value.x || this._position.y !== value.y || this._position.z !== value.z) {
      const oldValue = { ...this._position }
      this._position = { ...value }
      this._markTransformDirty()
      this._updateThreeObject()
      this.emit('position_changed', this._position)
      this.emit('property_changed', 'position', oldValue, this._position)
    }
  }

  // 获取位置的普通对象副本（用于属性检查器等）
  getPositionValue(): Vector3 {
    return { ...this._position }
  }

  get globalPosition(): Vector3 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.position }
  }

  set globalPosition(value: Vector3) {
    if (this.parent && this.parent instanceof Node3D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      const parentInverse = Transform3DHelper.inverse(parentGlobalTransform)
      this.position = Transform3DHelper.transformPoint(parentInverse, value)
    } else {
      this.position = value
    }
  }

  // ========================================================================
  // 旋转属性
  // ========================================================================

  get rotation(): Vector3Proxy {
    return this._rotationProxy
  }

  set rotation(value: Vector3) {
    if (this._rotation.x !== value.x || this._rotation.y !== value.y || this._rotation.z !== value.z) {
      const oldValue = { ...this._rotation }
      this._rotation = { ...value }
      this._markTransformDirty()
      this._updateThreeObject()
      this.emit('rotation_changed', this._rotation)
      this.emit('property_changed', 'rotation', oldValue, this._rotation)
    }
  }

  // 获取旋转的普通对象副本
  getRotationValue(): Vector3 {
    return { ...this._rotation }
  }

  get rotationDegrees(): Vector3 {
    return {
      x: this._rotation.x * 180 / Math.PI,
      y: this._rotation.y * 180 / Math.PI,
      z: this._rotation.z * 180 / Math.PI
    }
  }

  set rotationDegrees(value: Vector3) {
    this.rotation = {
      x: value.x * Math.PI / 180,
      y: value.y * Math.PI / 180,
      z: value.z * Math.PI / 180
    }
  }

  get globalRotation(): Vector3 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.rotation }
  }

  set globalRotation(value: Vector3) {
    if (this.parent && this.parent instanceof Node3D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      // 简化实现，实际应该使用四元数计算
      this.rotation = {
        x: value.x - parentGlobalTransform.rotation.x,
        y: value.y - parentGlobalTransform.rotation.y,
        z: value.z - parentGlobalTransform.rotation.z
      }
    } else {
      this.rotation = value
    }
  }

  // ========================================================================
  // 缩放属性
  // ========================================================================

  get scale(): Vector3Proxy {
    return this._scaleProxy
  }

  set scale(value: Vector3) {
    if (this._scale.x !== value.x || this._scale.y !== value.y || this._scale.z !== value.z) {
      const oldValue = { ...this._scale }
      this._scale = { ...value }
      this._markTransformDirty()
      this._updateThreeObject()
      this.emit('scale_changed', this._scale)
      this.emit('property_changed', 'scale', oldValue, this._scale)
    }
  }

  // 获取缩放的普通对象副本
  getScaleValue(): Vector3 {
    return { ...this._scale }
  }

  get globalScale(): Vector3 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.scale }
  }

  set globalScale(value: Vector3) {
    if (this.parent && this.parent instanceof Node3D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      this.scale = {
        x: value.x / parentGlobalTransform.scale.x,
        y: value.y / parentGlobalTransform.scale.y,
        z: value.z / parentGlobalTransform.scale.z
      }
    } else {
      this.scale = value
    }
  }

  // ========================================================================
  // 可见性
  // ========================================================================

  get node3DVisible(): boolean {
    return this._node3DVisible
  }

  set node3DVisible(value: boolean) {
    if (this._node3DVisible !== value) {
      const oldValue = this._node3DVisible
      this._node3DVisible = value
      this.object3D.visible = value
      this.emit('visibility_changed', this._node3DVisible)
      this.emit('property_changed', 'visible', oldValue, this._node3DVisible)
    }
  }

  // ========================================================================
  // 变换矩阵方法
  // ========================================================================

  getLocalTransform(): Transform3D {
    if (this._node3DTransformDirty || !this._localTransform) {
      this._localTransform = {
        position: { ...this._position },
        rotation: { ...this._rotation },
        scale: { ...this._scale }
      }
      this._node3DTransformDirty = false
    }
    return this._localTransform
  }

  getGlobalTransform(): Transform3D {
    if (!this._globalTransform || this._node3DTransformDirty) {
      const localTransform = this.getLocalTransform()

      if (this.parent && this.parent instanceof Node3D) {
        const parentGlobalTransform = this.parent.getGlobalTransform()
        this._globalTransform = Transform3DHelper.multiply(parentGlobalTransform, localTransform)
      } else {
        this._globalTransform = { ...localTransform }
      }
    }
    return this._globalTransform
  }

  setLocalTransform(transform: Transform3D): void {
    this.position = transform.position
    this.rotation = transform.rotation
    this.scale = transform.scale
  }

  setGlobalTransform(transform: Transform3D): void {
    if (this.parent && this.parent instanceof Node3D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      const parentInverse = Transform3DHelper.inverse(parentGlobalTransform)
      const localTransform = Transform3DHelper.multiply(parentInverse, transform)
      this.setLocalTransform(localTransform)
    } else {
      this.setLocalTransform(transform)
    }
  }

  // ========================================================================
  // 变换操作方法
  // ========================================================================

  translate(offset: Vector3): void {
    this.position = {
      x: this._position.x + offset.x,
      y: this._position.y + offset.y,
      z: this._position.z + offset.z
    }
  }

  rotateX(angle: number): void {
    this.rotation = { ...this._rotation, x: this._rotation.x + angle }
  }

  rotateY(angle: number): void {
    this.rotation = { ...this._rotation, y: this._rotation.y + angle }
  }

  rotateZ(angle: number): void {
    this.rotation = { ...this._rotation, z: this._rotation.z + angle }
  }

  scaleBy(factor: Vector3): void {
    this.scale = {
      x: this._scale.x * factor.x,
      y: this._scale.y * factor.y,
      z: this._scale.z * factor.z
    }
  }

  lookAt(target: Vector3, up: Vector3 = { x: 0, y: 1, z: 0 }): void {
    const targetVector = new THREE.Vector3(target.x, target.y, target.z)
    const upVector = new THREE.Vector3(up.x, up.y, up.z)
    const position = new THREE.Vector3(this._position.x, this._position.y, this._position.z)

    const matrix = new THREE.Matrix4()
    matrix.lookAt(position, targetVector, upVector)

    const euler = new THREE.Euler().setFromRotationMatrix(matrix)
    this.rotation = { x: euler.x, y: euler.y, z: euler.z }
    
    // 立即更新Three.js对象
    this._updateThreeObject()
    
    if (this.debug) {
      console.log(`${this.name} lookAt 调用:`, { target, up })
    }
  }

  // ========================================================================
  // 坐标转换方法
  // ========================================================================

  toLocal(globalPoint: Vector3): Vector3 {
    const globalTransform = this.getGlobalTransform()
    const inverse = Transform3DHelper.inverse(globalTransform)
    return Transform3DHelper.transformPoint(inverse, globalPoint)
  }

  toGlobal(localPoint: Vector3): Vector3 {
    const globalTransform = this.getGlobalTransform()
    return Transform3DHelper.transformPoint(globalTransform, localPoint)
  }

  // ========================================================================
  // 节点树重写
  // ========================================================================

  // addChild和removeChild方法由父类Node处理Three.js场景图同步

  // ========================================================================
  // 辅助方法
  // ========================================================================

  private _updateThreeObject(): void {
    // 更新位置
    this.object3D.position.set(this._position.x, this._position.y, this._position.z)
    
    // 更新旋转
    this.object3D.rotation.set(this._rotation.x, this._rotation.y, this._rotation.z)
    
    // 更新缩放
    this.object3D.scale.set(this._scale.x, this._scale.y, this._scale.z)
    
    // 更新可见性
    this.object3D.visible = this._node3DVisible && this.visible
    
    // 标记变换为干净状态
    this._node3DTransformDirty = false
    
    // 输出调试信息
    if (this.debug) {
      console.log(`${this.name} 3D对象已更新:`, {
        position: this._position,
        rotation: this._rotation,
        scale: this._scale
      })
    }
  }

  private _markTransformDirty(): void {
    this._node3DTransformDirty = true
    this._globalTransform = null

    // 标记所有子节点的变换为脏
    for (const child of this.children) {
      if (child instanceof Node3D) {
        child._markTransformDirty()
      }
    }
  }

  // ========================================================================
  // 信号和属性初始化
  // ========================================================================

  protected initializeNode3DSignals(): void {
    this.addSignal('position_changed')
    this.addSignal('rotation_changed')
    this.addSignal('scale_changed')
    this.addSignal('visibility_changed')
  }

  protected initializeNode3DProperties(): void {
    this.addProperty({ name: 'position', type: 'vector3', usage: 1 }, this._position)
    this.addProperty({ name: 'rotation', type: 'vector3', usage: 1 }, this._rotation)
    this.addProperty({ name: 'scale', type: 'vector3', usage: 1 }, this._scale)
    this.addProperty({ name: 'visible', type: 'bool', usage: 1 }, this._visible)
  }

  // ========================================================================
  // 销毁方法
  // ========================================================================

  override destroy(): void {
    // 清理 Three.js 对象
    if (this.object3D.parent) {
      this.object3D.parent.remove(this.object3D)
    }

    // 清理几何体和材质（如果有的话）
    if (this.object3D instanceof THREE.Mesh) {
      if (this.object3D.geometry) {
        this.object3D.geometry.dispose()
      }
      if (this.object3D.material) {
        if (Array.isArray(this.object3D.material)) {
          this.object3D.material.forEach(material => material.dispose())
        } else {
          this.object3D.material.dispose()
        }
      }
    }

    super.destroy()
  }
}

export default Node3D
