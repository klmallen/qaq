/**
 * QAQ游戏引擎 - UI视口剔除系统
 * 
 * 只渲染可见的UI元素，提高性能
 */

import * as THREE from 'three'
import type { Vector2, Vector3 } from '../../types/core'

/**
 * UI边界框接口
 */
export interface UIBounds {
  center: Vector3
  size: Vector3
  min: Vector3
  max: Vector3
}

/**
 * 剔除结果接口
 */
export interface CullResult {
  visible: boolean
  distance: number
  screenSize: number
}

/**
 * UI视口剔除器
 * 管理UI元素的视口剔除，只渲染可见元素
 */
export class UIFrustumCuller {
  private frustum: THREE.Frustum = new THREE.Frustum()
  private cameraMatrix: THREE.Matrix4 = new THREE.Matrix4()
  private tempBox: THREE.Box3 = new THREE.Box3()
  private tempVector: THREE.Vector3 = new THREE.Vector3()

  // 剔除配置
  private config = {
    /** 最小屏幕尺寸阈值（像素），小于此值的UI元素将被剔除 */
    minScreenSize: 1,
    /** 最大距离阈值，超过此距离的UI元素将被剔除 */
    maxDistance: 1000,
    /** 是否启用距离剔除 */
    enableDistanceCulling: true,
    /** 是否启用尺寸剔除 */
    enableSizeCulling: true,
    /** 视口边界扩展比例，用于预加载即将进入视口的元素 */
    viewportExpansion: 0.1
  }

  /**
   * 更新相机视锥体
   * @param camera 相机对象
   */
  updateCamera(camera: THREE.Camera): void {
    // 计算相机的投影视图矩阵
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    
    // 更新视锥体
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)
  }

  /**
   * 检查UI元素是否在视锥体内
   * @param bounds UI元素边界
   * @param camera 相机对象
   * @returns 剔除结果
   */
  cullUIElement(bounds: UIBounds, camera: THREE.Camera): CullResult {
    // 创建边界框
    this.tempBox.setFromCenterAndSize(
      new THREE.Vector3(bounds.center.x, bounds.center.y, bounds.center.z),
      new THREE.Vector3(bounds.size.x, bounds.size.y, bounds.size.z)
    )

    // 基础视锥体测试
    const inFrustum = this.frustum.intersectsBox(this.tempBox)
    
    if (!inFrustum) {
      return {
        visible: false,
        distance: Infinity,
        screenSize: 0
      }
    }

    // 计算到相机的距离
    this.tempVector.copy(new THREE.Vector3(bounds.center.x, bounds.center.y, bounds.center.z))
    const distance = this.tempVector.distanceTo(camera.position)

    // 距离剔除
    if (this.config.enableDistanceCulling && distance > this.config.maxDistance) {
      return {
        visible: false,
        distance,
        screenSize: 0
      }
    }

    // 计算屏幕尺寸
    const screenSize = this.calculateScreenSize(bounds, camera, distance)

    // 尺寸剔除
    if (this.config.enableSizeCulling && screenSize < this.config.minScreenSize) {
      return {
        visible: false,
        distance,
        screenSize
      }
    }

    return {
      visible: true,
      distance,
      screenSize
    }
  }

  /**
   * 批量剔除UI元素
   * @param elements UI元素数组
   * @param camera 相机对象
   * @returns 可见的UI元素
   */
  cullUIElements<T extends { getBounds(): UIBounds; name: string }>(
    elements: T[],
    camera: THREE.Camera
  ): { visible: T[]; culled: T[]; stats: CullStats } {
    this.updateCamera(camera)

    const visible: T[] = []
    const culled: T[] = []
    const stats: CullStats = {
      total: elements.length,
      visibleCount: 0,
      culledByFrustum: 0,
      culledByDistance: 0,
      culledBySize: 0,
      averageDistance: 0,
      averageScreenSize: 0
    }

    let totalDistance = 0
    let totalScreenSize = 0

    for (const element of elements) {
      try {
        const bounds = element.getBounds()
        const result = this.cullUIElement(bounds, camera)

        if (result.visible) {
          visible.push(element)
          stats.visibleCount++
          totalDistance += result.distance
          totalScreenSize += result.screenSize
        } else {
          culled.push(element)
          
          // 统计剔除原因
          if (result.distance === Infinity) {
            stats.culledByFrustum++
          } else if (result.distance > this.config.maxDistance) {
            stats.culledByDistance++
          } else if (result.screenSize < this.config.minScreenSize) {
            stats.culledBySize++
          }
        }
      } catch (error) {
        console.warn(`Error culling UI element ${element.name}:`, error)
        // 出错时默认为可见
        visible.push(element)
        stats.visibleCount++
      }
    }

    // 计算平均值
    if (stats.visibleCount > 0) {
      stats.averageDistance = totalDistance / stats.visibleCount
      stats.averageScreenSize = totalScreenSize / stats.visibleCount
    }

    return { visible, culled, stats }
  }

  /**
   * 计算UI元素的屏幕尺寸
   * @param bounds UI元素边界
   * @param camera 相机对象
   * @param distance 距离（可选，如果不提供会重新计算）
   * @returns 屏幕尺寸（像素）
   */
  private calculateScreenSize(bounds: UIBounds, camera: THREE.Camera, distance?: number): number {
    if (distance === undefined) {
      this.tempVector.copy(new THREE.Vector3(bounds.center.x, bounds.center.y, bounds.center.z))
      distance = this.tempVector.distanceTo(camera.position)
    }

    // 对于正交相机
    if (camera instanceof THREE.OrthographicCamera) {
      const scale = (camera.top - camera.bottom) / 2
      return Math.max(bounds.size.x, bounds.size.y) / scale
    }

    // 对于透视相机
    if (camera instanceof THREE.PerspectiveCamera) {
      const fov = camera.fov * Math.PI / 180
      const height = 2 * Math.tan(fov / 2) * distance
      const pixelsPerUnit = window.innerHeight / height
      return Math.max(bounds.size.x, bounds.size.y) * pixelsPerUnit
    }

    return 0
  }

  /**
   * 检查点是否在扩展视口内
   * @param point 世界坐标点
   * @param camera 相机对象
   * @returns 是否在扩展视口内
   */
  isPointInExpandedViewport(point: Vector3, camera: THREE.Camera): boolean {
    // 将世界坐标转换为NDC坐标
    this.tempVector.copy(new THREE.Vector3(point.x, point.y, point.z))
    this.tempVector.project(camera)

    // 检查是否在扩展视口内
    const expansion = this.config.viewportExpansion
    return this.tempVector.x >= -1 - expansion && 
           this.tempVector.x <= 1 + expansion &&
           this.tempVector.y >= -1 - expansion && 
           this.tempVector.y <= 1 + expansion &&
           this.tempVector.z >= -1 && 
           this.tempVector.z <= 1
  }

  /**
   * 获取配置
   */
  getConfig(): typeof this.config {
    return { ...this.config }
  }

  /**
   * 设置配置
   * @param newConfig 新配置
   */
  setConfig(newConfig: Partial<typeof this.config>): void {
    Object.assign(this.config, newConfig)
  }

  /**
   * 重置配置为默认值
   */
  resetConfig(): void {
    this.config = {
      minScreenSize: 1,
      maxDistance: 1000,
      enableDistanceCulling: true,
      enableSizeCulling: true,
      viewportExpansion: 0.1
    }
  }

  /**
   * 获取视锥体的8个顶点（世界坐标）
   * @param camera 相机对象
   * @returns 视锥体顶点数组
   */
  getFrustumCorners(camera: THREE.Camera): Vector3[] {
    const corners: Vector3[] = []
    
    // NDC坐标的8个角点
    const ndcCorners = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], // 近平面
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]      // 远平面
    ]

    // 计算逆投影视图矩阵
    const inverseMatrix = new THREE.Matrix4()
    inverseMatrix.copy(this.cameraMatrix).invert()

    // 转换NDC坐标到世界坐标
    for (const ndc of ndcCorners) {
      const worldPoint = new THREE.Vector3(ndc[0], ndc[1], ndc[2])
      worldPoint.applyMatrix4(inverseMatrix)
      corners.push({ x: worldPoint.x, y: worldPoint.y, z: worldPoint.z })
    }

    return corners
  }
}

/**
 * 剔除统计信息接口
 */
export interface CullStats {
  total: number
  visibleCount: number
  culledByFrustum: number
  culledByDistance: number
  culledBySize: number
  averageDistance: number
  averageScreenSize: number
}

/**
 * UI剔除管理器（单例）
 */
export class UICullManager {
  private static instance: UICullManager | null = null
  private culler: UIFrustumCuller = new UIFrustumCuller()
  private lastCullStats: CullStats | null = null

  private constructor() {}

  static getInstance(): UICullManager {
    if (!this.instance) {
      this.instance = new UICullManager()
    }
    return this.instance
  }

  /**
   * 执行剔除
   */
  cull<T extends { getBounds(): UIBounds; name: string }>(
    elements: T[],
    camera: THREE.Camera
  ): { visible: T[]; culled: T[] } {
    const result = this.culler.cullUIElements(elements, camera)
    this.lastCullStats = result.stats
    return { visible: result.visible, culled: result.culled }
  }

  /**
   * 获取剔除器
   */
  getCuller(): UIFrustumCuller {
    return this.culler
  }

  /**
   * 获取最后一次剔除的统计信息
   */
  getLastStats(): CullStats | null {
    return this.lastCullStats
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    UICullManager.instance = null
  }
}
