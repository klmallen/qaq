/**
 * 交互式按钮脚本示例
 * 演示如何创建一个具有交互效果的按钮脚本
 */

import ScriptBase from '../../core/script/ScriptBase'

export class InteractiveButton extends ScriptBase {
  /** 悬停效果计时器 */
  private hoverTimer: number = 0

  /** 点击效果计时器 */
  private clickTimer: number = 0

  /** 脉冲效果计时器 */
  private pulseTimer: number = 0

  /** 原始位置 */
  private originalPosition: { x: number, y: number } = { x: 0, y: 0 }

  /** 原始缩放 */
  private originalScale: number = 1.0

  /** 是否处于悬停状态 */
  private isHovering: boolean = false

  /** 是否处于点击状态 */
  private isClicking: boolean = false

  /** 悬停偏移量 */
  private hoverOffset: number = 5

  /** 脉冲频率 */
  private pulseFrequency: number = 2

  /** 脉冲幅度 */
  private pulseAmplitude: number = 0.1

  /** 点击次数 */
  private clickCount: number = 0

  /** 最后点击时间 */
  private lastClickTime: number = 0

  /**
   * 脚本准备完成时调用
   */
  _ready(): void {
    this.print('交互式按钮脚本已准备就绪！')
    this.print(`节点名称: ${this.node.name}`)
    
    // 记录原始位置和缩放
    this.originalPosition = {
      x: this.position.x,
      y: this.position.y
    }
    
    if (this.node.object3D) {
      this.originalScale = this.node.object3D.scale.x
    }
    
    this.print(`原始位置: x=${this.originalPosition.x}, y=${this.originalPosition.y}`)
    this.print(`原始缩放: ${this.originalScale}`)
    
    // 随机化效果参数
    this.hoverOffset = this.randi_range(3, 8)
    this.pulseFrequency = this.randf() * 2 + 1 // 1-3 Hz
    this.pulseAmplitude = this.randf() * 0.15 + 0.05 // 0.05-0.2
    
    this.print(`悬停偏移: ${this.hoverOffset}px`)
    this.print(`脉冲参数: 频率=${this.pulseFrequency.toFixed(2)}Hz, 幅度=${this.pulseAmplitude.toFixed(2)}`)
    
    // 模拟一些交互事件（在实际应用中，这些会由输入系统触发）
    this.simulateInteractions()
  }

  /**
   * 每帧处理时调用
   */
  _process(delta: number): void {
    // 更新计时器
    this.hoverTimer += delta
    this.clickTimer += delta
    this.pulseTimer += delta

    // 计算悬停效果
    let yOffset = 0
    if (this.isHovering) {
      yOffset = Math.sin(this.hoverTimer * 4) * this.hoverOffset
    }

    // 计算脉冲效果
    const pulseScale = this.originalScale + Math.sin(this.pulseTimer * this.pulseFrequency) * this.pulseAmplitude

    // 计算点击效果
    let clickScale = 1.0
    if (this.isClicking && this.clickTimer < 0.2) {
      // 点击时缩小效果
      const clickProgress = this.clickTimer / 0.2
      clickScale = 1.0 - (1.0 - 0.9) * (1.0 - clickProgress)
    } else {
      this.isClicking = false
    }

    // 应用位置变化
    this.position = {
      x: this.originalPosition.x,
      y: this.originalPosition.y + yOffset,
      z: this.position.z
    }

    // 应用缩放变化
    if (this.node.object3D) {
      const finalScale = pulseScale * clickScale
      this.node.object3D.scale.setScalar(finalScale)
    }
  }

  /**
   * 输入事件处理
   */
  _input(event: any): void {
    // 这里可以处理真实的输入事件
    if (event.type === 'mousedown') {
      this.onClick()
    } else if (event.type === 'mouseenter') {
      this.onHoverStart()
    } else if (event.type === 'mouseleave') {
      this.onHoverEnd()
    }
  }

  /**
   * 脚本销毁时调用
   */
  _exit_tree(): void {
    this.print(`交互式按钮脚本已销毁，总点击次数: ${this.clickCount}`)
  }

  // ========================================================================
  // 交互事件处理方法
  // ========================================================================

  /**
   * 悬停开始
   */
  onHoverStart(): void {
    this.isHovering = true
    this.hoverTimer = 0
    this.print('按钮悬停开始')
  }

  /**
   * 悬停结束
   */
  onHoverEnd(): void {
    this.isHovering = false
    this.print('按钮悬停结束')
  }

  /**
   * 点击事件
   */
  onClick(): void {
    this.isClicking = true
    this.clickTimer = 0
    this.clickCount++
    this.lastClickTime = this.getTime()
    
    this.print(`按钮被点击！第${this.clickCount}次点击`)
    
    // 执行点击后的逻辑
    this.onClickAction()
  }

  /**
   * 点击后的动作
   */
  private onClickAction(): void {
    // 可以在这里添加按钮点击后的具体逻辑
    // 例如：切换场景、播放音效、修改其他节点等
    
    // 示例：查找其他节点并与之交互
    const sprite = this.findNode('TestSprite')
    if (sprite) {
      this.print('找到精灵节点，可以与之交互')
      // 这里可以调用精灵的方法或修改其属性
    }
    
    // 示例：根据点击次数执行不同动作
    switch (this.clickCount % 3) {
      case 1:
        this.print('执行动作A：改变颜色')
        break
      case 2:
        this.print('执行动作B：播放动画')
        break
      case 0:
        this.print('执行动作C：重置状态')
        this.resetEffects()
        break
    }
  }

  // ========================================================================
  // 公共方法
  // ========================================================================

  /**
   * 设置悬停效果参数
   */
  setHoverEffect(offset: number, frequency: number = 4): void {
    this.hoverOffset = offset
    this.print(`悬停效果已设置：偏移=${offset}px`)
  }

  /**
   * 设置脉冲效果参数
   */
  setPulseEffect(frequency: number, amplitude: number): void {
    this.pulseFrequency = frequency
    this.pulseAmplitude = amplitude
    this.print(`脉冲效果已设置：频率=${frequency}Hz, 幅度=${amplitude}`)
  }

  /**
   * 重置所有效果
   */
  resetEffects(): void {
    this.isHovering = false
    this.isClicking = false
    this.hoverTimer = 0
    this.clickTimer = 0
    this.pulseTimer = 0
    
    // 重置位置和缩放
    this.position = {
      x: this.originalPosition.x,
      y: this.originalPosition.y,
      z: this.position.z
    }
    
    if (this.node.object3D) {
      this.node.object3D.scale.setScalar(this.originalScale)
    }
    
    this.print('所有效果已重置')
  }

  /**
   * 获取按钮状态
   */
  getStatus(): string {
    return `点击次数: ${this.clickCount}, 悬停: ${this.isHovering}, 点击中: ${this.isClicking}`
  }

  /**
   * 模拟交互事件（用于演示）
   */
  private simulateInteractions(): void {
    // 模拟悬停
    setTimeout(() => {
      this.onHoverStart()
      setTimeout(() => this.onHoverEnd(), 2000)
    }, 3000)

    // 模拟点击
    setTimeout(() => this.onClick(), 5000)
    setTimeout(() => this.onClick(), 8000)
    setTimeout(() => this.onClick(), 12000)
  }
}
