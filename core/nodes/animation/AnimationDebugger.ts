/**
 * QAQ游戏引擎 - 动画调试器
 * 
 * 提供动画系统的调试和可视化工具：
 * - 实时状态监控
 * - 过渡可视化
 * - 参数控制面板
 * - 性能分析
 */

import AnimationPlayer from './AnimationPlayer'
import AnimationStateMachine from './AnimationStateMachine'

// ============================================================================
// 调试器接口定义
// ============================================================================

export interface AnimationDebugInfo {
  // 播放器状态
  currentAnimation: string | null
  isPlaying: boolean
  playbackSpeed: number
  currentTime: number
  
  // 过渡状态
  isTransitioning: boolean
  transitionFrom: string | null
  transitionTo: string | null
  transitionProgress: number
  
  // 状态机状态
  currentState: string | null
  parameters: Record<string, boolean | number>
  
  // 性能信息
  frameRate: number
  updateTime: number
}

// ============================================================================
// 动画调试器类
// ============================================================================

export class AnimationDebugger {
  // ========================================================================
  // 私有属性
  // ========================================================================

  private _animationPlayer: AnimationPlayer | null = null
  private _stateMachine: AnimationStateMachine | null = null
  private _debugPanel: HTMLElement | null = null
  private _isVisible: boolean = false
  private _updateInterval: number | null = null
  private _lastUpdateTime: number = 0
  private _frameCount: number = 0
  private _frameRate: number = 0

  // ========================================================================
  // 公共方法
  // ========================================================================

  /**
   * 设置要调试的动画播放器
   */
  setAnimationPlayer(player: AnimationPlayer): void {
    this._animationPlayer = player
    this.log('动画播放器已设置')
  }

  /**
   * 设置要调试的状态机
   */
  setStateMachine(stateMachine: AnimationStateMachine): void {
    this._stateMachine = stateMachine
    this.log('状态机已设置')
  }

  /**
   * 显示调试面板
   */
  show(): void {
    if (this._isVisible) return

    this.createDebugPanel()
    this.startUpdating()
    this._isVisible = true
    this.log('调试面板已显示')
  }

  /**
   * 隐藏调试面板
   */
  hide(): void {
    if (!this._isVisible) return

    this.destroyDebugPanel()
    this.stopUpdating()
    this._isVisible = false
    this.log('调试面板已隐藏')
  }

  /**
   * 切换调试面板显示状态
   */
  toggle(): void {
    if (this._isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 获取当前调试信息
   */
  getDebugInfo(): AnimationDebugInfo {
    const info: AnimationDebugInfo = {
      currentAnimation: null,
      isPlaying: false,
      playbackSpeed: 1.0,
      currentTime: 0,
      isTransitioning: false,
      transitionFrom: null,
      transitionTo: null,
      transitionProgress: 0,
      currentState: null,
      parameters: {},
      frameRate: this._frameRate,
      updateTime: 0
    }

    // 从动画播放器获取信息
    if (this._animationPlayer) {
      info.currentAnimation = this._animationPlayer.getCurrentAnimation()
      info.isPlaying = this._animationPlayer.isPlaying()
      info.playbackSpeed = this._animationPlayer.getSpeed()

      // 获取过渡信息
      if (this._animationPlayer.isTransitioning()) {
        const transitionInfo = this._animationPlayer.getCurrentTransitionInfo()
        info.isTransitioning = true
        info.transitionFrom = transitionInfo.from
        info.transitionTo = transitionInfo.to
        info.transitionProgress = transitionInfo.progress
      }
    }

    // 从状态机获取信息
    if (this._stateMachine) {
      const stateInfo = this._stateMachine.getCurrentStateInfo()
      info.currentState = stateInfo.currentState
      info.isTransitioning = stateInfo.isTransitioning
      info.transitionProgress = stateInfo.transitionProgress
      info.parameters = stateInfo.parameters
    }

    return info
  }

  // ========================================================================
  // 调试面板创建和管理
  // ========================================================================

  /**
   * 创建调试面板
   */
  private createDebugPanel(): void {
    // 创建主容器
    this._debugPanel = document.createElement('div')
    this._debugPanel.id = 'animation-debugger'
    this._debugPanel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 350px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #333;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `

    // 创建标题
    const title = document.createElement('h3')
    title.textContent = '🎬 动画调试器'
    title.style.cssText = `
      margin: 0 0 15px 0;
      color: #4CAF50;
      border-bottom: 1px solid #333;
      padding-bottom: 8px;
    `
    this._debugPanel.appendChild(title)

    // 创建信息显示区域
    const infoArea = document.createElement('div')
    infoArea.id = 'debug-info'
    this._debugPanel.appendChild(infoArea)

    // 创建控制面板
    this.createControlPanel()

    // 添加到页面
    document.body.appendChild(this._debugPanel)
  }

  /**
   * 创建控制面板
   */
  private createControlPanel(): void {
    if (!this._debugPanel) return

    const controlPanel = document.createElement('div')
    controlPanel.style.cssText = `
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #333;
    `

    // 参数控制区域
    const parameterSection = document.createElement('div')
    parameterSection.innerHTML = `
      <h4 style="margin: 0 0 10px 0; color: #2196F3;">参数控制</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button onclick="window.stateMachine?.setParameter('speed', 0)" style="padding: 4px 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">停止</button>
        <button onclick="window.stateMachine?.setParameter('speed', 3)" style="padding: 4px 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">行走</button>
        <button onclick="window.stateMachine?.setParameter('speed', 8)" style="padding: 4px 8px; background: #333; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">奔跑</button>
        <button onclick="window.stateMachine?.setTrigger('attack')" style="padding: 4px 8px; background: #f44336; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">攻击</button>
        <button onclick="window.stateMachine?.setTrigger('jump')" style="padding: 4px 8px; background: #ff9800; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">跳跃</button>
        <button onclick="window.animationDebugger?.hide()" style="padding: 4px 8px; background: #666; color: white; border: 1px solid #555; border-radius: 4px; cursor: pointer;">隐藏</button>
      </div>
    `

    controlPanel.appendChild(parameterSection)

    // 过渡时间控制
    const transitionSection = document.createElement('div')
    transitionSection.innerHTML = `
      <h4 style="margin: 15px 0 10px 0; color: #FF9800;">过渡控制</h4>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label>过渡时间:</label>
        <input type="range" min="0.1" max="2.0" step="0.1" value="0.3" 
               onchange="window.animationPlayer?.setGlobalTransitionTime(parseFloat(this.value))"
               style="flex: 1;">
        <span id="transition-time-value">0.3s</span>
      </div>
    `

    controlPanel.appendChild(transitionSection)
    this._debugPanel.appendChild(controlPanel)

    // 将调试器实例存储到全局
    ;(window as any).animationDebugger = this
  }

  /**
   * 销毁调试面板
   */
  private destroyDebugPanel(): void {
    if (this._debugPanel) {
      document.body.removeChild(this._debugPanel)
      this._debugPanel = null
    }
  }

  /**
   * 开始更新循环
   */
  private startUpdating(): void {
    this._updateInterval = window.setInterval(() => {
      this.updateDebugInfo()
      this.updateFrameRate()
    }, 100) // 每100ms更新一次
  }

  /**
   * 停止更新循环
   */
  private stopUpdating(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval)
      this._updateInterval = null
    }
  }

  /**
   * 更新调试信息显示
   */
  private updateDebugInfo(): void {
    const infoArea = document.getElementById('debug-info')
    if (!infoArea) return

    const info = this.getDebugInfo()
    
    infoArea.innerHTML = `
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px; line-height: 1.4;">
        <strong>当前状态:</strong> <span style="color: #4CAF50;">${info.currentState || 'None'}</span>
        <strong>当前动画:</strong> <span style="color: #2196F3;">${info.currentAnimation || 'None'}</span>
        <strong>播放状态:</strong> <span style="color: ${info.isPlaying ? '#4CAF50' : '#f44336'};">${info.isPlaying ? '播放中' : '已停止'}</span>
        <strong>播放速度:</strong> <span>${info.playbackSpeed.toFixed(1)}x</span>
        <strong>过渡状态:</strong> <span style="color: ${info.isTransitioning ? '#FF9800' : '#666'};">${info.isTransitioning ? '过渡中' : '无过渡'}</span>
        <strong>帧率:</strong> <span style="color: ${info.frameRate > 50 ? '#4CAF50' : info.frameRate > 30 ? '#FF9800' : '#f44336'};">${info.frameRate.toFixed(1)} FPS</span>
      </div>
      
      ${Object.keys(info.parameters).length > 0 ? `
        <div style="margin-top: 12px;">
          <strong style="color: #2196F3;">状态机参数:</strong>
          <div style="margin-top: 6px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">
            ${Object.entries(info.parameters).map(([key, value]) => 
              `<div>${key}: <span style="color: #4CAF50;">${value}</span></div>`
            ).join('')}
          </div>
        </div>
      ` : ''}
    `

    // 更新过渡时间显示
    const transitionTimeValue = document.getElementById('transition-time-value')
    if (transitionTimeValue && this._animationPlayer) {
      const currentTime = this._animationPlayer.getGlobalTransitionTime()
      transitionTimeValue.textContent = `${currentTime.toFixed(1)}s`
    }
  }

  /**
   * 更新帧率计算
   */
  private updateFrameRate(): void {
    const now = performance.now()
    this._frameCount++

    if (now - this._lastUpdateTime >= 1000) {
      this._frameRate = this._frameCount
      this._frameCount = 0
      this._lastUpdateTime = now
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 日志输出
   */
  private log(message: string): void {
    console.log(`🔧 [AnimationDebugger] ${message}`)
  }

  /**
   * 导出调试数据
   */
  exportDebugData(): string {
    const info = this.getDebugInfo()
    return JSON.stringify(info, null, 2)
  }

  /**
   * 创建快捷键监听
   */
  static setupGlobalShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl + Shift + D 切换调试面板
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        const animDebugger = (window as any).animationDebugger
        if (animDebugger) {
          animDebugger.toggle()
        }
        event.preventDefault()
      }
    })
  }
}

// 自动设置全局快捷键
AnimationDebugger.setupGlobalShortcuts()

export default AnimationDebugger
