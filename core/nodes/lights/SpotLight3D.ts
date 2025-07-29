/**
 * QAQ游戏引擎 - SpotLight3D 聚光灯节点
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 聚光灯节点，模拟聚光灯、手电筒等锥形光源
 * - 继承自Light3D，具有完整的光照基础功能
 * - 与Three.js SpotLight深度集成
 * - 支持光锥角度、距离衰减和透视阴影映射
 * - 提供聚光灯特有的属性和控制
 * - 支持光照调试和可视化
 *
 * 架构设计:
 * - 基于Godot的SpotLight3D设计
 * - 与Three.js SpotLight的完美集成
 * - 支持物理正确的距离衰减
 * - 优化的透视阴影映射
 *
 * 核心功能:
 * - 锥形光照效果
 * - 光锥角度控制
 * - 距离衰减控制
 * - 透视阴影映射
 * - 光照方向控制
 * - 调试辅助显示
 */

import Light3D, { LightType } from './Light3D'
import * as THREE from 'three'
import type { Vector3 } from '../../../types/core'
import  type { LightConfig } from  './Light3D'
// ============================================================================
// SpotLight3D相关接口
// ============================================================================

/**
 * 聚光灯配置接口
 */
export interface SpotLightConfig extends LightConfig {
  /** 光照范围 */
  range?: number
  /** 距离衰减系数 */
  decay?: number
  /** 光锥角度（弧度） */
  angle?: number
  /** 光锥边缘衰减 */
  penumbra?: number
  /** 目标位置（光照方向的目标点） */
  target?: Vector3
  /** 是否使用物理正确的光照 */
  physicallyCorrectLights?: boolean
}

// ============================================================================
// SpotLight3D 类实现
// ============================================================================

/**
 * SpotLight3D 类 - 聚光灯节点
 *
 * 主要功能:
 * 1. 锥形光照效果模拟
 * 2. 光锥角度和边缘衰减控制
 * 3. 距离衰减控制
 * 4. 透视阴影映射
 * 5. 光照方向精确控制
 * 6. 调试辅助和可视化
 */
export class SpotLight3D extends Light3D {
  // ========================================================================
  // 私有属性 - 聚光灯特有
  // ========================================================================

  /** 聚光灯配置 */
  private _spotConfig: SpotLightConfig

  /** Three.js聚光灯对象 */
  private _spotLight: THREE.SpotLight | null = null

  /** 光照目标对象 */
  private _target: THREE.Object3D | null = null

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param config 聚光灯配置
   */
  constructor(name: string = 'SpotLight3D', config: SpotLightConfig = {}) {
    super(name, LightType.SPOT, config)

    this._spotConfig = {
      range: 10,
      decay: 2,
      angle: Math.PI / 3, // 60度
      penumbra: 0.1,
      target: { x: 0, y: 0, z: -1 },
      physicallyCorrectLights: true,
      ...config
    }

    // SpotLight3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取光照范围
   * @returns 光照范围
   */
  get range(): number {
    return this._spotConfig.range || 10
  }

  /**
   * 设置光照范围
   * @param value 光照范围
   */
  set range(value: number) {
    this._spotConfig.range = Math.max(0.1, value)
    this._updateSpotLight()
  }

  /**
   * 获取距离衰减系数
   * @returns 距离衰减系数
   */
  get decay(): number {
    return this._spotConfig.decay || 2
  }

  /**
   * 设置距离衰减系数
   * @param value 距离衰减系数
   */
  set decay(value: number) {
    this._spotConfig.decay = Math.max(0, value)
    this._updateSpotLight()
  }

  /**
   * 获取光锥角度（弧度）
   * @returns 光锥角度
   */
  get angle(): number {
    return this._spotConfig.angle || Math.PI / 3
  }

  /**
   * 设置光锥角度（弧度）
   * @param value 光锥角度
   */
  set angle(value: number) {
    this._spotConfig.angle = Math.max(0, Math.min(Math.PI / 2, value))
    this._updateSpotLight()
  }

  /**
   * 获取光锥角度（度）
   * @returns 光锥角度（度）
   */
  get angleDegrees(): number {
    return (this.angle * 180) / Math.PI
  }

  /**
   * 设置光锥角度（度）
   * @param value 光锥角度（度）
   */
  set angleDegrees(value: number) {
    this.angle = (value * Math.PI) / 180
  }

  /**
   * 获取光锥边缘衰减
   * @returns 光锥边缘衰减
   */
  get penumbra(): number {
    return this._spotConfig.penumbra || 0.1
  }

  /**
   * 设置光锥边缘衰减
   * @param value 光锥边缘衰减
   */
  set penumbra(value: number) {
    this._spotConfig.penumbra = Math.max(0, Math.min(1, value))
    this._updateSpotLight()
  }

  /**
   * 获取目标位置
   * @returns 目标位置
   */
  get target(): Vector3 {
    return this._spotConfig.target || { x: 0, y: 0, z: -1 }
  }

  /**
   * 设置目标位置
   * @param value 目标位置
   */
  set target(value: Vector3) {
    this._spotConfig.target = { ...value }
    this._updateTarget()
  }

  /**
   * 获取是否使用物理正确的光照
   * @returns 是否使用物理正确的光照
   */
  get physicallyCorrectLights(): boolean {
    return this._spotConfig.physicallyCorrectLights || false
  }

  /**
   * 设置是否使用物理正确的光照
   * @param value 是否使用物理正确的光照
   */
  set physicallyCorrectLights(value: boolean) {
    this._spotConfig.physicallyCorrectLights = value
    this._updateSpotLight()
  }

  /**
   * 获取Three.js聚光灯对象
   * @returns Three.js聚光灯对象
   */
  get spotLight(): THREE.SpotLight | null {
    return this._spotLight
  }

  // ========================================================================
  // 抽象方法实现
  // ========================================================================

  /**
   * 创建Three.js光照对象
   * @returns Three.js聚光灯对象
   */
  protected _createThreeLight(): THREE.Light {
    this._spotLight = new THREE.SpotLight(
      this.color,
      this.intensity,
      this.range,
      this.angle,
      this.penumbra,
      this.decay
    )

    // 创建目标对象
    this._target = new THREE.Object3D()
    this._target.position.set(
      this.target.x,
      this.target.y,
      this.target.z
    )

    // 设置光照目标
    this._spotLight.target = this._target

    return this._spotLight
  }

  /**
   * 更新光照特定属性
   */
  protected _updateLightSpecificProperties(): void {
    this._updateSpotLight()
    this._updateTarget()
  }

  /**
   * 创建调试辅助对象
   * @returns 调试辅助对象
   */
  protected _createDebugHelper(): THREE.Object3D | null {
    if (!this._spotLight) return null

    // 创建聚光灯辅助器
    const helper = new THREE.SpotLightHelper(this._spotLight, 0xffff00)

    // 如果有阴影，添加阴影相机辅助器
    if (this.castShadow && this._spotLight.shadow) {
      const shadowHelper = new THREE.CameraHelper(this._spotLight.shadow.camera)
      helper.add(shadowHelper)
    }

    return helper
  }

  // ========================================================================
  // 聚光灯特有方法
  // ========================================================================

  /**
   * 更新聚光灯属性
   */
  private _updateSpotLight(): void {
    if (!this._spotLight) return

    // 更新距离、角度、边缘衰减和衰减
    this._spotLight.distance = this.range
    this._spotLight.angle = this.angle
    this._spotLight.penumbra = this.penumbra
    this._spotLight.decay = this.decay

    // 更新阴影相机
    this._updateShadowCamera()
  }

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
    if (!this._spotLight || !this._spotLight.shadow) return

    const camera = this._spotLight.shadow.camera as THREE.PerspectiveCamera

    // 设置透视相机参数
    camera.near = this.getConfig().shadowCameraNear || 0.1
    camera.far = this.range
    camera.fov = (this.angle * 180) / Math.PI * 2 // 转换为度并设置FOV

    camera.updateProjectionMatrix()
  }

  /**
   * 设置光锥参数
   * @param angle 光锥角度（弧度）
   * @param penumbra 边缘衰减
   */
  setConeParameters(angle: number, penumbra: number): void {
    this._spotConfig.angle = Math.max(0, Math.min(Math.PI / 2, angle))
    this._spotConfig.penumbra = Math.max(0, Math.min(1, penumbra))
    this._updateSpotLight()
  }

  /**
   * 设置光锥参数（度）
   * @param angleDegrees 光锥角度（度）
   * @param penumbra 边缘衰减
   */
  setConeParametersDegrees(angleDegrees: number, penumbra: number): void {
    const angleRadians = (angleDegrees * Math.PI) / 180
    this.setConeParameters(angleRadians, penumbra)
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
   * 克隆聚光灯节点
   * @param name 新节点名称
   * @returns 克隆的聚光灯节点
   */
  clone(name?: string): SpotLight3D {
    const cloned = new SpotLight3D(
      name || `${this.name}_clone`,
      {
        ...this.getConfig(),
        ...this._spotConfig
      }
    )

    // 复制变换
    cloned.position = { x: this.position.x, y: this.position.y, z: this.position.z }
    cloned.rotation = { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z }
    cloned.scale = { x: this.scale.x, y: this.scale.y, z: this.scale.z }

    return cloned
  }

  /**
   * 获取聚光灯统计信息
   * @returns 统计信息
   */
  getSpotStats(): {
    range: number
    decay: number
    angle: number
    angleDegrees: number
    penumbra: number
    target: Vector3
    direction: Vector3
    physicallyCorrectLights: boolean
  } {
    return {
      range: this.range,
      decay: this.decay,
      angle: this.angle,
      angleDegrees: this.angleDegrees,
      penumbra: this.penumbra,
      target: this.target,
      direction: this.getDirectionVector(),
      physicallyCorrectLights: this.physicallyCorrectLights
    }
  }
}

// ============================================================================
// 导出
// ============================================================================

export default SpotLight3D
