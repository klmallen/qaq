// ============================================================================
// QAQ Engine - 音频流播放器节点 (Audio Stream Player Node)
// 参考Godot AudioStreamPlayer设计，基于Web Audio API实现
// ============================================================================

import Node from '../Node'
import { AudioManager } from '../../managers/AudioManager'

/**
 * 音频流接口
 */
export interface AudioStream {
  url: string
  loop: boolean
  volume: number
  pitch: number
}

/**
 * 音频播放状态枚举
 */
export enum AudioPlaybackState {
  STOPPED = 'stopped',
  PLAYING = 'playing',
  PAUSED = 'paused'
}

/**
 * 音频流播放器节点
 * 
 * 用于播放2D音频，不受空间位置影响
 * 适用于：背景音乐、UI音效、全局音效等
 */
export default class AudioStreamPlayer extends Node {
  // 核心属性
  public stream: AudioStream | null = null
  public playing: boolean = false
  public autoplay: boolean = false
  public volume: number = 1.0
  public pitch: number = 1.0
  public bus: string = 'Master'

  // 内部状态
  private audioBuffer: AudioBuffer | null = null
  private audioSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private playbackState: AudioPlaybackState = AudioPlaybackState.STOPPED
  private playbackPosition: number = 0
  private startTime: number = 0

  constructor() {
    super()
    this.name = 'AudioStreamPlayer'
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

    // 创建增益节点
    this.gainNode = audioContext.createGain()
    this.gainNode.gain.value = this.volume

    // 连接音频图
    this.audioSource.connect(this.gainNode)
    
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

    this._emitSignal('playback_started')
  }

  /**
   * 暂停播放
   */
  public pause(): void {
    if (this.playbackState !== AudioPlaybackState.PLAYING) return

    const audioManager = AudioManager.getInstance()
    const audioContext = audioManager.getAudioContext()
    
    if (audioContext && this.audioSource) {
      // 记录当前播放位置
      this.playbackPosition = audioContext.currentTime - this.startTime
      
      this.audioSource.stop()
      this.audioSource = null
      this.gainNode = null
      
      this.playbackState = AudioPlaybackState.PAUSED
      this.playing = false
      
      this._emitSignal('playback_paused')
    }
  }

  /**
   * 恢复播放
   */
  public resume(): void {
    if (this.playbackState === AudioPlaybackState.PAUSED) {
      this.play(this.playbackPosition)
    }
  }

  /**
   * 停止播放
   */
  public stop(): void {
    if (this.audioSource) {
      this.audioSource.stop()
      this.audioSource = null
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
   * 设置音量
   */
  public setVolume(volume: number): this {
    this.volume = Math.max(0, Math.min(1, volume))
    
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
    
    return this
  }

  /**
   * 设置音调
   */
  public setPitch(pitch: number): this {
    this.pitch = Math.max(0.1, Math.min(4.0, pitch))
    
    if (this.audioSource) {
      this.audioSource.playbackRate.value = this.pitch
    }
    
    return this
  }

  /**
   * 设置音频总线
   */
  public setBus(busName: string): this {
    this.bus = busName
    
    // 如果正在播放，重新连接到新总线
    if (this.gainNode && this.playbackState === AudioPlaybackState.PLAYING) {
      const audioManager = AudioManager.getInstance()
      const busNode = audioManager.getBusNode(busName)
      
      if (busNode) {
        this.gainNode.disconnect()
        this.gainNode.connect(busNode)
      }
    }
    
    return this
  }

  /**
   * 获取播放位置
   */
  public getPlaybackPosition(): number {
    if (this.playbackState === AudioPlaybackState.PLAYING) {
      const audioManager = AudioManager.getInstance()
      const audioContext = audioManager.getAudioContext()
      
      if (audioContext) {
        return audioContext.currentTime - this.startTime
      }
    }
    
    return this.playbackPosition
  }

  /**
   * 获取音频长度
   */
  public getStreamLength(): number {
    return this.audioBuffer ? this.audioBuffer.duration : 0
  }

  /**
   * 是否正在播放
   */
  public isPlaying(): boolean {
    return this.playbackState === AudioPlaybackState.PLAYING
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
