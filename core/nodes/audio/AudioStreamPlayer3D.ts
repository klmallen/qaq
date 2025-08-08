// ============================================================================
// QAQ Engine - 3D音频流播放器节点 (3D Audio Stream Player Node)
// 参考Godot AudioStreamPlayer3D设计，支持空间音频
// ============================================================================

import Node3D from '../Node3D'
import { AudioManager } from '../../managers/AudioManager'
import { AudioStream, AudioPlaybackState } from './AudioStreamPlayer'
import * as THREE from 'three'

/**
 * 3D音频衰减模式
 */
export enum AttenuationModel {
  INVERSE_DISTANCE = 'inverse',
  LINEAR_DISTANCE = 'linear',
  EXPONENTIAL_DISTANCE = 'exponential'
}

/**
 * 3D音频配置接口
 */
export interface Audio3DConfig {
  maxDistance: number
  referenceDistance: number
  rolloffFactor: number
  coneInnerAngle: number
  coneOuterAngle: number
  coneOuterGain: number
  attenuationModel: AttenuationModel
}

/**
 * 3D音频流播放器节点
 * 
 * 支持空间音频效果，音量和声像会根据3D位置自动调整
 * 适用于：环境音效、角色语音、3D音效等
 */
export default class AudioStreamPlayer3D extends Node3D {
  // 核心属性
  public stream: AudioStream | null = null
  public playing: boolean = false
  public autoplay: boolean = false
  public volume: number = 1.0
  public pitch: number = 1.0
  public bus: string = 'Master'

  // 3D音频属性
  public maxDistance: number = 100.0
  public referenceDistance: number = 1.0
  public rolloffFactor: number = 1.0
  public coneInnerAngle: number = 360.0
  public coneOuterAngle: number = 360.0
  public coneOuterGain: number = 0.0
  public attenuationModel: AttenuationModel = AttenuationModel.INVERSE_DISTANCE

  // 内部状态
  private audioBuffer: AudioBuffer | null = null
  private audioSource: AudioBufferSourceNode | null = null
  private pannerNode: PannerNode | null = null
  private gainNode: GainNode | null = null
  private playbackState: AudioPlaybackState = AudioPlaybackState.STOPPED
  private playbackPosition: number = 0
  private startTime: number = 0

  constructor() {
    super()
    this.name = 'AudioStreamPlayer3D'
  }

  /**
   * 节点进入场景树
   */
  override _enterTree(): void {
    super._enterTree()
    
    if (this.autoplay && this.stream) {
      this.play()
    }
  }

  /**
   * 每帧更新
   */
  override _process(deltaTime: number): void {
    super._process(deltaTime)
    
    // 更新3D音频位置
    if (this.pannerNode && this.playbackState === AudioPlaybackState.PLAYING) {
      this.updateSpatialAudio()
    }
  }

  /**
   * 设置音频流
   */
  public setStream(stream: AudioStream): this {
    this.stream = stream
    this.loadAudioBuffer()
    return this
  }

  /**
   * 播放音频
   */
  public play(fromPosition: number = 0): void {
    if (!this.stream || !this.audioBuffer) return

    this.stop() // 停止当前播放

    const audioManager = AudioManager.getInstance()
    const audioContext = audioManager.getAudioContext()
    
    if (!audioContext) return

    // 创建音频源
    this.audioSource = audioContext.createBufferSource()
    this.audioSource.buffer = this.audioBuffer
    this.audioSource.loop = this.stream.loop
    this.audioSource.playbackRate.value = this.pitch

    // 创建3D音频节点
    this.pannerNode = audioContext.createPanner()
    this.setupPannerNode()

    // 创建增益节点
    this.gainNode = audioContext.createGain()
    this.gainNode.gain.value = this.volume

    // 连接音频图
    this.audioSource.connect(this.pannerNode)
    this.pannerNode.connect(this.gainNode)
    
    // 连接到音频总线
    const busNode = audioManager.getBusNode(this.bus)
    if (busNode) {
      this.gainNode.connect(busNode)
    }

    // 播放结束回调
    this.audioSource.onended = () => {
      if (!this.stream?.loop) {
        this.playbackState = AudioPlaybackState.STOPPED
        this.playing = false
        this._emitSignal('finished')
      }
    }

    // 开始播放
    this.audioSource.start(0, fromPosition)
    this.playbackState = AudioPlaybackState.PLAYING
    this.playing = true
    this.startTime = audioContext.currentTime - fromPosition
    this.playbackPosition = fromPosition

    // 初始化空间音频
    this.updateSpatialAudio()

    this._emitSignal('playback_started')
  }

  /**
   * 停止播放
   */
  public stop(): void {
    if (this.audioSource) {
      this.audioSource.stop()
      this.audioSource = null
    }
    
    if (this.pannerNode) {
      this.pannerNode = null
    }
    
    if (this.gainNode) {
      this.gainNode = null
    }

    this.playbackState = AudioPlaybackState.STOPPED
    this.playing = false
    this.playbackPosition = 0
    this.startTime = 0

    this._emitSignal('playback_stopped')
  }

  /**
   * 设置3D音频配置
   */
  public setAudio3DConfig(config: Partial<Audio3DConfig>): this {
    if (config.maxDistance !== undefined) this.maxDistance = config.maxDistance
    if (config.referenceDistance !== undefined) this.referenceDistance = config.referenceDistance
    if (config.rolloffFactor !== undefined) this.rolloffFactor = config.rolloffFactor
    if (config.coneInnerAngle !== undefined) this.coneInnerAngle = config.coneInnerAngle
    if (config.coneOuterAngle !== undefined) this.coneOuterAngle = config.coneOuterAngle
    if (config.coneOuterGain !== undefined) this.coneOuterGain = config.coneOuterGain
    if (config.attenuationModel !== undefined) this.attenuationModel = config.attenuationModel

    // 如果正在播放，更新PannerNode设置
    if (this.pannerNode) {
      this.setupPannerNode()
    }

    return this
  }

  /**
   * 设置音频衰减模型
   */
  public setAttenuationModel(model: AttenuationModel): this {
    this.attenuationModel = model
    
    if (this.pannerNode) {
      this.pannerNode.distanceModel = model
    }
    
    return this
  }

  /**
   * 设置最大听音距离
   */
  public setMaxDistance(distance: number): this {
    this.maxDistance = Math.max(0.1, distance)
    
    if (this.pannerNode) {
      this.pannerNode.maxDistance = this.maxDistance
    }
    
    return this
  }

  /**
   * 设置参考距离
   */
  public setReferenceDistance(distance: number): this {
    this.referenceDistance = Math.max(0.1, distance)
    
    if (this.pannerNode) {
      this.pannerNode.refDistance = this.referenceDistance
    }
    
    return this
  }

  /**
   * 设置衰减因子
   */
  public setRolloffFactor(factor: number): this {
    this.rolloffFactor = Math.max(0, factor)
    
    if (this.pannerNode) {
      this.pannerNode.rolloffFactor = this.rolloffFactor
    }
    
    return this
  }

  /**
   * 配置PannerNode
   */
  private setupPannerNode(): void {
    if (!this.pannerNode) return

    this.pannerNode.panningModel = 'HRTF'
    this.pannerNode.distanceModel = this.attenuationModel
    this.pannerNode.maxDistance = this.maxDistance
    this.pannerNode.refDistance = this.referenceDistance
    this.pannerNode.rolloffFactor = this.rolloffFactor
    this.pannerNode.coneInnerAngle = this.coneInnerAngle
    this.pannerNode.coneOuterAngle = this.coneOuterAngle
    this.pannerNode.coneOuterGain = this.coneOuterGain
  }

  /**
   * 更新空间音频
   */
  private updateSpatialAudio(): void {
    if (!this.pannerNode) return

    const audioManager = AudioManager.getInstance()
    const listener = audioManager.getAudioListener()
    
    if (!listener) return

    // 获取世界位置
    const worldPosition = new THREE.Vector3()
    this.object3D.getWorldPosition(worldPosition)

    // 获取世界方向
    const worldDirection = new THREE.Vector3()
    this.object3D.getWorldDirection(worldDirection)

    // 设置音源位置
    this.pannerNode.positionX.value = worldPosition.x
    this.pannerNode.positionY.value = worldPosition.y
    this.pannerNode.positionZ.value = worldPosition.z

    // 设置音源方向
    this.pannerNode.orientationX.value = worldDirection.x
    this.pannerNode.orientationY.value = worldDirection.y
    this.pannerNode.orientationZ.value = worldDirection.z
  }

  /**
   * 加载音频缓冲区
   */
  private async loadAudioBuffer(): Promise<void> {
    if (!this.stream) return

    try {
      const audioManager = AudioManager.getInstance()
      this.audioBuffer = await audioManager.loadAudioBuffer(this.stream.url)
    } catch (error) {
      console.error('音频加载失败:', error)
      this._emitSignal('load_failed', { error })
    }
  }

  /**
   * 节点退出场景树
   */
  override _exitTree(): void {
    this.stop()
    super._exitTree()
  }

  /**
   * 销毁资源
   */
  public dispose(): void {
    this.stop()
    this.audioBuffer = null
    this.stream = null
  }
}
