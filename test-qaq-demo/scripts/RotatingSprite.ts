/**
 * 旋转精灵脚本示例
 * 演示如何创建一个简单的旋转动画脚本
 */

import ScriptBase from '../../core/script/ScriptBase'

export class RotatingSprite extends ScriptBase {
  /** 旋转速度（弧度/秒） */
  private rotationSpeed: number = 1.0

  /** 缩放动画计时器 */
  private scaleTimer: number = 0

  /** 原始缩放值 */
  private originalScale: number = 1.0

  /** 缩放动画幅度 */
  private scaleAmplitude: number = 0.2

  /** 缩放动画频率 */
  private scaleFrequency: number = 2.0

  /**
   * 脚本准备完成时调用
   */
  _ready(): void {
    this.print('旋转精灵脚本已准备就绪！')
    this.print(`节点名称: ${this.node.name}`)
    this.print(`节点ID: ${this.node.id}`)
    this.print(`初始位置: x=${this.position.x}, y=${this.position.y}`)

    // 演示访问node的各种方法和属性
    this.print(`节点类名: ${this.node.getClassName()}`)
    this.print(`是否在树中: ${this.node.isInsideTree}`)
    this.print(`是否已准备: ${this.node.isReady}`)
    this.print(`渲染层: ${this.node.renderLayer}`)
    this.print(`子节点数量: ${this.node.getChildCount()}`)

    // 访问父节点信息
    if (this.node.parent) {
      this.print(`父节点名称: ${this.node.parent.name}`)
    }

    // 查找兄弟节点
    const siblings = this.node.parent?.children || []
    this.print(`兄弟节点数量: ${siblings.length - 1}`) // 减去自己

    // 访问Three.js对象的详细信息
    const obj3D = this.node.object3D
    this.print(`Three.js对象类型: ${obj3D.type}`)
    this.print(`Three.js对象UUID: ${obj3D.uuid}`)

    // 可以在这里设置初始参数
    this.rotationSpeed = this.randf() * 2 + 0.5 // 随机旋转速度 0.5-2.5
    this.scaleAmplitude = this.randf() * 0.3 + 0.1 // 随机缩放幅度 0.1-0.4

    this.print(`旋转速度: ${this.rotationSpeed.toFixed(2)} 弧度/秒`)
    this.print(`缩放幅度: ${this.scaleAmplitude.toFixed(2)}`)
  }

  /**
   * 每帧处理时调用
   */
  _process(delta: number): void {
    // 旋转动画
    if (this.node.object3D) {
      this.node.object3D.rotation.z += this.rotationSpeed * delta
    }

    // 缩放动画
    this.scaleTimer += delta
    const scaleValue = this.originalScale + Math.sin(this.scaleTimer * this.scaleFrequency) * this.scaleAmplitude

    if (this.node.object3D) {
      this.node.object3D.scale.setScalar(scaleValue)
    }
  }

  /**
   * 脚本销毁时调用
   */
  _exit_tree(): void {
    this.print('旋转精灵脚本已销毁')
  }

  // ========================================================================
  // 公共方法 - 可以被其他脚本调用
  // ========================================================================

  /**
   * 设置旋转速度
   */
  setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed
    this.print(`旋转速度已设置为: ${speed.toFixed(2)} 弧度/秒`)
  }

  /**
   * 设置缩放参数
   */
  setScaleAnimation(amplitude: number, frequency: number): void {
    this.scaleAmplitude = amplitude
    this.scaleFrequency = frequency
    this.print(`缩放动画已设置为: 幅度=${amplitude.toFixed(2)}, 频率=${frequency.toFixed(2)}`)
  }

  /**
   * 获取当前旋转角度
   */
  getCurrentRotation(): number {
    return this.node.object3D ? this.node.object3D.rotation.z : 0
  }

  /**
   * 重置动画状态
   */
  resetAnimation(): void {
    this.scaleTimer = 0
    if (this.node.object3D) {
      this.node.object3D.rotation.z = 0
      this.node.object3D.scale.setScalar(this.originalScale)
    }
    this.print('动画状态已重置')
  }
}
