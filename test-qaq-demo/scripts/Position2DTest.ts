/**
 * 2D位置测试脚本
 * 专门用于测试2D坐标系统的正确性
 * 验证(0,0)是否在左上角，位置变化是否正确应用
 */

import ScriptBase from '../../core/script/ScriptBase'
import type { Vector3 } from '../../types/core'

export class Position2DTest extends ScriptBase {
  /** 测试阶段 */
  private testPhase: number = 0
  
  /** 测试计时器 */
  private testTimer: number = 0
  
  /** 每个测试阶段的持续时间 */
  private phaseDuration: number = 2.0
  
  /** 测试位置列表 */
  private testPositions: Vector3[] = [
    { x: 0, y: 0, z: 0 },       // 左上角
    { x: 800, y: 0, z: 0 },     // 右上角
    { x: 800, y: 600, z: 0 },   // 右下角
    { x: 0, y: 600, z: 0 },     // 左下角
    { x: 400, y: 300, z: 0 },   // 中心
    { x: 100, y: 100, z: 0 },   // 左上区域
    { x: 700, y: 500, z: 0 },   // 右下区域
  ]

  /**
   * 脚本准备完成时调用
   */
  _ready(): void {
    this.print('=== 2D位置测试脚本启动 ===')
    this.print('测试2D坐标系统：(0,0)应该在左上角')
    this.print(`节点名称: ${this.node.name}`)
    this.print(`初始位置: x=${this.position.x}, y=${this.position.y}`)
    
    // 开始第一个测试
    this.startNextTest()
  }

  /**
   * 每帧处理时调用
   */
  _process(delta: number): void {
    this.testTimer += delta
    
    // 检查是否需要进入下一个测试阶段
    if (this.testTimer >= this.phaseDuration) {
      this.testTimer = 0
      this.testPhase++
      
      if (this.testPhase < this.testPositions.length) {
        this.startNextTest()
      } else {
        // 所有测试完成，开始循环
        this.testPhase = 0
        this.startNextTest()
      }
    }
    
    // 显示当前状态
    this.showCurrentStatus()
  }

  /**
   * 开始下一个测试
   */
  private startNextTest(): void {
    const targetPos = this.testPositions[this.testPhase]
    const positionName = this.getPositionName(this.testPhase)
    
    this.print(`\n--- 测试阶段 ${this.testPhase + 1}: ${positionName} ---`)
    this.print(`目标位置: x=${targetPos.x}, y=${targetPos.y}`)
    
    // 设置新位置
    this.position = targetPos
    
    this.print(`实际设置后位置: x=${this.position.x}, y=${this.position.y}`)
    
    // 验证Three.js对象位置
    if (this.node.object3D) {
      const threePos = this.node.object3D.position
      this.print(`Three.js对象位置: x=${threePos.x.toFixed(2)}, y=${threePos.y.toFixed(2)}, z=${threePos.z.toFixed(2)}`)
    }
    
    // 验证全局位置
    const globalPos = this.global_position
    this.print(`全局位置: x=${globalPos.x}, y=${globalPos.y}`)
  }

  /**
   * 获取位置名称
   */
  private getPositionName(phase: number): string {
    const names = [
      '左上角 (0,0)',
      '右上角 (800,0)',
      '右下角 (800,600)',
      '左下角 (0,600)',
      '屏幕中心 (400,300)',
      '左上区域 (100,100)',
      '右下区域 (700,500)'
    ]
    return names[phase] || '未知位置'
  }

  /**
   * 显示当前状态
   */
  private showCurrentStatus(): void {
    // 每秒显示一次状态
    if (Math.floor(this.testTimer * 4) % 4 === 0) {
      const progress = (this.testTimer / this.phaseDuration * 100).toFixed(0)
      this.print(`测试进度: ${progress}% | 当前位置: (${this.position.x}, ${this.position.y})`)
    }
  }

  /**
   * 脚本销毁时调用
   */
  _exit_tree(): void {
    this.print('=== 2D位置测试脚本结束 ===')
    this.print('测试总结：')
    this.print('- 如果节点在屏幕上正确移动到各个角落，说明2D坐标系统工作正常')
    this.print('- (0,0)应该在左上角')
    this.print('- (800,600)应该在右下角')
    this.print('- 位置变化应该立即在视觉上生效')
  }

  // ========================================================================
  // 公共方法 - 手动测试
  // ========================================================================

  /**
   * 手动设置到左上角
   */
  moveToTopLeft(): void {
    this.position = { x: 0, y: 0, z: 0 }
    this.print('手动移动到左上角 (0,0)')
  }

  /**
   * 手动设置到右上角
   */
  moveToTopRight(): void {
    this.position = { x: 800, y: 0, z: 0 }
    this.print('手动移动到右上角 (800,0)')
  }

  /**
   * 手动设置到左下角
   */
  moveToBottomLeft(): void {
    this.position = { x: 0, y: 600, z: 0 }
    this.print('手动移动到左下角 (0,600)')
  }

  /**
   * 手动设置到右下角
   */
  moveToBottomRight(): void {
    this.position = { x: 800, y: 600, z: 0 }
    this.print('手动移动到右下角 (800,600)')
  }

  /**
   * 手动设置到中心
   */
  moveToCenter(): void {
    this.position = { x: 400, y: 300, z: 0 }
    this.print('手动移动到中心 (400,300)')
  }

  /**
   * 测试随机位置
   */
  moveToRandomPosition(): void {
    const x = this.randi_range(0, 800)
    const y = this.randi_range(0, 600)
    this.position = { x, y, z: 0 }
    this.print(`手动移动到随机位置 (${x},${y})`)
  }

  /**
   * 获取当前测试状态
   */
  getTestStatus(): string {
    const positionName = this.getPositionName(this.testPhase)
    const progress = (this.testTimer / this.phaseDuration * 100).toFixed(0)
    return `阶段: ${this.testPhase + 1}/${this.testPositions.length} | ${positionName} | 进度: ${progress}%`
  }

  /**
   * 暂停/恢复测试
   */
  togglePause(): void {
    // 这里可以添加暂停逻辑
    this.print('测试暂停/恢复功能')
  }

  /**
   * 重置测试
   */
  resetTest(): void {
    this.testPhase = 0
    this.testTimer = 0
    this.startNextTest()
    this.print('测试已重置')
  }
}
