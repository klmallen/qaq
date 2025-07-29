/**
 * QAQ游戏引擎 - UI纹理图集系统
 * 
 * 解决UI控件纹理内存占用过大的问题
 * 将多个UI控件的纹理合并到一个大纹理中
 */

import * as THREE from 'three'
import type { Vector2 } from '../../types/core'

/**
 * 矩形区域接口
 */
interface Rectangle {
  x: number
  y: number
  width: number
  height: number
}

/**
 * UI区域接口
 */
export interface UIRegion {
  id: string
  rect: Rectangle
  uvOffset: Vector2
  uvScale: Vector2
  isDirty: boolean
}

/**
 * 简单的矩形装箱算法
 * 用于在图集中分配空间
 */
class RectanglePacker {
  private width: number
  private height: number
  private usedRectangles: Rectangle[] = []
  private freeRectangles: Rectangle[] = []

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.freeRectangles.push({ x: 0, y: 0, width, height })
  }

  /**
   * 分配矩形区域
   * @param width 宽度
   * @param height 高度
   * @returns 分配的矩形区域，如果失败返回null
   */
  allocate(width: number, height: number): Rectangle | null {
    // 添加边距以避免纹理采样问题
    const paddedWidth = width + 2
    const paddedHeight = height + 2

    // 寻找最适合的空闲矩形
    let bestRect: Rectangle | null = null
    let bestShortSideFit = Infinity
    let bestLongSideFit = Infinity

    for (const rect of this.freeRectangles) {
      if (rect.width >= paddedWidth && rect.height >= paddedHeight) {
        const leftoverHoriz = rect.width - paddedWidth
        const leftoverVert = rect.height - paddedHeight
        const shortSideFit = Math.min(leftoverHoriz, leftoverVert)
        const longSideFit = Math.max(leftoverHoriz, leftoverVert)

        if (shortSideFit < bestShortSideFit || 
            (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestRect = rect
          bestShortSideFit = shortSideFit
          bestLongSideFit = longSideFit
        }
      }
    }

    if (!bestRect) return null

    // 创建分配的矩形（去掉边距）
    const allocatedRect: Rectangle = {
      x: bestRect.x + 1, // 边距
      y: bestRect.y + 1, // 边距
      width,
      height
    }

    // 更新空闲矩形列表
    this.splitFreeNode(bestRect, allocatedRect)
    this.usedRectangles.push(allocatedRect)

    return allocatedRect
  }

  /**
   * 分割空闲节点
   */
  private splitFreeNode(freeNode: Rectangle, usedNode: Rectangle): void {
    // 移除被使用的节点
    const index = this.freeRectangles.indexOf(freeNode)
    if (index !== -1) {
      this.freeRectangles.splice(index, 1)
    }

    // 创建新的空闲矩形
    const paddedUsedNode = {
      x: usedNode.x - 1,
      y: usedNode.y - 1,
      width: usedNode.width + 2,
      height: usedNode.height + 2
    }

    // 右侧剩余空间
    if (paddedUsedNode.x + paddedUsedNode.width < freeNode.x + freeNode.width) {
      this.freeRectangles.push({
        x: paddedUsedNode.x + paddedUsedNode.width,
        y: freeNode.y,
        width: freeNode.x + freeNode.width - (paddedUsedNode.x + paddedUsedNode.width),
        height: freeNode.height
      })
    }

    // 下方剩余空间
    if (paddedUsedNode.y + paddedUsedNode.height < freeNode.y + freeNode.height) {
      this.freeRectangles.push({
        x: freeNode.x,
        y: paddedUsedNode.y + paddedUsedNode.height,
        width: freeNode.width,
        height: freeNode.y + freeNode.height - (paddedUsedNode.y + paddedUsedNode.height)
      })
    }
  }

  /**
   * 释放矩形区域
   */
  deallocate(rect: Rectangle): void {
    const index = this.usedRectangles.findIndex(r => 
      r.x === rect.x && r.y === rect.y && r.width === rect.width && r.height === rect.height
    )
    
    if (index !== -1) {
      this.usedRectangles.splice(index, 1)
      // 简单实现：重新添加为空闲矩形（实际应该合并相邻的空闲矩形）
      this.freeRectangles.push({
        x: rect.x - 1,
        y: rect.y - 1,
        width: rect.width + 2,
        height: rect.height + 2
      })
    }
  }

  /**
   * 获取使用率
   */
  getUsageRatio(): number {
    const usedArea = this.usedRectangles.reduce((sum, rect) => 
      sum + rect.width * rect.height, 0
    )
    return usedArea / (this.width * this.height)
  }
}

/**
 * UI纹理图集管理器
 * 单例模式，管理所有UI控件的纹理
 */
export class UITextureAtlas {
  private static instance: UITextureAtlas | null = null

  private atlas: HTMLCanvasElement
  private atlasTexture: THREE.Texture
  private allocator: RectanglePacker
  private regions: Map<string, UIRegion> = new Map()
  private dirtyRegions: Set<string> = new Set()
  private updateScheduled: boolean = false

  private constructor(width = 2048, height = 2048) {
    // 创建图集画布
    this.atlas = document.createElement('canvas')
    this.atlas.width = width
    this.atlas.height = height

    // 创建Three.js纹理
    this.atlasTexture = new THREE.CanvasTexture(this.atlas)
    this.atlasTexture.generateMipmaps = false
    this.atlasTexture.minFilter = THREE.LinearFilter
    this.atlasTexture.magFilter = THREE.LinearFilter
    this.atlasTexture.wrapS = THREE.ClampToEdgeWrapping
    this.atlasTexture.wrapT = THREE.ClampToEdgeWrapping

    // 创建空间分配器
    this.allocator = new RectanglePacker(width, height)

    // 初始化图集（填充透明色）
    this.initializeAtlas()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UITextureAtlas {
    if (!this.instance) {
      this.instance = new UITextureAtlas()
    }
    return this.instance
  }

  /**
   * 初始化图集
   */
  private initializeAtlas(): void {
    const ctx = this.atlas.getContext('2d')!
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, this.atlas.width, this.atlas.height)
  }

  /**
   * 分配UI区域
   * @param id 区域ID
   * @param width 宽度
   * @param height 高度
   * @returns 分配的区域，如果失败返回null
   */
  allocateRegion(id: string, width: number, height: number): UIRegion | null {
    // 检查是否已存在
    if (this.regions.has(id)) {
      console.warn(`UI region ${id} already exists`)
      return this.regions.get(id)!
    }

    // 分配空间
    const rect = this.allocator.allocate(width, height)
    if (!rect) {
      console.error(`Failed to allocate UI region ${id} (${width}x${height})`)
      return null
    }

    // 创建区域
    const region: UIRegion = {
      id,
      rect,
      uvOffset: {
        x: rect.x / this.atlas.width,
        y: rect.y / this.atlas.height
      },
      uvScale: {
        x: width / this.atlas.width,
        y: height / this.atlas.height
      },
      isDirty: true
    }

    this.regions.set(id, region)
    this.dirtyRegions.add(id)
    this.scheduleUpdate()

    return region
  }

  /**
   * 释放UI区域
   * @param id 区域ID
   */
  deallocateRegion(id: string): void {
    const region = this.regions.get(id)
    if (region) {
      this.allocator.deallocate(region.rect)
      this.regions.delete(id)
      this.dirtyRegions.delete(id)

      // 清除图集中的区域
      const ctx = this.atlas.getContext('2d')!
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillRect(region.rect.x, region.rect.y, region.rect.width, region.rect.height)
      
      this.scheduleUpdate()
    }
  }

  /**
   * 更新UI区域内容
   * @param id 区域ID
   * @param drawCallback 绘制回调函数
   */
  updateRegion(id: string, drawCallback: (ctx: CanvasRenderingContext2D) => void): void {
    const region = this.regions.get(id)
    if (!region) {
      console.warn(`UI region ${id} not found`)
      return
    }

    const ctx = this.atlas.getContext('2d')!
    
    // 保存上下文状态
    ctx.save()
    
    // 设置裁剪区域
    ctx.beginPath()
    ctx.rect(region.rect.x, region.rect.y, region.rect.width, region.rect.height)
    ctx.clip()
    
    // 移动到区域起始位置
    ctx.translate(region.rect.x, region.rect.y)
    
    // 清除区域
    ctx.clearRect(0, 0, region.rect.width, region.rect.height)
    
    // 执行绘制
    try {
      drawCallback(ctx)
    } catch (error) {
      console.error(`Error drawing UI region ${id}:`, error)
    }
    
    // 恢复上下文状态
    ctx.restore()
    
    // 标记为脏区域
    region.isDirty = true
    this.dirtyRegions.add(id)
    this.scheduleUpdate()
  }

  /**
   * 获取UI区域
   * @param id 区域ID
   * @returns UI区域
   */
  getRegion(id: string): UIRegion | null {
    return this.regions.get(id) || null
  }

  /**
   * 获取图集纹理
   * @returns Three.js纹理对象
   */
  getTexture(): THREE.Texture {
    return this.atlasTexture
  }

  /**
   * 调度更新
   */
  private scheduleUpdate(): void {
    if (!this.updateScheduled) {
      this.updateScheduled = true
      requestAnimationFrame(() => {
        this.updateTexture()
        this.updateScheduled = false
      })
    }
  }

  /**
   * 更新纹理
   */
  private updateTexture(): void {
    if (this.dirtyRegions.size > 0) {
      this.atlasTexture.needsUpdate = true
      
      // 清理脏区域标记
      for (const id of this.dirtyRegions) {
        const region = this.regions.get(id)
        if (region) {
          region.isDirty = false
        }
      }
      this.dirtyRegions.clear()
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalRegions: number
    usageRatio: number
    atlasSize: { width: number; height: number }
    dirtyRegions: number
  } {
    return {
      totalRegions: this.regions.size,
      usageRatio: this.allocator.getUsageRatio(),
      atlasSize: {
        width: this.atlas.width,
        height: this.atlas.height
      },
      dirtyRegions: this.dirtyRegions.size
    }
  }

  /**
   * 导出图集为图片（调试用）
   */
  exportAtlas(): string {
    return this.atlas.toDataURL()
  }

  /**
   * 清理所有区域
   */
  clear(): void {
    this.regions.clear()
    this.dirtyRegions.clear()
    this.allocator = new RectanglePacker(this.atlas.width, this.atlas.height)
    this.initializeAtlas()
    this.atlasTexture.needsUpdate = true
  }

  /**
   * 销毁图集
   */
  destroy(): void {
    this.clear()
    this.atlasTexture.dispose()
    UITextureAtlas.instance = null
  }
}
