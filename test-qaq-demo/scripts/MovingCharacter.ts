/**
 * 移动角色脚本示例
 * 演示如何创建一个在场景中移动的角色脚本
 */

import ScriptBase from '../../core/script/ScriptBase'
import type { Vector3 } from '../../types/core'

export class MovingCharacter extends ScriptBase {
  /** 移动速度（单位/秒） */
  private moveSpeed: number = 100

  /** 移动方向 */
  private moveDirection: Vector3 = { x: 1, y: 0.5, z: 0 }

  /** 移动边界（2D坐标系：左上角原点） */
  private bounds = {
    minX: 50,
    maxX: 750,
    minY: 50,
    maxY: 550
  }

  /** 反弹计数器 */
  private bounceCount: number = 0

  /** 最大反弹次数 */
  private maxBounces: number = 20

  /** 初始位置 */
  private initialPosition: Vector3 = { x: 0, y: 0, z: 0 }

  /** 悬浮动画计时器 */
  private hoverTimer: number = 0

  /** 悬浮幅度 */
  private hoverAmplitude: number = 10

  /** 悬浮频率 */
  private hoverFrequency: number = 3

  /**
   * 脚本准备完成时调用
   */
  _ready(): void {
    this.print('移动角色脚本已准备就绪！')
    this.print(`节点名称: ${this.node.name}`)

    // 记录初始位置，如果是(0,0)则设置一个合适的起始位置
    if (this.position.x === 0 && this.position.y === 0) {
      this.position = { x: 400, y: 300, z: 0 } // 屏幕中心附近
    }
    this.initialPosition = { ...this.position }
    this.print(`初始位置: x=${this.initialPosition.x}, y=${this.initialPosition.y}`)

    // 随机化移动参数
    this.moveSpeed = this.randi_range(50, 150)
    this.moveDirection = {
      x: (this.randf() - 0.5) * 2, // -1 到 1
      y: (this.randf() - 0.5) * 2, // -1 到 1
      z: 0
    }

    // 标准化方向向量
    const length = Math.sqrt(this.moveDirection.x ** 2 + this.moveDirection.y ** 2)
    if (length > 0) {
      this.moveDirection.x /= length
      this.moveDirection.y /= length
    }

    this.print(`移动速度: ${this.moveSpeed} 单位/秒`)
    this.print(`移动方向: x=${this.moveDirection.x.toFixed(2)}, y=${this.moveDirection.y.toFixed(2)}`)

    // 随机化悬浮参数
    this.hoverAmplitude = this.randi_range(5, 15)
    this.hoverFrequency = this.randf() * 2 + 2 // 2-4 Hz

    this.print(`悬浮效果: 幅度=${this.hoverAmplitude}, 频率=${this.hoverFrequency.toFixed(2)}`)
  }

  /**
   * 每帧处理时调用
   */
  _process(delta: number): void {
    // 计算新位置
    const currentPos = this.position
    let newX = currentPos.x + this.moveDirection.x * this.moveSpeed * delta
    let newY = currentPos.y + this.moveDirection.y * this.moveSpeed * delta

    // 边界检测和反弹
    let bounced = false

    if (newX < this.bounds.minX || newX > this.bounds.maxX) {
      this.moveDirection.x = -this.moveDirection.x
      newX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, newX))
      bounced = true
    }

    if (newY < this.bounds.minY || newY > this.bounds.maxY) {
      this.moveDirection.y = -this.moveDirection.y
      newY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, newY))
      bounced = true
    }

    if (bounced) {
      this.bounceCount++
      this.print(`角色反弹，第${this.bounceCount}次反弹`)

      // 每次反弹后稍微改变方向，增加随机性
      this.moveDirection.x += (this.randf() - 0.5) * 0.2
      this.moveDirection.y += (this.randf() - 0.5) * 0.2

      // 重新标准化方向向量
      const length = Math.sqrt(this.moveDirection.x ** 2 + this.moveDirection.y ** 2)
      if (length > 0) {
        this.moveDirection.x /= length
        this.moveDirection.y /= length
      }
    }

    // 悬浮动画
    this.hoverTimer += delta
    const hoverOffset = Math.sin(this.hoverTimer * this.hoverFrequency) * this.hoverAmplitude

    // 应用新位置（包含悬浮效果）
    this.position = {
      x: newX,
      y: newY + hoverOffset,
      z: currentPos.z
    }

    // 重置位置检查
    if (this.bounceCount >= this.maxBounces) {
      this.resetPosition()
    }
  }

  /**
   * 脚本销毁时调用
   */
  _exit_tree(): void {
    this.print('移动角色脚本已销毁')
  }

  // ========================================================================
  // 公共方法
  // ========================================================================

  /**
   * 设置移动速度
   */
  setMoveSpeed(speed: number): void {
    this.moveSpeed = Math.max(0, speed)
    this.print(`移动速度已设置为: ${this.moveSpeed} 单位/秒`)
  }

  /**
   * 设置移动边界
   */
  setBounds(minX: number, maxX: number, minY: number, maxY: number): void {
    this.bounds = { minX, maxX, minY, maxY }
    this.print(`移动边界已设置为: x[${minX}, ${maxX}], y[${minY}, ${maxY}]`)
  }

  /**
   * 设置移动方向
   */
  setMoveDirection(direction: Vector3): void {
    // 标准化方向向量
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2)
    if (length > 0) {
      this.moveDirection = {
        x: direction.x / length,
        y: direction.y / length,
        z: 0
      }
      this.print(`移动方向已设置为: x=${this.moveDirection.x.toFixed(2)}, y=${this.moveDirection.y.toFixed(2)}`)
    }
  }

  /**
   * 重置到初始位置
   */
  resetPosition(): void {
    this.position = { ...this.initialPosition }
    this.bounceCount = 0
    this.hoverTimer = 0

    // 随机化新的移动方向
    this.moveDirection = {
      x: (this.randf() - 0.5) * 2,
      y: (this.randf() - 0.5) * 2,
      z: 0
    }

    const length = Math.sqrt(this.moveDirection.x ** 2 + this.moveDirection.y ** 2)
    if (length > 0) {
      this.moveDirection.x /= length
      this.moveDirection.y /= length
    }

    this.print('角色位置已重置，新的移动方向已设置')
  }

  /**
   * 获取当前状态信息
   */
  getStatus(): string {
    return `位置: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}), 反弹次数: ${this.bounceCount}`
  }
}
