/**
 * QAQ游戏引擎 - TileMapEditor 瓦片地图编辑器
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 提供瓦片地图的可视化编辑功能
 * - 支持瓦片绘制、擦除、填充等操作
 * - 集成鼠标交互和键盘快捷键
 * - 支持多层编辑和瓦片选择
 * - 提供简单的UI界面
 */

import TileMap2D from '../nodes/2d/TileMap2D'
import TileSet from '../resources/TileSet'
import * as THREE from 'three'
import type { Vector2, Rect2 } from '../../types/core'

// ============================================================================
// 编辑器相关枚举和接口
// ============================================================================

/**
 * 编辑工具枚举
 */
export enum EditTool {
  /** 画笔工具 */
  BRUSH = 0,
  /** 橡皮擦工具 */
  ERASER = 1,
  /** 填充工具 */
  FILL = 2,
  /** 矩形工具 */
  RECTANGLE = 3,
  /** 选择工具 */
  SELECT = 4
}

/**
 * 编辑器配置接口
 */
export interface EditorConfig {
  /** 画布容器 */
  container: HTMLElement
  /** 瓦片地图 */
  tileMap: TileMap2D
  /** 瓦片集 */
  tileSet: TileSet
  /** 是否启用网格显示 */
  showGrid: boolean
  /** 网格颜色 */
  gridColor: string
  /** 网格透明度 */
  gridOpacity: number
}

// ============================================================================
// TileMapEditor 类实现
// ============================================================================

/**
 * TileMapEditor 类 - 瓦片地图编辑器
 *
 * 主要功能:
 * 1. 提供瓦片绘制和编辑功能
 * 2. 处理鼠标和键盘交互
 * 3. 管理编辑工具和状态
 * 4. 显示网格和辅助信息
 * 5. 支持撤销/重做操作
 */
export default class TileMapEditor {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 瓦片地图 */
  private _tileMap: TileMap2D
  
  /** 瓦片集 */
  private _tileSet: TileSet
  
  /** 画布容器 */
  private _container: HTMLElement
  
  /** 当前编辑工具 */
  private _currentTool: EditTool = EditTool.BRUSH
  
  /** 当前选中的瓦片ID */
  private _selectedTileId: number = 0
  
  /** 当前编辑层 */
  private _currentLayer: string = 'main'
  
  /** 是否显示网格 */
  private _showGrid: boolean = true
  
  /** 网格材质 */
  private _gridMaterial: THREE.LineBasicMaterial | null = null
  
  /** 网格对象 */
  private _gridLines: THREE.LineSegments | null = null
  
  /** 鼠标位置 */
  private _mousePos: Vector2 = { x: 0, y: 0 }
  
  /** 鼠标瓦片坐标 */
  private _mouseTilePos: Vector2 = { x: 0, y: 0 }
  
  /** 是否正在绘制 */
  private _isDrawing: boolean = false
  
  /** 绘制起始位置 */
  private _drawStartPos: Vector2 = { x: 0, y: 0 }
  
  /** 操作历史 */
  private _history: Array<{ action: string, data: any }> = []
  
  /** 历史索引 */
  private _historyIndex: number = -1
  
  /** 最大历史记录数 */
  private _maxHistory: number = 50

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param config 编辑器配置
   */
  constructor(config: EditorConfig) {
    this._tileMap = config.tileMap
    this._tileSet = config.tileSet
    this._container = config.container
    this._showGrid = config.showGrid ?? true
    
    this._initializeGrid(config.gridColor || '#ffffff', config.gridOpacity || 0.3)
    this._setupEventListeners()
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取当前工具
   */
  get currentTool(): EditTool {
    return this._currentTool
  }

  /**
   * 设置当前工具
   */
  set currentTool(value: EditTool) {
    this._currentTool = value
  }

  /**
   * 获取选中的瓦片ID
   */
  get selectedTileId(): number {
    return this._selectedTileId
  }

  /**
   * 设置选中的瓦片ID
   */
  set selectedTileId(value: number) {
    this._selectedTileId = value
  }

  /**
   * 获取当前编辑层
   */
  get currentLayer(): string {
    return this._currentLayer
  }

  /**
   * 设置当前编辑层
   */
  set currentLayer(value: string) {
    this._currentLayer = value
  }

  /**
   * 获取是否显示网格
   */
  get showGrid(): boolean {
    return this._showGrid
  }

  /**
   * 设置是否显示网格
   */
  set showGrid(value: boolean) {
    this._showGrid = value
    if (this._gridLines) {
      this._gridLines.visible = value
    }
  }

  // ========================================================================
  // 编辑操作方法
  // ========================================================================

  /**
   * 在指定位置绘制瓦片
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   */
  drawTile(x: number, y: number): void {
    if (!this._isValidTilePosition(x, y)) return

    const oldTileId = this._tileMap.getTile(x, y, this._currentLayer)
    
    if (oldTileId !== this._selectedTileId) {
      this._addToHistory('draw', { x, y, oldTileId, newTileId: this._selectedTileId, layer: this._currentLayer })
      this._tileMap.setTile(x, y, this._selectedTileId, this._currentLayer)
    }
  }

  /**
   * 擦除指定位置的瓦片
   * @param x 瓦片X坐标
   * @param y 瓦片Y坐标
   */
  eraseTile(x: number, y: number): void {
    if (!this._isValidTilePosition(x, y)) return

    const oldTileId = this._tileMap.getTile(x, y, this._currentLayer)
    
    if (oldTileId !== -1) {
      this._addToHistory('erase', { x, y, oldTileId, layer: this._currentLayer })
      this._tileMap.clearTile(x, y, this._currentLayer)
    }
  }

  /**
   * 填充区域
   * @param x 起始X坐标
   * @param y 起始Y坐标
   */
  fillArea(x: number, y: number): void {
    if (!this._isValidTilePosition(x, y)) return

    const targetTileId = this._tileMap.getTile(x, y, this._currentLayer)
    if (targetTileId === this._selectedTileId) return

    const filledTiles: Array<{ x: number, y: number, oldTileId: number }> = []
    this._floodFill(x, y, targetTileId, filledTiles)

    if (filledTiles.length > 0) {
      this._addToHistory('fill', { tiles: filledTiles, newTileId: this._selectedTileId, layer: this._currentLayer })
    }
  }

  /**
   * 绘制矩形
   * @param startX 起始X坐标
   * @param startY 起始Y坐标
   * @param endX 结束X坐标
   * @param endY 结束Y坐标
   */
  drawRectangle(startX: number, startY: number, endX: number, endY: number): void {
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)

    const changedTiles: Array<{ x: number, y: number, oldTileId: number }> = []

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (this._isValidTilePosition(x, y)) {
          const oldTileId = this._tileMap.getTile(x, y, this._currentLayer)
          if (oldTileId !== this._selectedTileId) {
            changedTiles.push({ x, y, oldTileId })
            this._tileMap.setTile(x, y, this._selectedTileId, this._currentLayer)
          }
        }
      }
    }

    if (changedTiles.length > 0) {
      this._addToHistory('rectangle', { tiles: changedTiles, newTileId: this._selectedTileId, layer: this._currentLayer })
    }
  }

  // ========================================================================
  // 历史记录方法
  // ========================================================================

  /**
   * 撤销操作
   */
  undo(): void {
    if (this._historyIndex >= 0) {
      const action = this._history[this._historyIndex]
      this._executeUndo(action)
      this._historyIndex--
    }
  }

  /**
   * 重做操作
   */
  redo(): void {
    if (this._historyIndex < this._history.length - 1) {
      this._historyIndex++
      const action = this._history[this._historyIndex]
      this._executeRedo(action)
    }
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this._history = []
    this._historyIndex = -1
  }

  // ========================================================================
  // 私有方法
  // ========================================================================

  /**
   * 初始化网格
   * @param color 网格颜色
   * @param opacity 网格透明度
   */
  private _initializeGrid(color: string, opacity: number): void {
    this._gridMaterial = new THREE.LineBasicMaterial({
      color: color,
      opacity: opacity,
      transparent: true
    })

    this._updateGrid()
  }

  /**
   * 更新网格
   */
  private _updateGrid(): void {
    if (this._gridLines) {
      this._tileMap.object3D.remove(this._gridLines)
      this._gridLines.geometry.dispose()
    }

    const geometry = new THREE.BufferGeometry()
    const vertices: number[] = []

    const mapSize = this._tileMap.mapSize
    const tileSize = this._tileMap.tileSize

    // 垂直线
    for (let x = 0; x <= mapSize.x; x++) {
      const worldX = x * tileSize.x
      vertices.push(worldX, 0, 0.1)
      vertices.push(worldX, mapSize.y * tileSize.y, 0.1)
    }

    // 水平线
    for (let y = 0; y <= mapSize.y; y++) {
      const worldY = y * tileSize.y
      vertices.push(0, worldY, 0.1)
      vertices.push(mapSize.x * tileSize.x, worldY, 0.1)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    
    this._gridLines = new THREE.LineSegments(geometry, this._gridMaterial!)
    this._gridLines.name = 'TileMapGrid'
    this._gridLines.visible = this._showGrid
    
    this._tileMap.object3D.add(this._gridLines)
  }

  /**
   * 设置事件监听器
   */
  private _setupEventListeners(): void {
    this._container.addEventListener('mousedown', this._onMouseDown.bind(this))
    this._container.addEventListener('mousemove', this._onMouseMove.bind(this))
    this._container.addEventListener('mouseup', this._onMouseUp.bind(this))
    document.addEventListener('keydown', this._onKeyDown.bind(this))
  }

  /**
   * 鼠标按下事件
   */
  private _onMouseDown(event: MouseEvent): void {
    this._isDrawing = true
    this._updateMousePosition(event)
    this._drawStartPos = { ...this._mouseTilePos }

    switch (this._currentTool) {
      case EditTool.BRUSH:
        this.drawTile(this._mouseTilePos.x, this._mouseTilePos.y)
        break
      case EditTool.ERASER:
        this.eraseTile(this._mouseTilePos.x, this._mouseTilePos.y)
        break
      case EditTool.FILL:
        this.fillArea(this._mouseTilePos.x, this._mouseTilePos.y)
        break
    }
  }

  /**
   * 鼠标移动事件
   */
  private _onMouseMove(event: MouseEvent): void {
    this._updateMousePosition(event)

    if (this._isDrawing) {
      switch (this._currentTool) {
        case EditTool.BRUSH:
          this.drawTile(this._mouseTilePos.x, this._mouseTilePos.y)
          break
        case EditTool.ERASER:
          this.eraseTile(this._mouseTilePos.x, this._mouseTilePos.y)
          break
      }
    }
  }

  /**
   * 鼠标释放事件
   */
  private _onMouseUp(event: MouseEvent): void {
    if (this._isDrawing && this._currentTool === EditTool.RECTANGLE) {
      this.drawRectangle(
        this._drawStartPos.x, this._drawStartPos.y,
        this._mouseTilePos.x, this._mouseTilePos.y
      )
    }

    this._isDrawing = false
  }

  /**
   * 键盘按下事件
   */
  private _onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault()
          if (event.shiftKey) {
            this.redo()
          } else {
            this.undo()
          }
          break
        case 'y':
          event.preventDefault()
          this.redo()
          break
      }
    }

    // 工具快捷键
    switch (event.key) {
      case '1':
        this._currentTool = EditTool.BRUSH
        break
      case '2':
        this._currentTool = EditTool.ERASER
        break
      case '3':
        this._currentTool = EditTool.FILL
        break
      case '4':
        this._currentTool = EditTool.RECTANGLE
        break
    }
  }

  /**
   * 更新鼠标位置
   */
  private _updateMousePosition(event: MouseEvent): void {
    const rect = this._container.getBoundingClientRect()
    this._mousePos = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }

    // 转换为瓦片坐标（这里需要考虑相机变换）
    // 简化实现，假设没有相机变换
    const tileSize = this._tileMap.tileSize
    this._mouseTilePos = {
      x: Math.floor(this._mousePos.x / tileSize.x),
      y: Math.floor(this._mousePos.y / tileSize.y)
    }
  }

  /**
   * 检查瓦片位置是否有效
   */
  private _isValidTilePosition(x: number, y: number): boolean {
    const mapSize = this._tileMap.mapSize
    return x >= 0 && x < mapSize.x && y >= 0 && y < mapSize.y
  }

  /**
   * 洪水填充算法
   */
  private _floodFill(x: number, y: number, targetTileId: number, filledTiles: Array<{ x: number, y: number, oldTileId: number }>): void {
    if (!this._isValidTilePosition(x, y)) return
    
    const currentTileId = this._tileMap.getTile(x, y, this._currentLayer)
    if (currentTileId !== targetTileId) return

    // 检查是否已经填充过
    if (filledTiles.some(tile => tile.x === x && tile.y === y)) return

    filledTiles.push({ x, y, oldTileId: currentTileId })
    this._tileMap.setTile(x, y, this._selectedTileId, this._currentLayer)

    // 递归填充相邻瓦片
    this._floodFill(x + 1, y, targetTileId, filledTiles)
    this._floodFill(x - 1, y, targetTileId, filledTiles)
    this._floodFill(x, y + 1, targetTileId, filledTiles)
    this._floodFill(x, y - 1, targetTileId, filledTiles)
  }

  /**
   * 添加到历史记录
   */
  private _addToHistory(action: string, data: any): void {
    // 移除当前索引之后的历史记录
    this._history = this._history.slice(0, this._historyIndex + 1)
    
    // 添加新的历史记录
    this._history.push({ action, data })
    this._historyIndex++

    // 限制历史记录数量
    if (this._history.length > this._maxHistory) {
      this._history.shift()
      this._historyIndex--
    }
  }

  /**
   * 执行撤销操作
   */
  private _executeUndo(historyItem: { action: string, data: any }): void {
    const { action, data } = historyItem

    switch (action) {
      case 'draw':
      case 'erase':
        this._tileMap.setTile(data.x, data.y, data.oldTileId, data.layer)
        break
      case 'fill':
      case 'rectangle':
        for (const tile of data.tiles) {
          this._tileMap.setTile(tile.x, tile.y, tile.oldTileId, data.layer)
        }
        break
    }
  }

  /**
   * 执行重做操作
   */
  private _executeRedo(historyItem: { action: string, data: any }): void {
    const { action, data } = historyItem

    switch (action) {
      case 'draw':
      case 'erase':
        this._tileMap.setTile(data.x, data.y, data.newTileId, data.layer)
        break
      case 'fill':
      case 'rectangle':
        for (const tile of data.tiles) {
          this._tileMap.setTile(tile.x, tile.y, data.newTileId, data.layer)
        }
        break
    }
  }

  // ========================================================================
  // 公共方法
  // ========================================================================

  /**
   * 更新编辑器
   */
  update(): void {
    // 更新网格（如果地图尺寸改变）
    if (this._gridLines) {
      this._updateGrid()
    }
  }

  /**
   * 销毁编辑器
   */
  destroy(): void {
    if (this._gridLines) {
      this._tileMap.object3D.remove(this._gridLines)
      this._gridLines.geometry.dispose()
    }

    if (this._gridMaterial) {
      this._gridMaterial.dispose()
    }

    this._container.removeEventListener('mousedown', this._onMouseDown.bind(this))
    this._container.removeEventListener('mousemove', this._onMouseMove.bind(this))
    this._container.removeEventListener('mouseup', this._onMouseUp.bind(this))
    document.removeEventListener('keydown', this._onKeyDown.bind(this))
  }
}
