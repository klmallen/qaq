/**
 * QAQ游戏引擎 - TileSet 瓦片集资源
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 管理瓦片定义和属性
 * - 支持精灵表和单独图像
 * - 支持动画瓦片
 * - 支持碰撞形状和自定义属性
 * - 纹理图集优化
 *
 * 参考: Godot TileSet 系统
 */

import * as THREE from 'three'
import type { Vector2, Rect2 } from '../../types/core'

// ============================================================================
// TileSet相关枚举和接口
// ============================================================================

/**
 * 瓦片类型枚举
 */
export enum TileType {
  /** 普通瓦片 */
  NORMAL = 0,
  /** 动画瓦片 */
  ANIMATED = 1,
  /** 自动瓦片 */
  AUTO_TILE = 2
}

/**
 * 碰撞形状类型
 */
export enum CollisionShapeType {
  /** 无碰撞 */
  NONE = 0,
  /** 矩形碰撞 */
  RECTANGLE = 1,
  /** 圆形碰撞 */
  CIRCLE = 2,
  /** 多边形碰撞 */
  POLYGON = 3
}

/**
 * 瓦片碰撞形状接口
 */
export interface TileCollisionShape {
  /** 碰撞形状类型 */
  type: CollisionShapeType
  /** 偏移位置 */
  offset: Vector2
  /** 矩形尺寸（用于矩形碰撞） */
  size?: Vector2
  /** 半径（用于圆形碰撞） */
  radius?: number
  /** 顶点数组（用于多边形碰撞） */
  vertices?: Vector2[]
}

/**
 * 动画帧接口
 */
export interface TileAnimationFrame {
  /** 瓦片ID */
  tileId: number
  /** 持续时间（秒） */
  duration: number
}

/**
 * 瓦片定义接口
 */
export interface TileDefinition {
  /** 瓦片ID */
  id: number
  /** 瓦片名称 */
  name: string
  /** 瓦片类型 */
  type: TileType
  /** 纹理区域 */
  textureRegion: Rect2
  /** 碰撞形状 */
  collisionShape: TileCollisionShape
  /** 自定义属性 */
  properties: Record<string, any>
  /** 动画帧（仅用于动画瓦片） */
  animationFrames?: TileAnimationFrame[]
  /** 动画速度 */
  animationSpeed?: number
  /** 是否可见 */
  visible: boolean
  /** 调制颜色 */
  modulate: { r: number, g: number, b: number, a: number }
}

// ============================================================================
// TileSet 类实现
// ============================================================================

/**
 * TileSet 类 - 瓦片集资源
 *
 * 主要功能:
 * 1. 管理瓦片定义和纹理
 * 2. 支持精灵表和纹理图集
 * 3. 提供瓦片查询和操作接口
 * 4. 支持动画瓦片系统
 * 5. 优化渲染性能
 */
export default class TileSet {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 瓦片集名称 */
  private _name: string = ''

  /** 主纹理 */
  private _texture: THREE.Texture | null = null

  /** 瓦片尺寸 */
  private _tileSize: Vector2 = { x: 32, y: 32 }

  /** 瓦片间距 */
  private _tileSpacing: Vector2 = { x: 0, y: 0 }

  /** 瓦片边距 */
  private _tileMargin: Vector2 = { x: 0, y: 0 }

  /** 瓦片定义映射 */
  private _tiles: Map<number, TileDefinition> = new Map()

  /** 下一个可用的瓦片ID */
  private _nextTileId: number = 0

  /** 纹理图集材质 */
  private _atlasMaterial: THREE.SpriteMaterial | null = null

  /** 是否需要更新图集 */
  private _atlasNeedsUpdate: boolean = true

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 瓦片集名称
   */
  constructor(name: string = 'TileSet') {
    this._name = name
    this._initializeAtlas()
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取瓦片集名称
   */
  get name(): string {
    return this._name
  }

  /**
   * 设置瓦片集名称
   */
  set name(value: string) {
    this._name = value
  }

  /**
   * 获取主纹理
   */
  get texture(): THREE.Texture | null {
    return this._texture
  }

  /**
   * 设置主纹理
   */
  set texture(value: THREE.Texture | null) {
    this._texture = value
    this._atlasNeedsUpdate = true
    this._updateAtlas()
  }

  /**
   * 获取瓦片尺寸
   */
  get tileSize(): Vector2 {
    return { ...this._tileSize }
  }

  /**
   * 设置瓦片尺寸
   */
  set tileSize(value: Vector2) {
    this._tileSize = { ...value }
    this._atlasNeedsUpdate = true
  }

  /**
   * 获取瓦片间距
   */
  get tileSpacing(): Vector2 {
    return { ...this._tileSpacing }
  }

  /**
   * 设置瓦片间距
   */
  set tileSpacing(value: Vector2) {
    this._tileSpacing = { ...value }
    this._atlasNeedsUpdate = true
  }

  /**
   * 获取瓦片边距
   */
  get tileMargin(): Vector2 {
    return { ...this._tileMargin }
  }

  /**
   * 设置瓦片边距
   */
  set tileMargin(value: Vector2) {
    this._tileMargin = { ...value }
    this._atlasNeedsUpdate = true
  }

  /**
   * 获取图集材质
   */
  get atlasMaterial(): THREE.SpriteMaterial | null {
    return this._atlasMaterial
  }

  // ========================================================================
  // 瓦片管理方法
  // ========================================================================

  /**
   * 创建瓦片
   * @param definition 瓦片定义
   * @returns 瓦片ID
   */
  createTile(definition: Partial<TileDefinition>): number {
    const tileId = definition.id ?? this._nextTileId++

    const tile: TileDefinition = {
      id: tileId,
      name: definition.name || `Tile_${tileId}`,
      type: definition.type || TileType.NORMAL,
      textureRegion: definition.textureRegion || { x: 0, y: 0, width: this._tileSize.x, height: this._tileSize.y },
      collisionShape: definition.collisionShape || { type: CollisionShapeType.NONE, offset: { x: 0, y: 0 } },
      properties: definition.properties || {},
      animationFrames: definition.animationFrames,
      animationSpeed: definition.animationSpeed || 1.0,
      visible: definition.visible ?? true,
      modulate: definition.modulate || { r: 1, g: 1, b: 1, a: 1 }
    }

    this._tiles.set(tileId, tile)
    this._atlasNeedsUpdate = true

    return tileId
  }

  /**
   * 获取瓦片定义
   * @param tileId 瓦片ID
   * @returns 瓦片定义
   */
  getTile(tileId: number): TileDefinition | null {
    return this._tiles.get(tileId) || null
  }

  /**
   * 删除瓦片
   * @param tileId 瓦片ID
   */
  removeTile(tileId: number): void {
    this._tiles.delete(tileId)
    this._atlasNeedsUpdate = true
  }

  /**
   * 获取所有瓦片ID
   * @returns 瓦片ID数组
   */
  getTileIds(): number[] {
    return Array.from(this._tiles.keys())
  }

  /**
   * 获取瓦片数量
   * @returns 瓦片数量
   */
  getTileCount(): number {
    return this._tiles.size
  }

  // ========================================================================
  // 精灵表处理方法
  // ========================================================================

  /**
   * 从精灵表创建瓦片
   * @param columns 列数
   * @param rows 行数
   * @param startId 起始ID
   */
  createTilesFromSpriteSheet(columns: number, rows: number, startId: number = 0): void {
    if (!this._texture) {
      console.warn('No texture set for tileset')
      return
    }

    const tileWidth = this._tileSize.x
    const tileHeight = this._tileSize.y
    const spacingX = this._tileSpacing.x
    const spacingY = this._tileSpacing.y
    const marginX = this._tileMargin.x
    const marginY = this._tileMargin.y

    let currentId = startId

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = marginX + col * (tileWidth + spacingX)
        const y = marginY + row * (tileHeight + spacingY)

        this.createTile({
          id: currentId,
          name: `Tile_${currentId}`,
          type: TileType.NORMAL,
          textureRegion: {
            x: x,
            y: y,
            width: tileWidth,
            height: tileHeight
          }
        })

        currentId++
      }
    }

    this._nextTileId = Math.max(this._nextTileId, currentId)
  }

  // ========================================================================
  // 动画瓦片方法
  // ========================================================================

  /**
   * 创建动画瓦片
   * @param tileId 瓦片ID
   * @param frames 动画帧
   * @param speed 动画速度
   */
  createAnimatedTile(tileId: number, frames: TileAnimationFrame[], speed: number = 1.0): void {
    const tile = this._tiles.get(tileId)
    if (!tile) {
      console.warn(`Tile ${tileId} not found`)
      return
    }

    tile.type = TileType.ANIMATED
    tile.animationFrames = frames
    tile.animationSpeed = speed
  }

  /**
   * 获取动画瓦片的当前帧
   * @param tileId 瓦片ID
   * @param time 当前时间
   * @returns 当前帧的瓦片ID
   */
  getAnimatedTileFrame(tileId: number, time: number): number {
    const tile = this._tiles.get(tileId)
    if (!tile || tile.type !== TileType.ANIMATED || !tile.animationFrames) {
      return tileId
    }

    const frames = tile.animationFrames
    const speed = tile.animationSpeed || 1.0
    let totalDuration = 0

    // 计算总动画时长
    for (const frame of frames) {
      totalDuration += frame.duration
    }

    if (totalDuration === 0) return tileId

    // 计算当前时间在动画循环中的位置
    const animTime = (time * speed) % totalDuration
    let currentTime = 0

    // 找到当前帧
    for (const frame of frames) {
      currentTime += frame.duration
      if (animTime <= currentTime) {
        return frame.tileId
      }
    }

    return tileId
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 初始化图集
   */
  private _initializeAtlas(): void {
    this._atlasMaterial = new THREE.SpriteMaterial({
      transparent: true,
      alphaTest: 0.01
    })
  }

  /**
   * 更新图集
   */
  private _updateAtlas(): void {
    if (!this._atlasNeedsUpdate || !this._texture) return

    this._atlasMaterial!.map = this._texture
    this._atlasMaterial!.needsUpdate = true
    this._atlasNeedsUpdate = false
  }

  // ========================================================================
  // 资源管理
  // ========================================================================

  /**
   * 销毁瓦片集
   */
  destroy(): void {
    if (this._atlasMaterial) {
      this._atlasMaterial.dispose()
      this._atlasMaterial = null
    }

    this._tiles.clear()
    this._texture = null
  }
}
