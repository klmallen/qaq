/**
 * QAQ 游戏引擎 2D 节点基类
 * 提供 2D 变换、渲染和交互功能
 * 类似于 Godot 的 Node2D 类
 */

import Node from './Node'
import type { Vector2, Transform2D } from '../../types/core'
import Engine from '../engine/Engine'

// ============================================================================
// 2D 变换工具类
// ============================================================================

export class Transform2DHelper {
  static identity(): Transform2D {
    return {
      position: { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 }
    }
  }

  static multiply(a: Transform2D, b: Transform2D): Transform2D {
    // 简化的变换矩阵乘法
    const cos = Math.cos(a.rotation)
    const sin = Math.sin(a.rotation)

    return {
      position: {
        x: a.position.x + (b.position.x * cos - b.position.y * sin) * a.scale.x,
        y: a.position.y + (b.position.x * sin + b.position.y * cos) * a.scale.y
      },
      rotation: a.rotation + b.rotation,
      scale: {
        x: a.scale.x * b.scale.x,
        y: a.scale.y * b.scale.y
      }
    }
  }

  static inverse(transform: Transform2D): Transform2D {
    const cos = Math.cos(-transform.rotation)
    const sin = Math.sin(-transform.rotation)
    const invScaleX = 1 / transform.scale.x
    const invScaleY = 1 / transform.scale.y

    return {
      position: {
        x: -(transform.position.x * cos - transform.position.y * sin) * invScaleX,
        y: -(transform.position.x * sin + transform.position.y * cos) * invScaleY
      },
      rotation: -transform.rotation,
      scale: {
        x: invScaleX,
        y: invScaleY
      }
    }
  }

  static transformPoint(transform: Transform2D, point: Vector2): Vector2 {
    const cos = Math.cos(transform.rotation)
    const sin = Math.sin(transform.rotation)

    return {
      x: transform.position.x + (point.x * cos - point.y * sin) * transform.scale.x,
      y: transform.position.y + (point.x * sin + point.y * cos) * transform.scale.y
    }
  }
}

// ============================================================================
// Node2D 类
// ============================================================================

export class Node2D extends Node {
  private _position: Vector2 = { x: 0, y: 0 }
  private _rotation: number = 0
  private _scale: Vector2 = { x: 1, y: 1 }
  private _skew: number = 0
  private _zIndex: number = 0
  private _zAsRelative: boolean = true
  private _visible: boolean = true
  private _modulate: { r: number, g: number, b: number, a: number } = { r: 1, g: 1, b: 1, a: 1 }

  // 缓存的变换矩阵
  private _localTransform: Transform2D | null = null
  private _globalTransform: Transform2D | null = null
  private _transformDirty: boolean = true

  constructor(name: string = 'Node2D') {
    super(name)
    this._className = 'Node2D'
    this._renderLayer = '2D' // 确保2D节点渲染在2D层
    this.initializeNode2DSignals()
    this.initializeNode2DProperties()
    this._updateThreeJSTransform() // 初始化Three.js变换
  }

  // ========================================================================
  // 位置属性
  // ========================================================================

  get position(): Vector2 {
    return { ...this._position }
  }

  set position(value: Vector2) {
    if (this._position.x !== value.x || this._position.y !== value.y) {
      this._position = { ...value }
      this._markTransformDirty()
      this._updateThreeJSTransform()
      this.emit('position_changed', this._position)
    }
  }

  get globalPosition(): Vector2 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.position }
  }

  set globalPosition(value: Vector2) {
    if (this.parent && this.parent instanceof Node2D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      const parentInverse = Transform2DHelper.inverse(parentGlobalTransform)
      this.position = Transform2DHelper.transformPoint(parentInverse, value)
    } else {
      this.position = value
    }
  }

  // ========================================================================
  // 旋转属性
  // ========================================================================

  get rotation(): number {
    return this._rotation
  }

  set rotation(value: number) {
    if (this._rotation !== value) {
      this._rotation = value
      this._markTransformDirty()
      this._updateThreeJSTransform()
      this.emit('rotation_changed', this._rotation)
    }
  }

  get rotationDegrees(): number {
    return this._rotation * 180 / Math.PI
  }

  set rotationDegrees(value: number) {
    this.rotation = value * Math.PI / 180
  }

  get globalRotation(): number {
    const globalTransform = this.getGlobalTransform()
    return globalTransform.rotation
  }

  set globalRotation(value: number) {
    if (this.parent && this.parent instanceof Node2D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      this.rotation = value - parentGlobalTransform.rotation
    } else {
      this.rotation = value
    }
  }

  // ========================================================================
  // 缩放属性
  // ========================================================================

  get scale(): Vector2 {
    return { ...this._scale }
  }

  set scale(value: Vector2) {
    if (this._scale.x !== value.x || this._scale.y !== value.y) {
      this._scale = { ...value }
      this._markTransformDirty()
      this._updateThreeJSTransform()
      this.emit('scale_changed', this._scale)
    }
  }

  get globalScale(): Vector2 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.scale }
  }

  set globalScale(value: Vector2) {
    if (this.parent && this.parent instanceof Node2D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      this.scale = {
        x: value.x / parentGlobalTransform.scale.x,
        y: value.y / parentGlobalTransform.scale.y
      }
    } else {
      this.scale = value
    }
  }

  // ========================================================================
  // 其他变换属性
  // ========================================================================

  get skew(): number {
    return this._skew
  }

  set skew(value: number) {
    if (this._skew !== value) {
      this._skew = value
      this._markTransformDirty()
      this.emit('skew_changed', this._skew)
    }
  }

  get zIndex(): number {
    return this._zIndex
  }

  set zIndex(value: number) {
    if (this._zIndex !== value) {
      this._zIndex = value
      this.emit('z_index_changed', this._zIndex)
    }
  }

  get zAsRelative(): boolean {
    return this._zAsRelative
  }

  set zAsRelative(value: boolean) {
    if (this._zAsRelative !== value) {
      this._zAsRelative = value
      this.emit('z_as_relative_changed', this._zAsRelative)
    }
  }

  // ========================================================================
  // 可见性和调制
  // ========================================================================

  get visible(): boolean {
    return this._visible
  }

  set visible(value: boolean) {
    if (this._visible !== value) {
      this._visible = value
      this._updateThreeJSTransform()
      this.emit('visibility_changed', this._visible)
    }
  }

  get modulate(): { r: number, g: number, b: number, a: number } {
    return { ...this._modulate }
  }

  set modulate(value: { r: number, g: number, b: number, a: number }) {
    this._modulate = { ...value }
    this.emit('modulate_changed', this._modulate)
  }

  // ========================================================================
  // 变换矩阵方法
  // ========================================================================

  getLocalTransform(): Transform2D {
    if (this._transformDirty || !this._localTransform) {
      this._localTransform = {
        position: { ...this._position },
        rotation: this._rotation,
        scale: { ...this._scale }
      }
      this._transformDirty = false
    }
    return this._localTransform
  }

  getGlobalTransform(): Transform2D {
    if (!this._globalTransform || this._transformDirty) {
      const localTransform = this.getLocalTransform()

      if (this.parent && this.parent instanceof Node2D) {
        const parentGlobalTransform = this.parent.getGlobalTransform()
        this._globalTransform = Transform2DHelper.multiply(parentGlobalTransform, localTransform)
      } else {
        this._globalTransform = { ...localTransform }
      }
    }
    return this._globalTransform
  }

  setGlobalTransform(transform: Transform2D): void {
    if (this.parent && this.parent instanceof Node2D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      const parentInverse = Transform2DHelper.inverse(parentGlobalTransform)
      const localTransform = Transform2DHelper.multiply(parentInverse, transform)

      this.position = localTransform.position
      this.rotation = localTransform.rotation
      this.scale = localTransform.scale
    } else {
      this.position = transform.position
      this.rotation = transform.rotation
      this.scale = transform.scale
    }
  }

  // ========================================================================
  // 变换操作方法
  // ========================================================================

  translate(offset: Vector2): void {
    this.position = {
      x: this._position.x + offset.x,
      y: this._position.y + offset.y
    }
  }

  rotate(angle: number): void {
    this.rotation = this._rotation + angle
  }

  scaleBy(factor: Vector2): void {
    this.scale = {
      x: this._scale.x * factor.x,
      y: this._scale.y * factor.y
    }
  }

  lookAt(point: Vector2): void {
    const direction = {
      x: point.x - this._position.x,
      y: point.y - this._position.y
    }
    this.rotation = Math.atan2(direction.y, direction.x)
  }

  // ========================================================================
  // 坐标转换方法
  // ========================================================================

  toLocal(globalPoint: Vector2): Vector2 {
    const globalTransform = this.getGlobalTransform()
    const inverse = Transform2DHelper.inverse(globalTransform)
    return Transform2DHelper.transformPoint(inverse, globalPoint)
  }

  toGlobal(localPoint: Vector2): Vector2 {
    const globalTransform = this.getGlobalTransform()
    return Transform2DHelper.transformPoint(globalTransform, localPoint)
  }

  // ========================================================================
  // 辅助方法
  // ========================================================================

  private _markTransformDirty(): void {
    this._transformDirty = true
    this._globalTransform = null

    // 标记所有子节点的变换为脏
    for (const child of this.children) {
      if (child instanceof Node2D) {
        child._markTransformDirty()
      }
    }
  }

  // ========================================================================
  // 信号和属性初始化
  // ========================================================================

  protected initializeNode2DSignals(): void {
    this.addSignal('position_changed')
    this.addSignal('rotation_changed')
    this.addSignal('scale_changed')
    this.addSignal('skew_changed')
    this.addSignal('z_index_changed')
    this.addSignal('z_as_relative_changed')
    this.addSignal('visibility_changed')
    this.addSignal('modulate_changed')
  }

  protected initializeNode2DProperties(): void {
    this.addProperty({ name: 'position', type: 'vector2', usage: 1 }, this._position)
    this.addProperty({ name: 'rotation', type: 'float', usage: 1 }, this._rotation)
    this.addProperty({ name: 'scale', type: 'vector2', usage: 1 }, this._scale)
    this.addProperty({ name: 'skew', type: 'float', usage: 1 }, this._skew)
    this.addProperty({ name: 'z_index', type: 'int', usage: 1 }, this._zIndex)
    this.addProperty({ name: 'z_as_relative', type: 'bool', usage: 1 }, this._zAsRelative)
    this.addProperty({ name: 'visible', type: 'bool', usage: 1 }, this._visible)
    this.addProperty({ name: 'modulate', type: 'color', usage: 1 }, this._modulate)
  }

  // ========================================================================
  // Three.js 集成方法
  // ========================================================================

  /**
   * 将2D坐标转换为Three.js坐标
   * 2D坐标系：(0,0)在左上角，Y轴向下
   * Three.js坐标系（2D相机）：(0,0)在左上角，Y轴向下（已调整）
   */
  private _convert2DToThreeJS(pos2D: Vector2): { x: number, y: number, z: number } {
    // 2D相机已经设置为左上角原点，Y轴向下，直接使用坐标
    return {
      x: pos2D.x,               // X坐标直接使用
      y: pos2D.y,               // Y坐标直接使用（相机已经调整了Y轴方向）
      z: this._zIndex * 0.1     // Z轴基于zIndex
    }
  }

  /**
   * 更新Three.js对象的变换
   */
  private _updateThreeJSTransform(): void {
    if (!this.object3D) return

    // 转换2D坐标到Three.js坐标
    const threePos = this._convert2DToThreeJS(this._position)

    // 更新位置
    this.object3D.position.set(threePos.x, threePos.y, threePos.z)

    // 更新旋转（2D只有Z轴旋转）
    this.object3D.rotation.set(0, 0, this._rotation)

    // 更新缩放
    this.object3D.scale.set(this._scale.x, this._scale.y, 1)

    // 更新可见性
    this.object3D.visible = this._visible && this.visible

    // 标记变换已同步
    this._transformDirty = false
  }

  /**
   * 重写父类的同步方法
   */
  protected syncTransformToThreeJS(): void {
    this._updateThreeJSTransform()
  }

  /**
   * 获取2D世界位置（重写父类方法）
   */
  get globalPosition(): Vector2 {
    const globalTransform = this.getGlobalTransform()
    return { ...globalTransform.position }
  }

  /**
   * 设置2D世界位置（重写父类方法）
   */
  set globalPosition(value: Vector2) {
    if (this.parent && this.parent instanceof Node2D) {
      const parentGlobalTransform = this.parent.getGlobalTransform()
      const parentInverse = Transform2DHelper.inverse(parentGlobalTransform)
      this.position = Transform2DHelper.transformPoint(parentInverse, value)
    } else {
      this.position = value
    }
  }
}

export default Node2D
