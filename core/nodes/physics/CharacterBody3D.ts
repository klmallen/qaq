/**
 * QAQ游戏引擎 - CharacterBody3D 角色控制器节点
 * 
 * 功能：运动学角色控制器，支持地面检测、墙壁滑动等
 * 特性：精确移动控制、碰撞响应、地形适应
 */

import Node3D from '../Node3D'
import CollisionShape3D from './CollisionShape3D'
import PhysicsServer from '../../physics/PhysicsServer'
import type { Vector3 } from '../../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface CharacterConfig {
  enabled: boolean
  floorMaxAngle: number         // 地面最大角度 (弧度)
  wallMinSlideAngle: number     // 墙壁最小滑动角度 (弧度)
  maxSlides: number             // 最大滑动次数
  snapLength: number            // 地面吸附长度
  safeMargin: number            // 安全边距
  collisionLayer: number        // 碰撞层
  collisionMask: number         // 碰撞掩码
}

export interface CollisionInfo {
  collided: boolean
  normal: Vector3
  point: Vector3
  distance: number
  collider: Node3D | null
  remainder: Vector3
}

export interface MovementState {
  velocity: Vector3
  isOnFloor: boolean
  isOnWall: boolean
  isOnCeiling: boolean
  floorNormal: Vector3
  wallNormal: Vector3
  lastMotion: Vector3
}

export interface CharacterStats {
  totalMoves: number
  totalSlides: number
  averageSlideCount: number
  floorTime: number
  airTime: number
  wallTime: number
}

// ============================================================================
// CharacterBody3D 实现
// ============================================================================

export class CharacterBody3D extends Node3D {
  private _config: CharacterConfig
  private _physicsServer: PhysicsServer
  private _collisionShapes: CollisionShape3D[] = []
  private _physicsBody: any = null
  
  // 移动状态
  private _movementState: MovementState = {
    velocity: { x: 0, y: 0, z: 0 },
    isOnFloor: false,
    isOnWall: false,
    isOnCeiling: false,
    floorNormal: { x: 0, y: 1, z: 0 },
    wallNormal: { x: 0, y: 0, z: 0 },
    lastMotion: { x: 0, y: 0, z: 0 }
  }
  
  // 统计信息
  private _stats: CharacterStats = {
    totalMoves: 0,
    totalSlides: 0,
    averageSlideCount: 0,
    floorTime: 0,
    airTime: 0,
    wallTime: 0
  }
  
  private _isInitialized: boolean = false
  private _lastUpdateTime: number = 0

  // 默认配置
  static readonly DEFAULT_CONFIG: CharacterConfig = {
    enabled: true,
    floorMaxAngle: Math.PI / 4,      // 45度
    wallMinSlideAngle: Math.PI / 6,   // 30度
    maxSlides: 4,
    snapLength: 0.1,
    safeMargin: 0.001,
    collisionLayer: 1,
    collisionMask: 1
  }

  constructor(name: string = 'CharacterBody3D', config: Partial<CharacterConfig> = {}) {
    super(name)
    
    this._physicsServer = PhysicsServer.getInstance()
    this._config = { ...CharacterBody3D.DEFAULT_CONFIG, ...config }
    this._lastUpdateTime = performance.now()
  }

  // ========================================================================
  // 移动控制方法
  // ========================================================================

  /**
   * 移动并滑动
   * @param velocity 速度向量
   * @returns 实际移动后的速度
   */
  moveAndSlide(velocity: Vector3): Vector3 {
    if (!this._isInitialized || !this._config.enabled) {
      return velocity
    }

    this._movementState.velocity = { ...velocity }
    const deltaTime = this._getDeltaTime()
    
    // 计算移动距离
    const motion: Vector3 = {
      x: velocity.x * deltaTime,
      y: velocity.y * deltaTime,
      z: velocity.z * deltaTime
    }

    // 执行移动和滑动
    const result = this._performMoveAndSlide(motion)
    
    // 更新统计信息
    this._updateStats(result.slideCount)
    
    return result.velocity
  }

  /**
   * 移动并碰撞
   * @param motion 移动向量
   * @returns 碰撞信息，如果没有碰撞返回null
   */
  moveAndCollide(motion: Vector3): CollisionInfo | null {
    if (!this._isInitialized || !this._config.enabled) {
      return null
    }

    const result = this._performRaycast(motion)
    
    if (result.collided) {
      // 移动到碰撞点
      const safeMotion = this._calculateSafeMotion(motion, result.distance)
      this._applyMotion(safeMotion)
      
      return {
        collided: true,
        normal: result.normal,
        point: result.point,
        distance: result.distance,
        collider: result.collider,
        remainder: this._subtractVectors(motion, safeMotion)
      }
    } else {
      // 没有碰撞，直接移动
      this._applyMotion(motion)
      return null
    }
  }

  // ========================================================================
  // 状态查询方法
  // ========================================================================

  /**
   * 是否在地面上
   * @returns 是否在地面
   */
  isOnFloor(): boolean {
    return this._movementState.isOnFloor
  }

  /**
   * 是否靠着墙壁
   * @returns 是否靠着墙壁
   */
  isOnWall(): boolean {
    return this._movementState.isOnWall
  }

  /**
   * 是否碰到天花板
   * @returns 是否碰到天花板
   */
  isOnCeiling(): boolean {
    return this._movementState.isOnCeiling
  }

  /**
   * 获取地面法向量
   * @returns 地面法向量
   */
  getFloorNormal(): Vector3 {
    return { ...this._movementState.floorNormal }
  }

  /**
   * 获取墙壁法向量
   * @returns 墙壁法向量
   */
  getWallNormal(): Vector3 {
    return { ...this._movementState.wallNormal }
  }

  /**
   * 获取当前速度
   * @returns 当前速度
   */
  getVelocity(): Vector3 {
    return { ...this._movementState.velocity }
  }

  /**
   * 获取移动统计信息
   * @returns 统计信息
   */
  getStats(): CharacterStats {
    return { ...this._stats }
  }

  // ========================================================================
  // 配置方法
  // ========================================================================

  /**
   * 设置地面最大角度
   * @param angle 角度 (弧度)
   */
  setFloorMaxAngle(angle: number): void {
    this._config.floorMaxAngle = angle
  }

  /**
   * 设置墙壁最小滑动角度
   * @param angle 角度 (弧度)
   */
  setWallMinSlideAngle(angle: number): void {
    this._config.wallMinSlideAngle = angle
  }

  /**
   * 设置最大滑动次数
   * @param maxSlides 最大滑动次数
   */
  setMaxSlides(maxSlides: number): void {
    this._config.maxSlides = Math.max(1, maxSlides)
  }

  /**
   * 设置地面吸附长度
   * @param length 吸附长度
   */
  setSnapLength(length: number): void {
    this._config.snapLength = Math.max(0, length)
  }

  // ========================================================================
  // 碰撞形状管理
  // ========================================================================

  /**
   * 添加碰撞形状
   * @param shape 碰撞形状
   */
  addCollisionShape(shape: CollisionShape3D): void {
    if (this._collisionShapes.includes(shape)) return
    
    this._collisionShapes.push(shape)
    this.addChild(shape)
    
    if (this._isInitialized) {
      this._updatePhysicsBody()
    }
  }

  /**
   * 移除碰撞形状
   * @param shape 碰撞形状
   */
  removeCollisionShape(shape: CollisionShape3D): void {
    const index = this._collisionShapes.indexOf(shape)
    if (index >= 0) {
      this._collisionShapes.splice(index, 1)
      this.removeChild(shape)
      
      if (this._isInitialized) {
        this._updatePhysicsBody()
      }
    }
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  override _ready(): void {
    super._ready()
    this._initializePhysicsBody()
  }

  override _process(deltaTime: number): void {
    super._process(deltaTime)
    
    if (this._isInitialized && this._config.enabled) {
      this._updateMovementState(deltaTime)
    }
  }

  override _exitTree(): void {
    this._cleanupPhysicsBody()
    super._exitTree()
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  private _initializePhysicsBody(): void {
    if (this._isInitialized) return

    // 创建运动学物理体
    this._physicsBody = this._physicsServer.createKinematicBody()
    if (!this._physicsBody) {
      console.error('Failed to create kinematic body')
      return
    }

    // 配置物理体
    this._updatePhysicsBody()
    
    this._isInitialized = true
    console.log(`CharacterBody3D initialized: ${this.name}`)
  }

  private _updatePhysicsBody(): void {
    if (!this._physicsBody) return

    // 更新物理体的形状
    this._physicsBody.clearShapes()
    
    this._collisionShapes.forEach(shape => {
      if (shape.physicsShape) {
        this._physicsBody.addShape(shape.physicsShape, shape.getGlobalTransform())
      }
    })

    // 更新物理体变换
    this._physicsBody.setTransform(this.getGlobalTransform())
    
    // 设置碰撞层和掩码
    this._physicsBody.setCollisionLayer(this._config.collisionLayer)
    this._physicsBody.setCollisionMask(this._config.collisionMask)
  }

  private _performMoveAndSlide(motion: Vector3): { velocity: Vector3; slideCount: number } {
    let remainingMotion = { ...motion }
    let slideCount = 0
    const deltaTime = this._getDeltaTime()
    
    // 重置状态
    this._movementState.isOnFloor = false
    this._movementState.isOnWall = false
    this._movementState.isOnCeiling = false

    for (let i = 0; i < this._config.maxSlides && this._vectorLength(remainingMotion) > this._config.safeMargin; i++) {
      const collision = this._performRaycast(remainingMotion)
      
      if (!collision.collided) {
        // 没有碰撞，直接移动
        this._applyMotion(remainingMotion)
        break
      }

      // 移动到碰撞点
      const safeMotion = this._calculateSafeMotion(remainingMotion, collision.distance)
      this._applyMotion(safeMotion)

      // 更新状态
      this._updateCollisionState(collision.normal)

      // 计算滑动
      remainingMotion = this._calculateSlideMotion(remainingMotion, collision.normal, collision.distance)
      slideCount++
    }

    // 计算最终速度
    const finalVelocity: Vector3 = {
      x: this._movementState.lastMotion.x / deltaTime,
      y: this._movementState.lastMotion.y / deltaTime,
      z: this._movementState.lastMotion.z / deltaTime
    }

    return { velocity: finalVelocity, slideCount }
  }

  private _performRaycast(motion: Vector3): any {
    // 这里需要实现实际的射线检测
    // 简化实现，实际项目中需要调用物理引擎的射线检测
    return {
      collided: false,
      normal: { x: 0, y: 1, z: 0 },
      point: { x: 0, y: 0, z: 0 },
      distance: 0,
      collider: null
    }
  }

  private _calculateSafeMotion(motion: Vector3, distance: number): Vector3 {
    const motionLength = this._vectorLength(motion)
    if (motionLength === 0) return { x: 0, y: 0, z: 0 }
    
    const safeDistance = Math.max(0, distance - this._config.safeMargin)
    const scale = safeDistance / motionLength
    
    return {
      x: motion.x * scale,
      y: motion.y * scale,
      z: motion.z * scale
    }
  }

  private _calculateSlideMotion(motion: Vector3, normal: Vector3, collisionDistance: number): Vector3 {
    // 计算沿表面滑动的运动
    const dotProduct = this._dotProduct(motion, normal)
    
    return {
      x: motion.x - normal.x * dotProduct,
      y: motion.y - normal.y * dotProduct,
      z: motion.z - normal.z * dotProduct
    }
  }

  private _updateCollisionState(normal: Vector3): void {
    const upVector = { x: 0, y: 1, z: 0 }
    const angle = Math.acos(this._dotProduct(normal, upVector))

    if (angle <= this._config.floorMaxAngle) {
      this._movementState.isOnFloor = true
      this._movementState.floorNormal = { ...normal }
    } else if (angle >= Math.PI - this._config.floorMaxAngle) {
      this._movementState.isOnCeiling = true
    } else {
      this._movementState.isOnWall = true
      this._movementState.wallNormal = { ...normal }
    }
  }

  private _applyMotion(motion: Vector3): void {
    this.position = {
      x: this.position.x + motion.x,
      y: this.position.y + motion.y,
      z: this.position.z + motion.z
    }
    
    this._movementState.lastMotion = { ...motion }
    
    // 更新物理体位置
    if (this._physicsBody) {
      this._physicsBody.setTransform(this.getGlobalTransform())
    }
  }

  private _updateMovementState(deltaTime: number): void {
    const currentTime = performance.now()
    
    // 更新时间统计
    if (this._movementState.isOnFloor) {
      this._stats.floorTime += deltaTime
    } else {
      this._stats.airTime += deltaTime
    }
    
    if (this._movementState.isOnWall) {
      this._stats.wallTime += deltaTime
    }
  }

  private _updateStats(slideCount: number): void {
    this._stats.totalMoves++
    this._stats.totalSlides += slideCount
    
    if (this._stats.totalMoves > 0) {
      this._stats.averageSlideCount = this._stats.totalSlides / this._stats.totalMoves
    }
  }

  private _getDeltaTime(): number {
    const currentTime = performance.now()
    const deltaTime = (currentTime - this._lastUpdateTime) / 1000
    this._lastUpdateTime = currentTime
    return Math.min(deltaTime, 1/30) // 限制最大时间步长
  }

  // 向量工具方法
  private _vectorLength(v: Vector3): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  }

  private _dotProduct(a: Vector3, b: Vector3): number {
    return a.x * b.x + a.y * b.y + a.z * b.z
  }

  private _subtractVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  }

  private _cleanupPhysicsBody(): void {
    if (this._physicsBody) {
      this._physicsServer.destroyBody(this._physicsBody)
      this._physicsBody = null
    }
    
    this._isInitialized = false
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  override destroy(): void {
    this._cleanupPhysicsBody()
    super.destroy()
  }
}

export default CharacterBody3D
