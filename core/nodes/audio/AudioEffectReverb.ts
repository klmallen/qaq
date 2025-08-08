// ============================================================================
// QAQ Engine - 音频混响效果节点 (Audio Effect Reverb Node)
// 基于Web Audio API的ConvolverNode实现混响效果
// ============================================================================

import Node from '../Node'
import { AudioManager } from '../../managers/AudioManager'

/**
 * 混响类型枚举
 */
export enum ReverbType {
  ROOM = 'room',
  HALL = 'hall',
  CATHEDRAL = 'cathedral',
  PLATE = 'plate',
  SPRING = 'spring',
  CUSTOM = 'custom'
}

/**
 * 混响配置接口
 */
export interface ReverbConfig {
  type: ReverbType
  roomSize: number
  damping: number
  wetLevel: number
  dryLevel: number
  preDelay: number
  customImpulseResponse?: AudioBuffer
}

/**
 * 音频混响效果节点
 * 
 * 提供各种混响效果，可以模拟不同空间的声学特性
 * 适用于：环境音效、音乐后处理、空间音频增强等
 */
export default class AudioEffectReverb extends Node {
  // 核心属性
  public enabled: boolean = true
  public bypass: boolean = false
  
  // 混响参数
  public reverbType: ReverbType = ReverbType.ROOM
  public roomSize: number = 0.5
  public damping: number = 0.5
  public wetLevel: number = 0.3
  public dryLevel: number = 0.7
  public preDelay: number = 0.0

  // Web Audio API节点
  private inputGainNode: GainNode | null = null
  private outputGainNode: GainNode | null = null
  private convolverNode: ConvolverNode | null = null
  private wetGainNode: GainNode | null = null
  private dryGainNode: GainNode | null = null
  private delayNode: DelayNode | null = null

  // 内部状态
  private audioContext: AudioContext | null = null
  private impulseResponseCache: Map<ReverbType, AudioBuffer> = new Map()

  constructor() {
    super()
    this.name = 'AudioEffectReverb'
  }

  /**
   * 节点进入场景树
   */
  override _enterTree(): void {
    super._enterTree()
    this.initializeAudioNodes()
  }

  /**
   * 初始化音频节点
   */
  private async initializeAudioNodes(): Promise<void> {
    const audioManager = AudioManager.getInstance()
    this.audioContext = audioManager.getAudioContext()
    
    if (!this.audioContext) {
      console.error('音频上下文未初始化')
      return
    }

    try {
      // 创建音频节点
      this.inputGainNode = this.audioContext.createGain()
      this.outputGainNode = this.audioContext.createGain()
      this.convolverNode = this.audioContext.createConvolver()
      this.wetGainNode = this.audioContext.createGain()
      this.dryGainNode = this.audioContext.createGain()
      this.delayNode = this.audioContext.createDelay(1.0)

      // 设置初始参数
      this.updateParameters()

      // 连接音频图
      this.connectAudioGraph()

      // 加载脉冲响应
      await this.loadImpulseResponse()

    } catch (error) {
      console.error('混响效果初始化失败:', error)
    }
  }

  /**
   * 连接音频图
   */
  private connectAudioGraph(): void {
    if (!this.inputGainNode || !this.outputGainNode || !this.convolverNode || 
        !this.wetGainNode || !this.dryGainNode || !this.delayNode) {
      return
    }

    // 输入 -> 预延迟
    this.inputGainNode.connect(this.delayNode)

    // 干声路径：预延迟 -> 干声增益 -> 输出
    this.delayNode.connect(this.dryGainNode)
    this.dryGainNode.connect(this.outputGainNode)

    // 湿声路径：预延迟 -> 卷积器 -> 湿声增益 -> 输出
    this.delayNode.connect(this.convolverNode)
    this.convolverNode.connect(this.wetGainNode)
    this.wetGainNode.connect(this.outputGainNode)
  }

  /**
   * 更新参数
   */
  private updateParameters(): void {
    if (!this.wetGainNode || !this.dryGainNode || !this.delayNode) return

    // 设置湿声/干声比例
    this.wetGainNode.gain.value = this.enabled && !this.bypass ? this.wetLevel : 0
    this.dryGainNode.gain.value = this.dryLevel

    // 设置预延迟
    this.delayNode.delayTime.value = this.preDelay / 1000 // 转换为秒
  }

  /**
   * 加载脉冲响应
   */
  private async loadImpulseResponse(): Promise<void> {
    if (!this.audioContext || !this.convolverNode) return

    try {
      let impulseResponse: AudioBuffer

      if (this.reverbType === ReverbType.CUSTOM) {
        // 使用自定义脉冲响应
        // TODO: 实现自定义脉冲响应加载
        impulseResponse = this.generateImpulseResponse()
      } else {
        // 检查缓存
        if (this.impulseResponseCache.has(this.reverbType)) {
          impulseResponse = this.impulseResponseCache.get(this.reverbType)!
        } else {
          // 生成预设脉冲响应
          impulseResponse = this.generateImpulseResponse()
          this.impulseResponseCache.set(this.reverbType, impulseResponse)
        }
      }

      this.convolverNode.buffer = impulseResponse
    } catch (error) {
      console.error('脉冲响应加载失败:', error)
    }
  }

  /**
   * 生成脉冲响应
   */
  private generateImpulseResponse(): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('音频上下文未初始化')
    }

    const sampleRate = this.audioContext.sampleRate
    const length = this.getRoomSizeInSamples(sampleRate)
    const impulse = this.audioContext.createBuffer(2, length, sampleRate)

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel)
      
      for (let i = 0; i < length; i++) {
        const decay = this.calculateDecay(i, length)
        const noise = (Math.random() * 2 - 1) * decay
        channelData[i] = noise
      }
    }

    return impulse
  }

  /**
   * 计算房间大小对应的采样数
   */
  private getRoomSizeInSamples(sampleRate: number): number {
    const baseLength = sampleRate * 0.5 // 0.5秒基础长度
    
    switch (this.reverbType) {
      case ReverbType.ROOM:
        return Math.floor(baseLength * (0.5 + this.roomSize * 0.5))
      case ReverbType.HALL:
        return Math.floor(baseLength * (1.0 + this.roomSize * 2.0))
      case ReverbType.CATHEDRAL:
        return Math.floor(baseLength * (2.0 + this.roomSize * 4.0))
      case ReverbType.PLATE:
        return Math.floor(baseLength * (0.3 + this.roomSize * 0.3))
      case ReverbType.SPRING:
        return Math.floor(baseLength * (0.2 + this.roomSize * 0.2))
      default:
        return Math.floor(baseLength * (0.5 + this.roomSize * 1.5))
    }
  }

  /**
   * 计算衰减曲线
   */
  private calculateDecay(sample: number, totalSamples: number): number {
    const progress = sample / totalSamples
    const dampingFactor = 1.0 - this.damping
    
    switch (this.reverbType) {
      case ReverbType.ROOM:
        return Math.pow(1 - progress, 2) * dampingFactor
      case ReverbType.HALL:
        return Math.pow(1 - progress, 1.5) * dampingFactor
      case ReverbType.CATHEDRAL:
        return Math.pow(1 - progress, 1) * dampingFactor
      case ReverbType.PLATE:
        return Math.exp(-progress * 3) * dampingFactor
      case ReverbType.SPRING:
        return Math.exp(-progress * 5) * dampingFactor * (1 + Math.sin(progress * 50) * 0.1)
      default:
        return Math.pow(1 - progress, 2) * dampingFactor
    }
  }

  /**
   * 设置混响类型
   */
  public setReverbType(type: ReverbType): this {
    this.reverbType = type
    this.loadImpulseResponse()
    return this
  }

  /**
   * 设置房间大小
   */
  public setRoomSize(size: number): this {
    this.roomSize = Math.max(0, Math.min(1, size))
    this.loadImpulseResponse()
    return this
  }

  /**
   * 设置阻尼
   */
  public setDamping(damping: number): this {
    this.damping = Math.max(0, Math.min(1, damping))
    this.loadImpulseResponse()
    return this
  }

  /**
   * 设置湿声电平
   */
  public setWetLevel(level: number): this {
    this.wetLevel = Math.max(0, Math.min(1, level))
    this.updateParameters()
    return this
  }

  /**
   * 设置干声电平
   */
  public setDryLevel(level: number): this {
    this.dryLevel = Math.max(0, Math.min(1, level))
    this.updateParameters()
    return this
  }

  /**
   * 设置预延迟
   */
  public setPreDelay(delay: number): this {
    this.preDelay = Math.max(0, Math.min(1000, delay)) // 0-1000ms
    this.updateParameters()
    return this
  }

  /**
   * 启用/禁用效果
   */
  public setEnabled(enabled: boolean): this {
    this.enabled = enabled
    this.updateParameters()
    return this
  }

  /**
   * 旁路/取消旁路效果
   */
  public setBypass(bypass: boolean): this {
    this.bypass = bypass
    this.updateParameters()
    return this
  }

  /**
   * 获取输入节点
   */
  public getInputNode(): AudioNode | null {
    return this.inputGainNode
  }

  /**
   * 获取输出节点
   */
  public getOutputNode(): AudioNode | null {
    return this.outputGainNode
  }

  /**
   * 连接到目标节点
   */
  public connectTo(destination: AudioNode): this {
    if (this.outputGainNode) {
      this.outputGainNode.connect(destination)
    }
    return this
  }

  /**
   * 节点退出场景树
   */
  override _exitTree(): void {
    this.dispose()
    super._exitTree()
  }

  /**
   * 销毁资源
   */
  public dispose(): void {
    // 断开所有连接
    if (this.inputGainNode) this.inputGainNode.disconnect()
    if (this.outputGainNode) this.outputGainNode.disconnect()
    if (this.convolverNode) this.convolverNode.disconnect()
    if (this.wetGainNode) this.wetGainNode.disconnect()
    if (this.dryGainNode) this.dryGainNode.disconnect()
    if (this.delayNode) this.delayNode.disconnect()

    // 清空引用
    this.inputGainNode = null
    this.outputGainNode = null
    this.convolverNode = null
    this.wetGainNode = null
    this.dryGainNode = null
    this.delayNode = null
    this.audioContext = null
  }
}
