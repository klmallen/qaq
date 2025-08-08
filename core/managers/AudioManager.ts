// ============================================================================
// QAQ Engine - 音频管理器 (Audio Manager)
// 基于Web Audio API的音频系统核心管理器
// ============================================================================

import * as THREE from 'three'

/**
 * 音频总线配置接口
 */
export interface AudioBusConfig {
  name: string
  volume: number
  muted: boolean
  effects: AudioEffect[]
  parent?: string
}

/**
 * 音频效果接口
 */
export interface AudioEffect {
  type: string
  enabled: boolean
  parameters: { [key: string]: any }
}

/**
 * 音频管理器
 * 
 * 负责管理整个音频系统，包括：
 * - Web Audio API上下文管理
 * - 音频总线系统
 * - 音频资源加载和缓存
 * - 3D音频监听器管理
 */
export class AudioManager {
  private static instance: AudioManager
  
  // Web Audio API
  private audioContext: AudioContext | null = null
  private audioListener: AudioListener | null = null
  private masterGainNode: GainNode | null = null
  
  // 音频总线系统
  private audioBuses: Map<string, AudioBusNode> = new Map()
  private busConfigs: Map<string, AudioBusConfig> = new Map()
  
  // 音频资源缓存
  private audioBufferCache: Map<string, AudioBuffer> = new Map()
  private loadingPromises: Map<string, Promise<AudioBuffer>> = new Map()
  
  // 3D音频
  private threeListener: THREE.AudioListener | null = null
  private currentCamera: THREE.Camera | null = null
  
  // 状态
  private initialized: boolean = false
  private masterVolume: number = 1.0
  private masterMuted: boolean = false

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  /**
   * 初始化音频系统
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 创建Web Audio Context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 创建主增益节点
      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
      this.masterGainNode.gain.value = this.masterVolume

      // 创建Three.js音频监听器
      this.threeListener = new THREE.AudioListener()

      // 创建默认音频总线
      this.createDefaultBuses()

      this.initialized = true
      console.log('✅ 音频系统初始化完成')
    } catch (error) {
      console.error('❌ 音频系统初始化失败:', error)
      throw error
    }
  }

  /**
   * 获取音频上下文
   */
  public getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  /**
   * 获取音频监听器
   */
  public getAudioListener(): AudioListener | null {
    return this.audioContext?.listener || null
  }

  /**
   * 获取Three.js音频监听器
   */
  public getThreeAudioListener(): THREE.AudioListener | null {
    return this.threeListener
  }

  /**
   * 设置当前相机（用于3D音频）
   */
  public setCurrentCamera(camera: THREE.Camera): void {
    this.currentCamera = camera
    
    if (this.threeListener && !camera.children.includes(this.threeListener)) {
      camera.add(this.threeListener)
    }

    // 更新Web Audio API监听器位置
    this.updateListenerPosition()
  }

  /**
   * 更新监听器位置
   */
  private updateListenerPosition(): void {
    if (!this.audioContext || !this.currentCamera) return

    const listener = this.audioContext.listener
    const camera = this.currentCamera

    // 获取相机世界位置和方向
    const position = new THREE.Vector3()
    const forward = new THREE.Vector3()
    const up = new THREE.Vector3()

    camera.getWorldPosition(position)
    camera.getWorldDirection(forward)
    camera.up.copy(up)

    // 设置监听器位置
    if (listener.positionX) {
      listener.positionX.value = position.x
      listener.positionY.value = position.y
      listener.positionZ.value = position.z
    }

    // 设置监听器方向
    if (listener.forwardX) {
      listener.forwardX.value = forward.x
      listener.forwardY.value = forward.y
      listener.forwardZ.value = forward.z
      
      listener.upX.value = up.x
      listener.upY.value = up.y
      listener.upZ.value = up.z
    }
  }

  /**
   * 创建默认音频总线
   */
  private createDefaultBuses(): void {
    // 主总线
    this.createBus({
      name: 'Master',
      volume: 1.0,
      muted: false,
      effects: []
    })

    // 音乐总线
    this.createBus({
      name: 'Music',
      volume: 0.8,
      muted: false,
      effects: [],
      parent: 'Master'
    })

    // 音效总线
    this.createBus({
      name: 'SFX',
      volume: 1.0,
      muted: false,
      effects: [],
      parent: 'Master'
    })

    // UI音效总线
    this.createBus({
      name: 'UI',
      volume: 0.9,
      muted: false,
      effects: [],
      parent: 'SFX'
    })

    // 环境音总线
    this.createBus({
      name: 'Ambient',
      volume: 0.7,
      muted: false,
      effects: [],
      parent: 'SFX'
    })
  }

  /**
   * 创建音频总线
   */
  public createBus(config: AudioBusConfig): AudioBusNode {
    if (!this.audioContext) {
      throw new Error('音频上下文未初始化')
    }

    const busNode = new AudioBusNode(this.audioContext, config)
    this.audioBuses.set(config.name, busNode)
    this.busConfigs.set(config.name, config)

    // 连接到父总线或主输出
    if (config.parent && this.audioBuses.has(config.parent)) {
      const parentBus = this.audioBuses.get(config.parent)!
      busNode.connect(parentBus.getInputNode())
    } else if (this.masterGainNode) {
      busNode.connect(this.masterGainNode)
    }

    return busNode
  }

  /**
   * 获取音频总线节点
   */
  public getBusNode(busName: string): AudioNode | null {
    const bus = this.audioBuses.get(busName)
    return bus ? bus.getInputNode() : null
  }

  /**
   * 设置总线音量
   */
  public setBusVolume(busName: string, volume: number): void {
    const bus = this.audioBuses.get(busName)
    if (bus) {
      bus.setVolume(volume)
    }
  }

  /**
   * 静音/取消静音总线
   */
  public setBusMuted(busName: string, muted: boolean): void {
    const bus = this.audioBuses.get(busName)
    if (bus) {
      bus.setMuted(muted)
    }
  }

  /**
   * 加载音频缓冲区
   */
  public async loadAudioBuffer(url: string): Promise<AudioBuffer> {
    // 检查缓存
    if (this.audioBufferCache.has(url)) {
      return this.audioBufferCache.get(url)!
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // 开始加载
    const loadingPromise = this.doLoadAudioBuffer(url)
    this.loadingPromises.set(url, loadingPromise)

    try {
      const buffer = await loadingPromise
      this.audioBufferCache.set(url, buffer)
      this.loadingPromises.delete(url)
      return buffer
    } catch (error) {
      this.loadingPromises.delete(url)
      throw error
    }
  }

  /**
   * 实际加载音频缓冲区
   */
  private async doLoadAudioBuffer(url: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('音频上下文未初始化')
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`音频加载失败: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return this.audioContext.decodeAudioData(arrayBuffer)
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.masterMuted ? 0 : this.masterVolume
    }
  }

  /**
   * 获取主音量
   */
  public getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * 设置主静音
   */
  public setMasterMuted(muted: boolean): void {
    this.masterMuted = muted
    
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = muted ? 0 : this.masterVolume
    }
  }

  /**
   * 获取主静音状态
   */
  public isMasterMuted(): boolean {
    return this.masterMuted
  }

  /**
   * 清理资源
   */
  public dispose(): void {
    // 停止所有音频
    this.audioBuses.clear()
    this.busConfigs.clear()
    
    // 清理缓存
    this.audioBufferCache.clear()
    this.loadingPromises.clear()
    
    // 关闭音频上下文
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.initialized = false
  }
}

/**
 * 音频总线节点
 */
class AudioBusNode {
  private gainNode: GainNode
  private config: AudioBusConfig
  private effectNodes: AudioNode[] = []

  constructor(audioContext: AudioContext, config: AudioBusConfig) {
    this.config = config
    this.gainNode = audioContext.createGain()
    this.gainNode.gain.value = config.muted ? 0 : config.volume
    
    // TODO: 实现音频效果链
    this.setupEffects(audioContext)
  }

  public getInputNode(): AudioNode {
    return this.effectNodes.length > 0 ? this.effectNodes[0] : this.gainNode
  }

  public getOutputNode(): AudioNode {
    return this.gainNode
  }

  public connect(destination: AudioNode): void {
    this.gainNode.connect(destination)
  }

  public setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume))
    this.gainNode.gain.value = this.config.muted ? 0 : this.config.volume
  }

  public setMuted(muted: boolean): void {
    this.config.muted = muted
    this.gainNode.gain.value = muted ? 0 : this.config.volume
  }

  private setupEffects(audioContext: AudioContext): void {
    // TODO: 根据配置创建音频效果链
    // 例如：混响、延迟、合唱、均衡器等
  }
}

export default AudioManager
