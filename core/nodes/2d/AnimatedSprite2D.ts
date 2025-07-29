/**
 * QAQ游戏引擎 - AnimatedSprite2D 2D动画精灵节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 用于播放2D精灵帧动画的节点，类似于Godot的AnimatedSprite2D
 * - 支持多个动画序列管理
 * - 提供播放控制：播放、暂停、停止、循环
 * - 支持动画事件和回调
 * - 优化的帧切换和内存管理
 * - 支持精灵表和独立帧文件
 *
 * 继承关系:
 * Node -> CanvasItem -> Node2D -> AnimatedSprite2D
 */

import Node2D from '../Node2D'
import ResourceLoader from '../../resources/ResourceLoader'
import * as THREE from 'three'
import type { Vector2, PropertyInfo } from '../../../types/core'
import type { LoadProgress, LoadResult } from '../../resources/ResourceLoader'

// ============================================================================
// AnimatedSprite2D相关枚举和接口
// ============================================================================

/**
 * 动画播放模式
 */
export enum AnimationMode {
  /** 播放一次 */
  ONCE = 0,
  /** 循环播放 */
  LOOP = 1,
  /** 来回播放 */
  PING_PONG = 2
}

/**
 * 动画帧接口
 */
export interface AnimationFrame {
  /** 纹理 */
  texture: THREE.Texture
  /** 持续时间（秒） */
  duration: number
  /** 帧名称 */
  name?: string
}

/**
 * 动画序列接口
 */
export interface AnimationSequence {
  /** 动画名称 */
  name: string
  /** 动画帧数组 */
  frames: AnimationFrame[]
  /** 播放模式 */
  mode: AnimationMode
  /** 播放速度倍率 */
  speed: number
  /** 是否自动播放 */
  autoPlay: boolean
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
  /** 总帧数 */
  totalFrames: number
  /** 起始帧索引 */
  startFrame?: number
}

// ============================================================================
// AnimatedSprite2D 主类
// ============================================================================

/**
 * AnimatedSprite2D 2D动画精灵节点类
 *
 * 提供完整的2D精灵动画功能，包括多动画管理、播放控制等
 */
export default class AnimatedSprite2D extends Node2D {
  // 动画相关属性
  private _animations: Map<string, AnimationSequence> = new Map()
  private _currentAnimation: string = ''
  private _currentFrame: number = 0
  private _frameTime: number = 0
  private _isPlaying: boolean = false
  private _isPaused: boolean = false
  private _playbackDirection: number = 1 // 1 for forward, -1 for backward

  // 显示属性
  private _centered: boolean = true
  private _flipH: boolean = false
  private _flipV: boolean = false

  // Three.js 对象
  private _spriteMesh: THREE.Mesh | null = null
  private _spriteMaterial: THREE.MeshBasicMaterial | null = null
  private _spriteGeometry: THREE.PlaneGeometry | null = null

  // 事件回调（保留向后兼容）
  private _onAnimationFinished?: (animationName: string) => void
  private _onFrameChanged?: (frame: number, animationName: string) => void

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'AnimatedSprite2D') {
    super(name)

    // 初始化AnimatedSprite2D特有的信号
    this.initializeAnimatedSpriteSignals()

    // 初始化AnimatedSprite2D特有的属性
    this.initializeAnimatedSpriteProperties()

    // 初始化Three.js对象
    this._initializeThreeObjects()

    console.log(`✅ AnimatedSprite2D节点创建: ${this.name}`)
  }

  // ============================================================================
  // 属性访问器
  // ============================================================================

  /**
   * 获取当前动画名称
   */
  get currentAnimation(): string {
    return this._currentAnimation
  }

  /**
   * 获取当前帧索引
   */
  get currentFrame(): number {
    return this._currentFrame
  }

  /**
   * 设置当前帧索引
   */
  set currentFrame(value: number) {
    const animation = this._animations.get(this._currentAnimation)
    if (animation && value >= 0 && value < animation.frames.length) {
      this._currentFrame = value
      this._updateCurrentFrame()

      // 发射信号
      this.emit('frame_changed', {
        frame: value,
        animation: this._currentAnimation,
        totalFrames: animation.frames.length
      })

      // 保持向后兼容的回调
      this._onFrameChanged?.(value, this._currentAnimation)
    }
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
   * 获取是否居中
   */
  get centered(): boolean {
    return this._centered
  }

  /**
   * 设置是否居中
   */
  set centered(value: boolean) {
    if (this._centered !== value) {
      this._centered = value
      this._updateGeometry()
      this.markDirty()
    }
  }

  /**
   * 获取水平翻转
   */
  get flipH(): boolean {
    return this._flipH
  }

  /**
   * 设置水平翻转
   */
  set flipH(value: boolean) {
    if (this._flipH !== value) {
      this._flipH = value
      this._updateUVMapping()
      this.markDirty()
    }
  }

  /**
   * 获取垂直翻转
   */
  get flipV(): boolean {
    return this._flipV
  }

  /**
   * 设置垂直翻转
   */
  set flipV(value: boolean) {
    if (this._flipV !== value) {
      this._flipV = value
      this._updateUVMapping()
      this.markDirty()
    }
  }

  // ============================================================================
  // 动画管理方法
  // ============================================================================

  /**
   * 添加动画序列
   * @param animation 动画序列
   */
  addAnimation(animation: AnimationSequence): void {
    this._animations.set(animation.name, animation)

    // 如果是第一个动画，设置为当前动画
    if (this._animations.size === 1) {
      this._currentAnimation = animation.name
      this._updateCurrentFrame()

      if (animation.autoPlay) {
        this.play(animation.name)
      }
    }

    console.log(`✅ 添加动画序列: ${animation.name}, 帧数: ${animation.frames.length}`)
  }

  /**
   * 移除动画序列
   * @param name 动画名称
   */
  removeAnimation(name: string): void {
    if (this._animations.has(name)) {
      this._animations.delete(name)

      // 如果删除的是当前动画，切换到第一个可用动画
      if (this._currentAnimation === name) {
        const firstAnimation = this._animations.keys().next().value
        if (firstAnimation) {
          this._currentAnimation = firstAnimation
          this._currentFrame = 0
          this._updateCurrentFrame()
        } else {
          this._currentAnimation = ''
          this._currentFrame = 0
        }
      }

      console.log(`✅ 移除动画序列: ${name}`)
    }
  }

  /**
   * 从精灵表创建动画（增强版）
   * @param name 动画名称
   * @param config 精灵表配置
   * @param frameDuration 每帧持续时间
   * @param mode 播放模式
   * @param speed 播放速度
   * @returns Promise<boolean> 创建是否成功
   */
  async createAnimationFromSpriteSheet(
    name: string,
    config: SpriteSheetConfig,
    frameDuration: number = 0.1,
    mode: AnimationMode = AnimationMode.LOOP,
    speed: number = 1.0
  ): Promise<boolean> {
    try {
      // 加载精灵表纹理
      const loader = ResourceLoader.getInstance()
      const result: LoadResult<THREE.Texture> = await loader.load<THREE.Texture>(
        config.texturePath,
        { useCache: true }
      )

      const spriteSheet = result.resource
      const frames: AnimationFrame[] = []

      // 验证精灵表尺寸
      const imageWidth = spriteSheet.image.width
      const imageHeight = spriteSheet.image.height
      const maxCols = Math.floor(imageWidth / config.frameWidth)
      const maxRows = Math.floor(imageHeight / config.frameHeight)
      const maxFrames = maxCols * maxRows

      console.log(`📊 精灵表信息: ${imageWidth}x${imageHeight}, 最大帧数: ${maxFrames}`)

      // 计算实际帧数
      const startFrame = config.startFrame || 0
      const actualFrameCount = Math.min(config.totalFrames, maxFrames - startFrame)

      // 使用更高效的纹理切片方法
      for (let i = 0; i < actualFrameCount; i++) {
        const frameIndex = startFrame + i
        const row = Math.floor(frameIndex / config.framesPerRow)
        const col = frameIndex % config.framesPerRow

        // 检查边界
        if (col >= maxCols || row >= maxRows) {
          console.warn(`⚠️ 帧索引超出边界: ${frameIndex} (${col}, ${row})`)
          break
        }

        // 创建帧纹理（优化的方法）
        const frameTexture = this._createFrameTexture(
          spriteSheet,
          col * config.frameWidth,
          row * config.frameHeight,
          config.frameWidth,
          config.frameHeight
        )

        frames.push({
          texture: frameTexture,
          duration: Array.isArray(frameDuration) ? frameDuration[i] || 0.1 : frameDuration,
          name: `${name}_frame_${i}`
        })
      }

      // 创建动画序列
      const animation: AnimationSequence = {
        name,
        frames,
        mode,
        speed,
        autoPlay: false
      }

      this.addAnimation(animation)
      console.log(`✅ 从精灵表创建动画: ${name}, 帧数: ${frames.length}`)
      return true

    } catch (error) {
      console.error(`❌ 从精灵表创建动画失败: ${name}`, error)
      return false
    }
  }

  /**
   * 批量创建多个动画序列
   * @param spriteSheetPath 精灵表路径
   * @param animations 动画配置数组
   * @returns Promise<boolean> 创建是否成功
   */
  async createMultipleAnimations(
    spriteSheetPath: string,
    animations: Array<{
      name: string
      startFrame: number
      frameCount: number
      frameWidth: number
      frameHeight: number
      framesPerRow: number
      frameDuration?: number | number[]
      mode?: AnimationMode
      speed?: number
    }>
  ): Promise<boolean> {
    try {
      // 加载精灵表
      const loader = ResourceLoader.getInstance()
      const result: LoadResult<THREE.Texture> = await loader.load<THREE.Texture>(
        spriteSheetPath,
        { useCache: true }
      )

      const spriteSheet = result.resource
      let successCount = 0

      // 为每个动画创建序列
      for (const animConfig of animations) {
        const config: SpriteSheetConfig = {
          texturePath: spriteSheetPath,
          frameWidth: animConfig.frameWidth,
          frameHeight: animConfig.frameHeight,
          framesPerRow: animConfig.framesPerRow,
          totalFrames: animConfig.frameCount,
          startFrame: animConfig.startFrame
        }

        const success = await this._createAnimationFromLoadedSpriteSheet(
          animConfig.name,
          spriteSheet,
          config,
          animConfig.frameDuration || 0.1,
          animConfig.mode || AnimationMode.LOOP,
          animConfig.speed || 1.0
        )

        if (success) successCount++
      }

      console.log(`✅ 批量创建动画完成: ${successCount}/${animations.length}`)
      return successCount === animations.length

    } catch (error) {
      console.error('❌ 批量创建动画失败:', error)
      return false
    }
  }

  /**
   * 从已加载的精灵表创建动画（内部方法）
   */
  private async _createAnimationFromLoadedSpriteSheet(
    name: string,
    spriteSheet: THREE.Texture,
    config: SpriteSheetConfig,
    frameDuration: number | number[],
    mode: AnimationMode,
    speed: number
  ): Promise<boolean> {
    try {
      const frames: AnimationFrame[] = []

      // 创建帧纹理
      for (let i = 0; i < config.totalFrames; i++) {
        const frameIndex = (config.startFrame || 0) + i
        const row = Math.floor(frameIndex / config.framesPerRow)
        const col = frameIndex % config.framesPerRow

        const frameTexture = this._createFrameTexture(
          spriteSheet,
          col * config.frameWidth,
          row * config.frameHeight,
          config.frameWidth,
          config.frameHeight
        )

        frames.push({
          texture: frameTexture,
          duration: Array.isArray(frameDuration) ? frameDuration[i] || 0.1 : frameDuration,
          name: `${name}_frame_${i}`
        })
      }

      // 创建动画序列
      const animation: AnimationSequence = {
        name,
        frames,
        mode,
        speed,
        autoPlay: false
      }

      this.addAnimation(animation)
      return true

    } catch (error) {
      console.error(`❌ 创建动画失败: ${name}`, error)
      return false
    }
  }

  /**
   * 从帧文件数组创建动画
   * @param name 动画名称
   * @param framePaths 帧文件路径数组
   * @param frameDuration 每帧持续时间
   * @param mode 播放模式
   * @param speed 播放速度
   * @returns Promise<boolean> 创建是否成功
   */
  async createAnimationFromFrames(
    name: string,
    framePaths: string[],
    frameDuration: number = 0.1,
    mode: AnimationMode = AnimationMode.LOOP,
    speed: number = 1.0
  ): Promise<boolean> {
    try {
      const loader = ResourceLoader.getInstance()
      const frames: AnimationFrame[] = []

      // 加载所有帧
      for (let i = 0; i < framePaths.length; i++) {
        const result: LoadResult<THREE.Texture> = await loader.load<THREE.Texture>(
          framePaths[i],
          { useCache: true }
        )

        frames.push({
          texture: result.resource,
          duration: frameDuration,
          name: `${name}_frame_${i}`
        })
      }

      // 创建动画序列
      const animation: AnimationSequence = {
        name,
        frames,
        mode,
        speed,
        autoPlay: false
      }

      this.addAnimation(animation)
      console.log(`✅ 从帧文件创建动画: ${name}, 帧数: ${frames.length}`)
      return true

    } catch (error) {
      console.error(`❌ 从帧文件创建动画失败: ${name}`, error)
      return false
    }
  }



  // ============================================================================
  // 播放控制方法
  // ============================================================================

  /**
   * 播放动画
   * @param animationName 动画名称，不指定则播放当前动画
   * @param fromFrame 起始帧，默认为0
   */
  play(animationName?: string, fromFrame: number = 0): void {
    if (animationName && this._animations.has(animationName)) {
      this._currentAnimation = animationName
    }

    if (!this._currentAnimation || !this._animations.has(this._currentAnimation)) {
      console.warn(`⚠️ 动画不存在: ${animationName || this._currentAnimation}`)
      return
    }

    this._currentFrame = fromFrame
    this._frameTime = 0
    this._isPlaying = true
    this._isPaused = false
    this._playbackDirection = 1

    this._updateCurrentFrame()

    // 发射动画开始信号
    this.emit('animation_started', {
      animation: this._currentAnimation,
      fromFrame: fromFrame
    })

    console.log(`▶️ 播放动画: ${this._currentAnimation}`)
  }

  /**
   * 暂停动画
   */
  pause(): void {
    if (this._isPlaying && !this._isPaused) {
      this._isPaused = true

      // 发射暂停信号
      this.emit('animation_paused', {
        animation: this._currentAnimation,
        frame: this._currentFrame
      })

      console.log(`⏸️ 暂停动画: ${this._currentAnimation}`)
    }
  }

  /**
   * 恢复动画
   */
  resume(): void {
    if (this._isPlaying && this._isPaused) {
      this._isPaused = false

      // 发射恢复信号
      this.emit('animation_resumed', {
        animation: this._currentAnimation,
        frame: this._currentFrame
      })

      console.log(`▶️ 恢复动画: ${this._currentAnimation}`)
    }
  }

  /**
   * 停止动画
   */
  stop(): void {
    if (this._isPlaying) {
      this._isPlaying = false
      this._isPaused = false
      this._currentFrame = 0
      this._frameTime = 0
      this._updateCurrentFrame()

      // 发射停止信号
      this.emit('animation_stopped', {
        animation: this._currentAnimation
      })

      console.log(`⏹️ 停止动画: ${this._currentAnimation}`)
    }
  }

  // ============================================================================
  // 事件回调设置
  // ============================================================================

  /**
   * 设置动画完成回调
   * @param callback 回调函数
   */
  setOnAnimationFinished(callback: (animationName: string) => void): void {
    this._onAnimationFinished = callback
  }

  /**
   * 设置帧变化回调
   * @param callback 回调函数
   */
  setOnFrameChanged(callback: (frame: number, animationName: string) => void): void {
    this._onFrameChanged = callback
  }

  // ============================================================================
  // 更新方法
  // ============================================================================

  /**
   * 更新动画（每帧调用）
   * @param deltaTime 时间增量
   */
  protected override _update(deltaTime: number): void {
    super._update(deltaTime)

    if (this._isPlaying && !this._isPaused && this._currentAnimation) {
      this._updateAnimation(deltaTime)
    }
  }

  /**
   * 更新动画逻辑
   * @param deltaTime 时间增量
   */
  private _updateAnimation(deltaTime: number): void {
    const animation = this._animations.get(this._currentAnimation)
    if (!animation || animation.frames.length === 0) return

    const currentFrameData = animation.frames[this._currentFrame]
    if (!currentFrameData) return

    // 更新帧时间
    this._frameTime += deltaTime * animation.speed

    // 检查是否需要切换帧
    if (this._frameTime >= currentFrameData.duration) {
      this._frameTime = 0
      this._advanceFrame(animation)
    }
  }

  /**
   * 推进到下一帧
   * @param animation 动画序列
   */
  private _advanceFrame(animation: AnimationSequence): void {
    const frameCount = animation.frames.length
    const previousFrame = this._currentFrame

    switch (animation.mode) {
      case AnimationMode.ONCE:
        if (this._currentFrame < frameCount - 1) {
          this._currentFrame++
          this._updateCurrentFrame()

          // 发射帧变化信号
          this.emit('frame_changed', {
            frame: this._currentFrame,
            animation: this._currentAnimation,
            totalFrames: frameCount
          })

          // 保持向后兼容的回调
          this._onFrameChanged?.(this._currentFrame, this._currentAnimation)
        } else {
          // 动画结束
          this._isPlaying = false

          // 发射动画完成信号
          this.emit('animation_finished', {
            animation: this._currentAnimation,
            totalFrames: frameCount
          })

          // 保持向后兼容的回调
          this._onAnimationFinished?.(this._currentAnimation)
        }
        break

      case AnimationMode.LOOP:
        const wasLastFrame = this._currentFrame === frameCount - 1
        this._currentFrame = (this._currentFrame + 1) % frameCount
        this._updateCurrentFrame()

        // 如果从最后一帧回到第一帧，发射循环信号
        if (wasLastFrame && this._currentFrame === 0) {
          this.emit('animation_looped', {
            animation: this._currentAnimation,
            totalFrames: frameCount
          })
        }

        // 发射帧变化信号
        this.emit('frame_changed', {
          frame: this._currentFrame,
          animation: this._currentAnimation,
          totalFrames: frameCount
        })

        // 保持向后兼容的回调
        this._onFrameChanged?.(this._currentFrame, this._currentAnimation)
        break

      case AnimationMode.PING_PONG:
        this._currentFrame += this._playbackDirection

        if (this._currentFrame >= frameCount - 1) {
          this._currentFrame = frameCount - 1
          this._playbackDirection = -1

          // 发射循环信号（到达末尾）
          this.emit('animation_looped', {
            animation: this._currentAnimation,
            totalFrames: frameCount,
            direction: 'forward_to_backward'
          })
        } else if (this._currentFrame <= 0) {
          this._currentFrame = 0
          this._playbackDirection = 1

          // 发射循环信号（到达开头）
          this.emit('animation_looped', {
            animation: this._currentAnimation,
            totalFrames: frameCount,
            direction: 'backward_to_forward'
          })
        }

        this._updateCurrentFrame()

        // 发射帧变化信号
        this.emit('frame_changed', {
          frame: this._currentFrame,
          animation: this._currentAnimation,
          totalFrames: frameCount
        })

        // 保持向后兼容的回调
        this._onFrameChanged?.(this._currentFrame, this._currentAnimation)
        break
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
    this._spriteGeometry = new THREE.PlaneGeometry(1, 1)

    // 创建材质
    this._spriteMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.01,
      side: THREE.DoubleSide
    })

    // 创建网格
    this._spriteMesh = new THREE.Mesh(this._spriteGeometry, this._spriteMaterial)
    this._spriteMesh.name = `${this.name}_AnimatedSpriteMesh`

    // 添加到场景图
    if (this.threeObject) {
      this.threeObject.add(this._spriteMesh)
    }
  }

  /**
   * 更新当前帧显示
   */
  private _updateCurrentFrame(): void {
    const animation = this._animations.get(this._currentAnimation)
    if (!animation || !animation.frames[this._currentFrame]) return

    const currentFrameData = animation.frames[this._currentFrame]

    if (this._spriteMaterial) {
      this._spriteMaterial.map = currentFrameData.texture
      this._spriteMaterial.needsUpdate = true
    }

    this._updateGeometry()
  }

  /**
   * 更新几何体
   */
  private _updateGeometry(): void {
    if (!this._spriteGeometry || !this._spriteMesh) return

    const animation = this._animations.get(this._currentAnimation)
    if (!animation || !animation.frames[this._currentFrame]) return

    const texture = animation.frames[this._currentFrame].texture
    const width = texture.image?.width || 100
    const height = texture.image?.height || 100

    // 更新几何体大小
    this._spriteGeometry.dispose()
    this._spriteGeometry = new THREE.PlaneGeometry(width, height)
    this._spriteMesh.geometry = this._spriteGeometry

    // 应用居中
    if (this._centered) {
      this._spriteMesh.position.set(0, 0, 0)
    } else {
      this._spriteMesh.position.set(width / 2, -height / 2, 0)
    }

    this._updateUVMapping()
  }

  /**
   * 更新UV映射
   */
  private _updateUVMapping(): void {
    if (!this._spriteGeometry) return

    let uvs = [0, 1, 1, 1, 0, 0, 1, 0] // 默认UV坐标

    // 应用翻转
    if (this._flipH) {
      [uvs[0], uvs[2]] = [uvs[2], uvs[0]]
      [uvs[4], uvs[6]] = [uvs[6], uvs[4]]
    }

    if (this._flipV) {
      [uvs[1], uvs[5]] = [uvs[5], uvs[1]]
      [uvs[3], uvs[7]] = [uvs[7], uvs[3]]
    }

    // 更新UV属性
    this._spriteGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }

  /**
   * 创建帧纹理（优化方法）
   * @param sourceTexture 源纹理
   * @param x 裁剪X坐标
   * @param y 裁剪Y坐标
   * @param width 裁剪宽度
   * @param height 裁剪高度
   * @returns 帧纹理
   */
  private _createFrameTexture(
    sourceTexture: THREE.Texture,
    x: number,
    y: number,
    width: number,
    height: number
  ): THREE.Texture {
    // 创建Canvas进行纹理裁剪
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // 绘制裁剪的帧
    ctx.drawImage(
      sourceTexture.image,
      x, y, width, height,  // 源区域
      0, 0, width, height   // 目标区域
    )

    // 创建纹理
    const frameTexture = new THREE.CanvasTexture(canvas)
    frameTexture.needsUpdate = true

    // 复制源纹理的设置
    frameTexture.magFilter = sourceTexture.magFilter
    frameTexture.minFilter = sourceTexture.minFilter
    frameTexture.wrapS = sourceTexture.wrapS
    frameTexture.wrapT = sourceTexture.wrapT

    return frameTexture
  }

  /**
   * 清理资源
   */
  protected override _cleanup(): void {
    // 清理动画帧纹理
    for (const animation of this._animations.values()) {
      for (const frame of animation.frames) {
        frame.texture.dispose()
      }
    }
    this._animations.clear()

    if (this._spriteGeometry) {
      this._spriteGeometry.dispose()
      this._spriteGeometry = null
    }

    if (this._spriteMaterial) {
      this._spriteMaterial.dispose()
      this._spriteMaterial = null
    }

    if (this._spriteMesh && this.threeObject) {
      this.threeObject.remove(this._spriteMesh)
      this._spriteMesh = null
    }

    super._cleanup()
  }

  // ========================================================================
  // 信号和属性初始化
  // ========================================================================

  /**
   * 初始化AnimatedSprite2D特有的信号
   */
  private initializeAnimatedSpriteSignals(): void {
    // 动画相关信号
    this.addSignal('animation_started')
    this.addSignal('animation_finished')
    this.addSignal('animation_looped')
    this.addSignal('frame_changed')

    // 播放状态信号
    this.addSignal('animation_paused')
    this.addSignal('animation_resumed')
    this.addSignal('animation_stopped')

    console.log(`✅ AnimatedSprite2D信号系统初始化完成: ${this.name}`)
  }

  /**
   * 初始化AnimatedSprite2D特有的属性
   */
  private initializeAnimatedSpriteProperties(): void {
    const properties: PropertyInfo[] = [
      // 动画属性
      {
        name: 'current_animation',
        type: 'string',
        hint: '当前播放的动画名称'
      },
      {
        name: 'current_frame',
        type: 'int',
        hint: '当前帧索引'
      },
      {
        name: 'is_playing',
        type: 'bool',
        hint: '是否正在播放'
      },
      {
        name: 'is_paused',
        type: 'bool',
        hint: '是否暂停'
      },

      // 显示属性
      {
        name: 'centered',
        type: 'bool',
        hint: '是否居中显示'
      },
      {
        name: 'flip_h',
        type: 'bool',
        hint: '水平翻转'
      },
      {
        name: 'flip_v',
        type: 'bool',
        hint: '垂直翻转'
      }
    ]

    // 注册属性到属性系统
    properties.forEach(prop => this.addProperty(prop))

    console.log(`✅ AnimatedSprite2D属性系统初始化完成: ${this.name}`)
  }
}
