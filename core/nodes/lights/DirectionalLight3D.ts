/**
 * QAQ游戏引擎 - DirectionalLight3D 方向光节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 方向光节点，模拟太阳光等平行光源
 * - 继承自Light3D，具有完整的光照基础功能
 * - 与Three.js DirectionalLight深度集成
 * - 支持正交阴影映射
 * - 提供方向光特有的属性和控制
 * - 支持光照调试和可视化
 *
 * 架构设计:
 * - 基于Godot的DirectionalLight3D设计
 * - 与Three.js DirectionalLight的完美集成
 * - 支持大范围场景的阴影投射
 * - 优化的正交阴影相机配置
 *
 * 核心功能:
 * - 平行光照效果
 * - 正交阴影映射
 * - 阴影相机范围控制
 * - 光照方向控制
 * - 调试辅助显示
 */

import Light3D, { LightType } from './Light3D'
import * as THREE from 'three'
import type { Vector3 } from '../../../types/core'
import  type { LightConfig } from  './Light3D'

// ============================================================================
// DirectionalLight3D相关接口
// ============================================================================

/**
 * 方向光配置接口
 */
export interface DirectionalLightConfig extends LightConfig {
  /** 阴影相机左边界 */
  shadowCameraLeft?: number
  /** 阴影相机右边界 */
  shadowCameraRight?: number
  /** 阴影相机顶部边界 */
  shadowCameraTop?: number
  /** 阴影相机底部边界 */
  shadowCameraBottom?: number
  /** 目标位置（光照方向的目标点） */
  target?: Vector3
}

// ============================================================================
// DirectionalLight3D 类实现
// ============================================================================

/**
 * DirectionalLight3D 类 - 方向光节点
 *
 * 主要功能:
 * 1. 平行光照效果模拟
 * 2. 正交阴影映射
 * 3. 阴影相机范围控制
 * 4. 光照方向精确控制
 * 5. 调试辅助和可视化
 */
export class DirectionalLight3D extends Light3D {
  // ========================================================================
  // 私有属性 - 方向光特有
  // ========================================================================

  /** 方向光配置 */
  private _directionalConfig: DirectionalLightConfig

  /** Three.js方向光对象 */
  private _directionalLight: THREE.DirectionalLight | null = null

  /** 光照目标对象 */
  private _target: THREE.Object3D | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 方向光配置
   */
  constructor(name: string = 'DirectionalLight3D', config: DirectionalLightConfig = {}) {
    super(name, LightType.DIRECTIONAL, config)

    this._directionalConfig = {
      shadowCameraLeft: -10,
      shadowCameraRight: 10,
      shadowCameraTop: 10,
      shadowCameraBottom: -10,
      target: { x: 0, y: 0, z: 0 },
      ...config
    }

    // DirectionalLight3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取阴影相机左边界
   * @returns 左边界
   */
  get shadowCameraLeft(): number {
    return this._directionalConfig.shadowCameraLeft || -10
  }

  /**
   * 设置阴影相机左边界
   * @param value 左边界
   */
  set shadowCameraLeft(value: number) {
    this._directionalConfig.shadowCameraLeft = value
    this._updateShadowCamera()
  }

  /**
   * 获取阴影相机右边界
   * @returns 右边界
   */
  get shadowCameraRight(): number {
    return this._directionalConfig.shadowCameraRight || 10
  }

  /**
   * 设置阴影相机右边界
   * @param value 右边界
   */
  set shadowCameraRight(value: number) {
    this._directionalConfig.shadowCameraRight = value
    this._updateShadowCamera()
  }

  /**
   * 获取阴影相机顶部边界
   * @returns 顶部边界
   */
  get shadowCameraTop(): number {
    return this._directionalConfig.shadowCameraTop || 10
  }

  /**
   * 设置阴影相机顶部边界
   * @param value 顶部边界
   */
  set shadowCameraTop(value: number) {
    this._directionalConfig.shadowCameraTop = value
    this._updateShadowCamera()
  }

  /**
   * 获取阴影相机底部边界
   * @returns 底部边界
   */
  get shadowCameraBottom(): number {
    return this._directionalConfig.shadowCameraBottom || -10
  }

  /**
   * 设置阴影相机底部边界
   * @param value 底部边界
   */
  set shadowCameraBottom(value: number) {
    this._directionalConfig.shadowCameraBottom = value
    this._updateShadowCamera()
  }

  /**
   * 获取目标位置
   * @returns 目标位置
   */
  get target(): Vector3 {
    return this._directionalConfig.target || { x: 0, y: 0, z: 0 }
  }

  /**
   * 设置目标位置
   * @param value 目标位置
   */
  set target(value: Vector3) {
    this._directionalConfig.target = { ...value }
    this._updateTarget()
  }

  /**
   * 获取Three.js方向光对象
   * @returns Three.js方向光对象
   */
  get directionalLight(): THREE.DirectionalLight | null {
    return this._directionalLight
  }

  // ========================================================================
  // 抽象方法实现
  // ========================================================================

  /**
   * 创建Three.js光照对象
   * @returns Three.js方向光对象
   */
  protected _createThreeLight(): THREE.Light {
    this._directionalLight = new THREE.DirectionalLight(this.color, this.intensity)

    // 创建目标对象
    this._target = new THREE.Object3D()
    this._target.position.set(
      this.target.x,
      this.target.y,
      this.target.z
    )

    // 设置光照目标
    this._directionalLight.target = this._target

    return this._directionalLight
  }

  /**
   * 更新光照特定属性
   */
  protected _updateLightSpecificProperties(): void {
    if (!this._directionalLight) return

    // 更新目标位置
    this._updateTarget()

    // 更新阴影相机
    this._updateShadowCamera()
  }

  /**
   * 创建调试辅助对象
   * @returns 调试辅助对象
   */
  protected _createDebugHelper(): THREE.Object3D | null {
    if (!this._directionalLight) return null

    // 创建方向光辅助器
    const helper = new THREE.DirectionalLightHelper(this._directionalLight, 1, 0xffff00)

    // 如果有阴影，添加阴影相机辅助器
    if (this.castShadow && this._directionalLight.shadow) {
      const shadowHelper = new THREE.CameraHelper(this._directionalLight.shadow.camera)
      helper.add(shadowHelper)
    }

    return helper
  }

  // ========================================================================
  // 方向光特有方法
  // ========================================================================

  /**
   * 更新目标位置
   */
  private _updateTarget(): void {
    if (!this._target) return

    this._target.position.set(
      this.target.x,
      this.target.y,
      this.target.z
    )

    // 添加目标到场景中（如果还没有添加）
    if (this.object3D && !this.object3D.children.includes(this._target)) {
      this.object3D.add(this._target)
    }
  }

  /**
   * 更新阴影相机
   */
  private _updateShadowCamera(): void {
    if (!this._directionalLight || !this._directionalLight.shadow) return

    const camera = this._directionalLight.shadow.camera as THREE.OrthographicCamera

    camera.left = this.shadowCameraLeft
    camera.right = this.shadowCameraRight
    camera.top = this.shadowCameraTop
    camera.bottom = this.shadowCameraBottom

    camera.updateProjectionMatrix()
  }

  /**
   * 设置阴影相机范围
   * @param left 左边界
   * @param right 右边界
   * @param top 顶部边界
   * @param bottom 底部边界
   */
  setShadowCameraBox(left: number, right: number, top: number, bottom: number): void {
    this._directionalConfig.shadowCameraLeft = left
    this._directionalConfig.shadowCameraRight = right
    this._directionalConfig.shadowCameraTop = top
    this._directionalConfig.shadowCameraBottom = bottom
    this._updateShadowCamera()
  }

  /**
   * 设置阴影相机大小（正方形）
   * @param size 相机大小
   */
  setShadowCameraSize(size: number): void {
    const halfSize = size / 2
    this.setShadowCameraBox(-halfSize, halfSize, halfSize, -halfSize)
  }

  /**
   * 设置阴影相机参数（兼容性方法）
   * @param near 近裁剪面
   * @param far 远裁剪面
   * @param size 相机尺寸
   */
  setShadowCamera(near: number, far: number, size: number = 10): void {
    this.shadowNear = near
    this.shadowFar = far
    this.setShadowCameraSize(size)
    console.log(`💡 DirectionalLight3D阴影相机设置: Near=${near}, Far=${far}, Size=${size}`)
  }

  /**
   * 设置光照目标点（兼容性方法）
   * @param target 目标点
   */
  setTarget(target: Vector3): void {
    this.target = target
    console.log(`💡 DirectionalLight3D目标设置为: (${target.x}, ${target.y}, ${target.z})`)
  }

  /**
   * 设置光照方向（通过目标点）
   * @param target 目标点
   */
  setDirection(target: Vector3): void {
    this.target = target
  }

  /**
   * 设置光照方向（通过方向向量）
   * @param direction 方向向量
   */
  setDirectionVector(direction: Vector3): void {
    // 将方向向量转换为目标点
    const currentPos = this.position
    this.target = {
      x: currentPos.x + direction.x,
      y: currentPos.y + direction.y,
      z: currentPos.z + direction.z
    }
  }

  /**
   * 获取光照方向向量
   * @returns 方向向量
   */
  getDirectionVector(): Vector3 {
    const currentPos = this.position
    const targetPos = this.target

    return {
      x: targetPos.x - currentPos.x,
      y: targetPos.y - currentPos.y,
      z: targetPos.z - currentPos.z
    }
  }

  /**
   * 克隆方向光节点
   * @param name 新节点名称
   * @returns 克隆的方向光节点
   */
  clone(name?: string): DirectionalLight3D {
    const cloned = new DirectionalLight3D(
      name || `${this.name}_clone`,
      {
        ...this.getConfig(),
        ...this._directionalConfig
      }
    )

    // 复制变换
    cloned.position = { x: this.position.x, y: this.position.y, z: this.position.z }
    cloned.rotation = { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z }
    cloned.scale = { x: this.scale.x, y: this.scale.y, z: this.scale.z }

    return cloned
  }

  /**
   * 获取方向光统计信息
   * @returns 统计信息
   */
  getDirectionalStats(): {
    shadowCameraLeft: number
    shadowCameraRight: number
    shadowCameraTop: number
    shadowCameraBottom: number
    target: Vector3
    direction: Vector3
  } {
    return {
      shadowCameraLeft: this.shadowCameraLeft,
      shadowCameraRight: this.shadowCameraRight,
      shadowCameraTop: this.shadowCameraTop,
      shadowCameraBottom: this.shadowCameraBottom,
      target: this.target,
      direction: this.getDirectionVector()
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default DirectionalLight3D
