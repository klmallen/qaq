/**
 * QAQ游戏引擎 - OmniLight3D 全向光节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 全向光节点，模拟点光源（如灯泡、火焰等）
 * - 继承自Light3D，具有完整的光照基础功能
 * - 与Three.js PointLight深度集成
 * - 支持距离衰减和立方体阴影映射
 * - 提供全向光特有的属性和控制
 * - 支持光照调试和可视化
 *
 * 架构设计:
 * - 基于Godot的OmniLight3D设计
 * - 与Three.js PointLight的完美集成
 * - 支持物理正确的距离衰减
 * - 优化的立方体阴影映射
 *
 * 核心功能:
 * - 全向光照效果
 * - 距离衰减控制
 * - 立方体阴影映射
 * - 光照范围控制
 * - 调试辅助显示
 */

import Light3D, { LightType } from './Light3D'
import * as THREE from 'three'
import type { Vector3 } from '../../../types/core'
import  type { LightConfig } from  './Light3D'
// ============================================================================
// OmniLight3D相关接口
// ============================================================================

/**
 * 全向光配置接口
 */
export interface OmniLightConfig extends LightConfig {
  /** 光照范围 */
  range?: number
  /** 距离衰减系数 */
  decay?: number
  /** 是否使用物理正确的光照 */
  physicallyCorrectLights?: boolean
}

// ============================================================================
// OmniLight3D 类实现
// ============================================================================

/**
 * OmniLight3D 类 - 全向光节点
 *
 * 主要功能:
 * 1. 全向光照效果模拟
 * 2. 距离衰减控制
 * 3. 立方体阴影映射
 * 4. 光照范围精确控制
 * 5. 调试辅助和可视化
 */
export class OmniLight3D extends Light3D {
  // ========================================================================
  // 私有属性 - 全向光特有
  // ========================================================================

  /** 全向光配置 */
  private _omniConfig: OmniLightConfig

  /** Three.js点光源对象 */
  private _pointLight: THREE.PointLight | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 全向光配置
   */
  constructor(name: string = 'OmniLight3D', config: OmniLightConfig = {}) {
    super(name, LightType.POINT, config)

    this._omniConfig = {
      range: 10,
      decay: 2,
      physicallyCorrectLights: true,
      ...config
    }

    // OmniLight3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取光照范围
   * @returns 光照范围
   */
  get range(): number {
    return this._omniConfig.range || 10
  }

  /**
   * 设置光照范围
   * @param value 光照范围
   */
  set range(value: number) {
    this._omniConfig.range = Math.max(0.1, value)
    this._updatePointLight()
  }

  /**
   * 获取距离衰减系数
   * @returns 距离衰减系数
   */
  get decay(): number {
    return this._omniConfig.decay || 2
  }

  /**
   * 设置距离衰减系数
   * @param value 距离衰减系数
   */
  set decay(value: number) {
    this._omniConfig.decay = Math.max(0, value)
    this._updatePointLight()
  }

  /**
   * 获取是否使用物理正确的光照
   * @returns 是否使用物理正确的光照
   */
  get physicallyCorrectLights(): boolean {
    return this._omniConfig.physicallyCorrectLights || false
  }

  /**
   * 设置是否使用物理正确的光照
   * @param value 是否使用物理正确的光照
   */
  set physicallyCorrectLights(value: boolean) {
    this._omniConfig.physicallyCorrectLights = value
    this._updatePointLight()
  }

  /**
   * 获取Three.js点光源对象
   * @returns Three.js点光源对象
   */
  get pointLight(): THREE.PointLight | null {
    return this._pointLight
  }

  // ========================================================================
  // 抽象方法实现
  // ========================================================================

  /**
   * 创建Three.js光照对象
   * @returns Three.js点光源对象
   */
  protected _createThreeLight(): THREE.Light {
    this._pointLight = new THREE.PointLight(
      this.color,
      this.intensity,
      this.range,
      this.decay
    )

    return this._pointLight
  }

  /**
   * 更新光照特定属性
   */
  protected _updateLightSpecificProperties(): void {
    this._updatePointLight()
  }

  /**
   * 创建调试辅助对象
   * @returns 调试辅助对象
   */
  protected _createDebugHelper(): THREE.Object3D | null {
    if (!this._pointLight) return null

    // 创建点光源辅助器
    const helper = new THREE.PointLightHelper(this._pointLight, 0.5, 0xffff00)

    return helper
  }

  // ========================================================================
  // 全向光特有方法
  // ========================================================================

  /**
   * 更新点光源属性
   */
  private _updatePointLight(): void {
    if (!this._pointLight) return

    // 更新距离和衰减
    this._pointLight.distance = this.range
    this._pointLight.decay = this.decay

    // 更新阴影相机
    this._updateShadowCamera()
  }

  /**
   * 更新阴影相机
   */
  private _updateShadowCamera(): void {
    if (!this._pointLight || !this._pointLight.shadow) return

    const camera = this._pointLight.shadow.camera as THREE.PerspectiveCamera

    // 设置透视相机参数
    camera.near = this.getConfig().shadowCameraNear || 0.1
    camera.far = this.range
    camera.fov = 90 // 立方体阴影映射需要90度视角

    camera.updateProjectionMatrix()
  }

  /**
   * 设置光照范围和衰减
   * @param range 光照范围
   * @param decay 衰减系数
   */
  setRangeAndDecay(range: number, decay: number): void {
    this._omniConfig.range = Math.max(0.1, range)
    this._omniConfig.decay = Math.max(0, decay)
    this._updatePointLight()
  }

  /**
   * 克隆全向光节点
   * @param name 新节点名称
   * @returns 克隆的全向光节点
   */
  clone(name?: string): OmniLight3D {
    const cloned = new OmniLight3D(
      name || `${this.name}_clone`,
      {
        ...this.getConfig(),
        ...this._omniConfig
      }
    )

    // 复制变换
    cloned.position = { x: this.position.x, y: this.position.y, z: this.position.z }
    cloned.rotation = { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z }
    cloned.scale = { x: this.scale.x, y: this.scale.y, z: this.scale.z }

    return cloned
  }

  /**
   * 获取全向光统计信息
   * @returns 统计信息
   */
  getOmniStats(): {
    range: number
    decay: number
    physicallyCorrectLights: boolean
  } {
    return {
      range: this.range,
      decay: this.decay,
      physicallyCorrectLights: this.physicallyCorrectLights
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default OmniLight3D
