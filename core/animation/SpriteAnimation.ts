/**
 * QAQ游戏引擎 - 序列帧动画系统
 * 
 * 提供完整的2D序列帧动画功能
 */

import { QaqObject } from '../object/QaqObject'
import ResourceLoader from '../resources/ResourceLoader'
import * as THREE from 'three'

/**
 * 动画播放模式
 */
export enum AnimationMode {
  /** 播放一次后停止 */
  ONCE = 'once',
  /** 循环播放 */
  LOOP = 'loop',
  /** 来回播放 */
  PING_PONG = 'ping_pong'
}

/**
 * 动画播放状态
 */
export enum AnimationState {
  /** 停止 */
  STOPPED = 'stopped',
  /** 播放中 */
  PLAYING = 'playing',
  /** 暂停 */
  PAUSED = 'paused'
}

/**
 * 动画帧数据
 */
export interface AnimationFrame {
  /** 纹理对象 */
  texture: THREE.Texture
  /** 帧持续时间（秒） */
  duration: number
  /** 帧名称（可选） */
  name?: string
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  /** 动画名称 */
  name: string
  /** 动画帧列表 */
  frames: AnimationFrame[]
  /** 播放模式 */
  mode: AnimationMode
  /** 播放速度倍率 */
  speed: number
  /** 是否自动播放 */
  autoPlay: boolean
}

/**
 * 序列帧动画类
 */
export class SpriteAnimation extends QaqObject {
  private _animations: Map<string, AnimationConfig> = new Map()
  private _currentAnimation: string | null = null
  private _currentFrame: number = 0
  private _frameTime: number = 0
  private _state: AnimationState = AnimationState.STOPPED
  private _speed: number = 1.0
  private _pingPongDirection: number = 1 // 1: 正向, -1: 反向
  
  // 当前纹理（用于外部获取）
  private _currentTexture: THREE.Texture | null = null

  constructor(name: string = 'SpriteAnimation') {
    super(name)
  }

  protected initializeSignals(): void {
    super.initializeSignals()
    
    // 动画相关信号
    this.addSignal('animation_started')
    this.addSignal('animation_finished')
    this.addSignal('animation_looped')
    this.addSignal('frame_changed')
  }

  // ========================================================================
  // 动画管理
  // ========================================================================

  /**
   * 添加动画
   */
  addAnimation(config: AnimationConfig): void {
    this._animations.set(config.name, { ...config })
    console.log(`✅ 动画已添加: ${config.name}, 帧数: ${config.frames.length}`)
  }

  /**
   * 移除动画
   */
  removeAnimation(name: string): boolean {
    const removed = this._animations.delete(name)
    if (removed && this._currentAnimation === name) {
      this.stop()
    }
    return removed
  }

  /**
   * 获取动画配置
   */
  getAnimation(name: string): AnimationConfig | null {
    return this._animations.get(name) || null
  }

  /**
   * 获取所有动画名称
   */
  getAnimationNames(): string[] {
    return Array.from(this._animations.keys())
  }

  // ========================================================================
  // 播放控制
  // ========================================================================

  /**
   * 播放动画
   */
  play(animationName?: string, fromStart: boolean = false): boolean {
    const targetAnimation = animationName || this._currentAnimation
    if (!targetAnimation) {
      console.warn('没有指定要播放的动画')
      return false
    }

    const animation = this._animations.get(targetAnimation)
    if (!animation) {
      console.warn(`动画不存在: ${targetAnimation}`)
      return false
    }

    // 切换动画或从头开始
    if (this._currentAnimation !== targetAnimation || fromStart) {
      this._currentAnimation = targetAnimation
      this._currentFrame = 0
      this._frameTime = 0
      this._pingPongDirection = 1
    }

    this._state = AnimationState.PLAYING
    this._updateCurrentTexture()
    
    this.emit('animation_started', { animation: targetAnimation })
    console.log(`🎬 开始播放动画: ${targetAnimation}`)
    return true
  }

  /**
   * 暂停动画
   */
  pause(): void {
    if (this._state === AnimationState.PLAYING) {
      this._state = AnimationState.PAUSED
      console.log('⏸️ 动画已暂停')
    }
  }

  /**
   * 恢复动画
   */
  resume(): void {
    if (this._state === AnimationState.PAUSED) {
      this._state = AnimationState.PLAYING
      console.log('▶️ 动画已恢复')
    }
  }

  /**
   * 停止动画
   */
  stop(): void {
    this._state = AnimationState.STOPPED
    this._currentFrame = 0
    this._frameTime = 0
    this._pingPongDirection = 1
    console.log('⏹️ 动画已停止')
  }

  // ========================================================================
  // 属性访问
  // ========================================================================

  /** 当前播放状态 */
  get state(): AnimationState {
    return this._state
  }

  /** 播放速度 */
  get speed(): number {
    return this._speed
  }

  set speed(value: number) {
    this._speed = Math.max(0.1, value)
  }

  /** 当前动画名称 */
  get currentAnimation(): string | null {
    return this._currentAnimation
  }

  /** 当前帧索引 */
  get currentFrame(): number {
    return this._currentFrame
  }

  /** 当前纹理 */
  get currentTexture(): THREE.Texture | null {
    return this._currentTexture
  }

  /** 是否正在播放 */
  get isPlaying(): boolean {
    return this._state === AnimationState.PLAYING
  }

  // ========================================================================
  // 更新逻辑
  // ========================================================================

  /**
   * 更新动画（需要在游戏循环中调用）
   */
  update(deltaTime: number): void {
    if (this._state !== AnimationState.PLAYING || !this._currentAnimation) {
      return
    }

    const animation = this._animations.get(this._currentAnimation)
    if (!animation || animation.frames.length === 0) {
      return
    }

    // 更新帧时间
    this._frameTime += deltaTime * this._speed

    const currentFrameData = animation.frames[this._currentFrame]
    if (this._frameTime >= currentFrameData.duration) {
      this._frameTime = 0
      this._advanceFrame(animation)
    }
  }

  /**
   * 推进到下一帧
   */
  private _advanceFrame(animation: AnimationConfig): void {
    const frameCount = animation.frames.length
    
    switch (animation.mode) {
      case AnimationMode.ONCE:
        if (this._currentFrame < frameCount - 1) {
          this._currentFrame++
          this._updateCurrentTexture()
          this.emit('frame_changed', { frame: this._currentFrame })
        } else {
          this.stop()
          this.emit('animation_finished', { animation: animation.name })
        }
        break

      case AnimationMode.LOOP:
        this._currentFrame = (this._currentFrame + 1) % frameCount
        if (this._currentFrame === 0) {
          this.emit('animation_looped', { animation: animation.name })
        }
        this._updateCurrentTexture()
        this.emit('frame_changed', { frame: this._currentFrame })
        break

      case AnimationMode.PING_PONG:
        this._currentFrame += this._pingPongDirection
        
        if (this._currentFrame >= frameCount - 1) {
          this._currentFrame = frameCount - 1
          this._pingPongDirection = -1
        } else if (this._currentFrame <= 0) {
          this._currentFrame = 0
          this._pingPongDirection = 1
          this.emit('animation_looped', { animation: animation.name })
        }
        
        this._updateCurrentTexture()
        this.emit('frame_changed', { frame: this._currentFrame })
        break
    }
  }

  /**
   * 更新当前纹理
   */
  private _updateCurrentTexture(): void {
    if (!this._currentAnimation) return

    const animation = this._animations.get(this._currentAnimation)
    if (!animation || this._currentFrame >= animation.frames.length) return

    this._currentTexture = animation.frames[this._currentFrame].texture
  }

  // ========================================================================
  // 静态工厂方法
  // ========================================================================

  /**
   * 从图片序列创建动画
   */
  static async createFromImageSequence(
    name: string,
    imagePaths: string[],
    frameDuration: number = 0.1,
    mode: AnimationMode = AnimationMode.LOOP
  ): Promise<SpriteAnimation> {
    const animation = new SpriteAnimation(name)
    const loader = ResourceLoader.getInstance()
    const frames: AnimationFrame[] = []

    console.log(`🎬 开始加载序列帧动画: ${name}, 帧数: ${imagePaths.length}`)

    // 并行加载所有图片
    const loadPromises = imagePaths.map(async (path, index) => {
      try {
        const result = await loader.load<THREE.Texture>(path, { useCache: true })
        return {
          index,
          texture: result.resource,
          duration: frameDuration,
          name: `frame_${index}`
        }
      } catch (error) {
        console.error(`❌ 加载帧图片失败: ${path}`, error)
        return null
      }
    })

    const loadedFrames = await Promise.all(loadPromises)
    
    // 按索引排序并过滤失败的帧
    loadedFrames
      .filter(frame => frame !== null)
      .sort((a, b) => a!.index - b!.index)
      .forEach(frame => {
        frames.push({
          texture: frame!.texture,
          duration: frame!.duration,
          name: frame!.name
        })
      })

    if (frames.length === 0) {
      throw new Error(`无法加载任何动画帧: ${name}`)
    }

    // 添加动画配置
    animation.addAnimation({
      name: 'default',
      frames,
      mode,
      speed: 1.0,
      autoPlay: false
    })

    console.log(`✅ 序列帧动画创建完成: ${name}, 成功加载 ${frames.length} 帧`)
    return animation
  }
}

export default SpriteAnimation
