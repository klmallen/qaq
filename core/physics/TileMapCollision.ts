/**
 * QAQ游戏引擎 - TileMapCollision 瓦片地图碰撞检测
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 提供瓦片地图的碰撞检测功能
 * - 支持点、矩形、圆形与瓦片的碰撞检测
 * - 优化的空间查询算法
 * - 与2D节点系统集成
 */

import TileMap2D from '../nodes/2d/TileMap2D'
import TileSet, { CollisionShapeType } from '../resources/TileSet'
import type { Vector2, Rect2 } from '../../types/core'

// ============================================================================
// 碰撞检测相关接口
// ============================================================================

/**
 * 碰撞结果接口
 */
export interface CollisionResult {
  /** 是否发生碰撞 */
  collided: boolean
  /** 碰撞点 */
  point: Vector2
  /** 碰撞法向量 */
  normal: Vector2
  /** 碰撞深度 */
  depth: number
  /** 碰撞的瓦片坐标 */
  tilePos: Vector2
  /** 碰撞的瓦片ID */
  tileId: number
}

/**
 * 射线投射结果接口
 */
export interface RaycastResult {
  /** 是否命中 */
  hit: boolean
  /** 命中点 */
  point: Vector2
  /** 命中法向量 */
  normal: Vector2
  /** 距离 */
  distance: number
  /** 命中的瓦片坐标 */
  tilePos: Vector2
  /** 命中的瓦片ID */
  tileId: number
}

// ============================================================================
// TileMapCollision 类实现
// ============================================================================

/**
 * TileMapCollision 类 - 瓦片地图碰撞检测
 *
 * 主要功能:
 * 1. 点与瓦片碰撞检测
 * 2. 矩形与瓦片碰撞检测
 * 3. 圆形与瓦片碰撞检测
 * 4. 射线投射
 * 5. 空间查询优化
 */
export default class TileMapCollision {
  // ========================================================================
  // 私有属性
  // ========================================================================

  /** 瓦片地图 */
  private _tileMap: TileMap2D

  /** 瓦片集 */
  private _tileSet: TileSet | null = null

  /** 碰撞层名称 */
  private _collisionLayer: string = 'collision'

  // ========================================================================
  // 构造函数
  // ========================================================================

  /**
   * 构造函数
   * @param tileMap 瓦片地图
   * @param collisionLayer 碰撞层名称
   */
  constructor(tileMap: TileMap2D, collisionLayer: string = 'collision') {
    this._tileMap = tileMap
    this._collisionLayer = collisionLayer
    this._tileSet = tileMap.tileSet
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取碰撞层名称
   */
  get collisionLayer(): string {
    return this._collisionLayer
  }

  /**
   * 设置碰撞层名称
   */
  set collisionLayer(value: string) {
    this._collisionLayer = value
  }

  // ========================================================================
  // 点碰撞检测
  // ========================================================================

  /**
   * 检测点与瓦片的碰撞
   * @param point 世界坐标点
   * @returns 碰撞结果
   */
  checkPointCollision(point: Vector2): CollisionResult {
    const tilePos = this._tileMap.worldToTile(point)
    const tileId = this._tileMap.getTile(tilePos.x, tilePos.y, this._collisionLayer)

    const result: CollisionResult = {
      collided: false,
      point: { ...point },
      normal: { x: 0, y: 0 },
      depth: 0,
      tilePos,
      tileId
    }

    if (tileId <= 0 || !this._tileSet) {
      return result
    }

    const tileDef = this._tileSet.getTile(tileId)
    if (!tileDef || tileDef.collisionShape.type === CollisionShapeType.NONE) {
      return result
    }

    // 转换为瓦片本地坐标
    const tileWorldPos = this._tileMap.tileToWorld(tilePos)
    const localPoint = {
      x: point.x - tileWorldPos.x,
      y: point.y - tileWorldPos.y
    }

    // 检测碰撞
    result.collided = this._checkPointInTile(localPoint, tileDef.collisionShape)

    if (result.collided) {
      // 计算法向量和深度（简化实现）
      result.normal = this._calculateNormal(localPoint, tileDef.collisionShape)
      result.depth = this._calculateDepth(localPoint, tileDef.collisionShape)
    }

    return result
  }

  // ========================================================================
  // 矩形碰撞检测
  // ========================================================================

  /**
   * 检测矩形与瓦片的碰撞
   * @param rect 世界坐标矩形
   * @returns 碰撞结果数组
   */
  checkRectCollision(rect: Rect2): CollisionResult[] {
    const results: CollisionResult[] = []

    // 计算矩形覆盖的瓦片范围
    const startTile = this._tileMap.worldToTile({ x: rect.x, y: rect.y })
    const endTile = this._tileMap.worldToTile({ 
      x: rect.x + rect.width, 
      y: rect.y + rect.height 
    })

    // 遍历范围内的瓦片
    for (let tileY = startTile.y; tileY <= endTile.y; tileY++) {
      for (let tileX = startTile.x; tileX <= endTile.x; tileX++) {
        const tileId = this._tileMap.getTile(tileX, tileY, this._collisionLayer)
        
        if (tileId <= 0 || !this._tileSet) continue

        const tileDef = this._tileSet.getTile(tileId)
        if (!tileDef || tileDef.collisionShape.type === CollisionShapeType.NONE) continue

        // 检测矩形与瓦片的碰撞
        const tileWorldPos = this._tileMap.tileToWorld({ x: tileX, y: tileY })
        const tileSize = this._tileMap.tileSize

        const tileRect: Rect2 = {
          x: tileWorldPos.x,
          y: tileWorldPos.y,
          width: tileSize.x,
          height: tileSize.y
        }

        if (this._rectIntersects(rect, tileRect)) {
          const result: CollisionResult = {
            collided: true,
            point: {
              x: Math.max(rect.x, tileRect.x) + Math.min(rect.width, tileRect.width) / 2,
              y: Math.max(rect.y, tileRect.y) + Math.min(rect.height, tileRect.height) / 2
            },
            normal: this._calculateRectNormal(rect, tileRect),
            depth: this._calculateRectDepth(rect, tileRect),
            tilePos: { x: tileX, y: tileY },
            tileId
          }

          results.push(result)
        }
      }
    }

    return results
  }

  // ========================================================================
  // 圆形碰撞检测
  // ========================================================================

  /**
   * 检测圆形与瓦片的碰撞
   * @param center 圆心世界坐标
   * @param radius 半径
   * @returns 碰撞结果数组
   */
  checkCircleCollision(center: Vector2, radius: number): CollisionResult[] {
    const results: CollisionResult[] = []

    // 计算圆形覆盖的瓦片范围
    const startTile = this._tileMap.worldToTile({ 
      x: center.x - radius, 
      y: center.y - radius 
    })
    const endTile = this._tileMap.worldToTile({ 
      x: center.x + radius, 
      y: center.y + radius 
    })

    // 遍历范围内的瓦片
    for (let tileY = startTile.y; tileY <= endTile.y; tileY++) {
      for (let tileX = startTile.x; tileX <= endTile.x; tileX++) {
        const tileId = this._tileMap.getTile(tileX, tileY, this._collisionLayer)
        
        if (tileId <= 0 || !this._tileSet) continue

        const tileDef = this._tileSet.getTile(tileId)
        if (!tileDef || tileDef.collisionShape.type === CollisionShapeType.NONE) continue

        // 检测圆形与瓦片的碰撞
        const tileWorldPos = this._tileMap.tileToWorld({ x: tileX, y: tileY })
        const tileSize = this._tileMap.tileSize

        const tileCenter = {
          x: tileWorldPos.x + tileSize.x / 2,
          y: tileWorldPos.y + tileSize.y / 2
        }

        const distance = Math.sqrt(
          Math.pow(center.x - tileCenter.x, 2) + 
          Math.pow(center.y - tileCenter.y, 2)
        )

        const tileRadius = Math.sqrt(
          Math.pow(tileSize.x / 2, 2) + 
          Math.pow(tileSize.y / 2, 2)
        )

        if (distance < radius + tileRadius) {
          const result: CollisionResult = {
            collided: true,
            point: {
              x: center.x + (tileCenter.x - center.x) * radius / distance,
              y: center.y + (tileCenter.y - center.y) * radius / distance
            },
            normal: {
              x: (center.x - tileCenter.x) / distance,
              y: (center.y - tileCenter.y) / distance
            },
            depth: radius + tileRadius - distance,
            tilePos: { x: tileX, y: tileY },
            tileId
          }

          results.push(result)
        }
      }
    }

    return results
  }

  // ========================================================================
  // 射线投射
  // ========================================================================

  /**
   * 射线投射
   * @param origin 射线起点
   * @param direction 射线方向（单位向量）
   * @param maxDistance 最大距离
   * @returns 射线投射结果
   */
  raycast(origin: Vector2, direction: Vector2, maxDistance: number = 1000): RaycastResult {
    const result: RaycastResult = {
      hit: false,
      point: { x: 0, y: 0 },
      normal: { x: 0, y: 0 },
      distance: 0,
      tilePos: { x: 0, y: 0 },
      tileId: -1
    }

    const stepSize = Math.min(this._tileMap.tileSize.x, this._tileMap.tileSize.y) / 4
    const steps = Math.floor(maxDistance / stepSize)

    for (let i = 0; i <= steps; i++) {
      const currentPos = {
        x: origin.x + direction.x * stepSize * i,
        y: origin.y + direction.y * stepSize * i
      }

      const collision = this.checkPointCollision(currentPos)
      if (collision.collided) {
        result.hit = true
        result.point = currentPos
        result.normal = collision.normal
        result.distance = stepSize * i
        result.tilePos = collision.tilePos
        result.tileId = collision.tileId
        break
      }
    }

    return result
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 检测点是否在瓦片内
   */
  private _checkPointInTile(localPoint: Vector2, collisionShape: any): boolean {
    switch (collisionShape.type) {
      case CollisionShapeType.RECTANGLE:
        const size = collisionShape.size || this._tileMap.tileSize
        return localPoint.x >= 0 && localPoint.x < size.x &&
               localPoint.y >= 0 && localPoint.y < size.y

      case CollisionShapeType.CIRCLE:
        const radius = collisionShape.radius || Math.min(this._tileMap.tileSize.x, this._tileMap.tileSize.y) / 2
        const center = {
          x: this._tileMap.tileSize.x / 2,
          y: this._tileMap.tileSize.y / 2
        }
        const distance = Math.sqrt(
          Math.pow(localPoint.x - center.x, 2) + 
          Math.pow(localPoint.y - center.y, 2)
        )
        return distance <= radius

      default:
        return false
    }
  }

  /**
   * 计算法向量
   */
  private _calculateNormal(localPoint: Vector2, collisionShape: any): Vector2 {
    // 简化实现，返回指向外部的法向量
    const center = {
      x: this._tileMap.tileSize.x / 2,
      y: this._tileMap.tileSize.y / 2
    }

    const dx = localPoint.x - center.x
    const dy = localPoint.y - center.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) return { x: 0, y: -1 }

    return { x: dx / length, y: dy / length }
  }

  /**
   * 计算碰撞深度
   */
  private _calculateDepth(localPoint: Vector2, collisionShape: any): number {
    // 简化实现
    return 1.0
  }

  /**
   * 检测两个矩形是否相交
   */
  private _rectIntersects(rect1: Rect2, rect2: Rect2): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }

  /**
   * 计算矩形碰撞法向量
   */
  private _calculateRectNormal(rect1: Rect2, rect2: Rect2): Vector2 {
    const center1 = { x: rect1.x + rect1.width / 2, y: rect1.y + rect1.height / 2 }
    const center2 = { x: rect2.x + rect2.width / 2, y: rect2.y + rect2.height / 2 }

    const dx = center1.x - center2.x
    const dy = center1.y - center2.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) return { x: 0, y: -1 }

    return { x: dx / length, y: dy / length }
  }

  /**
   * 计算矩形碰撞深度
   */
  private _calculateRectDepth(rect1: Rect2, rect2: Rect2): number {
    const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - 
                     Math.max(rect1.x, rect2.x)
    const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - 
                     Math.max(rect1.y, rect2.y)

    return Math.min(overlapX, overlapY)
  }
}
