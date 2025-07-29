/**
 * QAQ游戏引擎 - Light3D 光照节点基类
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 所有光照节点的基类，提供统一的光照属性和接口
 * - 继承自Node3D，具有完整的3D变换功能
 * - 与Three.js光照系统深度集成
 * - 支持光照颜色、强度、阴影等基础属性
 * - 提供光照调试和可视化功能
 * - 统一的光照生命周期管理
 *
 * 架构设计:
 * - 基于Godot的Light3D设计理念
 * - 与Three.js Light系统的无缝集成
 * - 支持动态光照参数调整
 * - 完整的光照属性管理
 *
 * 核心功能:
 * - 光照属性的统一管理
 * - Three.js光照对象的创建和同步
 * - 光照调试和可视化
 * - 阴影系统的基础支持
 * - 光照性能优化
 */

import Node3D from '../Node3D'
import * as THREE from 'three'
import type { Vector3 } from '../../../types/core'

// ============================================================================
// Light3D相关接口和枚举
// ============================================================================

/**
 * 光照类型枚举
 */
export enum LightType {
  /** 方向光 */
  DIRECTIONAL = 'directional',
  /** 点光源 */
  POINT = 'point',
  /** 聚光灯 */
  SPOT = 'spot',
  /** 环境光 */
  AMBIENT = 'ambient',
  /** 半球光 */
  HEMISPHERE = 'hemisphere'
}

/**
 * 阴影类型枚举
 */
export enum ShadowType {
  /** 无阴影 */
  NONE = 'none',
  /** 基础阴影映射 */
  BASIC = 'basic',
  /** PCF阴影 */
  PCF = 'pcf',
  /** PCF软阴影 */
  PCF_SOFT = 'pcf_soft',
  /** VSM阴影 */
  VSM = 'vsm'
}

/**
 * 光照配置接口
 */
export interface LightConfig {
  /** 光照颜色 */
  color?: number | string
  /** 光照强度 */
  intensity?: number
  /** 是否启用 */
  enabled?: boolean
  /** 是否投射阴影 */
  castShadow?: boolean
  /** 阴影类型 */
  shadowType?: ShadowType
  /** 阴影映射分辨率 */
  shadowMapSize?: number
  /** 阴影相机近平面 */
  shadowCameraNear?: number
  /** 阴影相机远平面 */
  shadowCameraFar?: number
  /** 阴影偏移 */
  shadowBias?: number
  /** 阴影法线偏移 */
  shadowNormalBias?: number
  /** 是否显示调试辅助 */
  debugVisible?: boolean
}

/**
 * 光照统计信息接口
 */
export interface LightStats {
  /** 光照类型 */
  lightType: LightType
  /** 是否启用 */
  enabled: boolean
  /** 光照颜色 */
  color: number
  /** 光照强度 */
  intensity: number
  /** 是否投射阴影 */
  castShadow: boolean
  /** 阴影类型 */
  shadowType: ShadowType
  /** 是否有Three.js光照对象 */
  hasThreeLight: boolean
  /** 是否显示调试 */
  debugVisible: boolean
}

// ============================================================================
// Light3D 基类实现
// ============================================================================

/**
 * Light3D 类 - 光照节点基类
 *
 * 主要功能:
 * 1. 光照属性的统一管理
 * 2. Three.js光照对象的创建和同步
 * 3. 光照调试和可视化
 * 4. 阴影系统的基础支持
 * 5. 光照性能优化
 */
export abstract class Light3D extends Node3D {
  // ========================================================================
  // 私有属性 - 光照管理
  // ========================================================================

  /** 光照类型 */
  protected _lightType: LightType

  /** 光照配置 */
  protected _config: LightConfig

  /** Three.js光照对象 */
  protected _threeLight: THREE.Light | null = null

  /** 调试辅助对象 */
  protected _debugHelper: THREE.Object3D | null = null

  /** 是否已初始化 */
  protected _initialized: boolean = false

  /** 光照是否需要更新 */
  protected _needsUpdate: boolean = true

  // ========================================================================
  // 构造函数和初始化
  // ========================================================================

  /**
   * 构造函数
   * @param name 节点名称
   * @param lightType 光照类型
   * @param config 光照配置
   */
  constructor(name: string, lightType: LightType, config: LightConfig = {}) {
    super(name)

    this._lightType = lightType
    this._config = {
      color: 0xffffff,
      intensity: 1.0,
      enabled: true,
      castShadow: false,
      shadowType: ShadowType.BASIC,
      shadowMapSize: 1024,
      shadowCameraNear: 0.1,
      shadowCameraFar: 100,
      shadowBias: -0.0001,
      shadowNormalBias: 0.02,
      debugVisible: false,
      ...config
    }

    // Light3D节点初始化完成
  }

  // ========================================================================
  // 公共属性访问器
  // ========================================================================

  /**
   * 获取光照类型
   * @returns 光照类型
   */
  get lightType(): LightType {
    return this._lightType
  }

  /**
   * 获取光照颜色
   * @returns 光照颜色
   */
  get color(): number {
    return this._config.color as number
  }

  /**
   * 设置光照颜色
   * @param value 光照颜色
   */
  set color(value: number | string) {
    this._config.color = typeof value === 'string' ? parseInt(value.replace('#', ''), 16) : value
    this._needsUpdate = true
    this._updateThreeLight()
  }

  /**
   * 获取光照强度
   * @returns 光照强度
   */
  get intensity(): number {
    return this._config.intensity || 1.0
  }

  /**
   * 设置光照强度
   * @param value 光照强度
   */
  set intensity(value: number) {
    this._config.intensity = Math.max(0, value)
    this._needsUpdate = true
    this._updateThreeLight()
  }

  /**
   * 获取是否启用
   * @returns 是否启用
   */
  get enabled(): boolean {
    return this._config.enabled || false
  }

  /**
   * 设置是否启用
   * @param value 是否启用
   */
  set enabled(value: boolean) {
    this._config.enabled = value
    this._needsUpdate = true
    this._updateLightEnabled()
  }

  /**
   * 获取是否投射阴影
   * @returns 是否投射阴影
   */
  get castShadow(): boolean {
    return this._config.castShadow || false
  }

  /**
   * 设置是否投射阴影
   * @param value 是否投射阴影
   */
  set castShadow(value: boolean) {
    this._config.castShadow = value
    this._needsUpdate = true
    this._updateShadowSettings()
  }

  /**
   * 获取阴影类型
   * @returns 阴影类型
   */
  get shadowType(): ShadowType {
    return this._config.shadowType || ShadowType.BASIC
  }

  /**
   * 设置阴影类型
   * @param value 阴影类型
   */
  set shadowType(value: ShadowType) {
    this._config.shadowType = value
    this._needsUpdate = true
    this._updateShadowSettings()
  }

  /**
   * 获取是否显示调试
   * @returns 是否显示调试
   */
  get debugVisible(): boolean {
    return this._config.debugVisible || false
  }

  /**
   * 设置是否显示调试
   * @param value 是否显示调试
   */
  set debugVisible(value: boolean) {
    this._config.debugVisible = value
    this._updateDebugHelper()
  }

  /**
   * 获取Three.js光照对象
   * @returns Three.js光照对象
   */
  get threeLight(): THREE.Light | null {
    return this._threeLight
  }

  // ========================================================================
  // 生命周期方法
  // ========================================================================

  /**
   * 节点进入场景树时调用
   */
  _ready(): void {
    super._ready()
    this._initializeLight()
  }

  /**
   * 每帧更新时调用
   * @param deltaTime 时间增量
   */
  _process(deltaTime: number): void {
    super._process(deltaTime)

    if (this._initialized && this._needsUpdate) {
      this._updateLightTransform()
      this._needsUpdate = false
    }
  }

  /**
   * 节点退出场景树时调用
   */
  _exitTree(): void {
    this._cleanupLight()
    super._exitTree()
  }

  // ========================================================================
  // 抽象方法 - 子类必须实现
  // ========================================================================

  /**
   * 创建Three.js光照对象（抽象方法）
   * @returns Three.js光照对象
   */
  protected abstract _createThreeLight(): THREE.Light

  /**
   * 更新光照特定属性（抽象方法）
   */
  protected abstract _updateLightSpecificProperties(): void

  /**
   * 创建调试辅助对象（抽象方法）
   * @returns 调试辅助对象
   */
  protected abstract _createDebugHelper(): THREE.Object3D | null

  // ========================================================================
  // 光照管理方法
  // ========================================================================

  /**
   * 初始化光照
   */
  private _initializeLight(): void {
    if (this._initialized) {
      return
    }

    try {
      // 创建Three.js光照对象
      this._threeLight = this._createThreeLight()

      if (!this._threeLight) {
        throw new Error('Failed to create Three.js light object')
      }

      // 设置基础属性
      this._applyBasicProperties()

      // 设置阴影属性
      this._updateShadowSettings()

      // 添加到Three.js场景图
      if (this.object3D) {
        this.object3D.add(this._threeLight)
      }

      // 创建调试辅助
      if (this._config.debugVisible) {
        this._updateDebugHelper()
      }

      this._initialized = true
      console.log(`Light3D initialized: ${this.name} (${this._lightType})`)

    } catch (error) {
      console.error(`Failed to initialize Light3D: ${this.name}`, error)
    }
  }

  /**
   * 应用基础光照属性
   */
  private _applyBasicProperties(): void {
    if (!this._threeLight) return

    // 设置颜色和强度
    this._threeLight.color.setHex(this.color)
    this._threeLight.intensity = this.intensity

    // 设置可见性
    this._threeLight.visible = this.enabled

    // 调用子类特定属性更新
    this._updateLightSpecificProperties()
  }

  /**
   * 更新Three.js光照对象
   */
  private _updateThreeLight(): void {
    if (!this._initialized || !this._threeLight) return

    this._applyBasicProperties()
  }

  /**
   * 更新光照启用状态
   */
  private _updateLightEnabled(): void {
    if (!this._threeLight) return

    this._threeLight.visible = this.enabled

    // 如果禁用光照，也禁用阴影
    if (!this.enabled) {
      this._threeLight.castShadow = false
    } else {
      this._threeLight.castShadow = this.castShadow
    }
  }

  /**
   * 更新阴影设置
   */
  private _updateShadowSettings(): void {
    if (!this._threeLight) return

    // 设置是否投射阴影
    this._threeLight.castShadow = this.enabled && this.castShadow

    if (this._threeLight.castShadow && this._threeLight.shadow) {
      const shadow = this._threeLight.shadow

      // 设置阴影映射分辨率
      const mapSize = this._config.shadowMapSize || 1024
      shadow.mapSize.width = mapSize
      shadow.mapSize.height = mapSize

      // 设置阴影相机参数
      if (shadow.camera) {
        const camera = shadow.camera as any
        camera.near = this._config.shadowCameraNear || 0.1
        camera.far = this._config.shadowCameraFar || 100
        if (camera.updateProjectionMatrix) {
          camera.updateProjectionMatrix()
        }
      }

      // 设置阴影偏移
      shadow.bias = this._config.shadowBias || -0.0001;
      shadow.normalBias = this._config.shadowNormalBias || 0.02;

      // 根据阴影类型设置阴影映射类型（注意：这个设置通常在渲染器级别）
      // 这里我们记录阴影类型，实际的阴影映射类型需要在渲染器中设置
      (shadow as any).shadowType = this.shadowType;
    }
  }

  /**
   * 更新光照变换
   */
  private _updateLightTransform(): void {
    if (!this._threeLight || !this.object3D) return

    // 同步位置和旋转
    this._threeLight.position.copy(this.object3D.position)
    this._threeLight.rotation.copy(this.object3D.rotation)

    // 更新调试辅助
    if (this._debugHelper) {
      this._debugHelper.position.copy(this.object3D.position)
      this._debugHelper.rotation.copy(this.object3D.rotation)
    }
  }

  /**
   * 更新调试辅助
   */
  private _updateDebugHelper(): void {
    // 移除现有的调试辅助
    if (this._debugHelper && this.object3D) {
      this.object3D.remove(this._debugHelper)
      this._debugHelper = null
    }

    // 创建新的调试辅助
    if (this._config.debugVisible && this._initialized) {
      this._debugHelper = this._createDebugHelper()
      if (this._debugHelper && this.object3D) {
        this.object3D.add(this._debugHelper)
      }
    }
  }

  /**
   * 清理光照
   */
  private _cleanupLight(): void {
    if (this._initialized) {
      // 移除调试辅助
      if (this._debugHelper && this.object3D) {
        this.object3D.remove(this._debugHelper)
        this._debugHelper = null
      }

      // 移除Three.js光照对象
      if (this._threeLight && this.object3D) {
        this.object3D.remove(this._threeLight)

        // 清理阴影映射
        if (this._threeLight.shadow && this._threeLight.shadow.map) {
          this._threeLight.shadow.map.dispose()
        }

        this._threeLight = null
      }

      this._initialized = false
      console.log(`Light3D cleaned up: ${this.name}`)
    }
  }

  // ========================================================================
  // 公共方法 - 光照控制
  // ========================================================================

  /**
   * 设置光照颜色（RGB）
   * @param r 红色分量 (0-255)
   * @param g 绿色分量 (0-255)
   * @param b 蓝色分量 (0-255)
   */
  setColorRGB(r: number, g: number, b: number): void {
    const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b)
    this.color = color
  }

  /**
   * 设置光照颜色（HSL）
   * @param h 色相 (0-360)
   * @param s 饱和度 (0-100)
   * @param l 亮度 (0-100)
   */
  setColorHSL(h: number, s: number, l: number): void {
    const color = new THREE.Color()
    color.setHSL(h / 360, s / 100, l / 100)
    this.color = color.getHex()
  }

  /**
   * 设置光照颜色（十六进制）
   * @param color 十六进制颜色值
   */
  setColor(color: number): void {
    this.color = color
    console.log(`💡 光照颜色设置为: #${color.toString(16).padStart(6, '0')}`)
  }

  /**
   * 设置光照强度
   * @param intensity 光照强度
   */
  setIntensity(intensity: number): void {
    this.intensity = intensity
    console.log(`💡 光照强度设置为: ${intensity}`)
  }

  /**
   * 启用阴影
   * @param enabled 是否启用阴影
   */
  enableShadows(enabled: boolean = true): void {
    this.castShadow = enabled
    console.log(`💡 光照阴影${enabled ? '启用' : '禁用'}`)
  }

  /**
   * 获取光照颜色的RGB值
   * @returns RGB颜色对象
   */
  getColorRGB(): { r: number; g: number; b: number } {
    const color = new THREE.Color(this.color)
    return {
      r: Math.floor(color.r * 255),
      g: Math.floor(color.g * 255),
      b: Math.floor(color.b * 255)
    }
  }

  /**
   * 获取光照颜色的HSL值
   * @returns HSL颜色对象
   */
  getColorHSL(): { h: number; s: number; l: number } {
    const color = new THREE.Color(this.color)
    const hsl = { h: 0, s: 0, l: 0 }
    color.getHSL(hsl)
    return {
      h: Math.floor(hsl.h * 360),
      s: Math.floor(hsl.s * 100),
      l: Math.floor(hsl.l * 100)
    }
  }

  /**
   * 设置阴影映射分辨率
   * @param size 分辨率大小
   */
  setShadowMapSize(size: number): void {
    this._config.shadowMapSize = Math.max(64, Math.min(4096, size))
    this._updateShadowSettings()
  }

  /**
   * 设置阴影相机范围
   * @param near 近平面
   * @param far 远平面
   */
  setShadowCameraRange(near: number, far: number): void {
    this._config.shadowCameraNear = Math.max(0.001, near)
    this._config.shadowCameraFar = Math.max(near + 0.1, far)
    this._updateShadowSettings()
  }

  /**
   * 设置阴影偏移
   * @param bias 阴影偏移
   * @param normalBias 法线偏移
   */
  setShadowBias(bias: number, normalBias: number): void {
    this._config.shadowBias = bias
    this._config.shadowNormalBias = normalBias
    this._updateShadowSettings()
  }

  /**
   * 获取光照统计信息
   * @returns 光照统计信息
   */
  getStats(): LightStats {
    return {
      lightType: this._lightType,
      enabled: this.enabled,
      color: this.color,
      intensity: this.intensity,
      castShadow: this.castShadow,
      shadowType: this.shadowType,
      hasThreeLight: this._threeLight !== null,
      debugVisible: this.debugVisible
    }
  }

  /**
   * 克隆光照节点
   * @param name 新节点名称
   * @returns 克隆的光照节点
   */
  abstract clone(name?: string): Light3D

  /**
   * 销毁光照节点
   */
  destroy(): void {
    this._cleanupLight()
    super.destroy()
  }

  // ========================================================================
  // 受保护方法 - 供子类使用
  // ========================================================================

  /**
   * 标记需要更新
   */
  protected markNeedsUpdate(): void {
    this._needsUpdate = true
  }

  /**
   * 获取光照配置
   * @returns 光照配置
   */
  protected getConfig(): LightConfig {
    return { ...this._config }
  }

  /**
   * 更新光照配置
   * @param config 新配置
   */
  protected updateConfig(config: Partial<LightConfig>): void {
    this._config = { ...this._config, ...config }
    this._needsUpdate = true
    this._updateThreeLight()
  }
}

// ============================================================================
// 导出
// ============================================================================

export default Light3D
