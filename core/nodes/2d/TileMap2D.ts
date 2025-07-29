/**
 * QAQ游戏引擎 - TileMap2D 瓦片地图节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 继承自Node2D的瓦片地图系统
 * - 支持大规模瓦片网格的高效渲染
 * - 支持多层瓦片（背景、碰撞、前景等）
 * - 基于块的加载和渲染优化
 * - 与现有2D渲染系统集成
 *
 * 继承关系:
 * Node -> Node2D -> TileMap2D
 */

import Node2D from '../Node2D'
import TileSet from '../../resources/TileSet'
import * as THREE from 'three'
import type { Vector2, Rect2 } from '../../../types/core'

// ============================================================================
// TileMap2D相关枚举和接口
// ============================================================================

/**
 * 瓦片层类型枚举
 */
export enum TileLayerType {
  /** 背景层 */
  BACKGROUND = 0,
  /** 主要层 */
  MAIN = 1,
  /** 前景层 */
  FOREGROUND = 2,
  /** 碰撞层 */
  COLLISION = 3,
  /** 自定义层 */
  CUSTOM = 4
}

/**
 * 瓦片数据接口
 */
export interface TileData {
  /** 瓦片ID */
  tileId: number
  /** 翻转标志 */
  flipH: boolean
  flipV: boolean
  /** 旋转角度 */
  rotation: number
  /** 调制颜色 */
  modulate: { r: number, g: number, b: number, a: number }
}

/**
 * 瓦片层接口
 */
export interface TileLayer {
  /** 层名称 */
  name: string
  /** 层类型 */
  type: TileLayerType
  /** 是否可见 */
  visible: boolean
  /** 层透明度 */
  opacity: number
  /** Z索引 */
  zIndex: number
  /** 瓦片数据 */
  tiles: Map<string, TileData>
  /** Three.js组对象 */
  group: THREE.Group
}

/**
 * 瓦片块接口
 */
export interface TileChunk {
  /** 块坐标 */
  chunkX: number
  chunkY: number
  /** 块尺寸 */
  chunkSize: number
  /** 是否已加载 */
  loaded: boolean
  /** Three.js组对象 */
  group: THREE.Group
  /** 瓦片精灵 */
  sprites: THREE.Sprite[]
}

// ============================================================================
// TileMap2D 类实现
// ============================================================================

/**
 * TileMap2D 类 - 瓦片地图节点
 *
 * 主要功能:
 * 1. 继承Node2D的所有2D功能
 * 2. 高效的瓦片渲染和管理
 * 3. 支持多层瓦片系统
 * 4. 基于块的优化加载
 * 5. 坐标转换和瓦片操作
 */
export default class TileMap2D extends Node2D {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 瓦片集 */
  private _tileSet: TileSet | null = null

  /** 瓦片尺寸 */
  private _tileSize: Vector2 = { x: 32, y: 32 }

  /** 地图尺寸（以瓦片为单位） */
  private _mapSize: Vector2 = { x: 100, y: 100 }

  /** 瓦片层 */
  private _layers: Map<string, TileLayer> = new Map()

  /** 当前活动层 */
  private _activeLayer: string = 'main'

  /** 块尺寸 */
  private _chunkSize: number = 16

  /** 瓦片块缓存 */
  private _chunks: Map<string, TileChunk> = new Map()

  /** 可见区域 */
  private _visibleRect: Rect2 = { x: 0, y: 0, width: 800, height: 600 }

  /** 是否启用块优化 */
  private _chunkingEnabled: boolean = true

  /** 动画时间 */
  private _animationTime: number = 0

  /** 需要更新的块 */
  private _dirtyChunks: Set<string> = new Set()

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   */
  constructor(name: string = 'TileMap2D') {
    super(name)
    this._className = 'TileMap2D'

    // 初始化默认层
    this._createDefaultLayers()

    // 初始化信号
    this.initializeTileMapSignals()
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取瓦片集
   */
  get tileSet(): TileSet | null {
    return this._tileSet
  }

  /**
   * 设置瓦片集
   */
  set tileSet(value: TileSet | null) {
    this._tileSet = value
    if (value) {
      this._tileSize = value.tileSize
      this._markAllChunksDirty()
    }
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
    this._markAllChunksDirty()
  }

  /**
   * 获取地图尺寸
   */
  get mapSize(): Vector2 {
    return { ...this._mapSize }
  }

  /**
   * 设置地图尺寸
   */
  set mapSize(value: Vector2) {
    this._mapSize = { ...value }
    this._markAllChunksDirty()
  }

  /**
   * 获取块尺寸
   */
  get chunkSize(): number {
    return this._chunkSize
  }

  /**
   * 设置块尺寸
   */
  set chunkSize(value: number) {
    this._chunkSize = value
    this._clearAllChunks()
    this._markAllChunksDirty()
  }

  /**
   * 获取当前活动层
   */
  get activeLayer(): string {
    return this._activeLayer
  }

  /**
   * 设置当前活动层
   */
  set activeLayer(value: string) {
    if (this._layers.has(value)) {
      this._activeLayer = value
    }
  }

  // ========================================================================
  // 层管理方法
  // ========================================================================

  /**
   * 创建瓦片层
   * @param name 层名称
   * @param type 层类型
   * @param zIndex Z索引
   */
  createLayer(name: string, type: TileLayerType = TileLayerType.MAIN, zIndex: number = 0): void {
    if (this._layers.has(name)) {
      console.warn(`Layer ${name} already exists`)
      return
    }

    const group = new THREE.Group()
    group.name = `TileLayer_${name}`
    group.position.z = zIndex
    this.object3D.add(group)

    const layer: TileLayer = {
      name,
      type,
      visible: true,
      opacity: 1.0,
      zIndex,
      tiles: new Map(),
      group
    }

    this._layers.set(name, layer)
  }

  /**
   * 删除瓦片层
   * @param name 层名称
   */
  removeLayer(name: string): void {
    const layer = this._layers.get(name)
    if (!layer) return

    this.object3D.remove(layer.group)
    layer.tiles.clear()
    this._layers.delete(name)

    if (this._activeLayer === name && this._layers.size > 0) {
      this._activeLayer = this._layers.keys().next().value
    }
  }

  /**
   * 获取层
   * @param name 层名称
   */
  getLayer(name: string): TileLayer | null {
    return this._layers.get(name) || null
  }

  /**
   * 获取所有层名称
   */
  getLayerNames(): string[] {
    return Array.from(this._layers.keys())
  }

  /**
   * 设置层可见性
   * @param name 层名称
   * @param visible 是否可见
   */
  setLayerVisible(name: string, visible: boolean): void {
    const layer = this._layers.get(name)
    if (layer) {
      layer.visible = visible
      layer.group.visible = visible
    }
  }

  /**
   * 设置层透明度
   * @param name 层名称
   * @param opacity 透明度
   */
  setLayerOpacity(name: string, opacity: number): void {
    const layer = this._layers.get(name)
    if (layer) {
      layer.opacity = Math.max(0, Math.min(1, opacity))
      // 更新层中所有精灵的透明度
      this._updateLayerOpacity(layer)
    }
  }

  // ========================================================================
  // 瓦片操作方法
  // ========================================================================

  /**
   * 设置瓦片
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param tileId 瓦片ID
   * @param layerName 层名称
   */
  setTile(x: number, y: number, tileId: number, layerName?: string): void {
    const layer = this._getActiveLayer(layerName)
    if (!layer) return

    const key = `${x},${y}`

    if (tileId === -1 || tileId === 0) {
      // 清除瓦片
      layer.tiles.delete(key)
    } else {
      // 设置瓦片
      const tileData: TileData = {
        tileId,
        flipH: false,
        flipV: false,
        rotation: 0,
        modulate: { r: 1, g: 1, b: 1, a: 1 }
      }
      layer.tiles.set(key, tileData)
    }

    // 标记相关块为脏
    this._markChunkDirty(x, y)
  }

  /**
   * 获取瓦片
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param layerName 层名称
   * @returns 瓦片ID
   */
  getTile(x: number, y: number, layerName?: string): number {
    const layer = this._getActiveLayer(layerName)
    if (!layer) return -1

    const key = `${x},${y}`
    const tileData = layer.tiles.get(key)
    return tileData ? tileData.tileId : -1
  }

  /**
   * 清除瓦片
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param layerName 层名称
   */
  clearTile(x: number, y: number, layerName?: string): void {
    this.setTile(x, y, -1, layerName)
  }

  /**
   * 填充矩形区域
   * @param rect 矩形区域
   * @param tileId 瓦片ID
   * @param layerName 层名称
   */
  fillRect(rect: Rect2, tileId: number, layerName?: string): void {
    for (let y = rect.y; y < rect.y + rect.height; y++) {
      for (let x = rect.x; x < rect.x + rect.width; x++) {
        this.setTile(x, y, tileId, layerName)
      }
    }
  }

  /**
   * 清除矩形区域
   * @param rect 矩形区域
   * @param layerName 层名称
   */
  clearRect(rect: Rect2, layerName?: string): void {
    this.fillRect(rect, -1, layerName)
  }

  // ========================================================================
  // 坐标转换方法
  // ========================================================================

  /**
   * 世界坐标转瓦片坐标
   * @param worldPos 世界坐标
   * @returns 瓦片坐标
   */
  worldToTile(worldPos: Vector2): Vector2 {
    return {
      x: Math.floor(worldPos.x / this._tileSize.x),
      y: Math.floor(worldPos.y / this._tileSize.y)
    }
  }

  /**
   * 瓦片坐标转世界坐标
   * @param tilePos 瓦片坐标
   * @returns 世界坐标
   */
  tileToWorld(tilePos: Vector2): Vector2 {
    return {
      x: tilePos.x * this._tileSize.x,
      y: tilePos.y * this._tileSize.y
    }
  }

  /**
   * 获取瓦片中心世界坐标
   * @param tilePos 瓦片坐标
   * @returns 世界坐标
   */
  getTileCenterWorld(tilePos: Vector2): Vector2 {
    return {
      x: tilePos.x * this._tileSize.x + this._tileSize.x / 2,
      y: tilePos.y * this._tileSize.y + this._tileSize.y / 2
    }
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 创建默认层
   */
  private _createDefaultLayers(): void {
    this.createLayer('background', TileLayerType.BACKGROUND, -1)
    this.createLayer('main', TileLayerType.MAIN, 0)
    this.createLayer('foreground', TileLayerType.FOREGROUND, 1)
  }

  /**
   * 初始化瓦片地图信号
   */
  private initializeTileMapSignals(): void {
    this.addSignal('tile_changed')
    this.addSignal('layer_added')
    this.addSignal('layer_removed')
    this.addSignal('chunk_loaded')
    this.addSignal('chunk_unloaded')
  }

  /**
   * 获取活动层
   * @param layerName 层名称
   * @returns 瓦片层
   */
  private _getActiveLayer(layerName?: string): TileLayer | null {
    const name = layerName || this._activeLayer
    return this._layers.get(name) || null
  }

  /**
   * 标记块为脏
   * @param tileX 瓦片X坐标
   * @param tileY 瓦片Y坐标
   */
  private _markChunkDirty(tileX: number, tileY: number): void {
    const chunkX = Math.floor(tileX / this._chunkSize)
    const chunkY = Math.floor(tileY / this._chunkSize)
    const chunkKey = `${chunkX},${chunkY}`
    this._dirtyChunks.add(chunkKey)
  }

  /**
   * 标记所有块为脏
   */
  private _markAllChunksDirty(): void {
    this._dirtyChunks.clear()
    for (const chunkKey of this._chunks.keys()) {
      this._dirtyChunks.add(chunkKey)
    }
  }

  /**
   * 清除所有块
   */
  private _clearAllChunks(): void {
    for (const chunk of this._chunks.values()) {
      for (const layer of this._layers.values()) {
        layer.group.remove(chunk.group)
      }
      chunk.sprites.forEach(sprite => sprite.material.dispose())
    }
    this._chunks.clear()
  }

  /**
   * 更新层透明度
   * @param layer 瓦片层
   */
  private _updateLayerOpacity(layer: TileLayer): void {
    layer.group.traverse((child) => {
      if (child instanceof THREE.Sprite && child.material instanceof THREE.SpriteMaterial) {
        child.material.opacity = layer.opacity
        child.material.needsUpdate = true
      }
    })
  }

  // ========================================================================
  // 块管理方法
  // ========================================================================

  /**
   * 获取或创建块
   * @param chunkX 块X坐标
   * @param chunkY 块Y坐标
   * @returns 瓦片块
   */
  private _getOrCreateChunk(chunkX: number, chunkY: number): TileChunk {
    const chunkKey = `${chunkX},${chunkY}`
    let chunk = this._chunks.get(chunkKey)

    if (!chunk) {
      const group = new THREE.Group()
      group.name = `Chunk_${chunkX}_${chunkY}`

      chunk = {
        chunkX,
        chunkY,
        chunkSize: this._chunkSize,
        loaded: false,
        group,
        sprites: []
      }

      this._chunks.set(chunkKey, chunk)

      // 将块组添加到所有层
      for (const layer of this._layers.values()) {
        layer.group.add(group)
      }
    }

    return chunk
  }

  /**
   * 更新块渲染
   * @param chunk 瓦片块
   */
  private _updateChunk(chunk: TileChunk): void {
    if (!this._tileSet) return

    // 清除现有精灵
    chunk.sprites.forEach(sprite => {
      chunk.group.remove(sprite)
      if (sprite.material instanceof THREE.SpriteMaterial) {
        sprite.material.dispose()
      }
    })
    chunk.sprites = []

    // 为每个层渲染瓦片
    for (const layer of this._layers.values()) {
      if (!layer.visible) continue

      this._renderChunkLayer(chunk, layer)
    }

    chunk.loaded = true
  }

  /**
   * 渲染块的特定层
   * @param chunk 瓦片块
   * @param layer 瓦片层
   */
  private _renderChunkLayer(chunk: TileChunk, layer: TileLayer): void {
    if (!this._tileSet) return

    const startX = chunk.chunkX * chunk.chunkSize
    const startY = chunk.chunkY * chunk.chunkSize
    const endX = Math.min(startX + chunk.chunkSize, this._mapSize.x)
    const endY = Math.min(startY + chunk.chunkSize, this._mapSize.y)

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const key = `${x},${y}`
        const tileData = layer.tiles.get(key)

        if (tileData && tileData.tileId >= 0) {
          this._createTileSprite(chunk, layer, x, y, tileData)
        }
      }
    }
  }

  /**
   * 创建瓦片精灵
   * @param chunk 瓦片块
   * @param layer 瓦片层
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param tileData 瓦片数据
   */
  private _createTileSprite(chunk: TileChunk, layer: TileLayer, x: number, y: number, tileData: TileData): void {
    if (!this._tileSet) return

    // 获取动画瓦片的当前帧
    const currentTileId = this._tileSet.getAnimatedTileFrame(tileData.tileId, this._animationTime)
    const tileDef = this._tileSet.getTile(currentTileId)

    if (!tileDef || !tileDef.visible) return

    // 创建精灵材质
    const material = new THREE.SpriteMaterial({
      map: this._tileSet.texture,
      transparent: true,
      alphaTest: 0.01,
      opacity: layer.opacity * tileData.modulate.a
    })

    // 设置纹理UV
    if (this._tileSet.texture && tileDef.textureRegion) {
      const textureWidth = this._tileSet.texture.image.width
      const textureHeight = this._tileSet.texture.image.height

      const u1 = tileDef.textureRegion.x / textureWidth
      const v1 = 1 - (tileDef.textureRegion.y + tileDef.textureRegion.height) / textureHeight
      const u2 = (tileDef.textureRegion.x + tileDef.textureRegion.width) / textureWidth
      const v2 = 1 - tileDef.textureRegion.y / textureHeight

      // 创建裁剪纹理
      const clonedTexture = this._tileSet.texture.clone()
      clonedTexture.repeat.set((u2 - u1), (v2 - v1))
      clonedTexture.offset.set(u1, v1)
      clonedTexture.needsUpdate = true

      material.map = clonedTexture
    }

    // 创建精灵
    const sprite = new THREE.Sprite(material)
    sprite.name = `Tile_${x}_${y}_${tileData.tileId}`

    // 设置位置
    const worldPos = this.tileToWorld({ x, y })
    sprite.position.set(
      worldPos.x + this._tileSize.x / 2,
      worldPos.y + this._tileSize.y / 2,
      layer.zIndex
    )

    // 设置缩放
    sprite.scale.set(this._tileSize.x, this._tileSize.y, 1)

    // 应用翻转和旋转
    if (tileData.flipH) sprite.scale.x *= -1
    if (tileData.flipV) sprite.scale.y *= -1
    if (tileData.rotation !== 0) {
      sprite.rotation = tileData.rotation
    }

    // 应用调制颜色
    sprite.material.color.setRGB(
      tileData.modulate.r * tileDef.modulate.r,
      tileData.modulate.g * tileDef.modulate.g,
      tileData.modulate.b * tileDef.modulate.b
    )

    // 添加到块
    chunk.group.add(sprite)
    chunk.sprites.push(sprite)
  }

  // ========================================================================
  // 渲染优化方法
  // ========================================================================

  /**
   * 更新可见区域
   * @param rect 可见矩形
   */
  updateVisibleRect(rect: Rect2): void {
    this._visibleRect = { ...rect }

    if (this._chunkingEnabled) {
      this._updateVisibleChunks()
    }
  }

  /**
   * 更新可见块
   */
  private _updateVisibleChunks(): void {
    if (!this._chunkingEnabled) return

    // 计算可见块范围
    const tileRect = {
      x: Math.floor(this._visibleRect.x / this._tileSize.x),
      y: Math.floor(this._visibleRect.y / this._tileSize.y),
      width: Math.ceil(this._visibleRect.width / this._tileSize.x),
      height: Math.ceil(this._visibleRect.height / this._tileSize.y)
    }

    const chunkStartX = Math.floor(tileRect.x / this._chunkSize)
    const chunkStartY = Math.floor(tileRect.y / this._chunkSize)
    const chunkEndX = Math.ceil((tileRect.x + tileRect.width) / this._chunkSize)
    const chunkEndY = Math.ceil((tileRect.y + tileRect.height) / this._chunkSize)

    // 加载可见块
    for (let chunkY = chunkStartY; chunkY <= chunkEndY; chunkY++) {
      for (let chunkX = chunkStartX; chunkX <= chunkEndX; chunkX++) {
        const chunk = this._getOrCreateChunk(chunkX, chunkY)

        if (!chunk.loaded || this._dirtyChunks.has(`${chunkX},${chunkY}`)) {
          this._updateChunk(chunk)
          this._dirtyChunks.delete(`${chunkX},${chunkY}`)
        }
      }
    }

    // 卸载不可见的块（可选优化）
    this._unloadInvisibleChunks(chunkStartX, chunkStartY, chunkEndX, chunkEndY)
  }

  /**
   * 卸载不可见的块
   */
  private _unloadInvisibleChunks(startX: number, startY: number, endX: number, endY: number): void {
    const chunksToRemove: string[] = []

    for (const [chunkKey, chunk] of this._chunks) {
      if (chunk.chunkX < startX - 1 || chunk.chunkX > endX + 1 ||
          chunk.chunkY < startY - 1 || chunk.chunkY > endY + 1) {

        // 移除精灵
        chunk.sprites.forEach(sprite => {
          chunk.group.remove(sprite)
          if (sprite.material instanceof THREE.SpriteMaterial) {
            sprite.material.dispose()
          }
        })

        // 移除块组
        for (const layer of this._layers.values()) {
          layer.group.remove(chunk.group)
        }

        chunksToRemove.push(chunkKey)
        this.emit('chunk_unloaded', { chunkX: chunk.chunkX, chunkY: chunk.chunkY })
      }
    }

    // 清理块缓存
    chunksToRemove.forEach(key => this._chunks.delete(key))
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 处理方法（每帧调用）
   * @param delta 时间增量
   */
  override _process(delta: number): void {
    super._process(delta)

    // 更新动画时间
    this._animationTime += delta

    // 更新脏块
    if (this._dirtyChunks.size > 0) {
      this._updateDirtyChunks()
    }
  }

  /**
   * 更新脏块
   */
  private _updateDirtyChunks(): void {
    const chunksToUpdate = Array.from(this._dirtyChunks)

    for (const chunkKey of chunksToUpdate) {
      const [chunkX, chunkY] = chunkKey.split(',').map(Number)
      const chunk = this._chunks.get(chunkKey)

      if (chunk) {
        this._updateChunk(chunk)
      }
    }

    this._dirtyChunks.clear()
  }

  // ========================================================================
  // 脚本接口方法
  // ========================================================================

  /**
   * 获取瓦片（脚本接口）
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param layerName 层名称
   * @returns 瓦片ID
   */
  getTileScript(x: number, y: number, layerName?: string): number {
    return this.getTile(x, y, layerName)
  }

  /**
   * 设置瓦片（脚本接口）
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param tileId 瓦片ID
   * @param layerName 层名称
   */
  setTileScript(x: number, y: number, tileId: number, layerName?: string): void {
    this.setTile(x, y, tileId, layerName)
  }

  /**
   * 清除瓦片（脚本接口）
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   * @param layerName 层名称
   */
  clearTileScript(x: number, y: number, layerName?: string): void {
    this.clearTile(x, y, layerName)
  }

  /**
   * 获取地图尺寸（脚本接口）
   * @returns 地图尺寸
   */
  getMapSizeScript(): Vector2 {
    return this.mapSize
  }

  /**
   * 获取瓦片尺寸（脚本接口）
   * @returns 瓦片尺寸
   */
  getTileSizeScript(): Vector2 {
    return this.tileSize
  }

  /**
   * 世界坐标转瓦片坐标（脚本接口）
   * @param worldX 世界X坐标
   * @param worldY 世界Y坐标
   * @returns 瓦片坐标
   */
  worldToTileScript(worldX: number, worldY: number): Vector2 {
    return this.worldToTile({ x: worldX, y: worldY })
  }

  /**
   * 瓦片坐标转世界坐标（脚本接口）
   * @param tileX 瓦片X坐标
   * @param tileY 瓦片Y坐标
   * @returns 世界坐标
   */
  tileToWorldScript(tileX: number, tileY: number): Vector2 {
    return this.tileToWorld({ x: tileX, y: tileY })
  }

  /**
   * 销毁瓦片地图
   */
  override destroy(): void {
    this._clearAllChunks()
    this._layers.clear()
    this._tileSet = null
    super.destroy()
  }
}
