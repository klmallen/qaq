/**
 * QAQ游戏引擎边界系统
 * 提供灵活的边界检测和处理机制
 */

import type { Vector2 } from '../types/Vector'
import type Node2D from '../nodes/Node2D'

/**
 * 边界类型枚举
 */
export enum BoundaryType {
  NONE = 'NONE',           // 无边界限制
  CLAMP = 'CLAMP',         // 夹紧到边界
  BOUNCE = 'BOUNCE',       // 反弹
  WRAP = 'WRAP',           // 环绕
  DESTROY = 'DESTROY',     // 销毁节点
  CALLBACK = 'CALLBACK'    // 自定义回调
}

/**
 * 边界碰撞面
 */
export enum BoundarySide {
  LEFT = 'left',
  RIGHT = 'right', 
  TOP = 'top',
  BOTTOM = 'bottom'
}

/**
 * 边界配置接口
 */
export interface BoundaryConfig {
  enabled: boolean
  type: BoundaryType
  bounds: {
    x: number      // 边界左上角X坐标
    y: number      // 边界左上角Y坐标  
    width: number  // 边界宽度
    height: number // 边界高度
  }
  margin?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  onBoundaryHit?: (node: Node2D, side: BoundarySide, bounds: BoundaryConfig) => void
}

/**
 * 边界检测结果
 */
export interface BoundaryCheckResult {
  isOutOfBounds: boolean
  sides: BoundarySide[]
  correctedPosition?: Vector2
  shouldDestroy?: boolean
}

/**
 * 边界系统类
 */
export class BoundarySystem {
  private static _instance: BoundarySystem
  private _globalConfig: BoundaryConfig | null = null

  private constructor() {}

  /**
   * 获取边界系统单例
   */
  static getInstance(): BoundarySystem {
    if (!BoundarySystem._instance) {
      BoundarySystem._instance = new BoundarySystem()
    }
    return BoundarySystem._instance
  }

  /**
   * 设置全局边界配置
   */
  setGlobalBoundary(config: BoundaryConfig): void {
    this._globalConfig = config
  }

  /**
   * 获取全局边界配置
   */
  getGlobalBoundary(): BoundaryConfig | null {
    return this._globalConfig
  }

  /**
   * 检查节点是否超出边界
   */
  checkBoundary(node: Node2D, config?: BoundaryConfig): BoundaryCheckResult {
    const boundaryConfig = config || this._globalConfig
    
    if (!boundaryConfig || !boundaryConfig.enabled) {
      return { isOutOfBounds: false, sides: [] }
    }

    const pos = node.position
    const bounds = boundaryConfig.bounds
    const margin = boundaryConfig.margin || {}
    
    // 计算节点的实际边界（考虑节点大小）
    const nodeSize = this._getNodeSize(node)
    const halfWidth = nodeSize.x / 2
    const halfHeight = nodeSize.y / 2

    // 计算有效边界
    const leftBound = bounds.x + (margin.left || 0) + halfWidth
    const rightBound = bounds.x + bounds.width - (margin.right || 0) - halfWidth
    const topBound = bounds.y + (margin.top || 0) + halfHeight
    const bottomBound = bounds.y + bounds.height - (margin.bottom || 0) - halfHeight

    // 检查各边界
    const sides: BoundarySide[] = []
    let correctedPosition: Vector2 | undefined

    if (pos.x < leftBound) sides.push(BoundarySide.LEFT)
    if (pos.x > rightBound) sides.push(BoundarySide.RIGHT)
    if (pos.y < topBound) sides.push(BoundarySide.TOP)
    if (pos.y > bottomBound) sides.push(BoundarySide.BOTTOM)

    const isOutOfBounds = sides.length > 0

    if (isOutOfBounds) {
      correctedPosition = this._handleBoundaryCollision(
        node, 
        sides, 
        boundaryConfig,
        { leftBound, rightBound, topBound, bottomBound }
      )
    }

    return {
      isOutOfBounds,
      sides,
      correctedPosition,
      shouldDestroy: boundaryConfig.type === BoundaryType.DESTROY && isOutOfBounds
    }
  }

  /**
   * 应用边界检测结果
   */
  applyBoundaryResult(node: Node2D, result: BoundaryCheckResult): void {
    if (result.correctedPosition) {
      node.position = {
        x: result.correctedPosition.x,
        y: result.correctedPosition.y,
        z: node.position.z
      }
    }

    if (result.shouldDestroy) {
      // 标记节点为待销毁
      node.queueFree()
    }
  }

  /**
   * 处理边界碰撞
   */
  private _handleBoundaryCollision(
    node: Node2D, 
    sides: BoundarySide[], 
    config: BoundaryConfig,
    bounds: { leftBound: number, rightBound: number, topBound: number, bottomBound: number }
  ): Vector2 | undefined {
    const pos = node.position
    let newX = pos.x
    let newY = pos.y

    switch (config.type) {
      case BoundaryType.CLAMP:
        if (sides.includes(BoundarySide.LEFT)) newX = bounds.leftBound
        if (sides.includes(BoundarySide.RIGHT)) newX = bounds.rightBound
        if (sides.includes(BoundarySide.TOP)) newY = bounds.topBound
        if (sides.includes(BoundarySide.BOTTOM)) newY = bounds.bottomBound
        break

      case BoundaryType.WRAP:
        if (sides.includes(BoundarySide.LEFT)) newX = bounds.rightBound
        if (sides.includes(BoundarySide.RIGHT)) newX = bounds.leftBound
        if (sides.includes(BoundarySide.TOP)) newY = bounds.bottomBound
        if (sides.includes(BoundarySide.BOTTOM)) newY = bounds.topBound
        break

      case BoundaryType.BOUNCE:
        // 反弹需要速度信息，这里简单处理为夹紧
        if (sides.includes(BoundarySide.LEFT)) newX = bounds.leftBound
        if (sides.includes(BoundarySide.RIGHT)) newX = bounds.rightBound
        if (sides.includes(BoundarySide.TOP)) newY = bounds.topBound
        if (sides.includes(BoundarySide.BOTTOM)) newY = bounds.bottomBound
        break

      case BoundaryType.CALLBACK:
        if (config.onBoundaryHit) {
          sides.forEach(side => {
            config.onBoundaryHit!(node, side, config)
          })
        }
        return undefined

      case BoundaryType.DESTROY:
      case BoundaryType.NONE:
      default:
        return undefined
    }

    // 触发边界碰撞回调
    if (config.onBoundaryHit) {
      sides.forEach(side => {
        config.onBoundaryHit!(node, side, config)
      })
    }

    return { x: newX, y: newY }
  }

  /**
   * 获取节点大小（简化版本）
   */
  private _getNodeSize(node: Node2D): Vector2 {
    // 这里简化处理，实际应该根据节点类型获取真实大小
    if ('texture' in node && node.texture) {
      return { 
        x: (node.texture as any).image?.width || 64, 
        y: (node.texture as any).image?.height || 64 
      }
    }
    return { x: 64, y: 64 } // 默认大小
  }

  /**
   * 创建画布边界配置
   */
  static createCanvasBoundary(
    width: number, 
    height: number, 
    type: BoundaryType = BoundaryType.CLAMP
  ): BoundaryConfig {
    return {
      enabled: true,
      type,
      bounds: { x: 0, y: 0, width, height },
      margin: { left: 0, right: 0, top: 0, bottom: 0 }
    }
  }

  /**
   * 创建无边界配置
   */
  static createNoBoundary(): BoundaryConfig {
    return {
      enabled: false,
      type: BoundaryType.NONE,
      bounds: { x: 0, y: 0, width: 0, height: 0 }
    }
  }
}

export default BoundarySystem
