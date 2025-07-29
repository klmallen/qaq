/**
 * QAQ游戏引擎 - UI坐标系统
 * 
 * 解决DOM事件坐标与3D空间坐标转换问题
 */

import type { Vector2, Vector3 } from '../../types/core'
import * as THREE from 'three'

/**
 * UI坐标转换系统
 * 处理DOM事件坐标、UI本地坐标、3D世界坐标之间的转换
 */
export class UICoordinateSystem {
  private static raycaster = new THREE.Raycaster()
  private static mouse = new THREE.Vector2()

  /**
   * DOM事件坐标转换为UI本地坐标
   * @param domEvent DOM鼠标事件
   * @param uiElement UI元素的DOM节点
   * @returns UI本地坐标
   */
  static domToUI(domEvent: MouseEvent, uiElement: HTMLElement): Vector2 {
    const rect = uiElement.getBoundingClientRect()
    return {
      x: domEvent.clientX - rect.left,
      y: domEvent.clientY - rect.top
    }
  }

  /**
   * UI本地坐标转换为3D世界坐标
   * @param uiPoint UI本地坐标点
   * @param controlNode Control节点实例
   * @returns 3D世界坐标
   */
  static uiToWorld(uiPoint: Vector2, controlNode: any): Vector3 {
    const globalPos = controlNode.getGlobalPosition()
    const size = controlNode.size
    
    return {
      x: globalPos.x + uiPoint.x - size.x / 2,
      y: globalPos.y + uiPoint.y - size.y / 2,
      z: controlNode.zIndex * 0.001
    }
  }

  /**
   * 屏幕坐标转换为标准化设备坐标(NDC)
   * @param screenX 屏幕X坐标
   * @param screenY 屏幕Y坐标
   * @param containerWidth 容器宽度
   * @param containerHeight 容器高度
   * @returns NDC坐标
   */
  static screenToNDC(
    screenX: number, 
    screenY: number, 
    containerWidth: number, 
    containerHeight: number
  ): Vector2 {
    return {
      x: (screenX / containerWidth) * 2 - 1,
      y: -(screenY / containerHeight) * 2 + 1
    }
  }

  /**
   * 使用射线检测获取UI元素的精确交点
   * @param event 鼠标事件
   * @param camera 3D相机
   * @param uiMeshes UI网格对象数组
   * @returns 交点信息
   */
  static raycastUI(
    event: MouseEvent, 
    camera: THREE.Camera, 
    uiMeshes: THREE.Mesh[]
  ): { point: Vector3; uv: Vector2; mesh: THREE.Mesh } | null {
    // 获取容器尺寸
    const container = (event.target as HTMLElement).closest('.qaq-renderer-container')
    if (!container) return null

    const rect = container.getBoundingClientRect()
    const containerWidth = rect.width
    const containerHeight = rect.height

    // 转换为NDC坐标
    const ndc = this.screenToNDC(
      event.clientX - rect.left,
      event.clientY - rect.top,
      containerWidth,
      containerHeight
    )

    // 设置射线
    this.mouse.set(ndc.x, ndc.y)
    this.raycaster.setFromCamera(this.mouse, camera)

    // 检测交点
    const intersects = this.raycaster.intersectObjects(uiMeshes)
    
    if (intersects.length > 0) {
      const intersect = intersects[0]
      return {
        point: {
          x: intersect.point.x,
          y: intersect.point.y,
          z: intersect.point.z
        },
        uv: intersect.uv ? { x: intersect.uv.x, y: intersect.uv.y } : { x: 0, y: 0 },
        mesh: intersect.object as THREE.Mesh
      }
    }

    return null
  }

  /**
   * 3D世界坐标转换为UI本地坐标
   * @param worldPoint 3D世界坐标点
   * @param controlNode Control节点实例
   * @returns UI本地坐标
   */
  static worldToUI(worldPoint: Vector3, controlNode: any): Vector2 {
    const globalPos = controlNode.getGlobalPosition()
    const size = controlNode.size

    return {
      x: worldPoint.x - globalPos.x + size.x / 2,
      y: worldPoint.y - globalPos.y + size.y / 2
    }
  }

  /**
   * 检查点是否在UI元素边界内
   * @param point UI本地坐标点
   * @param size UI元素尺寸
   * @returns 是否在边界内
   */
  static isPointInBounds(point: Vector2, size: Vector2): boolean {
    return point.x >= 0 && point.x <= size.x && 
           point.y >= 0 && point.y <= size.y
  }

  /**
   * 计算两点之间的距离
   * @param point1 第一个点
   * @param point2 第二个点
   * @returns 距离
   */
  static distance(point1: Vector2, point2: Vector2): number {
    const dx = point2.x - point1.x
    const dy = point2.y - point1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * 将角度转换为弧度
   * @param degrees 角度
   * @returns 弧度
   */
  static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  /**
   * 将弧度转换为角度
   * @param radians 弧度
   * @returns 角度
   */
  static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI)
  }

  /**
   * 线性插值
   * @param start 起始值
   * @param end 结束值
   * @param t 插值参数 (0-1)
   * @returns 插值结果
   */
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * Math.max(0, Math.min(1, t))
  }

  /**
   * 向量线性插值
   * @param start 起始向量
   * @param end 结束向量
   * @param t 插值参数 (0-1)
   * @returns 插值结果向量
   */
  static lerpVector2(start: Vector2, end: Vector2, t: number): Vector2 {
    return {
      x: this.lerp(start.x, end.x, t),
      y: this.lerp(start.y, end.y, t)
    }
  }

  /**
   * 限制值在指定范围内
   * @param value 要限制的值
   * @param min 最小值
   * @param max 最大值
   * @returns 限制后的值
   */
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  /**
   * 限制向量在指定范围内
   * @param vector 要限制的向量
   * @param minX 最小X值
   * @param maxX 最大X值
   * @param minY 最小Y值
   * @param maxY 最大Y值
   * @returns 限制后的向量
   */
  static clampVector2(
    vector: Vector2, 
    minX: number, 
    maxX: number, 
    minY: number, 
    maxY: number
  ): Vector2 {
    return {
      x: this.clamp(vector.x, minX, maxX),
      y: this.clamp(vector.y, minY, maxY)
    }
  }
}
