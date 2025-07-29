/**
 * QAQ游戏引擎 - SpriteSheetAnimator2D 精灵表动画节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 专门用于精灵表动画的节点，类似于Godot的AnimatedSprite2D
 * - 自动解析精灵表并提取帧
 * - 支持多个动画剪辑从同一精灵表
 * - 提供动画混合和过渡功能
 * - 优化的内存管理和渲染性能
 * - 集成动画编辑器支持
 *
 * 继承关系:
 * Node -> CanvasItem -> Node2D -> SpriteSheetAnimator2D
 */

import Node2D from '../Node2D'
import ResourceLoader from '../../resources/ResourceLoader'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'
import type { LoadProgress, LoadResult } from '../../resources/ResourceLoader'

// ============================================================================
// SpriteSheetAnimator2D相关枚举和接口
// ============================================================================

/**
 * 动画播放模式
 */
export enum PlayMode {
  /** 播放一次 */
  ONCE = 0,
  /** 循环播放 */
  LOOP = 1,
  /** 来回播放 */
  PING_PONG = 2,
  /** 随机播放 */
  RANDOM = 3
}

/**
 * 动画混合模式
 */
export enum BlendMode {
  /** 立即切换 */
  IMMEDIATE = 0,
  /** 淡入淡出 */
  FADE = 1,
  /** 交叉淡化 */
  CROSS_FADE = 2
}

/**
 * 精灵表配置接口
 */
export interface SpriteSheetConfig {
  /** 精灵表纹理路径 */
  texturePath: string
  /** 帧宽度 */
  frameWidth: number
  /** 帧高度 */
  frameHeight: number
  /** 每行帧数 */
  framesPerRow: number
  /** 总行数 */
  totalRows: number
  /** 边距 */
  margin?: { x: number; y: number }
  /** 间距 */
  spacing?: { x: number; y: number }
}

/**
 * 动画剪辑接口
 */
export interface AnimationClip {
  /** 动画名称 */
  name: string
  /** 起始帧索引 */
  startFrame: number
  /** 帧数量 */
  frameCount: number
  /** 帧持续时间数组 */
  frameDurations: number[]
  /** 播放模式 */
  playMode: PlayMode
  /** 播放速度倍率 */
  speed: number
  /** 是否循环 */
  loop: boolean
  /** 动画事件 */
  events?: AnimationEvent[]
}

/**
 * 动画事件接口
 */
export interface AnimationEvent {
  /** 事件名称 */
  name: string
  /** 触发帧 */
  frame: number
  /** 事件数据 */
  data?: any
}

/**
 * 帧数据接口
 */
export interface FrameData {
  /** 帧索引 */
  index: number
  /** 纹理 */
  texture: THREE.Texture
  /** UV坐标 */
  uv: number[]
  /** 持续时间 */
  duration: number
}

// ============================================================================
// SpriteSheetAnimator2D 主类
// ============================================================================

/**
 * SpriteSheetAnimator2D 精灵表动画节点类
 * 
 * 专门处理精灵表动画的高级节点
 */
export default class SpriteSheetAnimator2D extends Node2D {
  // 精灵表相关
  private _spriteSheetTexture: THREE.Texture | null = null
  private _spriteSheetConfig: SpriteSheetConfig | null = null
  private _frames: FrameData[] = []
  
  // 动画相关
  private _animationClips: Map<string, AnimationClip> = new Map()
  private _currentClip: string = ''
  private _currentFrame: number = 0
  private _frameTime: number = 0
  private _isPlaying: boolean = false
  private _isPaused: boolean = false
  private _playbackDirection: number = 1
  
  // 混合相关
  private _blendMode: BlendMode = BlendMode.IMMEDIATE
  private _blendDuration: number = 0.3
  private _blendTime: number = 0
  private _previousClip: string = ''
  private _isBlending: boolean = false
  
  // 显示属性
  private _centered: boolean = true
  private _flipH: boolean = false
  private _flipV: boolean = false
  
  // Three.js 对象
  private _mesh: THREE.Mesh | null = null
  private _material: THREE.MeshBasicMaterial | null = null
  private _geometry: THREE.PlaneGeometry | null = null
  
  // 事件回调
  private _onAnimationFinished?: (clipName: string) => void
  private _onFrameChanged?: (frame: number, clipName: string) => void
  private _onAnimationEvent?: (event: AnimationEvent) => void

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'SpriteSheetAnimator2D') {
    super(name)
    
    // 初始化Three.js对象
    this._initializeThreeObjects()
    
    console.log(`✅ SpriteSheetAnimator2D节点创建: ${this.name}`)
  }

  // ============================================================================
  // 属性访问器
  // ============================================================================

  /**
   * 获取当前动画剪辑名称
   */
  get currentClip(): string {
    return this._currentClip
  }

  /**
   * 获取当前帧索引
   */
  get currentFrame(): number {
    return this._currentFrame
  }

  /**
   * 获取是否正在播放
   */
  get isPlaying(): boolean {
    return this._isPlaying && !this._isPaused
  }

  /**
   * 获取是否暂停
   */
  get isPaused(): boolean {
    return this._isPaused
  }

  /**
   * 获取是否正在混合
   */
  get isBlending(): boolean {
    return this._isBlending
  }

  /**
   * 获取精灵表配置
   */
  get spriteSheetConfig(): SpriteSheetConfig | null {
    return this._spriteSheetConfig ? { ...this._spriteSheetConfig } : null
  }

  /**
   * 获取动画剪辑列表
   */
  get animationClips(): string[] {
    return Array.from(this._animationClips.keys())
  }

  // ============================================================================
  // 精灵表管理方法
  // ============================================================================

  /**
   * 加载精灵表
   * @param config 精灵表配置
   * @returns Promise<boolean> 加载是否成功
   */
  async loadSpriteSheet(config: SpriteSheetConfig): Promise<boolean> {
    try {
      console.log(`🔄 加载精灵表: ${config.texturePath}`)
      
      // 加载纹理
      const loader = ResourceLoader.getInstance()
      const result: LoadResult<THREE.Texture> = await loader.loadResource(
        config.texturePath,
        'texture'
      )
      
      this._spriteSheetTexture = result.resource
      this._spriteSheetConfig = { ...config }
      
      // 解析精灵表
      await this._parseSpriteSheet()
      
      console.log(`✅ 精灵表加载成功: ${this._frames.length} 帧`)
      return true
      
    } catch (error) {
      console.error(`❌ 精灵表加载失败: ${config.texturePath}`, error)
      return false
    }
  }

  /**
   * 添加动画剪辑
   * @param clip 动画剪辑
   */
  addAnimationClip(clip: AnimationClip): void {
    // 验证帧范围
    if (clip.startFrame + clip.frameCount > this._frames.length) {
      console.warn(`⚠️ 动画剪辑帧范围超出精灵表: ${clip.name}`)
      return
    }
    
    this._animationClips.set(clip.name, { ...clip })
    
    // 如果是第一个剪辑，设置为当前剪辑
    if (this._animationClips.size === 1) {
      this._currentClip = clip.name
    }
    
    console.log(`✅ 添加动画剪辑: ${clip.name} (${clip.frameCount} 帧)`)
  }

  /**
   * 移除动画剪辑
   * @param name 剪辑名称
   */
  removeAnimationClip(name: string): void {
    if (this._animationClips.has(name)) {
      this._animationClips.delete(name)
      
      // 如果删除的是当前剪辑，切换到第一个可用剪辑
      if (this._currentClip === name) {
        const firstClip = this._animationClips.keys().next().value
        this._currentClip = firstClip || ''
        this._currentFrame = 0
      }
      
      console.log(`✅ 移除动画剪辑: ${name}`)
    }
  }

  /**
   * 批量添加动画剪辑
   * @param clips 动画剪辑数组
   */
  addAnimationClips(clips: AnimationClip[]): void {
    clips.forEach(clip => this.addAnimationClip(clip))
  }

  // ============================================================================
  // 播放控制方法
  // ============================================================================

  /**
   * 播放动画剪辑
   * @param clipName 剪辑名称
   * @param blendMode 混合模式
   * @param blendDuration 混合时间
   */
  play(clipName?: string, blendMode?: BlendMode, blendDuration?: number): void {
    const targetClip = clipName || this._currentClip
    
    if (!targetClip || !this._animationClips.has(targetClip)) {
      console.warn(`⚠️ 动画剪辑不存在: ${targetClip}`)
      return
    }
    
    // 设置混合
    if (this._currentClip && this._currentClip !== targetClip) {
      this._setupBlending(targetClip, blendMode, blendDuration)
    } else {
      this._currentClip = targetClip
      this._currentFrame = 0
      this._frameTime = 0
    }
    
    this._isPlaying = true
    this._isPaused = false
    this._playbackDirection = 1
    
    this._updateCurrentFrame()
    console.log(`▶️ 播放动画: ${targetClip}`)
  }

  /**
   * 暂停动画
   */
  pause(): void {
    this._isPaused = true
    console.log(`⏸️ 暂停动画: ${this._currentClip}`)
  }

  /**
   * 恢复动画
   */
  resume(): void {
    if (this._isPlaying) {
      this._isPaused = false
      console.log(`▶️ 恢复动画: ${this._currentClip}`)
    }
  }

  /**
   * 停止动画
   */
  stop(): void {
    this._isPlaying = false
    this._isPaused = false
    this._isBlending = false
    this._currentFrame = 0
    this._frameTime = 0
    this._updateCurrentFrame()
    console.log(`⏹️ 停止动画: ${this._currentClip}`)
  }

  /**
   * 跳转到指定帧
   * @param frame 帧索引
   */
  seekToFrame(frame: number): void {
    const clip = this._animationClips.get(this._currentClip)
    if (clip && frame >= 0 && frame < clip.frameCount) {
      this._currentFrame = frame
      this._frameTime = 0
      this._updateCurrentFrame()
    }
  }

  // ============================================================================
  // 事件回调设置
  // ============================================================================

  /**
   * 设置动画完成回调
   */
  setOnAnimationFinished(callback: (clipName: string) => void): void {
    this._onAnimationFinished = callback
  }

  /**
   * 设置帧变化回调
   */
  setOnFrameChanged(callback: (frame: number, clipName: string) => void): void {
    this._onFrameChanged = callback
  }

  /**
   * 设置动画事件回调
   */
  setOnAnimationEvent(callback: (event: AnimationEvent) => void): void {
    this._onAnimationEvent = callback
  }

  // ============================================================================
  // 更新方法
  // ============================================================================

  /**
   * 更新动画（每帧调用）
   */
  protected override _update(deltaTime: number): void {
    super._update(deltaTime)
    
    if (this._isPlaying && !this._isPaused) {
      if (this._isBlending) {
        this._updateBlending(deltaTime)
      } else {
        this._updateAnimation(deltaTime)
      }
    }
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 初始化Three.js对象
   */
  private _initializeThreeObjects(): void {
    // 创建几何体
    this._geometry = new THREE.PlaneGeometry(1, 1)
    
    // 创建材质
    this._material = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })
    
    // 创建网格
    this._mesh = new THREE.Mesh(this._geometry, this._material)
    this._mesh.name = `${this.name}_SpriteSheetMesh`
    
    // 添加到场景图
    if (this.threeObject) {
      this.threeObject.add(this._mesh)
    }
  }

  /**
   * 解析精灵表
   */
  private async _parseSpriteSheet(): Promise<void> {
    if (!this._spriteSheetTexture || !this._spriteSheetConfig) return
    
    const config = this._spriteSheetConfig
    const texture = this._spriteSheetTexture
    
    this._frames = []
    
    // 计算帧的实际尺寸和位置
    const margin = config.margin || { x: 0, y: 0 }
    const spacing = config.spacing || { x: 0, y: 0 }
    
    const totalFrames = config.framesPerRow * config.totalRows
    
    for (let i = 0; i < totalFrames; i++) {
      const row = Math.floor(i / config.framesPerRow)
      const col = i % config.framesPerRow
      
      // 计算帧位置
      const x = margin.x + col * (config.frameWidth + spacing.x)
      const y = margin.y + row * (config.frameHeight + spacing.y)
      
      // 创建帧纹理
      const frameTexture = this._createFrameTexture(texture, x, y, config.frameWidth, config.frameHeight)
      
      // 计算UV坐标
      const uv = this._calculateUV(x, y, config.frameWidth, config.frameHeight, texture.image.width, texture.image.height)
      
      this._frames.push({
        index: i,
        texture: frameTexture,
        uv,
        duration: 0.1 // 默认持续时间
      })
    }
    
    console.log(`📊 解析精灵表完成: ${this._frames.length} 帧`)
  }

  /**
   * 创建帧纹理
   */
  private _createFrameTexture(
    sourceTexture: THREE.Texture,
    x: number,
    y: number,
    width: number,
    height: number
  ): THREE.Texture {
    // 使用UV坐标而不是Canvas裁剪来提高性能
    const frameTexture = sourceTexture.clone()
    frameTexture.needsUpdate = true
    
    // 设置纹理变换
    frameTexture.repeat.set(width / sourceTexture.image.width, height / sourceTexture.image.height)
    frameTexture.offset.set(x / sourceTexture.image.width, 1 - (y + height) / sourceTexture.image.height)
    
    return frameTexture
  }

  /**
   * 计算UV坐标
   */
  private _calculateUV(x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number): number[] {
    const u1 = x / imageWidth
    const v1 = 1 - (y + height) / imageHeight
    const u2 = (x + width) / imageWidth
    const v2 = 1 - y / imageHeight
    
    return [u1, v2, u2, v2, u1, v1, u2, v1]
  }

  /**
   * 设置混合
   */
  private _setupBlending(targetClip: string, blendMode?: BlendMode, blendDuration?: number): void {
    this._previousClip = this._currentClip
    this._currentClip = targetClip
    this._blendMode = blendMode || BlendMode.IMMEDIATE
    this._blendDuration = blendDuration || 0.3
    this._blendTime = 0
    this._isBlending = this._blendMode !== BlendMode.IMMEDIATE
    
    if (!this._isBlending) {
      this._currentFrame = 0
      this._frameTime = 0
    }
  }

  /**
   * 更新混合
   */
  private _updateBlending(deltaTime: number): void {
    this._blendTime += deltaTime
    const blendProgress = Math.min(this._blendTime / this._blendDuration, 1)
    
    if (blendProgress >= 1) {
      // 混合完成
      this._isBlending = false
      this._currentFrame = 0
      this._frameTime = 0
      this._updateCurrentFrame()
    } else {
      // 继续混合
      this._updateBlendedFrame(blendProgress)
    }
  }

  /**
   * 更新混合帧
   */
  private _updateBlendedFrame(progress: number): void {
    // 简化的混合实现，实际可以更复杂
    if (this._material) {
      this._material.opacity = progress
    }
    this._updateCurrentFrame()
  }

  /**
   * 更新动画
   */
  private _updateAnimation(deltaTime: number): void {
    const clip = this._animationClips.get(this._currentClip)
    if (!clip) return
    
    const frameData = this._frames[clip.startFrame + this._currentFrame]
    if (!frameData) return
    
    const frameDuration = clip.frameDurations[this._currentFrame] || frameData.duration
    
    this._frameTime += deltaTime * clip.speed
    
    if (this._frameTime >= frameDuration) {
      this._frameTime = 0
      this._advanceFrame(clip)
    }
  }

  /**
   * 推进到下一帧
   */
  private _advanceFrame(clip: AnimationClip): void {
    switch (clip.playMode) {
      case PlayMode.ONCE:
        if (this._currentFrame < clip.frameCount - 1) {
          this._currentFrame++
          this._updateCurrentFrame()
          this._checkAnimationEvents(clip)
        } else {
          this._isPlaying = false
          this._onAnimationFinished?.(clip.name)
        }
        break
        
      case PlayMode.LOOP:
        this._currentFrame = (this._currentFrame + 1) % clip.frameCount
        this._updateCurrentFrame()
        this._checkAnimationEvents(clip)
        break
        
      case PlayMode.PING_PONG:
        this._currentFrame += this._playbackDirection
        
        if (this._currentFrame >= clip.frameCount - 1) {
          this._currentFrame = clip.frameCount - 1
          this._playbackDirection = -1
        } else if (this._currentFrame <= 0) {
          this._currentFrame = 0
          this._playbackDirection = 1
        }
        
        this._updateCurrentFrame()
        this._checkAnimationEvents(clip)
        break
        
      case PlayMode.RANDOM:
        this._currentFrame = Math.floor(Math.random() * clip.frameCount)
        this._updateCurrentFrame()
        this._checkAnimationEvents(clip)
        break
    }
    
    this._onFrameChanged?.(this._currentFrame, clip.name)
  }

  /**
   * 检查动画事件
   */
  private _checkAnimationEvents(clip: AnimationClip): void {
    if (!clip.events) return
    
    for (const event of clip.events) {
      if (event.frame === this._currentFrame) {
        this._onAnimationEvent?.(event)
      }
    }
  }

  /**
   * 更新当前帧显示
   */
  private _updateCurrentFrame(): void {
    const clip = this._animationClips.get(this._currentClip)
    if (!clip) return
    
    const frameData = this._frames[clip.startFrame + this._currentFrame]
    if (!frameData) return
    
    if (this._material) {
      this._material.map = frameData.texture
      this._material.needsUpdate = true
    }
    
    this._updateGeometry(frameData)
  }

  /**
   * 更新几何体
   */
  private _updateGeometry(frameData: FrameData): void {
    if (!this._geometry || !this._mesh || !this._spriteSheetConfig) return
    
    const width = this._spriteSheetConfig.frameWidth
    const height = this._spriteSheetConfig.frameHeight
    
    // 更新几何体大小
    this._geometry.dispose()
    this._geometry = new THREE.PlaneGeometry(width, height)
    this._mesh.geometry = this._geometry
    
    // 应用居中
    if (this._centered) {
      this._mesh.position.set(0, 0, 0)
    } else {
      this._mesh.position.set(width / 2, -height / 2, 0)
    }
    
    // 更新UV映射
    this._updateUVMapping(frameData.uv)
  }

  /**
   * 更新UV映射
   */
  private _updateUVMapping(uv: number[]): void {
    if (!this._geometry) return
    
    let finalUV = [...uv]
    
    // 应用翻转
    if (this._flipH) {
      [finalUV[0], finalUV[2]] = [finalUV[2], finalUV[0]]
      [finalUV[4], finalUV[6]] = [finalUV[6], finalUV[4]]
    }
    
    if (this._flipV) {
      [finalUV[1], finalUV[5]] = [finalUV[5], finalUV[1]]
      [finalUV[3], finalUV[7]] = [finalUV[7], finalUV[3]]
    }
    
    this._geometry.setAttribute('uv', new THREE.Float32BufferAttribute(finalUV, 2))
  }

  /**
   * 清理资源
   */
  protected override _cleanup(): void {
    // 清理帧纹理
    this._frames.forEach(frame => {
      frame.texture.dispose()
    })
    this._frames = []
    
    this._animationClips.clear()
    
    if (this._geometry) {
      this._geometry.dispose()
      this._geometry = null
    }
    
    if (this._material) {
      this._material.dispose()
      this._material = null
    }
    
    if (this._mesh && this.threeObject) {
      this.threeObject.remove(this._mesh)
      this._mesh = null
    }
    
    if (this._spriteSheetTexture) {
      this._spriteSheetTexture.dispose()
      this._spriteSheetTexture = null
    }
    
    super._cleanup()
  }
}
