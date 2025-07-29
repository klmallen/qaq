/**
 * QAQ游戏引擎 - UI深度管理系统
 * 
 * 解决UI控件Z-index排序和3D空间深度管理问题
 */

import type { Vector3 } from '../../types/core'

/**
 * 深度层级枚举
 * 定义不同类型内容的深度范围
 */
export enum DepthLayer {
  /** 3D背景内容 */
  BACKGROUND_3D = -1000,
  /** 3D世界内容 */
  WORLD_3D = 0,
  /** UI背景层 */
  UI_BACKGROUND = 100,
  /** UI内容层 */
  UI_CONTENT = 200,
  /** UI覆盖层 */
  UI_OVERLAY = 300,
  /** 模态对话框层 */
  UI_MODAL = 400,
  /** 工具提示层 */
  UI_TOOLTIP = 500,
  /** 调试信息层 */
  DEBUG = 1000
}

/**
 * UI深度管理器
 * 统一管理UI元素的深度排序和渲染顺序
 */
export class UIDepthManager {
  /** 深度精度 - 每个zIndex单位对应的实际深度值 */
  private static readonly DEPTH_PRECISION = 0.001

  /** 最大zIndex值 */
  private static readonly MAX_Z_INDEX = 999

  /** 已注册的UI元素深度映射 */
  private static depthMap: Map<string, number> = new Map()

  /** 深度层级使用情况 */
  private static layerUsage: Map<DepthLayer, number> = new Map()

  /**
   * 获取UI元素的实际深度值
   * @param zIndex UI元素的zIndex
   * @param layer 深度层级
   * @returns 实际的3D深度值
   */
  static getUIDepth(zIndex: number, layer: DepthLayer): number {
    // 限制zIndex范围
    const clampedZIndex = Math.max(0, Math.min(this.MAX_Z_INDEX, zIndex))
    
    // 计算实际深度
    const depth = layer + clampedZIndex * this.DEPTH_PRECISION
    
    return depth
  }

  /**
   * 注册UI元素的深度
   * @param elementId UI元素ID
   * @param zIndex zIndex值
   * @param layer 深度层级
   */
  static registerElement(elementId: string, zIndex: number, layer: DepthLayer): void {
    const depth = this.getUIDepth(zIndex, layer)
    this.depthMap.set(elementId, depth)
    
    // 更新层级使用情况
    const currentUsage = this.layerUsage.get(layer) || 0
    this.layerUsage.set(layer, Math.max(currentUsage, zIndex + 1))
  }

  /**
   * 注销UI元素
   * @param elementId UI元素ID
   */
  static unregisterElement(elementId: string): void {
    this.depthMap.delete(elementId)
  }

  /**
   * 获取UI元素的深度
   * @param elementId UI元素ID
   * @returns 深度值，如果未注册则返回null
   */
  static getElementDepth(elementId: string): number | null {
    return this.depthMap.get(elementId) || null
  }

  /**
   * 对UI元素数组按深度排序
   * @param elements UI元素数组
   * @returns 排序后的数组
   */
  static sortUIElements<T extends { zIndex: number; name: string }>(elements: T[]): T[] {
    return elements.sort((a, b) => {
      const depthA = this.depthMap.get(a.name) || a.zIndex
      const depthB = this.depthMap.get(b.name) || b.zIndex
      return depthA - depthB
    })
  }

  /**
   * 获取指定层级的下一个可用zIndex
   * @param layer 深度层级
   * @returns 下一个可用的zIndex
   */
  static getNextAvailableZIndex(layer: DepthLayer): number {
    const currentUsage = this.layerUsage.get(layer) || 0
    return Math.min(currentUsage, this.MAX_Z_INDEX)
  }

  /**
   * 检查深度值是否冲突
   * @param depth 要检查的深度值
   * @param excludeId 要排除的元素ID
   * @returns 是否存在冲突
   */
  static hasDepthConflict(depth: number, excludeId?: string): boolean {
    for (const [id, existingDepth] of this.depthMap) {
      if (id !== excludeId && Math.abs(existingDepth - depth) < this.DEPTH_PRECISION / 2) {
        return true
      }
    }
    return false
  }

  /**
   * 解决深度冲突
   * @param elementId 元素ID
   * @param preferredZIndex 首选zIndex
   * @param layer 深度层级
   * @returns 解决冲突后的zIndex
   */
  static resolveDepthConflict(
    elementId: string, 
    preferredZIndex: number, 
    layer: DepthLayer
  ): number {
    let zIndex = preferredZIndex
    let depth = this.getUIDepth(zIndex, layer)
    
    // 如果存在冲突，递增zIndex直到找到可用位置
    while (this.hasDepthConflict(depth, elementId) && zIndex < this.MAX_Z_INDEX) {
      zIndex++
      depth = this.getUIDepth(zIndex, layer)
    }
    
    return zIndex
  }

  /**
   * 设置UI元素的3D位置（包含深度）
   * @param object3D Three.js对象
   * @param position 2D位置
   * @param zIndex zIndex值
   * @param layer 深度层级
   */
  static setUIPosition(
    object3D: any, 
    position: { x: number; y: number }, 
    zIndex: number, 
    layer: DepthLayer
  ): void {
    const depth = this.getUIDepth(zIndex, layer)
    
    if (object3D && object3D.position) {
      object3D.position.set(position.x, position.y, depth)
    }
  }

  /**
   * 批量更新UI元素深度
   * @param elements 要更新的元素数组
   */
  static batchUpdateDepths<T extends { 
    name: string; 
    zIndex: number; 
    object3D?: any; 
    position?: { x: number; y: number } 
  }>(elements: T[], layer: DepthLayer): void {
    // 先排序
    const sorted = this.sortUIElements(elements)
    
    // 批量更新深度
    sorted.forEach(element => {
      this.registerElement(element.name, element.zIndex, layer)
      
      if (element.object3D && element.position) {
        this.setUIPosition(element.object3D, element.position, element.zIndex, layer)
      }
    })
  }

  /**
   * 获取深度统计信息
   * @returns 深度使用统计
   */
  static getDepthStats(): {
    totalElements: number;
    layerUsage: { [key: string]: number };
    depthRange: { min: number; max: number };
  } {
    const depths = Array.from(this.depthMap.values())
    
    return {
      totalElements: this.depthMap.size,
      layerUsage: Object.fromEntries(this.layerUsage),
      depthRange: {
        min: depths.length > 0 ? Math.min(...depths) : 0,
        max: depths.length > 0 ? Math.max(...depths) : 0
      }
    }
  }

  /**
   * 清理所有深度数据
   */
  static clear(): void {
    this.depthMap.clear()
    this.layerUsage.clear()
  }

  /**
   * 验证深度系统的完整性
   * @returns 验证结果
   */
  static validateDepthSystem(): {
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
  } {
    const conflicts: string[] = []
    const warnings: string[] = []
    
    // 检查深度冲突
    const depths = Array.from(this.depthMap.entries())
    for (let i = 0; i < depths.length; i++) {
      for (let j = i + 1; j < depths.length; j++) {
        const [id1, depth1] = depths[i]
        const [id2, depth2] = depths[j]
        
        if (Math.abs(depth1 - depth2) < this.DEPTH_PRECISION / 2) {
          conflicts.push(`Depth conflict between ${id1} and ${id2}`)
        }
      }
    }
    
    // 检查层级使用情况
    for (const [layer, usage] of this.layerUsage) {
      if (usage > this.MAX_Z_INDEX * 0.8) {
        warnings.push(`Layer ${DepthLayer[layer]} is nearly full (${usage}/${this.MAX_Z_INDEX})`)
      }
    }
    
    return {
      isValid: conflicts.length === 0,
      conflicts,
      warnings
    }
  }
}
